import { minimatch } from 'minimatch';
import type { SkillEntry } from '../types.js';
import { createSkillRegistry } from '../registry.js';
import { coreSkills } from './core.js';
import { createFixSkills } from './fixes.js';
import { createRoundSkills } from './round.js';
import { scaffolderSkills } from './scaffolders.js';
import { writerSkills } from './writers.js';

const initialSkills: readonly SkillEntry[] = [...coreSkills, ...writerSkills, ...scaffolderSkills];

let resolvedSkills: readonly SkillEntry[] = initialSkills;

const fixSkills = createFixSkills(() => resolvedSkills);

const baseSkills: readonly SkillEntry[] = [...initialSkills, ...fixSkills];

resolvedSkills = baseSkills;

const resolveSkill = (skillId: string): SkillEntry | null =>
  resolvedSkills.find((skill) => skill.manifest.id === skillId) ?? null;

const roundSkills = createRoundSkills(resolveSkill);

resolvedSkills = Object.freeze([...baseSkills, ...roundSkills]);

export const SKILLS: readonly SkillEntry[] = resolvedSkills;

/**
 * Fail-closed tool-layer check for one skill-owned filesystem target.
 * Constitutional policy remains authoritative; this narrower manifest check
 * prevents the generic `agent skill run` action from borrowing another
 * same-role skill's path allowance.
 */
export function skillAllowsWritePath(id: string, canonicalRelativePath: string): boolean {
  const skill = resolveSkill(id);
  if (skill === null) return false;
  return skill.manifest.allowed_write_scopes.some((scope) => {
    const normalized = scope.replaceAll('\\', '/').replace(/\/$/u, '');
    const subtreeRoot = normalized.endsWith('/**') ? normalized.slice(0, -3) : undefined;
    return (
      canonicalRelativePath === normalized ||
      (subtreeRoot !== undefined &&
        (canonicalRelativePath === subtreeRoot ||
          minimatch(canonicalRelativePath, subtreeRoot, { dot: true, nocase: false }))) ||
      minimatch(canonicalRelativePath, normalized, { dot: true, nocase: false })
    );
  });
}

export const { listSkills, getSkill } = createSkillRegistry(SKILLS);
