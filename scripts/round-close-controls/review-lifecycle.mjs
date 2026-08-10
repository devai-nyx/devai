#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import {
  authenticateCandidateProofV4,
  candidateDigestForPaths,
  candidateTreeEntries,
  entryReadinessV9,
  loadV4Context,
  makeReviewTopicsV4,
  readJsonPrecisely,
  resolveConsumerCandidateV8,
  resolveExactCandidateV6,
  resolveTopicEvidenceV6,
  reviewerBindingV4,
  selfDigestValid,
  topicEvidenceManifestV4,
  topicTaskKeysV4,
  validateClaimsV4,
  withSelfDigest,
  writeBytesAtomic,
  writeJsonAtomic,
} from './governed.mjs';
import {
  expandBraceSelectors,
  statusAwareChangedPaths,
  v3CachePath,
  validateDocument,
} from './impact.mjs';
import {
  SHA256,
  canonical,
  capability,
  edgeCycleV7,
  emit,
  emittedSequenceV7,
  finding,
  git,
  gitBytes,
  gitResult,
  option,
  pathsForGlobs,
  readJson,
  repoRoot,
  sha256,
} from './runtime.mjs';

export const CONTROL_CONCERN = 'review-lifecycle';

export function transitionV4(from, to, proof, links = {}) {
  return withSelfDigest(
    {
      from,
      to,
      candidate_sha: proof.manifest.candidate_sha,
      candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
      review_scope_digest: links.review_scope_digest ?? null,
      review_result_digest: links.review_result_digest ?? null,
      transport_digest: links.transport_digest ?? null,
      repair_evidence_digest: links.repair_evidence_digest ?? null,
      previous_state_digest: links.previous_state_digest ?? null,
    },
    'transition_digest_sha256',
  );
}

export function persistedReviewArtifactDigestV7(artifact, selfDigestField) {
  if (!selfDigestValid(artifact, selfDigestField)) return null;
  return artifact[selfDigestField];
}

export function validateTransitionEdgeV6(context, transition, index, prior, findings) {
  const allowed = context.policy.review_state_machine?.allowed_transitions?.[transition.from] ?? [];
  if (!allowed.includes(transition.to) || (prior !== null && transition.from !== prior.to))
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_EDGE_INVALID',
        'transition edge is absent from the policy graph or skips its predecessor',
        { ordinal: index + 1 },
      ),
    );
  if (
    prior !== null &&
    (persistedReviewArtifactDigestV7(prior, 'transition_digest_sha256') === null ||
      transition.previous_transition_digest !== prior.transition_digest_sha256)
  )
    findings.push(
      finding(
        'REVIEW_STATE_PREDECESSOR_STATE_INVALID',
        'transition does not bind the exact persisted predecessor transition artifact',
        { ordinal: index + 1 },
      ),
    );
  const expectedCycle = edgeCycleV7(context.policy, transition.from, transition.to);
  if (transition.cycle !== expectedCycle)
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_CYCLE_INVALID',
        'transition cycle differs from its declared state-machine edge',
        { ordinal: index + 1 },
      ),
    );
  if (index === 0) {
    if (transition.from !== 'DRAFT' || transition.previous_state_digest !== null)
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_STATE_INVALID',
          'first transition must begin at DRAFT without predecessor state',
        ),
      );
  } else {
    // Per DII-253 no edge is exempt. The preflight, freeze and activation transitions used
    // to be emitted as one burst persisted once, and the four boundaries that produced were
    // allowed through with a null predecessor by a hard-coded set of edge literals. That
    // contradicted OM-017, the declaration canonical_history.first_predecessor
    // null-only-for-DRAFT-origin, and the declared capability
    // predecessor_artifact_authentication. review-scope now persists the state at each
    // boundary, so every non-initial edge has a predecessor artifact to corroborate and the
    // exemption has nothing left to excuse.
    //
    // Per DII-252, the predecessor identity is the predecessor artifact self-digest,
    // corroborated rather than recomputed from a private field selection. A derivation
    // only the producing implementation can reproduce is not independently checkable.
    const claimed = transition.previous_state_digest;
    const retainedPath = join(
      dirname(join(repoRoot, context.profile.runtime.review_state)),
      'review-states',
      `${String(claimed)}.json`,
    );
    const retained =
      typeof claimed === 'string' && SHA256.test(claimed) && existsSync(retainedPath)
        ? readJson(retainedPath)
        : null;
    // A missing artifact is not corroboration. Accepting null here would let any
    // well-formed digest pass unchallenged, which is the appearance of authentication.
    const corroborated =
      typeof claimed === 'string' &&
      SHA256.test(claimed) &&
      retained !== null &&
      selfDigestValid(retained, 'state_digest_sha256') &&
      retained.state_digest_sha256 === claimed &&
      transition.previous_state_artifact?.state_path === relative(repoRoot, retainedPath) &&
      transition.previous_state_artifact?.artifact_digest_sha256 === claimed &&
      transition.previous_state_artifact?.canonicalization === 'stable-json-minus-self-digest';
    if (!corroborated)
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_STATE_INVALID',
          'transition predecessor identity is absent or contradicts its retained artifact',
          { ordinal: index + 1 },
        ),
      );
  }
}

export function reauthenticateTransportV6(
  context,
  state,
  scope,
  transport,
  attempt,
  previous,
  findings,
  expected = null,
) {
  const identity = {
    round: state.round,
    cycle: state.cycle,
    candidate_sha: state.candidate_sha,
    candidate_tree: state.tree_sha,
    policy_digest: state.policy_digest,
    profile_digest: state.profile_digest,
    candidate_manifest_digest: state.candidate_manifest_digest,
    review_scope_digest: state.review_scope_digest,
    scope_identity_digest: scope?.identity_proof?.identity_digest_sha256,
    reviewer_binding_digest: state.reviewer_binding_digest,
    active_control_census_digest: state.active_control_census_digest,
  };
  const invalid =
    !validateDocument(
      transport,
      context.policy.schemas.review_transport,
      findings,
      'REVIEW_TRANSPORT_CHAIN_INVALID',
      'review transport',
    ) ||
    !selfDigestValid(transport, 'transport_digest_sha256') ||
    transport.attempt !== attempt ||
    transport.previous_transport_digest !== previous ||
    Object.entries(identity).some(([field, value]) => transport[field] !== value) ||
    (expected !== null &&
      Object.entries(expected).some(([field, value]) => transport[field] !== value)) ||
    !SHA256.test(transport.state_before_digest ?? '');
  if (invalid)
    findings.push(
      finding(
        'REVIEW_TRANSPORT_CHAIN_INVALID',
        'persisted transport does not authenticate its complete attempt identity',
        { attempt },
      ),
    );
  return !invalid;
}

export function reauthenticateReviewResultV6(context, state, scope, result, findings) {
  const topicMap = new Map((scope?.topics ?? []).map((topic) => [topic.topic_id, topic]));
  const seen = new Set();
  for (const disposition of result.dispositions ?? []) {
    const topic = topicMap.get(disposition.topic_id);
    if (topic === undefined || seen.has(disposition.topic_id))
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_COUNTS_INVALID',
          'persisted result has an unknown or duplicated topic',
          { topic_id: disposition.topic_id },
        ),
      );
    else {
      const inputs = disposition.recomputed_inputs_manifest ?? [];
      const evidence = disposition.recomputed_evidence_manifest ?? [];
      const evidenceRefs = evidence.map(({ ref }) => ref);
      const taskFreshness = disposition.recomputed_task_freshness_manifest ?? [];
      const taskKeys = taskFreshness.map(({ task_key }) => task_key);
      const proofBody = {
        topic_id: topic.topic_id,
        disposition: disposition.disposition,
        recomputed_digest: topic.current_digest,
        recomputed_inputs_manifest: inputs,
        recomputed_evidence_manifest: evidence,
        recomputed_evidence_digest: sha256(canonical(evidence)),
        recomputed_evidence_refs_digest: sha256(canonical(evidenceRefs)),
        recomputed_task_keys: taskKeys,
        recomputed_task_freshness_manifest: taskFreshness,
        evidence_refs: evidenceRefs,
      };
      if (
        !topic.allowed_dispositions.includes(disposition.disposition) ||
        disposition.recomputed_digest !== topic.current_digest ||
        !Array.isArray(disposition.recomputed_inputs_manifest) ||
        disposition.recomputed_inputs_manifest.length === 0 ||
        !Array.isArray(disposition.recomputed_evidence_manifest) ||
        disposition.recomputed_evidence_manifest.length === 0 ||
        canonical(disposition.evidence_refs) !== canonical(evidenceRefs) ||
        disposition.recomputed_evidence_digest !== sha256(canonical(evidence)) ||
        disposition.recomputed_evidence_refs_digest !== sha256(canonical(evidenceRefs)) ||
        canonical(disposition.recomputed_task_keys) !== canonical(taskKeys) ||
        disposition.proof_digest_sha256 !== sha256(canonical(proofBody))
      )
        findings.push(
          finding(
            'REVIEW_STATE_RESULT_PROOF_INVALID',
            'persisted topic proof cannot be independently reconstructed',
            { topic_id: disposition.topic_id },
          ),
        );
    }
    seen.add(disposition.topic_id);
  }
  if ([...topicMap.keys()].some((id) => !seen.has(id)))
    findings.push(
      finding('REVIEW_STATE_RESULT_COUNTS_INVALID', 'persisted result omits review topics'),
    );
  const findingMap = new Map();
  for (const entry of result.findings ?? []) {
    if (findingMap.has(entry.finding_id))
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_FINDING_INVALID',
          'persisted finding identifiers are duplicated',
          { finding_id: entry.finding_id },
        ),
      );
    findingMap.set(entry.finding_id, entry);
    if (
      typeof entry.defect_class_id !== 'string' ||
      entry.defect_class_id.length === 0 ||
      typeof entry.population_query !== 'string' ||
      entry.population_query.length === 0 ||
      !Array.isArray(entry.affected_instances) ||
      entry.affected_instances.length === 0 ||
      typeof entry.repair_acceptance !== 'string' ||
      entry.repair_acceptance.length === 0 ||
      !Array.isArray(entry.topic_ids) ||
      entry.topic_ids.length === 0
    )
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_FINDING_INVALID',
          'persisted finding lacks its complete-class population proof',
          { finding_id: entry.finding_id },
        ),
      );
  }
  for (const disposition of result.dispositions ?? [])
    for (const findingId of disposition.finding_ids ?? []) {
      const entry = findingMap.get(findingId);
      if (entry === undefined || !(entry.topic_ids ?? []).includes(disposition.topic_id))
        findings.push(
          finding(
            'REVIEW_STATE_RESULT_FINDING_LINK_INVALID',
            'persisted disposition finding link is not reciprocal',
            { topic_id: disposition.topic_id, finding_id: findingId },
          ),
        );
    }
  for (const entry of result.findings ?? [])
    for (const topicId of entry.topic_ids ?? []) {
      const disposition = (result.dispositions ?? []).find(({ topic_id }) => topic_id === topicId);
      if (disposition === undefined || !(disposition.finding_ids ?? []).includes(entry.finding_id))
        findings.push(
          finding(
            'REVIEW_STATE_RESULT_FINDING_LINK_INVALID',
            'persisted finding topic link is not reciprocal',
            { topic_id: topicId, finding_id: entry.finding_id },
          ),
        );
    }
  const counts = Object.fromEntries(
    ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'].map((name) => [
      name,
      (result.dispositions ?? []).filter(({ disposition }) => disposition === name).length,
    ]),
  );
  const identityValid =
    result.round === state.round &&
    result.cycle === state.cycle &&
    result.review_candidate === state.candidate_sha &&
    result.manifest_digest === state.review_scope_digest &&
    result.scope_identity_digest === scope?.identity_proof?.identity_digest_sha256 &&
    result.policy_digest === state.policy_digest &&
    result.candidate_manifest_digest === state.candidate_manifest_digest &&
    result.reviewer_binding_digest === state.reviewer_binding_digest &&
    result.active_control_census_digest === state.active_control_census_digest;
  if (!identityValid)
    findings.push(
      finding('REVIEW_STATE_RESULT_IDENTITY_INVALID', 'persisted review result identity is stale'),
    );
  if (
    result.terminal?.topic_count !== (scope?.topics ?? []).length ||
    result.terminal?.finding_count !== (result.findings ?? []).length ||
    canonical(result.terminal?.disposition_counts) !== canonical(counts)
  )
    findings.push(
      finding('REVIEW_STATE_RESULT_COUNTS_INVALID', 'persisted review result counts are stale'),
    );
  if (
    result.terminal?.complete !== true ||
    !['PASS', 'FAIL', 'BLOCKED', 'INVALID'].includes(result.terminal?.verdict)
  )
    findings.push(
      finding('REVIEW_STATE_RESULT_TERMINAL_INVALID', 'persisted review terminal is invalid'),
    );
  const hasNonPassing = (result.dispositions ?? []).some(({ disposition }) =>
    ['RECHECKED_FAIL', 'BLOCKED'].includes(disposition),
  );
  const hasFindings = (result.findings ?? []).length > 0;
  if (
    (result.terminal?.verdict === 'PASS' && (hasNonPassing || hasFindings)) ||
    (result.terminal?.verdict === 'FAIL' && !hasNonPassing && !hasFindings)
  )
    findings.push(
      finding(
        'REVIEW_STATE_RESULT_TERMINAL_INVALID',
        'persisted review verdict contradicts its dispositions or findings',
      ),
    );
}

