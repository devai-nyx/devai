#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHA40 = /^[0-9a-f]{40}$/u;

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const command = process.argv[2] ?? '';
const repoRoot = resolve(option('--repo-root') ?? SCRIPT_ROOT);
const jsonMode = process.argv.includes('--json');
const policyPath = join(repoRoot, 'law/policy/round-close-controls.json');
const mirrorPath = join(repoRoot, '.devai/config/round-close-controls.json');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function canonical(value) {
  return `${JSON.stringify(stable(value))}\n`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(program, args, options = {}) {
  return spawnSync(program, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    input: options.input,
    env: { ...process.env, ...options.env },
    maxBuffer: 64 * 1024 * 1024,
  });
}

function gitResult(root, args, options = {}) {
  return run('git', args, { ...options, cwd: root });
}

function git(root, args, options = {}) {
  const result = gitResult(root, args, options);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function finding(code, message, extra = {}) {
  return { code, message, ...extra };
}

function emit(result) {
  if (jsonMode) process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (result.ok) process.stdout.write(`round close controls: PASS (${result.command})\n`);
  else
    process.stderr.write(
      `round close controls: FAIL (${result.command})\n${result.findings
        .map(({ code, message }) => `${code}: ${message}`)
        .join('\n')}\n`,
    );
  process.exitCode = result.ok ? 0 : 1;
}

function loadPolicy(findings) {
  if (!existsSync(policyPath)) {
    findings.push(finding('POLICY_MISSING', `missing ${relative(repoRoot, policyPath)}`));
    return null;
  }
  try {
    return readJson(policyPath);
  } catch (error) {
    findings.push(finding('POLICY_MALFORMED', String(error)));
    return null;
  }
}

function globExpression(glob) {
  let expression = '';
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    const next = glob[index + 1];
    if (character === '*' && next === '*') {
      if (glob[index + 2] === '/') {
        expression += '(?:.*/)?';
        index += 2;
      } else {
        expression += '.*';
        index += 1;
      }
    } else if (character === '*') expression += '[^/]*';
    else if ('\\.^$+?()[]{}|'.includes(character)) expression += `\\${character}`;
    else expression += character;
  }
  return new RegExp(`^${expression}$`, 'u');
}

function matches(path, glob) {
  return globExpression(glob).test(path);
}

function trackedPaths(root, revision = 'HEAD') {
  return git(root, ['ls-tree', '-r', '--name-only', revision]).split('\n').filter(Boolean).sort();
}

function candidateFile(root, revision, path) {
  return git(root, ['show', `${revision}:${path}`]);
}

function pathsForGlobs(root, revision, globs) {
  return trackedPaths(root, revision).filter((path) => globs.some((glob) => matches(path, glob)));
}

function digestPaths(root, revision, globs) {
  const entries = pathsForGlobs(root, revision, globs).map((path) => ({
    path,
    digest: sha256(candidateFile(root, revision, path)),
  }));
  return sha256(canonical(entries));
}

function cleanStatus(root) {
  return git(root, ['status', '--porcelain', '--untracked-files=all']);
}

function stateDirectory(root, round) {
  return join(root, '.devai/state/round-runs', round, 'close');
}

