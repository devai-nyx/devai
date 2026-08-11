# Local test evidence

Local task results live in the ignored content-addressed check cache. Only PASS results with an
exact matching task key and complete dependency closure are reusable.

```bash
devai check --local --task-plan --format json
devai check --local --run --as-role inspector --write --format json
devai check --local --status --format json
```

A signed candidate receipt may be produced only from a clean exact Git tree, using an approved
task policy and trusted signing wrapper. No private production key belongs in the product
repository. Remote CI independently verifies the receipt, signer allowlist/revocation state,
tree and policy binding, and required-node completeness.

Trusted local attestation is deliberately limited: it makes tampering and identity mismatch
detectable, but cannot prove that a trusted signer executed the commands. Failed or incomplete
verification is a hard rejection, never an invitation to silently reuse evidence.
