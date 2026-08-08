// Invariants: INV-DEVAI-001, INV-DEVAI-008
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const CI_WORKFLOW = join(ROOT, '.github/workflows/ci.yml');
const CLOSE_POLICY = join(ROOT, 'law/policy/round-close-controls.json');
const PLAN_EXECUTOR = join(ROOT, 'scripts/r7-ci-execute-plan.mjs');

interface Workflow {
  readonly on?: Record<string, unknown>;
  readonly jobs: Record<string, { steps?: Array<{ run?: string }> }>;
}

interface ClosePolicy {
  readonly convergence: {
    readonly commands: Array<{ readonly id: string; readonly argv: readonly string[] }>;
  };
}

function workflow(): Workflow {
  return parse(readFileSync(CI_WORKFLOW, 'utf8')) as Workflow;
}

function closeCommands(): ClosePolicy['convergence']['commands'] {
  return (JSON.parse(readFileSync(CLOSE_POLICY, 'utf8')) as ClosePolicy).convergence.commands;
}

function workflowCommands(ci: Workflow): string[] {
  return Object.values(ci.jobs).flatMap((job) =>
    (job.steps ?? []).flatMap((step) => (step.run === undefined ? [] : [step.run])),
  );
}

describe('required automatic workflow gates', () => {
  it('runs strict governance checks on pull requests through the fail-closed executor', () => {
    const ci = workflow();
    expect(ci.on).toHaveProperty('pull_request');
    expect(workflowCommands(ci).some((command) => command.includes('r7-ci-execute-plan.mjs'))).toBe(
      true,
    );
    expect(closeCommands().map(({ id, argv }) => ({ id, argv }))).toContainEqual({
      id: 'governance',
      argv: ['pnpm', 'run', 'ci:governance'],
    });
    const executor = readFileSync(PLAN_EXECUTOR, 'utf8');
    expect(executor).toContain('if (!explicitlyActive)');
    expect(executor).toContain('effectiveCommands = coldCommands.map');
  });

  it('retains the complete T4-T6 population in the automatic inactive fallback', () => {
    const commands = closeCommands();
    expect(
      commands
        .filter((command) => ['t4', 't5', 't6'].includes(command.id))
        .map(({ id, argv }) => ({ id, argv })),
    ).toEqual([
      { id: 't4', argv: ['pnpm', 'run', 'test:t4'] },
      { id: 't5', argv: ['pnpm', 'run', 'test:t5'] },
      { id: 't6', argv: ['pnpm', 'run', 'test:t6'] },
    ]);
  });
});
