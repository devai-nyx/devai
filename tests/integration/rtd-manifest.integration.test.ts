import { describe, expect, it } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRtdManifest } from '../../packages/spec/src/rtd-manifest/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');

describe('buildRtdManifest', () => {
  it('produces a hash-stamped manifest over DEVAI itself', () => {
    const m = buildRtdManifest({
      repoRoot: REPO_ROOT,
      id: 'RTM-0001',
      integrationHead: '0'.repeat(40),
      now: '2026-05-13T00:00:00.000Z',
    });
    expect(m.schemaVersion).toBe('1.0.0');
    expect(m.id).toMatch(/^RTM-\d{4,}$/);
    expect(m.manifest_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(m.components.invariants).toBeDefined();
    expect(m.components.invariants?.count).toBeGreaterThan(5);
    expect(m.components.trace).toBeDefined();
    expect(m.components.adrs).toBeDefined();
    expect(m.components.forbidden_actions).toBeDefined();
    expect(m.readiness.ok).toBe(false);
    expect(
      m.readiness.sub_verdicts.filter((verdict) => !verdict.ok).map((verdict) => verdict.component),
    ).toEqual(['invariants']);
    expect(m.components.invariants?.errors?.join('\n')).toContain('.devai/config/domains.json');
  });

  it('manifest_hash is deterministic for the same inputs', () => {
    const a = buildRtdManifest({
      repoRoot: REPO_ROOT,
      id: 'RTM-0001',
      integrationHead: '0'.repeat(40),
      now: '2026-05-13T00:00:00.000Z',
    });
    const b = buildRtdManifest({
      repoRoot: REPO_ROOT,
      id: 'RTM-0002',
      integrationHead: '0'.repeat(40),
      now: '2026-05-13T00:00:00.000Z',
    });
    // ids differ (counter bumps), but the component hashes must match
    // because the input slices are identical.
    expect(a.components.invariants?.hash).toBe(b.components.invariants?.hash);
    expect(a.components.trace?.hash).toBe(b.components.trace?.hash);
    expect(a.components.adrs?.hash).toBe(b.components.adrs?.hash);
  });

  it('manifest validates against rtd-manifest.schema.json via @devai-nyx/schemas', async () => {
    const { validators } = await import('../../packages/schemas/src/index.js');
    const m = buildRtdManifest({
      repoRoot: REPO_ROOT,
      id: 'RTM-0001',
      integrationHead: '0'.repeat(40),
    });
    const ok = validators.rtdManifest(m);
    if (!ok) {
      throw new Error(
        'manifest failed schema validation: ' + JSON.stringify(validators.rtdManifest.errors),
      );
    }
    expect(ok).toBe(true);
  });

  it('readiness.ok is true iff every sub-verdict is ok', () => {
    const m = buildRtdManifest({
      repoRoot: REPO_ROOT,
      id: 'RTM-0001',
      integrationHead: '0'.repeat(40),
    });
    const allOk = m.readiness.sub_verdicts.every((v) => v.ok);
    expect(m.readiness.ok).toBe(allOk);
  });
});
// Invariants: INV-DEVAI-001
