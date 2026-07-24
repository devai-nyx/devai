import {
  mkdirSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import {
  composePrompt,
  freezePrompt,
  type PromptComponentInput,
  type PromptComposition,
} from '@devai-nyx/loop';
import {
  createLlmClient,
  type LlmClient,
  messagesFromComposition,
  metaFromComposition,
  responseSchemaForMutatingSkill,
} from '../../llm/index.js';
import { resolveStackAdapterPack } from '../../pack-resolver/index.js';
import { loadSharedPrompt } from '../prompt-loader.js';
import { hasAnyInventory, loadInventories, summarizeForPrompt } from './load-inventories.js';

/**
 * Local SkillResult-shape kept here (rather than imported from
 * skills/index.ts) so this helper does not create a circular
 * runtime import. The structural shape matches SkillResult exactly.
 */
export interface WriterSkillResult {
  readonly skill_id: string;
  readonly status: 'pass' | 'fail' | 'review' | 'skipped';
  readonly evidence?: unknown;
  readonly notes?: readonly string[];
}

/**
 * Phase 17.F (D-57): shared run-helper for every SKILL-write-*.
 *
 * Each writer skill differs only in (1) the prompt content and (2) the
 * output path; the load-inventories → compose → LLM-call → parse →
 * write → evidence pipeline is identical. This helper centralizes
 * that pipeline.
 *
 * Output contract (P1 expanded): the LLM MUST return JSON
 *   { "markdown": "<doc body>",
 *     "citations": [{"kind": "...", "ref": "..."}],   // optional
 *     "inferred_fields": ["..."],                     // optional
 *     "gaps": ["..."] }                               // optional
 * Parse failure surfaces as status=fail (no junk written to docs/).
 */

/**
 * Output-contract instruction shared by every writer global prompt.
 * Includes the {markdown, citations?, inferred_fields?, gaps?}
 * envelope and the no-hallucination posture every writer enforces.
 *
 * P1: extracted from per-writer globals so the contract evolves in
 * one place. The role-layer carries the per-writer persona; this
 * carries the response envelope.
 */
export const OUTPUT_CONTRACT_INSTRUCTION = loadSharedPrompt('writer.output-contract');

export interface RunWriterSkillOptions {
  /** Skill id for evidence/diagnostics. */
  readonly skillId: string;
  /** Default output path under repoRoot (e.g. "docs/Architecture Guide.md"). */
  readonly defaultOutPath: string;
  /**
   * System-tier prompt (global layer). Should NOT repeat the
   * output-contract envelope — `runWriterSkill` appends
   * OUTPUT_CONTRACT_INSTRUCTION as a separate global component so
   * every writer shares the same envelope rules.
   */
  readonly promptGlobal: string;
  /** Role-tier prompt (role layer): the per-writer persona. */
  readonly promptRole: string;
  /**
   * Soft word budget for the markdown body. Surfaced to the LLM
   * verbatim ("Constraints: ≤ N words"). Writers that need no cap
   * (FP Report, Threat Model) pass `null` to omit the line entirely.
   */
  readonly wordBudget?: number | null;
  /** LLM call options. */
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  /** Skill-run context. */
  readonly ctx: {
    readonly repoRoot: string;
    readonly inputs?: Record<string, unknown>;
    readonly timestamp?: string;
    readonly llm?: LlmClient;
  };
}

export async function runWriterSkill(opts: RunWriterSkillOptions): Promise<WriterSkillResult> {
  const { skillId, defaultOutPath, promptGlobal, promptRole, ctx } = opts;
  const inv = loadInventories({ repoRoot: ctx.repoRoot });
  if (!hasAnyInventory(inv)) {
    return {
      skill_id: skillId,
      status: 'fail',
      notes: [
        'No inventory sensor bodies found under record/derived/inventory/. Run the inventory sense commands first (devai sense inventory api, sense routes, sense data-model, ...).',
      ],
    };
  }
  const payload = summarizeForPrompt(inv);

  const inputOutPath = ctx.inputs?.out_path as string | undefined;
  const outPath =
    inputOutPath !== undefined && isAbsolute(inputOutPath)
      ? inputOutPath
      : inputOutPath !== undefined
        ? join(ctx.repoRoot, inputOutPath)
        : join(ctx.repoRoot, defaultOutPath);

  const wordBudgetLine =
    opts.wordBudget === null || opts.wordBudget === undefined
      ? ''
      : `Constraints: ≤ ${String(opts.wordBudget)} words for the markdown body. Bullet-heavy is fine.`;
  // P2.6: optional task-layer carries the synthesis context — what
  // triggered this writer run. Examples: "First-time brownfield
  // adoption", "Post-refactor refresh after auth rewrite",
  // "Incident-response quick-doc". The same writer family serves
  // multiple journeys; this lets the prose adapt without forking the
  // global/role layers.
  const taskContextRaw = ctx.inputs?.task_context;
  const taskContext =
    typeof taskContextRaw === 'string' && taskContextRaw.length > 0 ? taskContextRaw : null;
  const components: PromptComponentInput[] = [
    { layer: 'global', name: `${skillId}.global`, body: promptGlobal },
    { layer: 'global', name: 'writer.output-contract', body: OUTPUT_CONTRACT_INSTRUCTION },
    ...(wordBudgetLine.length > 0
      ? [{ layer: 'global' as const, name: `${skillId}.word-budget`, body: wordBudgetLine }]
      : []),
    { layer: 'role', name: `${skillId}.role`, body: promptRole },
    ...(taskContext !== null
      ? [{ layer: 'task' as const, name: `${skillId}.task-context`, body: taskContext }]
      : []),
    { layer: 'payload', name: `${skillId}.payload`, body: payload },
  ];

  // Phase 17.G gap-2: append stack-adapter-pack prompt-overlays
  // (when a pack matches the repo) to the composition.
  //
  // Post-Phase-17 follow-on C (--seeds plumbing): ctx.inputs.seeds
  // is a comma-separated list of additional pack directories to
  // consider beyond the in-repo examples/redox-pack-* set. The CLI
  // surface is `devai docs synthesize <kind> --seeds <path,path2>`.
  let resolvedPackId: string | null = null;
  const replacedLayers: string[] = [];
  try {
    const seedsRaw = ctx.inputs?.seeds;
    const additionalDirs =
      typeof seedsRaw === 'string'
        ? seedsRaw
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : undefined;
    const resolution = resolveStackAdapterPack({
      repoRoot: ctx.repoRoot,
      ...(additionalDirs !== undefined && additionalDirs.length > 0 && { additionalDirs }),
    });
    if (resolution.matched !== null) {
      resolvedPackId = resolution.matched.id;
      const overlays = resolution.matched.prompt_overlays?.[skillId] ?? [];
      // P3.10: process replace_layer overlays in two passes. First
      // identify which layers the pack wants to take over (only the
      // writer's namespaced contribution `${skillId}.${layer}` is
      // dropped — shared components like writer.output-contract and
      // ${skillId}.word-budget survive). Then apply the deletions
      // before appending all overlay items.
      const layersToReplace = new Set<string>();
      for (const ov of overlays) {
        if (ov.mode === 'replace_layer') {
          layersToReplace.add(ov.layer);
        }
      }
      if (layersToReplace.size > 0) {
        for (let i = components.length - 1; i >= 0; i--) {
          const c = components[i];
          if (c === undefined) continue;
          if (!layersToReplace.has(c.layer)) continue;
          if (c.name !== `${skillId}.${c.layer}`) continue;
          components.splice(i, 1);
          replacedLayers.push(c.layer);
        }
      }
      for (const ov of overlays) {
        components.push({ layer: ov.layer, name: ov.name, body: ov.body });
      }
    }
  } catch {
    // Pack resolution must not break the writer; absent / malformed
    // packs surface as "no overlay applied" rather than as a failure.
  }
  const composition = composePrompt({
    task_id: (ctx.inputs?.task_id as string | undefined) ?? 'TASK-0000',
    components,
    timestamp: ctx.timestamp ?? new Date().toISOString(),
  });

  // P2.7: freeze + drift detection. The frozen composition is
  // persisted under record/proofs/work/skill-runs/<skill-id>/frozen.json.
  // On every subsequent run we compare stack_sha256 against the
  // frozen artifact — a mismatch is surfaced as drift_from_frozen
  // in evidence + as a warning note. Article 37 (governed prompts)
  // says compositions in governed loops must be frozen; this is the
  // mechanism. Drift is observational, not blocking — a future
  // firewall pass can promote it to a hard gate if a writer is
  // declared "governed" by an explicit invariant.
  const frozenPath = join(ctx.repoRoot, `record/proofs/work/skill-runs/${skillId}/frozen.json`);
  let frozen: PromptComposition | null = null;
  if (existsSync(frozenPath)) {
    try {
      frozen = JSON.parse(readFileSync(frozenPath, 'utf8')) as PromptComposition;
    } catch {
      // Corrupt frozen file is non-fatal: treat as absent so the
      // run still produces a doc. The drift signal is lost for
      // this run but the next freeze write will repair it.
      frozen = null;
    }
  }
  const drift_from_frozen = frozen !== null && frozen.stack_sha256 !== composition.stack_sha256;
  const driftNotes: string[] = [];
  if (drift_from_frozen && frozen !== null) {
    driftNotes.push(
      `prompt composition drifted from frozen artifact ${frozen.id} (now ${composition.id}); the frozen artifact is at ${frozenPath}`,
    );
  }
  const llm = ctx.llm ?? createLlmClient({ repoRoot: ctx.repoRoot });
  const messages = messagesFromComposition(components);
  const meta = metaFromComposition(composition, skillId);
  let response;
  try {
    response = await llm.complete(messages, meta, {
      response_format_json: true,
      response_json_schema: responseSchemaForMutatingSkill(skillId),
      temperature: opts.temperature ?? 0.2,
      max_output_tokens: opts.maxOutputTokens ?? 4096,
    });
  } catch (err) {
    return {
      skill_id: skillId,
      status: 'fail',
      notes: [`LLM call failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  type WriteCitation = { kind?: string; ref?: string };
  type WriteResponse = {
    markdown?: string;
    citations?: WriteCitation[];
    inferred_fields?: string[];
    gaps?: string[];
  };
  let parsed: WriteResponse | null = null;
  if (response.json !== undefined && response.json !== null && typeof response.json === 'object') {
    parsed = response.json as WriteResponse;
  } else {
    try {
      parsed = JSON.parse(response.text) as WriteResponse;
    } catch {
      parsed = null;
    }
  }
  if (parsed === null || typeof parsed.markdown !== 'string' || parsed.markdown.length === 0) {
    return {
      skill_id: skillId,
      status: 'fail',
      notes: ['LLM response did not parse as { markdown: "..." }'],
      evidence: { raw_response: response.text.slice(0, 2048) },
    };
  }
  // P1: normalize the optional self-report fields. Missing / wrong-typed
  // values degrade to [] rather than rejecting the response — the
  // markdown is the load-bearing output; self-report is observational.
  const citations: ReadonlyArray<{ kind: string; ref: string }> = Array.isArray(parsed.citations)
    ? parsed.citations.filter(
        (c): c is { kind: string; ref: string } =>
          typeof c === 'object' &&
          c !== null &&
          typeof c.kind === 'string' &&
          typeof c.ref === 'string',
      )
    : [];
  const inferredFields: ReadonlyArray<string> = Array.isArray(parsed.inferred_fields)
    ? parsed.inferred_fields.filter((s): s is string => typeof s === 'string')
    : [];
  const gaps: ReadonlyArray<string> = Array.isArray(parsed.gaps)
    ? parsed.gaps.filter((s): s is string => typeof s === 'string')
    : [];

  try {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, parsed.markdown);
  } catch (err) {
    return {
      skill_id: skillId,
      status: 'fail',
      notes: [`failed to write ${outPath}: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  // P2.7: freeze on demand. Caller passes ctx.inputs.freeze = true
  // (or "true") after a successful run to ratify the current
  // composition as the governed artifact. Subsequent runs report
  // drift against this. Idempotent: rewriting with the same hash
  // is a no-op semantically.
  const freezeFlag = ctx.inputs?.freeze;
  const wantFreeze = freezeFlag === true || freezeFlag === 'true';
  let frozen_written = false;
  if (wantFreeze) {
    try {
      mkdirSync(dirname(frozenPath), { recursive: true });
      writeFileSync(frozenPath, JSON.stringify(freezePrompt(composition), null, 2) + '\n');
      frozen_written = true;
    } catch {
      // Best-effort: a failed freeze write should not turn a
      // passing writer into a failing one. Surface as a note.
      driftNotes.push(`failed to write frozen composition to ${frozenPath}`);
    }
  }

  return {
    skill_id: skillId,
    status: 'pass',
    evidence: {
      out_path: outPath,
      word_count: parsed.markdown.split(/\s+/).filter(Boolean).length,
      inventories_used: Object.fromEntries(Object.entries(inv).map(([k, v]) => [k, v !== null])),
      ...(resolvedPackId !== null && { stack_adapter_pack: resolvedPackId }),
      ...(replacedLayers.length > 0 && { replaced_layers: replacedLayers }),
      ...(taskContext !== null && { task_context: taskContext }),
      citations,
      inferred_fields: inferredFields,
      gaps,
      prompt: {
        id: composition.id,
        stack_sha256: composition.stack_sha256,
        component_count: composition.components.length,
        frozen_against: frozen?.id ?? null,
        drift_from_frozen,
        frozen_written,
      },
      llm: { family: response.family, model: response.model, cost_usd: response.usage.cost_usd },
    },
    ...(driftNotes.length > 0 && { notes: driftNotes }),
  };
}
