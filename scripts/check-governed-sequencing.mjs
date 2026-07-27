#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const repoRoot = resolve(option('--repo-root') ?? '.');

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function defaultBase() {
  for (const candidate of [process.env.GITHUB_BASE_SHA, 'origin/main', 'HEAD^']) {
    if (!candidate) continue;
    try {
      return git(['merge-base', candidate, option('--head') ?? 'HEAD']);
    } catch {
      // Try the next deterministic base source.
    }
  }
  return '';
}

function observation(sha) {
  const [author, subject] = git(['show', '-s', '--format=%an%x00%s', sha]).split('\0');
  const paths = git(['diff-tree', '--no-commit-id', '--name-only', '-r', sha])
    .split('\n')
    .filter(Boolean);
  const token = /\br([0-9]{4})\b/iu.exec(subject ?? '')?.[1];
  return { sha, author, subject, paths, round: token === undefined ? null : `R-${token}` };
}

function priorHistoryHasRolePath(sha, author, path) {
  try {
    return git(['log', '--format=%an', `${sha}^`, '--', path])
      .split('\n')
      .filter(Boolean)
      .includes(author);
  } catch {
    return false;
  }
}

function substantiveEngineer(commit) {
  return commit.author === 'DEVAI Engineer' && commit.paths.some(substantiveImplementationPath);
}

let implementationSurfaces = null;

