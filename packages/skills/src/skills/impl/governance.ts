import {
  archiveGovernedRound,
  scaffoldDecisionRecord,
  scaffoldGovernedRound,
} from '@devai-nyx/loop';
import type { SkillEntry } from '../types.js';

function roundInput(inputs: Readonly<Record<string, unknown>> | undefined): string | number {
  const value = inputs?.['round_n'] ?? inputs?.['round'];
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('ROUND_INPUT_REQUIRED');
  }
  return value;
}

export const governanceSkills: readonly SkillEntry[] = [
  {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-scaffold',
      title: 'Scaffold governed round',
      version: '1.0.0',
      summary:
        'Create the deterministic Plan, inputs, audit, and prompt skeleton for one local governed round.',
      lifecycle: 'supported',
      lifecycle_reason: 'D-194 supported deterministic round lifecycle.',
      promotion_criteria: [],
      kind: 'template',
      authority_role: 'architect',
      deterministic: true,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: ['work/rounds/R-*/**', 'record/proofs/work/skill-runs/**'],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-scaffold/*.json'],
      risk_level: 'low',
      tags: ['round', 'scaffold', 'governance-ledger', 'supported'],
      entry: 'devai agent skill run SKILL-round-scaffold',
      family: 'scaffolder',
    },
    async run(ctx) {
      const result = scaffoldGovernedRound({
        repoRoot: ctx.repoRoot,
        round: roundInput(ctx.inputs),
      });
      return {
        skill_id: 'SKILL-round-scaffold',
        status: 'pass',
        evidence: result,
      };
    },
  },
  {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-round-archive',
      title: 'Archive governed round',
      version: '1.0.0',
      summary:
        'Run the fail-closed governed round archive transition and preserve the complete attributed workspace.',
      lifecycle: 'supported',
      lifecycle_reason: 'D-194 supported deterministic close ceremony.',
      promotion_criteria: [],
      kind: 'workflow',
      authority_role: 'architect',
      deterministic: true,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: [
        'work/rounds/R-*/**',
        'work/rounds/archive/**',
        'record/proofs/work/skill-runs/**',
      ],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-round-archive/*.json'],
      risk_level: 'medium',
      tags: ['round', 'archive', 'governance-ledger', 'supported'],
      entry: 'devai agent skill run SKILL-round-archive',
      family: 'cycle-driver',
      cycle_level: 'round',
      cycle_role: 'verify-publish',
    },
    async run(ctx) {
      const result = archiveGovernedRound({
        repoRoot: ctx.repoRoot,
        round: roundInput(ctx.inputs),
      });
      return {
        skill_id: 'SKILL-round-archive',
        status: 'pass',
        evidence: result,
      };
    },
  },
  {
    manifest: {
      schemaVersion: '1.0.0',
      id: 'SKILL-adr-new',
      title: 'Scaffold governance decision record',
      version: '1.0.0',
      summary:
        'Create the next collision-free proposed D-record under the canonical governance record family.',
      lifecycle: 'supported',
      lifecycle_reason: 'D-194 public per-record governance canon.',
      promotion_criteria: [],
      kind: 'template',
      authority_role: 'architect',
      deterministic: true,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: ['law/adr/D-*.md', 'record/proofs/work/skill-runs/**'],
      evidence_files: ['record/proofs/work/skill-runs/SKILL-adr-new/*.json'],
      risk_level: 'low',
      tags: ['decision', 'adr', 'scaffold', 'governance-ledger', 'supported'],
      entry: 'devai agent skill run SKILL-adr-new',
      family: 'scaffolder',
    },
    async run(ctx) {
      const result = scaffoldDecisionRecord({
        repoRoot: ctx.repoRoot,
        ...(typeof ctx.inputs?.['title'] === 'string' ? { title: ctx.inputs['title'] } : {}),
        ...(typeof ctx.inputs?.['round'] === 'string' ? { round: ctx.inputs['round'] } : {}),
        ...(ctx.timestamp !== undefined ? { now: ctx.timestamp } : {}),
      });
      return {
        skill_id: 'SKILL-adr-new',
        status: 'pass',
        evidence: result,
      };
    },
  },
];
