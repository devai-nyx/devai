# P4 — PACKAGES/CODE track (Engineer · effort: high · fans out internally)

Role: **Engineer**. You own `packages/**` + root workspace config. Source:
`../devai/packages/**` at the provisional pin (READ-ONLY; record the pin SHA you copy
from — it must equal the attestation's provisional value). law/, product/, docs/, tests/
(top-level) are not yours; per-package `tests/` moves ARE yours to relocate but their
content changes are P5's.

## Context to read first
`scratch/review/package-architecture.md` (REV-0007 — the ratified split map + edge list)
· `scratch/pre-plan/03-cli-surface.md` (CTX-03) · `scratch/pre-plan/07-errors-protocol.md`
(CTX-07) · dossier Part VIII (W05.a–e) · Part VII §3 packages rail + §4 tiers.

## Strategy — fan out per target package, dependency order

Spawn one subagent per target package, in layers (respect the measured layering;
parallelize within a layer only): 
`utils` (absorbs canonical-json, counters, templates, state, profile, glob-guards) →
`authority` → {`evidence`, `spec`} → `sensors` (port; depends effects-check) +
`effects-check` → `loop` → `skills` → `cli`. `schemas` already exists (extend, don't
replace: the wireframe validators + tests are LAW-coupled and stay).

Each package subagent: (1) copy its module set from the pin per the REV-0007 map;
(2) rewrite imports (`@devai-nyx/core` deep/self-subpaths → the new package graph;
the 46-file `authority-host-effects` self-import becomes a normal `@devai-nyx/authority`
dep); (3) **rebind paths to the successor layout** — constitution `law/constitution.md`,
schemas via `@devai-nyx/schemas`, state ledgers → `record/proofs/**` + `.devai/state`
(mutable head only), `docs/framework/arch/**` → `law/**`, decisions/build-plan references
→ register/rounds, per the coupling inventory + CTX packs; (4) relocate its tests to
`packages/<name>/tests/{unit,contract}` UNCHANGED in content (P5 owns content), fixing
only import paths; (5) `tsc` + its own vitest slice green before reporting.

## Scope decisions already made (apply, don't relitigate)
- Split per REV-0007; `core` dissolves (no façade — internal consumers only; adopter
  façade is a backlog item with the migration map, CTX-09).
- **W05.a sense-wrapper collapse: IN SCOPE** — implement the schema-backed sensor
  registry (law/ artifact, coordinate the file add with a draft register entry) +
  `sense run <kind>`; port CI-named sensor verbs; DO NOT port the ~40 tail wrappers.
  If the collapse jeopardizes the session budget, STOP the collapse (not the port),
  port wrappers as-is, and record the deferral — the fallback is pre-authorized.
- Error protocol (CTX-07): adopt the exit map + `error.schema.json` in `cli` routing
  now; full per-action output contracts are backlog.
- UNKNOWN-verb dispositions per Part VIII W05.b (keep/kill list as recorded).
- Node 24 floor; TS strict ESM; per-package `src/`+`tests/`; no co-located tests.

## Acceptance (wave exit, checked by you before reporting to the orchestrator)
`pnpm -r build` green · full vitest run green (all packages + the law contract suite) ·
zero imports from `../devai` paths · zero references to dissolved-monolith paths ·
`git -C ../devai status` untouched · dependency direction matches the map (no upward
imports — grep-verify) · role-pure commits, one per package layer minimum.

Final message: `DONE (per package: LoC ported, tests green) / DEFERRED (esp. collapse
fallback if taken) / DEFECTS-FOUND (anything the predecessor code contradicts in the
plans — report, don't improvise) / COMMITS`.
