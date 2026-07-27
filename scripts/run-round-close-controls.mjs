#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHA40 = /^[0-9a-f]{40}$/u;
const NORMALIZED_RUNTIME_ARTIFACTS = [
  'scratch/coverage/t1-t3/coverage-final.json',
  'scratch/coverage/t1-t3/subprocess-v8/**',
];

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
  if (revision === 'WORKTREE') {
    return git(root, ['ls-files']).split('\n').filter(Boolean).sort();
  }
  return git(root, ['ls-tree', '-r', '--name-only', revision]).split('\n').filter(Boolean).sort();
}

function candidateFile(root, revision, path) {
  if (revision === 'WORKTREE') return readFileSync(join(root, path), 'utf8');
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

function workspaceSnapshot(root, normalizedRuntimeArtifacts) {
  const entries = [];
  const excluded = new Set(['.git', 'node_modules']);
  function visit(directory, prefix = '') {
    for (const name of readdirSync(directory).sort()) {
      const path = prefix.length === 0 ? name : `${prefix}/${name}`;
      if (excluded.has(name) || path === '.devai/state' || path.startsWith('.devai/state/'))
        continue;
      if (normalizedRuntimeArtifacts.some((glob) => matches(path, glob))) continue;
      const absolute = join(directory, name);
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, path);
      else if (stat.isSymbolicLink())
        entries.push({ path, kind: 'symlink', value: readlinkSync(absolute) });
      else if (stat.isFile())
        entries.push({ path, kind: 'file', digest: sha256(readFileSync(absolute)) });
    }
  }
  visit(root);
  return sha256(canonical(entries));
}

function coverageDigest(root) {
  const path = join(root, 'scratch/coverage/t1-t3/coverage-summary.json');
  return existsSync(path) ? sha256(readFileSync(path)) : null;
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

function semanticCodeShape(source) {
  let output = '';
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      output += '\n';
      continue;
    }
    if (character === '/' && next === '*') {
      index += 2;
      while (index < source.length - 1 && !(source[index] === '*' && source[index + 1] === '/')) {
        if (source[index] === '\n') output += '\n';
        index += 1;
      }
      index += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      output += '__STRING__';
      for (index += 1; index < source.length; index += 1) {
        if (source[index] === '\\') index += 1;
        else if (source[index] === quote) break;
        else if (source[index] === '\n') output += '\n';
      }
      continue;
    }
    output += character;
  }
  return output;
}

function containsJsonKey(value, key) {
  if (Array.isArray(value)) return value.some((entry) => containsJsonKey(entry, key));
  if (value !== null && typeof value === 'object') {
    return (
      Object.hasOwn(value, key) || Object.values(value).some((entry) => containsJsonKey(entry, key))
    );
  }
  return false;
}

function semanticContentFindings(root, revision, paths) {
  const findings = [];
  for (const path of paths) {
    const source = candidateFile(root, revision, path);
    if (path.endsWith('.json')) {
      try {
        if (containsJsonKey(JSON.parse(source), 'fixed_count')) {
          findings.push(
            finding('SEMANTIC_FIXED_COUNT', 'fixed governed count in population', { path }),
          );
        }
      } catch {
        // Syntax validity is enforced by the owning schema or compiler gate.
      }
      continue;
    }
    const shape = semanticCodeShape(source);
    if (
      /\b(?:ACTION_(?:FLOOR|CEILING)|(?:FIXED|GOVERNED)_[A-Z0-9_]*COUNT)\s*=\s*\d+/u.test(shape)
    ) {
      findings.push(
        finding('SEMANTIC_FIXED_COUNT', 'fixed governed count in population', { path }),
      );
    }
    if (/\bexpect\(\s*([A-Za-z_$][\w$]*)\s*\)\.(?:toBe|toEqual)\(\s*\1\s*\)/u.test(shape)) {
      findings.push(
        finding('SEMANTIC_SELF_COMPARISON', 'literal self-comparison in population', { path }),
      );
    }
    if (/\breadFileSync\(\s*__STRING__\s*\)\s*\)?\s*\.toContain\(/u.test(shape)) {
      findings.push(
        finding('SEMANTIC_NAMED_FILE_ONLY', 'direct named-file-only assertion in population', {
          path,
        }),
      );
    }
  }
  return findings;
}

