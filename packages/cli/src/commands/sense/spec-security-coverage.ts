import type { CAC } from 'cac';
import { resolveSensorParams } from '#core-compat';
import { senseSpecSecurityCoverage } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly adopterRoot?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly threatModelGlobs?: string | string[];
  readonly piiRegistryTable?: string;
  readonly piiMigrationsGlobs?: string | string[];
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

function optionList(value: string | string[] | undefined): readonly string[] | undefined {
  if (value === undefined) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const parsed = values.flatMap((item) =>
    item
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part !== ''),
  );
  return parsed.length === 0 ? undefined : parsed;
}

export const senseSpecSecurityCoverageCmd = defineCommand({
  name: 'sense spec-security-coverage',
  description:
    'Check spec substrate covers security/privacy (threat-model + PII registry + RBAC); F1×T6',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-spec-security-coverage',
        'Emit a spec_security_coverage SensorReading (F1×T6)',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--adopter-root <path>', 'Adopter root for pack-tune (default: --repo-root)')
      .option('--pack-tune', 'Resolve defaults from the matched stack-adapter pack')
      .option('--pack-id <id>', 'Pin a specific pack id (implies --pack-tune)')
      .option('--packs-root <path>', 'Override packs root')
      .option(
        '--threat-model-globs <glob>',
        'Threat-model dirs/globs to scan (comma-separated or repeatable)',
      )
      .option(
        '--pii-registry-table <name>',
        'PII registry table name to search for (default: core.pii_map)',
      )
      .option(
        '--pii-migrations-globs <glob>',
        'Migration dirs/globs to scan for PII registry inserts (comma-separated or repeatable)',
      )
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adopterRoot = options.adopterRoot ?? repoRoot;
        let threatModelGlobs: readonly string[] | undefined;
        let piiRegistryTable: string | undefined;
        let piiMigrationsGlobs: readonly string[] | undefined;
        if (options.packTune === true || options.packId !== undefined) {
          const resolved = resolveSensorParams({
            adopterRoot,
            sensorKind: 'spec_security_coverage',
            ...(options.packsRoot !== undefined && { packsRoot: options.packsRoot }),
            ...(options.packId !== undefined && { explicitId: options.packId }),
          });
          const tmg = resolved?.params['threat_model_globs'];
          if (Array.isArray(tmg))
            threatModelGlobs = tmg.filter((s): s is string => typeof s === 'string');
          const prt = resolved?.params['pii_registry_table'];
          if (typeof prt === 'string') piiRegistryTable = prt;
          const pmg = resolved?.params['pii_migrations_globs'];
          if (Array.isArray(pmg))
            piiMigrationsGlobs = pmg.filter((s): s is string => typeof s === 'string');
        }
        threatModelGlobs = optionList(options.threatModelGlobs) ?? threatModelGlobs;
        piiRegistryTable = options.piiRegistryTable ?? piiRegistryTable;
        piiMigrationsGlobs = optionList(options.piiMigrationsGlobs) ?? piiMigrationsGlobs;
        const reading = senseSpecSecurityCoverage({
          repoRoot,
          ...(threatModelGlobs !== undefined && { threatModelGlobs }),
          ...(piiRegistryTable !== undefined && { piiRegistryTable }),
          ...(piiMigrationsGlobs !== undefined && { piiMigrationsGlobs }),
        });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
