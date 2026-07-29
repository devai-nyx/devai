---
id: DECISIONS
title: DEVAI-II decision register
type: register
status: active
date: 2026-07-25
authority: Architect (active container; per-entry lifecycle controls authority)
supersedes: null
superseded_by: null
provenance: absorbed from the predecessor decision corpus; DII namespace bound during R-0001/R-0002; container activated by DII-152 and corrected by DII-158
---

# DEVAI-II decision register

This is the active successor decision-register container. DII identifiers are durable
and never re-minted. Only entries with `status: active` carry authority; entries whose
own metadata remains `draft` are preserved proposals and gain no authority from the
container lifecycle. `[ex-D-nn]` suffixes retain predecessor provenance shorthand.
Evidence values are cited to the frozen predecessor, never restated.

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
supersession lives in provenance). **Ids are durable successor assignments; entry lifecycle
determines authority and later correction is append-only.** A `check records` prototype validates every entry against
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

### DII-144 — Repair bounded merge inspection after exact source CI
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 exact-CI repair; OM-007; DII-105; DII-137; DII-143; GitHub Actions run 30171205110@b55685762252d3af1d0b483746ab7a8c843b8532; BL-095; Inspector d8c9c22a2a02cfb457cb22d6c99e62e5085ab70f; Auditor 48bc9dc600991afc8576f4d9d0014ba9c6f5da59; Engineer 5552ddfc1468b10d8cce2b7d2f7dcb91561628c4; Auditor 375c19d6dc375d731e14faf76fe13574ec432b0f`

DII-144 supersedes DII-143 only as the R-0002 source-closing judgment. Exact source
CI run `30171205110` exposed a bounded-inspection defect at source candidate
`b55685762252d3af1d0b483746ab7a8c843b8532`: the synthetic pull-request merge patch
exceeded Node's one-megabyte default child-process buffer, so the forbidden-action
scanner failed closed as `FORBIDDEN-SCAN-UNAVAILABLE` before it could classify the
protected deletion evidence.

Inspector `d8c9c22` reproduced that failure red-first with a 1.1 MiB merge payload.
Auditor `48bc9dc` reopened BL-095 against the exact failed run. Engineer `5552ddf`
introduced an explicit 16 MiB ceiling for both merge name-status and patch
inspection; the scanner remains bounded and fail-closed above that ceiling. The
focused 18-test forbidden-action suite, affected package build, and complete
1,093-pass repository floor then passed. Auditor `375c19d` re-closed BL-095 locally
while retaining the failed run as historical red evidence.

The correction changes no authority, production, release, review, or evidence
threshold. OM-007 still replaces only the additional final Opus review. The exact
candidate containing DII-144 and fresh deterministic references must pass the full
local ladder and all required GitHub checks before merge. Its exact merge SHA must
then pass exact-main checks before the closure-only branch may emit PC-0003 through
the production verb.

PC-0003 uses DII-105 as historical declaration, DII-137 as amended-plan binding, and
DII-144 as closing decision. Its release disposition remains
`none-preratification`. Nothing is ratified, released, deployed, published, or
declared ready by this repair.

### DII-145 — Exclude non-novel synthetic merge aggregation from change evidence
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 second exact-CI repair; OM-007; DII-105; DII-137; DII-144; GitHub Actions run 30171619705@4fc168c8b6a0ce9f15227e6caee66d06fd597a7b; BL-117; Auditor a70067278fb3b096a7e0e620fecbf0df5915bdbd; Inspector 915d84aa96940a99056076924846dcb737ee756b; Engineer b1e6c2a7dcef61ee3ef39fc73a9e5b315a52fbd3; Auditor 1205ddb7a47748834f8cac15fc7606551a1b18c3`

DII-145 supersedes DII-144 only as the R-0002 source-closing judgment. Exact source
CI run `30171205110` proved that bounded inspection alone was insufficient: GitHub's
synthetic merge `cb2e93490e3ac439f979f4d7986ae7ac9fe9695e` was readable, but its
tree was byte-identical to the source-head parent. Treating its aggregate diff as one
newly authored change duplicated constituent evidence under the merge identity and
misclassified literal policy, documentation, fixtures, and workflow paths as new
forbidden actions.

BL-117 narrows the correction to non-novel merge aggregation. Inspector `915d84a`
proved red that the aggregate merge duplicated a constituent forbidden-pattern
finding while the constituent commit remained independently discoverable. Engineer
`b1e6c2a` now reads merge parents from the bounded log and omits aggregate change
evidence only when the merge tree equals one parent. Commit-message evidence remains
scanned. Merges with novel resolution bytes retain full path and patch inspection,
and all Git inspection failures remain fail-closed. Auditor `1205ddb` re-closed
BL-117 after all 19 focused scanner tests and the affected package build passed.

The exact candidate containing DII-145 and fresh deterministic projections must pass
the complete local ladder and all required GitHub checks before merge. Its exact
merge SHA must pass exact-main checks before the closure-only branch may emit PC-0003
through the production verb.

PC-0003 uses DII-105 as historical declaration, DII-137 as amended-plan binding, and
DII-145 as closing decision. Its release disposition remains
`none-preratification`. OM-007 still replaces only the additional final Opus review.
Nothing is ratified, released, deployed, published, or declared ready by this repair.

### DII-146 — Bound role-pure test fixtures without exempting action evidence
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 final exact-CI correction; OM-007; DII-105; DII-137; DII-145; BL-118; Auditor 87546850f9b022d232f9fba709f33f11f417e118; Inspector f01463da36c2b108f839a3197c6ee18ee5e05b3d; Engineer cd71e378e1479687e3a47fad9bf3fd84b756c626; Inspector 9915e8a8da5c96bd5f315e000063da9d14cdbbd5; Auditor 8ae36b4e13c1919193b64952c3aa8ed0ec26760d; Inspector 152b06efa110ef5916bef4ff0f5cfabfdd683e52`

DII-146 supersedes DII-145 only as the R-0002 source-closing judgment. The BL-117
red-first commit necessarily encoded a forbidden command as test data, and the next
complete local floor correctly showed that undifferentiated patch-content scanning
classified that fixture as executed action evidence. BL-118 governs this separate
classification defect rather than waiving or hiding the finding.

Inspector `f01463d` proved the fixture boundary red without placing the command
literal in its governed patch. Engineer `cd71e37` exempts content-pattern change
evidence only for commits attributed to DEVAI Inspector when the non-empty changed
path set consists entirely of test paths. Inspector `9915e8a` proves that commit
messages and mixed-path changes remain scanned; prior contracts preserve scanning for
other authors, path-based authority and CI evidence, novel merge resolutions, and all
inspection failures. Auditor `8ae36b4` re-closed BL-118 after all 22 focused scanner
tests, the affected build, and local governance passed. Inspector `152b06e` aligned
the compact closed-range contract with the audited BL-118 disposition.

The exact candidate containing DII-146 and fresh deterministic projections must pass
the complete local ladder and all required GitHub checks before merge. Its exact
merge SHA must pass exact-main checks before the closure-only branch may emit PC-0003
through the production verb.

PC-0003 uses DII-105 as historical declaration, DII-137 as amended-plan binding, and
DII-146 as closing decision. Its release disposition remains
`none-preratification`. OM-007 still replaces only the additional final Opus review.
Nothing is ratified, released, deployed, published, or declared ready by this repair.

### DII-147 — Bind append-only closure-ledger verification
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0002 disposable close correction; OM-007; DII-105; DII-137; DII-146; BL-119; Auditor 6ac68fd; Inspector 6dd0325; Auditor bdad995; Inspector e1d604b; Auditor 3086696`

DII-147 supersedes DII-146 only as the R-0002 source-closing judgment. The first
disposable production emission of PC-0003 from exact source merge
`070b745a09285fddc4510da60dbbc3eb957de756` succeeded and preserved PC-0001 and
PC-0002 byte-for-byte, but exposed a test-only population assumption: the PC-0002
correction contract expected the effective ledger to contain exactly one round.

BL-119 governs that closure blocker. Inspector `6dd0325` now derives the asserted
count from effective, non-superseded ledger records while retaining the exact PC-0001
and PC-0002 hashes, the PC-0002 supersession relationship, and the effective R-0001
streak basis. The same 29 focused closure tests pass before PC-0003 exists and after
the production close appends PC-0003 in the disposable worktree. Auditor `bdad995`
re-closed BL-119 from those two observed states. Inspector `e1d604b` and Auditor
`3086696` align the compact backlog contract with that disposition.

The corrected exact candidate must pass the complete source ladder and all required
GitHub checks before merge. Its exact merge SHA must then pass exact-main checks
before the closure-only branch emits PC-0003 through the same production verb.

PC-0003 uses DII-105 as historical declaration, DII-137 as amended-plan binding, and
DII-147 as closing decision. Its release disposition remains
`none-preratification`. OM-007 still replaces only the additional final Opus review.
Nothing is ratified, released, deployed, published, or declared ready by this repair.

### DII-148 — Declare R-0003 and bind the founding source crosswalk
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0003 declaration; OM-002; R-0003 authorization and plan; BL-004; REV-0001; R-0001 law-altitude-sweep; DII-098; R-0003-OPENING-AUDIT`

R-0003 is declared for the founding-law ceremony only after the independent opening
audit re-derived the frozen predecessor binding, R-0002 closure, exact-main CI, and
unchanged coverage floors. It authorizes no release, deployment, publication, readiness
claim, evidence promotion, or predecessor mutation.

The 42-row source ledger in
`work/rounds/R-0003/constitution-source-crosswalk.md` is the total disposition of the
founding Constitution. Articles 1 through 40 retain predecessor 0.6.0 doctrine except
for the reviewed successor deltas explicitly named in that ledger and the founding
annex. Articles 41 and 42 are successor additions. DII-098 is affirmed: Article 42
remains in Part XI because relocation would change anchors without improving doctrine.

The crosswalk resolves the candidate wrapper's source statements and Part X placement
without changing load-bearing Constitution bytes ahead of the authorized materializer.
The exact wrapper/status transition is reserved to the later R-0003 ceremony decision,
after ADR and joint glossary dispositions pass their gates, and must be followed by the
role-pure materialization batch.

### DII-149 — Accept the gapless successor ADR roster
`type: decision · status: draft · authority: Architect · provenance: session-draft R-0003 ADR disposition; BL-005; REV-0003; DII-106; DII-120; law/adr/predecessor/`

ADR-001 through ADR-012 are accepted with `status: active` under the successor lifecycle.
Each record names the predecessor inputs it supersedes, contains the six mandatory
sections, resolves its provenance and affected rules, and has no successor replacement.
The frozen predecessor source files remain historical input and are not active law.

ADR-001 preserves the zero-exemption derived mutator denominator and constitutional
change-control requirement. ADR-002 makes human-supervised operation the supported
baseline. ADR-003 accepts the promotion mechanism while keeping all graduation standing
void pending re-earning. ADR-004 generalizes the independent-checkability rule and names
its deferred aggregation boundary. ADR-005 through ADR-012 bind the reviewed CI, CLI,
publication, publish-path, self-adoption, effects, prompt-firewall, and round semantics
without authorizing publication or importing predecessor evidence standing.

This lifecycle act closes only the ADR disposition required by BL-005. It establishes no
release, deployment, readiness, evidence promotion, or autonomous-operation claim.
The pre-ceremony Inspector contract that still requires twelve drafts is the explicit
BL-005 known-red until B6 replaces that obsolete lifecycle expectation with ratification
contracts; the production ADR validator itself must be green in this batch.

### DII-150 — Ratify the DEVAI-II founding law and genesis attestation
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 founding ceremony; OM-002; DII-148; DII-149; BL-004; BL-006; R-0003-CONSTITUTION-CROSSWALK; R-0003-GLOSSARY-OWNER-MARKS; GEN-0001`

At `2026-07-25T22:08:05Z`, the Architect ratifies DEVAI-II Constitution 1.0.0 and
the genesis attestation bound to it. The same timestamp is written in the Constitution
ceremony marker and `GEN-0001.ratified`. The attestation's predecessor identities,
manifest document hashes, empty imported-evidence set, and nonclaims remain unchanged;
after this act it is immutable and any correction requires a new decision.

The 42-article ledger in `work/rounds/R-0003/constitution-source-crosswalk.md` is total
and DII-098's Part XI placement is final. The wrapper, version, Part X heading, and body
now state 1.0.0/ratified; frontmatter uses the schema's binding `active` lifecycle.
No unreviewed doctrine was introduced.

The Owner marks in `product/glossary-ratification-marks.md` are applied jointly: all
GE-001 through GE-044 records are active, none is deprecated, retired, or superseded,
and the reviewed GE-006/016/020/022 corrections plus GE-038..044 successor rider retain
their approved definitions and resolved graph.

BL-004, BL-005, and BL-006 are substantively satisfied by DII-148 through DII-150, but
round closure still requires materialization, Inspector contracts, independent audit,
Opus review, exact-SHA CI, and PC-0004. Until B5 and B6, the stale authority digest and
pre-ceremony draft/null expectations are explicit known-reds governed by BL-004 and
BL-005; they are not waived or represented as green.

This act establishes only founding law. It releases, deploys, publishes, promotes, and
re-earns nothing and establishes no product or production readiness.

### DII-151 — Bind the R-0003 founding-ratification source close
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 source close; OM-002; DII-148–150; R-0003-AS-BUILT; BL-004–006`

DII-151 closes the local source implementation of R-0003. The 42-article crosswalk,
twelve accepted ADRs, jointly ratified 44-entry glossary, Constitution 1.0.0, and
immutable genesis attestation satisfy the founding-law ceremony declared by DII-148.
The ratified Constitution digest is
`b005ba4ba57979d471a1a139e093f8e7d158ae03488c394d3f43561ca9c4c631`;
the genesis attestation digest is
`d72711c57e54025ebd2626b2ba20a1263db7d914e308d7d4ce172f4faee6bb09`;
and both canonical and materialized authority policies have digest
`6f62027f4dd3cb9d29daaa7d6b9a288176a9bc56979a3c9ca370cbd0ef2978c2`.

The Auditor's as-built independently records the role-pure batches and the fresh exact
local exit ladder: 1,101 ordinary tests with eight declared skips; 34/34 resolved
invariants across 122 executable test files; all governance, T1 through T6,
changeset, formatting, and deterministic-projection gates green; and unchanged
70/60/70/70 coverage floors satisfied at 70.61/61.00/77.27/72.88.

This decision does not predeclare remote or independent-review evidence. The exact
candidate containing DII-151 and fresh deterministic projections must pass the
complete local ladder and then a read-only review through literal `claude-opus-5`,
with no fallback. All actionable findings must be resolved through the governed
red-first, role-pure process before source push. Every required GitHub check must pass
at the exact source SHA; the exact source merge must then pass exact-main checks before
the production closure verb may append PC-0004 in a closure-only branch.

PC-0004 uses DII-148 as the declaring decision, DII-150 as the ceremony act, and
DII-151 as the closing decision. Its release disposition is `none-needed`: R-0003 is a
law ceremony and creates no release obligation. BL-004 through BL-006 close only when
that immutable closure record and its final exact-main CI are observed. R-0004 remains
dormant until then.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-152 — Correct R-0003 founding provenance and activate the register container
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 first Opus correction; DII-148–151; R-0003-CLAUDE-OPUS-CLOSE-REVIEW; BL-120–125; R-0003-GLOSSARY-OWNER-CORRECTION-MARKS; R-0003-REV-PROVENANCE-MANIFEST`

DII-152 supersedes DII-151 as the current R-0003 source-closing judgment and corrects
only the inaccurate provenance and completeness assertions in DII-148 through DII-150;
it does not undo the founding ceremony, alter article doctrine, or edit the immutable
genesis attestation. The terminal predecessor Constitution is 0.8.0, not 0.6.0. The
live Constitution wrapper and 42-row ledger now identify that source truthfully.

The ledger remains total after disclosing the previously omitted threshold-path
rebindings in Articles 18 and 30. Its Article 7 row now records the complete successor
authority delta: durable `work/audit/` replaces ignored local output, so the predecessor
Architect transfer-and-seal duty, Auditor non-commit sentence, and durable-scope
qualifier do not transpose. The founding annex no longer claims six inline markers when
only three textual insertions carry them. These are provenance corrections to the
already-reviewed successor text, not new doctrine.

The decision register becomes an active governed container at this act. Container
activation binds the DII namespace but does not ratify its contents wholesale: only an
entry whose own metadata is `active` carries authority, while every `draft` entry remains
a non-authoritative proposal. The file-level date records this container act, not an
invented ceremony date for preserved draft entries. This resolves the circular state in
which DII-150 was active while its containing register denied all authority.

ADR-005's sealed predecessor workflow binding and the six multi-source ADR delimiters
remain byte-preserved pending a legal append-only correction. Exact REV-0001, REV-0003,
and REV-0006 bytes are preserved under the durable R-0003 review manifest; their
historical conclusions remain attributable without relying on ignored scratch.

The corrective Owner mark establishes that GE-006/016/020/022 were already active and
were retained after joint review; only GE-038 through GE-044 were newly activated in
R-0003. The glossary guidance applies that fact without changing any definition,
reference, or lifecycle.

The Constitution's corrected wrapper changes its content digest. Before source close,
the Architect canonical policy and Engineer materialization must be rebound to the new
digest, the ratified version pin must be materialized, the sealed ADR binding must be
corrected through its terminal lifecycle and a gapless replacement, all repair contracts
and deterministic projections must pass, and the Auditor must bind fresh exact-candidate
evidence. A new closing decision and exact read-only `claude-opus-5` PASS remain
mandatory before source push. PC-0004 and R-0004 remain blocked until the complete
two-PR close.

This correction establishes only **founding law ratified**. It releases, deploys,
publishes, promotes, re-earns, or declares ready nothing.

### DII-153 — Repair the sealed ADR lifecycle and rebind the R-0003 source close
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 ADR seal-integrity correction; DII-149; DII-152; BL-128; R-0003-EXIT-LADDER-ADR-SEAL-FAILURE; Inspector 726fe66 and 0ba2612; Engineer fa17a5c`

DII-153 supersedes DII-152 only as the R-0003 source-closing judgment. A rejected local
candidate correctly exposed post-seal body mutations in ADR-002, ADR-003, ADR-005,
ADR-007, ADR-008, ADR-010, and ADR-011. BL-128 governs that blocker; no seal exception
or waiver is created. The rejected branch is retained as red evidence and is not the
source candidate.

The clean source branch preserves the exact sealed bytes of the six multi-source ADRs.
Their historic semicolon-delimited predecessor lists remain distinct sources, and the
production parser now accepts that delimiter without rewriting active law. ADR-005's
sealed body, including its historical workflow binding, is likewise preserved. Its only
post-seal mutations are the canonical terminal lifecycle fields: `status: superseded`
and `superseded_by: ADR-013`.

ADR-013 is the gapless active replacement. It preserves ADR-005's CI-economy doctrine,
supersedes ADR-005 explicitly, and binds the actual successor workflows
`.github/workflows/ci.yml` and `.github/workflows/round-gates.yml`. The roster therefore
contains thirteen records, twelve active and one terminally superseded; predecessor files
under `law/adr/predecessor/` remain historical input only.

Before source push, an independent correction audit and a fresh exact-candidate closing
decision must bind the complete local ladder. A fresh read-only review through literal
`claude-opus-5`, with no fallback, remains mandatory. Any actionable finding reopens the
governed red-first repair cycle; only a PASS authorizes source push and exact-SHA CI.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and the final post-audit source-closing decision as
its closing decision. Its release disposition remains `none-needed`. R-0004 remains
dormant until PC-0004 and final exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-154 — Bind the clean R-0003 founding-ratification source close
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 clean source close; DII-148–153; BL-004–006; BL-120–129; R-0003-FIRST-OPUS-CORRECTIONS; R-0003-ADR-POPULATION-CORRECTION; Auditor 1d5ef19 and ac7bf57; Inspector 08025ba; Architect d277b14`

DII-154 supersedes DII-153 only as the R-0003 source-closing judgment. The source
candidate is rebuilt from the last legal commit and contains no post-seal mutation of
ADR-002, ADR-003, ADR-007, ADR-008, ADR-010, or ADR-011. ADR-005 preserves its sealed
body and changes only through the permitted terminal lifecycle fields naming ADR-013.
Decision-record integrity passes the clean history.

The 42-article source ledger, Constitution 1.0.0, genesis attestation, active register
container, thirteen-record/twelve-active ADR roster, 44-entry glossary, canonical
authority policy, production materialization, durable review provenance, trace, and
repository-reference projection now agree. BL-120 through BL-129 have independent
Auditor dispositions, and the ordinary test floor passes after the final Inspector
population correction.

The corrected Constitution digest is
`31c6874f2a0ae88a21e1114844c4084e9f0e9d8c58d54f7fefc1078af98fb8cd`.
The immutable genesis-attestation digest remains
`d72711c57e54025ebd2626b2ba20a1263db7d914e308d7d4ce172f4faee6bb09`.
Canonical and production-materialized authority policy bytes remain identical at
`6539f91912d1770ea49449c05ac17a84cef76aec0e22eacc133552eddfb785c2`.

The exact candidate containing DII-154 and fresh deterministic projections must pass
the complete local ladder, including governance, T1 through T6, unchanged 70/60/70/70
coverage floors, changesets, formatting, trace, and repository-reference checks. It
must then receive a fresh read-only review through literal `claude-opus-5` with no
fallback. Any actionable finding reopens the governed repair cycle; only a PASS
authorizes source push and exact-SHA CI.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-154 as the closing decision. Its release
disposition is `none-needed`. R-0004 remains dormant until PC-0004 and final exact-main
CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-155 — Rebind the R-0003 source close after the formatting correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 final local source close; DII-154; BL-130; R-0003-FORMATTING-FAILURE; R-0003-FORMATTING-CORRECTION; Auditor 964fdce and 8ea924e; Engineer b45073a`

DII-155 supersedes DII-154 only as the R-0003 source-closing judgment. The first complete
ladder on the clean candidate passed Stage 1 through Stage 3, governance, T1 through T6,
unchanged coverage floors, and changeset classification, then correctly stopped at
repository-wide formatting. BL-130 governs and closes that bounded failure.

Engineer `b45073a` formatted the live parser and excluded only the immutable
`work/rounds/R-0003/reviews/` subtree. The exact REV-0001, REV-0003, and REV-0006 hashes
remain unchanged and their contract passes. Auditor `8ea924e` independently records the
correction. The exclusion does not apply to active law, product, packages, tests, live
audit prose, or other round sources.

The exact candidate containing DII-155 and the refreshed repository-reference projection
must restart the complete ladder from Stage 1. It then requires a fresh read-only review
through literal `claude-opus-5`, with no fallback. Any actionable finding reopens the
governed repair cycle; only a PASS authorizes source push and exact-SHA CI.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-155 as the closing decision. Its release
disposition remains `none-needed`. R-0004 remains dormant until PC-0004 and final
exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-156 — Rebind the R-0003 source close after the T2 exclusion guard
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 final exact-ladder source close; DII-155; BL-131; R-0003-FORMATTING-CONTRACT-FAILURE; R-0003-FORMATTING-CONTRACT-CORRECTION; Auditor 03b3931 and c8e1e21; Inspector 817c5f9`

DII-156 supersedes DII-155 only as the R-0003 source-closing judgment. The restarted
ladder passed Stage 1 and T1, then T2 correctly rejected the newly added immutable-review
formatting exclusion because its exact boundary contract had not yet been updated.
BL-131 governs and closes that bounded contract failure.

Inspector `817c5f9` adds exactly `work/rounds/R-0003/reviews/` to the pinned exclusion
sequence, retains every prior path in order, and passes alongside the exact review-byte
hash contract. Auditor `c8e1e21` independently records the correction. No broader
formatting exception or evidence mutation is authorized.

The exact candidate containing DII-156 and a fresh repository-reference projection must
restart the complete ladder from Stage 1 and then receive a read-only review through
literal `claude-opus-5`, with no fallback. Any actionable finding reopens the governed
repair cycle; only a PASS authorizes source push and exact-SHA CI.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-156 as the closing decision. Its release
disposition remains `none-needed`. R-0004 remains dormant until PC-0004 and final
exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-157 — Rebind the R-0003 source close after the second Opus review
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 second Opus correction; DII-156; BL-132; R-0003-CLAUDE-OPUS-CLOSE-REVIEW-2; R-0003-CLAUDE-OPUS-CLOSE-REVIEW-2-CORRECTION; Inspector 5c62d2a; Architect ce75158; Auditor a8f9013 and 5e68493`

DII-157 supersedes DII-156 only as the R-0003 source-closing judgment. The exact
`claude-opus-5` review of candidate `68143f5` ended `VERDICT: FAIL` on one confirmed
blocker: active `law/adr/README.md` retained the pre-replacement twelve-all-active claim
and relied solely on draft review provenance. BL-132 governs and closes that finding.

Inspector `5c62d2a` first bound the missing index contract red. Architect `ce75158` then
corrected the index to the gapless ADR-001 through ADR-013 roster, twelve active records,
and ADR-005 superseded by ADR-013; active DII-153 now supplies successor authority while
REV-0003 remains historical input. No numbered ADR or immutable review byte changed.
Auditor `5e68493` independently verified the correction.

The second reviewer separately rejected objections about DII-153 identity, Auditor
formatting role purity, DII-150's historical draft citations, and immutable corrected
digests. Those rejected observations authorize no further mutation.

The exact candidate containing DII-157 and a fresh repository-reference projection must
restart the complete ladder from Stage 1 and then receive another read-only review
through literal `claude-opus-5`, with no fallback. Any actionable finding reopens the
governed repair cycle; only a PASS authorizes source push and exact-SHA CI.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-157 as the closing decision. Its release
disposition remains `none-needed`. R-0004 remains dormant until PC-0004 and final
exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-158 — Correct third-review governance provenance and disclose replay identity
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 third Opus correction; DII-157; BL-133–138; R-0003-CLAUDE-OPUS-CLOSE-REVIEW-3; Inspector 025bb58; Auditor 51f571a`

