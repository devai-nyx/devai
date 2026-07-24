import type { CAC } from 'cac';
import { regenerateInventory } from '#core-compat';
import { senseInventoryDeterminism } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

const PINNED_TS = '2026-01-01T00:00:00.000Z';
const PINNED_HEAD = '0'.repeat(40);

/**
 * `devai sense inventory determinism` — emit an inventory_determinism
 * SensorReading (Phase 26.I, F4×T8). Runs `regenerateInventory`
 * twice with the same pinned timestamp + integrationHead,
 * canonicalises both outputs (JSON.stringify), and feeds the two
 * canonical strings into the sensor for hash-equality verification.
 */
export const senseInventoryDeterminismCmd = defineCommand({
  name: 'sense inventory-determinism',
  description:
    'Verify inv-regen is byte-deterministic; emit inventory_determinism SensorReading (F4×T8)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-inventory-determinism', 'Emit an inventory_determinism SensorReading (F4×T8)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action(async (options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const recordA = await regenerateInventory({
          repoRoot,
          timestamp: PINNED_TS,
          integrationHead: PINNED_HEAD,
        });
        const recordB = await regenerateInventory({
          repoRoot,
          timestamp: PINNED_TS,
          integrationHead: PINNED_HEAD,
        });
        const reading = senseInventoryDeterminism({
          canonicalA: JSON.stringify(recordA),
          canonicalB: JSON.stringify(recordB),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
