import { mkdirSync } from '@devai-nyx/authority';
import { basename, isAbsolute, join } from 'node:path';
import type { SkillContext } from '../types.js';
import { scorecardCellId, type ScorecardCell } from './state.js';

export interface RoundPlan {
  readonly round_dir: string;
  readonly phase: 'audit' | 'backlog' | 'orchestrate' | 'verify-publish' | 'loop';
  readonly steps: readonly {
    readonly id: string;
    readonly description: string;
    readonly artifacts?: readonly string[];
  }[];
  readonly next_phase?: 'audit' | 'backlog' | 'orchestrate' | 'verify-publish' | 'done';
  readonly references: { readonly prompts_library: string; readonly skills?: readonly string[] };
}

export function roundDir(ctx: SkillContext): string {
  const n = (ctx.inputs?.['round_n'] as number | string | undefined) ?? 0;
  return `work/rounds/R-${String(n).padStart(4, '0')}`;
}

// R4-W3 helpers — shared between round-audit and round-backlog executors.

export function resolveAuditDir(repoRoot: string, dir: string): string {
  const roundPath = isAbsolute(dir) ? dir : join(repoRoot, dir);
  return join(repoRoot, 'work/audit', basename(roundPath));
}

export function ensureAuditDir(repoRoot: string, dir: string): string {
  const auditDir = resolveAuditDir(repoRoot, dir);
  mkdirSync(auditDir, { recursive: true });
  return auditDir;
}

export function ensurePromptsDir(repoRoot: string, dir: string): string {
  const promptsDir = isAbsolute(dir) ? join(dir, 'prompts') : join(repoRoot, dir, 'prompts');
  mkdirSync(promptsDir, { recursive: true });
  return promptsDir;
}

export function buildAuditScratchMd(
  roundDirRel: string,
  assessEvidence: unknown,
  scorecardEvidence: unknown,
): string {
  const ts = new Date().toISOString();
  const sc = scorecardEvidence as { cells?: ScorecardCell[] } | null;
  const failingCells = Array.isArray(sc?.cells)
    ? sc.cells.filter((c) => c.verdict === 'FAIL' || c.verdict === 'REVIEW')
    : [];
  const failingTable =
    failingCells.length === 0
      ? '_None observed in the current scorecard._'
      : '| Cell | Verdict |\n|------|---------|\n' +
        failingCells.map((c) => `| ${scorecardCellId(c)} | ${c.verdict ?? '?'} |`).join('\n');
  return `# ${roundDirRel} — audit scratch

**Generated:** ${ts}
**Status:** auto-materialized by SKILL-round-audit (R4-W3 real execution).

## Current state

See \`audit/assessment.json\` (full assess-state evidence) and
\`audit/scorecard.baseline.json\` (per-cell verdict matrix).

## Failing cells

${failingTable}

## Open questions

_(populate via human review; auto-detection is out of scope this round)_

## Carryovers from prior rounds

_(scan \`.devai/state/decisions.jsonl\` for kind=defer + status=open records)_

## Notes

- This file is REGENERATED on every \`SKILL-round-audit\` invocation.
- Human-authored additions will be overwritten; copy them to a sibling
  file (e.g., \`audit/notes.md\`) if persistence is desired.
`;
}

export function buildBacklogMd(roundDirRel: string, items: unknown[]): string {
  const ts = new Date().toISOString();
  const itemsBlock =
    items.length === 0
      ? '_(empty backlog — scorecard is clean or no actionable items)_'
      : items
          .map((it, idx) => {
            const item = it as { id?: string; title?: string; priority?: number; cell?: string };
            return (
              `${String(idx + 1)}. **${item.title ?? '(untitled)'}** ` +
              `(id: \`${item.id ?? '?'}\`, ` +
              `priority: ${String(item.priority ?? '?')}, ` +
              `cell: ${item.cell ?? '?'})`
            );
          })
          .join('\n');
  return `# ${roundDirRel} — backlog

**Generated:** ${ts}
**Status:** auto-materialized by SKILL-round-backlog (R4-W3 real execution).
**Item count:** ${String(items.length)}

## Items (priority order)

${itemsBlock}

## Wave assignment

_(auto-wave one-per-item is the templated default — see prompts/01-*.md
through prompts/NN-*.md. Grouping multiple items per wave is human or
LLM-driven and out of scope this round.)_

## Source

Raw items: \`backlog.json\` (this directory).
`;
}