DII-158 supersedes DII-157 only as the R-0003 source-closing judgment and resolves all
six blockers from the third exact `claude-opus-5` review. It corrects DII-153's unresolved
seal-failure citation: the declared Auditor record is `R-0003-ADR-SEAL-FAILURE`, not
`R-0003-EXIT-LADDER-ADR-SEAL-FAILURE`. The active register container was absorbed from
the predecessor decision corpus and activated by DII-152; absent REV-0002 is not its
provenance. BL-133 closes on those append-only corrections and the truthful container
metadata.

ADR-005's sealed body necessarily retains the historical phrase “Accepted and active in
R-0003.” Its lifecycle frontmatter is controlling successor state and terminally marks it
superseded by ADR-013. The active ADR index now discloses that distinction without
mutating sealed bytes. BL-134 closes on that bounded interpretation.

Auditor `51f571a` makes the three correction pairs symmetric: the formatting failure,
formatting-contract failure, and second Opus review are terminally superseded by their
existing active correction records. The ratified Constitution crosswalk is active under
DII-150, and the review manifest identifies DII-149 only as a preserved draft while
active DII-153 carries the corrected ADR disposition. BL-135 through BL-137 close on
those role-pure changes.

BL-138 records a procedural replay defect without hiding or waiving it. Seven clean-branch
commits preserve correct role authors and byte-equivalent role-scoped changes but retained
the human cherry-pick committer `Antonio A. Russo`. Each is bound to its role-pure sibling
original:

- Engineer `1449e4d` replays `16a9f36`;
- Architect `611e14c` replays `bfccf19`;
- Engineer `938e2ab` replays `a26369e`;
- Auditor `3d44a48` replays `dde5ae2`;
- Inspector `726fe66` replays `9293ace`;
- Inspector `0ba2612` replays `93ef651`; and
- Engineer `fa17a5c` replays `7442708`.

The replay used already role-pure authored changes while rebuilding away an illegal ADR
history; path authority remained role-pure and the third reviewer independently verified
44/44 path-role batches. This disclosure does not waive future identity requirements:
every new commit remains required to use both DEVAI role author and committer identity.
The disclosed replay defect creates no precedent for human-committer source work.

The exact candidate containing DII-158, the independent correction audit, and refreshed
deterministic projections must restart the complete ladder from Stage 1 and receive a
fresh read-only review through literal `claude-opus-5`, with no fallback. Any actionable
finding reopens the governed repair cycle; only a PASS authorizes source push.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and the final post-audit source-closing decision
as the closing decision. Its release disposition remains `none-needed`. R-0004 remains
dormant until PC-0004 and final exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-159 — Bind the R-0003 source close after the third Opus correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 third Opus corrected source close; DII-158; BL-133–138; R-0003-CLAUDE-OPUS-CLOSE-REVIEW-3-CORRECTION; Auditor 223a4e8; Architect a911063`

DII-159 supersedes DII-158 only as the R-0003 source-closing judgment. Auditor
`223a4e8` independently confirms all six third-review blockers locally closed and makes
the third review/correction lifecycle symmetric. The active register, ADR index,
Constitution crosswalk, review manifest, and Auditor correction graph now agree with the
ratified ceremony and current record lifecycles.

The replay committer disclosure remains a recorded procedural defect, not an identity
waiver. Every post-disclosure commit uses DEVAI role identity for both author and
committer. The seven disclosed replay commits retain their exact role-pure authors,
role-scoped paths, and role-pure sibling-original provenance; no additional replay
anomaly is admitted.

The exact candidate containing DII-159 and refreshed deterministic projections must
restart the complete local ladder from Stage 1, including governance, T1 through T6,
unchanged 70/60/70/70 coverage floors, changesets, formatting, trace, and
repository-reference checks. It must then receive a fresh read-only review through
literal `claude-opus-5`, with no fallback. Any actionable finding reopens the governed
repair cycle; only a PASS authorizes source push and exact-SHA CI.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-159 as the closing decision. Its release
disposition remains `none-needed`. R-0004 remains dormant until PC-0004 and final
exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-160 — Rebind the R-0003 source close after trace regeneration
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 deterministic trace close; DII-159; BL-139; R-0003-TRACE-PROJECTION-FAILURE; Auditor c6c3703`

DII-160 supersedes DII-159 only as the R-0003 source-closing judgment. The exact ladder
at candidate `8273349` passed workflow lint and then correctly stopped because the new
third-review Inspector contract was absent from deterministic `law/trace.json`. BL-139
governs the projection-only correction.

Architect regeneration retains all 34 invariant sources and adds the new executable test
path without deleting or weakening any trace relationship. The exact candidate containing
DII-160 and both fresh deterministic projections must restart the complete ladder from
Stage 1 and then receive a read-only review through literal `claude-opus-5`, with no
fallback. Any actionable finding reopens the governed repair cycle; only a PASS
authorizes source push.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-160 as the closing decision. Its release
disposition remains `none-needed`. R-0004 remains dormant until PC-0004 and final
exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-161 — Rebind the R-0003 source close to portable replay evidence
`type: decision · status: active · authority: Architect · provenance: session-draft R-0003 fourth Opus correction; DII-160; BL-140; R-0003-OPUS-CLOSE-REVIEW-4-PORTABILITY-FAILURE; Auditor c8517aa; Inspector 5235fc1`

DII-161 supersedes DII-160 only as the R-0003 source-closing judgment. The fourth exact
`claude-opus-5` review of candidate `b21b1f1` confirmed every preceding correction but
found that the BL-138 contract dynamically resolved seven sibling-original commits that
exist only on an abandoned local branch. Exact-SHA CI would not receive those objects.
The same review found the BL-001 current-disposition row stale after the founding act.
BL-140 governs and closes both bounded portability corrections.

Auditor `c8517aa` preserves the observed replay and original author/committer identities
as durable repository evidence and corrects BL-001's current disposition. Inspector
`5235fc1` rebinds the pair mapping to this active register and that durable evidence,
uses live Git only for the seven replay commits that are candidate ancestors, and
requires a symmetric independent correction audit. The historical human-committer replay
defect remains disclosed. It does not waive the standing requirement that every new
commit use the applicable DEVAI role for both author and committer identity.

The exact candidate containing DII-161, the independent Auditor correction, and fresh
deterministic projections must pass the complete ladder from Stage 1 and a fresh
single-branch clone proof containing only the candidate branch. It must then receive a
read-only review through literal `claude-opus-5`, with no fallback. Any actionable
finding reopens the governed repair cycle; only a PASS authorizes source push.

After exact source merge and exact-main CI pass, PC-0004 uses DII-148 as the declaring
decision, DII-150 as the founding act, and DII-161 as the closing decision. Its release
disposition remains `none-needed`. R-0004 remains dormant until PC-0004 and final
exact-main CI establish the complete R-0003 close.

R-0003 establishes only **founding law ratified**. It releases, deploys, publishes,
promotes, re-earns, or declares ready nothing.

### DII-162 — Open R-0004 action identity and governed surface
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 declaration; OM-002; OM-003; R-0004-AUTHORIZATION; R-0004-PLAN digest dc50368c2080b38cccce3e799405aec797e0e11a1f8ba52a16af97e1fb272069; PC-0004; exact base b60b4c52bff1779da84f48edc63cbf34652ab18e; R-0004-ENTRY-MEASUREMENT; R-0004-SURFACE-DISPOSITION`

R-0004 opens only after the complete R-0003 two-PR ceremony. PC-0004 is present on
exact base `b60b4c52bff1779da84f48edc63cbf34652ab18e`, and final exact-main CI run
`30188270499` passed every required job. The frozen predecessor remains read-only and
clean. This satisfies the conditional authorization without importing any predecessor
standing.

The scoped records are BL-008, BL-009, BL-016, BL-025, BL-027, BL-028, BL-029,
BL-030, BL-031, BL-065, BL-080, and BL-084. The exact measured surface contains 146
public actions, all retained pending behavior-preserving implementation; 38 historical
per-sensor wrappers are explicit folds and backlog compaction is an explicit tombstone.
The surface-disposition record enumerates every route, all 59 live and five archived
sensor kinds, the 54-schema canon, the ten-package starting topology, the selected core
façade, and the exact bounded root-process contracts. Count movement without a governed
disposition and migration is forbidden.

The public action path is the never-reminted action identity. One Architect-owned action
registry must feed CLI routing and help, effects, sensors, generated documentation, and
tests. Generated views are byte-stable and locale-independent. Every live sensor gains a
successor-local design note; the nine diagnostic standings and fifty existing cell
bindings remain unchanged. Schema canon, the eleven-member fixed group, the acyclic
implementation-free core façade, bounded build/test porcelain, immutable workflow pins,
and fail-closed binary presence are governed by the R-0004 surface contract.

Inspector B1 must first prove each absent behavior red. Engineer changes may follow only
the B0/B2 authority and generated-source boundaries; acceptance cannot weaken counts,
effects, authority, coverage, or adversarial denials. R-0004 closes only after a fresh
Auditor reconciliation, later Architect closing decision, literal `claude-opus-5`
read-only PASS with no fallback, exact-SHA source CI, and the shared closure-only PR.

R-0004 may establish only that the governed surface and package topology are implemented
and tested. It authorizes no package publication, tag, GitHub Release, Pages deployment,
real-stynx mutation, readiness claim, evidence promotion, or R-0010 observation.

### DII-163 — Bind canonical action and sensor authority for R-0004
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 B2; DII-162; R-0004-SURFACE-DISPOSITION; GOVERNED-SURFACE-POLICY; ACTION-REGISTRY; SENSOR-REGISTRY`

The public action path is the permanent action identity. The canonical registry at
`law/policy/action-registry.json` contains all 185 governed records: 146 retained public
actions, 38 historical sensor-wrapper folds, and one tombstone. Every non-kept identity
is never-reminted and carries migration guidance. Effect, tier, lifecycle, authority,
and authority contract are attributes of this canonical identity; runtime tables and
generated views may not independently define them.

The 59 live sensor kinds each resolve an active successor-local design note. Their nine
diagnostic and fifty cell-bound standings remain unchanged. The canonical schema corpus
is now 55 files because `action-registry.schema.json` joins the prior 54-file baseline.
Engineer B3 must derive runtime consumers and the recursive schema command from these
Architect-owned sources; until that handoff is green, the action population guards
remain declared rather than implemented.

The exact eleven-package fixed group, implementation-free core façade, bounded root
porcelain argv, fail-closed binary checks, immutable workflow references, and UTF-8
byte-stable projections are bound by `law/policy/governed-surface.md`. None of these
bindings grants external release, deployment, publication, real-stynx mutation, R-0008
external action, R-0009 activation, or R-0010 observation.

### DII-164 — Complete the B3 action-consumer authority handoff
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 B3 authority repair; DII-163; R-0004-B3-AUTHORITY-REPAIR; cb88dfdc0ff71760d698707ce115bff37e25fd28`

The first B3 consumer build removed the action-effect identity mirror and exposed three
canonical omissions. This decision corrects the authority source rather than weakening
the consumer: `action-registry.schema.json` carries the required canon version marker;
Mermaid rendering declares its bounded process capabilities; and the subprocess policy
enumerates the observed Mermaid and doctor read shapes. The owner leaf description is
also bound to the Inspector-pinned exact-segment wording.

These corrections do not change the governed population or scalar effects. Counts remain
146 keep, 38 fold, and one tombstone; the public effect distribution remains 83 read, 39
harness-write, 23 local-write, and one remote-write. Engineer regeneration is required
before the generated views are current. No external release or downstream human gate is
altered.

### DII-165 — Bind the R-0004 governed-surface source close
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 source close; DII-162–164; R-0004-AS-BUILT; Auditor 41d73a28012d3be387f912eb25da5834906bd0c2; Inspector b7bf300eec5b4a14181e1cfbb5e5e489e55cb55e; BL-008–009; BL-016; BL-025; BL-027–031; BL-065; BL-080; BL-084`

DII-165 closes the local source implementation declared by DII-162. The canonical
action registry now contains 185 never-reminted identities: 146 kept public actions, 38
behavior-preserving folds, and one tombstone with migration guidance. Three generated
consumers reproduce that authority byte-for-byte; the production effect analyzer reports
185 catalog actions, 185 extracted actions, and zero findings or unresolved edges. The
55-schema recursive canon passes every named rule. All 59 live sensor kinds resolve local
design notes while retaining fifty cell-bound and nine diagnostic standings.

The selected `@devai-nyx/core` package is an acyclic export-only façade over the other
ten public packages, and Changesets binds exactly those eleven members. All eleven
packages pass content-only pack dry-runs; no archive or publication was produced. Root
build and test invoke only the registered non-recursive argv, required binaries fail
closed, both workflows use immutable action SHAs and prewarm every install job, and 164
repository references reproduce from explicit disposition semantics with UTF-8 byte
ordering.

Auditor `41d73a2` reconciles all twelve scoped backlog records and measures the unchanged
coverage floors at 71.07% statements, 61.63% branches, 77.44% functions, and 73.07%
lines. The exact ordinary floor and root test porcelain pass 125 files and 1,128 tests
with eight declared skips; T1 through T6, build, schema canon, action/effect parity,
workflow lint, generated-view checks, package dry-runs, and deterministic projections
are green.

This decision does not predeclare independent or remote evidence. The clean commit
containing DII-165 and fresh deterministic projections must pass the complete local
ladder and then a read-only close review through literal `claude-opus-5`, with no
fallback. Any actionable finding reopens the red-first role-pure repair cycle. Only PASS
permits the source PR. Every required check must pass at the exact source SHA; after
source merge, exact-main CI must pass before the production closure verb may append the
closure record in a closure-only PR.

The closure record uses DII-162 as the declaring decision and DII-165 as the closing
decision. Its release disposition is `none-needed`: R-0004 changes repository source and
package topology but authorizes no external release. The scoped backlog records close
only when that immutable closure record and final exact-main CI are observed.

R-0004 establishes only **governed surface and package topology implemented and tested**.
It publishes, tags, releases, deploys, promotes, re-earns, mutates real stynx, activates
R-0009, or opens R-0010 observation nothing.

### DII-166 — Rebind the R-0004 source close after the Inspector lint correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 corrected source close; DII-165; BL-141; R-0004-EXIT-LADDER-LINT-FAILURE; R-0004-EXIT-LADDER-LINT-CORRECTION; Auditor 0104a976c7def6a6e8c8085f5950cb25c75145eb and a9c1dabc0c119b093755e9c3c865cc232f06e62a; Inspector 4c08b4614ac3445d59ecef8fcd312a10ff0eef82`

DII-166 supersedes DII-165 only as the R-0004 source-closing judgment. The first
complete ladder on candidate `268e31f0169508a635bb58a06c6e1c6fe3075239`
passed evidence-mode refusal and every deterministic projection, then correctly stopped
at Stage 1 lint on one countable two-space regular-expression literal in the R-0004
workflow assertion. BL-141 governs and closes that bounded defect.

Inspector `4c08b46` rewrites only the exact two-space YAML boundary as ` {2}`. Focused
ESLint and all nine R-0004 contracts pass without changing assertion meaning. Auditor
`a9c1dab` records the symmetric correction. The ordinary floor then passed 1,126 tests
and eight declared skips; its only two reds were the symmetric BL-064 projection checks
for the two backlog-register locators moved by the Auditor record. This Architect batch
regenerates that projection from current tracked source.

The clean candidate containing DII-166 and the fresh repository-reference projection
must restart the complete local ladder from Stage 1 and then receive the mandated
read-only review through literal `claude-opus-5`, with no fallback. Any actionable
finding reopens the role-pure red-first cycle; only PASS permits source push. The
two-PR ceremony, `none-needed` release disposition, closing-record bindings, claims
ceiling, and all external human gates remain exactly as DII-165 states.

### DII-167 — Bind per-occurrence development context for forbidden SQL
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 governance repair; DII-166; BL-142; R-0004-EXIT-LADDER-GOVERNANCE-FAILURE; FORBID-DROP-PROD`

`FORBID-DROP-PROD` forbids destructive SQL outside development. The history scanner
must therefore evaluate an optional allowed development context on the same changed line
as each detected occurrence. The only allowed identities are the established
`devai_task_...` prefix and exact `devai_template` name, encoded in the canonical
registry's `allowed_change_line_patterns`. This field applies only to commit-change
evidence; it never suppresses commit-message evidence.

The exception is per occurrence. If one changed line is explicitly dev-scoped and any
other matching line in the same commit is unscoped or production-named, the latter must
still produce the forbidden-action finding. Invalid or empty context patterns fail
registry validation. No role, commit, path, file, action id, or complete forbidden rule
may be waived by this mechanism.

Inspector must first prove the safe development case red and preserve a mixed-evidence
production finding. Engineer may then implement the registry-derived per-line filter.
Strict governance and the complete local ladder must restart under a later Architect
source-closing decision before the literal `claude-opus-5` review. No release or
external human gate is altered.

### DII-168 — Rebind the R-0004 source close after the governance correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 corrected governance close; DII-166; DII-167; BL-142; R-0004-EXIT-LADDER-GOVERNANCE-FAILURE; R-0004-EXIT-LADDER-GOVERNANCE-CORRECTION; Auditor 39a546feecca6d1e3d3e5c6da098b63bdcc50130 and 9da5b541cda63024da9b3ac09da531ae4b7c1465; Inspector fbfb226b19ef79d26def93afda24563aa2d3c210; Engineer d875b73c7b7479a610634ab7657780246731fda2`

DII-168 supersedes DII-166 only as the R-0004 source-closing judgment. Candidate
`0621f12794d4c2cab500d6098fe90a4d22023ee7` passed the complete Stage 1 through
Stage 3 ladder and changeset classification, then correctly stopped at strict
governance on two development-only database descriptions. BL-142 governs and closes
that bounded false positive without weakening the underlying prohibition.

Inspector `fbfb226` proves the safe development occurrence red, preserves the unsafe
sibling and commit-message channels, and requires invalid context expressions to fail
closed. Engineer `d875b73` materializes DII-167's two exact development identities and
applies them independently to each changed-line occurrence. Auditor `9da5b54` records
the symmetric correction. The focused scanner suite, lint, type-check, ordinary floor,
and strict governance pass with all 16 canonical rules present, no waiver, and zero
findings. This Architect batch regenerates deterministic projections from current
tracked source.

The clean candidate containing DII-168 and fresh projections must restart the complete
local ladder and then receive the mandated read-only close review through literal
`claude-opus-5`, with no fallback. Any actionable finding reopens the role-pure red-first
cycle; only PASS permits source push. The two-PR ceremony, `none-needed` release
disposition, closing-record bindings, claims ceiling, and every external human gate
remain exactly as DII-165 established.

### DII-169 — Authorize role-pure formatter closure for R-0004
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 formatter correction; DII-168; BL-143; R-0004-EXIT-LADDER-FORMATTING-FAILURE; Auditor 87a8ff9f37c835c725c1dbbbe9d8c71f4ea8245d`

Candidate `907ccd94bad69c9a5c58709494ae24114412027c` passed every functional gate through
T6 and then correctly stopped on the standalone formatter check's exact 13-file set.
BL-143 authorizes a semantics-preserving, role-pure correction only.

Architect may format the four reported `law/` files. Engineer may format the four
reported hand-authored production/generator files, update the action-registry generator
only as necessary to emit formatter-clean bytes, and regenerate its three owned views.
Inspector may format the two reported test files without changing assertions. Each role
must commit separately. Generated views must continue to byte-match their producer;
schema, action, effect, trace, and repository-reference projections must remain exact.

Auditor must preserve the symmetric correction and the complete ladder must restart
under a later source-closing decision. This decision authorizes no behavior, threshold,
skip, authority, release, publication, deployment, external R-0008 action, R-0009
activation, R-0010 observation, or real-stynx change.

### DII-170 — Rebind the R-0004 source close after formatter correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 formatter-corrected close; DII-168; DII-169; BL-143; R-0004-EXIT-LADDER-FORMATTING-FAILURE; R-0004-EXIT-LADDER-FORMATTING-CORRECTION; Auditor 87a8ff9f37c835c725c1dbbbe9d8c71f4ea8245d and 8f7581cb75da27ff4e173eeba26e05dcbb6b9c67; Architect e1b952bf023cd779bc4c3c18b11d71c32c1e70eb; Engineer b8d6c9827ed9629970c32606729cb3a5fe6f061f; Inspector b3be1720be63edd5ca88b74ce5a7a140e546c435`

DII-170 supersedes DII-168 only as the R-0004 source-closing judgment. Candidate
`907ccd94bad69c9a5c58709494ae24114412027c` passed all functional gates through T6
and then correctly stopped on 13 formatter findings. BL-143 closes that bounded debt
through separate Architect, Engineer, and Inspector commits.

The action-registry producer now emits bytes under the repository's exact formatting
contract; all three generated views reproduce exactly. The complete repository
formatter check, focused scanner suite, lint, type-check, and action-registry projection
pass without assertion or behavior change. This Architect batch regenerates the
repository-reference projection after the formatter and Auditor locator movements.

The clean candidate containing DII-170 and fresh deterministic projections must restart
the complete local ladder and then receive the mandated read-only close review through
literal `claude-opus-5`, with no fallback. Any actionable finding reopens the role-pure
red-first cycle; only PASS permits source push. The two-PR ceremony, `none-needed`
release disposition, claims ceiling, and every external human gate remain unchanged.

### DII-171 — Bind the first R-0004 Opus review correction set
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 first-review correction; DII-170; BL-144–151; R-0004-OPUS-CLOSE-REVIEW-FAILURE; Auditor fdce9484bf0bb1d6c077c4a3fdfa4157b130b39b`

The first exact-candidate review through literal `claude-opus-5` returned FAIL on eight
actionable gaps. BL-144 through BL-151 are promoted in full; none is deferred.

The governed public surface adds the already-live `policy check schemas` path as one
supported, read-only, plumbing-tier `policy_firewall` action bound internally to
`check schemas`. This corrects the authoritative counts to 147 keep, 38 fold, and one
tombstone, 186 total; it does not invent behavior. The command must register through
the canonical definition path and the router must derive its dispatch normally.

The root R-0004 contract belongs to T2. Every tracked test must belong to at least one
T1–T6 include set, and trace must identify the R-0004 file as contract. Sensor notes must
render each cell as `<substrate>×<property>` in registry order, or state the diagnostic
standing without cells. The root porcelain authority is the production fixed argv:
build `pnpm -r build`; every test selection invokes `pnpm vitest run` with an explicit
tier config where one exists, and `all` invokes `pnpm vitest run`. No route may invoke a
root package script that re-enters itself.

Allowed destructive-SQL context must cover the detected SQL occurrence and its target,
not merely appear elsewhere on the same line. Exact dev-task and template targets remain
allowed; production targets, additional unsafe targets, malformed contexts, and all
commit-message evidence remain findings. Every declared byte-identical policy mirror
must match law. Every remote workflow `uses:` must carry a 40-hex immutable SHA and a
readable version comment; repository-local reusable workflow paths remain allowed.

Inspector must prove these boundaries red before Engineer implementation. Architect may
correct the action registry, surface declaration, trace, and 50 sensor notes. Engineer
may correct registry-backed CLI dispatch, fixed test argv, policy materializations,
SQL occurrence matching, workflow validation, and generated views. Auditor must
normalize superseded record status and preserve symmetric correction evidence.

The complete ladder and a fresh literal `claude-opus-5` review remain mandatory before
source push. No release, publication, deployment, predecessor write, real-stynx write,
external R-0008 action, R-0009 activation, or R-0010 observation is authorized.

### DII-172 — Rebind the R-0004 source close after first Opus correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 corrected close; DII-170; DII-171; BL-144–151; R-0004-OPUS-CLOSE-REVIEW-FAILURE; R-0004-OPUS-CLOSE-REVIEW-CORRECTION; Auditor ab045184015f8cf6c796606e285045b52855662b`

DII-172 supersedes DII-170 only as the R-0004 source-closing judgment. The first Opus
review's eight findings are implemented through the role-pure red-first sequence bound
by DII-171 and reconciled by the Auditor. The corrected surface is 147 keep, 38 fold,
and one tombstone, 186 total, including the previously live but unregistered
`policy check schemas` action.

The correction also binds the root contract to T2 and trace, covers every tracked test
by the T1–T6 union, restores every declared policy mirror, repairs exact sensor cell
rendering, fixes non-recursive root test argv, scopes destructive-SQL allowance to the
matched operation and target, normalizes superseded failure status, and validates every
remote workflow action pin while retaining local reusable-workflow paths.

