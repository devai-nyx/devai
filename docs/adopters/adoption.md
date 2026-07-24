# Adoption guide

This guide takes a fresh NestJS+Angular+Postgres client repository from "nothing installed" to "first green scorecard." It is the practical companion to [`user-guide.md`](./user-guide.md) — read that first for the *why*.

Target reader: an engineer adopting DEVAI into an existing or new client project. Estimated time: 60–90 minutes for a small repo; longer if the spec backfill is substantial.

> **Pick a profile first (D-112).** Adoption is tiered: `tier1` (hard gates + evidence chain — an afternoon), `tier2` (adds invariants + trace, advisory scorecard), `tier3` (the full loop this guide describes end-to-end). Pass `--profile <tier>` to the split bootstrap apply commands in step 2; climb later with `devai adopt upgrade --profile <target>`. See [adoption profiles](./adoption-profiles.md). New adopters should start at `tier1` and treat the later steps of this guide as their tier2/tier3 climb.

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 24.0 | Pinned in `engines.node` in `package.json` (`>=24.0.0`); CI runs Node 24. |
| pnpm | ≥ 9 | Other package managers are detected but unsupported. |
| git | ≥ 2.40 | Worktree subsystem requires modern `git worktree`. |
| Postgres | ≥ 15 | Only required if running `--with-db` flows or integration tests against a real DB. |
| Docker (optional) | recent | For the shared dev cluster (`devai work db start shared`). |

DEVAI itself runs on macOS and Linux. CI runs on Linux. Windows is not currently supported.

## Step 1 — Review the bootstrap plan (no writes)

```bash
cd /path/to/your/repo
npx devai init plan --target . --profile tier1
```

This reports the three authority-separated bootstrap segments without changing the repository. The F5 segment can also inspect the repository when it is applied. Its introspection record describes:

- `package_manager` (pnpm / yarn / npm / bun)
- `languages` (TypeScript, JavaScript, …) with file counts
- `frameworks` (NestJS, Angular, …) detected from `package.json` deps
- `source_globs` (heuristic — typically `packages/*/src/**` or `src/**`)
- `test_globs` (`**/*.test.*`, `**/*.spec.*`, `test/**`, `tests/**`)
- `protected_surfaces` (`.env`, `*.pem`, `*.key`, anything that looks like a secret)
- `proposed_project_type` (typically `runtime-host` for NestJS apps)

Review the output. If something is wrong (e.g., a real `apps/` directory wasn't detected because it's nested), note it; you'll fix the config in step 3.

## Step 2 — Apply each authority segment

```bash
npx devai init apply-owner --target . --profile tier1 \
  --as-role owner --write
npx devai init apply-architect --target . --profile tier1 \
  --as-role architect --write
npx devai init apply-f5 --target . --profile tier1 --introspect \
  --as-role architect --write
npx devai adopt upgrade --target . --as-role architect --write
```

The split applies write the Owner, Architect, and derived F5 segments **without overwriting** any existing file. `adopt upgrade` then materializes the repository-bound authority policy. The bootstrap entries include:

```
record/proofs/chain.json     # the audit chain genesis
record/proofs/counters.json           # TASK/RGR/CTG/ESC/REL counters
.devai/config/domains.json           # invariant-domain taxonomy (extensible)
.devai/config/thresholds.json        # scorecard thresholds
.devai/config/forbidden-actions.json # 16-entry runtime-safety registry
.devai/config/project.json           # project type + metadata
product/README.md               # Owner-tier stub
docs/theory/architecture/README.md          # Architect-tier stub
docs/reference/contracts/README.md             # Architect-tier stub
law/adr/README.md                   # ADR directory stub
docs/dev/operations/README.md            # ops specs stub
docs/dev/security/README.md              # security specs stub
law/glossary/README.md              # joint Owner/Architect stub
```

