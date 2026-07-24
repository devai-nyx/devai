import { join } from 'node:path';
import type { CAC } from 'cac';
import { loadDomains, validateInvariants, validateTrace } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_DOMAINS_PATH,
  DEFAULT_INVARIANTS_DIR,
  DEFAULT_REPO_ROOT,
  DEFAULT_TRACE_PATH,
  renderHuman,
  renderJson,
  type CommonSpecOptions,
} from './shared.js';

interface Options extends CommonSpecOptions {
  readonly trace?: string;
  readonly invariantsDir?: string;
  readonly domains?: string;
}

export const specValidateTrace = defineCommand({
  name: 'spec validate-trace',
  description: 'Validate trace.json (schema, invariant references, well-formed test paths)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'spec-validate-trace',
        'Validate trace.json (schema, invariant references, well-formed test paths)',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--trace <path>', `Trace file (default: ${DEFAULT_TRACE_PATH})`)
      .option(
        '--invariants-dir <path>',
        `Invariants directory for xref (default: ${DEFAULT_INVARIANTS_DIR})`,
      )
      .option('--domains <path>', `Domains taxonomy (default: ${DEFAULT_DOMAINS_PATH})`)
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const tracePath = options.trace ?? join(repoRoot, DEFAULT_TRACE_PATH);
          const invariantsDir = options.invariantsDir ?? join(repoRoot, DEFAULT_INVARIANTS_DIR);
          const domainsPath = options.domains ?? join(repoRoot, DEFAULT_DOMAINS_PATH);
          const domains = loadDomains(domainsPath);
          const invariants = validateInvariants({ invariantsDir, domains, repoRoot });
          const invariantIds = new Set(invariants.invariants.map((i) => i.id));
          const result = validateTrace({ tracePath, invariantIds });
          process.stdout.write(
            options.human
              ? renderHuman('spec validate-trace', result)
              : renderJson({
                  ok: result.ok,
                  errors: result.errors,
                  files_scanned: result.files_scanned,
                  trace_invariants_count: result.trace_invariants_count,
                }),
          );
          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai spec validate trace: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