The clean candidate containing DII-172, the refreshed source-close handoff, and fresh
deterministic projections must restart the complete local ladder and then receive a new
read-only close review through literal `claude-opus-5`, with no fallback. Any actionable
finding reopens the role-pure red-first cycle; only PASS permits source push. The shared
two-PR ceremony, `none-needed` release disposition, claims ceiling, and every external
human gate remain unchanged.

### DII-173 — Bind the corrected-candidate T2 collateral repairs
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 corrected-candidate repair; DII-172; BL-152–153; R-0004-CORRECTED-CANDIDATE-T2-FAILURE; Auditor 6447d9c9202358905df04afc130d06c94fbf52e1`

The corrected candidate's first complete-ladder restart exposed two collateral contract
gaps and stopped at T2. BL-152 and BL-153 are promoted in full; neither is deferred.

The canonical trace invariant-binding suite enum must admit `contract`, matching the
existing test index and the actual T2 runner. No path, lifecycle, target-type, invariant,
or evidence-strength rule changes. The Inspector's authority test composition may admit
the exact fixed read-only production shapes `pnpm vitest run` and
`pnpm vitest run --config tests/config/<tier>.ts`; it must reject additional flags,
arbitrary configs, scripts, shell text, and any other package-manager command.

Architect owns the schema correction. Inspector owns the test-only host correction and
its deny-boundary assertions. Auditor must record symmetric green correction evidence.
The complete ladder and fresh literal `claude-opus-5` review remain mandatory before
source push. No production argv, threshold, skip, release, publication, deployment,
predecessor write, real-stynx write, or external human gate changes.

### DII-174 — Rebind the R-0004 source close after T2 collateral correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 T2-corrected close; DII-172; DII-173; BL-152–153; R-0004-CORRECTED-CANDIDATE-T2-FAILURE; R-0004-CORRECTED-CANDIDATE-T2-CORRECTION; Auditor 6447d9c9202358905df04afc130d06c94fbf52e1 and 1ba28c7ccf760deb419c1684b742f89b8bf16ff0; Architect 691821aa362330ad6e738ebc06ff7385d2ce2ab2; Inspector 1c2793568045c1c5178ccae331f30ecad5159eb6`

DII-174 supersedes DII-172 only as the R-0004 source-closing judgment. BL-152 and
BL-153 are implemented with symmetric failure/correction evidence. The live trace now
validates contract evidence at both invariant-binding and test-index levels. The
test-only authority host admits only the governed fixed Vitest shapes, with seven direct
allow/deny assertions and passing hermetic skills baselines.

The clean candidate containing DII-174, the refreshed source-close handoff, and fresh
deterministic projections must restart the complete local ladder from Stage 1 and then
receive the mandated read-only close review through literal `claude-opus-5`, with no
fallback. Any actionable finding reopens the role-pure red-first cycle; only PASS
permits source push. The two-PR ceremony, `none-needed` release disposition, claims
ceiling, and every external human gate remain unchanged.

### DII-175 — Bind active ADR coverage for CI checker changes
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 CI ADR correction; DII-171; DII-174; BL-151; BL-154; ADR-014; R-0004-CORRECTED-CANDIDATE-GOVERNANCE-FAILURE; Auditor 9e3480c0e2d70d045a7a7cfa0b4941b36fab1c26`

ADR-014 is accepted as the gapless active record for the workflow checker and its
forbidden-action association. The live ADR roster becomes ADR-001 through ADR-014,
thirteen active records, with only ADR-005 terminally superseded by ADR-013.

Inspector must first prove that exact active-ADR `affected_rules` coverage accepts the
governed checker path while absent, malformed, superseded, and unrelated ADR records do
not. Engineer may then implement frontmatter-derived exact-path association in the
forbidden-action scanner. No exact-commit waiver, generic ADR-exists bypass, author-only
bypass, threshold change, or skip is permitted.

After symmetric Auditor correction and Architect source-close rebind, the complete
ladder and fresh literal `claude-opus-5` review remain mandatory before source push. No
release, publication, deployment, predecessor write, real-stynx write, or external
human gate changes.

### DII-176 — Correct the ADR-014 lifecycle chain
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 ADR-014 lifecycle correction; DII-175; ADR validator reading after fee91e91714536c20727bd3d19960af3c1e912b1`

DII-176 supersedes DII-175 only as the ADR roster and lifecycle judgment. The ADR schema
requires every successor ADR to name at least one superseded source. ADR-014 therefore
supersedes ADR-013, whose sealed body remains unchanged while its lifecycle frontmatter
transitions terminally. ADR-014 preserves ADR-013's complete CI-economy doctrine and adds
the checker-path association; no active rule is lost.

The roster is gapless ADR-001 through ADR-014 with twelve active records. ADR-005 is
superseded by ADR-013, and ADR-013 is superseded by ADR-014. All remaining DII-175
implementation, red-first, review, ceremony, claims, and external-gate boundaries remain
unchanged.

### DII-177 — Complete ADR-014's machine-readable CI path set
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 ADR affected-rules correction; DII-176; strict governance reading after Engineer 0e802054a8f1c5dc6ab663815c4f4447fa3a880c`

ADR-014's body preserved both live workflows and the CI-stage runner, but its initial
frontmatter `affected_rules` omitted those three exact paths. DII-177 corrects that
machine-readable projection to include `.github/workflows/ci.yml`,
`.github/workflows/round-gates.yml`, and `scripts/run-ci-stages.mjs` alongside the
workflow checker and scanner paths. The active doctrine and all DII-176 boundaries are
unchanged.

### DII-178 — Restore sealed ADR history through ADR-015
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 ADR seal correction; DII-176; DII-177; BL-155; ADR-015; R-0004-ADR-SEAL-GOVERNANCE-FAILURE; Auditor e7d4e48780a657bf02e166f8f90208c248e342f6; Inspector 2c2d8ece839c7df72d233971dfb105e615674c33`

DII-178 supersedes DII-177 as the active CI-path projection judgment. ADR-014 is restored
to its sealed bytes except for the one permitted terminal lifecycle transition naming
ADR-015. ADR-015 is the gapless active replacement and carries the complete seven-path
CI governance set plus the preserved CI-economy and workflow-pin doctrine.

Inspector's red copy-history contract proves that Git copy ancestry must not be treated
as the new record's sealed history. Engineer may correct history enumeration to stop at
a copy boundary while continuing through true renames; the existing rename-mutation
guard must remain green. The roster becomes ADR-001 through ADR-015, twelve active, with
the terminal chain ADR-005 to ADR-013 to ADR-014 to ADR-015.

After symmetric Auditor correction and source-close rebind, the full ladder and fresh
literal `claude-opus-5` review remain mandatory. No waiver, history rewrite, threshold,
skip, release, publication, deployment, predecessor write, real-stynx write, or external
human gate changes.

### DII-179 — Preserve ADR-014's actual first seal
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 first-seal correction; DII-178; strict decision-integrity reading after cb2d58e9c40d807aa13d88c2ba6e3afe7ccf8f8e`

DII-179 corrects DII-178's assumed seal point. Governance record-meta sealed ADR-014 at
its first commit even though the narrower ADR schema rejected its empty `supersedes`
array. ADR-014 is therefore restored to those first-seal bytes plus the one terminal
transition to ADR-015. ADR-013 returns to its unchanged active seal; it is not part of
ADR-014's lifecycle chain.

The ADR schema now requires a non-empty `supersedes` array for active records while
allowing a terminal sealed record to preserve its original empty array. Active ADR-015
absorbs ADR-014 and carries the corrected complete rule. The gapless roster is ADR-001
through ADR-015 with thirteen active records, ADR-005 superseded by active ADR-013, and
ADR-014 superseded by active ADR-015. All remaining DII-178 boundaries remain unchanged.

### DII-180 — Rebind the R-0004 source close after CI governance correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 governance-corrected close; DII-174; DII-175–179; BL-154–155; R-0004-CI-ADR-GOVERNANCE-CORRECTION; Auditor ae8f508b40d2973ac53f27bbd1c2cfe0c0966373`

DII-180 supersedes DII-174 only as the R-0004 source-closing judgment. BL-154 and
BL-155 are implemented with exact active-ADR path association, copy-boundary history,
restored-seal endpoint validation, and the gapless active ADR-015 replacement. Strict
forbidden-action, decision-integrity, citation, trace, and docs-drift governance pass
with zero blocking findings and no waiver.

The clean candidate containing DII-180, the refreshed source-close handoff, and fresh
deterministic projections must restart the complete local ladder from Stage 1 and then
receive the mandated read-only close review through literal `claude-opus-5`, with no
fallback. Any actionable finding reopens the role-pure red-first cycle; only PASS
permits source push. The two-PR ceremony, `none-needed` release disposition, claims
ceiling, and every external human gate remain unchanged.

### DII-181 — Rebind after Inspector strictness correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 strictness-corrected close; DII-180; Inspector 4a56da2187d8f9281c39924898a99648c57907b6`

DII-181 supersedes DII-180 only as the R-0004 source-closing judgment. The restarted
Stage 1 found one optional-path TypeScript error in the new Inspector copy-history
assertion. Inspector corrected only that nullability guard; exact typecheck and all 38
focused governance-ledger tests pass. No production, law, assertion meaning, threshold,
skip, or gate changed. The complete ladder and literal `claude-opus-5` review restart
requirements remain unchanged.

### DII-182 — Admit the exact local ladder
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 exact-ladder close; DII-181; R-0004-EXACT-LADDER-PASS; Auditor a73993fea5cb20b5278c47c6a95139c60909b7d9`

DII-182 supersedes DII-181 only as the R-0004 source-closing judgment. The complete
local ladder passed on exact snapshot
`6116635a2e565c974e28b7dec5a4f664a97b6cb7`: all six tiers, strict governance,
unchanged coverage floors, root build/test porcelain, deterministic projections,
formatting, and all eleven public-package dry-runs are green. The Auditor's exact
readings and claims ceiling are admitted without expanding the round.

The next clean commit containing DII-182, its refreshed source-close handoff, and the
fresh repository-reference projection is the Opus review candidate. It must receive
the mandated read-only close review through literal `claude-opus-5`, with no fallback.
Actionable findings restart the governed red-first cycle; only PASS permits source push.
No external gate, publication, release, deployment, or real-stynx boundary changes.

### DII-183 — Rebind after the second Opus repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 second-Opus repair; DII-182; BL-156–162; R-0004-OPUS-CLOSE-REVIEW-2-CORRECTION; Inspector 9ee3c0e and a544733; Architect c2d418b; Engineer c530468; Auditor d374fa0`

DII-183 supersedes DII-182 only as the R-0004 source-closing judgment. The second exact
candidate Opus review's seven blocking findings are governed and locally repaired:
production and test-host suite argv now agree on exact fixed forms; the active as-built
uses live counts; fixture deltas derive from the R-0003 base and execute real tests;
canonical build help names fixed recursive argv; leaf help observes the real session
store; and strict governance scans the full round range.

The next clean commit containing DII-183, the refreshed source-close handoff, and fresh
deterministic projections must restart the complete local ladder and receive a new
read-only review through literal `claude-opus-5`, with no fallback. Only PASS permits
source push. No external release, publication, deployment, real-stynx write, R-0008,
R-0009, or R-0010 human gate changes.

### DII-184 — Bind governance to the exact round range
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 exact-range correction; DII-183; BL-162; R-0004-GOVERNANCE-RANGE-CORRECTION; Inspector 3581591; Engineer ab04008; Auditor 212850a`

DII-184 supersedes DII-183 only as the R-0004 source-closing judgment. A fixed trailing
commit count is not the round boundary: a sufficiently broad count imports unrelated
pre-round history, while a smaller count can omit in-round workflow changes. Strict
governance now resolves the exact closed-R-0003 commit and scans its exclusive range
through HEAD, failing closed if the base cannot be verified.

Focused range tests, typecheck, and the full strict-governance composition pass with
zero findings. The next clean commit containing DII-184 and the refreshed handoff must
restart the complete ladder and literal `claude-opus-5` review. No waiver, external gate,
publication, release, deployment, or real-stynx boundary changes.

### DII-185 — Admit the repaired exact ladder
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 repaired exact-ladder close; DII-184; R-0004-EXACT-LADDER-PASS; Auditor 5cf3af6`

DII-185 supersedes DII-184 only as the R-0004 source-closing judgment. The complete
ladder passed on exact repaired snapshot
`31dfbaf3d8b51e2089aef6aa01ea45b46d9b266c`, including the exact round-range governance
scan, all five live suite routes, 71 T1 files / 837 tests, 38 T2 files / 236 passing plus
one declared skip, root 127 files / 1,161 passing plus eight declared skips, unchanged
coverage floors, and all eleven public-package dry-runs.

The next clean commit containing DII-185 and its refreshed handoff is the review
candidate. It must pass the complete ladder and a new read-only review through literal
`claude-opus-5`, with no fallback, before source push. The claims ceiling and every
external human gate remain unchanged.

### DII-186 — Rebind after the third Opus contract correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 third-Opus correction; DII-185; BL-163–165; R-0004-OPUS-CLOSE-REVIEW-3-FAILURE; Inspector b0af62c; Engineer ca6dff9`

DII-186 supersedes DII-185 only as the R-0004 source-closing judgment. The third exact
candidate Opus review independently reproduced the complete green ladder and all prior
repairs, then found three remaining active-text inconsistencies. The governed surface
contract now derives the exact fixed `pnpm -r build` and `pnpm vitest run` argv and the
55-schema live canon; the direct `sense build` command definition now equals the
canonical registry's fixed-recursive description. Inspector guards bind both contract
claims to canonical sources and bind direct public command descriptions to the registry.

The next clean commit containing DII-186 and its refreshed handoff must restart the
complete local ladder, package dry-runs, and a fresh read-only close review through
literal `claude-opus-5`, with no fallback. Only PASS permits source push. No external
release, publication, deployment, real-stynx write, R-0008, R-0009, or R-0010 human gate
changes.

### DII-187 — Admit the final repaired exact ladder
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 final repaired exact-ladder close; DII-186; BL-163–166; R-0004-EXACT-LADDER-PASS; Auditor ab888d0`

DII-187 supersedes DII-186 only as the R-0004 source-closing judgment. The complete
ladder passed on exact repaired snapshot
`7be9d31dcbfb07fffc2f8547af89c5b04e8b66f9`, including the exact round-range governance
scan, standalone formatting, 71 T1 files / 837 tests, 38 T2 files / 238 passing plus one
declared skip, root 127 files / 1,163 passing plus eight declared skips, unchanged
coverage floors, and all eleven public-package dry-runs.

The next clean commit containing DII-187 and its refreshed handoff is the final review
candidate. It must pass the complete ladder and a fresh read-only review through literal
`claude-opus-5`, with no fallback, before source push. The claims ceiling and every
external human gate remain unchanged.

### DII-188 — Admit the fourth-review repaired exact ladder
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 fourth-Opus repaired close; DII-187; BL-167–170; R-0004-OPUS-CLOSE-REVIEW-4-CORRECTION; R-0004-EXACT-LADDER-PASS; Auditor cd59beb`

DII-188 supersedes DII-187 only as the R-0004 source-closing judgment. The complete
147-binding command-description guard now covers both quote styles and the owner factory;
all five observed source drifts equal canonical registry text. Audit lifecycle links are
machine-readable and paired, the active contract binds one all-suite and four exact
configured test routes, and the strict Inspector AST traversal typechecks.

The complete ladder passed on exact repaired snapshot
`fd8c8b68e05f2fc7a305b6403373f2820d9b64bc`, including standalone formatting, exact
round-range governance, unchanged coverage floors, root 127 files / 1,163 passing plus
eight declared skips, and all eleven public-package dry-runs. The next clean commit
containing DII-188 and its refreshed handoff must pass the complete ladder and a fresh
read-only review through literal `claude-opus-5`, with no fallback, before source push.
The claims ceiling and every external human gate remain unchanged.

### DII-189 — Admit the fifth-review repaired exact ladder
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 fifth-Opus repaired close; DII-188; BL-171–173; R-0004-OPUS-CLOSE-REVIEW-5-CORRECTION; R-0004-EXACT-LADDER-PASS; Auditor dd0130c`

DII-189 supersedes DII-188 only as the R-0004 source-closing judgment. The Inspector
known-red record now distinguishes all fourteen current green clusters from the
historical `dfa5659` parity failure, the active surface contract cites this decision and
the third-review correction, and the fifth-review and governance-range lifecycle
records are symmetric and non-self-referential.

The complete ladder passed on exact repaired snapshot
`12189704dd49a0ef4bd989b4ad1070dc4de413e0`, including standalone formatting, exact
round-range governance, unchanged coverage floors, root 127 files / 1,163 passing plus
eight declared skips, and all eleven public-package dry-runs. The next clean commit
containing DII-189 and its refreshed handoff must pass the complete ladder and a fresh
read-only review through literal `claude-opus-5`, with no fallback, before source push.
The claims ceiling and every external human gate remain unchanged.

### DII-190 — Rebind atomic terminal provenance
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 sixth-Opus repaired close; DII-189; BL-174; R-0004-OPUS-CLOSE-REVIEW-6-CORRECTION; Architect 7ca26c4; Auditor c7dd9fb`

DII-190 supersedes DII-189 only as the R-0004 source-closing judgment. The active
surface contract cites this decision in the same Architect commit, the source-close
handoff names DII-190 as the sole latest judgment, and BL-172 through BL-174 require
every future closing DII to preserve that atomic agreement.

No engineering behavior, assertion, threshold, skip, evidence source, or human gate
changed. This exact clean candidate must restart the complete ladder, pass all eleven
public-package dry-runs, and receive a fresh read-only review through literal
`claude-opus-5`, with no fallback, before source push. The claims ceiling and every
external human gate remain unchanged.

### DII-191 — Admit the exact-CI ANSI repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 exact-CI repair; DII-190; BL-180; R-0004-SOURCE-CI-ANSI-CORRECTION; Auditor d63b0a5`

DII-191 supersedes DII-190 only as the R-0004 source-closing judgment. Exact-head CI
run 30206695586 exposed ANSI SGR sequences in Vitest output that caused the sensor
metric parser to record zero passing tests despite a successful subprocess. The
red-first BL-180 repair strips ANSI only from the metric-extraction view and preserves
the raw output as evidence.

The complete ladder passed on exact repaired snapshot
`7b63f6548f19147c1a6226768b587634d45a1915`: T1 passed 71 files / 838 tests, the root
porcelain passed 127 files / 1,164 tests plus eight declared skips, merged T1+T3
coverage passed at 71.23% statements, 61.79% branches, 77.62% functions, and 73.25%
lines, and all eleven public-package dry-runs passed. The next clean commit containing
DII-191, the refreshed contract, and the refreshed handoff must restart the complete
ladder and receive a fresh read-only review through literal `claude-opus-5`, with no
fallback, before source push. The claims ceiling and every external human gate remain
unchanged.

### DII-192 — Admit the complete ANSI fingerprint repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 eighth-Opus repair; DII-191; BL-180; R-0004-OPUS-CLOSE-REVIEW-8-CORRECTION; Auditor 3d33985`

DII-192 supersedes DII-191 only as the R-0004 source-closing judgment. The repaired
fingerprint normalization removes ANSI terminal presentation before masking reporter
time and duration, while the sensor retains raw subprocess output byte-for-byte. The
R20 baseline was not recaptured. The surface disposition now binds the 55-schema exit
canon, and the command-description guard is stated exactly as 144 literal AST
definitions plus three exact init-factory invocations.

The complete ladder passed on exact repaired snapshot
`dc64176ab75675a65e3c561576a2f5bb756b408f`: T1 passed 71 files / 838 tests, T2 passed
38 files / 239 tests plus one declared skip, the root porcelain passed 127 files / 1,165
tests plus eight declared skips, merged T1+T3 coverage passed at 71.23% statements,
61.79% branches, 77.62% functions, and 73.25% lines, and all eleven public-package
dry-runs passed. The next clean commit containing DII-192, the refreshed contract, and
the refreshed handoff must restart the complete ladder and receive a fresh read-only
review through literal `claude-opus-5`, with no fallback, before source push. The claims
ceiling and every external human gate remain unchanged.

### DII-193 — Admit the exact fixture-progress repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 second exact-CI repair; DII-192; BL-180; R-0004-SOURCE-CI-REPORTER-PROGRESS-CORRECTION; Auditor 29e5c41`

DII-193 supersedes DII-192 only as the R-0004 source-closing judgment. Exact-head CI
run 30209278971 selected a Vitest per-file progress line with a nondeterministic duration
for the fixed one-test R20 fixture. The red-first repair removes only that exact
presentation line inside deterministic fingerprint normalization. Raw sensor output,
subprocess status, passed/failed metrics, summary text, and the unchanged baseline
remain authoritative.

The complete ladder passed on exact repaired snapshot
`54e79a19a22e64ec8a6c6ea698087081872d70fd`: T1 passed 71 files / 838 tests, T2 passed
38 files / 240 tests plus one declared skip, the root porcelain passed 127 files / 1,166
tests plus eight declared skips, merged T1+T3 coverage passed at 71.23% statements,
61.79% branches, 77.62% functions, and 73.25% lines, and all eleven public-package
dry-runs passed. The next clean commit containing DII-193, the refreshed contract, and
the refreshed handoff must restart the complete ladder and receive a fresh read-only
review through literal `claude-opus-5`, with no fallback, before source push. The claims
ceiling and every external human gate remain unchanged.

### DII-194 — Admit the governed SHA-reference repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 tenth-Opus repair; DII-193; BL-181; R-0004-SOURCE-DECISION-SHA-CORRECTION; Auditor 832da68`

DII-194 supersedes DII-193 only as the R-0004 source-closing judgment. The tenth exact
candidate Opus review found two fabricated forty-hex commit expansions and the absence
of a repository-wide recurrence guard. The red-first repair corrects both active
references and requires every governed forty-hex identity to resolve locally to its
Git object or to an exact path-scoped historical exception. The batched
check is part of strict governance and treats no exception value as a repository-wide
waiver.

The complete ladder passed on exact repaired snapshot
`fd99ab7deaa1702467b6d8f9c4d6a98f4372b87e`: T1 passed 71 files / 838 tests, T2 passed
38 files / 241 tests plus one declared skip, the root porcelain passed 127 files / 1,167
tests plus eight declared skips, merged T1+T3 coverage passed at 71.23% statements,
61.79% branches, 77.62% functions, and 73.25% lines, the governed SHA-reference check
scanned 252 identities, resolved 244 local objects, and classified 8 historical
specimens, and all eleven
public-package dry-runs passed. The next clean commit containing DII-194, the refreshed
contract, and the refreshed handoff must restart the complete ladder and receive a fresh
read-only review through literal `claude-opus-5`, with no fallback, before source push.
The claims ceiling and every external human gate remain unchanged.

### DII-195 — Admit the exact SHA-semantics repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 eleventh-Opus repair; DII-194; BL-182; R-0004-OPUS-CLOSE-REVIEW-11-CORRECTION; Auditor 19b957d`

DII-195 supersedes DII-194 only as the R-0004 source-closing judgment. The eleventh
exact-candidate Opus review found that DII-194 attached a later SHA-reference count to
the earlier `fd99ab7` snapshot, active law claimed an unimplemented local object-kind
comparison, and the Inspector contract did not exercise rejection paths. The repaired
records bind each count to its producing snapshot and state the implemented local-Git-
object or exact-path-scoped-exception semantics. Hermetic Inspector cases prove that an
unresolved identity, an exception used outside its allowed paths, a stale allowed path,
and a stale exception all fail closed. Production behavior and exception scope did not
change.

The complete ladder passed on exact repaired snapshot
`2a864440c9178cc59834c961c132d3b5616d4bfa`: T1 passed 71 files / 838 tests, T2 passed
38 files / 243 tests plus one declared skip, the root porcelain passed 127 files / 1,169
tests plus eight declared skips, merged T1+T3 coverage passed at 71.23% statements,
61.79% branches, 77.62% functions, and 73.25% lines, the governed SHA-reference check
scanned 254 identities, resolved 246 local objects, and classified 8 historical
specimens, and all eleven public-package dry-runs passed. The next clean commit
containing DII-195, the refreshed contract, and the refreshed handoff must restart the
complete ladder and receive a fresh read-only review through literal `claude-opus-5`,
with no fallback, before source push. The claims ceiling and every external human gate
remain unchanged.

### DII-196 — Admit the audit-lifecycle repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 twelfth-Opus repair; DII-195; BL-183; R-0004-OPUS-CLOSE-REVIEW-12-CORRECTION; Auditor 6bde01c`

DII-196 supersedes DII-195 only as the R-0004 source-closing judgment. The twelfth
exact-candidate Opus review independently verified the full implementation and found one
blocking metadata back-edge: the eleventh-review failure superseded the source-decision
SHA correction, but that correction remained active without the reverse link. The
Auditor repaired the sole asymmetric in-scope edge, and the Inspector binds it exactly.
The classified-count assertion now matches the complete phrase, and the active contract
names the SHA guard's actual decision-register and Auditor-record scan scope.

