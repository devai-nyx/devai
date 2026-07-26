import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Invariants: INV-DEVAI-017, INV-DEVAI-020

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const BIN = join(ROOT, 'packages/cli/dist/bin.js');
const DRIVER = join(ROOT, 'packages/cli/tests/fixtures/authorized-cli-test-driver.mjs');
const DISPOSITION = JSON.parse(
  readFileSync(join(ROOT, 'work/rounds/R-0004/surface-disposition.json'), 'utf8'),
) as {
  actions: { keep: { action_id: string }[]; fold: unknown[]; tombstone: unknown[] };
  sensors: { entries: { sensor_id: string; design_note_path: string }[] };
  packages: { fixed_group: string[] };
};

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8')) as unknown;
}

describe('R-0004 governed surface red-first contracts', () => {
  it('BL-008/016/028 derives action identity, effects, and generated views from one registry', () => {
    const registryPath = join(ROOT, 'law/policy/action-registry.json');
    const schemaPath = join(ROOT, 'law/schemas/action-registry.schema.json');
    expect(existsSync(registryPath)).toBe(true);
    expect(existsSync(schemaPath)).toBe(true);

    const registry = readJson('law/policy/action-registry.json') as {
      entries: { action_id: string; disposition: string }[];
    };
    expect(registry.entries.filter((entry) => entry.disposition === 'keep')).toHaveLength(146);
    expect(registry.entries.filter((entry) => entry.disposition === 'fold')).toHaveLength(38);
    expect(registry.entries.filter((entry) => entry.disposition === 'tombstone')).toHaveLength(1);

    for (const generated of [
      'packages/cli/src/generated/action-registry.ts',
      'packages/effects-check/src/generated/action-catalog.ts',
      'packages/sensors/src/generated/action-kinds.ts',
    ]) {
      expect(readFileSync(join(ROOT, generated), 'utf8')).toContain(
        '@generated from law/policy/action-registry.json',
      );
    }

    const manifest = readFileSync(join(ROOT, 'packages/cli/src/command-manifest.ts'), 'utf8');
    expect(manifest).not.toMatch(
      /const ACTION_EFFECTS|const PORCELAIN_PATHS|function canonicalPath/,
    );

    const effect = spawnSync(
      'node',
      [
        DRIVER,
        'policy',
        'check',
        'action',
        'effects',
        '--repo-root',
        ROOT,
        '--tsconfig',
        'tests/config/tsconfig.effects.json',
        '--format',
        'json',
      ],
      { cwd: ROOT, encoding: 'utf8' },
    );
    expect(effect.status, effect.stderr).toBe(0);
  }, 30_000);

  it('BL-009 exposes the complete recursive schema canon through policy check schemas', () => {
    expect(existsSync(join(ROOT, 'law/schemas/action-registry.schema.json'))).toBe(true);
    const result = spawnSync(
      'node',
      [BIN, 'policy', 'check', 'schemas', '--repo-root', ROOT, '--format', 'json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    expect(result.status, result.stderr).toBe(0);
    const output = JSON.parse(result.stdout) as {
      ok: boolean;
      canonical_total: number;
      rules: string[];
    };
    expect(output.ok).toBe(true);
    expect(output.canonical_total).toBeGreaterThanOrEqual(55);
    expect(output.rules).toEqual(
      expect.arrayContaining([
        'recursive-closed-complete-objects',
        'predicate-fragments-valid',
        'shared-vocabulary',
        'generated-marker-integrity',
        'dereferenced-publish-byte-identity',
      ]),
    );
  });

  it('BL-029 resolves all live sensor design notes and preserves diagnostic standing', () => {
    const registry = readJson('law/policy/sensor-registry.json') as {
      entries: {
        id: string;
        diagnostic?: boolean;
        design_note: { state: string; path: string | null; backlog_ref?: string };
      }[];
    };
    expect(registry.entries).toHaveLength(59);
    expect(registry.entries.filter((entry) => entry.diagnostic === true)).toHaveLength(9);
    for (const entry of registry.entries) {
      expect(entry.design_note.state).toBe('active');
      expect(entry.design_note.path).toBe(`law/policy/sensor-notes/${entry.id}.md`);
      expect(entry.design_note.backlog_ref).toBeUndefined();
      expect(existsSync(join(ROOT, entry.design_note.path ?? ''))).toBe(true);
    }
  });

  it('BL-027 routes leaf help to leaf metadata without granting authority', () => {
    const result = spawnSync('node', [BIN, 'init', 'apply-owner', '--help'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Apply the exact owner bootstrap segment');
    expect(result.stdout).toContain('--as-role <role>');
    expect(result.stdout).toContain('--write');
    expect(result.stdout).not.toContain('<command>');
    expect(existsSync(join(ROOT, '.devai/state/authority-sessions.json'))).toBe(false);
  });

  it('BL-025 creates an acyclic export-only core and exact eleven-member fixed group', () => {
    const coreManifestPath = join(ROOT, 'packages/core/package.json');
    const coreSourcePath = join(ROOT, 'packages/core/src/index.ts');
    expect(existsSync(coreManifestPath)).toBe(true);
    expect(existsSync(coreSourcePath)).toBe(true);
    const core = readJson('packages/core/package.json') as {
      name: string;
      private?: boolean;
      dependencies: Record<string, string>;
    };
    expect(core.name).toBe('@devai-nyx/core');
    expect(core.private).not.toBe(true);
    expect(Object.keys(core.dependencies).sort()).toEqual(
      DISPOSITION.packages.fixed_group.filter((name) => name !== '@devai-nyx/core').sort(),
    );
    expect(
      readFileSync(coreSourcePath, 'utf8')
        .trim()
        .split('\n')
        .every((line) => line.startsWith('export ')),
    ).toBe(true);
    const changesets = readJson('.changeset/config.json') as { fixed: string[][] };
    expect(changesets.fixed).toEqual([DISPOSITION.packages.fixed_group]);
  });

  it('BL-031 binds root build and test to exact non-recursive porcelain argv', () => {
    const root = readJson('package.json') as { scripts: Record<string, string> };
    expect(root.scripts.build).toBe(
      'pnpm devai:prepare && node packages/cli/dist/bin.js sense build --repo-root . --no-emit-reading',
    );
    expect(root.scripts.test).toBe(
      'pnpm devai:prepare && node packages/cli/dist/bin.js sense test all --repo-root . --no-emit-reading',
    );
    const build = readFileSync(join(ROOT, 'packages/cli/src/commands/sense/build.ts'), 'utf8');
    const test = readFileSync(join(ROOT, 'packages/cli/src/commands/sense/test.ts'), 'utf8');
    const runner = readFileSync(join(ROOT, 'packages/sensors/src/run-command.ts'), 'utf8');
    expect(build).not.toContain(".option('--command");
    expect(test).not.toContain(".option('--command");
    expect(`${build}\n${test}`).not.toMatch(/execSync|\bexec\(/);
    expect(runner).toContain('result.error !== undefined');
    expect(runner).toContain('exit_code: 127');
  });

  it('BL-030 keeps every public action and carries all folds and tombstones with migration', () => {
    expect(existsSync(join(ROOT, 'law/policy/action-registry.json'))).toBe(true);
    const registry = readJson('law/policy/action-registry.json') as {
      entries: { action_id: string; disposition: string; migration: string | null }[];
    };
    const keep = registry.entries.filter((entry) => entry.disposition === 'keep');
    expect(keep.map((entry) => entry.action_id).sort()).toEqual(
      DISPOSITION.actions.keep.map((entry) => entry.action_id).sort(),
    );
    expect(registry.entries.filter((entry) => entry.disposition === 'fold')).toHaveLength(
      DISPOSITION.actions.fold.length,
    );
    expect(registry.entries.filter((entry) => entry.disposition === 'tombstone')).toHaveLength(
      DISPOSITION.actions.tombstone.length,
    );
    expect(
      registry.entries
        .filter((entry) => entry.disposition !== 'keep')
        .every((entry) => typeof entry.migration === 'string' && entry.migration.length > 0),
    ).toBe(true);
  });

  it('BL-065/084 pins workflow actions, prewarms every job, and forbids optional required suites', () => {
    const workflows = readdirSync(join(ROOT, '.github/workflows')).filter((name) =>
      name.endsWith('.yml'),
    );
    for (const name of workflows) {
      const source = readFileSync(join(ROOT, '.github/workflows', name), 'utf8');
      for (const match of source.matchAll(
        /^\s*- uses: (actions\/(?:checkout|setup-node))@([^\s#]+)(.*)$/gmu,
      )) {
        expect(match[2]).toMatch(/^[0-9a-f]{40}$/u);
        expect(match[3]).toMatch(/# v[0-9]/u);
      }
      const jobs = source.split(/^ {2}[a-zA-Z0-9_-]+:\s*$/gmu).slice(1);
      for (const job of jobs.filter((body) => body.includes('pnpm install'))) {
        expect(job).toContain('node scripts/prewarm-package-managers.mjs');
      }
      expect(source).not.toMatch(/existsSync\([^)]*dist|test\.skip|if:\s*.*dist\//u);
    }
  });

  it('BL-080 derives repository-reference classification and byte order from disposition semantics', () => {
    const source = readFileSync(
      join(ROOT, 'scripts/generate-repository-reference-triage.mjs'),
      'utf8',
    );
    expect(source).toContain('law/policy/action-registry.json');
    expect(source).toContain('disposition');
    expect(source).not.toContain('localeCompare');
    expect(source).toContain('compareUtf8Bytes');
  });
});
