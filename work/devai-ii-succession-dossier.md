# DEVAI Succession Dossier — operative edition

**Status (2026-07-23, post-R30): the program is EXECUTION-READY pending one human act.**
R30 is **verified closed** in devai-original (PC-0018, D-194/D-195, merge `1993f2ca`, exact-main CI `30036181989`, Release `30036181927`, closeout self-archived `d76cd12d`; rounds ≤30 archived under `docs/meta/rounds/`). **DS-01 is closed and REV-0006 ratified** (Owner marks in session) — REV-0006 is now the W03 product import list. **The terminal decision is drafted in the predecessor's own per-record canon** (`devaii/scratch/pre-plan/D-terminal-draft.md`, provisional **D-196/round-31**), with two ⟦slots⟧ open: the verbatim Owner authorization and the item-9 confirmation (the succession supplants the predecessor's pending in-place v1.0 ceremony). Nothing in devai-original has been modified by this program.

**The wireframe at `../devaii` is the rehearsal result**: 18 commits, every `law/` + `product/` population §5.1-governed, **27 contract tests green**, seven defects caught and graduated to guards (Part X). Pre-plan corpus in `devaii/scratch/`: review drafts REV-0001..0007 (0006 ratified), context packs CTX-01..12, OWNER-DECISIONS.md (closed), D-terminal-draft.md.

## Owner dispositions (all recorded)