The complete ladder passed on exact repaired snapshot
`b10baed06e21ed39f07b625a5993355a57526d63`: T1 passed 71 files / 838 tests, T2 passed
38 files / 244 tests plus one declared skip, the root porcelain passed 127 files / 1,170
tests plus eight declared skips, merged T1+T3 coverage passed at 71.23% statements,
61.79% branches, 77.62% functions, and 73.25% lines, the governed SHA-reference check
scanned 256 identities, resolved 248 local objects, and classified 8 historical
specimens, and all eleven public-package dry-runs passed. The next clean commit
containing DII-196, the refreshed contract, and the refreshed handoff must restart the
complete ladder and receive a fresh read-only review through literal `claude-opus-5`,
with no fallback, before source push. The claims ceiling and every external human gate
remain unchanged.

### DII-197 — Apply the Owner's R-0004 final-review exception without weakening proof
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 Owner-exception source close; OM-008; DII-162; DII-196; R-0004-OPUS-CLOSE-REVIEW-12-CORRECTION@2a864440c9178cc59834c961c132d3b5616d4bfa; R-0004-LOCAL-EXIT-LADDER@bb34ce0d0dc29cbb5b16b179852b3ab81d35a90b`

DII-197 supersedes DII-196 only as the R-0004 source-closing judgment. OM-008
explicitly replaces the additional post-repair Opus review with reliance on the
preserved twelfth exact-candidate assessment. That review returned FAIL on one
blocking audit-lifecycle back-edge. BL-183 governed and repaired that finding red
first, the focused Inspector guard passed, and the later exact candidate
`bb34ce0d0dc29cbb5b16b179852b3ab81d35a90b` passed the complete local ladder.
No PASS is inferred or fabricated.

The exception changes no production or evidence threshold. The source candidate that
contains OM-008 and DII-197 must pass the complete local source ladder and every
required GitHub check at its exact SHA. Its exact source merge must then pass
exact-main checks before the production closure verb may append PC-0005. Every
closure-branch and final-main check must also pass.

PC-0005 uses DII-162 as the R-0004 declaration and DII-197 as the closing decision.
Its release disposition remains `none-preratification`. Nothing in this decision
authorizes package publication, tags, GitHub Releases, Pages deployment, external
release or deployment, real-stynx mutation, R-0008 external action, R-0009 activation,
or R-0010 observation. The predecessor remains read-only.

### DII-198 — Classify clean-checkout-only SHA objects after exact source CI
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 clean-checkout SHA repair; OM-008; DII-197; GitHub Actions run 30215723543@70b6092869b19631b845e6db79bfd0632871ab68; BL-184; R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION; Inspector 6b880b2; Architect 808eba0; Auditor d03d48d`

DII-198 supersedes DII-197 only as the R-0004 source-closing judgment. Exact-head CI
run `30215723543` proved that two truthful historical identities resolved in the local
development object database but not in GitHub's clean checkout. The repair classifies
the transient pull-request merge and rejected amended R-0003 candidate only at their
three existing Auditor paths. A hermetic Inspector fixture proves the classifications
against an empty Git object database. Historical evidence is unchanged, and an
identity used at any other path still fails closed.

The environment-dependent local/classified split does not change the governed identity
population or semantics. The exact candidate containing DII-198 and the refreshed
contract and handoff must pass the complete local ladder and every required GitHub check
before merge. Its exact source merge must pass exact-main CI before the production
closure verb may append PC-0005; the closure-only PR and final main must also pass their
exact-SHA checks.

OM-008 continues to replace only the additional post-repair Opus review for R-0004; no
PASS is inferred. PC-0005 uses DII-162 as the declaration and DII-198 as the closing
decision with `release_disposition: none-preratification`. No publication, tag, GitHub
Release, Pages deployment, external release or deployment, real-stynx mutation,
R-0008 external action, R-0009 activation, or R-0010 observation is authorized.

### DII-199 — Admit the strict fixture-narrowing repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 clean-checkout fixture correction; OM-008; DII-198; BL-184; R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION; Inspector 6c436be; Auditor 69ea8c8`

DII-199 supersedes DII-198 only as the R-0004 source-closing judgment. The first
post-BL-184 complete-ladder restart passed through lint but failed strict typecheck on
three possibly-undefined array accesses in the new Inspector fixture. Inspector
`6c436be` narrows the two exact fixture entries before interpolation. Typecheck and the
focused BL-184 contract pass without changing the exception set, assertion meaning, or
production behavior.

The exact candidate containing DII-199 and the atomically refreshed contract and
handoff must pass the complete local ladder and every required exact-head GitHub check
before source merge. Its exact source merge must pass exact-main CI before PC-0005 may
be emitted through the production closure verb; closure-head and final-main checks
remain mandatory.

OM-008 continues to replace only the additional post-repair Opus review for R-0004; no
PASS is inferred. PC-0005 uses DII-162 as the declaration and DII-199 as the closing
decision with `release_disposition: none-preratification`. Every external release,
publication, deployment, real-stynx, R-0008, R-0009, and R-0010 gate remains closed.

### DII-200 — Admit the lint-clean fixture-naming repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 clean-checkout fixture lint correction; OM-008; DII-199; BL-184; R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION; Inspector 78320af; Auditor 2a8682d`

DII-200 supersedes DII-199 only as the R-0004 source-closing judgment. The next
complete-ladder restart rejected the fixture's non-null assertions under the unchanged
lint policy. Inspector `78320af` names both exact objects before constructing the
expectation array, so no indexing assertion is required. Lint, typecheck, and the
focused clean-checkout contract pass with identical expected values and no production
change.

The exact candidate containing DII-200 and the atomically refreshed contract and
handoff must pass the complete local ladder and every required exact-head GitHub check
before source merge. Exact-main source CI, production PC-0005 emission, closure-head CI,
closure merge, and final-main CI remain serial and mandatory.

OM-008 continues to replace only the additional post-repair Opus review for R-0004; no
PASS is inferred. PC-0005 uses DII-162 as the declaration and DII-200 as the closing
decision with `release_disposition: none-preratification`. Every external release,
publication, deployment, real-stynx, R-0008, R-0009, and R-0010 gate remains closed.

### DII-201 — Admit the complete clean-checkout SHA path set
`type: decision · status: active · authority: Architect · provenance: session-draft R-0004 clean-checkout SHA path completion; OM-008; DII-200; GitHub Actions run 30216260434@2c4f15bed4897de801295c7eb93e4f5c7aebcd72; BL-184; R-0004-SOURCE-CI-CLEAN-CHECKOUT-SHA-CORRECTION; Inspector cbd9eb3; Architect f46cf69; Auditor 53a0f75`

DII-201 supersedes DII-200 only as the R-0004 source-closing judgment. Exact-head CI
run `30216260434` proved that the initial clean-checkout classification omitted the
BL-184 backlog and failure/correction records that truthfully cite the same historical
objects. Inspector `cbd9eb3` extended the empty-repository regression red first to
every current citation. Architect `f46cf69` adds only those already-existing Auditor
paths. Any citation at a new path still fails closed.

The exact candidate containing DII-201 and the atomically refreshed contract and
handoff must pass the complete local ladder and every required exact-head GitHub check
before source merge. Exact-main source CI, production PC-0005 emission, closure-head CI,
closure merge, and final-main CI remain serial and mandatory.

OM-008 continues to replace only the additional post-repair Opus review for R-0004; no
PASS is inferred. PC-0005 uses DII-162 as the declaration and DII-201 as the closing
decision with `release_disposition: none-preratification`. Every external release,
publication, deployment, real-stynx, R-0008, R-0009, and R-0010 gate remains closed.

### DII-202 — Open R-0005 evidence and corrected round mechanics
`type: decision · status: active · authority: Architect · provenance: session-draft R-0005 declaration; R-0005-AUTHORIZATION; R-0005-PLAN@sha256:2a2e6bfcf375c5e5fbbd04c41260e465af2a72112cbdbfd15ebe22abeb456273; R-0005-ENTRY-INVENTORY; OM-002; OM-009; DII-201; PC-0005; successor e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190`

R-0005 is declared from exact successor base
`e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190` after PC-0005 and its exact-main CI.
The round owns BL-010, BL-011, BL-015, BL-018, BL-033, BL-045, BL-050, BL-063,
BL-106, and carry-ins BL-176 through BL-178 under the plan whose exact SHA-256 is
bound above. The entry inventory is the no-hidden-source map; discovery of another
writer, consumer, lifecycle, worktree, anchor, or sequencing authority requires an
Architect amendment before implementation continues.

The implementation must remain law-first and red-first prospectively. Inspector reds
must precede the substantive Engineer repairs, except for an explicit later governed
exception. Machine proof may be emitted only by validated verbs. Committed round intent
stays in place; audit and proof remain separate; managed worktrees converge on
`.devai/worktrees`; invariant anchor-doc objects migrate totally to `authority_docs`
without renaming record-meta authoring authority.

OM-009 replaces only R-0005's unavailable Claude close review with an independent,
read-only Codex-agent review of the exact source candidate and governed range. Its
identity, commit, range, findings, and verdict must be recorded truthfully, all
actionable findings must be repaired, and no Claude, Opus, or cross-provider PASS may
be inferred.

The closing decision and PC-0006 must bind the exact role-pure batch range, complete
gate results, exact source merge, and exact-main CI. R-0005 cannot authorize evidence
reuse or promotion, package publication, tags, GitHub Releases, Pages deployment,
external release or deployment, real-stynx mutation, R-0008 external action, R-0009
activation, or R-0010 observation. The predecessor remains read-only.

### DII-203 — Govern the R-0005 evidence and lifecycle contract
`type: decision · status: active · authority: Architect · provenance: session-draft R-0005 governed semantics; DII-202; ADR-016; BL-010; BL-011; BL-015; BL-018; BL-033; BL-045; BL-050; BL-063; BL-106; BL-176; BL-177; BL-178; R-0005-KNOWN-RED`

R-0005 adopts `proof-epoch.schema.json` as the canonical line shape for per-round,
per-kind JSONL evidence. Every record and erratum binds the previous line; exactly one
terminal line binds the last non-terminal hash and record count. Reordering, mutation,
truncation, duplicate terminals, post-terminal data, forward errata, and cross-round or
cross-kind lines fail closed. The old aggregate chain remains a bounded compatibility
reader only and cannot become a second canonical writer.

Local-evidence manifests now require producer-derived `subject` and `expiresAt` values.
The verifier recomputes repository, commit, tree, source hash, required jobs, and expiry
from the canonical policy path. A caller may not select a manifest, subject, job set, or
freshness window for gate standing. This machinery is implemented in R-0005, but BL-022
remains the independent authorization required before reuse or promotion.

ADR-016 replaces sealed ADR-011 and permits only two bounded prompt cases: evidence-only
machine output under the two named `record/proofs/work` roots, and an exact single-file
`docs/` output from an Architect-bound review-agent writer with explicit write consent.
Experimental round composers lose direct `work/rounds/**` scope and use disposable
`.devai/state/round-runs/**` output. All reserved-root overlap and final runtime authority
checks remain binding.

Round close retains committed intent in `work/rounds/R-NNNN`, appends attributable close
state, reads machine closure only from `record/proofs/compliance/closures`, and keeps
Auditor observations in `work/audit`. Managed worktrees use `.devai/worktrees`; mutable
registry state uses `.devai/state/worktrees.json`; cleanup must preserve unrelated or
human-adopted worktrees and committed config/pin materializations.

Invariant anchor-doc objects are renamed totally from `authority` to `authority_docs` in
the schema, all 34 current invariants, and every consumer. Record-meta `authority` is a
different authoring-role field and is unchanged. The prospective sequencing policy binds
law before implementation, a failing Inspector contract before repair, and an authorized
shape before Machine emission. R-0002's disclosed inversions remain immutable historical
exceptions, not reusable waivers.

Historical closing language is interpreted only at its cited commit. R-0004's
146-action/54-schema base and 147-action/55-schema exit are distinct measurement epochs;
later canon growth does not rewrite them. The current Auditor map must append the omitted
`12f67ed` / `7ca26c4` / `c7dd9fb` repair cycle before R-0005 close.

Nothing in this decision authorizes evidence reuse, promotion, package publication,
tags, GitHub Releases, Pages deployment, external release or deployment, real-stynx
mutation, R-0008 external action, R-0009 activation, or R-0010 observation. OM-009's
independent Codex review substitution remains exact to R-0005 and creates no Claude or
Opus PASS.

### DII-204 — Accept the R-0005 source candidate
`type: decision · status: active · authority: Architect · provenance: session-draft R-0005 source close; DII-202; DII-203; OM-009; R-0005-AS-BUILT; R-0005-INDEPENDENT-CODEX-REVIEW-9-PASS; reviewed candidate b4002f0892f3bd288c72f6f7268ccc31bd941ce2`

DII-204 accepts R-0005's role-pure evidence and lifecycle implementation and the ninth
independent Codex review's explicit PASS. The reviewed range begins at exact base and
merge-base `e9db37209ee879c0f6cc0e2ee6c7c5619c3cb190` and ends at exact clean
candidate `b4002f0892f3bd288c72f6f7268ccc31bd941ce2`, spanning 185 commits. The
review found no P0 or P1 blocker and verified the review-8 authority rematerialization,
prospective committed-materialization sequencing, exact historical exception scope,
role purity, and preserved nonclaims.

The final local evidence passes 133 ordinary files with 1,228 tests and eight declared
skips; T1 at 74/856; T2 at 41/284 plus one skip; T1+T3 at 83/912 plus seven skips and
72.42/62.36/78.07/74.52 coverage; T4 at 2/4; T5 at 6/25; T6 at 1/3; 34 invariants /
133 traced tests; 167 repository references; strict sequencing and governed identity
checks; repository-wide formatting; `git diff --check`; and clean status. No threshold,
test source, assertion, skip declaration, lint rule, or formatting rule was weakened.

R-0005 source is authorized to enter its source PR and exact-head CI ceremony. Source
merge remains forbidden until every required check is green at the exact PR head.
Production PC-0006 emission remains forbidden until the exact source merge passes
exact-main CI; its closure-only PR, merge, and final exact-main CI remain separate
serial gates.

This decision does not authorize evidence reuse or promotion, package publication,
tags, GitHub Releases, Pages deployment, external release or deployment, real-stynx
mutation, R-0008 external action, R-0009 activation, or R-0010 observation. The
predecessor remains read-only.

### DII-205 — Repair closure-only sequencing across the merged-source boundary
`type: decision · status: active · authority: Architect · provenance: session-draft R-0005 local-only closure rehearsal; DII-202; DII-203; DII-204; R-0005-SOURCE-CLOSE`

The first production PC-0006 rehearsal correctly waited for source PR 8 and exact-main
CI run 30234222364, then emitted only the Machine closure record. The strict sequencing
checker rejected that valid closure-only shape because it searched only the current
`base..head` range for the already-merged schema and production verb. A closure-only PR
contains neither by design, making its one permitted Machine record impossible to merge.

R-0005 must repair this boundary before PC-0006 publication. For a Machine record, the
checker must evaluate prior commit ancestry, ending strictly before the Machine commit,
for both an Architect-owned `law/schemas/` shape and an Engineer-owned `packages/`
implementation verb. The current-range law-first and red-first requirements for new
Engineer implementation remain unchanged. An Inspector contract must first reproduce
both the valid closure-only ancestry case and the missing-ancestor refusal; the Engineer
repair may then change only the sequencer. Auditor evidence and an independent Codex
review must precede the corrected source close.

The unpushed rehearsal record is not standing and must not be published. The corrected
source merge and its exact-main CI replace the original source merge only as PC-0006's
`merged_as` ceremony binding; PR 8 and its evidence remain immutable history. No step
authorizes evidence reuse or promotion, package publication, tags, GitHub Releases,
Pages deployment, external release or deployment, real-stynx mutation, R-0008 external
action, R-0009 activation, or R-0010 observation. The predecessor remains read-only.

### DII-206 — Accept the R-0005 closure-sequencing correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0005 corrected source close; DII-202; DII-203; DII-204; DII-205; OM-009; R-0005-CLOSURE-SEQUENCING-CORRECTION-AUDIT; R-0005-INDEPENDENT-CODEX-REVIEW-10-PASS`

DII-206 accepts the seven-commit closure-sequencing correction reviewed at exact clean
candidate `276d23d89386acc4c294f511f4a13ff1ac222063` from exact base and merge-base
`c449710298e2a51e3938d9dcb17b5d03a2823759`. Independent Codex review 10 returned an
explicit PASS with no P0 or P1 finding. The repair is bounded to prior ancestry strictly
before each Machine record; it accepts a closure-only range only when an Architect
schema and Engineer production verb already exist, and continues to fail closed when
either prerequisite is absent. Existing implementation classification, semantic red
scope, law-first/red-first rules, and exact historical exceptions are unchanged.

The corrected local ladder passes 133 ordinary files with 1,230 tests and eight declared
skips; T1 at 74/856; T2 at 41/286 plus one skip; T1+T3 at 83/912 plus seven skips and
72.42/62.36/78.07/74.52 coverage; T4 at 2/4; T5 at 6/25; T6 at 1/3; all 34 invariants,
167 repository references, strict governance, formatting, diff, and cleanliness checks.
No threshold, test source, assertion, skip declaration, lint rule, or formatting rule
was weakened.

The correction branch may enter a ready source-repair PR. Merge remains forbidden until
all nine required jobs pass at the exact PR head; PC-0006 regeneration remains forbidden
until that correction merge passes exact-main CI. The closure-only PR, closure merge,
and final exact-main CI remain distinct gates. PR 8, its source merge, and its evidence
remain immutable history but no longer supply PC-0006's terminal `merged_as` value.

This decision does not authorize evidence reuse or promotion, package publication,
tags, GitHub Releases, Pages deployment, external release or deployment, real-stynx
mutation, R-0008 external action, R-0009 activation, or R-0010 observation. The
predecessor remains read-only.

### DII-207 — Open the R-0006 entry-control prelude
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 E0 declaration; R-0006-AUTHORIZATION; ROUND-EXECUTION-CONTRACT@sha256:1fd6384fe303d24a329a06b9fe0144f1d8dac1de2dc8e57b52d223f9b4176a64; R-0006-PLAN@sha256:c87ff86156f3d56ede6ee79775255b0c82d0d1112303929bf51c9bc9d2d3d73f; R-0006-ORCHESTRATOR@sha256:c7b652c7874d53ea9b42687e81a43a36bd3feebd0f63e41b01b47578547853ab; OM-010; PC-0006; successor 7cf325625307a630344efe971bceccb011560301; exact-main CI 30239216258`

R-0006 is declared from exact successor base
`7cf325625307a630344efe971bceccb011560301` after PC-0006 closed R-0005 and the
pre-R-0006 governance-alignment merge passed exact-main CI run `30239216258`. The
exact shared execution contract, amended R-0006 plan, and amended orchestrator prompt
are bound by the SHA-256 digests above. Their mandatory E0 through E5 sequence is the
complete authorized scope of this entry-control prelude.

The known-red posture is explicit: candidate-only publishability, full Git identity,
exact candidate range, two-pass convergence, post-review mutation freeze, the exact
review envelope, isolated closure rehearsal, and non-vacuous semantic assertions do
not yet have the complete behavioral enforcement required by OM-010. E1 must preserve
failing Inspector contracts for those admitted defects before E2 semantics or E3
workspace-tooling implementation. No existing threshold, source set, assertion,
forbidden-action rule, sequencing rule, role authority, public action behavior, or
release boundary may be weakened.

The claims ceiling is entry-control machinery implemented and tested only if E5 records
an exact Auditor observation and an independent read-only PASS for a clean, publishable
prelude candidate. This decision does not inventory, decide, implement, or test R-0006
action/output contracts, operational-value extraction, mutation strength, evidence
aggregation, or coverage depth. B0 through B9 remain blocked. Execution must stop after
E5 and before substantive B0, and no release, publication, deployment, evidence reuse
or promotion, real-stynx mutation, predecessor mutation, or R-0007+ work is authorized.

### DII-208 — Govern exact source-close candidate controls
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 E2 semantics; DII-207; OM-010; R-0006 E1 Inspector 0afa4449a134584f0fb704581eb3377032297876; R-0006-ENTRY-CONTROL-KNOWN-RED; ROUND-CLOSE-CONTROLS; ROUND-CLOSE-CANDIDATE-MANIFEST`

The R-0006 E1 command exited nonzero with eight intentionally failing behavioral
contracts after all 1,230 prior tests remained green. DII-208 binds the semantics needed
to close those reds. `implementation_subject` is the last semantic law, product, plant,
or test commit; `review_candidate` is the complete current source candidate submitted
to review and must descend from it; `published_head` is that reviewed candidate plus at
most the exact post-PASS envelope. Each is a full Git commit identity. The governed
range is the exact DII-207 base through `published_head`; fixed trailing windows and
pre-round history are forbidden.

A publishable identity must resolve in a bundle-backed, single-candidate-branch clone
with no alternates and no borrowed refs or objects. An identity absent there is admitted
only when the existing historical-exception registry names its exact full SHA, truthful
object kind and reason, and every and only path where it occurs. Abbreviated identities,
invented expansions, objects of a non-commit kind, unresolved identities, and unclassified
local-only objects fail closed.

The deterministic candidate manifest is governed by
`law/schemas/round-close-manifest.schema.json`. It derives the exact base, three
candidate identities, candidate tree, complete commit range, role/path attribution,
projection and materialization digests, test and coverage readings, candidate-only Git
resolution, ordered gate results, two-pass convergence, and isolated closure rehearsal.
Its digest is SHA-256 over canonical JSON with the digest member omitted; timestamps,
ambient refs, caller-selected history windows, and unrecorded gate results are excluded.

The review freeze begins at the exact `review_candidate`. Any later law, product,
package, test, current-documentation, E5 as-built, source-close, or closing-decision
change invalidates PASS. The sole permitted envelope is one exact
`DEVAI Auditor`-authored `work/audit/R-0006/independent-review.md` record plus only the
policy-enumerated deterministic projection outputs caused by that record and reproduced
byte-for-byte from unchanged sources. A second audit record, generator or policy edit,
uncaused output, malformed manifest, omitted path, or glob variant invalidates PASS.

Convergence runs the policy's complete ordered commands twice from clean boundaries.
Every projection uses no-write/check mode; the immediate second pass may change no
tracked or untracked path. Formatting, preparation, trace, repository references,
generated views, materializations, lint, typecheck, gates, coverage, diff, or cleanliness
drift restarts convergence. Semantic checks derive complete populations from broad
source globs; fixed corpus counts, self-comparisons, narrow named-file scans, and policy
or materialization mirror drift are vacuous and fail closed.

Closure rehearsal uses an isolated candidate-only clone. It constructs non-standing
source-merge and closure-only descendants and proves both the closure schema and
validated production verb exist in ancestry strictly before the Machine-shaped closure
commit. Either missing prerequisite fails. Rehearsal refs and generated bytes are
discarded and grant no standing.

These semantics authorize only E3 workspace tooling and the one generated policy
materialization required by the E1 tests. They add no public action, change no existing
public action behavior, and do not authorize B0, action/output contract work, coverage
depth work, threshold or exclusion changes, evidence reuse or promotion, release,
publication, deployment, predecessor mutation, real-stynx mutation, or R-0007+ work.

### DII-209 — Correct the closure-rehearsal production-verb binding
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 E4 repair; DII-208; R-0006 Inspector f9ff51ed2181a9ed2ae09981e2e61e8af5695bbe; R-0006-CLOSURE-PREREQUISITE-RED-EVIDENCE`

The R-0006 isolated real-candidate rehearsal proved that DII-208's canonical policy
named an absent closure-verb path. The already validated and action-registered
production implementation is `packages/cli/src/commands/phase/index.ts`; the rehearsal
must bind that tracked path together with `law/schemas/phase-closure.schema.json` before
constructing its non-standing source merge and closure-only descendant. The generated
policy mirror must reproduce this correction byte-for-byte.

This is a path-binding correction only. It changes no public action behavior, authorizes
no closure record, and does not authorize B0, threshold or exclusion changes, evidence
promotion, publication, merge, release, deployment, predecessor mutation,
real-stynx mutation, or R-0007+ work.

### DII-210 — Repair entry controls after independent diagnostic review
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 E4 repair; DII-207; DII-208; DII-209; R-0006 Inspector ea00313bd8552389c4bd8608c6f8e7e6b4952af7; R-0006-INDEPENDENT-REVIEW-REPAIR-RED-EVIDENCE@sha256:bea949a59118cce5b4b721777793d6d872ef1140fda207eb05365fd0d10d5a01; R-0006-INDEPENDENT-CODEX-REVIEW-FAILURE`

The first read-only diagnostic review of the E0-E5 candidate returned six P1 findings.
Its positives remain evidence, but its FAIL grants no review standing. Before the
execution contract's mandatory literal `claude-opus-5` review, the complete close
control must repair all six classes under the existing red-first and role-pure sequence.

Convergence is valid only when the working checkout remains the caller-named exact head
before, during, and after both ordered passes. Each pass includes the ordinary
`pnpm vitest run` floor. The immediate second pass must reproduce the same ordered
command identities, arguments, exit outcomes, and coverage bytes without changing any
relevant tracked, untracked, ignored, or generated workspace content. A manifest may
report convergence only after revalidating that complete ignored-state record against
the canonical policy, exact candidate, current coverage artifact, and clean boundary.

