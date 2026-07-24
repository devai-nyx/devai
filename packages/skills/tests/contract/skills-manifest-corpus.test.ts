// R20.W1 matrix row 2 — manifest-corpus parity (D-137 v2).
import { describe, expect, it } from 'vitest';
import { listSkills } from '../../src/skills/index.js';
import { baseline, canonical } from './r20-harness.js';
import { loadSpecs } from './r20-skill-runner.js';

describe('R20 baseline: 52-skill manifest corpus', () => {
  it('listSkills() canonical JSON is byte-identical to the baseline (count, order, every field)', () => {
    const historicalIds = new Set(loadSpecs().map((spec) => spec.skill_id));
    const skills = listSkills().filter((skill) => historicalIds.has(skill.id));
    expect(skills).toHaveLength(52);
    // Registry order is part of the contract — capture both the ordered id
    // list and the full canonicalized manifests.
    const current = canonical({
      order: skills.map((s) => s.id),
      manifests: skills,
    });
    const { expected } = baseline('manifest-corpus.json', current);
    expect(current).toBe(expected);
  });
});

// Invariants: INV-DEVAI-001, INV-DEVAI-010
