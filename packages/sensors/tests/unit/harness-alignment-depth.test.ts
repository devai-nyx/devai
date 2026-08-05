// Invariants: INV-DEVAI-001, INV-DEVAI-012, INV-DEVAI-019
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { senseHarnessInvariantAlignment } from '../../src/harness-invariant-alignment.js';

const HEAD = 'a'.repeat(40);
const NOW = '2026-07-27T12:00:00.000Z';
let root = '';
let readingOrdinal = 0;

function write(path: string, value: string): void {
  const target = join(root, path);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, value);
}

function invariant(
  id: string,
  measurableVia?: readonly string[],
  mode: 'any' | 'all' = 'any',
): void {
  write(
    `law/invariants/${id}.json`,
    JSON.stringify({
      id,
      severity: 'gate',
      measurable_via: measurableVia,
      measurable_via_mode: mode,
    }),
  );
}

function workflow(steps: string): void {
  write(
    '.github/workflows/ci.yml',
    `name: ci\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n${steps}\n`,
  );
}

function evidence(records: unknown): void {
  write('evidence/nested/readings.json', JSON.stringify(records));
  write('evidence/malformed.json', '{');
}

function reading(command: unknown, overrides: Record<string, unknown> = {}) {
  return {
    id: `SR-${String(++readingOrdinal).padStart(3, '0')}`,
    command,
    status: 'pass',
    lifecycle: 'supported',
    candidate_sha: HEAD,
    completed_at: '2026-07-27T11:00:00.000Z',
    ...overrides,
  };
}