If anything already exists, an apply command reports it as `skip-exists` rather than overwriting. To re-seed a segment forcefully, repeat that exact apply command with `--force` and the same role declaration. Provenance-critical F5 state remains preserved per Article 32.

**Verify:** `devai doctor --adopter --repo-root . --format human`. The `authority-enforcement` check must report `binding`, the declared host mode, and whether arbitrary host tools are actually covered.

## Step 3 — Choose your project_type

Edit `.devai/config/project.json` to set `project_type` accurately:

| Value | When |
|---|---|
| `runtime-host` | The repo deploys a runtime (a NestJS service, an Angular app, a CLI). |
| `platform-package` | The repo ships a library other repos depend on. |
| `docs-archive` | The repo is documentation only. |
| `framework` | Like DEVAI itself — provides primitives others extend. |

The choice filters which invariants apply (Phase 10.J). A `docs-archive` repo doesn't need `INV-RUNTIME-*` invariants, for example.

## Step 4 — Adopt the law-pack invariants (if you're on the canonical stack)

If your repo is NestJS + Angular + Postgres + AWS Cognito, the law-pack scaffold gives you 15 cluster-level invariants in one shot:

```bash
# Copy the scaffold into your repo's invariants dir:
cp -R examples/law-pack/law/invariants/* law/invariants/
cp examples/law-pack/AGENTS.md AGENTS.md  # if you don't have one yet
```

The 15 invariants cover: stack uniformity, layered architecture, database, multi-tenancy (RLS), audit chain, identity (Cognito + JWT), sessions, RBAC, HTTP contracts, secrets, environments, testing, CI/CD, docs layout, agent contract.

Each invariant carries a `tags: ["LAW-XX.YY.Z"]` entry preserving the rule id from the deleted-history `stech-law` predecessor — useful for forensic grep against historical PRs.

If your stack is different, **don't adopt the pack** — author your own invariants from scratch using the CNL discipline (next step).

## Step 5 — Author your first invariant

Read [`architecture/invariant-authoring.md`](../theory/architecture/invariant-authoring.md) — it's the 5-minute primer on the CNL writing discipline (`<Actor> <MODAL> <Behavior> [WHEN] [UNLESS] [WITHIN]`).

Author an invariant at `law/invariants/INV-<DOMAIN>-001.json`. Minimal example:

```json
{
  "schemaVersion": "1.0.0",
  "version": "1.0.0",
  "id": "INV-AUTH-001",
  "domain": "AUTH",
  "severity": "hard-fail",
  "type": "security",
  "title": "Protected endpoints reject unauthenticated requests",
  "statement": "The API MUST return HTTP 401 WHEN a protected endpoint is requested without a valid bearer token.",
  "authority": {
    "docs": [{ "doc": "AGENTS.md", "anchor": "authentication" }]
  },
  "scope": {
    "components": ["api"],
    "code_areas": ["src/auth/**", "src/api/**"]
  },
  "change_policy": {
    "breaking_change_requires": ["doc_update", "test_update", "human_approval"],
    "test_weakening_allowed": false,
    "human_approval_required": true
  },
  "tags": ["auth", "security"]
}
```

If your domain (`AUTH` above) isn't in `.devai/config/domains.json`, add it. Then validate:

```bash
devai spec validate invariants --strict-cnl
```

`--strict-cnl` flags statements without a recognized modal verb. New invariants are expected to pass strict mode.

## Step 6 — Wire up trace

Edit `law/trace.json` to declare the invariant's tests and code areas. Minimal example:

```json
{
  "schemaVersion": "1.0.0",
  "version": "0.1.0",
  "invariants": [
    {
      "id": "INV-AUTH-001",
      "tests": [
        {
          "suite": "api",
          "path": "tests/api/auth/protected.test.ts",
          "names": ["GET /api/me without token returns 401"],
          "assertions": ["status is 401"]
        }
      ],
      "code_areas": ["src/auth/**", "src/api/middleware/**"]
    }
  ]
}
```