function writeState(root, round, name, value) {
  const directory = stateDirectory(root, round);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

function readState(root, round, name) {
  const path = join(stateDirectory(root, round), name);
  if (!existsSync(path)) return { status: 'missing', value: null };
  try {
    return { status: 'valid', value: readJson(path) };
  } catch (error) {
    return { status: 'malformed', value: null, error: String(error) };
  }
}

function policyFindings(policy) {
  const findings = [];
  const assertions = policy?.semantic_assertions;
  if (assertions === null || typeof assertions !== 'object' || Array.isArray(assertions)) {
    findings.push(finding('SEMANTIC_ASSERTION_VACUOUS', 'semantic_assertions must be an object'));
    return findings;
  }
  const serialized = JSON.stringify(assertions);
  const populations = Array.isArray(assertions.population_sources)
    ? assertions.population_sources
    : [];
  if (
    serialized.includes('"fixed_count":') ||
    assertions.fixed_counts_forbidden !== true ||
    assertions.self_comparisons_forbidden !== true ||
    assertions.named_file_only_forbidden !== true ||
    populations.length === 0 ||
    populations.every((source) => typeof source === 'string' && !source.includes('*')) ||
    (Array.isArray(assertions.compare) &&
      assertions.compare.length === 2 &&
      assertions.compare[0] === assertions.compare[1])
  ) {
    findings.push(
      finding(
        'SEMANTIC_ASSERTION_VACUOUS',
        'fixed counts, self-comparisons, and named-file-only populations are forbidden',
      ),
    );
  }
  const identities = policy?.identities;
  if (
    !Array.isArray(identities?.fields) ||
    JSON.stringify(identities.fields) !==
      JSON.stringify(['implementation_subject', 'review_candidate', 'published_head']) ||
    identities.required_kind !== 'commit' ||
    identities.publishability !== 'candidate-only-no-alternates'
  ) {
    findings.push(
      finding('POLICY_IDENTITY_CONTRACT_INVALID', 'three exact identities are required'),
    );
  }
  if (
    policy?.governed_range?.mode === undefined ||
    policy.governed_range.fixed_windows_forbidden !== true
  ) {
    findings.push(finding('POLICY_RANGE_CONTRACT_INVALID', 'exact-base range policy is required'));
  }
  if (policy?.convergence?.passes !== 2 || policy?.convergence?.second_pass !== 'no-write-clean') {
    findings.push(
      finding('POLICY_CONVERGENCE_INVALID', 'two passes with a no-write second pass are required'),
    );
  }
  return findings;
}

function policyCheck() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy !== null) findings.push(...policyFindings(policy));
  if (
    !existsSync(mirrorPath) ||
    !existsSync(policyPath) ||
    !readFileSync(policyPath).equals(readFileSync(mirrorPath))
  ) {
    findings.push(
      finding(
        'POLICY_MIRROR_DRIFT',
        'round close control policy and committed materialization must be byte-identical',
      ),
    );
  }
  emit({ ok: findings.length === 0, command: 'policy-check', findings });
}

function materialize() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy !== null) findings.push(...policyFindings(policy));
  if (findings.length === 0) {
    mkdirSync(dirname(mirrorPath), { recursive: true });
    writeFileSync(mirrorPath, readFileSync(policyPath));
  }
  emit({
    ok: findings.length === 0,
    command: 'materialize',
    output: relative(repoRoot, mirrorPath),
    findings,
  });
}

function declaredBase(root, policy, revision, findings) {
  const decisionPath = 'law/register/DECISIONS.md';
  let source = '';
  try {
    source = candidateFile(root, revision, decisionPath);
  } catch (error) {
    findings.push(finding('DECLARATION_MISSING', String(error), { path: decisionPath }));
    return '';
  }
  const decisionId = policy?.declaration?.decision_id;
  const sectionIndex = source.indexOf(`### ${decisionId} `);
  const section = sectionIndex === -1 ? '' : source.slice(sectionIndex);
  let expression;
  try {
    expression = new RegExp(policy.declaration.base_pattern, 'u');
  } catch (error) {
    findings.push(finding('DECLARATION_PATTERN_INVALID', String(error)));
    return '';
  }
  const base = expression.exec(section)?.[1] ?? '';
  if (!SHA40.test(base))
    findings.push(finding('DECLARATION_BASE_INVALID', 'exact declaration base missing'));
  return base;
}

function isolatedClone(root, candidate) {
  const temporary = mkdtempSync(join(tmpdir(), 'devai-candidate-only-'));
  const bare = join(temporary, 'candidate.git');
  const checkout = join(temporary, 'checkout');
  git(temporary, ['init', '--bare', '-q', bare]);
  const fetched = gitResult(bare, [
    '-c',
    'uploadpack.allowReachableSHA1InWant=true',
    'fetch',
    '--no-tags',
    root,
    `${candidate}:refs/heads/candidate`,
  ]);
  if (fetched.status !== 0) {
    rmSync(temporary, { recursive: true, force: true });
    throw new Error(`candidate-only fetch failed: ${fetched.stderr || fetched.stdout}`);
  }
  git(temporary, [
    'clone',
    '-q',
    '--no-local',
    '--single-branch',
    '--branch',
    'candidate',
    bare,
    checkout,
  ]);
  const alternates = [
    join(bare, 'objects/info/alternates'),
    join(checkout, '.git/objects/info/alternates'),
  ].some(existsSync);
  return {
    temporary,
    bare,
    checkout,
    alternates,
    refs: git(checkout, ['for-each-ref', '--format=%(refname)']).split('\n').filter(Boolean).sort(),
  };
}

