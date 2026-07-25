import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ThresholdPolicy {
  readonly freshness?: {
    readonly scorecard_failure_max_age_hours?: unknown;
  };
}

/**
 * Resolve DII-103's Architect-owned stale-failure boundary. Missing policy is
 * tolerated for pre-R-0002 adopters; a present but malformed value fails
 * closed instead of silently reverting to caller-selected behavior.
 */
export function loadScorecardFailureMaxAgeMs(repoRoot: string): number | undefined {
  const policyPath = join(repoRoot, '.devai/config/thresholds.json');
  if (!existsSync(policyPath)) return undefined;
  const parsed = JSON.parse(readFileSync(policyPath, 'utf8')) as ThresholdPolicy;
  const hours = parsed.freshness?.scorecard_failure_max_age_hours;
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0) {
    throw new Error(
      'thresholds.json freshness.scorecard_failure_max_age_hours must be a positive number',
    );
  }
  return hours * 60 * 60 * 1000;
}
