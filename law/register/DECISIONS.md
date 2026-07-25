---
id: DECISIONS
title: DEVAI-II decision register
type: register
status: draft
date: 2026-07-23
authority: Architect (DII numbering binds at BR-1/W03; ratification at W01/W03)
supersedes: null
superseded_by: null
provenance: regenerated from REV-0002; record-meta fields applied per entry 2026-07-23 (provisional DII ids, W03 ratifies)
---

# DEVAI-II decision register

**WIREFRAME DRAFT — regenerated from the pre-W01 review draft (REV-0002). Nothing here
carries authority until ratified under a declared Architect session in the real BR-1.
Entries carry provisional DII identifiers; `[ex-D-nn]` suffixes preserve predecessor
provenance shorthand until W03 ratifies the register.
Evidence values are cited to the frozen predecessor, never restated.**

### DII-1. DEVAI-II is founded by absorption from devai-original under the terminal decision (locked; founding record)

**Decision.** DEVAI-II exists as the successor authorized by devai-original's terminal
decision, provisionally drafted as D-196 pending the human-run R-Ω close. Its law derives
exclusively from the absorption manifest bound there; its evidence standing starts at zero
except as enumerated in `genesis-attestation.json`, which is the single authoritative
crossing point between the two repositories. The attestation currently binds the
predecessor's pre-freeze HEAD and is explicitly provisional; it must be re-bound to the
frozen values after R-Ω. It is immutable once ratified: correcting it means a new numbered
decision, never an edit. Constitution 1.0.0, the seed register, and ADR-001..N are authored
against it. Nothing in this record or the attestation establishes readiness, autonomy, or
completion of anything.

Owner authorization (verbatim):

> As Owner, I authorize the succession of DEVAI into the successor repository under the
> terminal decision: the successor is bootstrapped by absorption per the dossier's
> manifest and instruments; evidence standing does not transfer; the predecessor closes,
> freezes, and is archived whole as the evidence archive. I confirm item 9: the pending
> in-place v1.0 ceremony is supplanted — the succession is the v1.0 ceremony, and the
> successor's founding release is DEVAI 1.0.0.
>
> — aarusso, Owner. Approved verbatim in session chat, 2026-07-23.

## 0. Register meta-rules

### DII-002 — Revisions are append-only
`type: meta-rule · status: draft · authority: Architect · provenance: ex-Reconciliations; ex-D-131 numbering note`

Revisions are append-only: a decision changes only by a new numbered entry superseding it, never by edit. Entry numbers are identity, not position.

### DII-003 — Retired identifiers are never re-minted (tombstone rule)
`type: meta-rule · status: draft · authority: Architect · provenance: ex-D-38`

Retired identifiers are never re-minted (tombstone rule): D-1..D-189, PC-0001.., REJ-1.., predecessor INV ids where retired.

### DII-004 — Canonical decisions live in this register
`type: meta-rule · status: draft · authority: Architect · provenance: ex-D-47`

Canonical decisions live in this register; ADRs are the client-facing architectural capability. Migrating content between them is an explicit decision.

### DII-005 — Operational reference docs are canonical for their subject
`type: meta-rule · status: draft · authority: Architect · provenance: ex-D-76`

Operational reference docs are canonical for their subject; changing behavior requires updating the doc AND a superseding register entry.

### DII-006 — Counts (schemas, CLI actions, tests) never live in register prose — only mechanical gua...
`type: meta-rule · status: draft · authority: Architect · provenance: closes the ex-D-31/D-36 drift class`

Counts (schemas, CLI actions, tests) never live in register prose — only mechanical guards carry counts.

### DII-007 — Every append-able artifact family adopts the ADR meta-structure
`type: meta-rule · status: draft · authority: Architect · provenance: generalizes ex-adr.schema.json discipline; dossier Part IX §5.1`

Every append-able artifact family adopts the ADR meta-structure: schema-fronted front-matter (id, status, authority, supersedes/superseded_by, provenance), mandatory skeleton, status lifecycle, gapless ids — validated by a generic `check records` over the population registry. Register entries themselves carry it once DII numbering binds (W03).

### DII-008 — The product/ family (journeys, use-cases, stories, rules, mandates) is explicitly included
`type: meta-rule · status: draft · authority: Architect · provenance: dossier Part IX §5.1; ex-D-57 ergonomics lesson; Article 12 seam`

The product/ family (journeys, use-cases, stories, rules, mandates) is explicitly included: JSON artifacts carry the fragment as schema fields, markdown as front-matter; the meta-structure is scaffolded by authoring skills, never hand-typed by the Owner. Cross-tier guard: no active invariant may anchor solely on a superseded/tombstoned product artifact.


## 0.1 Record shape

Entries below carry the §5.1 fragment inline: a heading `### <id> — <title>` followed by a
meta line (`type · status · authority · provenance`). File-level front-matter carries `date`;
`supersedes`/`superseded_by` are null until successor-internal supersession begins (predecessor
supersession lives in provenance). **Ids are provisional wireframe assignments — W03 ratifies or
renumbers under declared authority.** A `check records` prototype validates every entry against
`record-meta.schema.json` (see packages/schemas tests).
## 1. Frame and stack

### DII-009 — DEVAI-II is a grounded framework, not a product
`type: decision · status: draft · authority: Architect · provenance: ex-D-51, ex-D-57`

DEVAI-II is a grounded framework, not a product: no hosted offering, no SaaS surface, no end-user product UI. Scope includes the brownfield reverse-documentation substrate.

### DII-010 — One declared stack per adopter repository, exploited deeply
`type: decision · status: draft · authority: Architect · provenance: ex-D-5; Constitution Art 1`

One declared stack per adopter repository, exploited deeply; primary NestJS/Angular/Postgres, others via stack-adapter packs.

### DII-011 — Runtime stack
`type: decision · status: draft · authority: Architect · provenance: ex-D-29, ex-D-16`

Runtime stack: TypeScript strict ESM, pnpm workspaces, Vitest, cac, ajv(+formats), json-schema-to-typescript; Postgres 15+, raw SQL migrations, no ORM.

### DII-012 — Hybrid invariant domain taxonomy (soft, revisitable)
`type: decision · status: draft · authority: Architect · provenance: ex-D-9`

Hybrid invariant domain taxonomy (soft, revisitable).

### DII-013 — Hybrid ID scheme
`type: decision · status: draft · authority: Architect · provenance: ex-D-32`

Hybrid ID scheme: sequential for human-authored, date-stamped for rounds, content-hash for machine records.

### DII-014 — The examples tree is integral to the framework and is never split out
`type: decision · status: draft · authority: Architect · provenance: ex-D-53`

The examples tree is integral to the framework and is never split out.

### DII-015 — The theory corpus is one maintained document with SVG-canonical figures and a provenanc...
`type: decision · status: draft · authority: Architect · provenance: ex-D-166, supersedes ex-D-75`

The theory corpus is one maintained document with SVG-canonical figures and a provenance appendix; snapshot papers are retired.


## 2. Specification and reference signal

### DII-016 — Schema canon
`type: decision · status: draft · authority: Architect · provenance: ex-D-31 extract`

Schema canon: JSON Schema 2020-12, `additionalProperties: false`, tri-state verdict enums, one file per contract.

### DII-017 — trace.json is Architect-only
`type: decision · status: draft · authority: Architect · provenance: ex-D-8`

trace.json is Architect-only; Inspector and Engineer consume, never edit.

### DII-018 — Prompts version with the skills that use them — same commit, same release
`type: decision · status: draft · authority: Architect · provenance: ex-D-35`

Prompts version with the skills that use them — same commit, same release.

### DII-019 — The rtd-manifest + `devai rtd bundle` aggregate signed view stands
`type: decision · status: draft · authority: Architect · provenance: ex-D-41`

The rtd-manifest + `devai rtd bundle` aggregate signed view stands.

### DII-020 — `check prompt-overlays` is a discrete validator
`type: decision · status: draft · authority: Architect · provenance: ex-D-42`

`check prompt-overlays` is a discrete validator; the firewall verdict stays unified.

### DII-021 — There is no policy-pack schema
`type: decision · status: draft · authority: Architect · provenance: ex-D-45`

There is no policy-pack schema; law-pack + inv-override + config cover the surface (standing rejection, soft).

### DII-022 — Exactly one constitution exists in the substrate
`type: decision · status: draft · authority: Architect · provenance: ex-D-38 extract`

Exactly one constitution exists in the substrate; no npm dependency on any predecessor law repo.

### DII-023 — Provenance tags on absorbed artifacts (REDOX-*, CODEX-*, and successor equivalents) are...
`type: decision · status: draft · authority: Architect · provenance: ex-D-57 extract`

Provenance tags on absorbed artifacts (REDOX-*, CODEX-*, and successor equivalents) are preserved.


## 3. Concurrency and loop

### DII-024 — Worktree cap
`type: decision · status: draft · authority: Architect · provenance: ex-D-52, supersedes ex-D-11`

Worktree cap: 3.

### DII-025 — Checkpoint-based downstream rebase within coupled triplets
`type: decision · status: draft · authority: Architect · provenance: ex-D-13`

Checkpoint-based downstream rebase within coupled triplets.

### DII-026 — Single integration branch
`type: decision · status: draft · authority: Architect · provenance: ex-D-14`

Single integration branch; direct task-branch merges.

### DII-027 — Database-per-task via TEMPLATE clone is the default isolation
`type: decision · status: draft · authority: Architect · provenance: ex-D-15`

Database-per-task via TEMPLATE clone is the default isolation.

### DII-028 — Triage (four classes) is the mandatory loop entry before any remediation dispatch
`type: decision · status: draft · authority: Architect · provenance: ex-D-17`

Triage (four classes) is the mandatory loop entry before any remediation dispatch.

### DII-029 — Cycles A/B/C with a 3-iteration cap on B
`type: decision · status: draft · authority: Architect · provenance: ex-D-18`