function policyFindings(policy, root = repoRoot, revision = 'HEAD', options = {}) {
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
  for (const source of populations) {
    if (
      typeof source === 'string' &&
      source.includes('*') &&
      pathsForGlobs(root, revision, [source]).length === 0
    ) {
      findings.push(
        finding('SEMANTIC_POPULATION_EMPTY', `semantic population ${source} is empty`, {
          path: source,
        }),
      );
    }
  }
  const populationPaths = [...new Set(pathsForGlobs(root, revision, populations))];
  findings.push(...semanticContentFindings(root, revision, populationPaths));
  if (options.skipMirrorPairs !== true) {
    for (const pair of assertions.mirror_pairs ?? []) {
      const source = typeof pair?.source === 'string' ? join(root, pair.source) : '';
      const mirror = typeof pair?.mirror === 'string' ? join(root, pair.mirror) : '';
      if (
        source.length === 0 ||
        mirror.length === 0 ||
        !existsSync(source) ||
        !existsSync(mirror) ||
        !readFileSync(source).equals(readFileSync(mirror))
      ) {
        findings.push(
          finding('POLICY_MIRROR_DRIFT', 'governed source and mirror must be byte-identical', {
            source: pair?.source,
            mirror: pair?.mirror,
          }),
        );
      }
    }
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
  if (
    JSON.stringify(policy?.convergence?.normalized_runtime_artifacts) !==
    JSON.stringify(NORMALIZED_RUNTIME_ARTIFACTS)
  ) {
    findings.push(
      finding(
        'POLICY_CONVERGENCE_RUNTIME_ARTIFACTS_INVALID',
        'only the exact retained coverage runtime artifacts may be normalized',
      ),
    );
  }
  return findings;
}

function policyCheck() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy !== null) findings.push(...policyFindings(policy, repoRoot, 'WORKTREE'));
  emit({ ok: findings.length === 0, command: 'policy-check', findings });
}