function exceptionRegistry(root) {
  if (!existsSync(join(root, 'law/policy/governed-sha-reference-exceptions.json'))) return [];
  const value = readJson(join(root, 'law/policy/governed-sha-reference-exceptions.json'));
  return Array.isArray(value.entries) ? value.entries : [];
}

function candidateIdentityReferences(root, candidate, policy) {
  const sources = pathsForGlobs(root, candidate, policy.governed_identity_sources ?? []);
  const references = new Map();
  for (const path of sources) {
    const source = candidateFile(root, candidate, path);
    for (const match of source.matchAll(/\b[0-9a-f]{40}\b/gu)) {
      const paths = references.get(match[0]) ?? new Set();
      paths.add(path);
      references.set(match[0], paths);
    }
  }
  return references;
}

function inspectIdentity(root, cloneRoot, value, field, findings) {
  if (!SHA40.test(value ?? '')) {
    findings.push(
      finding('GIT_IDENTITY_NOT_FULL', `${field} must be one exact forty-hex identity`, { field }),
    );
    return;
  }
  const local = gitResult(root, ['cat-file', '-t', value]);
  if (local.status !== 0) {
    findings.push(
      finding('GIT_IDENTITY_UNRESOLVED', `${field} does not resolve`, { field, sha: value }),
    );
    return;
  }
  if (local.stdout.trim() !== 'commit') {
    findings.push(
      finding('GIT_IDENTITY_WRONG_KIND', `${field} must resolve to a commit`, {
        field,
        sha: value,
        object_kind: local.stdout.trim(),
      }),
    );
    return;
  }
  const isolated = gitResult(cloneRoot, ['cat-file', '-t', value]);
  if (isolated.status !== 0) {
    findings.push(
      finding('GIT_IDENTITY_NOT_PUBLISHABLE', `${field} is absent from candidate-only history`, {
        field,
        sha: value,
      }),
    );
  }
}

function verifyCandidateIdentities(root, candidate, policy, fields, findings) {
  let isolated;
  try {
    isolated = isolatedClone(root, candidate);
  } catch (error) {
    findings.push(finding('CANDIDATE_CLONE_FAILED', String(error)));
    return null;
  }
  try {
    if (isolated.alternates) {
      findings.push(finding('CANDIDATE_CLONE_ALTERNATES', 'candidate-only clone has alternates'));
    }
    for (const [field, value] of Object.entries(fields)) {
      inspectIdentity(root, isolated.checkout, value, field, findings);
    }
    const references = candidateIdentityReferences(root, candidate, policy);
    const exceptions = new Map(exceptionRegistry(root).map((entry) => [entry.sha, entry]));
    const identities = [];
    for (const [sha, paths] of references) {
      const object = gitResult(isolated.checkout, ['cat-file', '-t', sha]);
      if (object.status === 0) {
        identities.push({
          sha,
          object_kind: object.stdout.trim(),
          status: 'reachable',
          paths: [...paths].sort(),
        });
        continue;
      }
      const exception = exceptions.get(sha);
      const allowed = new Set(exception?.allowed_paths ?? []);
      const actual = [...paths].sort();
      const exact =
        exception !== undefined &&
        typeof exception.object_kind === 'string' &&
        exception.object_kind.length > 0 &&
        typeof exception.reason === 'string' &&
        exception.reason.length > 0 &&
        actual.length === allowed.size &&
        actual.every((path) => allowed.has(path));
      if (!exact) {
        findings.push(
          finding(
            'GIT_IDENTITY_NOT_PUBLISHABLE',
            `${sha} is absent from candidate-only history and lacks exact classification`,
            { sha, paths: actual },
          ),
        );
      } else {
        identities.push({
          sha,
          object_kind: exception.object_kind,
          status: 'classified',
          paths: actual,
        });
      }
    }
    return {
      method: 'bundle-single-branch',
      alternates: false,
      refs: isolated.refs,
      identities,
      ok: findings.every(({ code }) => !code.startsWith('GIT_IDENTITY_')),
    };
  } finally {
    rmSync(isolated.temporary, { recursive: true, force: true });
  }
}

