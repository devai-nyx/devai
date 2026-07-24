import { getWriterPromptSpec } from '../writers/prompts.js';
import type { SkillEntry } from '../types.js';

interface WriterSpec {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly outPath: string;
  readonly entry: string;
  readonly promptGlobal: string;
  readonly promptRole: string;
  /** Soft word cap for the markdown body; pass null to omit. */
  readonly wordBudget: number | null;
  readonly extraTags?: readonly string[];
}

function makeWriterSkill(spec: WriterSpec): SkillEntry {
  return {
    manifest: {
      schemaVersion: '1.0.0',
      id: spec.id,
      title: spec.title,
      version: '1.0.0',
      summary: spec.summary,
      kind: 'command',
      authority_role: 'architect',
      deterministic: false,
      llm_backed: true,
      default_family: 'claude',
      agent_class: 'review-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      // P2.8: writers write the doc body (spec.outPath) AND, when
      // freeze is engaged (P2.7), the frozen prompt composition at
      // record/proofs/work/skill-runs/<id>/frozen.json. Both scopes declared
      // explicitly so a future firewall tightener can enforce them.
      allowed_write_scopes: [spec.outPath, `record/proofs/work/skill-runs/${spec.id}/**`],
      evidence_files: [`record/proofs/work/skill-runs/${spec.id}/*.json`],
      risk_level: 'low',
      tags: ['phase-17', 'phase-17-F', 'brownfield', 'writer', 'llm', ...(spec.extraTags ?? [])],
      entry: spec.entry,
    },
    async run(ctx) {
      const { runWriterSkill } = await import('../writers/write-helper.js');
      return runWriterSkill({
        skillId: spec.id,
        defaultOutPath: spec.outPath,
        promptGlobal: spec.promptGlobal,
        promptRole: spec.promptRole,
        wordBudget: spec.wordBudget,
        ctx,
      });
    },
  };
}

// =====================================================================
// P1 writer-prompt refactor + P3.13 extraction:
//
// Before P1: every writer carried a near-identical promptGlobal that
// re-stated the response envelope + word cap + no-invent rule, and
// every writer's promptRole was the same DO_NOT_INVENT constant.
//
// After P1: promptGlobal carries only the writer-specific instructions
// (sections, structure, what to count). The response envelope +
// no-invent posture move into OUTPUT_CONTRACT_INSTRUCTION (shared,
// in write-helper.ts). The word cap moves into spec.wordBudget so
// the constraint is data, not prose. promptRole carries the
// per-writer persona — staff engineer, db engineer, security
// engineer, etc.
//
// After P3.13: the role personas and the per-writer global +
// wordBudget triple live in writers/prompts.ts (WRITER_PROMPTS).
// This file consumes them via getWriterPromptSpec(skillId). Prompt
// edits land as diffs in prompts.ts, not buried in this 1800-line
// manifest registry.
// =====================================================================

/**
 * Manifest-half of a writer-skill registration. P3.13 splits each
 * writer record into:
 *   - this file: the manifest data (id, title, summary, outPath,
 *     entry, optional extra tags)
 *   - writers/prompts.ts: the prompt data (promptGlobal, promptRole,
 *     wordBudget) keyed by skill id
 *
 * The two halves rejoin via getWriterPromptSpec(spec.id) inside
 * makeWriterSkillFromManifest.
 */
interface WriterManifestSpec {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly outPath: string;
  readonly entry: string;
  readonly extraTags?: readonly string[];
}

function makeWriterSkillFromManifest(spec: WriterManifestSpec): SkillEntry {
  const prompt = getWriterPromptSpec(spec.id);
  return makeWriterSkill({
    id: spec.id,
    title: spec.title,
    summary: spec.summary,
    outPath: spec.outPath,
    entry: spec.entry,
    promptGlobal: prompt.promptGlobal,
    promptRole: prompt.promptRole,
    wordBudget: prompt.wordBudget,
    ...(spec.extraTags !== undefined && { extraTags: spec.extraTags }),
  });
}

