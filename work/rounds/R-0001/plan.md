# DEVAI-II bootstrap round plan — draft

**Status: DRAFT execution record.** Appendix A's successor-side P0–P8 sequence was
executed under the granted Owner authorization; the older W00–W09 text below remains
historical design context where Appendix A superseded it. R-Ω was not executed and every
explicit `PENDING_R_OMEGA_*` token is governed by BL-001 or BL-003.

Shape: one predecessor-side closing round (**R-Ω**, in devai-original) and one successor-side bootstrap round (**BR-1**, in DEVAI-II), ten waves W00–W09. Waves are serial unless marked; each wave is one or more role-pure sessions with a commit boundary at every role change. The manifest is the scope control throughout: work not derivable from it is out of scope and requires a new decision.

---

## Preconditions (all hard)

- P1. In-flight state resolved — **Owner-decided 2026-07-23**: R29 is closed; R30 is in flight and closes factually in devai-original before R-Ω opens. No abandonment path; no open round at succession.
- P2. D-189 adopted: Owner authorization quoted verbatim; Architect session appends it as the final substantive record.
- P3. Manifest frozen: classification report + verification addendum committed under `docs/work/R-Omega pending BL-001/audit/` in devai-original, SHA-256s recorded in D-189 item 1. (These are currently scratchpad drafts; committing them is itself Auditor-output work under Article 7's designated path.)
- P4. Green predecessor: the four CI gates pass at the intended final commit.

---

## R-Ω — Predecessor closing round (devai-original)

| Batch | Role | Work | Validation |
|---|---|---|---|
| Ω.A | Auditor | Commit the manifest under `docs/work/R-Omega pending BL-001/audit/`; final read-only state survey | Files at declared paths; hashes match D-189 |
| Ω.B | Architect | Append D-189; update BUILD-PLAN Status to terminal ("this repository closes under D-189; successor: successor URL pending BL-003"); README banner pointing at successor | Four gates; `sense docs drift` green; `docs links` zero broken |
| Ω.C | Owner + Architect | Merge the closing PR; post-merge `devai govern phase close` → terminal PC record with `merged_as` + `release_disposition` (per D-110/D-134); final `devai evidence` chain verification | PC record schema-valid; chain verifies; final tree SHA + chain head + manifest hashes published — the three genesis-binding values |
| Ω.D | Auditor | Final freeze audit: confirm repo state matches D-189 items 7 and 10 (errata unfixed, R28 candidates unmerged, no readiness claims) | Read-only report in `docs/work/R-Omega pending BL-001/audit/` |
| Ω.E | Owner (host action) | Archive the repository read-only at the host (GitHub archive flag) | Repo flagged archived; no further commits possible |

R-Ω makes no successor claims. If BR-1 is later aborted, R-Ω stands on its own as a valid closure and the archive flag is simply lifted by Owner decision.

---

## BR-1 — Successor bootstrap round (DEVAI-II)

### W00 — Genesis (Architect)

New repository, **empty history — Owner-decided 2026-07-23: tabula rasa, clean genesis is the primary goal**. Blame-continuity for `packages/` is deliberately traded away; code archaeology happens in the frozen predecessor via the pin (D-189 item 4). The genesis attestation records the choice. Contents of the genesis commits:

1. `genesis-attestation.schema.json` — the successor's first schema.
2. `genesis-attestation.json` — binding Ω.C's three published values; `imported_evidence` exhaustive; `identifier_map` generated mechanically from the manifest's classification table (189 rows) by a throwaway script whose output is reviewed, not trusted.
3. `DECISIONS.md` opened with DII-1 (founding record) as its only entry.
4. Import commit: `packages/`, `examples/`, `.github/` at exactly final frozen predecessor SHA pending BL-001, unmodified. The predecessor's root governance files are **not** imported; `CONSTITUTION.md`, `BUILD-PLAN.md` (as `BOOTSTRAP-PLAN.md` → later `BUILD-PLAN.md`), README, CLAUDE.md/AGENTS.md are authored fresh in later waves. Until W05 rebinds them, imported checks that read root files run against a vendored `predecessor/` snapshot directory declared temporary in DII-1.

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

BR-1 closes per the imported D-110/D-134 ceremony: merge, post-merge phase close, PC record with `merged_as` + `release_disposition`. First successor release 1.0.0 after ratification under BL-020 ships through the continued `@devai-nyx` publish path — package continuity proven by a consumer (stynx) resolving the new version. Closing DII-record states the non-claims verbatim: bootstrap complete; zero readiness-bearing standing; every `must-re-earn` item still open.

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

# APPENDIX A (2026-07-23) — Single-session orchestrated bootstrap (supersedes conflicting wave text above; plan amended by appendix per work/rounds doctrine)

Owner answers bound (in session, 2026-07-23): **(1) clean-genesis re-init** — W00 creates a fresh orphan root; the verified wireframe tree is the *content* of genesis commit #1; rehearsal history is discarded (tabula-rasa mark honored). **(2) Successor-side only** — this session never writes to `../devai`; predecessor values bind PROVISIONALLY (pre-freeze HEAD, currently `d76cd12d`), attestation stays `status: draft`; a **re-bind step** is backlogged for after the human runs R-Ω. **(3) Authorization in chat** — quoted verbatim into `AUTHORIZATION.md`; the orchestrator refuses to start P0 while it reads PENDING.

Phase map (one session, gates between phases; prompts in `prompts/`):

| Phase | Track | Authority | Effort | Prompt |
|---|---|---|---|---|
| P0 | Genesis re-init + provisional binding | Architect (orchestrator) | high | 00 §P0 |
| P1 | Law completion (sweep, examples, defs alignment) | Architect | high | 01 |
| P2 | Product marks execution (REV-0006 = import list) | Architect executing recorded Owner marks | medium | 02 |
| P3 | Docs migration under the cluster canon | Architect | high | 03 |
| P4 | Packages/code port at pin (split map, parallel) | Engineer ×N | high | 04 |
| P5 | Test tiers + guards | Inspector | high | 05 |
| P6 | Scratch → backlog compilation | Auditor | medium | 06 |
| P7 | CI (stages 1–3 + round gates, local-evidence skeleton) | Engineer | medium | 07 |
| P8 | Close: as-built, closure record, epoch, final report | Auditor + orchestrator | high | 08 |

Non-negotiables carried from the rehearsal: verify-before-commit (defect #2), no silent scope changes, role-pure commits (`git -c user.name="DEVAI <Role>"`), every deferral becomes a backlog record — never a silent drop.
