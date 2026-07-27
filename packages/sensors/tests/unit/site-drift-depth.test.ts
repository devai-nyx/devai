// Invariants: INV-DEVAI-001, INV-DEVAI-012, INV-DEVAI-017
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ spawnSync: vi.fn() }));
vi.mock('@devai-nyx/authority', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@devai-nyx/authority')>()),
  spawnSync: mocks.spawnSync,
}));

import { senseSiteDrift } from '../../src/site-drift.js';

const H = '1'.repeat(40);
const P = '2'.repeat(40);
const S = '3'.repeat(40);
const T = '4'.repeat(40);

function response(status: number, stdout = '') {
  return { status, signal: null, stdout, stderr: '', error: undefined };
}

beforeEach(() => mocks.spawnSync.mockReset());

describe('site drift provenance depth', () => {
  it('returns UNKNOWN for missing head, publication ref, malformed message, and source', () => {
    mocks.spawnSync.mockReturnValueOnce(response(1));
    expect(senseSiteDrift({ repoRoot: '/fixture' }).findings?.[0]?.code).toBe(
      'SITE_DRIFT_HEAD_UNAVAILABLE',
    );

    mocks.spawnSync.mockReturnValueOnce(response(0, H)).mockReturnValueOnce(response(1));
    expect(senseSiteDrift({ repoRoot: '/fixture' }).findings?.[0]?.code).toBe(
      'SITE_DRIFT_PROVENANCE_UNAVAILABLE',
    );

    mocks.spawnSync
      .mockReturnValueOnce(response(0, H))
      .mockReturnValueOnce(response(0, P))
      .mockReturnValueOnce(response(0, 'wrong message'));
    expect(senseSiteDrift({ repoRoot: '/fixture' }).findings?.[0]?.code).toBe(
      'SITE_DRIFT_PROVENANCE_MALFORMED',
    );

    mocks.spawnSync
      .mockReturnValueOnce(response(0, H))
      .mockReturnValueOnce(response(0, P))
      .mockReturnValueOnce(response(0, `docs: publish from ${S}`))
      .mockReturnValueOnce(response(1));
    expect(senseSiteDrift({ repoRoot: '/fixture' }).findings?.[0]?.code).toBe(
      'SITE_DRIFT_SOURCE_UNREACHABLE',
    );
  });

  it('returns UNKNOWN when the published source is not ancestral', () => {
    mocks.spawnSync
      .mockReturnValueOnce(response(0, H))
      .mockReturnValueOnce(response(0, P))
      .mockReturnValueOnce(response(0, `docs: publish from ${S}`))
      .mockReturnValueOnce(response(0, S))
      .mockReturnValueOnce(response(1));
    expect(senseSiteDrift({ repoRoot: '/fixture' }).findings?.[0]?.code).toBe(
      'SITE_DRIFT_SOURCE_NON_ANCESTRAL',
    );
  });

  it('reports package, release, and published-input drift from local Git provenance', () => {
    mocks.spawnSync.mockImplementation((_command?: string, args?: readonly string[]) => {
      if (args === undefined) return response(0);
      const key = args.join(' ');
      if (key === 'rev-parse --verify HEAD^{commit}') return response(0, H);
      if (key === 'rev-parse --verify refs/remotes/origin/gh-pages^{commit}') return response(0, P);
      if (key === `show -s --format=%B ${P}`) return response(0, `docs: publish from ${S}`);
      if (key === `rev-parse --verify ${S}^{commit}`) return response(0, S);
      if (key.startsWith('merge-base --is-ancestor')) return response(0);
      if (key === `ls-tree -r --name-only ${S}` || key === `ls-tree -r --name-only ${H}`) {
        return response(0, 'package.json\npackages/a/package.json');
      }
      if (key === `show ${S}:package.json`) return response(0, '{"version":"1.0.0"}');
      if (key === `show ${H}:package.json`) return response(0, '{"version":"2.0.0"}');
      if (key.endsWith(':packages/a/package.json')) return response(0, '{"version":"1.0.0"}');
      if (key === 'tag --list') return response(0, 'v2.0.0\nnot-a-package-tag');
      if (key === 'rev-parse --verify v2.0.0^{commit}') return response(0, T);
      if (key.startsWith('log --format= --name-only')) {
        return response(0, 'README.md\nROOT.md\nsrc/ignored.ts\nREADME.md');
      }
      if (key === `show ${H}:docs/_ia/categories.json`) {
        return response(0, '{"rootFileAllowlist":[{"source":"ROOT.md"},{"source":1}]}');
      }
      return response(1);
    });
    const reading = senseSiteDrift({ repoRoot: '/fixture', now: '2026-07-27T00:00:00.000Z' });
    expect(reading).toMatchObject({
      status: 'fail',
      metrics: {
        package_version_drift_count: 1,
        package_release_count: 1,
        published_input_count: 2,
      },
    });
    expect(reading.findings?.map((finding) => finding.code)).toEqual([
      'SITE_DRIFT_PACKAGE_VERSION',
      'SITE_DRIFT_PACKAGE_RELEASE',
      'SITE_DRIFT_PUBLISHED_INPUT',
      'SITE_DRIFT_PUBLISHED_INPUT',
    ]);
  });

  it('passes when the publication is current and tolerates unavailable or malformed optional data', () => {
    for (const manifest of [undefined, '{']) {
      mocks.spawnSync.mockImplementation((_command?: string, args?: readonly string[]) => {
        if (args === undefined) return response(0);
        const key = args.join(' ');
        if (key === 'rev-parse --verify HEAD^{commit}') return response(0, H);
        if (key === 'rev-parse --verify refs/remotes/origin/gh-pages^{commit}')
          return response(0, P);
        if (key === `show -s --format=%B ${P}`) return response(0, `docs: publish from ${S}`);
        if (key === `rev-parse --verify ${S}^{commit}`) return response(0, S);
        if (key.startsWith('merge-base --is-ancestor')) return response(0);
        if (key.startsWith('ls-tree') || key === 'tag --list') {
          return response(key.startsWith('ls-tree') ? 1 : 0, '');
        }
        if (key.startsWith('log ')) {
          return response(0, 'src/ignored.ts');
        }
        if (key === `show ${H}:docs/_ia/categories.json`) {
          return manifest === undefined ? response(1) : response(0, manifest);
        }
        return response(1);
      });
      expect(senseSiteDrift({ repoRoot: '/fixture' }).status).toBe('pass');
      mocks.spawnSync.mockReset();
    }
  });
});
