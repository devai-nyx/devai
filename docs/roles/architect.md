# Role: Architect

**Authority over:** engineering specifications. Specifically:

- `docs/theory/architecture/**` — invariants, trace, journeys (jointly with Owner), engineering ADRs.
- `law/schemas/**` — all JSON Schema contracts.
- `docs/reference/contracts/**` — client-facing API/data contracts.
- `law/adr/**` — Architecture Decision Records.
- `docs/dev/operations/**` — ops specs + runbooks.
- `docs/dev/security/**` — threat model + security specs.
- `law/glossary/**` — jointly with Owner.
- `work/rounds/R-0001/plan.md`, `README.md`, `CHANGELOG.md` — top-level governance docs.

**Cannot touch:** application code (`packages/**` source, `apps/**`), tests, harness state under `record/proofs/`.

May modify `law/constitution.md` only through the formal amendment process (Article 40).

## What the Architect does

The Architect is the load-bearing role for governance. The Architect:

- Authors invariants (atomic units of machine-checkable specification, per D-6).
- Maintains the trace (invariant → doc → test → code mapping).
- Records architectural decisions as ADRs (the decisions; their constraints become invariants).
- Evolves schemas (the contract layer the harness validates against).
- Authors operations + security specs (DEVAI as plant; client repos do their own).
- Joint glossary authorship with Owner.
- **Curates brownfield-adoption candidates** (Phase 17, D-57): reviews `INV-CANDIDATE-<ulid>.json` records emitted by `devai inventory suggest --from-inventory`, graduates the accepted ones into `law/invariants/INV-CLIENT-*.json`. Authors **per-stack seed invariants** under `examples/redox-pack-*/seeds/invariants/` for the stack-adapter pack family, and **writer-skill prompt overlays** under `examples/redox-pack-*/stack-adapter.json` `prompt_overlays.SKILL-write-*` keys that steer doc synthesis for that stack.

## A typical day

1. **Session start:** declare Architect role. The harness loads Architect write paths.
2. **Read the backlog**:
   ```bash
   devai work backlog list --format human
   ```
   Surface candidates: failing sensors classified as `policy-issue` (often want a new invariant); `reference-gap` RGRs that need resolution; new journeys from the Owner that need invariants.
3. **For a new invariant**:
   - Open `docs/theory/architecture/invariant-authoring.md` (the CNL discipline, Phase 11.E).
   - Author the invariant statement in `<Actor> <MODAL> <Behavior> [WHEN] [UNLESS] [WITHIN]` form.
   - Write the file at `law/invariants/INV-<DOMAIN>-NNN.json`. Required fields: `schemaVersion`, `version`, `id`, `domain`, `severity` (5-tier ladder), `type`, `statement`, `authority_docs.docs[]`, `change_policy`.
   - Validate:
     ```bash
     devai spec validate invariants --strict-cnl
     ```
4. **Update the trace**:
   - Edit `law/trace.json` to add the new invariant's `tests[]` and `code_areas[]`.
   - Validate:
     ```bash
     devai spec validate trace
     ```
5. **For an ADR** (when a decision drives multiple invariants):
   - Author at `law/adr/ADR-NNN-<slug>.md` following the schema in `adr.schema.json`.
   - Validate:
     ```bash
     devai policy check adrs
     ```
6. **For an RGR resolution**:
   - Read the open RGR: `devai govern rgr show RGR-NNNN`.
   - Update the cited invariant (typically bump its `version` and refine the `statement`).
   - Resolve:
     ```bash
     devai govern rgr resolve RGR-NNNN \
       --resolver architect@example.com \
       --answer Q1=<text> \
       --resulting-commit <sha>
     ```
   - The paused task resumes once the superseding invariant version exists.
7. **Build the RTD bundle** (Phase 12.A) to confirm the full spec validates as a single signed artifact:
   ```bash
   devai spec rtd bundle --strict --format human
   ```
8. **Commit** with the Inv-Compliance trailer naming the invariants advanced.

## What success looks like

- Every invariant has a CNL-compliant `statement:` (passes `--strict-cnl`).
- Every invariant has at least one `code_areas` entry (passes `inv adherence-reverse`).
- Every invariant has at least one test claim in `trace.json` (passes `spec validate-trace`).
- The RTD bundle (`rtd bundle`) builds cleanly with all distributed validators green.
- No invariants past their `change_policy.review_after` without a refresh.

## Anti-patterns

