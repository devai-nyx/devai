# Sequencing rationale

```text
R-0006 closed baseline
  -> R-0007 CLI and executor contracts
  -> R-0008 authenticated convergence claims
  -> R-0009 product docs and deploy-ready site
  -> R-0010 release candidate [external publication gate]
  -> R-0011 evidence-reuse authorization preparation
  -> R-0012 genuine observation [fresh Owner gate]
```

## Why this sequence

The former Round 11 is a pre-RC breaking surface change. It must precede former R-0007,
otherwise the site and generated CLI reference would document the surface being replaced.
Its executor model also changes task schemas and execution evidence, so it belongs before
release-candidate packaging.

The former Round 12 depends on exact command closures, test populations, schemas, policy,
graph, toolchain, environment, and outputs. The CLI/executor round changes several of those
inputs; therefore authenticated reuse follows the CLI round. It precedes documentation so
the user-facing explanation of checks and rounds describes final convergence semantics.

The former Round 11 documentation wave and former R-0007 product/site round address the
same canonical-reference and user-education boundary. They are merged into R-0009 to avoid
two successive documentation rewrites and two independently drifting enumeration tables.

Release work remains serial after the source/product surface stabilizes. Evidence
authorization still requires a published close, and genuine observation still starts from
zero under a fresh mandate. These two subjects are not merged: preparation is bounded
repository work, while observation is a potentially long-lived operational campaign with
a separate activation decision.

## Why no additional split

CLI façade and executor substrate remain one round because the façade makes tasks
round-subordinate and therefore directly consumes the executor contract. They are separate
role-pure batches within R-0007, not separate acceptance boundaries. Authenticated reuse is
kept separate because it has a cryptographic trust root, false-green threat model, rollback
switch, and independent benchmark gate that should not share the CLI round’s claim ceiling.
