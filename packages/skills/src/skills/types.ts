/**
 * R20 slice 1 (D-137) — the skills layer's shared type surface.
 *
 * Extracted verbatim from `skills/index.ts` at the W1 parity baseline.
 * Types only: no values, no logic, no side effects — so every other
 * skills module can depend on this one without creating a cycle.
 * `index.ts` re-exports all nine, keeping the public API identical.
 */
import type { LlmClient } from '../llm/index.js';

/**
 * SkillManifest — runtime shape. Conforms to skill-manifest.schema.json
 * (Batch 9.A.1 reshape — closes the audit's "runtime ≠ schema" gap).
 *
 * Required fields (mirror the schema):
 *   - schemaVersion: '1.0.0'
 *   - id: `SKILL-<kebab-name>` (^SKILL-[a-z][a-z0-9-]*$)
 *   - title: human-readable name
 *   - version: per-skill semver
 *   - kind: 'command' | 'workflow' | 'template' | 'elicitation'
 *   - authority_role: which human/agent role's authority this skill
 *     operates under
 *   - deterministic
 *   - host_mutation_policy: what the orchestrator allows this skill to
 *     write
 *   - allowed_write_scopes: path globs the orchestrator permits
 *   - evidence_files: paths this skill produces
 *   - risk_level
 *   - tags
 *   - entry: canonical CLI invocation
 *
 * Optional fields (schema-allowed):
 *   - summary: short description (separate from title)
 *   - llm_backed: true if the run path invokes an LLM
 *   - default_family: Phase-9 multi-provider routing hint
 */
export interface SkillManifest {
  readonly schemaVersion: '1.0.0';
  readonly id: string;
  readonly title: string;
  readonly version: string;
  readonly summary?: string;
  readonly lifecycle?: 'supported' | 'experimental' | 'retired';
  readonly lifecycle_reason?: string;
  readonly promotion_criteria?: readonly string[];
  readonly kind: 'command' | 'workflow' | 'template' | 'elicitation';
  readonly authority_role:
    'owner' | 'architect' | 'inspector' | 'engineer' | 'auditor' | 'harness' | 'orchestrator';
  readonly deterministic: boolean;
  readonly llm_backed?: boolean;
  readonly default_family?: 'claude' | 'codex' | 'auto';
  /**
   * Phase-10 Batch 10.G — agent class. Absorbs LAW-12.CLASS.* from the
   * stech-law predecessor draft (D-38). Orthogonal to `authority_role`:
   * authority_role names whose authority the skill speaks under;
   * agent_class names what kind of actions the skill performs.
   */
  readonly agent_class?: 'coding-agent' | 'review-agent' | 'ops-agent';
  /**
   * Phase-10 Batch 10.G — permission tier required for this skill.
   * Absorbs LAW-12.PERM.* (D-38). Session-scoped; the runtime refuses
   * to load a skill whose tier exceeds the session grant. The `act`
   * tier additionally requires per-action authorisation.
   */
  readonly permission_tier?: 'read' | 'write' | 'act';
  readonly host_mutation_policy: 'read_only' | 'evidence_only' | 'write_requires_flag';
  readonly allowed_write_scopes: readonly string[];
  readonly evidence_files: readonly string[];
  readonly risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly tags: readonly string[];
  readonly entry: string;
  /**
   * R3-W2 — top-level taxonomy for orchestrator discovery. Optional.
   * Orchestrators predict skill names from family + gate_id /
   * cycle_level + cycle_role per docs/adopters/round-break.md.
   */
  readonly family?: 'fix' | 'cycle-driver' | 'writer' | 'scaffolder' | 'audit' | 'other';
  /** R3-W2 — for family=fix skills: the gate this skill recovers (sensor name / verb subnoun). */
  readonly gate_id?: string;
  /** R3-W2 — for family=cycle-driver skills: hierarchy level driven. */
  readonly cycle_level?: 'round' | 'wave' | 'phase' | 'step';
  /** R3-W2 — for family=cycle-driver skills: role at the cycle_level. */
  readonly cycle_role?: 'orchestrate' | 'audit' | 'backlog' | 'verify-publish' | 'execute' | 'loop';
  /**
   * R4-W1 — for family=fix skills: actual autofix capability.
   * Orchestrators use this to skip iteration on diagnose-only skills
   * (consumed by R4-W2 iteration loop substrate). Optional; absent
   * means unknown — orchestrators default to iterate once.
   */
  readonly auto_fix_capable?: 'full' | 'partial' | 'none';
}

