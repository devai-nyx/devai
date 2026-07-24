import { describe, expect, it } from 'vitest';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRtdManifest } from '../../src/rtd-manifest/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(dirname(dirname(dirname(HERE))));

describe('R29 currentness behavior', () => {
  it('binds RTD journey evidence to the canonical product journey directory', () => {
    const manifest = buildRtdManifest({
      repoRoot: REPO_ROOT,
      id: 'RTM-2900',
      integrationHead: '0'.repeat(40),
      now: '2026-07-22T00:00:00.000Z',
    });

    expect(manifest.components.journeys).toBeDefined();
    expect(manifest.components.journeys?.count).toBeGreaterThan(0);
  });
});

// Invariants: INV-DEVAI-001, INV-DEVAI-002, INV-DEVAI-008