function authorRole(author) {
  const match = /^DEVAI (Architect|Owner|Engineer|Inspector|Auditor|Machine)$/u.exec(author);
  return match?.[1] ?? null;
}

function rolePathMap(root, base, head, policy, findings) {
  const commits = git(root, ['rev-list', '--reverse', `${base}..${head}`])
    .split('\n')
    .filter(Boolean);
  return commits.map((sha) => {
    const author = git(root, ['show', '-s', '--format=%an', sha]);
    const role = authorRole(author);
    const paths = git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
      .split('\n')
      .filter(Boolean)
      .sort();
    const allowed = role === null ? [] : (policy.role_paths?.[role] ?? []);
    const pathAuthorized =
      role !== null &&
      paths.length > 0 &&
      paths.every((path) => allowed.some((glob) => matches(path, glob)));
    if (!pathAuthorized) {
      findings.push(
        finding('ROLE_PATH_VIOLATION', `${sha} is not role-pure`, { sha, author, role, paths }),
      );
    }
    return { commit: sha, author, role: role ?? 'Unknown', paths, path_authorized: pathAuthorized };
  });
}

function projectionDigests(root, candidate, policy) {
  return (policy.projections ?? []).map((projection) => ({
    id: projection.id,
    sources_sha256: digestPaths(root, candidate, projection.sources ?? []),
    outputs_sha256: digestPaths(root, candidate, projection.outputs ?? []),
  }));
}

function coverageReading(root) {
  const path = join(root, 'scratch/coverage/t1-t3/coverage-summary.json');
  if (!existsSync(path)) return null;
  const total = readJson(path).total;
  const value = (key) => Number(total?.[key]?.pct);
  const result = {
    statements: value('statements'),
    branches: value('branches'),
    functions: value('functions'),
    lines: value('lines'),
  };
  return Object.values(result).every(Number.isFinite) ? result : null;
}

