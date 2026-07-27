# Round-break — operational playbook

**Authority:** Architect (cross-repo). Anchored by [CONVENTIONS.md §7](./CONVENTIONS.md#7-work-break-rounds-waves-phases-steps); this doc is the operational deep dive.
**Audience:** anyone authoring or executing a DEVAI round in any adopter repo.

## 1. Hierarchy & naming

```
ROUND   R<n>             first-tier division; strictly sequential; ≥1 wave
 └─ WAVE    R<n>-W<m>    one prompt + one log; may sometimes parallelize
     └─ PHASE   R<n>-W<m>-<L>          optional grouping
         └─ STEP    R<n>-W<m>-<L>.<num>   finest unit
```

- `<n>`, `<m>`, `<num>` are positive integers.
- `<L>` is an uppercase letter (A, B, C, …).
- Phases and Steps are optional; many waves are flat (steps execute inline).
- Step numbering restarts within each phase: `W2-A.1`, `W2-A.2`, `W2-B.1`, …
- When a wave has no phases, steps may still exist: `R3-W2.1`, `R3-W2.2`. The phase letter is omitted.

**Scope-collision note: the word "Phase" appears at TWO scopes.** Round-execution Phase (this doc — identifier `R<n>-W<m>-<L>`, letter within a wave) is distinct from project-lifecycle Phase (`Phase NN`, integer, lives in work/rounds/R-0001/plan.md). The BUILD-PLAN ladder also carries **sub-batches** (`NN.A`, `NN.B`) which nest under project-lifecycle Phase ONLY — they do NOT belong to the round / wave / round-execution-Phase / step hierarchy in this doc. See [`build-plan-convention.md`](./build-plan-convention.md) for the disambiguation table and the four-tier nesting summary.

## 2. Round artifacts

Committed round intent remains in place for its entire lifecycle. Disposable composer
products are kept separately and never become durable merely by existing. After factual
close, `devai round archive` validates the closure preconditions and appends idempotent
close state to the same round directory; the action name is compatibility vocabulary,
not a filesystem move. See the [governed-round ceremony](./governed-rounds.md).

```
work/rounds/R-NNNN/                  ← COMMITTED ARCHITECT INTENT, CLOSES IN PLACE
├── plan.md                          ← required governed plan
├── record.json                      ← schema-authoritative after declaration
├── prompts/
│   ├── 00-orchestrator.md
│   └── <nn>-<wave>.md
└── close-state.jsonl                ← idempotent in-place close state

work/audit/R-NNNN/                   ← AUDITOR-ATTRIBUTED OBSERVATIONS
├── as-built.md
└── <bounded audit reports>

.devai/state/round-runs/R-NNNN/      ← IGNORED, DISPOSABLE RUNTIME STATE
├── backlog/                          ← backlog + prompt proposals
├── orchestrate/                      ← per-wave runtime logs
└── verify-publish/                   ← local closeout material

record/proofs/compliance/closures/
└── PC-NNNN.json                      ← MACHINE-EMITTED CLOSURE
```

### `inv/` vs `diag/` — sharp role split

- **`inv/`** holds machine-readable measurements. Round-open snapshot, round-close snapshot. The diff between them is the round's measurable outcome. Cheap; pulls from existing `record/proofs/sensor-readings/` whenever possible. Only synthesize new measurements when the round explicitly needs them.
- **`work/audit/R-NNNN/`** holds Auditor-authored observation prose in separate,
  role-pure commits.
- When `inv/` is absent, the closure record and gate evidence carry the verdict
  by other means.

## 3. plan.md

The round's _why_, _what_, and acceptance criteria. Reads as a one-pager an outside reviewer can understand. Stable for the round's duration (re-edit only on scope changes, document the change at the bottom).

Required sections:

- **Goal** — one sentence.
- **Round number** — `<n>`. Predecessor SHA, successor TBD.
- **Scope** — wave table: id, slug, goal, role, effort, risk.
- **Wave dependencies** — sequence diagram or list.
- **Acceptance criteria** — local close, with-blockers acceptance, publishable close.
- **Risk** — known risks per wave.

Optional sections:

- **What this round does NOT do** — explicit exclusions, especially deferred items.
- **Predecessor work absorbed** — SHA list for retroactive-bookkeeping waves.

## 4. Orchestrator prompt — `prompts/00-orchestrator.md`

The round's _how_. Wave dispatch, gate declarations, fix-up policy, close procedure. The agent's playbook.

**Role:** strictly non-worker. The orchestrator declares + dispatches + gates + closes; it does not edit source files. Implementation work happens in waves.

Required sections:

- **Header** (YAML front matter; see [prompt-header.md](./prompt-header.md)).
- **Round goal** (cite `plan.md`).
- **Orchestrator role** statement (non-worker).
- **Wave catalog** — table mirroring `plan.md`'s scope, plus depends-on column.
- **Gate declarations** — mandatory minimum + scope-conditional.
- **Dispatch sequencing** — DAG or serial order.
- **Fix-up policy** — `max_iterations`, escalation.
- **Round close procedure** — step-by-step.

## 5. Wave prompt — `prompts/<nn>-<wave-desc>.md`

Each wave matches one prompt file. Filename: `<nn>-<slug>.md` where `<nn>` is two-digit zero-padded wave index and `<slug>` is lowercase-kebab-case.

Required sections:

- **Header** (YAML front matter).
- **Goal** — what this wave delivers.
- **Inputs** — files to cite (do not byte-copy).
- **Deliverables** — files to add/modify, by path.
- **Acceptance** — how to know it's done (mechanical gate command + verification rule).
- **Logging** — what to append to this wave's `.log`.

Optional sections:

- **Phases** — if the wave is large enough.
- **Notes** — guidance for the executor.

## 6. Prompt-header metadata

Every prompt under `prompts/` carries a YAML front-matter header:

```yaml
---
role: owner | architect | inspector | engineer | auditor
effort: low | medium | high
model: <id> # optional; only when distinction matters
vendor: <id> # optional; only when distinction matters
---
```

See [prompt-header.md](./prompt-header.md) for the spec, semantics, and authoring guidance.

## 7. Log templates

### Per-wave log — `.devai/state/round-runs/R-NNNN/orchestrate/<nn>-<slug>.log`

> **Gitignore trap.** A common `.gitignore` rule is `*.log` (catches every log file repo-wide), which silently swallows these mandatory wave logs. Adopters MUST add an exception:
>
> ```gitignore
> *.log
> !.devai/state/round-runs/R-*/orchestrate/*.log
> ```
>
> Runtime logs are intentionally ignored and must not be force-added. Attributable
> observations derived from them belong in `work/audit/R-NNNN/` under Auditor authority.

Created on wave completion. Minimum mandatory template:

```markdown
# R<n>-W<m> — <wave-desc>

**Closed:** YYYY-MM-DDTHH:MM:SSZ
**Status:** clean | blocked | aborted
**Files touched:**

- ADD <path>
- MOD <path>
- MV <old> → <new>
- DEL <path>

**Gates:**

- lint: pass | fail
- typecheck: pass | fail
- tests: N/M passed
- (other gates declared by 00-orchestrator.md, when relevant to this wave)

**Summary:** <one paragraph of what happened>
```

Optional extensions (when relevant):

```markdown
**Phases:**

- R<n>-W<m>-A: <phase-desc> (steps A.1-A.3)
- R<n>-W<m>-B: <phase-desc> (steps B.1-B.5)

**Blockers raised:** (lift these into Closeout.md's blockers section)

- <blocker-id>: <description>

**Evidence chain entries:** EV-xxxx, EV-yyyy
```

Auto-generation: most fields populate from `git diff --name-status` between wave-open and wave-close commits plus gate exit codes.

### Orchestrator log — `.devai/state/round-runs/R-NNNN/orchestrate/00-orchestrator.log`

Different schema — captures dispatch + gate-rerun + escalation events rather than file actions. One row per event:

```
# R<n>-W0 (orchestrator) — work log

**Format:** one row per dispatch / gate-rerun / escalation event.
Entry types: DISPATCH, COMPLETE, GATE-RUN, GATE-FAIL, FIX-INVOKE, BLOCKER, CLOSE.

---

2026-mm-dd HH:MM  DISPATCH  W1     <wave-desc>
2026-mm-dd HH:MM  COMPLETE  W1     status=clean
2026-mm-dd HH:MM  GATE-RUN  lint   pass
2026-mm-dd HH:MM  GATE-FAIL typecheck   2 errors in packages/core/src/x.ts
2026-mm-dd HH:MM  FIX-INVOKE SKILL-fix-typecheck   iteration=1
2026-mm-dd HH:MM  GATE-RUN  typecheck   pass
2026-mm-dd HH:MM  CLOSE     verdict=clean  commits=<sha>,<sha>
```

The orchestrator log accumulates from round open to round close; never overwritten.

## 8. Disposable Closeout.md

The experimental composer writes this local comparison artifact under
`.devai/state/round-runs/R-NNNN/verify-publish/Closeout.md`. It is not the machine
phase closure and cannot establish durable standing. Template:

```markdown
# R<n> Closeout — <round-goal>

**Closed:** YYYY-MM-DDTHH:MM:SSZ
**Verdict:** clean | with-blockers | aborted
**Closing commit(s):** <sha>, <sha>, …

## Goal

<one-sentence restatement from plan.md>

## Outcome

<one-paragraph summary: what shipped, what didn't>

## Measurements

### Before (round-open)

<from inv/before.json if present; otherwise narrative gate state>

### After (round-close)

<from inv/after.json if present; otherwise narrative gate state>

### Delta

<diff: cells flipped, tests added, schemas added, files changed counts>

## Backlog disposition

- <item>: shipped (commit <sha>)
- <item>: deferred to R<n+1>
- <item>: escalated → <decisions-ledger entry>

## Blockers

<unresolved items needing human input; lift from each wave's log>

## Next round prep

<what should be on R<n+1>'s audit reading list>
```

## 9. Sequentiality + parallelism

### Round sequentiality

Strictly sequential by integer. `R<n+1>` may start only after `R<n>` reaches **local close** (see §11). `aborted` blocks; `clean` and `with-blockers` both unblock.

### Wave parallelism

Waves CAN sometimes be executed in parallel. The orchestrator's `00-orchestrator.md` dispatch sequencing declares which waves are parallel-safe.

A wave is parallel-safe with another wave when their declared write scopes don't overlap. Declared scopes come from the wave prompt's "Deliverables" section. The orchestrator may run parallel-safe waves concurrently or serially at its discretion — typically serial unless time pressure justifies the coordination overhead.

## 10. Gates

### Mandatory minimum (every round, every time)

- `lint`
- `typecheck`
- `test` (unit suite)
- `docs-links` (no broken refs in `docs/`)
- `action-coverage` (every CLI verb claimed by ≥1 invariant)

### Scope-conditional (declared by orchestrator when relevant)

- `test-integration` — round touched integration-test surface
- `coverage` — round added/removed testable code
- `mutation` — round touched mutation-tested packages
- `spec-validate-{invariants, trace, journeys, glossary, all}` — round modified F1 substrate
- `prompt-overlays` — round added/modified skills
- `forbidden-actions` / `adrs` / `overrides` — round touched governance config

**Effective gate set** = mandatory minimum ∪ orchestrator-declared scope-conditional.

### Gate processing algorithm at close

```
for gate in effective_gate_set:
    result = run(gate)
    if result == PASS:
        continue
    fix_skill = lookup("SKILL-fix-" + gate.id)
    if fix_skill exists:
        for iteration in 1..max_iterations:   # default 3, skill-overridable
            fix_skill.run()
            result = run(gate)
            if result == PASS: break
    if result == FAIL:
        record_blocker(gate, attempts=iteration)
```

### Fix-skill naming convention

`SKILL-fix-<gate-id>` where `<gate-id>` matches the sensor name or verb subnoun. The orchestrator predicts skill names from declared gates — `gate: docs-links` → `SKILL-fix-docs-links`. Catalog rows that don't exist are explicit gaps in the recovery surface (failure mode: clean "skill not registered" → straight to blocker).

## 11. Close criteria

### Local close

The round is _done_ inside the working repo:

- Every attempted wave has a runtime `.log` with an attributable status.
- The disposable `Closeout.md` exists under `.devai/state/round-runs/R-NNNN/verify-publish/`.
- All gates declared in `00-orchestrator.md` were re-run; results are captured locally.
- The product is in a valid usable state (gates green, or all reds are tracked as blockers).

### Publishable close

The round is also shareable externally:

- Local close, plus
- A commit named with the round identifier (commit message starts with `R<n>` or `Round-<n>`).
- SHA(s) of closing commit(s) are bound by the governed handoff and machine closure.

### Sequential close

The round unlocks `R<n+1>`:

- Publishable close (or local close, per the **liberal** sequentiality rule).
- `work/rounds/R-NNNN/plan.md` for the successor may now be drafted under fresh authority.

### Verdict semantics

| Verdict         | Condition                                                                                                | Product state                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `clean`         | All gates green, zero blockers, all backlog items disposed (shipped or properly deferred)                | Valid usable state ✓                                          |
| `with-blockers` | At least one declared gate is red and captured as a blocker requiring human input; remaining gates green | Valid usable state ✓ (within the documented blocker envelope) |
| `aborted`       | Round abandoned mid-execution; scope changed, work stopped, never reached close                          | NOT guaranteed valid; next round must audit                   |

`with-blockers` IS a valid local close. The product is in a usable state — gates pass except for known, documented exceptions. The round honestly reports its limits; the next round picks up the blockers.

## 12. Right-sizing guidance

A round should be the **largest unit** where:

(i) you can state the goal in one sentence, and
(ii) the gates declared at open are the gates re-run at close.

A round should be the **smallest unit** where:

(a) it has an objectively-statable goal, and
(b) the product is in a valid usable state at close.

A round must have at least one wave. The simplest legitimate round is one orchestrator prompt + one wave.

Effort affects fix-skill iteration policy (a low-effort wave's gate failure may warrant fewer fix-skill retries before lifting to blocker) but does NOT change the gate bar. A low-effort wave's output still has to clear the same gates as a high-effort wave's output.

## 13. Worked example — R3 anatomy

The canonical shape for a current round is:

```
work/rounds/R-NNNN/
├── plan.md
├── prompts/
│   ├── 00-orchestrator.md
│   ├── 01-work-break-canon.md
│   ├── 02-skill-manifest-bump-and-rename.md
│   ├── 03-catalog-fill-fix-skills.md
│   ├── 04-state-extensions.md
│   ├── 05-build-plan-convention.md
│   ├── 06-decisions-ledger.md
│   └── 07-absorb-pre-work.md
└── close-state.jsonl

.devai/state/round-runs/R-NNNN/
├── orchestrate/<wave>.log
└── verify-publish/Closeout.md
```

Governed intent and close state remain committed in place. Runtime logs and the
composer closeout remain disposable; an Auditor promotes only attributable
observations into `work/audit/R-NNNN/`.

## 14. Cross-references

- Anchor: [CONVENTIONS.md §7](./CONVENTIONS.md#7-work-break-rounds-waves-phases-steps).
- Prompt header: [prompt-header.md](./prompt-header.md).
- Round prompts library (B0..B4 templates the round-execute skills consume): [round-prompts/README.md](../dev/round-workflow/README.md).
- Round-execute skills: [`../reference/skills/`](../reference/skills).
- Skill manifest schema: [`../law/schemas/skill-manifest.schema.json`](../../law/schemas/skill-manifest.schema.json).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/round-break.md (classification CURRENT).
