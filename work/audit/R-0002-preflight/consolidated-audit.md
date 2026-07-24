---
id: R-0002-PREFLIGHT-AUDIT
title: Post-freeze consolidated future-work audit
type: audit-report
status: draft
date: 2026-07-24
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    R-0001 as-built and freshness audits; R-0001 backlog,
    plans,
    prompts,
    handoffs,
    and PC-0001; live successor and frozen-predecessor verification; independent Claude Fable 5 review reconciled with Codex,
  ]
---

# Post-freeze consolidated future-work audit

## Claim boundary

This report observes and proposes. It ratifies nothing, releases nothing, deploys
nothing, and transfers no predecessor standing. OM-002 authorizes the later
repository-scoped campaign; this Auditor report does not.

## Scope and method

The audit read:

- all committed R-0001 plans, prompts, handoffs, backlog records, closure material, and
  Auditor reports;
- the three independent session freshness assessments for docs, law, and product;
- current law, product, packages, tests, workflows, release configuration, site
  configuration, root status prose, and machine proof records;
- the frozen predecessor’s immutable GitHub objects at its final commit;
- current successor GitHub repository, CI, Pages, and package state.

Codex performed an independent gap analysis. Claude Fable 5 then performed a separate
read-only review. Codex challenged two defects in the first Claude result: the local
predecessor remote was already correct, and the proposed campaign left governed records
in an unprepared “later” pool. Claude re-read the relevant sources, withdrew the remote
claim, and produced a complete item mapping. The register accompanying this report is
the reconciled result, with one additional correction: the later evidence campaign is
split into preparation and genuine observation so BL-037/038 are not falsely closed at
campaign open.

## Verified state

### Frozen predecessor

Values below were re-read from `devai-nyx/devai-original` at immutable commit
`05dd242bf72334bfd683096aed380e8240b6b9aa`, not copied from the gitignored handoff:

| Fact                              | Re-read value                                                      |
| --------------------------------- | ------------------------------------------------------------------ |
| Final commit                      | `05dd242bf72334bfd683096aed380e8240b6b9aa`                         |
| Final tree                        | `a6d6bf5ba06d78e182792441dffac4ae554b684c`                         |
| Evidence-chain internal head      | `d0c5b9ac2da64fb2e3533317abcc65511b593c3e610d301c60504cc8deddc9c4` |
| Evidence-chain whole-file SHA-256 | `8ae98775e373617f814e2e7bd3d2616f7664a90f761442b45d5b205537984fb1` |
| Closing decision                  | `D-196`                                                            |
| Closing record                    | `PC-0019`                                                          |
| Release disposition               | `none-needed`                                                      |
| Host state                        | public, archived, default branch `main`                            |

D-196 explicitly retires the pending predecessor changeset without a predecessor
release and freezes the repository. PC-0019 agrees. BL-002 therefore needs a
successor-side verify-and-close record, not implementation.

The rename, archive flag, frozen banner, successor link, and frozen-site deployment were
performed. The old `/devai/` Pages path is currently a successor-owned 404, the public
hash-copy mechanism is not yet on the successor History page, and the successor
attestation does not yet name both repositories correctly. BL-003 therefore needs a
close-with-residuals record tied to BL-001, BL-021, and the later successor site, not a
claim that every preferred transition behavior occurred.

The local `../devai` checkout is clean at the opening absorption pin
`d76cd12d2241a1a28a32a0fe629c6531da7fe74d`; its origin already resolves to
`https://github.com/devai-nyx/devai-original.git`. It remains read-only. Because it
does not contain the terminal commits, terminal evidence must be read through immutable
GitHub objects without fetching into or otherwise changing that checkout.

### Successor

The audited base was `cc0084ba38fb6d583f79fddd38554524714c4fa4`, equal to
`origin/main` at observation time. The repository is public and unarchived. Successor
Pages is absent.

After `pnpm run devai:prepare`, the repository floor is green:

- 89 test files passed;
- 812 tests passed;
- 8 tests skipped under their declared contracts.

The merged coverage gate remains an intentional release-blocking red:

| Metric     | Reading | Floor |
| ---------- | ------: | ----: |
| Statements |  28.22% |   70% |
| Branches   |  26.81% |   60% |
| Functions  |  31.09% |   70% |
| Lines      |  29.20% |   70% |

The floors are unchanged. This red is BL-017 and must be re-measured at every round
close until it genuinely passes.

The current exact-main CI run `30127221788` failed at the audited base: a cold Corepack
download notice entered the captured skill behavior signature, T2 failed, and stage 3
was skipped. That environment-dependent failure is not covered by the original
backlog.

Production-facing commands expose defects that the 812-test floor does not:

- `policy check adrs` rejects all 12 successor ADRs under predecessor-shaped metadata;
- `policy check glob guards` reports three zero-match predecessor path guards;
- `spec validate trace` stops on absent `.devai/config/domains.json`;
- `docs cli --check` reports 18 missing generated pages;
- `docs links` is green.

## Confirmed inherited findings

