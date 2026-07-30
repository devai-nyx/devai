# Remediation campaign 2 — Review Run 1 complete-class repair red evidence

Status: **INTENTIONAL RED — ENGINEER IMPLEMENTATION REQUIRED**

Authority: OM-016 and DII-250. Inspector boundary:
`787a651aa23bcf54711b0b2900b0643df3c0dc94`.
Reviewed failure source: `work/audit/R-0007-pre-entry/remediation-2-review-run-1-failure.md`.

This record preserves the executable population added after independent machinery
Review Run 1. It is not a PASS, certification, candidate freeze, R-0007 entry, or use
of Review Run 2.

## Exact command and result

```text
pnpm vitest run tests/contract/pre-r0007-remediation-1.red.contract.test.ts

Test Files  1 failed (1)
Tests       32 failed | 108 passed (140)
Duration    706.422s in the test file
```

The 108 passing tests include the complete historical fixture foundation and the
already-correct cycle-2 `REVIEW_TRANSPORT_BLOCKED` terminal check. The 32 failures are
the newly executable absent-behavior population:

| Finding class | Intended red population                                                                                                                     | Failed |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| R2-F001       | Continue after an injected failure and retain all 16 ordered gate dispositions; the last-gate injection is already complete by construction |     15 |
| R2-F002       | Reject false nonempty command closure; invalidate identical-tree history-sensitive reuse                                                    |      2 |
| R2-F003       | Unknown asset widens to suite plus coverage; six alias/wrapper/computed loader families widen likewise                                      |      7 |
| R2-F004       | Refuse scope/transport self-evidence; bind role-path evidence to commit, author, paths, classification, and verdict                         |      2 |
| R2-F005       | Authenticate predecessor state and transition from persisted artifact bytes; cycle-2 transport terminal already passes                      |      1 |
| R2-F006       | Compare declared decisions with register-derived dependencies; reject duplicate IDs before map construction                                 |      2 |
| R2-F007       | Ignore dirty tracked profile substitution during preparation; reject symbolic candidate identity at review boundary                         |      2 |
| R2-F008       | Detect coordinated registry/provenance deletion against an independent obligation baseline                                                  |      1 |
| **Total**     |                                                                                                                                             | **32** |

## Acceptance boundary

Engineer repair must make all 140 tests green without weakening or deleting an
adversary. R2-F001 must continue executing all remaining gates after a failure while
preventing freeze. Unknown and ambiguous dependency findings must select both full
suite and whole coverage. Independently derived decision, obligation, role-path, state,
and candidate identities must be compared with declarations rather than sourced from
them.

After implementation, the complete repository population and all governed gates must
be rerun from one clean committed candidate. Only then may an Auditor certify a new
candidate and authorize the final independent Review Run 2.

R-0007 remains not started. Its governed reviewer remains unbound. No deployment,
publication, evidence promotion, release, predecessor mutation, or Review Run 2 is
authorized by this record.
