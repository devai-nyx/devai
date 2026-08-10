#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

import {
  buildImpactPlan,
  committedChangeRecords,
  expandBraceSelectors,
  loadV3Context,
  reviewerBindingFindings,
  statusAwareChangedPaths,
  topologicalNodes,
  v3CachePath,
  v3InputEntries,
  v3OutputState,
  v3ProfilePath,
  validateDocument,
} from './impact.mjs';
import { rolePathEvidenceV7 } from './legacy.mjs';
import {
  CONTROL_ENTRYPOINT,
  SHA256,
  SHA40,
  candidateBoundRevision,
  candidateFile,
  canonical,
  capability,
  cleanStatus,
  emit,
  environmentFingerprint,
  environmentManifestV5,
  finding,
  gateFreshnessProfileV5,
  git,
  gitBytes,
  loadPolicy,
  mirrorPath,
  option,
  pathsForGlobs,
  policyPath,
  rawCandidateInputManifest,
  readJson,
  readState,
  repoRoot,
  run,
  sha256,
  toolchainFingerprint,
  toolchainManifestV5,
  trackedPaths,
  treeEntryCache,
  treeIdentityEntryCache,
  validateGateCommandClosureV6,
  writeState,
} from './runtime.mjs';

export const CONTROL_CONCERN = 'governed';

export function claimsCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidateArg = option('--candidate') ?? 'HEAD';
  const candidate = git(repoRoot, ['rev-parse', candidateArg]);
  const context = loadV3Context(round, findings);
  if (context !== null) {
    if (context.claims.mode !== 'materialized' || context.claims.candidate !== candidate) {
      findings.push(
        finding(
          'CLAIM_UNRESOLVED',
          'current-claim ledger is not materialized for the exact candidate',
        ),
      );
    }
    for (const claim of context.claims.claims ?? []) {
      if (
        claim.source_digest === null ||
        claim.value_digest === null ||
        claim.source_paths.some((path) => path.includes('<'))
      ) {
        findings.push(
          finding('CLAIM_UNRESOLVED', 'claim has unresolved source or value identity', {
            claim_id: claim.claim_id,
          }),
        );
      }
      if (context.claims.mode !== 'materialized') continue;
      const sourceManifest = v3InputEntries(claim.source_paths ?? []);
      const sourceDigest = sha256(canonical(sourceManifest));
      if (claim.source_digest !== sourceDigest)
        findings.push(
          finding('CLAIM_SOURCE_DIGEST_INVALID', 'claim source digest is stale or incorrect', {
            claim_id: claim.claim_id,
            recomputed_digest: sourceDigest,
          }),
        );
      const resolvedProducer = claim.resolved_producer ?? claim.producer;
      const [program, ...args] = resolvedProducer ?? [];
      if (program === undefined) {
        findings.push(
          finding('CLAIM_PRODUCER_INVALID', 'claim producer is empty', {
            claim_id: claim.claim_id,
          }),
        );
        continue;
      }
      const produced = run(program, args, { cwd: repoRoot });
      if (produced.status !== 0) {
        findings.push(
          finding('CLAIM_PRODUCER_FAILED', 'claim producer did not complete successfully', {
            claim_id: claim.claim_id,
            exit_code: produced.status ?? 1,
          }),
        );
        continue;
      }
      let extracted;
      try {
        let value;
        try {
          value = JSON.parse(produced.stdout);
        } catch {
          value = produced.stdout.trim();
        }
        if (claim.extractor === '$') extracted = value;
        else {
          const tokens = String(claim.extractor)
            .replace(/^\$\.?/u, '')
            .split('.')
            .filter(Boolean);
          extracted = tokens.reduce((current, token) => current?.[token], value);
        }
        if (extracted === undefined) throw new Error('extractor resolved no value');
      } catch (error) {
        findings.push(
          finding('CLAIM_EXTRACTOR_INVALID', 'claim extractor could not resolve producer output', {
            claim_id: claim.claim_id,
            detail: String(error),
          }),
        );
        continue;
      }
      const valueDigest = sha256(canonical(extracted));
      if (claim.value_digest !== valueDigest)
        findings.push(
          finding('CLAIM_VALUE_DIGEST_INVALID', 'claim value digest is stale or incorrect', {
            claim_id: claim.claim_id,
            recomputed_digest: valueDigest,
          }),
        );
    }
  }
  emit({ ok: findings.length === 0, command: 'claims-check', round, candidate, findings });
}

export function candidateTreeIdentityEntriesV7(candidate) {
  if (treeIdentityEntryCache.has(candidate)) return treeIdentityEntryCache.get(candidate);
  const entries = new Map();
  for (const line of git(repoRoot, ['ls-tree', '-r', candidate]).split('\n').filter(Boolean)) {
    const match = /^([0-9]+)\s+(\w+)\s+([0-9a-f]+)\t(.+)$/u.exec(line);
    if (match !== null)
      entries.set(match[4], {
        mode: match[1],
        object_type: match[2],
        object_id: match[3],
      });
  }
  treeIdentityEntryCache.set(candidate, entries);
  return entries;
}

export function candidateTreeEntries(candidate) {
  if (treeEntryCache.has(candidate)) return treeEntryCache.get(candidate);
  const entries = new Map(
    [...candidateTreeIdentityEntriesV7(candidate)].map(([path, identity]) => [
      path,
      identity.object_id,
    ]),
  );
  treeEntryCache.set(candidate, entries);
  return entries;
}

export function candidateDigestForPaths(candidate, paths) {
  const tree = candidateTreeEntries(candidate);
  const entries = [...new Set(paths)].sort().map((path) => ({
    path,
    digest: tree.has(path) ? sha256(String(tree.get(path))) : sha256('MISSING\n'),
  }));
  return sha256(canonical(entries));
}

