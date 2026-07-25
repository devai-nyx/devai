// Invariants: INV-DEVAI-016, INV-DEVAI-018
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BUILT_IN_FORBIDDEN_PATHS,
  resolveLocalEvidencePolicy,
} from '../../src/local-evidence/config.js';
import {
  collectLocalEvidence,
  type LocalEvidenceManifest,
} from '../../src/local-evidence/collect.js';
import { computeSourceHash } from '../../src/local-evidence/source-hash.js';
import {
  LocalEvidenceError,
  normalizeActorList,
  parseTrailerPath,
  verifyLocalEvidence,
  type VerifyContext,
} from '../../src/local-evidence/verify.js';
import { withAuthorityHostTestScope } from '../../../skills/tests/unit/authority-host-test-scope.js';

const roots: string[] = [];
const NOW = new Date('2026-07-24T12:00:00.000Z');
const MANIFEST = 'record/proofs/work/local-evidence/local-ci.json';

function put(root: string, relativePath: string, contents: string): string {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return path;
}

function root(): string {
  const repo = mkdtempSync(join(tmpdir(), 'devai-local-evidence-'));
  roots.push(repo);
  execFileSync('git', ['init', '-q'], { cwd: repo });
  return repo;
}

function policy(
  repo: string,
  overrides: Record<string, unknown> = {},
): void {
  put(
    repo,
    '.devai/config/project.json',
    JSON.stringify({
      ci_economy: {
        local_evidence: {
          manifest_path: MANIFEST,
          max_age_hours: 24,
          required_jobs: ['unit', 'contract'],
          allowed_platforms: ['linux/amd64'],
          forbidden_paths: ['product/'],
          require_docker: true,
          ...overrides,
        },
      },
    }),
  );
}

function initialize(repo: string): void {
  policy(repo);
  put(
    repo,
    'package.json',
    JSON.stringify({ packageManager: 'pnpm@10.0.0', engines: { node: '>=24.0.0' } }),
  );
  put(repo, 'src/index.ts', 'export const value = 1;\n');
  for (const job of ['unit', 'contract']) {
    put(
      repo,
      `artifacts/${job}/metadata.txt`,
      [
        `job=${job}`,
        'platform=linux/amd64',
        'node=v24.7.0',
        'pnpm=10.0.0',
        'docker=28.0.0',
        'docker_compose=2.0.0',
        'ignored-line',
        '',
      ].join('\n'),
    );
    put(repo, `artifacts/${job}/nested/result.txt`, `${job}: pass\n`);
  }
  execFileSync('git', ['add', '.devai/config/project.json', 'package.json', 'src/index.ts'], {
    cwd: repo,
  });
}

function context(overrides: Partial<VerifyContext> = {}): VerifyContext {
  return {
    eventName: 'push',
    ref: 'refs/heads/main',
    actor: 'trusted',
    headMessage: `test: evidence\n\nLocal-CI-Evidence: ${MANIFEST}`,
    changedFiles: ['src/index.ts'],
    ...overrides,
  };
}

async function collected(repo: string): Promise<LocalEvidenceManifest> {
  return withAuthorityHostTestScope(
    () =>
      collectLocalEvidence({
        repoRoot: repo,
        jobDirs: { unit: 'artifacts/unit', contract: 'artifacts/contract' },
        now: NOW,
      }).manifest,
  );
}

