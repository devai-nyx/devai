# Lightweight CI for DEVAI-governed repos

DEVAI's CI is deliberately verification-oriented. **CI is a freshness check,
not a value-producer** (D-101 + D-103): it recomputes deterministic gates in a
clean environment and verifies governed evidence, but it does not manufacture
an Auditor scorecard or an Inspector attestation. The Article 32 hash-chained
evidence ledger carries the audit trail across the local/CI boundary.

This page documents the model so adopters who copy DEVAI's `.github/workflows/ci.yml` don't inherit substrate that doesn't apply to them — and don't inherit theatre that wasted 3 weeks of CI runtime on the DEVAI repo itself before D-103 closed it out.

## What CI does

The authoritative inventory is [`.github/workflows/ci.yml`](https://github.com/devai-nyx/devai/blob/main/.github/workflows/ci.yml),
not a copied step count in this guide. Its two top-level jobs establish distinct
claims:

1. **`evidence-gate`** calls the reusable evidence workflow in verify mode
   against the candidate SHA and checks the Article 32 chain.
2. **`build-and-test`** uses a clean Node/pnpm environment and a real Postgres
   service. It runs build, dependency security, authority-mutator ownership,
   lint, formatting, typecheck, binding merged unit+integration coverage,
   regression, contract, smoke, supported E2E, experimental-containment,
   documentation, release-contract, F1, trace, action-coverage, CI-economy,
   glob-guard, inventory, real gate-verb smoke, and evidence-chain checks.

Merged coverage is a binding 70% lines / 60% branches / 70% functions / 70%
statements gate. It is deterministic verification, not permission for CI to
author a canonical scorecard.

Inventory sizes and test counts change during normal development. Query them
from the live surfaces instead of copying numbers from this page:

```sh
find law/schemas -maxdepth 1 -name '*.schema.json'
find law/invariants -maxdepth 1 -name 'INV-*.json'
devai catalog actions --format json
devai agent skill list --format json
devai spec validate test trace --format human
```

## What CI does NOT do

These operations remain outside the ordinary CI authority boundary even though
CI runs the deterministic tools beneath them:

- **Canonical sensor readings and scorecards.** The Inspector records these
  against the exact candidate with the required role and consent. CI does not
  promote ephemeral workspace state into readiness evidence.
- **Narrative assessment or ratification.** Green commands are inputs to human
  review, not an automatic Auditor or Architect decision.
- **Echo-only alignment.** R21 removed textual command-presence as proof.
  Candidate alignment requires an executable fail-closed action and fresh
  successful evidence bound to that candidate. CI exercises real gate verbs;
  it does not fabricate the durable Inspector reading.

## What you should do as an adopter

**Don't blindly copy DEVAI's `ci.yml` if your repo has different substrate.** Adopters with real product surfaces will *want* to run sense-* sensors on CI because the sensors produce useful signal about CI's own environment (e.g., `sense-routes` against a React app catches frontend route regressions). The principle stays the same:

1. Use CI for things CI can do uniquely: clean environment, frozen-lockfile install, cross-platform validation.
2. Use the Inspector for things humans-with-context produce: comprehensive scorecards, narrative assessments, threshold tuning.
3. Use the Article 32 evidence chain to bridge local + CI: the Inspector's local run is captured in the chain; CI verifies the chain.

For DEVAI-shape adopters (frameworks, libraries, CLI tools with no SaaS substrate), the lightweight CI in DEVAI's own `ci.yml` is the model to copy.

For product-shape adopters (web apps, services), keep the relevant sensor steps
in CI, but define what their results mean for that repository:

- **Do not translate absence into PASS.** If a substrate is genuinely
  inapplicable, declare the governed N/A posture. If it should exist, UNKNOWN or
  REVIEW remains visible; `--help`, comments, and echo statements are not
  evidence.
- **Sibling-SR dependencies**: `sense-rbac` reads `data-model.json` from `sense-data-model`'s output. If you run them in CI, run them in the right order — or run `sense-readings-rebuild` to populate from prior persisted bodies.
- **Stale-SR pollution under worst-wins**: `record/proofs/sensor-readings/` accumulates SRs across runs. On dev machines this leads to old FAIL readings polluting scorecards (see D-94). On CI it's usually fine (fresh checkout = empty dir), but if you cache the directory across runs, use `score-compute --latest-per-kind` (Phase 38.C) to filter to the latest SR per kind.

## Per-batch verification (the Inspector's responsibility)

DEVAI's repository instructions require scope-relevant checks per batch and the
binding close chain before readiness is claimed. The deterministic core is:

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test:coverage:integration
pnpm test:regression
pnpm test:contract
pnpm test:smoke
pnpm test:e2e
```

Repository self-application and the experimental containment suite add the
remaining scope-specific gates recorded in `AGENTS.md`, `CLAUDE.md`, and the
workflow. Scorecard computation is separate and must use the exact governed
readings and subject SHA:

```sh
node packages/cli/dist/bin.js govern score compute \
  --readings-dir record/proofs/sensor-readings/ \
  --latest-per-kind \
  --format human
```

Green deterministic gates, an intact Article 32 chain, and exact-subject
Inspector evidence are all necessary inputs. None alone is a production
readiness verdict.

## Forensic anchor

The D-103 framing was driven by a 3-week CI-red streak (2026-05-13 → 2026-05-18) on the DEVAI repo. Every red push had a different proximate cause but the same root cause: CI being asked to produce evidence rather than verify it. The full audit lives at `docs/dev/operations/phase-36-main-ci-audit.md`; [D-101](../../law/adr/README.md) and [D-103](../../law/adr/README.md) record the framing corrections that ended the streak.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/lightweight-ci.md (classification CURRENT).