Cycles A/B/C with a 3-iteration cap on B.

### DII-030 — Escalation
`type: decision · status: draft · authority: Architect · provenance: ex-D-19`

Escalation: bump model tier once, then human; never automatic revert.

### DII-031 — Tri-state verdicts (PASS/REVIEW/FAIL) everywhere
`type: decision · status: draft · authority: Architect · provenance: ex-D-20`

Tri-state verdicts (PASS/REVIEW/FAIL) everywhere; no boolean gates.

### DII-032 — Flaky tests are quarantined with standing Auditor pressure, never silently retried into...
`type: decision · status: draft · authority: Architect · provenance: ex-D-22`

Flaky tests are quarantined with standing Auditor pressure, never silently retried into green.

### DII-033 — The soft-gate evaluator is a different model/instance from the working agent
`type: decision · status: draft · authority: Architect · provenance: ex-D-25`

The soft-gate evaluator is a different model/instance from the working agent.

### DII-034 — No task replay
`type: decision · status: draft · authority: Architect · provenance: ex-D-49, supersedes ex-D-43`

No task replay; no construction-session bundling. Reopening requires a new evidence-driven entry.

### DII-035 — Cross-repo edits in one session are a category mistake
`type: decision · status: draft · authority: Architect · provenance: ex-D-63..74 ritual rule`

Cross-repo edits in one session are a category mistake.


## 4. Sensors and observation

### DII-036 — Every sensor emits the uniform SensorReading contract
`type: decision · status: draft · authority: Architect · provenance: ex-D-23`

Every sensor emits the uniform SensorReading contract.

### DII-037 — Sensor tiers (L0/L1/L2/semantic) + cycle (A/B/C) fields are substrate
`type: decision · status: draft · authority: Architect · provenance: ex-D-50`

Sensor tiers (L0/L1/L2/semantic) + cycle (A/B/C) fields are substrate; `--cycle` filtering binds.

### DII-038 — Every new sensor kind ships with a design note under the architecture tree
`type: decision · status: draft · authority: Architect · provenance: ex-D-79 extract`

Every new sensor kind ships with a design note under the architecture tree.

### DII-039 — Locked framework threshold defaults
`type: decision · status: draft · authority: Architect · provenance: ex-D-77 extract`

Locked framework threshold defaults: spec_freshness_days=90; test_coverage_thresholds {pass:80, review:50}; inventory_adherence.max_orphans=50; harness_green_main.threshold_pct {pass:95, review:80} over last 50 runs. Adopters override via pack config.

### DII-040 — `harness_green_main.since` is adopter-specific and never declared in pack defaults
`type: decision · status: draft · authority: Architect · provenance: ex-D-88 extract`

`harness_green_main.since` is adopter-specific and never declared in pack defaults.

### DII-041 — Anti-gaming
`type: decision · status: draft · authority: Architect · provenance: ex-D-96/97/98 extracts`

Anti-gaming: never retro-tune `harness_green_main.since` for optics; never lower `test_coverage_depth.thresholds` to flip a cell; no retroactive outcome reclassification against an unchanged methodology.

### DII-042 — Scorecard N/A: never derived from a reading
`type: decision · status: draft · authority: Architect · provenance: ex-D-120, ex-D-91 extract`

Scorecard N/A: never derived from a reading; anti-relabel check binds; per-repo overrides apply as an overlay AFTER global degenerate cells and BEFORE readings; schema-invalid override files hard-fail, absent files are no-ops.

### DII-043 — The framework's own F4×T1/F4×T2 carve-outs never enter the global DEGENERATE_CELLS set
`type: decision · status: draft · authority: Architect · provenance: ex-D-92 extract`

The framework's own F4×T1/F4×T2 carve-outs never enter the global DEGENERATE_CELLS set.

### DII-044 — Diagnostics are non-recording observations
`type: decision · status: draft · authority: Architect · provenance: ex-D-139 extract, narrowing ex-D-120`

Diagnostics are non-recording observations; canonical SensorReading persistence is a registered, role-declared, write-consented mutation. Root gates exclude discovered nested worktrees.

### DII-045 — The two scorecard skills remain separate
`type: decision · status: draft · authority: Architect · provenance: ex-D-73 extract`

The two scorecard skills remain separate; unification is a future decision on its own evidence.

### DII-046 — The docs-links sensor stays narrow (no cross-repo exclusion config)
`type: decision · status: draft · authority: Architect · provenance: ex-D-100 extract`

The docs-links sensor stays narrow (no cross-repo exclusion config); `--latest-per-kind` stays opt-in; the per-batch verification checklist may extend, never weaken.


## 5. Testing and verification

### DII-047 — Test-weakening thresholds
`type: decision · status: draft · authority: Architect · provenance: ex-D-56 + ex-D-21`

Test-weakening thresholds: per-project config; framework defaults apply on absence; values clamp on load.

### DII-048 — DB-gated integration tests are opt-in via env flag
`type: decision · status: draft · authority: Architect · provenance: ex-D-54`

DB-gated integration tests are opt-in via env flag; a gate set without DB errors by intent.

### DII-049 — CI runs the mock LLM provider
`type: decision · status: draft · authority: Architect · provenance: ex-D-55`

CI runs the mock LLM provider; real providers are opt-in with budget cap.

### DII-050 — Full-production release evidence is real-by-default
`type: decision · status: draft · authority: Architect · provenance: ex-D-105, supersedes ex-D-54/55 for release lane`

Full-production release evidence is real-by-default: natural DB + LLM credentials; mock/DB-less runs cannot support a full-production claim.

### DII-051 — CI verifies, Inspector measures
`type: decision · status: draft · authority: Architect · provenance: ex-D-101`

CI verifies, Inspector measures: coverage is local-Inspector evidence, not a CI gate; the Inspector-produced scorecard is canonical.

### DII-052 — CI is a freshness check, not a value producer — the canonical CI-scope discipline
`type: decision · status: draft · authority: Architect · provenance: ex-D-103 + ex-D-104 extract`

CI is a freshness check, not a value producer — the canonical CI-scope discipline. Reintroducing CI-side comprehensive sensor/scorecard work requires explicit supersession of this entry and rebuttal of REJ-3/REJ-4; the discipline may extend but never weaken.

### DII-053 — Integration-gate reliability contract
`type: decision · status: draft · authority: Architect · provenance: ex-D-144 extract`

Integration-gate reliability contract: bounded worker oversubscription (maxWorkers 50%) + resilient schema re-read; reverting re-opens the flake.

### DII-054 — Scaffolders are deterministic (template + token substitution)
`type: decision · status: draft · authority: Architect · provenance: ex-D-59 extract`

Scaffolders are deterministic (template + token substitution); generators run from data, not prose. The only LLM-backed planning skill is review-class, output-only.


## 6. Evidence, CI economy, and promotion

### DII-055 — Hash-chained evidence with exact identity
`type: decision · status: draft · authority: Architect · provenance: Constitution Article 42; ex-D-24; R-0002 BL-007 correction`

Hash-chained evidence with exact identity; the Article-42 chain is the sole durable
evidence authority.

### DII-056 — ADR-CI-ECONOMY law
`type: decision · status: draft · authority: Architect · provenance: ex-D-115`

ADR-CI-ECONOMY law: hard/advisory rule split; the reusable evidence gate never silently opens on failure.

### DII-057 — `ci_economy.profile
`type: decision · status: draft · authority: Architect · provenance: ex-D-116`

`ci_economy.profile: gate-staged` downgrades only rule 4 to advisory; absence = full strictness.

### DII-058 — Local CI evidence
`type: decision · status: draft · authority: Architect · provenance: ex-D-117`

Local CI evidence: manifest schema + collect-local/verify-local verbs; the forbidden-paths floor never shrinks; PR events are never evidence_mode.

### DII-059 — Root build materializes its own publish artifacts
`type: decision · status: draft · authority: Architect · provenance: ex-D-121`

Root build materializes its own publish artifacts; the reusable gate defaults to sibling-checkout build (zero-new-secrets); collect/verify source-hash exclusion is symmetric.

### DII-060 — Actions-evidence promotion contract (the twelve boundaries, register-carried until the ...
`type: decision · status: draft · authority: Architect · provenance: ex-D-164/165/167 extracts; ex-D-146; successor ADR-003`

Actions-evidence promotion contract (the twelve boundaries, register-carried until
successor `law/adr/ADR-003-actions-evidence-promotion.md` absorbs them): one authority;
exact two-parent merge identity; reuse boundary with "source PRs always run full";
fail-closed dispositions (required-check aggregation may never translate an unjustified
skip into green); first-parent authorization resolved only via
`git show <base-sha>:` of the authorization record — a head-only record cannot authorize
its own merge; revocation set including malformed authorization and explicit revocation,
restoring full execution until a new complete green streak; weekly audit runs with
promotion ignored; no manufactured pushes/dispatches to advance a soak or graduation
window; promoted post-gate runs never count as qualifying evidence runs.
**Standing in DEVAI-II: void pending re-earning (genesis must-re-earn).**

### DII-061 — Effect gate
`type: decision · status: draft · authority: Architect · provenance: ex-D-158 extract, ex-D-157`

Effect gate: fail-closed after build/contracts, before merged coverage; under-declaration, unregistered subprocesses, and undispositioned edges exit fail; conservative over-declaration is advisory. Path-domain assertions bind the final adapter's canonical target, never a caller-selected module.

### DII-062 — Capability doctrine
`type: decision · status: draft · authority: Architect · provenance: ex-D-156; Constitution Art 11/INV-020 lineage`

Capability doctrine: declared ⊇ inferred fails closed; capability is necessary, never sufficient — it grants no authority; the consent scalar is never an internal authorization model.

### DII-063 — fs:worktree-admin derives harness-write consent
`type: decision · status: draft · authority: Architect · provenance: ex-D-151`