/**
 * Reads the prior failure review result that a repair claims to close. The digest comes
 * from the authenticated state record, so the expected class population is derived from
 * independent evidence rather than from the repair artifact being checked.
 */
export function readPriorFailureResultV9(context, state) {
  const digest = state.prior_failure_result_digest;
  if (typeof digest !== 'string' || !SHA256.test(digest)) return null;
  const resultsRoot = join(
    dirname(join(repoRoot, context.profile.runtime.review_result)),
    'review-results',
  );
  const exact = join(resultsRoot, `${digest}.json`);
  const candidatePaths = [exact, join(repoRoot, context.profile.runtime.review_result)];
  for (const path of candidatePaths) {
    if (!existsSync(path)) continue;
    try {
      const value = readJson(path);
      if (value.result_digest_sha256 === digest) return value;
    } catch {
      // A malformed prior result is reported by the ordinary result authentication.
    }
  }
  return null;
}

export function reauthenticateRepairEvidenceV6(
  context,
  state,
  repair,
  findings,
  expectedClasses = null,
) {
  const schemaValid = validateDocument(
    repair,
    context.policy.schemas.review_repair_evidence,
    findings,
    'REVIEW_STATE_REPAIR_LINK_INVALID',
    'review repair evidence',
  );
  const identityChecks = {
    schema: schemaValid,
    self_digest: selfDigestValid(repair, 'repair_evidence_digest_sha256'),
    evidence_digest: repair.repair_evidence_digest_sha256 === state.repair_evidence_digest,
    result_digest: repair.prior_review_result_digest === state.prior_failure_result_digest,
    failure_state: repair.prior_failure_state_digest === state.prior_failure_state_digest,
    failure_transport:
      repair.prior_failure_transport_digest === state.prior_failure_transport_digest,
    prior_candidate: repair.prior_candidate_sha === state.previous_candidate_sha,
    new_candidate: repair.new_candidate_sha === state.candidate_sha,
    repaired_class_population:
      expectedClasses === null ||
      JSON.stringify(
        [...(repair.repaired_classes ?? [])].map(({ defect_class_id }) => defect_class_id).sort(),
      ) === JSON.stringify([...expectedClasses].sort()),
  };
  if (Object.values(identityChecks).some((passed) => !passed))
    findings.push(
      finding(
        'REVIEW_STATE_REPAIR_LINK_INVALID',
        'consumed repair evidence does not authenticate the complete failure chain',
        {
          failed_checks: Object.entries(identityChecks)
            .filter(([, passed]) => !passed)
            .map(([id]) => id),
        },
      ),
    );
}

export function makeReviewStateV4(context, proof, scopeDigest, state, cycle, history, extra = {}) {
  const resolution = reviewerBindingV4(context, proof.manifest.candidate_sha);
  if (context.policy.schemaVersion !== '5.0.0')
    return withSelfDigest(
      {
        schemaVersion: '2.0.0',
        round: context.profile.round,
        state,
        cycle,
        base_sha: proof.manifest.base_sha,
        candidate_sha: proof.manifest.candidate_sha,
        tree_sha: proof.manifest.tree_sha,
        profile_digest: context.digests.profile,
        policy_digest: context.digests.policy,
        candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
        review_scope_digest: scopeDigest,
        reviewer_binding_digest: resolution.selected?.digest,
        transition_history: history,
        transport_attempts: 0,
        ...extra,
      },
      'state_digest_sha256',
    );
  let previousTransitionDigest = null;
  const canonicalHistory = history.map((transition, index) => {
    const transitionCycle = edgeCycleV7(context.policy, transition.from, transition.to);
    // Per DII-253 the caller persists the state at each boundary before emitting the next
    // edge, so a predecessor snapshotted by persistStateV5 exists for every non-initial
    // transition. Binding only a predecessor that has actually been retained is still the
    // rule: an artifact is never invented to make an unauthenticated claim look
    // corroborated. The difference is that the artifact now exists.
    const claimedPredecessorDigest = transition.previous_state_digest ?? null;
    let retainedPredecessor = null;
    if (
      index > 0 &&
      typeof claimedPredecessorDigest === 'string' &&
      SHA256.test(claimedPredecessorDigest)
    ) {
      const currentStatePath = join(repoRoot, context.profile.runtime.review_state);
      const retainedPath = join(
        dirname(currentStatePath),
        'review-states',
        `${claimedPredecessorDigest}.json`,
      );
      if (existsSync(retainedPath)) {
        try {
          const predecessor = readJson(retainedPath);
          if (
            selfDigestValid(predecessor, 'state_digest_sha256') &&
            predecessor.state_digest_sha256 === claimedPredecessorDigest
          )
            retainedPredecessor = {
              state_path: relative(repoRoot, retainedPath),
              state_digest_sha256: claimedPredecessorDigest,
            };
        } catch {
          // Authentication rejects unreadable retained bytes; construction must not
          // replace them with a newly invented artifact.
        }
      }
    }
    const body = {
      from: transition.from,
      to: transition.to,
      ordinal: index + 1,
      cycle: transitionCycle,
      candidate_sha: transition.candidate_sha,
      candidate_manifest_digest: transition.candidate_manifest_digest ?? null,
      review_scope_digest: transition.review_scope_digest ?? null,
      review_result_digest: transition.review_result_digest ?? null,
      transport_digest: transition.transport_digest ?? null,
      repair_evidence_digest: transition.repair_evidence_digest ?? null,
      previous_state_digest: claimedPredecessorDigest,
      previous_state_artifact:
        retainedPredecessor === null
          ? null
          : {
              state_path: retainedPredecessor.state_path,
              artifact_digest_sha256: retainedPredecessor.state_digest_sha256,
              canonicalization: 'stable-json-minus-self-digest',
            },
      previous_transition_digest: previousTransitionDigest,
    };
    const authenticated = withSelfDigest(body, 'transition_digest_sha256');
    previousTransitionDigest = authenticated.transition_digest_sha256;
    return authenticated;
  });
  const body = {
    schemaVersion: '3.0.0',
    round: context.profile.round,
    state,
    cycle,
    base_sha: proof.manifest.base_sha,
    candidate_sha: proof.manifest.candidate_sha,
    tree_sha: proof.manifest.tree_sha,
    profile_digest: context.digests.profile,
    policy_digest: context.digests.policy,
    candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
    review_scope_digest: scopeDigest,
    reviewer_binding_digest: resolution.selected?.digest,
    active_control_census_digest: proof.activeControlCensus?.census_digest_sha256,
    previous_candidate_sha: extra.previous_candidate_sha ?? null,
    prior_failure_result_digest: extra.prior_failure_result_digest ?? null,
    prior_failure_state_digest: extra.prior_failure_state_digest ?? null,
    prior_failure_transport_digest: extra.prior_failure_transport_digest ?? null,
    repair_evidence_digest: extra.repair_evidence_digest ?? null,
    transition_history: canonicalHistory,
    history_digest: sha256(canonical(canonicalHistory)),
    latest_transition_digest: previousTransitionDigest,
    previous_state_digest: extra.previous_state_digest ?? null,
    transport_attempts: extra.transport_attempts ?? 0,
    transport_history_digests: extra.transport_history_digests ?? [],
    current_transport_digest: extra.current_transport_digest ?? null,
    current_review_result_digest: extra.current_review_result_digest ?? null,
  };
  return withSelfDigest(body, 'state_digest_sha256');
}

