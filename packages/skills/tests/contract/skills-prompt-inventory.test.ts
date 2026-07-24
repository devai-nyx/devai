// R20.W1 matrix row 3 — static prompt-literal inventory (SUPPLEMENTAL
// provenance + the mechanical work order for W2 slice 3; the parity
// authority is the rendered-payload corpus, row 4). TS-AST scan: every
// template literal ≥120 chars in skill code (threshold lowered from 200
// at W1 capture: the monolith assembles prompts from smaller pieces — 9
// literals cleared 200 chars; the rendered-payload corpus remains the
// parity authority), attributed to the enclosing
// skill where determinable.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { listSkills } from '../../src/skills/index.js';
import {
  loadPromptIndex,
  loadSkillPrompt,
  loadWriterPrompts,
  promptAssetsRoot,
} from '../../src/skills/prompt-loader.js';
import { HERE, baseline, canonical, sha256 } from './r20-harness.js';

interface LiteralRecord {
  readonly file: string;
  readonly skill_id: string | null;
  readonly line_start: number;
  readonly line_end: number;
  readonly char_count: number;
  readonly sha256: string;
  readonly placeholder_names: string[];
}

interface TemplateProvenanceRecord {
  readonly source_file: string;
  readonly skill_id: string | null;
  readonly char_count: number;
  readonly sha256: string;
  readonly placeholder_names: string[];
  readonly source_literal: string;
}

function skillSourceFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(path);
    }
  };
  walk(root);
  return out.sort();
}

export function scanPromptLiterals(files: string[]): LiteralRecord[] {
  const out: LiteralRecord[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    // Track the nearest preceding skill id literal to attribute prompts.
    const skillIdAt: Array<{ pos: number; id: string }> = [];
    const collectIds = (node: ts.Node): void => {
      if (ts.isStringLiteral(node) && /^SKILL-[a-z0-9-]+$/.test(node.text)) {
        skillIdAt.push({ pos: node.getStart(), id: node.text });
      }
      ts.forEachChild(node, collectIds);
    };
    collectIds(sf);

    const visit = (node: ts.Node): void => {
      if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const raw = node.getText(sf);
        if (raw.length >= 120) {
          const start = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
          const placeholders = ts.isTemplateExpression(node)
            ? node.templateSpans.map((s) => s.expression.getText(sf))
            : [];
          const owner = [...skillIdAt].reverse().find((s) => s.pos <= node.getStart());
          out.push({
            file: file.split('/src/')[1] ?? file,
            skill_id: owner?.id ?? null,
            line_start: start,
            line_end: end,
            char_count: raw.length,
            sha256: sha256(raw),
            placeholder_names: placeholders,
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

// R20.W2 disposition (a) — Owner ruling on the W2 escalation (w2.log).
// The parity assertion is over prompt CONTENT, matching w1-matrix row 3's
// declared rule ("each hash reproducible from prompts/** + documented
// placeholder map; zero orphaned literals"). `scanPromptLiterals` still
// EMITS line_start/line_end — they remain the mechanical work order for
// slice 3 (prompts → data) — but they are position-dependent by
// construction: every W2 slice moves code out of index.ts and shifts them.
// Asserting them would fail slices 1–8 by design and assert strictly more
// than the contract, so they are projected out of the compared shape here.
// sha256 + char_count + placeholder_names + skill_id + file stay byte-exact.
type PromptContentRecord = Omit<
  ReturnType<typeof scanPromptLiterals>[number],
  'line_start' | 'line_end'
>;

function contentOnly(records: ReturnType<typeof scanPromptLiterals>): PromptContentRecord[] {
  return records.map(({ line_start: _ls, line_end: _le, ...rest }) => rest);
}

const NON_PROMPT_LITERAL_DISPOSITIONS = [
  {
    file: 'skills/impl/round.ts',
    skill_id: 'SKILL-compute-scorecard',
    char_count: 127,
    sha256: '5d0285608713dffb47acf28b56f0c4fc97c77b16ecb44d8cc9770d9b698d4148',
    placeholder_names: ["auditDir.replace(`${ctx.repoRoot}/`, '')"],
    rationale:
      'round-plan artifact description; it is returned as deterministic evidence and is never sent to an LLM',
  },
] as const;

describe('R20 baseline: static prompt-literal inventory (supplemental)', () => {
  it('content of ≥120-char template literals matches the baseline (spans emitted, not asserted)', () => {
    const root = resolve(HERE, '../../src/skills');
    const provenance = JSON.parse(
      readFileSync(join(promptAssetsRoot(), 'template-provenance.json'), 'utf8'),
    ) as { schema_version: string; templates: TemplateProvenanceRecord[] };
    expect(provenance.schema_version).toBe('1.0.0');
    for (const template of provenance.templates) {
      expect(template.source_literal.length).toBe(template.char_count);
      expect(sha256(template.source_literal)).toBe(template.sha256);
    }
    const records: PromptContentRecord[] = provenance.templates.map((template) => ({
      file: template.source_file,
      skill_id: template.skill_id,
      char_count: template.char_count,
      sha256: template.sha256,
      placeholder_names: template.placeholder_names,
    }));
    const knownHashes = new Set(provenance.templates.map((template) => template.sha256));
    const sourceRecords = scanPromptLiterals(skillSourceFiles(root));
    const orphaned = contentOnly(sourceRecords).filter((record) => !knownHashes.has(record.sha256));
    expect(orphaned).toEqual(
      NON_PROMPT_LITERAL_DISPOSITIONS.map(({ rationale: _rationale, ...record }) => record),
    );

    const current = canonical({
      count: records.length,
      records,
      non_prompt_literal_dispositions: NON_PROMPT_LITERAL_DISPOSITIONS,
    });
    const { expected } = baseline('prompt-inventory.json', current);
    expect(current).toBe(expected);
  });

  it('indexes every skill once and resolves every declared prompt asset', () => {
    const entries = loadPromptIndex();
    const ids = entries.map((entry) => entry.skill_id);
    expect(ids).toEqual(listSkills().map((skill) => skill.id));
    expect(new Set(ids).size).toBe(ids.length);

    const writerPrompts = loadWriterPrompts();
    for (const entry of entries) {
      if (entry.asset === null) {
        expect(entry.lifecycle).toBe('non-prompt-bearing');
        continue;
      }
      const [relativePath, fragment] = entry.asset.split('#');
      expect(relativePath).toBeDefined();
      expect(fragment).toBe(entry.skill_id);
      expect(existsSync(join(promptAssetsRoot(), relativePath ?? ''))).toBe(true);
      if (relativePath === 'writers.json') {
        expect(writerPrompts[entry.skill_id]).toBeDefined();
      } else {
        expect(loadSkillPrompt(entry.skill_id)).toBeDefined();
      }
    }
  });
});

// Invariants: INV-DEVAI-001, INV-DEVAI-008
