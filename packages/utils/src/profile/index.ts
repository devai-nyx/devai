import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Adoption profiles (D-112; governance-roadmap item 5).
 *
 * A profile is a floor declaration, not a cage: no tool is disabled
 * by a lower tier; obligations above the declared floor run in
 * advisory mode (doctor marks above-tier checks advisory, score
 * compute suspends gating below tier3). Absent profile = tier3 —
 * every pre-profile adopter ran the full loop, and that stays true
 * without edits.
 */

export type AdoptionProfile = 'tier1' | 'tier2' | 'tier3';

export const ADOPTION_PROFILES: readonly AdoptionProfile[] = ['tier1', 'tier2', 'tier3'];

const ORDER: Readonly<Record<AdoptionProfile, number>> = { tier1: 1, tier2: 2, tier3: 3 };

export function isAdoptionProfile(v: unknown): v is AdoptionProfile {
  return typeof v === 'string' && (ADOPTION_PROFILES as readonly string[]).includes(v);
}

/** declared >= required */
export function profileAtLeast(declared: AdoptionProfile, required: AdoptionProfile): boolean {
  return ORDER[declared] >= ORDER[required];
}

/**
 * Read the declared profile from .devai/config/project.json. Absent
 * file, unparseable file, or absent/invalid key all resolve to tier3
 * (the back-compat default, locked by D-112) — a broken config must
 * never silently weaken gating below what an undeclared repo gets.
 */
export function readProfile(repoRoot: string): AdoptionProfile {
  const path = join(repoRoot, '.devai/config/project.json');
  if (!existsSync(path)) return 'tier3';
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { profile?: unknown };
    return isAdoptionProfile(parsed.profile) ? parsed.profile : 'tier3';
  } catch {
    return 'tier3';
  }
}

export interface ChecklistStep {
  readonly step: string;
  readonly detail: string;
}

const TIER2_STEPS: readonly ChecklistStep[] = [
  {
    step: 'Author your first invariants',
    detail:
      'Start from `devai inventory suggest --from-inventory` (brownfield) or the law-pack seeds via `devai adopt pack graduate` (greenfield); canonical invariants live under law/invariants/.',
  },
  {
    step: 'Create trace.json',
    detail:
      'Map each invariant to its authority docs, tests, and code areas at law/trace.json (Constitution Article 13).',
  },
  {
    step: 'Turn on spec validation',
    detail: '`devai spec validate all` green becomes a binding gate; wire it into CI.',
  },
  {
    step: 'Enable test-weakening checks',
    detail:
      '`devai sense test weakening` per commit touching tests (Constitution Article 30); thresholds in .devai/config/thresholds.json.',
  },
  {
    step: 'Run the deterministic sensor battery',
    detail:
      'The `devai sense *` L0/L1 sensors emit SensorReadings; `devai govern score compute` renders the scorecard (advisory at tier2).',
  },
];

const TIER3_STEPS: readonly ChecklistStep[] = [
  {
    step: 'Configure an LLM backend for the soft gate',
    detail:
      '`devai doctor` must show a usable bridge; soft-gate evaluation uses a model distinct from the working agent (Constitution Article 18).',
  },
  {
    step: 'Make the scorecard gate merges',
    detail:
      'Flip profile to tier3; `devai govern score compute` exit codes become binding (Article 17 + 18 thresholds).',
  },
  {
    step: 'Adopt the loop machinery',
    detail:
      'Triage at loop entry (Article 15), coupled triplets (Article 24), module locks + worktrees (Articles 25–27), `devai experimental loop run`.',
  },
  {
    step: 'Read the role walkthroughs',
    detail: 'docs/roles/ — the five-role discipline becomes operational at tier3.',
  },
];

/**
 * The climb checklist between two profiles. Steps are cumulative:
 * tier1 → tier3 includes both legs. Same-or-downward target returns
 * an empty list (downgrades are a human edit, not a checklist).
 */
export function upgradeChecklist(from: AdoptionProfile, to: AdoptionProfile): ChecklistStep[] {
  const steps: ChecklistStep[] = [];
  if (ORDER[to] <= ORDER[from]) return steps;
  if (ORDER[from] < 2 && ORDER[to] >= 2) steps.push(...TIER2_STEPS);
  if (ORDER[from] < 3 && ORDER[to] >= 3) steps.push(...TIER3_STEPS);
  return steps;
}