export function validateRepairEvidenceV4(context, priorState, newProof, findings) {
  const path = join(repoRoot, context.profile.runtime.review_repair_evidence);
  const repair = readJsonPrecisely(
    path,
    'REVIEW_REPAIR_EVIDENCE_MISSING',
    'REVIEW_REPAIR_EVIDENCE_MALFORMED',
    findings,
  );
  if (repair === null) return null;
  const v2IdentityLinkFields = [
    'prior_failure_transition_digest',
    'prior_failure_transport_digest',
    'new_candidate_manifest_digest',
    'repair_state_before_digest',
  ];
  if (
    repair.schemaVersion === '2.0.0' &&
    !v2IdentityLinkFields.every((field) => SHA256.test(repair[field] ?? ''))
  )
    findings.push(
      finding(
        'REVIEW_REPAIR_EVIDENCE_INCOMPLETE',
        'repair evidence lacks its complete authenticated V2 identity-link population',
      ),
    );
  if (
    !validateDocument(
      repair,
      context.policy.schemas.review_repair_evidence,
      findings,
      'REVIEW_REPAIR_EVIDENCE_SCHEMA_INVALID',
      'review repair evidence',
    ) ||
    !selfDigestValid(repair, 'repair_evidence_digest_sha256')
  ) {
    findings.push(
      finding(
        'REVIEW_REPAIR_EVIDENCE_SELF_DIGEST_INVALID',
        'repair evidence self-digest is invalid',
      ),
    );
    return null;
  }
  const priorResultFindings = [];
  const priorResultPath = capability(context, 'exact_prior_result_path')
    ? join(
        dirname(join(repoRoot, context.profile.runtime.review_result)),
        'review-results',
        `${priorState.prior_failure_result_digest}.json`,
      )
    : join(repoRoot, context.profile.runtime.review_result);
  const priorResult = readJsonPrecisely(
    priorResultPath,
    'REVIEW_PRIOR_FAILURE_RESULT_MISSING',
    'REVIEW_PRIOR_FAILURE_RESULT_MALFORMED',
    priorResultFindings,
  );
  findings.push(...priorResultFindings);
  let valid = priorResult !== null;
  if (priorResult !== null) {
    valid =
      validateDocument(
        priorResult,
        context.policy.schemas.review_result,
        findings,
        'REVIEW_PRIOR_FAILURE_RESULT_INVALID',
        'prior failure result',
      ) && valid;
    if (
      !selfDigestValid(priorResult, 'result_digest_sha256') ||
      priorResult.result_digest_sha256 !== priorState.prior_failure_result_digest ||
      priorResult.terminal?.verdict !== 'FAIL'
    )
      valid = false;
  }
  const grouped = new Map();
  for (const entry of priorResult?.findings ?? []) {
    const current = grouped.get(entry.defect_class_id) ?? {
      population_query: entry.population_query,
      affected_instances: [],
    };
    if (current.population_query !== entry.population_query) valid = false;
    current.affected_instances.push(...entry.affected_instances);
    grouped.set(entry.defect_class_id, current);
  }
  const repairedIds = (repair.repaired_classes ?? []).map(({ defect_class_id }) => defect_class_id);
  if (new Set(repairedIds).size !== repairedIds.length) valid = false;
  const repairedMap = new Map(
    (repair.repaired_classes ?? []).map((entry) => [entry.defect_class_id, entry]),
  );
  const expectedV2IdentityLinks = {
    prior_failure_transition_digest: priorState.latest_transition_digest,
    prior_failure_transport_digest: priorState.current_transport_digest,
    new_candidate_manifest_digest: newProof.manifest.manifest_digest_sha256,
    repair_state_before_digest: priorState.state_digest_sha256,
  };
  const v2IdentityLinksValid =
    repair.schemaVersion !== '2.0.0' ||
    Object.entries(expectedV2IdentityLinks).every(
      ([field, expectedDigest]) =>
        SHA256.test(expectedDigest ?? '') && repair[field] === expectedDigest,
    );
  valid =
    repair.prior_candidate_sha === priorState.candidate_sha &&
    repair.prior_candidate_manifest_digest === priorState.candidate_manifest_digest &&
    repair.prior_review_scope_digest === priorState.review_scope_digest &&
    repair.prior_review_result_digest === priorState.prior_failure_result_digest &&
    repair.prior_failure_state_digest === priorState.state_digest_sha256 &&
    repair.new_candidate_sha === newProof.manifest.candidate_sha &&
    repair.new_candidate_sha !== priorState.candidate_sha &&
    v2IdentityLinksValid &&
    canonical([...grouped.keys()].sort()) === canonical([...repairedMap.keys()].sort()) &&
    valid;
  if (
    gitResult(repoRoot, [
      'merge-base',
      '--is-ancestor',
      priorState.candidate_sha,
      repair.new_candidate_sha,
    ]).status !== 0
  )
    valid = false;
  const exactChangedPaths = statusAwareChangedPaths(
    priorState.candidate_sha,
    repair.new_candidate_sha,
  );
  const semanticChangedPaths = exactChangedPaths.filter((changedPath) => {
    try {
      const persistedTransport = JSON.parse(
        git(repoRoot, ['show', `${repair.new_candidate_sha}:${changedPath}`]),
      );
      return (
        persistedTransport.result_digest_sha256 !== priorState.prior_failure_result_digest ||
        !selfDigestValid(persistedTransport, 'result_digest_sha256')
      );
    } catch {
      return true;
    }
  });
  const claimedChangedPaths = [
    ...new Set((repair.repaired_classes ?? []).flatMap(({ changed_paths }) => changed_paths)),
  ].sort();
  if (canonical(claimedChangedPaths) !== canonical(semanticChangedPaths)) valid = false;
  const newTree = candidateTreeEntries(repair.new_candidate_sha);
  for (const [id, entry] of grouped) {
    const repaired = repairedMap.get(id);
    const instances = [...new Set(entry.affected_instances)].sort();
    if (
      repaired === undefined ||
      repaired.population_query !== entry.population_query ||
      canonical([...repaired.affected_instances].sort()) !== canonical(instances) ||
      canonical([...repaired.repaired_instances].sort()) !== canonical(instances) ||
      !(repaired.verification_refs ?? []).every((ref) => newTree.has(ref))
    )
      valid = false;
  }
  if (!valid)
    findings.push(
      finding(
        'REVIEW_REPAIR_EVIDENCE_INCOMPLETE',
        'repair evidence does not cover the exact prior failed-class population',
      ),
    );
  return valid ? repair : null;
}

export function reviewScopeV4() {
  const findings = [];
  const round = option('--round') ?? '';
  // A missing or unresolvable base is a blocking finding, never an uncaught throw.
  const baseExpression = option('--base') ?? '';
  const baseResolution = gitResult(repoRoot, ['rev-parse', baseExpression]);
  if (baseExpression === '' || baseResolution.status !== 0)
    return emit({
      ok: false,
      command: 'review-scope',
      round,
      base: baseExpression,
      findings: [
        finding('REVIEW_SCOPE_BASE_REQUIRED', 'review scope requires one resolvable exact base', {
          revision: baseExpression,
        }),
      ],
    });
  const base = baseResolution.stdout.trim();
  const candidateExpression = option('--candidate') ?? 'HEAD';
  const candidate = resolveExactCandidateV6(candidateExpression, findings);
  const cycle = Number(option('--cycle') ?? '1');
  if (candidate === null)
    return emit({
      ok: false,
      command: 'review-scope',
      round,
      base,
      candidate: candidateExpression,
      cycle,
      findings,
    });
  const context = loadV4Context(round, findings, candidate);
  if (![1, 2].includes(cycle))
    findings.push(finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'only cycles 1 and 2 are permitted'));
  let existingState = null;
  let terminalReentry = false;
  if (context !== null && existsSync(join(repoRoot, context.profile.runtime.review_state))) {
    const stateFindings = [];
    existingState = readAuthenticatedStateV4(context, stateFindings, null);
    findings.push(...stateFindings);
    if (
      existingState !== null &&
      (context.policy.review_state_machine.terminal_states ?? []).includes(existingState.state)
    ) {
      terminalReentry = true;
      findings.push(finding('REVIEW_STATE_TERMINAL', 'terminal review state has no successor'));
    } else if (cycle === 1 && existingState !== null)
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'cycle 1 scope cannot overwrite authenticated review history',
        ),
      );
  }
  const proof =
    context === null ? null : authenticateCandidateProofV4(context, base, candidate, findings);
  const ledger = context === null ? null : validateClaimsV4(context, candidate, findings);
  const binding = context === null ? null : reviewerBindingV4(context, candidate);
  if (binding !== null) {
    findings.push(...binding.findings);
    if (binding.diagnostic !== null) findings.push(binding.diagnostic);
  }
  let priorState = null;
  let repair = null;
  if (context !== null && proof !== null && cycle === 2) {
    priorState = readAuthenticatedStateV4(context, findings, null);
    if (priorState?.state !== 'REPAIR_REQUIRED')
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'cycle 2 requires authenticated REPAIR_REQUIRED state',
        ),
      );
    if (priorState !== null)
      repair = validateRepairEvidenceV4(context, priorState, proof, findings);
  }
  if (
    proof !== null &&
    ledger !== null &&
    proof.manifest.claims_digest !== ledger.claims_digest_sha256
  ) {
    findings.push(
      finding(
        'CANDIDATE_CLAIMS_CROSS_DIGEST_INVALID',
        'candidate manifest and materialized claims do not share one digest',
      ),
    );
  }
  if (
    context === null ||
    proof === null ||
    ledger === null ||
    binding?.selected === null ||
    findings.length > 0
  ) {
    if (context !== null && !terminalReentry) {
      rmSync(join(repoRoot, context.profile.runtime.review_scope), { force: true });
    }
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const topics = makeReviewTopicsV4(context, base, candidate, proof, ledger, findings);
  if (new Set(topics.map(({ topic_id }) => topic_id)).size !== topics.length)
    findings.push(
      finding('REVIEW_TOPIC_DUPLICATED', 'generated review topic identifiers must be unique'),
    );
  const activeControls = [
    context.profilePath,
    'law/policy/round-close-controls.json',
    context.profile.sources.authorization,
    context.profile.sources.plan,
    context.profile.sources.orchestrator,
    ...(context.profile.sources.additional_controls ?? []),
  ];
  const previousCandidateManifestDigests =
    priorState === null ? [] : [priorState.candidate_manifest_digest];
  const identityBody = {
    invocation_round: round,
    invocation_cycle: cycle,
    invocation_candidate: candidate,
    candidate_tree_from_git: proof.tree,
    policy_version_from_policy: context.policy.review_scope.policy_version,
    previous_candidate_manifest_digests_from_state: previousCandidateManifestDigests,
  };
  const identityProof = {
    ...identityBody,
    identity_digest_sha256: sha256(canonical(identityBody)),
  };
  const body = {
    schemaVersion: context.policy.schemaVersion === '5.0.0' ? '4.0.0' : '3.0.0',
    policy_version: context.policy.review_scope.policy_version,
    round,
    cycle,
    exact_base: base,
    review_candidate: candidate,
    candidate_tree: proof.tree,
    policy_digest: context.digests.policy,
    profile_digest: context.digests.profile,
    graph_digest: context.digests.graph,
    obligations_digest: context.digests.obligations,
    claims_digest: ledger.claims_digest_sha256,
    ...(context.policy.schemaVersion === '5.0.0'
      ? {
          active_control_census_digest: proof.activeControlCensus.census_digest_sha256,
          identity_proof: identityProof,
        }
      : {
          active_controls_digest: candidateDigestForPaths(
            candidate,
            activeControls.filter((path) => candidateTreeEntries(candidate).has(path)),
          ),
        }),
    prior_findings_digest: context.digests.priorFindings,
    impact_plan_digest: proof.impact.execution_digest_sha256,
    convergence_evidence_digest: proof.convergence.convergence_digest_sha256,
    candidate_identity_digest: proof.identityDigest,
    current_candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
    previous_candidate_manifest_digests: previousCandidateManifestDigests,
    topic_count: topics.length,
    topics,
  };
  const manifest = withSelfDigest(body, 'manifest_digest_sha256');
  validateDocument(
    manifest,
    context.policy.schemas.review_scope,
    findings,
    'REVIEW_SCOPE_SCHEMA_INVALID',
    'review scope',
  );
  if (findings.length === 0) {
    writeJsonAtomic(join(repoRoot, context.profile.runtime.review_scope), manifest);
    // Per DII-253 the emitted edge sequence is read from law, and the state at each boundary
    // is persisted before the next edge is emitted. The previous implementation built the
    // whole burst and persisted once, so the four intermediate boundaries had no artifact
    // and were waved through by a hard-coded exemption. Folding over the declaration gives
    // every non-initial transition a predecessor that actually exists, which is what OM-017
    // requires and what the declaration canonical_history.first_predecessor already said.
    const sequence = emittedSequenceV7(context.policy, cycle);
    if (sequence === null)
      findings.push(
        finding(
          'REVIEW_STATE_SEQUENCE_UNDECLARED',
          'policy declares no emitted transition sequence for this cycle',
          { cycle },
        ),
      );
    else {
      const cycleTwoIdentity =
        cycle === 2
          ? {
              previous_candidate_sha: priorState.candidate_sha,
              prior_failure_result_digest: repair.prior_review_result_digest,
              prior_failure_state_digest: repair.prior_failure_state_digest,
              prior_failure_transport_digest: repair.prior_failure_transport_digest,
              repair_evidence_digest: repair.repair_evidence_digest_sha256,
            }
          : {};
      const persist =
        context.policy.schemaVersion === '5.0.0' &&
        capability(context, 'review_scope_state_persistence');
      let history = cycle === 2 ? [...priorState.transition_history] : [];
      // The predecessor of the first emitted edge is the state the machine already occupied.
      // In cycle one that is the DRAFT origin, which has no artifact by construction.
      let predecessorDigest = cycle === 2 ? priorState.state_digest_sha256 : null;
      for (const [from, to] of sequence) {
        history = [
          ...history,
          transitionV4(from, to, proof, {
            review_scope_digest: manifest.manifest_digest_sha256,
            previous_state_digest: predecessorDigest,
            ...(cycle === 2
              ? { repair_evidence_digest: repair.repair_evidence_digest_sha256 }
              : {}),
          }),
        ];
        const state = makeReviewStateV4(
          context,
          proof,
          manifest.manifest_digest_sha256,
          to,
          cycle,
          history,
          { ...cycleTwoIdentity, previous_state_digest: predecessorDigest },
        );
        if (persist) persistStateV5(context, state);
        else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), state);
        predecessorDigest = state.state_digest_sha256;
      }
    }
  }
  emit({
    ok: findings.length === 0,
    command: 'review-scope',
    round,
    cycle,
    manifest: findings.length === 0 ? manifest : null,
    findings,
  });
}