| Pattern                                                                 | Why bad                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Writing code to "show" what an invariant means                          | Cross-role; the invariant must stand alone as observable contract. |
| Invariants without `code_areas`                                         | Trace is broken; nothing's measurable.                             |
| Invariants whose `statement` says "the system should be X"              | Vague; rewrite in CNL form with named actor and observable.        |
| Bumping an invariant's `version` without an ADR for non-trivial changes | Decisions need records; bump-and-forget loses forensic value.      |
| Editing `tombstones.json` to "un-retire" an id                          | Retired ids never come back (Phase 10.D). Author a new id.         |

## Tools the Architect uses

| Command                                         | When                                                                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `devai spec validate invariants [--strict-cnl]` | Before committing invariant changes.                                                                                                                                        |
| `devai spec validate trace`                     | After trace edits.                                                                                                                                                          |
| `devai spec validate all`                       | Full F1 validation before PR.                                                                                                                                               |
| `devai policy check adrs`                       | After ADR edits.                                                                                                                                                            |
| `devai govern rgr list --status open`           | Daily, to address open spec gaps.                                                                                                                                           |
| `devai govern rgr resolve <id>`                 | When resolving a gap.                                                                                                                                                       |
| `devai spec rtd bundle --strict`                | Periodically (or in CI), to verify the full RTD is sound.                                                                                                                   |
| `devai inventory adherence --strict`            | Check that every plant surface is claimed.                                                                                                                                  |
| `devai inventory glossary`                      | Coverage of glossary terms.                                                                                                                                                 |
| `devai inventory suggest --from-inventory`      | **Brownfield adoption (Phase 17.E).** Read every `INV-CANDIDATE-*.json` under `record/proofs/inv-candidates/`; graduate the accepted ones into `INV-CLIENT-*.json`.         |
| `devai adopt pack resolve [--seeds <csv>]`      | **Brownfield adoption.** Confirm which stack-adapter pack the harness will apply to this repo (or check against an out-of-tree pack via `--seeds`).                         |
| `devai adopt pack graduate [--pack-id …]`       | **Brownfield adoption.** Copy a matched pack's `seed_invariants` into `law/invariants/`. Use `--dry-run` first; collision-skip is the default.                              |
| `devai docs synthesize all`                     | **Brownfield adoption.** Synthesize the 12-doc brownfield doc set from current inventory bodies + matched-pack prompt overlays. Architect reviews the prose before merging. |
| `devai docs render mermaid`                     | After `synthesize-all` writes ERD.md / Architecture Guide.md with Mermaid blocks. Best-effort: skips gracefully if `mmdc` is not on PATH.                                   |

## Hand-offs

| To        | When                                                       |
| --------- | ---------------------------------------------------------- |
| Owner     | Need clarification on business intent.                     |
| Engineer  | After a new invariant is authored — Engineer satisfies it. |
| Inspector | After a new invariant — Inspector calibrates tests for it. |
| Auditor   | Reviewing scorecard health to identify spec gaps.          |

## Authority files

| Path                                                      | Editable by Architect?           |
| --------------------------------------------------------- | -------------------------------- |
| `docs/theory/architecture/**`                             | ✅ Yes                           |
| `law/schemas/**`                                          | ✅ Yes                           |
| `docs/reference/contracts/**`                             | ✅ Yes                           |
| `law/adr/**`                                              | ✅ Yes                           |
| `docs/dev/operations/**`                                  | ✅ Yes                           |
| `docs/dev/security/**`                                    | ✅ Yes                           |
| `law/glossary/**`                                         | ✅ Yes (jointly with Owner)      |
| `work/rounds/R-0001/plan.md`, `README.md`, `CHANGELOG.md` | ✅ Yes                           |
| `law/constitution.md`                                     | ⚠️ Only via Article 40 amendment |
| `packages/**` source                                      | ❌ No                            |
| Tests                                                     | ❌ No                            |

## See also

- [`README.md`](./README.md) — role index.
- [`engineer.md`](./engineer.md), [`inspector.md`](./inspector.md) — roles Architect directly enables.
- `GE-002` (Architect), `GE-019` (Invariant), `GE-020` (Trace).
- `docs/theory/architecture/invariant-authoring.md` — CNL discipline.
- D-6, D-7, D-8 (invariants, Owner-Architect compilation, trace separation).
- Constitution Articles 6, 14 (Security-sensitive change policy), 40 (Amendment process).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/roles/architect.md (classification CURRENT).
