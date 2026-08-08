import { resolve } from 'node:path';
import type { CAC } from 'cac';
import { EXIT_FAIL, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { executeCheckMember, type CheckExecutionOptions } from './adapters.js';
import { resolveCheckPlan, runCheckPlan, type CheckRunReport } from './contracts.js';

interface CheckCliOptions extends Omit<CheckExecutionOptions, 'repoRoot'> {
  readonly suite?: string;
  readonly only?: string;
  readonly repoRoot?: string;
  readonly human?: boolean;
}

function renderHuman(report: CheckRunReport): string {
  const selected =
    report.selection.kind === 'suite'
      ? `suite ${report.selection.suite}`
      : `only ${report.selection.member}`;
  const lines = [
    `check (${selected}): execution=${report.execution_status.toUpperCase()} readiness=${report.readiness_status.toUpperCase()}`,
  ];
  for (const result of report.results) {
    lines.push(
      `  ${result.status.toUpperCase()} ${result.id} (${String(result.duration_ms)}ms, ${result.effect})`,
    );
    if (result.message !== undefined) lines.push(`    ${result.message}`);
  }
  return `${lines.join('\n')}\n`;
}

export const checkCmd = defineCommand({
  name: 'check',
  description: 'Run a canonical check suite or one named check with fail-closed aggregate output.',
  authority: 'policy_firewall',
  register(cli: CAC): void {
    cli
      .command(
        'check',
        'Run a canonical check suite or one named check with fail-closed aggregate output',
      )
      .option('--suite <name>', 'quick | standard | full | release (default: standard)')
      .option('--only <member>', 'Run one canonical or migration-bound check member')
      .option('--repo-root <path>', 'Repository root (default: .)')
      .option('--schema <path>', 'Schema path for --only schema')
      .option('--instance <path>', 'Instance path for --only schema')
      .option('--file <path>', 'Input file for --only blueprint')
      .option('--witness <path>', 'Translation witness for --only translation')
      .option('--database-url <url>', 'Administrative database URL for translation isolation')
      .option('--pr-body-file <path>', 'PR body file for --only pr-compliance')
      .option('--optional', 'Permit a missing compliance trailer for --only pr-compliance')
      .option('--strict', "Enable the named check's strict posture where supported")
      .option('--since-ref <ref>', 'Verified lower commit bound for forbidden-action history')
      .option('--max-commits <n>', 'Bound forbidden-action history when --since-ref is absent')
      .option('--skip-publish-check', 'Skip the docs-governance publication-branch probe')
      .option('--mutation-baseline <path>', 'Mutation baseline for --only mutation')
      .option('--mutation-current <path>', 'Mutation current report for --only mutation')
      .option('--mutation-thresholds <path>', 'Mutation thresholds for --only mutation')
      .option('--human', 'Human-readable aggregate')
      .action(async (options: CheckCliOptions) => {
        const repoRoot = resolve(options.repoRoot ?? '.');
        try {
          const plan = resolveCheckPlan(repoRoot, {
            ...(options.suite !== undefined && { suite: options.suite }),
            ...(options.only !== undefined && { only: options.only }),
          });
          const executionOptions: CheckExecutionOptions = {
            repoRoot,
            ...(options.schema !== undefined && { schema: options.schema }),
            ...(options.instance !== undefined && { instance: options.instance }),
            ...(options.file !== undefined && { file: options.file }),
            ...(options.witness !== undefined && { witness: options.witness }),
            ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
            ...(options.prBodyFile !== undefined && { prBodyFile: options.prBodyFile }),
            ...(options.optional !== undefined && { optional: options.optional }),
            ...(options.strict !== undefined && { strict: options.strict }),
            ...(options.sinceRef !== undefined && { sinceRef: options.sinceRef }),
            ...(options.maxCommits !== undefined && {
              maxCommits: Number(options.maxCommits),
            }),
            ...(options.skipPublishCheck !== undefined && {
              skipPublishCheck: options.skipPublishCheck,
            }),
            ...(options.mutationBaseline !== undefined && {
              mutationBaseline: options.mutationBaseline,
            }),
            ...(options.mutationCurrent !== undefined && {
              mutationCurrent: options.mutationCurrent,
            }),
            ...(options.mutationThresholds !== undefined && {
              mutationThresholds: options.mutationThresholds,
            }),
          };
          const report = await runCheckPlan(plan, (member) =>
            executeCheckMember(member, executionOptions),
          );
          const machineResult =
            report.selection.kind === 'only' && report.results[0]?.value !== undefined
              ? report.results[0].value
              : report;
          process.stdout.write(
            options.human === true ? renderHuman(report) : `${JSON.stringify(machineResult)}\n`,
          );
          process.exitCode = report.exit_code;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          process.stderr.write(`devai check: ${message}\n`);
          process.exitCode =
            message.startsWith('CHECK_SUITE_UNKNOWN') ||
            message.startsWith('CHECK_MEMBER_UNKNOWN') ||
            message.startsWith('CHECK_SELECTION_CONFLICT')
              ? EXIT_USAGE
              : EXIT_FAIL;
        }
      });
  },
});
