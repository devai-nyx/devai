# Cross-Repo Conventions (Architect Authority)

Authoritative naming and layout decisions for all Stech repos. Adopters: DEVAI, STYNX, PEC, TEAT, SGP, PORM.

> **Provenance.** Promoted into DEVAI from `stech/align/CONVENTIONS.md` (the cross-repo coordination root) during DEVAI R1 alignment, 2026-05-23. DEVAI is now the canonical home; the `align/` original should redirect here once the alignment cycle closes.

## 1. Canonical `docs/` subdir names

Short forms only. No long aliases.

| Canonical | Replaces                          |
|-----------|-----------------------------------|
| `eng/`    | `engineering/`                    |
| `arch/`   | `architecture/`                   |
| `ops/`    | `operations/`                     |
| `gov/`    | `governance/`                     |

Full canonical `docs/` layout (an adopter implements the subset that applies):

```
docs/
├── eng/              ← engineering specs (api-surface, stynx-boundary, target-stack, invariants, maturity, inventory, ...)
├── arch/             ← high-level architecture, invariants/, trace.json
├── adr/              ← decision records (ADRs)
├── contracts/        ← openapi.json, *.schema.json — API surface contracts
├── schemas/          ← internal/request-response JSON schemas
├── ops/              ← environment, release, incident, SLA runbooks
├── user/             ← personas, training, demo, release notes (user-facing — pt-BR allowed)
├── gov/              ← optional: keep local OR delegate to ../devai/
├── security/         ← threat models, controls
├── work/             ← transient working files (diagnostics, inventories, phased-out plans) — git-tracked but ephemeral
├── prototypes/       ← only for ports-from-prototype evidence
└── glossary/         ← canonical terminology
```

Rules:
- Names are stable. Do **not** introduce parallel forms (`docs/governance/` plus `docs/gov/` is a violation).
- `docs/work/` is transient. Do not promote `work/` content into adopter-facing locations without explicit ADR.
- An adopter may keep `gov/` locally OR delegate to a sibling DEVAI checkout (TEAT-style). Both supported; declare which in repo `README.md` or `AGENTS.md`.

## 2. Canonical `./database/` layout

Replaces ad-hoc `db/`, `database/`, `prisma/migrations/`, `infra/db/` etc.

```
database/
├── ddl/
│   └── <nn>-<script>.sql        ← bootstrap DDL, 2-digit prefix, lowercase-kebab-case slug
├── seed/
│   └── <nn>-<seedfile>.sql      ← seed data, 2-digit prefix
└── migrations/
    └── <nnn>_<migration-name>.sql ← incremental migrations, 3-digit prefix, snake_case slug
```

Rules:
- DDL files bootstrap a fresh database in numeric order.
- Seed files run AFTER all DDL, in numeric order.
- Migrations are append-only and never re-edited once shipped.
- Each repo MAY add `database/policies/`, `database/views/`, `database/functions/` subdirs if needed; they slot between DDL and seed (declare order in `database/README.md`).
- Replace existing names by renaming directories; preserve git history with `git mv`.

## 3. Accepted languages

- **English is preferred** for all engineering, architecture, ADRs, contracts, schemas, ops runbooks, and code-adjacent docs.
- **Portuguese (pt-BR) is accepted**, especially for user-facing materials and DETRAN / gov-br references where the local audience is the source of truth.
- Mixed languages within a single file are allowed only when a quoted reference (statute, regulation, screen label, user prompt) is intrinsically Portuguese.
- File and directory **identifiers** (paths, slugs, schema keys, code symbols) MUST be English.
- Keep **coherency** within a document: don't switch languages mid-section without quoted context.

## 4. Canonical `.devai/` directory

`.devai/` is the governance state root for any DEVAI-enabled repo. Adopters following the new stack MUST have `.devai/` as their governance root; legacy `.codex/`, `.agent/`, `.artifacts/` are migrated.

```
.devai/
├── config/
│   ├── project.json
│   ├── domains.json
│   ├── forbidden-actions.json
│   ├── scorecard-na.json
│   └── thresholds.json
├── constitution.md            ← symlink to root law/constitution.md or local file
└── state/
    ├── agent-runs/
    ├── inventory/
    ├── inv-candidates/
    ├── locks/
    ├── tasks/
    ├── worktrees/
    ├── sensor-readings/
    ├── sensors/
    ├── skills/
    ├── rtd-manifests/
    ├── evidence-chain.json
    └── llm-usage.jsonl
```

## 5. Identifier conventions

- Invariants: `INV-<DOMAIN>-<NNN>` (e.g. `INV-RBAC-001`, `INV-AIT-001`).
- ADRs: `ADR-<SCOPE>-<NNNN>` (e.g. `ADR-FE-CONTRACTS-0001`).
- Skills: `SKILL-<verb>-<noun>` (e.g. `SKILL-compute-scorecard`, `SKILL-round-audit`).
- DEVAI CLI: `devai <noun> <verb>` (e.g. `devai evidence test matrix`, `devai evidence test record`).

## 6. Authority

These conventions are issued with **architect authority** as of 2026-05-22. Deviation requires an ADR pinned to `devai/law/adr/` referencing this file. Adopters reconcile via the per-repo round plans under `align/<repo>/round-N/`.

## 7. Work-break: rounds, waves, phases, steps

DEVAI work is broken into a four-tier hierarchy:

```
ROUND  R<n>            first-tier division; strictly sequential; ≥1 wave
 └─ WAVE   R<n>-W<m>   one prompt + one log; may sometimes parallelize
     └─ PHASE  R<n>-W<m>-<L>     optional grouping of steps
         └─ STEP   R<n>-W<m>-<L>.<num>   finest unit
```

| Tier  | Identifier            | Example                  |
|-------|-----------------------|--------------------------|
| Round | `R<n>`                | `R3`                     |
| Wave  | `R<n>-W<m>`           | `R3-W2`                  |
| Phase | `R<n>-W<m>-<L>`       | `R3-W2-A`                |
| Step  | `R<n>-W<m>-<L>.<num>` | `R3-W2-A.1`              |

Rules:

- A ROUND has an objective goal and at least one WAVE. Simple rounds have one wave; complex rounds have several.
- ROUNDS are strictly sequential — `R<n+1>` may start only after `R<n>` reaches local close.
- Each ROUND materializes under `scratch/sessions/rounds/round-<n>/` in the adopter repo with mandatory `Plan.md`, `prompts/00-orchestrator.{md,log}`, ≥1 `prompts/<nn>-<wave-desc>.{md,log}` pair, and `Closeout.md`. Optional `inv/` (machine-readable measurements) and `diag/` (interpretive findings).
- The orchestrator is strictly non-worker: it declares, dispatches, gates, and closes. Waves do the editing.
- Every prompt under `prompts/` carries a metadata header (`role`, `effort`, optional `model` + `vendor`). See [prompt-header.md](./prompt-header.md).

See [round-break.md](./round-break.md) for the operational playbook: artifact templates, log row schemas, parallelism rules, gate processing algorithm, close criteria, and right-sizing guidance.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/CONVENTIONS.md (classification CURRENT).
