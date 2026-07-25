// Invariants: INV-DEVAI-001, INV-DEVAI-008
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

describe('required automatic workflow gates', () => {
  it('runs strict governance checks on pull requests', () => {
    const ci = parse(readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8')) as {
      jobs: Record<string, { steps?: Array<{ run?: string }> }>;
    };
    const commands = Object.values(ci.jobs).flatMap((job) =>
      (job.steps ?? []).flatMap((step) => (step.run === undefined ? [] : [step.run])),
    );
    expect(commands).toContain('pnpm run ci:governance');
  });

  it('calls the complete T4-T6 round-gates workflow automatically', () => {
    const ci = parse(readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8')) as {
      jobs: Record<string, { uses?: string }>;
    };
    expect(
      Object.values(ci.jobs).some((job) => job.uses === './.github/workflows/round-gates.yml'),
    ).toBe(true);
  });
});
