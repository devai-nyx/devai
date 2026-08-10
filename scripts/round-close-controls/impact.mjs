#!/usr/bin/env node
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import {
  affectedExecutionV4,
  candidateIdentityDigestV4,
  deriveActiveControlCensusV5,
  entryReadinessV9,
  loadV4Context,
  materializeClaimsV4,
  reviewerBindingV4,
  roundDeclarationV4,
  withSelfDigest,
  writeJsonAtomic,
} from './governed.mjs';
import {
  WORKTREE_REVISION,
  candidateBoundRevision,
  candidateFile,
  canonical,
  cleanStatus,
  emit,
  environmentManifestV5,
  finding,
  gateFreshnessProfileV5,
  git,
  gitBytes,
  gitResult,
  livePolicy,
  loadPolicy,
  matches,
  mirrorPath,
  nulPaths,
  observedPersistentOutputsV6,
  option,
  outputEntries,
  policyPath,
  rawCandidateInputManifest,
  readJson,
  repoRoot,
  run,
  sha256,
  toolchainManifestV5,
  worktreeInputEntries,
  writeState,
} from './runtime.mjs';

export const CONTROL_CONCERN = 'impact';

export function validateDocument(value, schemaFile, findings, code, label) {
  try {
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    const readSchema = (path) =>
      candidateBoundRevision === null
        ? readJson(join(repoRoot, path))
        : JSON.parse(candidateFile(repoRoot, candidateBoundRevision, path));
    const commonPath = 'law/schemas/common-defs.schema.json';
    try {
      ajv.addSchema(readSchema(commonPath));
    } catch {
      // Schemas that predate common definitions remain valid without the optional registry.
    }
    const validate = ajv.compile(readSchema(schemaFile));
    if (!validate(value)) {
      findings.push(
        finding(code, `${label} failed schema validation`, { errors: validate.errors }),
      );
      return false;
    }
    return true;
  } catch (error) {
    findings.push(finding(code, `${label} could not be validated: ${String(error)}`));
    return false;
  }
}

export function v3ProfilePath(policy, round) {
  return String(policy?.profile_discovery?.path_template ?? '').replaceAll('{round}', round);
}

export function loadV3Context(round, findings) {
  const policy = loadPolicy(findings);
  if (policy === null) return null;
  if (!['3.0.0', '4.0.0', '5.0.0'].includes(policy.schemaVersion)) {
    findings.push(
      finding('POLICY_VERSION_INVALID', 'generic close controls require policy v3, v4, or v5'),
    );
    return null;
  }
  if (!new RegExp(policy.profile_discovery?.round_pattern ?? '^$').test(round)) {
    findings.push(
      finding('ROUND_INVALID', 'round must match the configured round pattern', { round }),
    );
    return null;
  }
  const profilePath = v3ProfilePath(policy, round);
  let profile;
  try {
    profile = readJson(join(repoRoot, profilePath));
  } catch (error) {
    findings.push(
      finding('ROUND_PROFILE_INVALID', `round profile is unavailable: ${String(error)}`, {
        path: profilePath,
      }),
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
      finding(
        'ROUND_PROFILE_IDENTITY_INVALID',
        'round profile identity does not match policy invocation',
        {
          expected_round: round,
          actual_round: profile.round,
        },
      ),
    );
  }
  const documents = {};
  for (const [key, schemaKey] of [
    ['graph', 'affected_test_graph'],
    ['obligations', 'semantic_obligations'],
    ['claims', 'current_claims'],
  ]) {
    const sourceKey =
      key === 'graph' ? 'affected_test_graph' : key === 'claims' ? 'current_claims' : key;
    const path = profile.sources?.[sourceKey];
    try {
      documents[key] = readJson(join(repoRoot, path));
      validateDocument(
        documents[key],
        policy.schemas[schemaKey],
        findings,
        `${key.toUpperCase()}_INVALID`,
        key,
      );
      if (documents[key].round !== round) {
        findings.push(
          finding(`${key.toUpperCase()}_ROUND_INVALID`, `${key} round differs from profile`, {
            path,
          }),
        );
      }
    } catch (error) {
      findings.push(
        finding(`${key.toUpperCase()}_INVALID`, `${key} is unavailable: ${String(error)}`, {
          path,
        }),
      );
    }
  }
  if (documents.graph !== undefined) {
    const ids = documents.graph.nodes.map((node) => node.id);
    const idSet = new Set(ids);
    if (idSet.size !== ids.length)
      findings.push(finding('GRAPH_NODE_DUPLICATED', 'graph node IDs must be unique'));
    for (const node of documents.graph.nodes) {
      for (const dependency of node.depends_on ?? []) {
        if (!idSet.has(dependency))
          findings.push(
            finding('GRAPH_DEPENDENCY_UNKNOWN', 'graph dependency is unknown', {
              node: node.id,
              dependency,
            }),
          );
      }
    }
    if (documents.graph.authoritative_gates !== undefined) {
      const graphGates = documents.graph.authoritative_gates.map(({ gate_id }) => gate_id).sort();
      const policyGates = (policy.convergence?.commands ?? []).map(({ id }) => id).sort();
      if (canonical(graphGates) !== canonical(policyGates))
        findings.push(
          finding(
            'GRAPH_AUTHORITATIVE_GATE_POPULATION_INCOMPLETE',
            'graph authoritative-gate census must equal the policy command population',
          ),
        );
    }
  }
  return {
    policy,
    profile,
    profilePath,
    graph: documents.graph,
    obligations: documents.obligations,
    claims: documents.claims,
    digests: {
      policy: sha256(canonical(policy)),
      profile: sha256(canonical(profile)),
      graph:
        documents.graph === undefined ? sha256('MISSING\n') : sha256(canonical(documents.graph)),
      obligations:
        documents.obligations === undefined
          ? sha256('MISSING\n')
          : sha256(canonical(documents.obligations)),
      claims:
        documents.claims === undefined ? sha256('MISSING\n') : sha256(canonical(documents.claims)),
    },
  };
}

export function expandBraceSelectors(selector) {
  const match = /\{([^{}]+)\}/u.exec(selector);
  if (match === null) return [selector];
  return match[1]
    .split(',')
    .flatMap((choice) =>
      expandBraceSelectors(
        `${selector.slice(0, match.index)}${choice}${selector.slice(match.index + match[0].length)}`,
      ),
    );
}

export function selectorMatches(path, selector) {
  return expandBraceSelectors(selector).some((expanded) => matches(path, expanded));
}

export function selectorsMatch(path, selectors) {
  return (selectors ?? []).some((selector) => selectorMatches(path, selector));
}

export function v3Remote(policy) {
  return (policy.freshness.remote_environment_indicators ?? []).some((name) => {
    const value = String(process.env[name] ?? '').toLowerCase();
    return value !== '' && value !== '0' && value !== 'false';
  });
}

