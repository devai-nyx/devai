import { mkdirSync, writeFileSync } from '@devai-nyx/authority';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Blueprint } from '@devai-nyx/spec';
import { composePrompt } from '@devai-nyx/loop';
import {
  createLlmClient,
  messagesFromComposition,
  metaFromComposition,
  responseSchemaForMutatingSkill,
} from '../../llm/index.js';
import type { StackAdapterPack } from '../../pack-resolver/index.js';
import { loadSkillPrompt } from '../prompt-loader.js';
import type { SkillEntry } from '../types.js';

interface ScaffolderManifestSpec {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly authority_role: 'engineer' | 'inspector' | 'architect';
  readonly allowed_write_scopes: readonly string[];
  readonly templateIds: readonly string[];
  readonly extraTags?: readonly string[];
  readonly deriveTasks: (
    blueprint: Blueprint,
    pack: StackAdapterPack,
    moduleSlug: string,
  ) => readonly { template_id: string; target_path: string }[];
}

function makeScaffolderSkill(spec: ScaffolderManifestSpec): SkillEntry {
  return {
    manifest: {
      schemaVersion: '1.0.0',
      id: spec.id,
      title: spec.title,
      version: '1.0.0',
      summary: spec.summary,
      kind: 'command',
      authority_role: spec.authority_role,
      deterministic: true,
      llm_backed: false,
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      allowed_write_scopes: [
        ...spec.allowed_write_scopes,
        `record/proofs/work/skill-runs/${spec.id}/**`,
      ],
      evidence_files: [`record/proofs/work/skill-runs/${spec.id}/*.json`],
      risk_level: 'medium',
      tags: ['phase-18', 'phase-18-F', 'scaffold', 'deterministic', ...(spec.extraTags ?? [])],
      entry: `devai agent skill run ${spec.id}`,
    },
    async run(ctx) {
      const { runScaffolder } = await import('../scaffolders/run-scaffolder.js');
      return runScaffolder({
        spec: {
          skillId: spec.id,
          templateIds: spec.templateIds,
          deriveTasks: spec.deriveTasks,
        },
        ctx,
      });
    },
  };
}

const skillScaffoldDb = makeScaffolderSkill({
  id: 'SKILL-scaffold-db',
  title: 'Scaffold DB migrations + seeds from a module blueprint',
  summary:
    'Deterministic scaffolder: consumes a module-blueprint, renders DB templates (migration.sql + seed.sql) from the matched stack-adapter pack, writes under domain/<module-slug>/db/. No LLM. Idempotent.',
  authority_role: 'engineer',
  allowed_write_scopes: ['domain/*/db/**'],
  templateIds: ['db.migration', 'db.seed'],
  extraTags: ['db'],
  deriveTasks: (_bp, _pack, moduleSlug) => [
    { template_id: 'db.migration', target_path: `domain/${moduleSlug}/db/migration.sql` },
    { template_id: 'db.seed', target_path: `domain/${moduleSlug}/db/seed.sql` },
  ],
});

