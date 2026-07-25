# DEVAI User Guide

A 30-minute narrative introduction to DEVAI. Read top-to-bottom on your first pass; come back to specific sections later.

For a step-by-step adoption walkthrough, see [`adoption.md`](./adoption.md).
For per-role responsibilities, see [`roles/`](../roles).
For the canonical vocabulary, see [`glossary/`](../../law/glossary).
For per-CLI-verb reference, see [`cli/`](../reference/cli.md).

---

## 1. What DEVAI is

DEVAI is a **human-supervised governance and control harness** for AI-assisted software development. Concretely, it gives you:

- **A reference signal** — your specs, expressed as machine-checkable invariants.
- **Sensors** — tests, type-checks, linters, runtime probes, all wrapped as uniform observations.
- **A supervised control path** — humans or explicitly operated tools steer while DEVAI senses, triages, scores, constrains, and records.
- **An experimental autonomous loop** — separately opted-in research machinery that stops for human review and cannot establish supported readiness.
- **An audit trail** — every action emits an evidence record on a tamper-evident hash chain.
- **An authority model** — five roles, each with a strict path-based scope, mechanically enforced inside DEVAI and by any declared host adapter.

The framing is control-theoretic (per D-1): documents are the **reference signal**, code is the **plant under control**, tests are **sensors** that measure plant against reference, and agents are **controllers** that drive error toward zero.

This is not a metaphor. It governs:

