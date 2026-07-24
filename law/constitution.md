---
id: CONSTITUTION
title: DEVAI-II Constitution (1.0.0 candidate)
type: constitution
status: draft
date: 2026-07-23
authority: Architect (founding ratification = BR-1/W01, per Article 40 successor process)
supersedes: null
superseded_by: null
provenance: REV-0001 + W01-annex deltas applied 2026-07-23 (Arts 1/6/9 amended in place, Art 42 added; see annex crosswalk)
---

# DEVAI-II Constitution — 1.0.0 candidate

**WIREFRAME DRAFT — regenerated from the pre-W01 review draft (REV-0001). This text
carries no authority until the founding ratification (BR-1/W01) authored under a declared
Architect session with the ratified genesis attestation. The first forty articles below
are the predecessor's live 0.6.0 text transposed mechanically; Articles 41–42 and the W01
annex are new. The predecessor's amendment history (0.1.0-0.6.0) is NOT carried here — it remains,
frozen, in the archived predecessor; this constitution's own amendment history begins
empty at 1.0.0 with a genesis pointer.**

# DEVAI Constitution

**Version:** 0.6.0
**Status:** ratified for implementation

This is the immutable axiom set for DEVAI. Every other artifact in the framework — contracts, charters, skills, bootstrap layout, scorecard — derives from these axioms and may not contradict them.

The constitution is part of substrate F5 (Harness). It is upgraded only via the DEVAI release process and version-bumped per change. Client repositories inherit the constitution at bootstrap time and pin to a specific version; constitutional upgrade in a client is an explicit `devai upgrade` operation, never an implicit one.

The constitution states what must always be true. It does not state how mechanisms are implemented; those are in skills, charters, and contracts.

---

## Part I — Mission and frame

### Article 1. Purpose

DEVAI is a multi-loop, multi-dimensional control and governance harness for human-directed, AI-assisted software development on a declared stack. The primary stack is NestJS, Angular, Postgres; additional stacks are supported through stack-adapter packs carried as F5 policy artifacts. Each adopter repository declares exactly one resolved stack; the framework's mechanisms assume a declared stack per repository, not stack universality. Its supported production purpose is to keep human- or externally-agent-actuated development within declared authority, specification, safety, and evidence limits. Autonomous controllers may exist only as explicitly enabled experimental F5 policy and do not inherit production-readiness claims from the supported harness.

DEVAI is a grounded framework, not a product: it has no hosted offering, no SaaS surface, and no end-user product UI; its scope includes brownfield reverse-documentation of existing repositories. It ships as an embedded package inside the adopter repository — never as an external control plane. [1.0.0: absorbs ex-D-51/D-57 and ex-D-4 per the absorption manifest.]

### Article 2. Control-theoretic frame

The framework treats software development as a discrete-time control system:

- Documents (specifications) are the reference signal.
- Code (the plant) is the system under control.
- Tests (sensors) measure plant behavior against reference.
- Error is the deviation of measurements from reference.
- Humans, and agents explicitly directed by humans, supply control input to the plant.
- DEVAI constrains that input, measures error, blocks unsafe state transitions, and records evidence.

This frame is binding on framework vocabulary, mechanism design, and gate semantics.

### Article 3. Operating mode

DEVAI operates as a steady-state regulator. There is no terminal "done" state. Humans or authorized external callers add and dispatch work; DEVAI regulates it through the control loop and retains evidence of its disposition. The supported harness never invents, dequeues, edits, merges, or publishes work on its own. An explicitly enabled experimental controller may automate a bounded subset, subject to stricter F5 policy and without production-readiness standing.

---

## Part II — Substrates and properties

### Article 4. Fundamental substrates

The framework partitions all artifacts in a client repository into five fundamental substrates. Each substrate has a distinct authority, a distinct file population, and a distinct sensor regime.

