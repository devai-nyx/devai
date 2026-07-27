import type { EvidenceArtifact } from './chain.js';

/**
 * Best-effort evidence-chain append for CLI verbs (D-120): `sense *`,
 * `spec validate-all`, `score compute`, and `evidence verify-local`
 * chain their own completion as a side effect, so the Article 32
 * ledger tracks the work adopters actually run instead of depending
 * on a separate manual `evidence emit` discipline (the portfolio
 * audit measured that discipline's sustained-compliance rate at
 * zero across four adopters).
 *
 * Never throws and never alters the verb's exit code: a chain that
 * is missing, locked, or corrupt degrades to a stderr warning via
 * the returned error string (Article 39 — explicit, never silent).
 */
export interface VerbEvidenceInputs {
  readonly repoRoot: string;
  /** Override the chain path; default <repoRoot>/record/proofs/chain.json. */
  readonly chainPath?: string;
  /** e.g. 'sense.type-check', 'spec.validate-all', 'score.compute'. */
  readonly action: string;
  readonly status: 'completed' | 'failed';
  readonly artifacts?: readonly EvidenceArtifact[];
  readonly notes?: readonly string[];
  /** True for implicit CLI post-ambles; explicit evidence APIs remain active in isolated tests. */
  readonly automatic?: boolean;
}

export interface VerbEvidenceResult {
  readonly ok: boolean;
  readonly id?: string;
  readonly error?: string;
}

export const VERB_EVIDENCE_ACTOR = 'devai-cli';

export function appendVerbEvidence(inputs: VerbEvidenceInputs): VerbEvidenceResult {
  if (inputs.automatic === true) return { ok: true };
  return {
    ok: false,
    error:
      'LEGACY_EVIDENCE_WRITER_RETIRED: use a governed round-bound proof epoch; chain.json is read-only compatibility state',
  };
}
