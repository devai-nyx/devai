import type { CAC } from 'cac';
import {
  archiveImmutability,
  decisionCitationResolution,
  decisionRecordIntegrity,
  roundRecordIntegrity,
  type GovernanceIntegrityReport,
} from '#core-compat';
import { buildSensorReading, type SensorFinding, type SensorKind } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly human?: boolean;
}

type IntegrityCheck = (options: { readonly repoRoot: string }) => GovernanceIntegrityReport;
type GovernanceSensorName =
  | 'archive-immutability'
  | 'decision-citation-resolution'
  | 'decision-record-integrity'
  | 'round-record-integrity';

const READING_KIND: Readonly<Record<GovernanceSensorName, SensorKind>> = {
  'archive-immutability': 'archive_immutability',
  'decision-citation-resolution': 'decision_citation_resolution',
  'decision-record-integrity': 'decision_record_integrity',
  'round-record-integrity': 'round_record_integrity',
};

function command(name: GovernanceSensorName, check: IntegrityCheck) {
  return defineCommand({
    name: `sense ${name}`,
    description: `Validate ${name.replaceAll('-', ' ')} and emit a deterministic contract_validation SensorReading.`,
    authority: 'sensor',
    register(cli: CAC): void {
      cli
        .command(`sense-${name}`, `Validate ${name.replaceAll('-', ' ')}`)
        .option('--repo-root <path>', `Repository root (default: ${DEFAULT_REPO_ROOT})`)
        .option('--human', 'Human-readable summary')
        .action((options: Options) => {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const report = check({ repoRoot });
          const findings: SensorFinding[] = report.findings.map((finding) => ({
            severity: 'error',
            code: finding.code,
            message: finding.message,
            ...(finding.path === undefined ? {} : { file: finding.path }),
          }));
          finishSenseCommand(
            buildSensorReading({
              sensorName: name.replaceAll('-', '_'),
              sensorKind: READING_KIND[name],
              command: ['devai', 'sense', ...name.split('-')],
              status: report.ok ? 'pass' : 'fail',
              deterministic: true,
              tier: 'L0',
              findings,
              metrics: { finding_count: findings.length },
            }),
            { repoRoot, human: options.human },
          );
        });
    },
  });
}

export const senseDecisionRecordIntegrityCmd = command(
  'decision-record-integrity',
  decisionRecordIntegrity,
);
export const senseDecisionCitationResolutionCmd = command(
  'decision-citation-resolution',
  decisionCitationResolution,
);
export const senseArchiveImmutabilityCmd = command('archive-immutability', archiveImmutability);
export const senseRoundRecordIntegrityCmd = command('round-record-integrity', roundRecordIntegrity);