1. R29/R30 close in the predecessor first — **satisfied and verified**.
2. Successor decision namespace **DII**; tabula-rasa genesis (empty history) — the clean genesis is the primary goal.
3. DS-1: the experimental arc terminates with the predecessor (a fortiori — R30's scope became governance re-architecture). DS-2: agent-assisted product ratification (done → REV-0006). DS-3: the product stays **DEVAI at 1.0.0**; repos rename at Ω.E (successor takes `devai`); the old site freezes with a superseded banner.

## Contents

| Part | Document | Role |
|---|---|---|
| I | D-record classification report | Absorption manifest 1/2 (D-1..D-188; **Ω.A supplement covers D-189..D-196**) |
| II | Verification addendum | Manifest 2/2 — coverage verdicts, adversarial sampling, coupling inventory (**stale post-R30; re-verify at Ω.A**) |
| III | Succession decision + genesis record | Legal instruments (the "D-189" text is superseded by `D-terminal-draft.md`) |
| IV | Bootstrap round plan | R-Ω (Ω.A–Ω.E) + BR-1 waves W00–W09 |
| V | Succession article (Article 41) | W01 constitutional input |
| VI | New-owner onboarding brief | Orientation (descriptive) |
| VII | Repository layout (final form) | The ratified tree; Article 6 successor table |
| VIII | Surface remediation | Schemas 62→51-roster, CLI 174→~130, guards trio — W02/W05 |
| IX | Deep-subsystem remediation | Sensors registry+FAIL-persistence, docs canon, proofs epochs, population registry, §5.1 record contract — W00–W06 |
| X | Wireframe rehearsal report + post-R30 addendum (§6) | What the rehearsal proved; the verified-R30 deltas; the Owner marks |

## Reading order for the bootstrap operator

Part X (state) → `D-terminal-draft.md` + Part III (instruments) → Part IV as refined by VIII/IX (execution) → VII (layout authority table) → CTX packs per track (`scratch/pre-plan/`) → I/II when classifying or citing. Part VI for newcomers only.

## What remains human

Exactly one act: the verbatim Owner authorization (+ item-9 confirmation) in the terminal decision. Everything else is scheduled work inside R-Ω/BR-1.

---


# PART I — D-record classification report

---

# D-record classification — draft audit report

**Status: DRAFT, speculative session output. Read-only pass; nothing in the repository was modified. Not an official Auditor artifact — if adopted, this content belongs in `docs/work/round-N/audit/` under a declared session.**

Scope: all 185 D-records in `DESIGN-DECISIONS.md` (numbering D-1–D-188; D-102, D-141, D-142 never minted), classified for the proposed register/archive split. Method: four parallel full-body reading passes over record-aligned slices, merged and cross-checked; borderline calls listed explicitly rather than silently resolved.

## Buckets

- **LIVE** — currently-binding operational decision → compact register.
- **PROMOTE** — axiom-grade → constitution or ADR (register holds a pointer only).
- **SUPERSEDED** — retired or premised on facts no longer true → archive only.
- **JOURNAL** — phase/round narrative or closeout → archive only.
- **+EXTRACT** — archive-bucket record embedding a still-binding constraint that must be carried into the register (quoted in §5).

## 1. Totals

| Bucket | Count | Share |
|---|---|---|
| LIVE | 64 | 35% |
| PROMOTE | 16 | 9% |
| SUPERSEDED | 13 | 7% |
| JOURNAL | 92 | 50% |
| **Total** | **185** | |

Extract-bearing archive records (JOURNAL/SUPERSEDED+EXTRACT): **31**.

**Register projection:** ~64 live entries + ~30 extracted constraints (many consolidable — e.g. the four REJ rejections, the anti-gaming rules, and the closeout-shape convention each need one register entry, not per-phase restatement) + 16 pointers to constitution/ADR. A realistic register is **70–90 short entries, well under 1,000 lines** — versus 5,077 today. Half the file (92 journal records) moves to archive wholesale.

## 2. Classification table

Format: `D-NN | bucket | note | supersession pointers`.
`EB` = evidence-bound (binds commit SHAs / CI run IDs / hashes — cite from archive, never restate).

### Foundations (D-1–D-35, D-75/76)

| D | Bucket | Note |
|---|---|---|
| D-1 | PROMOTE | Control-theoretic frame; constitution partially embodies |
| D-2 | PROMOTE | Five substrates × nine properties — substrate model itself |
| D-3 | PROMOTE | Five-role authority model (Article 6 rationale) |
| D-4 | PROMOTE | Embedded npm package vs external control plane (ADR-grade) |
| D-5 | LIVE | Client target stack; framing refined by D-108/Constitution 0.3.0; canonical doc per D-76 |
| D-6 | PROMOTE | Invariant as atomic spec unit |
| D-7 | PROMOTE | Owner→Architect two-tier compilation |
| D-8 | LIVE | trace.json Architect-only; Inspector consumes-never-edits (borderline PROMOTE) |
| D-9 | LIVE | Hybrid invariant domain taxonomy (soft, revisitable) |
| D-10 | PROMOTE | Worktrees + locks + per-task DB isolation model |
| D-11 | SUPERSEDED | Cap of six → D-52 (cap is 3) |
| D-12 | PROMOTE | Coupled triplets, pipelined rebase (borderline LIVE) |
| D-13 | LIVE | Checkpoint-based downstream rebase |
| D-14 | LIVE | Single integration branch, direct task-branch merges |
| D-15 | LIVE | DB-per-task via TEMPLATE clone |
| D-16 | LIVE | Raw SQL migrations, no ORM |
| D-17 | LIVE | Mandatory triage as loop entry (borderline PROMOTE) |
| D-18 | LIVE | Cycles A/B/C, iteration cap on B |
| D-19 | LIVE | Bump-model then escalate; no auto-revert |
| D-20 | LIVE | Tri-state verdicts everywhere (borderline PROMOTE; schema-encoded) |
| D-21 | LIVE | Weakening thresholds = defaults on absent config (partially superseded by D-56) |
| D-22 | LIVE | Flaky quarantine with Auditor pressure |
| D-23 | LIVE | Uniform SensorReading emission contract |
| D-24 | PROMOTE | Hash-chained evidence (Articles 32–33 cover) |
| D-25 | LIVE | Soft-gate evaluator ≠ working agent model |
| D-26 | LIVE | Two-layer tool surface (count claim superseded by D-36) |
| D-27 | LIVE | Noun-verb CLI grammar (soft) |
| D-28 | JOURNAL | Need-driven skill ordering — executed history |
| D-29 | LIVE | Runtime stack (TS strict/ESM/pnpm/Vitest/cac/ajv) |
| D-30 | PROMOTE | Self-application from Phase 0 (Article 36) |
| D-31 | SUPERSEDED+EXTRACT | "22 schemas" stale; schema-canon rules still bind (§5) |
| D-32 | LIVE | Hybrid ID scheme |
| D-33 | PROMOTE | Markdown-for-prose/JSON-for-data (= Article 38) |
| D-34 | SUPERSEDED | → D-53 |
| D-35 | LIVE | Prompts version with skills |
| D-75 | LIVE | Theory/papers layout (note: superseded-in-layout by D-166 — see §6.4) |
| D-76 | LIVE | Meta-rule: operational docs canonical; changes need doc update + superseding D-entry. **Load-bearing for the split itself** |

### Absorption era (D-36–D-60)

| D | Bucket | Note |
|---|---|---|
| D-37 | SUPERSEDED | Two-constitutions framing; factual misread → D-38 |
| D-36 | SUPERSEDED | Tool-count claim; drift never formally re-superseded (§6.2) |
| D-38 | JOURNAL+EXTRACT | stech-law absorption; one-constitution rule + tombstone-ID rule live (§5) |
| D-39 | JOURNAL | Phase-11 absorption plan; resolved by D-40–D-46 |
| D-40 | LIVE | Only Article-6 role names in substrate/docs |
| D-41 | LIVE | rtd-manifest + `devai rtd bundle` |
| D-42 | LIVE | `check prompt-overlays` + unified firewall verdict |
| D-43 | SUPERSEDED | → D-49 |
| D-44 | SUPERSEDED | → D-50 |
| D-45 | LIVE | Standing rejection: no policy-pack schema (soft, revisitable) |
| D-46 | JOURNAL | tools/devai deletion housekeeping |
| D-47 | LIVE | D-entries canonical; ADRs client-facing capability. **Governs the split itself** |
| D-48 | SUPERSEDED | → D-51 |
| D-49 | LIVE | No task replay; reopen only via new D-entry |
| D-50 | LIVE | Sensor tiers L0/L1/L2/semantic + cycle fields |
| D-51 | PROMOTE | Framework-not-product mission (spirit survives D-57's scope extension) |
| D-52 | LIVE | Worktree cap = 3 |
| D-53 | LIVE | examples/ integral, never split out |
| D-54 | LIVE | DB tests opt-in `DEVAI_DB_TESTS=1` (release-evidence lane carved out by D-105) |
| D-55 | LIVE | CI mock LLM; real providers opt-in (same D-105 carve-out) |
| D-56 | LIVE | Weakening config per-project; D-21 defaults on absence |
| D-57 | JOURNAL+EXTRACT | Redox absorption; scope statement + provenance-tag convention live (§5) |
| D-58 | JOURNAL EB | Phase-17 closeout |
| D-59 | JOURNAL+EXTRACT | Codex absorption; deterministic-scaffolder constraint lives (§5) |
| D-60 | JOURNAL EB | Phase-18 closeout |

### Alignment/sensor phases (D-61–D-100) — the journal belt

D-61–D-78, D-79–D-100: **all JOURNAL** (paired phase-plan/closeout records, heavily evidence-bound), with these extract-bearing exceptions carried into the register:

| D | Extract (full text in §5) |
|---|---|
| D-68 | Closeout-shape convention (deletion-gate vs no-deletion closeouts) |
| D-73 | Non-unification lock on the two scorecard skills |
| D-77 | Locked sensor threshold defaults; design-note precondition; carry-forward register |
| D-79 | Design-note-per-sensor discipline (Phase 28+) |
| D-83 | **REJ-1**: backend-aware LLM timeout multiplier permanently rejected |
| D-85 | Three ambiguous-decision defaults (role-bootstrap opt-in; pnpm-audit priority; no-perf-script = UNKNOWN) |
| D-87 | **REJ-2**: migration-runner integration permanently rejected |
| D-91 | scorecard-na overlay ordering; both escape hatches rejected |
| D-92 | F4×T1/T2 must never enter global `DEGENERATE_CELLS` |
| D-96 | Anti-gaming: never retro-tune `harness_green_main.since` |
| D-97 | Anti-gaming: never lower `test_coverage_depth.thresholds` to flip a cell |
| D-98 | No retroactive outcome reclassification of the 70.2% finding |
| D-100 | Three prohibitions: docs-links knob; `--latest-per-kind` stays opt-in; per-batch checklist must not weaken |

Also standing but journal-hosted: the ritual "cross-repo edits in one session are a category mistake" rule (verbatim in D-63–D-74) — one register entry.

### Rounds 13–18 era (D-101–D-134)

| D | Bucket | Note |
|---|---|---|
| D-101 | LIVE EB | CI verifies / Inspector measures; coverage is evidence not gate; **REJ-3** |
| D-103 | LIVE EB | CI is freshness check, not value-producer; **REJ-4**; canonical CI-scope anchor |
| D-104 | JOURNAL EB | Phase-39 closeout |
| D-105 | LIVE | Full-production readiness lane real-by-default (supersedes D-54/D-55 for release evidence) |
| D-106 | JOURNAL | R14 framing; binding content lives in ADR-DOCS-IA + Constitution 0.2.0 |
| D-107 | JOURNAL EB | R14 closeout |
| D-108 | JOURNAL | Drift-remediation framing; durable artifacts = Constitution 0.3.0 + `sense docs-drift` |
| D-109 | JOURNAL EB | Drift-round closeout |
| D-110 | LIVE | Closure-ceremony mechanism (PC records, ledger, append-only); timing amended by D-134 |
| D-111 | JOURNAL EB | Round judgment |
| D-112 | LIVE | Adoption profiles tier1/2/3; absent = tier3 |
| D-113 | JOURNAL EB | Round judgment |
| D-114 | LIVE EB | @devai-nyx scope + GitHub Packages publish path; external-ADR citation rule |
| D-115 | LIVE | ADR-CI-ECONOMY law; hard/advisory split; never-silently-open |
| D-116 | LIVE | gate-staged profile downgrades only rule 4 |
| D-117 | LIVE | Local-CI-evidence mechanics; forbidden-paths floor never shrinks |
| D-118 | LIVE | GitHub Packages canonical consumption; `devai_version` machine-managed |
| D-119 | LIVE | Vendored constitution + checksum pin canonical |
| D-120 | LIVE | N/A-never-derived doctrine + anti-relabel + chaining (Decision 1 narrowly superseded by D-139) |
| D-121 | LIVE | Root build materializes publish artifacts; sibling-build gate default |
| D-122 | LIVE | CLI provenance; `devai_consumption`; pointer-only ≠ tier3 |
| D-123 | LIVE | hooks install / ci scaffold; forbidden-actions waivers; trace target_type enum |
| D-124 | LIVE | Glob-guards registry (original guard values historical per D-130) |
| D-125 | LIVE | docs.ia.path_overrides; absence = strict |
| D-126 | PROMOTE | Human-supervised baseline — already Constitution 0.4.0 + ADR-HUMAN-SUPERVISED-EXPERIMENTAL-LOOP |
| D-127 | LIVE | Canonical packs ship in core tarball |
| D-128 | LIVE | Raw schemas as public package subpaths |
| D-129 | LIVE | Registry-derived CLI; fail-closed routing; consent flags (detail in ADR-CLI-INFORMATION-ARCHITECTURE) |
| D-130–D-133 | JOURNAL EB | R16/R17/R18 declarations and closeouts |
| D-134 | JOURNAL+EXTRACT EB | Ceremony moves post-merge; refusal without `merged_as`/`release_disposition` (§5) |

### Rounds 19–27 (D-135–D-167)

| D | Bucket | Note |
|---|---|---|
| D-135 | JOURNAL | R19 declaration |
| D-136 | JOURNAL+EXTRACT EB | Authority-enforcement fail-closed boundary + `cli-only` honesty rule (§5); borderline PROMOTE into ADR-003 |
| D-137 | JOURNAL EB | R20 declaration |
| D-138 | LIVE EB | Skills architecture locks: façade-only index, 52-registry ordering, prompts as data, zero-cycle + parity gates |
| D-139 | JOURNAL+EXTRACT | R21 declaration; narrowly supersedes D-120 Decision 1 (§5) |
| D-140 | JOURNAL EB | R21 acceptance; discharged by D-147 |
| D-143 | JOURNAL | GR-1 declaration |
| D-144 | JOURNAL+EXTRACT | Do-not-revert: maxWorkers 50% + bounded schema re-read (§5) |
| D-145 | JOURNAL | R22 declaration |
| D-146 | PROMOTE | Ratifies ADR-005 (actions-run evidence contract); register = pointer |
| D-147 | JOURNAL+EXTRACT EB | R22/0.7.0 shipping; **Node 24 floor** + R20-has-no-separate-closeout rule (§5) |
| D-148 | JOURNAL+EXTRACT EB | R23 declaration; F5 materialization doctrine + CI dispatch floor policy (§5) |
| D-149 | JOURNAL | R23 acceptance; substance in Constitution 0.6.0 + schema API |
| D-150 | JOURNAL+EXTRACT EB | R24 declaration; subprocess-effects registry authorship doctrine (§5) |
| D-151 | LIVE | Consent derivation: fs:worktree-admin → harness-write; change needs Owner decision |
| D-152 | SUPERSEDED | One-time schema completion; posture overtaken by D-156 |
| D-153 | SUPERSEDED | "During R24 only" neutrality; overtaken by D-156/D-158 |
| D-154 | LIVE | effects-check in fixed publish group; explicit-path loading only |
| D-155 | JOURNAL EB | ADR-EFFECTS go/no-go; consumed by D-156 |
| D-156 | PROMOTE EB | INV-DEVAI-020 constitutional: declared ⊇ inferred fails closed; capability never grants authority |
| D-157 | LIVE | Path-domain binds final adapter's canonical target; `state prune` compatibility exception pending Owner decision |
| D-158 | JOURNAL+EXTRACT EB | R25 acceptance; effect-gate failure semantics (§5) |
| D-159 | JOURNAL EB | Coverage correction; consumed by D-160 |
| D-160 | SUPERSEDED EB | Soak checkpoint → D-161 → D-163; completed by D-167/PC-0014 |
| D-161 | SUPERSEDED EB | Calendar floor removed; → D-163 |
| D-162 | JOURNAL | R26 closeout: negative cache measurement; disposed by D-164 |
| D-163 | SUPERSEDED EB | Ordering supersession; counting rule executed by D-167 |
| D-164 | LIVE EB | Twelve locked Actions-evidence promotion boundaries — operative contract (cross-check ADR-005 coverage) |
| D-165 | JOURNAL+EXTRACT EB | Graduation evidence tables; base-parent authorization + revocation rules (§5; duplicated in D-164 §6/§8) |
| D-166 | LIVE | One maintained theory doc; SVG-canonical figures; supersedes D-75 layout |
| D-167 | JOURNAL+EXTRACT EB | R27 live promotion + soak maturation; post-activation invariants restated (§5) |

### R28 (D-168–D-188)

| D | Bucket | Note |
|---|---|---|
| D-168 | PROMOTE EB | Founding independent-completion-evidence doctrine → ADR-006 (**verify clause coverage before archiving**, §7.1) |
| D-169 | JOURNAL | Content-bound skill-record resolution; shipped |
| D-170 | JOURNAL | Independent state observation; shipped ("Why locked" physically misplaced — erratum in D-172, preserve as-is) |
| D-171 | JOURNAL+EXTRACT | semantic-review can never PASS without new Architect decision + closed registry (§5) |
| D-172 | JOURNAL EB | Authority/isolation frame truthfulness; carries the D-170/D-171 placement erratum |
| D-173 | JOURNAL+EXTRACT | Recorder-derived provenance; supported-path rule + non-merge prohibition (§5) |
| D-174 | LIVE | Production authority boundary: `agent skill run` → local claude/codex only; no shell/network/credential/push scope |
| D-176 | JOURNAL+EXTRACT EB | R28-freeze/R29-parallel; R30/R31/R32 serialization gate + 18-skill denominator predicate (§5). Physically precedes D-175 (deliberate) |
| D-175 | LIVE EB | Structured-output contract at local-CLI bridge: closed schemas, no coercion, untrusted provider output, completion-only envelope |
| D-177–D-183 | JOURNAL EB | Correction chain, substance shipped in code/schemas (D-181: default codex model; D-183: weakening measured via `senseTestWeakening`) |
| D-184 | LIVE EB | Feedback-iteration writer contract: exact bounded `{path,find,replace}`, atomic batch, no whole-file overwrite; experimental opt-in + consent |
| D-185 | LIVE EB | Skill-scoped local-validation allowance (lint/typecheck/unit/acceptance shapes only) + explicit non-authorization list |
| D-186 | JOURNAL EB | One-time test-filename rename; executed |
| D-187 | JOURNAL+EXTRACT EB | Campaign acceptance; standing non-promotion prohibitions on the 18 candidates and the mechanism (§5) |
| D-188 | JOURNAL EB | No-package release-observation carrier; consumed |

## 3. Missing / anomalous numbering (archive must record these)

- **D-102**: reserved by D-101 for a closeout that was minted as D-103/D-104. Never existed.
- **D-141, D-142**: reserved by D-139 ("R21 uses D-139 through D-142") but never minted.
- Out-of-order physical placement is deliberate (numbering note at D-131, extended at D-176: numbers are identity, not position): D-75/D-76 sit between D-35 and D-37; D-37 before D-36; D-143/D-144 after D-147; D-166 concurrent with D-165; D-176 before D-175.
- Two textual errata the archive must preserve **unfixed**: D-170's "Why locked" stranded after D-171 (governed by D-172's erratum note); D-120 uses `### D-120:` (colon) vs the universal `### D-NN.` — could break naive split tooling.

## 4. The REJ registry (must survive as first-class register entries)

| REJ | Host record | Rejection |
|---|---|---|
| REJ-1 | D-83 (JOURNAL) | Backend-aware LLM timeout multiplier |
| REJ-2 | D-87 (JOURNAL) | Migration-runner integration for sense-migrate-check |
| REJ-3 | D-101 (LIVE) | Comprehensive coverage on CI |
| REJ-4 | D-103 (LIVE) | Separate CI-side digest verifier |

Plus standing non-REJ rejections: D-45 (policy-pack schema), D-49 (task replay), D-91 (both scorecard escape hatches), D-153/D-157 boundaries. Framing records ritually restate REJ-1/REJ-2 each phase — the register needs each once.

## 5. Extracted standing constraints (verbatim quotes)

Constraints embedded in archive-bucket records; each needs one register entry citing its source record.

1. **D-31**: "All Draft 2020-12, `additionalProperties: false`, tri-state verdicts."
2. **D-38**: "There is now exactly one constitution in DEVAI's substrate: DEVAI's own `CONSTITUTION.md`." / "No npm dependency on `stech-law`." / "Tombstone enforcement — rule IDs MUST NOT be reused once retired."
3. **D-57**: "DEVAI remains a framework with no hosted offering, no SaaS surface, no end-user product UI." + provenance-tag preservation (`REDOX-*`, `CODEX-*`).
4. **D-59**: "Scaffolders are deterministic. Template engine + token substitution. … Generators run from data, not prose — the load-bearing safety call."
5. **D-68**: absorption phases use the D-58/D-60 deletion-gate closeout; alignment phases use the no-deletion shape.
6. **D-63–D-74 (ritual)**: "cross-repo edits in one session are a category mistake."
7. **D-73/D-74**: the two scorecard skills remain separate; unification is a separate future decision.
8. **D-77**: locked threshold defaults — `spec_freshness_days=90`; `test_coverage_thresholds={pass:80, review:50}`; `inventory_adherence.max_orphans=50`; `harness_green_main.threshold_pct={pass:95, review:80}`. Adopters override via pack config.
9. **D-79**: every new sensor kind ships with a design note (`docs/framework/arch/sensors/<kind>.md`).
10. **D-83 (REJ-1)** / **D-87 (REJ-2)**: permanent rejections; "Future phases must not re-propose."
11. **D-85**: `--role-bootstrap` opt-in default false; `pnpm audit` wins when both present; no-perf-script = UNKNOWN, not N/A.
12. **D-91**: N/A override applied AFTER global `DEGENERATE_CELLS`, BEFORE reading-driven verdicts; schema-invalid files hard-fail, absent files no-op; both escape hatches rejected.
13. **D-92**: "Future phases must not absorb F4×T1 / F4×T2 into the global `DEGENERATE_CELLS` set in `scorecard.ts`."
14. **D-96**: never retro-tune `harness_green_main.since` for optics.
15. **D-97**: never lower `test_coverage_depth.thresholds` to flip the cell.
16. **D-98**: no retroactive outcome reclassification against the same methodology.
17. **D-100**: no cross-repo exclusion config for docs-links; `--latest-per-kind` stays opt-in; per-batch verification checklist may extend, never weaken.
18. **D-134**: "`govern phase close` runs at or after the merge that ships the round"; from PC-0007 the verb refuses drafts without `merged_as` + `release_disposition`.
19. **D-136**: no implicit roles, caller-selected principals, replayable decisions, router-only checks, permissive unknown targets, unbounded batches, wildcard mutator exemptions, or false host-enforcement claims; weakening requires new explicit decision ± constitutional amendment. `cli-only` claims nothing about external editors/shells without a verified host adapter.
20. **D-139**: diagnostics are non-recording observations; narrowly supersedes D-120 Decision 1 while preserving its evidence format/integrity/N-A/anti-relabel/attribution rules; canonical SensorReading persistence is a registered, role-declared, write-consented mutation. Root gates exclude discovered nested worktrees.
21. **D-144**: the integration-gate reliability contract (`maxWorkers: '50%'` + bounded schema re-read in `validators.ts compile()`) must not be reverted.
22. **D-147**: Node 24 floor across development, package, template, installed-tarball, and CI contract; R20 ships only through R22, no separate closeout.
23. **D-148**: F5 materialization forward contract — one Architect-owned F1 source per registry; only `devai upgrade`/registered subcommand materializes into `.devai/config/`, byte-identical, under authority/consent; "a checker never writes its own inputs." CI dispatch policy: window 50, ≥20 qualifying runs, floor 80%, target 95%.
24. **D-150**: `docs/framework/arch/subprocess-effects.json` single Architect-owned source; no checker may synthesize or persist declarations.
25. **D-158**: effect gate fail-closed after build/contracts, before merged coverage; under-declaration/unregistered/undispositioned = fail; over-declaration advisory.
26. **D-165**: authorization instance resolves only via `git show <base-sha>:…` from the actual base parent; weekly-audit red / chain failure / revocation restores full execution and requires a new green streak.
27. **D-167**: source PRs remain full; exact-tree, first-parent, revocation, fail-closed fallbacks unchanged; "CI-economy evidence, not production-readiness evidence"; promoted runs never count as qualifying evidence runs.
28. **D-171**: "`semantic-review` can never PASS. A future deterministic PASS requires a separate Architect decision and a closed registry."
29. **D-173**: truthful recorder path is the only supported path for `llm_backed=true && host_mutation_policy=write_requires_flag` skills; candidate outputs report-only, never merged; caller-supplied provenance invalid.
30. **D-176**: R30 may not publish until the accepted R28 dossier and R29's factual shipping result exist and runtime overlaps are reconciled; R31/R32 serial after; denominator predicate = exactly `llm_backed === true && host_mutation_policy === write_requires_flag` (18 skills); concurrent R29 work never counts for R28.
31. **D-187**: all 18 campaign candidates report-only and unmerged; acceptance establishes no readiness/autonomy; the mechanism is not bound as a future assurance gate; native macOS results stay `REVIEW`.

## 6. Findings beyond classification

1. **Half the file is journal.** 92/185 records are round/phase narrative; the alignment-phase belt (D-61–D-100) is 40 records of paired plan/closeout entries that belong with `BUILD-PLAN-ARCHIVE.md`'s era map, not in a decision register.
2. **Count-drift was never formally superseded** — the discipline gap the new baseline should close with a guard. D-31's schema count (22 → 62) and D-36's CLI action count (59 → 119+) drifted via closeout narratives with no superseding D-entry, violating D-36's own instruction. `sense docs drift` now tracks the schema count mechanically; the register should carry no counts at all, only pointers to mechanical guards.
3. **The R28 chain has no clean supersessions.** Later records correct *specific items* of earlier ones while the rest stands; partial-supersession pointers matter more than buckets there. The register entries for D-174/D-175/D-184/D-185 must carry their amendment chains.
4. **D-75 vs D-166 conflict to resolve at register-write time**: D-166 supersedes D-75's papers layout; D-75 should likely move to SUPERSEDED with its pipeline detail folded into D-166's entry.
5. **The split is itself governed by two LIVE records**: D-47 (D-entries canonical, ADRs client-facing) and D-76 (canonical-doc + superseding-entry discipline). The consolidation round must either comply with them or supersede them explicitly first — D-47 in particular constrains how much content may migrate from D-entries into ADRs.
6. **Append-only meta-rules must survive**: revisions are new numbered decisions, never in-place edits; entry numbers are identity, not position.

## 7. Verification work before any execution (Round 1 completion criteria)

1. **ADR coverage checks** (borderline PROMOTE calls hinge on these):
   - D-168's five doctrinal clauses vs ADR-006 — verify each survives verbatim.
   - D-164's twelve boundaries vs ADR-005 — the reuse boundary (§4), first-parent rule (§6), and revocation set (§8) may exist only in D-164.
   - D-136's fail-closed boundary vs ADR-003.
   - D-126 vs Constitution 0.4.0 + ADR-HUMAN-SUPERVISED-EXPERIMENTAL-LOOP.
2. **Resolve borderline buckets** (competing bucket named in §2 notes): D-8, D-12, D-17, D-20 (LIVE↔PROMOTE); D-45, D-94, D-101, D-103, D-181 (severity of standing content); D-110 (LIVE with amendment vs SUPERSEDED); D-174/D-175/D-184/D-185 (LIVE vs JOURNAL+EXTRACT if the register excludes code-embodied rules — decide the register's admission rule first).
3. **Adversarial sampling**: second pass over N randomly sampled JOURNAL records by a different reader looking only for missed standing constraints — the catastrophic failure mode is a silent authority drop.
4. **Coupling inventory** (not yet done): every sensor/test/script binding these files — `sense docs drift`, `docs/_ia/categories.json` allowlist, `sync-docs.mjs`, glob-guards registry, any `### D-` anchored tooling (see the D-120 colon anomaly).


---

# PART II — Verification addendum

---

# Verification addendum — D-record classification draft

**Status: DRAFT, speculative session output. Read-only; nothing modified.** Companion to `d-record-classification-draft.md`; supersedes its §7 open items.

Verification executed: (1) four ADR/constitution coverage checks, (2) adversarial sampling of 51 archive-bucketed records by an independent reader, (3) full tooling coupling inventory. Borderline buckets resolved in §3 below.

## 1. Coverage-check results (PROMOTE pointer viability)

| Record | Verdict | Detail |
|---|---|---|
| **D-126** | ✅ Pointer-sufficient | All four elements verbatim across ADR-HUMAN-SUPERVISED-EXPERIMENTAL-LOOP (operational exactness: three gate flags, terminal states) + Constitution 0.4.0 amendment record (framing). PROMOTE confirmed. |
| **D-168** | ✅ Pointer-viable, 3 fragments to carry | ADR-006 is fully current (integrates the whole D-169–D-188 correction chain; 4/5 flagged clauses verbatim). Gaps: (i) universal form of "judge-only **or otherwise** independently uncheckable evidence never establishes readiness" (ADR states only the semantic-review instance); (ii) the dossier's two mandatory assertions (ADR requires the dossier, not its content); (iii) explicit deferral list naming mutation-strength obligations and aggregation semantics. Carry into ADR-006 (Architect) or note at the pointer. |
| **D-136** | ⚠️ Pointer covers 8/10 | Two clauses sole-carried by D-136: (i) the zero-exemption mutator source gate (189 call sites / 49 files, zero exemptions, must fail on stale fixtures); (ii) the change-control clause — weakening any fail-closed property requires a new explicit decision and, for Articles 6–10, constitutional amendment. Hazard: ADR-003's "No constitutional amendment is required" disposition line can be misread as the opposite. → D-136 stays JOURNAL+EXTRACT with both clauses added to the extract list (report §5 item 19 amended). |
| **D-164** | ❌ Pointer rejected | ADR-005 fully carries only boundaries 2–3. Sole-carried by D-164/D-165: the entire first-parent authorization mechanism (authorization file path, `git show <base-sha>:` resolution, head-only self-authorization prohibition, fail-closed defect list); "malformed authorization" + "explicit revocation" triggers; "Source PRs always run full"; required-check aggregation may never translate a skip into green; "with promotion ignored" on the weekly-audit conjunct; no-manufactured-runs containment. ADR-005 status is stale (still shadow-only/R22-framed, unaware of D-165 graduation and D-167 activation). → **D-164 stays a full LIVE register entry.** Consolidation round should amend ADR-005 (absorb the six items + refresh Status) if a pointer is wanted later. |

Consequence for **D-146** (PROMOTE, "pointer to ADR-005"): the pointer must name ADR-005 *plus* the D-164 register entry until ADR-005 is amended.

## 2. Adversarial sampling result

51 archive-bucketed records audited by an independent reader instructed to refute the classification: **49 confirmed clean, 2 missed constraints** — a survival rate that validates the bucketing while proving the pass was worth running.

1. **D-104** (JOURNAL, stands): the "extend-but-never-weaken" asymmetry and the procedural bar that reintroducing CI-side comprehensive sensor work requires an explicit framing-supersession of D-103 + rebuttal of REJ-4. → fold one sentence into the D-103/REJ-4 register entry.
2. **D-88** (JOURNAL, stands): locked negative default — `harness_green_main.since` is intentionally adopter-specific and **never declared in pack defaults**; not self-documenting anywhere (no design note for that pre-Phase-27 sensor kind). → one-line register entry (report §5 gains item 32).

Also carried out of the sample: D-109's two TODOs (audit `process.exit()` >64KB truncation paths; fail CI on nonzero `skipIfNotBuilt` skips) → candidate backlog items, not register entries. D-172's erratum (the stranded D-170 "Why locked" paragraph) reconfirmed as must-preserve-unfixed. Embodiment verified for all near-misses (R28 corrections, per-batch discipline, IA rules — each pinned in code/schemas/CLAUDE.md/tests).

## 3. Borderline buckets — resolved

**Admission rule (proposed):** the register admits every currently-binding rule *regardless of code embodiment* — code embodies behavior but does not self-document authority or the non-authorization lists; entries whose substance is fully code-and-test-pinned get one-line entries with pointers. Under this rule:

| Record | Resolution | Rationale |
|---|---|---|
| D-8, D-12, D-17, D-20 | **LIVE** | No verbatim constitutional/ADR coverage was verified for any of them; promotion is a later Article-40 option, not a classification outcome. Conservative default: register. |
| D-45 | **LIVE** | Standing rejection foreclosing a schema; rejections are register-grade (cf. REJ registry). |
| D-75 | **SUPERSEDED** | D-166 supersedes the layout; pipeline detail folds into D-166's entry. (Reclassified from LIVE.) |
| D-94 | **JOURNAL**, no extract | Its prohibition's subject cells were proven measurement artifacts; moot. Confirmed by sampling pass. |
| D-101, D-103 | **LIVE** | Confirmed; D-103's entry absorbs the D-104 fold-in. |
| D-110 | **LIVE** with amendment note (D-134 timing) | Core mechanism binds; only ceremony timing amended. |
| D-136 | **JOURNAL+EXTRACT** (extract enlarged per §1) | Pointer to ADR-003 for the eight covered elements. |
| D-146 | **PROMOTE** with dual pointer (ADR-005 + D-164 entry) | Until ADR-005 amended. |
| D-164 | **LIVE**, full entry | Per §1. |
| D-168 | **PROMOTE** conditional on the 3 ADR-006 fragments | Per §1. |
| D-174, D-175, D-184, D-185 | **LIVE** | Authority boundaries and non-authorization lists; admission rule admits them. |
| D-181 | **JOURNAL** | Embodied + test-pinned (`cli-client.ts`, pinned test); confirmed by sampling. |

Final tallies after resolution: **LIVE 65, PROMOTE 16, SUPERSEDED 14, JOURNAL 90** (D-75 LIVE→SUPERSEDED; D-88/D-104 constraints extracted without bucket change; extract-bearing archive records now 33).

## 4. Coupling inventory — what the split may and may not touch

Full table in the verification transcript; the structural conclusions:

### 4.1 Blockers that reshape the round design

1. **Invariant authority anchors (CI hard gate).** `spec validate invariants` resolves full-heading slugs into these files: 32 anchors into `CONSTITUTION.md` article headings, **11 anchors into `DESIGN-DECISIONS.md`** (the verbatim headings of D-57, D-59, D-123, D-124, D-150), 12 into three ADR filenames, 1 into CLAUDE.md. Moving an anchored heading to an archive file fails CI unless the invariant JSONs are updated (Architect) in the same change.
2. **The Actions-evidence promotion gate greps `DESIGN-DECISIONS.md` at future base SHAs** for the `### D-165.` heading (`gate-authorization.ts`). The heading must survive at that path going forward, or the gate code + authorization record change in the same round (Engineer + Architect).
3. **Constitution trim is a runtime-authority event.** The authority policy binds the sha256 of the *entire* `CONSTITUTION.md` including amendment history (`.devai/config/authority-policy.json` digest); any byte change invalidates open authority sessions and requires policy rematerialization via `devai adopt upgrade`. Also `sense docs drift` needs the literal `## Amendment history` heading to bound its live-article scan — trimming must keep the heading (even if the section shrinks to a pointer).
4. **ADR renumbering triggers a dormant validator.** `check adrs` sees only `ADR-NNN-*.md` and enforces gapless numbering + schema front-matter + six mandatory sections. The 10 named ADRs are currently invisible to it; normalizing them means content edits (front-matter, `## Affected Rules`, …), not renames — and three ADR filenames are referenced verbatim by invariants and trace.json.
5. **Root filename renames are effectively prohibited.** `DESIGN-DECISIONS.md`, `BUILD-PLAN.md`, `CONSTITUTION.md` are bound by literal string in: doctor's reading-order + CLAUDE.md/AGENTS.md sync check, the translation-validation role classifier (a renamed register file would silently fall from Architect to Engineer classification), authority-policy path rules (source + materialized), the site sync allowlist, the `docs links` zero-broken contract test, `.prettierignore` freeze entries, the CLI-migration scan exemptions, and inventory checksums. **Design consequence: the register keeps the name `DESIGN-DECISIONS.md`; the archive is the new file** (e.g. `DESIGN-DECISIONS-ARCHIVE.md`, mirroring the BUILD-PLAN precedent) — and the five anchored D-headings plus `### D-165.` must remain in the live file or their anchors/gate be re-pointed in-change.

### 4.2 Loud-failure safety net

No CI `paths:` filter names any of the four artifacts — every coupling flows through tests and sensors that run unconditionally. A missed coupling fails loudly in the suites rather than silently skipping. This makes the split *safe to attempt* under the normal four-gate discipline.

### 4.3 Pre-existing gaps surfaced in passing (candidate backlog items)

- `AGENTS.md`'s "62 JSON Schema files" claim is **not** guarded by `sense docs drift` (claim files default to README + CLAUDE.md only).
- The `SCHEMAS_DIR` glob-guard floor (52) lags the population (62) — legal floor semantics, but stale.
- `DESIGN-DECISIONS.md` is absent from the prompt-firewall `ARCHITECT_RESERVED` list while BUILD-PLAN.md and CONSTITUTION.md are present — asymmetry to fix before relying on the firewall to protect the register.
- `packages/core/src/skills/impl/writers.ts:200` cites "DESIGN-DECISIONS line 826" in a comment — falsified by any split (comment-only).

## 5. Revised round shape (supersedes report §7 / earlier 3-round sketch where they conflict)

- **Round 2 (register/archive)** is no longer docs-only: it necessarily includes Architect edits to invariant JSONs (re-point 11 anchors) *or* heading preservation in the live file, an Engineer touch if `gate-authorization.ts`'s D-165 resolution moves, `.prettierignore`/allowlist/link-sweep updates, and the CLI-migration exemption update. Role sequencing (Architect → Engineer session boundary) must be planned, not incidental.
- **Round 3 (constitution ratification)** must schedule authority-policy rematerialization and open-session invalidation as an explicit step, keep the `## Amendment history` heading, and update the versioned-docs snapshot + `docs/start/status.md` version claim (drift-guarded).
- **ADR normalization** becomes its own sub-batch with per-ADR content work (front-matter + six sections), sequenced before any invariant re-anchoring that targets renamed ADR files.
- **Register admission rule** (§3) should be ratified as part of the round's declaring D-entry, since it decides ~8 classifications.
- Verification for every batch: the standard four gates + `spec validate all` + `check adrs` + `docs links` + `sense docs drift` + doctor self-run — all identified as the binding detectors for this change class.


---

# PART III — Succession decision + genesis record

---

# Succession decision + genesis record — drafts

**Status: DRAFT, speculative session output. Nothing committed; no authority claimed.** Adopting these requires: the succession D-record — Owner authorization + a declared Architect session in devai-original; the genesis pair — Architect authorship in the successor repository. Bracketed `⟦…⟧` values are to be bound at execution time.

---

## Part A — The terminal decision record (devai-original)

Drafted in the house style of `DESIGN-DECISIONS.md`, for appendment as the final substantive record. Number assumes nothing lands between now and adoption (next free number after D-188).

---

### D-189. DEVAI succeeds itself: DEVAI-II is bootstrapped by absorption; this repository closes as the frozen predecessor (locked; Owner-authorized succession)

**Decision.** DEVAI's governance corpus is re-founded in a successor repository, **DEVAI-II**, by the same absorb-and-close pattern this framework applied to its own predecessors (stech-law D-38, tools/devai D-46, redox D-58, codex D-60). devai-original becomes the fifth and final predecessor: its law is distilled, its code absorbed at an exact pin, its record frozen. Article 40 governs amendment, not succession; like the pre-Phase-0 manual version bump (0.1.0 → 0.1.1), this record is the mechanism-of-necessity, exercised once, under explicit Owner authorization recorded verbatim below.

Owner authorization: ⟦verbatim Owner statement, date⟧.

1. **Absorption manifest.** The successor imports law only through the audited manifest: the D-record classification report and its verification addendum at ⟦docs/work/round-N/audit/ paths⟧, bound by SHA-256 ⟦manifest hashes⟧. Final tallies: 65 LIVE register-seeding records, 33 extract-bearing archive records (including the D-88 and D-104 constraints recovered by adversarial sampling), 16 PROMOTE records absorbed into the successor constitution and ADRs, 14 SUPERSEDED and 90 JOURNAL records remaining here. Anything a bootstrap batch wants that is not in the manifest is a new successor decision, never a silent import.

2. **Law transfers; evidence standing does not.** Decisions, invariants, schemas, and doctrine import freely through the manifest. Evidence-earned standings are void in the successor by default. Specifically and non-exhaustively: the D-165 Actions-evidence promotion graduation and its authorization record do not transfer — promotion in DEVAI-II requires a new complete green streak under the D-164 boundaries as re-ratified there; the R25 soak maturation (D-167) and the R28 accepted dossier (D-187) may be cited only as attested predecessor history, never as successor readiness input. The genesis record's `imported_evidence` list is the exhaustive enumeration; each entry carries `attested-historical` (citable, non-load-bearing) or `must-re-earn` (void until re-established). Absence from the list means void.

3. **Numbering tombstone.** Per the D-38 tombstone rule, identifiers D-1 through D-188 are retired with this record as D-189, never reused, and never re-minted in the successor. Reserved-but-unminted D-102, D-141, D-142 are retired unminted. The successor opens a fresh namespace (`DII-N`); its genesis record carries the only authoritative mapping from retired identifiers to successor artifacts. PC-0001 through PC-0016 and all ESC/REJ/INV identifiers are likewise retired; the successor re-mints REJ and INV content under new identifiers via the manifest.

4. **Code absorbs at a pin; it is not rewritten.** DEVAI-II imports `packages/`, `examples/`, and `.github/` machinery at exactly ⟦final-commit SHA⟧ and rebinds them to the successor corpus in role-separated batches (invariant authority anchors, the `gate-authorization.ts` D-165 heading resolution, the vendored-constitution digest, authority-policy path rules, doctor constants, sync allowlists — the full rebind list is the coupling inventory in the manifest). Until a binding is rebound, its check runs against vendored predecessor text; no binding is deleted without a replacement in the same batch.

5. **Package continuity.** The `@devai-nyx/*` scope, the GitHub Packages publish path, the Changesets fixed group, and the semver lineage continue unbroken into DEVAI-II (next release ⟦1.0.0⟧). Consumers (stynx) observe a repository move, not a supply-chain break. `devai_version` machine management (D-118) and the vendored-constitution checksum shape (D-119) carry forward; the checksum re-binds to the successor constitution at its ratification.

6. **The successor constitution is a founding ratification.** DEVAI-II authors CONSTITUTION 1.0.0 fresh: the forty articles with all six devai-original amendments integrated into article text, plus promotions from the manifest's 16 PROMOTE records (with the verified coverage gaps closed: the D-136 mutator source gate and change-control clause; D-168's universal uncheckable-evidence quantifier, dossier-content obligation, and deferral list; the six D-164 boundaries absent from ADR-005). The 0.1.0–0.6.0 lineage remains here, frozen; the successor's amendment history begins at 1.0.0 with a genesis pointer, and the successor constitution adds a succession article so this mechanism-of-necessity is never needed twice.

7. **This repository freezes.** After the closing ceremony, devai-original is archived read-only: no further commits, no edits to any artifact, the two textual errata (the stranded D-170 rationale; the D-120 heading colon) preserved unfixed. The repository is not deleted — unlike the four prior predecessors, it is the evidence substrate the genesis record hash-binds. The successor carries no copy of the journal; this repository *is* the archive.

8. **Ordering.** Succession executes only after the in-flight round state is resolved: either R29/R30 close factually here first, or the Owner explicitly abandons their reserved plans in the closing round's record. Succession never overlaps an open round. The D-176 serialization gates (R30 after the R28 dossier plus R29's factual result; R31/R32 serial) bind the successor's equivalents if those rounds move there.

