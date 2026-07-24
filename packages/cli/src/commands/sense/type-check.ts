import type { CAC } from 'cac';
import { senseTypeCheck, type TypecheckStrategy } from '@devai-nyx/sensors';
import { EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, emit, exitFor, maybeResolvePackParams } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly project?: string;
  readonly human?: boolean;
  readonly typecheckStrategy?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly emitReading?: boolean;
}

/**
 * `devai sense type check` — wraps `tsc --noEmit` and emits one or
 * more SensorReadings. Phase 23.D (closes D-A-21) adds a per-package
 * strategy: when `--typecheck-strategy per-package` (or the matched
 * pack's `extractor_params.inventory_type_check.typecheck_strategy`
 * is `"per-package"`), the sensor globs canonical workspace dirs
 * (`packages`, `apps`, `reference`, `domain`, `tools`) for
 * `<pkg>/tsconfig.json` files, runs `tsc --noEmit -p <each>`, emits
 * one SR per project, and persists all of them plus an aggregate.
 * Pre-23.D root-mode behaviour is preserved as the default.
 */
export const senseTypeCheckCmd = defineCommand({
  name: 'sense type-check',
  description: 'Wrap tsc --noEmit; emit a SensorReading with per-error findings',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-type-check', 'Wrap tsc --noEmit + emit SensorReading')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--project <path>', 'tsconfig path (optional; forces --typecheck-strategy=root)')
      .option(
        '--typecheck-strategy <strategy>',
        "'root' | 'per-package' (default: root; per-package globs canonical workspace dirs for per-package tsconfig.json). Phase 23.D / D-A-21.",
      )
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack (Phase 19.B)')
      .option('--pack-id <id>', 'Pin a specific pack id')
      .option('--packs-root <path>', 'Override packs root (default: walk up from --repo-root)')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading(s) under .devai/state/sensor-readings/ (default: persist on). Phase 23.D.',
      )
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const packParams = maybeResolvePackParams('inventory_type_check', repoRoot, {
          ...(options.packTune !== undefined && { packTune: options.packTune }),
          ...(options.packId !== undefined && { packId: options.packId }),
          ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
        });
        const packStrategy =
          typeof packParams.typecheck_strategy === 'string'
            ? packParams.typecheck_strategy
            : undefined;
        const strategyRaw = options.typecheckStrategy ?? packStrategy ?? 'root';
        if (strategyRaw !== 'root' && strategyRaw !== 'per-package') {
          process.stderr.write(
            `devai sense type check: invalid --typecheck-strategy '${strategyRaw}' (expected 'root' | 'per-package')\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const strategy: TypecheckStrategy = strategyRaw;
        const result = senseTypeCheck({
          cwd: repoRoot,
          strategy,
          ...(options.project !== undefined && { project: options.project }),
        });
        emit(result.aggregate, options.human === true);
        process.exit(exitFor(result.aggregate.status));
      });
  },
});
