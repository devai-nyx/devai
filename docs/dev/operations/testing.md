# Testing operations

## Ordinary development

Select tests from the content-addressed task descriptor instead of repeatedly sweeping the
repository:

```bash
devai check --affected --task-plan --base <exact-base-commit> --format json
devai check --affected --run --base <exact-base-commit> \
  --as-role inspector --write --format json
devai check --affected --status --base <exact-base-commit> --format json
```

`--explain` reports why a node was selected, reused, or invalidated. Task keys bind Git blob
content, dependency keys, canonical runner/argv/cwd, toolchain, allowlisted environment, and
output contract. They do not bind mtimes or commit SHA, so identical content can reuse a PASS.

Never reuse FAIL, timeout, killed, aborted, malformed, or incomplete output. Unknown changed
paths must widen through the task descriptor's declared fallback. Dirty-tree runs are useful
for iteration but cannot produce a signed candidate receipt.

## Release-candidate gate

```bash
devai check --rc --task-plan --format json
devai check --rc --run --as-role inspector --write --format json
```

The RC closure includes the full eligible Vitest population once and enforces coverage floors
of 70% statements, 60% branches, 70% functions, and 70% lines. Database, E2E, performance,
and containment are separate non-overlapping nodes. Real provider credentials are always
explicit opt-in; ambient credentials must not create accidental cost or nondeterminism.

## Receipt verification

A candidate receipt is valid only for its exact repository, commit, tree, task-policy digest,
required-node closure, signer, and revocation state. The independently pinned remote verifier
rejects missing, stale, malformed, unknown, FAIL, or ABORTED nodes. A trusted signature proves
integrity and signer identity, not that execution actually occurred.