export function readAuthenticatedStateV4(context, findings, expected) {
  const path = join(repoRoot, context.profile.runtime.review_state);
  const state = readJsonPrecisely(path, 'REVIEW_STATE_MISSING', 'REVIEW_STATE_MALFORMED', findings);
  if (state === null) return null;
  if (
    !validateDocument(
      state,
      context.policy.schemas.review_state,
      findings,
      'REVIEW_STATE_SCHEMA_INVALID',
      'review state',
    )
  )
    return null;
  if (!selfDigestValid(state, 'state_digest_sha256')) {
    findings.push(
      finding('REVIEW_STATE_SELF_DIGEST_INVALID', 'review state self-digest is invalid'),
    );
    return null;
  }
  if (
    context.policy.schemaVersion === '5.0.0' &&
    capability(context, 'predecessor_artifact_authentication') &&
    state.previous_state_digest !== null
  ) {
    const predecessorPath = join(
      dirname(path),
      'review-states',
      `${state.previous_state_digest}.json`,
    );
    if (!existsSync(predecessorPath)) {
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_MISSING',
          'exact predecessor state artifact is not persisted',
        ),
      );
      return null;
    }
    const predecessor = readJson(predecessorPath);
    if (
      !selfDigestValid(predecessor, 'state_digest_sha256') ||
      predecessor.state_digest_sha256 !== state.previous_state_digest
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_INVALID',
          'persisted predecessor state artifact does not match its exact self-digest',
        ),
      );
      return null;
    }
  }
  for (const transition of state.transition_history ?? [])
    if (!selfDigestValid(transition, 'transition_digest_sha256')) {
      findings.push(
        finding('REVIEW_STATE_TRANSITION_DIGEST_INVALID', 'review transition digest is invalid'),
      );
      return null;
    }
  if (context.policy.schemaVersion === '5.0.0') {
    const exactArtifactChain = capability(context, 'exact_artifact_chain');
    const history = state.transition_history ?? [];
    const scopePath = join(repoRoot, context.profile.runtime.review_scope);
    const scope = existsSync(scopePath) ? readJson(scopePath) : null;
    let previousDigest = null;
    let previousTo = null;
    for (let index = 0; index < history.length; index += 1) {
      const transition = history[index];
      validateTransitionEdgeV6(context, transition, index, history[index - 1] ?? null, findings);
      if (
        transition.ordinal !== index + 1 ||
        transition.previous_transition_digest !== previousDigest ||
        (previousTo !== null && transition.from !== previousTo)
      ) {
        findings.push(
          finding(
            'REVIEW_STATE_HISTORY_NONCANONICAL',
            'review transition history is reordered, skipped, or duplicated',
            { ordinal: index + 1 },
          ),
        );
        return null;
      }
      if (index > 0 && transition.previous_transition_digest === null) {
        findings.push(
          finding(
            'REVIEW_STATE_PREDECESSOR_MISSING',
            'review transition predecessor digest is missing',
          ),
        );
        return null;
      }
      previousDigest = transition.transition_digest_sha256;
      previousTo = transition.to;
    }
    if (
      state.history_digest !== sha256(canonical(history)) ||
      state.latest_transition_digest !== previousDigest
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_INVALID',
          'review state history digest or transition tip is stale or forged',
        ),
      );
      return null;
    }
    const cycleOneStates = new Set([
      'DRAFT',
      'CANDIDATE_FROZEN',
      'CYCLE_1_ACTIVE',
      'REPAIR_REQUIRED',
    ]);
    const cycleTwoStates = new Set([
      'NEW_CANDIDATE_FROZEN',
      'CYCLE_2_ACTIVE',
      'ESCALATION_REQUIRED',
    ]);
    if (
      (cycleOneStates.has(state.state) && state.cycle !== 1) ||
      (cycleTwoStates.has(state.state) && state.cycle !== 2)
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_CYCLE_INVALID',
          'review state and cycle do not match the declared graph',
        ),
      );
      return null;
    }
    if ((state.transport_history_digests ?? []).length !== state.transport_attempts) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_ATTEMPT_POPULATION_INCOMPLETE',
          'nonzero transport attempts lack the exact persisted digest population',
        ),
      );
      return null;
    }
    let priorTransportDigest = null;
    for (let attempt = 1; attempt <= state.transport_attempts; attempt += 1) {
      const attemptPath = join(
        repoRoot,
        context.profile.runtime.review_transport_root,
        `attempt-${String(attempt)}.json`,
      );
      if (!existsSync(attemptPath)) {
        findings.push(
          finding('REVIEW_TRANSPORT_CHAIN_MISSING', 'persisted transport attempt is missing', {
            attempt,
          }),
        );
        return null;
      }
      const transport = readJson(attemptPath);
      const payloadPath = join(
        repoRoot,
        context.profile.runtime.review_transport_root,
        `attempt-${String(attempt)}.payload`,
      );
      const payloadDigest = exactArtifactChain
        ? existsSync(payloadPath)
          ? sha256(readFileSync(payloadPath))
          : null
        : transport.payload_digest;
      const isCurrentValid =
        transport.transport_digest_sha256 === state.current_transport_digest &&
        state.current_review_result_digest !== null;
      // The state-before identity is corroborated against the authenticated state chain,
      // which the transport cannot influence.
      //
      // Two wrong answers were tried before this one and both are rejected here. Taking
      // the expectation from the transport is a tautology: the transport is compared
      // with a copy of its own field. Taking it from the current state digest is also
      // wrong: the writer records state_before_digest from the state as it stood when
      // the transport was written, and the state is then re-digested with an incremented
      // attempt count, so the current digest is legitimately different and the check
      // would raise a false chain failure on every retry.
      //
      // The authenticated chain is the current state identity plus every predecessor
      // identity recorded in its own transition history.
      // Membership is the authenticated state lineage, walked through the retained
      // artifacts themselves. Transport attempts mutate state without necessarily adding
      // a transition, so a set built only from the current digest and transition
      // predecessors omits states whose artifacts genuinely exist. Membership is never
      // derived from transports: a claim must not authenticate itself.
      const statesRoot = join(dirname(path), 'review-states');
      const authenticatedStateIdentities = new Set();
      let lineageCursor = state.state_digest_sha256;
      while (
        typeof lineageCursor === 'string' &&
        SHA256.test(lineageCursor) &&
        !authenticatedStateIdentities.has(lineageCursor)
      ) {
        authenticatedStateIdentities.add(lineageCursor);
        const lineagePath = join(statesRoot, `${lineageCursor}.json`);
        if (!existsSync(lineagePath)) break;
        const lineageArtifact = readJson(lineagePath);
        if (
          !selfDigestValid(lineageArtifact, 'state_digest_sha256') ||
          lineageArtifact.state_digest_sha256 !== lineageCursor
        )
          break;
        lineageCursor = lineageArtifact.previous_state_digest ?? null;
      }
      const stateBeforePath = join(
        dirname(path),
        'review-states',
        `${transport.state_before_digest}.json`,
      );
      let stateBeforeAuthentic = !exactArtifactChain;
      if (exactArtifactChain) {
        const claimed = transport.state_before_digest;
        const retained = existsSync(stateBeforePath) ? readJson(stateBeforePath) : null;
        stateBeforeAuthentic =
          retained !== null &&
          selfDigestValid(retained, 'state_digest_sha256') &&
          retained.state_digest_sha256 === claimed &&
          authenticatedStateIdentities.has(claimed);
      }
      if (
        !reauthenticateTransportV6(
          context,
          state,
          scope,
          transport,
          attempt,
          priorTransportDigest,
          findings,
          exactArtifactChain
            ? {
                payload_digest: payloadDigest,
                validation: isCurrentValid ? 'VALID' : 'INVALID_TRANSPORT',
                // state_before_digest is deliberately absent: it is corroborated against
                // the authenticated state chain above, not by equality with a value this
                // function could only take from the transport or the current state.
              }
            : null,
        ) ||
        (exactArtifactChain && payloadDigest === null) ||
        (exactArtifactChain && !stateBeforeAuthentic) ||
        transport.transport_digest_sha256 !== state.transport_history_digests[attempt - 1]
      ) {
        findings.push(
          finding(
            attempt > 1 ? 'REVIEW_TRANSPORT_PREDECESSOR_INVALID' : 'REVIEW_TRANSPORT_CHAIN_INVALID',
            'persisted transport attempt chain is stale, reordered, or forged',
            { attempt },
          ),
        );
        return null;
      }
      priorTransportDigest = transport.transport_digest_sha256;
    }
    if (state.current_transport_digest !== priorTransportDigest) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_CHAIN_INVALID',
          'state transport tip does not equal the authenticated attempt chain',
        ),
      );
      return null;
    }
    if (state.state === 'REVIEW_TRANSPORT_BLOCKED' && state.transport_attempts !== 2) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_BLOCKED',
          'transport terminal requires exactly two exhausted malformed attempts',
        ),
      );
      return null;
    }
    if (state.current_review_result_digest !== null && state.current_transport_digest === null) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_PAYLOAD_RESULT_MISMATCH',
          'review result is not bound to one authenticated successful transport',
        ),
      );
      return null;
    }
    if (state.current_review_result_digest !== null) {
      const resultPath = exactArtifactChain
        ? join(
            dirname(join(repoRoot, context.profile.runtime.review_result)),
            'review-results',
            `${state.current_review_result_digest}.json`,
          )
        : join(repoRoot, context.profile.runtime.review_result);
      if (!existsSync(resultPath)) {
        findings.push(
          finding('REVIEW_STATE_RESULT_MISSING', 'review state result artifact is missing'),
        );
        return null;
      }
      const result = readJson(resultPath);
      if (
        !validateDocument(
          result,
          context.policy.schemas.review_result,
          findings,
          'REVIEW_STATE_RESULT_INVALID',
          'review result',
        ) ||
        !selfDigestValid(result, 'result_digest_sha256') ||
        result.result_digest_sha256 !== state.current_review_result_digest
      ) {
        findings.push(
          finding('REVIEW_STATE_RESULT_INVALID', 'review state result artifact is stale or forged'),
        );
        return null;
      }
      reauthenticateReviewResultV6(context, state, scope, result, findings);
    }
    if (state.repair_evidence_digest !== null) {
      const repairPath = join(repoRoot, context.profile.runtime.review_repair_evidence);
      if (!existsSync(repairPath)) {
        findings.push(finding('REVIEW_STATE_REPAIR_MISSING', 'review repair artifact is missing'));
        return null;
      }
      const repair = readJson(repairPath);
      // The expected repaired-class population is derived from the authenticated prior
      // failure result, not defaulted to null. With a null expectation the population
      // check evaluated true unconditionally and proved nothing.
      let expectedRepairedClasses = null;
      if (capability(context, 'predecessor_artifact_authentication')) {
        const priorResult = readPriorFailureResultV9(context, state);
        if (priorResult !== null)
          expectedRepairedClasses = [
            ...new Set(
              (priorResult.findings ?? [])
                .map(({ defect_class_id: id }) => String(id))
                .filter((id) => id !== 'undefined'),
            ),
          ];
      }
      reauthenticateRepairEvidenceV6(context, state, repair, findings, expectedRepairedClasses);
      if (
        !selfDigestValid(repair, 'repair_evidence_digest_sha256') ||
        repair.repair_evidence_digest_sha256 !== state.repair_evidence_digest
      ) {
        findings.push(
          finding('REVIEW_STATE_REPAIR_INVALID', 'review repair artifact is stale or forged'),
        );
        return null;
      }
    }
    if (state.state === 'REPAIR_REQUIRED' && state.prior_failure_result_digest === null) {
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_MISSING',
          'repair-required state lacks its authenticated failure result',
        ),
      );
      return null;
    }
    if (state.state === 'CYCLE_2_ACTIVE' && state.repair_evidence_digest === null) {
      findings.push(
        finding('REVIEW_STATE_REPAIR_MISSING', 'cycle 2 lacks authenticated repair evidence'),
      );
      return null;
    }
  }
  const allowed = context.policy.review_state_machine.allowed_transitions ?? {};
  const binding = reviewerBindingV4(context, state.candidate_sha);
  findings.push(...binding.findings);
  let anchored =
    state.round === context.profile.round &&
    state.profile_digest === context.digests.profile &&
    state.policy_digest === context.digests.policy &&
    binding.selected !== null &&
    state.reviewer_binding_digest === binding.selected.digest;
  try {
    anchored =
      anchored &&
      git(repoRoot, ['rev-parse', `${state.candidate_sha}^{tree}`]) === state.tree_sha &&
      gitResult(repoRoot, ['merge-base', '--is-ancestor', state.base_sha, state.candidate_sha])
        .status === 0;
  } catch {
    anchored = false;
  }
  if (!anchored) {
    findings.push(
      finding(
        'REVIEW_STATE_IDENTITY_INVALID',
        'review state is not anchored to current policy, profile, candidate tree, base, and reviewer',
      ),
    );
    return null;
  }
  // Per DII-253 the cycle-one prefix is the declared emitted sequence, not a literal that
  // duplicates it. The two agreed when both were written; nothing kept them agreeing.
  const declaredPrefix = emittedSequenceV7(context.policy, 1);
  if (declaredPrefix === null) {
    findings.push(
      finding(
        'REVIEW_STATE_SEQUENCE_UNDECLARED',
        'policy declares no emitted transition sequence for cycle 1',
      ),
    );
    return null;
  }
  const prefix = state.transition_history
    .slice(0, declaredPrefix.length)
    .map(({ from, to }) => `${from}->${to}`);
  if (canonical(prefix) !== canonical(declaredPrefix.map(([from, to]) => `${from}->${to}`))) {
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_INVALID',
        'review history lacks the complete authenticated cycle-1 prefix',
      ),
    );
    return null;
  }
  for (let index = 0; index < state.transition_history.length; index += 1) {
    const transition = state.transition_history[index];
    if (
      !(allowed[transition.from] ?? []).includes(transition.to) ||
      (index > 0 && state.transition_history[index - 1].to !== transition.from)
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'review transition history contains an undeclared or discontinuous edge',
        ),
      );
      return null;
    }
  }
  if (state.transition_history.at(-1)?.to !== state.state) {
    findings.push(
      finding('REVIEW_STATE_TRANSITION_INVALID', 'review state does not equal terminal transition'),
    );
    return null;
  }
  const terminalTransition = state.transition_history.at(-1);
  if (
    terminalTransition.candidate_sha !== state.candidate_sha ||
    terminalTransition.candidate_manifest_digest !== state.candidate_manifest_digest ||
    terminalTransition.review_scope_digest !== state.review_scope_digest
  ) {
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_INVALID',
        'terminal transition does not bind top-level state identity',
      ),
    );
    return null;
  }
  for (const transition of state.transition_history) {
    if (
      ['PASS', 'REPAIR_REQUIRED', 'ESCALATION_REQUIRED', 'REVIEW_TRANSPORT_BLOCKED'].includes(
        transition.to,
      ) &&
      transition.previous_state_digest === null
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'state-changing result or transport transition lacks predecessor state digest',
        ),
      );
      return null;
    }
  }
  if (
    expected !== null &&
    (state.round !== expected.round ||
      state.cycle !== expected.cycle ||
      state.candidate_sha !== expected.candidate ||
      state.candidate_manifest_digest !== expected.candidate_manifest_digest ||
      state.review_scope_digest !== expected.review_scope_digest ||
      state.profile_digest !== context.digests.profile ||
      state.policy_digest !== context.digests.policy)
  ) {
    findings.push(
      finding('REVIEW_STATE_IDENTITY_INVALID', 'review state belongs to another exact identity'),
    );
    return null;
  }
  if ((context.policy.review_state_machine.terminal_states ?? []).includes(state.state)) {
    const terminalCycle =
      terminalTransition.from === 'CYCLE_1_ACTIVE'
        ? 1
        : terminalTransition.from === 'CYCLE_2_ACTIVE'
          ? 2
          : null;
    if (terminalCycle === null || state.cycle !== terminalCycle) {
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'terminal state cycle does not match its authenticated active-cycle predecessor',
        ),
      );
      return null;
    }
  }
  return state;
}

