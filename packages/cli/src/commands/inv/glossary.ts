import { isAbsolute, resolve } from 'node:path';
import type { CAC } from 'cac';
import { glossaryCoverage } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

interface Options extends CommonInvOptions {
  readonly searchDir?: string | string[];
}

function toArray<T>(v: T | readonly T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? [...v] : [v as T];
}

export const invGlossary = defineCommand({
  name: 'inv glossary',
  description: 'Compute usage coverage for each glossary term against the source tree',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-glossary', 'Glossary term coverage (case-insensitive occurrence count)')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .option(
        '--search-dir <path>',
        'Directory to search for term occurrences (repeatable; overrides the default packages/)',
      )
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const searchDirs = toArray(options.searchDir).map((d) =>
            isAbsolute(d) ? d : resolve(repoRoot, d),
          );
          const result = glossaryCoverage({
            repoRoot,
            ignoreDirs,
            ...(searchDirs.length > 0 && { searchDirs }),
          });
          emit(
            result,
            options.human === true,
            `inv glossary: ${String(result.entries_count)} term(s)\n${result.terms
              .map((t) => `  ${t.id}  '${t.term}'  used in ${String(t.used_count)} file(s)`)
              .join('\n')}`,
          );
          // process.exit() would race pending pipe writes: the glossary
          // payload exceeds the 64KB pipe buffer, so an explicit exit
          // truncates stdout for spawned consumers. Let the process
          // drain and exit naturally.
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory glossary: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
