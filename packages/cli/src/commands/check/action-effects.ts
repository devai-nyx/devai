import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CAC } from 'cac';
import { enforceEffectReport } from '@devai-nyx/effects-check';
import { senseActionEffectInference } from '@devai-nyx/sensors';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand, getFullRegistry } from '../../define-command.js';

interface Options {
  readonly repoRoot?: string;
  readonly tsconfig?: string;
  readonly registry?: string;
  readonly human?: boolean;
}

export const checkActionEffectsCmd = defineCommand({
  name: 'check action-effects',
  description:
    'Run the binding action-effect analyzer and emit its deterministic SensorReading (F5×T4).',
  authority: 'policy_firewall',
  lifecycle: 'supported',
  lifecycle_reason:
    'R25 binding analyzer; under-declaration, unresolved edges, and unregistered subprocesses fail closed.',
  promotion_criteria: [
    'R24 ADR-EFFECTS records go after extractor equality, complete dispositions, subprocess classification, and the 10-second wall-clock gate.',
    'R25 independently binds static findings and runtime seam enforcement.',
  ],
  register(cli: CAC): void {
    cli
      .command('check-action-effects', 'Run the shadow action-effect analyzer')
      .option('--repo-root <path>', 'Repository root (default: .)')
      .option('--tsconfig <path>', 'Analyzer tsconfig (default: tsconfig.effects.json)')
      .option(
        '--registry <path>',
        'Subprocess-effects registry (default: law/policy/subprocess-effects.json)',
      )
      .option('--human', 'Human-readable summary')
      .action(async (options: Options) => {
        const repoRoot = resolve(options.repoRoot ?? '.');
        const registryPath = resolve(
          repoRoot,
          options.registry ?? 'law/policy/subprocess-effects.json',
        );
        const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
          templates: readonly {
            executable?: unknown;
            argv_shape?: unknown;
            capabilities?: unknown;
          }[];
        };
        const entries = getFullRegistry();
        const result = await senseActionEffectInference({
          tsconfigPath: resolve(repoRoot, options.tsconfig ?? 'tsconfig.effects.json'),
          catalog: entries.map((entry) => entry.previous_name),
          contracts: entries.map((entry) => ({
            action_id: entry.previous_name,
            effect: entry.effects,
            capabilities: entry.authority_contract.capabilities,
          })),
          subprocessRegistry: registry,
        });

        if (options.human === true) {
          process.stdout.write(
            `policy check action effects: ${result.reading.status.toUpperCase()} ` +
              `(${String(result.report.metrics.catalog_actions)} actions, ` +
              `${String(result.report.findings.length)} findings, ` +
              `${String(result.report.metrics.duration_ms)}ms)\n`,
          );
          for (const finding of result.report.findings) {
            process.stdout.write(
              `  [${finding.code}] ${finding.action_id ?? '<program>'}: ${finding.message}\n`,
            );
          }
        } else {
          process.stdout.write(JSON.stringify(result) + '\n');
        }
        try {
          enforceEffectReport(result.report);
          process.exitCode = EXIT_PASS;
        } catch (error) {
          if (options.human === true) {
            process.stderr.write(
              `policy check action effects: BINDING FAIL — ${error instanceof Error ? error.message : String(error)}\n`,
            );
          }
          process.exitCode = EXIT_FAIL;
        }
      });
  },
});