- _Which artifacts have authority_ (the reference signal is binding; the plant is not).
- _How concurrency is mediated_ (worktrees + locks per task).
- _How failures are routed_ (triage classifies; backlog queues; loop acts).
- _How convergence is gated_ (the scorecard's verdict, not "looks good to me").

## 2. What DEVAI is _not_

- **Not a replacement for CI tooling.** DEVAI wraps `tsc`, ESLint, vitest, Playwright; it does not reimplement them.
- **Not a code generator.** DEVAI orchestrates feedback between specs, tests, and code; it does not bypass the need for any of them.
- **Not a universal parser for every stack.** NestJS + Angular + Postgres + pnpm
  remains DEVAI's deepest reference implementation, but each adopter declares
  one resolved stack and adjacent stacks use explicit stack-adapter packs for
  detection, paths, prompt overlays, and templates. A pack improves governed
  discovery without pretending that every framework-specific parser exists;
  unsupported depth is reported conservatively rather than hidden.
- **Not a replacement for human judgment.** When the harness can't decide, it escalates. The escalation is structured (RGRs, Article-23 ladder, human approval); silent guessing is the failure mode the framework is designed to prevent.

## 3. The five roles

Five roles, declared at session start (per D-3, Article 6):

| Role          | Owns                                                                                                  | Cannot touch                                       |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Owner**     | Business specs (`product/`), joint glossary                                                           | Engineering specs, code, tests                     |
| **Architect** | Engineering specs, invariants, trace, ADRs, schemas, ops + security specs                             | Code, tests                                        |
| **Engineer**  | Application code (`packages/`, `apps/`)                                                               | Specs, tests, harness state                        |
| **Inspector** | Tests at all levels (unit, int, e2e, sec, perf)                                                       | Code, specs                                        |
| **Auditor**   | Read-only toward product/reference state; emits observations under `scratch/sessions/rounds/*/audit/` | Anything that actuates or ratifies reference state |

The chain is enforced inside the **DEVAI CLI/runtime**. Arbitrary shell/editor enforcement requires a declared host adapter; instructions alone are advisory. See [`security/authority-enforcement.md`](../dev/security/authority-enforcement.md) for the boundary.

Cross-role work requires a **session boundary**: commit, declare the new role, continue. See [`roles/`](../roles) for per-role walkthroughs.

The Auditor sits **outside the loop** — it observes but never actuates. That structural choice makes Auditor observations trustworthy.

## 4. The reference signal

The reference signal lives in `docs/`. Three primary artifact types:

### Invariants (`law/invariants/`)

The atomic unit of Architect-authored specification (D-6). Each invariant is a JSON file `INV-<DOMAIN>-NNN.json` validating against `invariant.schema.json`. Key fields:

- `statement` — the rule, in CNL form (`<Actor> <MODAL> <Behavior> [WHEN] [UNLESS] [WITHIN]`). See [`architecture/invariant-authoring.md`](../theory/architecture/invariant-authoring.md).
- `severity` — one of the 5-tier ladder: `constitutional | hard-fail | gate | warn | advisory` (Phase 10.A, `GE-026`).
- `authority.docs[]` — the prose anchors that introduce the concept.
- `code_areas` — where the plant surface lives.
- `change_policy` — what's required to amend this invariant.

### Trace (`law/trace.json`)

The mapping from invariants to tests + code areas (D-8). Architect-authored, Inspector-consumed. Determines which test claims to measure which invariant.

### Glossary (`law/glossary/`)

Joint Owner + Architect authority. Each entry `GE-NNN.json` defines a canonical term. Used by `inv glossary` to measure term coverage across F1 + F2.

## 5. The substrates

Per D-2, repository content partitions into five orthogonal substrates:

| ID  | Name                     | Authority          | Examples                                    |
| --- | ------------------------ | ------------------ | ------------------------------------------- |
| F1  | Architecture specs       | Architect          | `docs/theory/architecture/`, `law/schemas/` |
| F2  | Application code (plant) | Engineer           | `packages/*/src/`, `apps/*/`                |
| F3  | Tests (sensors)          | Inspector          | `test/`, `tests/`, `**/*.test.ts`           |
| F4  | Inventory (derived)      | None (regenerated) | `record/derived/inventory/inventory.json`   |
| F5  | Harness state            | Framework          | `record/proofs/` chain, locks, worktrees    |

Each substrate is scored against 9 **transversal properties** (T1 Correctness, T2 Performance, T3 Lifecycle, T4 Concurrency, T5 Adherence, T6 Security & Privacy, T7 Observability, T8 Verifiability, T9 Maintainability). The 5×9 grid is the **scorecard** (`GE-014`).

`devai inventory regen` is a read-only sensor: it emits the validated record to
stdout and does not write repository state implicitly. Persisting that output
under `record/derived/inventory/inventory.json` is a separate, explicit host
redirection or governed recording step.

Two cells are NA (Inventory × Security, Harness × Performance); the other 43 are scored green/yellow/red.

## 6. The experimental autonomous loop

> **Experimental — non-production.** This surface requires project `feature_flags.autonomous_loop=true` plus `--experimental --write`, preserves recoverable work, and stops at `awaiting_human_review` or `experimental_blocked`. It never merges, pushes, completes tasks, destroys worktrees, or promotes supported readiness. See the [experimental runbook](../dev/operations/loop-runbook.md) and its promotion checklist.

The experimental loop (`devai experimental loop run`, Phase 9.D) executes one bounded iteration per cycle after explicit activation:

```
   ┌─────────┐
   │  Sense  │    Run sensors (sense type-check, lint, test, …)
   └────┬────┘
        │ emits SensorReadings
        ▼
   ┌─────────┐
   │  Triage │    Classify failures: plant-bug / sensor-error /
   └────┬────┘    policy-issue / reference-gap
        │
        ▼
   ┌─────────┐
   │  Score  │    Aggregate readings into the 5×9 scorecard
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │  Assess │    Gate decision: pass / review / block
   └────┬────┘
        │ if block:
        ▼
   ┌─────────┐
   │   Act   │    SKILL-feedback-iteration: LLM-bounded edits
   └────┬────┘    inside allowed_write_scopes; re-sense
        │
        ▼
   (stop at human review OR experimental block)
```

If the iteration cap is hit, the **Article-23 ladder** kicks in: try a bumped model in the same family, then a cross-family fallback, then escalate to human (Article 19).

If triage classifies a failure as **reference-gap**, the loop emits an RGR (Reference Gap Report, `GE-018`), pauses the task, and waits for the Architect to resolve. The resolved invariant supersedes the old one; the task resumes.

The loop is governed by:

- `DEVAI_LLM_BUDGET_USD` — cost cap (Article 30, [`operations/loop-runbook.md`](../dev/operations/loop-runbook.md)).
- `--max-iterations` — iteration cap per loop run.
- `--dry-run` — plan only, no LLM calls or edits.

## 7. Concurrency

Two or more agent tasks routinely run simultaneously. DEVAI handles this with:

### Worktrees (Phase 5, Article 27)

Each task gets its own git worktree, branch, and (optionally) database. Multiple agents build / test / commit in parallel without stepping on each other. The cap is 6 concurrent worktrees (D-11).

```bash
devai work task spawn --task TASK-0042 --with-worktree --with-db --base main
devai work worktree list
devai work task complete TASK-0042 --destroy-worktree
```

See [`operations/worktree-runbook.md`](../dev/operations/worktree-runbook.md).

### Locks (Phase 5)

When two tasks would edit the same module, locks coordinate. File-based by default; Postgres advisory-lock backend for multi-host coordination (Phase 9.G).

```bash
devai work lock acquire --target packages/core/src/inventory/ --holder TASK-0042 --ttl 1800
devai work lock list
devai work lock release --id LOCK-abc
devai work lock reap   # clean up expired
```

See [`operations/lock-runbook.md`](../dev/operations/lock-runbook.md).

### Task lifecycle

Tasks have a state machine: `queued → ready → in_progress → checkpoint → pre_merge → merging → completed | escalated | rgr_pending | cancelled`. Atomic transitions; persistent. See `GE-017`.

## 8. Skills and the LLM substrate

Skills are **Layer-2 actions** — composite operations beyond single CLI verbs. Each skill has:

- A manifest (`SkillManifest`, `GE-036`) declaring inputs, allowed write scopes, evidence files, redaction patterns, agent class × permission tier (Phase 10.G).
- A run implementation: deterministic for routine skills (commit-push, triage, scorecard compute); LLM-backed for the harder ones (feedback-iteration, review-dry, elicit, align-docs, compile-tests-from-docs, mutation-test).

```bash
devai agent skill list
devai agent skill run SKILL-assess-state --repo-root .
```

Mutating LLM-backed skills have an additional R28 report-only provenance
contract. Their `--inputs-file` JSON must contain a schema-valid
`mutation_intent` whose `base_sha` is the clean dedicated worktree's current
commit and whose task, role, invariant demonstrations, touched paths, and
effects match trusted repository state. The caller cannot provide a translation
witness or candidate SHA. After exactly one skill run, DEVAI derives the actual
delta, creates a sole-parent candidate commit under an R28 namespaced ref, and
only then records the witness. Failed or skipped skill records remain evidence
but are ineligible for campaign counting. A truthful review record may enter
independent validation, but it counts only with the explicit Architect
disposition required by the R28 campaign contract.
See
[`mutation-intent.schema.json`](../../law/schemas/mutation-intent.schema.json)
and
[`ADR-006`](../../law/adr/README.md).

The LLM substrate (`@devai-nyx/core/llm`, Phase 9.B) supports Anthropic Claude, OpenAI Codex, host CLI bridges for `claude` / `codex`, and an explicit mock backend. When no backend is configured, DEVAI prefers natural host CLI credentials (`claude-cli`, then `codex-cli`) before falling back to mock. Provider switching is via env vars; cost is tracked in `record/proofs/llm-usage.jsonl`.

See [`security/secret-handling.md`](../dev/security/secret-handling.md) for API-key handling, [`security/prompt-firewall-notes.md`](../dev/security/prompt-firewall-notes.md) for prompt-overlay safety.

## 9. The release surface

Phase 11.B added three verbs that close the deploy-time governance loop:

| Verb                              | What                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `devai release gate`              | Aggregates scorecard + invariants + sensor freshness into a verdict.                                     |
| `devai release postdeploy verify` | Compares observed audit-chain head vs. artifact's claimed head. Mismatch → block + rollback recommended. |
| `devai release runtime drift`     | Records observation deltas between deployed runtime and artifact.                                        |

Each emits a `release-control` record (`GE-033`) at `record/proofs/releases/REL-NNNN.json`. Per Phase 11.B.

## 10. Runtime probes

Phase 11.A added a sensor family that exercises a **deployed runtime**, not just static analysis or tests against fixtures:

```bash
devai sense runtime api  --charter charters/health.json
devai sense runtime auth --charter charters/rbac.json
devai sense runtime data --charter charters/db.json
```

The charter (`runtime-charter.schema.json`) declares mission, target URL or DB, in-scope invariants, allowed credentials (env-var `secret_ref` only, never inlined), probes with `expect: { status, contains, absent, invariant }`. The arbiter summary classifies pass/fail/review against the charter.

See `GE-031` (Runtime probe).

## 11. RGRs — when the spec is wrong

The most important thing the framework does **not** do silently: guess when the spec is ambiguous. When an Engineer task finds a real reference gap (the invariant is silent, contradictory, or unclear), the Engineer **emits an RGR**:

```bash
devai govern rgr emit \
  --task-id TASK-0042 \
  --discipline engineer \
  --summary 'auth refresh spec silent on stale tokens' \
  --ambiguity 'INV-AUTH-007 says reject expired but does not define expired' \
  --evidence EV-abc12345 \
  --invariant INV-AUTH-007 \
  --question 'Should expired = past expires_at or past last_used_at + grace?'

devai work task pause rgr TASK-0042 --rgr-id RGR-0001
```

The task is suspended. The Architect resolves the RGR by updating the invariant (with a `version` bump) and:

```bash
devai govern rgr resolve RGR-0001 \
  --resolver architect@example.com \
  --answer Q1=reject_past_expires_at \
  --resulting-commit <sha>
```

The paused task automatically detects the superseding invariant version and resumes. The full audit trail is preserved.

See `GE-018` (RGR), [`roles/architect.md`](../roles/architect.md), [`roles/engineer.md`](../roles/engineer.md).

## 12. The RTD bundle

Phase 12.A added the **Reference Traceable Document** bundle: a single signed manifest aggregating invariants + trace + journeys + glossary + tombstones + ADRs + forbidden-actions.

```bash
devai spec rtd bundle --strict --format human
```

Each slice carries a SHA-256 content hash + sub-verdict from its distributed validator. The bundle as a whole has `manifest_hash` — a single citable handle: `RTM-NNNN sha256:<hash>`. Useful for: external consumption (one signed document), point-in-time spec snapshots, cross-repo references.

See `GE-034` (RTD manifest).

## 13. Examples in this repo

| Path                                                                                                                                              | What                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`examples/sample-f1/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/examples/sample-f1/)                     | Minimal F1 fixture: 2 invariants, 1 journey, trace. Used by `spec validate-*` integration tests.                                                                                                                                                                                                                                                                                                       |
| [`examples/sample-nest-angular/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/examples/sample-nest-angular/) | NestJS + Angular fixture: 3 modules, 3 routes, 3 components. Exercises the `inv` extractors.                                                                                                                                                                                                                                                                                                           |
| [`examples/law-pack/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/examples/law-pack/)                       | 15-invariant scaffold pack distilled from the deleted `stech-law` predecessor. Adoptable wholesale into a NestJS+Angular+Postgres greenfield client.                                                                                                                                                                                                                                                   |
| [`examples/redox-pack-*/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/examples/)                            | 7 stack-adapter packs (Phase 17.G): NestJS+Postgres+React, NestJS+Postgres+Angular, 3 Laravel variants (Angular / Blade / React-Blade via Inertia), Express+Knex+Postgres+Angular, Java+Spring+Oracle+AngularJS. Each declares detection signals + per-writer-skill prompt overlays. Used by `devai adopt pack resolve` (auto-detect) and `devai adopt pack graduate` (curator pulls seed invariants). |
| [`examples/devai-self-baseline/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/examples/devai-self-baseline/) | DEVAI's own dep-graph captured by `devai sense inventory dep graph` (Article 36 dogfood). Regression anchor for the framework's own module structure.                                                                                                                                                                                                                                                  |

Read each `README.md` to understand the role each fixture plays.

## 14. Brownfield adoption (Phase 17, D-57)

Phase 17 added a **brownfield-adoption substrate**: an end-to-end chain that takes an existing repo (no DEVAI artifacts yet) and produces structured invariant candidates + draft documentation. The chain:

```
devai init plan --target .
devai init apply-owner --target . --as-role owner --write
devai init apply-architect --target . --as-role architect --write
devai init apply-f5 --target . --introspect --as-role architect --write
devai adopt upgrade --target . --as-role architect --write
      ↓
devai sense {api,routes,data-model,data-handling,rbac,dep-graph,coverage}
      ↓ (7 inventory sensors at tier L0, deterministic)
record/proofs/sensors/inventory_*/<body>.json
      ↓
devai inventory suggest --from-inventory
      ↓ (5 candidate categories)
record/proofs/inv-candidates/INV-CANDIDATE-*.json
      ↓ (Architect curation, optionally augmented by:)
devai adopt pack resolve                 # which stack-adapter pack matches?
devai adopt pack graduate     # copy pack's seed_invariants into the catalog
      ↓
law/invariants/INV-CLIENT-*.json
      ↓
devai docs synthesize all          # prose docs from inventories + invariants
      ↓
docs/Overview.md, docs/Architecture Guide.md, docs/ERD.md, …
docs/diagrams/erd.png              # via `devai docs render mermaid` if mmdc on PATH
```

The five candidate categories `inv suggest` flags:

| Category               | Source sensor           | Suggested severity | Related invariant |
| ---------------------- | ----------------------- | ------------------ | ----------------- |
| `unmapped_route`       | inventory_coverage      | gate               | INV-INVENTORY-001 |
| `unmapped_endpoint`    | inventory_coverage      | gate               | INV-INVENTORY-001 |
| `unbound_endpoint`     | inventory_rbac          | gate               | INV-INVENTORY-003 |
| `unlabeled_pii_column` | inventory_data_handling | hard-fail          | INV-INVENTORY-002 |
| `forbidden_edge`       | inventory_dep_graph     | hard-fail          | INV-INVENTORY-004 |

Each `INV-CANDIDATE-*.json` carries a `suggested_invariant` skeleton (title, statement, severity_suggestion, measurable_via_suggestion, rationale) the Architect curates and graduates into a real `INV-CLIENT-*` record.

The 14 writer skills (`SKILL-write-overview`, `SKILL-write-architecture-guide`, `SKILL-write-erd`, …) consume the inventory bodies + apply per-stack prompt overlays from any matching pack. The compliance family ships three regime-specific siblings — `SKILL-write-compliance-lgpd` (Brazil), `SKILL-write-compliance-gdpr` (EU), `SKILL-write-compliance-ccpa` (California / CPRA) — all sharing INV-INVENTORY-002 as the hard-fail gate; multi-regime repos run any subset independently. Deterministic mock tests cover writer wiring. Explicit `DEVAI_LLM_TESTS=1` integration evidence currently covers four named writer surfaces only; it is not evidence that every writer ran against a real provider.

Sensor-side `extractor_params` support is explicit, not all-or-nothing. The generated [sensor registry](../reference/sensor-registry.md) lists the exact consumed keys and the declared-only hints. Existing API extraction remains NestJS-shaped; Laravel, Express, and Spring AST parsers are absent. Existing route extraction supports React and Angular; Blade and AngularJS parsers are absent. Treat output for those stacks as partial and independently validate it.

## 15. Where to go next

In rough order of how useful each will be on your first deep dive:

1. **[`adoption.md`](./adoption.md)** — 12-step adoption walkthrough.
2. **[`roles/`](../roles)** — pick the role(s) you'll occupy.
3. **[`architecture/invariant-authoring.md`](../theory/architecture/invariant-authoring.md)** — CNL writing discipline.
4. **[`glossary/`](../../law/glossary)** — canonical vocabulary.
5. **[`operations/`](../dev/operations)** — production-flavored runbooks (evidence chain, locks, worktrees, the loop, capacity, SLOs, incident playbook).
6. **[`security/`](../dev/security)** — threat model, authority enforcement, audit, secrets, forbidden actions, inv-override, prompt firewall.
7. **[`cli/`](../reference/cli.md)** — per-verb reference (auto-generated; current).
8. **`law/constitution.md`** — the immutable backbone. Read when you need to reason about authority, substrate, or escalation.
9. **[`law/adr/README.md`](../../law/adr/README.md)** — the canonical decision-record index. Read the applicable record when you wonder why something is the way it is.
10. **[`record/derived/indexes/round-ledger.md`](../dev/round-ledger.md)** — generated navigation for closed, hash-sealed rounds.

## 16. Asking for help

- Open an issue with `devai doctor --format human` output.
- Cite specific record IDs (`EV-…`, `SR-…`, `AR-…`, `INV-…`, `RGR-…`, `REL-…`) rather than paraphrasing.
- **Never paste secrets.** The redaction filter scrubs harness-emitted records but does not scrub issue bodies. See [`security/secret-handling.md`](../dev/security/secret-handling.md).

---

_This guide is auto-tracked against the action catalog and glossary by the `devai docs links` audit (Phase 13.C). Broken cross-references fail CI._

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/user-guide.md (classification CURRENT).