export function reviewScopeV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = git(repoRoot, ['rev-parse', option('--base') ?? '']);
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const cycle = Number(option('--cycle') ?? '1');
  if (![1, 2].includes(cycle))
    findings.push(
      finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'only review cycles 1 and 2 are permitted', {
        cycle,
      }),
    );
  const context = loadV3Context(round, findings);
  if (context === null) {
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const candidateManifestPath = join(repoRoot, context.profile.runtime.candidate_manifest);
  let candidateManifest = null;
  try {
    candidateManifest = readJson(candidateManifestPath);
    const { manifest_digest_sha256: claimed, ...body } = candidateManifest;
    if (
      claimed !== sha256(canonical(body)) ||
      candidateManifest.round !== round ||
      candidateManifest.base_sha !== base ||
      candidateManifest.candidate_sha !== candidate ||
      candidateManifest.tree_sha !== git(repoRoot, ['rev-parse', `${candidate}^{tree}`])
    )
      throw new Error('candidate manifest digest or exact identity mismatch');
  } catch (error) {
    findings.push(
      finding('CANDIDATE_MANIFEST_REQUIRED', 'an authentic exact-candidate manifest is required', {
        path: relative(repoRoot, candidateManifestPath),
        detail: String(error),
      }),
    );
  }
  if (candidateManifest === null) {
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const identityObligation =
    (context.obligations.obligations ?? []).find(({ obligation_id }) =>
      /IDENTITY$/u.test(obligation_id),
    ) ?? context.obligations.obligations?.[0];
  if (identityObligation === undefined) {
    findings.push(
      finding('REVIEW_OBLIGATION_IDENTITY_MISSING', 'review census needs an identity obligation'),
    );
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const topics = [];
  const addTopic = ({
    topicId,
    topicKind,
    obligationId = identityObligation.obligation_id,
    risk = 'P1',
    claim,
    sourceRefs,
    governingPaths,
    requiredEvidence,
    currentDigest,
    previousDigest = null,
    changedStatus = 'changed',
    requiredAdversaries,
    previousFindingClasses = [],
    allowReuse = false,
  }) => {
    topics.push({
      topic_id: topicId,
      topic_kind: topicKind,
      obligation_id: obligationId,
      risk,
      claim,
      source_refs: [...new Set(sourceRefs)],
      governing_paths: [...new Set(governingPaths)],
      required_evidence: [...new Set(requiredEvidence)],
      current_digest: currentDigest,
      previous_digest: previousDigest,
      changed_status: changedStatus,
      required_adversaries: [...new Set(requiredAdversaries)],
      previous_finding_classes: [...new Set(previousFindingClasses)],
      freshness_proof: {
        method:
          allowReuse && changedStatus === 'unchanged' ? 'content-addressed' : 'recheck-required',
        inputs_digest: currentDigest,
        evidence_digest: sha256(canonical(requiredEvidence)),
        task_keys: [],
        independent_recomputation_required: true,
      },
      allowed_dispositions:
        allowReuse && changedStatus === 'unchanged'
          ? ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED']
          : ['RECHECKED_PASS', 'RECHECKED_FAIL', 'BLOCKED'],
    });
  };
  for (const obligation of context.obligations.obligations ?? []) {
    const currentPaths = pathsForGlobs(
      repoRoot,
      candidate,
      obligation.governing_paths.flatMap(expandBraceSelectors),
    );
    const previousPaths = pathsForGlobs(
      repoRoot,
      base,
      obligation.governing_paths.flatMap(expandBraceSelectors),
    );
    const currentDigest = candidateDigestForPaths(candidate, currentPaths);
    const previousDigest = candidateDigestForPaths(base, previousPaths);
    const unchanged = currentDigest === previousDigest;
    addTopic({
      topicId: `obligation:${obligation.obligation_id.toLowerCase()}`,
      topicKind: 'semantic-obligation',
      obligationId: obligation.obligation_id,
      risk: obligation.risk,
      claim: obligation.claim,
      sourceRefs: obligation.source_refs,
      governingPaths: obligation.governing_paths,
      requiredEvidence: obligation.required_evidence,
      currentDigest,
      previousDigest,
      changedStatus: unchanged ? 'unchanged' : 'changed',
      requiredAdversaries: obligation.required_adversaries,
      previousFindingClasses: obligation.finding_classes,
      allowReuse: obligation.reuse_policy === 'digest-and-evidence-recheck',
    });
  }
  const changedPaths = statusAwareChangedPaths(base, candidate);
  for (const path of changedPaths) {
    addTopic({
      topicId: `changed-path:${sha256(path).slice(0, 24)}`,
      topicKind: 'changed-path',
      risk: 'P0',
      claim: `Inspect exact candidate change at ${path}`,
      sourceRefs: [path],
      governingPaths: [path],
      requiredEvidence: ['exact diff', 'affected behavior'],
      currentDigest: candidateDigestForPaths(candidate, [path]),
      previousDigest: candidateDigestForPaths(base, [path]),
      requiredAdversaries: ['inspect-exact-diff', 'exercise-affected-behavior'],
    });
  }
  const activeControls = [
    context.profilePath,
    'law/policy/round-close-controls.json',
    context.profile.sources.authorization,
    context.profile.sources.plan,
    context.profile.sources.orchestrator,
    ...(context.profile.sources.additional_controls ?? []),
  ];
  const activeControlsDigest = candidateDigestForPaths(candidate, activeControls);
  addTopic({
    topicId: 'active-control:complete-census',
    topicKind: 'active-control',
    risk: 'P0',
    claim: 'Every active controlling source is applied to the exact candidate.',
    sourceRefs: activeControls,
    governingPaths: activeControls,
    requiredEvidence: ['complete active-control digest and conflict census'],
    currentDigest: activeControlsDigest,
    requiredAdversaries: ['omitted-control', 'conflicting-control'],
  });
  for (const claim of context.claims.claims ?? []) {
    addTopic({
      topicId: `current-claim:${claim.claim_id}`,
      topicKind: 'current-claim',
      risk: 'P1',
      claim: `Recompute volatile claim ${claim.claim_id}.`,
      sourceRefs: [context.profile.sources.current_claims, ...claim.source_paths],
      governingPaths: [context.profile.sources.current_claims, ...claim.source_paths],
      requiredEvidence: [claim.producer.join(' '), claim.extractor],
      currentDigest: sha256(canonical(claim)),
      requiredAdversaries: ['stale-source-digest', 'stale-value-digest'],
    });
  }
  const priorFindingClasses = [];
  const registryPath = context.profile.sources.prior_finding_registry;
  if (registryPath !== undefined && existsSync(join(repoRoot, registryPath))) {
    const registry = readJson(join(repoRoot, registryPath));
    priorFindingClasses.push(
      ...(registry.finding_classes ?? []).map((entry) => ({
        id: entry.defect_class_id,
        source: registryPath,
        value: entry,
      })),
    );
  } else {
    for (const source of context.profile.sources.prior_findings ?? [])
      priorFindingClasses.push({ id: source, source, value: source });
  }
  for (const entry of priorFindingClasses) {
    addTopic({
      topicId: `previous-finding-class:${sha256(entry.id).slice(0, 24)}`,
      topicKind: 'previous-finding-class',
      risk: entry.value.severity ?? 'P1',
      claim: `Recheck complete prior defect class ${entry.id}.`,
      sourceRefs: [entry.source],
      governingPaths: [
        existsSync(join(repoRoot, entry.source)) ? entry.source : context.profilePath,
      ],
      requiredEvidence: [entry.value.repair_condition ?? 'complete same-class sweep'],
      currentDigest: sha256(canonical(entry.value)),
      requiredAdversaries: [
        entry.value.population_query ?? 'repeat prior defect-class population query',
      ],
      previousFindingClasses: [entry.id],
    });
  }
  addTopic({
    topicId: `candidate-identity:${candidate.slice(0, 16)}`,
    topicKind: 'candidate-identity',
    risk: 'P0',
    claim: 'Review binds the authentic exact candidate manifest.',
    sourceRefs: [context.profile.runtime.candidate_manifest],
    governingPaths: [context.profilePath],
    requiredEvidence: ['candidate SHA, tree SHA, base SHA, and self-digest'],
    currentDigest: candidateManifest.manifest_digest_sha256,
    requiredAdversaries: ['wrong-base', 'wrong-candidate', 'wrong-tree', 'tampered-manifest'],
  });
  const convergenceState = readState(repoRoot, round, 'convergence.json');
  const convergenceEvidence =
    convergenceState.status === 'valid' ? convergenceState.value : candidateManifest;
  const convergenceEvidenceDigest = sha256(canonical(convergenceEvidence));
  addTopic({
    topicId: `convergence-evidence:${convergenceEvidenceDigest.slice(0, 24)}`,
    topicKind: 'convergence-evidence',
    risk: 'P0',
    claim: 'Convergence evidence covers the exact frozen candidate.',
    sourceRefs: [
      context.profile.runtime.candidate_manifest,
      `${context.profile.runtime.state_root}/convergence.json`,
    ],
    governingPaths: [context.profilePath],
    requiredEvidence: ['two complete equivalent policy-gate passes and affected-task plan'],
    currentDigest: convergenceEvidenceDigest,
    requiredAdversaries: ['stale-convergence', 'partial-gate-population'],
  });
  topics.sort((left, right) => left.topic_id.localeCompare(right.topic_id));
  const priorFindingsDigest = sha256(canonical(priorFindingClasses));
  const body = {
    schemaVersion: '2.0.0',
    policy_version: context.policy.review_scope.policy_version,
    round,
    cycle,
    exact_base: base,
    review_candidate: candidate,
    candidate_tree: candidateManifest.tree_sha,
    policy_digest: context.digests.policy,
    profile_digest: context.digests.profile,
    graph_digest: context.digests.graph,
    obligations_digest: context.digests.obligations,
    claims_digest: context.digests.claims,
    active_controls_digest: activeControlsDigest,
    prior_findings_digest: priorFindingsDigest,
    impact_plan_digest: sha256(canonical({ base, candidate, changedPaths })),
    convergence_evidence_digest: convergenceEvidenceDigest,
    current_candidate_manifest_digest: candidateManifest.manifest_digest_sha256,
    previous_candidate_manifest_digests: [],
    topic_count: topics.length,
    topics,
  };
  const manifestValue = { ...body, manifest_digest_sha256: sha256(canonical(body)) };
  validateDocument(
    manifestValue,
    context.policy.schemas.review_scope,
    findings,
    'REVIEW_SCOPE_SCHEMA_INVALID',
    'review scope',
  );
  if (findings.length === 0) {
    const path = join(repoRoot, context.profile.runtime.review_scope);
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.tmp-${String(process.pid)}`;
    writeFileSync(temporary, canonical(manifestValue));
    renameSync(temporary, path);
  }
  emit({
    ok: findings.length === 0,
    command: 'review-scope',
    round,
    cycle,
    manifest: manifestValue,
    findings,
  });
}

export function parseStructuredReviewResult(path) {
  const source = readFileSync(path, 'utf8').trim();
  try {
    return JSON.parse(source);
  } catch {
    const records = source
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const headers = records.filter(({ type }) => type === 'header');
    const terminals = records.filter(({ type }) => type === 'terminal');
    const allowed = new Set(['header', 'disposition', 'finding', 'terminal']);
    const canonicalStream =
      records.length >= 2 &&
      records[0]?.type === 'header' &&
      records.at(-1)?.type === 'terminal' &&
      headers.length === 1 &&
      terminals.length === 1 &&
      records.every(({ type }) => allowed.has(type));
    const header = headers[0] ?? {};
    const terminalRecord = terminals[0];
    const parsed = {
      ...header,
      dispositions: records
        .filter(({ type }) => type === 'disposition')
        .map(({ type: _type, ...value }) => value),
      findings: records
        .filter(({ type }) => type === 'finding')
        .map(({ type: _type, ...value }) => value),
      terminal:
        terminalRecord === undefined
          ? undefined
          : (({ type: _type, ...value }) => value)(terminalRecord),
    };
    delete parsed.type;
    Object.defineProperty(parsed, '__jsonlCanonical', {
      value: canonicalStream,
      enumerable: false,
    });
    return parsed;
  }
}

export function recordInvalidTransport(context, round, cycle, candidate, manifestDigest) {
  const name = `review-transport-${String(cycle)}.json`;
  const prior = readState(repoRoot, round, name);
  const sameIdentity =
    prior.value?.candidate === candidate &&
    prior.value?.cycle === cycle &&
    prior.value?.manifest_digest === manifestDigest;
  const attempts = Number(sameIdentity ? (prior.value?.attempts ?? 0) : 0) + 1;
  writeState(repoRoot, round, name, {
    attempts,
    round,
    cycle,
    candidate,
    manifest_digest: manifestDigest,
  });
  if (attempts > context.profile.review_budget.transport_retries_per_cycle) {
    writeState(repoRoot, round, 'review-state.json', {
      state: 'REVIEW_TRANSPORT_BLOCKED',
      cycle,
      candidate,
      manifest_digest: manifestDigest,
    });
    return true;
  }
  return false;
}

export function reviewCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const cycle = Number(option('--cycle') ?? '1');
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const context = loadV3Context(round, findings);
  if (![1, 2].includes(cycle)) {
    findings.push(
      finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'review cycle 3 is mechanically forbidden', {
        cycle,
      }),
    );
    emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
    return;
  }
  if (context === null)
    return emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
  let manifestValue = null;
  try {
    manifestValue = readJson(join(repoRoot, context.profile.runtime.review_scope));
    const { manifest_digest_sha256: claimed, ...body } = manifestValue;
    if (
      claimed !== sha256(canonical(body)) ||
      manifestValue.review_candidate !== candidate ||
      manifestValue.cycle !== cycle
    ) {
      throw new Error('review-scope identity or digest mismatch');
    }
  } catch (error) {
    findings.push(finding('REVIEW_SCOPE_MANIFEST_INVALID', String(error)));
  }
  const storedState = readState(repoRoot, round, 'review-state.json');
  if (
    cycle === 2 &&
    (storedState.status !== 'valid' ||
      storedState.value?.state !== 'REPAIR_REQUIRED' ||
      storedState.value?.candidate === candidate)
  ) {
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_INVALID',
        'cycle 2 requires a cycle-1 repair state and a newly frozen candidate',
      ),
    );
  }
  let result = null;
  try {
    result = parseStructuredReviewResult(resolve(repoRoot, option('--review-result') ?? ''));
    if (result.__jsonlCanonical === false)
      findings.push(
        finding(
          'REVIEW_JSONL_NON_CANONICAL',
          'JSONL must contain exactly one first header, one last terminal, and only known records',
        ),
      );
    if (
      !validateDocument(
        result,
        context.policy.schemas.review_result,
        findings,
        'REVIEW_RESULT_INVALID',
        'review result',
      )
    )
      result = null;
  } catch (error) {
    findings.push(
      finding('REVIEW_RESULT_INVALID', `review result is malformed or truncated: ${String(error)}`),
    );
  }
  if (result === null || manifestValue === null) {
    const blocked = recordInvalidTransport(
      context,
      round,
      cycle,
      candidate,
      manifestValue?.manifest_digest_sha256 ?? null,
    );
    if (blocked)
      findings.push(finding('REVIEW_TRANSPORT_BLOCKED', 'transport retry budget is exhausted'));
    emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
    return;
  }
  if (
    result.round !== round ||
    result.cycle !== cycle ||
    result.review_candidate !== candidate ||
    result.manifest_digest !== manifestValue.manifest_digest_sha256 ||
    result.policy_digest !== manifestValue.policy_digest
  ) {
    findings.push(
      finding(
        'REVIEW_RESULT_IDENTITY_INVALID',
        'review result does not bind exact candidate, manifest, policy, and cycle',
      ),
    );
  }
  const topics = new Map(manifestValue.topics.map((topic) => [topic.topic_id, topic]));
  const resultFindings = new Map((result.findings ?? []).map((entry) => [entry.finding_id, entry]));
  const seen = new Set();
  for (const disposition of result.dispositions) {
    if (seen.has(disposition.topic_id))
      findings.push(
        finding('REVIEW_TOPIC_DUPLICATED', 'review topic is duplicated', {
          topic_id: disposition.topic_id,
        }),
      );
    seen.add(disposition.topic_id);
    const topic = topics.get(disposition.topic_id);
    if (topic === undefined) {
      findings.push(
        finding('REVIEW_TOPIC_UNKNOWN', 'review result contains unknown topic', {
          topic_id: disposition.topic_id,
        }),
      );
      continue;
    }
    if (!topic.allowed_dispositions.includes(disposition.disposition))
      findings.push(
        finding('REVIEW_TOPIC_DISPOSITION_INVALID', 'disposition is not allowed for topic state', {
          topic_id: disposition.topic_id,
        }),
      );
    if (disposition.recomputed_digest !== topic.current_digest)
      findings.push(
        finding('REVIEW_TOPIC_DIGEST_INVALID', 'topic digest was not independently recomputed', {
          topic_id: disposition.topic_id,
        }),
      );
    if (
      disposition.disposition === 'REUSED_FRESH_PASS' &&
      (topic.changed_status !== 'unchanged' ||
        disposition.evidence_refs.length === 0 ||
        disposition.justification.trim().length < 20)
    )
      findings.push(
        finding(
          'REVIEW_TOPIC_FRESHNESS_UNVERIFIED',
          'unchanged topic reuse lacks independent evidence and reasoning',
          { topic_id: disposition.topic_id },
        ),
      );
    if (['RECHECKED_FAIL', 'BLOCKED'].includes(disposition.disposition))
      findings.push(
        finding('REVIEW_TOPIC_NOT_PASSING', 'topic is failed or blocked', {
          topic_id: disposition.topic_id,
        }),
      );
    for (const findingId of disposition.finding_ids ?? []) {
      const linked = resultFindings.get(findingId);
      if (linked === undefined || !(linked.topic_ids ?? []).includes(disposition.topic_id))
        findings.push(
          finding(
            'REVIEW_FINDING_LINK_INVALID',
            'disposition finding link is orphaned or mismatched',
            {
              topic_id: disposition.topic_id,
              finding_id: findingId,
            },
          ),
        );
    }
  }
  for (const entry of result.findings ?? []) {
    for (const topicId of entry.topic_ids ?? []) {
      const disposition = result.dispositions.find(({ topic_id }) => topic_id === topicId);
      if (disposition === undefined || !(disposition.finding_ids ?? []).includes(entry.finding_id))
        findings.push(
          finding('REVIEW_FINDING_LINK_INVALID', 'finding topic link is not reciprocal', {
            topic_id: topicId,
            finding_id: entry.finding_id,
          }),
        );
    }
  }
  for (const id of topics.keys())
    if (!seen.has(id))
      findings.push(
        finding('REVIEW_TOPIC_OMITTED', 'mandatory topic is omitted', { topic_id: id }),
      );
  const counts = Object.fromEntries(
    ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'].map((name) => [
      name,
      result.dispositions.filter(({ disposition }) => disposition === name).length,
    ]),
  );
  if (
    result.terminal.topic_count !== topics.size ||
    result.terminal.finding_count !== result.findings.length ||
    canonical(result.terminal.disposition_counts) !== canonical(counts) ||
    result.terminal.complete !== true
  )
    findings.push(
      finding('REVIEW_TERMINAL_INVALID', 'terminal counts do not match the complete parsed result'),
    );
  if (
    result.terminal.verdict === 'PASS' &&
    (findings.length > 0 || result.findings.some(({ severity }) => ['P0', 'P1'].includes(severity)))
  ) {
    findings.push(
      finding(
        'REVIEW_PASS_INVALID',
        'PASS contains failed, blocked, incomplete, or unresolved high-risk findings',
      ),
    );
  }
  const valid = findings.length === 0;
  const state =
    valid && result.terminal.verdict === 'PASS'
      ? 'PASS'
      : cycle === 1
        ? 'REPAIR_REQUIRED'
        : 'ESCALATION_REQUIRED';
  writeState(repoRoot, round, 'review-state.json', {
    state,
    cycle,
    candidate,
    manifest_digest: manifestValue.manifest_digest_sha256,
  });
  emit({
    ok: valid && result.terminal.verdict === 'PASS',
    command: 'review-check',
    round,
    candidate,
    cycle,
    state,
    findings,
  });
}

export function statusV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV3Context(round, findings);
  const stored = readState(repoRoot, round, 'review-state.json');
  const state = stored.status === 'valid' ? stored.value.state : 'DRAFT';
  const cycle = Number(stored.value?.cycle ?? 0);
  const transport =
    cycle > 0
      ? readState(repoRoot, round, `review-transport-${String(cycle)}.json`)
      : { value: null };
  const binding = context === null ? [] : reviewerBindingFindings(context);
  emit({
    ok: findings.length === 0,
    command: 'status',
    round,
    state,
    substantive_cycles: {
      used: cycle,
      maximum: context?.profile.review_budget.substantive_cycles ?? 2,
    },
    transport_retries_per_cycle: {
      used: Number(transport.value?.attempts ?? 0),
      maximum: context?.profile.review_budget.transport_retries_per_cycle ?? 1,
    },
    entry_ready: binding.length === 0,
    diagnostics: binding,
    findings,
  });
}

// Policy v4 is intentionally implemented beside the immutable v2/v3 compatibility
// engines. Runtime evidence is authenticated at every read boundary; parseable JSON
// alone never has standing.
export function loadV4Context(round, findings, candidate = null) {
  const policy = loadPolicy(findings);
  if (policy === null) return null;
  if (!['4.0.0', '5.0.0'].includes(policy.schemaVersion)) {
    findings.push(
      finding('POLICY_VERSION_INVALID', 'generic close controls require policy v4 or v5'),
    );
    return null;
  }
  // Per DII-253 this document selects control behaviour, so it is an authenticated input in
  // its own right. Validating only the round profile left the document that chooses the
  // machine's vocabulary unchecked, and a policy missing a required declaration was
  // consumed silently. Older policies that declare no schema for themselves keep their
  // previous behaviour rather than failing closed on a key they cannot carry.
  if (
    typeof policy.schemas?.round_close_controls === 'string' &&
    !validateDocument(
      policy,
      policy.schemas.round_close_controls,
      findings,
      'POLICY_DOCUMENT_INVALID',
      'round close controls policy',
    )
  )
    return null;
  let roundExpression;
  try {
    roundExpression = new RegExp(policy.profile_discovery?.round_pattern ?? '^$', 'u');
  } catch (error) {
    findings.push(finding('ROUND_PATTERN_INVALID', String(error)));
    return null;
  }
  if (!roundExpression.test(round)) {
    findings.push(finding('ROUND_INVALID', 'round must match the configured pattern', { round }));
    return null;
  }
  const profilePath = v3ProfilePath(policy, round);
  let profile;
  try {
    profile =
      candidate === null
        ? readJson(join(repoRoot, profilePath))
        : JSON.parse(candidateFile(repoRoot, candidate, profilePath));
  } catch (error) {
    findings.push(
      finding('ROUND_PROFILE_INVALID', `round profile is unavailable: ${String(error)}`),
    );
    return null;
  }
  validateDocument(
    profile,
    policy.schemas.round_profile,
    findings,
    'ROUND_PROFILE_INVALID',
    'round profile',
  );
  if (profile.round !== round || profile.policy_version !== policy.policy_version) {
    findings.push(
      finding('ROUND_PROFILE_IDENTITY_INVALID', 'round profile differs from policy invocation'),
    );
  }
  const loadRoundDocument = (sourceKey, schemaKey, code) => {
    const path = profile.sources?.[sourceKey];
    try {
      const value =
        candidate === null
          ? readJson(join(repoRoot, path))
          : JSON.parse(candidateFile(repoRoot, candidate, path));
      if (sourceKey === 'current_claims' && value.mode === 'registry') {
        const registryFindings = [];
        validateDocument(value, policy.schemas[schemaKey], registryFindings, code, sourceKey);
        for (const entry of registryFindings) {
          const remainingErrors = (entry.errors ?? []).filter(
            (error) =>
              !(
                error.keyword === 'pattern' &&
                /^\/claims\/[0-9]+\/runtime_parameters\/[^/]+\/source$/u.test(error.instancePath)
              ),
          );
          if (remainingErrors.length > 0 || !Array.isArray(entry.errors))
            findings.push({
              ...entry,
              ...(Array.isArray(entry.errors) ? { errors: remainingErrors } : {}),
            });
        }
      } else {
        validateDocument(value, policy.schemas[schemaKey], findings, code, sourceKey);
      }
      if (Object.hasOwn(value, 'round') && value.round !== round)
        findings.push(finding(`${code}_ROUND`, `${sourceKey} round differs from profile`));
      return value;
    } catch (error) {
      findings.push(finding(code, `${sourceKey} is unavailable: ${String(error)}`, { path }));
      return null;
    }
  };
  const graph = loadRoundDocument('affected_test_graph', 'affected_test_graph', 'GRAPH_INVALID');
  const obligations = loadRoundDocument(
    'obligations',
    'semantic_obligations',
    'OBLIGATIONS_INVALID',
  );
  let obligationBaseline = null;
  if (profile.sources?.obligation_baseline) {
    try {
      obligationBaseline =
        candidate === null
          ? readJson(join(repoRoot, profile.sources.obligation_baseline))
          : JSON.parse(candidateFile(repoRoot, candidate, profile.sources.obligation_baseline));
      if (
        obligationBaseline.round !== round ||
        obligationBaseline.derivation !== 'independent-policy-baseline'
      )
        findings.push(
          finding(
            'OBLIGATION_BASELINE_INVALID',
            'independent obligation baseline identity is invalid',
          ),
        );
    } catch (error) {
      findings.push(
        finding('OBLIGATION_BASELINE_INVALID', 'independent obligation baseline is unavailable', {
          detail: String(error),
        }),
      );
    }
  }
  const claimsRegistry = loadRoundDocument('current_claims', 'current_claims', 'CLAIMS_INVALID');
  const priorFindingRegistry = profile.sources?.prior_finding_registry
    ? loadRoundDocument(
        'prior_finding_registry',
        'prior_finding_registry',
        'PRIOR_FINDINGS_INVALID',
      )
    : null;
  const controlProvenance = profile.sources?.control_provenance
    ? loadRoundDocument('control_provenance', 'control_provenance', 'CONTROL_PROVENANCE_INVALID')
    : null;
  const remediationClosureMatrix = profile.sources?.remediation_closure_matrix
    ? loadRoundDocument(
        'remediation_closure_matrix',
        'remediation_closure_matrix',
        'REMEDIATION_CLOSURE_MATRIX_INVALID',
      )
    : null;
  // The bound closure matrix must enumerate every class still OPEN in the
  // independently loaded prior-finding registry. The floor is derived from evidence,
  // so a coordinated deletion from the matrix and its tests still fails here.
  if (
    capability({ policy }, 'closure_matrix_registry_floor') &&
    remediationClosureMatrix !== null &&
    priorFindingRegistry !== null
  ) {
    const bound = new Set(
      (remediationClosureMatrix.classes ?? []).map(({ finding_id: id }) => String(id)),
    );
    const missing = (priorFindingRegistry.finding_classes ?? [])
      .filter(({ disposition }) => disposition === 'OPEN')
      .map(({ finding_id: id }) => String(id))
      .filter((id) => !bound.has(id));
    if (missing.length > 0)
      findings.push(
        finding(
          'REMEDIATION_MATRIX_POPULATION_INCOMPLETE',
          'bound closure matrix omits prior findings that remain OPEN in the registry',
          { missing, matrix: profile.sources.remediation_closure_matrix },
        ),
      );
  }
  if (graph !== null) {
    topologicalNodes(graph, findings);
    validateGateCommandClosureV6({ policy, graph, candidate, profile }, findings);
  }
  return {
    policy,
    profile,
    profilePath,
    graph,
    obligations,
    obligationBaseline,
    claimsRegistry,
    priorFindingRegistry,
    controlProvenance,
    remediationClosureMatrix,
    candidate,
    digests: {
      policy: sha256(canonical(policy)),
      profile: sha256(canonical(profile)),
      graph: graph === null ? sha256('MISSING\n') : sha256(canonical(graph)),
      obligations: obligations === null ? sha256('MISSING\n') : sha256(canonical(obligations)),
      obligationBaseline:
        obligationBaseline === null ? sha256('MISSING\n') : sha256(canonical(obligationBaseline)),
      claimsRegistry:
        claimsRegistry === null ? sha256('MISSING\n') : sha256(canonical(claimsRegistry)),
      priorFindings:
        priorFindingRegistry === null
          ? sha256(canonical([]))
          : sha256(canonical(priorFindingRegistry)),
      controlProvenance:
        controlProvenance === null ? sha256('MISSING\n') : sha256(canonical(controlProvenance)),
      remediationClosureMatrix:
        remediationClosureMatrix === null
          ? sha256('MISSING\n')
          : sha256(canonical(remediationClosureMatrix)),
    },
  };
}

export function selfDigestValid(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const { [field]: claimed, ...body } = value;
  return typeof claimed === 'string' && claimed === sha256(canonical(body));
}

export function withSelfDigest(body, field) {
  return { ...body, [field]: sha256(canonical(body)) };
}

export function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${String(process.pid)}-${sha256(String(Date.now())).slice(0, 8)}`;
  writeFileSync(temporary, canonical(value));
  renameSync(temporary, path);
}

export function writeBytesAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${String(process.pid)}-${sha256(String(Date.now())).slice(0, 8)}`;
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}

export function parseMandateContainer(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source);
  if (match === null) return null;
  try {
    const value = parseYaml(match[1]);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export function fencedBindingObjects(source, markerField = 'devai_reviewer_binding') {
  const values = [];
  const malformed = [];
  const expression = /```(?:json|yaml|yml)\s*\r?\n([\s\S]*?)\r?\n```/giu;
  for (const match of source.matchAll(expression)) {
    const raw = match[1].trim();
    let value;
    try {
      value = /^\s*\{/u.test(raw) ? JSON.parse(raw) : parseYaml(raw);
    } catch (error) {
      if (raw.includes(markerField)) malformed.push(String(error));
      continue;
    }
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.hasOwn(value, markerField)
    )
      values.push(value);
  }
  return { values, malformed };
}

export function resolveExactCandidateV6(revision, findings) {
  if (!SHA40.test(revision)) {
    findings.push(
      finding(
        'REVIEWER_BINDING_CANDIDATE_REQUIRED',
        'authoritative reviewer boundary requires a literal 40-hex candidate commit',
        { revision },
      ),
    );
    return null;
  }
  try {
    const candidate = git(repoRoot, ['rev-parse', `${revision}^{commit}`]);
    if (!SHA40.test(candidate)) throw new Error('resolved revision is not one exact commit SHA');
    return candidate;
  } catch (error) {
    findings.push(
      finding(
        'REVIEWER_BINDING_CANDIDATE_REQUIRED',
        'reviewer authority requires one exact candidate commit',
        { revision, detail: String(error) },
      ),
    );
    return null;
  }
}

/**
 * An authoritative consumer binds exactly one literal candidate. The revision is never
 * inferred from the worktree, and no worktree byte is read to decide whether the rule
 * applies: reading mutable policy or profile here would let a dirty tree choose its own
 * strictness, which is the defect this resolution closes.
 */
export function resolveConsumerCandidateV8(_round, findings) {
  return resolveExactCandidateV6(option('--candidate') ?? '', findings);
}

export function reviewerBindingV4(context, revision) {
  const findings = [];
  const candidates = [];
  const exactCandidate = resolveExactCandidateV6(revision, findings);
  if (exactCandidate === null)
    return { findings, diagnostic: null, selected: null, profileBound: false };
  let tracked;
  try {
    tracked = trackedPaths(repoRoot, exactCandidate).filter((path) =>
      /^product\/owner-mandates\/OM-[0-9]+\.md$/u.test(path),
    );
  } catch (error) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_UNREADABLE',
        'candidate-tree reviewer binding census is unavailable',
        { revision: exactCandidate, detail: String(error) },
      ),
    );
    return { findings, diagnostic: null, selected: null, profileBound: false };
  }
  for (const path of tracked) {
    let source;
    try {
      source = git(repoRoot, ['show', `${exactCandidate}:${path}`]);
    } catch (error) {
      findings.push(
        finding(
          'ENTRY_BLOCKED_REVIEWER_BINDING_UNREADABLE',
          'tracked reviewer binding source is unreadable',
          { path, detail: String(error) },
        ),
      );
      continue;
    }
    const container = parseMandateContainer(source);
    const extracted = fencedBindingObjects(source);
    for (const detail of extracted.malformed)
      findings.push(
        finding(
          'ENTRY_BLOCKED_REVIEWER_BINDING_SCHEMA_INVALID',
          'reviewer binding marker is malformed',
          { path, detail },
        ),
      );
    for (const marker of extracted.values) {
      const local = [];
      const valid = validateDocument(
        marker,
        context.policy.schemas.reviewer_binding,
        local,
        'ENTRY_BLOCKED_REVIEWER_BINDING_SCHEMA_INVALID',
        'reviewer binding',
      );
      if (!valid) {
        findings.push(...local.map((entry) => ({ ...entry, path })));
        continue;
      }
      if (
        container === null ||
        container.id !== marker.mandate_id ||
        container.status !== marker.mandate_status ||
        container.authority !== 'Owner'
      ) {
        findings.push(
          finding(
            'ENTRY_BLOCKED_REVIEWER_BINDING_CONTAINER_MISMATCH',
            'binding marker disagrees with its Owner mandate container',
            { path },
          ),
        );
        continue;
      }
      candidates.push({ path, marker, digest: sha256(canonical(marker)) });
    }
  }
  const relevant = candidates.filter(({ marker }) => marker.round === context.profile.round);
  const reviewer = context.profile.reviewer;
  const profileBound = reviewer?.mandate_id !== null && reviewer?.model_selector !== null;
  if (relevant.length > 1)
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS',
        'more than one complete active binding selects the round',
        { mandate_ids: relevant.map(({ marker }) => marker.mandate_id) },
      ),
    );
  if (relevant.length === 0) {
    const diagnostic = finding(
      'ENTRY_BLOCKED_REVIEWER_UNBOUND',
      'round reviewer has no tracked complete active binding',
    );
    return { findings, diagnostic, selected: null, profileBound };
  }
  const selected = relevant[0];
  if (reviewer?.fallback !== 'forbidden')
    findings.push(
      finding('REVIEWER_FALLBACK_FORBIDDEN', 'reviewer fallback must remain forbidden'),
    );
  if (
    !profileBound ||
    selected.marker.mandate_id !== reviewer.mandate_id ||
    selected.marker.model_selector !== reviewer.model_selector ||
    selected.marker.role !== reviewer.role ||
    selected.marker.fallback !== reviewer.fallback
  ) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_CONFLICT',
        'profile and structured reviewer binding disagree',
      ),
    );
  }
  return { findings, diagnostic: null, selected, profileBound };
}

export function roundDeclarationV4(context, candidate, findings, required = true) {
  const candidates = [];
  const path = 'law/register/DECISIONS.md';
  let source = '';
  try {
    source = git(repoRoot, ['show', `${candidate}:${path}`]);
  } catch (error) {
    if (required)
      findings.push(
        finding('ROUND_DECLARATION_INVALID', 'exact candidate declaration register is unreadable', {
          detail: String(error),
        }),
      );
    return null;
  }
  const sections = source.split(/(?=^### DII-[0-9]+\b)/gmu);
  for (const section of sections) {
    const heading = /^### (DII-[0-9]+)\b/mu.exec(section)?.[1];
    if (heading === undefined) continue;
    const extracted = fencedBindingObjects(section, 'devai_round_declaration');
    for (const detail of extracted.malformed)
      findings.push(
        finding('ROUND_DECLARATION_MALFORMED', 'marker-shaped round declaration is malformed', {
          decision_id: heading,
          detail,
        }),
      );
    for (const { devai_round_declaration: marker, ...value } of extracted.values) {
      if (marker !== true) continue;
      const declaration = { devai_round_declaration: marker, ...value };
      const local = [];
      if (
        validateDocument(
          declaration,
          context.policy.schemas.round_declaration,
          local,
          'ROUND_DECLARATION_SCHEMA_INVALID',
          'round declaration',
        ) &&
        declaration.round === context.profile.round &&
        declaration.decision_id === heading
      )
        candidates.push({ path, declaration, digest: sha256(canonical(declaration)) });
      else findings.push(...local);
    }
  }
  if (candidates.length !== 1) {
    if (required)
      findings.push(
        finding(
          'ROUND_DECLARATION_INVALID',
          'exact candidate tree must contain exactly one schema-valid round declaration',
          { count: candidates.length },
        ),
      );
    return null;
  }
  const selected = candidates[0];
  if (
    context.profile.declaration?.decision_id !== selected.declaration.decision_id ||
    context.profile.declaration?.exact_base !== selected.declaration.exact_base
  ) {
    findings.push(
      finding(
        'ROUND_DECLARATION_INVALID',
        'profile declaration differs from the exact candidate-tree Architect marker',
      ),
    );
    return null;
  }
  return selected;
}

export function deriveControlProvenanceV6(context, candidate, findings) {
  const tree = candidateTreeEntries(candidate);
  const provenancePath = context.profile.sources.control_provenance;
  let provenance;
  try {
    provenance = JSON.parse(candidateFile(repoRoot, candidate, provenancePath));
    validateDocument(
      provenance,
      context.policy.schemas.control_provenance,
      findings,
      'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
      'control provenance',
    );
  } catch (error) {
    findings.push(
      finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'control provenance cannot be authenticated', {
        detail: String(error),
      }),
    );
    return null;
  }
  if (
    provenance.round !== context.profile.round ||
    (provenance.root_decision !== context.policy.decision_id &&
      provenance.discovery_mode?.decisions !== 'exact-register-transitive-from-root')
  ) {
    findings.push(
      finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'control provenance root identity is stale'),
    );
  }

  const entries = [];
  const ids = new Set();
  const paths = new Set();
  const sourceBytes = (sourceRef) => {
    const [path, fragment] = sourceRef.split('#', 2);
    const objectId = tree.get(path);
    if (objectId === undefined) throw new Error(`untracked source ${path}`);
    const raw = gitBytes(repoRoot, ['cat-file', 'blob', objectId]);
    if (fragment === undefined) return raw;
    const text = raw.toString('utf8');
    if (/^DII-[0-9]+$/u.test(fragment)) {
      const sections = text.split(/(?=^### DII-[0-9]+\b)/gmu);
      const section = sections.find((value) => value.startsWith(`### ${fragment} `));
      if (section === undefined) throw new Error(`decision section ${fragment} is missing`);
      return Buffer.from(section);
    }
    return raw;
  };
  const add = (controlId, kind, sourceRef, derivation, status = 'active') => {
    if (ids.has(controlId)) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_DUPLICATE_ID', 'active control ID is duplicated', {
          control_id: controlId,
        }),
      );
      return;
    }
    if (paths.has(sourceRef)) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_DUPLICATE_PATH', 'active control source is duplicated', {
          path: sourceRef,
        }),
      );
      return;
    }
    if (status !== 'active') {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_INACTIVE', 'referenced control is not active', {
          control_id: controlId,
          path: sourceRef,
          status,
        }),
      );
      return;
    }
    try {
      ids.add(controlId);
      paths.add(sourceRef);
      entries.push({
        control_id: controlId,
        kind,
        path: sourceRef,
        status: 'active',
        derivation,
        raw_digest: sha256(sourceBytes(sourceRef)),
      });
    } catch (error) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_UNTRACKED', 'derived control source is unresolved', {
          control_id: controlId,
          path: sourceRef,
          detail: String(error),
        }),
      );
    }
  };
  const addSource = (sourceRef, derivation = 'profile-source') => {
    if (typeof sourceRef !== 'string' || sourceRef.length === 0 || paths.has(sourceRef)) return;
    add(`source:${sha256(sourceRef).slice(0, 24)}`, 'tracked-manifest', sourceRef, derivation);
  };

  const decisionRows = provenance.decisions ?? [];
  const decisionIds = decisionRows.map(({ decision_id }) => decision_id);
  if (new Set(decisionIds).size !== decisionIds.length)
    findings.push(
      finding(
        'ACTIVE_CONTROL_CENSUS_DUPLICATE_ID',
        'decision identifiers must be unique before provenance map construction',
      ),
    );
  const decisions = new Map(decisionRows.map((entry) => [entry.decision_id, entry]));
  const visiting = new Set();
  const visited = new Set();
  const registerSource = candidateFile(repoRoot, candidate, provenance.decision_register);
  const registerSections = new Map(
    registerSource
      .split(/(?=^### DII-[0-9]+\b)/gmu)
      .map((section) => [/^### (DII-[0-9]+)\b/mu.exec(section)?.[1], section])
      .filter(([decisionId]) => decisionId !== undefined),
  );
  const derivedDependencies = (decisionId) => {
    const section = registerSections.get(decisionId) ?? '';
    const metadata = section.split('\n')[1] ?? '';
    return [
      ...new Set(
        [...metadata.matchAll(/\bDII-[0-9]+\b/gu)]
          .map(([id]) => id)
          .filter((id) => id !== decisionId && registerSections.has(id)),
      ),
    ].sort();
  };
  for (const row of decisionRows) {
    const derived = derivedDependencies(row.decision_id);
    if (canonical([...(row.depends_on ?? [])].sort()) !== canonical(derived))
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
          'declared decision edges differ from exact-register dependencies',
          { decision_id: row.decision_id, declared: row.depends_on ?? [], derived },
        ),
      );
  }
  const visitDecision = (decisionId) => {
    if (visited.has(decisionId)) return;
    if (visiting.has(decisionId)) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'decision provenance contains a cycle', {
          decision_id: decisionId,
        }),
      );
      return;
    }
    const declaration = decisions.get(decisionId);
    if (declaration === undefined) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'transitive decision is undeclared', {
          decision_id: decisionId,
        }),
      );
      return;
    }
    visiting.add(decisionId);
    for (const dependency of declaration.depends_on ?? []) visitDecision(dependency);
    visiting.delete(decisionId);
    visited.add(decisionId);
    const section = registerSections.get(decisionId);
    const active =
      section !== undefined &&
      /`type: decision · status: active · authority: Architect\b/u.test(section);
    add(
      decisionId,
      'architect-decision',
      `${provenance.decision_register}#${decisionId}`,
      'decision-provenance',
      declaration.status === 'active' && active ? 'active' : 'inactive',
    );
  };
  visitDecision(provenance.root_decision);
  if (visited.size !== decisions.size)
    findings.push(
      finding('ACTIVE_CONTROL_CENSUS_EXTRA', 'provenance declares unreachable decision rows'),
    );

  const mandateDerivationRequired =
    provenance.discovery_mode?.owner_mandates === 'exact-candidate-transitive-references';
  const referencedMandateIds = new Set();
  const collectMandateReferences = (value) => {
    for (const match of value.matchAll(/\bOM-[0-9]+\b/gu)) referencedMandateIds.add(match[0]);
  };
  for (const decisionId of visited) {
    const section = registerSections.get(decisionId);
    if (section !== undefined) collectMandateReferences(section.split('\n')[1] ?? '');
  }
  for (const path of [
    context.profile.sources.authorization,
    context.profile.sources.plan,
    context.profile.sources.orchestrator,
  ])
    if (typeof path === 'string')
      collectMandateReferences(candidateFile(repoRoot, candidate, path));
  const mandateRows = provenance.owner_mandates ?? [];
  const declaredMandateIds = mandateRows.map(({ mandate_id: mandateId }) => mandateId);
  if (
    mandateDerivationRequired &&
    (new Set(declaredMandateIds).size !== declaredMandateIds.length ||
      canonical([...declaredMandateIds].sort()) !== canonical([...referencedMandateIds].sort()))
  )
    findings.push(
      finding(
        'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
        'declared Owner mandates differ from exact-candidate transitive authority references',
        {
          declared: [...declaredMandateIds].sort(),
          derived: [...referencedMandateIds].sort(),
        },
      ),
    );

  for (const mandate of mandateRows) {
    if (mandate.path !== `product/owner-mandates/${mandate.mandate_id}.md`)
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
          'Owner mandate path differs from its exact conventional identity',
          { mandate_id: mandate.mandate_id, path: mandate.path },
        ),
      );
    let container = null;
    try {
      container = parseMandateContainer(candidateFile(repoRoot, candidate, mandate.path));
    } catch {
      container = null;
    }
    const status =
      container?.id === mandate.mandate_id &&
      container?.authority === 'Owner' &&
      container?.status === mandate.required_status
        ? 'active'
        : 'inactive';
    if (status !== 'active')
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_CONFLICT',
          'Owner mandate container conflicts with structured control provenance',
          { mandate_id: mandate.mandate_id, path: mandate.path },
        ),
      );
    add(mandate.mandate_id, 'owner-mandate', mandate.path, 'authority-reference', status);
  }

  add(context.policy.policy_id, 'policy', 'law/policy/round-close-controls.json', 'profile-source');
  for (const [schemaId, path] of Object.entries(context.policy.schemas ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  ))
    add(`schema:${schemaId}`, 'policy-schema', path, 'policy-schema-map');
  add(`profile:${context.profile.round}`, 'round-profile', context.profilePath, 'profile-source');
  add(
    `graph:${context.profile.round}`,
    'affected-test-graph',
    context.profile.sources.affected_test_graph,
    'profile-source',
  );
  add(
    `obligations:${context.profile.round}`,
    'obligation-registry',
    context.profile.sources.obligations,
    'profile-source',
  );
  add(
    `claims:${context.profile.round}`,
    'current-claim-registry',
    context.profile.sources.current_claims,
    'profile-source',
  );
  add(
    `prior-findings:${context.profile.round}`,
    'prior-finding-registry',
    context.profile.sources.prior_finding_registry,
    'profile-source',
  );
  addSource(provenancePath);
  addSource(context.profile.sources.remediation_closure_matrix);
  for (const path of provenance.manifest_roots ?? []) addSource(path, 'profile-manifest');
  for (const path of provenance.normative_source_roots ?? []) addSource(path, 'profile-manifest');
  for (const findingClass of context.priorFindingRegistry?.finding_classes ?? [])
    addSource(findingClass.origin_evidence.split('#', 1)[0], 'profile-manifest');
  for (const obligation of context.obligations?.obligations ?? [])
    for (const sourceRef of obligation.source_refs ?? []) addSource(sourceRef, 'profile-manifest');

  if (context.profile.declaration?.decision_id !== null) {
    const declaration = roundDeclarationV4(context, candidate, findings);
    if (declaration !== null && !paths.has(declaration.path))
      add(
        `declaration:${declaration.declaration.decision_id}`,
        'round-declaration',
        declaration.path,
        'declaration-binding',
      );
  }

  entries.sort((left, right) =>
    `${left.kind}\0${left.control_id}\0${left.path}`.localeCompare(
      `${right.kind}\0${right.control_id}\0${right.path}`,
    ),
  );
  const body = {
    schemaVersion: '1.0.0',
    round: context.profile.round,
    candidate_sha: candidate,
    candidate_tree: git(repoRoot, ['rev-parse', `${candidate}^{tree}`]),
    policy_digest: context.digests.policy,
    profile_digest: context.digests.profile,
    entries,
    entry_count: entries.length,
    population_digest: sha256(canonical(entries)),
  };
  const census = withSelfDigest(body, 'census_digest_sha256');
  if (entries.length === 0)
    findings.push(finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'active control census is empty'));
  validateDocument(
    census,
    context.policy.schemas.active_control_census,
    findings,
    'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
    'active control census',
  );
  return findings.some(({ code }) => code.startsWith('ACTIVE_CONTROL_CENSUS_')) ? null : census;
}