fs:worktree-admin derives harness-write consent; changing user-facing consent semantics requires an explicit Owner decision.

### DII-064 — The effects-check package ships in the fixed publish group, experimental, loaded only v...
`type: decision · status: draft · authority: Architect · provenance: ex-D-154`

The effects-check package ships in the fixed publish group, experimental, loaded only via the explicit sensor/check path.

### DII-065 — Subprocess-effects registry
`type: decision · status: draft · authority: Architect · provenance: ex-D-150/148 extracts`

Subprocess-effects registry: single Architect-owned F1 source, materialized only by registered upgrade under authority/consent, byte-identical; no checker synthesizes or persists declarations — a checker never writes its own inputs.

### DII-066 — F5 configuration materialization is a forward contract
`type: decision · status: draft · authority: Architect · provenance: ex-D-148 extract`

F5 configuration materialization is a forward contract: every registry has one Architect-owned canonical source; only registered upgrade verbs materialize it.

### DII-067 — CI dispatch policy
`type: decision · status: draft · authority: Architect · provenance: ex-D-148 extract`

CI dispatch policy: trailing window 50, ≥20 qualifying runs, dispatch floor 80%, green target 95%; the floor is an entry precondition for binding rounds, not a scorecard relabel.


## 7. Authority and governance process

### DII-068 — Runtime authority enforcement per the fail-closed boundary
`type: decision · status: draft · authority: Architect · provenance: ex-D-136 extract; successor ADR-001`

Runtime authority enforcement per the fail-closed boundary: no implicit roles, no caller-selected machine principals, no replayable decisions, no router-only checks, no permissive unknown targets, no unbounded batches, no wildcard mutator exemptions, no false host-enforcement claims. `cli-only` claims nothing about external editors/shells without a verified host adapter.

### DII-069 — The mutator source gate
`type: decision · status: draft · authority: Architect · provenance: ex-D-136 sole-carried clause`

The mutator source gate: the call-site denominator is mechanically derived; zero unauthorized sites and zero exemptions, demonstrably failing on stale fixtures.

### DII-070 — Weakening any fail-closed authority property requires a new explicit decision
`type: decision · status: draft · authority: Architect · provenance: ex-D-136 sole-carried clause`

Weakening any fail-closed authority property requires a new explicit decision; where it changes Articles 6–10, constitutional amendment.

### DII-071 — Only constitutional role names appear in substrate and docs
`type: decision · status: draft · authority: Architect · provenance: ex-D-40`

Only constitutional role names appear in substrate and docs; no imported role taxonomies.

### DII-072 — Closure ceremony
`type: decision · status: draft · authority: Architect · provenance: ex-D-110 + ex-D-134 extract`

Closure ceremony: PC records in the proofs tree; `govern phase close` runs at or after the shipping merge and refuses drafts without merged_as + release_disposition; records are append-only; ledger streaks are machine-computed; closing register entries are short-form.

### DII-073 — Closeout shapes
`type: decision · status: draft · authority: Architect · provenance: ex-D-68 extract`

Closeout shapes: absorption rounds use the deletion-gate pattern; alignment rounds use the no-deletion shape.

### DII-074 — Skills architecture
`type: decision · status: draft · authority: Architect · provenance: ex-D-138`

Skills architecture: re-export-only façade for the skills index; complete registry ordering; prompts as data assets; zero-cycle and parity gates; recombining is forbidden.

### DII-075 — Registry-derived hierarchical CLI: noun-verb grammar, fail-closed exit-2 routing, --wri...
`type: decision · status: draft · authority: Architect · provenance: ex-D-129, ex-D-26, ex-D-27`

Registry-derived hierarchical CLI: noun-verb grammar, fail-closed exit-2 routing, --write / --allow-publish consent, no legacy aliases.

### DII-076 — Node 24 floor across development, package, template, installed-tarball, and CI contracts
`type: decision · status: draft · authority: Architect · provenance: ex-D-147 extract`

Node 24 floor across development, package, template, installed-tarball, and CI contracts.


## 8. Packaging, publication, and adoption

### DII-077 — @devai-nyx/* scope on GitHub Packages is the canonical consumption model
`type: decision · status: draft · authority: Architect · provenance: ex-D-114`

