import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseMigrateCheck } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly migrationsDir?: string;
  readonly migrationDirs?: string;
  readonly preSeed?: string | string[];
  readonly roleBootstrap?: boolean;
  readonly databaseUrl?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

export const senseMigrateCheckCmd = defineCommand({
  name: 'sense migrate-check',
  description: 'Apply every db/migrations/*.sql to a Postgres URL; emit a SensorReading',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-migrate-check',
        'Apply every migration sequentially via psql + emit SensorReading',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--migrations-dir <path>',
        'Override single migrations directory (default: db/migrations)',
      )
      .option(
        '--migration-dirs <csv>',
        'Comma-separated list of directories applied in declaration order (Phase 29.D / D-A-28). Wins over --migrations-dir; pack-tune resolves from extractor_params.migrate_check.migration_dirs.',
      )
      .option('--database-url <url>', 'Postgres URL (skips without it)')
      .option(
        '--pre-seed <file>',
        'SQL file applied before any migration (repeatable; declaration order preserved). Phase 30.F / I-1.',
      )
      .option(
        '--role-bootstrap',
        'Create roles declared in extractor_params.migrate_check.bootstrap_roles (idempotent DO blocks) before pre-seed + migrations. Default false. Phase 30.F / I-1.',
      )
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve --migration-dirs default from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 32.C / D-A-33.',
      )
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;
        let migrationDirs: readonly string[] | undefined;
        if (options.migrationDirs !== undefined) {
          migrationDirs = options.migrationDirs
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        }
        let bootstrapRoles: readonly string[] | undefined;
        if (options.roleBootstrap === true) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'migrate_check',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['bootstrap_roles'];
          if (Array.isArray(fromPack)) {
            bootstrapRoles = fromPack.filter((s): s is string => typeof s === 'string');
          }
        }
        if (
          migrationDirs === undefined &&
          (options.packTune === true || options.packId !== undefined)
        ) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'migrate_check',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const fromPack = resolved?.params['migration_dirs'];
          if (Array.isArray(fromPack)) {
            migrationDirs = fromPack.filter((s): s is string => typeof s === 'string');
          }
        }
        const preSeedFiles =
          options.preSeed === undefined
            ? undefined
            : Array.isArray(options.preSeed)
              ? options.preSeed
              : [options.preSeed];
        const reading = senseMigrateCheck({
          cwd: repoRoot,
          persistBody: false,
          ...(options.migrationsDir !== undefined && { migrationsDir: options.migrationsDir }),
          ...(migrationDirs !== undefined && migrationDirs.length > 0 && { migrationDirs }),
          ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
          ...(preSeedFiles !== undefined && preSeedFiles.length > 0 && { preSeedFiles }),
          ...(bootstrapRoles !== undefined && bootstrapRoles.length > 0 && { bootstrapRoles }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