export function reviewerBindingFindings(context) {
  const findings = [];
  const reviewer = context.profile.reviewer;
  if (reviewer?.fallback !== 'forbidden') {
    findings.push(
      finding('REVIEWER_FALLBACK_FORBIDDEN', 'reviewer fallback must remain forbidden'),
    );
  }
  if (reviewer?.mandate_id === null || reviewer?.model_selector === null) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_UNBOUND',
        'round reviewer is not yet bound by an Owner mandate',
      ),
    );
    return findings;
  }
  const mandatesRoot = join(repoRoot, 'product/owner-mandates');
  const mandatePaths = existsSync(mandatesRoot)
    ? readdirSync(mandatesRoot)
        .filter((name) => /^OM-[0-9]+\.md$/u.test(name))
        .sort()
    : [];
  const parseFields = (source) => {
    const fields = {};
    for (const line of source.split('\n')) {
      const match = /^([a-z_]+):\s*([^#]*?)\s*$/u.exec(line);
      if (match !== null && fields[match[1]] === undefined) fields[match[1]] = match[2];
    }
    return fields;
  };
  const census = mandatePaths.map((name) => {
    const source = readFileSync(join(mandatesRoot, name), 'utf8');
    return {
      mandate_id: name.slice(0, -3),
      source,
      fields: parseFields(source),
    };
  });
  const activeOwner = census.filter(
    ({ fields }) => fields.status === 'active' && fields.authority === 'Owner',
  );
  const relevant = activeOwner.filter(
    ({ fields, source }) =>
      fields.round === context.profile.round || source.includes(context.profile.round),
  );
  const selected = census.find(({ mandate_id }) => mandate_id === reviewer.mandate_id);
  if (selected === undefined) {
    findings.push(
      finding('ENTRY_BLOCKED_REVIEWER_BINDING_INVALID', 'reviewer mandate is missing', {
        mandate_id: reviewer.mandate_id,
      }),
    );
  } else if (selected.fields.status !== 'active' || selected.fields.authority !== 'Owner') {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_INACTIVE',
        'reviewer mandate is not one active Owner mandate',
      ),
    );
  }
  if (relevant.length > 1) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS',
        'more than one active Owner mandate references the round reviewer binding',
        { mandate_ids: relevant.map(({ mandate_id }) => mandate_id) },
      ),
    );
  }
  if (
    selected === undefined ||
    selected.fields.round !== context.profile.round ||
    selected.fields.model_selector !== reviewer.model_selector ||
    selected.fields.role !== 'independent-read-only' ||
    selected.fields.semantic_census !== 'complete' ||
    selected.fields.substantive_cycles !== '2' ||
    selected.fields.transport_retries !== '1' ||
    selected.fields.fallback !== 'forbidden'
  ) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_CONFLICT',
        'reviewer mandate does not bind the exact round and model',
      ),
    );
  }
  if (
    relevant.some(({ fields }) => fields.fallback !== undefined && fields.fallback !== 'forbidden')
  ) {
    findings.push(
      finding('REVIEWER_FALLBACK_FORBIDDEN', 'an active round binding permits reviewer fallback'),
    );
  }
  return findings;
}

export function policyCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const phase = option('--phase') ?? 'pre-entry-preparation';
  const context = loadV3Context(round, findings);
  if (context !== null) {
    if (phase !== 'pre-entry-preparation' && phase !== context.profile.phase) {
      findings.push(
        finding('ROUND_PHASE_INVALID', 'requested phase differs from the round profile', {
          phase,
          profile_phase: context.profile.phase,
        }),
      );
    }
    if (!existsSync(mirrorPath) || !readFileSync(policyPath).equals(readFileSync(mirrorPath))) {
      findings.push(
        finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
      );
    }
  }
  const binding = context === null ? [] : reviewerBindingFindings(context);
  const diagnostics = binding.filter(({ code }) => code === 'ENTRY_BLOCKED_REVIEWER_UNBOUND');
  const bindingErrors = binding.filter(({ code }) => code !== 'ENTRY_BLOCKED_REVIEWER_UNBOUND');
  findings.push(...bindingErrors);
  emit({
    ok: findings.length === 0,
    command: 'policy-check',
    round,
    phase,
    entry_ready: binding.length === 0,
    diagnostics,
    findings,
  });
}

export function materializeV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV3Context(round, findings);
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

export function entryCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV3Context(round, findings);
  if (context !== null) findings.push(...reviewerBindingFindings(context));
  emit({
    ok: findings.length === 0,
    command: 'entry-check',
    round,
    entry_ready: entryReadinessV9(context, null, findings).entry_ready,
    findings,
  });
}

export function committedChangeRecords(base, head, findings) {
  try {
    const bytes = gitBytes(repoRoot, [
      'diff',
      '--name-status',
      '-z',
      '-M',
      '--find-renames',
      '-C',
      '--find-copies-harder',
      base,
      head,
    ]);
    const fields = bytes.toString('utf8').split('\0').filter(Boolean);
    const records = [];
    for (let index = 0; index < fields.length;) {
      const status = fields[index++];
      if (!/^(?:A|C[0-9]+|D|M|R[0-9]+|T|U|X|B)$/u.test(status)) {
        findings.push(
          finding('COMMITTED_CHANGE_RECORD_INVALID', 'committed change status is malformed', {
            status,
          }),
        );
        return null;
      }
      if (/^[RC]/u.test(status)) {
        const preimage = fields[index++];
        const postimage = fields[index++];
        if (!preimage || !postimage) {
          findings.push(
            finding('COMMITTED_CHANGE_RECORD_INVALID', 'rename/copy record lacks both paths', {
              status,
            }),
          );
          return null;
        }
        records.push({
          record_id: sha256(canonical({ status, preimage, postimage })),
          status,
          preimage,
          postimage,
          paths: [preimage, postimage],
        });
      } else {
        const path = fields[index++];
        if (!path) {
          findings.push(
            finding('COMMITTED_CHANGE_RECORD_INVALID', 'change record lacks its path', { status }),
          );
          return null;
        }
        records.push({
          record_id: sha256(canonical({ status, path })),
          status,
          preimage: status === 'A' ? null : path,
          postimage: status === 'D' ? null : path,
          paths: [path],
        });
      }
    }
    return records;
  } catch (error) {
    findings.push(finding('COMMITTED_CHANGE_RECORD_INVALID', String(error), { base, head }));
    return null;
  }
}

export function statusAwareChangedPaths(base, head) {
  const localFindings = [];
  const records = committedChangeRecords(base, head, localFindings);
  if (records === null || localFindings.length > 0) {
    throw new Error(localFindings.map(({ code, message }) => `${code}: ${message}`).join('; '));
  }
  return [...new Set(records.flatMap(({ paths }) => paths))].sort();
}

