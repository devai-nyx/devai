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
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
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
  console.error('implementation-path manifest: FAIL');
  console.error(`declared boundary ${String(boundary)} is not reachable in this history`);
  process.exit(1);
}

const suffix = declaration.manifest_suffix ?? '.implementation-paths.json';
const findings = [];

for (const sha of range) {
  if (git(['show', '-s', '--format=%an', sha]) !== 'DEVAI Engineer') continue;
  const changed = git(['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean);
  const implementation = changed.filter(substantiveImplementationPath);
  if (implementation.length === 0) continue;

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
