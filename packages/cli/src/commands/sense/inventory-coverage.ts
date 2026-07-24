import type { CAC } from 'cac';
import { senseInventoryCoverage } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_REPO_ROOT,
  finishInventorySenseCommand,
  maybeResolvePackParams,
} from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly apiMapPath?: string;
  readonly routesPath?: string;
  readonly bodyPath?: string;
  readonly useCasesDir?: string;
  readonly framework?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

/**
 * `devai sense inventory coverage` — meta-sensor that assembles a
 * coverage-matrix body from api + routes inventories. In 17.C4 the
 * useCases[] and links[] arrays remain empty (LLM-assisted use-case
 * inference is deferred to 17.F SKILL-write-use-cases or later); the
 * coverage matrix is shape-valid but flags every endpoint/route as
 * unmapped, which INV-INVENTORY-001 (Phase 17.D) hard-fails until use-
 * cases are authored. Per Phase 17.C4 (D-57).
 */
export const senseInventoryCoverageCmd = defineCommand({
  name: 'sense coverage',
  description:
    'Coverage-matrix meta-sensor (consumes api + routes inventories, tier L0); emit SensorReading + body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-coverage',
        'Assemble a route↔endpoint↔use-case coverage matrix from api + routes inventories',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--api-map-path <path>',
        'Path to api-map body (default: .devai/state/sensors/inventory_api/api-map.json)',
      )
      .option(
        '--routes-path <path>',
        'Path to routes-inventory body. Default: framework-aware — resolves routes-<framework>.json via --framework or extractor_params.inventory_routes.framework; globs routes-*.json when only one body exists; falls back to routes-react.json otherwise. Closes D-A-37.',
      )
      .option(
        '--framework <name>',
        "Frontend framework hint for routes-body resolution: 'react', 'angular', etc. Pack-tuneable via extractor_params.inventory_routes.framework. Mirrors `sense-routes`'s output-path logic. D-A-37.",
      )
      .option(
        '--adopter-root <path>',
        'Adopter project root for pack-tune resolution (default: --repo-root)',
      )
      .option(
        '--pack-tune',
        'Resolve the matched stack-adapter pack and apply its extractor_params for inventory_routes as defaults (CLI flags win)',
      )
      .option('--pack-id <id>', 'Explicit pack id (skips fingerprint matching)')
      .option('--packs-root <path>', 'Override packs directory for pack discovery')
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_coverage/coverage-matrix.json)',
      )
      .option(
        '--use-cases-dir <path>',
        'Directory of authored use-case JSON files (default: product/use-cases). Phase 22.H reads these to populate the coverage matrix links[]. Adopters without use-cases: behavior unchanged.',
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
        // D-A-37: resolve framework from pack-tune (same key as sense-routes)
        // when CLI flag absent. CLI flag wins; pack-tune is the adopter default.
        const adopterRoot = options.adopterRoot ?? repoRoot;
        const packParams = maybeResolvePackParams('inventory_routes', adopterRoot, {
          ...(options.packTune !== undefined && { packTune: options.packTune }),
          ...(options.packId !== undefined && { packId: options.packId }),
          ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
        });
        const frameworkFromPack =
          typeof packParams.framework === 'string' ? packParams.framework : undefined;
        const framework = options.framework ?? frameworkFromPack;
        const { reading, body } = senseInventoryCoverage({
          repoRoot,
          persistBody: false,
          ...(options.apiMapPath !== undefined && { apiMapPath: options.apiMapPath }),
          ...(options.routesPath !== undefined && { routesPath: options.routesPath }),
          ...(options.bodyPath !== undefined && { bodyPath: options.bodyPath }),
          ...(options.useCasesDir !== undefined && { useCasesDir: options.useCasesDir }),
          ...(framework !== undefined && { framework }),
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