export function deriveActiveControlCensusV5(context, candidate, findings) {
  return deriveControlProvenanceV6(context, candidate, findings);
}

export function affectedExecutionV4(context, exactBase, candidate, passes, findings) {
  const executionPasses = passes.map((pass, index) => {
    const nodes = pass.affected_results.map((entry) => {
      const body = {
        node_id: entry.node_id ?? entry.task_id,
        outcome: entry.plan_outcome ?? entry.outcome,
        result: entry.result,
        reason_codes: [...new Set(entry.reason_codes ?? ['NO_FRESH_RESULT'])].sort(),
        changed_inputs: [...new Set(entry.changed_inputs ?? [])].sort(),
        task_key: entry.task_key,
        gate_freshness_profile_digest: entry.gate_freshness_profile_digest,
        input_manifest_digest: entry.input_manifest_digest,
        dependency_input_manifest_digest: sha256(canonical(entry.dependency_input_manifest ?? [])),
        dependency_keys: entry.dependency_keys ?? {},
        toolchain_digest: entry.toolchain_digest,
        environment_digest: entry.environment_digest,
        fallback_population: entry.fallback_population ?? null,
        output_contract: entry.output_contract ?? 'none',
        outputs_digest: sha256(canonical(entry.outputs ?? [])),
      };
      return withSelfDigest(body, 'result_digest');
    });
    const plan = nodes.map(
      ({ result: _result, result_digest: _digest, outputs_digest: _outputs, ...entry }) => entry,
    );
    return withSelfDigest(
      {
        pass_number: index + 1,
        plan_digest: sha256(canonical(plan)),
        result_population_digest: sha256(canonical(nodes)),
        nodes,
      },
      'pass_digest_sha256',
    );
  });
  const changeRecords = (committedChangeRecords(exactBase, candidate, findings) ?? []).map(
    (record) => {
      const body = {
        record_id: record.record_id,
        status: record.status.startsWith('R')
          ? 'R'
          : record.status.startsWith('C')
            ? 'C'
            : record.status,
        preimage: record.preimage,
        postimage: record.postimage,
        affected_paths: [...new Set(record.paths)].sort(),
      };
      return { ...body, record_digest: sha256(canonical(body)) };
    },
  );
  const execution = withSelfDigest(
    {
      schemaVersion: context.policy.schemaVersion === '5.0.0' ? '2.0.0' : '1.0.0',
      round: context.profile.round,
      exact_base: exactBase,
      candidate_sha: candidate,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      ...(context.policy.schemaVersion === '5.0.0' ? { change_records: changeRecords } : {}),
      passes: executionPasses,
    },
    'execution_digest_sha256',
  );
  const validationFindings = [];
  validateDocument(
    execution,
    context.policy.schemas.affected_test_execution,
    validationFindings,
    'AFFECTED_EXECUTION_INVALID',
    'affected-test execution',
  );
  findings.push(...validationFindings);
  return validationFindings.length === 0 ? execution : null;
}