export function changedPathPopulation(base, head, findings) {
  try {
    const exactBase = git(repoRoot, ['rev-parse', base]);
    const worktreeMode = head === 'WORKTREE';
    const exactHead = git(repoRoot, ['rev-parse', worktreeMode ? 'HEAD' : head]);
    const committedRecords = committedChangeRecords(exactBase, exactHead, findings);
    if (committedRecords === null) return null;
    const committed = committedRecords.flatMap(({ paths }) => paths);
    const changedWithStatus = (args) => {
      const fields = nulPaths(gitResult(repoRoot, ['diff', '--name-status', '-z', ...args]));
      const paths = [];
      for (let index = 0; index < fields.length;) {
        const status = fields[index++];
        if (/^[RC]/u.test(status)) paths.push(fields[index++], fields[index++]);
        else paths.push(fields[index++]);
      }
      return paths.filter(Boolean);
    };
    const worktree = worktreeMode
      ? [
          ...changedWithStatus([]),
          ...changedWithStatus(['--cached']),
          ...nulPaths(gitResult(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z'])),
        ]
      : [];
    return {
      exactBase,
      exactHead,
      worktreeMode,
      committedRecords,
      paths: [...new Set([...committed, ...worktree])].sort(),
    };
  } catch (error) {
    findings.push(finding('IMPACT_RANGE_INVALID', String(error), { base, head }));
    return null;
  }
}

export function topologicalNodes(graph, findings) {
  const byId = new Map((graph?.nodes ?? []).map((node) => [node.id, node]));
  const visiting = new Set();
  const visited = new Set();
  const ordered = [];
  const visit = (id) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      findings.push(finding('GRAPH_CYCLE', 'affected-test graph must be acyclic', { node: id }));
      return;
    }
    const node = byId.get(id);
    if (node === undefined) return;
    visiting.add(id);
    for (const dependency of node.depends_on ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(node);
  };
  for (const node of graph?.nodes ?? []) visit(node.id);
  return ordered;
}

/**
 * Loader classification by binding flow rather than specimen matching.
 *
 * A file is ambiguous when it can reach a module loader through a value this analysis
 * cannot prove constant. Identifiers are tainted from any initializer that names a
 * loader, taint propagates transitively through further bindings, and a call of a
 * tainted identifier, a call through a computed member, or a loader call with a
 * non-literal argument all widen. Anything not proved safe widens; the cost of a false
 * widen is a longer run, the cost of a false narrow is an untested change.
 */
export function hasAmbiguousLoaderV6(source) {
  if (/\beval\s*\(/u.test(source)) return true;

  const literalArgument = (argument) => {
    const value = String(argument ?? '').trim();
    return (
      /^'(?:[^'\\]|\\.)*'$/u.test(value) ||
      /^"(?:[^"\\]|\\.)*"$/u.test(value) ||
      (/^`(?:[^`\\]|\\.)*`$/u.test(value) && !value.includes('${'))
    );
  };

  // A call through a computed member on any object cannot be proved constant here.
  if (/[\w$)\]]\s*\[[^\]\n]+\]\s*\(/u.test(source)) return true;

  // Seeds: an initializer that names a loader, however it is reached.
  const loaderSeed =
    /\brequire\b|\bcreateRequire\b|\bimport\s*\.\s*meta\s*\.\s*resolve\b|\bprocess\s*\.\s*mainModule\b|\[\s*['"](?:require|resolve|createRequire)['"]\s*\]/u;

  const tainted = new Set();
  const bindings = [];
  for (const match of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/gu))
    bindings.push({ name: match[1], initializer: match[2] });
  // Destructured loader bindings, from any source object.
  for (const match of source.matchAll(
    /\b(?:const|let|var)\s*\{\s*(?:require|createRequire)\s*(?::\s*([A-Za-z_$][\w$]*)\s*)?\}\s*=\s*([^;\n]+)/gu,
  ))
    tainted.add(match[1] ?? 'require');

  for (const { name, initializer } of bindings) if (loaderSeed.test(initializer)) tainted.add(name);

  // Propagate transitively: a binding initialised from a tainted identifier is tainted.
  for (let pass = 0; pass < bindings.length + 1; pass += 1) {
    let changed = false;
    for (const { name, initializer } of bindings) {
      if (tainted.has(name)) continue;
      for (const candidate of tainted)
        if (new RegExp(`\\b${candidate}\\b`, 'u').test(initializer)) {
          tainted.add(name);
          changed = true;
          break;
        }
    }
    if (!changed) break;
  }

  // A call of any tainted identifier widens unless every argument is a literal.
  for (const name of tainted) {
    const call = new RegExp(`\\b${name}\\s*(?:\\?\\.)?\\s*\\(([^)]*)\\)`, 'gu');
    for (const match of source.matchAll(call)) if (!literalArgument(match[1])) return true;
    // Applied, bound or reflected invocation cannot be proved constant.
    if (new RegExp(`\\b${name}\\s*\\.\\s*(?:apply|call|bind)\\s*\\(`, 'u').test(source))
      return true;
    if (new RegExp(`\\bReflect\\s*\\.\\s*apply\\s*\\(\\s*${name}\\b`, 'u').test(source))
      return true;
  }

  // Direct loader forms, including the sequence-expression and optional-call spellings.
  if (/\(\s*0\s*,\s*(?:[\w$]+\s*\.\s*)*require\s*\)\s*\(/u.test(source)) return true;
  if (/\brequire\s*\?\.\s*\(/u.test(source)) return true;
  if (/\bReflect\s*\.\s*apply\s*\(\s*(?:[\w$]+\s*\.\s*)*require\b/u.test(source)) return true;
  if (/\b(?:[\w$]+\s*\.\s*)*require\s*\.\s*(?:apply|call|bind)\s*\(/u.test(source)) return true;

  const families = [
    /\bimport\s*\(([^)]*)\)/gu,
    /(?:^|[^.\w$])require\s*\(([^)]*)\)/gu,
    /\brequire\s*\.\s*resolve\s*\(([^)]*)\)/gu,
    /\bimport\s*\.\s*meta\s*\.\s*resolve\s*\(([^)]*)\)/gu,
    /\bcreateRequire\s*\(([^)]*)\)/gu,
    /\b[\w$]+\s*\.\s*require\s*\(([^)]*)\)/gu,
  ];
  for (const expression of families)
    for (const match of source.matchAll(expression)) if (!literalArgument(match[1])) return true;
  return false;
}

export function v3InputEntries(selectors) {
  const expanded = [...new Set((selectors ?? []).flatMap(expandBraceSelectors))];
  return worktreeInputEntries(repoRoot, expanded).map((entry) => ({
    source: entry.path,
    present: entry.kind !== 'deleted',
    digest: entry.kind === 'deleted' ? null : entry.digest,
  }));
}

export function v3OutputState(specs) {
  const expanded = [...new Set((specs ?? []).flatMap(expandBraceSelectors))];
  const current = outputEntries(repoRoot, expanded);
  return {
    missing: current.missing,
    outputs: [
      ...current.outputs.map((entry) => ({
        path: entry.path,
        present: true,
        digest: entry.digest,
      })),
      ...current.missing.map((path) => ({ path, present: false, digest: null })),
    ].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

export function v3CachePath(context, taskId, taskKey) {
  return join(
    repoRoot,
    context.profile.runtime.state_root,
    'freshness',
    'tasks',
    taskId,
    `${taskKey}.json`,
  );
}

export function v3ReadCache(context, expected, findings) {
  const path = v3CachePath(context, expected.task_id, expected.task_key);
  if (!existsSync(path)) return null;
  try {
    const value = readJson(path);
    if (
      !validateDocument(value, context.policy.schemas.task_freshness, [], 'CACHE_INVALID', 'cache')
    )
      throw new Error('cache schema is invalid');
    const { result_digest: claimed, ...body } = value;
    if (claimed !== sha256(canonical(body)) || value.result !== 'EXECUTED_PASS')
      throw new Error('cache digest or PASS result is invalid');
    for (const key of [
      'round',
      'task_id',
      'task_key',
      'gate_freshness_profile_digest',
      'input_manifest',
      'argv',
      'cwd',
      'input_manifest_digest',
      'dependency_input_manifest',
      'dependency_keys',
      'dependency_results',
      'policy_digest',
      'graph_digest',
      'toolchain_digest',
      'toolchain_manifest',
      'environment_digest',
      'environment_manifest',
      'output_contract',
      'producing_candidate',
    ]) {
      if (canonical(value[key]) !== canonical(expected[key]))
        throw new Error(`cache field ${key} does not match the planned task`);
    }
    return value;
  } catch (error) {
    findings.push(
      finding('CACHE_RECORD_IDENTITY_INVALID', 'cached PASS does not bind exact task identity', {
        task_id: expected.task_id,
        detail: String(error),
      }),
    );
    return null;
  }
}

export function v3WriteCache(context, taskId, taskKey, value) {
  const path = v3CachePath(context, taskId, taskKey);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${String(process.pid)}`;
  writeFileSync(temporary, canonical(value));
  renameSync(temporary, path);
}

export function buildImpactPlan(context, base, head, findings) {
  const range = changedPathPopulation(base, head, findings);
  if (range === null || context.graph === undefined) return null;
  const remote = v3Remote(context.policy);
  const ordered = topologicalNodes(context.graph, findings);
  const selected = new Map();
  const select = (id, code, paths = [], fallback = null) => {
    const current = selected.get(id) ?? { reasons: new Set(), paths: new Set(), fallback };
    current.reasons.add(code);
    for (const path of paths) current.paths.add(path);
    if (fallback !== null) current.fallback = fallback;
    selected.set(id, current);
  };
  if (remote) {
    for (const node of ordered) select(node.id, 'REMOTE_FULL');
  } else {
    if (range.worktreeMode && range.paths.length > 0) {
      select(
        context.graph.fallbacks.incomplete_population,
        'WORKTREE_POPULATION_UNFROZEN',
        range.paths,
        context.graph.fallbacks.incomplete_population,
      );
      select(context.graph.coverage.node, 'COVERAGE_RELEVANT_CHANGE', range.paths);
    }
    for (const shared of context.graph.shared_inputs ?? []) {
      const paths = range.paths.filter((path) => selectorsMatch(path, shared.selectors));
      if (paths.length > 0)
        for (const id of shared.invalidates ?? []) select(id, 'SHARED_INPUT_CHANGED', paths);
    }
    for (const node of ordered) {
      // Fallback nodes describe the complete population that must execute when
      // precision is impossible. Their broad input selectors participate in
      // freshness keys, but are not ordinary impact edges: treating them as
      // such would widen every narrow source or test change to the full suite.
      if (node.kind === 'fallback') continue;
      const paths = range.paths.filter((path) => selectorsMatch(path, node.input_selectors));
      if (paths.length > 0)
        select(
          node.id,
          node.kind === 'test-shard' ? 'AFFECTED_INPUT_CHANGED' : 'GATE_INPUT_CHANGED',
          paths,
        );
    }
    const unknown = range.paths.filter(
      (path) =>
        !ordered.some(
          (node) => node.kind !== 'fallback' && selectorsMatch(path, node.input_selectors),
        ) &&
        !(context.graph.shared_inputs ?? []).some((shared) =>
          selectorsMatch(path, shared.selectors),
        ),
    );
    if (unknown.length > 0) {
      select(
        context.graph.fallbacks.unknown_dependency,
        'UNKNOWN_DEPENDENCY',
        unknown,
        context.graph.fallbacks.unknown_dependency,
      );
      select(
        context.graph.coverage.node,
        'UNKNOWN_DEPENDENCY',
        unknown,
        context.graph.coverage.node,
      );
    }
    const dynamic = new Set();
    const inspectObject = (revision, path) => {
      if (path === null) return;
      try {
        if (hasAmbiguousLoaderV6(candidateFile(repoRoot, revision, path))) dynamic.add(path);
      } catch {
        // Non-text and absent objects are covered by graph ownership and unknown fallback.
      }
    };
    for (const record of range.committedRecords) {
      inspectObject(range.exactBase, record.preimage);
      inspectObject(range.exactHead, record.postimage);
    }
    if (range.worktreeMode)
      for (const path of range.paths) {
        const absolute = join(repoRoot, path);
        if (existsSync(absolute)) {
          try {
            if (hasAmbiguousLoaderV6(readFileSync(absolute, 'utf8'))) dynamic.add(path);
          } catch {
            // The conservative ownership fallback handles unreadable worktree inputs.
          }
        }
      }
    if (dynamic.size > 0) {
      const dynamicPaths = [...dynamic].sort();
      select(
        context.graph.fallbacks.dynamic_import,
        'DYNAMIC_DEPENDENCY_AMBIGUOUS',
        dynamicPaths,
        context.graph.fallbacks.dynamic_import,
      );
      select(
        context.graph.coverage.node,
        'DYNAMIC_DEPENDENCY_AMBIGUOUS',
        dynamicPaths,
        context.graph.coverage.node,
      );
    }
    const coverageRelevant = range.paths.filter((path) =>
      selectorsMatch(path, [
        ...(context.graph.population.coverage_relevant ?? []),
        ...(context.graph.authoritative_gates === undefined
          ? []
          : [
              ...(context.graph.population.production ?? []),
              ...(context.graph.population.tests ?? []),
            ]),
      ]),
    );
    if (coverageRelevant.length > 0)
      select(context.graph.coverage.node, 'COVERAGE_RELEVANT_CHANGE', coverageRelevant);
  }
  const byId = new Map(ordered.map((node) => [node.id, node]));
  const includeDependencies = (id) => {
    for (const dependency of byId.get(id)?.depends_on ?? []) {
      if (!selected.has(dependency)) select(dependency, 'TRANSITIVE_DEPENDENCY');
      includeDependencies(dependency);
    }
  };
  for (const id of [...selected.keys()]) includeDependencies(id);

  const allProbeIds = (context.policy.freshness?.toolchain ?? []).map(({ id }) => id);
  const allEnvironmentIds = (context.policy.freshness?.environment_allowlist ?? []).map(
    ({ name }) => name,
  );
  const toolchainManifest = toolchainManifestV5(context.policy, allProbeIds, findings);
  const environmentManifest = environmentManifestV5(context.policy, allEnvironmentIds, findings);
  const toolchainDigest = sha256(canonical(toolchainManifest));
  const environmentDigest = sha256(canonical(environmentManifest));
  const planned = [];
  const plannedById = new Map();
  const resultKeys = new Map();
  for (const node of ordered) {
    const inputEntries = v3InputEntries([
      ...node.input_selectors,
      context.profilePath,
      context.profile.sources.affected_test_graph,
      'law/policy/round-close-controls.json',
    ]);
    const inputManifestDigest = sha256(canonical(inputEntries));
    const dependencyKeys = Object.fromEntries(
      (node.depends_on ?? [])
        .filter((id) => resultKeys.has(id))
        .map((id) => [id, resultKeys.get(id)]),
    );
    const outputState = v3OutputState(node.outputs ?? []);
    const dependencyInputManifest = [
      ...new Map(
        (node.depends_on ?? [])
          .flatMap((id) => plannedById.get(id)?.input_manifest ?? [])
          .map((entry) => [entry.source, entry]),
      ).values(),
    ].sort((left, right) => left.source.localeCompare(right.source));
    const outputContract = (node.outputs ?? []).length > 0 ? 'digest-required' : 'none';
    const gateFreshnessProfileDigest = sha256(
      canonical({
        node_id: node.id,
        input_selectors: node.input_selectors,
        dependencies: node.depends_on ?? [],
        toolchain_probe_ids: allProbeIds,
        environment_input_ids: allEnvironmentIds,
        output_contract: outputContract,
        required_outputs: node.outputs ?? [],
      }),
    );
    const keyBody = {
      task_id: node.id,
      argv: node.command,
      cwd: node.cwd,
      gate_freshness_profile_digest: gateFreshnessProfileDigest,
      input_manifest: inputEntries,
      input_manifest_digest: inputManifestDigest,
      dependency_input_manifest: dependencyInputManifest,
      dependency_keys: dependencyKeys,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      toolchain_digest: toolchainDigest,
      toolchain_manifest: toolchainManifest,
      environment_digest: environmentDigest,
      environment_manifest: environmentManifest,
      output_contract: outputContract,
      producing_candidate: range.exactHead,
    };
    const taskKey = sha256(canonical(keyBody));
    resultKeys.set(node.id, taskKey);
    const expectedCache = {
      round: context.profile.round,
      task_id: node.id,
      task_key: taskKey,
      argv: node.command,
      cwd: node.cwd,
      gate_freshness_profile_digest: gateFreshnessProfileDigest,
      input_manifest: inputEntries,
      input_manifest_digest: inputManifestDigest,
      dependency_input_manifest: dependencyInputManifest,
      dependency_keys: dependencyKeys,
      dependency_results: Object.fromEntries(
        (node.depends_on ?? [])
          .map((id) => [id, plannedById.get(id)])
          .filter(([, dependency]) => dependency?.outcome === 'REUSE_FRESH')
          .map(([id, dependency]) => [
            id,
            {
              task_key: dependency.task_key,
              result_digest: dependency.cache.result_digest,
              fresh_pass: true,
            },
          ]),
      ),
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      toolchain_digest: toolchainDigest,
      toolchain_manifest: toolchainManifest,
      environment_digest: environmentDigest,
      environment_manifest: environmentManifest,
      output_contract: outputContract,
      producing_candidate: range.exactHead,
    };
    const cache = remote ? null : v3ReadCache(context, expectedCache, findings);
    const outputsFresh =
      outputState.missing.length === 0 &&
      cache !== null &&
      canonical(cache.outputs ?? []) === canonical(outputState.outputs);
    const selection = selected.get(node.id);
    const dependenciesFresh = (node.depends_on ?? []).every(
      (id) => plannedById.get(id)?.outcome === 'REUSE_FRESH',
    );
    let outcome = 'BLOCKED';
    let reasonCodes = ['NO_FRESH_RESULT'];
    if (remote) {
      outcome = 'EXECUTE';
      reasonCodes = ['REMOTE_FULL'];
    } else if (cache !== null && outputsFresh && dependenciesFresh) {
      outcome = 'REUSE_FRESH';
      reasonCodes =
        selection === undefined
          ? ['UNCHANGED_FRESH_PASS']
          : [...selection.reasons, 'CONTENT_IDENTICAL_PASS'];
    } else if (selection !== undefined || cache !== null) {
      outcome = 'EXECUTE';
      reasonCodes = [
        ...(selection?.reasons ?? []),
        ...(dependenciesFresh ? [] : ['DEPENDENCY_PASS_STALE']),
      ];
      if (cache !== null && !outputsFresh) reasonCodes.push('OUTPUT_INVALIDATED');
    }
    const plannedNode = {
      node_id: node.id,
      outcome,
      reason_codes: [...new Set(reasonCodes)].sort(),
      changed_inputs: [...(selection?.paths ?? [])].sort(),
      task_key: taskKey,
      dependency_keys: dependencyKeys,
      dependency_results: expectedCache.dependency_results,
      fallback_population: selection?.fallback ?? null,
      argv: node.command,
      cwd: node.cwd,
      gate_freshness_profile_digest: gateFreshnessProfileDigest,
      input_manifest: inputEntries,
      outputs: outputState.outputs,
      input_manifest_digest: inputManifestDigest,
      dependency_input_manifest: dependencyInputManifest,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      toolchain_digest: toolchainDigest,
      toolchain_manifest: toolchainManifest,
      environment_digest: environmentDigest,
      environment_manifest: environmentManifest,
      output_contract: outputContract,
      cache,
    };
    planned.push(plannedNode);
    plannedById.set(node.id, plannedNode);
  }
  return { range, remote, nodes: planned };
}

export function impactPlanV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactContextCandidate = git(repoRoot, [
    'rev-parse',
    `${head === WORKTREE_REVISION ? 'HEAD' : head}^{commit}`,
  ]);
  const context = ['4.0.0', '5.0.0'].includes(livePolicy?.schemaVersion)
    ? loadV4Context(round, findings, exactContextCandidate)
    : loadV3Context(round, findings);
  const plan = context === null ? null : buildImpactPlan(context, base, head, findings);
  const blockingFindings = findings.filter(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID');
  emit({
    ok: blockingFindings.length === 0 && plan !== null,
    command: 'impact-plan',
    round,
    base: plan?.range.exactBase ?? base,
    head: plan?.range.exactHead ?? head,
    remote: plan?.remote ?? false,
    cache_trusted: plan === null ? false : !plan.remote,
    nodes: (plan?.nodes ?? []).map(({ cache: _cache, ...node }) => node),
    findings,
  });
}

export function executeCompleteGatePopulationV8(gates, runner) {
  return gates.map((gate, ordinal) => ({ gate_id: gate.id, ...runner(gate, ordinal) }));
}

export function smartConvergeV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactHead = git(repoRoot, ['rev-parse', head]);
  const exactBase = git(repoRoot, ['rev-parse', base]);
  const exactHeadBefore = git(repoRoot, ['rev-parse', 'HEAD']);
  if (exactHeadBefore !== exactHead)
    findings.push(finding('CONVERGENCE_HEAD_MISMATCH', 'checkout differs from requested head'));
  if (cleanStatus(repoRoot).length > 0)
    findings.push(finding('CONVERGENCE_DIRTY_TREE', 'smart convergence requires a clean worktree'));
  const context = ['4.0.0', '5.0.0'].includes(livePolicy?.schemaVersion)
    ? loadV4Context(round, findings, exactHead)
    : loadV3Context(round, findings);
  let roundDeclaration = null;
  if (['4.0.0', '5.0.0'].includes(context?.policy.schemaVersion)) {
    roundDeclaration = roundDeclarationV4(context, exactHead, findings);
    if (
      roundDeclaration === null ||
      roundDeclaration.declaration.exact_base !== exactBase ||
      gitResult(repoRoot, ['merge-base', '--is-ancestor', exactBase, exactHead]).status !== 0
    )
      findings.push(
        finding(
          'CONVERGENCE_DECLARATION_INVALID',
          'smart convergence requires the candidate-tree B0 decision and exact declared ancestor base',
        ),
      );
  }
  const passes = [];
  let executedTests = 0;
  let reusedTests = 0;
  const isBlocking = () => findings.some(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID');
  const executeAffected = (plan) => {
    const results = [];
    const passing = new Map();
    for (const item of plan.nodes) {
      const node = context.graph.nodes.find(({ id }) => id === item.node_id);
      if (item.outcome === 'BLOCKED') {
        results.push({
          ...item,
          cache: undefined,
          plan_outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: null,
        });
        continue;
      }
      const dependenciesPass = (node.depends_on ?? []).every((id) => passing.has(id));
      if (!dependenciesPass) {
        results.push({
          ...item,
          cache: undefined,
          plan_outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: null,
        });
        findings.push(
          finding('FRESHNESS_DEPENDENCY_BLOCKED', 'task dependency did not pass', {
            task_id: node.id,
          }),
        );
        continue;
      }
      if (item.outcome === 'REUSE_FRESH') {
        passing.set(node.id, item.cache);
        if (node.kind === 'test-shard' || node.id === context.graph.fallbacks.unknown_dependency)
          reusedTests += 1;
        results.push({
          ...item,
          cache: undefined,
          plan_outcome: 'REUSE_FRESH',
          result: 'REUSED_FRESH_PASS',
          exit_code: 0,
          reused_result_digest: item.cache.result_digest,
        });
        continue;
      }
      const [program, ...args] = node.command;
      const executed = run(program, args, { cwd: resolve(repoRoot, node.cwd) });
      const outputState = v3OutputState(node.outputs ?? []);
      const result =
        executed.status === 0 && outputState.missing.length === 0
          ? 'EXECUTED_PASS'
          : 'EXECUTED_FAIL';
      const dependencyResults = Object.fromEntries(
        (node.depends_on ?? []).map((id) => {
          const record = passing.get(id);
          return [
            id,
            { task_key: record.task_key, result_digest: record.result_digest, fresh_pass: true },
          ];
        }),
      );
      const body = {
        schemaVersion: context.policy.schemaVersion === '5.0.0' ? '3.0.0' : '2.0.0',
        policy_version: context.policy.freshness.policy_version,
        graph_version: context.graph.graph_version,
        round,
        task_id: node.id,
        plan_outcome: 'EXECUTE',
        reason_codes: item.reason_codes,
        changed_inputs: item.changed_inputs,
        fallback_population: item.fallback_population,
        argv: node.command,
        cwd: node.cwd,
        task_key: item.task_key,
        gate_freshness_profile_digest: item.gate_freshness_profile_digest,
        input_manifest: item.input_manifest,
        input_manifest_digest: item.input_manifest_digest,
        dependency_input_manifest: item.dependency_input_manifest,
        dependency_keys: item.dependency_keys,
        dependency_results: dependencyResults,
        policy_digest: item.policy_digest,
        graph_digest: item.graph_digest,
        toolchain_digest: item.toolchain_digest,
        toolchain_manifest: item.toolchain_manifest,
        environment_digest: item.environment_digest,
        environment_manifest: item.environment_manifest,
        producing_candidate: exactHead,
        result,
        exit_code: executed.status ?? 1,
        stdout_sha256: sha256(executed.stdout ?? ''),
        stderr_sha256: sha256(executed.stderr ?? ''),
        reused_result_digest: null,
        output_contract: item.output_contract,
        outputs: outputState.outputs,
        freshness_reason: 'executed for the exact content-addressed task key',
      };
      const record = { ...body, result_digest: sha256(canonical(body)) };
      if (result === 'EXECUTED_PASS') {
        v3WriteCache(context, node.id, item.task_key, record);
        passing.set(node.id, record);
      } else {
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', 'affected task failed', {
            task_id: node.id,
            exit_code: executed.status ?? 1,
            stderr: executed.stderr,
          }),
        );
      }
      if (node.kind === 'test-shard' || node.id === context.graph.fallbacks.unknown_dependency)
        executedTests += 1;
      results.push(record);
    }
    return results;
  };
  const executePolicyGates = () => {
    const results = [];
    const completePopulation = executeCompleteGatePopulationV8(
      context.policy.convergence?.commands ?? [],
      (gate) => ({ gate }),
    );
    for (const { gate } of completePopulation) {
      const argv = [...gate.argv];
      const gateProfile =
        context.policy.schemaVersion === '5.0.0'
          ? gateFreshnessProfileV5(context, gate, findings)
          : {
              gate_id: gate.id,
              input_selectors: context.policy.semantic_assertions?.population_sources ?? [],
              dependency_selectors: [
                context.profilePath,
                context.profile.sources.affected_test_graph,
              ],
              toolchain_probe_ids: (context.policy.freshness?.toolchain ?? []).map(({ id }) => id),
              environment_input_ids: (context.policy.freshness?.environment_allowlist ?? []).map(
                ({ name }) => name,
              ),
              output_contract: 'none',
              required_outputs: [],
            };
      if (gateProfile === null) {
        findings.push(
          finding(
            'GATE_FRESHNESS_PROFILE_INCOMPLETE',
            'authoritative gate has no resolvable freshness profile',
            { gate_id: gate.id },
          ),
        );
        results.push({
          node_id: gate.id,
          gate_id: gate.id,
          outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: 1,
          task_key: null,
          output_digest: null,
        });
        continue;
      }
      const inputManifest = rawCandidateInputManifest(exactHead, gateProfile.input_selectors);
      const dependencyInputManifest = rawCandidateInputManifest(
        exactHead,
        gateProfile.dependency_selectors,
      );
      const toolchainManifest = toolchainManifestV5(
        context.policy,
        gateProfile.toolchain_probe_ids,
        findings,
      );
      const environmentManifest = environmentManifestV5(
        context.policy,
        gateProfile.environment_input_ids,
        findings,
      );
      const toolchainDigest = sha256(canonical(toolchainManifest));
      const environmentDigest = sha256(canonical(environmentManifest));
      const outputState = observedPersistentOutputsV6(repoRoot, gateProfile.required_outputs);
      const gateFreshnessProfileDigest = sha256(canonical(gateProfile));
      const inputManifestDigest = sha256(canonical(inputManifest));
      const taskId = `gate-${gate.id}`;
      const keyBody = {
        task_id: taskId,
        argv,
        cwd: '.',
        gate_freshness_profile_digest: gateFreshnessProfileDigest,
        input_manifest: inputManifest,
        input_manifest_digest: inputManifestDigest,
        dependency_input_manifest: dependencyInputManifest,
        dependency_keys: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        toolchain_manifest: toolchainManifest,
        environment_digest: environmentDigest,
        environment_manifest: environmentManifest,
        output_contract: gateProfile.output_contract,
        outputs: outputState.outputs,
        producing_candidate: exactHead,
      };
      const taskKey = sha256(canonical(keyBody));
      const expected = {
        round,
        task_id: taskId,
        task_key: taskKey,
        argv,
        cwd: '.',
        gate_freshness_profile_digest: gateFreshnessProfileDigest,
        input_manifest: inputManifest,
        input_manifest_digest: inputManifestDigest,
        dependency_input_manifest: dependencyInputManifest,
        dependency_keys: {},
        dependency_results: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        toolchain_manifest: toolchainManifest,
        environment_digest: environmentDigest,
        environment_manifest: environmentManifest,
        output_contract: gateProfile.output_contract,
        producing_candidate: exactHead,
      };
      const cache = v3Remote(context.policy) ? null : v3ReadCache(context, expected, findings);
      const outputsFresh =
        cache !== null &&
        outputState.missing.length === 0 &&
        canonical(cache.outputs ?? []) === canonical(outputState.outputs);
      if (outputsFresh) {
        results.push({
          node_id: gate.id,
          gate_id: gate.id,
          outcome: 'REUSE_FRESH',
          result: 'REUSED_FRESH_PASS',
          exit_code: 0,
          task_key: taskKey,
          output_digest: cache.result_digest,
        });
        continue;
      }
      const [program, ...args] = argv;
      const executed = run(program, args, { cwd: repoRoot });
      const outputsAfter = observedPersistentOutputsV6(repoRoot, gateProfile.required_outputs);
      const result =
        executed.status === 0 && outputsAfter.missing.length === 0
          ? 'EXECUTED_PASS'
          : 'EXECUTED_FAIL';
      if (outputsAfter.missing.length > 0)
        findings.push(
          finding(
            'GATE_REQUIRED_OUTPUT_MISSING',
            'gate completed without its complete required output population',
            { gate_id: gate.id, missing: outputsAfter.missing },
          ),
        );
      if (
        cache !== null &&
        outputState.missing.length === 0 &&
        canonical(cache.outputs ?? []) !== canonical(outputState.outputs)
      ) {
        // A changed output never reuses the old PASS; successful execution below replaces it atomically.
        if (result !== 'EXECUTED_PASS')
          findings.push(
            finding(
              'GATE_REQUIRED_OUTPUT_TAMPERED',
              'tampered gate output could not be regenerated',
              { gate_id: gate.id },
            ),
          );
      }
      const body = {
        schemaVersion: context.policy.schemaVersion === '5.0.0' ? '3.0.0' : '2.0.0',
        policy_version: context.policy.freshness.policy_version,
        graph_version: context.graph.graph_version,
        round,
        task_id: taskId,
        plan_outcome: 'EXECUTE',
        reason_codes: ['AUTHORITATIVE_POLICY_GATE'],
        changed_inputs: [],
        fallback_population: null,
        argv,
        cwd: '.',
        task_key: taskKey,
        gate_freshness_profile_digest: gateFreshnessProfileDigest,
        input_manifest: inputManifest,
        input_manifest_digest: inputManifestDigest,
        dependency_input_manifest: dependencyInputManifest,
        dependency_keys: {},
        dependency_results: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        toolchain_manifest: toolchainManifest,
        environment_digest: environmentDigest,
        environment_manifest: environmentManifest,
        producing_candidate: exactHead,
        result,
        exit_code: executed.status ?? 1,
        stdout_sha256: sha256(executed.stdout ?? ''),
        stderr_sha256: sha256(executed.stderr ?? ''),
        reused_result_digest: null,
        output_contract: gateProfile.output_contract,
        outputs: outputsAfter.outputs,
        freshness_reason: 'executed authoritative policy gate for exact candidate',
      };
      const record = { ...body, result_digest: sha256(canonical(body)) };
      if (result === 'EXECUTED_PASS') v3WriteCache(context, taskId, taskKey, record);
      else
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', 'authoritative policy gate failed', {
            task_id: gate.id,
            exit_code: executed.status ?? 1,
            stderr: executed.stderr,
          }),
        );
      results.push({
        node_id: gate.id,
        gate_id: gate.id,
        outcome: 'EXECUTE',
        result,
        exit_code: executed.status ?? 1,
        task_key: taskKey,
        output_digest: record.result_digest,
      });
    }
    return results;
  };
  for (let passNumber = 1; passNumber <= 2 && context !== null && !isBlocking(); passNumber += 1) {
    const headBefore = git(repoRoot, ['rev-parse', 'HEAD']);
    const statusBefore = cleanStatus(repoRoot);
    const plan = buildImpactPlan(context, base, exactHead, findings);
    if (plan === null) break;
    const affectedResults = executeAffected(plan);
    // A blocking impact plan must not erase the population. Every declared gate keeps
    // an ordered terminal record carrying its identity and an exit code, so terminal
    // evidence still accounts for all sixteen commands.
    const results = isBlocking()
      ? (context.policy.convergence?.commands ?? []).map((gate) => ({
          node_id: gate.id,
          gate_id: gate.id,
          outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: 1,
          task_key: null,
          output_digest: null,
        }))
      : executePolicyGates();
    const headAfter = git(repoRoot, ['rev-parse', 'HEAD']);
    const statusAfter = cleanStatus(repoRoot);
    if (headBefore !== exactHead || headAfter !== exactHead)
      findings.push(finding('CONVERGENCE_HEAD_MISMATCH', 'pass changed exact HEAD identity'));
    if (statusBefore !== '' || statusAfter !== '')
      findings.push(finding('CONVERGENCE_PASS_WROTE_TREE', 'pass boundary is not clean'));
    passes.push({
      pass: passNumber,
      results,
      affected_results: affectedResults,
      head_before: headBefore,
      head_after: headAfter,
    });
  }
  const normalizedPass = (pass) =>
    pass.results.map(({ node_id, task_key, result }) => ({
      node_id,
      task_key,
      pass: result === 'EXECUTED_PASS' || result === 'REUSED_FRESH_PASS',
    }));
  const passBoundariesEquivalent =
    passes.length === 2 &&
    canonical(normalizedPass(passes[0])) === canonical(normalizedPass(passes[1]));
  const exactHeadAfter = git(repoRoot, ['rev-parse', 'HEAD']);
  const secondPassNoWrite = passes.length === 2 && cleanStatus(repoRoot) === '';
  if (!passBoundariesEquivalent)
    findings.push(
      finding('CONVERGENCE_PASS_MISMATCH', 'two policy-gate passes are not equivalent'),
    );
  let ok =
    !isBlocking() && passes.length === 2 && secondPassNoWrite && exactHeadAfter === exactHead;
  if (ok && context !== null) {
    if (['4.0.0', '5.0.0'].includes(context.policy.schemaVersion)) {
      const tree = git(repoRoot, ['rev-parse', `${exactHead}^{tree}`]);
      const gateIds = (context.policy.convergence?.commands ?? []).map(({ id }) => id);
      const semanticPopulationDigest = sha256(canonical(gateIds));
      const convergencePasses = passes.map((pass, index) => {
        const gateResults = gateIds.map((gateId) => {
          const actual = pass.results.find(({ node_id }) => node_id === gateId);
          const body = {
            gate_id: gateId,
            outcome: actual?.result === 'EXECUTED_PASS' ? 'EXECUTED_PASS' : 'REUSED_FRESH_PASS',
            task_key: actual.task_key,
            output_digest: actual.output_digest,
          };
          return withSelfDigest(body, 'result_digest');
        });
        return withSelfDigest(
          {
            pass_number: index + 1,
            head_before: pass.head_before,
            head_after: pass.head_after,
            tree_sha: tree,
            clean_before: true,
            clean_after: true,
            writes: [],
            gate_results: gateResults,
            semantic_population_digest: semanticPopulationDigest,
          },
          'pass_digest_sha256',
        );
      });
      const candidateIdentityDigest = candidateIdentityDigestV4(
        context,
        exactBase,
        exactHead,
        tree,
      );
      const impactExecution = affectedExecutionV4(context, exactBase, exactHead, passes, findings);
      if (impactExecution !== null && !isBlocking())
        writeJsonAtomic(join(repoRoot, context.profile.runtime.impact_execution), impactExecution);
      const convergence = withSelfDigest(
        {
          schemaVersion: '1.0.0',
          round,
          exact_base: exactBase,
          candidate_sha: exactHead,
          candidate_tree: tree,
          candidate_identity_digest: candidateIdentityDigest,
          policy_digest: context.digests.policy,
          profile_digest: context.digests.profile,
          authoritative_gate_ids: gateIds,
          authoritative_population_digest: semanticPopulationDigest,
          impact_execution_digest: impactExecution?.execution_digest_sha256 ?? sha256('MISSING\n'),
          passes: convergencePasses,
        },
        'convergence_digest_sha256',
      );
      validateDocument(
        convergence,
        context.policy.schemas.round_convergence,
        findings,
        'CONVERGENCE_SCHEMA_INVALID',
        'convergence evidence',
      );
      if (!isBlocking())
        writeJsonAtomic(join(repoRoot, context.profile.runtime.convergence_evidence), convergence);
      const ledger = !isBlocking()
        ? materializeClaimsV4(context, convergence, exactHead, findings)
        : null;
      const binding = reviewerBindingV4(context, exactHead);
      findings.push(...binding.findings);
      if (binding.selected === null)
        findings.push(
          binding.diagnostic ??
            finding(
              'ENTRY_BLOCKED_REVIEWER_UNBOUND',
              'candidate freeze requires an authenticated reviewer binding',
            ),
        );
      const activeControlCensus =
        context.policy.schemaVersion === '5.0.0'
          ? deriveActiveControlCensusV5(context, exactHead, findings)
          : null;
      if (activeControlCensus !== null && !isBlocking())
        writeJsonAtomic(
          join(repoRoot, context.profile.runtime.active_control_census),
          activeControlCensus,
        );
      if (ledger !== null && binding.selected !== null && !isBlocking()) {
        const candidateManifest = withSelfDigest(
          {
            schemaVersion: context.policy.schemaVersion === '5.0.0' ? '3.0.0' : '2.0.0',
            round,
            base_sha: exactBase,
            candidate_sha: exactHead,
            tree_sha: tree,
            profile_digest: context.digests.profile,
            policy_digest: context.digests.policy,
            graph_digest: context.digests.graph,
            candidate_identity_digest: candidateIdentityDigest,
            convergence_digest: convergence.convergence_digest_sha256,
            claims_digest: ledger.claims_digest_sha256,
            reviewer_binding_digest: binding.selected.digest,
            ...(activeControlCensus === null
              ? {}
              : { active_control_census_digest: activeControlCensus.census_digest_sha256 }),
            declaration_id: roundDeclaration.declaration.decision_id,
            declaration_digest: roundDeclaration.digest,
            impact_execution_digest: impactExecution.execution_digest_sha256,
          },
          'manifest_digest_sha256',
        );
        validateDocument(
          candidateManifest,
          context.policy.schemas.candidate_manifest,
          findings,
          'CANDIDATE_MANIFEST_SCHEMA_INVALID',
          'candidate manifest',
        );
        if (!isBlocking())
          writeJsonAtomic(
            join(repoRoot, context.profile.runtime.candidate_manifest),
            candidateManifest,
          );
      }
      ok = !isBlocking();
      if (!ok) {
        rmSync(join(repoRoot, context.profile.runtime.candidate_manifest), { force: true });
        rmSync(join(repoRoot, context.profile.runtime.convergence_evidence), { force: true });
        rmSync(join(repoRoot, context.profile.runtime.materialized_claims), { force: true });
        rmSync(join(repoRoot, context.profile.runtime.impact_execution), { force: true });
        if (context.profile.runtime.active_control_census)
          rmSync(join(repoRoot, context.profile.runtime.active_control_census), { force: true });
      }
    } else {
      const convergenceBody = { ok, base: exactBase, head: exactHead, passes };
      const convergence = {
        ...convergenceBody,
        convergence_digest_sha256: sha256(canonical(convergenceBody)),
      };
      writeState(repoRoot, round, 'convergence.json', convergence);
      const candidateBody = {
        schemaVersion: '1.0.0',
        round,
        base_sha: exactBase,
        candidate_sha: exactHead,
        tree_sha: git(repoRoot, ['rev-parse', `${exactHead}^{tree}`]),
        profile_digest: context.digests.profile,
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        convergence_digest: convergence.convergence_digest_sha256,
      };
      writeState(repoRoot, round, 'candidate-manifest.json', {
        ...candidateBody,
        manifest_digest_sha256: sha256(canonical(candidateBody)),
      });
    }
  }
  emit({
    ok,
    command: 'smart-converge',
    round,
    base,
    head: exactHead,
    exact_head_before: exactHeadBefore,
    exact_head_after: exactHeadAfter,
    second_pass_no_write: secondPassNoWrite,
    pass_boundaries_equivalent: passBoundariesEquivalent,
    passes,
    executed_test_nodes: executedTests,
    reused_test_nodes: reusedTests,
    findings,
  });
}
