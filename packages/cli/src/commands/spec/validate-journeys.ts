import { join } from 'node:path';
import type { CAC } from 'cac';
import { loadDomains, validateInvariants, validateJourneys } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_DOMAINS_PATH,
  DEFAULT_INVARIANTS_DIR,
  DEFAULT_JOURNEYS_DIR,
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

export const specValidateJourneys = defineCommand({
  name: 'spec validate-journeys',
  description: 'Validate journey files (schema, ID uniqueness, invariant references)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'spec-validate-journeys',
        'Validate journey files (schema, ID uniqueness, invariant references)',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--dir <path>', `Journeys directory (default: ${DEFAULT_JOURNEYS_DIR})`)
      .option(
        '--invariants-dir <path>',
        `Invariants directory for xref (default: ${DEFAULT_INVARIANTS_DIR})`,
      )
      .option('--domains <path>', `Domains taxonomy (default: ${DEFAULT_DOMAINS_PATH})`)
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const dir = options.dir ?? join(repoRoot, DEFAULT_JOURNEYS_DIR);
          const invariantsDir = options.invariantsDir ?? join(repoRoot, DEFAULT_INVARIANTS_DIR);
          const domainsPath = options.domains ?? join(repoRoot, DEFAULT_DOMAINS_PATH);
          const domains = loadDomains(domainsPath);
          const invariants = validateInvariants({ invariantsDir, domains, repoRoot });
          const invariantIds = new Set(invariants.invariants.map((i) => i.id));
          const result = validateJourneys({ journeysDir: dir, invariantIds });
          process.stdout.write(
            options.human
              ? renderHuman('spec validate-journeys', result)
              : renderJson({
                  ok: result.ok,
                  errors: result.errors,
                  files_scanned: result.files_scanned,
                  journeys_count: result.journeys.length,
                }),
          );
          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai spec validate journeys: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