function manifest() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'manifest', findings });
  findings.push(...policyFindings(policy));
  const round = option('--round') ?? '';
  const implementationSubject = option('--implementation-subject') ?? '';
  const reviewCandidate = option('--review-candidate') ?? '';
  const publishedHead = option('--published-head') ?? '';
  if (process.argv.includes('--history-window')) {
    findings.push(
      finding('FIXED_HISTORY_WINDOW_FORBIDDEN', 'candidate range must never use a last-N window'),
    );
  }
  const base = declaredBase(repoRoot, policy, publishedHead || 'HEAD', findings);
  const suppliedBase = option('--base');
  if (suppliedBase !== undefined && suppliedBase !== base) {
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'supplied base differs from the declaration', {
        expected: base,
        actual: suppliedBase,
      }),
    );
  }
  if (SHA40.test(base) && SHA40.test(publishedHead)) {
    const ancestry = gitResult(repoRoot, ['merge-base', '--is-ancestor', base, publishedHead]);
    if (ancestry.status !== 0) {
      findings.push(
        finding('CANDIDATE_RANGE_MISMATCH', 'published head does not descend from base'),
      );
    }
  }
  const cleanClone = SHA40.test(publishedHead)
    ? verifyCandidateIdentities(
        repoRoot,
        publishedHead,
        policy,
        {
          exact_base: base,
          implementation_subject: implementationSubject,
          review_candidate: reviewCandidate,
          published_head: publishedHead,
        },
        findings,
      )
    : null;
  if (SHA40.test(implementationSubject) && SHA40.test(reviewCandidate)) {
    if (
      gitResult(repoRoot, ['merge-base', '--is-ancestor', implementationSubject, reviewCandidate])
        .status !== 0
    )
      findings.push(
        finding(
          'IDENTITY_ORDER_INVALID',
          'review_candidate must descend from implementation_subject',
        ),
      );
  }
  if (SHA40.test(reviewCandidate) && SHA40.test(publishedHead)) {
    if (
      gitResult(repoRoot, ['merge-base', '--is-ancestor', reviewCandidate, publishedHead])
        .status !== 0
    )
      findings.push(
        finding('IDENTITY_ORDER_INVALID', 'published_head must descend from review_candidate'),
      );
  }
  const convergenceState = readState(repoRoot, round, 'convergence.json');
  if (convergenceState.status === 'missing')
    findings.push(finding('CONVERGENCE_RESULT_MISSING', 'run converge first'));
  if (convergenceState.status === 'malformed')
    findings.push(
      finding('MANIFEST_STATE_MALFORMED', 'convergence result is malformed', {
        state: 'convergence.json',
        error: convergenceState.error,
      }),
    );
  if (
    convergenceState.status === 'valid' &&
    (convergenceState.value?.base !== base || convergenceState.value?.head !== publishedHead)
  )
    findings.push(
      finding('CONVERGENCE_RESULT_STALE', 'convergence result belongs to another candidate', {
        expected_base: base,
        expected_head: publishedHead,
        actual_base: convergenceState.value?.base,
        actual_head: convergenceState.value?.head,
      }),
    );
  const rehearsalState = readState(repoRoot, round, 'closure-rehearsal.json');
  if (rehearsalState.status === 'missing')
    findings.push(finding('CLOSURE_REHEARSAL_MISSING', 'run rehearse first'));
  if (rehearsalState.status === 'malformed')
    findings.push(
      finding('MANIFEST_STATE_MALFORMED', 'closure rehearsal result is malformed', {
        state: 'closure-rehearsal.json',
        error: rehearsalState.error,
      }),
    );
  if (
    rehearsalState.status === 'valid' &&
    (rehearsalState.value?.base !== base || rehearsalState.value?.candidate !== publishedHead)
  )
    findings.push(
      finding('CLOSURE_REHEARSAL_STALE', 'closure rehearsal belongs to another candidate', {
        expected_base: base,
        expected_candidate: publishedHead,
        actual_base: rehearsalState.value?.base,
        actual_candidate: rehearsalState.value?.candidate,
      }),
    );
  const convergence = convergenceState.value;
  const rehearsal = rehearsalState.value;
  const coverage = coverageReading(repoRoot);
  if (coverage === null)
    findings.push(finding('COVERAGE_RESULT_MISSING', 'coverage summary missing'));

  let output = null;
  if (
    SHA40.test(base) &&
    SHA40.test(publishedHead) &&
    cleanClone?.ok === true &&
    convergence?.ok === true &&
    rehearsal?.ok === true &&
    coverage !== null
  ) {
    const commits = git(repoRoot, ['rev-list', '--reverse', `${base}..${publishedHead}`])
      .split('\n')
      .filter(Boolean);
    const rolePathCommits = rolePathMap(repoRoot, base, publishedHead, policy, findings);
    const results = convergence.passes.flatMap((pass) => pass.results);
    const testIds = new Set(['stage2', 't4', 't5', 't6', 'coverage']);
    const body = {
      schemaVersion: '1.0.0',
      round,
      exact_base: base,
      implementation_subject: implementationSubject,
      review_candidate: reviewCandidate,
      published_head: publishedHead,
      candidate_tree: git(repoRoot, ['rev-parse', `${publishedHead}^{tree}`]),
      governed_range: { base, head: publishedHead, commits },
      role_path_commits: rolePathCommits,
      projection_materialization_digests: projectionDigests(repoRoot, publishedHead, policy),
      test_results: results.filter(({ id }) => testIds.has(id)),
      coverage,
      clean_clone: cleanClone,
      gate_results: results,
      convergence: { passes: 2, second_pass_no_write: true, clean: true },
      closure_rehearsal: rehearsal.result,
    };
    output = {
      ...body,
      manifest_digest_sha256: sha256(canonical(body)),
    };
    const schemaPath = join(repoRoot, policy.manifest_schema);
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(readJson(schemaPath));
    if (!validate(output)) {
      findings.push(
        finding('MANIFEST_SCHEMA_INVALID', 'candidate manifest failed schema validation', {
          errors: validate.errors,
        }),
      );
    }
  }
  const ok = findings.length === 0 && output !== null;
  if (ok && process.argv.includes('--write')) {
    writeState(repoRoot, round, 'candidate-manifest.json', output);
  }
  emit({ ok, command: 'manifest', manifest: output, findings });
}

