---
adr_id: ADR-ROUND-EXECUTE-SEMANTICS
title: SKILL-round-execute — mode, verdict taxonomy, gate-evidence schema, exit-code semantics
status: accepted
date: 2026-05-24
authors: ["@aarusso"]
tags: [round-10, round-execute, verdict, gate-evidence, decision-ledger]
---

# ADR-ROUND-EXECUTE-SEMANTICS — round-execute mode, verdict, and gate evidence

**Authority:** Architect.
**Related:** Constitution Articles 6 (authority-by-path), 17–18 (hard/soft gates), 25 (locks), 32 (sensor adapter uniformity), 36 (self-application), 38 (JSON canon), 39 (explicit uncertainty over false precision). ADR-001 (autonomous loop). ADR-002 (real publish path). D-A-40 (this entry). Resolves DEVAI R3 deferred R2-Δ2; TEAT G1; SGP G1.

## Status

Accepted on 2026-05-24 (R10-W05). Worker 06 implements per the "Implementation notes" section below.

## Context

`SKILL-round-execute` composes `SKILL-round-audit → SKILL-round-backlog → SKILL-round-orchestrate → SKILL-round-verify-publish`. Two adopter pilots surfaced semantic ambiguity that this ADR resolves:

- **TEAT G1:** Round 3 closed with `Verdict: clean` while simultaneously writing 22 `kind:defer` decision records — the round generated 22 backlog items but the orchestrate phase dispatched zero waves (TEAT had `wave_timeout_ms: 500`). Verdict semantics conflate "no gate failed and no blocker open" with "round delivered the work it planned." Per Article 39, this is **false precision** — the operator reads "clean" as "done," but the work was not done.
- **SGP G1:** Round 15 closed with four `kind:escalate` records (`DEC-0001..4`) for gate failures, but the persisted evidence contains only a `gate_id`, `cmd`, `exit_code`, and 1-KB stdout/stderr tail. The operator cannot distinguish: (i) real gate failure, (ii) stale DEVAI default command pointing at a binary SGP doesn't ship, (iii) `docs-links` gate against an adopter that has no `docs-links` mapping in `.devai/config/project.json` (the actual SGP case), or (iv) closeout implementation bug. Per Article 32 (sensor adapter uniformity), the gate-evidence shape is under-specified.

The skill currently has implicit composer semantics — it plans and dispatches but does not block on wave delivery. This ADR makes the semantics explicit, preserves backward compatibility for existing CLI consumers, and gives worker 06 a precise spec.

## Decisions

### Decision 1 — Explicit `mode` flag with default = `compose` (current behavior)

**Decision.** Add an optional `mode: 'plan' | 'compose' | 'execute' | 'closeout'` input. Default = `compose` (current four-phase composition). Modes:

- `plan` — emit the `RoundPlan` evidence only; do not invoke sub-skills. For dry-runs and previewing.
- `compose` — current behavior: invoke audit → backlog → orchestrate → verify-publish in sequence. **Default.**
- `execute` — reserved for a future executor that blocks on per-wave delivery (real wave execution, not prompt-emission). **Worker 06 reserves the keyword; semantics deferred to a later round.**
- `closeout` — invoke `SKILL-round-verify-publish` only (assume audit/backlog/orchestrate already ran out-of-band). For human-driven rounds.

**Rationale.** Per Article 39, an explicit mode flag makes the operator's intent legible to the verdict computation. The current implicit "compose" semantics confused TEAT — the operator believed they were "executing" a round but were in fact dispatching prompts the operator was meant to consume separately. Default = `compose` preserves every existing CLI invocation's behavior (Article 36 self-application requirement: cannot break our own consumers).

**Alternatives considered.**
- (b) Fixed semantics (no flag) — rejected: this is exactly what produced the TEAT misread. A single fixed mode either over-blocks (refuses to return until waves deliver, which a prompt-emission substrate cannot guarantee) or under-blocks (current behavior — false-precision "clean").
- (c) Two-valued flag (`plan | execute`) — rejected: collapses the closeout-only case (re-running verify on an existing round dir) into either side and forces operators to re-author the audit/backlog they already have.

### Decision 2 — Verdict taxonomy

**Decision.** Five verdicts. The verdict is a pure function of three inputs: `deferred_count` (backlog items without a clean wave), `gate_fail_count` (gates that ran and exited non-zero), and `wave_statuses` (per-wave status from `readWaveLogStatuses`):

