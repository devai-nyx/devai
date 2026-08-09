// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// R7-B6-USABILITY-EXAMPLES-008: every canonical copy/paste example reaches its
// intended route in a read-only/dry-run repository or one disposable fixture.
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');
const DOCS = join(ROOT, 'docs/reference/cli');

interface Example {
  readonly command: string;
  readonly source: string;
}

interface ActionEnvelope {
  readonly action_id?: string;
  readonly ok?: boolean;
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
  };
}

function examples(): Example[] {
  const found: Example[] = [];
  for (const name of readdirSync(DOCS)
    .filter((candidate) => candidate.endsWith('.md'))
    .sort()) {
    const lines = readFileSync(join(DOCS, name), 'utf8').split('\n');
    let shellFence = false;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      if (line.trim() === '```sh') {
        shellFence = true;
        continue;
      }
      if (shellFence && line.trim() === '```') {
        shellFence = false;
        continue;
      }
      const candidates: string[] = [];
      if (shellFence && line.trimStart().startsWith('devai ')) candidates.push(line.trim());
      for (const pattern of [
        /\*\*New-grammar example:\*\* `(devai [^`]+)`/gu,
        /\*\*Example:\*\* `(devai [^`]+)`/gu,
      ]) {
        for (const match of line.matchAll(pattern)) candidates.push(match[1] ?? '');
      }
      if (name === 'index.md' && line.startsWith('|') && line.includes('`devai ')) {
        const command = line.match(/`(devai [^`]+)`/u)?.[1];
        if (command !== undefined) candidates.push(command);
      }
      for (const command of candidates) {
        found.push({ command, source: `${name}:${String(index + 1)}` });
      }
    }
  }
  return found;
}

function expectedActionId(command: string): string | undefined {
  const argv = command.split(/\s+/u).slice(1);
  if (argv[0]?.startsWith('-')) return undefined;
  if (argv.includes('--help') || argv.includes('--all')) return undefined;
  if (argv[0] === 'release' && argv[1] === 'publish' && argv[2] === 'docs') {
    return 'release publish docs';
  }
  if (argv[0] === 'init' && argv[1] === 'apply') return `init apply ${argv[2] ?? ''}`;
  if (argv[0] === 'catalog' && argv[1] === 'actions') return 'catalog actions';
  if (argv[0] === 'doctor') return 'doctor';
  if (argv[0] === 'check') return 'check';
  return argv.slice(0, 2).join(' ');
}

function requiresDisposableFixture(command: string): boolean {
  return /^(?:devai init (?:apply|plan|upgrade)\b|devai check --suite\b|devai round run\b|devai sense run --preset sweep\b(?![^\n]*--dry-run)|devai release publish docs\b[^\n]*--dry-run)/u.test(
    command,
  );
}

function materializeDisposableFixture(command: string, fixture: string): void {
  if (!/^devai release publish docs\b[^\n]*--dry-run/u.test(command)) return;
  mkdirSync(join(fixture, '.devai/config'), { recursive: true });
  writeFileSync(
    join(fixture, '.devai/config/project.json'),
    `${JSON.stringify({ repo: { kind: 'library' }, docs: { builder: 'docusaurus' } }, null, 2)}\n`,
  );
  mkdirSync(join(fixture, 'law'), { recursive: true });
  copyFileSync(join(ROOT, 'law/constitution.md'), join(fixture, 'law/constitution.md'));
  mkdirSync(join(fixture, 'docs/site'), { recursive: true });
  writeFileSync(
    join(fixture, 'docs/site/package.json'),
    `${JSON.stringify(
      {
        private: true,
        scripts: { build: "node -e \"require('fs').mkdirSync('build',{recursive:true})\"" },
      },
      null,
      2,
    )}\n`,
  );
  for (const argv of [
    ['init', '--quiet'],
    ['add', '.'],
    [
      '-c',
      'user.name=DEVAI Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'fixture',
    ],
  ]) {
    const git = spawnSync('git', argv, { cwd: fixture, encoding: 'utf8', timeout: 10_000 });
    if (git.status !== 0) {
      throw new Error(`release fixture git ${argv.join(' ')} failed: ${git.stderr}`);
    }
  }
}

function parseEnvelope(output: string): ActionEnvelope | undefined {
  try {
    const parsed = JSON.parse(output) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
    return parsed as ActionEnvelope;
  } catch {
    return undefined;
  }
}

function isDocumentedFixturePrecondition(command: string, envelope: ActionEnvelope): boolean {
  if (!requiresDisposableFixture(command)) return false;
  const code = envelope.error?.code ?? '';
  const message = envelope.error?.message ?? '';
  if (code === 'CHECK_SELECTION_INVALID' && /law\/policy\/check-suites\.json/u.test(message)) {
    return /^devai check --suite\b/u.test(command);
  }
  if (code === 'ACTION_INVOCATION_REFUSED' && /Constitution not found/u.test(message)) {
    return /^(?:devai init (?:apply|plan|upgrade)\b|devai round run\b|devai sense run --preset sweep\b)/u.test(
      command,
    );
  }
  return false;
}

function isDocumentedRepositoryOutcome(command: string, envelope: ActionEnvelope): boolean {
  const code = envelope.error?.code ?? '';
  const message = envelope.error?.message ?? '';
  if (/^devai doctor\b/u.test(command) && code === 'ACTION_INVOCATION_REFUSED') {
    try {
      const report = JSON.parse(message) as { readonly checks?: readonly unknown[] };
      return Array.isArray(report.checks);
    } catch {
      return false;
    }
  }
  if (/^devai sense inventory\b/u.test(command) && code === 'ACTION_OUTPUT_CONTRACT_VIOLATION') {
    try {
      const report = JSON.parse(message) as { readonly slice?: unknown; readonly status?: unknown };
      return typeof report.slice === 'string' && report.status === 'review';
    } catch {
      return false;
    }
  }
  if (/^devai evidence verify\b/u.test(command) && code === 'ACTION_INVOCATION_REFUSED') {
    return /evidence chain[^\n]*invalid 'head'/u.test(message);
  }
  return false;
}

describe('R-0007 B6 canonical documentation examples', () => {
  it('R7-B6-USABILITY-EXAMPLES-008 routes every copy/paste example without candidate mutation', () => {
    const all = examples();
    expect(
      all.length,
      'example extractor found too little of the canonical handoff',
    ).toBeGreaterThan(300);
    const generatedCount = readdirSync(DOCS)
      .filter((candidate) => candidate.endsWith('.md'))
      .reduce(
        (count, name) =>
          count +
          [...readFileSync(join(DOCS, name), 'utf8').matchAll(/\*\*New-grammar example:\*\*/gu)]
            .length,
        0,
      );
    expect(generatedCount).toBe(283);

    const historicalGrammar = [
      /\binit apply-f5\b/u,
      /\bcheck --profile\b/u,
      /\bsense (?:run )?--set\b/u,
      /\b--allow-publish\b/u,
    ];
    for (const example of all) {
      expect(example.command, `${example.source} is not a literal devai invocation`).toMatch(
        /^devai(?:\s|$)/u,
      );
      expect(example.command, `${example.source} contains an unresolved placeholder`).not.toMatch(
        /<[a-z][^>]*>/iu,
      );
      for (const oldGrammar of historicalGrammar) {
        expect(example.command, `${example.source} uses retired grammar`).not.toMatch(oldGrammar);
      }
    }

    const commands = [...new Set(all.map((example) => example.command))];
    const statusBefore = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).stdout;
    const failures: string[] = [];

    for (const command of commands) {
      const fixture = mkdtempSync(join(tmpdir(), 'devai-r7-b6-example-'));
      try {
        const isolated = requiresDisposableFixture(command);
        materializeDisposableFixture(command, fixture);
        const result = spawnSync(process.execPath, [BIN, ...command.split(/\s+/u).slice(1)], {
          cwd: isolated ? fixture : ROOT,
          encoding: 'utf8',
          env: subprocessCoverageEnvironment(),
          timeout: 20_000,
          maxBuffer: 16 * 1024 * 1024,
        });
        if (result.error !== undefined) {
          failures.push(`${command}: spawn error ${result.error.message}`);
          continue;
        }

        const expected = expectedActionId(command);
        if (expected === undefined) {
          if (result.status !== 0) {
            failures.push(`${command}: help/discovery exited ${String(result.status)}`);
          }
          continue;
        }

        if (result.status === 0 && !command.includes('--format json')) {
          if ((result.stdout || result.stderr).trim() === '') {
            failures.push(`${command}: successful human route emitted no output`);
          }
          continue;
        }

        const envelope = parseEnvelope(result.stdout || result.stderr);
        if (envelope?.action_id !== expected) {
          failures.push(
            `${command}: expected action ${expected}, received ${envelope?.action_id ?? 'no action envelope'}`,
          );
          continue;
        }
        if (result.status === 0 && envelope.ok === true) continue;
        if (isDocumentedFixturePrecondition(command, envelope)) continue;
        if (isDocumentedRepositoryOutcome(command, envelope)) continue;

        failures.push(
          `${command}: exit ${String(result.status)}, ${envelope.error?.code ?? 'no code'}: ${(envelope.error?.message ?? 'no structured message').slice(0, 500)}`,
        );
      } finally {
        rmSync(fixture, { recursive: true, force: true });
      }
    }

    const statusAfter = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).stdout;
    expect(statusAfter, 'documented examples mutated the candidate checkout').toBe(statusBefore);
    expect(failures, failures.join('\n')).toEqual([]);
  }, 90_000);
});
