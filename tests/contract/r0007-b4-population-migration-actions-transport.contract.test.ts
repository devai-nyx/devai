// Invariants: INV-DEVAI-001, INV-DEVAI-008, INV-DEVAI-017
// R-0007 B4 Inspector acceptance: reusable workflow I/O is explicit and
// artifact transport is bounded, digest-bound, locally verified, and non-authoritative.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'devai-r7-b4-actions-transport-'));

function yaml(relativePath: string): Record<string, unknown> {
  return parse(readFileSync(join(ROOT, relativePath), 'utf8')) as Record<string, unknown>;
}

function object(value: unknown): Record<string, unknown> {
  expect(value).not.toBeNull();
  expect(value).toBeTypeOf('object');
  expect(value).not.toBeInstanceOf(Array);
  return value as Record<string, unknown>;
}

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

describe('R-0007 B4 Actions reusable I/O and report transport', () => {
  it('R7-B4-POPULATION-MIGRATION-004 binds reusable workflow inputs and outputs explicitly', () => {
    const workflow = yaml('.github/workflows/reusable-evidence-gate.yml');
    const workflowCall = object(object(workflow.on).workflow_call);
    const inputs = object(workflowCall.inputs);
    const outputs = object(workflowCall.outputs);
    const verifyJob = object(object(workflow.jobs).verify);

    expect(Object.keys(inputs)).toEqual(['trusted-actors']);
    expect(inputs['trusted-actors']).toEqual(
      expect.objectContaining({ required: true, type: 'string' }),
    );
    expect(workflowCall.secrets).toBeUndefined();
    expect(outputs).toEqual({
      'evidence-mode': {
        description: expect.any(String),
        value: '${{ jobs.verify.outputs.evidence-mode }}',
      },
    });
    expect(verifyJob.outputs).toEqual({
      'evidence-mode': '${{ steps.verify.outputs.evidence_mode }}',
    });
    expect(JSON.stringify(workflow)).not.toContain('secrets.');
  });

  it('R7-B4-POPULATION-MIGRATION-005 executes bounded manifest creation and verifies every transported byte digest', () => {
    const reportDirectory = join(temporaryRoot, 'scratch/report');
    mkdirSync(reportDirectory, { recursive: true });
    const report = `${JSON.stringify({ result: 'PASS', authority: 'non-authoritative' })}\n`;
    writeFileSync(join(reportDirectory, 'execution.json'), report);

    const result = spawnSync(
      process.execPath,
      [
        join(ROOT, 'scripts/r7-ci-build-report.mjs'),
        '--directory',
        'scratch/report',
        '--summary',
        'summary.md',
        '--max-files',
        '8',
        '--max-bytes',
        '4096',
      ],
      {
        cwd: temporaryRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_SHA: 'a'.repeat(40),
          GITHUB_RUN_ID: '7007',
          GITHUB_RUN_ATTEMPT: '1',
        },
      },
    );
    expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);

    const manifest = readFileSync(join(reportDirectory, 'manifest.sha256'), 'utf8');
    const reportDigest = createHash('sha256').update(report).digest('hex');
    expect(manifest).toBe(`${reportDigest}  execution.json\n`);
    const transport = JSON.parse(
      readFileSync(join(reportDirectory, 'transport.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(transport).toMatchObject({
      authority: 'non-authoritative-transport',
      exact_candidate: 'a'.repeat(40),
      file_count: 1,
      manifest_sha256: createHash('sha256').update(manifest).digest('hex'),
      structured_reports: ['execution.json'],
      warning: expect.stringContaining('grant no verdict authority'),
      timings_ms: {
        local_artifact_digest_verification: expect.any(Number),
      },
    });

    writeFileSync(join(reportDirectory, 'execution.json'), `${report}tampered\n`);
    const tamperedDigest = createHash('sha256')
      .update(readFileSync(join(reportDirectory, 'execution.json')))
      .digest('hex');
    expect(tamperedDigest).not.toBe(reportDigest);
  });

  it('R7-B4-POPULATION-MIGRATION-006 retains reports for seven days only after digest construction', () => {
    const action = yaml('.github/actions/r7-report/action.yml');
    const steps = object(action.runs).steps as readonly Record<string, unknown>[];
    const buildIndex = steps.findIndex((step) =>
      String(step.run ?? '').includes('scripts/r7-ci-build-report.mjs'),
    );
    const uploadIndex = steps.findIndex((step) =>
      String(step.uses ?? '').startsWith('actions/upload-artifact@'),
    );
    expect(buildIndex).toBeGreaterThanOrEqual(0);
    expect(uploadIndex).toBeGreaterThan(buildIndex);
    const upload = steps[uploadIndex];
    if (upload === undefined) throw new Error('R7_B4_REPORT_UPLOAD_STEP_MISSING');
    expect(upload.uses).toMatch(/^actions\/upload-artifact@[0-9a-f]{40}$/u);
    expect(upload.with).toEqual(
      expect.objectContaining({
        'retention-days': 7,
        'if-no-files-found': 'error',
        overwrite: false,
      }),
    );
  });
});