- **F1 — Specification.** The reference signal. Includes business specs (Owner-authored), engineering specs (Architect-authored), invariants, trace, ADRs, glossary, contracts.
- **F2 — Plant.** Application code under control. Source code, migrations, configurations, infrastructure-as-code, build scripts.
- **F3 — Observation.** Sensors. Tests at all levels, plus the configurations of executable sensors (linters, type-checkers) when those configurations encode intent rather than ambient defaults.
- **F4 — Inventory.** Plant-identification artifacts. Derived deterministically from F1, F2, F3. Never authored.
- **F5 — Harness.** The DEVAI machinery as instantiated in the client repo. Includes this constitution, contracts schemas, skill manifests, agent prompts, role configurations.

### Article 5. Transversal properties

Every substrate is evaluated against the same nine transversal properties. The Cartesian product of substrates and properties defines the aspect grid against which the scorecard is computed.

- T1 — Coverage
- T2 — Depth
- T3 — Coherence
- T4 — Alignment
- T5 — Idiomaticity
- T6 — Security and Privacy
- T7 — Performance and Efficiency
- T8 — Robustness
- T9 — Discipline

Some cells in the aspect grid are degenerate (e.g., Inventory × Idiomaticity) and are marked N/A in the scorecard.

### Article 6. Substrate authority-by-path

Authority is enforced by filesystem path for every write performed through the DEVAI runtime. The runtime refuses writes that violate this mapping before mutation. The mutation call-site denominator is mechanically derived; it admits zero unauthorized sites and zero exemptions, and the derivation gate must demonstrably fail on stale fixtures. Editors, shells, and external agents outside the runtime require a declared host-enforcement adapter; DEVAI must report that boundary rather than imply control it does not possess.

Authority is decided by a fixed path prefix of at most two segments — a table lookup, never a wildcard rule with a default remainder:

