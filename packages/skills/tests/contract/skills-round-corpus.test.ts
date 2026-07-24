// R20.W1 matrix row 10 — round-machinery behavior corpus, driven through the
// PUBLIC skill surface (the wave-catalog/log helpers are module-private and
// W1 makes no src edits; W2 slice 6 gives them module homes and this corpus
// must keep passing unchanged through the move). Exercises catalog parsing
// variants, unbacked-wave classification, wave-log writing, backlog
// scaffolding, and the audit dir builder beyond the single-case row-4/5 runs.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, aroundEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill } from '../../src/skills/index.js';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';
import { baseline, canonical, normalize } from './r20-harness.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

let repo = '';

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'r20-round-'));
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

function write(rel: string, content: string): void {
  const full = join(repo, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function tree(rel: string): Record<string, string> {
  const out: Record<string, string> = {};
  const root = join(repo, rel);
  if (!existsSync(root)) return out;
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else out[full.slice(join(repo, '').length)] = readFileSync(full, 'utf8');
    }
  };
  walk(root);
  return out;
}

const CATALOG_3WAVES = `# Orchestrator

## Wave catalog

| # | slug | goal | role | effort | dependsOn |
|---|---|---|---|---|---|
| 1 | \`alpha\` | first | engineer | low | - |
| 2 | \`beta\` | second | inspector | medium | 1 |
| 3 | \`gamma\` | third (prompt file missing) | auditor | low | 2 |
`;

describe('R20 baseline: round-machinery corpus via public skills', () => {
  it('round-orchestrate over a 3-wave catalog (unbacked, missing-prompt) matches the baseline', async () => {
    write('work/rounds/R-0777/prompts/00-orchestrator.md', CATALOG_3WAVES);
    write('work/rounds/R-0777/prompts/01-alpha.md', '# Wave 1 — alpha\n\nProse only.\n');
    write('work/rounds/R-0777/prompts/02-beta.md', '# Wave 2 — beta\n\nProse only.\n');
    // wave 3 prompt intentionally missing → escalation path
    const entry = getSkill('SKILL-round-orchestrate');
    expect(entry).not.toBeNull();
    if (entry === null) return;
    const result = await entry.run({
      repoRoot: repo,
      timestamp: '2026-01-01T00:00:00.000Z',
      inputs: { round_n: 777, skip_unbacked_waves: true },
    });
    const current = canonical(
      normalize(
        {
          status: result.status,
          notes: result.notes ?? [],
          evidence: result.evidence ?? null,
          files: tree('work/rounds/R-0777'),
          ledger: existsSync(join(repo, '.devai/state/decisions.jsonl'))
            ? readFileSync(join(repo, '.devai/state/decisions.jsonl'), 'utf8')
                .trim()
                .split('\n')
                .map((l) => JSON.parse(l))
            : [],
        },
        repo,
      ),
    );
    const { expected } = baseline('round-corpus-orchestrate.json', current);
    expect(current).toBe(expected);
  });

  it('round-backlog + round-audit file products over a fixed scorecard match the baseline', async () => {
    write(
      'work/audit/R-0777/scorecard.baseline.json',
      JSON.stringify({
        timestamp: '2026-01-01T00:00:00.000Z',
        cells: [
          { substrate: 'F1', property: 'T6', verdict: 'FAIL' },
          { substrate: 'F3', property: 'T9', verdict: 'REVIEW' },
          { substrate: 'F5', property: 'T4', verdict: 'FAIL' },
        ],
      }),
    );
    const backlogEntry = getSkill('SKILL-round-backlog');
    const auditEntry = getSkill('SKILL-round-audit');
    expect(backlogEntry).not.toBeNull();
    expect(auditEntry).not.toBeNull();
    if (backlogEntry === null || auditEntry === null) return;
    const backlog = await backlogEntry.run({
      repoRoot: repo,
      timestamp: '2026-01-01T00:00:00.000Z',
      inputs: { round_n: 777 },
    });
    const audit = await auditEntry.run({
      repoRoot: repo,
      timestamp: '2026-01-01T00:00:00.000Z',
      inputs: { round_n: 777 },
    });
    const current = canonical(
      normalize(
        {
          backlog: { status: backlog.status, evidence: backlog.evidence ?? null },
          audit: { status: audit.status, evidence: audit.evidence ?? null },
          round_files: tree('work/rounds/R-0777'),
          audit_files: tree('work/audit/R-0777'),
        },
        repo,
      ),
    );
    const { expected } = baseline('round-corpus-backlog-audit.json', current);
    expect(current).toBe(expected);
  });
});

// Invariants: INV-DEVAI-001, INV-DEVAI-010