export function parseReviewResultV4(path, findings) {
  let source;
  try {
    source = readFileSync(path, 'utf8').trim();
  } catch (error) {
    findings.push(finding('REVIEW_RESULT_INVALID', String(error)));
    return null;
  }
  try {
    return JSON.parse(source);
  } catch {
    try {
      const records = source
        .split(/\r?\n/u)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const knownTypes = new Set(['header', 'disposition', 'finding', 'terminal']);
      if (
        records.some(({ type }) => !knownTypes.has(type)) ||
        records[0]?.type !== 'header' ||
        records.at(-1)?.type !== 'terminal' ||
        records.filter(({ type }) => type === 'header').length !== 1 ||
        records.filter(({ type }) => type === 'terminal').length !== 1
      )
        throw new Error('non-canonical JSONL stream');
      const header = { ...records[0] };
      delete header.type;
      return {
        ...header,
        dispositions: records
          .filter(({ type }) => type === 'disposition')
          .map(({ type: _type, ...entry }) => entry),
        findings: records
          .filter(({ type }) => type === 'finding')
          .map(({ type: _type, ...entry }) => entry),
        terminal: (({ type: _type, ...entry }) => entry)(records.at(-1)),
      };
    } catch (error) {
      const detail = String(error);
      findings.push(
        finding(
          detail.includes('non-canonical JSONL stream')
            ? 'REVIEW_JSONL_NON_CANONICAL'
            : 'REVIEW_RESULT_INVALID',
          `malformed or truncated review result: ${detail}`,
        ),
      );
      return null;
    }
  }
}

export function validateReuseV4(context, topic, disposition, proof, findings) {
  if (
    !Array.isArray(disposition.recomputed_inputs_manifest) ||
    disposition.recomputed_inputs_manifest.length === 0
  )
    findings.push(
      finding(
        'REVIEW_REUSE_INPUT_MANIFEST_MISSING',
        'reused topic has no recomputed input manifest',
        { topic_id: topic.topic_id },
      ),
    );
  else {
    const paths = pathsForGlobs(
      repoRoot,
      proof.manifest.candidate_sha,
      topic.governing_paths.flatMap(expandBraceSelectors),
    );
    const tree = candidateTreeEntries(proof.manifest.candidate_sha);
    const expected = paths.map((source) => ({ source, digest: sha256(String(tree.get(source))) }));
    if (
      canonical(disposition.recomputed_inputs_manifest) !== canonical(expected) ||
      sha256(canonical(expected.map(({ source, digest }) => ({ path: source, digest })))) !==
        topic.current_digest
    )
      findings.push(
        finding('REVIEW_REUSE_INPUT_MANIFEST_STALE', 'recomputed input manifest is stale', {
          topic_id: topic.topic_id,
        }),
      );
  }
  if (
    !Array.isArray(disposition.recomputed_evidence_manifest) ||
    disposition.recomputed_evidence_manifest.length === 0
  )
    findings.push(
      finding(
        'REVIEW_REUSE_EVIDENCE_MANIFEST_MISSING',
        'reused topic has no recomputed evidence manifest',
        { topic_id: topic.topic_id },
      ),
    );
  else {
    const expectedEvidence = topicEvidenceManifestV4(
      context,
      proof,
      topic.source_refs,
      topic.required_evidence,
    );
    if (expectedEvidence === null)
      findings.push(
        finding(
          'REVIEW_REUSE_EVIDENCE_UNRESOLVED',
          'reused topic has evidence that cannot be mechanically resolved',
          { topic_id: topic.topic_id },
        ),
      );
    else {
      const actualEvidence = disposition.recomputed_evidence_manifest;
      const expectedRefs = expectedEvidence.map(({ ref }) => ref);
      const actualRefs = actualEvidence.map(({ ref }) => ref);
      if (canonical(actualRefs) !== canonical(expectedRefs))
        findings.push(
          finding(
            'REVIEW_REUSE_EVIDENCE_MANIFEST_INCOMPLETE',
            'recomputed evidence does not contain the exact per-topic reference population',
            { topic_id: topic.topic_id },
          ),
        );
      else if (canonical(actualEvidence) !== canonical(expectedEvidence))
        findings.push(
          finding(
            'REVIEW_REUSE_EVIDENCE_MANIFEST_STALE',
            'recomputed per-topic evidence contains a stale digest',
            { topic_id: topic.topic_id },
          ),
        );
      if (disposition.recomputed_evidence_digest !== sha256(canonical(expectedEvidence)))
        findings.push(
          finding(
            'REVIEW_REUSE_EVIDENCE_DIGEST_INVALID',
            'recomputed evidence aggregate digest is stale',
            { topic_id: topic.topic_id },
          ),
        );
    }
  }
  const expectedKeys = topicTaskKeysV4(proof, topic.required_evidence);
  if (
    !Array.isArray(disposition.recomputed_task_keys) ||
    (expectedKeys.length > 0 && disposition.recomputed_task_keys.length === 0)
  )
    findings.push(
      finding(
        'REVIEW_REUSE_TASK_KEY_REQUIRED',
        'reused topic requires its current relevant PASS task keys',
        { topic_id: topic.topic_id },
      ),
    );
  else {
    if (canonical(disposition.recomputed_task_keys) !== canonical(expectedKeys))
      findings.push(
        finding(
          'REVIEW_REUSE_TASK_KEY_STALE',
          'reused topic task keys are not the current exact relevant PASS population',
          { topic_id: topic.topic_id },
        ),
      );
  }
}