/**
 * One readiness computation for policy-check, entry-check and status. Readiness is
 * false whenever any ENTRY_BLOCKED_* condition holds, whether it arrives as a finding
 * or as the unbound round declaration, so the three consumers cannot disagree.
 */
export function entryReadinessV9(context, resolution, findings) {
  const blocked = findings
    .map(({ code }) => String(code))
    .filter((code) => code.startsWith('ENTRY_BLOCKED_'));
  const declarationUnbound =
    context === null ||
    context.profile?.declaration?.decision_id === null ||
    context.profile?.declaration?.decision_id === undefined ||
    context.profile?.declaration?.exact_base === null ||
    context.profile?.declaration?.exact_base === undefined;
  if (declarationUnbound) blocked.push('ENTRY_BLOCKED_DECLARATION_UNBOUND');
  if (resolution !== null && resolution?.selected === null)
    blocked.push('ENTRY_BLOCKED_REVIEWER_BINDING_UNRESOLVED');
  const codes = [...new Set(blocked)];
  return {
    entry_ready: codes.length === 0 && findings.length === 0,
    blocked: codes,
    declaration_unbound: declarationUnbound,
  };
}

export function policyCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const phase = option('--phase') ?? 'pre-entry-preparation';
  const exactCandidate = resolveConsumerCandidateV8(round, findings);
  const context = loadV4Context(round, findings, exactCandidate);
  let resolution = null;
  let declarationDiagnostic = null;
  if (context !== null) {
    try {
      const policyBytes = candidateFile(
        repoRoot,
        exactCandidate,
        'law/policy/round-close-controls.json',
      );
      const mirrorBytes = candidateFile(
        repoRoot,
        exactCandidate,
        '.devai/config/round-close-controls.json',
      );
      if (policyBytes !== mirrorBytes)
        findings.push(
          finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
        );
    } catch (error) {
      findings.push(
        finding(
          'POLICY_MIRROR_DRIFT',
          `candidate materialization is unavailable: ${String(error)}`,
        ),
      );
    }
    resolution = reviewerBindingV4(context, exactCandidate ?? 'INVALID');
    findings.push(...resolution.findings);
    if (exactCandidate !== null && context.policy.schemaVersion === '5.0.0') {
      validateNormativeSourceCoverageV6(context, exactCandidate, findings);
      deriveControlProvenanceV6(context, exactCandidate, findings);
    }
    if (resolution.diagnostic !== null && resolution.profileBound)
      findings.push(resolution.diagnostic);
    if (
      context.profile.declaration?.decision_id === null ||
      context.profile.declaration?.exact_base === null
    )
      declarationDiagnostic = finding(
        'ENTRY_BLOCKED_DECLARATION_UNBOUND',
        'round has no structured B0 decision and exact base declaration',
      );
  }
  const diagnostics = [
    ...(resolution?.diagnostic !== null && resolution?.profileBound === false
      ? [resolution.diagnostic]
      : []),
    ...(declarationDiagnostic === null ? [] : [declarationDiagnostic]),
  ];
  emit({
    ok: findings.length === 0,
    command: 'policy-check',
    round,
    phase,
    entry_ready: entryReadinessV9(context, resolution, findings).entry_ready,
    diagnostics,
    findings,
  });
}

export function entryCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const head = resolveConsumerCandidateV8(round, findings);
  const context = loadV4Context(round, findings, head);
  if (cleanStatus(repoRoot) !== '')
    findings.push(
      finding('ENTRY_BLOCKED_DIRTY_WORKTREE', 'entry requires a clean exact-HEAD worktree'),
    );
  let declarationDiagnostic = null;
  if (context !== null) {
    if (
      context.profile.declaration?.decision_id === null ||
      context.profile.declaration?.exact_base === null
    ) {
      declarationDiagnostic = finding(
        'DECLARATION_PENDING_B0',
        'structured round declaration remains intentionally unbound until B0',
      );
      findings.push(
        finding(
          'ENTRY_BLOCKED_DECLARATION_UNBOUND',
          'entry requires one structured B0 decision and exact base declaration',
        ),
      );
    }
    const resolution = reviewerBindingV4(context, head ?? 'INVALID');
    findings.push(...resolution.findings);
    if (resolution.diagnostic !== null) findings.push(resolution.diagnostic);
  }
  emit({
    ok: findings.length === 0,
    command: 'entry-check',
    round,
    entry_ready: entryReadinessV9(context, null, findings).entry_ready,
    diagnostics: declarationDiagnostic === null ? [] : [declarationDiagnostic],
    findings,
  });
}

export function materializeV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV4Context(round, findings);
  if (context !== null && findings.length === 0) {
    mkdirSync(dirname(mirrorPath), { recursive: true });
    const temporary = `${mirrorPath}.tmp-${String(process.pid)}`;
    writeFileSync(temporary, readFileSync(policyPath));
    renameSync(temporary, mirrorPath);
  }
  emit({
    ok: findings.length === 0,
    command: 'materialize',
    round,
    output: relative(repoRoot, mirrorPath),
    findings,
  });
}

export function materializationsCheckV8() {
  const findings = [];
  try {
    const compared = run('git', [
      'diff',
      '--no-index',
      '--quiet',
      '--',
      relative(repoRoot, policyPath),
      relative(repoRoot, mirrorPath),
    ]);
    if (compared.status !== 0)
      findings.push(
        finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
      );
  } catch (error) {
    findings.push(finding('POLICY_MIRROR_DRIFT', String(error)));
  }
  emit({ ok: findings.length === 0, command: 'materializations-check', findings });
}

/**
 * Self-binding authoritative attestation. A static policy argv cannot carry a 40-hex
 * candidate, so this gate derives one: it refuses a dirty tree, resolves the checked-out
 * commit to one literal identity, proves the working tree matches that commit's tree,
 * and then reads every byte of authority from that Git object. Any mutable byte fails it
 * closed, so worktree substitution cannot influence the verdict. It restores the
 * reviewer-binding census, normative-source coverage and control-provenance derivation
 * that the degraded materializations gate had dropped from the literal roster.
 */
export function controlAttestationV9() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidate = candidateBoundRevision;
  if (candidate === null) {
    emit({
      ok: false,
      command: 'control-attestation',
      findings: [
        finding(
          'REVIEWER_BINDING_CANDIDATE_REQUIRED',
          'attestation requires a clean tree at one literal commit',
        ),
      ],
    });
    return;
  }
  const workingTree = git(repoRoot, ['rev-parse', 'HEAD^{tree}']);
  const committedTree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
  if (workingTree !== committedTree)
    findings.push(
      finding('CONTROL_ATTESTATION_TREE_MISMATCH', 'working tree differs from the bound commit', {
        working_tree: workingTree,
        committed_tree: committedTree,
      }),
    );
  try {
    const policyBytes = candidateFile(repoRoot, candidate, 'law/policy/round-close-controls.json');
    const mirrorBytes = candidateFile(
      repoRoot,
      candidate,
      '.devai/config/round-close-controls.json',
    );
    if (policyBytes !== mirrorBytes)
      findings.push(
        finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
      );
  } catch (error) {
    findings.push(finding('POLICY_MIRROR_DRIFT', String(error)));
  }
  const context = loadV4Context(round, findings, candidate);
  if (context !== null) {
    const resolution = reviewerBindingV4(context, candidate);
    findings.push(...resolution.findings);
    if (resolution.diagnostic !== null && resolution.profileBound)
      findings.push(resolution.diagnostic);
    if (context.policy.schemaVersion === '5.0.0') {
      validateNormativeSourceCoverageV6(context, candidate, findings);
      deriveControlProvenanceV6(context, candidate, findings);
    }
  }
  emit({
    ok: findings.length === 0,
    command: 'control-attestation',
    round,
    candidate,
    findings,
  });
}

export function candidateIdentityDigestV4(context, base, candidate, tree) {
  return sha256(
    canonical({
      round: context.profile.round,
      base_sha: base,
      candidate_sha: candidate,
      tree_sha: tree,
      profile_digest: context.digests.profile,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
    }),
  );
}

