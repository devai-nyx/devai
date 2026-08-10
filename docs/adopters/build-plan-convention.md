# work/rounds/R-0001/plan.md convention

**Authority:** Architect (cross-repo). Issued R3-W5 (2026-05-23).
**Audience:** any DEVAI adopter authoring a project-lifecycle ledger.

## Purpose

`work/rounds/R-0001/plan.md` is the project's **lifecycle ledger** — the document an adopter maintains at repo root that records:

- The current phase of work.
- A forensic trail of every prior phase's closure.
- The dependency order of phases (what gates what).
- The detailed scope of each phase (its sub-batches, deliverables, exit criteria).

This convention canonicalizes the shape DEVAI itself has used for ~40 phases and that STYNX / PEC / TEAT have informally followed.

## File location

`work/rounds/R-0001/plan.md` at the **repo root**. Single file per repo.

## Canonical structure

```markdown
# Build Plan

(Introductory paragraph — one to three sentences on what the file is and
how it grows.)

## Status

**Current phase:** Phase NN shipped (one-sentence summary).
<inline body of the current phase: sub-batches landed, gates green, etc.>

**Prior phase recap (Phase NN-1 shipped).** <paragraph for each prior phase,
latest at top, oldest at bottom. Sometimes a sentence, sometimes a paragraph,
depending on the phase's substrate impact.>

…(continues for as many prior recaps as warranted)…

## Phase NN-current — <theme>

<details of in-progress or just-shipped phase, including sub-batch table>

## Phase dependency order

<dependency diagram or list of phases and what gates what>

## Phase 0 — <theme>

…

## Phase 1 — <theme>

…

## Phase NN-current — <theme>

…
```

The Status block lives at the top of the file and grows as phases close. Per-phase sections below it carry the detailed plan.

## Phase identifier convention

- **`Phase NN`** — integer, sequential, never reused.
- Phases are numbered in the order they were planned, not the order they shipped (in practice these are usually the same).
- Renamed or abandoned phases keep their number with a "rejected" or "absorbed by Phase X" note. Numbers are never recycled.
- DEVAI's work/rounds/R-0001/plan.md uses `Phase 0` through `Phase 39` at R3 time; STYNX uses `Phase 1` through `Phase 14`; TEAT has its own counter.

## Sub-batch convention

- **`NN.A`**, **`NN.B`**, **`NN.C`**, … within a phase.
- Each sub-batch corresponds to one tracked-in-commit increment (typically one commit, sometimes a small bundle).
- Sub-batches are NOT separate rounds — they're work increments within a phase that lands one commit at a time for reviewability.
- Example: `32.A` = "framing + D-87"; `32.B` = "sense-lint --timeout-ms flag"; `32.C` = "sense-migrate-check --emit-reading"; etc.

## Phase recap convention

When a phase ships, append a "Prior phase recap" paragraph to the Status block. Convention:

```markdown
**Prior phase recap (Phase NN shipped).** Phase NN closed <theme>. <N> sub-batches landed (`<first-sha>` → `<last-sha>`). <Sub-batch enumeration>. Counts at <last-sub-batch> close: schemas X, skills Y, invariants Z, CLI actions W. Gates green: lint clean, typecheck clean, `spec validate-all` clean across <N> schemas + <M> actions + <K> invariants. Distinct tests: <unit> unit + <int> integration + <e2e> e2e + … `devai docs cli --check` clean. `devai docs links` clean. <Notable framing decision>.
```

The recap is **stylized**. It builds a forensic trail readable forward (most recent phase visible without scrolling) and backward (historical phases reachable by reading down). DEVAI's recap discipline at R3 time is the canonical reference for the formality level.

## Phase-vs-round disambiguation

**The word "phase" appears at TWO scopes.** This is load-bearing — the canon does NOT rename either; readers must rely on context.

| Scope                            | "Phase" means                                                    | Identifier           | Lives in                                                       |
| -------------------------------- | ---------------------------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| **Project lifecycle** (this doc) | A multi-week / multi-wave milestone in the project's overall arc | `Phase NN` (integer) | `work/rounds/R-0001/plan.md` Status block + per-phase sections |
| **Round execution**              | An optional grouping of steps within a single wave               | `R<n>-W<m>-<L>`      | local planning state                                           |

**Disambiguation rule:** when context could be ambiguous, qualify:

- _"Phase 32"_ → project-lifecycle phase (unambiguous: integer).
- _"R3-W2-A"_ → round-execution phase (unambiguous: full path).
- _"the audit phase of R3-W4"_ → unambiguous: phase as a role within wave, not an integer.
- _"phase B of the wave"_ → unambiguous: lower-case "phase" + letter, round-execution scope.

Use the full identifier when in doubt.

## Nesting summary — all four tiers

The DEVAI canon uses **four** nested work-break terms across two orthogonal hierarchies. They are not a single chain — they form two parallel ladders that adopters traverse in different contexts.