9. **Closing ceremony.** Per D-110/D-134: the closing round merges, then `devai govern phase close` records the terminal PC entry with `merged_as` and `release_disposition`, the evidence chain is verified one final time, and the final tree SHA, chain head hash, and archive manifest hash are published — these three values are what the genesis record binds. A final read-only Auditor pass confirms the freeze matches this record.

10. **Non-claims.** This decision makes no task-completion, readiness, autonomy, or product claim, in this repository or the successor. The 18 R28 candidates remain report-only and unmerged here, permanently. DEVAI-II opens with zero readiness-bearing standing and earns its own.

**Why locked.** A succession that silently inherited evidence standing would launder unverified claims through a repository boundary — the exact defect class Articles 32–33 exist to prevent. A succession that rewrote or trimmed this record's substrate would destroy the non-repudiation the framework sells. Freezing the predecessor whole, importing law only through an audited manifest, and voiding evidence standing by default is the only shape in which the successor's first constitutional act is not already a violation. Per Article 36, this succession is itself the framework's largest self-application: if DEVAI cannot govern its own replacement, it cannot be trusted to govern anyone else's.

---

## Part B — The genesis record (DEVAI-II)

Two artifacts, per the imported D-33/Article 38 doctrine (prose for judgment, JSON for data): **DII-1**, the founding prose decision; and `genesis-attestation.json`, the machine-checkable binding, validating against `genesis-attestation.schema.json` (the successor's first schema).

### DII-1. DEVAI-II is founded by absorption from devai-original under D-189 (locked; founding record)

**Decision.** DEVAI-II exists as the successor authorized by devai-original's D-189 ⟦link/commit⟧. Its law derives exclusively from the absorption manifest bound there; its evidence standing starts at zero except as enumerated in `genesis-attestation.json`, which is the single authoritative crossing point between the two repositories. The attestation is immutable once ratified: correcting it means a new numbered decision, never an edit. Constitution 1.0.0, the seed register, and ADR-001..N are authored against it. Nothing in this record or the attestation establishes readiness, autonomy, or completion of anything.

### `genesis-attestation.schema.json` — shape sketch

Draft 2020-12, `additionalProperties: false` throughout, per imported schema canon (D-31 extract). Field-level sketch:

- `predecessor` (required): `repo_url`, `final_commit_sha`, `final_tree_sha`, `evidence_chain_head_sha256`, `closing_decision` (const `"D-189"`), `closing_pc_record`, `frozen: true` (const).
- `absorption_manifest` (required): `documents[]` of `{path, sha256}` — the classification report + addendum at their frozen predecessor paths.
- `imported_law` (required): `constitution` `{version: "1.0.0", integrates_amendments: ["0.1.1","0.2.0","0.3.0","0.4.0","0.5.0","0.6.0"], promotion_sources[]}`; `register_seed` `{live_count: 65, extract_count: 33, source: "absorption_manifest"}`; `schemas` `{imported_at: <final_commit_sha>, count}`.
- `imported_evidence` (required, exhaustive): array of `{claim, predecessor_records[], status: "attested-historical" | "must-re-earn", note}`. Absence ⇒ void.
- `tombstones` (required): `decision_ids: "D-1..D-189"`, `unminted: ["D-102","D-141","D-142"]`, `other_namespaces: ["PC-0001..PC-0016", "REJ-1..REJ-4", …]`, `reuse_forbidden: true` (const).
- `identifier_map` (required): array of `{predecessor_id, disposition: "register" | "constitution" | "adr" | "archive" | "void", successor_ref}` — one row per D-1..D-189.
- `package_continuity` (required): `npm_scope: "@devai-nyx"`, `registry: "github-packages"`, `version_lineage_continues_from`, `first_successor_release`.
- `non_claims` (required, const array): no readiness; no autonomy; no task completion; no product candidate; R28 candidates remain report-only in the predecessor; successor standing starts at zero.

### `genesis-attestation.json` — instance skeleton

```json
{
  "record": "GEN-0001",
  "ratified": "⟦date⟧",
  "predecessor": {
    "repo_url": "⟦devai-original URL⟧",
    "final_commit_sha": "⟦…⟧",
    "final_tree_sha": "⟦…⟧",
    "evidence_chain_head_sha256": "⟦…⟧",
    "closing_decision": "D-189",
    "closing_pc_record": "⟦PC-0017?⟧",
    "frozen": true
  },
  "absorption_manifest": {
    "documents": [
      { "path": "docs/work/⟦round⟧/audit/d-record-classification.md", "sha256": "⟦…⟧" },
      { "path": "docs/work/⟦round⟧/audit/verification-addendum.md", "sha256": "⟦…⟧" }
    ]
  },
  "imported_evidence": [
    {
      "claim": "R28 independent-completion-evidence campaign: one complete fresh report-only epoch accepted (18 rows)",
      "predecessor_records": ["D-187", "ADR-006 §24"],
      "status": "attested-historical",
      "note": "Citable history; establishes nothing in DEVAI-II."
    },
    {
      "claim": "Actions-evidence promotion graduation and activation",
      "predecessor_records": ["D-165", "D-167"],
      "status": "must-re-earn",
      "note": "Void. Promotion in DEVAI-II requires a new complete green streak under the re-ratified D-164 boundaries."
    },
    {
      "claim": "R25 binding-effects soak matured without exception",
      "predecessor_records": ["D-167", "PC-0014"],
      "status": "attested-historical",
      "note": "The binding-effects *law* imports via the manifest; the soak observation stays predecessor history."
    }
  ],
  "non_claims": [
    "no-readiness", "no-autonomy", "no-task-completion", "no-product-candidate",
    "r28-candidates-remain-report-only-in-predecessor", "successor-standing-starts-at-zero"
  ]
}
```

(`identifier_map`, `tombstones`, `imported_law`, `package_continuity` omitted here for length; populated mechanically from the manifest at execution time — the 189-row identifier map is generated from the classification table, not hand-authored.)

---

## Open points — Owner dispositions recorded 2026-07-23

1. ~~R29/R30 close-vs-abandon~~ — **decided**: R29 closed; R30 (in flight) closes factually before R-Ω. No abandonment.
2. ~~`DII-N` namespace~~ — **adopted.**
3. ~~Empty history vs filtered clone~~ — **decided: empty history, tabula rasa; clean genesis is the primary goal.** Blame-continuity traded away deliberately; archaeology via the pin into the frozen predecessor.
4. **The succession article** remains the one genuinely open drafting item, deferred by design to the successor's own 1.0.0 authoring pass — see the session discussion of why the predecessor cannot write it.


---

# PART IV — Bootstrap round plan

---

# DEVAI-II bootstrap round plan — draft

**Status: DRAFT, speculative session output. Not a declared round.** Companion to the D-189/genesis drafts, the classification report, and the verification addendum (collectively "the manifest"). Execution requires the D-189 Owner authorization and declared per-batch role sessions. Bracketed `⟦…⟧` values bind at execution.

Shape: one predecessor-side closing round (**R-Ω**, in devai-original) and one successor-side bootstrap round (**BR-1**, in DEVAI-II), ten waves W00–W09. Waves are serial unless marked; each wave is one or more role-pure sessions with a commit boundary at every role change. The manifest is the scope control throughout: work not derivable from it is out of scope and requires a new decision.

---

## Preconditions (all hard)

- P1. In-flight state resolved — **VERIFIED SATISFIED 2026-07-23**: R30 closed in devai-original at 19:36:47Z as PC-0018 ("Sealed per-record governance canon and supported governed-round lifecycle"), declaring D-194 / closing D-195, merged_as 1993f2ca (#106), closeout self-archived at d76cd12d (#107), round archived to docs/meta/rounds/round-30/. Residual: release_disposition is `changeset-pending` — R-Ω confirms the release ships (or rides the Ω changeset). R29 likewise archived. See Part X §6 for the post-R30 predecessor deltas this verification surfaced.
- P2. D-189 adopted: Owner authorization quoted verbatim; Architect session appends it as the final substantive record.
- P3. Manifest frozen: classification report + verification addendum committed under `docs/work/⟦round⟧/audit/` in devai-original, SHA-256s recorded in D-189 item 1. (These are currently scratchpad drafts; committing them is itself Auditor-output work under Article 7's designated path.)
- P4. Green predecessor: the four CI gates pass at the intended final commit.

---

## R-Ω — Predecessor closing round (devai-original)

| Batch | Role | Work | Validation |
|---|---|---|---|
| Ω.A | Auditor | Commit the manifest under `docs/work/⟦round⟧/audit/`; final read-only state survey | Files at declared paths; hashes match D-189 |
| Ω.B | Architect | Append D-189; update BUILD-PLAN Status to terminal ("this repository closes under D-189; successor: ⟦DEVAI-II URL⟧"); README banner pointing at successor | Four gates; `sense docs drift` green; `docs links` zero broken |
| Ω.C | Owner + Architect | Merge the closing PR; post-merge `devai govern phase close` → terminal PC record with `merged_as` + `release_disposition` (per D-110/D-134); final `devai evidence` chain verification | PC record schema-valid; chain verifies; final tree SHA + chain head + manifest hashes published — the three genesis-binding values |
| Ω.D | Auditor | Final freeze audit: confirm repo state matches D-189 items 7 and 10 (errata unfixed, R28 candidates unmerged, no readiness claims) | Read-only report in `docs/work/⟦round⟧/audit/` |
| Ω.E | Owner (host action) | Archive the repository read-only at the host (GitHub archive flag) | Repo flagged archived; no further commits possible |

R-Ω makes no successor claims. If BR-1 is later aborted, R-Ω stands on its own as a valid closure and the archive flag is simply lifted by Owner decision.

---

## BR-1 — Successor bootstrap round (DEVAI-II)

### W00 — Genesis (Architect)

New repository, **empty history — Owner-decided 2026-07-23: tabula rasa, clean genesis is the primary goal**. Blame-continuity for `packages/` is deliberately traded away; code archaeology happens in the frozen predecessor via the pin (D-189 item 4). The genesis attestation records the choice. Contents of the genesis commits:

1. `genesis-attestation.schema.json` — the successor's first schema.
2. `genesis-attestation.json` — binding Ω.C's three published values; `imported_evidence` exhaustive; `identifier_map` generated mechanically from the manifest's classification table (189 rows) by a throwaway script whose output is reviewed, not trusted.
3. `DECISIONS.md` opened with DII-1 (founding record) as its only entry.
4. Import commit: `packages/`, `examples/`, `.github/` at exactly ⟦final-commit SHA⟧, unmodified. The predecessor's root governance files are **not** imported; `CONSTITUTION.md`, `BUILD-PLAN.md` (as `BOOTSTRAP-PLAN.md` → later `BUILD-PLAN.md`), README, CLAUDE.md/AGENTS.md are authored fresh in later waves. Until W05 rebinds them, imported checks that read root files run against a vendored `predecessor/` snapshot directory declared temporary in DII-1.

Validation: attestation validates against its schema; identifier map covers D-1..D-189 with no gaps beyond the three tombstoned unminted IDs; `pnpm install && pnpm build` succeeds on the import.

### W01 — Constitution 1.0.0 (Architect; the founding ratification)

Author the forty articles fresh: all six predecessor amendments integrated into article text; promotions from the 16 PROMOTE records absorbed; the new **succession article** (the clause the predecessor could not write). Amendment history begins at 1.0.0 with a genesis pointer. Explicit checklist from the verification addendum — the coverage gaps close *here or in W04, tracked per item*:

- D-136: zero-exemption mutator source gate; change-control clause (weakening fail-closed properties ⇒ new decision, Articles 6–10 changes ⇒ amendment).
- D-168: universal uncheckable-evidence quantifier; dossier-content obligation; deferral list (mutation-strength obligations, aggregation semantics).
- The 0.3.0 lesson encoded structurally: no operational values (caps, counts, model names) in article text — policy pointers only.

Validation: an Architect-authored crosswalk table (article ↔ source: predecessor article / PROMOTE record / new) covering all forty articles + succession article; no manifest-external content.

### W02 — Schemas (Architect)

Import `docs/framework/schemas/` as-is at the pin (cleanest predecessor layer; 62 + genesis schema = 63), plus any schema the register needs (none anticipated — flag as deviation if one appears). Re-establish the schema-count claim discipline: counts live only in mechanical guards, never prose (closing the D-31/D-36 drift-class gap).

Validation: all schemas compile; instance validation suite green; glob-guard floor set to the actual count (63), not a stale floor.

### W03 — Register seeding (Architect; Owner joint where product/glossary content appears)

`DECISIONS.md` becomes the compact register: DII-1, then one entry per manifest line — 65 LIVE records restated present-tense; 33 extracts (including D-88's `since` no-pack-default and D-104's extend-never-weaken bar folded into their host entries); the REJ registry re-minted once each under new IDs; the ritual cross-repo rule as one entry. Every entry carries a provenance line citing retired predecessor IDs (citation, not restatement — no SHAs, no counts, no evidence values copied). PROMOTE records appear only as pointers to W01/W04 artifacts. D-164 is a **full entry** per the addendum verdict (pointer deferred until W04 amends its ADR).

Validation: register↔identifier-map bijection check (every `disposition: register` row has exactly one entry and vice versa); a new **register-consistency guard** (script or sensor) asserting no register entry contradicts a constitutional article — the Article-27 "six vs three" drift class, now mechanically closed; target length < 1,000 lines.

### W04 — ADR minting (Architect)

Fresh gapless ADR-001..N with conforming front-matter and the six mandatory sections, absorbing the predecessor's 6 numbered + 10 named ADRs where still live. Required content work (not renames):

- ADR-005 successor absorbs the six D-164 boundaries verified absent (first-parent authorization mechanism incl. `git show <base-sha>:` resolution and self-authorization prohibition; malformed-authorization + explicit-revocation triggers; "Source PRs always run full"; required-check aggregation never green-washes a skip; "promotion ignored" weekly-audit qualifier; no-manufactured-runs containment) and a Status reflecting that graduation standing is **void pending re-earning** (genesis `must-re-earn`).
- ADR-006 successor absorbs the three D-168 fragments (if not placed in W01).
- ADR-003 successor drops/reworks the "No constitutional amendment is required" line that misreads against the change-control clause.
- Superseded named ADRs (per manifest) are not minted; the identifier map records their disposition.

Validation: `check adrs` green over the new set; every invariant `authority.docs` target that will re-anchor in W05 has its destination ADR minted here first.

### W05 — Code rebind (Engineer; the largest wave, sub-batched)

Rebind every coupling in the addendum §4 inventory from predecessor artifacts to successor artifacts. Sub-batches, each individually gated:

1. **Authority core**: vendored-constitution digest → Constitution 1.0.0; authority-policy path rules and materialization (`devai adopt upgrade`); translation-validation classifier roots (register file name architect-classified; constitution hard-block).
2. **Anchors**: invariant `authority.docs` — 32 constitution anchors → 1.0.0 article slugs; 11 D-heading anchors → register entries / archive citations per identifier map; 12 ADR anchors → W04 numbers; CLAUDE.md anchor → new CLAUDE.md (authored this wave, Engineer-config scope, content from W01/W03).
3. **Gates**: `gate-authorization.ts` D-165 heading resolution → the successor's re-graduation decision shape (dormant until W08 re-earns; fail-closed meanwhile); CLI-migration exemption list; `.prettierignore` (predecessor snapshot dir + any frozen successor files).
4. **Surface**: doctor reading-order constants; site sync allowlist; site-drift root inputs; prompt firewall `ARCHITECT_RESERVED` — **adding the register file, closing the predecessor asymmetry**; inventory governance-file list; AGENTS.md authored + its schema-count claim added to the drift guard's claim files (closing that gap).
5. **Cleanup**: delete the `predecessor/` vendored snapshot once zero references remain; remove the `writers.ts:200` line-number comment.

Validation per sub-batch: the four gates + the named detectors (`spec validate all`, `check adrs`, `docs links`, `sense docs drift`, doctor self-run, glob guards). Wave exit: zero references to the snapshot dir; full suite green.

### W06 — Publication surface (Architect; Owner for product sections)

Docs IA stood up per the imported ADR-DOCS-IA successor; versioned docs begin at 1.0.0; a **History** section publishes the genesis attestation and links the archived predecessor (the "our own evidence chain" adopter-facing claim); sync stubs target the register and the fresh build plan.

Validation: site builds; `docs links` zero broken; site-drift green.

### W07 — Self-application re-established (Inspector for tests; Engineer for config)

Per the imported Article 36: DEVAI-II's own inventory regenerates; own scorecard runs; own doctor passes; the register-consistency guard and drift guards run in CI. Test suites re-pointed at successor fixtures where they referenced predecessor governance text.

Validation: scorecard produces verdicts over the successor (content of verdicts is *not* a gate — honest reds are expected and become the first backlog); four gates green.

### W08 — Evidence re-earning opens (multi-role, explicitly *not* bootstrap-blocking)

New evidence chain genesis; PC numbering fresh from PC-0001 (backfill = genesis only, per imported D-110 doctrine); Actions-evidence re-graduation campaign opens under the W04 ADR (new streak, from zero). This wave **starts** processes; their completion is future rounds' work. BR-1's closure does not wait on any standing being re-earned — that would recreate the laundering the design forbids, in mirror image.

### W09 — Closure and first release (Owner + Architect)

BR-1 closes per the imported D-110/D-134 ceremony: merge, post-merge phase close, PC record with `merged_as` + `release_disposition`. First successor release ⟦1.0.0⟧ ships through the continued `@devai-nyx` publish path — package continuity proven by a consumer (stynx) resolving the new version. Closing DII-record states the non-claims verbatim: bootstrap complete; zero readiness-bearing standing; every `must-re-earn` item still open.

---

## Round-level validation criteria (BR-1 "complete" means all of these)

1. Genesis attestation validates; its three predecessor-binding values match R-Ω's published values.
2. Identifier map: 189 rows, bijective against register/constitution/ADR/archive dispositions.
3. Constitution 1.0.0 crosswalk complete; register < 1,000 lines; register-consistency guard green in CI.
4. All addendum-§4 couplings rebound; zero predecessor-snapshot references.
5. Four gates + all named detectors green; site builds and publishes.
6. First release shipped and consumer-resolved.
7. Non-claims stated in the closing record; `must-re-earn` ledger open and untouched.

## Risks

- **Scope creep is the failure mode** (second-system effect). Mitigation is structural: manifest-or-new-decision, per-wave crosswalks, and the Ω/BR split meaning devai-original is never damaged — abort at any wave = discard the successor repo, lift the archive flag by Owner decision, resume in place with everything this session produced still valid for the in-place plan.
- **Silent import through code**: the imported packages embed predecessor assumptions beyond the inventoried couplings. Mitigation: W05's detectors fail loudly (addendum §4.2), plus a W07 grep-sweep for residual predecessor path/ID literals.
- **Dual-corpus window** (W00–W05, checks running against the vendored snapshot): bounded by declaring the snapshot temporary in DII-1 and gating W05 exit on its deletion.
- **Estimated effort honesty**: every prior absorption was one phase for a smaller predecessor; BR-1 is plausibly 2–4× the largest of them. If wave-level estimates blow past that, the correct response is pausing for an Owner scope decision, not compression.


---

# PART V — Succession article (Article 41)

---

# Succession article — W01 draft for Constitution 1.0.0

**Status: DRAFT, speculative session output.** Proposed input to the BR-1/W01 founding Architect session in DEVAI-II. Nothing here is law until that session authors and ratifies it. Written at constitutional altitude per the 0.3.0 doctrine: what must always be true, no operational values, mechanics delegated to instruments.

**Placement.** Part X is retitled **"Amendments and succession"** and gains one article. Article 40 (Amendment process) is unchanged; the new article follows it as **Article 41**. (If W01 renumbers the corpus, the placement rule is "final article of the final part, immediately after the amendment article" — the two must sit together because §1 defines each as the other's boundary.)

---

## Part X — Amendments and succession

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

## Genesis note (for the 1.0.0 amendment-history section, which begins empty)

> **1.0.0 — Founding ratification.** This constitution is authored fresh in DEVAI-II under the succession authorized by devai-original's terminal decision D-189 and adopted here by DII-1 and the genesis attestation GEN-0001. Article 41 encodes the succession mechanism that D-189 had to perform by necessity, so that necessity is never invoked again. The predecessor's constitutional lineage (0.1.0–0.6.0) is preserved, frozen, in the archived predecessor repository; it is history, not law.

---

## Drafting notes (not article text)

1. **What §1 buys.** The amendment/succession mutual-exclusion clause closes both evasion routes: no "amendment" that quietly re-substrates the corpus, and no "succession" invoked to rewrite articles without Article 40's recorded prior-text discipline.
2. **"While any round is open" is deliberately structural**, not scheduling advice — it constitutionalizes the R-Ω precondition (P1) at the altitude of "always true," while leaving round mechanics to the loop articles.
3. **Instruments are named by kind, not by filename.** "Terminal decision," "absorption manifest," "genesis attestation" are constitutional objects the way "invariant" and "evidence chain" are; their schemas and paths are F1/F5 artifacts. This keeps the article valid across any future IA change (the 0.2.0 lesson).
4. **The self-propagation clause is the termination proof.** With it, the extra-constitutional founding act occurs exactly once in the lineage — at D-189 — and every later generation inherits a lawful path. The "materially equivalent" wording (rather than "identical") lets successors improve the mechanism under their own Article 40 without breaking the chain.
5. **Deliberately excluded**: identifier-namespace prefixes, repository-hosting mechanics (archive flags), package/registry continuity, and manifest bucket taxonomy — all operational, all policy- or decision-tier (the D-189/genesis instruments carry them). Also excluded: any DEVAI-II-specific names inside article text; those live only in the genesis note, which is history, not law.
6. **One review question for the W01 session**: whether "produced under Auditor observation" (§3) should harden to "produced by a declared Auditor session with adversarial verification" — this session's manifest was built exactly that way, and encoding the adversarial pass would make the strongest version of the discipline constitutional. Left at the softer wording here because mandating a specific verification method may be below constitutional altitude; the W01 Architect should make that call consciously.


---

# PART VI — New-owner onboarding brief

---

**Status: session-authored orientation appendix (2026-07-23), written for an Owner with no predecessor knowledge. Descriptive, not normative — where this brief and Parts I–V disagree, the parts govern. "DEVAI" below means the framework generally; everything transfers to DEVAI-II via the absorption manifest unless noted.**

## 1. Glossary

- **Gate** — a check whose failure *blocks* something (a merge, a phase close, a release). The four CI gates are lint, typecheck, unit tests, and merged coverage; beyond those sit hard gates (schema drift, effect declarations) and soft gates (an LLM evaluator distinct from the working agent). Verdicts are tri-state everywhere — PASS / REVIEW / FAIL — never a silent skip; a gate that cannot compute its inputs fails closed.
- **Anchor** — a machine-resolved *citation*. Every invariant declares where its authority comes from (`authority.docs`), and CI resolves those references into actual headings in the constitution, decision log, and ADRs. A missing heading fails validation. Anchors are why governance documents cannot silently drift from the rules claiming to derive from them — and why moving a heading is a CI event, not a docs edit.
- **Authority** — who may change what, defined *by path*. Five roles: **Owner** (business specs, ultimate authorization), **Architect** (constitution, schemas, architecture), **Engineer** (code), **Inspector** (tests), **Auditor** (read-only; may recommend, never ratify). Enforced at runtime for mutations through DEVAI's own CLI (declared role or authority session + explicit consent); honestly advisory for external editors unless a verified host adapter is installed. Doctrine: capability never grants authority; a check never writes its own inputs.
- **Sensor** — a read-only measurement producing a schema-valid `SensorReading` with a tri-state verdict (coverage depth, spec freshness, docs drift, harness-green-on-main, …). Sensors observe; they never mutate and never relabel. Readings aggregate into the **scorecard** — the substrate × property health grid, run over DEVAI itself per the self-application article.
- **Guard** — a narrow tripwire against *silent degradation of the machinery*. Glob guards assert load-bearing file patterns still match ≥ N files; drift guards assert prose claims ("62 JSON Schema files") still match ground truth. The most dangerous failure in a governance system is not a red check — it is a check that went green because it stopped seeing anything.

## 2. Hierarchy: Constitution → ADR → DII records

Three tiers, distinguished by altitude and shelf life:

- **Constitution** (~40 articles, versioned, amended only via the formal recorded process): *what must always be true* — the control frame, roles and authority-by-path, invariant semantics, escalation, evidence rules, self-application. Deliberately holds no operational values (no caps, counts, vendor names) — the predecessor's hard lesson was that volatile values in constitutional text drift out of truth unamended. Shelf life: years.
- **ADRs** (numbered, fixed sections, machine-validated): *bounded architectural contracts* — runtime authority enforcement, CI evidence promotion/revocation, independent completion evidence. Where a mechanism's full precision lives. Shelf life: the mechanism's life.
- **DII records** (the decision register, successor of predecessor D-records): *operational decisions and rationale* — cap values, provider defaults, standing rejections with reasons. Append-only: never edited, only superseded by a new numbered record. Shelf life: until superseded.

Placement rule of thumb: removing it would change *what the framework is* → constitution. It specifies *how a mechanism binds* → ADR. It records *a choice that could have gone another way* → DII record. Content moves upward only by explicit promotion; every tier cites — never restates — evidence values (SHAs, counts).

## 3. The schemas mechanism

**What**: 62 JSON Schema files (Draft 2020-12, `additionalProperties: false`, tri-state verdict enums) under `docs/framework/schemas/`, one file per contract — `invariant`, `task`, `evidence`, `sensor-reading`, `scorecard`, `trace`, `authority-session`, `stack-adapter`, `phase-closure`, `translation-witness`, `validation-result`, ….

**Process**: Architect-authored source of truth → TypeScript types generated at build (json-schema-to-typescript), deliberately never committed → ajv validates every instance at runtime; schema-invalid artifacts are rejected, not tolerated.

**Consumers**: the CLI (own inputs/outputs), sensors (every reading), the evidence chain (every appended record), tests (schema-instance validation is a test class), and adopters — schemas ship as public package subpaths (`@devai-nyx/core/schemas/*.json`).

**Product**: data trusted across boundaries — a reading, session, or evidence record is checkable without trusting its producer. The schema count is guarded mechanically (`sense docs drift`, glob-guard floor), never hand-maintained.

## 4. CLI surfaces

One binary, `devai`, noun-verb grammar, registry-derived hierarchical router; unknown or unauthorized routes fail closed (exit 2). Two layers: **174** deterministic **actions** (measured; see Part VIII) and **53** LLM-backed **skills** (opt-in, consent-gated).

| Surface | Purpose |
|---|---|
| `init`, `adopt`, `doctor` | Bootstrap, materialize/upgrade config, diagnose setup |
| `spec`, `inventory`, `catalog` | Validate invariants/traces; regenerate inventory; enumerate |
| `sense` | Run sensors, emit readings |
| `policy`, `verify`, `evidence` | Policy checks (glob guards, CI economy, forbidden actions); claim verification; hash-chained evidence collect/verify |
| `work`, `govern`, `release` | Task/round lifecycle; post-merge phase-closure ceremony; release control |
| `agent`, `experimental` | Bounded LLM surfaces — skill runs against local CLIs only; the loop behind triple opt-in |
| `docs` | Link integrity, IA conformance |

Cross-cutting conventions: **consent flags** (nothing mutates without `--write`, nothing publishes without `--allow-publish`) and **role declaration** (`--as-role` / repository-bound `--authority-session`), checked at the final adapter, not just the router.

## 5. Customization outlets

All customization is declared config materialized into `.devai/config/` via the upgrade path — never a framework fork; a checker never writes its own inputs.

1. **Stack-adapter packs** — the primary outlet; one declared stack per repository (NestJS/Angular/Postgres primary; Laravel/Express/Spring variants ship as packs).
2. **Adoption profiles** — tier1 (gates + evidence) / tier2 (+ reference signal) / tier3 (full loop); absent = tier3; a floor, not a cage.
3. **Sensor thresholds** — locked defaults overrideable per pack config.
4. **Scorecard N/A overrides** — per-repo carve-outs as schema-valid overlays; never derivable from a reading.
5. **Test-weakening config** — per-project thresholds; defaults on absence.
6. **CI economy profile** — `full` vs `gate-staged`; local-evidence policy for verifiable local heavy-tier runs.
7. **Docs IA path overrides** — remap F1 document locations.
8. **Forbidden-actions waivers, glob-guard registry, subprocess-effects declarations** — extend, never replace, the safety floors.
9. **Feature flags** — notably `autonomous_loop` (triple opt-in, experimental, never readiness-bearing).

Not customizable by design: the constitution (pin a version; adopt amendments explicitly; no local edits), schema strictness, tri-state semantics, and the fail-closed defaults — every outlet can tighten or scope the framework; none can silently open it.


---
---

# PART VII — DEVAI-II repository layout (final form)

---

**Status: DRAFT, speculative session output (2026-07-23), consolidated after review. Greenfield design — no backward constraint honored except lessons. Input to BR-1/W00 (genesis) and the W01 Article 6 enumeration; nothing here binds until ratified there. §9 records the review decisions and declined alternatives that produced this form.**

## 1. Design principles, derived from predecessor pathologies

1. **Static-prefix authority.** Authority is decided by a fixed path prefix of at most two segments — a table lookup, never a glob with wildcards or a default remainder. The predecessor needed constitutional amendment 0.5.0 because the Auditor's only writable path was a wildcard exception inside an Architect tree (`docs/work/*/audit/`), and its firewall needed a dedicated pinning test to contain glob-shape pathologies. In DEVAI-II, Article 6 is a flat table of static prefixes.
2. **Mutability is a directory property.** Four classes, each with its own tree or subtree: **versioned law** (changes only by recorded amendment/decision), **append-only record** (grows, never edits), **regenerated** (machine-derived, never authored), **scratch** (never enters history). The predecessor mixed classes inside `.devai/` and inside `docs/`, and every mixing produced a drift class or an authority ambiguity.
3. **Names are API — choose once, never rename.** The coupling inventory proved root filenames effectively unrenamable after a year of tooling growth. Top-level names are short, lowercase, and named for what the tree *is* (law, record, work), not for the current tool that reads it. The machinery directory is the exception that proves the rule: it takes the *tool's* name because the tool name itself is continuity-stable API (package continuity carries `devai` through succession).
4. **Intent / observation / attestation are three different things.** A round has a *plan* (Architect intent), an *audit* (Auditor observation), and a *closure* (machine-attested fact). The predecessor stored all three in overlapping places. DEVAI-II separates them structurally: `work/rounds/` holds intent, `work/audit/` holds observation, `record/proofs/` holds attestation.
5. **Governance is visible; plumbing is not.** Every governance surface — law, product, process record, machine testimony — is a visible top-level tree. The machinery that merely operates them (pin, materialized config, head state) stays in the hidden tool-named `.devai/`. Visibility is achieved by extraction, not by unhiding plumbing.
6. **Authorship is the protection boundary.** Human-authored trees are grouped by role; machine-authored trees consolidate under one prefix (`record/`) so that "no human hand ever writes here" is a single enforceable rule — one Article 6 row, one firewall entry, one formatter-freeze entry, one doctor check.
7. **Adopter symmetry.** An adopter repository uses the same names with the same semantics, minus the trees that are the framework's own product. Framework docs describe one layout; sensors need no per-repo path vocabulary beyond the stack pack.
8. **Tool-fixed paths do not exempt their contents.** Host-tool directories (`.changeset/`, `.claude/`, peers) keep their toolchain-mandated root paths, but the data inside is classified by this table like any other artifact (§8.2).

## 2. Top-level layout (DEVAI-II framework repository)

```
devai-ii/
├── law/          # F1-law — the reference signal's normative core     [Architect]
├── product/      # F1-business — Owner-authored product definition    [Owner]
├── work/         # F1 round lifecycle — two single-authority subtrees:
│   ├── rounds/   #   plans, prompts, amendments — R-NNNN              [Architect]
│   └── audit/    #   Auditor reports, by round + standing/            [Auditor]
├── docs/         # F1-published — human documentation, by audience    [Architect]
├── record/       # machine testimony — two machine-only subtrees:
│   ├── derived/  #   F4 regenerated projections (what the repo IS)    [machine, regen]
│   └── proofs/   #   append-only evidence (what HAS happened)         [verbs, append-only]
├── packages/     # F2 — the plant (pnpm workspace)                    [Engineer]
├── tests/        # F3 — repo-level test suites                        [Inspector]
├── scratch/      # ephemeral — gitignored except its README           [anyone; never committed]
├── README.md  CLAUDE.md  AGENTS.md   # orientation + harness instructions [Architect]
├── CHANGELOG.md  LICENSE  NOTICE     # ecosystem-conventional            [generated / legal]
├── package.json  pnpm-workspace.yaml  pnpm-lock.yaml                    [Engineer]
├── tsconfig.json  tsconfig.base.json  eslint.config.mjs                 [Engineer]
└── (dotfiles: .devai .git .github .gitignore .changeset .claude
     .editorconfig .npmrc .node-version .prettierrc .prettierignore)     [see table / §8.2]
```

Eight visible trees; `work/` and `record/` each hold two single-authority subtrees, so the Article 6 enumeration stays a static-prefix table. The root is shown **complete and honest** — 20 visible entries (plus hidden `.devai/`), versus the predecessor's 34 visible (44 with dotfiles): 8 trees, 6 conventional files, 6 workspace configs, nothing else. Only three visible entries are DEVAI-authored prose (`README.md`, `CLAUDE.md`, `AGENTS.md`); the rest is Node/GitHub ecosystem floor. What is *absent* is the point: no governance markdown at root, no per-tier test configs, no `scripts/`, no build outputs, no archive files. §8 gives the disposition of every predecessor root entry and the ceiling guard that keeps the root this size.

The root pairs read as the framework's own theory: `law/` + `product/` are what should be; `packages/` + `tests/` are what is built; `work/` is the human process record; `record/` is the machine's testimony; `docs/` is the published narrative; `scratch/` is ephemera; `.devai/` is plumbing.

## 3. Tree by tree

### `law/` — the normative core (Architect; `law/glossary/` joint with Owner)

```
law/
├── constitution.md        # single file: digest-bindable, anchor-stable
├── register/
│   ├── DECISIONS.md       # the compact live register (DII-N entries, present tense)
│   └── attestation/       # genesis-attestation.json + schema (immutable once ratified)
├── adr/                   # ADR-001..N, gapless, schema-fronted
├── schemas/               # the 63 contracts — one file per contract, canonical source
├── invariants/            # INV-* JSON, the control setpoints
├── trace.json             # invariant ↔ docs ↔ tests ↔ code map
├── policy/                # canonical sources of everything .devai/config materializes
│   ├── authority-policy.json    subprocess-effects.json
│   └── forbidden-actions.json   glob-guards.json   thresholds.json
└── glossary/              # [joint Owner+Architect]
```

The constitution, register, schemas, invariants, and trace stop being scattered across root + `docs/framework/` and become one tree whose name says what it is. `law/policy/` makes the materialization doctrine *visible in the layout*: every file in `.devai/config/` has its canonical source at the mirrored path in `law/policy/` — the byte-identity check becomes a directory diff.

### `product/` — Owner tier (Owner)

```
product/
├── journeys/  use-cases/  stories/  rules/
└── compilation.md         # how product artifacts reference invariants (the Owner→Architect seam)
```

Promoted to top level: the Owner's authority stops being a subdirectory exception inside an Architect tree — the only remaining joint path is the glossary, by design.

### `work/` — the human process record (two subtrees, two authorities)

```
work/
├── rounds/                # [Architect] — intent
│   └── R-0001/
│       ├── plan.md        # declared scope; amended by dated appendix, never rewritten
│       ├── prompts/       # round-scoped agent prompts
│       └── handoffs/      # cross-session working notes
└── audit/                 # [Auditor] — observation; the role's ONLY writable tree
    ├── R-0001/            # per-round observation reports, as-built findings
    └── standing/          # cross-round assessments; stale after N rounds without reaffirmation
```

Rounds are numbered `R-NNNN` from genesis (BR-1 is `R-0001`). The plan/as-built pairing is structural: **plan = `work/rounds/R-NNNN/plan.md`; as-built = `work/audit/R-NNNN/` + the round's closure record in `record/proofs/`** — three artifacts, three authorities, zero overlap. The subtrees are siblings, not a per-round nesting, so authority stays a static-prefix lookup — see §9.5 for the declined alternative. A doctor check pins the twin numbering: every `work/audit/R-N` must reference an existing `work/rounds/R-N`. Audit reports carry no authority — recommend, never ratify — and the layout now says so structurally.

### `docs/` — published documentation (Architect; product pages generated from `product/`)

```
docs/
├── start/  theory/  roles/  adopters/  reference/   # audience sections (IA preserved)
├── dev/               # contributor docs: build, release, test-tier guide, dev-process
└── site/              # publication machinery (Docusaurus), consumes law/ + docs/ + product/
```

`docs/` narrows to what it should have been: prose written for humans, published. Law, product, work, and record are no longer inside it; the site's sync layer publishes them as read-only views (law → "governance" section, `record/proofs/` + the frozen predecessor → "history" section).

### `record/` — machine testimony (one prefix, no human hand ever)

The machine's witness in two tenses: `derived/` states what the repository **is**; `proofs/` states what **has happened**. One protection boundary covers both: one Article 6 machine-only prefix, one prompt-firewall entry, one formatter-freeze entry (freezing `derived/` also protects regen byte-identity), one doctor rule — a human commit touching `record/` outside a verb is an authority violation regardless of role.

```
record/
├── derived/               # regenerated — delete + one command = byte-identical rebuild
│   ├── inventory/         # F4 plant identification (fixes the predecessor's F4 drift)
│   └── indexes/           # generated navigation: register index, ADR index, round ledger
└── proofs/                # append-only, hash-linked — never edited, never regenerated
    ├── chain.json         # the hash chain — the spine everything below links into
    ├── work/              # proof-of-work: what ran
    │   └── agent-runs/  skill-runs/  test-results/  coverage/
    ├── compliance/        # proof-of-compliance: what was judged
    │   └── closures/  scorecards/  verdicts/  releases/
    └── freshness/         # proof-of-freshness: when truth was last confirmed
        └── baselines/  readings/
```

The three proof kinds have different consumers and staleness semantics: *work* answers "what happened" (audit trail), *compliance* answers "what was accepted and by which gate" (the promotion/closure substrate), *freshness* answers "how old is our confidence" (the input to REVIEW-on-staleness). Everything is append-only, hash-linked into `chain.json`, named with date + content-hash. The generated round ledger in `derived/indexes/` renders each round's plan + audit + closure + evidence as one view — read-side cohesion is synthesized, never bought with authority boundaries. `record/proofs/` is the adopter-facing archive: "here is our own evidence" resolves to one URL.

**Placement test** (`derived/` vs `proofs/` vs `.devai/state/`): reproducible from a clean checkout with one command → `derived/`. An immutable fact about a past event → `proofs/`. Mutable runtime memory (counters, leases, pointers) → `.devai/state/`.

### `packages/` — the plant (Engineer)

```
packages/
├── schemas/        # builds from law/schemas — generated types, never committed
├── core/           # loop, evidence, authority runtime, closure, inventory
├── sensors/        # one module per sensor kind (+ its design-note reference)
├── cli/            # the registry-derived router and verbs
├── effects-check/  # subprocess-effects analyzer (owns its tsconfig variant)
├── adapters/       # stack packs + host adapters, one package each
└── examples/       # the reference adopter shapes (integral, never split out)
```

Uniform per-package rail — `src/` + `tests/` as siblings, never co-located test files: F3 authority becomes "any path whose segments include `tests/`", pattern-free.

```
packages/<name>/
├── src/            # implementation                       [Engineer]
├── tests/          # unit/ + contract/ for this package   [Inspector]
└── package.json  tsconfig.json
```

### `tests/` — repo-level suites (Inspector)

Cross-package tiers that belong to no single package, plus the tier configs (`tests/config/` — the six per-tier runner configs leave root). See §4.

### `scratch/` — formalized ephemerality (gitignored)

```
scratch/
├── README.md              # the only committed file: rules of the tree
├── sessions/<id>/         # per-session agent/human work areas
└── worktrees/             # harness-spawned worktrees (cap-enforced)
```

Anything worth keeping graduates *explicitly* into `work/`, `packages/`, or a register entry; everything else dies with the tree. `devai doctor` warns when `scratch/` content exceeds an age threshold — scratch that persists is a filing failure.

### `.devai/` — plumbing (hidden, tool-named; config: `devai upgrade` only; state: verbs only)

```
.devai/
├── pin/
│   ├── constitution.md    # vendored copy (adopters) or symlink (self), digest-pinned
│   └── versions.json      # framework version, schema-set version
├── config/                # materialized from law/policy/ — byte-identical, upgrade-written
└── state/                 # mutable HEAD state only: counters, leases, current pointers
```

Hidden and tool-named per the §8.2 convention (`.claude/` is Claude's, `.changeset/` is Changesets', `.devai/` is DEVAI's) — legitimate because everything of governance value has been extracted to visible trees: append-only content lives in `record/proofs/`, F4 in `record/derived/`, worktrees in `scratch/`. What remains is the tool's inputs and runtime, and hiding it keeps every dotdir-skipping convention working by default. `state/` holds *only* mutable head state — the predecessor's biggest F5 confusion (config, state, inventory, and evidence mixed in one hidden tree) is resolved by this extraction.

## 4. Test tiers, rationalized

Seven tiers, each with one home, one trigger, one gate role:

| Tier | Name | Lives in | Runs | Gate role |
|---|---|---|---|---|
| T0 | Static | lint/type configs (F3-intent configs) | every batch | CI gate 1–2 |
| T1 | Unit | `packages/*/tests/unit/` | every batch | CI gate 3 |
| T2 | Contract | `packages/*/tests/contract/` (schema instances, CLI output shapes) | every batch | hard gate |
| T3 | Integration | `tests/integration/` (cross-package; DB-gated by env flag) | every batch (merged coverage) | CI gate 4 |
| T4 | Regression | `tests/regression/` (one file per closed defect, pinned) | pre-close | hard gate |
| T5 | Smoke / E2E | `tests/e2e/` (built binary, real flows) | pre-close, release | release gate |
| T6 | Containment | `tests/containment/` (experimental-loop safety) | pre-close, any experimental change | hard gate for experimental surfaces |

Rationalizations vs the predecessor: contract tests promoted to a named tier; a test's tier is decided by *directory*, not naming convention or config include-lists — retiring the dual-typecheck trap (`tsc -b` vs a second config covering `test/**`) since one include set covers `packages/*/tests` and `tests/` uniformly; coverage semantics are per-tier (T1+T3 merged for the threshold gate; T4–T6 excluded from coverage arithmetic by design).

## 5. The adopter mirror

Same names, same semantics, minus the framework's own product:

```
adopter-repo/
├── law/            # THEIR law: invariants/, trace.json, adr/, policy/ (their overrides)
├── product/        # their Owner tier
├── work/           # rounds/ + audit/ — their governance workflow (optional below tier3)
├── record/  scratch/              # identical semantics
├── docs/           # their documentation
├── .devai/         # pin (framework constitution + checksum) + config + state
└── <plant>         # wherever their declared stack puts code (apps/, src/ — stack pack declares it)
```

The framework constitution is **pinned** at `.devai/pin/constitution.md`, not copied into their `law/` — their `law/` holds what they author. Adoption tiers map to tree presence: tier1 needs `.devai/` + `record/proofs/`; tier2 adds `law/`; tier3 adds `work/`. `devai init` scaffolds exactly the trees the declared tier needs — the layout is the tier, visibly.

## 6. The resulting Article 6 enumeration (static-prefix, exception-free)

| Prefix | Authority | Mutability class |
|---|---|---|
| `law/` | Architect (`law/glossary/` joint Owner) | versioned law |
| `product/` | Owner | versioned law |
| `work/rounds/` | Architect | append-only (plans amended by appendix) |
| `work/audit/` | Auditor | append-only |
| `docs/` | Architect | ordinary edit |
| `record/` | machine only (`derived/` regen subsystem; `proofs/` executing verbs) | regenerated / append-only by subtree |
| `.devai/pin/`, `.devai/config/` | `devai upgrade` only | materialized |
| `.devai/state/` | executing verbs only | mutable head |
| `packages/` + root workspace config | Engineer | ordinary edit |
| `tests/`, `packages/*/tests/` | Inspector | ordinary edit |
| `scratch/` | anyone | never committed |
| root `README.md`, `CLAUDE.md`, `AGENTS.md` | Architect | ordinary edit |
| host-tool config dirs (`.changeset/`, `.claude/`, peers) | path fixed by toolchain; contents classified per §8.2 | per content class |

Thirteen rows, no wildcards except the single directory-name rule for package tests. Every predecessor pathology in the coupling inventory maps to a row that now prevents it.

## 7. Costs and open questions (honest)

1. **The moved-cheese cost.** Every path in the imported code rebinds in W05 anyway; adopting this layout roughly doubles W05's mechanical surface. Judged worth it: W05 is the only moment in the lineage when moving everything costs nothing extra in drift risk — the anchors are being rewritten regardless.
2. **`law/schemas/` vs packaging**: schemas remain public package subpaths; the build copies from `law/schemas/` — one more prepack staging step, same pattern as the predecessor's pack staging.
3. **Single-file constitution retained** deliberately (digest binding, anchor slugs, amendment diffs). Revisit only if article count grows past readability.
4. **`work/audit/standing/` freshness**: cross-round reports risk becoming a shadow register. Rule: anything there older than N rounds without reaffirmation is historical by default — a freshness proof applies to observation too.

## 8. Root de-crowding

The predecessor root holds 44 entries (34 visible); this layout yields **20 visible**. Four rules beyond the tree design itself:

1. **Test-runner configs live with the tests** (`tests/config/`; one root shim only if the toolchain demands discovery). `tsconfig.typecheck.json` is retired by construction (§4); tsconfigs reduce to root + base; `tsconfig.effects.json` moves into `packages/effects-check/`.
2. **No loose `scripts/` at root.** Repo scripts are product (→ `packages/cli` verbs), build steps (→ the owning package), or one-shots (→ `scratch/`, then deleted).
3. **No build outputs at root, ever.** Coverage output goes to `record/proofs/work/coverage/` when it is evidence and `scratch/` when it is not.
4. **Community files ride `.github/`** (`CONTRIBUTING.md`, `SECURITY.md`); `LICENSE`/`NOTICE` stay root as legally conventional.

Guard: **a root-entry ceiling** (max **23** visible entries, enforced by `devai policy check glob guards` beside the min-match guards) — three slots of headroom, each new root entry consuming ceiling budget visibly in review.

### 8.1 Complete predecessor-root disposition (all 44 entries — the W00 executable mapping)

| Predecessor root entry | DEVAI-II disposition |
|---|---|
| `CONSTITUTION.md` | `law/constitution.md` |
| `DESIGN-DECISIONS.md` | `law/register/DECISIONS.md` (register form; journal stays in frozen predecessor) |
| `BUILD-PLAN.md` | dissolved → `work/rounds/R-NNNN/plan.md` per round + `record/derived/indexes/` round ledger |
| `BUILD-PLAN-ARCHIVE.md` | not imported — history remains in the frozen predecessor |
| `CHANGELOG.md` | root (Changesets-generated; ecosystem convention) |
| `CONTRIBUTING.md`, `SECURITY.md` | `.github/` (GitHub resolves them there) |
| `README.md`, `CLAUDE.md`, `AGENTS.md` | root (the only DEVAI-authored root prose) |
| `LICENSE`, `NOTICE` | root (legal convention) |
| `docs/` | `docs/` narrowed — `law/`, `product/`, `work/` content extracted to their trees |
| `examples/` | `packages/examples/` |
| `scripts/` | dissolved — CLI verbs → `packages/cli`; build steps → owning package; one-shots → `scratch/` |
| `coverage/` | never committed at root — evidence runs → `record/proofs/work/coverage/`; otherwise `scratch/` |
| `packages/` | `packages/` (with per-package `src/` + `tests/` rail) |
| `.devai/` | `.devai/` retained (hidden, tool-named), reduced to pin + config + head state; append-only content → `record/proofs/`; F4 → `record/derived/`; worktrees → `scratch/worktrees/` |
| `vitest.config.ts` + 5 tier variants | `tests/config/` (optional single root shim) |
| `tsconfig.json`, `tsconfig.base.json` | root (workspace floor) |
| `tsconfig.typecheck.json` | retired by construction (§4 single include set) |
| `tsconfig.effects.json` | `packages/effects-check/` |
| `eslint.config.mjs` | root (flat-config discovery requires it) |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | root (workspace floor) |
| `.changeset/` | root (toolchain-fixed). `config.json` = Engineer workspace config; pending `*.md` = release intent with a lifecycle, consumed by `changeset version`; doctor freshness check: a pending changeset older than the last release is "awaiting next version" or "silted" — never ambient (the predecessor accumulated 27 across six rounds) |
| `.claude/` (and peer host-agent dirs) | root (tool-fixed), split by governance class: shared agent policy (`settings.json`, agent/skill defs, `launch.json`) **committed, F5-host, Architect** — it defines what an agent may do without prompting, which is authority policy whatever filename it wears; `settings.local.json` ignored (personal); `.claude/worktrees/` ignored (runtime, scratch-class, excluded from sensors/inventory like `node_modules`). The predecessor gitignored the whole dir, leaving agent permission policy ungoverned — DEVAI-II closes that |
| `.git`, `.github`, `.gitignore`, `.editorconfig`, `.npmrc`, `.node-version`, `.prettierrc.json`, `.prettierignore` | root dotfiles (host/toolchain conventions; `.prettierignore` shrinks to one entry: `record/`) |
| `.DS_Store`, `node_modules/` | ignored junk / dependency dir — uncounted |

### 8.2 Host-tool surfaces are governed surfaces

**A tool-fixed root path does not exempt its contents from the authority model.** The path is ecosystem floor; the data inside is classified like any other artifact — release intent gets lifecycle + consent semantics, agent permission policy gets F5-host classification and Architect authority, runtime dirs get scratch-class ignore-and-exclude semantics. The Article 6 enumeration carries one row for host-tool config dirs so that every future host tool that arrives is governed by default instead of re-opening the ungoverned-local-state gap.

## 9. Settled review decisions (2026-07-23; consolidated)

Each was argued in session review; the layout above integrates all of them. Declined alternatives are recorded so they are not re-fought (the REJ discipline applied to layout).

1. **`rounds/` + `audit/` group under `work/`.** Round-scoped twins with parallel numbering; as siblings, authority stays a static two-segment prefix. `proofs/` and `derived/` were declined for `work/`: proofs is the continuous verb-written spine spanning rounds; derived is F4 projection, not process record.
2. **`derived/` + `proofs/` consolidate under `record/`.** Authorship, not mutability, is the protection boundary: both are machine-only, and one prefix buys one firewall entry, one freeze entry, one doctor rule. Mutability stays a depth-2 property with per-subtree enforcement (regen byte-identity vs chain verification).
3. **The machinery dir is hidden and tool-named: `.devai/`.** After extracting proofs, derived, and worktrees, it holds only plumbing (pin, config, head state); hiding plumbing in a tool-named dotdir is the §8.2 convention, and dotdir-skip tooling behaves correctly by default. Governance visibility is achieved by extraction. `record/` stays *out* of `.devai/` — inputs vs outputs: the machinery dir holds the tool's inputs and runtime; testimony about the repository is output, and the evidence archive is the deliverable, not plumbing. (Supersedes an earlier draft's visible `devai/`; the tool-named half of that decision stands.)
4. **Placement criterion — reproducibility.** Clean-checkout + one command reproduces it exactly → `record/derived/`; immutable fact about a past event → `record/proofs/`; path-dependent runtime memory → `.devai/state/`.
5. **DECLINED — round-wise `work/R-NNNN/{plan,prompts,audit}`.** It puts a variable segment before the authority-deciding one, demoting Article 6 from a static-prefix table to a wildcard glob with a default remainder (the predecessor's 0.5.0-amendment shape, and the glob-pathology class its firewall needed a pinning test to contain). Secondary costs: mixed-authority per-round commits; authority-by-omission for unclassified files (`work/R-N/notes.md`). The cohesion it buys is read-only and incomplete (closure lives in `record/proofs/` regardless) and is served by the generated round ledger instead: **the read view can be generated; the write boundary cannot.** The sibling layout's one weakness — twin-numbering drift — is a doctor check.
6. **DECLINED — `product/` under `law/`.** Considered after the §5.1 meta-structure unification made product feel law-like. Declined on three grounds: (i) `law/` has many children, so `law/product/` recreates the default-with-exception authority rule ("Architect except product/ and glossary/") — the predecessor's `docs/framework/`-excluding-`product/` shape that this layout explicitly fixed; the `work/`/`record/` umbrellas avoid it only by having exactly two enumerated children and no remainder; (ii) the tree boundary structurally expresses the Article-12/D-7 compilation seam — product is intent, law is what intent becomes through the explicit compilation act, and the new cross-tier anchor guard presupposes the two sides; (iii) Owner standing: a top-level tree states that the Owner is a peer authority, not a tenant in the Architect's tree. Resolution principle: **uniformity of governance ≠ unity of authority** — product shares the record contract (§5.1) without sharing the tree.
7. **Assumed Owner decisions.** R30 closes before R-Ω; namespace `DII`; tabula-rasa genesis (empty history, `R-0001` = BR-1) — recorded in the dossier cover; this layout assumes them.
---

# PART VIII — Surface remediation plan (schemas + CLI + skills)

---

**Status: DRAFT, speculative session output (2026-07-23). Executes the findings of the usage audit (`devaii/scratch/review/usage-audit.md`; measured, not estimated). This part refines BR-1's W02 and W05 — it adds sub-batches, it does not add waves. Guiding rule: architectures are kept (two-layer surface, registry routing, strict schema canon); populations are garbage-collected at the absorption boundary, where GC is free of drift risk.**

## 1. Corrections to the working record (bind before anything else)

- CLI surface = **174 actions** (not ~119); Layer-2 skills = **53** (not 14); schemas = 62 (count was guarded and correct — the guard doctrine's proof case).
- Part VI (onboarding brief) is corrected accordingly; any figure cited anywhere in this dossier defers to the audit file.
- Standing rule for W01 (feeds the register §0 meta-rules): **every append-only population carries a count guard (drift), a liveness guard (dormancy), and a tombstone path (retirement).** The predecessor's three-population experiment proves the need: no guard → journal bloat (decisions); no guard → stale count in circulation (actions); count-guard-only → exact number over a 27%-dormant population (schemas).

## 2. Schema remediation (extends BR-1 W02)

### W02.a — Selective import
Import **45 + 2 bind-never-ghost + genesis-attestation = 48 contract schemas** (+3 infrastructure: common-defs, record-meta, meta = 51 roster files): CORE 26 + ADOPTER 10 + INTERNAL 9. The 17 dormant schemas are **not imported**; they remain in the frozen predecessor, revivable by a register entry citing a concrete consumer. The genesis attestation's `identifier_map` records each dormant schema as `disposition: archive`.

Two dormants need an explicit call before exclusion (they are test-enforced CLI output contracts, dormant only in prod code):
- `actions-list-output` — keep IF `catalog actions` output remains a public contract; then it imports WITH a production binding (the command validates its own output), not as a test-only ghost.
- `actions-evidence-gate-authorization` — the promotion mechanism is law with standing void-pending-re-earning (Part III); its schema imports with the mechanism, bound in the gate code, not test-only.
Default if unreviewed: import both WITH production bindings (option "bind", never "ghost").

### W02.b — Close the feature-live/schema-dead gaps
`stack-adapter` and `glob-guards`: replace the local TypeScript interfaces in pack-resolver and glob-guards with the schema validators + generated types. Acceptance: zero local re-declarations of a contract that has a schema; a lint rule or review checklist item prevents recurrence ("if a schema exists for the shape you are parsing, you consume the validator").

### W02.c — Registry mechanics
Replace eager compile-all-62-at-import with **lazy per-schema compilation** (compile on first `validators.X` access; roster completeness still type-asserted). Rationale: startup cost should scale with use, and a dormant schema should cost nothing even if one slips in. Keep the hard-coded roster (explicitness is a feature); it now lists 46.

### W02.d — Public API = imported set
`packages/schemas` exports subpaths for exactly the imported roster. Dropping the 17 dormant exports is a breaking change only notionally — zero production consumers is the definition of the class — but it rides the 1.0.0 major, where breaking is free.

### W02.e — Liveness guard
CI check (register-authorized): every schema in the roster has ≥1 production consumer (validator/parser/type import outside tests and outside the roster files). A schema that loses its last consumer goes red until either a consumer returns or a tombstone entry retires it. Count guard updates to 46 with the ceiling/floor pattern.

### W02.f — Authoring layer (the six qualitative improvements; measured 2026-07-23)
1. **Shared `$defs` layer** (`common-defs.schema.json`): verdict, severity ladder, roles, substrates/properties, lifecycle status, hash/timestamp/id patterns. Measured duplication in the predecessor: verdict enum ~15 schemas (case split RESOLVED in the wireframe: two vocabularies — execution statuses lowercase, judgment verdicts uppercase; extensions per context legitimate; only two bare restatements existed, rewired to $refs), hash patterns ×20, date-time ×42, roles ×13, severity ×7. Authoring uses `$ref`; publishing stays dereferenced (D-114 pattern) — consumer independence preserved.
2. **Registry-derived enums**: enums mirroring live registries (sensor kinds, actions, skills, domains) are generated from the registry at build, never hand-synced.
3. **`record-meta.schema.json`**: the §5.1 fragment as the defs layer's first customer, `$ref`'d by every per-type record schema and `check records`.
4. **Self-versioning**: `schema_version` on every schema (10/62 today) + evolution policy — additive-only within a major, closed-world in-repo, version-gated acceptance at the adopter boundary.
5. **Validated examples**: ≥1 `examples` per schema (1/62 today), validated in T2 — executable docs + the `check records` fixture corpus.
6. **Meta-schema + canon linter**: thin `meta.schema.json` (requires `$schema`/`$id` pattern/`schema_version`/`title`/`description`/non-empty `examples`; all 46 validate in T2) + `check schemas` for the recursive canon (closed-world every object node; common vocabulary `$ref`'d never restated; enum generation markers; dereferenced-publish byte-match). The canon stops being prose. Not a custom dialect — thin-formal + linter only.

Acceptance additions: zero restated common-defs vocabulary; meta-schema + `check schemas` green over the roster; every schema versioned and exampled.

## 3. CLI remediation (extends BR-1 W05)

### W05.a — Sense-wrapper collapse (the big one)
The ~40 per-sensor verbs under `sense` collapse into the parameterized runner: `sense run <kind>` (+ existing tier sets; `sense run --list` enumerates the registry). Sensor *implementations* are all kept — the audit shows they live at function level; only their CLI wrappers retire. The sensor registry becomes the extension point: **a new sensor kind costs a registry entry + design note, not a CLI action + docs page + effects row.** Kept as named verbs: the CI-invoked sensors (`sense lint`, `sense test`, `sense type check`, `sense inventory {api, data model, rbac, performance}`, `sense spec idiomaticity`, `sense docs drift`, `sense build`) — porcelain by measurement — plus `sense run`, `sense judge`, `sense readings *`, `sense mutation *`, `sense migrate check`, `sense runtime *`, `sense trace resolve`, `sense site drift`. Projected noun size: 56 → ~20.

### W05.b — UNKNOWN dispositions (six, each an explicit keep/kill)
- `work db stop shared` — KEEP (pair symmetry with `start shared`; absence would surprise).
- `work task resume rgr` was SUPPORTING; `work task pause rgr` porcelain — untouched.
- `govern triage dispatch` — KEEP if the loop's dispatch step routes through it (verify at rebind); else fold into `govern triage classify` output guidance.
- `agent prompt diff` — KEEP (pair with `freeze`/`compose`; diff is the review affordance).
- `work backlog compact` — KILL-candidate: fold into `work backlog list --compact` or retire with tombstone.
- `sense security scan` — resolve against the sensor registry in W05.a (likely a wrapper that collapses).
- `spec validate invariant strategies` — KEEP: it is the ADR-006 non-vacuity check; wire it into `spec validate all` so it gains a real invoker (its dormancy was the defect, not its existence).

### W05.c — Porcelain declared, not inferred
The command manifest gains a `tier: porcelain | plumbing` field. Porcelain (~20 verbs: init, adopt, doctor, work task/session basics, sense run + CI sensors, evidence verify pair, govern score/phase, spec validate all, docs publish, agent skill run) is what `devai --help` shows by default; plumbing shows under `--all`. Docs pages split accordingly. Measurement basis: the audit's CI-core-18 + high-doc-porcelain set.

### W05.d — Scripts through porcelain
Root and package `package.json` scripts route through `devai` verbs where a verb exists (`"lint": "devai sense lint"` etc.). The framework's own daily commands exercise its own surface — the audit found zero such routing in the predecessor, which is how 15% of the surface went dead without notice.

### W05.e — Surface guards
- Count guard: action count pinned (ceiling + floor) in glob-guards style; changing it requires the register entry that adds/retires the verb.
- Liveness: an action with no reference outside its own tests and generated docs for N releases goes red → consumer or tombstone.
- Tombstone path: retired verbs return exit 2 with a "retired in DII-nn, see <successor>" message for one major; the migration map (0.5-style) is regenerated.

## 4. Skills (review items, not remediation)

- 53 skills stand; the fix-factory (13) and writer (14) families are plugin-shaped and structurally fine. No pruning indicated by the audit — every skill has test coverage and none is reference-only.
- Review item for W04/W05: prompt overlays exist for only 6 of 53 — either the overlay mechanism is under-adopted (extend) or over-designed (bound); decide with the skills-architecture ADR successor.
- The mutating-skill denominator predicate (Part III / ADR-004 successor) recomputes over the imported skill roster — expect it to differ from the predecessor's 18; the number is derived, never carried.

## 5. Acceptance criteria (append to BR-1's round-level criteria)

1. Imported schema roster = 51 (48 contract + 3 infrastructure), all with production consumers; liveness guard green; zero local interface re-declarations of schema-backed shapes.
2. Action count at target with tier field populated; `--help` shows porcelain only; all six UNKNOWN dispositions recorded in the register.
3. Every retired verb/schema has an identifier_map row (`archive` or `tombstone`) — no silent drops.
4. Root scripts route through porcelain; CI green through the collapsed surface.
5. The three guards (count, liveness, tombstone) exist for actions, schemas, skills, sensors, and register entries — checked by doctor.

## 6. Effort note

W05.a is the only structurally risky item (router + effects table + docs regeneration + test re-pointing for ~40 verbs); it is mechanical but wide. Everything else is narrow. If BR-1 scheduling tightens, W02.b/c/e and W05.b/c/e are non-negotiable (they close audit-proven defects); W05.a and W05.d can defer to an early post-bootstrap round at the cost of importing the known-oversized surface first — record the deferral in the register if taken.


---

# PART IX — Deep-subsystem remediation (invariants, sensors, docs, proofs retention)

---

**Status: DRAFT, speculative session output (2026-07-23). Executes the findings of the three deep audits (`devaii/scratch/review/subsystem-audits.md`; measured, not estimated). Like Part VIII, this refines BR-1 waves — it adds sub-batches, not waves.**

## 1. Invariants (extends W02/W03 — light touch; healthiest population)

All 34 invariants import. At import: (a) fix INV-RBAC-001's stale trace `code_areas` (pr-compliance moved); (b) resolve INV-DEVAI-015 — either declare a typed ADR-006 strategy or record its experimental exclusion as deliberate in the register; (c) the 8 zero-invariant domains (API, CORE, DATA, HARNESS, INFRA, PERF, SEC, UI) are either trimmed from the domains registry or marked `reserved` explicitly; (d) materialize an empty tombstones file so the validator's tombstone check stops being a no-op — it becomes the retirement mechanism the population registry requires. The working figure is 34 (not "23+"); the readiness-bearing 32 is derived (33 by severity − 1 experimental) and must remain derived, never quoted as a constant.

## 2. Sensor system (reshapes W05.a from consolidation to correction)

The audit converts W05.a's wrapper collapse from surface hygiene into defect closure. Four registries disagree; 25 of 45 scorecard cells are starved with correlation 1.0 to tier-set absence; a recorded FAIL is invisible in the published card.

1. **One schema-backed sensor registry** (new F1 artifact under `law/`): each entry declares kind, emitting module, cells fed, tier membership, design-note path. The reading-schema enum, the kind→cell map, the tier sets, and `sense run --list` all **derive** from it. The duplicated map in `invariant-rollups.ts` is deleted. Registration constraints: no entry without an emitter; every entry feeds ≥1 cell or carries an explicit `diagnostic: true`.
2. **FAIL-persistence rule** (register entry; candidate invariant): a recorded FAIL is superseded only by a newer reading of the same kind, never by absence from a computation subset. Staleness renders REVIEW-stale, never UNKNOWN-overwriting-FAIL. This closes the harness_green_main invisibility defect.
3. **Reachability rule** (register entry): every non-degenerate, non-N/A cell is fed by at least one kind in a scheduled tier — otherwise the cell is honestly declared N/A. The predecessor's 24 one-manual-sweep kinds either join a tier (likely a new SWEEP tier run per round close) or their cells get declared dispositions.
4. Population GC at import: the 5 enum-only kinds archive; the 7 cell-less kinds get cells, `diagnostic: true`, or archive; design notes backfill for imported kinds only (the two post-rule violations get theirs first).

## 3. Documentation corpus (extends W06 — light touch; 82% imports as-is)

1. The 5 STALE fix at import: three one-line count/command corrections (SECURITY.md, framework/index.md, arch/cli-grammar.md — counts defer to guards, per the register meta-rule); the two lagging hand-maintained indexes (decisions-index at D-135/188, changelog-index at R21/28) are **not imported as files** — they become generated outputs in `record/derived/indexes/`, per the layout.
2. **Cluster canon rule** (register entry): concepts live in `docs/` framework pages, runbooks in `docs/dev/`, adopter how-to in `docs/adopters/`, law only in `law/` — every duplication-cluster member either merges into its canon home or reduces to a pointer. The 12 DUPLICATEs (round-workflow B0–B4 double-tree, role-declaration restatement) consolidate in W06.
3. HISTORICAL (11 files: migration guides, phase plans/audits, misfiled R13 closeout, the two "current-*"-named historical snapshots) stay in the frozen predecessor. The "current-*" misnomer class gets a naming rule: files claiming currency must be generated or guarded.
4. docs/site versioned snapshots (602 files) are not imported; DEVAI-II versioned docs begin at 1.0.0. The site machinery imports per Part VII.

## 4. Proofs retention — the genesis design decision (W00/W01; cannot be retrofitted)

The predecessor accumulated ~10,000 committed evidence files in one year (4,273 agent-runs + 4,559 skill records + 775 rtd-manifests + 235 readings). `record/proofs/` is append-only forever; without a write-granularity decision at genesis, it becomes the journal disease at repository scale — and retroactive compaction of evidence is precisely what the doctrine forbids.

**Decision proposed for W00:** proofs are written as **per-epoch, per-kind JSONL appenders** (an epoch = one round by default), not file-per-record: `record/proofs/work/agent-runs/R-0001.jsonl` etc. Each appended line carries its content hash; each epoch file is chain-linked into `chain.json` at round close (the closure record binds the epoch file's terminal hash). Properties preserved: append-only (JSONL append), individually addressable (line hash = record ID), verifiable (chain binds epoch terminal hashes), diffable (one file per epoch grows, nothing rewrites). Properties gained: file count scales with rounds (~dozens/year), not with executions (~10k/year); `git status` stays readable; the archive URL story improves (one epoch = one artifact). Raw per-record files remain permissible in `scratch/` during execution; only the appended epoch line is the record.

Retention: **nothing is ever deleted** — the policy is write-granularity, not disposal. If an epoch file is later found corrupt, the chain shows it; correction is a new appended erratum record, never an edit — same doctrine as everywhere else.

## 5. The population registry (W01 ratification — promoted from recommendation to requirement)

The six-population scoreboard is empirically conclusive: health tracks guard coverage exactly (invariants and docs guarded → healthy; schemas count-guarded only → exact count over 27% dormancy; actions, sensor registries, decisions unguarded → rot). W01 ratifies a **population registry** as an F1 artifact: every append-only population (decisions, actions, skills, schemas, invariants, sensor kinds, ADRs, workflows, examples, docs pages, proof epochs) declares its count guard, liveness guard, and tombstone path; doctor verifies the registry is total (a population without guards is itself a red check). This single artifact operationalizes the succession's central lesson.

### 5.1 Uniform record meta-structure — every append-able artifact adopts the ADR shape

The ADR tier is the only human-authored record family the predecessor governed with a machine-validated meta-structure — schema-fronted front-matter, id-in-filename, mandatory sections, an explicit status lifecycle, gapless numbering enforced by `check adrs` — and it is the family that never rotted. W01 ratifies that shape as the **standard record contract for every append-able artifact**, not just ADRs:

- **Common front-matter** (one shared schema fragment, per-type extensions): `id` (matching the filename/entry anchor), `title`, `type`, `status` (`draft | active | superseded | tombstoned`), `date`, `authority` (the role or verb that may author it), `supersedes` / `superseded_by`, `provenance` (predecessor refs or evidence refs).
- **Per-type schemas** extend the fragment: register entries (DII), ADRs, round plans and their amendment appendices, audit reports, REJ entries, sensor-registry entries, design notes, PC/closure records (already schema'd — the model case on the machine side, as ADRs are on the human side), proof-epoch headers, and **the entire `product/` family** (journeys, use-cases, stories, rules, owner mandates).
- **Product-tier specifics**: (i) native-format realization — JSON artifacts (journeys, use-cases) carry the fragment as schema fields, markdown artifacts as front-matter; one `check records` walks both encodings; (ii) Owner ergonomics — the meta-structure is scaffolded by the authoring skills and `init apply-owner`, never hand-typed: structure the Owner receives, not structure the Owner performs (the ex-D-57 adoption-barrier lesson); (iii) a new cross-tier guard this enables — **no active invariant may anchor solely on a superseded or tombstoned product artifact** — closing the "business moved, law didn't notice" drift class at the Article-12 compilation seam.
- **One validator, not N**: a generic `check records` walks the population registry, resolves each population's record schema, and validates every record — mandatory sections, id/filename agreement, status-lifecycle legality (a `superseded` record must name its successor; a `tombstoned` id may never recur), and supersession-graph integrity (no dangling pointers, no cycles).
- **Status is the GC hook**: the liveness guard of §5 reads `status`, so "dormant" stops being an inference from grep and becomes a declared, checkable state — the audit-by-agents this session performed becomes a standing mechanical check.
- Prose stays prose: the meta-structure governs identity, lifecycle, and skeleton — never the judgment inside the sections. The predecessor's lesson stands: narrative rationale is the part worth keeping human.

Acceptance addition: `check records` green over every population in the registry; zero governed record files without front-matter; the supersession graph resolves totally.

## 6. Acceptance criteria (append to BR-1 round-level criteria)

1. Invariants: 34 imported, trace clean both directions, tombstone file live, domains registry reconciled.
2. Sensors: one registry, all derived views byte-consistent; zero starved non-N/A cells; FAIL-persistence and reachability rules enforced by test; duplicated map gone.
3. Docs: zero STALE at import; cluster canon applied (no unmerged DUPLICATEs); no hand-maintained index files; no "current-*"-named static files.
4. Proofs: epoch-JSONL granularity from the first record; chain binds epoch terminal hashes; file-count guard on record/proofs (grows with rounds, not executions).
5. Population registry ratified, total, doctor-verified.


---

# PART X — Wireframe rehearsal report (final state, 2026-07-23)

---

**Status: factual report of the `../devaii` sandbox at rest. The wireframe is NOT the genesis — it is the rehearsal whose results this part records. Real BR-1 starts from empty history after R-Ω; this sandbox is discarded or re-derived then.**

## 1. What stands

17 commits; **27 contract tests in 5 files, all green**; root at 20 visible entries (ceiling 23). Every population in `law/` and `product/` is §5.1-governed and machine-verified:

| Population | State | Verification |
|---|---|---|
| Constitution | 42 articles (deltas applied in place; crosswalk annex; NEW Art 42 Evidence) | structure guard: 1..42 unique+ordered, record-meta front-matter, crosswalk-not-checklist |
| Register | DII-1 + 100 governed entries, §5.1 meta line each (provisional ids, W03 ratifies) | parse-back + record-meta 100/100; id uniqueness; REJ completeness; provenance presence |
| ADRs | ADR-001..012 with A1–A3 deltas embedded; predecessor seeds quarantined | record-meta 12/12; gapless numbering; id-binds-filename; draft-lifecycle discipline |
| Schemas | 51 roster (48 contract + common-defs/record-meta/meta) + 15 archived | meta-gate (red only on the deliberate examples gap); check-schemas linter slice (closed-world walk; zero restated verdicts, earned) |
| Invariants + trace | 34 wired to common-defs, absorption provenance, RBAC trace fix | ajv 34/34; trace green; bijection both directions |
| Product | 14 journeys + use-cases + OM-001 + rewritten README + compilation.md | native §5.1 fields; **live Article-12 seam check** (every related_invariants resolves, every seam non-empty) |
| Glossary | 37 entries + joint-authority README | 37/37; intra-glossary graph (see_also + related_invariants) resolves |

`packages/schemas` is real successor machinery: explicit roster, lazy per-schema compilation, common-defs pre-registration, the meta-gate, the linter slice, and the whole contract suite.

## 2. The defect ledger (seven catches, all pre-BR-1, all by the plan's own mechanisms)

1. **Roster count inconsistency** — "45+1=46" contradicted the bind-never-ghost rule; corrected to 48 contract + 3 infrastructure = 51 and propagated.
2. **Commit-before-verify ordering** (twice) — a red state committed before reading validation output; both amended with the incident recorded. Lesson: gates, not afterthoughts.
3. **REJ data loss** — the four rejections silently vanished during register regeneration; caught by the new check-records test on its FIRST run. The exact failure class §5.1 exists to prevent, caught by the exact mechanism it prescribes.
4. **No evidence article existed** — the manifest's "Articles 32–33 cover D-24" verification was wrong; the corpus's "Article-32 chain" citations are a numbering fossil. Resolved by the new Article 42; lesson for W01: citation guards must check the cited text says what the citer thinks (anchor existence is necessary, not sufficient).
5. **Seed staleness** — JNY-014 was committed to the predecessor after the wireframe seeding; the audit's count exposed it. Why the real genesis binds a frozen final commit.
6. **Article-41 duplication** — a splice at the wrong index duplicated the succession article and revived the stale annex; caught by the article-count check, fixed, and graduated into the structure guard.
7. (Meta) each manual catch became a permanent test — the catch-to-guard pipeline ran six times.

## 3. Determinations resolved by measurement (design questions closed early)

- **pass/PASS**: not one enum in two casings — two vocabularies (execution statuses lowercase with operational extras; judgment verdicts uppercase with grid extras). Extensions per context are legitimate; only two bare restatements ever existed (validation-result), rewired. W01 may rename the defs (`execution_status_core`/`verdict_core`).
- **Glossary authority**: not a naming collision — a per-term role enum (`owner|architect|joint`) that nearly IS record-meta's authority field; W02 reconciles by vocabulary alignment (+`joint` token), making glossary the first native full embedding.
- **Invariant authority collision is real** (anchors object vs authoring role) — recorded as W02-open in the schema's own $comment (candidates: `authority_docs` vs `authored_by`).

## 4. What this buys BR-1

W00–W04 are no longer designs; they are a once-executed recipe with the mistakes found: the per-schema rewiring recipe (rewire → augment instances with provenance → validate → refresh example from reality), the check-records pattern across seven populations, the six-improvement authoring layer proven live, and the §5.1 thesis demonstrated from both sides (born-conformant ADRs needed zero remediation; predecessor-form artifacts needed exactly the remediation predicted). Estimated W02/W03 effort drops accordingly; the residual unknowns are the ones the wireframe cannot touch: code rebind (W05), publication (W06), and everything gated on human marks.

## 5. Still deliberately red / open

The meta-gate examples gap (45/51 — fake examples would violate the canon harder than missing ones); registry-derived enums and the full check-schemas linter (await W05 registries/code); the Article-42 placement question; the altitude sweep; DS-01 and REV-0006 ⟦marks⟧; glossary content touch-ups (GE-016, GE-006/020/022) held for the W01 vocabulary pass.

## 6. Post-R30 verification addendum (registered 2026-07-23; P1 satisfied)

R30's verified content changes three of this dossier's working premises:

1. **The terminal decision is not D-189.** Predecessor numbering reached **D-195** at the R30 close (D-190..D-195 minted after this dossier's Parts I–III were drafted). Every "D-189" in Parts III–V is a symbolic name for *the terminal decision*, bound to the next-free number at R-Ω. The genesis-attestation schema's const is relaxed accordingly (wireframe applied). The manifest classification (Part I) covers D-1..D-188; **D-189-actual..D-195 are unclassified** — a small manifest supplement is now an R-Ω/Ω.A work item.
2. **The predecessor converged on this program's design.** R30 independently executed per-record governance (DESIGN-DECISIONS.md and BUILD-PLAN.md dissolved into docs/meta/adr/D-*.md + docs/meta/rounds/, byte-parity migration, round-archive verbs, a supported governed-round lifecycle). Consequences: (a) strong convergent validation of the §5.1/record/work designs; (b) the Part II **coupling inventory is stale** for the post-R30 tree (root monoliths gone; "root filenames unrenamable" was overcome by the predecessor itself) — re-verify at R-Ω, exactly as the R30 plan's own re-verification rule prescribed; (c) part of the succession's *internal-efficiency* motivation was delivered in place — the succession's remaining case rests on the clean genesis, evidence re-earning, layout, and 1.0.0 ratification, which R30 did not and could not do.
3. **Owner marks registered (2026-07-23, in session): DS-01 closed** — DS-1 Option A (arc terminates with predecessor; a fortiori, since R30's scope became governance re-architecture, not promotion), DS-2 Option A (REV-0006 ratified per recommendations; it is now the W03 product import list — notable rows: JNY-007 superseded by JNY-014; OM-001 completes with the predecessor, imported attested-historical; use-cases ref-mapping authorized as W03 work), DS-3 (product stays DEVAI at 1.0.0; repos rename in Ω.E with the successor taking `devai`; the old site freezes with a banner). **The only remaining human input in the program is the authorization sentence itself.** **The terminal decision is drafted in the native per-record canon at `devaii/scratch/pre-plan/D-terminal-draft.md`** (provisional id D-196, round-31): verified R30 values bound into Context (PC-0018, merge 1993f2ca, CI/Release run ids from D-195), DS-01 marks incorporated as items 5/8, tombstone range extended through the terminal record, the Ω.A manifest supplement made item 1, and — new, discovered from D-195 — **item 9 supplants the predecessor's pending in-place v1.0 ceremony** (the succession IS the v1.0 ceremony; the pending R30 changeset dispositions at close, flagged for explicit Owner confirmation at authorization since it retires a recorded predecessor intention). It supersedes the Part III "D-189" text.
