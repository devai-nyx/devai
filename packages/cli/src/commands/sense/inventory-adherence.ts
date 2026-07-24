import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import type { CAC } from 'cac';
import { computeReverseAdherence, resolveSensorParams } from '#core-compat';
import { buildSensorReading, senseInventoryAdherence } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly inventoryPath?: string;
  readonly tracePath?: string;
  readonly maxOrphans?: number;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

const DEFAULT_INVENTORY_PATH = '.devai/state/inventory/inventory.json';
const DEFAULT_TRACE_PATH = 'law/trace.json';

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function absPath(repoRoot: string, p: string): string {
  return isAbsolute(p) ? p : resolve(repoRoot, p);
}

/**
 * `devai sense inventory adherence` — emit an inventory_adherence
 * SensorReading (Phase 26.H, F4×T4). Loads inventory.json + trace.json,
 * runs the existing computeReverseAdherence, and maps orphan counts
 * to PASS / REVIEW / FAIL.
 */
export const senseInventoryAdherenceCmd = defineCommand({
  name: 'sense inventory-adherence',
  description: 'Run reverse-adherence audit and emit an inventory_adherence SensorReading (F4×T4)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-inventory-adherence', 'Emit an inventory_adherence SensorReading (F4×T4)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--inventory-path <path>',
        `Override inventory.json (default: ${DEFAULT_INVENTORY_PATH})`,
      )
      .option('--trace-path <path>', `Override trace.json (default: ${DEFAULT_TRACE_PATH})`)
      .option('--max-orphans <n>', 'REVIEW threshold; orphans beyond this FAIL (default 50)')
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;
        const inventoryPath = absPath(
          repoRoot,
          options.inventoryPath ?? join(repoRoot, DEFAULT_INVENTORY_PATH),
        );
        const tracePath = absPath(
          repoRoot,
          options.tracePath ?? join(repoRoot, DEFAULT_TRACE_PATH),
        );

        let maxOrphans = options.maxOrphans !== undefined ? Number(options.maxOrphans) : undefined;
        if (
          maxOrphans === undefined &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'inventory_adherence',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['max_orphans'];
          if (typeof fromPack === 'number' && Number.isFinite(fromPack) && fromPack >= 0) {
            maxOrphans = fromPack;
          }
        }

        // Phase 30 lane D (DEVAI self-application): graceful-degradation
        // contract — when inventory.json or trace.json doesn't exist,
        // emit status='unknown' with an explicit reason rather than
        // throwing ENOENT to the caller. Mirrors the 26.K precedent.
        if (!existsSync(inventoryPath) || !existsSync(tracePath)) {
          const missing: string[] = [];
          if (!existsSync(inventoryPath)) missing.push(inventoryPath);
          if (!existsSync(tracePath)) missing.push(tracePath);
          const reading = buildSensorReading({
            sensorName: 'inventory-adherence',
            sensorKind: 'inventory_adherence',
            command: ['devai', 'sense-inventory-adherence'],
            status: 'unknown',
            deterministic: true,
            tier: 'L0',
            findings: [
              {
                severity: 'warning',
                code: 'INVENTORY_ADHERENCE_INPUT_MISSING',
                message: `Required input(s) not found: ${missing.join(', ')}. Run \`inv regen\` and \`spec validate-trace\` first.`,
              },
            ],
            metrics: { inputs_missing: missing.length },
          });
          finishSenseCommand(reading, {
            repoRoot,
            ...(options.human !== undefined && { human: options.human }),
            ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
          });
          return;
        }

        const inventory =
          loadJson<Parameters<typeof computeReverseAdherence>[0]['inventory']>(inventoryPath);
        const trace = loadJson<Parameters<typeof computeReverseAdherence>[0]['trace']>(tracePath);
        const report = computeReverseAdherence({ inventory, trace });
        const reading = senseInventoryAdherence({
          report,
          ...(maxOrphans !== undefined && { maxOrphans }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
