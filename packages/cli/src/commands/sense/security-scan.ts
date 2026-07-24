import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseSecurityScan } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly passMaxHigh?: number;
  readonly reviewMaxHigh?: number;
  readonly preferredTool?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseSecurityScanCmd = defineCommand({
  name: 'sense security-scan',
  description:
    'Wrap pnpm/npm audit and emit a security_scan SensorReading (F2×T6, Phase 30.G / S-1)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-security-scan', 'Emit a security_scan SensorReading (F2×T6)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--pass-max-high <n>', 'Max high-severity vulns for PASS (default 0)')
      .option('--review-max-high <n>', 'Max high-severity vulns for REVIEW (default 5)')
      .option('--preferred-tool <pnpm|npm>', 'Preferred audit tool (default: pnpm)')
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option('--human', 'Human-readable summary')
      .option('--no-emit-reading', 'Skip persisting')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;
        let passMaxHigh =
          options.passMaxHigh !== undefined ? Number(options.passMaxHigh) : undefined;
        let reviewMaxHigh =
          options.reviewMaxHigh !== undefined ? Number(options.reviewMaxHigh) : undefined;
        if (
          (passMaxHigh === undefined || reviewMaxHigh === undefined) &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'security_scan',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['thresholds'] as
            { pass_max_high?: number; review_max_high?: number } | undefined;
          if (fromPack !== undefined) {
            if (passMaxHigh === undefined && typeof fromPack.pass_max_high === 'number')
              passMaxHigh = fromPack.pass_max_high;
            if (reviewMaxHigh === undefined && typeof fromPack.review_max_high === 'number')
              reviewMaxHigh = fromPack.review_max_high;
          }
        }
        const thresholds =
          passMaxHigh !== undefined && reviewMaxHigh !== undefined
            ? { passMaxHigh, reviewMaxHigh }
            : undefined;
        const preferredTool = options.preferredTool === 'npm' ? 'npm' : 'pnpm';
        const reading = senseSecurityScan({
          repoRoot,
          ...(thresholds !== undefined && { thresholds }),
          preferredTool,
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
