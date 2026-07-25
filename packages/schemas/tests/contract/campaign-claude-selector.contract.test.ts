// Invariants: INV-DEVAI-001
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { getValidator } from '../../src/index.js';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const ACTIVE_CAMPAIGN_INSTRUCTIONS = [
  'work/rounds/CAMPAIGN.md',
  'work/rounds/EXECUTION-CONTRACT.md',
  ...Array.from(
    { length: 9 },
    (_, index) => `work/rounds/R-${String(index + 2).padStart(4, '0')}/prompts/00-orchestrator.md`,
  ),
];

describe('Owner-selected Claude review model', () => {
  it('records the live Opus-only narrowing as an Owner mandate', () => {
    const mandate = readFileSync(join(ROOT, 'product/owner-mandates/OM-003.md'), 'utf8');
    const historicalMandate = readFileSync(
      join(ROOT, 'product/owner-mandates/OM-002.md'),
      'utf8',
    );
    const frontmatter = mandate.match(/^---\n([\s\S]*?)\n---\n/);

    expect(frontmatter).toBeTruthy();
    const metadata = parse(frontmatter?.[1] ?? '') as Record<string, unknown>;
    const validate = getValidator('record-meta.schema.json');
    expect(validate(metadata), JSON.stringify(validate.errors)).toBe(true);
    expect(metadata).toMatchObject({
      id: 'OM-003',
      type: 'mandate-rider',
      status: 'active',
      authority: 'Owner',
    });
    expect(mandate).toContain('Claude Opus 5');
    expect(mandate).toContain('claude-opus-5');
    expect(mandate).toContain('quota');
    expect(mandate).toContain('Historical Fable');
    expect(mandate).toContain('This rider narrows only OM-002’s Claude model selection');
    expect(mandate).toContain('Fable 5 is no longer an authorized selector');
    expect(historicalMandate).toContain('Claude Fable 5');
  });

  it.each(ACTIVE_CAMPAIGN_INSTRUCTIONS)(
    '%s selects literal Opus 5 with no fallback and contains no Fable selector',
    (path) => {
      const instruction = readFileSync(join(ROOT, path), 'utf8');

      expect(instruction).toContain('Claude Opus 5');
      expect(instruction).toContain('claude-opus-5');
      expect(instruction).toMatch(/no fallback/iu);
      expect(instruction).not.toMatch(/(?:Claude )?Fable 5|claude-fable-5/iu);
    },
  );
});