function writeManifest(repo: string, manifest: unknown): void {
  put(repo, MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

afterEach(() => {
  for (const repo of roots.splice(0)) rmSync(repo, { recursive: true, force: true });
});

describe('local evidence policy and collection', () => {
  it('resolves absent, malformed, incomplete, defaulted, and extended policies fail-closed', () => {
    const repo = root();
    expect(resolveLocalEvidencePolicy(repo)).toBeNull();
    put(repo, '.devai/config/project.json', '{');
    expect(resolveLocalEvidencePolicy(repo)).toBeNull();
    put(repo, '.devai/config/project.json', JSON.stringify({ ci_economy: {} }));
    expect(resolveLocalEvidencePolicy(repo)).toBeNull();
    policy(repo, { required_jobs: [] });
    expect(resolveLocalEvidencePolicy(repo)).toBeNull();
    policy(repo, {
      max_age_hours: undefined,
      allowed_platforms: [],
      require_docker: false,
    });
    expect(resolveLocalEvidencePolicy(repo)).toMatchObject({
      maxAgeHours: 24,
      allowedPlatforms: ['linux/arm64', 'linux/amd64'],
      requireDocker: false,
    });
    expect(resolveLocalEvidencePolicy(repo)?.forbiddenPaths).toEqual([
      ...BUILT_IN_FORBIDDEN_PATHS,
      'product/',
    ]);
  });

  it('rejects missing policy, required jobs, artifact dirs, metadata, and job identity', async () => {
    const repo = root();
    await withAuthorityHostTestScope(() => {
      expect(() => collectLocalEvidence({ repoRoot: repo, jobDirs: {} })).toThrow(
        /no local-evidence policy/,
      );
    });
    initialize(repo);
    await withAuthorityHostTestScope(() => {
      expect(() => collectLocalEvidence({ repoRoot: repo, jobDirs: {} })).toThrow(
        /required job: unit/,
      );
      expect(() =>
        collectLocalEvidence({
          repoRoot: repo,
          jobDirs: { unit: 'absent', contract: 'artifacts/contract' },
        }),
      ).toThrow(/artifact directory does not exist/);
    });
    rmSync(join(repo, 'artifacts/unit'), { recursive: true });
    mkdirSync(join(repo, 'artifacts/unit'));
    await withAuthorityHostTestScope(() => {
      expect(() =>
        collectLocalEvidence({
          repoRoot: repo,
          jobDirs: { unit: 'artifacts/unit', contract: 'artifacts/contract' },
        }),
      ).toThrow(/missing local CI metadata/);
    });
    put(repo, 'artifacts/unit/metadata.txt', 'job=wrong\nplatform=linux/amd64\n');
    await withAuthorityHostTestScope(() => {
      expect(() =>
        collectLocalEvidence({
          repoRoot: repo,
          jobDirs: { unit: 'artifacts/unit', contract: 'artifacts/contract' },
        }),
      ).toThrow(/contain job=unit/);
    });
  });

  it('collects deterministic nested artifacts, tools, platforms, and an override output', async () => {
    const repo = root();
    initialize(repo);
    const result = await withAuthorityHostTestScope(() =>
      collectLocalEvidence({
        repoRoot: repo,
        jobDirs: { unit: 'artifacts/unit', contract: 'artifacts/contract' },
        outputPath: 'proofs/override.json',
        now: NOW,
      }),
    );
    expect(result.outputPath).toBe('proofs/override.json');
    expect(result.manifest.generatedAt).toBe(NOW.toISOString());
    expect(result.manifest.sourceHash.fileCount).toBe(3);
    expect(result.manifest.jobs['unit']?.artifactChecksum.fileCount).toBe(2);
    expect(result.manifest.tools).toMatchObject({
      node: { expected: '>=24.0.0', observed: ['v24.7.0'] },
      pnpm: { expected: '10.0.0', observed: ['10.0.0'] },
      docker: { observed: ['28.0.0'] },
      dockerCompose: { observed: ['2.0.0'] },
    });
    expect(result.manifest.platforms).toEqual(['linux/amd64']);
    expect(JSON.parse(readFileSync(join(repo, result.outputPath), 'utf8'))).toEqual(
      result.manifest,
    );
  });

  it('hashes tracked bytes deterministically, honors exclusions, and records deletions', async () => {
    const repo = root();
    initialize(repo);
    const first = await withAuthorityHostTestScope(() => computeSourceHash(repo, ['artifacts']));
    const second = await withAuthorityHostTestScope(() =>
      computeSourceHash(repo, ['artifacts/']),
    );
    expect(second).toEqual(first);
    unlinkSync(join(repo, 'src/index.ts'));
    const deleted = await withAuthorityHostTestScope(() =>
      computeSourceHash(repo, ['artifacts']),
    );
    expect(deleted.fileCount).toBe(first.fileCount);
    expect(deleted.value).not.toBe(first.value);
  });
});

describe('local evidence verification', () => {
  it('parses trailers and actor lists and returns non-claim outcomes', () => {
    expect(parseTrailerPath('subject\nLocal-CI-Evidence: proof.json\n')).toBe('proof.json');
    expect(parseTrailerPath('no trailer')).toBe('');
    expect(normalizeActorList(' alice,bob; carol\n alice ')).toEqual([
      'alice',
      'bob',
      'carol',
      'alice',
    ]);

    const repo = root();
    expect(
      verifyLocalEvidence({
        repoRoot: repo,
        mode: 'auto',
        context: context({ eventName: 'pull_request', headMessage: '' }),
      }),
    ).toMatchObject({ outcome: 'pr-disabled', evidenceMode: false });
    expect(
      verifyLocalEvidence({
        repoRoot: repo,
        mode: 'gate',
        context: context({ eventName: 'workflow_dispatch', headMessage: '' }),
      }),
    ).toMatchObject({ outcome: 'no-claim', evidenceMode: false });
    expect(
      verifyLocalEvidence({
        repoRoot: repo,
        mode: 'auto',
        context: context({ eventName: 'workflow_dispatch', headMessage: '' }),
      }).message,
    ).toBe('normal CI is required');
  });

  it('accepts strict verification and a trusted main-push claim', async () => {
    const repo = root();
    initialize(repo);
    await collected(repo);
    await withAuthorityHostTestScope(() => {
      expect(
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'strict',
          context: context({ changedFiles: null }),
          now: NOW.getTime(),
        }),
      ).toMatchObject({ outcome: 'strict-valid', evidenceMode: false });
      expect(
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'gate',
          context: context(),
          trustedActors: ['trusted'],
          now: NOW.getTime(),
        }),
      ).toMatchObject({ outcome: 'evidence-valid', evidenceMode: true });
    });
  });

  it('rejects absent policy, mismatched trailers, missing and malformed manifests', async () => {
    const repo = root();
    await expect(
      withAuthorityHostTestScope(() =>
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'strict',
          context: context(),
        }),
      ),
    ).rejects.toThrow(/no local-evidence policy/);
    expect(() =>
      verifyLocalEvidence({
        repoRoot: repo,
        mode: 'gate',
        context: context(),
        trustedActors: ['trusted'],
      }),
    ).toThrow(/declares no.*policy/);

    initialize(repo);
    expect(() =>
      verifyLocalEvidence({
        repoRoot: repo,
        mode: 'gate',
        context: context({ headMessage: 'Local-CI-Evidence: wrong.json' }),
        trustedActors: ['trusted'],
      }),
    ).toThrow(/must point/);
    await withAuthorityHostTestScope(() => {
      expect(() =>
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'strict',
          context: context(),
        }),
      ).toThrow(/missing evidence manifest/);
    });
    put(repo, MANIFEST, '{');
    await withAuthorityHostTestScope(() => {
      expect(() =>
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'strict',
          context: context(),
        }),
      ).toThrow(/not valid JSON/);
    });
    writeManifest(repo, { schemaVersion: 1 });
    await withAuthorityHostTestScope(() => {
      expect(() =>
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'strict',
          context: context(),
        }),
      ).toThrow(/schema validation/);
    });
  });

  it('rejects every schema-valid policy, age, hash, tool, job, trust, and path mismatch', async () => {
    const repo = root();
    initialize(repo);
    const baseline = await collected(repo);

    const cases: Array<{
      name: string;
      mutate: (manifest: LocalEvidenceManifest) => unknown;
      error: RegExp;
    }> = [
      {
        name: 'lax age policy',
        mutate: (m) => ({ ...m, policy: { ...m.policy, maxAgeHours: 25 } }),
        error: /exceeds declared/,
      },
      {
        name: 'missing required job policy',
        mutate: (m) => ({
          ...m,
          policy: { ...m.policy, requiredJobs: ['unit'] },
        }),
        error: /missing declared job/,
      },
      {
        name: 'undeclared platform policy',
        mutate: (m) => ({
          ...m,
          policy: { ...m.policy, allowedPlatforms: ['linux/amd64', 'darwin/arm64'] },
        }),
        error: /allows undeclared platform/,
      },
      {
        name: 'future timestamp',
        mutate: (m) => ({ ...m, generatedAt: '2026-07-24T12:10:01.000Z' }),
        error: /in the future/,
      },
      {
        name: 'stale timestamp',
        mutate: (m) => ({ ...m, generatedAt: '2026-07-22T00:00:00.000Z' }),
        error: /manifest is stale/,
      },
      {
        name: 'source digest',
        mutate: (m) => ({
          ...m,
          sourceHash: { ...m.sourceHash, value: 'f'.repeat(64) },
        }),
        error: /source hash mismatch/,
      },
      {
        name: 'source file count',
        mutate: (m) => ({
          ...m,
          sourceHash: { ...m.sourceHash, fileCount: m.sourceHash.fileCount + 1 },
        }),
        error: /source file count mismatch/,
      },
      {
        name: 'node major',
        mutate: (m) => ({
          ...m,
          tools: { ...m.tools, node: { observed: ['v23.1.0'] } },
        }),
        error: /node versions/,
      },
      {
        name: 'package manager version',
        mutate: (m) => ({
          ...m,
          tools: { ...m.tools, pnpm: { observed: ['9.0.0'] } },
        }),
        error: /pnpm versions/,
      },
      {
        name: 'docker evidence',
        mutate: (m) => {
          const { docker: _docker, ...tools } = m.tools;
          return { ...m, tools };
        },
        error: /docker version/,
      },
      {
        name: 'job metadata',
        mutate: (m) => ({
          ...m,
          jobs: {
            ...m.jobs,
            unit: {
              ...m.jobs['unit']!,
              metadata: { ...m.jobs['unit']!.metadata, job: 'other' },
            },
          },
        }),
        error: /metadata does not match/,
      },
      {
        name: 'job platform',
        mutate: (m) => ({
          ...m,
          jobs: {
            ...m.jobs,
            unit: {
              ...m.jobs['unit']!,
              metadata: { ...m.jobs['unit']!.metadata, platform: 'darwin/arm64' },
            },
          },
        }),
        error: /disallowed platform/,
      },
    ];

    await withAuthorityHostTestScope(() => {
      for (const testCase of cases) {
        writeManifest(repo, testCase.mutate(baseline));
        expect(
          () =>
            verifyLocalEvidence({
              repoRoot: repo,
              mode: 'strict',
              context: context(),
              now: NOW.getTime(),
            }),
          testCase.name,
        ).toThrow(testCase.error);
      }
      writeManifest(repo, baseline);
      for (const [actor, trustedActors, error] of [
        ['', ['trusted'], /requires a GitHub actor/],
        ['trusted', [], /trusted-actor allowlist/],
        ['intruder', ['trusted'], /actor is not trusted/],
      ] as const) {
        expect(() =>
          verifyLocalEvidence({
            repoRoot: repo,
            mode: 'gate',
            context: context({ actor }),
            trustedActors,
            now: NOW.getTime(),
          }),
        ).toThrow(error);
      }
      expect(() =>
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'gate',
          context: context({ changedFiles: null }),
          trustedActors: ['trusted'],
          now: NOW.getTime(),
        }),
      ).toThrow(/unable to determine changed files/);
      expect(() =>
        verifyLocalEvidence({
          repoRoot: repo,
          mode: 'gate',
          context: context({ changedFiles: ['product/roadmap.md', '.github/workflows/ci.yml'] }),
          trustedActors: ['trusted'],
          now: NOW.getTime(),
        }),
      ).toThrow(LocalEvidenceError);
    });
  });
});
