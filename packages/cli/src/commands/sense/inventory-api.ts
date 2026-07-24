import { isAbsolute, resolve } from 'node:path';
import type { CAC } from 'cac';
import { senseInventoryApi } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_REPO_ROOT,
  finishInventorySenseCommand,
  maybeResolvePackParams,
} from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly scanDir?: string;
  readonly bodyPath?: string;
  readonly backend?: string;
  readonly frontend?: string;
  readonly db?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

/**
 * `devai sense inventory api` — emit an inventory_api SensorReading at tier L0
 * by statically scanning NestJS-style `@Controller`-decorated classes.
 * The reading carries metrics (endpoint_count, controller_file_count,
 * endpoints_hash) and an `evidence_path` pointer to the api-map.json
 * body conforming to `api-map.schema.json` (Phase 17.B). Per Phase 17.C2 (D-57).
 *
 * NestJS is the only backend adapter in 17.C2. Express / Laravel / Spring
 * adapters land later via stack-adapter packs (17.G) or follow-on
 * sub-batches.
 */
export const senseInventoryApiCmd = defineCommand({
  name: 'sense api',
  description:
    'Static backend-API inventory (NestJS adapter, tier L0); emit SensorReading + api-map body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-api', 'Walk controllers and emit an inventory_api SensorReading + body')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--scan-dir <path>', 'Subdirectory under repo-root to scan (default: repo-root)')
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_api/api-map.json)',
      )
      .option('--backend <name>', 'Tag the body with a backend label (e.g. nestjs)')
      .option('--frontend <name>', 'Tag the body with a frontend label (e.g. angular)')
      .option('--db <name>', 'Tag the body with a db label (e.g. postgres)')
      .option(
        '--adopter-root <path>',
        'Adopter repo root for pack-tune resolution (default: --repo-root)',
      )
      .option(
        '--pack-tune',
        'Resolve the matched stack-adapter pack and apply its extractor_params for inventory_api as defaults (CLI flags win)',
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
        const packParams = maybeResolvePackParams('inventory_api', adopterRoot, {
          ...(options.packTune !== undefined && { packTune: options.packTune }),
          ...(options.packId !== undefined && { packId: options.packId }),
          ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
        });
        const scanDirFromPack =
          typeof packParams.scan_dir === 'string' ? packParams.scan_dir : undefined;
        // The sensor expects an absolute (or CWD-relative) scanDir; the
        // CLI help advertises "Subdirectory under repo-root", so any
        // relative value here is resolved against --repo-root.
        const rawScanDir = options.scanDir ?? scanDirFromPack;
        const scanDir =
          rawScanDir === undefined
            ? undefined
            : isAbsolute(rawScanDir)
              ? rawScanDir
              : resolve(repoRoot, rawScanDir);
        // Phase 20.E: pack-declared `scan_dir_alternates` walked in
        // addition to `scan_dir`. CLI never overrides this; pure pack
        // extension covering parallel-layout repos (e.g.
        // `apps/api` + `apps/reference-api` + `reference/api`).
        const scanDirAlternatesRaw = packParams.scan_dir_alternates;
        const scanDirs = Array.isArray(scanDirAlternatesRaw)
          ? scanDirAlternatesRaw
              .filter((s): s is string => typeof s === 'string')
              .map((s) => (isAbsolute(s) ? s : resolve(repoRoot, s)))
          : undefined;
        // Phase 22.B (D-A-12): pack-configurable public-marker
        // decorators. The walker treats any endpoint carrying one
        // of these decorators (method-level or class-level) as
        // having auth.required=false; inv-suggest then treats it
        // as claimed instead of an unbound_endpoint candidate.
        const publicMarkerDecoratorsRaw = packParams.public_marker_decorators;
        const publicMarkerDecorators = Array.isArray(publicMarkerDecoratorsRaw)
          ? publicMarkerDecoratorsRaw.filter((s): s is string => typeof s === 'string')
          : undefined;
        const stack =
          options.backend !== undefined &&
          options.frontend !== undefined &&
          options.db !== undefined
            ? { backend: options.backend, frontend: options.frontend, db: options.db }
            : undefined;
        const { reading, body } = senseInventoryApi({
          repoRoot,
          persistBody: false,
          ...(scanDir !== undefined && { scanDir }),
          ...(scanDirs !== undefined && scanDirs.length > 0 && { scanDirs }),
          ...(options.bodyPath !== undefined && { bodyPath: options.bodyPath }),
          ...(stack !== undefined && { stack }),
          ...(publicMarkerDecorators !== undefined &&
            publicMarkerDecorators.length > 0 && { publicMarkerDecorators }),
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