| Verdict | Condition |
|---|---|
| `clean` | `gate_fail_count == 0` AND `deferred_count == 0` AND no wave status is `aborted` AND no blockers open. |
| `with-blockers` | `gate_fail_count > 0` OR open blockers > 0 (and not `aborted`). |
| `deferred` | `gate_fail_count == 0` AND `deferred_count > 0` AND no wave status is `aborted` AND no blockers open. |
| `partial` | At least one wave `clean` AND at least one wave `aborted` or `deferred_count > 0`. |
| `aborted` | At least one wave status is `aborted` (orchestrate hard-failure). Preserved from the current implementation; renamed from "aborted" continues to mean the same thing. |
| `failed` | Closeout itself errored (uncaught exception in verify-publish, baseline unreadable, etc.). Distinct from `aborted` — `aborted` is a domain outcome; `failed` is a substrate error. |

**Aggregation precedence (highest wins):** `failed` > `aborted` > `with-blockers` > `partial` > `deferred` > `clean`.

**Why this matters.** TEAT's case maps to `deferred` (22 deferred items, 0 gate failures, 0 blockers, no aborts) — not `clean`. SGP's case maps to `with-blockers` (4 gate failures) — unchanged from current behavior in word, but the gate-evidence (Decision 3) and `not-configured` handling (Decision 4) sharpen what each failure means.

**Alternatives considered.**
- Three-state (clean/with-blockers/aborted) — rejected: cannot distinguish "no gates failed but no work shipped" from "no gates failed and work shipped," which is the TEAT G1 problem.
- Adding `mixed` instead of `partial` — rejected: `partial` is the established term in the BUILD-PLAN narrative for "some-but-not-all waves clean."

### Decision 3 — Gate-evidence schema (per-gate, persisted in skill evidence JSON)

**Decision.** Every gate result persists this shape under `evidence.executed_artifacts.gate_results[]`:

```json
{
  "gate": "lint",
  "status": "pass" | "fail" | "not-configured" | "error",
  "command": "pnpm lint",
  "argv": ["pnpm", "lint"],
  "cwd": "/abs/path/to/repo",
  "exit_code": 0,
  "started_at": "2026-05-24T22:24:10.123Z",
  "ended_at": "2026-05-24T22:24:11.456Z",
  "duration_ms": 1333,
  "stdout_tail": "…last 4096 bytes…",
  "stderr_tail": "…last 4096 bytes…",
  "stdout_path": ".devai/state/skills/SKILL-round-verify-publish/<run-id>/gate-lint.stdout.log",
  "stderr_path": ".devai/state/skills/SKILL-round-verify-publish/<run-id>/gate-lint.stderr.log",
  "source": "devai-default" | "project-config" | "extra-gate",
  "config_key": "hardFailGates.lint",
  "cli_bin": "/abs/path/to/devai/cli/bin.js"
}
```

**Required fields:** `gate`, `status`, `source`. Other fields are required when applicable (e.g., `command`/`exit_code` absent when `status == not-configured`).

**Truncation policy.** `stdout_tail` and `stderr_tail` cap at 4096 bytes (up from current 1000) for inline triage; full streams persist to the `*.log` paths above when length exceeds the tail. The `*_path` fields are relative to `repoRoot`.

**Rationale.** Per Article 32, sensor adapters emit through a normalized schema (`SensorReading`). A close-time gate is a sensor on the round; its evidence must let an external auditor (or sibling adopter) reproduce the result without re-running. SGP's G1 is exactly the missing-fields case: command, cwd, exit, log path. `source` distinguishes a DEVAI-shipped default from an adopter override — without it the operator cannot tell whether a failure is "our problem" or "their config."

**Alternatives considered.**
- Persist full stdout/stderr inline — rejected: round evidence files would explode on large test suites. Tail + path is the standard tradeoff.
- Drop `started_at`/`ended_at`, keep `duration_ms` only — rejected: time-of-day matters when correlating with adopter CI logs.

### Decision 4 — Missing gate handling: `not-configured` is a first-class status

**Decision.** When the adopter `.devai/config/project.json` has no command mapping for a gate AND the DEVAI default cannot resolve (e.g., `docs-links` against a non-DEVAI-self repo with no `devai` CLI bin), the gate result is:

```json
{ "gate": "docs-links", "status": "not-configured", "source": "project-config", "reason": "no mapping in .devai/config/project.json and no devai CLI bin on PATH" }
```

**Verdict aggregation treats `not-configured` as neutral** — it does NOT count toward `gate_fail_count`. It IS counted in a separate `gate_not_configured_count` field on the verdict computation for operator visibility, and surfaces in `Closeout.md` as `Gates: P pass / F fail / N not-configured`.

**No decision-ledger record is written for `not-configured`.** SGP G1 root cause was DEC-0004 (`docs-links` failed) — the gate had no mapping. Under this decision, no DEC is written; the closeout footer shows the gate as `not-configured` and the operator can opt to add a mapping.