export function readJsonPrecisely(path, missingCode, malformedCode, findings) {
  if (!existsSync(path)) {
    findings.push(finding(missingCode, `missing runtime artifact ${relative(repoRoot, path)}`));
    return null;
  }
  try {
    return readJson(path);
  } catch (error) {
    findings.push(
      finding(malformedCode, `malformed runtime artifact: ${String(error)}`, {
        path: relative(repoRoot, path),
      }),
    );
    return null;
  }
}

export function validateNormativeSourceCoverageV6(context, candidate, findings) {
  let registry;
  let provenance;
  let baseline;
  try {
    registry = JSON.parse(candidateFile(repoRoot, candidate, context.profile.sources.obligations));
    provenance = JSON.parse(
      candidateFile(repoRoot, candidate, context.profile.sources.control_provenance),
    );
    if (
      provenance.discovery_mode?.normative_sources === 'independent-obligation-baseline' &&
      typeof context.profile.sources.obligation_baseline !== 'string'
    ) {
      findings.push(
        finding(
          'SEMANTIC_OBLIGATION_BASELINE_MISMATCH',
          'schema-v5 review profiles require an independent obligation baseline',
        ),
      );
      return false;
    }
    baseline = context.profile.sources.obligation_baseline
      ? JSON.parse(candidateFile(repoRoot, candidate, context.profile.sources.obligation_baseline))
      : {
          normative_source_paths: provenance.normative_source_roots ?? [],
          obligation_ids: (registry.obligations ?? []).map(({ obligation_id }) => obligation_id),
        };
  } catch (error) {
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_SOURCE_UNREGISTERED',
        'normative source registry is unavailable in the exact candidate',
        { detail: String(error) },
      ),
    );
    return false;
  }
  const baselinePaths = baseline.normative_source_paths ?? [];
  const baselineIds = baseline.obligation_ids ?? [];
  const expectedPaths = [...new Set(baselinePaths)].sort();
  if (
    new Set(baselinePaths).size !== baselinePaths.length ||
    new Set(baselineIds).size !== baselineIds.length ||
    canonical([...(provenance.normative_source_roots ?? [])].sort()) !== canonical(expectedPaths)
  )
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_BASELINE_MISMATCH',
        'declared normative populations differ from the independent baseline',
      ),
    );
  const rows = registry.normative_sources ?? [];
  const actualPaths = rows.map(({ path }) => path).sort();
  if (
    new Set(actualPaths).size !== actualPaths.length ||
    canonical(actualPaths) !== canonical(expectedPaths)
  )
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_SOURCE_UNREGISTERED',
        'normative source additions, removals, or duplicate rows are forbidden',
      ),
    );
  const knownIds = (registry.obligations ?? []).map(({ obligation_id }) => obligation_id);
  if (canonical([...knownIds].sort()) !== canonical([...baselineIds].sort()))
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_BASELINE_MISMATCH',
        'registered obligation IDs differ from the independent baseline',
      ),
    );
  if (new Set(knownIds).size !== knownIds.length)
    findings.push(
      finding('SEMANTIC_OBLIGATION_ID_DUPLICATE', 'obligation identifiers are duplicated'),
    );
  const known = new Set(knownIds);
  const covered = new Set();
  const candidateTree = candidateTreeEntries(candidate);
  for (const row of rows) {
    let actualDigest = null;
    try {
      const objectId = candidateTree.get(row.path);
      if (objectId !== undefined)
        actualDigest = sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId]));
    } catch {
      actualDigest = null;
    }
    if (!SHA256.test(row.source_digest_sha256 ?? '') || row.source_digest_sha256 !== actualDigest)
      findings.push(
        finding(
          'SEMANTIC_OBLIGATION_SOURCE_DIGEST_INVALID',
          'normative source digest differs from exact candidate bytes',
          { path: row.path },
        ),
      );
    if (new Set(row.obligation_ids ?? []).size !== (row.obligation_ids ?? []).length)
      findings.push(
        finding(
          'SEMANTIC_OBLIGATION_ID_DUPLICATE',
          'one normative source repeats an obligation mapping',
          { path: row.path },
        ),
      );
    for (const id of row.obligation_ids ?? []) {
      if (!known.has(id))
        findings.push(
          finding('SEMANTIC_OBLIGATION_ID_UNKNOWN', 'normative source maps an unknown obligation', {
            path: row.path,
            obligation_id: id,
          }),
        );
      covered.add(id);
    }
  }
  const uncovered = knownIds.filter((id) => !covered.has(id));
  if (uncovered.length > 0)
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_ID_UNCOVERED',
        'registered obligations lack a normative source mapping',
        { obligation_ids: uncovered },
      ),
    );
  return !findings.some(({ code }) => code.startsWith('SEMANTIC_OBLIGATION_'));
}

export function authenticateCandidateProofV4(context, base, candidate, findings) {
  const candidatePath = join(repoRoot, context.profile.runtime.candidate_manifest);
  const convergencePath = join(repoRoot, context.profile.runtime.convergence_evidence);
  const manifest = readJsonPrecisely(
    candidatePath,
    'CANDIDATE_MANIFEST_MISSING',
    'CANDIDATE_MANIFEST_MALFORMED',
    findings,
  );
  if (manifest === null) return null;
  if (
    !validateDocument(
      manifest,
      context.policy.schemas.candidate_manifest,
      findings,
      'CANDIDATE_MANIFEST_SCHEMA_INVALID',
      'candidate manifest',
    )
  )
    return null;
  if (!selfDigestValid(manifest, 'manifest_digest_sha256')) {
    findings.push(
      finding(
        'CANDIDATE_MANIFEST_SELF_DIGEST_INVALID',
        'candidate manifest self-digest is invalid',
      ),
    );
    return null;
  }
  const tree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
  if (context.policy.schemaVersion === '5.0.0')
    validateNormativeSourceCoverageV6(context, candidate, findings);
  const declaration = roundDeclarationV4(context, candidate, findings);
  const identityChecks = {
    round: manifest.round === context.profile.round,
    base_sha: manifest.base_sha === base,
    candidate_sha: manifest.candidate_sha === candidate,
    tree_sha: manifest.tree_sha === tree,
    policy_digest: manifest.policy_digest === context.digests.policy,
    profile_digest: manifest.profile_digest === context.digests.profile,
    graph_digest: manifest.graph_digest === context.digests.graph,
    declaration_present: declaration !== null,
    declaration_id:
      declaration !== null && manifest.declaration_id === declaration.declaration.decision_id,
    declaration_digest: declaration !== null && manifest.declaration_digest === declaration.digest,
    declaration_base: declaration !== null && declaration.declaration.exact_base === base,
  };
  if (Object.values(identityChecks).some((passed) => !passed)) {
    findings.push(
      finding(
        'CANDIDATE_MANIFEST_IDENTITY_INVALID',
        'candidate manifest does not bind the exact invocation',
        {
          failed_checks: Object.entries(identityChecks)
            .filter(([, passed]) => !passed)
            .map(([id]) => id),
        },
      ),
    );
    return null;
  }
  const binding = reviewerBindingV4(context, candidate);
  findings.push(...binding.findings);
  if (
    binding.selected === null ||
    binding.diagnostic !== null ||
    manifest.reviewer_binding_digest !== binding.selected.digest
  ) {
    findings.push(
      finding(
        'CANDIDATE_REVIEWER_BINDING_INVALID',
        'candidate manifest does not bind the exact candidate-tree reviewer census',
      ),
    );
    return null;
  }
  let activeControlCensus = null;
  if (context.policy.schemaVersion === '5.0.0') {
    activeControlCensus = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.active_control_census),
      'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
      'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID',
      findings,
    );
    const censusFindings = [];
    const expectedCensus = deriveActiveControlCensusV5(context, candidate, censusFindings);
    findings.push(...censusFindings);
    if (
      activeControlCensus === null ||
      expectedCensus === null ||
      !validateDocument(
        activeControlCensus,
        context.policy.schemas.active_control_census,
        findings,
        'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
        'active control census',
      ) ||
      !selfDigestValid(activeControlCensus, 'census_digest_sha256') ||
      canonical(activeControlCensus) !== canonical(expectedCensus) ||
      manifest.active_control_census_digest !== expectedCensus.census_digest_sha256
    ) {
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID',
          'candidate manifest does not bind the independently derived raw-byte control census',
        ),
      );
      return null;
    }
  }
  const convergence = readJsonPrecisely(
    convergencePath,
    'CONVERGENCE_EVIDENCE_MISSING',
    'CONVERGENCE_EVIDENCE_MALFORMED',
    findings,
  );
  if (convergence === null) return null;
  if (
    !validateDocument(
      convergence,
      context.policy.schemas.round_convergence,
      findings,
      'CONVERGENCE_SCHEMA_INVALID',
      'convergence evidence',
    )
  )
    return null;
  if (!selfDigestValid(convergence, 'convergence_digest_sha256')) {
    findings.push(
      finding('CONVERGENCE_SELF_DIGEST_INVALID', 'convergence evidence self-digest is invalid'),
    );
    return null;
  }
  const impact = readJsonPrecisely(
    join(repoRoot, context.profile.runtime.impact_execution),
    'AFFECTED_EXECUTION_MISSING',
    'AFFECTED_EXECUTION_MALFORMED',
    findings,
  );
  if (
    impact === null ||
    !validateDocument(
      impact,
      context.policy.schemas.affected_test_execution,
      findings,
      'AFFECTED_EXECUTION_INVALID',
      'affected-test execution',
    ) ||
    !selfDigestValid(impact, 'execution_digest_sha256') ||
    impact.round !== context.profile.round ||
    impact.exact_base !== base ||
    impact.candidate_sha !== candidate ||
    impact.policy_digest !== context.digests.policy ||
    impact.graph_digest !== context.digests.graph ||
    convergence.impact_execution_digest !== impact.execution_digest_sha256 ||
    manifest.impact_execution_digest !== impact.execution_digest_sha256
  ) {
    findings.push(
      finding(
        'AFFECTED_EXECUTION_IDENTITY_INVALID',
        'affected-test execution evidence is missing, forged, or cross-bound to another candidate',
      ),
    );
    return null;
  }
  const expectedNodeIds = (context.graph?.nodes ?? []).map(({ id }) => id);
  const planFindings = [];
  const currentPlan = buildImpactPlan(context, base, candidate, planFindings);
  const expectedNodes = new Map((currentPlan?.nodes ?? []).map((node) => [node.node_id, node]));
  let impactComplete = Array.isArray(impact.passes) && impact.passes.length === 2;
  const impactIssues = [];
  if (
    currentPlan === null ||
    planFindings.some(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID')
  )
    impactComplete = false;
  for (const [index, pass] of (impact.passes ?? []).entries()) {
    const ids = (pass.nodes ?? []).map(({ node_id }) => node_id);
    if (
      !selfDigestValid(pass, 'pass_digest_sha256') ||
      pass.pass_number !== index + 1 ||
      canonical([...ids].sort()) !== canonical([...expectedNodeIds].sort()) ||
      new Set(ids).size !== ids.length ||
      pass.result_population_digest !== sha256(canonical(pass.nodes))
    ) {
      impactComplete = false;
      impactIssues.push(`pass-${String(index + 1)}-identity`);
    }
    const plan = (pass.nodes ?? []).map(
      ({ result: _result, result_digest: _digest, outputs_digest: _outputs, ...entry }) => entry,
    );
    if (pass.plan_digest !== sha256(canonical(plan))) {
      impactComplete = false;
      impactIssues.push(`pass-${String(index + 1)}-plan`);
    }
    for (const node of pass.nodes ?? []) {
      if (
        !selfDigestValid(node, 'result_digest') ||
        !['EXECUTED_PASS', 'REUSED_FRESH_PASS', 'BLOCKED'].includes(node.result)
      ) {
        impactComplete = false;
        impactIssues.push(`${node.node_id}-result`);
      }
      if (node.result === 'BLOCKED') {
        if (node.outcome !== 'BLOCKED' || expectedNodes.get(node.node_id)?.outcome !== 'BLOCKED') {
          impactComplete = false;
          impactIssues.push(`${node.node_id}-blocked`);
        }
        continue;
      }
      try {
        const cache = readJson(v3CachePath(context, node.node_id, node.task_key));
        const { result_digest: cacheDigest, ...cacheBody } = cache;
        const expected = expectedNodes.get(node.node_id);
        if (
          expected === undefined ||
          cacheDigest !== sha256(canonical(cacheBody)) ||
          cache.task_key !== node.task_key ||
          node.task_key !== expected.task_key ||
          [
            'argv',
            'cwd',
            'input_manifest_digest',
            'dependency_keys',
            'policy_digest',
            'graph_digest',
            'toolchain_digest',
            'environment_digest',
          ].some((key) => canonical(cache[key]) !== canonical(expected[key])) ||
          cache.result !== 'EXECUTED_PASS' ||
          node.outputs_digest !== sha256(canonical(cache.outputs ?? []))
        ) {
          impactComplete = false;
          impactIssues.push(`${node.node_id}-cache`);
        }
      } catch {
        impactComplete = false;
        impactIssues.push(`${node.node_id}-cache-missing`);
      }
    }
  }
  if (!impactComplete) {
    findings.push(
      finding(
        'AFFECTED_EXECUTION_POPULATION_INCOMPLETE',
        'affected-test execution does not prove every graph node exactly once in both passes',
        { issues: [...new Set(impactIssues)] },
      ),
    );
    return null;
  }
  const gateIds = (context.policy.convergence?.commands ?? []).map(({ id }) => id);
  const exactPopulation = sha256(canonical(gateIds));
  const toolchainDigest = toolchainFingerprint(context.policy, findings);
  const environmentDigest = environmentFingerprint(context.policy);
  const candidateEntries = candidateTreeEntries(candidate);
  const expectedGates = new Map(
    (context.policy.convergence?.commands ?? []).map((gate) => {
      let argv = [...gate.argv];
      if (argv[0] === 'node' && argv[1] === CONTROL_ENTRYPOINT && argv[2] === 'policy-check')
        argv = [
          ...argv,
          '--round',
          context.profile.round,
          '--phase',
          'pre-entry-preparation',
          '--repo-root',
          repoRoot,
        ];
      if (context.policy.schemaVersion === '5.0.0') {
        const profile = gateFreshnessProfileV5(context, gate, findings);
        if (profile === null) return [gate.id, null];
        const inputManifest = rawCandidateInputManifest(candidate, profile.input_selectors);
        const dependencyInputManifest = rawCandidateInputManifest(
          candidate,
          profile.dependency_selectors,
        );
        const localToolchainManifest = toolchainManifestV5(
          context.policy,
          profile.toolchain_probe_ids,
          findings,
        );
        const localEnvironmentManifest = environmentManifestV5(
          context.policy,
          profile.environment_input_ids,
          findings,
        );
        const outputs =
          profile.output_contract === 'digest-required'
            ? v3OutputState(profile.required_outputs).outputs
            : [];
        const keyBody = {
          task_id: `gate-${gate.id}`,
          argv,
          cwd: '.',
          gate_freshness_profile_digest: sha256(canonical(profile)),
          input_manifest: inputManifest,
          input_manifest_digest: sha256(canonical(inputManifest)),
          dependency_input_manifest: dependencyInputManifest,
          dependency_keys: {},
          policy_digest: context.digests.policy,
          graph_digest: context.digests.graph,
          toolchain_digest: sha256(canonical(localToolchainManifest)),
          toolchain_manifest: localToolchainManifest,
          environment_digest: sha256(canonical(localEnvironmentManifest)),
          environment_manifest: localEnvironmentManifest,
          output_contract: profile.output_contract,
          outputs,
          producing_candidate: candidate,
        };
        return [gate.id, { ...keyBody, task_key: sha256(canonical(keyBody)) }];
      }
      const inputManifestDigest = sha256(
        canonical({
          argv,
          inputs: pathsForGlobs(
            repoRoot,
            candidate,
            context.policy.semantic_assertions?.population_sources ?? [],
          ).map((path) => ({ path, blob: candidateEntries.get(path) })),
          policy: context.digests.policy,
          profile: context.digests.profile,
          graph: context.digests.graph,
        }),
      );
      const keyBody = {
        task_id: `gate-${gate.id}`,
        argv,
        cwd: '.',
        input_manifest_digest: inputManifestDigest,
        dependency_keys: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        environment_digest: environmentDigest,
      };
      return [gate.id, { ...keyBody, task_key: sha256(canonical(keyBody)) }];
    }),
  );
  let populationComplete =
    canonical(convergence.authoritative_gate_ids) === canonical(gateIds) &&
    convergence.authoritative_population_digest === exactPopulation &&
    Array.isArray(convergence.passes) &&
    convergence.passes.length === 2;
  const semanticPasses = [];
  for (const [index, pass] of (convergence.passes ?? []).entries()) {
    if (!selfDigestValid(pass, 'pass_digest_sha256')) populationComplete = false;
    const ids = (pass.gate_results ?? []).map(({ gate_id }) => gate_id);
    if (
      canonical(ids) !== canonical(gateIds) ||
      new Set(ids).size !== ids.length ||
      pass.pass_number !== index + 1 ||
      pass.head_before !== candidate ||
      pass.head_after !== candidate ||
      pass.tree_sha !== tree ||
      pass.clean_before !== true ||
      pass.clean_after !== true ||
      (index === 1 && (pass.writes ?? []).length !== 0) ||
      pass.semantic_population_digest !== exactPopulation
    )
      populationComplete = false;
    const semanticResults = [];
    for (const result of pass.gate_results ?? []) {
      if (!selfDigestValid(result, 'result_digest')) populationComplete = false;
      try {
        const cache = readJson(v3CachePath(context, `gate-${result.gate_id}`, result.task_key));
        const { result_digest: cacheDigest, ...cacheBody } = cache;
        const expected = expectedGates.get(result.gate_id);
        const authenticatedFields =
          context.policy.schemaVersion === '5.0.0'
            ? [
                'task_id',
                'argv',
                'cwd',
                'gate_freshness_profile_digest',
                'input_manifest',
                'input_manifest_digest',
                'dependency_input_manifest',
                'dependency_keys',
                'policy_digest',
                'graph_digest',
                'toolchain_digest',
                'toolchain_manifest',
                'environment_digest',
                'environment_manifest',
                'output_contract',
                'outputs',
                'producing_candidate',
              ]
            : [
                'task_id',
                'argv',
                'cwd',
                'input_manifest_digest',
                'dependency_keys',
                'policy_digest',
                'graph_digest',
                'toolchain_digest',
                'environment_digest',
              ];
        if (
          expected === undefined ||
          expected === null ||
          cacheDigest !== sha256(canonical(cacheBody)) ||
          cacheDigest !== result.output_digest ||
          cache.task_key !== result.task_key ||
          result.task_key !== expected.task_key ||
          authenticatedFields.some((key) => canonical(cache[key]) !== canonical(expected[key])) ||
          cache.result !== 'EXECUTED_PASS'
        )
          populationComplete = false;
      } catch {
        populationComplete = false;
      }
      semanticResults.push({
        gate_id: result.gate_id,
        task_key: result.task_key,
        output_digest: result.output_digest,
      });
    }
    semanticPasses.push(semanticResults);
  }
  if (semanticPasses.length !== 2 || canonical(semanticPasses[0]) !== canonical(semanticPasses[1]))
    populationComplete = false;
  if (!populationComplete) {
    findings.push(
      finding(
        'CONVERGENCE_GATE_POPULATION_INCOMPLETE',
        'convergence does not contain two exact complete equivalent passes',
      ),
    );
    return null;
  }
  const identityDigest = candidateIdentityDigestV4(context, base, candidate, tree);
  if (
    manifest.candidate_identity_digest !== identityDigest ||
    convergence.candidate_identity_digest !== identityDigest ||
    convergence.exact_base !== base ||
    convergence.candidate_sha !== candidate ||
    convergence.candidate_tree !== tree ||
    manifest.convergence_digest !== convergence.convergence_digest_sha256
  ) {
    findings.push(
      finding(
        'CONVERGENCE_CANDIDATE_CROSS_DIGEST_INVALID',
        'candidate and convergence evidence do not share one exact identity and digest',
      ),
    );
    return null;
  }
  return { manifest, convergence, impact, tree, identityDigest, activeControlCensus };
}