function commandResult(id, argv, result) {
  const exitCode = result.status ?? 1;
  return {
    id,
    argv,
    exit_code: exitCode,
    outcome: exitCode === 0 ? 'pass' : 'fail',
    stdout_sha256: sha256(result.stdout ?? ''),
    stderr_sha256: sha256(result.stderr ?? ''),
  };
}

function converge() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'converge', findings });
  findings.push(...policyFindings(policy));
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactHead = git(repoRoot, ['rev-parse', head]);
  const declared = declaredBase(repoRoot, policy, exactHead, findings);
  if (base !== declared) {
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'convergence base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  }
  const passes = [];
  for (let passNumber = 1; passNumber <= 2; passNumber += 1) {
    const before = cleanStatus(repoRoot);
    if (before.length > 0) {
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} did not start clean`, {
          pass: passNumber,
        }),
      );
      break;
    }
    const results = [];
    for (const gate of policy.convergence.commands ?? []) {
      const [program, ...args] = gate.argv ?? [];
      const result = run(program, args, { cwd: repoRoot });
      results.push(commandResult(gate.id, gate.argv, result));
      if (result.status !== 0) {
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', `gate ${gate.id} failed`, {
            pass: passNumber,
            gate: gate.id,
            exit_code: result.status ?? 1,
          }),
        );
      }
    }
    const after = cleanStatus(repoRoot);
    if (after.length > 0) {
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} wrote repository paths`, {
          pass: passNumber,
        }),
      );
    }
    passes.push({
      pass: passNumber,
      results,
      clean_before: before.length === 0,
      clean_after: after.length === 0,
    });
    if (findings.length > 0) break;
  }
  const ok = findings.length === 0 && passes.length === 2;
  const state = { ok, base, head: exactHead, passes, findings };
  if (ok) writeState(repoRoot, round, 'convergence.json', state);
  emit({ ...state, command: 'converge' });
}

function changedCommits(root, base, head) {
  return git(root, ['rev-list', '--reverse', `${base}..${head}`])
    .split('\n')
    .filter(Boolean)
    .map((sha) => ({
      sha,
      author: git(root, ['show', '-s', '--format=%an', sha]),
      paths: git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
        .split('\n')
        .filter(Boolean),
    }));
}