Validate:

```bash
devai spec validate trace
devai spec validate all   # runs all four validators
```

## Step 7 — First inventory regeneration

```bash
mkdir -p record/derived/inventory
devai inventory regen > record/derived/inventory/inventory.json
```

This walks your source tree and emits one JSON inventory record to stdout:
modules, routes, components, schemas, tests, and dependencies. The command is
read-only and never persists repository state implicitly; the explicit shell
redirection above owns that write. With a fixed timestamp and integration head,
the output is byte-identical across runs (the F4 self-application discipline).

If the walk takes too long or pulls in directories it shouldn't (e.g., `vendor/`), add them to `.devai/config/walker-ignore.json` and re-run.

## Step 8 — First sensor pass

Sense each substrate:

```bash
devai sense type check
devai sense lint
devai sense build
devai sense test
devai sense trace resolve   # confirms each invariant has a runnable test
```

Each emits a `SensorReading` to `record/proofs/sensor-readings/`. Read them with `--format human` to see findings inline.

If any sensor returns `fail` or `review`, the loop is now in steady-state error: you need either to fix the plant (the code), fix the sensor (the test, if `sensor-error`), or fix the spec (the invariant, if `policy-issue` or `reference-gap`).

## Step 9 — First scorecard

```bash
devai govern score compute --readings-dir record/proofs/sensor-readings/ --format human
devai govern score assess --format human
```

The scorecard is a 5×9 grid: substrates × transversal properties. The assessment recommends a gate decision: `pass | review | block`.

For a fresh repo with one invariant and one passing test, expect mostly green. As you add more invariants, more cells will be exercised; tune thresholds in `.devai/config/thresholds.json` if defaults don't match your context.

## Step 10 — First release gate

When you're ready to deploy or merge to main:

```bash
devai release gate \
  --scorecard record/proofs/scorecards/latest.json \
  --invariants-dir law/invariants \
  --readings-dir record/proofs/sensor-readings \
  --artifact docker.io/yourorg/yourapp:v0.1.0 \
  --environment staging \
  --strict
```

`--strict` makes the gate's verdict the exit code (0 = pass, 2 = block/review/inconclusive). Wire this into CI as the final pre-deploy step.

## Step 11 — Wire CI

Add a GitHub Actions workflow (or your CI equivalent) that runs, at minimum:

```yaml
- pnpm install
- pnpm run lint
- pnpm run typecheck
- pnpm test
- npx devai doctor
- npx devai spec validate all
- npx devai inventory regen
- npx devai sense type check && npx devai sense lint && npx devai sense build && npx devai sense test
- npx devai govern score compute --readings-dir record/proofs/sensor-readings/
- npx devai policy check forbidden actions
- npx devai policy check pr compliance --pr-body-file pr-body.txt
- npx devai evidence chain verify
```

See [`../../.github/workflows/ci.yml`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/.github/workflows/ci.yml) in this repo for the canonical example.

## Step 12 — Wire pre-commit (optional but recommended)

Install a pre-commit hook that runs the fast checks:

