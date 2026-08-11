# Known technical debt

This page records current limitations, not completed migrations.

## Inventory parser coverage

The sensor registry declares exactly which stack-pack parameters are consumed at runtime.
Several inventory paths remain framework-specific; a pack name alone is not parser support.
Add a parser only with representative fixtures, conservative unknown/incomplete semantics, and
an adopter that needs it. Generic regular-expression approximations must not be labelled as full
support.

## Local-attestation trust

The independently pinned verifier proves receipt integrity, signer identity, candidate binding,
policy binding, and required-node completeness. It cannot prove local execution. Stronger proof
would require a separately designed trusted-execution or remote-execution substrate. Until then,
documentation and UI must preserve the honest trusted-signer boundary.

## Generated reference convergence

Three generated CLI category pages still depend on runtime semantic updates:
`model-runtime.md`, `sense-presets.md`, and `round-task-executors.md`. Their generated interiors
must be refreshed from canonical sources after those runtime changes land; manual prose repair is
not a substitute.
