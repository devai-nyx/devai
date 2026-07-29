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
const FINAL_REVIEW_RECORD = 'work/audit/R-0006/independent-codex-b9-review-final.md';
const AUDIT_CLAIM_IMPLEMENTATION_PATHS = [
  'scripts/run-round-close-controls.mjs',
  '.devai/config/round-close-controls.json',
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

function configuredStatePath(template, round) {
  return String(template ?? '').replaceAll('{round}', round);
}

function nulPaths(result) {
  return String(result.stdout ?? '')
    .split('\0')
    .filter(Boolean);
}

function worktreeInputEntries(root, globs) {
  const paths = new Set([
    ...nulPaths(gitResult(root, ['ls-files', '-z'])),
    ...nulPaths(gitResult(root, ['ls-files', '--others', '--exclude-standard', '-z'])),
  ]);
  const entries = [];
  for (const path of [...paths].sort()) {
    if (!(globs ?? []).some((glob) => matches(path, glob))) continue;
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      entries.push({ path, kind: 'deleted', digest: sha256('DELETED\n') });
      continue;
    }
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink())
      entries.push({ path, kind: 'symlink', digest: sha256(readlinkSync(absolute)) });
    else if (stat.isFile())
      entries.push({ path, kind: 'file', digest: sha256(readFileSync(absolute)) });
  }
  return entries;
}

function filesystemPaths(root, includeState = false) {
  const paths = [];
  function visit(directory, prefix = '') {
    for (const name of readdirSync(directory).sort()) {
      const path = prefix.length === 0 ? name : `${prefix}/${name}`;
      if (name === '.git' || name === 'node_modules') continue;
      if (!includeState && (path === '.devai/state' || path.startsWith('.devai/state/'))) continue;
      const absolute = join(directory, name);
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, path);
      else if (stat.isFile() || stat.isSymbolicLink()) paths.push(path);
    }
  }
  visit(root);
  return paths;
}

function outputEntries(root, specs) {
  const paths = filesystemPaths(root);
  const outputs = [];
  const missing = [];
  for (const spec of specs ?? []) {
    const matchesForSpec = paths.filter((path) => matches(path, spec));
    if (matchesForSpec.length === 0) missing.push(spec);
    for (const path of matchesForSpec) {
      if (outputs.some((entry) => entry.path === path)) continue;
      const absolute = join(root, path);
      const stat = lstatSync(absolute);
      outputs.push({
        path,
        digest: sha256(stat.isSymbolicLink() ? readlinkSync(absolute) : readFileSync(absolute)),
      });
    }
  }
  return { outputs: outputs.sort((left, right) => left.path.localeCompare(right.path)), missing };
}

function toolchainFingerprint(policy, findings) {
  const readings = [];
  for (const tool of policy?.freshness?.toolchain ?? []) {
    const [program, ...args] = tool.argv ?? [];
    const result = run(program, args, { cwd: repoRoot });
    readings.push({
      id: tool.id,
      argv: tool.argv,
      exit_code: result.status ?? 1,
      stdout_sha256: sha256(result.stdout ?? ''),
      stderr_sha256: sha256(result.stderr ?? ''),
    });
    if (result.status !== 0)
      findings.push(
        finding('FRESHNESS_TOOLCHAIN_BLOCKED', `toolchain probe ${tool.id} failed`, {
          tool: tool.id,
          exit_code: result.status ?? 1,
        }),
      );
  }
  return sha256(canonical(readings));
}

function environmentFingerprint(policy) {
  const readings = (policy?.freshness?.environment_allowlist ?? []).map((entry) => {
    const value = process.env[entry.name];
    return {
      name: entry.name,
      mode: entry.mode,
      value:
        entry.mode === 'presence'
          ? value === undefined
            ? 'absent'
            : 'present'
          : sha256(value ?? 'UNSET'),
    };
  });
  return sha256(canonical(readings));
}

function freshnessCachePath(policy, round, taskId) {
  const root = configuredStatePath(policy?.freshness?.state_root, round);
  const safe = taskId.replaceAll(/[^a-zA-Z0-9._-]/gu, '_');
  return join(repoRoot, root, 'tasks', `${safe}.json`);
}

function freshnessRecordDigest(record) {
  const { result_digest: _ignored, ...body } = record;
  return sha256(canonical(body));
}

