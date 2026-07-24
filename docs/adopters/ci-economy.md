# Adopting the CI-economy law

**Law:** [`ADR-CI-ECONOMY`](../../law/adr/README.md). **Enforcement:** `devai policy check ci economy`. **Substrate:** the reusable evidence gate (`.github/workflows/reusable-evidence-gate.yml` in the devai repo) and `devai evidence test record --chain`.

This page is the practical adoption sequence for a governed repo. The ADR states the law; this page states the order of operations and the per-repo notes for the current adopter set (stynx, PEC, TEAT, senatran).

## The shape you are converging on

- **Remote, every PR:** lint, typecheck, build, unit tests, contract/schema validation, and one small `evidence-gate` job — all on `ubuntu-latest`.
- **Local, per batch:** the heavy tiers (integration, e2e, mutation, coverage, perf), each recorded with `devai evidence test record --tier <tier> --cmd "<command>" --chain` so the run binds to your commit and lands in the hash-chained evidence ledger. The records are committed with the PR.
- **Remote, weekly:** one scheduled audit workflow that re-runs the heavy tiers for real, skips green if nothing new landed, and revokes the short-circuit if it goes red.

## Step 1 — Pass the mechanical rules (no evidence substrate needed)

Run the sensor against your repo:

```sh
devai policy check ci economy --repo-root . --format human
```

Fix the hard failures first; they need no new infrastructure:

1. **`ci-economy.concurrency-cancel`** — add to every `pull_request`-triggered workflow:

   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

2. **`ci-economy.no-macos-on-pr`** — remove macOS legs from PR-triggered workflows (move them behind `workflow_dispatch` or the weekly audit). macOS bills at 10× Linux; a PR matrix leg on macOS is almost never buying signal worth 10×.
3. **`ci-economy.no-triple-trigger`** — a workflow with `pull_request` + `push` + `schedule` runs the same content three ways. Keep PR + push-to-main; move the scheduled run into the dedicated audit workflow.

**Not yet ready for step 2?** Rule 4 (`ci-economy.evidence-gate-wired`) is hard by default. If you are on the incremental path and have not wired the evidence gate yet, declare the staging profile in `.devai/config/project.json` (merged into your existing config):

```json
{
  "ci_economy": { "profile": "gate-staged" }
}
```

This downgrades rule 4 — and only rule 4 — to advisory: still evaluated, still reported on every run, never silently dropped. Rules 1–3 stay hard. The declaration is a visible staging state, not an exemption: complete step 2, then set the profile to `"full"` (or delete the key — absent means `full`). See ADR-CI-ECONOMY Decision 8 as amended by D-116.

Read the advisory findings too — they are the judgment rules (path filters, cron cadence, shared-DB heuristics). They don't fail the check because their correct answer depends on what your gates consume: **do not add path filters that blind a gate** (devai itself runs unfiltered because its Markdown is a tested artifact).

## Step 2 — Wire the evidence gate

Replace any hand-written evidence-gate job (or add one) with the reusable workflow:

```yaml
jobs:
  evidence-gate:
    uses: devai-nyx/devai/.github/workflows/reusable-evidence-gate.yml@main

  heavy-tier:
    needs: evidence-gate
    if: ${{ needs.evidence-gate.outputs.evidence_mode != 'true' }}
    # ... unchanged heavy job ...
```

Key points:

- The heavy jobs **stay in the workflow**. Evidence mode skips them visibly; it never deletes the fallback (ADR-CI-ECONOMY Decision 2).
- Set the repo variable `LOCAL_EVIDENCE_TRUSTED_ACTORS` (comma/space-separated GitHub usernames). Empty list = evidence mode disabled = every run takes the fallback path. That is the correct initial state.
- Standalone policy verification (no downstream jobs — the stynx `evidence.yml` shape) uses `mode: verify` instead of consuming the output.
- Repos on the devai evidence chain pass `chain-file: record/proofs/chain.json` to get Article 32 hash-chain verification in the same gate job.
- Do **not** copy the gate job body into your repo. One implementation, one repo, per ADR-CI-ECONOMY Decision 7.

## Step 3 — Record heavy tiers locally

