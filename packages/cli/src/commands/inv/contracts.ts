import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CAC } from 'cac';
import {
  checkRegen,
  loadRegenConfig,
  validateContracts,
  type RegenCheckResult,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, buildIgnoreDirs, emit, type CommonInvOptions } from './shared.js';

const DEFAULT_REGEN_CONFIG = '.devai/config/regen.json';

interface Options extends CommonInvOptions {
  readonly regen?: boolean;
  readonly regenConfig?: string;
  readonly emitReading?: boolean;
}

export const invContracts = defineCommand({
  name: 'inv contracts',
  description: 'Validate contract files (JSON Schemas + OpenAPI)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('inv-contracts', 'Validate every *.schema.json against draft 2020-12')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .option('--ignore-dir <name>', 'Extra directory name to skip (repeatable)')
      .option('--include-ignored <name>', 'Directory name to un-ignore (repeatable)')
      .option(
        '--regen',
        'Legacy contained compatibility probe; generator execution requires a declared host adapter',
      )
      .option(
        '--regen-config <path>',
        `Regen config path (default: <repo-root>/${DEFAULT_REGEN_CONFIG})`,
      )
      .option(
        '--no-emit-reading',
        'Skip persisting a contract_validation SensorReading under .devai/state/sensor-readings/ (default: persist on). Phase 30.C / W-1.',
      )
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const ignoreDirs = buildIgnoreDirs(options);
          const schemaResult = validateContracts({ repoRoot, ignoreDirs });

          let regenResults: readonly RegenCheckResult[] = [];
          let regenOk = true;
          if (options.regen === true) {
            const cfgPath = options.regenConfig ?? join(repoRoot, DEFAULT_REGEN_CONFIG);
            if (!existsSync(cfgPath)) {
              process.stderr.write(
                `devai inventory contracts: --regen requested but ${cfgPath} not found\n`,
              );
              process.exit(EXIT_FAIL);
            }
            const config = loadRegenConfig(cfgPath);
            regenResults = checkRegen({ repoRoot, config });
            regenOk = regenResults.every((r) => r.ok);
          }

          const ok = schemaResult.ok && regenOk;
          const failingSchemas = schemaResult.checks.filter((c) => !c.ok);
          const failingRegen = regenResults.filter((r) => !r.ok);

          const humanLines = [`inv contracts: ${ok ? 'OK' : 'FAIL'}`];
          humanLines.push(
            `  schemas: ${String(schemaResult.checks.length)} contract(s), ${String(failingSchemas.length)} failing`,
          );
          for (const c of failingSchemas) {
            humanLines.push(`    [✗] ${c.file}`);
            for (const e of c.errors) humanLines.push(`        ${e}`);
          }
          if (options.regen === true) {
            humanLines.push(
              `  regen: ${String(regenResults.length)} entry(ies), ${String(failingRegen.length)} failing`,
            );
            for (const r of failingRegen) {
              humanLines.push(`    [✗] ${r.name}`);
              if (r.command_error !== undefined)
                humanLines.push(`        command error: ${r.command_error}`);
              if (r.drifted_files.length > 0)
                humanLines.push(`        drifted: ${r.drifted_files.join(', ')}`);
              if (r.missing_files.length > 0)
                humanLines.push(`        missing: ${r.missing_files.join(', ')}`);
            }
          }

          emit(
            { schemas: schemaResult, regen: regenResults, ok },
            options.human === true,
            humanLines.join('\n'),
          );

          process.exitCode = ok ? EXIT_PASS : EXIT_FAIL;
        } catch (err) {
          process.stderr.write(
            `devai inventory contracts: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