function readFreshnessCache(path, schemaPath) {
  if (!existsSync(path)) return null;
  try {
    const value = readJson(path);
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(readJson(schemaPath));
    if (!validate(value) || value.result_digest !== freshnessRecordDigest(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function writeFreshnessCache(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canonical(value));
}

function taskInputGlobs(policy, task) {
  const sets = policy?.freshness?.input_sets ?? {};
  return [
    ...new Set(
      (task.input_sets ?? []).flatMap((set) => (Array.isArray(sets[set]) ? sets[set] : [])),
    ),
  ].sort();
}

function remoteEnvironment(policy) {
  return (policy?.freshness?.remote_environment_indicators ?? []).some((name) => {
    const value = String(process.env[name] ?? '').toLowerCase();
    return value !== '' && value !== '0' && value !== 'false';
  });
}

function blockedResults(policy) {
  return (policy?.convergence?.commands ?? []).map((gate) => ({
    id: gate.id,
    task_id: gate.id,
    argv: gate.argv,
    exit_code: null,
    outcome: 'BLOCKED',
    stdout_sha256: sha256(''),
    stderr_sha256: sha256(''),
  }));
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

function priorReviewPaths(reviewPolicy, root, revision) {
  return [
    ...new Set([
      ...(reviewPolicy?.prior_reviews ?? []),
      ...pathsForGlobs(root, revision, reviewPolicy?.prior_review_globs ?? []),
    ]),
  ].sort();
}

function markedJson(source, markers) {
  const start = source.indexOf(markers?.start ?? '');
  const end = source.indexOf(markers?.end ?? '');
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(source.slice(start + markers.start.length, end).trim());
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function expectedAuditCurrentClaims(policy, root, revision) {
  const trace = JSON.parse(candidateFile(root, revision, 'law/trace.json'));
  const sequencing = JSON.parse(
    candidateFile(root, revision, 'law/policy/governed-sequencing.json'),
  );
  const operational = JSON.parse(
    candidateFile(root, revision, 'law/policy/operational-values.json'),
  );
  const roundExceptions = (sequencing.historical_commit_exceptions ?? []).filter(
    (entry) => entry?.round === 'R-0006',
  );
  const directEntries = (operational.entries ?? []).filter((entry) => entry?.mode === 'direct');
  const failureRecords = priorReviewPaths(policy.review_scope, root, revision).filter(
    (path) =>
      path.includes('failure') ||
      /^verdict:\s*FAIL\s*$/mu.test(candidateFile(root, revision, path)),
  );
  return {
    trace_invariants: (trace.invariants ?? []).length,
    trace_test_sources: (trace.test_corpus ?? []).length,
    trace_assertion_sites: (trace.test_corpus ?? []).reduce(
      (total, entry) => total + Number(entry?.assertion_count ?? 0),
      0,
    ),
    r0006_sequencing_exception_entries: roundExceptions.length,
    r0006_sequencing_exception_commits: roundExceptions.reduce(
      (total, entry) => total + (entry.implementation_commits ?? []).length,
      0,
    ),
    operational_direct_rows: directEntries.length,
    operational_distinct_direct_value_homes: new Set(
      directEntries.map((entry) => entry.canonical_home),
    ).size,
    operational_total_value_homes: Object.keys(operational.values ?? {}).length,
    prior_b9_failure_records: failureRecords.length,
  };
}

function auditCurrentClaimFindings(policy, root, revision) {
  const findings = [];
  const currentPolicy = policy?.audit_current_claims;
  if (
    currentPolicy === null ||
    typeof currentPolicy !== 'object' ||
    !Array.isArray(currentPolicy.documents) ||
    currentPolicy.documents.length === 0 ||
    currentPolicy.volatile_current_numeric_prose_forbidden !== true
  ) {
    return [
      finding('AUDIT_CURRENT_CLAIM_POLICY_INVALID', 'governed current-claim policy is missing'),
    ];
  }
  let expected;
  try {
    expected = expectedAuditCurrentClaims(policy, root, revision);
  } catch (error) {
    return [
      finding('AUDIT_CURRENT_CLAIM_SOURCE_INVALID', `cannot derive current claims: ${error}`),
    ];
  }
  for (const document of currentPolicy.documents) {
    let source;
    try {
      source = candidateFile(root, revision, document.path);
    } catch (error) {
      findings.push(
        finding('AUDIT_CURRENT_CLAIM_DRIFT', `governed audit document is unavailable: ${error}`, {
          path: document.path,
          implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS,
        }),
      );
      continue;
    }
    const actual = markedJson(source, currentPolicy.markers);
    const selected = Object.fromEntries(
      (document.claims ?? []).map((claim) => [claim, expected[claim]]),
    );
    if (actual === null || canonical(actual) !== canonical(selected)) {
      findings.push(
        finding(
          'AUDIT_CURRENT_CLAIM_DRIFT',
          'governed Auditor current claims differ from their machine sources',
          {
            path: document.path,
            expected: selected,
            actual,
            implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS,
            details: {
              path: document.path,
              implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS,
            },
          },
        ),
      );
    }
    const start = source.indexOf(currentPolicy.markers.start);
    const end = source.indexOf(currentPolicy.markers.end);
    const prose =
      start >= 0 && end > start
        ? `${source.slice(0, start)}${source.slice(end + currentPolicy.markers.end.length)}`
        : source;
    for (const paragraph of prose.split(/\n\s*\n/u)) {
      if (
        /\b(?:current|currently|latest|now)\b/iu.test(paragraph) &&
        /\b\d[\d,.]*%?\b/u.test(paragraph) &&
        /\b(?:trace|sequenc|review|coverage|suite|range|population|assertion|test source)\w*/iu.test(
          paragraph,
        ) &&
        !/\b[0-9a-f]{40}\b/u.test(paragraph)
      ) {
        findings.push(
          finding(
            'AUDIT_CURRENT_PROSE_UNBOUND',
            'volatile current numeric audit prose must be machine-claimed or exact-subject-bound',
            { path: document.path, implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS },
          ),
        );
      }
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
  if (policy?.schemaVersion === '2.0.0') {
    if (policy?.review?.record !== FINAL_REVIEW_RECORD) {
      findings.push(
        finding(
          'POLICY_FINAL_REVIEW_RECORD_INVALID',
          'one stable final B9 review record is required',
        ),
      );
    }
    if (
      canonical(policy?.review_scope?.review_cycles) !==
      canonical({
        mode: 'owner-authorized-unbounded',
        minimum: 1,
        failure: 'repair-complete-class-and-rereview',
        forced_pass: false,
      })
    ) {
      findings.push(
        finding('REVIEW_CYCLE_POLICY_INVALID', 'OM-012 unbounded review continuation is required'),
      );
    }
    findings.push(...auditCurrentClaimFindings(policy, root, revision));
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
  const successful = ['pass', 'EXECUTED_PASS', 'SKIPPED_FRESH'].includes(actual?.outcome);
  return (
    actual?.id === expected?.id &&
    JSON.stringify(actual?.argv) === JSON.stringify(expected?.argv) &&
    actual?.exit_code === 0 &&
    successful &&
    /^[0-9a-f]{64}$/u.test(actual?.stdout_sha256 ?? '') &&
    /^[0-9a-f]{64}$/u.test(actual?.stderr_sha256 ?? '')
  );
}

function semanticResults(results) {
  return (results ?? []).map(
    ({ id, argv, exit_code, outcome, result_digest, reused_result_digest }) => ({
      id,
      argv,
      exit_code,
      outcome: ['pass', 'EXECUTED_PASS', 'SKIPPED_FRESH'].includes(outcome) ? 'pass' : 'fail',
      effective_result_digest: reused_result_digest ?? result_digest ?? null,
    }),
  );
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
    const results = convergence.passes
      .flatMap((pass) => pass.results)
      .map((result) => ({
        id: result.id,
        argv: result.argv,
        exit_code: result.exit_code ?? 1,
        outcome: ['pass', 'EXECUTED_PASS', 'SKIPPED_FRESH'].includes(result.outcome)
          ? 'pass'
          : 'fail',
        stdout_sha256: result.stdout_sha256,
        stderr_sha256: result.stderr_sha256,
      }));
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
    const previous = readState(repoRoot, round, 'candidate-manifest.json');
    if (
      previous.status === 'valid' &&
      previous.value?.manifest_digest_sha256 !== output.manifest_digest_sha256
    ) {
      const historyDirectory = join(stateDirectory(repoRoot, round), 'candidate-manifests');
      mkdirSync(historyDirectory, { recursive: true });
      const identity = SHA40.test(previous.value?.review_candidate ?? '')
        ? previous.value.review_candidate
        : 'unknown-candidate';
      writeFileSync(
        join(
          historyDirectory,
          `${identity}-${previous.value.manifest_digest_sha256 ?? 'unknown'}.json`,
        ),
        canonical(previous.value),
      );
    }
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

function smartConverge() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'smart-converge', findings });
  const freshness = policy.freshness;
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactHead = git(repoRoot, ['rev-parse', head]);
  const checkedOutHead = git(repoRoot, ['rev-parse', 'HEAD']);
  const declared = declaredBase(repoRoot, policy, exactHead, findings);
  if (checkedOutHead !== exactHead)
    findings.push(
      finding('CONVERGENCE_HEAD_MISMATCH', 'checkout does not equal the smart-convergence head', {
        expected: exactHead,
        actual: checkedOutHead,
      }),
    );
  if (base !== declared)
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'smart-convergence base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  if (
    freshness === null ||
    typeof freshness !== 'object' ||
    freshness.partial_coverage_merge !== 'forbidden' ||
    freshness.coverage_reuse !== 'whole-identical-inputs-and-outputs-only' ||
    freshness.remote_cache_trusted !== false
  )
    findings.push(
      finding('FRESHNESS_POLICY_INVALID', 'OM-011 freshness policy is missing or weakened'),
    );

  const commands = policy?.convergence?.commands ?? [];
  const tasks = freshness?.tasks ?? [];
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  if (
    commands.length === 0 ||
    commands.length !== tasks.length ||
    commands.some((gate) => !taskById.has(gate.id)) ||
    tasks.some((task) => !commands.some((gate) => gate.id === task.id))
  )
    findings.push(
      finding(
        'FRESHNESS_TASK_CENSUS_INVALID',
        'freshness tasks and convergence commands must form an exact population',
      ),
    );
  const coverageTask = taskById.get('coverage');
  if (
    coverageTask !== undefined &&
    (coverageTask.coverage_mode !== 'whole-only' ||
      !(coverageTask.input_sets ?? []).includes('coverage'))
  )
    findings.push(
      finding('FRESHNESS_COVERAGE_POLICY_INVALID', 'coverage must remain a whole-only task'),
    );

  const toolchainDigest = toolchainFingerprint(policy, findings);
  const environmentDigest = environmentFingerprint(policy);
  const schemaPath = join(repoRoot, policy.freshness_schema ?? '');
  if (!existsSync(schemaPath))
    findings.push(finding('FRESHNESS_SCHEMA_MISSING', 'task freshness schema is missing'));
  const remote = remoteEnvironment(policy);
  const producedThisInvocation = new Set();
  const passes = [];

  for (let passNumber = 1; passNumber <= 2; passNumber += 1) {
    const headBefore = git(repoRoot, ['rev-parse', 'HEAD']);
    const before = cleanStatus(repoRoot);
    if (headBefore !== exactHead || before.length > 0 || findings.length > 0) {
      if (before.length > 0)
        findings.push(
          finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} did not start clean`, {
            pass: passNumber,
          }),
        );
      if (headBefore !== exactHead)
        findings.push(
          finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} head drifted`, {
            pass: passNumber,
            expected: exactHead,
            actual: headBefore,
          }),
        );
      passes.push({
        pass: passNumber,
        results: blockedResults(policy),
        clean_before: before.length === 0,
        clean_after: before.length === 0,
        head_before: headBefore,
        head_after: headBefore,
        coverage_sha256: coverageDigest(repoRoot),
        workspace_sha256: workspaceSnapshot(
          repoRoot,
          policy.convergence.normalized_runtime_artifacts ?? [],
        ),
      });
      break;
    }

    const results = [];
    const resultById = new Map();
    for (const gate of commands) {
      const task = taskById.get(gate.id);
      if (task === undefined) continue;
      const dependencies = {};
      let dependencyBlocked = false;
      for (const dependency of task.dependencies ?? []) {
        const result = resultById.get(dependency);
        if (
          result === undefined ||
          !['EXECUTED_PASS', 'SKIPPED_FRESH'].includes(result.outcome) ||
          typeof result.task_key !== 'string'
        ) {
          dependencyBlocked = true;
          break;
        }
        dependencies[dependency] = result.task_key;
      }
      if (dependencyBlocked) {
        const blocked = {
          id: gate.id,
          task_id: gate.id,
          argv: gate.argv,
          exit_code: null,
          outcome: 'BLOCKED',
          stdout_sha256: sha256(''),
          stderr_sha256: sha256(''),
        };
        results.push(blocked);
        resultById.set(gate.id, blocked);
        findings.push(
          finding('FRESHNESS_DEPENDENCY_BLOCKED', `task ${gate.id} has no fresh dependency`, {
            gate: gate.id,
            pass: passNumber,
          }),
        );
        continue;
      }

      const inputGlobs = taskInputGlobs(policy, task);
      const inputEntries = worktreeInputEntries(repoRoot, inputGlobs);
      const inputDigest = sha256(canonical({ globs: inputGlobs, entries: inputEntries }));
      const keyBody = {
        policy_version: freshness.policy_version,
        task_id: gate.id,
        argv: gate.argv,
        cwd: '.',
        input_digest: inputDigest,
        dependency_keys: dependencies,
        output_specs: task.outputs ?? [],
        toolchain_digest: toolchainDigest,
        environment_digest: environmentDigest,
      };
      const taskKey = sha256(canonical(keyBody));
      const cachePath = freshnessCachePath(policy, round, gate.id);
      const cache = existsSync(schemaPath) ? readFreshnessCache(cachePath, schemaPath) : null;
      const currentOutputs = outputEntries(repoRoot, task.outputs ?? []);
      const trustedCache = !remote || producedThisInvocation.has(gate.id);
      const reusable =
        trustedCache &&
        cache?.outcome === 'EXECUTED_PASS' &&
        cache.task_key === taskKey &&
        currentOutputs.missing.length === 0 &&
        canonical(cache.outputs ?? []) === canonical(currentOutputs.outputs);

      if (reusable) {
        const body = {
          schemaVersion: '1.0.0',
          policy_version: freshness.policy_version,
          task_id: gate.id,
          argv: gate.argv,
          cwd: '.',
          task_key: taskKey,
          input_digest: inputDigest,
          dependency_keys: dependencies,
          toolchain_digest: toolchainDigest,
          environment_digest: environmentDigest,
          producing_candidate: cache.producing_candidate,
          outcome: 'SKIPPED_FRESH',
          exit_code: 0,
          stdout_sha256: cache.stdout_sha256,
          stderr_sha256: cache.stderr_sha256,
          reused_result_digest: cache.result_digest,
          outputs: currentOutputs.outputs,
          freshness_reason:
            'identical content-addressed PASS, fresh dependencies, and byte-identical outputs',
        };
        const skipped = { ...body, result_digest: freshnessRecordDigest(body), id: gate.id };
        results.push(skipped);
        resultById.set(gate.id, skipped);
        continue;
      }

      const [program, ...args] = gate.argv ?? [];
      const executed = run(program, args, { cwd: repoRoot });
      const exitCode = executed.status ?? 1;
      const afterOutputs = outputEntries(repoRoot, task.outputs ?? []);
      const body = {
        schemaVersion: '1.0.0',
        policy_version: freshness.policy_version,
        task_id: gate.id,
        argv: gate.argv,
        cwd: '.',
        task_key: taskKey,
        input_digest: inputDigest,
        dependency_keys: dependencies,
        toolchain_digest: toolchainDigest,
        environment_digest: environmentDigest,
        producing_candidate: exactHead,
        outcome:
          exitCode === 0 && afterOutputs.missing.length === 0 ? 'EXECUTED_PASS' : 'EXECUTED_FAIL',
        exit_code: exitCode,
        stdout_sha256: sha256(executed.stdout ?? ''),
        stderr_sha256: sha256(executed.stderr ?? ''),
        reused_result_digest: null,
        outputs: afterOutputs.outputs,
        freshness_reason: 'task executed for the current content-addressed key',
      };
      const cacheRecord = { ...body, result_digest: freshnessRecordDigest(body) };
      writeFreshnessCache(cachePath, cacheRecord);
      const runtimeResult = { ...cacheRecord, id: gate.id };
      results.push(runtimeResult);
      resultById.set(gate.id, runtimeResult);
      producedThisInvocation.add(gate.id);
      if (runtimeResult.outcome !== 'EXECUTED_PASS')
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', `gate ${gate.id} failed or omitted outputs`, {
            pass: passNumber,
            gate: gate.id,
            exit_code: exitCode,
            missing_outputs: afterOutputs.missing,
          }),
        );
    }

    const after = cleanStatus(repoRoot);
    const headAfter = git(repoRoot, ['rev-parse', 'HEAD']);
    if (after.length > 0)
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} wrote repository paths`, {
          pass: passNumber,
        }),
      );
    if (headAfter !== exactHead)
      findings.push(
        finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} ended at another head`, {
          pass: passNumber,
          expected: exactHead,
          actual: headAfter,
        }),
      );
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
        policy.convergence.normalized_runtime_artifacts ?? [],
      ),
    });
    if (findings.length > 0) break;
  }

  const resultEquivalent =
    passes.length === 2 &&
    canonical(semanticResults(passes[0].results)) === canonical(semanticResults(passes[1].results));
  if (passes.length === 2 && passes[0].workspace_sha256 !== passes[1].workspace_sha256)
    findings.push(
      finding('CONVERGENCE_WRITE_DETECTED', 'smart-convergence workspace digests differ'),
    );
  if (passes.length === 2 && passes[0].coverage_sha256 !== passes[1].coverage_sha256)
    findings.push(
      finding('CONVERGENCE_COVERAGE_DRIFT', 'smart-convergence coverage digests differ'),
    );
  if (passes.length === 2 && !resultEquivalent)
    findings.push(
      finding('CONVERGENCE_RESULT_DRIFT', 'smart-convergence effective results differ'),
    );
  const ok = findings.length === 0 && passes.length === 2;
  const state = {
    ok,
    mode: 'content-addressed',
    base,
    head: exactHead,
    remote_cache_trusted: false,
    passes,
    result_equivalent: resultEquivalent,
    findings,
  };
  if (ok) writeState(repoRoot, round, 'convergence.json', state);
  emit({ ...state, command: 'smart-converge' });
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