function rootGlobMatches(path, glob) {
  if (path.includes('/')) return false;
  const expression = glob.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${expression}$`, 'u').test(path);
}

function canonicalRootEngineerPaths() {
  const authorityPath = resolve(repoRoot, 'packages/cli/src/authority/policy.ts');
  if (!existsSync(authorityPath)) return null;
  const source = readFileSync(authorityPath, 'utf8');
  const declaration = /const rootEngineerPaths = \[([\s\S]*?)\];/u.exec(source);
  const body = declaration?.[1];
  if (body === undefined) return null;
  return [...body.matchAll(/'([^']+)'/gu)].map((match) => match[1]);
}

function substantiveImplementationPath(path) {
  if (implementationSurfaces === null) return false;
  if (implementationSurfaces.prefixes.some((prefix) => path.startsWith(prefix))) return true;
  return implementationSurfaces.root_globs.some((glob) => rootGlobMatches(path, glob));
}

function containedEvidencePath(value) {
  if (typeof value !== 'string' || !value.startsWith('work/audit/')) return null;
  const absolute = resolve(repoRoot, value);
  const auditRoot = resolve(repoRoot, 'work/audit');
  if (absolute !== auditRoot && !absolute.startsWith(`${auditRoot}${sep}`)) return null;
  return absolute;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const base = option('--base') ?? defaultBase();
const head = option('--head') ?? 'HEAD';
const policy = JSON.parse(
  readFileSync(resolve(repoRoot, 'law/policy/governed-sequencing.json'), 'utf8'),
);
const commits =
  base.length === 0
    ? []
    : git(['rev-list', '--reverse', `${base}..${head}`])
        .split('\n')
        .filter(Boolean);
const observations = commits.map(observation);
const bySha = new Map(observations.map((commit, index) => [commit.sha, { commit, index }]));
const findings = [];
const configuredSurfaces = policy.implementation_surfaces;
if (
  configuredSurfaces === null ||
  typeof configuredSurfaces !== 'object' ||
  Array.isArray(configuredSurfaces) ||
  !Array.isArray(configuredSurfaces.prefixes) ||
  !Array.isArray(configuredSurfaces.root_globs) ||
  [configuredSurfaces.prefixes, configuredSurfaces.root_globs].some(
    (values) =>
      values.length === 0 ||
      values.some((value) => typeof value !== 'string' || value.length === 0),
  )
) {
  findings.push({
    rule: 'implementation-surfaces',
    sha: null,
    message: 'implementation_surfaces must contain non-empty prefixes and root_globs arrays',
  });
  implementationSurfaces = {
    prefixes: [],
    root_globs: [],
  };
} else {
  implementationSurfaces = configuredSurfaces;
}

const canonicalRootGlobs = canonicalRootEngineerPaths();
if (
  canonicalRootGlobs === null ||
  JSON.stringify(implementationSurfaces.root_globs) !== JSON.stringify(canonicalRootGlobs)
) {
  findings.push({
    rule: 'implementation-surface-parity',
    sha: null,
    message:
      'implementation_surfaces.root_globs must exactly match canonical rootEngineerPaths authority',
  });
}

if (Array.isArray(policy.historical_exceptions) && policy.historical_exceptions.length > 0) {
  findings.push({
    rule: 'round-exception-bypass',
    sha: null,
    message: 'round-wide historical exceptions are disclosure-only and cannot bypass binding',
  });
} else if (
  policy.historical_exceptions !== undefined &&
  !Array.isArray(policy.historical_exceptions)
) {
  findings.push({
    rule: 'round-exception-bypass',
    sha: null,
    message: 'historical_exceptions, when present for migration rejection, must be an array',
  });
}
const bindings = Array.isArray(policy.bindings) ? policy.bindings : [];
if (!Array.isArray(policy.bindings)) {
  findings.push({
    rule: 'binding-registry',
    sha: null,
    message: 'policy.bindings must be an array',
  });
}

const semanticBoundarySha = policy.semantic_red_scope?.required_after_commit;
const semanticBoundary =
  typeof semanticBoundarySha === 'string' ? bySha.get(semanticBoundarySha) : undefined;
if (typeof semanticBoundarySha !== 'string' || semanticBoundarySha.length === 0) {
  findings.push({
    rule: 'semantic-scope-policy',
    sha: null,
    message: 'semantic_red_scope.required_after_commit must be an exact commit',
  });
}
const semanticBoundaryIndex = semanticBoundary?.index ?? -1;

const historicalCommitExceptions = Array.isArray(policy.historical_commit_exceptions)
  ? policy.historical_commit_exceptions
  : [];
if (!Array.isArray(policy.historical_commit_exceptions)) {
  findings.push({
    rule: 'historical-commit-exception',
    sha: null,
    message: 'historical_commit_exceptions must be an array',
  });
}
const exactExceptionOwners = new Map();
for (const exception of historicalCommitExceptions) {
  if (
    exception === null ||
    typeof exception !== 'object' ||
    Array.isArray(exception) ||
    typeof exception.round !== 'string' ||
    !Array.isArray(exception.implementation_commits) ||
    exception.implementation_commits.length === 0 ||
    typeof exception.reason !== 'string' ||
    exception.reason.trim().length === 0
  ) {
    findings.push({
      rule: 'historical-commit-exception',
      sha: null,
      message: 'exact historical exception fields are incomplete',
    });
    continue;
  }
  for (const sha of exception.implementation_commits) {
    const candidate = bySha.get(sha);
    if (!candidate) continue;
    const owners = exactExceptionOwners.get(sha) ?? [];
    owners.push(exception);
    exactExceptionOwners.set(sha, owners);
    if (!substantiveEngineer(candidate.commit) || candidate.commit.round !== exception.round) {
      findings.push({
        rule: 'historical-commit-exception',
        sha,
        message: 'exception must name an exact substantive Engineer commit in its round',
      });
    }
  }
}

const implementationOwners = new Map();
for (const binding of bindings) {
  if (binding === null || typeof binding !== 'object' || Array.isArray(binding)) {
    findings.push({ rule: 'binding-shape', sha: null, message: 'binding must be an object' });
    continue;
  }
  const implementationCommits = binding.implementation_commits;
  const lawCommits = binding.law_commits;
  const redEvidence = binding.red_evidence;
  if (
    typeof binding.round !== 'string' ||
    !Array.isArray(implementationCommits) ||
    implementationCommits.length === 0 ||
    !Array.isArray(lawCommits) ||
    lawCommits.length === 0 ||
    redEvidence === null ||
    typeof redEvidence !== 'object' ||
    Array.isArray(redEvidence)
  ) {
    findings.push({ rule: 'binding-shape', sha: null, message: 'binding fields are incomplete' });
    continue;
  }
  for (const sha of implementationCommits) {
    const owners = implementationOwners.get(sha) ?? [];
    owners.push(binding);
    implementationOwners.set(sha, owners);
  }

  const inRangeImplementations = implementationCommits.map((sha) => bySha.get(sha)).filter(Boolean);
  if (inRangeImplementations.length === 0) continue;
  for (const sha of implementationCommits) {
    const candidate = bySha.get(sha);
    if (!candidate || !substantiveEngineer(candidate.commit)) {
      findings.push({
        rule: 'implementation-commit',
        sha,
        message: 'bound implementation is absent from the range or not substantive Engineer work',
      });
    } else if (candidate.commit.round !== binding.round) {
      findings.push({
        rule: 'round-attribution',
        sha,
        message: `binding round ${binding.round} does not match commit subject`,
      });
    }
  }

  const implementationIndexes = inRangeImplementations.map(({ index }) => index);
  const firstImplementation = Math.min(...implementationIndexes);
  for (const sha of lawCommits) {
    const candidate = bySha.get(sha);
    if (
      !candidate ||
      candidate.commit.author !== 'DEVAI Architect' ||
      candidate.index >= firstImplementation ||
      !candidate.commit.paths.some(
        (path) => path.startsWith('law/') || path.startsWith('work/rounds/'),
      )
    ) {
      findings.push({
        rule: 'law-before-implementation',
        sha,
        message: 'bound law must be prior Architect law or round governance in this range',
      });
    }
  }

  const redCommit = typeof redEvidence.commit === 'string' ? bySha.get(redEvidence.commit) : null;
  const redTests = Array.isArray(redEvidence.tests) ? redEvidence.tests : [];
  const requiresSemanticScope = inRangeImplementations.some(
    ({ index }) => index > semanticBoundaryIndex,
  );
  const actualImplementationPaths = [
    ...new Set(
      inRangeImplementations.flatMap(({ commit }) =>
        commit.paths.filter(substantiveImplementationPath),
      ),
    ),
  ].sort();
  const exercisedImplementationPaths = Array.isArray(redEvidence.exercised_implementation_paths)
    ? [...new Set(redEvidence.exercised_implementation_paths)].sort()
    : [];
  if (
    !redCommit ||
    redCommit.commit.author !== 'DEVAI Inspector' ||
    redCommit.index >= firstImplementation ||
    redTests.length === 0 ||
    redTests.some(
      (path) =>
        typeof path !== 'string' ||
        (!path.startsWith('tests/') && !path.includes('/tests/')) ||
        !redCommit.commit.paths.includes(path),
    ) ||
    !Number.isInteger(redEvidence.observed_exit) ||
    redEvidence.observed_exit === 0 ||
    typeof redEvidence.command !== 'string' ||
    redEvidence.command.length === 0
  ) {
    findings.push({
      rule: 'red-before-repair',
      sha: redEvidence.commit ?? null,
      message: 'bound red evidence must be an exact prior failing Inspector test commit',
    });
  }

  if (requiresSemanticScope) {
    const redSources =
      redCommit === null
        ? []
        : redTests.flatMap((path) => {
            try {
              return [git(['show', `${redCommit.commit.sha}:${path}`])];
            } catch {
              return [];
            }
          });
    const exactScope =
      JSON.stringify(actualImplementationPaths) === JSON.stringify(exercisedImplementationPaths);
    const testsBindScope = exercisedImplementationPaths.every((path) =>
      redSources.some((source) => source.includes(path)),
    );
    if (exercisedImplementationPaths.length === 0 || !exactScope || !testsBindScope) {
      findings.push({
        rule: 'red-semantic-scope',
        sha: redEvidence.commit ?? null,
        message:
          'prospective red evidence must bind every exact implementation path in its failing Inspector sources',
      });
    }
  }

  const evidencePath = containedEvidencePath(redEvidence.evidence_path);
  let evidence = null;
  if (
    evidencePath === null ||
    !existsSync(evidencePath) ||
    typeof redEvidence.evidence_sha256 !== 'string' ||
    sha256(readFileSync(evidencePath)) !== redEvidence.evidence_sha256
  ) {
    findings.push({
      rule: 'red-evidence-artifact',
      sha: redEvidence.commit ?? null,
      message: 'red evidence artifact is missing, outside work/audit, or hash-mismatched',
    });
  } else {
    try {
      evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
    } catch {
      findings.push({
        rule: 'red-evidence-artifact',
        sha: redEvidence.commit ?? null,
        message: 'red evidence artifact is not JSON',
      });
    }
  }
  const observed = Array.isArray(evidence?.observations)
    ? evidence.observations.find((entry) => entry?.commit === redEvidence.commit)
    : null;
  if (
    observed?.command !== redEvidence.command ||
    observed?.exit_code !== redEvidence.observed_exit ||
    JSON.stringify(observed?.tests) !== JSON.stringify(redTests) ||
    (requiresSemanticScope &&
      JSON.stringify([...(observed?.exercised_implementation_paths ?? [])].sort()) !==
        JSON.stringify(exercisedImplementationPaths))
  ) {
    findings.push({
      rule: 'red-evidence-artifact',
      sha: redEvidence.commit ?? null,
      message: 'red evidence artifact does not bind the declared command, exit, and tests',
    });
  }
}

for (const commit of observations.filter(substantiveEngineer)) {
  const owners = implementationOwners.get(commit.sha) ?? [];
  const exceptionOwners = exactExceptionOwners.get(commit.sha) ?? [];
  if (exceptionOwners.length > 1 || (exceptionOwners.length === 1 && owners.length > 0)) {
    findings.push({
      rule: 'historical-commit-exception',
      sha: commit.sha,
      message: 'implementation must have one binding or one exact exception, never both',
    });
  } else if (owners.length !== 1 && exceptionOwners.length !== 1) {
    findings.push({
      rule: 'implementation-binding',
      sha: commit.sha,
      message: `substantive Engineer commit must have exactly one binding; observed ${String(owners.length)}`,
    });
  }
}

for (const commit of observations) {
  const machineRecord =
    commit.author === 'DEVAI Machine' && commit.paths.some((path) => path.startsWith('record/'));
  if (!machineRecord) continue;
  const hasShape = priorHistoryHasRolePath(commit.sha, 'DEVAI Architect', 'law/schemas');
  const hasVerb = priorHistoryHasRolePath(commit.sha, 'DEVAI Engineer', 'packages');
  if (!hasShape || !hasVerb) {
    findings.push({
      rule: 'shape-before-machine-record',
      sha: commit.sha,
      message: 'Machine record lacks prior schema or validated implementation verb',
    });
  }
}

const result = {
  ok: findings.length === 0,
  base,
  head: git(['rev-parse', head]),
  commits_checked: commits.length,
  findings,
};
if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(result)}\n`);
else if (result.ok)
  process.stdout.write(`governed sequencing: PASS (${String(commits.length)} commits)\n`);
else
  process.stderr.write(
    `governed sequencing: FAIL\n${findings.map((finding) => `${finding.rule} ${finding.sha ?? '-'}: ${finding.message}`).join('\n')}\n`,
  );
process.exitCode = result.ok ? 0 : 1;