export function buildWavePromptTemplate(
  roundN: number | string,
  waveN: number,
  item: { id?: string; title?: string; priority?: number; cell?: string; description?: string },
): string {
  const roundId = canonicalRoundId(roundN);
  const slug = (item.title ?? item.id ?? `wave-${String(waveN)}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `---
role: engineer
effort: low
---

# ${roundId}-W${String(waveN)} — ${slug}

**Goal:** ${item.title ?? item.description ?? '(TODO: name the goal in one sentence)'}

## Inputs

- Round audit context: \`work/audit/${roundId}/scratch.md\`, \`work/audit/${roundId}/scorecard.baseline.json\`.
- Origin: backlog item \`${item.id ?? '?'}\`, cell \`${item.cell ?? '?'}\`, priority \`${String(item.priority ?? '?')}\`.

## Deliverables

(TODO: name specific files this wave produces.)

## Acceptance

(TODO: gate command + verification rule.)

## Logging

\`${String(waveN).padStart(2, '0')}-${slug}.log\` on completion per the round-break canon.

## Notes

Auto-generated as a disposable proposal by SKILL-round-backlog.
The TODOs above need authoring before dispatch — the templated wave-prompt
is a scaffold, not committed Architect intent. An Architect must review and
promote it through the governed round surface before it can become durable.
`;
}

function canonicalRoundId(roundN: number | string): string {
  const raw = String(roundN);
  return /^R-\d{4}$/u.test(raw) ? raw : `R-${raw.padStart(4, '0')}`;
}

/**
 * R6-W1 (closes F-1) — default orchestrator prompt template materialized
 * alongside backlog wave prompts. Gives `SKILL-round-orchestrate` a wave
 * catalog to parse on first composer run; pre-fix the orchestrate skill
 * hit dry-run fallback because no orchestrator existed, so no waves
 * dispatched and verify-publish then false-positive'd defer records (F-3)
 * for items that had zero chance to be delivered.
 *
 * The operator SHOULD replace this template with a hand-authored
 * orchestrator before dispatch (the catalog rows are stubs per backlog
 * item; effort and dependency tracking need human curation). But the
 * substrate now provides a sane default so the composer chain works
 * end-to-end on a first invocation.
 */
export function buildOrchestratorTemplate(
  roundN: number | string,
  items: Array<{ id?: string; title?: string; cell?: string }>,
): string {
  const roundId = canonicalRoundId(roundN);
  const catalogRows = items
    .map((item, idx) => {
      const waveN = idx + 1;
      const slug = (item.title ?? item.id ?? `wave-${String(waveN)}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
      const goal = item.title ?? '(TODO: name the goal)';
      const origin = item.cell ?? item.id ?? '(?)';
      return `| ${String(waveN).padStart(2, '0')} | \`${slug}\` | ${goal} (origin: ${origin}) | engineer | low | W${String(waveN - 1)} |`;
    })
    .join('\n');
  const catalogBlock =
    items.length === 0
      ? '_(empty backlog — no wave catalog generated. Author waves manually if needed.)_'
      : `| # | Slug | Goal | Role | Effort | Depends on |\n|---|------|------|------|--------|------------|\n| 00 | (this orchestrator) | declare + dispatch + gate + close | architect | low | — |\n${catalogRows}`;
  return `---
role: architect
effort: low
---

# ${roundId} — Orchestrator (auto-generated proposal)

**Round goal:** _(Architect should author \`work/rounds/${roundId}/plan.md\` and add a concise goal here)_

**Orchestrator role:** non-worker. Declares waves, dispatches workers, runs gates between waves and at close, escalates blockers, writes \`Closeout.md\`. Edits no source files directly.

> **Auto-generated as disposable state by SKILL-round-backlog.**
> This scaffold has one wave per backlog item with stub effort and dependency.
> An Architect MUST review it, adjust goals, group or reorder waves, refine
> effort, declare dependencies, and explicitly promote the result into
> \`work/rounds/${roundId}/prompts/\` before durable governed use.
>
> The proposal never establishes Architect intent merely by existing under
> \`.devai/state/round-runs/${roundId}/backlog/\`.

## Wave catalog

${catalogBlock}

## Gate declarations

### Mandatory minimum (re-run at every wave close + round close)

- \`lint\` → \`pnpm lint\`
- \`typecheck\` → \`pnpm typecheck\`
- \`test\` (unit) → \`pnpm test\`
- \`docs-links\` → \`node <devai-cli-bin> docs-links --repo-root .\`
- \`action-coverage\` → \`node <devai-cli-bin> spec-validate-action-coverage --repo-root .\`

### Scope-conditional (re-run at round close)

- \`test-integration\` → \`pnpm test:integration\` (waves touching CLI source)
- \`prompt-overlays\` → \`node <devai-cli-bin> check-prompt-overlays\` (waves touching skill manifests)

## Dispatch sequencing

Serial: W0 → W1 → ... → close. Override per-wave if real dependency analysis shows
some waves are scope-disjoint and could parallelize.

## Round close procedure

1. Confirm every wave log carries \`status: clean\` or \`status: blocked\`.
2. Run mandatory minimum gate set against the final tree.
3. Run scope-conditional gates per the declarations above.
4. For each red gate: invoke matching \`SKILL-fix-<gate-id>\` (up to \`max_iterations=3\` if the skill's \`auto_fix_capable != 'none'\`); on final red, capture as blocker.
5. Write \`.devai/state/round-runs/${roundId}/verify-publish/Closeout.md\` with verdict, gate results, scorecard delta, backlog disposition, ledger-record disposition, and SHA list of closing commits.
`;
}
