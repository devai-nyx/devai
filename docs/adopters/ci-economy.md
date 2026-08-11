# Cheap local checks and receipt-only CI

DEVAI's test DAG behaves like a content-addressed build graph. A task key binds its Git
blob inputs, dependency keys, canonical executable and arguments, working directory,
toolchain, allowlisted environment, and output contract. Commit identity and file mtimes
do not invalidate identical content.

## Local development

Plan or explain the affected closure from an exact base:

```bash
devai check --affected --task-plan --base <exact-base-commit> --format json
devai check --affected --explain --base <exact-base-commit> --format json
```

Execute it only with the required local-write consent:

```bash
devai check --affected --run --base <exact-base-commit> \
  --as-role inspector --write --format json
```

Only PASS results are reusable. A changed source, test, helper, configuration, lockfile,
dependency key, toolchain, allowlisted environment value, command, or output contract
invalidates the affected closure. Unknown paths widen through the policy's declared
fallback rather than silently selecting nothing. FAIL, timeout, killed, aborted, and
malformed results are never reusable.

Dirty-tree iteration may populate the ignored local cache, but it cannot produce a signed
candidate receipt. Candidate attestation requires a clean tree before and after execution
and an exact commit/tree binding.

## RC gate

`devai check --rc --task-plan` selects the fixed release-candidate closure. The RC profile
runs full coverage once with floors of 70% statements, 60% branches, 70% functions, and
70% lines. Database, E2E, performance, and containment remain separate required lanes and
must not overlap the coverage population.

## Remote verification

Remote CI need not rerun routine product tests. An independently pinned verifier checks a
canonical signed candidate receipt against an allowlisted, non-revoked Ed25519 public key,
the exact repository/commit/tree, the approved task-policy digest, and the complete required
node closure. Missing, stale, malformed, unknown, FAIL, or ABORTED nodes reject the receipt.

This boundary is intentionally honest: a trusted local signature attests that the signer
claims the bound tasks and results. Cryptography detects tampering and identity mismatch; it
does **not** prove that the signer actually executed the commands. Trust in execution remains
a human and signer-operational decision.