function envelope() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'envelope', findings });
  const reviewedSha = option('--reviewed-sha') ?? '';
  const head = option('--head') ?? 'HEAD';
  const reviewRecord = option('--review-record') ?? '';
  const exactHead = SHA40.test(head) ? head : git(repoRoot, ['rev-parse', head]);
  if (reviewRecord !== policy.review.record) {
    findings.push(finding('REVIEW_RECORD_NOT_EXACT', 'review record differs from policy'));
  }
  const commits = changedCommits(repoRoot, reviewedSha, exactHead);
  let reviewCommits = 0;
  const projectionOutputs = new Map();
  const projections = new Map();
  for (const projection of policy.projections ?? []) {
    projections.set(projection.id, projection);
    for (const output of projection.outputs ?? []) projectionOutputs.set(output, projection.id);
  }
  const allowedProjectionIds = new Set(policy.review.allowed_projection_ids ?? []);
  const usedProjectionIds = new Set();
  for (const commit of commits) {
    for (const path of commit.paths) {
      if (path === reviewRecord) {
        reviewCommits += 1;
        if (commit.author !== policy.review.record_author || commit.paths.length !== 1) {
          findings.push(
            finding(
              'REVIEW_RECORD_ATTRIBUTION_INVALID',
              'review record must be one Auditor-only commit',
              {
                sha: commit.sha,
                path,
              },
            ),
          );
        }
        continue;
      }
      const projectionId = projectionOutputs.get(path);
      if (projectionId !== undefined && allowedProjectionIds.has(projectionId)) {
        usedProjectionIds.add(projectionId);
        if (commit.author !== 'DEVAI Architect') {
          findings.push(
            finding(
              'REVIEW_ENVELOPE_PROJECTION_ATTRIBUTION',
              'admitted projection output must be committed by the Architect',
              { sha: commit.sha, path, projection_id: projectionId },
            ),
          );
        }
        continue;
      }
      if (projectionId !== undefined) {
        findings.push(
          finding('REVIEW_ENVELOPE_PROJECTION_DRIFT', 'projection output is not policy-admitted', {
            sha: commit.sha,
            path,
          }),
        );
      }
      if ((policy.review.frozen_paths ?? []).some((glob) => matches(path, glob))) {
        findings.push(
          finding('REVIEW_FREEZE_VIOLATION', 'post-PASS frozen path changed', {
            sha: commit.sha,
            path,
          }),
        );
      } else if (path.startsWith('work/audit/')) {
        findings.push(
          finding('REVIEW_ENVELOPE_EXTRA_AUDIT', 'only the exact review record is allowed', {
            sha: commit.sha,
            path,
          }),
        );
      } else {
        findings.push(
          finding('REVIEW_ENVELOPE_SOURCE_MUTATION', 'path is outside the exact review envelope', {
            sha: commit.sha,
            path,
          }),
        );
      }
    }
  }
  for (const projectionId of usedProjectionIds) {
    const projection = projections.get(projectionId);
    let isolated;
    try {
      isolated = isolatedClone(repoRoot, exactHead);
      const [program, ...args] = projection.command ?? [];
      const result =
        typeof program === 'string' && program.length > 0
          ? run(program, args, { cwd: isolated.checkout })
          : { status: 1, stdout: '', stderr: 'projection command is empty' };
      if (result.status !== 0) {
        findings.push(
          finding(
            'REVIEW_ENVELOPE_PROJECTION_DRIFT',
            'admitted projection is not reproducible at the envelope head',
            {
              projection_id: projectionId,
              exit_code: result.status ?? 1,
              stdout: result.stdout,
              stderr: result.stderr,
            },
          ),
        );
      }
    } catch (error) {
      findings.push(
        finding(
          'REVIEW_ENVELOPE_PROJECTION_DRIFT',
          'admitted projection could not be verified in an isolated candidate clone',
          { projection_id: projectionId, error: String(error) },
        ),
      );
    } finally {
      if (isolated !== undefined) rmSync(isolated.temporary, { recursive: true, force: true });
    }
  }
  if (reviewCommits !== 1) {
    findings.push(
      finding(
        'REVIEW_RECORD_CARDINALITY',
        'review envelope requires exactly one review-record commit',
      ),
    );
  }
  emit({
    ok: findings.length === 0,
    command: 'envelope',
    reviewed_sha: reviewedSha,
    head: exactHead,
    findings,
  });
}

function lastPathCommit(root, revision, path) {
  const result = gitResult(root, ['log', '-1', '--format=%H', revision, '--', path]);
  return result.status === 0 ? result.stdout.trim() : '';
}

function commitTree(root, tree, parents, message, author) {
  return git(root, ['commit-tree', tree, ...parents.flatMap((parent) => ['-p', parent])], {
    input: `${message}\n`,
    env: {
      GIT_AUTHOR_NAME: author,
      GIT_AUTHOR_EMAIL: 'aarusso@nyxk.com.br',
      GIT_COMMITTER_NAME: author,
      GIT_COMMITTER_EMAIL: 'aarusso@nyxk.com.br',
      GIT_AUTHOR_DATE: '2000-01-01T00:00:00Z',
      GIT_COMMITTER_DATE: '2000-01-01T00:00:00Z',
    },
  });
}

