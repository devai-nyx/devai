import type { CAC } from 'cac';
import { senseInventoryDepGraph } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishInventorySenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly scanDir?: string;
  readonly bodyPath?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

/**
 * `devai sense inventory dep graph` — emit an inventory_dep_graph SensorReading
 * at tier L0 by statically scanning TypeScript imports. The reading
 * carries metrics (node_count, edge_count) and an `evidence_path`
 * pointer to the adjacency-list body conforming to
 * `dep-graph.schema.json` (Phase 17.B). Per Phase 17.C1 (D-57).
 */
export const senseInventoryDepGraphCmd = defineCommand({
  name: 'sense dep-graph',
  description: 'Static TypeScript dependency-graph inventory (tier L0); emit SensorReading + body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-dep-graph',
        'Walk TS sources and emit an inventory_dep_graph SensorReading + body',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--scan-dir <path>', 'Subdirectory under repo-root to scan (default: repo-root)')
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_dep_graph/dep-graph.json)',
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
        const { reading, body } = senseInventoryDepGraph({
          repoRoot,
          persistBody: false,
          ...(options.scanDir !== undefined && { scanDir: options.scanDir }),
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