- `law/` — Architect (F1-law: constitution, register, ADRs, schemas, invariants, trace, policy sources; `law/glossary/` joint with Owner).
- `product/` — Owner (F1-business: journeys, use-cases, stories, rules, mandates).
- `work/rounds/` — Architect (F1-intent: round plans, amended by dated appendix, never rewritten).
- `work/audit/` — Auditor (F1-observation: the role's only writable tree; carries no authority over the reference signal).
- `docs/` — Architect (published human documentation).
- `record/` — machine only: `record/derived/` (F4) is written only by the regeneration subsystem; `record/proofs/` is appended only by executing verbs, hash-linked, attributed to the verb and committed by the session that produced it. A human edit under `record/` is an authority violation regardless of role.
- `.devai/pin/` and `.devai/config/` — modified only via `devai upgrade`, materialized byte-identical from `law/policy/` sources; a checker never writes its own inputs.
- `.devai/state/` — mutable head state written by executing verbs; never hand-edited.
- `packages/` and root workspace configuration — Engineer (F2).
- `tests/` and `packages/*/tests/` — Inspector (F3).
- `scratch/` — ephemeral; never committed beyond its README; content graduates only by an explicit role-authored commit to a governed tree.
- Root prose files (`README.md`, `CLAUDE.md`, `AGENTS.md`) — Architect.
- Host-tool configuration directories (`.changeset/`, `.claude/`, and peers) — path fixed by the toolchain; contents classified by this table per content class (agent permission policy is F5-host under Architect authority; runtime directories are scratch-class).

Clients may extend the path mapping for client-specific disciplines. Extensions are additive; the core mapping is immutable at a given constitution version. [1.0.0: enumeration rewritten to the successor layout per the absorption manifest; resolves the predecessor's F4 enumeration drift.]

---

## Part III — Roles and authorities

### Article 7. Human roles

A human user of DEVAI declares one of five roles at session start. The declaration constrains which runtime actions and externally operated agent disciplines the harness may authorize during that session. Cross-role work requires a session boundary. DEVAI does not infer a role or silently elevate it.

- **Owner.** Business and behavioral authority. Authors and modifies business specifications under F1 Owner-authority paths.
- **Architect.** Engineering authority. Authors and modifies engineering specifications, invariants, trace, and ADRs under F1 Architect-authority paths.
- **Inspector.** Sensor authority. Authors and modifies tests under F3 paths.
- **Engineer.** Plant authority. Authors and modifies code under F2 paths.
- **Auditor.** Observer authority. Read-only on all substrates. Produces reports, scorecards, backlogs, and status assessments, written only to the designated Auditor observation path (Article 6: `work/audit/`); runtime-recorded F5 state produced by verbs it executes is attributed to those verbs (Article 6, F5 state paths). Outside those designated outputs, the Auditor role makes no commits that modify F1, F2, F3, or F5. Observation output carries no authority over the reference signal: an Auditor report may recommend, never ratify.

### Article 8. Agent disciplines

Each human role has a corresponding externally operated agent discipline with the same authority constraints. Agent disciplines may be specialized (e.g., Engineer subtypes for Backend, Frontend, DBA, UI/UX) but specializations share the parent discipline's authority and protocol; they differ only in expertise prompts and tool access. This correspondence does not authorize DEVAI to dispatch an agent without human initiation except under explicitly enabled experimental policy.

Inspector and Auditor are non-extensible singleton disciplines, to prevent sensor-calibration fragmentation and observation-authority fragmentation respectively. Owner, Architect, and Engineer are extensible under their respective authority classes.

### Article 9. Authority chain

The authority chain is:

**Human > Constitution > Architect/Owner > Contracts > Engineer**

Closer-to-code documents lose against higher-level documents when they contradict. A function-level docstring that contradicts an architecture ADR loses; an ADR that contradicts the constitution loses; the constitution loses only to the human Architect operating outside any session (via `devai upgrade`).

This rule prevents the canonical failure mode of agents rewriting high-level documents to match code they have written.

Weakening any fail-closed authority property requires a new explicit register decision; where the change touches Articles 6 through 10, it requires constitutional amendment. No policy artifact, extension, or operational convenience may accomplish either implicitly. [1.0.0: absorbs the ex-D-136 change-control clause, sole-carried in the predecessor.]

### Article 10. Authority separation in a single loop iteration

Within a single human-directed work iteration, no discipline may both set its own reference and actuate against it. Architect may not edit code; Engineer may not edit tests; Inspector may not edit specifications. Cross-substrate work in a single role session is therefore impossible by design; coordinated work traverses the authority chain via coupled task triplets (Article 24).

---

## Part IV — Specifications and invariants

### Article 11. Invariant as atomic spec unit

The atomic unit of Architect-authored specification is the invariant. An invariant has a unique ID of the form `INV-<DOMAIN>-<NNN>`, a severity (`constitutional`, `hard-fail`, `gate`, `warn`, or `advisory`), a type, a canonical statement, a rationale, a scope, a change policy, a verification declaration, and authority anchors back to source documents. `constitutional` and `hard-fail` invariants are not overridable and require an Architect amendment; `gate` invariants block their declared gate but may accept a justified, expiring invariant override; `warn` invariants surface without blocking; `advisory` invariants are non-binding guidance.

Invariants are the control setpoints of the framework. Every test references one or more invariants. Every scorecard computation is ultimately reducible to invariant-level measurements.

The readiness-bearing severity set is exactly `constitutional`, `hard-fail`, and `gate`. `warn` and `advisory` remain observable but are not readiness-bearing. A readiness or strategy-coverage computation over the readiness-bearing set must resolve at least one invariant; resolving an empty set is a gate failure and never a passing, ready, or complete result.

### Article 12. Owner-authored specs and compilation

Owner-authored artifacts (journeys, user stories, acceptance criteria, business rules) constitute the business tier of the reference signal. They are written in a structured natural-language schema and are not themselves invariants.

The link between Owner-authored artifacts and Architect-authored invariants is explicit: every Owner artifact references the invariants it depends on (zero or more). The `elicit` skill assists Owners and Architects in identifying invariant gaps relative to business artifacts.

### Article 13. Trace

Trace is the F1 artifact that maps each invariant to:

- The Owner or Architect documents that justify it (authority anchors).
- The tests that probe it (test references with reliability metadata).
- The code areas that implement it (path globs).

Trace lives at `law/trace.json` under Architect authority. Inspector and Engineer consume trace but never edit it. Trace completeness ratios are deterministic gate inputs.

### Article 14. Per-invariant change policy

Each invariant declares its own mutability rules in a `change_policy` field, including: what artifacts must be updated together when the invariant changes, whether test weakening relative to this invariant is permitted, and whether human approval is required for changes. The DEVAI runtime enforces these rules for actions it executes; host adapters enforce them for declared external-tool surfaces.

This grades the authority chain at invariant granularity. A security-critical invariant can require human approval to modify even within an authorized Architect session.

---

## Part V — The control loop

### Article 15. Loop entry through triage

Every failure that enters the framework is classified by the triage skill before a human authorizes remediation. Triage assigns each failure to exactly one of four classes:

- **plant-bug** — code violates clear specification. Routes to Engineer.
- **sensor-error** — test, probe, or adapter is incorrect, stale, or misconfigured. Routes to Inspector.
- **policy-issue** — harness policy or threshold is misconfigured. Routes to harness review.
- **reference-gap** — specification is silent, contradictory, or ambiguous. Routes to Architect or Owner via RGR (Article 22).

No discipline begins feedback work until triage has classified the failure and a human has selected or approved its route. Experimental controllers may perform the bounded dispatch only when their policy is explicitly enabled.

### Article 16. Cycles

The loop has three cycle levels:

- **Cycle A** — within-iteration checkpoint. Type-check, lint, affected-only unit tests. Runs during human-directed or externally operated agent work. No iteration counter advance.
- **Cycle B** — pre-merge gate. Full hard gate on task scope. Iteration cap applies here.
- **Cycle C** — post-merge integration. Full scorecard including soft gates and Auditor regeneration. Runs once per merge.

### Article 17. Hard gate

The hard gate is the deterministic component of Error(0). It comprises:

- Type-check clean on affected projects.
- Lint clean on errors (warnings handled by `Plant × Discipline`).
- Build succeeds for all affected apps.
- All assigned unit, integration, API, DB, E2E, and journey tests pass.
- Migrations apply cleanly from empty database.
- Contract validation: OpenAPI, JSON Schema, SQL DDL contracts validate; generated artifacts regenerate to identical bytes.
- Inventory regenerates without error.
- AST-diff test-weakening check: weakening does not exceed configured thresholds (Article 30).

A merge requires the hard gate fully green. The hard gate is non-negotiable.

### Article 18. Soft gate

The soft gate is the stochastic component of Error(0). It comprises LLM-judged scorings against documented rubrics for: spec coherence, plant idiomaticity not covered by linters, test depth and non-triviality, spec-to-test traceability quality, and mutation-testing kill rate where applicable.

Every gate verdict is tri-state: **PASS**, **REVIEW**, or **FAIL**. PASS allows merge; FAIL blocks merge; REVIEW triggers the tie-breaker ladder (Article 23) before resolution. The hard gate emits only PASS or FAIL; the soft gate may emit any of the three.

When a model performs soft-gate evaluation, it is distinct from the working agent — at minimum a different model instance with no shared context, preferably a different model family from the tie-breaker ladder. The human initiates the evaluation in the supported harness. This prevents an agent from being evaluator of its own output.

A merge requires both gates at or above their thresholds. Thresholds live in `.devai/scorecard/thresholds.json` with DEVAI-supplied defaults and per-client overrides permitted.

### Article 19. Iteration cap and bump-model escalation

A mutation-capable Cycle-B convergence attempt is bounded by policy and explicit human consent. The supported default is one attempt; a human may authorize a larger bounded value. Exhaustion blocks the task and returns control to the human.

When experimental autonomous execution is explicitly enabled, its policy may authorize three default-tier attempts plus one bumped-tier attempt. The bump counts as the fourth and final attempt. Failure after that attempt produces `experimental_blocked`; it never authorizes an automatic merge, replacement task, or destructive cleanup.

Cycle-A micro-iterations within a Cycle-B attempt do not count against the cap. The cap exists to prevent agent thrashing, not to prevent work.

### Article 20. No automatic revert

Once work has been merged to the integration branch and the post-merge gate has passed, that work is committed history. The framework shall not roll back integration HEAD as part of any automated remediation. Rework caused by rebase onto new integration HEAD is not a revert; it is normal pipeline behavior.

A human Architect may deliberately spawn a corrective task that performs a `git revert` of a specific merge. This is a human action, not framework automation.

### Article 21. Escalation lifecycle (convergence failure)

When a task is returned to human after iteration-cap exhaustion:

1. Backlog entry status changes to `escalated` with full failure context.
2. Task branch is preserved; an experimental controller may record the intended `escalated/<task-id>` name but shall not claim a rename it did not perform.
3. Module locks held by the task are released.
4. Recoverable work and its worktree are preserved until explicit human disposition; disposable databases may be dropped only after their connection details and relevant evidence are retained.
5. Human is notified via the configured channel.
6. The orchestrator does not spawn a replacement task. Resolution awaits human action.

Human resolution paths: adopt the escalated branch in a human-owned worktree (not counted against the worktree cap); edit the specification to make the task feasible and re-queue; or cancel. Escalated branches are preserved indefinitely; pruning is a manual human-invoked operation.

### Article 22. Reference Gap Report (RGR)

Any agent discipline (Engineer, Inspector, Auditor) may emit an RGR when triage classifies a failure as reference-gap, or when the discipline encounters a specification ambiguity it cannot resolve within its authority.

RGR contains: the invariant or artifact under examination, the specific ambiguity, the impacted surfaces, the risk classification, evidence gathered, and an optional non-authoritative suggested resolution. The RGR also carries structured questions (each with a qid and optional candidate answers) so that resolution by the Architect or Owner is concrete rather than open-ended.

RGR pauses the emitting task: module locks released, branch preserved as `rgr/<task-id>`, worktree destroyed, backlog entry status changes to `rgr-pending`. The RGR routes as a high-priority backlog item to Architect or Owner.

When the spec update is merged to integration, the paused task becomes eligible for human re-queue with the RGR resolution as additional context. Experimental auto-resume requires explicit policy and must remain recoverable.

RGR is the only authorized upward semantic feedback path from implementation disciplines to specification disciplines.

### Article 23. Tie-breaking ladder

When two disciplines disagree on whether a change satisfies a specification, or when a soft-gate verdict is REVIEW, the resolution ladder is:

1. Independent verification by a model from a different family with the same context and prompt.
2. If still tied, escalate to a larger model in the same family.
3. If still tied, escalate to a larger model in the alternate family.
4. If still tied, escalate to human.

The concrete model families and the ladder's tier ordering are F5 policy configuration, not constitutional text; they are recorded in the harness policy artifacts and may change without constitutional amendment. In the supported harness each model invocation is human-initiated. Experimental automatic traversal requires explicit feature activation and remains non-promoting evidence.

The ladder applies to soft-gate scoring disputes, RGR ambiguity classification, triage classification confidence below threshold, and any other case where stochastic judgment governs.

---

## Part VI — Concurrency

### Article 24. Coupled task triplets

Work that spans the authority chain is grouped into human-coordinated coupled triplets: an Architect task that produces invariant changes, an Inspector task that produces tests for those invariants, and an Engineer task that produces code satisfying those tests. The three tasks share a `coupled_task_group` ID in the backlog.

Triplet branches form a pipeline:
- Architect branch is created from integration HEAD.
- Inspector branch is created from Architect's HEAD.
- Engineer branch is created from Inspector's HEAD.

Merge order respects the authority chain: Architect to integration first, then Inspector, then Engineer. Each merge triggers rebase of downstream pipeline branches.

Triplet branches may execute concurrently in separate worktrees. They synchronize via checkpoints (Article 26).

### Article 25. Module-level semantic locking

Concurrent tasks coordinate through module-level locks tied to F4 inventory units. Before a human-authorized task worktree is created, the DEVAI runtime acquires locks on the `(substrate, module)` pairs the task declares in its `target_modules` field.

If any required lock is held, the task is denied and re-queued with priority bump. After repeated denials a task is flagged blocked for human review.

Locks are held for the lifetime of the task worktree and released on merge, escalation, or RGR pause.

Locks are not held across coupled-triplet boundaries; each task in a triplet acquires and releases its own locks.

### Article 26. Checkpoints and pipelined rebase

Upstream branches in a coupled triplet emit explicit checkpoints when their work reaches a stable consumable state. In supported operation, humans authorize downstream rebase at checkpoint and merge boundaries. Experimental automatic rebase requires explicit policy and may not discard uncommitted work.

Downstream branches do not rebase on every upstream commit. Checkpoint cadence is at the upstream discipline's discretion, with one mandatory checkpoint at task completion.

### Article 27. Worktree discipline

All externally operated agent work governed by DEVAI occurs in dedicated worktrees under `.devai/worktrees/<task-id>`. The repository root checkout is reserved for human use; governed agents do not operate in the root.

The active agent worktree count is capped. The cap value is a harness policy parameter, not constitutional text; the decision log records the current default. Harness-owned worktrees (the persistent inventory worktree, the human-adopted review worktrees for escalated branches, the dedicated soft-gate evaluator worktree) are tracked separately and do not count against the cap.

A worktree is provisioned with cache symlinks to shared `node_modules`, TypeScript build cache, Jest cache, and ESLint cache, provided the package lockfile hash matches the integration HEAD. On lockfile mismatch, the worktree falls back to fresh install.

### Article 28. Single integration branch

The repository has a single integration branch (`main`). Task branches merge directly to it. No `staging` layer exists in the default DEVAI configuration.

---

## Part VII — Sensors and observation

### Article 29. Test as sensor

A test is a sensor on the plant. Tests measure plant behavior against specification. Tests are not malleable documentation and must not be modified to make failing code pass.

Inspector authority over tests is constrained by Article 30 (weakening) and by trace (Article 13): every test references the invariant or invariants it probes.

### Article 30. Test weakening prohibition

Every commit touching F3 is AST-diffed against its parent commit. Weakening events are quantified by metrics including: change in assertion count, change in expect-call count, change in HTTP-status assertions, addition of `skip`/`todo`/`only` annotations, and removal of invariant references.

A test change is **unjustified weakening** when its weakening metrics exceed configured thresholds in `.devai/scorecard/thresholds.json` AND the weakening does not correspond to a tracked invariant change (deprecation, retirement, or scope reduction with Architect commit).

Default thresholds: maximum 20% assertion-decrease ratio per file, absolute floor of one assertion, exempt when test-case count increases (split-not-weaken pattern). Clients may tighten or loosen thresholds per-aspect.

Unjustified weakening produces a hard-gate `FAIL`. Weakening within thresholds but without tracked invariant change produces `REVIEW`. The Inspector or Engineer must either strengthen back, justify against an invariant change, or emit an RGR.

Per-invariant `change_policy.test_weakening_allowed: false` overrides all thresholds for tests referencing that invariant: any weakening is unjustified regardless of magnitude.

An Inspector acting outside a coupled triplet has no authorized route to weaken a test independently. Relaxation of an over-strict assertion requires either an Architect invariant change (Article 24) or an RGR (Article 22).

### Article 31. Flaky test quarantine

Tests identified as flaky by repeated non-deterministic outcomes may be moved to quarantine. Quarantined tests carry metadata in trace (`flaky: true`, `quarantine: true`, optional ticket reference) and are excluded from hard-gate failure aggregation.

Quarantine is a temporary state subject to Auditor scrutiny. The Auditor surfaces the quarantine list periodically and pressures it toward zero. A quarantined test that remains broken indefinitely is itself a hard-gate failure of `Observation × Discipline` and surfaces in the scorecard.

### Article 32. Sensor adapter uniformity

Every executable sensor emits its output through a normalized `SensorReading` schema: status, evidence path, timestamp, command, command hash, failure mode, optional structured findings. Scorecard composition is polymorphic over sensor types via this contract.

---

## Part VIII — The auditor and the backlog

### Article 33. Auditor as state estimator

The Auditor is outside the control loop. It does not actuate; it observes and reports. The Auditor regenerates the F4 inventory, recomputes the scorecard, compiles the backlog from scorecard deltas, and updates the status assessment.

### Article 34. Auditor spawn cadence

The Auditor runs:

- Automatically after every merge to integration, in the persistent inventory worktree, as a post-merge hook.
- On demand by human request.
- On demand by a human or explicitly enabled experimental controller before a task batch.
- Never on a timer; the framework is quiescent when integration is quiet.

### Article 35. Backlog as the only work queue

All governed work entering the framework passes through the backlog. Humans and authorized external callers add and select tasks via explicit backlog operations. The supported harness does not dequeue by itself. An experimental controller may dequeue only when explicitly enabled and must label all resulting evidence experimental. There is no direct task injection that bypasses the backlog.

This invariant gives the controller a single queue to regulate.

---

## Part IX — Self-application and harness governance

### Article 36. DEVAI applies to itself

The F5 substrate is scored by the same scorecard machinery that scores F1 through F4. The constitution, contracts, charters, skills, and prompt registry are subject to coherence, alignment, and discipline measurement.

Drift between the framework version installed in a client and the upstream DEVAI release is itself a scorable property of F5.

### Article 37. Prompt composition is governed

Prompts supplied to human-directed or experimental agents are composed deterministically from global, role, task, and payload components. Each composition records component hashes and an overall stack hash. Drift in any component hash is detectable and attributable.

When prompt behavior is part of a governed loop, prompt fingerprints may be frozen and tracked as sensors on F5.

### Article 38. JSON canon

All machine-readable artifacts produced or consumed by the DEVAI engine are JSON. Markdown is valid only for prose documents, prompt bodies, and human-readable reports. Markdown does not carry canonical machine-readable metadata.

### Article 39. Explicit uncertainty over false precision

When uncertainty remains after available checks, the framework records explicit uncertainty rather than fabricating precision. A scorecard cell may be reported as `unknown`; a triage classification may be reported as `inconclusive`; a soft-gate score may be reported with a confidence interval.

---

## Part X — Amendments

### Article 40. Amendment process

Amendments to this constitution are made only via the DEVAI release process. A client repository pins to a specific constitution version and adopts amendments by explicit `devai upgrade` action.

The constitution's history is preserved indefinitely. Every amendment records: the article changed, the prior text, the new text, the rationale, and the version bump.

Clients may not amend the constitution locally. Client-specific rules go into policy artifacts under F5, not into the constitution.

---

## Part X continued — Succession (new at 1.0.0; Part X retitled "Amendments and succession")

### Article 41. Succession

Succession is the replacement of this constitution and its substrate by a successor framework in a new substrate. Succession is not amendment: Article 40 changes articles within a continuing constitution; succession ends this constitution's active life and founds another. Neither process may be used to accomplish the other — an amendment may not transfer the corpus to a new substrate, and a succession may not be declared to evade the amendment process.

Only the Owner may declare succession. A declaration while any round is open, or by any other role, or by any automated process, is void. The declaration is recorded verbatim in a terminal decision of the predecessor's decision log, authored by a declared Architect session; that terminal decision is the predecessor's final substantive record.

Succession transfers law and only law. Decisions, invariants, schemas, and doctrine cross to the successor solely through an absorption manifest: an audited, hash-bound classification of the predecessor's corpus, produced under Auditor observation before the declaration and cited by the terminal decision. Content absent from the manifest does not transfer; importing it is a new successor decision, never an inheritance.

Evidence standing does not transfer. Verdicts, readiness, gate authorizations, promotions, soak maturities, and every other evidence-earned standing are void in the successor unless the genesis attestation names them, each marked either as attested history — citable, never load-bearing — or as void pending re-establishment under the successor's own law. The successor opens with zero readiness-bearing standing and earns its own.

The genesis attestation is the single crossing point between predecessor and successor. It is a schema-valid record binding the predecessor's final tree identity, evidence-chain head, terminal decision, and manifest hashes. It carries data, never authority: nothing the predecessor wrote binds the successor until a successor act of ratification adopts it. The attestation is immutable once ratified; correcting it requires a new successor decision, never an edit.

The predecessor is frozen, complete and unaltered, and is preserved as the successor's archive. It is not edited, trimmed, reformatted, or destroyed; its errors and errata are preserved as recorded. Its identifiers are retired with it and are never re-minted in any successor.

A succession makes no claim. Neither the terminal decision nor the genesis attestation establishes completion, readiness, autonomy, or product standing for either framework.

Every successor constitution ratified under this article must itself contain an article materially equivalent to this one. A succession into a constitution lacking such an article is invalid.

---

## W01 ANNEX — application crosswalk (deltas applied 2026-07-23; W01 ratifies)

The six annex deltas are now IN the article text above, each marked with a bracketed `[1.0.0: …]` provenance note at its application site. Status:

1. **Article 6 rewrite → APPLIED.** Static-prefix table per the Part VII layout; F4 enumeration drift resolved (`record/derived/`); host-tool contents row added; mutator source gate (delta 3) embedded in the enforcement paragraph.
2. **Change-control clause → APPLIED** to Article 9 (ex-D-136 sole-carried).
3. **Zero-exemption mutator gate → APPLIED** in Article 6; full precision remains ADR-001 delta A1.1.
4. **Universal uncheckable-evidence rule → APPLIED via new Article 42 (Part XI — Evidence)**, which also closes a defect this application discovered: the live predecessor text had NO evidence article — the manifest's "Articles 32–33 cover D-24" verification was wrong, and the corpus's "Article-32 chain" citations are a numbering fossil. Article 42 also constitutionalizes error-is-never-a-verdict and FAIL-persistence (CTX-05/07 candidates, promoted).
5. **PROMOTE-residue absorption → APPLIED to Article 1** (framework-not-product ex-D-51/57; embedded-package ex-D-4). Verified already covered: D-12 coupled triplets = Article 24 (read and confirmed); D-146/D-164 evidence-promotion contract deliberately stays ADR-tier (ADR-003 successor).
6. **Altitude sweep → APPLIED in R-0001/P1.** The sweep findings and policy-routing
   backlog are recorded in `work/rounds/R-0001/law-altitude-sweep.md`. Article 42 remains
   in Part XI: it is a constitutional evidence doctrine, while relocation would create
   needless anchor churn without changing meaning.

W01's remaining authoring work: the crosswalk table (article ↔ source for all 42) and
ratification itself. Nothing here binds until then.

## Part XI — Evidence

### Article 42. Evidence

Evidence is hash-chained and append-only. Every claim the framework makes about work — verdicts, closures, readings, runs — resolves to records bound into the chain by content hash with exact identity: exact tree, exact inputs, exact outcomes. Records are written by executing verbs, attributed to the verb, and never edited; correction is a new appended record, never a change.

Judge-only or otherwise independently uncheckable evidence never establishes readiness. An error is never a verdict: a crash, timeout, missing input, or infrastructure failure is a failure to observe, and a failure to observe never manufactures a PASS, a FAIL, or a readiness claim. A recorded FAIL is superseded only by a newer observation of the same kind, never by absence from a computation subset.

[1.0.0 placement note: retained as Article 42 in Part XI by R-0001/P1 because the live predecessor text had no evidence article — the manifest's "Articles 32–33 cover D-24" verification was wrong (those are sensor uniformity and the Auditor), and the corpus's "Article-32 chain" citations are a numbering fossil from an earlier constitution version. Retention preserves existing article anchors without changing the doctrine.]
