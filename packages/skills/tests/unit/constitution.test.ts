import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildConstitutionBindingPlan,
  computeConstitutionPin,
  parseConstitutionVersion,
  sha256Text,
  verifyConstitutionBinding,
} from '../../src/constitution/index.js';

const SAMPLE_TEXT = `# DEVAI Constitution\n\n**Version:** 0.3.0\n**Status:** ratified for implementation\n\nBody text.\n`;

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'devai-constitution-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('parseConstitutionVersion', () => {
  it('extracts the version from the standard header', () => {
    expect(parseConstitutionVersion(SAMPLE_TEXT)).toBe('0.3.0');
  });

  it('returns null when no version header is present', () => {
    expect(parseConstitutionVersion('# Some other doc\n\nNo version here.\n')).toBeNull();
  });
});

describe('sha256Text / computeConstitutionPin', () => {
  it('sha256Text is deterministic', () => {
    expect(sha256Text(SAMPLE_TEXT)).toBe(sha256Text(SAMPLE_TEXT));
    expect(sha256Text(SAMPLE_TEXT)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('computeConstitutionPin pairs version + sha256', () => {
    const pin = computeConstitutionPin(SAMPLE_TEXT);
    expect(pin).toEqual({ version: '0.3.0', sha256: sha256Text(SAMPLE_TEXT) });
  });

  it('computeConstitutionPin returns null when the version cannot be parsed', () => {
    expect(computeConstitutionPin('no version here')).toBeNull();
  });
});

describe('verifyConstitutionBinding', () => {
  it('reports not-ok when no pin and no vendored copy exist', () => {
    const status = verifyConstitutionBinding(dir);
    expect(status.ok).toBe(false);
    expect(status.hasPin).toBe(false);
    expect(status.hasVendoredCopy).toBe(false);
    expect(status.errors.length).toBeGreaterThan(0);
  });

  function writeVendoredCopy(text: string): void {
    mkdirSync(join(dir, '.devai/pin'), { recursive: true });
    writeFileSync(join(dir, '.devai/pin/constitution.md'), text);
  }

  function writePin(version: string, sha256: string): void {
    mkdirSync(join(dir, '.devai/config'), { recursive: true });
    writeFileSync(
      join(dir, '.devai/config/project.json'),
      JSON.stringify({
        schemaVersion: '1.0.0',
        project_type: 'runtime-host',
        constitution: { version, sha256 },
      }),
    );
  }

  it('reports ok when the pin matches the vendored copy exactly', () => {
    writeVendoredCopy(SAMPLE_TEXT);
    writePin('0.3.0', sha256Text(SAMPLE_TEXT));
    const status = verifyConstitutionBinding(dir);
    expect(status.ok).toBe(true);
    expect(status.versionMatches).toBe(true);
    expect(status.shaMatches).toBe(true);
    expect(status.errors).toEqual([]);
  });

  it('reports not-ok when the pinned sha256 does not match the vendored copy (tamper/stale)', () => {
    writeVendoredCopy(SAMPLE_TEXT);
    writePin('0.3.0', 'f'.repeat(64));
    const status = verifyConstitutionBinding(dir);
    expect(status.ok).toBe(false);
    expect(status.shaMatches).toBe(false);
    expect(status.errors.some((e) => e.includes('sha256'))).toBe(true);
  });

  it('reports not-ok when the pinned version does not match the vendored copy version', () => {
    writeVendoredCopy(SAMPLE_TEXT);
    writePin('0.2.0', sha256Text(SAMPLE_TEXT));
    const status = verifyConstitutionBinding(dir);
    expect(status.ok).toBe(false);
    expect(status.versionMatches).toBe(false);
  });

  it('reports not-ok (no pin) when only a vendored copy exists', () => {
    writeVendoredCopy(SAMPLE_TEXT);
    const status = verifyConstitutionBinding(dir);
    expect(status.ok).toBe(false);
    expect(status.hasPin).toBe(false);
    expect(status.hasVendoredCopy).toBe(true);
  });
});

describe('buildConstitutionBindingPlan', () => {
  it('self case: symlinks to ../law/constitution.md and writes no pin', () => {
    mkdirSync(join(dir, 'law'), { recursive: true });
    writeFileSync(join(dir, 'law/constitution.md'), SAMPLE_TEXT);
    const plan = buildConstitutionBindingPlan(dir, '0.2.1');
    expect(plan.pointerFile.symlink_target).toBe('../law/constitution.md');
    expect(plan.pin).toBeUndefined();
    expect(plan.rootFile).toBeUndefined();
  });

  it('adopter case: vendors a root copy + pin when canonical text resolves', () => {
    // The running @devai-nyx/skills package is inside DEVAI's workspace,
    // so resolveCanonicalConstitution() resolves via the workspace-root
    // rung in this test environment — exercising the real resolution path.
    const plan = buildConstitutionBindingPlan(dir, '0.2.1');
    expect(plan.rootFile?.path).toBe('.devai/pin/constitution.md');
    expect(plan.rootFile?.content.length).toBeGreaterThan(0);
    expect(plan.pin?.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(plan.pin?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(plan.pointerFile.symlink_target).toBeUndefined();
    expect(plan.pointerFile.content).toContain('# See pin/constitution.md');
  });
});
// Invariants: INV-DEVAI-001
