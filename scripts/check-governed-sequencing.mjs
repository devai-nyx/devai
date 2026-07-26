#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const base = option('--base') ?? defaultBase();
const head = option('--head') ?? 'HEAD';
const policy = JSON.parse(
  readFileSync(resolve(repoRoot, 'law/policy/governed-sequencing.json'), 'utf8'),
);
const exceptions = new Set(policy.historical_exceptions.map((entry) => entry.round));
const commits =
  base.length === 0
    ? []
    : git(['rev-list', '--reverse', `${base}..${head}`])
        .split('\n')
        .filter(Boolean);
const observations = commits.map((sha) => {
  const [author, subject] = git(['show', '-s', '--format=%an%x00%s', sha]).split('\0');
  const paths = git(['diff-tree', '--no-commit-id', '--name-only', '-r', sha])
    .split('\n')
    .filter(Boolean);
  const token = /\br([0-9]{4})\b/iu.exec(subject ?? '')?.[1];
  return { sha, author, subject, paths, round: token === undefined ? null : `R-${token}` };
});

const findings = [];
for (const [index, commit] of observations.entries()) {
  if (commit.round !== null && exceptions.has(commit.round)) continue;
  const prior = observations.slice(0, index);
  const substantiveEngineer =
    commit.author === 'DEVAI Engineer' &&
    commit.paths.some((path) =>
      /^(?:packages\/|scripts\/|\.github\/|package\.json$|pnpm-lock\.yaml$)/u.test(path),
    );
  if (substantiveEngineer) {
    if (commit.round === null) {
      findings.push({
        rule: 'round-attribution',
        sha: commit.sha,
        message: 'Engineer commit lacks an rNNNN subject token',
      });
      continue;
    }
    const priorRound = prior.filter((candidate) => candidate.round === commit.round);
    if (!priorRound.some((candidate) => candidate.author === 'DEVAI Architect')) {
      findings.push({
        rule: 'law-before-implementation',
        sha: commit.sha,
        message: `no prior Architect commit for ${commit.round}`,
      });
    }
    if (
      !priorRound.some(
        (candidate) =>
          candidate.author === 'DEVAI Inspector' &&
          candidate.paths.some((path) => path.startsWith('tests/') || path.includes('/tests/')),
      )
    ) {
      findings.push({
        rule: 'red-before-repair',
        sha: commit.sha,
        message: `no prior Inspector contract commit for ${commit.round}`,
      });
    }
  }
  const machineRecord =
    commit.author === 'DEVAI Machine' && commit.paths.some((path) => path.startsWith('record/'));
  if (machineRecord) {
    const hasShape = prior.some(
      (candidate) =>
        candidate.author === 'DEVAI Architect' &&
        candidate.paths.some((path) => path.startsWith('law/schemas/')),
    );
    const hasVerb = prior.some(
      (candidate) =>
        candidate.author === 'DEVAI Engineer' &&
        candidate.paths.some((path) => path.startsWith('packages/')),
    );
    if (!hasShape || !hasVerb) {
      findings.push({
        rule: 'shape-before-machine-record',
        sha: commit.sha,
        message: 'Machine record lacks prior schema or validated implementation verb',
      });
    }
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
    `governed sequencing: FAIL\n${findings.map((finding) => `${finding.rule} ${finding.sha}: ${finding.message}`).join('\n')}\n`,
  );
process.exitCode = result.ok ? 0 : 1;
