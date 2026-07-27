// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-018, INV-DEVAI-020
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import { cac } from 'cac';
import { checkDependencies } from '../../src/commands/check/dependencies.js';
import { checkDocsGovernance } from '../../src/commands/check/docs-governance.js';
import { detect, planPublish } from '../../src/commands/docs/publish.js';
import {
  classifyScenario,
  loadScenarios,
  type MutationScenario,
} from '../../src/commands/mutation/run.js';
import { renderMatrix } from '../../src/commands/render/matrix.js';
import { withAuthorityHostTestScope } from '../../../authority/tests/unit/authority-host-test-scope.js';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-r6-depth-'));
  temporaryRoots.push(root);
  return root;
}

function write(path: string, value: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, value);
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('governed command depth', () => {
  it('evaluates complete and malformed docs-governance repositories', async () => {
    const root = temporaryRoot();
    write(
      join(root, '.devai/config/project.json'),
      JSON.stringify({
        repo: { kind: 'application' },
        docs: { builder: 'jekyll', build_command: 'git --version' },
      }),
    );
    write(join(root, 'docs/site/_config.yml'), 'title: Fixture\n');
    write(join(root, 'docs/site/Gemfile'), "source 'https://rubygems.org'\n");
    write(
      join(root, 'law/adr/ADR-DOCS-BUILDER-OPT-OUT.md'),
      '# Rationale\nfixture\n# Reviewer\nInspector\n# Date\n2026-07-27\n# Sunset\nwhen replaced\n',
    );
    write(join(root, '.github/workflows/publish.yml'), 'uses: actions/deploy-pages@v4\n');

    const report = await withAuthorityHostTestScope(() =>
      checkDocsGovernance({ repoRoot: root, noPublishCheck: true }),
    );
    expect(report.verdict).toBe('fail');
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'docs-governance.opt-out-adr-required',
          severity: 'pass',
        }),
        expect.objectContaining({ ruleId: 'docs-governance.site-dir-shape', severity: 'pass' }),
        expect.objectContaining({ ruleId: 'docs-governance.no-ci-publish', severity: 'fail' }),
      ]),
    );

    write(join(root, '.devai/config/project.json'), '{');
    const malformed = await withAuthorityHostTestScope(() =>
      checkDocsGovernance({ repoRoot: root, noPublishCheck: true }),
    );
    expect(malformed.fail_count).toBeGreaterThan(0);
    expect(malformed.findings[0]).toMatchObject({ severity: 'fail' });
  });

  it('detects docs publishing configuration and produces a recursive dry-run plan', async () => {
    const root = temporaryRoot();
    write(
      join(root, '.devai/config/project.json'),
      JSON.stringify({
        repo: { kind: 'library' },
        docs: {
          builder: 'docusaurus',
          build_command: 'true',
          output_dir: 'site-output',
          custom_domain: 'docs.example.test',
          gh_pages_branch: 'pages',
        },
      }),
    );
    write(join(root, 'site-output/index.html'), '<h1>fixture</h1>');
    write(join(root, 'site-output/assets/app.js'), 'export {};\n');

    const detected = detect(root);
    expect(detected).toMatchObject({
      kind: 'library',
      builder: 'docusaurus',
      build_command: 'true',
      gh_pages_branch: 'pages',
      custom_domain: 'docs.example.test',
    });
    const plan = await withAuthorityHostTestScope(() =>
      planPublish(
        root,
        detected,
        { status: 0, stdout: '', stderr: '', output_dir_abs: join(root, 'site-output') },
        'fixture publish',
      ),
    );
    expect(plan).toMatchObject({
      branch: 'pages',
      commit_message: 'fixture publish',
      file_count: 2,
      cname: 'docs.example.test',
    });
    expect(plan.total_bytes).toBeGreaterThan(0);

    write(
      join(root, '.devai/config/project.json'),
      JSON.stringify({ repo: { kind: 'library' }, docs: { builder: 'jekyll' } }),
    );
    expect(() => detect(root)).toThrow('library repos MUST use docusaurus');
  });

  it('aggregates both dependency universes and fails closed on unavailable evidence', () => {
    const root = temporaryRoot();
    const fixture = join(root, 'scan.json');
    write(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    write(join(root, 'docs/site/package-lock.json'), '{"lockfileVersion":3}\n');
    write(
      fixture,
      JSON.stringify({
        schemaVersion: '1.0.0',
        scanner: {
          name: 'devai-test-scanner',
          version: '1.0.0',
          database_updated_at: '2026-07-27T10:00:00.000Z',
        },
        generated_at: '2026-07-27T10:00:00.000Z',
        advisories: [],
        waivers: [],
      }),
    );
    const result = checkDependencies({
      repoRoot: root,
      now: '2026-07-27T12:00:00.000Z',
      environment: {
        NODE_ENV: 'test',
        DEVAI_TEST_PNPM_DEPENDENCY_SCAN_FIXTURE: fixture,
        DEVAI_TEST_NPM_DEPENDENCY_SCAN_FIXTURE: fixture,
      },
    });
    expect(result).toMatchObject({
      status: 'pass',
      universes: [{ ecosystem: 'pnpm' }, { ecosystem: 'npm' }],
    });

    expect(
      checkDependencies({
        repoRoot: root,
        environment: { NODE_ENV: 'test', DEVAI_TEST_DEPENDENCY_SCANNER_UNAVAILABLE: '1' },
      }),
    ).toMatchObject({ status: 'unknown', findings: [{ code: 'DEPENDENCY_SCANNER_UNAVAILABLE' }] });

    rmSync(join(root, 'docs/site/package-lock.json'));
    const incomplete = checkDependencies({
      repoRoot: root,
      now: '2026-07-27T12:00:00.000Z',
      environment: {
        NODE_ENV: 'test',
        DEVAI_TEST_PNPM_DEPENDENCY_SCAN_FIXTURE: fixture,
        DEVAI_TEST_NPM_DEPENDENCY_SCAN_FIXTURE: fixture,
      },
    });
    expect(incomplete).toMatchObject({ status: 'unknown' });
  });

  it('loads mutation scenarios deterministically and checks declared expectations', () => {
    const root = temporaryRoot();
    const validPath = join(root, 'valid.json');
    const duplicatePath = join(root, 'duplicate.json');
    const malformedPath = join(root, 'malformed.json');
    const scenario: MutationScenario = {
      schema_version: '1.0.0',
      id: 'MS-FIXTURE-001',
      kind: 'mutation',
      target: { file: 'packages/example/src/index.ts' },
      mutations: [{ type: 'string-replace', find: 'true', replace: 'false' }],
      expectations: [{ assertion: 'tests-detect', specs: ['fixture'] }],
    };
    write(validPath, JSON.stringify(scenario));
    write(duplicatePath, JSON.stringify(scenario));
    write(malformedPath, '{');
    const validator = new Ajv2020().compile({ type: 'object' });
    const loaded = loadScenarios([validPath, duplicatePath, malformedPath], validator, {
      strict: true,
    });
    expect(loaded.scenarios).toHaveLength(1);
    expect(loaded.errors).toHaveLength(2);
    expect(classifyScenario(scenario, 'Killed')).toEqual({ ok: true });
    expect(classifyScenario(scenario, 'Survived')).toMatchObject({ ok: false });
    expect(
      classifyScenario(
        { ...scenario, expectations: [{ assertion: 'tests-tolerate', specs: ['fixture'] }] },
        'Survived',
      ),
    ).toEqual({ ok: true });
  });

  it('renders matrix records through the actual command handler', async () => {
    const root = temporaryRoot();
    const input = join(root, 'results');
    write(
      join(input, 'unit.json'),
      JSON.stringify({
        id: 'TR-FIXTURE-UNIT',
        scope: 'fixture',
        tier: 'unit',
        status: 'pass',
        timestamp: '2026-07-27T12:00:00.000Z',
        metrics: { passed: 4, failed: 0, duration_ms: 250 },
      }),
    );
    write(
      join(input, 'coverage.json'),
      JSON.stringify({
        id: 'TR-FIXTURE-COVERAGE',
        scope: 'fixture',
        tier: 'coverage',
        status: 'pass',
        timestamp: '2026-07-27T12:00:00.000Z',
        metrics: { coverage_pct: { lines: 75 } },
      }),
    );
    write(
      join(root, '.devai/config/test-matrix.json'),
      JSON.stringify({ tiers: ['unit', 'coverage'], scopes_include: ['fixture'] }),
    );
    write(join(root, '.devai/config/thresholds.json'), JSON.stringify({ coverage: { lines: 70 } }));

    const output = join(root, 'reports/matrix.html');
    const priorExitCode = process.exitCode;
    process.exitCode = undefined;
    await withAuthorityHostTestScope(async () => {
      const cli = cac('devai-test');
      renderMatrix.register(cli);
      cli.parse(
        [
          'node',
          'devai-test',
          'render-matrix',
          '--repo-root',
          root,
          '--in',
          'results',
          '--out',
          'reports/matrix.html',
          '--format',
          'html',
          '--view',
          'timings',
          '--include-thresholds',
          '--strict',
        ],
        { run: false },
      );
      await cli.runMatchedCommand();
    });
    expect(process.exitCode).toBe(0);
    process.exitCode = priorExitCode;
    expect(readFileSync(output, 'utf8')).toContain('<table>');
    expect(readFileSync(output, 'utf8')).toContain('75.0% / req 70.0%');
  });
});