function materialize() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy !== null)
    findings.push(...policyFindings(policy, repoRoot, 'WORKTREE', { skipMirrorPairs: true }));
  if (findings.length === 0) {
    mkdirSync(dirname(mirrorPath), { recursive: true });
    writeFileSync(mirrorPath, readFileSync(policyPath));
    findings.push(...policyFindings(policy, repoRoot, 'WORKTREE'));
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
  const commitSet = new Set(commits);
  const exceptions = new Map();
  const exceptionEntries = Array.isArray(policy.role_path_exceptions)
    ? policy.role_path_exceptions
    : [];
  const decisions = readFileSync(join(root, 'law/register/DECISIONS.md'), 'utf8');

  for (const entry of exceptionEntries) {
    const structurallyValid =
      entry !== null &&
      typeof entry === 'object' &&
      SHA40.test(entry.commit ?? '') &&
      typeof entry.role === 'string' &&
      Array.isArray(entry.paths) &&
      entry.paths.length > 0 &&
      new Set(entry.paths).size === entry.paths.length &&
      entry.paths.every(
        (path) => typeof path === 'string' && path.length > 0 && !/[?*[\]{}]/u.test(path),
      ) &&
      typeof entry.decision_id === 'string' &&
      entry.decision_id.length > 0 &&
      typeof entry.reason === 'string' &&
      entry.reason.trim().length > 0;
    if (!structurallyValid || exceptions.has(entry?.commit)) {
      findings.push(
        finding('ROLE_PATH_EXCEPTION_INVALID', 'role-path exception is malformed or duplicated', {
          commit: entry?.commit ?? null,
        }),
      );
      continue;
    }
    exceptions.set(entry.commit, entry);
    if (!commitSet.has(entry.commit)) {
      findings.push(
        finding('ROLE_PATH_EXCEPTION_UNUSED', 'role-path exception commit is outside the range', {
          commit: entry.commit,
        }),
      );
    }
  }

  return commits.map((sha) => {
    const author = git(root, ['show', '-s', '--format=%an', sha]);
    const role = authorRole(author);
    const paths = git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
      .split('\n')
      .filter(Boolean)
      .sort();
    const allowed = role === null ? [] : (policy.role_paths?.[role] ?? []);
    const unauthorizedPaths = paths.filter((path) => !allowed.some((glob) => matches(path, glob)));
    const exception = exceptions.get(sha);
    let exceptionAuthorized = false;
    if (exception !== undefined) {
      const declaredPaths = [...exception.paths].sort();
      const pathSetMatches =
        declaredPaths.length === unauthorizedPaths.length &&
        declaredPaths.every((path, index) => path === unauthorizedPaths[index]);
      const roleMatches = role !== null && exception.role === role;
      const decisionResolves = decisions.includes(`### ${exception.decision_id} `);
      if (!roleMatches) {
        findings.push(
          finding('ROLE_PATH_EXCEPTION_ROLE_MISMATCH', 'role-path exception role is not actual', {
            sha,
            actual_role: role,
            declared_role: exception.role,
          }),
        );
      }
      if (!pathSetMatches) {
        findings.push(
          finding(
            'ROLE_PATH_EXCEPTION_PATH_MISMATCH',
            'role-path exception paths do not equal the exact unauthorized path set',
            { sha, declared_paths: declaredPaths, unauthorized_paths: unauthorizedPaths },
          ),
        );
      }
      if (!decisionResolves) {
        findings.push(
          finding(
            'ROLE_PATH_EXCEPTION_DECISION_UNRESOLVED',
            'role-path exception decision does not resolve',
            { sha, decision_id: exception.decision_id },
          ),
        );
      }
      exceptionAuthorized = roleMatches && pathSetMatches && decisionResolves;
    }
    const pathAuthorized =
      role !== null && paths.length > 0 && (unauthorizedPaths.length === 0 || exceptionAuthorized);
    if (!pathAuthorized) {
      findings.push(
        finding('ROLE_PATH_VIOLATION', `${sha} is not role-pure`, { sha, author, role, paths }),
      );
    }
    return {
      commit: sha,
      author,
      role: role ?? 'Unknown',
      paths,
      path_authorized: pathAuthorized,
      role_path_exception: exceptionAuthorized
        ? { decision_id: exception.decision_id, paths: [...exception.paths].sort() }
        : null,
    };
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

function validCommandResult(actual, expected) {
  return (
    actual?.id === expected?.id &&
    JSON.stringify(actual?.argv) === JSON.stringify(expected?.argv) &&
    actual?.exit_code === 0 &&
    actual?.outcome === 'pass' &&
    /^[0-9a-f]{64}$/u.test(actual?.stdout_sha256 ?? '') &&
    /^[0-9a-f]{64}$/u.test(actual?.stderr_sha256 ?? '')
  );
}

function semanticResults(results) {
  return (results ?? []).map(({ id, argv, exit_code, outcome }) => ({
    id,
    argv,
    exit_code,
    outcome,
  }));
}

function validateConvergenceState(state, policy, base, head, root) {
  if (
    state?.ok !== true ||
    state?.base !== base ||
    state?.head !== head ||
    !Array.isArray(state?.passes) ||
    state.passes.length !== 2 ||
    !Array.isArray(state?.findings) ||
    state.findings.length !== 0 ||
    state?.result_equivalent !== true
  )
    return false;
  const expected = policy.convergence.commands ?? [];
  const coverageSha = coverageDigest(root);
  if (coverageSha === null) return false;
  for (const [index, pass] of state.passes.entries()) {
    if (
      pass?.pass !== index + 1 ||
      pass?.clean_before !== true ||
      pass?.clean_after !== true ||
      pass?.head_before !== head ||
      pass?.head_after !== head ||
      pass?.coverage_sha256 !== coverageSha ||
      typeof pass?.workspace_sha256 !== 'string' ||
      !Array.isArray(pass?.results) ||
      pass.results.length !== expected.length ||
      !pass.results.every((result, resultIndex) =>
        validCommandResult(result, expected[resultIndex]),
      )
    )
      return false;
  }
  return (
    state.passes[0].workspace_sha256 === state.passes[1].workspace_sha256 &&
    canonical(semanticResults(state.passes[0].results)) ===
      canonical(semanticResults(state.passes[1].results))
  );
}

function validRehearsalResult(result) {
  return (
    SHA40.test(result?.source_merge ?? '') &&
    SHA40.test(result?.closure_head ?? '') &&
    SHA40.test(result?.schema_ancestor ?? '') &&
    SHA40.test(result?.verb_ancestor ?? '') &&
    result?.production_verb_exercised === true &&
    result?.record_schema_valid === true &&
    result?.exact_range_valid === true &&
    result?.ok === true
  );
}

function manifest() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'manifest', findings });
  const round = option('--round') ?? '';
  const implementationSubject = option('--implementation-subject') ?? '';
  const reviewCandidate = option('--review-candidate') ?? '';
  const publishedHead = option('--published-head') ?? '';
  findings.push(...policyFindings(policy, repoRoot, publishedHead || 'HEAD'));
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
  if (
    convergenceState.status === 'valid' &&
    !validateConvergenceState(convergenceState.value, policy, base, publishedHead, repoRoot)
  )
    findings.push(
      finding(
        'CONVERGENCE_STATE_INVALID',
        'convergence state does not prove two exact equivalent clean passes',
      ),
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
  if (rehearsalState.status === 'valid' && !validRehearsalResult(rehearsalState.value?.result)) {
    findings.push(
      finding('CLOSURE_REHEARSAL_INVALID', 'closure rehearsal state is not production evidence'),
    );
  } else if (
    rehearsalState.status === 'valid' &&
    rehearsalState.value?.base === base &&
    rehearsalState.value?.candidate === publishedHead
  ) {
    const replayFindings = [];
    const replay = performRehearsal(policy, round, base, publishedHead, replayFindings);
    if (
      replayFindings.length > 0 ||
      replay === null ||
      canonical(replay) !== canonical(rehearsalState.value.result)
    ) {
      findings.push(
        finding(
          'CLOSURE_REHEARSAL_INVALID',
          'closure rehearsal cannot be reproduced from the exact candidate',
          { replay_findings: replayFindings },
        ),
      );
    }
  }
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
    const testIds = new Set(['ordinary', 'stage2', 't4', 't5', 't6', 'coverage']);
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
  const checkedOutHead = git(repoRoot, ['rev-parse', 'HEAD']);
  if (checkedOutHead !== exactHead) {
    findings.push(
      finding('CONVERGENCE_HEAD_MISMATCH', 'checkout does not equal the convergence head', {
        expected: exactHead,
        actual: checkedOutHead,
      }),
    );
  }
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
    const headBefore = git(repoRoot, ['rev-parse', 'HEAD']);
    if (headBefore !== exactHead) {
      findings.push(
        finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} head drifted`, {
          pass: passNumber,
          expected: exactHead,
          actual: headBefore,
        }),
      );
      break;
    }
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
      if (git(repoRoot, ['rev-parse', 'HEAD']) !== exactHead) {
        findings.push(
          finding('CONVERGENCE_HEAD_MISMATCH', `head drifted before gate ${gate.id}`, {
            pass: passNumber,
            gate: gate.id,
          }),
        );
        break;
      }
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
      if (git(repoRoot, ['rev-parse', 'HEAD']) !== exactHead) {
        findings.push(
          finding('CONVERGENCE_HEAD_MISMATCH', `gate ${gate.id} changed HEAD`, {
            pass: passNumber,
            gate: gate.id,
          }),
        );
        break;
      }
    }
    const after = cleanStatus(repoRoot);
    const headAfter = git(repoRoot, ['rev-parse', 'HEAD']);
    if (after.length > 0) {
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} wrote repository paths`, {
          pass: passNumber,
        }),
      );
    }
    if (headAfter !== exactHead) {
      findings.push(
        finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} ended at another head`, {
          pass: passNumber,
          expected: exactHead,
          actual: headAfter,
        }),
      );
    }
    passes.push({
      pass: passNumber,
      results,
      clean_before: before.length === 0,
      clean_after: after.length === 0,
      head_before: headBefore,
      head_after: headAfter,
      coverage_sha256: coverageDigest(repoRoot),
      workspace_sha256: workspaceSnapshot(
        repoRoot,
        policy.convergence.normalized_runtime_artifacts,
      ),
    });
    if (findings.length > 0) break;
  }
  const resultEquivalent =
    passes.length === 2 &&
    canonical(semanticResults(passes[0].results)) === canonical(semanticResults(passes[1].results));
  if (passes.length === 2 && passes[0].workspace_sha256 !== passes[1].workspace_sha256) {
    findings.push(
      finding(
        'CONVERGENCE_WRITE_DETECTED',
        'the second pass changed relevant tracked, untracked, ignored, or generated content',
      ),
    );
  }
  if (passes.length === 2 && passes[0].coverage_sha256 !== passes[1].coverage_sha256) {
    findings.push(
      finding('CONVERGENCE_COVERAGE_DRIFT', 'coverage bytes differ across convergence passes'),
    );
  }
  if (passes.length === 2 && !resultEquivalent) {
    findings.push(
      finding('CONVERGENCE_RESULT_DRIFT', 'ordered command outcomes differ across passes'),
    );
  }
  const ok = findings.length === 0 && passes.length === 2;
  const state = {
    ok,
    base,
    head: exactHead,
    passes,
    result_equivalent: resultEquivalent,
    findings,
  };
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

function parseReviewRecord(source) {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(source);
  if (match === null) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator <= 0) return null;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

function reviewManifest(policy, findings) {
  const relativePath =
    policy?.review?.manifest_state ??
    '.devai/state/round-runs/R-0006/close/candidate-manifest.json';
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) {
    findings.push(finding('REVIEW_RECORD_INVALID', 'candidate manifest state is missing'));
    return null;
  }
  try {
    const manifestValue = readJson(path);
    const { manifest_digest_sha256: claimed, ...body } = manifestValue;
    const recomputed = sha256(canonical(body));
    if (!SHA40.test(manifestValue.review_candidate ?? '') || claimed !== recomputed) {
      findings.push(
        finding('REVIEW_RECORD_INVALID', 'candidate manifest identity or digest is invalid'),
      );
      return null;
    }
    return { value: manifestValue, digest: recomputed };
  } catch (error) {
    findings.push(finding('REVIEW_RECORD_INVALID', `candidate manifest is malformed: ${error}`));
    return null;
  }
}

function envelope() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'envelope', findings });
  const head = option('--head') ?? 'HEAD';
  const reviewRecord = option('--review-record') ?? '';
  const exactHead = SHA40.test(head) ? head : git(repoRoot, ['rev-parse', head]);
  if (process.argv.includes('--reviewed-sha')) {
    findings.push(
      finding(
        'REVIEWED_SHA_CALLER_FORBIDDEN',
        'the reviewed identity must be derived from the candidate manifest and review record',
      ),
    );
  }
  if (reviewRecord !== policy.review.record) {
    findings.push(finding('REVIEW_RECORD_NOT_EXACT', 'review record differs from policy'));
  }
  const manifestState = reviewManifest(policy, findings);
  const reviewedSha = manifestState?.value?.review_candidate ?? option('--reviewed-sha') ?? '';
  let reviewFields = null;
  try {
    reviewFields = parseReviewRecord(candidateFile(repoRoot, exactHead, reviewRecord));
  } catch (error) {
    findings.push(finding('REVIEW_RECORD_INVALID', `review record is unavailable: ${error}`));
  }
  const requiredVerdict = policy.review.required_verdict ?? 'PASS';
  const requiredModel = policy.review.required_model ?? 'claude-opus-5';
  if (
    reviewFields === null ||
    reviewFields.verdict !== requiredVerdict ||
    reviewFields.reviewer_model !== requiredModel ||
    reviewFields.review_candidate !== reviewedSha ||
    reviewFields.manifest_digest_sha256 !== manifestState?.digest
  ) {
    findings.push(
      finding(
        'REVIEW_RECORD_INVALID',
        'review record must bind exact PASS, model, candidate, and manifest digest',
      ),
    );
  }
  const commits =
    SHA40.test(reviewedSha) && SHA40.test(exactHead)
      ? changedCommits(repoRoot, reviewedSha, exactHead)
      : [];
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

function schemaAccepts(root, schemaPath, value) {
  try {
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const commonPath = join(root, 'law/schemas/common-defs.schema.json');
    if (existsSync(commonPath)) ajv.addSchema(readJson(commonPath));
    return ajv.compile(readJson(join(root, schemaPath)))(value) === true;
  } catch {
    return false;
  }
}

function performRehearsal(policy, round, base, candidate, findings) {
  let isolated;
  try {
    isolated = isolatedClone(repoRoot, candidate);
  } catch (error) {
    findings.push(finding('CANDIDATE_CLONE_FAILED', String(error)));
    return null;
  }
  try {
    const schemaPath = policy.rehearsal.schema_path;
    const verbPath = policy.rehearsal.verb_path;
    for (const [path, label] of [
      [schemaPath, 'closure schema'],
      [verbPath, 'closure verb'],
    ]) {
      if (gitResult(isolated.checkout, ['cat-file', '-e', `${candidate}:${path}`]).status !== 0) {
        findings.push(
          finding('CLOSURE_PREREQUISITE_MISSING', `${label} absent from candidate`, { path }),
        );
      }
    }
    if (findings.length > 0) return null;

    for (const argv of policy.rehearsal.prepare ?? []) {
      const [program, ...args] = argv;
      const prepared = run(program, args, { cwd: isolated.checkout });
      if (prepared.status !== 0) {
        findings.push(
          finding(
            'CLOSURE_REHEARSAL_PREPARE_FAILED',
            `rehearsal prepare failed: ${argv.join(' ')}`,
            {
              exit_code: prepared.status ?? 1,
              stdout: prepared.stdout,
              stderr: prepared.stderr,
            },
          ),
        );
        return null;
      }
    }

    const tree = git(isolated.checkout, ['rev-parse', `${candidate}^{tree}`]);
    const sourceMerge = commitTree(
      isolated.checkout,
      tree,
      [base, candidate],
      `${round} non-standing source merge rehearsal`,
      'DEVAI Architect',
    );
    const draft = {
      round_id: `${round}-rehearsal`,
      title: 'Non-standing entry-control closure rehearsal',
      declaring_decision: 'DII-207',
      closing_decision: 'DII-210',
      batches: [
        {
          id: 'entry-control-rehearsal',
          roles: ['Architect'],
          commit: candidate,
          headline: 'Non-standing exact candidate input',
        },
      ],
      gates: { rehearsal: { status: 'pass', detail: 'isolated candidate-only execution' } },
      source_repo_deleted: false,
      validation_criteria: [
        {
          criterion: 'production closure verb and exact Machine-only range',
          verdict: 'pass',
          evidence: 'non-standing isolated rehearsal',
        },
      ],
      closed_at: '2000-01-01T00:00:00.000Z',
      merged_as: sourceMerge,
      release_disposition: 'none-preratification',
    };
    const [program, ...args] = policy.rehearsal.command ?? [];
    const closure =
      typeof program === 'string' && program.length > 0
        ? run(
            program,
            [
              ...args,
              '--repo-root',
              isolated.checkout,
              '--stdin',
              '--as-role',
              'auditor',
              '--write',
            ],
            { cwd: isolated.checkout, input: `${JSON.stringify(draft)}\n` },
          )
        : { status: 1, stdout: '', stderr: 'rehearsal command is empty' };
    if (closure.status !== 0) {
      findings.push(
        finding('CLOSURE_REHEARSAL_VERB_FAILED', 'production phase-close command failed', {
          exit_code: closure.status ?? 1,
          stdout: closure.stdout,
          stderr: closure.stderr,
        }),
      );
      return null;
    }
    let emitted;
    try {
      emitted = JSON.parse(closure.stdout);
    } catch (error) {
      findings.push(finding('CLOSURE_REHEARSAL_VERB_FAILED', `invalid verb output: ${error}`));
      return null;
    }
    const absoluteRecordPath = resolve(isolated.checkout, emitted.path ?? '');
    const recordPath = relative(isolated.checkout, absoluteRecordPath);
    if (
      emitted?.ok !== true ||
      !matches(
        recordPath,
        policy.rehearsal.closure_path_glob ?? policy.rehearsal.closure_path ?? '',
      ) ||
      recordPath.startsWith('..') ||
      !existsSync(absoluteRecordPath) ||
      canonical(readJson(absoluteRecordPath)) !== canonical(emitted.record)
    ) {
      findings.push(
        finding('CLOSURE_REHEARSAL_VERB_FAILED', 'verb did not emit one canonical closure record'),
      );
      return null;
    }
    const recordSchemaValid = schemaAccepts(isolated.checkout, schemaPath, emitted.record);
    if (!recordSchemaValid) {
      findings.push(
        finding('CLOSURE_REHEARSAL_SCHEMA_INVALID', 'production record failed closure schema'),
      );
      return null;
    }

    const indexPath = join(isolated.temporary, 'closure.index');
    git(isolated.checkout, ['read-tree', sourceMerge], { env: { GIT_INDEX_FILE: indexPath } });
    const blob = git(isolated.checkout, ['hash-object', '-w', '--stdin'], {
      input: readFileSync(absoluteRecordPath),
    });
    git(isolated.checkout, ['update-index', '--add', '--cacheinfo', '100644', blob, recordPath], {
      env: { GIT_INDEX_FILE: indexPath },
    });
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
    const exactPath =
      closurePaths.length === 1 &&
      closurePaths[0] === recordPath &&
      matches(
        recordPath,
        policy.rehearsal.closure_path_glob ?? policy.rehearsal.closure_path ?? '',
      );
    let exactRangeValid =
      exactPath &&
      git(isolated.checkout, ['show', '-s', '--format=%an', closureHead]) === 'DEVAI Machine';
    const rangeCommand = policy.rehearsal.range_check ?? [];
    if (exactRangeValid && rangeCommand.length > 0) {
      const [rangeProgram, ...rangeArgs] = rangeCommand;
      const checked = run(
        rangeProgram,
        [
          ...rangeArgs,
          '--repo-root',
          isolated.checkout,
          '--base',
          sourceMerge,
          '--head',
          closureHead,
          '--json',
        ],
        { cwd: isolated.checkout },
      );
      let checkedOutput = null;
      try {
        checkedOutput = JSON.parse(checked.stdout);
      } catch {
        // The failed exact-range result is reported below.
      }
      exactRangeValid =
        checked.status === 0 &&
        checkedOutput?.ok === true &&
        checkedOutput?.commits_checked === 1 &&
        checkedOutput?.base === sourceMerge &&
        checkedOutput?.head === closureHead;
      if (!exactRangeValid) {
        findings.push(
          finding('CLOSURE_REHEARSAL_RANGE_INVALID', 'production sequencing rejected exact range', {
            exit_code: checked.status ?? 1,
            stdout: checked.stdout,
            stderr: checked.stderr,
          }),
        );
      }
    }
    if (!exactRangeValid) {
      findings.push(
        finding('CLOSURE_REHEARSAL_NOT_PC_ONLY', 'rehearsal range is not one Machine PC path'),
      );
    }
    const result = {
      source_merge: sourceMerge,
      closure_head: closureHead,
      schema_ancestor: lastPathCommit(isolated.checkout, candidate, schemaPath),
      verb_ancestor: lastPathCommit(isolated.checkout, candidate, verbPath),
      production_verb_exercised: true,
      record_schema_valid: recordSchemaValid,
      exact_range_valid: exactRangeValid,
      ok: findings.length === 0,
    };
    return result;
  } finally {
    rmSync(isolated.temporary, { recursive: true, force: true });
  }
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
  const result = performRehearsal(policy, round, base, candidate, findings);
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