export function runtimeClaimValuesV4(
  context,
  convergence,
  candidate,
  findings,
  phase = 'pre-review',
) {
  const values = { exact_base: convergence?.exact_base, candidate_sha: candidate };
  const phasePrefix = `runtime-inputs.${phase}.`;
  const required = new Set();
  for (const claim of context.claimsRegistry?.claims ?? []) {
    for (const [name, specification] of Object.entries(claim.runtime_parameters ?? {})) {
      if (specification.source === 'convergence.exact_base') values[name] = convergence?.exact_base;
      else if (specification.source === 'convergence.candidate_sha') values[name] = candidate;
      else if (specification.source.startsWith(phasePrefix))
        required.add(specification.source.slice(phasePrefix.length));
    }
  }
  if (required.size === 0) return values;
  const runtimePath =
    context.profile.runtime[
      phase === 'post-publication' ? 'post_publication_claim_inputs' : 'pre_review_claim_inputs'
    ];
  const inputs = readJsonPrecisely(
    join(repoRoot, runtimePath),
    'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
    'CLAIM_RUNTIME_INPUTS_MALFORMED',
    findings,
  );
  if (inputs === null) return values;
  if (
    !validateDocument(
      inputs,
      context.policy.schemas.claim_runtime_inputs,
      findings,
      'CLAIM_RUNTIME_INPUTS_SCHEMA_INVALID',
      'claim runtime inputs',
    ) ||
    !selfDigestValid(inputs, 'inputs_digest_sha256') ||
    inputs.round !== context.profile.round ||
    inputs.phase !== phase ||
    inputs.candidate !== candidate
  ) {
    findings.push(
      finding(
        'CLAIM_RUNTIME_INPUTS_INVALID',
        'runtime inputs are not schema-valid, self-digested, phase-bound, and candidate-bound',
      ),
    );
    return values;
  }
  const ids = inputs.inputs.map(({ input_id }) => input_id);
  if (
    new Set(ids).size !== ids.length ||
    canonical([...ids].sort()) !== canonical([...required].sort())
  )
    findings.push(
      finding(
        'CLAIM_RUNTIME_INPUT_POPULATION_INVALID',
        'runtime input population differs from the exact required phase population',
      ),
    );
  for (const input of inputs.inputs) {
    if (
      !selfDigestValid(input, 'input_digest_sha256') ||
      new Set(input.evidence_manifest.map(({ ref }) => ref)).size !== input.evidence_manifest.length
    ) {
      findings.push(
        finding(
          'CLAIM_RUNTIME_INPUT_INVALID',
          'runtime input or evidence reference population is unauthenticated',
          { input_id: input.input_id },
        ),
      );
      continue;
    }
    for (const evidence of input.evidence_manifest) {
      const evidencePath = resolve(repoRoot, evidence.ref);
      if (
        (!evidencePath.startsWith(`${repoRoot}/`) && evidencePath !== repoRoot) ||
        !existsSync(evidencePath) ||
        !lstatSync(evidencePath).isFile() ||
        evidence.content_digest !== sha256(readFileSync(evidencePath))
      )
        findings.push(
          finding(
            'CLAIM_RUNTIME_INPUT_EVIDENCE_INVALID',
            'runtime input evidence digest is stale or unavailable',
            { input_id: input.input_id, ref: evidence.ref },
          ),
        );
    }
    const parameter = [...(context.claimsRegistry?.claims ?? [])]
      .flatMap((claim) => Object.entries(claim.runtime_parameters ?? {}))
      .find(
        ([_name, specification]) => specification.source === `${phasePrefix}${input.input_id}`,
      )?.[0];
    if (parameter !== undefined) values[parameter] = input.value;
  }
  return values;
}

export function claimSourceManifestV4(selectors, candidate, tree, claimId, producerOutputDigest) {
  const manifest = [];
  for (const selector of selectors ?? []) {
    if (selector === '.git') {
      manifest.push({
        path: `git:commit/${candidate}`,
        state: 'present',
        content_digest: sha256(canonical({ candidate_sha: candidate, tree_sha: tree })),
      });
      continue;
    }
    if (selector === `producer-output:${claimId}`) {
      manifest.push({ path: selector, state: 'present', content_digest: producerOutputDigest });
      continue;
    }
    for (const entry of v3InputEntries([selector]))
      manifest.push({
        path: entry.source,
        state: entry.present ? 'present' : 'absent',
        content_digest: entry.digest,
      });
  }
  return [...new Map(manifest.map((entry) => [entry.path, entry])).values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

export function extractClaimValueV4(raw, extractor) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw.trim();
  }
  if (extractor === '$') return value;
  const tokens = String(extractor)
    .replace(/^\$\.?/u, '')
    .replace(/\[([0-9]+)\]/gu, '.$1')
    .split('.')
    .filter(Boolean);
  return tokens.reduce((current, token) => current?.[token], value);
}

export function renderedClaimProofV4(claim, location, extracted, _findings) {
  const absolute = join(repoRoot, location);
  if (!existsSync(absolute)) return null;
  const source = readFileSync(absolute, 'utf8');
  if (/\b(?:TBD|TODO|FIXME)\b|<[^>]+>/iu.test(source)) return { placeholderInvalid: true };
  const prefix = `DEVAI_CLAIM:${claim.claim_id}=`;
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith(prefix));
  if (lines.length !== 1) return { markerInvalid: true };
  const raw = lines[0].slice(prefix.length).trim();
  let rendered;
  try {
    rendered = JSON.parse(raw);
  } catch {
    rendered = raw;
  }
  if (
    typeof extracted === 'number' &&
    typeof rendered === 'string' &&
    /^-?[0-9]+(?:\.[0-9]+)?$/u.test(rendered)
  )
    rendered = Number(rendered);
  const body = {
    location,
    claim_marker: prefix,
    content_digest: sha256(source),
    extracted_rendered_value_digest: sha256(canonical(rendered)),
  };
  return { ...body, verification_digest: sha256(canonical(body)), rendered };
}

export function materializeClaimsV4(
  context,
  convergence,
  candidate,
  findings,
  phase = 'pre-review',
) {
  const blockingCount = () =>
    findings.filter(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID').length;
  const startingBlocking = blockingCount();
  const postPublication = phase === 'post-publication';
  const preReview = postPublication
    ? validateClaimsV4(context, candidate, findings, 'materialized')
    : null;
  if (postPublication) {
    const candidateManifest = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.candidate_manifest),
      'CANDIDATE_MANIFEST_MISSING',
      'CANDIDATE_MANIFEST_MALFORMED',
      findings,
    );
    if (
      candidateManifest === null ||
      !validateDocument(
        candidateManifest,
        context.policy.schemas.candidate_manifest,
        findings,
        'CANDIDATE_MANIFEST_SCHEMA_INVALID',
        'candidate manifest',
      ) ||
      !selfDigestValid(candidateManifest, 'manifest_digest_sha256') ||
      candidateManifest.claims_digest !== preReview?.claims_digest_sha256 ||
      candidateManifest.candidate_sha !== candidate
    )
      findings.push(
        finding(
          'CLAIM_PRE_REVIEW_DIGEST_INVALID',
          'post-publication materialization requires the authenticated reviewed candidate and pre-review ledger',
        ),
      );
  }
  const runtimeValues = runtimeClaimValuesV4(context, convergence, candidate, findings, phase);
  const tree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
  const claims = [];
  for (const declaration of context.claimsRegistry?.claims ?? []) {
    if (!postPublication && declaration.availability === 'post-publication') {
      claims.push({
        ...declaration,
        proof_status: 'DEFERRED_POST_PUBLICATION',
        deferred_proof: {
          required_at: 'post-publication',
          declaration_digest: sha256(canonical(declaration)),
        },
      });
      continue;
    }
    if (postPublication && declaration.availability === 'pre-review') {
      const priorClaim = (preReview?.claims ?? []).find(
        ({ claim_id }) => claim_id === declaration.claim_id,
      );
      if (priorClaim === undefined)
        findings.push(
          finding(
            'CLAIM_POPULATION_INVALID',
            'post-publication receipt lacks a pre-review proven claim',
            { claim_id: declaration.claim_id },
          ),
        );
      else claims.push(priorClaim);
      continue;
    }
    let unresolved = false;
    const resolveValue = (value) =>
      value.replace(/\{([^{}]+)\}/gu, (_whole, name) => {
        if (runtimeValues[name] === undefined) unresolved = true;
        return runtimeValues[name] ?? `{${name}}`;
      });
    const resolvedProducer = declaration.producer.map(resolveValue);
    const resolvedSources = declaration.source_paths.map(resolveValue);
    if (unresolved) {
      findings.push(
        finding(
          'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
          'required runtime claim parameter is unresolved',
          { claim_id: declaration.claim_id },
        ),
      );
      continue;
    }
    const [program, ...args] = resolvedProducer;
    const produced = run(program, args, { cwd: repoRoot });
    if (produced.status !== 0) {
      findings.push(
        finding('CLAIM_PRODUCER_FAILED', 'claim producer failed', {
          claim_id: declaration.claim_id,
          exit_code: produced.status ?? 1,
        }),
      );
      continue;
    }
    const extracted = extractClaimValueV4(produced.stdout ?? '', declaration.extractor);
    if (extracted === undefined) {
      findings.push(
        finding('CLAIM_EXTRACTOR_INVALID', 'claim extractor did not resolve a value', {
          claim_id: declaration.claim_id,
        }),
      );
      continue;
    }
    const producerOutputDigest = sha256(produced.stdout ?? '');
    const sourceManifest = claimSourceManifestV4(
      resolvedSources,
      candidate,
      tree,
      declaration.claim_id,
      producerOutputDigest,
    );
    if (sourceManifest.length === 0) {
      findings.push(
        finding('CLAIM_SOURCE_MANIFEST_INVALID', 'resolved claim source population is empty', {
          claim_id: declaration.claim_id,
        }),
      );
      continue;
    }
    const renderedProofs = [];
    for (const location of declaration.rendered_locations ?? []) {
      const proof = renderedClaimProofV4(declaration, location, extracted, findings);
      if (
        proof === null ||
        proof.markerInvalid === true ||
        canonical(proof.rendered) !== canonical(extracted)
      ) {
        findings.push(
          finding(
            'CLAIM_RENDERED_MARKER_INVALID',
            'rendered claim marker is absent or does not equal the extracted value',
            { claim_id: declaration.claim_id, location },
          ),
        );
        continue;
      }
      const { rendered: _rendered, ...body } = proof;
      renderedProofs.push(body);
    }
    claims.push({
      ...declaration,
      proof_status: 'PROVEN',
      resolved_producer: resolvedProducer,
      source_manifest: sourceManifest,
      source_digest: sha256(canonical(sourceManifest)),
      producer_output_digest: producerOutputDigest,
      extracted_value: extracted,
      value_digest: sha256(canonical(extracted)),
      rendered_proofs: renderedProofs,
      rendered_verification_digest: sha256(canonical(renderedProofs)),
    });
  }
  if (
    blockingCount() > startingBlocking ||
    claims.length !== (context.claimsRegistry?.claims ?? []).length
  )
    return null;
  const body = {
    schemaVersion: '2.0.0',
    ledger_version: context.claimsRegistry.ledger_version,
    round: context.profile.round,
    mode: postPublication ? 'post-publication' : 'materialized',
    candidate,
    claims,
    pre_review_claims_digest: postPublication ? preReview.claims_digest_sha256 : null,
  };
  const ledger = withSelfDigest(body, 'claims_digest_sha256');
  validateDocument(
    ledger,
    context.policy.schemas.current_claims,
    findings,
    'CLAIM_LEDGER_SCHEMA_INVALID',
    'materialized claims',
  );
  if (blockingCount() === startingBlocking)
    writeJsonAtomic(
      join(
        repoRoot,
        postPublication
          ? context.profile.runtime.post_publication_claims
          : context.profile.runtime.materialized_claims,
      ),
      ledger,
    );
  return blockingCount() === startingBlocking ? ledger : null;
}