function optionalCandidateFile(root, revision, path) {
  try {
    return candidateFile(root, revision, path);
  } catch {
    return null;
  }
}

function contentStatus(current, previous) {
  if (previous === null) return 'added';
  if (current === null) return 'removed';
  return current === previous ? 'unchanged' : 'changed';
}

function reviewTopicId(kind, key) {
  return `${kind}:${sha256(key).slice(0, 24)}`;
}

function markdownRequirements(source) {
  const requirements = [];
  const modal =
    /\b(?:must|requires?|required|may not|do not|never|only|stop|blocked|forbidden)\b/iu;
  for (const [index, line] of source.split('\n').entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || /^[-|: ]+$/u.test(trimmed)) continue;
    const listed = /^(?:[-*]|\d+\.)\s+/u.test(trimmed);
    const table = trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---');
    if (!listed && !table && !modal.test(trimmed)) continue;
    requirements.push({ line: index + 1, claim: trimmed.replace(/^[-*]\s+/u, '') });
  }
  return requirements;
}

function priorReviewFindings(source) {
  return source
    .split('\n')
    .map((line, index) => ({ line: index + 1, match: /^###\s+(P[0-3]\s+—\s+.+)$/u.exec(line) }))
    .filter(({ match }) => match !== null)
    .map(({ line, match }) => ({ line, claim: match[1] }));
}

function candidateManifestValue(path) {
  try {
    const value = readJson(path);
    const { manifest_digest_sha256: claimed, ...body } = value;
    const digest = sha256(canonical(body));
    if (claimed !== digest || !SHA40.test(value.review_candidate ?? '')) return null;
    return { value, digest };
  } catch {
    return null;
  }
}

function reviewScopeManifest() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'review-scope', findings });
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const candidate = option('--candidate') ?? '';
  const reviewPolicy = policy.review_scope;
  const declared = declaredBase(repoRoot, policy, candidate || 'HEAD', findings);
  if (base !== declared)
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'review-scope base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  if (
    !SHA40.test(candidate) ||
    gitResult(repoRoot, ['cat-file', '-e', `${candidate}^{commit}`]).status !== 0
  )
    findings.push(
      finding('REVIEW_SCOPE_CANDIDATE_INVALID', 'review candidate is not an exact commit'),
    );
  if (reviewPolicy === null || typeof reviewPolicy !== 'object')
    findings.push(finding('REVIEW_SCOPE_POLICY_INVALID', 'review-scope policy is missing'));

  const currentManifestPath = join(
    repoRoot,
    configuredStatePath(reviewPolicy?.candidate_manifest_state, round),
  );
  const currentManifest = candidateManifestValue(currentManifestPath);
  if (currentManifest === null || currentManifest.value.review_candidate !== candidate)
    findings.push(
      finding(
        'REVIEW_SCOPE_CANDIDATE_MANIFEST_INVALID',
        'current candidate manifest is missing, malformed, or stale',
      ),
    );

  const historyPattern = configuredStatePath(reviewPolicy?.candidate_manifest_history, round);
  const historyPaths = filesystemPaths(repoRoot, true)
    .filter((path) => matches(path, historyPattern))
    .sort();
  const previousManifests = historyPaths
    .map((path) => candidateManifestValue(join(repoRoot, path)))
    .filter((value) => value !== null && value.digest !== currentManifest?.digest);
  const previousCandidate = previousManifests.at(-1)?.value?.review_candidate ?? base;
  const convergenceState = readState(repoRoot, round, 'convergence.json');
  const taskKeys = [
    ...new Set(
      (convergenceState.value?.passes ?? [])
        .flatMap((pass) => pass.results ?? [])
        .filter((result) => ['EXECUTED_PASS', 'SKIPPED_FRESH'].includes(result.outcome))
        .map((result) => result.task_key)
        .filter((key) => /^[0-9a-f]{64}$/u.test(key ?? '')),
    ),
  ].sort();
  const topics = [];

  const addTopic = ({
    kind,
    key,
    claim,
    paths,
    current,
    previous,
    adversaries,
    findings: prior = [],
  }) => {
    const status = contentStatus(current, previous);
    const pathDigests = paths.map((path) => ({
      path,
      digest: sha256(optionalCandidateFile(repoRoot, candidate, path) ?? 'MISSING\n'),
    }));
    topics.push({
      topic_id: reviewTopicId(kind, key),
      claim,
      governing_paths: [...new Set(paths)].sort(),
      current_digest: sha256(current ?? 'MISSING\n'),
      previous_digest: previous === null ? null : sha256(previous),
      changed_status: status,
      required_adversaries: [...new Set(adversaries)].sort(),
      previous_findings: [...new Set(prior)].sort(),
      freshness_proof: {
        method:
          status === 'unchanged' && taskKeys.length > 0 ? 'content-addressed' : 'recheck-required',
        inputs_digest: sha256(canonical(pathDigests)),
        task_keys: taskKeys,
        independent_recomputation_required: true,
      },
      required_disposition: status === 'unchanged' ? 'REUSED_FRESH_PASS' : 'RECHECKED_PASS',
    });
  };

  if (SHA40.test(base) && SHA40.test(candidate)) {
    const changed = git(repoRoot, ['diff', '--name-only', base, candidate])
      .split('\n')
      .filter(Boolean)
      .sort();
    for (const path of changed) {
      addTopic({
        kind: 'changed-path',
        key: path,
        claim: `Inspect the exact candidate change at ${path}`,
        paths: [path],
        current: optionalCandidateFile(repoRoot, candidate, path),
        previous: optionalCandidateFile(repoRoot, previousCandidate, path),
        adversaries: ['inspect-exact-diff', 'exercise-affected-behavior'],
      });
    }
  }

  for (const path of reviewPolicy?.requirement_sources ?? []) {
    const current = optionalCandidateFile(repoRoot, candidate, path);
    const previous = optionalCandidateFile(repoRoot, previousCandidate, path);
    if (current === null) {
      findings.push(
        finding('REVIEW_SCOPE_SOURCE_MISSING', 'requirement source is missing', { path }),
      );
      continue;
    }
    for (const requirement of markdownRequirements(current)) {
      const existed = previous?.includes(requirement.claim) === true ? requirement.claim : null;
      addTopic({
        kind: 'requirement',
        key: `${path}:${String(requirement.line)}:${requirement.claim}`,
        claim: requirement.claim,
        paths: [path],
        current: requirement.claim,
        previous: existed,
        adversaries: ['recheck-requirement', 'challenge-counterexample'],
      });
    }
  }

  for (const path of reviewPolicy?.controlling_sources ?? []) {
    const current = optionalCandidateFile(repoRoot, candidate, path);
    const previous = optionalCandidateFile(repoRoot, previousCandidate, path);
    if (current === null) {
      findings.push(
        finding('REVIEW_SCOPE_SOURCE_MISSING', 'controlling source is missing', { path }),
      );
      continue;
    }
    addTopic({
      kind: 'control',
      key: path,
      claim: `Recheck controlling source ${path}`,
      paths: [path],
      current,
      previous,
      adversaries: ['recompute-control-digest', 'challenge-policy-bypass'],
    });
  }

  for (const path of priorReviewPaths(reviewPolicy, repoRoot, candidate)) {
    const current = optionalCandidateFile(repoRoot, candidate, path);
    if (current === null) {
      findings.push(finding('REVIEW_SCOPE_SOURCE_MISSING', 'prior review is missing', { path }));
      continue;
    }
    for (const prior of priorReviewFindings(current)) {
      addTopic({
        kind: 'previous-finding',
        key: `${path}:${String(prior.line)}:${prior.claim}`,
        claim: `Recheck prior finding class: ${prior.claim}`,
        paths: [path],
        current: prior.claim,
        previous: prior.claim,
        adversaries: ['reproduce-defect-class', 'sweep-same-class-population'],
        findings: [prior.claim],
      });
    }
  }

  if (currentManifest !== null) {
    addTopic({
      kind: 'candidate-manifest',
      key: 'current',
      claim: 'Recompute the current candidate manifest identity and digest',
      paths: [configuredStatePath(reviewPolicy.candidate_manifest_state, round)],
      current: currentManifest.digest,
      previous: previousManifests.at(-1)?.digest ?? null,
      adversaries: ['recompute-manifest-digest', 'compare-candidate-identity'],
    });
  }

  topics.sort((left, right) => left.topic_id.localeCompare(right.topic_id));
  if (new Set(topics.map(({ topic_id }) => topic_id)).size !== topics.length)
    findings.push(finding('REVIEW_TOPIC_DUPLICATED', 'generated review topic IDs are not unique'));
  const body =
    currentManifest === null || !SHA40.test(candidate)
      ? null
      : {
          schemaVersion: '1.0.0',
          policy_version: reviewPolicy.policy_version,
          round,
          exact_base: base,
          review_candidate: candidate,
          candidate_tree: git(repoRoot, ['rev-parse', `${candidate}^{tree}`]),
          current_candidate_manifest_digest: currentManifest.digest,
          previous_candidate_manifest_digests: previousManifests.map(({ digest }) => digest).sort(),
          topic_count: topics.length,
          topics,
        };
  const manifestValue =
    body === null ? null : { ...body, manifest_digest_sha256: sha256(canonical(body)) };
  if (manifestValue !== null) {
    try {
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);
      const validate = ajv.compile(readJson(join(repoRoot, policy.review_scope_schema)));
      if (!validate(manifestValue))
        findings.push(
          finding('REVIEW_SCOPE_SCHEMA_INVALID', 'review-scope manifest failed schema validation', {
            errors: validate.errors,
          }),
        );
    } catch (error) {
      findings.push(finding('REVIEW_SCOPE_SCHEMA_INVALID', String(error)));
    }
  }
  const ok = findings.length === 0 && manifestValue !== null && topics.length > 0;
  if (ok)
    writeState(
      repoRoot,
      round,
      configuredStatePath(reviewPolicy.manifest_state, round).split('/').at(-1),
      manifestValue,
    );
  emit({ ok, command: 'review-scope', manifest: manifestValue, findings });
}

