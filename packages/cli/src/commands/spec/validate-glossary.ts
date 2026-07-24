import { join } from 'node:path';
import type { CAC } from 'cac';
import { loadDomains, validateGlossary, validateInvariants } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_DOMAINS_PATH,
  DEFAULT_GLOSSARY_DIR,
  DEFAULT_INVARIANTS_DIR,
  DEFAULT_REPO_ROOT,
  renderHuman,
  renderJson,
  type CommonSpecOptions,
} from './shared.js';

interface Options extends CommonSpecOptions {
  readonly dir?: string;
  readonly invariantsDir?: string;
  readonly domains?: string;
}

export const specValidateGlossary = defineCommand({
  name: 'spec validate-glossary',
  description: 'Validate glossary entries (schema, duplicate terms, invariant references)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'spec-validate-glossary',
        'Validate glossary entries (schema, duplicate terms, invariant references)',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--dir <path>', `Glossary directory (default: ${DEFAULT_GLOSSARY_DIR})`)
      .option(
        '--invariants-dir <path>',
        `Invariants directory for xref (default: ${DEFAULT_INVARIANTS_DIR})`,
      )
      .option('--domains <path>', `Domains taxonomy (default: ${DEFAULT_DOMAINS_PATH})`)
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const dir = options.dir ?? join(repoRoot, DEFAULT_GLOSSARY_DIR);
          const invariantsDir = options.invariantsDir ?? join(repoRoot, DEFAULT_INVARIANTS_DIR);
          const domainsPath = options.domains ?? join(repoRoot, DEFAULT_DOMAINS_PATH);
          const domains = loadDomains(domainsPath);
          const invariants = validateInvariants({ invariantsDir, domains, repoRoot });
          const invariantIds = new Set(invariants.invariants.map((i) => i.id));
          const result = validateGlossary({ glossaryDir: dir, invariantIds });
          process.stdout.write(
            options.human
              ? renderHuman('spec validate-glossary', result)
              : renderJson({
                  ok: result.ok,
                  errors: result.errors,
                  files_scanned: result.files_scanned,
                  entries_count: result.entries.length,
                }),
          );
          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai spec validate glossary: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
