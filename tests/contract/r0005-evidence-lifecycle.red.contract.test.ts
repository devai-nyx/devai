import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { subprocessCoverageEnvironment } from '../helpers/subprocess-coverage.js';

// Invariants: INV-DEVAI-001, INV-DEVAI-017, INV-DEVAI-020

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function json(relativePath: string): Record<string, unknown> {
  return JSON.parse(read(relativePath)) as Record<string, unknown>;
}

describe('R-0005 evidence and lifecycle red-first contracts', () => {
  it('KR-R5-002 / BL-010 defines the canonical per-round per-kind proof epoch', () => {
    expect(existsSync(join(ROOT, 'law/schemas/proof-epoch.schema.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'packages/evidence/src/evidence/proof-epoch.ts'))).toBe(true);
    const source = read('packages/evidence/src/evidence/proof-epoch.ts');
    expect(source).toContain('appendProofEpochRecord');
    expect(source).toContain('verifyProofEpoch');
    expect(source).toContain('previous_line_hash');
    expect(source).toContain('terminal_hash');
    expect(source).toContain('errata');
  });

  it('KR-R5-003 / BL-011 derives the close SWEEP from every live read-only registry kind', () => {
    const registry = json('law/policy/sensor-registry.json') as {
      entries: { kind: string; effect: string }[];
    };
    const policy = json('law/policy/sense-presets.json') as {
      presets: Array<{ name: string; members: string[]; excluded: string[] }>;
    };
    const sweep = policy.presets.find((preset) => preset.name === 'sweep');
    expect(sweep).toBeDefined();
    expect(sweep?.members).toEqual(
      registry.entries.filter((entry) => entry.effect === 'read').map((entry) => entry.kind),
    );
    expect(sweep?.excluded).toEqual(
      registry.entries.filter((entry) => entry.effect !== 'read').map((entry) => entry.kind),
    );
    expect(sweep?.members).toHaveLength(49);
    expect(sweep?.excluded).toHaveLength(10);
    const facade = read('packages/cli/src/commands/sense/facade.ts');
    expect(facade).toContain('SENSE_SWEEP_READ_POPULATION_DIVERGENCE');
    expect(facade).toContain('SENSE_SWEEP_EXCLUSION_POPULATION_DIVERGENCE');
  });

  it('KR-R5-004 / BL-045 requires exact subject and explicit expiry in local evidence', () => {
    const schema = json('law/schemas/local-evidence-manifest.schema.json') as {
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(schema.required).toEqual(expect.arrayContaining(['subject', 'expiresAt']));
    expect(schema.properties).toHaveProperty('subject');
    expect(schema.properties).toHaveProperty('expiresAt');
    const verifier = read('packages/evidence/src/local-evidence/verify.ts');
    expect(verifier).toContain('validateExactSubject');
    expect(verifier).toContain('caller-selected manifest paths are forbidden');
  });

  it('KR-R5-005 / BL-015 reaches zero only through the bounded prompt-overlay rule', () => {
    const result = spawnSync(
      'node',
      [BIN, 'check', '--only', 'prompt-overlays', '--format', 'json'],
      { cwd: ROOT, encoding: 'utf8', env: subprocessCoverageEnvironment() },
    );
    expect(result.status, result.stderr).toBe(0);
    const envelope = JSON.parse(result.stdout) as { result: { value: unknown } };
    const output = envelope.result.value as { ok: boolean; findings: unknown[] };
    expect(output.ok).toBe(true);
    expect(output.findings).toEqual([]);
  });

  it('KR-R5-006 / BL-018 observes post-merge state in one clean managed worktree', () => {
    const source = read('packages/skills/src/post-merge-auditor/index.ts');
    expect(source).toContain("join(repoRoot, '.devai/worktrees/auditor-post-merge')");
    expect(source).not.toContain("join(repoRoot, 'scratch/worktrees/auditor-post-merge')");
    expect(source).toContain('assertCleanObservationWorktree');
  });

  it('KR-R5-007 / BL-033 migrates every invariant anchor-doc object to authority_docs', () => {
    const schema = json('law/schemas/invariant.schema.json') as { required: string[] };
    expect(schema.required).toContain('authority_docs');
    expect(schema.required).not.toContain('authority');
    const files = readdirSync(join(ROOT, 'law/invariants')).filter((name) =>
      name.endsWith('.json'),
    );
    expect(files).toHaveLength(34);
    for (const file of files) {
      const invariant = json(`law/invariants/${file}`);
      expect(invariant).toHaveProperty('authority_docs');
      expect(invariant).not.toHaveProperty('authority');
    }
  });

  it('KR-R5-008 / BL-050/063 closes in place on the canonical proof and worktree roots', () => {
    const lifecycle = read('packages/loop/src/round-lifecycle/index.ts');
    expect(lifecycle).toContain('record/proofs/compliance/closures');
    expect(lifecycle).not.toContain("join(repoRoot, 'record/proofs/closures'");
    expect(lifecycle).not.toContain('renameSync(source, destination)');
    expect(lifecycle).toContain('appendCloseState');

    const worktrees = read('packages/loop/src/loop/worktrees.ts');
    expect(worktrees).toContain("join(repoRoot, '.devai/worktrees')");
    expect(worktrees).not.toContain("join(repoRoot, 'scratch/worktrees')");
  });

  it('KR-R5-009 / BL-106 wires a prospective law-first and red-first sequence check', () => {
    const script = 'scripts/check-governed-sequencing.mjs';
    expect(existsSync(join(ROOT, script))).toBe(true);
    const pkg = json('package.json') as { scripts: Record<string, string> };
    expect(pkg.scripts['ci:sequencing']).toBe(`node ${script}`);
    expect(pkg.scripts['ci:governance']).toContain('pnpm run ci:sequencing');
  });

  it('KR-R5-010 / BL-176/177 records current commit-scoped reconciliation', () => {
    const path = 'work/rounds/R-0005/documentation-reconciliation.md';
    expect(existsSync(join(ROOT, path))).toBe(true);
    const reconciliation = read(path);
    expect(reconciliation).toContain('commit-scoped');
    expect(reconciliation).toContain('146-action base');
    expect(reconciliation).toContain('147-action exit');
    expect(reconciliation).toContain('54-schema base');
    expect(reconciliation).toContain('55-schema exit');
    for (const commit of ['12f67ed', '7ca26c4', 'c7dd9fb']) {
      expect(reconciliation).toContain(commit);
    }
  });

  it('KR-R5-011 / BL-178 binds the anti-skip contract to governed test sources', () => {
    const contract = read('tests/contract/r0004-governed-surface.red.contract.test.ts');
    expect(contract).toContain('CONDITIONAL_SKIP_SOURCE_ALLOWLIST');
    expect(contract).toContain('tests/e2e/bare-domain-help.e2e.test.ts');
    expect(contract).toContain('tests/integration/runtime-probe-data.integration.test.ts');
    expect(contract).toContain('expect(observedConditionalSkipSources).toEqual');
  });
});