export function dispositionInputsV5(topic, proof) {
  const tree = candidateTreeEntries(proof.manifest.candidate_sha);
  const paths = pathsForGlobs(
    repoRoot,
    proof.manifest.candidate_sha,
    topic.governing_paths.flatMap(expandBraceSelectors),
  );
  const entries = paths.map((source) => ({
    source,
    digest: sha256(gitBytes(repoRoot, ['cat-file', 'blob', tree.get(source)])),
  }));
  if (entries.length === 0) {
    for (const source of topic.governing_paths)
      entries.push({
        source,
        digest: sha256(
          canonical({ source, state: 'absent', candidate: proof.manifest.candidate_sha }),
        ),
      });
  }
  return entries.sort((left, right) => left.source.localeCompare(right.source));
}

export function dispositionEvidenceV5(context, topic, proof) {
  const refs = [
    'candidate manifest',
    'convergence evidence',
    ...topic.source_refs,
    ...topic.required_evidence,
  ];
  const resolved = refs.map((ref) => resolveTopicEvidenceV6(context, proof, ref));
  if (resolved.some((entry) => entry === null)) return null;
  return [...new Map(resolved.map((entry) => [entry.ref, entry])).values()];
}

export function authenticateTypedEvidenceV6(context, topic, disposition, proof, findings) {
  const evidence = dispositionEvidenceV5(context, topic, proof);
  if (evidence === null) {
    findings.push(
      finding('UNRESOLVED_TOPIC_EVIDENCE', 'topic evidence has an unresolved typed reference', {
        topic_id: topic.topic_id,
      }),
    );
    return null;
  }
  const supplied = disposition.recomputed_evidence_manifest ?? [];
  if (canonical(supplied) !== canonical(evidence))
    findings.push(
      finding(
        'REVIEW_EVIDENCE_IDENTITY_INVALID',
        'review evidence differs from independently resolved exact bytes',
        { topic_id: topic.topic_id },
      ),
    );
  return evidence;
}

export function taskFreshnessManifestV5(context, topic, proof) {
  const taskKeys = topicTaskKeysV4(proof, topic.required_evidence);
  const records = [];
  for (const taskKey of taskKeys) {
    const gate = (proof.convergence.passes?.[1]?.gate_results ?? []).find(
      ({ task_key: key }) => key === taskKey,
    );
    if (gate === undefined) continue;
    const taskId = `gate-${gate.gate_id}`;
    const cache = readJson(v3CachePath(context, taskId, taskKey));
    records.push({
      task_id: taskId,
      task_key: taskKey,
      result_digest: cache.result_digest,
      evidence_ref: `gate:${gate.gate_id}`,
    });
  }
  return records;
}

export function authenticateDispositionProofV5(context, topic, disposition, proof, findings) {
  const inputs = dispositionInputsV5(topic, proof);
  const evidence = authenticateTypedEvidenceV6(context, topic, disposition, proof, findings);
  if (evidence === null) return;
  const evidenceDigest = sha256(canonical(evidence));
  const evidenceRefs = evidence.map(({ ref }) => ref);
  const evidenceRefsDigest = sha256(canonical(evidenceRefs));
  const taskFreshness = taskFreshnessManifestV5(context, topic, proof);
  const taskKeys = taskFreshness.map(({ task_key }) => task_key);
  if (
    canonical(disposition.recomputed_inputs_manifest) !== canonical(inputs) ||
    disposition.recomputed_digest !== topic.current_digest
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_INPUTS_INVALID',
        'disposition input proof differs from the exact current topic population',
        { topic_id: topic.topic_id },
      ),
    );
  if (
    canonical(disposition.recomputed_evidence_manifest) !== canonical(evidence) ||
    disposition.recomputed_evidence_digest !== evidenceDigest
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_EVIDENCE_INVALID',
        'disposition evidence proof differs from the exact current evidence population',
        { topic_id: topic.topic_id },
      ),
    );
  if (
    canonical(disposition.evidence_refs) !== canonical(evidenceRefs) ||
    disposition.recomputed_evidence_refs_digest !== evidenceRefsDigest
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID',
        'disposition evidence-reference set is incomplete or stale',
        { topic_id: topic.topic_id },
      ),
    );
  if (
    canonical(disposition.recomputed_task_freshness_manifest) !== canonical(taskFreshness) ||
    canonical(disposition.recomputed_task_keys) !== canonical(taskKeys)
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_TASK_FRESHNESS_INVALID',
        'disposition task freshness population is incomplete or stale',
        { topic_id: topic.topic_id },
      ),
    );
  const proofBody = {
    topic_id: topic.topic_id,
    disposition: disposition.disposition,
    recomputed_digest: topic.current_digest,
    recomputed_inputs_manifest: inputs,
    recomputed_evidence_manifest: evidence,
    recomputed_evidence_digest: evidenceDigest,
    recomputed_evidence_refs_digest: evidenceRefsDigest,
    recomputed_task_keys: taskKeys,
    recomputed_task_freshness_manifest: taskFreshness,
    evidence_refs: evidenceRefs,
  };
  if (disposition.proof_digest_sha256 !== sha256(canonical(proofBody)))
    findings.push(
      finding('REVIEW_DISPOSITION_PROOF_INVALID', 'disposition aggregate proof digest is invalid', {
        topic_id: topic.topic_id,
      }),
    );
}

export function reviewScopeIdentityV5(context, scope, round, cycle, candidate, state) {
  const previousDigests =
    cycle === 1
      ? []
      : [
          ...new Set(
            (state?.transition_history ?? [])
              .map(({ candidate_manifest_digest }) => candidate_manifest_digest)
              .filter(
                (digest) => digest !== null && digest !== scope.current_candidate_manifest_digest,
              ),
          ),
        ];
  const body = {
    invocation_round: round,
    invocation_cycle: cycle,
    invocation_candidate: candidate,
    candidate_tree_from_git: git(repoRoot, ['rev-parse', `${candidate}^{tree}`]),
    policy_version_from_policy: context.policy.review_scope.policy_version,
    previous_candidate_manifest_digests_from_state: previousDigests,
  };
  return { ...body, identity_digest_sha256: sha256(canonical(body)) };
}

export function validateReviewScopeIdentityV5(
  context,
  scope,
  round,
  cycle,
  candidate,
  state,
  findings,
) {
  const expected = reviewScopeIdentityV5(context, scope, round, cycle, candidate, state);
  const checks = [
    ['round', scope.round, round, 'REVIEW_SCOPE_IDENTITY_ROUND_INVALID'],
    ['cycle', scope.cycle, cycle, 'REVIEW_SCOPE_IDENTITY_CYCLE_INVALID'],
    [
      'review_candidate',
      scope.review_candidate,
      candidate,
      'REVIEW_SCOPE_IDENTITY_REVIEW_CANDIDATE_INVALID',
    ],
    [
      'candidate_tree',
      scope.candidate_tree,
      expected.candidate_tree_from_git,
      'REVIEW_SCOPE_IDENTITY_CANDIDATE_TREE_INVALID',
    ],
    [
      'policy_version',
      scope.policy_version,
      expected.policy_version_from_policy,
      'REVIEW_SCOPE_IDENTITY_POLICY_VERSION_INVALID',
    ],
    [
      'previous_candidate_manifest_digests',
      scope.previous_candidate_manifest_digests,
      expected.previous_candidate_manifest_digests_from_state,
      'REVIEW_SCOPE_IDENTITY_PREVIOUS_CANDIDATE_MANIFEST_DIGESTS_INVALID',
    ],
  ];
  const failed = checks.filter(([, actual, wanted]) => canonical(actual) !== canonical(wanted));
  for (const [field, actual, wanted, code] of failed)
    findings.push(
      finding(
        code,
        'review scope core identity differs from independently derived invocation state',
        { field, expected: wanted, actual },
      ),
    );
  if (failed.length > 1)
    findings.push(
      finding(
        'REVIEW_SCOPE_IDENTITY_COMBINED_INVALID',
        'multiple review scope identity fields are invalid',
      ),
    );
  if (canonical(scope.identity_proof) !== canonical(expected))
    findings.push(
      finding(
        'REVIEW_SCOPE_IDENTITY_PRETRANSPORT_REJECTED',
        'scope identity proof does not match independent pre-transport recomputation',
      ),
    );
  return failed.length === 0 && canonical(scope.identity_proof) === canonical(expected);
}

export function writeAuthenticatedTransportV5(
  context,
  state,
  scope,
  payloadDigest,
  validation,
  previousTransportDigest = null,
  payloadBytes = null,
) {
  const attempt = Number(state.transport_attempts ?? 0) + 1;
  const body = {
    schemaVersion: '2.0.0',
    round: state.round,
    cycle: state.cycle,
    attempt,
    candidate_sha: state.candidate_sha,
    candidate_tree: state.tree_sha,
    policy_digest: state.policy_digest,
    profile_digest: state.profile_digest,
    candidate_manifest_digest: state.candidate_manifest_digest,
    review_scope_digest: state.review_scope_digest,
    scope_identity_digest: scope.identity_proof.identity_digest_sha256,
    reviewer_binding_digest: state.reviewer_binding_digest,
    active_control_census_digest: state.active_control_census_digest,
    payload_digest: payloadDigest,
    validation,
    state_before_digest: state.state_digest_sha256,
    previous_transport_digest: previousTransportDigest,
  };
  const transport = withSelfDigest(body, 'transport_digest_sha256');
  const path = join(
    repoRoot,
    context.profile.runtime.review_transport_root,
    `attempt-${String(attempt)}.json`,
  );
  if (payloadBytes !== null)
    writeBytesAtomic(
      join(
        repoRoot,
        context.profile.runtime.review_transport_root,
        `attempt-${String(attempt)}.payload`,
      ),
      payloadBytes,
    );
  writeJsonAtomic(path, transport);
  writeJsonAtomic(join(repoRoot, context.profile.runtime.review_transport), transport);
  return transport;
}