**Rationale.** Per Article 39, "explicit uncertainty over false precision" — a missing mapping is structurally different from a failed command. Treating them identically (current behavior) drives every adopter through the same fix-or-suppress dance for legitimately-inapplicable gates. Per Article 32, a sensor that cannot execute reports `unknown`/`not-configured`, never `fail`.

**Alternatives considered.**
- Treat missing as `fail` (current) — rejected: produces SGP's false-positive decision ledger.
- Treat missing as `skipped` — rejected: `skipped` implies a positive operator choice (an `--skip-gate docs-links` flag); `not-configured` is a passive absence.
- Require every adopter to declare every gate explicitly — rejected: high friction for first-touch adopters; defeats the "DEVAI ships sensible defaults" posture.

### Decision 5 — CLI exit-code semantics: default 0, opt-in `--strict-exit`

**Decision.** `devai skill-run SKILL-round-execute` exits 0 for ALL verdicts by default (preserves the current contract that the autonomous loop and existing adopter integrations rely on). A new `--strict-exit` flag on `skill-run` flips this: exit codes become:

| Verdict | Default exit | `--strict-exit` exit |
|---|---|---|
| `clean` | 0 | 0 |
| `deferred` | 0 | 10 |
| `with-blockers` | 0 | 20 |
| `partial` | 0 | 30 |
| `aborted` | 0 | 40 |
| `failed` | 0 (skill returned `status:fail`) → CLI maps to 1 currently | 50 |

The skill's own `status` field (top-level `pass`/`fail`) is unchanged: `pass` for everything that completed (any of clean/deferred/with-blockers/partial/aborted), `fail` only for `failed`. The CLI's existing `status: fail → exit 1` behavior is preserved.

**Rationale.** Default-non-zero would break every adopter consuming the skill from a CI pipeline today (TEAT, SGP, PEC, stynx). `--strict-exit` opts the operator into "any non-clean is a script error," which is what tight CI integration wants.