export interface SkillContext {
  readonly repoRoot: string;
  readonly timestamp?: string;
  readonly inputs?: Readonly<Record<string, unknown>>;
  /**
   * Optional pre-built LlmClient for skills that invoke an LLM. The
   * orchestrator passes a shared client (so rate limits + cost
   * telemetry roll up across iterations); standalone `devai agent skill run`
   * builds one via createLlmClient when this is absent.
   */
  readonly llm?: LlmClient;
  /**
   * R4-W2 — present when skill-run is iterating because the manifest
   * declares `auto_fix_capable != 'none'`. Skills that perform fix
   * attempts may inspect this to log progress with the iteration
   * number, or to vary behavior between first vs later attempts.
   * Absent when running single-shot (non-fix or auto_fix_capable=none).
   */
  readonly iteration?: { readonly current: number; readonly max: number };
  /**
   * R5-W2 — per-CLI-invocation grants for act-tier capabilities.
   * Threaded from the skill-run CLI's `--allow-publish` flag (W3 wires it).
   * Only `SKILL-commit-push` reads `grants.publish` today; other skills
   * MUST NOT silently escalate to act tier based on this field.
   * See ADR-002 §2 for the session-grant rationale.
   */
  readonly grants?: { readonly publish?: boolean };
}

export interface SkillResult {
  readonly skill_id: string;
  readonly status: 'pass' | 'fail' | 'review' | 'skipped';
  readonly evidence?: unknown;
  readonly notes?: readonly string[];
}

export type SkillRun = (ctx: SkillContext) => Promise<SkillResult>;

export interface SkillEntry {
  readonly manifest: SkillManifest;
  readonly run: SkillRun;
}
/**
 * R10 (D-A-40 / ADR-ROUND-EXECUTE-SEMANTICS, Decision 3) — full per-gate
 * evidence shape persisted under `evidence.executed_artifacts.gate_results[]`.
 * Required fields: `gate`, `status`, `source`. Other fields populated when
 * applicable (`status: not-configured` omits command/exit/timings).
 */
export interface GateEvidence {
  readonly gate: string;
  readonly status: 'pass' | 'fail' | 'not-configured' | 'error';
  readonly source: 'devai-default' | 'project-config' | 'extra-gate';
  readonly command?: string;
  readonly argv?: readonly string[];
  readonly cwd?: string;
  readonly exit_code?: number | null;
  readonly started_at?: string;
  readonly ended_at?: string;
  readonly duration_ms?: number;
  readonly stdout_tail?: string;
  readonly stderr_tail?: string;
  readonly stdout_path?: string;
  readonly stderr_path?: string;
  readonly config_key?: string;
  readonly cli_bin?: string;
  readonly reason?: string;
  // R10 back-compat: legacy `gate_id` and `cmd` mirror new `gate` /
  // `command` so older evidence consumers that read those keys still work.
  readonly gate_id?: string;
  readonly cmd?: string;
}
/**
 * R10 (D-A-40 / ADR Decision 2) — five-state verdict taxonomy with
 * precedence: failed > aborted > with-blockers > partial > deferred > clean.
 * Used by verify-publish to render Closeout.md and emit the evidence
 * verdict; also reused by round-execute composer for the strict-exit CLI
 * mapping. `computeRoundVerdict` (skills/index.ts) is the pure function
 * that applies the precedence; its input contract is documented there.
 */
export type RoundVerdict =
  'clean' | 'with-blockers' | 'deferred' | 'partial' | 'aborted' | 'failed';
/**
 * D-A-42 — Resolution record (append-only closure).
 * Authored by `devai spec decision close` or by SKILL-round-verify-publish's
 * auto-supersession (mechanism c). The original DEC record is NEVER
 * rewritten; the resolution record carries `resolves_dec_id` and a
 * disposition. Schema: law/schemas/decisions.schema.json#/$defs/resolutionRecord.
 */
export interface ResolutionRecord {
  readonly schemaVersion: '1.0.0';
  readonly id: string;
  readonly kind: 'resolution';
  readonly resolves_dec_id: string;
  readonly resolved_at: string;
  readonly resolved_by: string;
  readonly disposition: 'closed' | 'superseded' | 'invalidated';
  readonly evidence_ref?: string;
  readonly note?: string;
  readonly context?: { readonly round_id?: string; readonly commit_sha?: string };
}
/**
 * D-A-42 — a single ledger record, either a DEC record or a resolution
 * record. `readAllLedgerRecords` distinguishes the two kinds and matches
 * resolutions to their target DEC via `resolves_dec_id`.
 */
export interface AnyLedgerRecord {
  readonly id?: string;
  readonly kind?: string;
  readonly status?: string;
  readonly subject?: string;
  readonly resolves_dec_id?: string;
  readonly resolved_at?: string;
  readonly disposition?: string;
  readonly context?: { readonly round_id?: string };
}
