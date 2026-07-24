# Local-CI-evidence runbook

**Scope:** collecting and verifying local-CI-evidence manifests so a direct main push may skip heavy remote CI tiers. Per ADR-CI-ECONOMY Decisions 1–3 and D-117 (promoted from the stynx C-4 prototype).

Local evidence is a **maintainer shortcut for direct pushes to main**. It never replaces pull-request CI — `devai evidence local verify` always resolves `evidence_mode=false` on `pull_request`/`pull_request_target` events, unconditionally. Fallback semantics are never-silently-open: no claim → heavy tiers run remotely; a claimed manifest that fails any check → the workflow FAILs, it does not fall back to "run remotely anyway."

## Declaring the policy

A repo accepts no local evidence until it declares one in `.devai/config/project.json`:

```json
{
  "ci_economy": {
    "local_evidence": {
      "manifest_path": ".ci/evidence/local-ci.json",
      "max_age_hours": 24,
      "required_jobs": ["all-linux", "release"],
      "allowed_platforms": ["linux/arm64", "linux/amd64"],
      "forbidden_paths": ["infra/github/"],
      "require_docker": false
    }
  }
}
```

Only `required_jobs` is mandatory. `forbidden_paths` **extends** the built-in floor (`.github/workflows/`, `.devai/config/`, the manifest's own directory) — it can add policy-sensitive surfaces, never remove the defaults.

## Collecting a manifest

Run the declared heavy tiers locally, capturing each job's artifacts with a `metadata.txt` (`key=value` lines; must declare at least `job` and `platform`), then:

```bash
devai evidence local collect \
  --job all-linux:reports/ci-local/<all-linux-run> \
  --job release:reports/ci-local/<release-run>
```

Writes the manifest to the declared `manifest_path`, bound to the exact tree via a `sourceHash` over every git-tracked file (excluding the manifest's own directory).

## Claiming evidence mode

Commit the manifest with a trailer naming its path:

```text
Local-CI-Evidence: .ci/evidence/local-ci.json
```

On a direct push to `refs/heads/main` carrying that trailer, `devai evidence local verify --mode gate` validates: schema shape, policy alignment (the manifest's carried policy may be stricter than declared, never laxer), age (≤ `max_age_hours`), source-hash match, toolchain versions, per-job success + platform allowlist, actor trust (`LOCAL_EVIDENCE_TRUSTED_ACTORS`), and absence of forbidden-path changes in the commit range. Any failure is a hard FAIL — never a silent fallback.

## Verifying locally before pushing

```bash
devai evidence local verify --mode strict
```

Runs the same checks minus the trust/trailer requirements — a fast pre-push sanity check.

## The reusable gate

`.github/workflows/reusable-evidence-gate.yml` wires this by default:

```yaml
jobs:
  evidence-gate:
    uses: devai-nyx/devai/.github/workflows/reusable-evidence-gate.yml@main
    # verifier defaults to: npx devai evidence local verify

  heavy-tier:
    needs: evidence-gate
    if: ${{ needs.evidence-gate.outputs.evidence_mode != 'true' }}
```

Override `verifier` only for repos still on the pre-promotion `node scripts/evidence/verify-local-evidence.mjs` prototype during migration.

## Chained evidence

A trusted `gate`-mode verification (or a `strict`-mode local check) appends a `local-ci-evidence.verified` record to `record/proofs/chain.json` via `appendVerbEvidence` — best-effort; a missing/locked/corrupt chain degrades to a stderr warning and never fails the verification itself. Opt out with `--no-chain-record`.

## Failure modes

| Symptom | Cause | Action |
|---|---|---|
| `evidence_mode=false` on a trailer-carrying push | Policy not declared, or the manifest's `requiredJobs`/`allowedPlatforms` is laxer than the declared policy | Declare `ci_economy.local_evidence` in `project.json`; re-collect. |
| `manifest source hash mismatch` | The tree changed since collection (a fixup commit, a rebase) | Re-run `evidence collect-local` against the current tree. |
| `actor is not trusted for local evidence` | `LOCAL_EVIDENCE_TRUSTED_ACTORS` unset or missing the pusher | Set the repo/org variable; evidence mode never activates without it. |
| `evidence mode cannot be used with policy-sensitive file changes` | The push touches `.github/workflows/`, `.devai/config/`, or a declared `forbidden_paths` entry | This is by design — policy-affecting changes always require full remote CI. |

## See also

- [`evidence-chain-runbook.md`](./evidence-chain-runbook.md) — the canonical Article 32 chain this mechanism feeds.
- `law/adr/ADR-CI-ECONOMY.md` — the originating law (Decisions 1–3).
- D-117 (`law/register/DECISIONS.md`) — the promotion decision.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/meta/ops/local-evidence-runbook.md (classification CURRENT).
