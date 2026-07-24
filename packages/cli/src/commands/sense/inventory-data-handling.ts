import type { CAC } from 'cac';
import { senseInventoryDataHandling } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishInventorySenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly dataModelPath?: string;
  readonly bodyPath?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

/**
 * `devai sense inventory data handling` — emit an inventory_data_handling
 * SensorReading at tier L0 by classifying database columns into PII
 * categories (contact, identity, credentials, financial, location,
 * personal, health, ip) via name + type heuristics. Consumes a
 * pre-existing data-model body; run `devai sense inventory data model` first.
 * Per Phase 17.C3 (D-57). INV-INVENTORY-002 (Phase 17.D) consumes
 * this output and requires legal_basis + retention on each PII column.
 */
export const senseInventoryDataHandlingCmd = defineCommand({
  name: 'sense data-handling',
  description:
    'PII column classification over data-model output (tier L0); emit SensorReading + seeded body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-data-handling',
        'Classify columns into PII categories; emit a seeded data-model body for LGPD/GDPR review',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--data-model-path <path>',
        'Path to data-model body (default: .devai/state/sensors/inventory_data_model/data-model.json)',
      )
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_data_handling/data-model-pii.json)',
      )
      .option('--human', 'Human-readable summary')
      .option(
        '--output <mode>',
        "Stdout payload: 'reading' (default) or the complete non-persisted 'body'",
      )
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 21.E.',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const { reading, body } = senseInventoryDataHandling({
          repoRoot,
          persistBody: false,
          ...(options.dataModelPath !== undefined && { dataModelPath: options.dataModelPath }),
          ...(options.bodyPath !== undefined && { bodyPath: options.bodyPath }),
        });
        finishInventorySenseCommand(reading, body, {
          repoRoot,
          ...(options.output !== undefined && { output: options.output }),
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