Closure rehearsal must run the policy-bound production phase-close command in an
isolated candidate-only clone against a schema-valid non-standing draft. It must consume
the command's actual Machine record bytes, create exactly one closure-only Machine
descendant, and run the production sequencing check across that exact one-commit range.
Existence checks and hand-written placeholder records are not rehearsal evidence.

The review envelope derives its frozen candidate only from the deterministic candidate
manifest and an exact Auditor-authored review record. That record must declare verdict
`PASS`, literal reviewer model `claude-opus-5`, the same full review-candidate SHA, and
the manifest's internally recomputed SHA-256 digest. Caller-selected reviewed identity,
FAIL or malformed records, and mismatched candidate or digest fail closed.

Semantic non-vacuity evaluates every governed population glob against the exact tracked
candidate and requires every population to be nonempty. Every declared source/mirror
pair must exist and be byte-identical; checking only one hard-coded pair is forbidden.
These requirements are additive to the existing fixed-count, self-comparison, and
named-file-only prohibitions.

This repair changes only pre-R-0006 entry-control machinery. It changes no public
action behavior or threshold and authorizes no B0 work, publication, push, merge,
closure, release, deployment, evidence reuse or promotion, predecessor mutation,
real-stynx mutation, or R-0007+ work.

### DII-211 — Continue R-0006 after the entry-control PASS
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B0 continuation; direct Owner continuation instruction in the active R-0006 task; DII-207; DII-208; DII-209; DII-210; R-0006-ENTRY-CONTROL-AS-BUILT; R-0006-INDEPENDENT-REVIEW; published entry-control head c6c9d4c11c99f63b54e21dd8f34e31a611a1856f`

The exact E0-E5 entry-control candidate passed the mandatory literal
`claude-opus-5` review at review candidate
`790126e0a048927562173ee1c295a44003e027e4`, and its bounded Auditor review record
produced published entry-control head
`c6c9d4c11c99f63b54e21dd8f34e31a611a1856f`. The post-review envelope verifier,
candidate-only identity checks, production closure rehearsal, and both final
published-head convergence passes were green and clean. That PASS satisfies the
amended plan's mandatory entry condition for B0.

R-0006 therefore continues serially through B0-B9 under the already-granted
R-0006 authorization and the Owner's continuation instruction. B0 freezes the exact
action/output/error and coverage populations before B1 makes any policy decision.
The starting coverage denominator is evidence, not a protected arithmetic shortcut:
B6 must either prove the current loaded-module denominator correct or repair the
measurement without excluding valid source. No threshold, assertion, test source,
or exclusion may be weakened.

The claims ceiling remains contracts and coverage depth implemented and tested, then
published and closed only through the two-PR ceremony. This decision authorizes no
package publication, tag, GitHub Release, Pages deployment, external deployment,
evidence reuse or promotion, real-stynx mutation, predecessor mutation, or R-0007+
work.

### DII-212 — Extract constitutional operational values into policy
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B1 operational-value extraction; DII-211; R-0001-LAW-ALTITUDE-SWEEP; BL-034; Constitution Articles 1, 11, 13-19, 21-28, 30-32, 34, 37, 39-40`

The R-0001 altitude sweep identified mechanism values embedded in constitutional
prose. R-0006 adopts `law/policy/operational-values.json` as their sole operational
home. The Constitution remains the durable doctrine and anchor source; where it
contains a concrete token, count, path, command composition, field list, or lifecycle
choreography enumerated by this policy, that spelling is an explanatory founding
snapshot rather than an independently editable second setpoint. A change to the
policy cannot weaken or contradict the constitutional doctrine, and any doctrinal
change still requires the full Article-40 amendment process.

This extraction changes no doctrine and therefore does not rewrite or version-bump
the ratified Constitution. It makes the already-ratified distinction between axiom and
mechanism explicit and mechanically locatable. Existing schemas remain canonical for
their record shapes; the policy points to them rather than restating their full
definitions. Thresholds remain canonical in `law/policy/thresholds.json`.

No operational value may be authoritative in two policy homes. The extraction
registry names one canonical home for every altitude-sweep row and records whether the
value is carried directly or by reference. Later implementation consumes those homes;
it may not copy a value back into constitutional text or introduce an uncatalogued
override.

### DII-213 — Decide mutation-strength obligations
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B1 mutation-strength decision; DII-211; DII-212; ADR-004; BL-035; Constitution Articles 39 and 42; law/policy/thresholds.json`

Mutation strength is a separately selected deterministic validation obligation, not a
universal substitute for ordinary tests and not an aggregation rule. The canonical
semantics are `law/policy/mutation-strength.json`. A mutation obligation exists only
when an invariant, validation strategy, or governed risk selection marks a scope
mutation-relevant. The selection must be nonempty, exact-candidate-bound, and enumerate
its scenarios; an empty or caller-trimmed selection is UNKNOWN, never PASS.

A mutation observation is PASS only when every required scenario executed, every
required critical mutant was killed, no runtime or infrastructure error occurred, the
canonical mutation score meets `thresholds.mutation.score_min`, and the survivor count
does not exceed `thresholds.mutation.survived_max`. A surviving required critical
mutant, score breach, or survivor breach is FAIL after a valid observation exists.
Invalid reports, exact-subject mismatches, missing evidence, unavailable runners,
timeouts, crashes, incomplete selections, and independently uncheckable results are
UNKNOWN and block any required readiness conclusion without being relabelled FAIL.

Mutation PASS is supporting evidence only. It cannot establish readiness by itself,
and judge-only assessment cannot replace an executable mutation observation. This
decision neither changes the existing 60/50 setpoints nor decides how heterogeneous
evidence is aggregated.

### DII-214 — Decide evidence-aggregation semantics
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B1 evidence-aggregation decision; DII-211; DII-212; ADR-004; BL-035; Constitution Articles 11, 39 and 42`

Evidence aggregation is independent of mutation-strength selection. Its canonical
semantics are `law/policy/evidence-aggregation.json`. Aggregation first derives a
nonempty required population from policy, then groups observations by exact subject,
kind, scope, and binding. A current readiness-bearing FAIL dominates the aggregate. If
no current FAIL exists but any required observation is absent, stale, UNKNOWN,
unavailable, conflicting, judge-only, or otherwise independently uncheckable, the
aggregate is UNKNOWN and blocks PASS. PASS exists only when every required member has
one current, independently checkable PASS.

A recorded FAIL leaves the current same-kind population only when a newer valid
observation of the same exact subject, kind, scope, and binding supersedes it. Filtering
or omission cannot erase it. An error is an observation failure and maps to UNKNOWN,
not to PASS or FAIL. N/A requires a policy-declared applicability record, remains
visible with its reason, and cannot reduce a readiness-bearing population to empty.
Advisory and experimental evidence may be reported but cannot satisfy a required
readiness member.

This decision supplies no readiness standing, does not activate evidence reuse or
promotion, and does not convert predecessor or local rehearsal evidence into current
standing.

### DII-215 — Close every public action output and error boundary
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B3 contract decision; DII-211; BL-026; INV-DEVAI-001; INV-DEVAI-015; INV-DEVAI-017; law/policy/action-registry.json`

Every runnable public action has one action-bound machine result contract and one
structured error contract declared on its canonical registry row. In machine mode,
success is exactly one `action-result.schema.json` object on stdout with `ok: true`,
the canonical never-reminted `action_id`, and a closed transport result frame. Failure
is exactly one object of the same envelope on stderr with `ok: false`, the same action
identity, and an `error.schema.json` value. The opposite channel is empty. Human-mode
presentation is not evidence for this contract.

The common result frame closes the transport shape and preserves a typed media kind.
Where a domain payload schema already exists, the registry row binds it explicitly;
an absent payload schema means the action's JSON value is opaque to this transport
layer, not that the outer envelope is open or optional. A consumer must validate the
common envelope and every non-null per-action payload schema. It may not infer action
identity from argv, prose, or a handler implementation after validation.

Folded and tombstoned identities are router-only. Their registry contracts therefore
declare no runnable success or error channel and no envelope or payload schema. Their
migration string remains the only supported route. This prevents a retired identity
from silently acquiring an independently executable output contract or being reminted.

### DII-216 — Bind trace depth to executable assertion sites
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B3 trace-depth decision; DII-211; BL-081; INV-DEVAI-020; law/trace.json; law/schemas/trace.schema.json`

Every canonical `test_corpus` row must bind the exact traced source to a positive
deterministic assertion count and a SHA-256 digest of its ordered assertion-site
projection. The generator derives both values from tracked source bytes; callers may
not supply, trim, or reuse them. A missing source, zero assertion sites, an unsupported
or ambiguous assertion form, or a digest mismatch fails closed and cannot contribute
trace coverage.

This evidence proves that the named executable contains assertion-bearing control
points at the exact materialized source revision. It does not, by count alone, prove
that each assertion is strong or that every listed invariant is semantically established.
Invariant markers, ordinary tests, contract tests, coverage, independent review, and
the applicable validation strategy remain separate required evidence. Documentary
mentions, snapshots without an executable matcher, and configuration-only presence do
not satisfy the assertion-bearing corpus rule.

### DII-217 — Measure the complete eligible source denominator
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B6 coverage-correctness decision; DII-211; R-0006-B0-BASELINE; BL-017; law/policy/thresholds.json`

The B0 V8 report measured 223 of 377 then-eligible non-generated package source files
because its source include was implicit and therefore limited to modules loaded by the
selected tests. The 154 omitted files, including 150 CLI files, are valid shipped source.
That loaded-module denominator is incorrect for repository-wide coverage and cannot be
used for an all-source threshold claim.

The canonical coverage configuration must explicitly include
`packages/*/src/**/*.{ts,tsx,js,mjs,cjs}` and retain the pre-existing exclusions only
for distribution output, tests, configuration files, and generated source. Every
tracked file matching that include and not an exclusion belongs to the denominator,
whether or not a test loads it. New valid source joins automatically. B6 may repair
that instrumentation and provider integration; B7 must add real assertion-bearing
tests until the unchanged 70/60/70/70 lines/branches/functions/statements floors pass.

No threshold may fall, no valid source may be excluded, and no uncovered file may be
removed or relabelled generated to manufacture a pass. The corrected first reading is
expected to be red and is evidence for missing tests, not permission to restore the
loaded-module shortcut.

### DII-218 — Disclose immutable R-0006 sequencing gaps
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 exit-ladder correction; DII-202; DII-211; DII-215; DII-217; Inspector a3e95afe069f4aafad880832bd0eec29d078e437; Inspector 0cf442d310f1be130e90a85a7622f7950e06f83f; first B9 convergence FAIL at c5b2c770107fc7684d689d4158ecb092aab2969d`

The first B9 convergence failed closed before review. Formatting and root typecheck
exposed correctable Inspector quality defects, while governed sequencing disclosed
that three already-committed Engineer changes had no exact prospective binding. The
failed convergence has no standing and must not be reused.

The action-envelope commits
`a0292658a7322066ba70b91c80f0c3d751ab69dc` and
`58b175d3b751c52fe55a97aa17b78f2c55e14d2c` followed the B2 failing contract and
DII-215, but the immutable failing Inspector source did not literally enumerate every
implementation path later changed. The subprocess-coverage commit
`8e7a44b70a3e13b85293de48af8284889daea7e3` followed DII-217 and the observed
corrected whole-source red reading, but no prior committed Inspector source plus durable
Auditor JSON bound every exact changed path. These are real sequencing defects; neither
conceptual test relevance nor a later green run can be relabelled as compliant prior
red evidence.

The exact three commits are therefore recorded as historical commit exceptions in
`law/policy/governed-sequencing.json`. The exceptions describe immutable history only,
grant no prospective bypass, and do not weaken the law-before-implementation,
red-before-repair, semantic-scope, threshold, exclusion, or review rules. Inspector
`0cf442d310f1be130e90a85a7622f7950e06f83f` repairs the formatting, typechecking, and
deterministic runtime-test defects without changing plant behavior. The Architect must
refresh the caused trace projection, the Auditor must amend the as-built with the failed
gate and exact disclosures, and B9 must restart from a new implementation subject and
review candidate with two fresh convergence passes.

This decision authorizes no source publication before fresh convergence and literal
`claude-opus-5` PASS, no closure record before source merge and exact-main CI, and no
package publication, tag, GitHub Release, Pages deployment, external deployment,
evidence reuse or promotion, real-stynx mutation, predecessor mutation, or R-0007+
work.