```bash
# .git/hooks/pre-commit
#!/bin/sh
npx devai spec validate all || exit 1
npx devai policy check forbidden actions || exit 1
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| An `init apply-*` command says its target exists | That authority segment already ran | Re-run only that segment with its declared role and `--force`; provenance-critical F5 state remains preserved. |
| `devai inventory regen` returns 0 modules | Source globs don't match | Edit `.devai/config/walker.json`; check `--include-ignored` flag. |
| `spec validate-invariants` rejects an anchor | The cited heading doesn't exist | Either fix the slug, add the heading, or pick a different authority anchor. |
| `spec validate-glossary` complains about duplicate terms | Two entries share a term (case-insensitive) | Pick distinct terms, or merge into one entry. |
| `sense test` skips everything | Test discovery globs missing | Check `vitest.config.ts` / `jest.config.ts`; ensure tests match the configured globs. |
| `release gate` always returns `inconclusive` | No scorecard provided AND no sensors freshly emitted | Run `sense …` first, then `score compute`, then `release gate`. |
| `check pr-compliance` fails | PR body lacks `Inv-Compliance:` trailer | Add the trailer to your PR body listing the INV ids you advanced. |
| LLM substrate doesn't start | `ANTHROPIC_API_KEY` (or equivalent) not set | Set the env var; or `export DEVAI_LLM_BACKEND=mock` for offline work. |

## Brownfield path (Phase 17, D-57)

The 12 steps above assume **greenfield** adoption: you pick a scaffold pack (law-pack or one of the redox-pack-*), author invariants, and run the loop. If you're adopting onto an **existing repo** with no DEVAI artifacts, the brownfield-adoption chain reverses the order: inventory the surfaces, surface candidate invariants from the gaps, curate.

### Step B1 — Run the full inventory sensor chain

```bash
# After the role-separated bootstrap in step 2. Order matters: api + data-model
# must run before rbac (which reads both for endpointBindings synthesis).
devai sense inventory api          # NestJS controllers → api-map.json
devai sense inventory routes       # React routes → routes-react.json
devai sense inventory data model   # Postgres migrations → data-model.json
devai sense inventory data handling # PII classification → data-model-pii.json
devai sense inventory rbac         # roles/permissions/bindings → rbac.json
devai sense inventory coverage     # route ↔ endpoint ↔ use-case triads → coverage-matrix.json
devai sense inventory dep graph    # TS imports → dep-graph.json
```

Each emits a `SensorReading` at `tier: L0` plus a body file under `record/proofs/sensors/inventory_<kind>/`. The bodies validate against schemas under `law/schemas/` (e.g. `api-map.schema.json`, `data-model-inventory.schema.json`).

### Step B2 — Detect which stack-adapter pack matches

```bash
devai adopt pack resolve --format human
# pack resolve: redox-pack-nestjs-postgres-react (priority=70)
#   stack: nestjs / react / postgres
#   matched signals (4):
#     package_dep_present: @nestjs/core
#     package_dep_present: react-router-dom
#     dir_present: apps/api/src
#     dir_present: apps/web/src
```

The resolver walks `examples/redox-pack-*/` (and any `--seeds <path>` you supply for out-of-tree packs) and picks the highest-match-count + priority pack. **Ambiguity** (≥2 packs tied at top) surfaces as `EXIT_REVIEW` with a list of tied candidates; resolve by picking explicitly with `--explicit-id <pack-id>`.

### Step B3 — Bridge: get candidate invariants from the inventories

```bash
devai inventory suggest --from-inventory --format human
# inv suggest: 6 candidate(s)
#   unmapped_route: 1
#   unmapped_endpoint: 2
#   unbound_endpoint: 2
#   unlabeled_pii_column: 3
#   forbidden_edge: 0
```

Each candidate is persisted under `record/proofs/inv-candidates/INV-CANDIDATE-<ulid>.json`. The body carries a `suggested_invariant` skeleton (title, statement, severity, measurable_via, rationale) that you can edit into a final `INV-CLIENT-*.json` under `law/invariants/`.

### Step B4 — Graduate the pack's seed invariants (optional)

If the matched pack ships pre-authored seed invariants (e.g. `INV-API-501` in `redox-pack-nestjs-postgres-react`):

```bash
devai adopt pack graduate --format human
# pack graduate-invariants redox-pack-nestjs-postgres-react: 1 copied
#   + INV-API-501 -> law/invariants/INV-API-501.json
```

The verb has a `--dry-run` flag (report what would copy) and `--force` (overwrite existing INV-*.json at the target). Collision-skip is the default to protect curator work.

### Step B5 — Synthesize prose docs

```bash
devai docs synthesize all
# docs synthesize-all: 12/12 passed
#   [OK] overview               pass -> docs/Overview.md
#   [OK] software-stack         pass -> docs/Software Stack.md
#   [OK] architecture-guide     pass -> docs/Architecture Guide.md
#   …
```

Each writer skill (`SKILL-write-*`) reads the inventory bodies + applies any per-stack `prompt_overlays` from the matched pack, then synthesizes a Markdown doc into `docs/<Name>.md`. Mermaid diagrams in ERD.md / Architecture Guide.md can be rendered to PNG via:

```bash
devai docs render mermaid --format human
# docs render-mermaid: mmdc 11.x present
#   files scanned: 26
#   blocks found:  3
#   rendered:      3
```

When `mmdc` is not on PATH, the verb gracefully reports `skipped_no_mmdc` and exits `EXIT_REVIEW` rather than failing.

### Step B6 — Curate candidates, author client invariants

Read the INV-CANDIDATE-* records. For each one you accept, either:
- Move the suggested_invariant skeleton into a new `law/invariants/INV-CLIENT-<DOMAIN>-NNN.json`, fill in the missing fields (verification, authority, scope), and delete the candidate. OR
- Edit the candidate's status to `rejected` and explain the reason in the rationale (for the forensic trail).

Once you have ≥1 `INV-CLIENT-*` authored, proceed to step 5 of the greenfield path above (compile tests → first inventory regeneration → first sensor pass → scorecard → release gate). The brownfield chain has front-loaded steps 1-4; from step 5 onward the flow is identical.

### Where Phase-17 brownfield work lives in the trail

- Substrate: [D-57](../../law/adr/README.md); the frozen pre-v1 build-plan archive preserves the original Phase 17.A–17.K execution rows.
- Schemas: `law/schemas/{api-map,routes-inventory,coverage-matrix,rbac-inventory,use-cases,function-points,dep-graph,stack-profile,data-model-inventory,inv-candidate,stack-adapter}.schema.json`.
- Sensors: `packages/sensors/src/inventory-*.ts`.
- Bridge: `packages/core/src/inv-suggest/`.
- Writer skills: `packages/core/src/skills/index.ts` (the 12 `SKILL-write-*` records) + `packages/core/src/skills/writers/`.
- Pack resolver: `packages/core/src/pack-resolver/`.
- Mermaid render: `packages/core/src/docs/render-mermaid.ts`.
- 4 inventory invariants: `law/invariants/INV-INVENTORY-{001..004}.json`.
- Source repo deletion: D-58 (and `tools/redox` is no longer on disk).

## What to read next

- [`user-guide.md`](./user-guide.md) — broader narrative if you skipped it (especially §14 for the brownfield walkthrough's narrative companion).
- [`roles/`](../roles) — for the specific role(s) you'll occupy.
- [`operations/`](../dev/operations) — for production-flavored questions about evidence, locks, worktrees, the autonomous loop.
- [`security/`](../dev/security) — for threat model + audit + authority enforcement.
- [`cli/`](../reference/cli.md) — for the per-verb reference (`devai sense *`, `devai inventory suggest`, `devai docs synthesize{-all}`, `devai pack {resolve,graduate-invariants}`, `devai docs render mermaid` all documented there).
- [`glossary/`](../../law/glossary) — for the canonical vocabulary.
- The Constitution (`law/constitution.md`) — when you need to reason about why the framework is shaped as it is.

## Asking for help

Open an issue with:

- The output of `devai doctor --format human`.
- The relevant `record/proofs/` records if applicable (redact secrets first; use `devai evidence redact` for any leaks already persisted).
- The exact command that surfaced the problem.

Per `docs/dev/security/secret-handling.md`, **never paste raw `.env`, API keys, or DB URLs**. The redaction filter scrubs harness-emitted records but does not scrub issue bodies.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/adoption.md (classification CURRENT).