const skillScaffoldApi = makeScaffolderSkill({
  id: 'SKILL-scaffold-api',
  title:
    'Scaffold NestJS module + controller + service + DTOs + entity + companions from a module blueprint',
  summary:
    'Deterministic scaffolder: renders the API-tier templates (module / per-entity entity, controller, service, DTOs; per-module policy guard + policy decorator) from the matched stack-adapter pack. Writes under domain/<module-slug>/api/src/. No LLM. Idempotent. Phase 22.E (D-A-15) widened to emit companion files + bind DTO fields to blueprint entity fields.',
  authority_role: 'engineer',
  allowed_write_scopes: ['domain/*/api/src/**'],
  templateIds: [
    'api.module',
    'api.controller',
    'api.service',
    'api.dto.create',
    'api.dto.update',
    'api.entity',
    'api.guard.policy',
    'api.decorator.policy',
  ],
  extraTags: ['api'],
  deriveTasks: (bp, _pack, moduleSlug) => {
    const tasks: {
      template_id: string;
      target_path: string;
      extra_tokens?: Record<string, string>;
    }[] = [
      {
        template_id: 'api.module',
        target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/${moduleSlug}.module.ts`,
      },
      // Phase 22.E: per-module companion files (guard, decorator).
      // Emitted once per module (not per entity) since they share
      // policy state across the module's endpoints.
      {
        template_id: 'api.guard.policy',
        target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/guards/policy.guard.ts`,
      },
      {
        template_id: 'api.decorator.policy',
        target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/decorators/policy.decorator.ts`,
      },
    ];
    for (const entity of bp.database.entities) {
      const kebab = entityKebabName(entity.name);
      // Phase 22.E: pre-render entity field tokens so DTO + entity
      // templates substitute real blueprint fields instead of the
      // pre-22.E hardcoded `message` / `recipient` placeholders.
      const entityTokens = buildEntityScaffoldTokens(entity);
      tasks.push(
        {
          template_id: 'api.controller',
          target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/controllers/${kebab}.controller.ts`,
        },
        {
          template_id: 'api.service',
          target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/services/${kebab}.service.ts`,
        },
        {
          template_id: 'api.entity',
          target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/entities/${kebab}.entity.ts`,
          extra_tokens: entityTokens,
        },
        {
          template_id: 'api.dto.create',
          target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/dto/create-${kebab}.dto.ts`,
          extra_tokens: entityTokens,
        },
        {
          template_id: 'api.dto.update',
          target_path: `domain/${moduleSlug}/api/src/${moduleSlug}/dto/update-${kebab}.dto.ts`,
          extra_tokens: entityTokens,
        },
      );
    }
    return tasks;
  },
});

const skillScaffoldUi = makeScaffolderSkill({
  id: 'SKILL-scaffold-ui',
  title: 'Scaffold Angular feature module + components from a module blueprint',
  summary:
    'Deterministic scaffolder: renders the UI-tier templates (feature module, per-entity list + detail components, service) from the matched stack-adapter pack. Writes under domain/<module-slug>/web/src/. No LLM.',
  authority_role: 'engineer',
  allowed_write_scopes: ['domain/*/web/src/**'],
  templateIds: ['ui.module', 'ui.list-component', 'ui.detail-component', 'ui.service'],
  extraTags: ['ui', 'frontend'],
  deriveTasks: (bp, _pack, moduleSlug) => {
    const tasks: { template_id: string; target_path: string }[] = [
      {
        template_id: 'ui.module',
        target_path: `domain/${moduleSlug}/web/src/app/${moduleSlug}/${moduleSlug}.module.ts`,
      },
    ];
    for (const entity of bp.database.entities) {
      const kebab = entityKebabName(entity.name);
      tasks.push(
        {
          template_id: 'ui.list-component',
          target_path: `domain/${moduleSlug}/web/src/app/${moduleSlug}/${kebab}-list.component.ts`,
        },
        {
          template_id: 'ui.detail-component',
          target_path: `domain/${moduleSlug}/web/src/app/${moduleSlug}/${kebab}-detail.component.ts`,
        },
        {
          template_id: 'ui.service',
          target_path: `domain/${moduleSlug}/web/src/app/${moduleSlug}/${kebab}.service.ts`,
        },
      );
    }
    return tasks;
  },
});

const skillScaffoldTests = makeScaffolderSkill({
  id: 'SKILL-scaffold-tests',
  title: 'Scaffold per-entity controller + service test stubs from a module blueprint',
  summary:
    'Deterministic scaffolder: renders test-stub templates from the matched stack-adapter pack. Writes per-entity spec files under domain/<module-slug>/api/test/. Inspector authority. No LLM.',
  authority_role: 'inspector',
  allowed_write_scopes: ['domain/*/api/test/**', 'domain/*/**/*.spec.ts'],
  templateIds: ['tests.controller-spec', 'tests.service-spec'],
  extraTags: ['tests'],
  deriveTasks: (bp, _pack, moduleSlug) => {
    const tasks: { template_id: string; target_path: string }[] = [];
    for (const entity of bp.database.entities) {
      const kebab = entityKebabName(entity.name);
      tasks.push(
        {
          template_id: 'tests.controller-spec',
          target_path: `domain/${moduleSlug}/api/test/${kebab}.controller.spec.ts`,
        },
        {
          template_id: 'tests.service-spec',
          target_path: `domain/${moduleSlug}/api/test/${kebab}.service.spec.ts`,
        },
      );
    }
    return tasks;
  },
});

const skillScaffoldDocs = makeScaffolderSkill({
  id: 'SKILL-scaffold-docs',
  title: 'Scaffold module README + ADR from a module blueprint',
  summary:
    'Deterministic scaffolder: renders module-level docs templates (README, ADR-0001) from the matched stack-adapter pack. Writes under domain/<module-slug>/docs/. Architect authority. No LLM.',
  authority_role: 'architect',
  allowed_write_scopes: ['domain/*/docs/**'],
  templateIds: ['docs.readme', 'docs.adr'],
  extraTags: ['docs'],
  deriveTasks: (_bp, _pack, moduleSlug) => [
    { template_id: 'docs.readme', target_path: `domain/${moduleSlug}/docs/README.md` },
    { template_id: 'docs.adr', target_path: `domain/${moduleSlug}/docs/ADR-0001.md` },
  ],
});

const skillScaffoldCi = makeScaffolderSkill({
  id: 'SKILL-scaffold-ci',
  title: 'Scaffold per-module CI workflow from a module blueprint',
  summary:
    'Deterministic scaffolder: renders the CI workflow template from the matched stack-adapter pack. Writes a single per-module workflow file under .github/workflows/. No LLM.',
  authority_role: 'engineer',
  allowed_write_scopes: ['.github/workflows/module-*.yml'],
  templateIds: ['ci.workflow'],
  extraTags: ['ci'],
  deriveTasks: (_bp, _pack, moduleSlug) => [
    { template_id: 'ci.workflow', target_path: `.github/workflows/module-${moduleSlug}.yml` },
  ],
});

// Local-only entity-kebab helper for the deriveTasks closures (avoids
// pulling the templates module import-graph into skills/index.ts).
function entityKebabName(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

/**
 * Phase 22.E (closes D-A-15): per-entity field-token renderer for
 * the SKILL-scaffold-api templates. Pre-renders three token bodies
 * the API templates use, replacing the pre-22.E hardcoded
 * `message`/`recipient` placeholders:
 *
 *   __ENTITY_TS_FIELDS__       — fields for the plain-TS entity
 *   __DTO_FIELDS_CREATE__      — class-validator fields for the
 *                                create DTO (required + nullable
 *                                semantics preserved)
 *   __DTO_FIELDS_UPDATE__      — same fields all-optional for PATCH
 *
 * Audit fields (`id`, `created_at`, `updated_at`, `deleted_at`,
 * `created_by`, `updated_by`) are excluded — they're managed by
 * the data layer, not by request payloads.
 *
 * SQL-type → TypeScript-type mapping is best-effort; unrecognized
 * types render as `unknown` with no validator decorator (the
 * scaffold is template-shaped per D-59, not production-ready).
 */
const AUDIT_FIELD_NAMES: ReadonlySet<string> = new Set([
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
]);

interface FieldTypeShape {
  readonly tsType: string;
  readonly validators: readonly string[];
}

function mapSqlTypeToTs(sqlType: string): FieldTypeShape {
  const lower = sqlType.toLowerCase().trim();
  // varchar(N), char(N), text, citext, name → string
  const varcharMatch = lower.match(/^(?:var)?char\s*\(\s*(\d+)\s*\)/);
  if (varcharMatch !== null) {
    const max = varcharMatch[1];
    return {
      tsType: 'string',
      validators: ['@IsString()', ...(max !== undefined ? [`@MaxLength(${max})`] : [])],
    };
  }
  if (lower === 'text' || lower === 'citext' || lower === 'name' || lower === 'char') {
    return { tsType: 'string', validators: ['@IsString()'] };
  }
  if (lower === 'uuid') {
    return { tsType: 'string', validators: ['@IsUUID()'] };
  }
  if (/^(?:big|small)?int(?:eger)?$|^int\d+$|^smallserial$|^serial$|^bigserial$/.test(lower)) {
    return { tsType: 'number', validators: ['@IsInt()'] };
  }
  if (/^(?:numeric|decimal|real|double precision|double)/.test(lower)) {
    return { tsType: 'number', validators: ['@IsNumber()'] };
  }
  if (/^bool(?:ean)?$/.test(lower)) {
    return { tsType: 'boolean', validators: ['@IsBoolean()'] };
  }
  if (/^timestamp(?:tz)?$|^date$|^time(?:tz)?$/.test(lower)) {
    return { tsType: 'string', validators: ['@IsDateString()'] };
  }
  if (/^jsonb?$/.test(lower)) {
    return { tsType: 'Record<string, unknown>', validators: ['@IsObject()'] };
  }
  // Fallback for unrecognized types — adopter hand-finishes.
  return { tsType: 'unknown', validators: [] };
}

function renderEntityTsFields(entity: Blueprint['database']['entities'][number]): string {
  const out: string[] = [];
  for (const f of entity.fields) {
    const { tsType } = mapSqlTypeToTs(f.type);
    const optionalMarker = f.nullable === true ? '?' : '!';
    const typeSuffix = f.nullable === true ? ` | null` : '';
    out.push(`  ${f.name}${optionalMarker}: ${tsType}${typeSuffix};`);
  }
  return out.join('\n');
}

function renderDtoFields(
  entity: Blueprint['database']['entities'][number],
  allOptional: boolean,
): string {
  const lines: string[] = [];
  const validators = new Set<string>();
  for (const f of entity.fields) {
    if (AUDIT_FIELD_NAMES.has(f.name)) continue;
    const shape = mapSqlTypeToTs(f.type);
    for (const v of shape.validators) {
      // Extract the bare validator name (`@IsString()` → `IsString`).
      const bare = v.replace(/^@/, '').replace(/\(.*\)$/, '');
      validators.add(bare);
    }
    const required = !allOptional && f.nullable !== true;
    const optTag = required ? '' : '@IsOptional()\n  ';
    if (!required) validators.add('IsOptional');
    const decs = shape.validators.map((v) => `  ${v}`).join('\n');
    const sep = decs.length > 0 ? '\n' : '';
    const marker = required ? '!' : '?';
    const nullable = f.nullable === true ? ' | null' : '';
    lines.push(`${decs}${sep}  ${optTag}${f.name}${marker}: ${shape.tsType}${nullable};`);
  }
  // Inject an import header listing every validator the body needs.
  // We don't render the import here — that's the template author's
  // responsibility; we just expose the list as a token so templates
  // can opt in to import-list rendering if they want it.
  return lines.join('\n\n');
}

/**
 * Build the per-entity extra_tokens map for SKILL-scaffold-api
 * tasks. The scaffolder's template engine then substitutes these
 * into the DTO + entity templates.
 */
function buildEntityScaffoldTokens(
  entity: Blueprint['database']['entities'][number],
): Record<string, string> {
  return {
    __ENTITY_TS_FIELDS__: renderEntityTsFields(entity),
    __DTO_FIELDS_CREATE__: renderDtoFields(entity, false),
    __DTO_FIELDS_UPDATE__: renderDtoFields(entity, true),
  };
}

// Optional LLM-backed blueprint planner — drafts BusinessModuleSpec
// candidates the Owner curates. Output-only (writes to a draft
// staging dir); does NOT scaffold. Follows the P3 writer-family
// discipline: honest gaps in `gaps[]`, no fabrication.
const skillPlanBlueprint: SkillEntry = {
  manifest: {
    schemaVersion: '1.0.0',
    id: 'SKILL-plan-blueprint',
    title: 'Draft a module-blueprint candidate from a journey + invariants',
    version: '1.1.0',
    summary:
      'LLM-backed planner: given a journey id (or free-text intent) and existing invariants, drafts a module-blueprint candidate the Owner curates. Output to product/draft/blueprints/. Does NOT scaffold; honest gaps, no fabrication. Per Phase 18.F (D-59) optional.',
    kind: 'elicitation',
    authority_role: 'owner',
    deterministic: false,
    llm_backed: true,
    default_family: 'claude',
    agent_class: 'review-agent',
    permission_tier: 'write',
    host_mutation_policy: 'write_requires_flag',
    allowed_write_scopes: [
      'product/draft/blueprints/**',
      'record/proofs/work/skill-runs/SKILL-plan-blueprint/**',
    ],
    evidence_files: ['record/proofs/work/skill-runs/SKILL-plan-blueprint/*.json'],
    risk_level: 'low',
    tags: ['phase-18', 'phase-18-F', 'blueprint', 'planner', 'llm'],
    entry: 'devai agent skill run SKILL-plan-blueprint',
  },
  async run(ctx) {
    const topic = ctx.inputs?.topic as string | undefined;
    const journeyId = ctx.inputs?.journey_id as string | undefined;
    if ((topic === undefined || topic.length === 0) && journeyId === undefined) {
      return {
        skill_id: 'SKILL-plan-blueprint',
        status: 'fail',
        notes: ['inputs.topic: string OR inputs.journey_id is required'],
      };
    }
    const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
    const prompt = loadSkillPrompt('SKILL-plan-blueprint');
    const components = [
      {
        layer: 'global' as const,
        name: 'plan-blueprint.global',
        body: prompt.global,
      },
      {
        layer: 'role' as const,
        name: 'owner.role',
        body: prompt.role,
      },
      {
        layer: 'payload' as const,
        name: 'plan-blueprint.topic',
        body: topic !== undefined ? `Topic: ${topic}` : `Journey: ${journeyId ?? ''}`,
      },
    ];
    const composition = composePrompt({
      task_id: (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000',
      components,
      timestamp: ctx.timestamp ?? new Date().toISOString(),
    });
    const messages = messagesFromComposition(components);
    const meta = metaFromComposition(composition, 'SKILL-plan-blueprint');
    let response;
    try {
      response = await llm.complete(messages, meta, {
        response_format_json: true,
        response_json_schema: responseSchemaForMutatingSkill('SKILL-plan-blueprint'),
        temperature: 0.3,
        max_output_tokens: 2048,
      });
    } catch (err) {
      return {
        skill_id: 'SKILL-plan-blueprint',
        status: 'fail',
        notes: [`LLM call failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
    type PlanBlueprintResponse = {
      blueprint?: Record<string, unknown>;
      gaps?: string[];
      follow_up_questions?: string[];
    };
    let parsed: PlanBlueprintResponse | null = null;
    if (
      response.json !== undefined &&
      response.json !== null &&
      typeof response.json === 'object'
    ) {
      parsed = response.json as PlanBlueprintResponse;
    } else {
      try {
        parsed = JSON.parse(response.text) as PlanBlueprintResponse;
      } catch {
        parsed = null;
      }
    }
    if (parsed === null || parsed.blueprint === undefined) {
      return {
        skill_id: 'SKILL-plan-blueprint',
        status: 'fail',
        notes: [
          'LLM response did not parse as { blueprint: {...}, gaps: [], follow_up_questions: [] }',
        ],
        evidence: { raw_response: response.text.slice(0, 2048) },
      };
    }
    const taskId = (ctx.inputs?.task_id as string | undefined) ?? '';
    if (!/^TASK-[0-9]{4,}$/.test(taskId)) {
      return {
        skill_id: 'SKILL-plan-blueprint',
        status: 'fail',
        notes: ['inputs.task_id (matching ^TASK-[0-9]{4,}$) is required for candidate output'],
      };
    }
    const outPath = `product/draft/blueprints/${taskId}.json`;
    const outAbsolute = join(ctx.repoRoot, outPath);
    if (existsSync(outAbsolute)) {
      return {
        skill_id: 'SKILL-plan-blueprint',
        status: 'fail',
        notes: [`refusing to overwrite existing candidate draft: ${outPath}`],
      };
    }
    const draft = {
      schemaVersion: '1.0.0',
      task_id: taskId,
      skill_id: 'SKILL-plan-blueprint',
      topic: topic ?? null,
      journey_id: journeyId ?? null,
      blueprint_draft: parsed.blueprint,
      gaps: parsed.gaps ?? [],
      follow_up_questions: parsed.follow_up_questions ?? [],
    };
    mkdirSync(dirname(outAbsolute), { recursive: true });
    writeFileSync(outAbsolute, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
    return {
      skill_id: 'SKILL-plan-blueprint',
      status: 'pass',
      evidence: {
        topic: topic ?? null,
        journey_id: journeyId ?? null,
        blueprint_draft: parsed.blueprint,
        gaps: parsed.gaps ?? [],
        follow_up_questions: parsed.follow_up_questions ?? [],
        out_path: outPath,
        llm: { family: response.family, model: response.model, cost_usd: response.usage.cost_usd },
      },
    };
  },
};

// =====================================================================
// Fix-* catalog-fill (R3-W3). 10 new SKILL-fix-<gate-id> skills
// closing the gate-recovery substrate gap surfaced in R2-Δ3.
//
// All ten are READ-ONLY DIAGNOSE for now (R2-Δ1 iteration loops +
// real fix attempts deferred). They invoke the underlying check and
// report pass/fail; the fix-skill protocol gains real fixing in a
// successor round.
//
// Six skills call core functions directly (typecheck, prompt-overlays,
// forbidden-actions, adrs, overrides); four shell out via the built
// devai CLI for substrates whose check logic lives in CLI commands
// (spec-validate, action-coverage, docs-links) or in the adopter's
// system test runner (coverage, mutation).
// =====================================================================

export const scaffolderSkills: readonly SkillEntry[] = [
  skillScaffoldDb,
  skillScaffoldApi,
  skillScaffoldUi,
  skillScaffoldTests,
  skillScaffoldDocs,
  skillScaffoldCi,
  skillPlanBlueprint,
];
