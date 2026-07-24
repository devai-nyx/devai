import { isAbsolute, resolve } from 'node:path';
import type { CAC } from 'cac';
import { EXIT_USAGE } from '@devai-nyx/utils';
import { senseInventoryRoutes, type RoutesFramework } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_REPO_ROOT,
  finishInventorySenseCommand,
  maybeResolvePackParams,
} from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly scanDir?: string;
  readonly framework?: string;
  readonly bodyPath?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

/**
 * `devai sense inventory routes` — emit an inventory_routes SensorReading at tier
 * L0 by statically scanning frontend routes. The reading carries
 * metrics (route_count, route_file_count, routes_hash) and an
 * `evidence_path` pointer to the routes-<framework>.json body
 * conforming to `routes-inventory.schema.json` (Phase 17.B).
 *
 * Two frontend adapters today: `react` (Phase 17.C2, default for
 * back-compat) and `angular` (Phase 20.D, closes D-A-2). Selectable
 * via `--framework` or pack-tuneable via
 * `extractor_params.inventory_routes.framework`. The body file path
 * defaults to `routes-{framework}.json`.
 */
export const senseInventoryRoutesCmd = defineCommand({
  name: 'sense routes',
  description:
    'Static frontend-routes inventory (React or Angular adapter, tier L0); emit SensorReading + routes-inventory body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-routes',
        'Walk React-router routes and emit an inventory_routes SensorReading + body',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--scan-dir <path>', 'Subdirectory under repo-root to scan (default: repo-root)')
      .option(
        '--framework <name>',
        "Frontend framework: 'react' (default) or 'angular'. Pack-tuneable via extractor_params.inventory_routes.framework.",
      )
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_routes/routes-<framework>.json)',
      )
      .option(
        '--adopter-root <path>',
        'Adopter repo root for pack-tune resolution (default: --repo-root)',
      )
      .option(
        '--pack-tune',
        'Resolve the matched stack-adapter pack and apply its extractor_params for inventory_routes as defaults (CLI flags win)',
      )
      .option(
        '--pack-id <id>',
        'Force a specific pack id for tuning (implies --pack-tune; skips auto-detect)',
      )
      .option(
        '--packs-root <path>',
        'Override DEVAI workspace root used to discover bundled stack-adapter packs (default: auto-detect)',
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
        const adopterRoot = options.adopterRoot ?? repoRoot;
        const packParams = maybeResolvePackParams('inventory_routes', adopterRoot, {
          ...(options.packTune !== undefined && { packTune: options.packTune }),
          ...(options.packId !== undefined && { packId: options.packId }),
          ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
        });
        const scanDirFromPack =
          typeof packParams.scan_dir === 'string' ? packParams.scan_dir : undefined;
        const rawScanDir = options.scanDir ?? scanDirFromPack;
        const scanDir =
          rawScanDir === undefined
            ? undefined
            : isAbsolute(rawScanDir)
              ? rawScanDir
              : resolve(repoRoot, rawScanDir);
        // Phase 20.E: pack-declared `scan_dir_alternates` are walked in
        // addition to `scan_dir`. CLI never overrides this; it's a
        // pure pack extension covering parallel-layout repos.
        const scanDirAlternatesRaw = packParams.scan_dir_alternates;
        const scanDirs = Array.isArray(scanDirAlternatesRaw)
          ? scanDirAlternatesRaw
              .filter((s): s is string => typeof s === 'string')
              .map((s) => (isAbsolute(s) ? s : resolve(repoRoot, s)))
          : undefined;
        // Phase 20.D (D-A-2): pack-tuneable framework selector. CLI
        // flag wins; pack default applies when --framework is absent.
        const frameworkFromPack =
          typeof packParams.framework === 'string' ? packParams.framework : undefined;
        const rawFramework = options.framework ?? frameworkFromPack;
        let framework: RoutesFramework | undefined;
        if (rawFramework !== undefined) {
          if (rawFramework !== 'react' && rawFramework !== 'angular') {
            process.stderr.write(
              `sense-routes: --framework must be 'react' or 'angular' (got '${rawFramework}')\n`,
            );
            process.exit(EXIT_USAGE);
          }
          framework = rawFramework;
        }
        const { reading, body } = senseInventoryRoutes({
          repoRoot,
          persistBody: false,
          ...(scanDir !== undefined && { scanDir }),
          ...(scanDirs !== undefined && scanDirs.length > 0 && { scanDirs }),
          ...(framework !== undefined && { framework }),
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
