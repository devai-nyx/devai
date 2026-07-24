import { join } from 'node:path';
import { appendRecord, loadChain, type EvidenceArtifact } from './chain.js';
import { deriveEvidenceId } from './id-generator.js';
import { gatherGitContext } from './git-context.js';

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
  if (inputs.automatic === true && process.env['DEVAI_EVIDENCE_AUTOCHAIN'] === '0') {
    return { ok: true };
  }
  const chainPath = inputs.chainPath ?? join(inputs.repoRoot, 'record/proofs/chain.json');
  try {
    const chain = loadChain(chainPath);
    const timestamp = new Date().toISOString();
    const gitCtx = gatherGitContext(inputs.repoRoot);
    const artifacts = [...(inputs.artifacts ?? [])];
    const id = deriveEvidenceId({
      timestamp,
      actor: VERB_EVIDENCE_ACTOR,
      actor_role: 'harness',
      action: inputs.action,
      status: inputs.status,
      git_head_sha: gitCtx.head_sha,
      artifact_sha256s: artifacts.map((a) => a.sha256),
      previous_run_hash: chain.head,
    });
    const record = appendRecord(chainPath, {
      id,
      timestamp,
      actor: VERB_EVIDENCE_ACTOR,
      actor_role: 'harness',
      action: inputs.action,
      status: inputs.status,
      context: { repo_root: inputs.repoRoot, git: gitCtx },
      artifacts,
      ...(inputs.notes !== undefined && inputs.notes.length > 0 && { notes: [...inputs.notes] }),
    });
    return { ok: true, id: record.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