The R-0001 as-built and combined freshness audit are materially correct:

- the law remains draft and partly bound to predecessor schemas, paths, vocabulary, and
  materialized authority policy;
- product migration preserved several semantically stale claims that require Owner
  disposition rather than mechanical editing;
- migrated docs contain mixed historical, active, nonexistent, and now-name-flipped
  references;
- the P7 reusable local-evidence implementation has no dedicated backlog record;
- known reds KR-001 through KR-011 still reconcile to their existing backlog items;
- BL-040 through BL-043 remain valid N/A dispositions.

No audit supports ratification, release, deployment, readiness, or autonomous standing
at this boundary.

## Additional confirmed gaps

### Attestation and repository identity

The genesis attestation still names `devai-nyx/devai`, which now names the successor
itself, retains provisional `d76cd12d` bindings, stores the evidence-chain whole-file
digest in a field named `evidence_chain_head_sha256`, and leaves the closing fields
unset. BL-001 must bind the internal `.head`, carry the whole-file digest as a separately
described absorption document, point at `devai-original`, and keep `ratified: null`
until R-0003.

The post-rename string `github.com/devai-nyx/devai` now has different meanings by
context. Package repository fields are correct; predecessor citations are wrong or
silently self-referential. A mechanical replacement would corrupt valid successor
references.

### Closure integrity

PC-0001 records “43 of 43 records reconciled” as PASS while its cited as-built records
the unmatched P7 local-evidence deferral. PC-0001 is immutable. A machine-authored
PC-0002 must supersede it after the closure writer is repaired.

The closure implementation has two independently confirmed defects:

- `Number(d.slice(2))` produces `NaN` for every `DII-N` identifier, making the
  declaring/closing order guard ineffective;
- the TypeScript draft type omits the schema-valid `none-preratification` release
  disposition used by PC-0001.

The nominal `record/proofs/chain.json` remains a wireframe stub while PC-0001 and the
R-0001 JSONL epoch exist. Its role must be initialized or explicitly retired through
the proof-epoch work; it must not silently become a second authority.

### Round and worktree semantics

Article 6 and ADR-012 say round intent remains under `work/rounds/R-NNNN` and is amended
by appendix. The round-lifecycle implementation instead moves that directory to
`work/rounds/archive/R-NNNN`; JNY-014 describes the same incompatible archive move.

Article 27, CLI descriptions, authority policy, and operational docs use
`.devai/worktrees`, while the current loop implementation creates
`scratch/worktrees`. OM-002 resolves both choices: the three-tree doctrine stands and
`.devai/worktrees` is canonical. Until BL-050 closes, no campaign prompt may invoke the
existing round archive operation.

### Packaging and publication

Ten successor packages are currently public-to-publish at version 1.0.0:
`authority`, `cli`, `effects-check`, `evidence`, `loop`, `schemas`, `sensors`, `skills`,
`spec`, and `utils`. The fixed Changesets group lists only five of those and also lists
the absent `core` package. Existing predecessor GitHub Packages contain six private
packages, including `core`.

OM-002 resolves BL-025 toward an eleven-package fixed 1.x group: the ten split packages
plus an implementation-free compatibility and canonical-asset façade. GitHub Packages
remains restricted and canonical. Release evidence will attest the exact packed
tarballs; native npm-registry provenance wording must not trigger an unapproved registry
migration.

### Documentation and product

Root status prose, the History page, bootstrap instructions, active handoff labels,
generated projections, command documentation, state placement, and numerous historical
citations are stale. Site configuration now targets the successor name, so its hazard
has changed: an accidental deploy would publish an unratified successor site rather
than overwrite the predecessor. A deploy-refusal guard must land before site work.

Product defects include the JNY-014 lifecycle model, JNY-001 adoption doctrine,
object-by-object mutable-state placement, provisional and unresolved action references,
retired phase/decision references, and a performance use case whose command, reading
kind, script, and thresholds disagree with the implementation. OM-002 authorizes the
Auditor-recommended semantic disposition; the later Owner batch must record it
line-by-line.

## Anti-laundering constraints

- Do not edit PC-0001, closed R-0001 reports, or the frozen predecessor.
- Do not rewrite decision IDs, article anchors, state paths, or repository names in
  bulk.
- Do not regenerate a skill fingerprint merely to erase Corepack noise, widen the
  declared runtime-noise exemption, or weaken coverage configuration.
- Do not describe ratified law as released software, a built release candidate as a
  published release, or a campaign opening as earned evidence.
- Do not close BL-037/038 at instrumentation time. Real usage and a fresh Owner mandate
  are prerequisites.

## Auditor conclusion

R-0001 completed an honest bootstrap but closed with one incorrect reconciliation
criterion and several now-stale post-freeze facts. R-Ω fully closed the predecessor.
The successor requires 44 substantive active records, two verify-and-close records, and
four carried N/A dispositions. The serial R-0002 through R-0010 campaign in the
accompanying register gives every record exactly one primary home and preserves all
irreducible Owner gates.