```
Project lifecycle ladder                     Round execution ladder
(work/rounds/R-0001/plan.md)                 (work/rounds/R-NNNN/)

Phase NN                  ──orthogonal──►    Round    R<n>
  └─ sub-batch NN.A                            └─ Wave    R<n>-W<m>
  └─ sub-batch NN.B                                └─ Phase   R<n>-W<m>-<L>   (optional)
  └─ sub-batch NN.C                                    └─ Step    R<n>-W<m>-<L>.<num>
```

**The two ladders are orthogonal, not nested.** A single sub-batch may be authored across multiple waves of a single round, or across multiple rounds, or entirely outside any round (a direct commit inside a phase). Conversely, a single round may close several sub-batches or none — rounds are an execution-time discipline; sub-batches are a lifecycle-ledger discipline.

**Where each term lives:**

| Tier                       | Lives in                                                         | Belongs to                                           |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `Phase NN`                 | `work/rounds/R-0001/plan.md` Status block + per-phase sections   | project-lifecycle ladder                             |
| `sub-batch NN.A`           | `work/rounds/R-0001/plan.md` per-phase section + commit messages | project-lifecycle ladder (nests under Phase NN ONLY) |
| `Round R<n>`               | `work/rounds/R-NNNN/plan.md`, closed in place                    | round-execution ladder                               |
| `Wave R<n>-W<m>`           | `work/rounds/R-NNNN/prompts/<nn>-<slug>.md`                      | round-execution ladder                               |
| `Phase R<n>-W<m>-<L>`      | wave prompt's optional Phases section                            | round-execution ladder                               |
| `Step R<n>-W<m>-<L>.<num>` | wave prompt's optional Steps section                             | round-execution ladder                               |

**Sub-batch nests under (project-lifecycle) Phase ONLY.** A sub-batch does NOT nest under a round, a wave, or a round-execution Phase. If you find yourself writing `R3-W2-A.1.sub-batch-32.B` you have crossed the ladders — the two work-break disciplines are separate.

### Adopter-private overloads

Adopter docs MAY use their own vocabulary at the project-lifecycle level. PEC, for example, uses **`Wave A..E`** to denote multi-week migration milestones — the same word DEVAI uses for a single-prompt single-log dispatch unit (closest DEVAI analogue is `Phase NN`, not Wave). This is acceptable: adopter governance docs (`CONTEXT.md`, internal playbooks) reflect adopter history, while DEVAI's canonical tooling, skill manifests, sensor outputs, and CLI semantics use the canon defined here.

**Rule of thumb:** when an adopter doc and a DEVAI sensor/skill/CLI command disagree on what `wave` (or any other term) means, the DEVAI canon wins for tooling, the adopter doc wins for adopter-internal narrative. Cross-link the two when the collision matters.

## Naming summary — both scopes side by side

```
Project lifecycle      Round execution
─────────────────      ───────────────
work/rounds/R-0001/plan.md          work/rounds/R-NNNN/
─────────────────      ───────────────
Phase NN               Round    R<n>
  sub-batch NN.A         Wave   R<n>-W<m>
  sub-batch NN.B           Phase R<n>-W<m>-<L>      (optional)
                             Step R<n>-W<m>-<L>.<num>  (optional)
─────────────────      ───────────────
months → years         hours → days
```

Project-lifecycle phases run for weeks to months and contain many commits. Round-execution waves run for hours to days and ship one bundled gate-passing increment.

## Adopter checklist — when starting a new work/rounds/R-0001/plan.md

1. **Create `work/rounds/R-0001/plan.md` at the repo root.**
2. **Authoring template:** intro paragraph → Status block (initially carrying just the bootstrap phase) → Phase dependency order → Phase 0 detailed section.
3. **When opening Phase 1:** add a Phase 1 section below the dependency order; reference any predecessor.
4. **When closing a phase:**
   - Update the Status block: append "Prior phase recap (Phase X shipped)…" paragraph above the prior recaps.
   - Update the in-progress phase pointer to Phase X+1.
   - Keep the detailed Phase X section intact (don't collapse).
5. **For each sub-batch within a phase:** commit message starts with `Phase X.Y — <summary>` (or your repo's equivalent commit convention).
6. **Tools:** `devai docs cli --check` for auto-generated CLI doc freshness; `devai docs links` for cross-link integrity. Run before any phase close.

## What this convention does NOT govern

- The CONTENT of any specific phase (that's per-project).
- How many sub-batches a phase has (varies by scope).
- Whether to use markdown headers vs. tables for sub-batch tracking (style choice).
- Round-execution discipline is host-managed and local.

## Cross-references

- Recipe boundaries: [`recipes`](../reference/recipes/README.md).
- Identifier conventions for other artifacts: [`CONVENTIONS.md §5`](./CONVENTIONS.md#5-identifier-conventions).
- New DEVAI execution uses explicit local actions and the preview round recipe.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/build-plan-convention.md (classification CURRENT).