### DII-219 — Classify exact immutable R-0006 role-path defects
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 manifest correction; DII-207; DII-211; DII-217; DII-218; Inspector fb37d09255cd1a7fbf383a8b4af8404ce744b34b; Auditor R-0006-ROLE-PATH-EXCEPTION-RED-EVIDENCE; failed manifest at 970651a5f49fa6e2bb7f979d53371a147ef0e109`

The candidate manifest failed closed after convergence and rehearsal because two
immutable B6 commits were authored as Engineer while changing Inspector-owned
`tests/config/**` paths. Commit `d41c648b184ae63c2ed473ae1a44725eb3cb26dc`
changed only `tests/config/t1-t3.coverage.config.ts`. Commit
`8e7a44b70a3e13b85293de48af8284889daea7e3` changed Engineer-owned package and
workspace files plus `tests/config/t1-t3.coverage.config.ts` and
`tests/config/subprocess-v8-coverage-provider.ts`. This is an ownership defect in
immutable history; coverage purpose does not make the test paths Engineer-owned.

`law/policy/round-close-controls.json` therefore classifies only those two full commit
identities and only their exact mismatched paths. A classification is valid only when
the governed commit exists, its actual author role equals the declared role, its exact
otherwise-unauthorized path set equals the declared path set, `decision_id` resolves
to this decision, and the reason is nonempty. A missing commit, wrong role, omitted
path, unused extra path, glob, prefix, or already-authorized path fails closed. The
manifest may mark the commit path-authorized only after all those conditions hold.

This classification does not rewrite history or call the original commits role-pure.
It preserves `tests/**` and `**/tests/**` as Inspector authority, grants no prospective
waiver, and cannot be inherited by another commit or path. The failed manifest and its
preceding green convergence remain audit evidence without review or publication
standing. B9 must restart convergence, rehearsal, manifest generation, and literal
`claude-opus-5` review at a fresh candidate after implementation and adversarial tests
pass.

This decision authorizes no threshold or exclusion change, source publication before
fresh review PASS, closure record before source merge and exact-main CI, package
publication, tag, GitHub Release, Pages deployment, external deployment, evidence
reuse or promotion, real-stynx mutation, predecessor mutation, or R-0007+ work.

### DII-220 — Close the final R-0006 independent-review gaps
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 Opus correction; DII-208; DII-211; DII-215; DII-216; DII-219; Inspector a1bedaa01813c626ac497fe9e6e85102c72d21db; Auditor R-0006-OPUS-B9-CORRECTION-RED-EVIDENCE; R-0006-INDEPENDENT-OPUS-B9-REVIEW-FAILURE`

The first independent B9 review of the post-manifest-correction candidate returned
FAIL with five P1 findings. Its verified positives have no standing across repair. The
semantic anti-vacuity control must inspect every tracked file in each configured
population and emit path-specific findings for governed fixed-count declarations,
literal self-comparison assertions, and direct named-file-only content assertions. A
nonempty glob alone is not evidence that its contents were checked. The four concrete
anti-patterns identified by review must be derived or removed without weakening the
population.

The 39 folded or tombstoned action identities must declare exact `router-only` success
and error modes. Registry-derived runtime tests must exercise at least one folded route
and the tombstone and prove exit 2, empty stdout, and one structured stderr refusal.
This establishes retirement routing behavior but does not claim end-to-end invocation
coverage for every kept action; the as-built must state that residual honestly.

A DII-219-classified role-path row may be accepted only under the existing exact-set
checks and must disclose the classification in the manifest. Every role-path row now
carries `role_path_exception`: `null` for an ordinarily authorized commit, or a closed
object containing the resolving `decision_id` and exact otherwise-unauthorized paths.
`path_authorized: true` alone must never hide the distinction. The schema and generator
must agree, and the exact fixture classification must prove the disclosure.

Inspector must record the final green dispositions for both B2 and the B9 role-path
red. Auditor must correct assertion-site totals directly from `law/trace.json` and
narrow output-totality prose to the evidence actually executed. Every affected
projection and sequencing binding must be refreshed role-purely. B9 then restarts
convergence, rehearsal, manifest generation, and literal `claude-opus-5` review at a
fresh candidate.

This decision authorizes no threshold or exclusion change, broad historical exception,
source publication before fresh review PASS, closure record before source merge and
exact-main CI, package publication, tag, GitHub Release, Pages deployment, external
deployment, evidence reuse or promotion, real-stynx mutation, predecessor mutation,
or R-0007+ work.

### DII-221 — Disclose the final immutable R-0006 sequencing defect
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 sequencing correction; DII-202; DII-220; Inspector a1bedaa01813c626ac497fe9e6e85102c72d21db; Auditor R-0006-OPUS-B9-CORRECTION-RED-EVIDENCE; Engineer 63b2238ddf22e542ba3e755108477ddd903ea137; governed sequencing FAIL`

Governed sequencing failed after the final Opus repair because Engineer
`63b2238ddf22e542ba3e755108477ddd903ea137` changed both
`scripts/run-round-close-controls.mjs` and `packages/cli/src/define-command.ts`, while
the immutable failing Inspector source literally named only the controller path. The
Auditor evidence was corrected before implementation to bind both exact paths, DII-220
authorized both repairs, the population adversary semantically exposed the fixed-count
class, and all focused and ordinary tests passed after implementation. Those facts do
not make the missing literal Inspector path retrospectively present.

The exact Engineer commit is therefore a historical commit exception in
`law/policy/governed-sequencing.json`. This is a disclosed sequencing defect, not a
claim of prospective compliance. It grants no exception to any later commit, test,
path, law-before-implementation rule, threshold, exclusion, review gate, or role
boundary. The failed governance observation has no convergence or review standing.
B9 must use a fresh candidate and rerun its complete exit ladder.

This decision authorizes no source publication before fresh review PASS, closure
record before source merge and exact-main CI, package publication, tag, GitHub Release,
Pages deployment, external deployment, evidence reuse or promotion, real-stynx
mutation, predecessor mutation, or R-0007+ work.

### DII-222 — Require auditable exact-hit coverage measurement
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 second B9 Opus correction; DII-217; DII-219; DII-221; Inspector 49a89b433799823cc4e9d8f0baa8d6068959ae24; Auditor R-0006-COVERAGE-INTEGRITY-RED-EVIDENCE; R-0006-INDEPENDENT-OPUS-B9-REVIEW-2-FAILURE`

The second independent B9 review returned FAIL because the subprocess coverage
provider treated a positive containing range as evidence that a nested exact zero-hit
statement or function executed. A coverage numerator may contain only measured hits.
The canonical merge must therefore match complete source locations exactly, carry
explicit zero-hit locations as zero, and add no count when the source maps do not
identify the same canonical location. Containment, nearest-range, parent-range, line,
or other inferred projection is forbidden for statements, functions, and branches.

The merged coverage run must leave independently inspectable evidence. It emits the
Istanbul statement-level `coverage-final.json` beside the summary and preserves the
raw child-process V8 JSON inputs under `scratch/coverage/t1-t3/subprocess-v8` after the
merge completes. A later run may clean the previous ephemeral artifact before
measurement, but the provider must not unconditionally destroy the current inputs at
the end of conversion. The evidence paths are runtime scratch material and are not
committed.

The 378-file denominator, source include, four existing exclusions, and
70/60/70/70 lines/branches/functions/statements floors remain unchanged. The first
honest reading after repair is evidence, whether green or red. If a floor is red, B7
adds behavior-bearing Inspector tests against real risk paths until it passes; no
threshold reduction, exclusion growth, valid-source removal, generated relabeling, or
replacement inference is permitted.

Both bounded repair paths are under `tests/config/**` and remain Inspector-owned.
DII-219 explicitly grants no prospective Engineer waiver, so the correction must be
committed as Inspector despite the historical B6 role label. No new role-path
exception is authorized. The final Auditor record must re-read the corrected coverage
digest, numerator, denominator, percentages, governed-range counts, and all exception
claims from current machine sources before a fresh convergence, rehearsal, manifest,
and literal `claude-opus-5` review.

This decision authorizes no source publication before fresh review PASS, closure
record before source merge and exact-main CI, package publication, tag, GitHub Release,
Pages deployment, external deployment, evidence reuse or promotion, real-stynx
mutation, predecessor mutation, or R-0007+ work.

### DII-223 — Accept R-0006 for the governed source-close ceremony
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 source close; DII-207–228; OM-002; R-0006-AUTHORIZATION; R-0006-PLAN; R-0006-AS-BUILT at Auditor 72fac684750a157a26b6b867beaa56d045569960; R-0006-COVERAGE-DEPTH-EVIDENCE; R-0006-INDEPENDENT-OPUS-B9-REVIEW-4-FAILURE`

R-0006's semantic implementation subject is exact Inspector commit
`e284a6cb9b2d23eaf5713c34ecf29e324397b355`. Architect
`cef0540a70a62de2222078c63455cd763fa92703` is its deterministic trace projection,
and Auditor `72fac684750a157a26b6b867beaa56d045569960` binds the final pre-review
as-built.
The action surface remains 147 runnable identities, 38 folded identities, and one
tombstone. The operational-value extraction remains 24 rows. Mutation-strength and
evidence-aggregation decisions remain independent.

The collision-free exact-hit complete-denominator coverage reading is statements 71.86%
(16,093/22,393), branches 60.14% (11,658/19,382), functions 80.67%
(2,479/3,073), and lines 73.27% (14,936/20,383), above the unchanged
70/60/70/70 floors. All 378 eligible source files remain measured under the unchanged
four exclusions. The ordinary suite passes 155 files, 1,458 tests, and eight declared
skips. The trace projection binds 34 invariants, 155 test sources, and 2,784 lexical
assertion sites. All four B9 Opus FAILs and every honest interim correction red remain
immutable evidence; none is relabelled PASS.

The governed-sequencing policy contains three R-0006 historical exception entries
covering exactly four immutable implementation commits. The separate role-path policy
classifies exactly two immutable commits and their exact mismatched test paths. Neither
control grants a prospective bypass. Every post-DII-222 repair is role-pure, and no
threshold, exclusion, source denominator, assertion, or skip declaration was weakened.

This decision accepts the audited implementation only for the remaining serial B9
controls. The complete source candidate must converge twice, rehearse the source and
closure ancestry in isolation, generate a fresh candidate-only manifest, and receive a
fresh read-only PASS through the literal `claude-opus-5` selector. Any finding returns
to its owning role and invalidates all candidate state. After PASS, only the exact
Auditor review record may form the review envelope; current policy admits no
deterministic projection consequence. The resulting published head must converge twice
again before push.

The source PR may merge only after every required exact-head check passes. Its exact
merge must then pass exact-main CI. Only from that merged source may the production
phase-close verb append PC-0007 on a closure-only branch. PC-0007 uses DII-207 as the
declaring decision and DII-223 as the closing decision, binds the exact source merge,
and records release disposition `none-needed`. The closure-only PR, its merge, and final
exact-main CI remain separate required gates.

This decision does not itself claim independent-review PASS, source publishability,
push, pull request, merge, exact-head or exact-main CI, PC-0007, final closure, package
publication, tag, GitHub Release, Pages or other deployment, evidence reuse or
promotion, real-stynx mutation, predecessor mutation, or R-0007+ work.

### DII-224 — Normalize only retained coverage runtime artifacts at convergence
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 fixpoint correction; DII-208; DII-222; DII-223; Inspector ebf10882d2ea55d83a773cd88c3c9b667fd42c91; Auditor R-0006-RETAINED-COVERAGE-FIXPOINT-RED-EVIDENCE; failed convergence at 95abe603ee86e82e99ba0498b56d49cac292ab45`

The first post-DII-223 convergence attempt ran every one of the 16 ordered gates green
in both passes, began and ended both passes Git-clean, retained identical coverage
summary bytes, and produced equivalent ordered outcomes. It still failed closed because
the relevant-workspace digest changed. DII-222 requires the current run's raw
subprocess inputs to remain under `scratch/coverage/t1-t3/subprocess-v8`, whose runtime
names contain process and time values, and requires the statement-level
`scratch/coverage/t1-t3/coverage-final.json` artifact. Treating those exact per-run
artifacts as immutable workspace source makes the retained-evidence and two-pass
contracts impossible to satisfy together.

The convergence policy therefore classifies only those two exact paths as normalized
runtime artifacts. They remain present and independently inspectable after the final
coverage execution, but their per-run filenames and bytes do not enter the generic
relevant-workspace snapshot. The separate coverage digest continues to bind
`scratch/coverage/t1-t3/coverage-summary.json` byte-for-byte across both passes. Every
other tracked, untracked, ignored, generated, scratch, materialization, projection, and
coverage path remains part of the workspace snapshot. A prefix or broad `scratch/**`
exception is forbidden.

Engineer may update only `scripts/run-round-close-controls.mjs` and the committed policy
materialization needed to enforce this exact classification. The implementation must be
policy-derived, reject malformed or broad runtime-artifact declarations, and keep the
existing coverage-byte, command-result, dirty-tree, and workspace-drift adversaries
green. Inspector must make the new focused red green and rerun the same-class entry
control suite. Auditor must preserve the failed convergence and refresh the as-built.
All convergence, rehearsal, manifest, review, and source-publication state for the
failed candidate is invalid.

This decision authorizes no raw-evidence deletion, threshold or exclusion change,
denominator change, broad ignored-path waiver, retained PASS, source publication before
fresh convergence and literal `claude-opus-5` PASS, closure before source merge and
exact-main CI, package publication, tag, GitHub Release, Pages or other deployment,
evidence reuse or promotion, real-stynx mutation, predecessor mutation, or R-0007+ work.

### DII-225 — Correct branch exact-hit measurement and reaccept R-0006
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 third B9 Opus correction; DII-222–224; R-0006-INDEPENDENT-OPUS-B9-REVIEW-3-FAILURE at candidate 3c6c2d3bdde6bc6d505a6a29fb92d120a36c0050; Inspector f93d8f6508706b3bbb9c9bd423581512626bf88f; Auditor 2ee11660d0dd17ce01ddf540dd38888ca2267160; Inspector 2087572909813282086a48a823017e3ed74f39cf; Auditor 05d883ea30f5624cd94dbabcdc492ccebf3b8bad; Inspector a7814b4384c20dbbe33c830649a52f94ae5e36c5; Architect 694bc725f869947c443def37e7eebad22ab83442; Auditor 0b0be11c0cdd833add8bc5b7756f730bcda85a75`

The third literal `claude-opus-5` B9 review returned FAIL with one P0, three P1,
nine P2, and four P3 findings. That verdict remains exact historical evidence and
invalidates candidate `3c6c2d3bdde6bc6d505a6a29fb92d120a36c0050`, its convergence,
rehearsal, manifest, and every publication claim. The earlier E0–E5 PASS remains in a
separate immutable Auditor record rather than occupying the final policy review-record
slot.

An incomplete Istanbul branch location is not a merge identity. Empty or partially
specified branch positions must never collapse into a shared key, inherit a foreign
hit, or otherwise contribute inferred coverage. Complete integer locations remain the
only exact-hit identity for statements, functions, and branches. The live Istanbul
coverage object may be updated exactly once; it must not be additively re-added to the
map after in-place mutation. Raw subprocess inputs and the statement-level artifact
remain retained run evidence, but their runtime-variable bytes are not a stable
cross-run identity. Retention, exact counters, repeat merging, degenerate branches,
every return-path filter, and malformed-input failure are behaviorally exercised.

Inspector `f93d8f6508706b3bbb9c9bd423581512626bf88f` preserves four exact reds.
Auditor `2ee11660d0dd17ce01ddf540dd38888ca2267160` binds that observation, and Inspector
`2087572909813282086a48a823017e3ed74f39cf` makes it green within the existing
Inspector-owned provider path. The first honest corrected complete-denominator run
then failed only branches at 59.62% (11,557/19,382), 73 hits below the unchanged floor;
Auditor `05d883ea30f5624cd94dbabcdc492ccebf3b8bad` preserves that red. Inspector
`a7814b4384c20dbbe33c830649a52f94ae5e36c5` adds ten behavior-bearing workflow-parser
and runtime-probe-data tests. The resulting reading is statements 71.86%
(16,093/22,393), branches 60.14% (11,658/19,382), functions 80.67%
(2,479/3,073), and lines 73.27% (14,936/20,383) across the unchanged 378-file
denominator, four exclusions, and 70/60/70/70 floors. The ordinary suite passes 155
files and 1,455 tests with eight declared skips; Architect
`694bc725f869947c443def37e7eebad22ab83442` binds 34 invariants, 155 test sources,
and 2,778 lexical assertion sites; Auditor
`0b0be11c0cdd833add8bc5b7756f730bcda85a75` binds that then-current as-built and stable
coverage-summary digest.

The remaining P2 and P3 observations stay visible as bounded nonblocking observations;
they are not restated as implemented controls or readiness claims. Candidate-file
boundary whitespace is preserved, the final review envelope admits only the exact
Auditor review record and no deterministic projection, and malformed subprocess
evidence fails closed. DII-223's acceptance is refreshed only for a new complete B9
ceremony: fresh two-pass convergence, isolated source/closure rehearsal,
candidate-only manifest, and literal `claude-opus-5` review. Any fresh finding returns
to its owning role and invalidates all candidate state.

The fourth review did return findings and therefore invalidated this decision's
then-current acceptance identity and all associated candidate state. DII-226 through
DII-228 preserve and correct that later sequence; the historical counts above are not
the current source-close identity.

This decision authorizes no threshold, exclusion, denominator, source-set, generated
classification, skip, or assertion-mechanism weakening; no reuse of the failed
candidate; no source publication before fresh review PASS; no closure before source
merge and exact-main CI; no package publication, tag, GitHub Release, Pages or other
deployment, evidence reuse or promotion, real-stynx mutation, predecessor mutation,
or R-0007+ work.

### DII-226 — Fail closed on duplicate exact coverage locations
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 fourth B9 Opus correction; DII-222; DII-225; R-0006-INDEPENDENT-OPUS-B9-REVIEW-4-FAILURE at candidate c7ab49f5fbeffae3d8f58be0137f4c8f11d356fa; Inspector 9b8b288bf83dea1342d1b7084a2253a4fd16e78a; Auditor dbb1ea5840cb5c3cde8c0e503c199008f7ff5441`

The fourth literal `claude-opus-5` B9 review returned FAIL with zero P0, one P1, one
actionable P2, and two actionable P3 findings. That verdict remains exact historical
evidence and invalidates candidate `c7ab49f5fbeffae3d8f58be0137f4c8f11d356fa`, its
convergence, rehearsal, manifest, and every publication claim. The reviewer independently
measured zero complete-location collisions across the current 378-file statement,
function, and branch population, so the current numerator is not retroactively relabelled
inflated.

Exact-location merging nevertheless must not rely on last-wins map insertion. Within
each coverage kind, every complete location is a unique identity in both the parent map
and the subprocess map. Two statement entries, two function entries, or two branch arms
with the same complete start and end location in one map are malformed evidence and must
fail before any counter is mutated. Cross-kind location reuse remains valid because a
statement, function, and branch may legitimately begin and end at the same positions.
Empty or incomplete locations remain conservatively excluded from merge identity and do
not collide.

Repeat invocation is cumulative, not idempotent: each supplied subprocess observation
is added exactly once to the then-current parent counter. For a parent count of two and
a subprocess count of three, two invocations produce eight. It must produce neither the
self-doubled legacy result nor five through accidental deduplication. Inspector
`9b8b288bf83dea1342d1b7084a2253a4fd16e78a` executes that repeat behavior and preserves
the duplicate-location failure; Auditor `dbb1ea5840cb5c3cde8c0e503c199008f7ff5441`
binds the red.

The Auditor must separately sweep every current coverage value in the as-built, remove
unbounded runtime-variable artifact digests, and bind invalidated intermediate readings
to their exact historical evidence rather than the current table. The repair does not
change the unchanged 378-file denominator, four exclusions, 70/60/70/70 floors, source
set, generated classification, skips, or assertion mechanism. B9 must restart at a fresh
candidate with new convergence, rehearsal, manifest, and literal-model review evidence.

This decision authorizes no inferred numerator, broad collision waiver, evidence-value
rewrite outside the exact Auditor sweep, source publication before fresh review PASS,
closure before source merge and exact-main CI, package publication, tag, GitHub Release,
Pages or other deployment, evidence reuse or promotion, real-stynx mutation,
predecessor mutation, or R-0007+ work.

### DII-227 — Aggregate convergent subprocess observations into unique canonical locations
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 DII-226 live-population correction; DII-222; DII-225; DII-226; Inspector 912092f0d3d042fd932b077aa3bd06089de11bb2; authoritative coverage FAIL at branch location 404:9:406:3; Inspector 9fe038682f35674f8cfe26eda6c3e271eb2ee21c; Auditor 968099c2582e8812bb1bcd6e6de9cbdb3985336d`

DII-226 correctly requires unique complete locations in the canonical parent map and
exact cumulative repeat behavior. Its prospective requirement to reject duplicate
subprocess locations is too broad and is superseded only for that subprocess-map case.
The first implementation made all seven then-current focused contracts green, but the
unchanged authoritative coverage command failed on two legitimate source-mapped branch
observations converging at exact location `404:9:406:3`. That failed run has no coverage
or review standing and is preserved as red evidence.

The canonical Istanbul parent map remains the denominator and therefore must contain at
most one complete location per coverage kind. Duplicate complete statement entries,
function entries, or branch arms in that parent map remain malformed and fail before
any mutation. The fourth review measured zero such parent collisions across the real
378-file population.

The subprocess map is observation input rather than the canonical denominator. Multiple
same-kind subprocess observations may source-map to one complete canonical location.
They must be summed within their kind before the aggregate is applied exactly once to
the matching parent counter. A subprocess statement, function, or branch pair carrying
counts one and two at the same complete location therefore contributes three, not the
last observed count, not a duplicate-evidence failure, and not a cross-kind sum.
Incomplete locations remain excluded and contribute nothing.

Inspector `9fe038682f35674f8cfe26eda6c3e271eb2ee21c` preserves the refined red while
keeping canonical-parent rejection, repeat accumulation, degenerate-location exclusion,
exact counters, retention, and reporter behavior green. Auditor
`968099c2582e8812bb1bcd6e6de9cbdb3985336d` binds both the real coverage-command
failure and the focused red. Inspector may correct only the existing provider and must
rerun the focused, ordinary, and unchanged complete-denominator coverage commands.

This correction authorizes no parent collision, cross-kind aggregation, inferred hit,
threshold or exclusion change, denominator or source change, generated relabeling,
skip or assertion-mechanism change, reuse of the failed coverage run, source publication
before fresh review PASS, closure before source merge and exact-main CI, package
publication, tag, GitHub Release, Pages or other deployment, evidence reuse or
promotion, real-stynx mutation, predecessor mutation, or R-0007+ work.

### DII-228 — Reaccept the collision-guarded R-0006 source candidate
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 fourth B9 correction close; DII-223; DII-225–227; R-0006-INDEPENDENT-OPUS-B9-REVIEW-4-FAILURE; Inspector e284a6cb9b2d23eaf5713c34ecf29e324397b355; Architect cef0540a70a62de2222078c63455cd763fa92703; Auditor 72fac684750a157a26b6b867beaa56d045569960`

R-0006's exact semantic implementation subject is Inspector
`e284a6cb9b2d23eaf5713c34ecf29e324397b355`. It preserves incomplete-location
exclusion, exact cumulative repeat merging, and non-additive live-map mutation; rejects
duplicate complete canonical parent identities before mutation; and aggregates
same-kind subprocess observations that converge on one complete canonical location.
Architect `cef0540a70a62de2222078c63455cd763fa92703` is the caused trace projection,
and Auditor `72fac684750a157a26b6b867beaa56d045569960` binds the final pre-review
as-built and coverage evidence.

The unchanged 378-file denominator and four exclusions pass the unchanged 70/60/70/70
floors at statements 71.86% (16,093/22,393), branches 60.14% (11,658/19,382),
functions 80.67% (2,479/3,073), and lines 73.27% (14,936/20,383). The stable summary
digest is `c4d75618fbc39602b4b01e9059e74249cf1e78a862f7176f770511ea177aa17b`;
the retained statement artifact is runtime-variable and has no durable cross-run
digest. The ordinary and coverage suites pass 155 files and 1,458 tests with eight
declared skips. Trace binds 34 invariants, 155 test sources, and 2,784 lexical assertion
sites. The action surface remains 147 runnable, 38 folded, and one tombstoned identity;
the operational-value extraction remains 24 rows; mutation strength and evidence
aggregation remain separate.

All four B9 Opus FAILs, the overbroad DII-226 implementation red, the refined
subprocess-aggregation red, and every earlier honest coverage red remain immutable
evidence without review standing. The fourth review's P1 and P2 evidence-value defects
are removed by a same-class Auditor sweep. Its repeat-merge and collision findings are
exercised behaviorally across statements, functions, and branches. DII-225's remaining
bounded nonblocking observations stay visible and are not restated as implemented
controls or readiness claims.

DII-223 is refreshed as the closing decision used by the production phase-close verb;
this decision supplies its final correction provenance. The complete source candidate
must still converge twice, rehearse source and closure ancestry in isolation, generate
a fresh candidate-only manifest, and receive a fresh read-only PASS through the literal
`claude-opus-5` selector. Any finding or failed required gate stops execution and
invalidates all candidate state. After PASS, only the exact Auditor review record may
form the review envelope, and the published head must converge twice again before push.

This decision does not itself claim review PASS, source publishability, push, pull
request, merge, exact-head or exact-main CI, PC-0007, final closure, package publication,
tag, GitHub Release, Pages or other deployment, evidence reuse or promotion,
real-stynx mutation, predecessor mutation, or R-0007+ work.

### DII-229 — Require content-addressed convergence and an exhaustive review census
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 B9 OM-011 convergence-control correction; Owner interruption before independent-review iteration 5; DII-207; DII-208; DII-222–228`

R-0006 B9 replaces all-or-nothing local re-execution with a conservative
content-addressed task DAG. This decision narrowly supersedes DII-227 only where its
nonclaim against evidence reuse would prohibit reuse of a byte-identical local PASS;
DII-227's exact-location aggregation, collision, denominator, exclusion, and coverage
semantics remain unchanged. OM-010 remains active except for the same OM-011-bounded
local execution-result reuse.

Each task key binds the freshness-policy version, task ID, exact argv and repository-
relative cwd, its complete configured input population from the live worktree including
dirty, untracked, deleted, and renamed states, dependency task keys, required output
paths and digests, package manifests and lockfile, TypeScript and Vitest configuration,
setup/helpers/generators, controlling law/policy/schema inputs, toolchain versions, and
an allowlisted environment fingerprint. Values of secret-bearing environment entries
are never emitted; the policy admits presence or a one-way digest only. Runtime cache
lives exclusively below ignored `.devai/state/` and timestamps have no standing.

A task may be `SKIPPED_FRESH` only from a schema-valid prior `EXECUTED_PASS` or
transitively valid `SKIPPED_FRESH` result with the identical task key, fresh dependency
keys, and still-present byte-identical required outputs. Every skip records its task key,
input digest, producing candidate, and reused result digest. All other tasks report
`EXECUTED_PASS`, `EXECUTED_FAIL`, or `BLOCKED`. FAIL, stale, malformed, tampered,
unknown, dynamically ambiguous, or incomplete graph state cannot skip and widens to the
configured broader task population. Remote CI detects its untrusted context and executes
the complete authoritative gate set without accepting local cache.

The task graph is conservative: a changed test executes itself; a changed source
executes every known transitive dependent test; shared helpers, configuration, lockfile,
or toolchain inputs invalidate their complete dependent population; and any unresolved
relationship selects the broader suite. The ordinary and tier tasks therefore admit
broad input populations when exact static dependency knowledge is incomplete. This is a
correctness boundary, not an optimization failure.

Coverage is an indivisible whole-only task. Its key binds every production, test,
provider, coverage-configuration, threshold, denominator, package, toolchain,
environment, and policy input. Reuse additionally requires every configured retained
artifact to exist at its recorded digest. Any such input or output change reruns complete
coverage. Partial coverage merging is forbidden and no threshold, source set, or
exclusion changes.

Before review, workspace tooling generates a deterministic review-scope manifest from
the exact declared-base-to-candidate changed-path population, the configured R-0006
requirement sources, controlling law/policy, all four prior B9 review failures, and the
current plus retained previous candidate manifests. Every topic has exactly one stable
topic ID and the required claim, governing paths, current and previous digests, changed
status, required adversaries, previous findings, freshness proof, and required
disposition. Previous finding classes remain topics after repair.

The review record is invalid unless the manifest topic population and record
dispositions are a bijection. Each topic receives exactly one `RECHECKED_PASS`,
`RECHECKED_FAIL`, `REUSED_FRESH_PASS`, or `BLOCKED`; omission and duplication fail.
Unchanged does not permit omission. `REUSED_FRESH_PASS` requires the reviewer to
independently recompute the topic digest, inspect the freshness proof, and explain why
the invariant still holds in the current candidate.

The first review cycle is exhaustive discovery and continues after finding a blocker so
all findings and same-class populations are returned together. Repairs cover the whole
defect classes in role-pure batches. The second cycle is one complete re-review. A
cycle-2 failure stops and escalates with a process/root-cause report; no third automatic
cycle begins. The two-cycle budget never forces PASS.

This decision does not itself claim that the task DAG, cache, review census, schemas,
tests, audit, smart convergence, review candidate, review PASS, publication, remote CI,
merge, PC-0007, closure, or release exists or passes. Review iteration 5 remains blocked
until the complete OM-011 correction is committed and green.

### DII-230 — Disclose the immutable OM-011 exact-scope sequencing defect
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 OM-011 smart-convergence failure at candidate a81969865cf237e5a13c351de828dec066f5b065; DII-229; Inspector 0215430f21649fb81650df312cbddef9e1e92b4c; Engineer ec68086260b0f9d5e13656c05504681ab253d1a7; Auditor 8748242782fb265359ea28cec4e640741f700a90`

The first authoritative OM-011 smart-convergence pass executed fifteen tasks green,
including whole coverage, then failed closed at `ci:governance`. The exact sequencing
finding was that substantive Engineer commit
`ec68086260b0f9d5e13656c05504681ab253d1a7` had zero admitted bindings.

That commit followed DII-229 and the prior 16-case Inspector red
`0215430f21649fb81650df312cbddef9e1e92b4c`. The red behaviorally exercises the task
cache, package commands, schema integration, and controller, and it later passes with the
complete suite. Its immutable source nevertheless names only `package.json` and
`scripts/run-round-close-controls.mjs` from the Engineer commit's exact four-path
population. It does not literally name `.devai/config/round-close-controls.json` or
`packages/schemas/src/roster.ts`, as required by the prospective semantic-scope rule.

No truthful binding can be created after implementation because the missing literal
scope was not present in the prior Inspector source. The governed-sequencing policy
therefore classifies only exact commit `ec68086260b0f9d5e13656c05504681ab253d1a7`
as a historical commit exception. Auditor
`8748242782fb265359ea28cec4e640741f700a90` preserves the exact failed gate, complete
implementation paths, coverage reading, and missing-literal population. History is not
rewritten, the real defect remains visible, and this classification grants no
prospective exception to any later Engineer commit.

The failed smart-convergence state remains invalid and must be rerun at a fresh head.
All content-addressed key, output-digest, remote-cache, whole-coverage, review-census,
two-cycle, exact-candidate, candidate-only clone, review-freeze, publication, and remote
CI gates remain unchanged.

This decision does not claim a green smart convergence, rehearsal, candidate or review-
scope manifest, ready-to-review SHA, independent review, PASS, publication, merge,
PC-0007, closure, or release. Review iteration 5 remains blocked.

### DII-231 — Reaccept R-0006 after the exhaustive cycle-1 evidence sweep
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 exhaustive cycle-1 correction; OM-011; DII-207; DII-223; DII-228–230; R-0006-INDEPENDENT-OPUS-B9-REVIEW-5-FAILURE at Auditor 2e02d31c9504d4ee63dbe05f40084466292aff99; Auditor 7c0fc17e4c9543c31db9f3f563e5b9e65d220c67; Inspector 5846718c3947ddce6b3bb67b296796bcc275dcb9`

The first OM-011 exhaustive review cycle bound exact candidate
`93894da782af3943e2447f43e81e5e69cbdc73fa` and independently regenerated all 207
mandatory topics. It returned FAIL on four topics in one complete defect class: active
Auditor as-built and Architect source-close prose still presented superseded coverage,
suite, trace, governed-range, and sequencing-exception readings as current. The review
continued after the first blocker, preserved 203 passing dispositions, and disclosed
the complete stale-current-evidence population rather than issuing a partial verdict.

Auditor `2e02d31c9504d4ee63dbe05f40084466292aff99` preserves the exact FAIL and all
207 topic dispositions. Auditor `7c0fc17e4c9543c31db9f3f563e5b9e65d220c67` refreshes
every Auditor-owned current claim and binds older figures only to their exact historical
subjects. Inspector `5846718c3947ddce6b3bb67b296796bcc275dcb9` performs the same
historical binding for the KNOWN-RED coverage narrative. This decision and the amended
source-close handoff complete the Architect-owned sweep. No production, threshold,
exclusion, denominator, skip, assertion mechanism, task result, or prior immutable
evidence is changed.

At this decision's committed candidate, the exact declared-base range contains 135
commits: 41 Architect, 41 Auditor, 13 Engineer, 39 Inspector, and one Owner. The current
378-file coverage summary remains statements 16,094/22,393 (71.87%), branches
11,659/19,382 (60.15%), functions 2,479/3,073 (80.67%), and lines 14,936/20,383
(73.27%), above unchanged 70/60/70/70 floors, with stable summary digest
`ac29412270641af7c8f3ca8276fcf3ae4cc48a81c425fe904c185f4c7c79e08c`. The ordinary
suite has 156 files, 1,479 passing tests, and eight governed skips. Trace has 34
invariants, 156 test sources, and 2,839 lexical assertion sites. The sequencing policy
has four R-0006 exception entries covering five exact immutable implementation commits;
the separate role-path policy still has two exact classifications.

These values have no candidate standing until the committed head passes fresh
content-addressed smart convergence, isolated rehearsal, candidate-manifest generation,
and complete review-scope generation. Cycle 2 is the one permitted complete re-review
through literal `claude-opus-5`. A failed or blocked cycle-2 topic stops and escalates
to the Owner; no cycle 3 is authorized. After PASS, only the exact Auditor review record
may form the review envelope, and the published head must reconverge before push.

DII-231 is the closing decision for production PC-0007; DII-207 remains the declaration.
PC-0007 may be emitted only from an all-green exact-main source merge, on a closure-only
branch, and must bind that source merge with release disposition `none-needed`.

This decision does not itself claim cycle-2 PASS, source publishability, push, pull
request, remote exact-head CI, merge, exact-main CI, PC-0007, closure, package
publication, tag, GitHub Release, Pages or other deployment, evidence promotion,
real-stynx mutation, predecessor mutation, or R-0007+ work.

### DII-232 — Bind cycle-1 failure classes into the cycle-2 review census
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 cycle-1 finding-retention correction; OM-011; DII-229–231; Inspector 1771b0b; Auditor 2591fe9`

OM-011 requires the one permitted cycle-2 review to recheck every mandatory topic and
every defect class found by cycle 1. The canonical review-scope policy nevertheless
listed only independent-review failure records 1 through 4. Consequently, the fresh
208-topic scope generated at Architect `66020a3414212104354d4dcb805161981e3cd96c`
omitted the two P1/P2 classes preserved by cycle-1 failure record 5 even though the
policy declared prior findings mandatory.

Inspector `1771b0b` preserves the exact red contract: the canonical policy must include
failure record 5, and that record must expose both findings through the governed
machine-readable heading form. Auditor `2591fe9` changes only those two heading levels;
the preserved FAIL verdict, topic dispositions, evidence, and review-cycle accounting
remain unchanged. This decision adds failure record 5 to the canonical prior-review
population. The executing Engineer must regenerate the committed machine mirror from
this source before any fresh candidate machinery may pass.

Cycle 2 has not begun. It may begin only after a fresh committed head passes the full
floor, smart convergence, isolated rehearsal, candidate-manifest generation, and a
complete review-scope census that includes both cycle-1 finding classes. A cycle-2 FAIL
or BLOCKED result stops and escalates to the Owner; no cycle 3 is authorized.

This decision does not claim green materialization, convergence, rehearsal, candidate
identity, review-scope generation, cycle-2 PASS, publication, merge, PC-0007, closure,
release, deployment, evidence promotion, real-stynx mutation, predecessor mutation, or
R-0007+ work. DII-231 remains the closing decision unless a later Architect decision
reaccepts the final corrected candidate.

### DII-233 — Reaccept R-0006 after the retention-close failure
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 retention-close correction; OM-011; DII-229–232; Engineer 6a581a9a9c1586d73a604108b845e5af5ef573c8; Auditor 0f22cfa5bb56e418086c14ef834a2e56590f6793; Inspector 547351f7d87086b601d4c11a811855ce9d2f57af; R-0006-OM-011-CYCLE-1-RETENTION-CANDIDATE-FAILURE`

The first candidate after DII-232, exact head
`6a581a9a9c1586d73a604108b845e5af5ef573c8`, kept a clean worktree and passed 13
of 16 smart-convergence tasks. It failed `trace` and dependent `stage1` because the
new Inspector retention contract had not yet been projected into `law/trace.json`. It
also failed `governance` because the committed policy materialization was substantive
Engineer work with zero governed-sequencing bindings. No second convergence pass,
rehearsal, manifest, review, publication, or closure step began.

Auditor `0f22cfa5bb56e418086c14ef834a2e56590f6793` preserves the complete failed
candidate evidence. Engineer `6a581a9a9c1586d73a604108b845e5af5ef573c8` followed
this register's DII-232 law and the real Inspector red at `1771b0b`, but the immutable
failing Inspector source did not literally name the exact implementation path
`.devai/config/round-close-controls.json`. A prospective binding cannot be invented
after implementation. The governed-sequencing policy therefore classifies only that
exact Engineer commit as a historical exception. Inspector
`547351f7d87086b601d4c11a811855ce9d2f57af` now binds both canonical and materialized
paths for every prospective retention change; the classification grants no future
bypass. This commit also regenerates the deterministic trace from the complete current
Inspector source population.

At this decision's committed candidate, the exact declared-base range contains 142
commits: 43 Architect, 43 Auditor, 14 Engineer, 41 Inspector, and one Owner. The
ordinary suite passes 156 files and 1,480 tests with eight governed skips. Trace binds
34 invariants, 156 test sources, and 2,845 lexical assertion sites. The unchanged
coverage summary remains statements 16,094/22,393 (71.87%), branches 11,659/19,382
(60.15%), functions 2,479/3,073 (80.67%), and lines 14,936/20,383 (73.27%), with
summary digest `ac29412270641af7c8f3ca8276fcf3ae4cc48a81c425fe904c185f4c7c79e08c`.
The sequencing policy now has five R-0006 exception entries covering six exact
immutable implementation commits; the separate role-path policy retains two exact
classifications.

DII-233 is the closing decision for production PC-0007; DII-207 remains the
declaration. This candidate has no standing until fresh smart convergence, isolated
rehearsal, candidate-manifest generation, and the complete review-scope census pass.
Cycle 2 remains the one permitted complete re-review through literal
`claude-opus-5`; FAIL or BLOCKED stops and escalates to the Owner, and no cycle 3 is
authorized.

This decision does not itself claim convergence, rehearsal, candidate identity,
cycle-2 PASS, publication, remote CI, merge, PC-0007, closure, package publication,
tag, GitHub Release, Pages or other deployment, evidence promotion, real-stynx
mutation, predecessor mutation, or R-0007+ work.

### DII-234 — Govern OM-012 complete-class repair and review-until-PASS continuation
`type: decision · status: active · authority: Architect · provenance: session-draft OM-012 complete-class correction; R-0006-INDEPENDENT-OPUS-B9-REVIEW-6 at Auditor 33d1fa3; Inspector ab471b4; R-0006-OM-012-COMPLETE-CLASS-REPAIR-RED-EVIDENCE at Auditor 1856372`

The literal cycle-2 review of candidate
`ab4721b09ef3dde327c5d660fdf78b542cc85a66` dispositioned all 211 mandatory topics
and returned FAIL on five. The failure invalidates that candidate, convergence,
rehearsal, manifests, and publication standing. OM-012 supersedes only OM-011's numeric
two-cycle cap and terminal stop, authorizing R-0006 to continue through complete-class
repairs and as many fresh exhaustive reviews as are required for a real PASS.

Every review remains read-only through literal `claude-opus-5` with no fallback,
continues after blockers, and dispositions every machine-censused topic exactly once.
Any FAIL or BLOCKED disposition invalidates its exact candidate and returns to
role-pure complete-class repair, full gates, two-pass content-addressed convergence,
candidate-only identity proof, isolated closure rehearsal, fresh manifests, and a new
complete review. No failed result, omitted topic, stale input, transport failure, or
cycle count may manufacture PASS.

The review-scope population is no longer maintained as an enumerated list that can omit
the newest failure. It is derived from the exact governed B9 review-record glob at the
candidate revision, so every preserved prior P0-P3 class remains mandatory. The final
PASS always lands at
`work/audit/R-0006/independent-opus-b9-review-final.md`, independent of its cycle
number; canonical policy, committed materialization, review-check, and review-envelope
behavior must agree on that one destination.

Active Auditor documents that state volatile trace, sequencing, review-census,
coverage, suite, range, or operational-value readings must not rely on manually copied
current prose. The policy names their structured claim blocks. The close controller
must derive each governed value from `law/trace.json`,
`law/policy/governed-sequencing.json`,
`law/policy/operational-values.json`, and the candidate's complete prior-review
population, reject missing, extra, malformed, or unequal claims, and reject unbound
current numeric prose outside the block. Historical values remain permitted only when
bound to an exact 40-hex subject in their paragraph.

DII-226 parent-location uniqueness applies to the whole complete parent coverage map,
not only files also observed by a subprocess. The Inspector provider must validate all
parent files before applying any subprocess aggregate; subprocess same-kind duplicate
observations still sum once at one canonical parent location. This changes no hit,
denominator, threshold, include, exclusion, or whole-coverage rule for the current
artifact, whose independently reviewed parent population had zero collisions.

Inspector `ab471b48066853085f4978536aade0a7605142c1` establishes four exact red
adversaries and literally binds `scripts/run-round-close-controls.mjs`,
`.devai/config/round-close-controls.json`, and
`tests/config/subprocess-v8-coverage-provider.ts`. Auditor evidence at `1856372`
preserves the focused and full-floor failures. Implementation may now proceed only in
those exact role-owned paths, followed by Auditor claim reconciliation and a fresh
Architect reacceptance decision before another candidate is reviewed.

This decision does not claim green implementation, corrected Auditor prose,
convergence, rehearsal, candidate identity, review PASS, publication, remote CI, merge,
PC-0007, closure, release, evidence promotion, real-stynx mutation, predecessor
mutation, or R-0007+ authority.

### DII-235 — Reaccept R-0006 after the OM-012 complete-class correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 OM-012 reacceptance; DII-234; Inspector ab471b4 and f749995; Auditor 1856372, 3c0879a, 1075c20, and c7b525f; Engineer 4f1af9e and 69dc9b8; Architect 5b76908`

The complete-class repair ordered by the literal cycle-2 FAIL is implemented. Inspector
`ab471b48066853085f4978536aade0a7605142c1` preserved four failing adversaries across
the whole-parent coverage population, stable final-review destination, machine-derived
Auditor claims, and Owner-authorized cycle continuation. Inspector
`f749995` validates every complete parent file before any subprocess aggregate, while
preserving DII-227 same-kind subprocess summation and every denominator, threshold,
include, and exclusion rule.

Engineer `4f1af9e` and `69dc9b8` implement the version-2 close policy: the prior-review
population is derived at the exact candidate revision, every positive review-cycle
number is admitted under OM-012, the final PASS record has one stable path, and
`policy-check` derives the governed Auditor claim block from canonical trace,
sequencing, operational-value, and prior-review sources. The committed
`.devai/config/round-close-controls.json` mirror is byte-identical to its Architect
source. The behavior is scoped to the successor version-2 policy and does not rewrite
the frozen version-1 entry-control fixtures.

Auditor `3c0879a` removes the complete stale-current prose population, corrects the
17-direct-row versus 16-distinct-direct-home arithmetic, and makes structured
machine-derived blocks the only current numeric authority for the governed values.
Auditor `1075c20` exposes the exact sequencing observation required by the prospective
binding. Architect `5b76908` binds both Engineer commits to the prior two-test red,
regenerates the trace, and preserves all historical exceptions. Auditor `c7b525f`
demonstrates the control by reconciling the resulting 2,853-site trace reading only
after `policy-check` rejected the prior 2,845 value.

At exact Architect subject `5b76908865da9319859b9931598647a51eb41625`, the minimum
floor passes 156 test files with 1,482 tests passing and eight governed skips. Trace
verifies 34 invariants, 156 test sources, and 2,853 lexical assertion sites. The focused
OM-012 population passes 32/32, entry-control plus smart-convergence passes 57/57,
canonical policy-check passes, and governed sequencing passes its exact 152-commit
population. These readings authorize fresh candidate machinery only; they
do not reuse the invalidated candidate `ab4721b09ef3dde327c5d660fdf78b542cc85a66`
or any of its manifests, convergence, rehearsal, or review standing.

DII-235 is the current closing decision for production PC-0007; DII-207 remains the
declaration. R-0006 must still pass complete smart convergence, whole coverage,
candidate-only manifest generation, isolated source/closure rehearsal, exhaustive
review-scope generation, literal `claude-opus-5` read-only PASS, exact review envelope,
published-head reconvergence, source PR and exact-SHA CI, source merge and exact-main
CI, then the closure-only PC-0007 PR, merge, and final exact-main CI.

This decision authorizes no package publication, tag, GitHub Release, Pages or other
deployment, evidence promotion or reuse, real-stynx mutation, predecessor mutation, or
R-0007+ work.

### DII-236 — Govern the complete active-document current-claim population
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 cycle-3 complete-class correction; R-0006-INDEPENDENT-OPUS-B9-REVIEW-7-FAILURE at Auditor aa57003; Inspector c4c1758; Auditor ee09665 and 888d530`

The literal cycle-3 review of exact candidate
`ee98663d639f7728ef07a3d097310659777b92ab` regenerated all 238 mandatory topics and
returned FAIL on three. The exact defect class was the same stale-current class reported
in cycles 1 and 2: the active Architect source-close handoff retained a 2,845-site trace
reading and five-record review census after machine truth had moved to 2,853 sites and
six preserved failure records. The controller correctly governed two Auditor documents
but its enumerated document population omitted the active Architect handoff.

Auditor `aa57003` preserves the complete 235/3/0 disposition census. Inspector
`c4c1758ccf40a7269721b7cacde1a2fafa6cdbec` proves that the active source-close path is
absent from the policy and binds the canonical policy, committed materialization, and
source-close repair paths. Auditor `ee09665` preserves the exact full-floor red with 155
files and 1,482 tests passing, one expected failure, and eight skips; Auditor `888d530`
reconciles the now-seven-record failure population before implementation.

The governed current-claim population covers every active document that asserts the
selected volatile trace or prior-review values, regardless of role ownership. The
Architect source-close handoff therefore carries the same structured machine-derived
block as the Auditor material and removes unbound volatile suite, trace, and
review-census numerics from current prose. Exact-subject historical readings remain
permitted and are explicitly non-current. A stale, missing, malformed, or extra
source-close block must fail `policy-check` with the same closed behavior as an Auditor
document.

The canonical policy now names `work/rounds/R-0006/source-close.md` with trace invariant,
test-source, assertion-site, and prior-failure claims. The executing Engineer must
materialize that canonical policy byte-for-byte into `.devai/config/` before acceptance.
After materialization, the focused contract and full floor must turn green, an Auditor
must confirm the complete-class population, and a fresh later Architect decision must
reaccept the round before candidate machinery restarts. DII-235 is invalidated as the
closing decision by the cycle-3 FAIL; DII-207 remains the declaration.

This decision claims no green materialization, fresh candidate, convergence, rehearsal,
manifest, review PASS, publication, remote CI, merge, PC-0007, closure, release,
evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-237 — Reaccept R-0006 after the cycle-3 complete-class correction
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 cycle-3 reacceptance; DII-236; Inspector c4c1758; Auditor aa57003, ee09665, 888d530, 25d622c, 81c514b, 1246d1a, and b4e8e7a; Architect 17eb61f and 1f6f95f; Engineer 508ce0e`

The cycle-3 complete-class correction is implemented and audited. Inspector
`c4c1758ccf40a7269721b7cacde1a2fafa6cdbec` exposes the omitted active Architect
source-close population and proves stale structured values fail closed. Architect
`17eb61fce741336f97da10d9b0734a0479cee40d` adds that exact path and claim set to the
canonical policy, converts its volatile handoff values to a machine-derived block,
exact-binds historical quantitative prose, and regenerates trace. Engineer
`508ce0ec00915133a349c51ee7c1ce2b753c1b33` materializes the canonical policy
byte-for-byte. Architect `1f6f95fc7c97b4f9081aad1d9e183d01f85b6ed1` binds the
Engineer commit to its exact prior Inspector red and durable Auditor artifact without
an exception.

Auditor `25d622ca1d33f760047688c4dd01887d54f8ce78` reconciles the regenerated trace claim,
Auditor `81c514bb0872bc5ed812bc361bfbd03bb61471c5` normalizes the immutable red observation
for machine sequencing, and Auditor `1246d1a5e99325083f414b82e9b6b4a3d03699cb` audits the
whole repair population. At exact Engineer subject
`508ce0ec00915133a349c51ee7c1ce2b753c1b33`, the focused contract passed 24 cases and
the complete ordinary floor passed 156 files with 1,483 tests passing and eight governed
skips. At exact Architect subject `1f6f95fc7c97b4f9081aad1d9e183d01f85b6ed1`, trace
verified 34 invariants, 156 test sources, and 2,857 lexical assertion sites while
governed sequencing passed its 163-commit population. Auditor
`b4e8e7a67256318adefcb9a26513af0f67cd9f76` corrected the one invented SHA expansion
found by the full floor; the governed SHA gate then passed. Fresh candidate machinery,
not this prose, must derive every later population and result.

DII-237 replaces invalidated DII-235 as the Architect closing decision for production
PC-0007; DII-207 remains the declaration. This decision authorizes fresh smart
convergence, candidate-only identity verification, isolated rehearsal, candidate and
review-scope manifest generation, and a fresh literal `claude-opus-5` exhaustive review.
It does not reuse candidate `ee98663d639f7728ef07a3d097310659777b92ab` or any of its
state. Only a mechanically valid PASS may enter the governed review envelope and serial
source/closure ceremony.

This decision claims no fresh candidate yet, review PASS, publication, remote CI, merge,
PC-0007, closure, release, package publication, tag, GitHub Release, Pages deployment,
evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-238 — Reaccept the cycle-3 finding-class census
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 exhaustive-census reacceptance; DII-237; Auditor b7f41ef`

Auditor `b7f41eff8b58d2e4bc6a1ce0d7b5a494a20811be` normalizes the preserved cycle-3
complete-class heading to the governed `### P1` form. The review-scope generator derives
prior defect classes from that structural form; without this correction the exact
cycle-3 source-close population remained disclosed in prose and dispositions but did
not become a mandatory `previous-finding` topic in the next census. No review was
invoked against that incomplete census.

The correction changes no finding, disposition, digest for the rejected candidate,
source repair, policy, materialization, test, trace, sequencing binding, coverage
reading, threshold, exclusion, or denominator. It makes the already-preserved defect
class mechanically mandatory for every later candidate. DII-238 replaces DII-237 as the
Architect closing decision for production PC-0007; DII-207 remains the declaration.

Fresh smart convergence, isolated rehearsal, candidate-manifest generation, and
review-scope generation must run from the exact DII-238 head. The resulting census must
contain the cycle-3 P1 class before literal `claude-opus-5` is invoked. No state from
candidate `764bc54ab23abb6c09b303bd82e94fb59b9a8ea5` survives this audit and closing-decision
change.

This decision claims no fresh candidate yet, review PASS, publication, remote CI, merge,
PC-0007, closure, release, package publication, tag, GitHub Release, Pages deployment,
evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-239 — Reaccept R-0006 after clean-runner portability repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 remote-CI repair; OM-012; source PR #12 run 30391126864; Auditor 4228116; Inspector 3887da0`

Source PR #12 failed Stage 2 at exact source head
`3bd2faec178ef1d37d9ae37973dc0b2971658f5d`. Auditor
`42281167e3932edf5e1926e36e906e552cb3cc90` preserves the exact failed run: two
fixture-only `git commit-tree` calls relied on ambient Git identity, while a freshness
fixture inherited remote-CI indicators in a test intended to exercise locally trusted
cache behavior. Stage 1, changeset classification, governed repository enforcement,
and fail-closed evidence mode passed; Stage 3 and round gates correctly did not run.

Inspector `3887da00ff3ebc42e026f3a4284ce580e546413d` repairs the complete test-fixture
population. Every raw `commit-tree` call now supplies fixture-local identity, and the
smart-convergence subprocess helper removes inherited `CI` and `GITHUB_ACTIONS`
indicators unless a test explicitly supplies them. With global Git identity disabled
and both remote indicators present in the parent environment, the two affected files
pass all 58 tests. The ordinary full floor remains 156 files with 1,483 tests passing
and eight governed skips. This decision regenerates `law/trace.json` from the repaired
Inspector sources; the population remains 34 invariants, 156 test sources, and 2,857
lexical assertion sites.

The remote failure invalidates cycle-4 candidate
`ccf1907c42267108192bc69122708cf48cf6d378`, its PASS record, review envelope,
published head, and all publication or closure standing. DII-239 replaces DII-238 as
the Architect closing decision for production PC-0007; DII-207 remains the
declaration. A fresh exact candidate must pass the complete local controls and a fresh
literal `claude-opus-5` exhaustive review under OM-012 before source publication may
resume.

This decision claims no fresh candidate, review PASS, publication, merge, exact-main
CI, PC-0007, closure, release, package publication, tag, GitHub Release, Pages
deployment, evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-240 — Apply the R-0006 independent Codex-review substitution
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 Codex-review substitution; OM-013; DII-207; DII-239; external claude-opus-5 session quota blocker`

OM-013 replaces the otherwise-required Claude Opus 5 selector for R-0006 only. The
fresh exhaustive close review must be performed by an independent Codex agent using
explicit `gpt-5.6-sol` in read-only mode. The review record must state that exact model
truthfully and bind the exact candidate, candidate-manifest digest, review-scope digest,
governed range, findings, and every mandatory topic disposition. It must not claim or
reuse Claude, Opus, cross-provider, cycle-4, or prior-candidate review standing.

All OM-011 and OM-012 controls remain binding. The independent reviewer must recompute
the complete machine-generated census, continue after blockers, recheck every prior
finding class including all cycle-4 advisories, disposition every topic exactly once,
and issue PASS only with zero failed or blocked topics and zero P0 or P1 findings. Any
FAIL or BLOCKED result invalidates the candidate and returns to complete-class
role-pure repair with no forced PASS and no numeric cycle cap.

The canonical close-control policy admits `gpt-5.6-sol`, the truthful stable Auditor
record at `work/audit/R-0006/independent-codex-b9-review-final.md`, and both the
historical Opus and new Codex review populations. The executing Engineer must
materialize that policy byte-for-byte and align the workspace controller before the
Inspector accepts the substitution. Fresh convergence, rehearsal, candidate manifest,
and review-scope generation must run from the final reaccepted head; no earlier
candidate state survives these semantic changes.

DII-240 replaces DII-239 as the Architect closing decision for production PC-0007;
DII-207 remains the declaration. Only a mechanically valid exhaustive Codex PASS may
enter the exact review envelope and the existing source and closure-only PR ceremony.

This decision claims no fresh candidate, review PASS, publication, merge, exact-main
CI, PC-0007, closure, release, package publication, tag, GitHub Release, Pages
deployment, evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-241 — Reaccept R-0006 under the independent Codex review control
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 Codex-review reacceptance; OM-013; DII-240; Owner 15fa84c63a2aee72f26881172be93b1914113c41; Architect 9e7718a7628153d482b3203e65154f007d10a7e3; Auditor aae5d538d98cead86863d7f8f4a97c68a4342b77 and 4dfcfcefe44c6091e4dc53af0f512c8a2fb3561b; Engineer 5c290bedf335d4cd65813370e26218588eb8ac2f; Inspector 7edc33b3a4c18e14d02c87ce51c7df0d9f35edf1`

The R-0006-only Codex substitution is implemented and audited. Owner
`15fa84c63a2aee72f26881172be93b1914113c41` records OM-013. Architect
`9e7718a7628153d482b3203e65154f007d10a7e3` binds explicit `gpt-5.6-sol`, the truthful
stable Codex review path, both historical Opus and prospective Codex review
populations, and the unchanged exhaustive PASS threshold. Auditor
`aae5d538d98cead86863d7f8f4a97c68a4342b77` preserves the two stale selector-contract
failures before repair.

Engineer `5c290bedf335d4cd65813370e26218588eb8ac2f` materializes the canonical policy
byte-for-byte and aligns the controller's stable record and model check. Inspector
`7edc33b3a4c18e14d02c87ce51c7df0d9f35edf1` makes the complete active-campaign
selector contract model both narrow Owner exceptions, updates every review-record
fixture to the exact model, and retains literal Opus-only enforcement for unaffected
rounds. Auditor `4dfcfcefe44c6091e4dc53af0f512c8a2fb3561b` reconciles the resulting current claim.

The minimum floor passes 156 test files with 1,482 tests passing and eight governed
skips. The focused selector plus entry-control and smart-convergence population passes
81 tests. Policy-check passes with byte-identical canonical and materialized policy.
The regenerated trace covers 34 invariants, 156 test sources, and 2,869 lexical
assertion sites. Fresh candidate machinery must independently derive every later
identity, digest, gate, census, convergence, and rehearsal result from the final clean
head.

DII-241 replaces DII-240 as the Architect closing decision for production PC-0007;
DII-207 remains the declaration. It authorizes a fresh exact candidate, two-pass smart
convergence, isolated source/closure rehearsal, candidate and review-scope manifests,
and the independent read-only `gpt-5.6-sol` exhaustive review required by OM-013. Only
a mechanically valid PASS may enter the review envelope and serial source/closure
ceremony.

This decision claims no fresh candidate yet, review PASS, publication, merge,
exact-main CI, PC-0007, closure, release, package publication, tag, GitHub Release,
Pages deployment, evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-242 — Contain the Codex substitution sequencing defect
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 Codex-substitution governance correction; OM-013; DII-240; DII-241; Auditor 48a97795b6225e2c67f90b32add5abb6431efb95; Engineer 5c290bedf335d4cd65813370e26218588eb8ac2f; Inspector 7edc33b3a4c18e14d02c87ce51c7df0d9f35edf1`

Fresh smart convergence at exact candidate
`b3d323605834d1f8fea679920c2933701a96ee16` executed the governance task and stopped
on one complete-class finding: substantive Engineer commit
`5c290bedf335d4cd65813370e26218588eb8ac2f` had zero governed sequencing bindings.
Auditor `48a97795b6225e2c67f90b32add5abb6431efb95` preserves the exact task key, input
digest, exit, reproduction, and invalidated candidate standing.

The implementation followed DII-240 and a real two-test selector failure preserved by
Auditor `aae5d538d98cead86863d7f8f4a97c68a4342b77`, but the repairing Inspector commit
`7edc33b3a4c18e14d02c87ce51c7df0d9f35edf1` followed the Engineer commit. It is not
relabelled as a qualifying prior semantic red. Rewriting the role-pure published branch
history would erase the failure chronology, so the governed sequencing policy records
one exact historical commit exception for `5c290bed…`, with no round-wide or
prospective bypass. The complete affected population is that single Engineer commit.

The machine-derived current claim now reports six R-0006 exception entries covering
seven exact commits. Policy-check and governed sequencing must pass from the new clean
head before any candidate, manifest, rehearsal, or review is regenerated. Candidate
`b3d3236…` and its partial convergence have no standing.

DII-242 replaces DII-241 as the Architect closing decision for production PC-0007;
DII-207 remains the declaration. After the exact correction passes, it authorizes only
a fresh candidate, two-pass convergence, isolated rehearsal, new manifests, and the
OM-013 independent `gpt-5.6-sol` exhaustive review. Any new substantive implementation
still requires an ordinary exact prior semantic-red binding; this exception cannot be
copied forward.

This decision claims no fresh candidate yet, review PASS, publication, merge,
exact-main CI, PC-0007, closure, release, package publication, tag, GitHub Release,
Pages deployment, evidence promotion, predecessor mutation, or R-0007+ authority.

### DII-243 — Close the cycle-5 public output-totality gaps
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 Codex cycle-5 complete-class correction; OM-012; OM-013; DII-215; DII-242; R-0006-INDEPENDENT-CODEX-B9-REVIEW-5-FAILURE; Inspector c1cbf28639464de6889ccdd3d37a75867e2d5f9c; Auditor aeb72277213c4cb4d2b38378388731e131ab07d8`

The independent Codex cycle-5 review rejects candidate
`57a736a7db4a54e62a489fdeb647c462e855c17c` on three complete P1 classes. The public
machine-output boundary does not consume bare `--json` on the retained surface,
parameterized `sense run` bypasses its public action identity and authority projection,
and noncanonical handler exits or pre-dispatch exceptions can make the process status
contradict the action-result envelope or escape it entirely. Inspector
`c1cbf28639464de6889ccdd3d37a75867e2d5f9c` exposes all three populations; Auditor
`aeb72277213c4cb4d2b38378388731e131ab07d8` preserves the literal five-failure result
and its exact four-path semantic scope.

DII-215's one-envelope rule applies to the whole public invocation, including
initialization, authority, routing, and handler dispatch. Both `--json` and `--format
json` select the same machine mode and are consumed before the retained handler sees
them. A machine invocation emits exactly one action-result envelope bound to the
canonical public action identity; no internal folded identity, raw SensorReading,
router prose, CAC diagnostic, exception message, or stack may bypass that boundary.
Every error envelope's `error.exit` is the operating-system process status. A legacy
domain or strict exit outside the closed 2–7 transport range maps to contract exit 7,
but its human-mode domain result remains represented truthfully in the structured
error rather than being replaced by fabricated transport prose.

Every one of the 59 registered `sense run <kind>` forms is a read-only projection of
the single public `sense run` action when no write or publication consent is present.
The public parent authority scope may execute the exact registered internal sensor
emitter without reminting the child as a public action. Both machine spellings and
`sense run --list` use the same parent action-result envelope. The registry census,
sensor result semantics, and fail-closed authority boundary remain unchanged.

The Engineer repair is limited to `packages/cli/src/action-output.ts`,
`packages/cli/src/authority/index.ts`, `packages/cli/src/bin.ts`, and
`packages/cli/src/command-router.ts`. It must make the exact Inspector red green,
retain human presentation, and pass the full ordinary floor. A later Architect commit
must bind the Engineer commit to this decision, the prior Inspector red, and the
durable Auditor artifact before R-0006 may be reaccepted.

DII-243 replaces DII-242 as the Architect closing decision for production PC-0007;
DII-207 remains the declaration. Candidate `57a736a…`, its convergence, rehearsal,
manifests, and review have no standing. Only complete role-pure repair, audit,
sequencing binding, and a fresh exhaustive OM-013 Codex PASS can restore publication
eligibility.

This decision claims no green repair, fresh candidate, review PASS, publication,
merge, exact-main CI, PC-0007, closure, release, package publication, tag, GitHub
Release, Pages deployment, evidence promotion, predecessor mutation, or R-0007+
authority.

### DII-244 — Contain and reaccept the complete-population output repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 complete-population correction; OM-012; OM-013; DII-215; DII-243; Engineer a8bec1c66379449c1b3d82879c765fc062cb49a0, f8886676d81e560fc85be3914e7f2e129ebb61c3, 3be16cb1dca53a2614ced355f9de35bb1b65f752, and 2f1a24b4e0f42dd2eacbce1da83ea741b66a2486; Inspector 86934e7, fd2ea61, and aa3e180; Auditor 145cf2989480fd3eac9a51bafa415645acc1b371`

The Owner's pre-review stop condition required observable execution of every retained
public output identity rather than route-only or synthetic evidence. The resulting
machine-readable population executes all 147 retained actions, all 59 `sense run`
kinds plus list under both machine spellings, the actual failure paths of all 13
noncanonical-exit producers, and separate initialization, registry-validation,
authorization, routing, and handler-dispatch throws. It reports no missing, duplicate,
structurally-only, unexecuted, envelope-invalid, exit-mismatched, or semantically
divergent row. Auditor `145cf2989480fd3eac9a51bafa415645acc1b371`
preserves the exact artifact with SHA-256
`6461aadb0185450b30bfb3101230a78760e929a75b8a91c40ece250dfb7a3afe`.

The complete execution also disclosed an immutable sequencing defect in Engineer
`2f1a24b4e0f42dd2eacbce1da83ea741b66a2486`. A post-envelope doctor warning and two
handler catches that swallowed the canonical action-output exit sentinel required
corrections in `packages/cli/src/commands/doctor.ts`,
`packages/cli/src/commands/mutation/run.ts`, and
`packages/cli/src/commands/record/run.ts`, in addition to
`packages/cli/src/action-output.ts`. Those paths exceeded DII-243's exact four-path
limit, and the complete executable Inspector population at `86934e7` followed the
Engineer commit. It is not relabelled as prior red. The sequencing policy therefore
records one exact historical-commit exception for `2f1a24b…`; it grants no round-wide
or prospective bypass.

The three earlier Engineer commits `a8bec1c…`, `f888667…`, and `3be16cb…` remain
ordinarily bound to prior Architect `34784bd…`, Inspector `c1cbf28…`, and Auditor
`aeb7227…`. Their union changes exactly the four implementation paths enumerated by
that prior red. The exception population is exactly one later Engineer commit.

DII-244 replaces DII-243 as the Architect closing decision for production PC-0007;
DII-207 remains the declaration. It reaccepts the verified behavior only for the
remaining pre-review gates: governed checks, focused and ordinary suites, isolated
clean-runner parity, smart convergence, rehearsal, and fresh manifests. The formal
cycle-6 Codex review remains stopped until every such gate is green.

This decision claims no completed pre-review gate set, fresh candidate, review PASS,
publication, merge, exact-main CI, PC-0007, closure, release, package publication, tag,
GitHub Release, Pages deployment, evidence promotion, predecessor mutation, real
external mutation, or R-0007+ authority.

### DII-245 — Reaccept the output gate after pre-review portability repair
`type: decision · status: active · authority: Architect · provenance: session-draft R-0006 pre-review gate correction; OM-012; OM-013; DII-239; DII-244; failed smart convergence at 3581f1e9a6e09174c38df137a89d229d50ad84fc; Inspector 2f9018ff8661806b31ccc68c11871c28c63ae419, 3b91504718268a5376ad5e51dabcfbc9ef5b84e0, and 3e1dab4745ac899f96bf3adf1e370781bcf931a6; Auditor f3469497bbcf9873b4e4ae374f7c643aa6bc3b9b`

Remote-mode smart convergence at exact head
`3581f1e9a6e09174c38df137a89d229d50ad84fc` distrusted all pre-existing freshness
records and continued through all 16 tasks. Fourteen passed. Formatting rejected the
Auditor as-built and population JSON, and coverage completed 158 files with one failed
sensor-envelope case after a child process exceeded its 30-second bound under the full
V8 provider load. No coverage summary was admitted. Auditor `f346949…` preserves the
complete two-gate defect population and does not relabel that convergence PASS.

The repair changes no production path, action identity, sensor behavior, threshold,
coverage denominator, exclusion, provider, or review controller. Inspector `2f9018f…`
and `3e1dab4…` make the executable population writer resolve and apply the repository's
canonical Prettier configuration. Inspector `3b91504…` raises only the affected
synchronous coverage-harness bounds to 120 seconds per child and 360 seconds for the
three-invocation case. A subprocess-V8 focused run passes all six cases. The regenerated
Auditor population remains a zero-failure behavioral PASS and has canonical SHA-256
`32fcbd1c054ee737c7d803a53903e98f1fe1a2ed6f363dca842a719f6b3fb0dd`.

DII-245 replaces DII-244 as the Architect closing decision for production PC-0007;
DII-207 remains the declaration. It reaccepts only the repaired pre-review harness and
artifact. Full coverage, two-pass smart convergence, isolated rehearsal, candidate and
review-scope manifests, and an independent confirmation of the existing 264 topics
must still pass before formal Codex review cycle 6 may begin.

This decision claims no fresh convergence PASS, candidate freeze, manifest, review
PASS, publication, merge, exact-main CI, PC-0007, closure, release, package publication,
tag, GitHub Release, Pages deployment, evidence promotion, predecessor mutation, real
external mutation, or R-0007+ authority.

### DII-246 — Generalize round close into bounded content-addressed convergence
`type: decision · status: active · authority: Architect · provenance: session-draft pre-R-0007 convergence machinery; OM-014; approved campaign; R-0006 closure lessons`

R-0007 through R-0009 use one generic round-close policy and an explicit per-round
profile. The generic engine contains no round, historical mandate, audit destination,
or reviewer-model default. A round profile binds its authorization, plan, prompt,
affected-test graph, semantic obligations, current-claim registry, runtime paths, and
review budget. The profile begins with a model-neutral reviewer slot. Preparation may
validate while returning `ENTRY_BLOCKED_REVIEWER_UNBOUND`; entry fails until exactly
one later active Owner mandate binds one literal independent read-only model with no
fallback.

The affected-test planner is a versioned explicit DAG over governed production inputs,
stable test shards, shared inputs, aggregate gates, outputs, and full-suite and
whole-coverage fallbacks. Local reuse is limited to a structurally valid PASS whose key
binds command, working directory, complete transitive content, dependency keys,
outputs, environment, toolchain, policy, and graph. Unknown or incomplete dependency
proof widens to the full suite. Remote CI executes the complete authoritative
population without trusting local cache, and coverage remains indivisible.

Review scope comes from schema-validated semantic obligations, exact changed paths,
active controls, current claims, prior finding classes, candidate identities, and
convergence evidence. Markdown scanning is only an unregistered-obligation lint.
Structured results disposition every changed and unchanged topic exactly once and bind
the exact candidate, manifest, and policy. Fresh reuse still requires independent
digest and evidence recomputation. Findings include a complete same-class population
query and repair condition; incomplete population is `BLOCKED`.

The state machine admits two substantive cycles only. Cycle 1 is exhaustive; one
role-pure complete-class repair phase invalidates and regenerates every candidate-bound
artifact; cycle 2 reviews the entire new population. Cycle-2 failure becomes
`ESCALATION_REQUIRED`, and cycle 3 is mechanically forbidden. One invalid transport
attempt may retry the unchanged cycle; a second becomes `REVIEW_TRANSPORT_BLOCKED`.

The committed R-0007 profile, graph, obligation registry, and current-claim registry
are prospective preparation. They do not declare R-0007, resolve its reviewer, start
B0, authorize deployment, publish a candidate, promote evidence, mutate real-stynx,
or alter immutable R-0006 evidence. The Engineer must implement and materialize these
contracts, the Inspector must prove their fail-closed cases, and the Auditor must
preserve exact current evidence before this machinery can govern entry.

### DII-247 — Repair the complete cycle-1 convergence-control defect population
`type: decision · status: active · authority: Architect · provenance: session-draft pre-R-0007 machinery review cycle 1; OM-014; DII-246; Auditor 730c969; Inspector 28d0730; Auditor a916695`

The first independent machinery review found eight control classes, F001 through F008,
across reviewer-binding census, authoritative convergence gates, conservative impact
widening, cache identity, review census, canonical result streams, review transitions,
and current-claim recomputation. The authoritative class population is
`work/rounds/R-0007/prior-finding-registry.json`; point repairs do not satisfy it.

The convergence policy command roster is the mandatory ordered gate population. The
affected-test DAG is a supplemental local precision population and may never replace,
omit, or manufacture an authoritative gate result. Both convergence passes bind the
same exact head, start and finish clean, execute or freshly reuse every authoritative
gate, prohibit second-pass writes, and prove semantic equivalence. Remote execution
disables all local reuse.

Owner reviewer authority is discovered only by a complete structural census of every
tracked active Owner mandate carrying the `devai_reviewer_binding` marker. Prose
substrings have no authority. Zero, duplicate, inactive, conflicting, ambiguous, or
fallback-capable bindings block entry. This decision does not create such a binding;
the R-0007 slot remains intentionally unbound.

Review scope requires an independently generated exact-candidate manifest and covers
exactly seven source classes: semantic obligations, changed paths, active controls,
current claims, previous finding classes, candidate identity, and convergence
evidence. Result streams and state transitions are exact-candidate, exact-manifest,
exact-reviewer, and exact-cycle bound. Cycle 2 requires a distinct regenerated
candidate after the one complete-class repair phase; cycle 3 remains mechanically
impossible.

Freshness reuse requires equality of every current record identity and still-fresh
PASS proof for every dependency. Materialized claims are recomputed from resolved
producer arguments, complete source manifests, deterministic extraction, canonical
value digests, and rendered locations. Unknown, dynamic, incomplete, dirty, staged,
untracked, deleted, or renamed inputs widen conservatively, and coverage remains whole
only.

DII-247 is prospective and does not rewrite R-0006 history, start R-0007, resolve its
reviewer, authorize deployment, publish a candidate, promote evidence, or mutate the
predecessor. One complete second review of the regenerated machinery candidate is the
last substantive review authorized by OM-014; a second failure requires escalation.

### DII-248 — Bind remediation review to independently recomputable proof chains
`type: decision · status: active · authority: Architect · provenance: session-draft pre-R-0007 convergence-control remediation campaign 1; OM-015; DII-246; DII-247; cycle-2 result at 5068e5f5b56dd15cd733c9c5d2663b09b2f43c13`

OM-015 authorizes a separately named remediation campaign for the five cycle-2 defect
classes recorded as `C2-F001`, `C2-F005`, `C2-F006`, `C2-F007`, and `C2-F008`. The
authoritative class population is retained beside every earlier class in
`work/rounds/R-0007/prior-finding-registry.json`; no point example can close a class.

Reviewer authority comes only from a complete schema-valid structured marker whose
mandate identifier, active status, exact round, literal model, read-only role, complete
census, budget, retry limit, and forbidden fallback all validate. Mandate prose and
partial markers do not enter the binding census.
The census reads the exact candidate tree, never mutable worktree bytes. Its selected
binding digest is required in the candidate manifest and must match at scope generation,
review validation, state transition, and transport validation. A deleted or unreadable
tracked mandate fails closed rather than crashing or silently shrinking the census.
The repository can authenticate the authorized model and exact review bytes, but no
provider-signed Codex invocation-verification API is available to this controller.
Reviewer execution provenance is therefore an explicit external-orchestration trust
boundary: a role-pure Auditor captures task/invocation ID, selected model, input
identities, and output digest without claiming cryptographic attestation. A self-asserted
receipt must never be described as stronger proof.

Convergence is an independently authenticated exact-base/exact-candidate record with
two complete ordered passes over the authoritative population. Each pass proves clean
boundaries, exact stable head and tree, exactly-once gate results, output and task-key
digests, and semantic equivalence; pass 2 proves no writes. The candidate manifest must
carry the convergence record digest, while both artifacts carry the same independently
recomputed candidate-identity digest. Missing, malformed, partial, stale, substituted,
or cross-digest-mismatched evidence invalidates scope generation atomically.
The exact base is not caller-selected. Before B0 the round profile keeps an explicitly
unbound declaration slot. B0 must add a structured round-declaration marker to its
candidate-tree decision and bind the profile to that decision ID and exact then-main
base. Smart convergence, scope, claims, and review require the caller base, profile
base, candidate-tree marker base, and merge ancestry to agree; the candidate manifest
binds the declaration entry digest. A shortened later-ancestor range fails closed.
The marker validates against `law/schemas/round-declaration.schema.json`; prose does not
declare or move a base.

Review result finding identifiers are globally unique across the canonical JSON or
JSONL stream. A reused topic is accepted only after recomputing its current input
manifest, referenced-evidence manifest and digest, and every required task-freshness key
from current artifacts; copied topic digests or prose have no standing.
An obligation whose required evidence is not yet expressed as mechanically resolvable
references and task nodes is always rechecked and cannot use `REUSED_FRESH_PASS`.
Historical findings are grouped into one mandatory topic per defect class while
retaining every finding ID, origin cycle, origin evidence reference, and disposition;
repeated appearances of one class never create duplicate topic IDs or lose history.

Review state, transport attempts, results, candidate manifests, scope manifests, and
complete-class repair evidence are schema-validated, self-digested, and linked by exact
identity digests. The complete declared transition chain is verified. A second
remediation review requires the authenticated first-run failure, its exact candidate,
manifest, scope and result, a distinct regenerated candidate, and one repair record
covering every failed defect class and affected instance. `PASS`,
`ESCALATION_REQUIRED`, and `REVIEW_TRANSPORT_BLOCKED` are terminal.

Scope-generation failure invalidates and removes only the stale derivative scope; it
never deletes or rewrites authenticated review state or transition history. A terminal
state refuses every new scope, transport, or review transition for the same campaign.

A transport attempt binds the authenticated state that existed before parsing the
payload. Its self-digest never contains a future state digest. The subsequent state
transition may consume the completed transport digest. This one-way order prevents a
transport-to-state-to-transport hash cycle.

Materialized current claims bind and independently recompute resolved producer
arguments, the complete source manifest, producer output, deterministic extraction,
canonical extracted-value digest, and each rendered location's current content digest
and verification digest. The complete ledger is self-digested. A pure topic-count
producer derives its value from candidate primitives and declaration registries without
reading the review-scope artifact; scope then consumes the completed ledger. This fixed
order prevents a claims-to-scope-to-claims digest cycle. Any absent or mismatched proof
field fails the complete ledger.

Claim producers resolve candidate and base identities from the authenticated
convergence primitive, never from the later candidate manifest. A claim unavailable
before publication is retained in the candidate-bound ledger only as a schema-valid
`DEFERRED_POST_PUBLICATION` declaration. After exact-head CI exists, a separate
self-digested post-publication ledger must prove every claim and bind the immutable
pre-review claims digest; it does not rewrite the reviewed candidate manifest.

Dynamic runtime parameters come only from the authenticated convergence primitive or
from a phase-specific, self-digested, candidate-bound runtime-input manifest. The
complete runtime-input population and every input's evidence manifest are independently
recomputed. Git identity and external producer output use explicit virtual source
entries rather than an empty filesystem expansion. Tracked candidate prose contains
stable claim-ID references only: candidate ranges, topic populations, artifact hashes,
and CI receipts remain in ignored structured evidence so proving them never changes the
SHA being proved.

Every declared producer must emit deterministic structured output compatible with its
extractor. The controller supplies side-effect-free JSON-file extraction and file-digest
producer verbs where generic tools do not emit the required shape. Acceptance exercises
the complete live per-round claim registry, not only synthetic one-claim fixtures.
Checkout-dependent producer paths are normalized to sorted repository-relative paths.
The exact-head CI producer also proves that the selected PR's head OID equals the claim
candidate before it accepts the complete required check population; green checks from a
different PR or SHA have no standing. The required-check population is nonempty,
complete, deterministically ordered, and entirely terminal-success.

The affected-test plan and every node result from both convergence passes are retained
in a schema-valid self-digested runtime artifact. Candidate and convergence manifests
bind its digest, and review scope uses that exact digest rather than a changed-path
summary. Post-publication claims have an explicit deterministic materialization phase;
hand-authored receipts have no standing.

Remediation review run 1 at candidate `42ecafda98086ec5d89c738685a342e6a2323299`
failed with six additional complete defect classes, recorded as `R1-F001` through
`R1-F006`. The single OM-015 repair phase binds all six together. They remain mandatory
prior-finding topics in the regenerated scope; repairing a point example or omitting an
affected instance cannot satisfy the repair record.

Every authoritative convergence gate has one versioned gate-specific freshness
profile. That profile declares its complete effective candidate-tree input selectors,
package or gate dependency selectors, executable-version probes, environment inputs,
and required persistent outputs. Expansion of a package script is part of the
declaration, not an implementation shortcut. A cache key is independently recomputed
from the resolved raw-byte input population, dependency results, tool versions,
environment, policy, graph, and current required-output population. Missing, changed,
unresolved, or multiply matched declarations force execution; a gate with no persistent
output records an explicit `none` output contract rather than inheriting an empty
generic output list.

Committed change discovery uses status-aware NUL records from the exact declared range.
Each rename is one authenticated record retaining both preimage and postimage, and the
union of those paths participates in node, shared-input, coverage, fallback, and review
topic matching. The two paths receive distinct exactly-once changed-path topics linked
by the same rename record. Name-only discovery has no standing for impact or review.

Every review disposition, including rechecked PASS, rechecked FAIL, reuse, and BLOCKED,
is evidence-bearing. Validation independently recomputes the exact current input
manifest, evidence manifest and digest, evidence-reference set and digest, every
required task-freshness record, and the disposition proof digest. Reviewer-supplied
digests, paths, or explanatory prose are claims to verify, never authentication.

Before parsing or persisting reviewer transport, `review-check` independently derives
the scope's round, cycle, candidate commit, candidate tree, policy version, and complete
ordered predecessor-candidate-manifest population from the invocation, exact Git
objects, current policy, authenticated state, and repair chain. All six must equal both
the scope fields and its identity proof. A mismatch is a pre-transport identity failure:
it writes no transport artifact, increments no attempt counter, and performs no state
transition.

The review state is accepted only as the tip of one canonical digest chain. State and
cycle must match the declared state graph; every transition has a monotonic ordinal,
cycle, exact predecessor state and transition digests, candidate and manifest identity,
and the result, transport, and repair digests required by that edge. Every nonzero
transport count resolves the complete persisted predecessor-linked attempt population.
A valid result transition consumes the exact successful transport payload digest.
Repair and cycle-2 edges consume the exact prior failure result, failure state,
transport, candidate, scope, and complete-class repair record. Terminal states require
their matching terminal evidence and reject all successors.

Active controls are no longer a profile path allowlist. The controller derives a
self-digested census from raw blobs in the exact candidate tree: active applicable Owner
mandates, the profile decision and its transitive active decision provenance (including
DII-246 and DII-248), the policy itself, every path in the policy schema map, the round
profile, affected-test graph, obligation/current-claim/prior-finding registries, bound
round declaration, and every other tracked manifest referenced by those sources. Each
entry binds a stable control identity, kind, path, active status, derivation edge, and
raw-byte digest. Missing, unresolved, inactive, duplicate-ID, duplicate-path,
conflicting, untracked, or extra entries fail the census atomically. Candidate manifest,
review scope, state, and result all consume the exact census digest.

This decision authorizes implementation and at most two new exhaustive machinery-review
runs under OM-015. It does not start or close R-0007, bind its governed reviewer, alter
R-0006, deploy, publish packages, promote evidence, or mutate the predecessor.

### DII-249 — Close remediation classes by mechanically complete populations
`type: decision · status: active · authority: Architect · provenance: session-draft under direct Owner OM-016; remediation review run 2 at 0dbe660db28261287690ea88762407a8d92ba490; DII-246; DII-247; DII-248`

OM-016 creates a separately named second remediation campaign after the first campaign
exhausted its review budget. The eight Run-2 findings are one complete repair
population. The versioned closure matrix at
`work/rounds/R-0007/remediation-2-closure-matrix.json` binds each finding to its
deterministic population query, complete expected population, adversarial mutations,
exact Inspector test IDs, implementation surfaces, and evidence. Neither a green point
fixture nor a nonempty declaration closes a matrix row.

The authoritative gate roster is exact and ordered. Before candidate freeze the
controller must execute or authenticate one still-fresh PASS for all sixteen commands,
including repository-wide formatting. Gate freshness is conservative by proof: every
profile covers the complete tracked candidate-tree universe and recursively resolved
root-script closure, every declared executable probe, the digest of the complete
process environment without exposing values, policy and graph inputs, transitive
dependency results, and every persistent output. A narrower profile is valid only when
the controller can mechanically prove it is a superset of the expanded command
semantics. Unknown expansion disables reuse rather than shrinking the key.

The affected-test population begins with every tracked candidate path, not a selected
extension allowlist. Known prompt, template, fixture, configuration, and other runtime
assets map to their dependent shards. Any otherwise unclassified tracked change widens
to the full suite and whole coverage. Computed `import`, template import, `require`,
`require.resolve`, `import.meta.resolve`, `createRequire`, `module.require`, `eval`, or
equivalent unresolved loader syntax also widens unless a deterministic resolver proves
the exact dependency.

Review evidence is typed and byte-backed. Candidate blobs, exact Git range and change
records, convergence gate results, active-control census entries, materialized claims,
candidate manifests, and convergence artifacts have explicit resolvers. An unresolved
reference produces no digest and cannot satisfy any disposition. Hashing prose, a
reference string, or a declaration that evidence ought to exist is forbidden.

Review state uses independently reconstructable state and edge identities. Every
transition's declared cycle, from/to state identity, predecessor state and transition,
candidate, manifest, scope, result, transport, and repair links are recomputed from the
exact artifact population. Every persisted transport is revalidated against its exact
pre-attempt state and reviewer/census identity. Every persisted result reruns complete
topic, finding, terminal, and count authentication. Every consumed repair record reruns
schema, self-digest, failure-chain, prior-candidate, manifest, scope, and repaired-class
validation. Terminal states reject successors.

Active controls derive from the exact-candidate structured provenance graph at
`work/rounds/R-0007/control-provenance.json`. The controller starts at DII-249,
traverses DII-246 through DII-248 from structured edges, validates each exact decision
section in `law/register/DECISIONS.md`, validates each Owner mandate container, and then
derives the policy schema map, profile sources, bound declaration, prior-finding
evidence, obligation sources, and manifest roots. Runtime code contains no decision ID
or Owner path population. Profile `additional_controls` is only a linting hint and has
no authority. Every census entry digests the real exact-candidate source blob.

Every reviewer-binding consumer requires an explicit resolved full candidate SHA.
There is no `WORKTREE` authority default. Preparation and status may resolve `HEAD` to
one immutable commit before the census, but dirty tracked bytes never participate.
Missing, abbreviated, ambiguous, or unresolved candidate identity fails closed.

Semantic-obligation coverage binds every governing normative source by exact candidate
blob digest to one or more known stable obligation IDs. Every obligation is covered by
at least one source. Adding, deleting, duplicating, or changing a registry row or a
normative source without regenerating the exact mapping fails scope generation. This
whole-source binding is the v5 unregistered-requirement lint; legacy Markdown regexes
remain non-authoritative.

The complete prior-finding registry retains R2-F001 through R2-F008 alongside every
earlier class. Inspector red contracts and Auditor red evidence precede Engineer
implementation. Before either independent review, the exact matrix, all sixteen gates,
the focused and complete suites, tier gates, whole coverage, sequencing, SHA references,
governance, diff, and clean-tree checks must be green at one frozen SHA. Any semantic
change invalidates that evidence.

This decision authorizes implementation and at most two new exhaustive independent
machinery reviews under OM-016. It does not silently select the governed R-0007 reviewer
model, weaken entry, manufacture PASS, alter R-0006, deploy, publish, promote evidence,
or mutate the predecessor.

## Appendix — Register-consistency guard

This is an implementation note, not an unnumbered decision. A mechanical check
(CI + doctor) asserts no entry above contradicts constitutional text, and that every
entry's provenance resolves into the frozen predecessor or this register. DII-002 and
DII-007 authorize the guard; the guard protects the rest. [closes the ex-Article-27
"six vs three" drift class]
