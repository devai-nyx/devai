#!/usr/bin/env node
// R7-F005 / AB-F007: standalone, non-reentrant proof for the complete literal roster.
// This file deliberately does not match the Vitest include pattern and is not named by any
// roster command. Each row receives a different detached clone and a real frozen install.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SHA40 = /^[0-9a-f]{40}$/u;

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const repoRoot = resolve(option('--repo-root') ?? process.cwd());
const candidate = option('--candidate') ?? '';
if (!SHA40.test(candidate)) fail('--candidate must be one literal lowercase 40-hex commit');

function captured(program, argv, cwd, prefix, env = process.env) {
  const stdoutPath = `${prefix}.stdout`;
  const stderrPath = `${prefix}.stderr`;
  const stdout = openSync(stdoutPath, 'w');
  const stderr = openSync(stderrPath, 'w');
  let result;
  try {
    result = spawnSync(program, argv, {
      cwd,
      env,
      stdio: ['ignore', stdout, stderr],
    });
  } finally {
    closeSync(stdout);
    closeSync(stderr);
  }
  return {
    status: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
    stdout: fileEvidence(stdoutPath),
    stderr: fileEvidence(stderrPath),
  };
}

function fileEvidence(path) {
  const bytes = readFileSync(path);
  return {
    bytes: statSync(path).size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    tail: bytes.subarray(Math.max(0, bytes.length - 4_096)).toString('utf8'),
  };
}

function git(cwd, argv) {
  const result = spawnSync('git', argv, { cwd, encoding: 'utf8' });
  if (result.error !== undefined || result.status !== 0)
    throw new Error(`git ${argv.join(' ')} failed: ${String(result.stderr || result.error)}`);
  return result.stdout.trim();
}

try {
  if (git(repoRoot, ['cat-file', '-t', candidate]) !== 'commit')
    fail('candidate does not resolve to a commit');
} catch (error) {
  fail(String(error));
}

const policy = JSON.parse(
  git(repoRoot, ['show', `${candidate}:law/policy/round-close-controls.json`]),
);
const commands = policy?.convergence?.commands;
if (!Array.isArray(commands) || commands.length !== 16)
  fail(
    `exact candidate must declare 16 convergence commands; observed ${String(commands?.length)}`,
  );

const storeProbe = spawnSync('pnpm', ['store', 'path', '--silent'], {
  cwd: repoRoot,
  encoding: 'utf8',
});
if (storeProbe.error !== undefined || storeProbe.status !== 0)
  fail(`pnpm store path failed: ${String(storeProbe.stderr || storeProbe.error)}`);
const storePath = storeProbe.stdout.trim();

const candidateTree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
const rows = [];
for (const [index, gate] of commands.entries()) {
  const parent = mkdtempSync(join(tmpdir(), `devai-r7-independent-${String(index + 1)}-`));
  const clone = join(parent, 'repo');
  const row = {
    ordinal: index + 1,
    id: gate?.id ?? null,
    argv: gate?.argv ?? null,
    candidate,
    candidate_tree: candidateTree,
    clone_head_before: null,
    clone_tree_before: null,
    clone_status_before: null,
    install: null,
    command: null,
    clone_head_after: null,
    clone_tree_after: null,
    clone_status_after: null,
    ok: false,
  };
  try {
    const cloneResult = captured(
      'git',
      ['clone', '--quiet', '--shared', '--no-checkout', repoRoot, clone],
      parent,
      join(parent, 'clone'),
    );
    if (cloneResult.status !== 0 || cloneResult.error !== null) {
      row.command = { not_run: 'clone-failed' };
      row.install = { not_run: 'clone-failed', clone: cloneResult };
      rows.push(row);
      continue;
    }
    git(clone, ['checkout', '--quiet', '--detach', candidate]);
    row.clone_head_before = git(clone, ['rev-parse', 'HEAD']);
    row.clone_tree_before = git(clone, ['rev-parse', 'HEAD^{tree}']);
    row.clone_status_before = git(clone, ['status', '--porcelain=v1', '--untracked-files=all']);

    row.install = captured(
      'pnpm',
      ['install', '--offline', '--frozen-lockfile', '--store-dir', storePath],
      clone,
      join(parent, 'install'),
      { ...process.env, CI: '1' },
    );
    if (row.install.status !== 0 || row.install.error !== null) {
      row.command = { not_run: 'frozen-install-failed' };
    } else if (!Array.isArray(gate.argv) || gate.argv.length === 0) {
      row.command = { not_run: 'literal-argv-missing' };
    } else {
      const [program, ...argv] = gate.argv;
      row.command = captured(program, argv, clone, join(parent, 'command'));
    }

    row.clone_head_after = git(clone, ['rev-parse', 'HEAD']);
    row.clone_tree_after = git(clone, ['rev-parse', 'HEAD^{tree}']);
    row.clone_status_after = git(clone, ['status', '--porcelain=v1', '--untracked-files=all']);
    row.ok =
      row.clone_head_before === candidate &&
      row.clone_head_after === candidate &&
      row.clone_tree_before === candidateTree &&
      row.clone_tree_after === candidateTree &&
      row.clone_status_before === '' &&
      row.clone_status_after === '' &&
      row.install?.status === 0 &&
      row.install?.signal === null &&
      row.install?.error === null &&
      row.command?.status === 0 &&
      row.command?.signal === null &&
      row.command?.error === null;
    rows.push(row);
  } catch (error) {
    row.command = { exception: String(error) };
    rows.push(row);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

const uniqueIds = new Set(rows.map((row) => row.id));
const result = {
  schemaVersion: '1.0.0',
  proof_id: 'R7-B7-INDEPENDENT-SIXTEEN-LITERAL-GATES',
  candidate,
  candidate_tree: candidateTree,
  declared_count: commands.length,
  observed_count: rows.length,
  unique_id_count: uniqueIds.size,
  isolated_clone_count: rows.length,
  rows,
  ok: rows.length === 16 && uniqueIds.size === 16 && rows.every((row) => row.ok),
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ok) process.exitCode = 1;