export function validateClaimsV4(context, candidate, findings, requestedMode = 'materialized') {
  const path = join(
    repoRoot,
    requestedMode === 'post-publication'
      ? context.profile.runtime.post_publication_claims
      : context.profile.runtime.materialized_claims,
  );
  const ledger = readJsonPrecisely(
    path,
    'CLAIM_MATERIALIZATION_REQUIRED',
    'CLAIM_MATERIALIZATION_MALFORMED',
    findings,
  );
  if (ledger === null) return null;
  if (ledger.mode !== requestedMode) {
    findings.push(
      finding('CLAIM_MATERIALIZATION_REQUIRED', `runtime claim ledger must be ${requestedMode}`),
    );
    return null;
  }
  validateDocument(
    ledger,
    context.policy.schemas.current_claims,
    findings,
    'CLAIM_LEDGER_SCHEMA_INVALID',
    'materialized claims',
  );
  if (!selfDigestValid(ledger, 'claims_digest_sha256'))
    findings.push(
      finding(
        'CLAIM_LEDGER_SELF_DIGEST_INVALID',
        'materialized claim ledger self-digest is invalid',
      ),
    );
  if (ledger.candidate !== candidate)
    findings.push(finding('CLAIM_CANDIDATE_INVALID', 'materialized claims bind another candidate'));
  const declarations = new Map(
    (context.claimsRegistry?.claims ?? []).map((claim) => [claim.claim_id, claim]),
  );
  const declarationIds = [...declarations.keys()].sort();
  const ledgerIds = (ledger.claims ?? []).map(({ claim_id }) => claim_id);
  if (
    new Set(ledgerIds).size !== ledgerIds.length ||
    canonical([...ledgerIds].sort()) !== canonical(declarationIds)
  ) {
    findings.push(
      finding(
        'CLAIM_POPULATION_INVALID',
        'materialized claims must exactly equal the declaration population',
      ),
    );
  }
  let convergence = null;
  try {
    convergence = readJson(join(repoRoot, context.profile.runtime.convergence_evidence));
  } catch {
    convergence = null;
  }
  const runtimeValues = runtimeClaimValuesV4(
    context,
    convergence,
    candidate,
    findings,
    requestedMode === 'post-publication' ? 'post-publication' : 'pre-review',
  );
  let authenticatedPreReview = null;
  if (requestedMode === 'post-publication') {
    const preReview = validateClaimsV4(context, candidate, findings, 'materialized');
    authenticatedPreReview = preReview;
    const candidateManifest = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.candidate_manifest),
      'CANDIDATE_MANIFEST_MISSING',
      'CANDIDATE_MANIFEST_MALFORMED',
      findings,
    );
    if (candidateManifest !== null) {
      validateDocument(
        candidateManifest,
        context.policy.schemas.candidate_manifest,
        findings,
        'CANDIDATE_MANIFEST_SCHEMA_INVALID',
        'candidate manifest',
      );
    }
    if (
      preReview === null ||
      candidateManifest === null ||
      !selfDigestValid(candidateManifest, 'manifest_digest_sha256') ||
      ledger.pre_review_claims_digest !== preReview.claims_digest_sha256 ||
      preReview.candidate !== candidate ||
      candidateManifest.candidate_sha !== candidate ||
      candidateManifest.claims_digest !== preReview.claims_digest_sha256
    )
      findings.push(
        finding(
          'CLAIM_PRE_REVIEW_DIGEST_INVALID',
          'post-publication receipt does not bind the authenticated pre-review ledger and candidate manifest',
        ),
      );
  } else if (ledger.pre_review_claims_digest !== null) {
    findings.push(
      finding(
        'CLAIM_PRE_REVIEW_DIGEST_INVALID',
        'pre-review materialization cannot bind itself as a receipt',
      ),
    );
  }
  for (const claim of ledger.claims ?? []) {
    const declaration = declarations.get(claim.claim_id);
    if (declaration === undefined) {
      findings.push(
        finding('CLAIM_UNKNOWN', 'materialized claim is not declared', {
          claim_id: claim.claim_id,
        }),
      );
      continue;
    }
    if (requestedMode === 'post-publication' && declaration.availability === 'pre-review') {
      const expectedPrior = (authenticatedPreReview?.claims ?? []).find(
        ({ claim_id }) => claim_id === claim.claim_id,
      );
      if (expectedPrior === undefined || canonical(claim) !== canonical(expectedPrior))
        findings.push(
          finding(
            'CLAIM_PRE_REVIEW_CLAIM_INVALID',
            'post-publication receipt altered a pre-review proven claim',
            { claim_id: claim.claim_id },
          ),
        );
      continue;
    }
    if (claim.proof_status === 'DEFERRED_POST_PUBLICATION') {
      if (
        requestedMode !== 'materialized' ||
        declaration.availability !== 'post-publication' ||
        claim.deferred_proof?.declaration_digest !== sha256(canonical(declaration))
      )
        findings.push(
          finding(
            'CLAIM_DEFERRED_INVALID',
            'deferred claim declaration is unavailable, altered, or unauthenticated',
            { claim_id: claim.claim_id },
          ),
        );
      continue;
    }
    let unresolved = false;
    const expectedProducer = declaration.producer.map((argument) =>
      argument.replace(/\{([^{}]+)\}/gu, (_whole, name) => {
        const value = runtimeValues[name];
        if (value === undefined) unresolved = true;
        return value ?? `{${name}}`;
      }),
    );
    const expectedSources = declaration.source_paths.map((source) =>
      source.replace(/\{([^{}]+)\}/gu, (_whole, name) => {
        const value = runtimeValues[name];
        if (value === undefined) unresolved = true;
        return value ?? `{${name}}`;
      }),
    );
    if (unresolved) {
      findings.push(
        finding(
          'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
          'required runtime claim parameter is unresolved',
          { claim_id: claim.claim_id },
        ),
      );
      continue;
    }
    if (canonical(claim.resolved_producer) !== canonical(expectedProducer))
      findings.push(
        finding('CLAIM_RESOLVED_PRODUCER_INVALID', 'resolved producer differs from declaration', {
          claim_id: claim.claim_id,
        }),
      );
    const [program, ...args] = expectedProducer;
    const produced = run(program, args, { cwd: repoRoot });
    if (produced.status !== 0) {
      findings.push(
        finding('CLAIM_PRODUCER_FAILED', 'claim producer failed', { claim_id: claim.claim_id }),
      );
      continue;
    }
    if (requestedMode === 'post-publication' && claim.claim_id === 'ci.exact-head') {
      const prNumber = runtimeValues.source_pr_number;
      const head = run('gh', ['pr', 'view', String(prNumber ?? ''), '--json', 'headRefOid'], {
        cwd: repoRoot,
      });
      let headRefOid = null;
      try {
        headRefOid = JSON.parse(head.stdout ?? '{}').headRefOid;
      } catch {
        headRefOid = null;
      }
      if (head.status !== 0 || headRefOid !== candidate)
        findings.push(
          finding(
            'CLAIM_CI_EXACT_HEAD_INVALID',
            'post-publication CI proof does not belong to the exact reviewed candidate',
            { claim_id: claim.claim_id },
          ),
        );
    }
    if (claim.producer_output_digest !== sha256(produced.stdout ?? ''))
      findings.push(
        finding('CLAIM_PRODUCER_OUTPUT_DIGEST_INVALID', 'producer output digest is invalid', {
          claim_id: claim.claim_id,
        }),
      );
    const tree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
    const expectedSourceManifest = claimSourceManifestV4(
      expectedSources,
      candidate,
      tree,
      claim.claim_id,
      sha256(produced.stdout ?? ''),
    );
    if (
      (expectedSources.includes('.git') || (claim.source_paths ?? []).includes('.git')) &&
      (claim.source_manifest ?? []).length === 0
    )
      findings.push(
        finding(
          'CLAIM_GIT_IDENTITY_MANIFEST_INVALID',
          'Git-backed claim requires a nonempty exact commit-and-tree identity manifest',
          { claim_id: claim.claim_id },
        ),
      );
    if (canonical(claim.source_manifest) !== canonical(expectedSourceManifest))
      findings.push(
        finding(
          'CLAIM_SOURCE_MANIFEST_INVALID',
          'source manifest differs from current complete population',
          { claim_id: claim.claim_id },
        ),
      );
    if (claim.source_digest !== sha256(canonical(expectedSourceManifest)))
      findings.push(
        finding('CLAIM_SOURCE_DIGEST_INVALID', 'source manifest digest is invalid', {
          claim_id: claim.claim_id,
        }),
      );
    const extracted = extractClaimValueV4(produced.stdout ?? '', declaration.extractor);
    if (canonical(claim.extracted_value) !== canonical(extracted))
      findings.push(
        finding('CLAIM_EXTRACTED_VALUE_INVALID', 'stored extracted value differs from producer', {
          claim_id: claim.claim_id,
        }),
      );
    if (claim.value_digest !== sha256(canonical(extracted)))
      findings.push(
        finding('CLAIM_VALUE_DIGEST_INVALID', 'extracted value digest is invalid', {
          claim_id: claim.claim_id,
        }),
      );
    const proofLocations = (claim.rendered_proofs ?? []).map(({ location }) => location).sort();
    const declaredLocations = [...(declaration.rendered_locations ?? [])].sort();
    if (canonical(proofLocations) !== canonical(declaredLocations))
      findings.push(
        finding(
          'CLAIM_RENDERED_LOCATION_SET_INVALID',
          'rendered proof locations differ from declaration',
          { claim_id: claim.claim_id },
        ),
      );
    const expectedProofs = [];
    for (const location of declaredLocations) {
      const expected = renderedClaimProofV4(claim, location, extracted, findings);
      const actual = (claim.rendered_proofs ?? []).find((proof) => proof.location === location);
      if (expected?.placeholderInvalid === true)
        findings.push(
          finding(
            'CLAIM_PLACEHOLDER_RESIDUE',
            'rendered claim location contains unresolved placeholder residue',
            { claim_id: claim.claim_id, location },
          ),
        );
      if (
        expected === null ||
        expected?.markerInvalid === true ||
        expected?.placeholderInvalid === true ||
        actual?.claim_marker !== `DEVAI_CLAIM:${claim.claim_id}=`
      ) {
        findings.push(
          finding(
            'CLAIM_RENDERED_MARKER_INVALID',
            'rendered claim marker is missing, duplicated, or mismatched',
            { claim_id: claim.claim_id, location },
          ),
        );
        continue;
      }
      if (expected === null || actual === undefined) continue;
      if (actual.content_digest !== expected.content_digest)
        findings.push(
          finding('CLAIM_RENDERED_CONTENT_DIGEST_INVALID', 'rendered content digest is invalid', {
            claim_id: claim.claim_id,
            location,
          }),
        );
      if (actual.extracted_rendered_value_digest !== expected.extracted_rendered_value_digest)
        findings.push(
          finding('CLAIM_RENDERED_VALUE_DIGEST_INVALID', 'rendered value digest is invalid', {
            claim_id: claim.claim_id,
            location,
          }),
        );
      if (actual.verification_digest !== expected.verification_digest)
        findings.push(
          finding(
            'CLAIM_RENDERED_PROOF_DIGEST_INVALID',
            'rendered proof verification digest is invalid',
            { claim_id: claim.claim_id, location },
          ),
        );
      const { rendered: _rendered, ...expectedProof } = expected;
      expectedProofs.push(expectedProof);
    }
    if (claim.rendered_verification_digest !== sha256(canonical(expectedProofs)))
      findings.push(
        finding(
          'CLAIM_RENDERED_VERIFICATION_DIGEST_INVALID',
          'aggregate rendered verification digest is invalid',
          { claim_id: claim.claim_id },
        ),
      );
  }
  return ledger;
}

export function claimsCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const requestedMode =
    option('--mode') === 'post-publication' ||
    option('--phase') === 'post-publication' ||
    process.argv.includes('--post-publication')
      ? 'post-publication'
      : 'materialized';
  const context = loadV4Context(round, findings);
  if (context !== null && process.argv.includes('--materialize')) {
    const convergence = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.convergence_evidence),
      'CONVERGENCE_EVIDENCE_MISSING',
      'CONVERGENCE_EVIDENCE_MALFORMED',
      findings,
    );
    if (convergence !== null)
      materializeClaimsV4(
        context,
        convergence,
        candidate,
        findings,
        requestedMode === 'post-publication' ? 'post-publication' : 'pre-review',
      );
  }
  const ledger =
    context === null ? null : validateClaimsV4(context, candidate, findings, requestedMode);
  emit({
    ok: findings.length === 0 && ledger !== null,
    command: 'claims-check',
    round,
    candidate,
    mode: requestedMode,
    materialized_path:
      requestedMode === 'post-publication'
        ? context?.profile.runtime.post_publication_claims
        : context?.profile.runtime.materialized_claims,
    pre_review_claims_digest: ledger?.pre_review_claims_digest ?? null,
    findings,
  });
}

export function claimsMaterializeV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const phase = option('--phase') === 'post-publication' ? 'post-publication' : 'pre-review';
  const context = loadV4Context(round, findings);
  let convergence = null;
  if (context !== null)
    convergence = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.convergence_evidence),
      'CONVERGENCE_EVIDENCE_MISSING',
      'CONVERGENCE_EVIDENCE_MALFORMED',
      findings,
    );
  const ledger =
    context !== null && convergence !== null
      ? materializeClaimsV4(context, convergence, candidate, findings, phase)
      : null;
  emit({
    ok: findings.length === 0 && ledger !== null,
    command: 'claims-materialize',
    round,
    candidate,
    phase,
    materialized_path:
      context === null
        ? null
        : phase === 'post-publication'
          ? context.profile.runtime.post_publication_claims
          : context.profile.runtime.materialized_claims,
    claims_digest_sha256: ledger?.claims_digest_sha256 ?? null,
    findings,
  });
}

export function resolveTopicEvidenceV6(context, proof, ref) {
  if (['review-scope', 'review-state', 'review-transport'].includes(ref)) return null;
  const runtimeAliases = new Map([
    ['candidate manifest', context.profile.runtime.candidate_manifest],
    ['candidate-manifest', context.profile.runtime.candidate_manifest],
    ['convergence evidence', context.profile.runtime.convergence_evidence],
    ['convergence-evidence', context.profile.runtime.convergence_evidence],
    ['impact-execution', context.profile.runtime.impact_execution],
    ['active-control-census', context.profile.runtime.active_control_census],
    ['current-claims', context.profile.runtime.materialized_claims],
    ['claim-runtime-inputs', context.profile.runtime.pre_review_claim_inputs],
    ['review-scope', context.profile.runtime.review_scope],
    ['review-state', context.profile.runtime.review_state],
    ['review-transport', context.profile.runtime.review_transport],
  ]);
  const runtimePath =
    runtimeAliases.get(ref) ??
    [...runtimeAliases.values()].find((configuredPath) => configuredPath === ref);
  if (runtimePath !== undefined) {
    const absolute = join(repoRoot, runtimePath);
    if (!existsSync(absolute)) return null;
    return { ref, digest: sha256(readFileSync(absolute)) };
  }
  if (ref === 'reviewer-binding') {
    const binding = reviewerBindingV4(context, proof.manifest.candidate_sha);
    return binding.selected === null ? null : { ref, digest: binding.selected.digest };
  }
  if (ref === 'prior-finding-registry') {
    const path = context.profile.sources.prior_finding_registry;
    const objectId = candidateTreeEntries(proof.manifest.candidate_sha).get(path);
    return objectId === undefined
      ? null
      : { ref, digest: sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId])) };
  }
  if (ref === 'git:exact-range') {
    const records = committedChangeRecords(
      proof.manifest.base_sha,
      proof.manifest.candidate_sha,
      [],
    );
    return records === null ? null : { ref, digest: sha256(canonical(records)) };
  }
  if (ref === 'git:role-path-census') {
    return {
      ref,
      digest: sha256(
        canonical(
          rolePathEvidenceV7(proof.manifest.base_sha, proof.manifest.candidate_sha, context.policy),
        ),
      ),
    };
  }
  if (ref.startsWith('gate:')) {
    const gateId = ref.slice('gate:'.length);
    const gate = (proof.convergence.passes?.[1]?.gate_results ?? []).find(
      ({ gate_id: id }) => id === gateId,
    );
    return gate === undefined ? null : { ref, digest: gate.result_digest };
  }
  if (ref.startsWith('claim:')) {
    const ledger = readJson(join(repoRoot, context.profile.runtime.materialized_claims));
    const claim = (ledger.claims ?? []).find(({ claim_id }) => `claim:${claim_id}` === ref);
    return claim === undefined ? null : { ref, digest: sha256(canonical(claim)) };
  }
  const normalizedRef = ref.startsWith('path:') ? ref.slice('path:'.length) : ref;
  const path = normalizedRef.split('#', 1)[0];
  let objectId =
    path === undefined || path === ''
      ? undefined
      : candidateTreeEntries(proof.manifest.candidate_sha).get(path);
  let revision = proof.manifest.candidate_sha;
  if (objectId === undefined && path !== undefined && path !== '') {
    objectId = candidateTreeEntries(proof.manifest.base_sha).get(path);
    revision = proof.manifest.base_sha;
  }
  if (objectId === undefined) return null;
  try {
    return {
      ref,
      digest: sha256(
        canonical({ revision, blob: sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId])) }),
      ),
    };
  } catch {
    return null;
  }
}