const skillWriteOverview = makeWriterSkillFromManifest({
  id: 'SKILL-write-overview',
  title: 'Write Overview.md from inventory sensor bodies',
  summary:
    'Synthesize a brownfield Overview document from inventory sensor outputs (api/routes/data-model/coverage/intro). LLM-backed; writes docs/Overview.md.',
  outPath: 'docs/Overview.md',
  entry: 'devai docs synthesize overview',
});

const skillWriteSoftwareStack = makeWriterSkillFromManifest({
  id: 'SKILL-write-software-stack',
  title: 'Write Software Stack.md from inventory sensor bodies',
  summary:
    'Synthesize a Software Stack document listing detected languages, frameworks, package managers, DB dialect, and runtime assumptions.',
  outPath: 'docs/Software Stack.md',
  entry: 'devai docs synthesize software-stack',
});

const skillWriteArchitectureGuide = makeWriterSkillFromManifest({
  id: 'SKILL-write-architecture-guide',
  title: 'Write Architecture Guide.md from inventory sensor bodies',
  summary:
    'Synthesize an Architecture Guide describing top-level layout, module boundaries, and dep-graph structure.',
  outPath: 'docs/Architecture Guide.md',
  entry: 'devai docs synthesize architecture-guide',
});

const skillWriteDatabaseReference = makeWriterSkillFromManifest({
  id: 'SKILL-write-database-reference',
  title: 'Write Database Reference.md from inventory_data_model',
  summary:
    'Synthesize a Database Reference document enumerating tables, columns (with types), primary keys, and foreign-key relationships.',
  outPath: 'docs/Database Reference.md',
  entry: 'devai docs synthesize database-reference',
  extraTags: ['db'],
});

const skillWriteErd = makeWriterSkillFromManifest({
  id: 'SKILL-write-erd',
  title: 'Write ERD.md from inventory_data_model',
  summary:
    'Synthesize an Entity-Relationship Diagram document with a Mermaid erDiagram block derived from the data-model inventory.',
  outPath: 'docs/ERD.md',
  entry: 'devai docs synthesize erd',
  extraTags: ['erd', 'mermaid'],
});

const skillWriteApiMap = makeWriterSkillFromManifest({
  id: 'SKILL-write-api-map',
  title: 'Write API Map.md from inventory_api',
  summary:
    'Synthesize an API Map document listing every backend endpoint discovered, grouped by controller.',
  outPath: 'docs/API Map.md',
  entry: 'devai docs synthesize api-map',
});

const skillWriteFrontendRoutesMap = makeWriterSkillFromManifest({
  id: 'SKILL-write-frontend-routes-map',
  title: 'Write Frontend Routes Map.md from inventory_routes',
  summary:
    'Synthesize a Frontend Routes Map document listing every frontend route discovered, with parent/child nesting.',
  outPath: 'docs/Frontend Routes Map.md',
  entry: 'devai docs synthesize frontend-routes-map',
});

const skillWriteRbacMatrix = makeWriterSkillFromManifest({
  id: 'SKILL-write-rbac-matrix',
  title: 'Write RBAC Matrix.md from inventory_rbac',
  summary:
    'Synthesize an RBAC Matrix document listing roles, permissions, and the discovered RBAC ILF tables.',
  outPath: 'docs/RBAC Matrix.md',
  entry: 'devai docs synthesize rbac-matrix',
  extraTags: ['rbac', 'security'],
});

const skillWriteComplianceLgpd = makeWriterSkillFromManifest({
  id: 'SKILL-write-compliance-lgpd',
  title: 'Write Compliance (LGPD).md from inventory_data_handling',
  summary:
    'Synthesize an LGPD compliance document listing every PII-classified column with its pii_class, legal_basis (if set), and retention (if set).',
  outPath: 'docs/Compliance (LGPD).md',
  entry: 'devai docs synthesize compliance-lgpd',
  extraTags: ['lgpd', 'compliance', 'pii'],
});