export function persistStateV5(context, state) {
  const currentPath = join(repoRoot, context.profile.runtime.review_state);
  const historyRoot = join(dirname(currentPath), 'review-states');
  if (existsSync(currentPath)) {
    try {
      const previous = readJson(currentPath);
      if (selfDigestValid(previous, 'state_digest_sha256'))
        writeJsonAtomic(join(historyRoot, `${previous.state_digest_sha256}.json`), previous);
    } catch {
      // The authenticated read boundary will reject a malformed predecessor.
    }
  }
  writeJsonAtomic(currentPath, state);
  if (selfDigestValid(state, 'state_digest_sha256'))
    writeJsonAtomic(join(historyRoot, `${state.state_digest_sha256}.json`), state);
}

export function persistReviewResultV8(context, result) {
  const currentPath = join(repoRoot, context.profile.runtime.review_result);
  writeJsonAtomic(currentPath, result);
  if (selfDigestValid(result, 'result_digest_sha256'))
    writeJsonAtomic(
      join(dirname(currentPath), 'review-results', `${result.result_digest_sha256}.json`),
      result,
    );
}

export function invalidTransportV5(
  context,
  state,
  scope,
  payloadDigest,
  findings,
  payloadBytes = null,
) {
  const priorDigest = state.current_transport_digest ?? null;
  const transport = writeAuthenticatedTransportV5(
    context,
    state,
    scope,
    payloadDigest,
    'INVALID_TRANSPORT',
    priorDigest,
    payloadBytes,
  );
  const attempts = state.transport_attempts + 1;
  let history = state.transition_history;
  let nextStateName = state.state;
  if (attempts >= 2) {
    nextStateName = 'REVIEW_TRANSPORT_BLOCKED';
    const priorTransition = history.at(-1)?.transition_digest_sha256 ?? null;
    const transitionBody = {
      from: state.state,
      to: nextStateName,
      ordinal: history.length + 1,
      cycle: state.cycle,
      candidate_sha: state.candidate_sha,
      candidate_manifest_digest: state.candidate_manifest_digest,
      review_scope_digest: state.review_scope_digest,
      review_result_digest: null,
      transport_digest: transport.transport_digest_sha256,
      repair_evidence_digest: state.repair_evidence_digest,
      previous_state_digest: state.state_digest_sha256,
      previous_transition_digest: priorTransition,
    };
    history = [...history, withSelfDigest(transitionBody, 'transition_digest_sha256')];
  }
  const { state_digest_sha256: _oldDigest, ...body } = state;
  const updatedBody = {
    ...body,
    state: nextStateName,
    transition_history: history,
    history_digest: sha256(canonical(history)),
    latest_transition_digest: history.at(-1)?.transition_digest_sha256 ?? null,
    previous_state_digest: state.state_digest_sha256,
    transport_attempts: attempts,
    transport_history_digests: [
      ...state.transport_history_digests,
      transport.transport_digest_sha256,
    ],
    current_transport_digest: transport.transport_digest_sha256,
  };
  const updatedState = withSelfDigest(updatedBody, 'state_digest_sha256');
  if (capability(context, 'invalid_transport_state_persistence'))
    persistStateV5(context, updatedState);
  else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), updatedState);
  if (attempts >= 2)
    findings.push(finding('REVIEW_TRANSPORT_BLOCKED', 'transport retry budget is exhausted'));
}

export function invalidTransportV4(context, state, payloadDigest, findings) {
  const transportPath = join(repoRoot, context.profile.runtime.review_transport);
  let prior = null;
  try {
    if (existsSync(transportPath)) prior = readJson(transportPath);
  } catch {
    prior = null;
  }
  const attempt = Number(state.transport_attempts ?? 0) + 1;
  if (attempt === 2) {
    const priorFindings = [];
    const { state_digest_sha256: _stateDigest, ...currentStateBody } = state;
    const stateBeforeFirst = withSelfDigest(
      { ...currentStateBody, transport_attempts: 0 },
      'state_digest_sha256',
    ).state_digest_sha256;
    const priorValid =
      prior !== null &&
      validateDocument(
        prior,
        context.policy.schemas.review_transport,
        priorFindings,
        'REVIEW_TRANSPORT_INVALID',
        'review transport',
      ) &&
      selfDigestValid(prior, 'transport_digest_sha256') &&
      prior.attempt === 1 &&
      prior.previous_transport_digest === null &&
      prior.round === state.round &&
      prior.cycle === state.cycle &&
      prior.candidate_sha === state.candidate_sha &&
      prior.candidate_manifest_digest === state.candidate_manifest_digest &&
      prior.review_scope_digest === state.review_scope_digest &&
      prior.reviewer_binding_digest === state.reviewer_binding_digest &&
      prior.state_before_digest === stateBeforeFirst;
    if (!priorValid)
      findings.push(
        finding(
          'REVIEW_TRANSPORT_CHAIN_INVALID',
          'second transport attempt lacks one authenticated predecessor',
        ),
      );
  }
  const body = {
    schemaVersion: '1.0.0',
    round: state.round,
    cycle: state.cycle,
    attempt: Math.min(attempt, 2),
    candidate_sha: state.candidate_sha,
    candidate_manifest_digest: state.candidate_manifest_digest,
    review_scope_digest: state.review_scope_digest,
    reviewer_binding_digest: state.reviewer_binding_digest,
    payload_digest: payloadDigest,
    validation: 'INVALID_TRANSPORT',
    state_before_digest: state.state_digest_sha256,
    previous_transport_digest: prior?.transport_digest_sha256 ?? null,
  };
  const transport = withSelfDigest(body, 'transport_digest_sha256');
  writeJsonAtomic(transportPath, transport);
  if (attempt > context.profile.review_budget.transport_retries_per_cycle) {
    const { state_digest_sha256: _oldStateDigest, ...stateBody } = state;
    const authenticated = withSelfDigest(
      {
        ...stateBody,
        state: 'REVIEW_TRANSPORT_BLOCKED',
        transport_attempts: 2,
        transition_history: [
          ...state.transition_history,
          transitionV4(
            state.state,
            'REVIEW_TRANSPORT_BLOCKED',
            {
              manifest: {
                candidate_sha: state.candidate_sha,
                manifest_digest_sha256: state.candidate_manifest_digest,
              },
            },
            {
              review_scope_digest: state.review_scope_digest,
              transport_digest: transport.transport_digest_sha256,
              previous_state_digest: state.state_digest_sha256,
            },
          ),
        ],
      },
      'state_digest_sha256',
    );
    writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), authenticated);
    findings.push(finding('REVIEW_TRANSPORT_BLOCKED', 'transport retry budget is exhausted'));
  } else {
    const { state_digest_sha256: _oldStateDigest, ...stateBody } = state;
    const updated = withSelfDigest(
      { ...stateBody, transport_attempts: attempt },
      'state_digest_sha256',
    );
    writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), updated);
  }
}