export function topicEvidenceManifestV4(context, proof, sourceRefs, requiredEvidence) {
  const refs = ['candidate manifest', 'convergence evidence', ...sourceRefs, ...requiredEvidence];
  const resolved = refs.map((ref) => resolveTopicEvidenceV6(context, proof, ref));
  if (resolved.some((entry) => entry === null)) return null;
  return [...new Map(resolved.map((entry) => [entry.ref, entry])).values()];
}

export function topicTaskKeysV4(proof, requiredEvidence) {
  const gateIds = new Set(
    requiredEvidence
      .filter((ref) => ref.startsWith('gate:'))
      .map((ref) => ref.slice('gate:'.length)),
  );
  return (proof.convergence.passes?.[1]?.gate_results ?? [])
    .filter(({ gate_id }) => gateIds.has(gate_id))
    .map(({ task_key }) => task_key);
}

export function makeReviewTopicsV4(context, base, candidate, proof, ledger, findings = []) {
  const topics = [];
  const add = ({
    topicId,
    topicKind,
    obligationId,
    risk = 'P1',
    claim,
    sourceRefs,
    governingPaths,
    requiredEvidence,
    currentDigest,
    previousDigest = null,
    changedStatus = 'changed',
    adversaries,
    previousClasses = [],
    reusable = false,
    changeRecord = null,
  }) => {
    const stableEvidenceRef = (ref) => {
      if (context.policy.schemaVersion !== '5.0.0') return ref;
      if (ref === context.profile.runtime.candidate_manifest) return 'candidate manifest';
      if (ref === context.profile.runtime.convergence_evidence) return 'convergence evidence';
      return ref;
    };
    const uniqueSourceRefs = [...new Set(sourceRefs.map(stableEvidenceRef))];
    const uniqueRequiredEvidence = [...new Set(requiredEvidence.map(stableEvidenceRef))];
    const evidenceManifest = topicEvidenceManifestV4(
      context,
      proof,
      uniqueSourceRefs,
      uniqueRequiredEvidence,
    );
    if (evidenceManifest === null)
      findings.push(
        finding('UNRESOLVED_TOPIC_EVIDENCE', 'review topic contains unresolved evidence', {
          topic_id: topicId,
          evidence_refs: [...uniqueSourceRefs, ...uniqueRequiredEvidence],
        }),
      );
    const reuseEligible = reusable && changedStatus === 'unchanged' && evidenceManifest !== null;
    const taskKeys = reuseEligible ? topicTaskKeysV4(proof, uniqueRequiredEvidence) : [];
    topics.push({
      topic_id: topicId,
      topic_kind: topicKind,
      obligation_id: obligationId,
      risk,
      claim,
      source_refs: uniqueSourceRefs,
      governing_paths: [...new Set(governingPaths)],
      required_evidence: uniqueRequiredEvidence,
      current_digest: currentDigest,
      previous_digest: previousDigest,
      changed_status: changedStatus,
      required_adversaries: [...new Set(adversaries)],
      previous_finding_classes: [...new Set(previousClasses)],
      ...(context.policy.schemaVersion === '5.0.0'
        ? {
            change_record: changeRecord ?? {
              status: 'NOT_APPLICABLE',
              record_id: null,
              role: 'not-applicable',
              preimage: null,
              postimage: null,
              record_digest: null,
            },
          }
        : {}),
      freshness_proof: {
        method: reuseEligible ? 'content-addressed' : 'recheck-required',
        inputs_digest: currentDigest,
        evidence_digest: sha256(
          canonical(
            evidenceManifest ?? {
              unresolved_refs: [...uniqueSourceRefs, ...uniqueRequiredEvidence],
            },
          ),
        ),
        task_keys: taskKeys,
        independent_recomputation_required: true,
      },
      allowed_dispositions: reuseEligible
        ? ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED']
        : ['RECHECKED_PASS', 'RECHECKED_FAIL', 'BLOCKED'],
    });
  };
  const identityObligation = (context.obligations?.obligations ?? [])[0];
  for (const obligation of context.obligations?.obligations ?? []) {
    const selectors = obligation.governing_paths.flatMap(expandBraceSelectors);
    const currentPaths = pathsForGlobs(repoRoot, candidate, selectors);
    const previousPaths = pathsForGlobs(repoRoot, base, selectors);
    const currentDigest = candidateDigestForPaths(candidate, currentPaths);
    const previousDigest = candidateDigestForPaths(base, previousPaths);
    add({
      topicId: `obligation:${obligation.obligation_id.toLowerCase()}`,
      topicKind: 'semantic-obligation',
      obligationId: obligation.obligation_id,
      risk: obligation.risk,
      claim: obligation.claim,
      sourceRefs: obligation.source_refs,
      governingPaths: obligation.governing_paths,
      requiredEvidence: obligation.required_evidence,
      currentDigest,
      previousDigest,
      changedStatus: currentDigest === previousDigest ? 'unchanged' : 'changed',
      adversaries: obligation.required_adversaries,
      previousClasses: obligation.finding_classes,
      reusable: obligation.reuse_policy === 'digest-and-evidence-recheck',
    });
  }
  const fallbackObligation = identityObligation?.obligation_id;
  const changeRecords = committedChangeRecords(base, candidate, []) ?? [];
  for (const record of changeRecords) {
    for (const [path, role] of record.preimage !== null &&
    record.postimage !== null &&
    record.preimage !== record.postimage
      ? [
          [record.preimage, 'preimage'],
          [record.postimage, 'postimage'],
        ]
      : [[record.postimage ?? record.preimage, 'single']]) {
      const normalizedStatus = record.status.startsWith('R')
        ? 'R'
        : record.status.startsWith('C')
          ? 'C'
          : record.status;
      const changeRecord = {
        status: normalizedStatus,
        record_id: record.record_id,
        role,
        preimage: record.preimage,
        postimage: record.postimage,
        record_digest: sha256(canonical(record)),
      };
      add({
        topicId: `changed-path:${sha256(`${record.record_id}:${role}:${path}`).slice(0, 24)}`,
        topicKind: 'changed-path',
        obligationId: fallbackObligation,
        risk: 'P0',
        claim: `Inspect exact candidate ${role} change at ${path}`,
        sourceRefs: [path],
        governingPaths: [path],
        requiredEvidence: ['git:exact-range'],
        currentDigest: candidateDigestForPaths(candidate, [path]),
        previousDigest: candidateDigestForPaths(base, [path]),
        adversaries: ['inspect-exact-diff'],
        changeRecord,
      });
    }
  }
  const controls = proof.activeControlCensus?.entries?.map(({ path }) => path) ?? [
    context.profilePath,
    'law/policy/round-close-controls.json',
  ];
  add({
    topicId: 'active-control:complete-census',
    topicKind: 'active-control',
    obligationId: fallbackObligation,
    risk: 'P0',
    claim: 'Apply every active control.',
    sourceRefs: controls,
    governingPaths: controls,
    requiredEvidence: ['active-control-census'],
    currentDigest:
      proof.activeControlCensus?.census_digest_sha256 ??
      candidateDigestForPaths(candidate, controls),
    adversaries: ['omitted-control'],
  });
  for (const currentClaim of ledger.claims ?? [])
    add({
      topicId: `current-claim:${currentClaim.claim_id}`,
      topicKind: 'current-claim',
      obligationId: fallbackObligation,
      claim: `Recompute current claim ${currentClaim.claim_id}.`,
      sourceRefs: [context.profile.runtime.materialized_claims],
      governingPaths: [context.profile.sources.current_claims],
      requiredEvidence: [`claim:${currentClaim.claim_id}`],
      currentDigest: sha256(canonical(currentClaim)),
      adversaries: ['stale-claim'],
    });
  const priorByClass = new Map();
  for (const entry of context.priorFindingRegistry?.finding_classes ?? []) {
    const population = priorByClass.get(entry.defect_class_id) ?? [];
    population.push(entry);
    priorByClass.set(entry.defect_class_id, population);
  }
  for (const [defectClassId, population] of priorByClass) {
    const origins = [...population].sort((left, right) =>
      left.finding_id.localeCompare(right.finding_id),
    );
    const severity = origins.some(({ severity: value }) => value === 'P0')
      ? 'P0'
      : origins.some(({ severity: value }) => value === 'P1')
        ? 'P1'
        : 'P2';
    add({
      topicId: `previous-finding-class:${sha256(defectClassId).slice(0, 24)}`,
      topicKind: 'previous-finding-class',
      obligationId: fallbackObligation,
      risk: severity,
      claim: `Recheck ${defectClassId} across every recorded origin: ${origins.map(({ finding_id }) => finding_id).join(', ')}.`,
      sourceRefs: [
        context.profile.sources.prior_finding_registry,
        ...origins.map(({ origin_evidence }) => origin_evidence),
      ],
      governingPaths: [context.profile.sources.prior_finding_registry],
      requiredEvidence: ['prior-finding-registry'],
      currentDigest: sha256(canonical(origins)),
      adversaries: origins.map(({ population_query }) => population_query),
      previousClasses: [defectClassId],
    });
  }
  add({
    topicId: `candidate-identity:${candidate.slice(0, 16)}`,
    topicKind: 'candidate-identity',
    obligationId: fallbackObligation,
    risk: 'P0',
    claim: 'Authenticate exact candidate identity.',
    sourceRefs: [context.profile.runtime.candidate_manifest],
    governingPaths: [context.profilePath],
    requiredEvidence: ['candidate manifest'],
    currentDigest: proof.manifest.manifest_digest_sha256,
    adversaries: ['tampered-manifest'],
  });
  add({
    topicId: `convergence-evidence:${proof.convergence.convergence_digest_sha256.slice(0, 24)}`,
    topicKind: 'convergence-evidence',
    obligationId: fallbackObligation,
    risk: 'P0',
    claim: 'Authenticate exact convergence evidence.',
    sourceRefs: [context.profile.runtime.convergence_evidence],
    governingPaths: [context.profilePath],
    requiredEvidence: ['convergence-evidence'],
    currentDigest: proof.convergence.convergence_digest_sha256,
    adversaries: ['partial-pass'],
  });
  if (context.policy.schemaVersion === '5.0.0') {
    for (const record of changeRecords.filter(({ status }) => status.startsWith('R'))) {
      const linked = topics.filter(
        ({ change_record: value }) => value?.record_id === record.record_id,
      );
      if (!linked.some(({ change_record: value }) => value.role === 'preimage'))
        throw new Error('RENAME_PREIMAGE_INVALIDATION_MISSING');
      if (!linked.some(({ change_record: value }) => value.role === 'postimage'))
        throw new Error('RENAME_POSTIMAGE_INVALIDATION_MISSING');
      if (linked.length !== 2 || new Set(linked.map(({ topic_id }) => topic_id)).size !== 2)
        throw new Error('RENAME_CHANGED_PATH_TOPIC_LINK_INVALID');
    }
  }
  return topics.sort((left, right) => left.topic_id.localeCompare(right.topic_id));
}

export function reviewTopicCountV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = git(repoRoot, ['rev-parse', option('--base') ?? '']);
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const context = loadV4Context(round, findings);
  let topicCount = null;
  if (context !== null && findings.length === 0) {
    const changedPaths = statusAwareChangedPaths(base, candidate);
    topicCount =
      (context.obligations?.obligations ?? []).length +
      changedPaths.length +
      1 +
      (context.claimsRegistry?.claims ?? []).length +
      new Set(
        (context.priorFindingRegistry?.finding_classes ?? []).map(
          ({ defect_class_id }) => defect_class_id,
        ),
      ).size +
      2;
  }
  emit({
    ok: findings.length === 0 && topicCount !== null,
    command: 'review-topic-count',
    round,
    base,
    candidate,
    topic_count: topicCount,
    findings,
  });
}

export function claimProduceV4() {
  const findings = [];
  const kind = option('--kind') ?? '';
  const sourcePath = option('--path') ?? '';
  const absolute = resolve(repoRoot, sourcePath);
  if (
    ['json-file', 'file-sha256'].includes(kind) &&
    (sourcePath === '' ||
      (!absolute.startsWith(`${repoRoot}/`) && absolute !== repoRoot) ||
      !existsSync(absolute) ||
      !lstatSync(absolute).isFile())
  ) {
    emit({
      ok: false,
      command: 'claim-produce',
      kind,
      findings: [
        finding(
          'CLAIM_PRODUCER_SOURCE_INVALID',
          'claim producer path must name one existing repository file',
        ),
      ],
    });
    return;
  }
  try {
    let value;
    if (kind === 'json-file') {
      const parsed = readJson(absolute);
      value = extractClaimValueV4(canonical(parsed), option('--extractor') ?? '$');
      if (value === undefined) throw new Error('extractor did not resolve a value');
    } else if (kind === 'file-sha256') {
      value = { sha256: sha256(readFileSync(absolute)) };
    } else if (kind === 'github-pr-exact-head') {
      const pr = option('--pr') ?? '';
      const candidate = option('--candidate') ?? '';
      if (!/^[0-9]+$/u.test(pr) || !SHA40.test(candidate))
        throw new Error('PR number and exact candidate SHA are required');
      const identity = run('gh', ['pr', 'view', pr, '--json', 'headRefOid,state'], {
        cwd: repoRoot,
      });
      const checks = run('gh', ['pr', 'checks', pr, '--required', '--json', 'name,state,link'], {
        cwd: repoRoot,
      });
      const parsedIdentity = identity.status === 0 ? JSON.parse(identity.stdout) : null;
      const parsedChecks = checks.status === 0 ? JSON.parse(checks.stdout) : null;
      if (
        parsedIdentity?.headRefOid !== candidate ||
        parsedIdentity?.state !== 'OPEN' ||
        !Array.isArray(parsedChecks) ||
        parsedChecks.length === 0 ||
        parsedChecks.some(({ state }) => state !== 'SUCCESS')
      )
        throw new Error(
          'PR identity or nonempty exact-head required-check population is not passing',
        );
      value = {
        pr: Number(pr),
        candidate,
        headRefOid: parsedIdentity.headRefOid,
        checks: parsedChecks.sort((left, right) =>
          `${left.name}\0${left.link}`.localeCompare(`${right.name}\0${right.link}`),
        ),
      };
    } else if (kind === 'vitest-list') {
      const listed = run('pnpm', ['vitest', 'list', '--json'], { cwd: repoRoot });
      if (listed.status !== 0) throw new Error('vitest list failed');
      const population = JSON.parse(listed.stdout);
      if (!Array.isArray(population)) throw new Error('vitest list did not return an array');
      value = population
        .map((entry) => ({ ...entry, file: relative(repoRoot, resolve(String(entry.file))) }))
        .sort((left, right) => canonical(left).localeCompare(canonical(right)));
    } else {
      throw new Error(`unsupported claim producer kind ${kind}`);
    }
    process.stdout.write(`${JSON.stringify(value)}\n`);
  } catch (error) {
    findings.push(finding('CLAIM_PRODUCER_INVALID', String(error)));
    emit({ ok: false, command: 'claim-produce', kind, findings });
  }
}