function parseReviewDispositions(source, markers) {
  const start = source.indexOf(markers.start);
  const end = source.indexOf(markers.end);
  if (start === -1 || end === -1 || end <= start) return null;
  const serialized = source.slice(start + markers.start.length, end).trim();
  try {
    const value = JSON.parse(serialized);
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function reviewCheck() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'review-check', findings });
  const reviewPolicy = policy.review_scope;
  const round = option('--round') ?? '';
  const candidate = option('--candidate') ?? '';
  const record = option('--review-record') ?? '';
  const cycle = Number(option('--cycle') ?? '1');
  if (
    !Number.isInteger(cycle) ||
    cycle < (reviewPolicy?.review_cycles?.minimum ?? Number.POSITIVE_INFINITY) ||
    reviewPolicy?.review_cycles?.mode !== 'owner-authorized-unbounded'
  )
    findings.push(
      finding(
        'REVIEW_CYCLE_BUDGET_EXHAUSTED',
        'review cycle is outside the OM-012 review-until-PASS protocol',
        { cycle },
      ),
    );
  const manifestPath = join(repoRoot, configuredStatePath(reviewPolicy?.manifest_state, round));
  let manifestValue = null;
  try {
    manifestValue = readJson(manifestPath);
    const { manifest_digest_sha256: claimed, ...body } = manifestValue;
    if (
      claimed !== sha256(canonical(body)) ||
      manifestValue.review_candidate !== candidate ||
      manifestValue.topic_count !== manifestValue.topics?.length
    )
      throw new Error('review-scope manifest identity or digest mismatch');
  } catch (error) {
    findings.push(finding('REVIEW_SCOPE_MANIFEST_INVALID', String(error)));
  }
  let dispositions = null;
  try {
    dispositions = parseReviewDispositions(
      readFileSync(join(repoRoot, record), 'utf8'),
      reviewPolicy.review_record_markers,
    );
    if (dispositions === null) throw new Error('review disposition block is missing or malformed');
  } catch (error) {
    findings.push(finding('REVIEW_TOPIC_DISPOSITIONS_INVALID', String(error)));
  }
  if (manifestValue !== null && dispositions !== null) {
    const topics = new Map(manifestValue.topics.map((topic) => [topic.topic_id, topic]));
    const seen = new Set();
    for (const disposition of dispositions) {
      if (seen.has(disposition?.topic_id))
        findings.push(
          finding('REVIEW_TOPIC_DUPLICATED', 'review topic has more than one disposition', {
            topic_id: disposition?.topic_id,
          }),
        );
      seen.add(disposition?.topic_id);
      const topic = topics.get(disposition?.topic_id);
      if (topic === undefined) {
        findings.push(
          finding('REVIEW_TOPIC_UNKNOWN', 'review record contains an unknown topic', {
            topic_id: disposition?.topic_id,
          }),
        );
        continue;
      }
      if (!(reviewPolicy.dispositions ?? []).includes(disposition?.disposition))
        findings.push(
          finding('REVIEW_TOPIC_DISPOSITION_INVALID', 'review topic disposition is invalid', {
            topic_id: disposition.topic_id,
          }),
        );
      if (disposition?.recomputed_digest !== topic.current_digest)
        findings.push(
          finding('REVIEW_TOPIC_DIGEST_INVALID', 'reviewer digest does not match current topic', {
            topic_id: disposition.topic_id,
          }),
        );
      if (
        disposition?.disposition === 'REUSED_FRESH_PASS' &&
        (topic.changed_status !== 'unchanged' ||
          topic.freshness_proof?.method !== 'content-addressed' ||
          disposition?.freshness_verified !== true ||
          typeof disposition?.rationale !== 'string' ||
          disposition.rationale.trim().length < 20 ||
          /^unchanged\.?$/iu.test(disposition.rationale.trim()))
      )
        findings.push(
          finding(
            'REVIEW_TOPIC_FRESHNESS_UNVERIFIED',
            'reused topic lacks independent digest, freshness, or invariant reasoning',
            { topic_id: disposition.topic_id },
          ),
        );
      if (['RECHECKED_FAIL', 'BLOCKED'].includes(disposition?.disposition))
        findings.push(
          finding('REVIEW_TOPIC_NOT_PASSING', 'review topic is failed or blocked', {
            topic_id: disposition.topic_id,
          }),
        );
    }
    for (const topicId of topics.keys()) {
      if (!seen.has(topicId))
        findings.push(
          finding('REVIEW_TOPIC_OMITTED', 'mandatory review topic has no disposition', {
            topic_id: topicId,
          }),
        );
    }
  }
  emit({
    ok: findings.length === 0,
    command: 'review-check',
    round,
    candidate,
    cycle,
    findings,
  });
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
  const requiredModel = policy.review.required_model ?? 'gpt-5.6-sol';
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
  case 'smart-converge':
    smartConverge();
    break;
  case 'review-scope':
    reviewScopeManifest();
    break;
  case 'review-check':
    reviewCheck();
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
          'expected policy-check, materialize, manifest, converge, smart-converge, review-scope, review-check, envelope, or rehearse',
        ),
      ],
    });
}
