import { join } from 'node:path';
import type { CAC } from 'cac';
import { loadDomains, resolveSensorParams, validateInvariants } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_DOMAINS_PATH,
  DEFAULT_INVARIANTS_DIR,
  DEFAULT_REPO_ROOT,
  renderHuman,
  renderJson,
  type CommonSpecOptions,
} from './shared.js';

interface Options extends CommonSpecOptions {
  readonly dir?: string;
  readonly domains?: string;
  readonly strictCnl?: boolean;
  readonly invariantCompanionPattern?: string | string[];
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
}

export const specValidateInvariants = defineCommand({
  name: 'spec validate-invariants',
  description: 'Validate invariant files (schema, ID uniqueness, domains, anchors)',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'spec-validate-invariants',
        'Validate invariant files (schema, ID uniqueness, domains, anchors)',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--dir <path>', `Invariants directory (default: ${DEFAULT_INVARIANTS_DIR})`)
      .option('--domains <path>', `Domains taxonomy (default: ${DEFAULT_DOMAINS_PATH})`)
      .option(
        '--strict-cnl',
        'Flag statements lacking a CNL modal verb (MUST/SHOULD/MAY); see docs/theory/architecture/invariant-authoring.md',
      )
      .option(
        '--invariant-companion-pattern <glob>',
        "Basename glob to exclude (repeatable; supports a single '*' wildcard). Phase 23.E / D-A-22. Default: '*-allowlist.json', '*-data.json' (or the matched pack's extractor_params.spec_validate.invariant_companion_patterns when --pack-tune is set).",
      )
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack (Phase 19.B)')
      .option('--pack-id <id>', 'Pin a specific pack id')
      .option('--packs-root <path>', 'Override packs root (default: walk up from --repo-root)')
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const dir = options.dir ?? join(repoRoot, DEFAULT_INVARIANTS_DIR);
          const domainsPath = options.domains ?? join(repoRoot, DEFAULT_DOMAINS_PATH);
          const domains = loadDomains(domainsPath);

          // Phase 23.E: companion-pattern precedence is CLI flag(s) >
          // pack-config (when --pack-tune or --pack-id set) > built-in
          // defaults. The empty-array case must propagate so callers
          // can disable filtering entirely.
          let companionPatterns: readonly string[] | undefined;
          const cliPatterns = options.invariantCompanionPattern;
          if (cliPatterns !== undefined) {
            companionPatterns = Array.isArray(cliPatterns) ? cliPatterns : [cliPatterns];
          } else if (options.packTune === true || options.packId !== undefined) {
            const resolved = resolveSensorParams({
              adopterRoot: repoRoot,
              sensorKind: 'spec_validate',
              ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
              ...(options.packId !== undefined && { explicitId: options.packId }),
            });
            const fromPack = resolved?.params['invariant_companion_patterns'];
            if (Array.isArray(fromPack)) {
              companionPatterns = fromPack.filter((p): p is string => typeof p === 'string');
            }
          }

          const result = validateInvariants({
            invariantsDir: dir,
            domains,
            repoRoot,
            ...(options.strictCnl === true ? { strictCnl: true } : {}),
            ...(companionPatterns !== undefined && { companionPatterns }),
          });
          if (options.human === true) {
            const summary = renderHuman('spec validate-invariants', result);
            const skipped = result.files_skipped ?? 0;
            const skippedLine =
              skipped > 0
                ? `  skipped ${String(skipped)} companion file(s): ${(result.skipped_files ?? [])
                    .map((f) => f.split('/').slice(-1).join(''))
                    .join(', ')}\n`
                : '';
            process.stdout.write(summary + skippedLine);
          } else {
            process.stdout.write(
              renderJson({
                ok: result.ok,
                errors: result.errors,
                files_scanned: result.files_scanned,
                files_skipped: result.files_skipped ?? 0,
                ...(result.skipped_files !== undefined &&
                  result.skipped_files.length > 0 && { skipped_files: result.skipped_files }),
                invariants_count: result.invariants.length,
              }),
            );
          }
          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai spec validate invariants: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
