# Release discipline — two forms per verb (record + detector)

**Authority:** Architect (Constitution Article 6).

This runbook explains DEVAI's release-control surface for two flows that compose: **operator-supplied records** (the simplest case) and **charter-driven detectors** (the case where DEVAI itself probes the deployed runtime via a runtime charter). Both forms exist for `release postdeploy-verify` and `release runtime-drift`; the operator picks the form that fits their CI pipeline shape.

Earlier versions of this page documented the records-only form as a deliberate constraint. The detector form landed once the trigger for it materialized; this page now covers both.

## What each verb does — by form

| Verb | Record form (operator-supplied) | Detector form (`--runtime-charter <path>`) |
|---|---|---|
| `release gate` | Reads scorecard JSON + invariants + sensor readings, aggregates verdict. | (no detector form — gates are about local artifacts, not runtime probes) |
| `release postdeploy-verify` | `--artifact-chain-head` + `--audit-chain-head`: records the comparison verdict + rollback recommendation. | Executes an api-kind charter against the deployed runtime; any probe fail/error → `block` + rollback_recommended. The charter's probes assert the deployed state (e.g. "chain-head endpoint returns the artifact SHA"). |
| `release runtime-drift` | `--observation surface=delta` (repeatable): records operator-supplied observations. | Executes an api/auth-kind charter; each failed/errored probe is translated into a `surface = probe-name, delta = failed expectations` drift observation. |

Both forms persist a record under `record/proofs/releases/REL-NNNN.json` validated against `release-control.schema.json`. The detector form additionally consumes the runtime-probe machinery (`packages/sensors/src/runtime-probe.ts`) — same HTTP driver, same credential resolution as `devai sense runtime api/auth`.

The two forms are mutually exclusive at the CLI level: `--runtime-charter` and `--audit-chain-head` (or `--observation`) cannot be combined. Pick the form that fits your CI pipeline.

## Why the split

DEVAI's discipline is "evidence is governed; decisions are auditable." The release surface inherits that. Three pieces have to compose:

1. **Evidence gathering.** The runtime's audit-chain head is an artifact of the *deployment infrastructure* — k8s annotations, container labels, an HTTP endpoint on the service itself, whatever convention the adopter uses. DEVAI is intentionally agnostic about that convention because adopter conventions differ.
2. **Decision rendering.** Given the evidence, is the deploy go/no-go? This is what the `release *` verbs compute.
3. **Persistence + audit.** The verdict, the inputs, the decision time — all need to live forever for compliance / replay / forensic walk. This is what `REL-NNNN.json` is.

Bundling all three into a single "verify-and-detect-and-act" verb would couple DEVAI to deployment-infrastructure-specific probing logic. The verbs as designed delegate (1) upstream, own (2) + (3), and stay deployment-system-agnostic.

## The honest operational pattern

The release flow today, with all parts named:

```
  CI step                          DEVAI verb
  -------                          ----------
  build artifact                   (none)
  compute scorecard                score compute  (writes scorecard.json)
  spawn sensor readings            sense * (each writes a SensorReading)
  → gate decision                  release gate
                                   ↳ reads scorecard + invariants + readings
                                   ↳ persists REL-NNNN with verdict
  → on pass, deploy                (external — your deploy system)
  read deployed chain-head         (external — kubectl / HTTP probe / etc.)
  read artifact chain-head         (external — registry / image metadata)
  → postdeploy verify              release postdeploy-verify <heads>
                                   ↳ persists REL-NNNN+1 with match/mismatch
  → on mismatch, rollback          (external — your rollback machinery)
  observe runtime divergence       (external — your monitoring/diff system)
  → record drift                   release runtime-drift <observations>
                                   ↳ persists REL-NNNN+2 with the observed deltas
```

The middle column is what DEVAI owns. The left column is what *you* own.

## What you should do as the operator

1. **Don't expect the verbs to probe.** If you need actual detection (read the deployed chain head, diff config, etc.), write a small wrapper script in your CI that does the probing and passes the results to the DEVAI verbs via flags.
2. **Always run all three verbs in the release pipeline.** Even if the verdict from `release gate` is `pass`, run `postdeploy-verify` after the actual deploy. The two records together are the audit trail; one without the other is half a story.
3. **Treat `rollback_recommended: true` as binding.** The verb records the recommendation; honoring it is your operational discipline. The audit trail is useless if the recommendation is ignored.

## Detector form — charter shape

A `postdeploy-verify` charter is an `api`-kind runtime-charter where the probes encode the deployed-runtime assertions you want to verify. For example, to check that the deployed runtime exposes the artifact-of-record SHA at a known endpoint:

```json
{
  "schemaVersion": "1.0.0",
  "id": "RPC-postdeploy-prod",
  "kind": "api",
  "mission": "deployed audit-chain head matches artifact-of-record",
  "target": { "base_url": "https://prod.example.com/", "environment": "prod" },
  "probes": [
    {
      "pid": "P1",
      "name": "chain-head endpoint",
      "method": "GET",
      "path": "/.well-known/devai/audit-chain-head",
      "expect": { "status": 200, "contains": ["${ARTIFACT_CHAIN_HEAD}"] }
    }
  ]
}
```

The operator's CI step is responsible for substituting `${ARTIFACT_CHAIN_HEAD}` (or whatever placeholder convention you use) before passing the charter to `release postdeploy-verify --runtime-charter <path>`. DEVAI itself does not template the charter — it executes whatever it loads. That keeps the substitution mechanism out of the harness substrate.

A `runtime-drift` charter is an `api` or `auth`-kind charter where each probe encodes an *expected* runtime fact (a route returning 200, a header containing a value, an auth flow rejecting an unauth'd request). A non-pass outcome becomes a drift observation:

```json
{
  "schemaVersion": "1.0.0",
  "id": "RPC-drift-prod",
  "kind": "api",
  "mission": "drift surfaces vs artifact-of-record",
  "target": { "base_url": "https://prod.example.com/" },
  "probes": [
    { "pid": "P1", "name": "feature flag X enabled", "path": "/api/flags/x", "expect": { "status": 200, "contains": ["\"enabled\":true"] } },
    { "pid": "P2", "name": "deprecated route removed", "path": "/api/v1/legacy", "expect": { "status": 404 } }
  ]
}
```

Failed probes → observations → record persisted; `rollback_recommended: true` when any drift is present.

## Related

- [`evidence-chain-runbook.md`](./evidence-chain-runbook.md) — how the chain works, how to verify it.
- [`incident-playbook.md`](./incident-playbook.md) — what to do when `rollback_recommended: true` fires.
- [`../../docs/theory/architecture/known-tech-debt.md`](../known-technical-debt.md) — the "build detectors" item with migration sketch.
- [`../../reference/cli/release.md`](../../reference/cli.md) — auto-generated CLI reference; this page is the discipline doc that names what those one-liners can't.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/release-discipline.md (classification CURRENT).
