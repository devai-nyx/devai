import type { CAC } from 'cac';
import { senseInventoryDataModel } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_REPO_ROOT,
  finishInventorySenseCommand,
  maybeResolvePackParams,
} from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly migrationDirs?: string;
  readonly bodyPath?: string;
  readonly dialect?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
  readonly output?: string;
}

type SqlDialect = 'postgres' | 'mysql' | 'oracle' | 'sqlite' | 'mssql' | 'unknown';

const VALID_DIALECTS: ReadonlySet<SqlDialect> = new Set([
  'postgres',
  'mysql',
  'oracle',
  'sqlite',
  'mssql',
  'unknown',
]);

function asDialect(value: unknown): SqlDialect | undefined {
  if (typeof value !== 'string') return undefined;
  return VALID_DIALECTS.has(value as SqlDialect) ? (value as SqlDialect) : undefined;
}

/**
 * `devai sense inventory data model` — emit an inventory_data_model SensorReading
 * at tier L0 by parsing `*.sql` migration files for `CREATE TABLE`
 * blocks. Postgres-dialect parsing only in 17.C3; other dialects later
 * via stack-adapter packs (17.G). Per Phase 17.C3 (D-57).
 */
export const senseInventoryDataModelCmd = defineCommand({
  name: 'sense data-model',
  description:
    'Static data-model inventory (Postgres SQL migration parser, tier L0); emit SensorReading + body',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-data-model',
        'Parse SQL migrations and emit an inventory_data_model SensorReading + body',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--migration-dirs <csv>',
        'Comma-separated migration dirs to scan (default: migrations,db/migrations,db,database)',
      )
      .option(
        '--body-path <path>',
        'Override evidence-body path (default: .devai/state/sensors/inventory_data_model/data-model.json)',
      )
      .option(
        '--dialect <name>',
        'Dialect: postgres|mysql|oracle|sqlite|mssql|unknown (default: postgres)',
      )
      .option(
        '--adopter-root <path>',
        'Adopter repo root for pack-tune resolution (default: --repo-root)',
      )
      .option(
        '--pack-tune',
        'Resolve the matched stack-adapter pack and apply its extractor_params for inventory_data_model as defaults (CLI flags win)',
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
        const packParams = maybeResolvePackParams('inventory_data_model', adopterRoot, {
          ...(options.packTune !== undefined && { packTune: options.packTune }),
          ...(options.packId !== undefined && { packId: options.packId }),
          ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
        });
        const cliMigrationDirs = options.migrationDirs
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const packMigrationDirs = Array.isArray(packParams.migration_dirs)
          ? (packParams.migration_dirs as readonly unknown[]).filter(
              (v): v is string => typeof v === 'string',
            )
          : undefined;
        const migrationDirs =
          cliMigrationDirs !== undefined && cliMigrationDirs.length > 0
            ? cliMigrationDirs
            : packMigrationDirs !== undefined && packMigrationDirs.length > 0
              ? packMigrationDirs
              : undefined;
        const dialect = asDialect(options.dialect) ?? asDialect(packParams.dialect);
        // Phase 22.C (D-A-13): pack-configurable PII-registry table
        // for adopters whose runtime PII metadata lives in INSERT
        // statements (e.g. stynx's core.pii_map) instead of inline
        // column comments.
        const piiRegistryTable =
          typeof packParams.pii_registry_table === 'string' &&
          packParams.pii_registry_table.length > 0
            ? packParams.pii_registry_table
            : undefined;
        const { reading, body } = senseInventoryDataModel({
          repoRoot,
          persistBody: false,
          ...(migrationDirs !== undefined && migrationDirs.length > 0 && { migrationDirs }),
          ...(options.bodyPath !== undefined && { bodyPath: options.bodyPath }),
          ...(dialect !== undefined && { dialect }),
          ...(piiRegistryTable !== undefined && { piiRegistryTable }),
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
