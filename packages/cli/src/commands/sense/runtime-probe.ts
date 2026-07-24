import type { CAC } from 'cac';
import { executeRuntimeProbe, loadCharter, type RuntimeProbeCharter } from '@devai-nyx/sensors';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, emit, exitFor } from './shared.js';

interface BaseOptions {
  readonly repoRoot?: string;
  readonly charter?: string;
  readonly dryRun?: boolean;
  readonly human?: boolean;
}

function makeRegister(kind: 'api' | 'auth' | 'data'): (cli: CAC) => void {
  return (cli) => {
    cli
      .command(
        `sense-runtime-${kind}`,
        `Execute a kind=${kind} runtime-probe charter and emit a SensorReading`,
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--charter <path>', 'Path to a runtime-charter.schema.json file (required)')
      .option('--dry-run', 'Skip network/db; produce a skipped-arbiter summary for plan review')
      .option('--human', 'Human-readable summary')
      .action(async (options: BaseOptions) => {
        if (options.charter === undefined) {
          process.stderr.write(`devai sense runtime-${kind}: --charter is required\n`);
          process.exit(EXIT_USAGE);
        }
        let charter: RuntimeProbeCharter;
        try {
          charter = loadCharter(options.charter);
        } catch (err) {
          process.stderr.write(
            `devai sense runtime-${kind}: failed to load charter: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
        const ok = validators.runtimeCharter(charter);
        if (!ok) {
          process.stderr.write(
            `devai sense runtime-${kind}: charter failed runtime-charter.schema.json validation: ${JSON.stringify(validators.runtimeCharter.errors)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
        if (charter.kind !== kind) {
          process.stderr.write(
            `devai sense runtime-${kind}: charter kind '${charter.kind}' does not match command kind '${kind}'\n`,
          );
          process.exit(EXIT_USAGE);
        }
        try {
          const { summary, reading } = await executeRuntimeProbe({
            charter,
            ...(options.dryRun === true && { dryRun: true }),
          });
          if (options.human === true) {
            process.stdout.write(
              `sense runtime-${kind}: ${charter.id} → ${summary.verdict}  (pass=${String(summary.pass)} fail=${String(summary.fail)} error=${String(summary.error)} skipped=${String(summary.skipped)} of ${String(summary.total)})\n`,
            );
          } else {
            emit(reading, false);
          }
          void summary;
          process.exit(exitFor(reading.status));
        } catch (err) {
          process.stderr.write(
            `devai sense runtime-${kind}: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  };
}

export const senseRuntimeApi = defineCommand({
  name: 'sense runtime-api',
  description:
    'Execute an HTTP/RPC runtime-probe charter against a deployed runtime and emit a SensorReading. Per Phase 11.A (D-39).',
  authority: 'sensor',
  register: makeRegister('api'),
});

export const senseRuntimeAuth = defineCommand({
  name: 'sense runtime-auth',
  description:
    'Execute an auth/RBAC/protected-surface runtime-probe charter and emit a SensorReading. Per Phase 11.A (D-39).',
  authority: 'sensor',
  register: makeRegister('auth'),
});

export const senseRuntimeData = defineCommand({
  name: 'sense runtime-data',
  description:
    'Execute a data/state/consistency runtime-probe charter and emit a SensorReading. DB driver placeholder; --dry-run validates the charter without executing. Per Phase 11.A (D-39).',
  authority: 'sensor',
  register: makeRegister('data'),
});
