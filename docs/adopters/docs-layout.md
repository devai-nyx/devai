# docs/ layout — adopter guide

**Authority:** Architect, issued cross-repo via [CONVENTIONS.md](./CONVENTIONS.md) §1 (2026-05-22).
**Applies to:** every DEVAI adopter (DEVAI itself, STYNX, PEC, TEAT, SGP, PORM).

## What this is

A canonical layout for the `docs/` tree, named with short forms only. Adopters implement the subset that applies to their repo. The full canonical tree (cited verbatim from CONVENTIONS.md §1) is:

```
docs/
├── eng/              ← engineering specs (api-surface, target-stack, invariants, maturity, inventory, ...)
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

## Per-subdir purpose

| Dir | Purpose | Audience |
|-----|---------|----------|
| `eng/` | Engineering specs that describe the system as built: api-surface, target-stack, invariant catalogue, maturity rubric, inventory generators, stynx-boundary contracts. | Engineers, agents producing code. |
| `arch/` | High-level architecture, system diagrams, the `invariants/` tree (one file per `INV-<DOMAIN>-<NNN>`), and `trace.json` (architecture-to-invariant trace). | Architects, anyone reasoning about the system. |
| `adr/` | Architecture Decision Records. One file per decision, immutable once accepted. Template at [`adr/README.md`](./adr/README.md). | Anyone wanting to know *why* a structural choice was made. |
| `contracts/` | Outward-facing contracts the adopter publishes to consumers: OpenAPI, JSON Schema, SQL DDL. Each contract authored per [`contracts/README.md`](./contracts/README.md). | Consumer engineers, integration partners. |
| `schemas/` | Internal JSON Schemas (request/response shapes inside the service). Not the same surface as `contracts/`. | Internal developers. |
| `ops/` | Operational runbooks: environment topology, release process, incident playbooks, SLA definitions. | Oncall, SRE, deploy operators. |
| `user/` | User-facing material: personas, training, demo scripts, release notes. **Portuguese (pt-BR) is accepted** here per the language policy. | End users, customer success, training. |
| `gov/` | Governance state and policies. **Adopter choice:** keep local OR delegate to a sibling DEVAI checkout (TEAT-style). Declare which in `AGENTS.md` / `CLAUDE.md`. | Auditor, Owner, Architect. |
| `security/` | Threat models, security controls, audit-trail policies. | Security reviewers, auditor. |
| `work/` | Transient working files. Git-tracked so the trail survives, but content is ephemeral. Don't link FROM stable docs INTO `work/` unless you've already promoted that material elsewhere. | Whoever is mid-task. |
| `prototypes/` | Evidence chains from ports-from-prototype work. Otherwise empty. | Auditor, post-port reviewer. |
| `glossary/` | Canonical terminology, one entry per term (`GE-<NNN>.json` or `.md`). | Anyone resolving naming questions. |

## Rename rule — short names only

No long aliases. The following long forms are **violations** of the canon:

| Long form (forbidden) | Canonical | Notes |
|----------------------|-----------|-------|
| `docs/engineering` | `docs/eng/` | trailing-slash form omitted to keep examples sed-safe |
| `docs/architecture` | `docs/theory/architecture/` | |
| `docs/operations` | `docs/dev/operations/` | |
| `docs/governance` | `docs/gov/` | |

Parallel forms are also violations — an adopter MUST NOT have both `docs/governance/` and `docs/gov/`. If you discover one mid-migration, the rename is incomplete; finish it before merging.

## Governance-delegation policy

An adopter may either:

- **keep `docs/gov/` locally** — the adopter's own governance state lives in-repo, alongside the code it governs; or
- **delegate `docs/gov/` to a sibling DEVAI checkout** — the adopter declares in `AGENTS.md` or `CLAUDE.md` that `../devai/` is the governance root, and `docs/gov/` is either absent or contains only a one-line pointer.

Both are supported. TEAT is the canonical example of the delegated form; STYNX is the canonical example of the local form. Whichever is chosen MUST be declared in the adopter's `AGENTS.md` (or `CLAUDE.md` for Claude-Code-driven adopters).

## Language policy

See [`language-policy.md`](./language-policy.md). Short version: English preferred for engineering, arch, ADRs, contracts, schemas, ops, security; Portuguese accepted in `user/` and where gov-br references are intrinsically Portuguese.

## Migration checklist

When renaming from a long form to the canonical short form:

1. **Move the directory** with `git mv docs/<long>/ docs/<short>/`. This preserves git history; `mv` followed by `git add` does not.
2. **Find every reference** in the repo (not just the docs tree):
   - Markdown: `*.md` cross-links — rewrite the long form to the short form.
   - Config: `_config.yml`, `_index.md` site-generator front matter.
   - Code: any `*.ts`/`*.js`/`*.mjs`/`*.cjs` that path-references `docs/`.
   - JSON: `package.json` scripts, `pnpm-workspace.yaml`, schema `$id` URIs.
   - Build: `CHANGELOG.md`, `work/rounds/R-0001/plan.md`, `CLAUDE.md`, `AGENTS.md`, `README.md`.
3. **Update site indexes**: `docs/_config.yml`, `docs/index.md`, `docs/adopters/README.md`. Any GitHub Pages / Jekyll / Hugo generator config that lists the renamed directory.
4. **Update CI**: any workflow step or path filter that references the old path.
5. **Verify with grep**: `git grep -n 'docs/<long>'` should return empty (excluding `node_modules/` and `.git/`).
6. **Commit as a single rename batch.** A bundled commit is easier to revert and to review than a piecemeal sweep.

## Cross-references

- Authority: [CONVENTIONS.md](./CONVENTIONS.md) §1.
- Database layout: [`database-layout.md`](./database-layout.md).
- Language policy: [`language-policy.md`](./language-policy.md).
- ADR authoring: [`adr/README.md`](./adr/README.md).
- Contracts authoring: [`contracts/README.md`](./contracts/README.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/docs-layout.md (classification CURRENT).
