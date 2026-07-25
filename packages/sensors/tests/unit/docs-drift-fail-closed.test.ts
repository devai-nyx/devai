// Invariants: INV-DEVAI-001
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { senseDocsDrift } from '../../src/docs-drift.js';

const roots: string[] = [];

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-docs-drift-'));
  roots.push(root);
  mkdirSync(join(root, 'law/invariants'), { recursive: true });
  mkdirSync(join(root, '.devai/pin'), { recursive: true });
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('docs drift Constitution binding', () => {
  it('fails when the canonical Constitution is missing', () => {
    const reading = senseDocsDrift({ repoRoot: fixture(), claimFiles: [] });
    expect(reading.status).toBe('fail');
    expect(reading.findings).toContainEqual(
      expect.objectContaining({ code: 'DOCS_DRIFT_CONSTITUTION_NOT_FOUND' }),
    );
  });

  it('parses Candidate-version markers and detects pin drift', () => {
    const root = fixture();
    mkdirSync(join(root, 'law'), { recursive: true });
    writeFileSync(join(root, 'law/constitution.md'), '**Candidate version:** 1.0.0\n');
    writeFileSync(join(root, '.devai/pin/constitution.md'), '**Candidate version:** 0.9.0\n');

    const reading = senseDocsDrift({ repoRoot: root, claimFiles: [] });
    expect(reading.status).toBe('fail');
    expect(reading.findings).toContainEqual(
      expect.objectContaining({ code: 'DOCS_DRIFT_CONSTITUTION_VERSION' }),
    );
  });
});
