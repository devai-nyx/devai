// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadScorecardFailureMaxAgeMs } from '../../src/scorecard/freshness-policy.js';

const roots: string[] = [];

function fixture(canonicalHours: number, materializedHours: number): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-freshness-policy-'));
  roots.push(root);
  mkdirSync(join(root, 'law/policy'), { recursive: true });
  mkdirSync(join(root, '.devai/config'), { recursive: true });
  const policy = (hours: number) =>
    `${JSON.stringify({ freshness: { scorecard_failure_max_age_hours: hours } }, null, 2)}\n`;
  writeFileSync(join(root, 'law/policy/thresholds.json'), policy(canonicalHours));
  writeFileSync(join(root, '.devai/config/thresholds.json'), policy(materializedHours));
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('scorecard freshness policy', () => {
  it('loads canonical Architect policy and rejects a divergent materialization', () => {
    expect(() => loadScorecardFailureMaxAgeMs(fixture(24, 0.0001))).toThrow(/diverge/i);
  });

  it('rejects an arbitrarily small positive freshness window', () => {
    expect(() => loadScorecardFailureMaxAgeMs(fixture(0.0001, 0.0001))).toThrow(/at least/i);
  });
});