function rehearse() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'rehearse', findings });
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const candidate = option('--candidate') ?? '';
  const declared = declaredBase(repoRoot, policy, candidate, findings);
  if (base !== declared) {
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'rehearsal base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  }
  let isolated;
  try {
    isolated = isolatedClone(repoRoot, candidate);
  } catch (error) {
    findings.push(finding('CANDIDATE_CLONE_FAILED', String(error)));
    return emit({ ok: false, command: 'rehearse', findings });
  }
  let result = null;
  try {
    const schemaPath = policy.rehearsal.schema_path;
    const verbPath = policy.rehearsal.verb_path;
    const schemaExists = gitResult(isolated.checkout, [
      'cat-file',
      '-e',
      `${candidate}:${schemaPath}`,
    ]);
    const verbExists = gitResult(isolated.checkout, ['cat-file', '-e', `${candidate}:${verbPath}`]);
    if (schemaExists.status !== 0) {
      findings.push(
        finding('CLOSURE_PREREQUISITE_MISSING', 'closure schema absent from candidate', {
          path: schemaPath,
        }),
      );
    }
    if (verbExists.status !== 0) {
      findings.push(
        finding('CLOSURE_PREREQUISITE_MISSING', 'closure verb absent from candidate', {
          path: verbPath,
        }),
      );
    }
    if (findings.length === 0) {
      const tree = git(isolated.checkout, ['rev-parse', `${candidate}^{tree}`]);
      const sourceMerge = commitTree(
        isolated.checkout,
        tree,
        [base, candidate],
        `${round} non-standing source merge rehearsal`,
        'DEVAI Architect',
      );
      const indexPath = join(isolated.temporary, 'closure.index');
      git(isolated.checkout, ['read-tree', sourceMerge], { env: { GIT_INDEX_FILE: indexPath } });
      const blob = git(isolated.checkout, ['hash-object', '-w', '--stdin'], {
        input: '{"rehearsal":true}\n',
      });
      git(
        isolated.checkout,
        ['update-index', '--add', '--cacheinfo', '100644', blob, policy.rehearsal.closure_path],
        { env: { GIT_INDEX_FILE: indexPath } },
      );
      const closureTree = git(isolated.checkout, ['write-tree'], {
        env: { GIT_INDEX_FILE: indexPath },
      });
      const closureHead = commitTree(
        isolated.checkout,
        closureTree,
        [sourceMerge],
        `${round} non-standing closure-only rehearsal`,
        'DEVAI Machine',
      );
      const closurePaths = git(isolated.checkout, [
        'diff-tree',
        '--no-commit-id',
        '--name-only',
        '-r',
        closureHead,
      ])
        .split('\n')
        .filter(Boolean);
      if (JSON.stringify(closurePaths) !== JSON.stringify([policy.rehearsal.closure_path])) {
        findings.push(
          finding('CLOSURE_REHEARSAL_NOT_PC_ONLY', 'rehearsal closure range is not one PC path'),
        );
      }
      result = {
        source_merge: sourceMerge,
        closure_head: closureHead,
        schema_ancestor: lastPathCommit(isolated.checkout, candidate, schemaPath),
        verb_ancestor: lastPathCommit(isolated.checkout, candidate, verbPath),
        ok: findings.length === 0,
      };
    }
  } finally {
    rmSync(isolated.temporary, { recursive: true, force: true });
  }
  const ok = findings.length === 0 && result?.ok === true;
  if (ok) writeState(repoRoot, round, 'closure-rehearsal.json', { ok, base, candidate, result });
  emit({ ok, command: 'rehearse', result, findings });
}

switch (command) {
  case 'policy-check':
    policyCheck();
    break;
  case 'materialize':
    materialize();
    break;
  case 'manifest':
    manifest();
    break;
  case 'converge':
    converge();
    break;
  case 'envelope':
    envelope();
    break;
  case 'rehearse':
    rehearse();
    break;
  default:
    emit({
      ok: false,
      command: command || 'missing',
      findings: [
        finding(
          'COMMAND_INVALID',
          'expected policy-check, materialize, manifest, converge, envelope, or rehearse',
        ),
      ],
    });
}