Before pushing a batch, run the heavy tiers through the recorder instead of bare:

```sh
devai evidence test record --tier db  --cmd "pnpm test:integration" --chain
devai evidence test record --tier e2e --cmd "pnpm test:e2e" --chain
```

Commit the emitted records (`record/proofs/test-results/`) and the chain update with the PR. Evidence claims for a commit that (a) is older than 24h, (b) doesn't match the tree, (c) comes from an untrusted actor, or (d) touches workflows/evidence tooling will **fail** the gate — loudly, by design.

## Step 4 — Add the weekly audit

One workflow, `schedule` (weekly) + `workflow_dispatch`, that runs the full heavy matrix with evidence mode ignored. Requirements:

- Skip green (with a notice) when no new commits landed since the last successful audit.
- Never fail-by-design: a missing secret or absent precondition is a green skip with a notice, not a red run.
- If the audit goes red: empty `LOCAL_EVIDENCE_TRUSTED_ACTORS` until it is green again. Trust is re-earned by a green full run.

## Step 5 — Isolate databases in concurrent tiers

If your integration tier runs suites concurrently against one Postgres, apply ADR-CI-ECONOMY Decision 6 — either:

- **(a) per-package ephemeral databases**: keep the single CI Postgres *service*, but create one database per package from a migrated template, inject it per suite, drop it after; or
- **(b) serialize the DB-heavy suites** (concurrency 1) and let the rest parallelize.

Timeout inflation and retries are not compliance — they mask the contention and poison your own evidence history.

## Per-repo notes (2026-07 adopter set)

| Repo | Starting point | Adoption path |
|---|---|---|
| **stynx** | Prototype author: 5 hand-copied `evidence-gate` jobs (`ci.yml`, `evidence.yml`, `docs.yml`, `reference-apps.yml`, `release-prep.yml`), `verify-local-evidence.mjs`, daily cron on `ci.yml`, shared-Postgres tier gate with 3 logged contention-flake classes. | Phase 2 of this round: collapse the 5 jobs into `uses:` references (4 × `mode: gate`, `evidence.yml` × `mode: verify`); drop the daily cron in favor of the weekly audit workflow; implement Decision 6(a) per-package databases inside `stynx-tier-gate`. |
| **PEC** | Private repo, already on `@devai-nyx/cli`; concurrency + path filters landed in PR #21; weekly security scan. | Steps 1 (verify), 2 and 4; heavy tier is its integration suite (138 tests). Private consumers can `uses:` the public devai workflow directly. Declare `ci_economy.profile: "gate-staged"` until step 2 lands; graduate to `"full"` with it. |
| **TEAT** | First green CI 2026-07-10 (senatran mock as live service + runner Postgres/PostGIS); staged fail-fast pipeline; concurrency + path filters present. | Steps 1 (verify) and 3 first — its heavy tier (senatran-mock e2e + Playwright evidence tier) is the costliest per-run in the fleet; gate it behind the reusable workflow (step 2) once `devai:doctor` goes blocking (teat-R12). Declare `ci_economy.profile: "gate-staged"` until then. |
| **senatran** | Standalone by sanctioned exception (its D-0001); small CI, Docker layer caching, concurrency + filters landed in PR #5. | Steps 1 and 4 only. Its D-0001 exemption covers the stynx/devai package substrate, not the workflow-shape rules — the mechanical rules apply. Declare `ci_economy.profile: "gate-staged"` in its `.devai/config/project.json` (that declaration is senatran's own commit, not devai's); rule 4 then reports advisory until it wires the gate — satisfiable by its compose-smoke evidence step or a one-line gate adoption, per operator choice. |

## Order of operations, compressed

1. `devai policy check ci economy` → fix hard rules (no infra needed).
2. Wire `reusable-evidence-gate.yml`; set the trusted-actor variable to empty.
3. Start `devai evidence test record --chain` for heavy tiers in your batch discipline.
4. Add the weekly audit; only then populate `LOCAL_EVIDENCE_TRUSTED_ACTORS`.
5. Fix DB isolation in concurrent tiers (this is a correctness fix — do it even if you never enable evidence mode).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/ci-economy.md (classification CURRENT).