// P3.11 (Option B): GDPR + CCPA sibling skills join the compliance
// writer family. The three share the
// data-handling sensor inputs but differ in regime-specific
// classification (Article 9 / Art. 6 lawful basis for GDPR; CCPA
// category-letter mapping + CPRA sensitive-PI flag for CCPA) and in
// what they surface as gaps. INV-INVENTORY-002 is the shared
// hard-fail gate for all three.
const skillWriteComplianceGdpr = makeWriterSkillFromManifest({
  id: 'SKILL-write-compliance-gdpr',
  title: 'Write Compliance (GDPR).md from inventory_data_handling',
  summary:
    'Synthesize a GDPR compliance document (EU Reg. 2016/679) listing every PII-classified column with its pii_class, Article 6 lawful_basis, inferred Article 9 special-category flag, and retention. Surfaces schema-uncaptured gaps (data-subject rights, cross-border transfers, DPIA triggers) honestly.',
  outPath: 'docs/Compliance (GDPR).md',
  entry: 'devai docs synthesize compliance-gdpr',
  extraTags: ['gdpr', 'compliance', 'pii'],
});

const skillWriteComplianceCcpa = makeWriterSkillFromManifest({
  id: 'SKILL-write-compliance-ccpa',
  title: 'Write Compliance (CCPA).md from inventory_data_handling',
  summary:
    'Synthesize a CCPA / CPRA compliance document (California Civ. Code §1798.100 et seq.) listing every PII-classified column with its pii_class, inferred CCPA category letter (A-K per §1798.140(v)), inferred CPRA sensitive-PI flag, and retention. Surfaces schema-uncaptured gaps (collection sources, business purposes, sales / sharing disclosures, opt-out mechanisms) honestly.',
  outPath: 'docs/Compliance (CCPA).md',
  entry: 'devai docs synthesize compliance-ccpa',
  extraTags: ['ccpa', 'cpra', 'compliance', 'pii'],
});

const skillWriteFpReport = makeWriterSkillFromManifest({
  id: 'SKILL-write-fp-report',
  title: 'Write Function Point Report.md from inventory bodies',
  summary:
    'Synthesize an IFPUG-flavored Function Point Report from the api + routes + data-model inventories. Generous-counting policy per redox tradition.',
  outPath: 'docs/Function Point Report.md',
  entry: 'devai docs synthesize fp-report',
  extraTags: ['fp', 'ifpug'],
});

const skillWriteThreatModel = makeWriterSkillFromManifest({
  id: 'SKILL-write-threat-model',
  title: 'Write Security Threat Model.md from inventory bodies',
  summary:
    'Synthesize a STRIDE-flavored threat model document anchored to the discovered api + routes + rbac + data-handling inventories.',
  outPath: 'docs/Security Threat Model.md',
  entry: 'devai docs synthesize threat-model',
  extraTags: ['security', 'threat-model'],
});

const skillWriteOnboarding = makeWriterSkillFromManifest({
  id: 'SKILL-write-onboarding',
  title: 'Write Onboarding Quickstart.md from inventory bodies',
  summary:
    'Synthesize an Onboarding Quickstart document — first-week reading list + 30-minute checkout-to-running-tests instructions.',
  outPath: 'docs/Onboarding Quickstart.md',
  entry: 'devai docs synthesize onboarding',
  extraTags: ['onboarding'],
});

// =====================================================================
// Phase 18.F (D-59): scaffolder skill family — deterministic generators
// for the forward-generation substrate. Six template-driven scaffolders
// emit DB/API/UI/tests/docs/CI artifacts from a module-blueprint via
// the runScaffolder helper. NO LLM in any of these — generators run
// from data, not prose. Plus one optional LLM-backed planner skill.
//
// Per D-59 consequence #2 (deterministic scaffolders, locked).
// =====================================================================

export const writerSkills: readonly SkillEntry[] = [
  skillWriteOverview,
  skillWriteSoftwareStack,
  skillWriteArchitectureGuide,
  skillWriteDatabaseReference,
  skillWriteErd,
  skillWriteApiMap,
  skillWriteFrontendRoutesMap,
  skillWriteRbacMatrix,
  skillWriteComplianceLgpd,
  skillWriteComplianceGdpr,
  skillWriteComplianceCcpa,
  skillWriteFpReport,
  skillWriteThreatModel,
  skillWriteOnboarding,
];