export function reviewCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const cycle = Number(option('--cycle') ?? '1');
  const candidateExpression = option('--candidate') ?? 'HEAD';
  if (![1, 2].includes(cycle))
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate: candidateExpression,
      cycle,
      findings: [finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'cycle 3 is forbidden')],
    });
  const candidate = resolveExactCandidateV6(candidateExpression, findings);
  if (candidate === null)
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate: candidateExpression,
      cycle,
      findings,
    });
  const context = loadV4Context(round, findings, candidate);
  if (context === null)
    return emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
  const scopePath = join(repoRoot, context.profile.runtime.review_scope);
  const scope = readJsonPrecisely(
    scopePath,
    'REVIEW_SCOPE_MANIFEST_INVALID',
    'REVIEW_SCOPE_MANIFEST_INVALID',
    findings,
  );
  if (scope !== null) {
    validateDocument(
      scope,
      context.policy.schemas.review_scope,
      findings,
      'REVIEW_SCOPE_SCHEMA_INVALID',
      'review scope',
    );
    if (!selfDigestValid(scope, 'manifest_digest_sha256'))
      findings.push(
        finding('REVIEW_SCOPE_SELF_DIGEST_INVALID', 'review scope self-digest is invalid'),
      );
  }
  const proof =
    scope === null
      ? null
      : authenticateCandidateProofV4(context, scope.exact_base, candidate, findings);
  const ledger = proof === null ? null : validateClaimsV4(context, candidate, findings);
  const binding = reviewerBindingV4(context, candidate);
  findings.push(...binding.findings);
  if (binding.diagnostic !== null) findings.push(binding.diagnostic);
  if (proof !== null && ledger !== null && scope !== null) {
    const expectedTopics = makeReviewTopicsV4(
      context,
      scope.exact_base,
      candidate,
      proof,
      ledger,
      findings,
    );
    const activeControls = [
      context.profilePath,
      'law/policy/round-close-controls.json',
      context.profile.sources.authorization,
      context.profile.sources.plan,
      context.profile.sources.orchestrator,
      ...(context.profile.sources.additional_controls ?? []),
    ];
    const activeControlsValid =
      context.policy.schemaVersion === '5.0.0'
        ? scope.active_control_census_digest === proof.activeControlCensus?.census_digest_sha256
        : scope.active_controls_digest ===
          candidateDigestForPaths(
            candidate,
            activeControls.filter((path) => candidateTreeEntries(candidate).has(path)),
          );
    if (
      canonical(scope.topics) !== canonical(expectedTopics) ||
      scope.topic_count !== expectedTopics.length ||
      scope.claims_digest !== ledger.claims_digest_sha256 ||
      proof.manifest.claims_digest !== ledger.claims_digest_sha256 ||
      scope.policy_digest !== context.digests.policy ||
      scope.profile_digest !== context.digests.profile ||
      scope.graph_digest !== context.digests.graph ||
      scope.obligations_digest !== context.digests.obligations ||
      scope.prior_findings_digest !== context.digests.priorFindings ||
      !activeControlsValid ||
      scope.impact_plan_digest !== proof.impact.execution_digest_sha256 ||
      scope.convergence_evidence_digest !== proof.convergence.convergence_digest_sha256 ||
      scope.candidate_identity_digest !== proof.identityDigest ||
      scope.current_candidate_manifest_digest !== proof.manifest.manifest_digest_sha256
    )
      findings.push(
        finding(
          'REVIEW_SCOPE_RECOMPUTATION_INVALID',
          'review scope differs from the independently regenerated exact population',
        ),
      );
  }
  const state =
    scope === null || proof === null
      ? null
      : readAuthenticatedStateV4(context, findings, {
          round,
          cycle,
          candidate,
          candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
          review_scope_digest: scope.manifest_digest_sha256,
        });
  if (context.policy.schemaVersion === '5.0.0' && scope !== null && state !== null)
    validateReviewScopeIdentityV5(context, scope, round, cycle, candidate, state, findings);
  if (
    state !== null &&
    (context.policy.review_state_machine.terminal_states ?? []).includes(state.state)
  ) {
    findings.push(finding('REVIEW_STATE_TERMINAL', 'terminal review state has no successor'));
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate,
      cycle,
      state: state.state,
      findings,
    });
  }
  if (findings.length > 0 || state === null || proof === null)
    return emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
  const transportFindings = [];
  const resultPath = resolve(repoRoot, option('--review-result') ?? '');
  const result = parseReviewResultV4(resultPath, transportFindings);
  if (result === null) {
    if (context.policy.schemaVersion === '5.0.0')
      invalidTransportV5(
        context,
        state,
        scope,
        existsSync(resultPath) ? sha256(readFileSync(resultPath)) : sha256('MISSING\n'),
        findings,
        existsSync(resultPath) ? readFileSync(resultPath) : Buffer.from('MISSING\n'),
      );
    else
      invalidTransportV4(
        context,
        state,
        existsSync(resultPath) ? sha256(readFileSync(resultPath)) : sha256('MISSING\n'),
        findings,
      );
    findings.push(...transportFindings);
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate,
      cycle,
      state: findings.some(({ code }) => code === 'REVIEW_TRANSPORT_BLOCKED')
        ? 'REVIEW_TRANSPORT_BLOCKED'
        : state.state,
      findings,
    });
  }
  const duplicateIds = [];
  const seenFindingIds = new Set();
  for (const entry of result.findings ?? []) {
    if (seenFindingIds.has(entry.finding_id)) duplicateIds.push(entry.finding_id);
    seenFindingIds.add(entry.finding_id);
  }
  if (duplicateIds.length > 0)
    findings.push(
      finding('REVIEW_FINDING_ID_DUPLICATE', 'finding identifiers must be globally unique', {
        finding_ids: duplicateIds,
      }),
    );
  validateDocument(
    result,
    context.policy.schemas.review_result,
    findings,
    'REVIEW_RESULT_INVALID',
    'review result',
  );
  if (!selfDigestValid(result, 'result_digest_sha256'))
    findings.push(
      finding('REVIEW_RESULT_SELF_DIGEST_INVALID', 'review result self-digest is invalid'),
    );
  if (
    result.round !== round ||
    result.cycle !== cycle ||
    result.review_candidate !== candidate ||
    result.manifest_digest !== scope.manifest_digest_sha256 ||
    result.policy_digest !== context.digests.policy ||
    result.candidate_manifest_digest !== proof.manifest.manifest_digest_sha256 ||
    result.reviewer_binding_digest !== binding.selected?.digest ||
    (context.policy.schemaVersion === '5.0.0' &&
      (result.scope_identity_digest !== scope.identity_proof.identity_digest_sha256 ||
        result.active_control_census_digest !== proof.activeControlCensus?.census_digest_sha256 ||
        result.state_before_digest !== state.state_digest_sha256))
  )
    findings.push(
      finding('REVIEW_RESULT_IDENTITY_INVALID', 'review result does not bind exact artifacts'),
    );
  const topicMap = new Map(scope.topics.map((topic) => [topic.topic_id, topic]));
  const seenTopics = new Set();
  for (const disposition of result.dispositions ?? []) {
    if (seenTopics.has(disposition.topic_id))
      findings.push(
        finding('REVIEW_TOPIC_DUPLICATED', 'topic disposition is duplicated', {
          topic_id: disposition.topic_id,
        }),
      );
    seenTopics.add(disposition.topic_id);
    const topic = topicMap.get(disposition.topic_id);
    if (topic === undefined) {
      findings.push(finding('REVIEW_TOPIC_UNKNOWN', 'unknown review topic'));
      continue;
    }
    if (!topic.allowed_dispositions.includes(disposition.disposition))
      findings.push(finding('REVIEW_TOPIC_DISPOSITION_INVALID', 'topic disposition is forbidden'));
    if (disposition.recomputed_digest !== topic.current_digest)
      findings.push(
        finding('REVIEW_TOPIC_DIGEST_INVALID', 'topic digest differs from current scope'),
      );
    if (context.policy.schemaVersion === '5.0.0')
      authenticateDispositionProofV5(context, topic, disposition, proof, findings);
    else if (disposition.disposition === 'REUSED_FRESH_PASS')
      validateReuseV4(context, topic, disposition, proof, findings);
  }
  for (const topicId of topicMap.keys())
    if (!seenTopics.has(topicId))
      findings.push(
        finding('REVIEW_TOPIC_OMITTED', 'mandatory topic is omitted', { topic_id: topicId }),
      );
  const resultFindingMap = new Map(
    (result.findings ?? []).map((entry) => [entry.finding_id, entry]),
  );
  for (const disposition of result.dispositions ?? [])
    for (const id of disposition.finding_ids ?? [])
      if (!(resultFindingMap.get(id)?.topic_ids ?? []).includes(disposition.topic_id))
        findings.push(finding('REVIEW_FINDING_LINK_INVALID', 'finding link is not reciprocal'));
  for (const entry of result.findings ?? [])
    for (const topicId of entry.topic_ids ?? []) {
      const disposition = (result.dispositions ?? []).find(({ topic_id }) => topic_id === topicId);
      if (disposition === undefined || !(disposition.finding_ids ?? []).includes(entry.finding_id))
        findings.push(
          finding('REVIEW_FINDING_LINK_INVALID', 'finding topic link is not reciprocal'),
        );
    }
  const counts = Object.fromEntries(
    ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'].map((name) => [
      name,
      (result.dispositions ?? []).filter(({ disposition }) => disposition === name).length,
    ]),
  );
  if (
    result.terminal?.topic_count !== topicMap.size ||
    result.terminal?.finding_count !== (result.findings ?? []).length ||
    canonical(result.terminal?.disposition_counts) !== canonical(counts) ||
    result.terminal?.complete !== true
  )
    findings.push(
      finding('REVIEW_TERMINAL_INVALID', 'terminal counts do not match complete result'),
    );
  const hasNonPassing = (result.dispositions ?? []).some(({ disposition }) =>
    ['RECHECKED_FAIL', 'BLOCKED'].includes(disposition),
  );
  const hasHighRisk = (result.findings ?? []).some(({ severity }) =>
    ['P0', 'P1'].includes(severity),
  );
  if (result.terminal?.verdict === 'PASS' && hasNonPassing)
    findings.push(finding('REVIEW_TOPIC_NOT_PASSING', 'PASS contains a failed or blocked topic'));
  if (
    result.terminal?.verdict === 'PASS' &&
    (hasNonPassing || hasHighRisk || (result.findings ?? []).length > 0)
  )
    findings.push(
      finding('REVIEW_PASS_INVALID', 'PASS contains failed, blocked, or unresolved findings'),
    );
  const structuralFailure = findings.length > 0;
  if (structuralFailure) {
    if (context.policy.schemaVersion === '5.0.0')
      invalidTransportV5(
        context,
        state,
        scope,
        sha256(readFileSync(resultPath)),
        findings,
        readFileSync(resultPath),
      );
    else invalidTransportV4(context, state, sha256(readFileSync(resultPath)), findings);
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate,
      cycle,
      state: findings.some(({ code }) => code === 'REVIEW_TRANSPORT_BLOCKED')
        ? 'REVIEW_TRANSPORT_BLOCKED'
        : state.state,
      findings,
    });
  }
  const validTransport =
    context.policy.schemaVersion === '5.0.0'
      ? writeAuthenticatedTransportV5(
          context,
          state,
          scope,
          sha256(readFileSync(resultPath)),
          'VALID',
          state.current_transport_digest ?? null,
          readFileSync(resultPath),
        )
      : null;
  if (context.policy.schemaVersion === '5.0.0' && capability(context, 'review_result_persistence'))
    persistReviewResultV8(context, result);
  else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_result), result);
  const verdict = result.terminal.verdict;
  const next =
    // Per DII-253 the verdict-to-next-state mapping is declared, not encoded here.
    context.policy.review_state_machine?.verdict_next_state?.[
      verdict === 'PASS' ? 'PASS' : `non-pass-cycle-${cycle}`
    ] ?? null;
  if (next === null) {
    findings.push(
      finding(
        'REVIEW_STATE_SEQUENCE_UNDECLARED',
        'policy declares no next state for this verdict and cycle',
        { verdict, cycle },
      ),
    );
    emit({ ok: false, command: 'review-check', candidate, cycle, findings });
    return;
  }
  const transition = transitionV4(state.state, next, proof, {
    review_scope_digest: scope.manifest_digest_sha256,
    review_result_digest: result.result_digest_sha256,
    transport_digest: validTransport?.transport_digest_sha256 ?? null,
    previous_state_digest: state.state_digest_sha256,
  });
  const nextState = makeReviewStateV4(
    context,
    proof,
    scope.manifest_digest_sha256,
    next,
    cycle,
    [...state.transition_history, transition],
    {
      previous_state_digest: state.state_digest_sha256,
      transport_attempts:
        context.policy.schemaVersion === '5.0.0'
          ? state.transport_attempts + 1
          : state.transport_attempts,
      transport_history_digests:
        context.policy.schemaVersion === '5.0.0'
          ? [...state.transport_history_digests, validTransport.transport_digest_sha256]
          : undefined,
      current_transport_digest: validTransport?.transport_digest_sha256 ?? null,
      current_review_result_digest: result.result_digest_sha256,
      ...(next === 'REPAIR_REQUIRED'
        ? {
            prior_failure_result_digest: result.result_digest_sha256,
            prior_failure_state_digest: state.state_digest_sha256,
            prior_failure_transport_digest: validTransport?.transport_digest_sha256 ?? null,
            previous_candidate_sha: null,
            repair_evidence_digest: null,
          }
        : {}),
    },
  );
  if (context.policy.schemaVersion === '5.0.0' && capability(context, 'next_state_persistence'))
    persistStateV5(context, nextState);
  else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), nextState);
  emit({
    ok: next === 'PASS',
    command: 'review-check',
    round,
    candidate,
    cycle,
    state: next,
    findings:
      next === 'PASS'
        ? []
        : [finding('REVIEW_TOPIC_NOT_PASSING', 'valid exhaustive review reported findings')],
  });
}

export function statusV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const exactCandidate = resolveConsumerCandidateV8(round, findings);
  const context = loadV4Context(round, findings, exactCandidate);
  const binding = context === null ? null : reviewerBindingV4(context, exactCandidate ?? 'INVALID');
  if (binding !== null) {
    findings.push(...binding.findings);
    if (binding.diagnostic !== null && binding.profileBound) findings.push(binding.diagnostic);
  }
  // Per DII-253 the initial state is declared in law rather than assumed here.
  let state = context?.policy?.review_state_machine?.initial_state ?? 'DRAFT';
  let used = 0;
  let attempts = 0;
  if (context !== null && existsSync(join(repoRoot, context.profile.runtime.review_state))) {
    const stateFindings = [];
    const stored = readAuthenticatedStateV4(context, stateFindings, null);
    if (stored !== null) {
      state = stored.state;
      used = stored.cycle;
      attempts = stored.transport_attempts;
    }
    findings.push(...stateFindings);
  }
  emit({
    ok: findings.length === 0,
    command: 'status',
    round,
    state,
    substantive_cycles: { used, maximum: context?.profile.review_budget.substantive_cycles ?? 2 },
    transport_retries_per_cycle: {
      used: attempts,
      maximum: context?.profile.review_budget.transport_retries_per_cycle ?? 1,
    },
    entry_ready: entryReadinessV9(context, binding ?? null, findings).entry_ready,
    diagnostics:
      binding?.diagnostic !== null && binding?.profileBound === false ? [binding.diagnostic] : [],
    findings,
  });
}
