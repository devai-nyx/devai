// R20.W1 matrix row 5 — 52/52 fingerprint + behavior corpus. Per skill:
// Article 37 composition evidence (prompt_pc_id + stack_sha256 from the
// outbound meta, plus a masked-payload digest) where a composition path is
// reached, or an explicit N/A reason where not — plus a normalized behavior
// signature for every skill regardless. Zero silent omissions.
import { aroundEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';
import { canonical, normalize } from './r20-harness.js';
import {
  assertRosterComplete,
  isDeclaredRuntimeNoise,
  loadSpecs,
  runOne,
} from './r20-skill-runner.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

describe('R20 baseline: fingerprint + behavior corpus (52/52)', () => {
  it('normalizes both a fixture path and its filesystem realpath alias', () => {
    const parent = mkdtempSync(join(tmpdir(), 'r20-path-alias-'));
    const fixture = join(parent, 'fixture');
    const alias = join(parent, 'alias');
    try {
      mkdirSync(fixture);
      symlinkSync(fixture, alias, 'dir');
      expect(normalize(`${realpathSync(alias)}/out.json`, alias)).toBe('<FIXTURE>/out.json');
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  it('normalizes Vitest reporter wall-clock and duration text', () => {
    expect(normalize('Start at  05:17:19\nDuration  108ms (tests 1ms)\n', '/fixture')).toBe(
      'Start at <TIME>\nDuration <DURATION>\n',
    );
  });

  it('normalizes ANSI-decorated Vitest reporter text without changing raw evidence', () => {
    const colored =
      '\u001b[1m Test Files \u001b[22m 1 passed\n' +
      '\u001b[2m      Tests  \u001b[22m 1 passed\n' +
      '\u001b[2m   Start at  \u001b[22m14:45:48\n' +
      '\u001b[2m   Duration  \u001b[22m108ms (tests 1ms)\n';
    expect(normalize(colored, '/fixture')).toBe(
      ' Test Files  1 passed\n      Tests   1 passed\n   Start at <TIME>\n   Duration <DURATION>\n',
    );
    expect(colored).toContain('\u001b[22m14:45:48');
  });

  it('normalizes the CI-selected fixture progress line without masking summary metrics', () => {
    const ciReporter =
      '\n RUN  v4.1.10 /tmp/r20-skill\n\n ✓ tests/fixture.test.ts (1 test) 5ms\n\n' +
      ' Test Files  1 passed (1)\n      Tests  1 passed (1)\n';
    expect(normalize(ciReporter, '/tmp/r20-skill')).toBe(
      '\n RUN  v4.1.10 <FIXTURE>\n\n\n Test Files  1 passed (1)\n      Tests  1 passed (1)\n',
    );
    expect(ciReporter).toContain('tests/fixture.test.ts (1 test) 5ms');
  });

  it('pins every package fixture to the repository package-manager contract', () => {
    const packageFixtures = loadSpecs().flatMap((spec) =>
      Object.entries(spec.files)
        .filter(([path]) => path.endsWith('package.json'))
        .map(([path, content]) => ({ spec: spec.skill_id, path, content })),
    );

    expect(packageFixtures.length).toBeGreaterThan(0);
    for (const fixture of packageFixtures) {
      expect(JSON.parse(fixture.content), `${fixture.spec}:${fixture.path}`).toMatchObject({
        packageManager: 'pnpm@10.0.0',
      });
    }
  });

  it('A37 evidence / explicit N/A + behavior signatures match the baseline for every skill', async () => {
    const specs = loadSpecs();
    assertRosterComplete(specs);
    const rows: Record<string, unknown> = {};
    for (const spec of specs) {
      const cap = await runOne(spec);
      rows[spec.skill_id] = {
        strategy: cap.strategy,
        a37: cap.a37,
        behavior: cap.behavior,
        fs_products: cap.fs_products,
      };
    }
    expect(Object.keys(rows)).toHaveLength(52);
    const current = canonical({ skills: rows });
    const expected = canonical(
      JSON.parse(
        readFileSync(
          join(import.meta.dirname, '..', 'baselines', 'fingerprint-behavior.json'),
          'utf8',
        ),
      ) as unknown,
    );
    expect(current).toBe(expected);
  }, 600_000);
});

// Owner ruling item 3 guard (W1 closure): the fs_products runtime-noise
// exemption must stay EXACTLY feedback-iteration's two per-iteration sensor
// snapshots and nothing else. Folded here (not a standalone file) so the
// canonical trace corpus stays at the Owner-authorized 204 — a 10th corpus
// file would have re-broken continuous trace enforcement. This guard fails if
// the exemption ever broadens.
const FI = 'SKILL-feedback-iteration';

describe('R20 fs_products runtime-noise exemption is exactly two paths for one skill', () => {
  it('exempts feedback-iteration readings-before/after.json at any iter-N', () => {
    for (const p of [
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/iter-1/readings-before.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/iter-1/readings-after.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-0009/iter-3/readings-after.json',
    ]) {
      expect(isDeclaredRuntimeNoise(FI, p), p).toBe(true);
    }
  });

  it('does NOT exempt the same path under any other skill', () => {
    const p =
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/iter-1/readings-before.json';
    expect(isDeclaredRuntimeNoise('SKILL-round-audit', p)).toBe(false);
    expect(isDeclaredRuntimeNoise('SKILL-compute-scorecard', p)).toBe(false);
  });

  it('does NOT exempt any other feedback-iteration product (new products stay visible + hashed)', () => {
    for (const p of [
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/iter-1/log.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/iter-1/edits.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/iter-1/readings.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-FIXTURE-1/summary.json',
      'packages/fix.ts',
    ]) {
      expect(isDeclaredRuntimeNoise(FI, p), p).toBe(false);
    }
  });

  it('does NOT exempt an unrelated JSON, even a readings-shaped one outside the exact path', () => {
    for (const p of [
      'readings-before.json',
      'record/proofs/work/sensor-readings/build/SR-1.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/readings-before.json',
      'record/proofs/work/skill-runs/SKILL-feedback-iteration/TASK-X/readings-before.json',
    ]) {
      expect(isDeclaredRuntimeNoise(FI, p), p).toBe(false);
    }
  });
});

// Invariants: INV-DEVAI-001, INV-DEVAI-008, INV-DEVAI-010
