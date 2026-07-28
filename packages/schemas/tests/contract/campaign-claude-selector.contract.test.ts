// Invariants: INV-DEVAI-001
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { getValidator } from '../../src/index.js';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const ACTIVE_CAMPAIGN_INSTRUCTIONS = [
  'work/rounds/CAMPAIGN.md',
  ...[2, 3, 4, 7, 8, 9, 10].map(
    (round) => `work/rounds/R-${String(round).padStart(4, '0')}/prompts/00-orchestrator.md`,
  ),
];

const R0005_CODEX_INSTRUCTION = 'work/rounds/R-0005/prompts/00-orchestrator.md';
const R0006_CODEX_INSTRUCTIONS = [
  'work/rounds/EXECUTION-CONTRACT.md',
  'work/rounds/R-0006/prompts/00-orchestrator.md',
];

const BL017_RETIREMENT_INSTRUCTIONS = [
  'AGENTS.md',
  'CLAUDE.md',
  'work/rounds/CAMPAIGN.md',
  'work/rounds/EXECUTION-CONTRACT.md',
  'work/rounds/R-0003/plan.md',
  'work/rounds/R-0004/plan.md',
  'work/rounds/R-0005/plan.md',
  'work/rounds/R-0006/plan.md',
];

describe('Owner-selected Claude review model', () => {
  it('records the live Opus-only narrowing as an Owner mandate', () => {
    const mandate = readFileSync(join(ROOT, 'product/owner-mandates/OM-003.md'), 'utf8');
    const historicalMandate = readFileSync(join(ROOT, 'product/owner-mandates/OM-002.md'), 'utf8');
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

  it('applies the narrow OM-009 independent Codex-review exception only to R-0005', () => {
    const mandate = readFileSync(join(ROOT, 'product/owner-mandates/OM-009.md'), 'utf8');
    const instruction = readFileSync(join(ROOT, R0005_CODEX_INSTRUCTION), 'utf8');

    expect(mandate).toContain('For R-0005 only');
    expect(mandate).toContain('independent Codex');
    expect(instruction).toContain('independent Codex agent');
    expect(instruction).toContain('Do not call Claude');
    expect(instruction).not.toContain('claude-opus-5');
    expect(instruction).not.toMatch(/(?:Claude )?Fable 5|claude-fable-5/iu);
  });

  it('applies OM-013 independent Codex review only to R-0006', () => {
    const mandate = readFileSync(join(ROOT, 'product/owner-mandates/OM-013.md'), 'utf8');
    const frontmatter = mandate.match(/^---\n([\s\S]*?)\n---\n/);

    expect(frontmatter).toBeTruthy();
    const metadata = parse(frontmatter?.[1] ?? '') as Record<string, unknown>;
    const validate = getValidator('record-meta.schema.json');
    expect(validate(metadata), JSON.stringify(validate.errors)).toBe(true);
    expect(metadata).toMatchObject({
      id: 'OM-013',
      type: 'mandate-rider',
      status: 'active',
      authority: 'Owner',
    });
    expect(mandate).toContain('For R-0006 only');
    expect(mandate).toContain('independent Codex');
    expect(mandate).toContain('gpt-5.6-sol');

    for (const path of R0006_CODEX_INSTRUCTIONS) {
      const instruction = readFileSync(join(ROOT, path), 'utf8');
      expect(instruction).toContain('gpt-5.6-sol');
      expect(instruction).toMatch(/R-0006.only/isu);
      expect(instruction).not.toMatch(/(?:Claude )?Fable 5|claude-fable-5/iu);
    }

    const roundSixPrompt = readFileSync(join(ROOT, R0006_CODEX_INSTRUCTIONS[1] ?? ''), 'utf8');
    expect(roundSixPrompt).toMatch(/independent\s+Codex/u);
    expect(roundSixPrompt).not.toContain('claude-opus-5');
  });

  it.each(BL017_RETIREMENT_INSTRUCTIONS)(
    '%s contains no retired BL-017 red permission or R-0006 ownership',
    (path) => {
      const instruction = readFileSync(join(ROOT, path), 'utf8');
      expect(instruction).not.toMatch(
        /merged-coverage red is BL-017|Through R-0005|R-0006 must close|BL-017 is the release throttle|coverage remains red|fresh coverage red/iu,
      );
    },
  );

  it('removes BL-017 from R-0006 ownership and campaign scope', () => {
    const campaign = readFileSync(join(ROOT, 'work/rounds/CAMPAIGN.md'), 'utf8');
    const roundSix = readFileSync(join(ROOT, 'work/rounds/R-0006/plan.md'), 'utf8');
    expect(campaign).not.toMatch(/\| R-0006 \|[^|]*017/iu);
    expect(roundSix).not.toContain('BL-017');
  });

  it('binds the amended R-0002 plan digest in a later decision', () => {
    const plan = readFileSync(join(ROOT, 'work/rounds/R-0002/plan.md'));
    const digest = createHash('sha256').update(plan).digest('hex');
    const decisions = readFileSync(join(ROOT, 'law/register/DECISIONS.md'), 'utf8');
    expect(decisions).toContain(digest);
  });

  it('keeps prepared residual ownership aligned across the register, campaign, and plans', () => {
    const campaign = readFileSync(join(ROOT, 'work/rounds/CAMPAIGN.md'), 'utf8');
    const roundFour = readFileSync(join(ROOT, 'work/rounds/R-0004/plan.md'), 'utf8');
    const roundFive = readFileSync(join(ROOT, 'work/rounds/R-0005/plan.md'), 'utf8');
    for (const id of ['BL-065', 'BL-080', 'BL-084']) {
      expect(campaign).toContain(id);
      expect(roundFour).toContain(id);
    }
    expect(campaign).toContain('BL-063');
    expect(roundFive).toContain('BL-063');
  });

  it('pins the global formatting exclusion boundary', () => {
    const exclusions = readFileSync(join(ROOT, '.prettierignore'), 'utf8')
      .split(/\r?\n/u)
      .filter(Boolean);
    expect(exclusions).toEqual([
      'node_modules/',
      'dist/',
      'coverage/',
      'record/',
      'scratch/',
      '.devai/config/',
      '.devai/pin/',
      '.devai/worktrees/',
      '.claude/worktrees/',
      'pnpm-lock.yaml',
      'law/policy/authority-policy.json',
      'law/trace.json',
      'law/register/DECISIONS.md',
      'law/adr/predecessor/',
      'work/rounds/R-0001/',
      'work/rounds/R-0003/reviews/',
      'work/audit/R-0001/',
      'work/devai-ii-succession-dossier.md',
    ]);
  });
});