@devai-nyx/* scope on GitHub Packages is the canonical consumption model; fixed Changesets publish group; dereferenced-schema packaging; external-ADR citations must name their repo.

### DII-078 — devai_version is machine-managed
`type: decision · status: draft · authority: Architect · provenance: ex-D-118, ex-D-122`

devai_version is machine-managed; doctor version-match is tier3-binding; sibling checkout is dev-only convenience; CLI provenance is tracked; devai_consumption absent = npm-package; pointer-only cannot satisfy tier3.

### DII-079 — Constitution binding
`type: decision · status: draft · authority: Architect · provenance: ex-D-119`

Constitution binding: vendored copy + checksum pin is canonical; core ships its own constitution text.

### DII-080 — Canonical stack-adapter packs ship inside the core tarball via prepack staging — one au...
`type: decision · status: draft · authority: Architect · provenance: ex-D-127`

Canonical stack-adapter packs ship inside the core tarball via prepack staging — one authored source, no duplicate tree.

### DII-081 — Raw JSON Schemas are public package subpaths
`type: decision · status: draft · authority: Architect · provenance: ex-D-128`

Raw JSON Schemas are public package subpaths; root API + subpaths are stable consumer contracts.

### DII-082 — Adoption profiles
`type: decision · status: draft · authority: Architect · provenance: ex-D-112`

Adoption profiles: tier1 (gates+evidence) / tier2 (+reference signal) / tier3 (full loop); absent key = tier3; floor-not-cage advisory semantics; the framework itself is tier3.

### DII-083 — Glob guards
`type: decision · status: draft · authority: Architect · provenance: ex-D-124; Part VII §8`

Glob guards: declarative min-match registry + check; literal-vs-glob classification; node_modules/.git hard-excluded; plus the DEVAI-II root-entry ceiling.

### DII-084 — docs.ia path overrides remap F1 checks after a binding relocation ADR; absence = strict
`type: decision · status: draft · authority: Architect · provenance: ex-D-125`

docs.ia path overrides remap F1 checks after a binding relocation ADR; absence = strict.

### DII-085 — hooks install / ci scaffold verbs
`type: decision · status: draft · authority: Architect · provenance: ex-D-123`

hooks install / ci scaffold verbs; forbidden-actions waivers extend-never-replace over the canonical set; trace target_type enum is closed.


## 9. LLM skills and the R28 boundary set

### DII-086 — The production authority boundary for `agent skill run`: only local claude/codex CLIs v...
`type: decision · status: draft · authority: Architect · provenance: ex-D-174`

The production authority boundary for `agent skill run`: only local claude/codex CLIs via the bounded host adapter (local-llm / invoke / publication=false). No shell, arbitrary executable, network endpoint, credential read, push, or PR-creation scope.

### DII-087 — Structured output at the local-CLI bridge
`type: decision · status: draft · authority: Architect · provenance: ex-D-175`

Structured output at the local-CLI bridge: caller-typed closed schemas, no post-hoc coercion, provider output is untrusted, completion-only instruction-free envelope.

### DII-088 — The truthful recorder path is the only supported path for every mutating LLM skill (llm...
`type: decision · status: draft · authority: Architect · provenance: ex-D-173 extract`

The truthful recorder path is the only supported path for every mutating LLM skill (llm_backed ∧ write_requires_flag); candidate outputs are report-only evidence, never merged as fixes; caller-supplied provenance is invalid input.

### DII-089 — Feedback-iteration writer contract
`type: decision · status: draft · authority: Architect · provenance: ex-D-184`

Feedback-iteration writer contract: exact bounded {path,find,replace} replacements, atomic batch, no whole-file overwrites; experimental opt-in + write consent required.

### DII-090 — Skill-scoped local-validation allowance
`type: decision · status: draft · authority: Architect · provenance: ex-D-185`

Skill-scoped local-validation allowance: exact lint/typecheck/unit-test/acceptance shapes only, for the declared skill only, with the explicit non-authorization list.

### DII-091 — semantic-review can never PASS; a future deterministic PASS requires a separate Archite...
`type: decision · status: draft · authority: Architect · provenance: ex-D-171 extract`

semantic-review can never PASS; a future deterministic PASS requires a separate Architect decision and a closed registry of trusted adapters.

### DII-092 — The mutating-skill denominator is mechanically derived from the registry predicate, nev...
`type: decision · status: draft · authority: Architect · provenance: ex-D-176 extract; successor ADR-004`

The mutating-skill denominator is mechanically derived from the registry predicate, never a maintained constant.

### DII-093 — R28 non-promotion prohibitions
`type: decision · status: draft · authority: Architect · provenance: ex-D-187 extract — attested history`

R28 non-promotion prohibitions: campaign candidates remain report-only and unmerged in the predecessor; acceptance established no readiness or autonomy; the report-only mechanism is not bound as a future assurance gate; native macOS results stay REVIEW.

### DII-094 — Round serialization inherited if those rounds move here
`type: decision · status: draft · authority: Architect · provenance: ex-D-176 extract`

Round serialization inherited if those rounds move here: supervised-LLM promotion (ex-R30 shape) publishes only after the accepted dossier + prior round's factual result exist and runtime overlaps reconcile; successors serial after.


## 10. Standing rejections (REJ registry, re-minted once each)

### DII-REJ-A — No backend-aware LLM timeout multiplier
`type: rejection · status: draft · authority: Architect · provenance: ex-REJ-1, ex-D-83`

Rejected; per-pack config is the outlet. Re-proposal requires strong new adopter evidence.

### DII-REJ-B — No migration-runner integration for sense-migrate-check
`type: rejection · status: draft · authority: Architect · provenance: ex-REJ-2, ex-D-87`

Rejected as a layering violation; --pre-seed is the canonical abstraction.

### DII-REJ-C — No comprehensive coverage on CI
`type: rejection · status: draft · authority: Architect · provenance: ex-REJ-3, ex-D-101`

Rejected; the Inspector measures locally (see §5 CI-scope discipline).

### DII-REJ-D — No CI-side digest verifier
`type: rejection · status: draft · authority: Architect · provenance: ex-REJ-4, ex-D-103`

Rejected; one verification authority only.

## 11. Resolved ambiguity defaults (carried verbatim)

### DII-095 — `--role-bootstrap` is opt-in (default false)
`type: decision · status: draft · authority: Architect · provenance: ex-D-85`

`--role-bootstrap` is opt-in (default false).

### DII-096 — `pnpm audit` wins when both audit tools are present
`type: decision · status: draft · authority: Architect · provenance: ex-D-85`

`pnpm audit` wins when both audit tools are present.

### DII-097 — Missing perf script yields UNKNOWN, never N/A
`type: decision · status: draft · authority: Architect · provenance: ex-D-85`

Missing perf script yields UNKNOWN, never N/A.

### DII-098 — Article 42 remains in Part XI
`type: decision · status: draft · authority: Architect · provenance: dossier Part IX; Constitution W01 Annex item 6; R-0001/P1 altitude sweep`

Article 42 remains in Part XI. Evidence is a distinct constitutional concern, and moving
the article into Parts VII or VIII would change numbering and anchors without improving
the doctrine. The placement decision preserves meaning and minimizes anchor churn.

### DII-099 — Invariant anchor documents will use `authority_docs`
`type: decision · status: draft · authority: Architect · provenance: dossier Part IX §5.1; R-0001/P1 schema alignment`

The invariant schema's anchor-documents object will be renamed from `authority` to
`authority_docs`; record-meta `authority` remains the authoring-role field. Execution is
deferred to a coordinated migration because the rename changes every invariant instance,
trace anchoring, generated types, and consumers.

### DII-100 — Shared execution-status, judgment-verdict, and joint-role vocabulary
`type: decision · status: draft · authority: Architect · provenance: dossier Part VIII W02.f; CTX-06; R-0001/P1 schema alignment`

The lowercase tri-state definition is `execution_status_core`; the uppercase tri-state
definition is `verdict_core`. They are distinct vocabularies, not casing aliases.
`joint` is part of the shared role vocabulary and glossary-entry authority references
that vocabulary directly.

### DII-101 — Population guard declarations report implementation state honestly
`type: decision · status: draft · authority: Architect · provenance: dossier Part IX §5; CTX-02; R-0001/P1 population registry`

Every append-able population declares count, liveness, and tombstone guards in
`law/policy/population-registry.json`. Each declaration distinguishes an implemented
guard from a declared-but-not-fully-enforced guard and a backlogged guard; the registry
must never translate a planned guard into current green standing.

### DII-102 — One schema-backed registry is the source of sensor-kind truth
`type: decision · status: draft · authority: Architect · provenance: CTX-05; dossier Part IX §2 item 1; ex-D-77, ex-D-79, ex-D-91, ex-D-92, ex-D-96–98, ex-D-120`

Sensor kinds are derived from one schema-backed registry consumed by emitters,
scorecard reachability, tier scheduling, documentation, and tests. A separately
maintained enum or map is not an authority source. Compatibility kinds without an
emitter at the attested predecessor pin are archived with an explicit disposition,
not imported as live kinds.

### DII-103 — FAIL readings persist until newer same-kind evidence supersedes them
`type: decision · status: draft · authority: Architect · provenance: CTX-05 §2; dossier Part IX §2 item 2; ex-D-120`

A FAIL reading remains current until a newer reading of the same kind supersedes it.
Stale FAIL evidence becomes REVIEW-stale rather than disappearing, and UNKNOWN never
overwrites FAIL. Reading compaction and presentation must preserve that ordering rule.

### DII-104 — Every scorecard cell is scheduled-reachable or honestly not applicable
`type: decision · status: draft · authority: Architect · provenance: CTX-05 §3; dossier Part IX §2 item 3; ex-D-120`

Every nondegenerate scorecard cell has at least one registered sensor scheduled in a
declared execution tier. A cell with no reachable scheduled sensor is represented
honestly as N/A; a diagnostic sensor does not silently imply cell coverage.

### DII-105 — R-0002 declares the frozen re-bind and operational-law repair
`type: declaration · status: draft · authority: Architect · provenance: session-draft R-0002; OM-002; BL-001–003, BL-007, BL-012–014, BL-023, BL-046–049`

R-0002 executes from successor source base
`cc0084ba38fb6d583f79fddd38554524714c4fa4`, which equals its live `origin/main`
merge-base, through the Owner-directed prepared execution head
`5afdbfea99368d917c1ed9bc9e19404fcf3d7cc1`. Its plan digest is
`4db25005ab7adc0fff3ca0e9a332870d709aa7c4343830ca5dc0dfca62c6b568`.
The round may re-bind immutable predecessor truth, repair the named operational-law,
closure, CI, and reference-classification defects, and append an honest machine
correction to PC-0001. It may not ratify, release, deploy, transfer standing, mutate the
predecessor, or write to real stynx.

The opening known-red posture is explicit: BL-046 is reproduced by exact PR run
`30133847762` and an isolated cold Corepack cache; BL-017 remains below the unchanged
70/60/70/70 floors; successor ADR, glob-guard, and trace production checks remain red
under BL-007/BL-014. Appending this declaration also advances the parsed decision
population beyond two Inspector-owned fixed-count guards; that exact temporary count
red is governed by BL-007 and must be replaced by a gapless derived guard in B2, never
hidden by removing this declaration or restating a new maintained count.

### DII-106 — ADR lifecycle uses the successor record vocabulary
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002; OM-002 approved defaults; BL-007`

Successor ADR frontmatter uses the shared record lifecycle: `draft` is non-binding,
`active` is the binding state after Architect acceptance, `superseded` points to its
replacement, and `tombstoned` records a rejected or retired identity that may not be
re-minted. “Accepted” remains a judgment word in prose, not a second status token.
R-0003 may accept an ADR only by moving its record to `status: active`; R-0002 changes
no ADR standing.

### DII-107 — Managed worktrees use the constitutional runtime root
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002; OM-002 approved product and doctrine marks; Constitution Article 27; BL-007/BL-050`

The canonical managed runtime root is `.devai/worktrees/<task-id>` and its mutable
registry is `.devai/state/worktrees.json`. `scratch/worktrees/` remains a disposable
human preparation location and is not a supported governed-runtime target. Committed
policy and documentation must preserve that distinction; runtime contents remain
ignored except for the directory sentinels.

### DII-108 — R-0002 closes its source scope without ratification or release
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 close; DII-105; R-0002-AS-BUILT; OM-002; BL-001–003, BL-007, BL-012–014, BL-023, BL-046–049`

R-0002 closes the source scope declared by DII-105 at Auditor as-built commit
`87e03032549f1dd28eb9abb969cdfb1ad83708fe`. The exact frozen predecessor bindings
are re-materialized, the R-0002 operational-law slice is non-vacuous, PC-0002
corrects PC-0001 append-only, and the scoped Corepack, closure, role, freshness,
domain, attestation, and reference-classification defects have the dispositions
recorded by the as-built audit. BL-007's wider population program remains explicitly
governed by its named later-round items; BL-017 remains the sole allowed command and
exact-main red through R-0005 at the unchanged 70/60/70/70 thresholds.

The source PR may merge only under the shared exact-candidate review and check gates.
After that merge, the production machine closure verb appends the next PC record on a
closure-only branch, binding the source merge SHA and the honest BL-017 red with
release disposition `none-preratification`. R-0002 ratifies nothing, releases nothing,
deploys nothing, and transfers no readiness or evidence standing. R-0003 must
independently re-verify the frozen bindings, source merge, machine closure, and
exact-main state before any founding ratification.

### DII-109 — Generated policy bytes remain Engineer-attributed and closure corrections are explicit snapshots
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Claude Fable 5 close-review disposition; OM-002; Constitution Articles 6 and 42; BL-048`

Committed bytes under `.devai/config/` and `.devai/pin/` remain machine
materializations of Architect-owned sources and are committed by the Engineer session
that executes the authorized verb. A source/materialization byte-identity gate does
not transfer that path authority to the Architect. The Architect commit
`95b1aaf747e8cde561f59e1fda977bb04632b8a4` incorrectly carried a regenerated
authority-policy materialization while repairing the source vocabulary; R-0002
records that historical attribution defect rather than rewriting it. After this
decision, an Engineer session re-executed the production operational-law verb under
the Architect declaration; its deterministic output was already byte-identical and
therefore produced no new commit. Future source changes use an explicitly governed
temporary red between the Architect source commit and Engineer materialization when
atomic cross-role commit would otherwise be required.

A closure correction is a new immutable whole-record snapshot with `supersedes`; it
does not edit or hide the earlier record. The correction may replace any fact or
criterion needed to make the effective closure truthful, but its notes must enumerate
the semantic correction, preserve every unaffected historical gate and source
binding, and identify every changed failing or N/A criterion. PC-0002 satisfies this
rule by preserving PC-0001, its batches, gates, merged identity, release disposition,
and proof-epoch binding while replacing the false all-deferrals-reconciled criterion
with the exact unmatched P7/BL-045 fact.

### DII-110 — The formatting gate covers active authored sources and excludes only non-format authorities
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final-gate correction; BL-051; R-0002-AS-BUILT`

The repository-wide Prettier gate covers active human-authored source, law, product,
tests, documentation, and current work records. Existing build, dependency, coverage,
proof, scratch, and managed-worktree outputs remain excluded. Additional exclusions
are exact and semantic:

- `.devai/config/` and `.devai/pin/` are verb-produced materializations;
- `pnpm-lock.yaml` is package-manager-produced;
- `law/policy/authority-policy.json` and `law/trace.json` are canonical generated
  artifacts with independent byte and schema guards;
- `law/register/DECISIONS.md` is parsed under a register-specific byte shape that
  Prettier does not preserve;
- `law/adr/predecessor/`, `work/rounds/R-0001/`, `work/audit/R-0001/`, and
  `work/devai-ii-succession-dossier.md` are immutable predecessor or completed
  bootstrap history.

No active path is excluded merely because it fails the formatter. Owner, Architect,
Engineer, and Inspector format their remaining paths in separate commits. If an
Architect-owned policy source changes, the Engineer re-materializes its `.devai`
target through the production verb before the gate may pass. BL-051 closes only when
the literal repository-wide command is green and the full R-0002 ladder is rerun.

### DII-111 — Active campaign review uses Claude Opus 5 only after quota recovery
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Owner-selector correction; OM-003; BL-053`

OM-003 narrows the active campaign’s independent Claude review selector. No new Claude
interaction occurs until the current quota recovers. After recovery, every active
campaign prompt and the shared execution contract select Claude Opus 5 through the
explicit CLI model identifier `claude-opus-5`; quota or selector failure blocks rather
than falling back to Fable or another model.

Historical Fable planning and review artifacts retain their factual model attribution
and evidentiary limits. They are neither rewritten nor treated as Opus review. This
decision changes no round authorization, release gate, real-stynx boundary, role/path
authority, claims ceiling, or exact-candidate merge requirement.

### DII-112 — R-0002 final source close includes governed post-review corrections
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-108–111; R-0002-AS-BUILT@2120ec9885e9bd46ec064e73d087ce3f0e750689; BL-051–053`

DII-112 supersedes DII-108 only as the final R-0002 source-closing decision. DII-108
remains immutable history and its no-ratification, no-release, and BL-017 posture
continues unchanged. The final close additionally binds the governed formatting repair,
failed-gate acknowledgment enforcement, and Owner-directed Opus-only review selector
recorded by DII-109 through DII-111 and the Auditor as-built at
`2120ec9885e9bd46ec064e73d087ce3f0e750689`.

The source PR may merge only after the exact DII-112 candidate receives an independent
read-only Claude Opus 5 review through `claude-opus-5` and its exact remote checks are
green except for the bounded BL-017 coverage-threshold failure. The closure-only branch
then emits the next machine PC record against the exact source merge SHA, using DII-105
as declaration and DII-112 as closing decision. R-0002 remains draft, ratifies nothing,
releases nothing, deploys nothing, and transfers no readiness or evidence standing.

### DII-113 — Closure batches may attribute verb-produced record commits to Machine
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 PC-0003 prevalidation; Constitution Articles 6 and 7; R-0002 plan B6; BL-054`

The phase-closure batch-role vocabulary includes `Machine` so a closure can truthfully
attribute a verb-produced commit under `record/`. `Machine` in this field is provenance,
not a sixth human role and not a grant of general mutation authority. It is valid only
for bytes produced by an authorized executing verb under Article 6; human-authored
Owner, Architect, Inspector, Engineer, and Auditor batches retain their existing
meanings and boundaries.

R-0002 PC-0003 records the production-verb PC-0002 emission as Machine and its
acceptance contract as Inspector instead of omitting or relabeling either batch. Existing
closure records remain byte-identical. The TypeScript closure role must mirror the
schema before the production verb may emit PC-0003.

### DII-114 — R-0002 final source close includes truthful Machine attribution
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-108–113; R-0002-AS-BUILT@fbae67bd8527e99fe9af15db4a9640f1af13af4a; BL-051–054`

DII-114 supersedes DII-112 only as the final R-0002 source-closing decision. DII-108
and DII-112 remain immutable historical closing judgments; their no-ratification,
no-release, no-readiness, and BL-017 posture continues unchanged. The final source
candidate additionally closes BL-054 through DII-113 so PC-0003 can attribute the B6
machine-verb and Inspector batches truthfully.

The source PR may merge only after the exact DII-114 candidate receives an independent
read-only Claude Opus 5 review through `claude-opus-5` and its exact remote checks are
green except for the bounded BL-017 coverage-threshold failure. The closure-only branch
then emits PC-0003 against the exact source merge SHA, using DII-105 as declaration and
DII-114 as closing decision. R-0002 remains draft, ratifies nothing, releases nothing,
deploys nothing, and transfers no readiness or evidence standing.

### DII-115 — Authority materialization binds every Constitution byte change
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 production closure prevalidation; DII-110; Constitution Article 6; BL-055`

Formatting is a byte change for an authority-policy Constitution binding even when it
changes no constitutional meaning. The DII-110 formatting sequence changed the raw
Constitution digest from
`e2ebe98eae91cb91e7868dda84309bd61c5d86d7b0b1a94f7bdacfb3ce6c2dd8`
to `d1dd4858cf48ca14597d3a0d9f70fe8fbda01cc69a019c7e210b46e40bda3763`
without re-materializing the authority policy. A later production write correctly
refused the stale binding.

An Engineer session must execute the authorized production transition
`devai adopt upgrade --target . --as-role architect --write`. The trusted upgrade
machine may update only the canonical and `.devai/config` authority-policy
materializations and its verb receipt. The resolved rules, source and extension
digests, version, role boundaries, and constitutional meaning must remain unchanged.
R-0002 may close only after both materializations bind the new raw digest and a
disposable production closure write passes.

### DII-116 — R-0002 final source close includes binding-valid production writes
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-108–115; R-0002-AS-BUILT@064208b700191c3c8a8ee4c7d388d7b51bbb1d7d; BL-051–055`

DII-116 supersedes DII-114 only as the final R-0002 source-closing decision. Earlier
closing judgments remain immutable history and their no-ratification, no-release,
no-readiness, and BL-017 posture continues unchanged. The final source candidate also
closes BL-055: both authority-policy copies bind the exact current Constitution bytes,
preserve every rule and source/extension digest, and permit the production
Machine-attributed closure write.

For path attribution, DII-115’s reference to both materializations describes the
permitted byte set, not a transfer of `law/` authority. The production upgrade machine
wrote and the Engineer committed `.devai/config/authority-policy.json`; a separate
Architect batch synchronized the byte-identical canonical
`law/policy/authority-policy.json`. No session crossed its path boundary.

The source PR may merge only after the exact DII-116 candidate receives an independent
read-only Claude Opus 5 review through `claude-opus-5` and its exact remote checks are
green except for the bounded BL-017 coverage-threshold failure. The closure-only branch
then emits PC-0003 against the exact source merge SHA, using DII-105 as declaration and
DII-116 as closing decision. R-0002 remains draft, ratifies nothing, releases nothing,
deploys nothing, and transfers no readiness or evidence standing.

### DII-117 — Phase closure records are immutable compliance proof
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 publication preflight; three-tree doctrine; BL-056`

The canonical output of `devai govern phase close` is the append-only compliance proof
record `record/proofs/compliance/closures/PC-NNNN.json`. Closure records do not live
under `.devai/state/`: that tree contains ignored mutable runtime state and cannot be
the durable authority for a round-closing judgment.

The phase-closure schema description must name the same immutable path as the production
implementation, CLI help, authority policy, and approved three-tree doctrine. This
correction changes no closure field, validation rule, write behavior, existing record
byte, or authority boundary; it makes the canonical law describe the production path
already in force.

### DII-118 — R-0002 final source close includes canonical closure-proof placement
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-108–117; R-0002-AS-BUILT@f85c68d1ff82a6f2d01ff9aff49b054dadf9b39f; BL-051–056`

DII-118 supersedes DII-116 only as the final R-0002 source-closing decision. Earlier
closing judgments remain immutable history and their no-ratification, no-release,
no-readiness, and BL-017 posture continues unchanged. The final source candidate also
closes BL-056: the canonical phase-closure schema now names the same immutable
compliance-proof path as the production verb and no longer contradicts the ignored
runtime-state doctrine.

The source PR may merge only after the exact DII-118 candidate receives an independent
read-only Claude Opus 5 review through `claude-opus-5` and its exact remote checks are
green except for the bounded BL-017 coverage-threshold failure. The closure-only branch
then emits PC-0003 against the exact source merge SHA, using DII-105 as declaration and
DII-118 as closing decision. R-0002 remains draft, ratifies nothing, releases nothing,
deploys nothing, and transfers no readiness or evidence standing.

### DII-119 — Pre-review coverage strengthening is bounded and non-closing
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Owner-directed quota-window work; OM-004; BL-017`

OM-004 permits R-0002 to add behavior-focused Inspector tests during the Claude quota
pause before the exact-candidate Opus 5 review. The work may increase measured
coverage, but it does not move the 70/60/70/70 thresholds, narrow the coverage source
set, exclude files, weaken assertions, change production behavior, or claim BL-017
closed.

R-0006 retains ownership of complete BL-017 closure. R-0002 records the fresh readings
and preserves `coverage-t1-t3` as a failing gate unless every unchanged threshold
actually passes. Any production defect exposed by the added tests requires its own
gapless Auditor record and role-separated repair before the source candidate can
advance.

### DII-120 — Active ADRs seal under the successor lifecycle
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 OM-004 coverage correction; DII-106; BL-057`

An ADR remains editable while `status: draft`. Its first schema-valid `active`,
`superseded`, or `tombstoned` commit seals its body and every ordinary frontmatter
field. A sealed `active` ADR may remain active, transition once to `superseded` while
appending exactly one non-empty scalar `superseded_by` identifier, or transition once
to `tombstoned` without inventing a replacement. `superseded` and `tombstoned` are
terminal; no sealed record may return to `draft`.

The history guard must use only the DII-106 lifecycle vocabulary. Its
`superseded_by` comparison follows the canonical string-or-null schema: null may become
one stable string only with the matching `active`-to-`superseded` transition; a string
may not be removed, replaced, or treated as an array. Body mutation, other
frontmatter mutation, and every unlisted lifecycle transition remain findings.

### DII-121 — R-0002 final source close includes the sealed-history repair
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-108–120; R-0002-AS-BUILT@73c6ef68f57630c07e7130b8fd02ff3a2279f05e; OM-004; BL-051–057`

DII-121 supersedes DII-118 only as the final R-0002 source-closing decision. Earlier
closing judgments remain immutable history and their no-ratification, no-release,
no-readiness, and BL-017 posture continues unchanged. The final source candidate also
closes BL-057 through the DII-120 successor-lifecycle guard and includes OM-004’s
behavior-focused coverage strengthening without changing any coverage input,
exclusion, threshold, production behavior, or later-round ownership.

The source PR may merge only after the exact DII-121 candidate receives an independent
read-only Claude Opus 5 review through `claude-opus-5` and its exact remote checks are
green except for the bounded BL-017 coverage-threshold failure. The closure-only branch
then emits PC-0003 against the exact source merge SHA, using DII-105 as declaration and
DII-121 as closing decision. R-0002 remains draft, ratifies nothing, releases nothing,
deploys nothing, and transfers no readiness or evidence standing.

### DII-122 — Coverage doubling uses exact unchanged-source readings
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Owner-directed quota-window iteration; OM-004; OM-005; BL-017`

The OM-005 coverage baseline is the exact merged T1+T3 run at source candidate
`8b514ac62d1464608964fbb815ac81840075b3a5`: statements 31.61%, branches 29.88%,
functions 35.29%, and lines 32.74%. R-0002 continues behavior-focused Inspector work
until the same unchanged source set reports at least 63.22%, 59.76%, 70.58%, and
65.48%, respectively.

Every iteration preserves the canonical coverage provider, source selection,
exclusions, and policy thresholds. Exact raw counts and denominators are retained in
the audit; displayed rounding cannot satisfy a target before the underlying ratio does.
Crossing the OM-005 target does not close BL-017 unless the separate unchanged
70/60/70/70 policy also passes. The Opus 5 close review waits for the new exact
candidate and remains subject to OM-003’s no-fallback rule.

### DII-123 — SQL column constraints terminate type parsing
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 OM-005 coverage correction; BL-058`

The data-model inventory must preserve SQL nullability as declared. A constraint
keyword, including `NOT`, terminates the parsed type before constraint evaluation;
it may not be consumed merely because the parser supports legitimate multi-word SQL
types. Supported multi-word types remain explicit grammar cases rather than an
unbounded second identifier.

For `email TEXT NOT NULL`, the canonical output is type `TEXT` and
`nullable: false`. The same boundary applies deterministically to other supported
one-word and multi-word type declarations without changing the inventory schema,
coverage inputs, exclusions, or thresholds.

### DII-124 — Successor closures bind the exact shipped subject and exact failed gates
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Claude Opus 5 correction; BL-060`

Every new closure emitted by the successor production verb requires both `merged_as`
and `release_disposition`, including PC-0003. The predecessor-era PC-0007 cutoff does
not apply to the successor ledger, whose numbering restarted at PC-0001. The schema
keeps these fields optional only so immutable historical records remain valid; the
executing verb is stricter for every newly appended record.

A gate key is a nonempty, non-whitespace identity. Each failed gate must be acknowledged
by a failing validation criterion that names that complete identity as a standalone
token; a substring inside another gate name is not acknowledgment. This preserves the
free-form criterion/evidence envelope while preventing empty and prefix gate names from
borrowing another failure's disposition.

PC-0001 and PC-0002 remain byte-immutable. R-0002 may append PC-0003 only after the
source merge, with the exact merge SHA, the actual release disposition, and only the
gates that truly failed at the source candidate.

### DII-125 — Required trace links are non-vacuous and reproducible
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Claude Opus 5 correction; BL-061`

When canonical trace metadata declares `require_test_links: true`, an invariant counts
as traced only when at least one linked `test` target has a nonempty path that resolves
to an existing tracked test file. An empty target array, a missing or empty path, an
unresolved path, a nonexistent invariant, or only non-test attestations cannot increase
`traced_invariants`. Each known invariant without such a test link is reported as
`untraced_invariant`; a missing linked path retains its additional
`missing_test_path` finding.

Deterministic trace generation covers every tracked executable test or fails closed.
Each governed test file carries at least one canonical invariant marker, and every
canonical invariant receives at least one assertion-bearing test link when test links
are required. Helpers that are not independently executable are not invented as test
corpus entries, and projection files that merely re-execute another suite are
prohibited rather than classified as coverage. The committed `law/trace.json` is
generated from the tracked corpus, not hand-adjusted to satisfy completeness.

### DII-126 — R-0002 closes from the exact post-Opus all-green source
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 post-Opus close; DII-105; DII-119–125; R-0002-AS-BUILT@9ee9fdd31a18ab3afc4b2f33defe3020eb124afa; OM-005; BL-017; BL-058–064`

DII-126 supersedes DII-121 only as the final R-0002 source-closing decision. Earlier
closing judgments and coverage readings remain immutable chronological evidence, but
they do not describe the current candidate. The final Auditor re-close records the
projection removal, exact successor-closure identity, non-vacuous regenerated trace,
gapless census, and assertion-bearing coverage work. The unchanged merged T1+T3 command
passes both OM-005 and the legal 70/60/70/70 policy; BL-017 is closed in R-0002 and is
not an allowed source or exact-main red.

The exact source candidate is the commit containing this decision and the final
deterministic repository-reference regeneration. It may advance only after a fresh
independent read-only Claude Opus 5 review through the literal `claude-opus-5` selector
with no fallback, a clean worktree, and green local and exact remote gates. BL-063
remains ring-fenced to R-0005 before round-archive activation, and BL-065 remains
assigned to R-0004 before production-readiness claims; neither authorizes an R-0002
skip or readiness statement.

After the source PR merges, the closure-only branch emits PC-0003 against that exact
source merge SHA using DII-105 as declaration and DII-126 as closing decision. Every
observed gate is recorded with its actual status. With the current all-green source,
PC-0003 contains no failed gate and no failing validation criterion, and it requires
`merged_as` plus `release_disposition: none-preratification`. R-0002 remains draft,
ratifies nothing, releases nothing, deploys nothing, and transfers no readiness or
evidence standing.

### DII-127 — Closure identity and Machine attribution bind full Git objects
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 second Claude Opus 5 correction; DII-113; DII-124; BL-066; BL-067`

The closure verb, not caller input, assigns the next `PC-NNNN` identity. A draft that
supplies its own `id` is invalid and must be rejected before record construction; object
spread order may never let caller data replace machine-assigned identity.

Every `merged_as` value and every present closure-batch `commit` binds one full Git
object id: exactly 40 lowercase hexadecimal characters for SHA-1 repositories or 64
for SHA-256 repositories. Abbreviated identities cannot bind immutable compliance
proof. When any batch attributes a write to `Machine`, that batch must carry such a
full commit id. Human-only historical batches may omit a commit, and PC-0001 and
PC-0002 remain byte-immutable.

### DII-128 — Sealed-history verification requires complete, parseable history
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 second Claude Opus 5 correction; DII-120; BL-069; BL-071`

A sealed-record integrity check is valid only against complete Git history. A shallow
repository must produce a deterministic integrity finding and cannot report success;
remote workflows that exercise the guard must fetch full history. After the first
schema-valid sealing commit, an unreadable or malformed later revision is itself an
integrity finding rather than an uncaught exception or a skipped transition.

DII-120 remains controlling for lifecycle semantics: `active` may transition to
`superseded` with one scalar replacement or to `tombstoned`; `superseded` and
`tombstoned` are terminal. Governance scaffolding must therefore emit
`superseded_by: null`, never an array, so generated records enter the canonical
scalar-or-null lifecycle without a repair step.

### DII-129 — Required trace links have a fixed complete floor and a no-write check
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 second Claude Opus 5 correction; DII-125; BL-070`

When canonical trace generation sets `require_test_links: true`, both invariant
completeness floors are exactly `1`. The generator must fail if any canonical invariant
lacks an assertion-bearing tracked test; it may not derive a lower required ratio from
the incomplete population it is meant to judge.

The production trace command has a check mode that computes expected bytes without
writing `law/trace.json`, fails on incomplete inputs, and fails when committed bytes are
stale. Local and remote CI invoke that check. Only the Architect materialization step
may write the canonical trace after the Inspector-owned corpus changes.

### DII-130 — R-0002 closes from the second-review and exit-ladder repairs
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-124–129; R-0002-AS-BUILT@807b5581e2647377ce0aa7bf90c75cb4a210c047; BL-064; BL-066–073`

DII-130 supersedes DII-126 only as the final R-0002 source-closing decision. Earlier
closing judgments and measurements remain immutable chronological evidence but do not
describe the current candidate. The final Auditor re-close records exact closure
identity, Machine commit binding, literal no-fallback Opus selection, complete sealed
history, no-write trace freshness, truthful current instructions/citations, lint-clean
assertions, and role-pure global formatting.

The exact source candidate is the commit containing this decision and the final
deterministic repository-reference regeneration. It may advance only after a third
independent read-only Claude Opus 5 review through literal `claude-opus-5` with no
fallback, a clean worktree, and every local and exact remote gate green. BL-063 remains
ring-fenced to R-0005 before round-archive activation, and BL-065 remains assigned to
R-0004 before production-readiness claims; neither is an R-0002 source red or a claim
of completion beyond this round.

After the source PR merges, the closure-only branch emits PC-0003 against that exact
source merge SHA using DII-105 as declaration and DII-130 as closing decision.
Every batch attributed to Machine carries its full commit id. Every observed source
gate is pass, the release disposition is `none-preratification`, and no failed gate or
failing validation criterion is admitted. R-0002 remains draft, ratifies nothing,
releases nothing, deploys nothing, and transfers no readiness or evidence standing.

### DII-131 — OM-005's satisfied condition closes BL-017 in R-0002
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 third Claude Opus 5 correction; OM-004; OM-005; OM-006; BL-074`

OM-004's initial R-0006 ownership and DII-119's matching forecast were written while
the unchanged legal coverage floors were red. OM-005 later authorized R-0002 to
iterate and expressly made actual passage of those floors the BL-017 closing
condition. OM-006 records the Owner's resulting ownership transition after that
condition passed.

BL-017 is therefore closed in R-0002. R-0003 through R-0010 retain the unchanged
coverage command as an all-green regression gate; no later plan may preserve an
expected coverage red, an exception, or R-0006 ownership. Historical red readings and
their then-current forecasts remain chronological evidence only.

### DII-132 — Authority binding uses one fail-closed Constitution parser
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 third Claude Opus 5 correction; BL-075`

Every authority-policy binding consumes the canonical
`parseConstitutionVersion` implementation. Both `Version` and `Candidate version`
headers are valid only in their exact bold header form. Missing Constitution bytes or
a missing/malformed version marker is a hard binding error.

No binding path may invent fallback Constitution text, a fallback version, or a digest
of synthetic bytes. A repository without canonical self bytes may bind only an
existing pinned Constitution whose exact bytes carry a valid version marker.

### DII-133 — Sealed history follows renames and treats Git failure as a finding
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 third Claude Opus 5 correction; DII-128; BL-076`

Complete sealed history includes the path in force at each commit. A rename does not
create a new sealing boundary and cannot hide body or frontmatter mutation in the
rename commit. The guard resolves the historical path from Git's own name-status
evidence before reading each revision.

Any failure to query repository state, enumerate history, resolve a historical path,
or read a named revision produces a deterministic integrity finding. Only a confirmed
non-shallow repository with successfully enumerated record history may report clean.

### DII-134 — Forbidden-action scanning includes committed path evidence
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 third Claude Opus 5 correction; BL-077`

Each scanned commit is evaluated against its message and deterministic committed
change evidence. Change evidence includes name-status paths rendered as the
corresponding `git add` or `git rm` operation and the committed patch text. A neutral
message cannot hide deletion or mutation of `law/`, `product/`, `work/`, `record/`, or
committed `.devai/config/` authority surfaces.

The scanner emits at most one finding per rule and commit, identifies which evidence
class matched, and fails closed when a requested commit cannot be inspected. This
expands detection input only; it grants no mutation authority.

### DII-135 — Historical closure conformance and fourth-review residuals are explicit
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 third Claude Opus 5 correction; DII-124; BL-078; BL-080–084`

PC-0002 predates DII-124's exact failed-gate-token rule. Its
`coverage-t1-t3` gate is `fail` while `failed_validation_criterion` is null, so its
immutable bytes would not validate as a newly emitted closure under the current
production verb. It remains historical append-only correction evidence rather than a
template for PC-0003. PC-0003 must satisfy the current strict verb against the exact
source merge SHA.

R-0002 closes BL-082 by pinning the root Corepack identity to the registry-provided
pnpm 9.15.0 SHA-512 digest and closes BL-083 by restricting Inspector Git reads to
commands exercised by production. BL-080 and BL-084 remain prepared in R-0004; BL-081
remains prepared in R-0006. Those residuals prohibit governed-surface or
assertion-depth readiness claims until their assigned rounds close them, but they are
not concealed R-0002 gate failures and do not authorize serial-round bypass.

Current trace evidence proves the deterministic marker and tracked-path contract
defined by DII-125 and DII-129. Until BL-081 closes, no R-0002 statement may strengthen
that evidence into a universal assertion-semantic guarantee. Likewise, selector
coverage claims are limited to the explicitly enumerated active campaign instruction
set exercised by the contract; they do not imply discovery of every future prose
surface.

### DII-136 — R-0002 closes from the third-review repairs and exact green ladder
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 fourth-review source close; DII-105; DII-131–135; R-0002-AS-BUILT@6d653d2c801c7fb68adf79f9ff40185fbd4aa43c; BL-074–084`

DII-136 supersedes DII-130 only as the final R-0002 source-closing decision. Earlier
closing decisions and failed independent reviews remain chronological evidence. The
current close reconciles BL-017 ownership, binds Constitution and sealed history
fail-closed, scans forbidden committed changes, discloses PC-0002's historical
nonconformance, pins Corepack integrity, and preserves a gapless current backlog
disposition.

BL-074 through BL-079 and BL-082 through BL-083 are closed. BL-080 and BL-084 remain
prepared in R-0004; BL-081 remains prepared in R-0006. These residuals narrow future
claims and cannot be treated as completed, but they are not failing R-0002 source
gates. External R-0008 release, R-0009 activation, and R-0010 observation remain
human-gated.

The exact source candidate is the commit containing this decision and the final
deterministic repository-reference check. It may advance only after a fourth
independent read-only Claude Opus 5 review through literal `claude-opus-5` with no
fallback, a clean worktree, and every required local and exact remote gate green.

After the source PR merges, the closure-only branch emits PC-0003 against the exact
source merge SHA using DII-105 as declaration and DII-136 as closing decision. Every
source gate is pass, release disposition is `none-preratification`, and no failed gate
or failing validation criterion is admitted. R-0002 remains draft, ratifies nothing,
releases nothing, deploys nothing, and transfers no readiness or evidence standing.

### DII-137 — Fourth-review corrections bind actual bytes and exhaustive guards
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 fourth Claude Opus 5 correction; DII-105; DII-131; DII-134–136; BL-074; BL-077–078; BL-083; BL-085–093`

DII-136's source-closing judgment is reopened. The R-0002 plan changed after DII-105's
declaration: DII-105 truthfully retains its original digest
`4db25005ab7adc0fff3ca0e9a332870d709aa7c4343830ca5dc0dfca62c6b568`,
while the amended current plan is bound here at
`29e05473ab1c413552140e62ea93300a90de52aadf0f1cda73ecd6765830a7c5`.
The closure uses DII-105 as the historical declaration and the later final closing
decision as the current amended-plan binding.

DII-135 misstated PC-0002's structure. The record has no
`failed_validation_criterion` field. Its `validation_criteria` array contains two
`verdict: fail` entries, but neither contains standalone gate token
`coverage-t1-t3`; that exact-token defect is why the immutable historical record would
not pass the current production verb.

BL-017 retirement applies to root agent instructions and every campaign plan as well
as the shared contract and orchestrator prompts. The active guard enumerates those
surfaces and matches the prohibited meanings rather than one adjacent phrase.
R-0004 explicitly carries BL-065, BL-080, and BL-084; R-0005 explicitly carries
BL-063.

Forbidden committed-change detection covers in-place additions and updates throughout
`law/`, `product/`, `work/rounds/`, `work/audit/`, `record/`, and committed
`.devai/config/`, as well as deletion. Malformed registry bytes and unavailable Git
history are findings, never an empty clean scan. Inspector Git reads remain within the
production broker. These detection rules do not grant proof mutation authority.

### DII-138 — R-0002 closes from the fourth-review repairs and exact green ladder
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 fifth-review source close; DII-105; DII-137; R-0002-AS-BUILT@9083ca5893a5189bbb8c0d519e271dd1e7109fb9; BL-074; BL-077–078; BL-083; BL-085–093`

DII-138 supersedes DII-136 only as the final R-0002 source-closing decision. The
Auditor re-close preserves the fourth Opus FAIL, the red-first role-pure repairs, the
amended plan binding, actual PC-0002 criterion shape, exhaustive BL-017 retirement,
prepared residual ownership, protected committed-change detection, fail-closed
registry/history behavior, exact Inspector/production Git verbs, and the executable
formatting exclusion boundary.

BL-074, BL-077, BL-078, BL-083, and BL-085 through BL-093 are closed. BL-065 and
BL-080/084 remain prepared in R-0004; BL-063 remains prepared in R-0005; BL-081
remains prepared in R-0006. Those residuals remain claim constraints and do not
authorize a serial-round bypass.

The exact source candidate is the commit containing this decision and a fresh
deterministic repository-reference check. It may advance only after a fifth independent
read-only Claude Opus 5 review through literal `claude-opus-5` with no fallback, a
clean worktree, and every required local and exact remote gate green.

After the source PR merges, the closure-only branch emits PC-0003 against the exact
source merge SHA using DII-105 as historical declaration, DII-137 as amended-plan
binding, and DII-138 as closing decision. Every source gate is pass, release
disposition is `none-preratification`, and no failed gate or failing validation
criterion is admitted. R-0002 remains draft, ratifies nothing, releases nothing,
deploys nothing, and transfers no readiness or evidence standing.

### DII-139 — Fifth-review enforcement failures reopen the R-0002 close
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 fifth Claude Opus 5 correction; DII-138; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-5; BL-075; BL-077; BL-079; BL-082; BL-086; BL-092; BL-094–106`

DII-138's source-closing judgment is reopened. Its pre-decision ladder was genuinely
green, but that ladder did not execute several governance guards whose production
implementations remained fail-open or structurally ineffective. No local green result
or future remote check may stand in for execution of the guard it claims to prove.

Constitution version parsing has one canonical implementation and every caller fails
closed on missing bytes or markers. Forbidden-action registries require at least one
executable detection pattern per entry; missing, empty, malformed, pattern-less, merge,
and rename evidence cannot report clean. Decision citations resolve from declared
record identities, including DII headings in the canonical register, rather than from
filename coincidence. Draft ADRs remain intentionally unsealed until R-0003, but the
live-tree guard must report that state and become non-vacuous immediately on
activation.

Trace targets are contained repository-relative paths to the file kind declared by the
target. Missing catalogs, entries, paths, parseability, containment, and file-kind
failures block rather than reduce the judged population. BL-081 still owns the later
assertion-depth contract; it cannot be used to waive path integrity now.

The canonical freshness window is 168 hours and its accepted policy range is 1 through
8760 hours inclusive. Canonical Architect policy is read before its Engineer-owned
materialization, and byte divergence is a blocking error. Bootstrap seeds only
packaged, schema-valid canonical policy; existing target bytes are never promoted to
authority.

Pull-request CI must reproduce strict forbidden-action, governance-ledger,
trace-resolution, canonical-policy, and T4–T6 checks. Workflow lint enforces the
required command roster. Closure inputs validate before use, current backlog views
must agree, and final-close language distinguishes a pre-decision measurement from an
exact-candidate check.

OM-003 is not a shipped-runtime model restriction. It narrows only Claude interactions
inside this campaign, exactly as its own applied boundary says. Historical Machine and
red-first ordering exceptions remain immutable and disclosed; BL-106/R-0005 owns the
prospective mechanical sequencing guard.

### DII-140 — R-0002 binds the fifth-review repairs without laundering evidence chronology
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 sixth-review source close; DII-105; DII-137; DII-139; R-0002-FIFTH-REVIEW-CORRECTIONS@f71192e50b956384e0594869a1f3fb56d1dee1b3; BL-075; BL-077; BL-079; BL-082; BL-086; BL-092; BL-094–105`

DII-140 supersedes DII-138 only as the R-0002 source-closing judgment. The fifth
review FAIL remains immutable evidence. Its confirmed enforcement defects were
governed before repair, exercised by Inspector-owned failing contracts, repaired
within path authority, and re-audited at
`f71192e50b956384e0594869a1f3fb56d1dee1b3`.

The 119-file local floor and 70.53/60.85/77.22/72.80 coverage readings recorded by the
Auditor are measurements of pre-decision source snapshot
`7f1f84a31e4e99f8cf5463dd74cb8fd73ddd265f`; they are not represented as
measurements of this later law commit. The exact source candidate is the commit
containing this decision plus the deterministic repository-reference regeneration.
That exact candidate must independently pass the no-write trace/reference checks,
workflow/governance checks, formatting and tree-cleanliness checks, then receive a
fresh read-only Claude Opus 5 review through literal `claude-opus-5` with no fallback.
Only an exact-candidate PASS may authorize push and exact-SHA remote CI.

BL-075, BL-077, BL-079, BL-082, BL-086, BL-092, and BL-094 through BL-104 are
closed. BL-105 closes only when the final repository-reference artifact, ignored
PC-0003 operational template, and exact-candidate review all bind DII-140 and the
actual candidate without predeclared evidence. BL-065 and BL-080/084 remain prepared
in R-0004; BL-063 and prospective sequencing BL-106 remain prepared in R-0005;
BL-081 remains prepared in R-0006. Those residuals constrain claims and do not
authorize serial-round bypass.

After the source PR merges, a closure-only branch may emit PC-0003 through the
production verb against the exact source merge SHA, using DII-105 as historical
declaration, DII-137 as amended-plan binding, and DII-140 as closing decision. Every
observed source gate must be pass, `release_disposition` is
`none-preratification`, and no failed gate or failing validation criterion may be
invented. R-0002 remains draft, ratifies nothing, releases nothing, deploys nothing,
and transfers no readiness or evidence standing.

### DII-141 — R-0002 binds the sixth-review corrections for exact seventh review
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 seventh-review source close; DII-105; DII-137; DII-139–140; R-0002-SIXTH-REVIEW-CORRECTIONS@30ecb06a990ac4a09a92b6114d1cdb0d8bdcf44d; BL-105; BL-107–112`

DII-141 supersedes DII-140 only as the R-0002 source-closing judgment. The sixth Opus
FAIL remains immutable evidence. Auditor `7641d9f` governed its six findings before
Inspector `3db837d` established the failing contracts and Engineer `122fa08` repaired
the production behavior. Architect `ad8db19` regenerated the trace corpus; Inspector
`9d92ef8` kept historical closure fixtures bound to real Git objects; Architect
`7c8d3f3` refreshed repository locators; and Auditor
`30ecb06a990ac4a09a92b6114d1cdb0d8bdcf44d` re-closed the correction.

The Stage/coverage measurements in that audit precede this decision and are not
represented as measurements of this later law commit. Full-floor and formatting
execution at `5fd2af6251375c3de3df8df841f4bf3c0e1e808a` is separately
identified. The exact source candidate is the commit containing DII-141 plus the final
deterministic repository-reference regeneration. It must pass exact-candidate
no-write trace/reference, workflow, governance, formatting, and cleanliness checks,
then obtain a seventh independent read-only review through literal `claude-opus-5`
with no fallback. Only PASS authorizes push and exact-SHA remote CI.

BL-107 through BL-112 are closed. BL-105 closes only when the final operational
template binds DII-141, contains only Git-resolvable batch identities, carries actual
coverage without a predeclared review result, and the seventh review passes. BL-065
and BL-080/084 remain prepared in R-0004; BL-063 and prospective sequencing BL-106
remain prepared in R-0005; BL-081 remains prepared in R-0006.

After the source PR merges, a closure-only branch may emit PC-0003 through the
production verb against the exact source merge SHA, using DII-105 as historical
declaration, DII-137 as amended-plan binding, and DII-141 as closing decision. Every
observed source gate must pass, `release_disposition` is `none-preratification`, and
no failed criterion may be invented. R-0002 remains draft, ratifies nothing, releases
nothing, deploys nothing, and transfers no readiness or evidence standing.

### DII-142 — R-0002 binds the seventh-review residual repairs for final exact review
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final source close; DII-105; DII-137; DII-139–141; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-7@d8c119910bf2a4ea755e1aa8d8b1d6f5ba98f965; R-0002-SEVENTH-REVIEW-CORRECTIONS@ba47c335fdca893068dd711f30a96c68e620f672; BL-105; BL-113–116`

DII-142 supersedes DII-141 only as the R-0002 source-closing judgment. The seventh
Opus review PASS remains immutable evidence for exact candidate
`d8c119910bf2a4ea755e1aa8d8b1d6f5ba98f965`. Its four residual findings were
governed before further publication: Inspector `67f7081` proved the two behavior
defects red-first; Engineer `3f7e5bc` made complete-draft validation precede batch
property access and made `merged_as` resolve to a Git commit before emission;
Inspector `49f9488` restored focused green; and Auditor `ba47c33` closed BL-113
through BL-116 after correcting the active backlog posture and operational template.

The seventh PASS is not represented as review of this later correction. The exact
source candidate is the commit containing DII-142 plus deterministic trace and
repository-reference regeneration. That exact candidate must pass the complete local
ladder and then receive one final independent read-only review through literal
`claude-opus-5` with no fallback. Only that final exact-candidate PASS authorizes
source push and exact-SHA remote CI.

BL-113 through BL-116 are closed. BL-105 closes only when the operational template
binds DII-142, all batch identities resolve, current green measurements replace prior
measurements, no review verdict is predeclared, deterministic projections are fresh,
and the final exact review passes. BL-065 and BL-080/084 remain prepared in R-0004;
BL-063 and prospective sequencing BL-106 remain prepared in R-0005; BL-081 remains
prepared in R-0006.

After the source PR merges, a closure-only branch may emit PC-0003 through the
production verb against the exact source merge SHA, using DII-105 as historical
declaration, DII-137 as amended-plan binding, and DII-142 as closing decision. Every
observed source gate must pass, `release_disposition` is `none-preratification`, and
no failed criterion may be invented. R-0002 remains draft, ratifies nothing, releases
nothing, deploys nothing, and transfers no readiness or evidence standing.

### DII-143 — Apply the Owner's R-0002 final-review exception without weakening proof
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 Owner-exception source close; OM-007; DII-105; DII-137; DII-139–142; R-0002-CLAUDE-OPUS-CLOSE-REVIEW-7@d8c119910bf2a4ea755e1aa8d8b1d6f5ba98f965; R-0002-LOCAL-EXIT-LADDER@a1146322e5acf00e54d276ae2dcb4584e2e8c9d1`

DII-143 supersedes DII-142 only as the R-0002 source-closing judgment. OM-007
explicitly replaces the additional post-repair Opus review with reliance on the
preserved seventh exact-candidate PASS. That review's four residual findings were
governed as BL-113 through BL-116 and repaired before this exception. The later exact
candidate `a1146322e5acf00e54d276ae2dcb4584e2e8c9d1` passed the complete local
floor, Stage 1 through Stage 3, governance, T1 through T6, changeset, formatting,
trace, reference, and package-manager-integrity checks.

The exception changes no production or evidence threshold. The source candidate that
contains OM-007 and DII-143 must pass local source checks and every required GitHub
check at its exact SHA. Its exact source merge must then pass exact-main checks before
the production closure verb may append PC-0003. Every closure-branch and final-main
check must also pass.

OM-007's requested cycle collapse is implemented as one continuous ceremony, not one
PR. A single PR cannot truthfully bind PC-0003 to a source merge commit that does not
yet exist. The source PR therefore merges first; the closure-only PR immediately
follows from that exact merge without a discretionary review pause.

BL-105 is satisfied for source-close purposes by the explicit Owner replacement of
the final-review condition, the exact green local evidence, the fresh deterministic
projections, and the operational template's unresolved evidence placeholders. Those
placeholders must be replaced only with observed source merge, CI, and closure facts.

PC-0003 uses DII-105 as historical declaration, DII-137 as amended-plan binding, and
DII-143 as closing decision. Its release disposition remains
`none-preratification`. This exception is limited to R-0002; all later rounds retain
their existing review and serial entry gates. Nothing is ratified, released,
deployed, published, or declared ready by this decision.

## Appendix — Register-consistency guard

This is an implementation note, not an unnumbered decision. A mechanical check
(CI + doctor) asserts no entry above contradicts constitutional text, and that every
entry's provenance resolves into the frozen predecessor or this register. DII-002 and
DII-007 authorize the guard; the guard protects the rest. [closes the ex-Article-27
"six vs three" drift class]
