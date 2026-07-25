import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const TRIAGE_RELATIVE = 'work/rounds/R-0002/repository-reference-triage.json';
const TRIAGE = join(ROOT, TRIAGE_RELATIVE);
const successorRef = ['devai-nyx', 'devai'].join('/');
const referencePattern = new RegExp(`${successorRef}(?:-original)?`, 'g');
const classifications = [
  'active-successor',
  'frozen-predecessor',
  'historical-label',
  'package-metadata',
  'generated-output',
  'dead-reference',
] as const;

interface ReferenceDisposition {
  readonly locator: string;
  readonly classification: (typeof classifications)[number];
  readonly action: 'retain' | 'rebind' | 'regenerate' | 'remove';
  readonly rationale: string;
}

function trackedReferenceLocators(): string[] {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
    .toString('utf8')
    .split('\0')
    .filter((path) => path.length > 0 && path !== TRIAGE_RELATIVE);
  const locators: string[] = [];
  for (const path of files) {
    let content: string;
    try {
      content = readFileSync(join(ROOT, path), 'utf8');
    } catch {
      continue;
    }
    for (const [lineIndex, line] of content.split('\n').entries()) {
      referencePattern.lastIndex = 0;
      for (const match of line.matchAll(referencePattern)) {
        locators.push(
          `${path}:${String(lineIndex + 1)}:${String((match.index ?? 0) + 1)}:${match[0]}`,
        );
      }
    }
  }
  return locators.sort();
}

describe('repository-name reference triage', () => {
  it('classifies every committed post-rename reference exactly once', () => {
    expect(existsSync(TRIAGE), 'BL-047 requires a committed semantic reference map').toBe(true);
    if (!existsSync(TRIAGE)) return;
    const report = JSON.parse(readFileSync(TRIAGE, 'utf8')) as {
      schemaVersion: string;
      references: ReferenceDisposition[];
    };
    expect(report.schemaVersion).toBe('1.0.0');
    expect(new Set(report.references.map((reference) => reference.locator)).size).toBe(
      report.references.length,
    );
    for (const reference of report.references) {
      expect(classifications).toContain(reference.classification);
      expect(reference.rationale.length, reference.locator).toBeGreaterThan(0);
    }
    expect(report.references.map((reference) => reference.locator).sort()).toEqual(
      trackedReferenceLocators(),
    );
  });
});
// Invariants: INV-DEVAI-001