**Alternatives considered.**
- Default non-zero — rejected: breaking change for all current consumers. Violates Article 36 self-application precedent (we don't break our own pilots).
- Exit codes encoded in a single bit — rejected: distinct exit codes (10/20/30/40/50) let CI scripts dispatch on verdict without parsing JSON.

### Decision 6 — Backward compatibility and migration

**Decision.** Default behavior is byte-compatible with the R5/R6 closeout shape for the `clean` and `with-blockers` cases. Breaking changes are gated behind opt-ins:

| Change | Default? | Opt-in |
|---|---|---|
| `mode` flag | New input; absent = `compose` (current) | — |
| Verdict expansion (`deferred`, `partial`, `failed`) | Active by default. **Breaking for adopters who parsed the verdict string and assumed `clean`/`with-blockers`/`aborted` exhausted the space.** | — |
| Per-gate evidence schema additions (`started_at`, `ended_at`, `stdout_path`, `source`, `config_key`) | Active by default. Additive — consumers reading existing keys are unaffected. | — |
| `not-configured` gate status | Active by default. **Breaking for SGP (which had `docs-links` failing) — they will see one fewer DEC-0004-style decision next round.** This is the intended fix. | — |
| `--strict-exit` non-zero exit | Off by default | `--strict-exit` |
| `stdout_tail` cap 4096 (was 1000) | Active by default. Additive — larger tails don't break parsers. | — |

**Adopter migration:**

- **SGP** — no action required. The next round will show `docs-links` as `not-configured` instead of failing; DEC-0004 will not be written. If SGP wants the gate to actually run, they add a `docs-links` command to `.devai/config/project.json`.
- **TEAT** — no action required. The next round that defers backlog will report `Verdict: deferred` instead of `Verdict: clean`. TEAT consumers parsing the verdict must accept `deferred` (one of the five values).
- **PEC** — no action required for default operation. Recommend adopting `--strict-exit` once they're ready for CI to fail on non-clean rounds.
- **stynx / DEVAI itself** — adds `mode: 'compose'` explicitly to round-execute invocations for legibility; not required for correctness.

**Cited articles:** Article 36 (self-application: we cannot ship a release that breaks our own pilots without an opt-in), Article 38 (JSON canon: the verdict and gate-evidence are JSON-typed, not free-text).

## Consequences

**Positive.**
- TEAT G1 closes: a deferred-backlog round reports `deferred`, not `clean`. The decision ledger is no longer self-contradictory.
- SGP G1 closes: gate evidence carries command/cwd/exit/timing/log paths and distinguishes `not-configured` from `fail`. No more false-positive DEC-0004.
- Per Article 32, gate sensors become uniform with other DEVAI sensors (normalized evidence shape).
- The `mode` flag preserves a path to a real executor (`mode: execute`) without committing to it now.

**Negative / trade-offs.**
- Verdict expansion from 3 to 5 states is a breaking change for any consumer that pattern-matched the verdict string. The migration table makes this explicit; no opt-out is provided because the current shape is wrong (TEAT G1).
- `--strict-exit` is a new CLI surface area; one more flag to document.
- Per-gate log files (`stdout_path`/`stderr_path`) add filesystem writes on every round close; cleanup is the operator's responsibility (cleanup ADR is a separate question; see "Out of scope").

## Out of scope

- Real `mode: execute` semantics (executor that blocks on per-wave delivery). Reserved keyword only; deferred to a later round.
- Log file rotation / cleanup policy for per-gate `stdout_path`/`stderr_path`. Separate ADR if it becomes a footprint problem.
- Per-invariant change_policy on the verdict (Article 14) — verdict is a round-level signal, not an invariant.
- Concurrency on the decision-ledger writer (Non-DEC #1 — composer concurrency). Sequential round execution assumed.

## Implementation notes for worker 06

Worker 06 implements this ADR in `packages/core/src/skills/index.ts` (the `runGate`, `skillRoundVerifyPublish`, `skillRoundExecute`, `buildCloseoutMd`, and `appendDecisionRecord` sites) and `packages/cli/src/commands/skill-run.ts` (the `--strict-exit` flag).

**Concrete tasks:**

1. **`runGate` signature change.** Return shape becomes the full per-gate evidence object (Decision 3). Add `started_at`/`ended_at`/`duration_ms`/`stdout_path`/`stderr_path`/`source` fields. Bump `stdout_tail`/`stderr_tail` cap to 4096. Write full streams to disk when length > 4096. Look up the gate command in `.devai/config/project.json` first (key path: `hardFailGates.<gate>` or `gateCommands.<gate>` — pick one and document); fall back to the existing DEVAI defaults. When neither resolves, return `status: 'not-configured'` with a `reason` string.

2. **Verdict computation refactor.** Extract a pure `computeRoundVerdict({ gateResults, waveStatuses, blockers, deferredCount })` function returning the five-state enum per Decision 2. Unit-test this function exhaustively (every triple of inputs → exactly one verdict).

3. **`mode` input plumbing.** Read `ctx.inputs?.mode` in `skillRoundExecute.run`; route to the four code paths. Validate the value; unknown values → `status: fail` with a usage hint listing the four accepted values. `mode: 'execute'` returns `status: fail` with `reason: 'mode=execute reserved for a future round; use mode=compose (default)'`.

4. **`not-configured` ledger suppression.** In the `(a) Failed gates` ledger-write loop in `skillRoundVerifyPublish`, skip records where `g.status === 'not-configured'`. Add a separate `executed_artifacts.gate_not_configured_count` field.

5. **Closeout footer.** Update `buildCloseoutMd` to render `Gates: P pass / F fail / N not-configured` (current is `Gates: P/T green`). Render the verdict string verbatim (one of the five values).

6. **CLI `--strict-exit`.** Add the boolean flag to `skill-run` in `packages/cli/src/commands/skill-run.ts`. When `--strict-exit` is present AND the skill is `SKILL-round-execute`, map the verdict (read from `result.evidence.executed_artifacts.verdict` for compose mode, or from the verify-publish sub-result) to the exit codes in Decision 5. Default behavior (no flag) is unchanged.

7. **Schema update.** No JSON Schema in `docs/framework/schemas/` directly types round-execute evidence (it's free-form `evidence: unknown` on skill results). No schema change needed in `docs/framework/schemas/`; however, the round-execute skill doc (`docs/reference/skills/round-execute.md`) gains an "Evidence shape" section documenting the gate-evidence schema for adopter consumption.

8. **Tests.** Unit tests on `computeRoundVerdict` (Decision 2 exhaustive matrix). Unit tests on `runGate` for the `not-configured` path. Integration test on `skillRoundVerifyPublish` against a fixture with a missing-mapping gate, asserting no DEC is written. Integration test on TEAT-style deferred-backlog round asserting `Verdict: deferred`.

9. **Worker 07 (D-A-42) consumes this.** Worker 07's decision-ledger closure logic must read the new `gate_not_configured_count` and the per-gate `source` field to attribute ledger entries correctly. Worker 06 publishes these fields; worker 07 reads them.

**Per-batch verification gates (per `CLAUDE.md`):** `pnpm lint && pnpm typecheck && pnpm test`. `pnpm test:integration` separately (known to hang on R6 F-4 — note in commit body).

## Next steps

- **R10-W3-06** (worker 06): implement per the spec above. Cross-link this ADR from any code comments at the verdict-computation site.
- **R10-W3-07** (worker 07): close decision-ledger writer per D-A-42; consumes worker 06's `source`/`gate_not_configured_count` fields.
- **Future round:** real `mode: execute` semantics (blocking executor). Out of scope here.
