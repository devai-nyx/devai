import { mkdirSync, writeFileSync } from '@devai-nyx/authority';
import { join } from 'node:path';
import type { SkillEntry, SkillManifest, SkillResult } from './types.js';

export interface SkillRegistry {
  readonly listSkills: () => readonly SkillManifest[];
  readonly getSkill: (id: string) => SkillEntry | null;
}

/**
 * Build the public registry accessors over the canonical ordered entry list.
 * The factory keeps the W2 intermediate graph acyclic while skill entries are
 * still declared in index.ts; slice 8 moves the final wiring behind the façade.
 */
export function createSkillRegistry(skills: readonly SkillEntry[]): SkillRegistry {
  return {
    listSkills: () => skills.map((skill) => skill.manifest),
    getSkill: (id) => skills.find((skill) => skill.manifest.id === id) ?? null,
  };
}

/** Persist a skill's evidence to record/proofs/work/skill-runs/<skill-id>/<timestamp>.json. */
export function persistSkillEvidence(opts: { repoRoot: string; result: SkillResult }): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = join(opts.repoRoot, `record/proofs/work/skill-runs/${opts.result.skill_id}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${stamp}.json`);
  writeFileSync(path, JSON.stringify(opts.result, null, 2) + '\n');
  return path;
}