function sense(extra: Record<string, unknown> = {}) {
  return senseHarnessInvariantAlignment({
    repoRoot: root,
    invariantsDir: 'law/invariants',
    workflowDir: '.github/workflows',
    evidenceDir: 'evidence',
    candidateHead: HEAD,
    now: NOW,
    ...extra,
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'devai-harness-alignment-depth-'));
  readingOrdinal = 0;
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('harness invariant-alignment parser and evidence depth', () => {
  it('returns REVIEW for absent, unreadable, malformed, and non-gate invariant populations', () => {
    write('law/invariants/malformed.json', '{');
    write('law/invariants/ignored.txt', '{}');
    write('law/invariants/non-gate.json', JSON.stringify({ id: 'INV-X', severity: 'advisory' }));
    expect(sense({ candidateHead: undefined }).findings?.[0]?.code).toBe(
      'HARNESS_INVARIANT_ALIGNMENT_NO_GATES',
    );
  });

  it('fails when multiple gates omit measurable_via and uses an unknown-id fallback', () => {
    invariant('INV-A');
    invariant('INV-B', []);
    write('law/invariants/unknown.json', JSON.stringify({ severity: 'gate' }));
    const result = sense();
    expect(result.status).toBe('fail');
    expect(result.metrics?.misaligned).toBe(3);
    expect(result.findings?.every((finding) => finding.code.endsWith('NO_MEASURABLE_VIA'))).toBe(
      true,
    );
  });

  it('accepts exact DEVAI launcher spellings, quoting, comments, and block run bodies', () => {
    const actions = [
      'policy check alpha',
      'policy check beta',
      'policy check gamma',
      'policy check delta',
      'policy check epsilon',
      'policy check zeta',
      'policy check eta',
      'policy check theta',
    ];
    actions.forEach((action, index) => invariant(`INV-${String(index + 1)}`, [action]));
    workflow(`      - run: devai policy check alpha # binding comment
      - run: env -i KEY=value command -- devai policy check beta
      - run: node packages/cli/dist/bin.js policy check gamma
      - run: pnpm --silent exec devai policy check delta
      - run: npx --yes devai policy check epsilon
      - run: npm exec -- devai policy check zeta
      - run: devai policy-check-eta
      - name: block
        continue-on-error: false # remains binding
        run: |
          devai "policy" 'check' theta`);
    evidence(actions.map((action) => reading(['devai', ...action.split(' ')])));
    const result = sense();
    expect(result.status).toBe('pass');
    expect(result.metrics).toMatchObject({ gate_invariants: 8, misaligned: 0 });
  });

  it('rejects non-binding shell control, wrappers, backgrounding, pipelines, and disabled steps', () => {
    const cases = [
      ['echoed', 'echo devai policy check echoed'],
      ['printed', 'printf "devai policy check printed"'],
      ['or-list', 'devai policy check or-list || true'],
      ['redirected', 'devai policy check redirected > /dev/null'],
      ['background', 'devai policy check background &'],
      ['pipeline', 'devai policy check pipeline | tee out'],
      ['negated', '! devai policy check negated'],
      ['quoted-bad', 'devai "policy check quoted-bad'],
      ['unrelated-node', 'node other/bin.js policy check unrelated-node'],
    ] as const;
    cases.forEach(([action], index) =>
      invariant(`INV-R${String(index)}`, [`policy check ${action}`]),
    );
    workflow(
      cases.map(([, command]) => `      - run: ${command}`).join('\n') +
        `\n      - continue-on-error: true
        run: devai policy check continued
      - if: \${{ false }}
        run: devai policy check disabled
      - run: |
          set +e
          devai policy check soft
      - run: |
          if true; then
            devai policy check controlled
          fi`,
    );
    for (const action of ['continued', 'disabled', 'soft', 'controlled']) {
      invariant(`INV-${action}`, [`policy check ${action}`]);
    }
    evidence(
      [...cases.map(([action]) => action), 'continued', 'disabled', 'soft', 'controlled'].map(
        (action) => reading(`devai policy check ${action}`),
      ),
    );
    expect(sense().status).toBe('fail');
  });

  it('requires fresh supported PASS evidence bound to a valid candidate', () => {
    invariant('INV-E', ['policy check evidence'], 'all');
    workflow('      - run: devai policy check evidence');
    evidence([
      reading('devai policy check evidence', { status: 'fail' }),
      reading('devai policy check evidence', { lifecycle: 'experimental' }),
      reading('devai policy check evidence', { candidate_sha: 'not-a-sha' }),
      reading('devai policy check evidence', { completed_at: 'invalid' }),
      reading('devai policy check evidence', {
        completed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      }),
      reading('devai policy check evidence', { completed_at: '2026-07-20T00:00:00.000Z' }),
      reading('if true; devai policy check evidence; fi'),
      reading(42),
    ]);
    expect(sense({ maxEvidenceAgeHours: 1 }).status).toBe('review');
    expect(sense({ maxEvidenceAgeHours: -1 }).status).toBe('review');
    expect(sense({ maxEvidenceAgeHours: Number.NaN }).status).toBe('review');
    expect(sense({ candidateHead: 'invalid' }).status).toBe('review');
  });

  it('derives candidate provenance from canonical test and sensor chain receipts', () => {
    invariant('INV-T', ['sense test']);
    invariant('INV-S', ['sense lint']);
    workflow(`      - run: devai sense test
      - run: devai sense lint`);
    write(
      'evidence/test.json',
      JSON.stringify({
        id: 'TR-1',
        command: 'devai sense test',
        status: 'pass',
        lifecycle: 'supported',
        env: { commit: HEAD },
      }),
    );
    write(
      'evidence/sensor.json',
      JSON.stringify({
        id: 'SR-1',
        command: 'devai sense lint',
        status: 'pass',
        lifecycle: 'supported',
        timestamp: '2026-07-27T11:00:00.000Z',
      }),
    );
    write(
      'record/proofs/chain.json',
      JSON.stringify({
        records: [
          {
            actor: 'devai-record-run',
            action: 'test-run.unit',
            status: 'completed',
            timestamp: '2026-07-27T11:00:00.000Z',
            context: { git: { head_sha: HEAD } },
            notes: ['test-result id: TR-1; fixture'],
          },
          {
            action: 'sense.readings.record',
            timestamp: '2026-07-27T11:00:00.000Z',
            context: { git: { head_sha: HEAD } },
            artifacts: [{ path: 'evidence/sensor.json' }],
          },
        ],
      }),
    );
    expect(sense().status).toBe('pass');
  });
});
