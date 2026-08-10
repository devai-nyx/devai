#!/usr/bin/env node
// Per DII-253: every substantive Engineer commit after the declared boundary must have every
// substantive implementation path in its diff named by an implementation-path manifest that a
// prior Inspector commit already carried. The manifest previously existed only as an Auditor
// procedure, and for R7-F012 it was consulted after the Engineer commit at 775f47d — so it
// disclosed an unnamed path instead of preventing it. A control that runs after the act it
// governs is a report, not a gate.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

const repoRoot = resolve(option('--repo-root') ?? process.cwd());

function git(args) {
  // stderr is captured rather than inherited so a probe that is expected to fail, such as
  // resolving a boundary this history does not contain, does not print a bare git fatal into
  // the output of whatever command is running the gate.
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

const policyPath = join(repoRoot, 'law/policy/governed-sequencing.json');
if (!existsSync(policyPath)) {
  console.error('implementation-path manifest: FAIL');
  console.error('law/policy/governed-sequencing.json is missing');
  process.exit(1);
}

const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const declaration = policy.implementation_path_manifests ?? null;
if (declaration === null) {
  // An older policy that has not adopted the declaration keeps its previous behaviour rather
  // than failing closed on a key it cannot carry.
  console.log('implementation-path manifest: not declared');
  process.exit(0);
}

const surfaces = policy.implementation_surfaces ?? { prefixes: [], root_globs: [] };

function rootGlobMatches(path, glob) {
  if (path.includes('/')) return false;
  const expression = glob.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${expression}$`, 'u').test(path);
}

function substantiveImplementationPath(path) {
  return (
    (surfaces.prefixes ?? []).some((prefix) => path.startsWith(prefix)) ||
    (surfaces.root_globs ?? []).some((glob) => rootGlobMatches(path, glob))
  );
}

const boundary = declaration.required_after_commit;
let range = [];
try {
  range = git(['rev-list', '--reverse', `${boundary}..HEAD`])
    .split('\n')
    .filter(Boolean);
} catch {
  // A declaration bound to a commit outside this history does not govern this history. Every
  // contract fixture is a fresh repository that copies the real policy, so it necessarily
  // carries a boundary it cannot contain; failing closed there made the literal ci:governance
  // command refuse inside every such fixture. The governed repository always contains its own
  // boundary, so nothing is weakened by declining to judge a history the declaration never
  // addressed.
  console.log(
    `implementation-path manifest: not applicable (boundary ${String(boundary).slice(0, 7)} is not in this history)`,
  );
  process.exit(0);
}

const suffix = declaration.manifest_suffix ?? '.implementation-paths.json';
const findings = [];
const SHA40 = /^[0-9a-f]{40}$/u;

function commitObservation(sha) {
  try {
    const [author, subject] = git(['show', '-s', '--format=%an%x00%s', sha]).split('\0');
    const paths = git(['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean);
    const token = /\br([0-9]{4})\b/iu.exec(subject ?? '')?.[1];
    return {
      author,
      paths,
      round: token === undefined ? null : `R-${token}`,
    };
  } catch {
    return null;
  }
}

const normalOwners = new Map();
for (const binding of Array.isArray(policy.bindings) ? policy.bindings : []) {
  for (const sha of Array.isArray(binding?.implementation_commits)
    ? binding.implementation_commits
    : []) {
    const owners = normalOwners.get(sha) ?? [];
    owners.push(binding);
    normalOwners.set(sha, owners);
  }
}

if (Array.isArray(policy.historical_exceptions) && policy.historical_exceptions.length > 0) {
  findings.push('round-wide historical exceptions cannot bypass parent-tree manifests');
} else if (
  policy.historical_exceptions !== undefined &&
  !Array.isArray(policy.historical_exceptions)
) {
  findings.push('round-wide historical exceptions must be an array when present');
}

const exactExceptions = new Map();
const historicalCommitExceptions = policy.historical_commit_exceptions ?? [];
if (!Array.isArray(historicalCommitExceptions)) {
  findings.push('malformed historical commit exception: expected an array');
} else {
  for (const exception of historicalCommitExceptions) {
    const commits = exception?.implementation_commits;
    if (
      exception === null ||
      typeof exception !== 'object' ||
      Array.isArray(exception) ||
      typeof exception.round !== 'string' ||
      !/^R-[0-9]{4}$/u.test(exception.round) ||
      !Array.isArray(commits) ||
      commits.length === 0 ||
      commits.some((sha) => typeof sha !== 'string' || !SHA40.test(sha)) ||
      typeof exception.reason !== 'string' ||
      exception.reason.trim().length === 0
    ) {
      findings.push('malformed historical commit exception: exact SHA, round, and reason required');
      continue;
    }
    for (const sha of commits) {
      if (exactExceptions.has(sha)) {
        findings.push(`${sha}: duplicate historical commit exception ownership`);
        continue;
      }
      exactExceptions.set(sha, exception);
      const observed = commitObservation(sha);
      if (
        observed === null ||
        observed.author !== 'DEVAI Engineer' ||
        !observed.paths.some(substantiveImplementationPath) ||
        (observed.round !== null && observed.round !== exception.round)
      ) {
        findings.push(`${sha}: exception must name an exact substantive Engineer commit`);
      }
      if ((normalOwners.get(sha)?.length ?? 0) > 0) {
        findings.push(`${sha}: exception already has normal governed-sequencing ownership`);
      }
    }
  }
}

for (const sha of range) {
  if (git(['show', '-s', '--format=%an', sha]) !== 'DEVAI Engineer') continue;
  const changed = git(['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean);
  const implementation = changed.filter(substantiveImplementationPath);
  if (implementation.length === 0) continue;
  if (exactExceptions.has(sha)) continue;

  // Manifests are read at the parent, so a manifest introduced by the very commit it would
  // authorize grants nothing. That is the ordering the gate exists to enforce.
  const parent = `${sha}^`;
  const allowed = new Set();
  for (const manifest of git(['ls-tree', '-r', '--name-only', parent])
    .split('\n')
    .filter((path) => path.endsWith(suffix))) {
    if (git(['log', '-1', '--format=%an', parent, '--', manifest]) !== 'DEVAI Inspector') continue;
    try {
      const document = JSON.parse(git(['show', `${parent}:${manifest}`]));
      for (const path of document.allowed_paths ?? []) allowed.add(path);
    } catch {
      // A manifest that does not parse authorizes nothing; it never widens the set.
    }
  }

  for (const path of implementation)
    if (!allowed.has(path))
      findings.push(
        `${sha}: ${path} is not named in any prior Inspector implementation-path manifest`,
      );
}

if (findings.length > 0) {
  console.error('implementation-path manifest: FAIL');
  for (const message of findings) console.error(message);
  process.exit(1);
}

console.log(
  `implementation-path manifest: PASS (${String(range.length)} commits since ${String(boundary).slice(0, 7)})`,
);
