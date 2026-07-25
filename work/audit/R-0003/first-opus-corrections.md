---
id: R-0003-FIRST-OPUS-CORRECTIONS
title: First Opus review correction audit
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  [
    R-0003-CLAUDE-OPUS-CLOSE-REVIEW; BL-120 through BL-128; DII-152; DII-153; clean implementation snapshot 7e630e5,
  ]
---

# First Opus review correction audit

## Verdict

BL-120 through BL-128 are locally repaired at clean implementation snapshot
`7e630e573538cc3dcb17d8aae1b4dc8c8f96bbc0`. The failed first Opus review and rejected
seal-mutating branch remain historical red evidence. A fresh full ladder, final Architect
closing decision, and exact-candidate Opus PASS remain mandatory before source push.

## Independent reconciliation

| Record | Observed correction | Role-pure commit |
| ------ | ------------------- | ---------------- |
| BL-120 | The wrapper and source ledger bind predecessor Constitution 0.8.0; rows 7, 18, and 30 and the annex-marker claim disclose the complete reviewed deltas. | Architect `8478e57` |
| BL-121 | The register container is active while per-entry lifecycle controls authority; draft entries remain proposals and the file date binds the container act. | Architect `8478e57` |
| BL-122 | Sealed ADR-005 transitions terminally to ADR-013, which binds both actual successor workflow paths. | Architect `7e630e5` |
| BL-123 | A new Owner mark records retention of the already-active glossary entries; joint guidance applies it without changing product meaning. | Owner `7c87f0e`; Architect `8478e57` |
| BL-124 | The production upgrade verb atomically materializes an existing version pin at Constitution 1.0.0 and preserves repositories where the legacy pin is absent. | Engineer `1449e4d`, `938e2ab` |
| BL-125 | Exact REV-0001, REV-0003, and REV-0006 bytes are durable and hash-bound by a governed manifest. | Architect `8478e57` |
| BL-126 | This append-only correction records the full review-repair sequence and refreshed evidence. | Auditor, this commit |
| BL-127 | The generator requires an explicit target, supports no-write `--check`, participates in Stage 1, and its current projection verifies. | Engineer `1449e4d`; Architect `611e14c` |
| BL-128 | The clean branch omits all illegal intermediate ADR mutations, preserves six sealed multi-source records, parses their semicolon delimiter, and performs only ADR-005's legal lifecycle transition. | Inspector `726fe66`, `0ba2612`; Engineer `fa17a5c`; Architect `7e630e5` |

Inspector `4fd2d05` proved the first-review contracts red before implementation. Auditor
`75d9225` preserved the exact first-review boundary and extended the gapless backlog
through BL-127. BL-120 through BL-127 are the original first-review set; BL-128 governs
the subsequent seal-integrity correction. The original as-built's B1 row omitted that
Architect `250eac1` also
rewrote the R-0002 repository-reference projection; that deterministic side effect is
now explicit and changes no role attribution or source conclusion.

## Corrected bindings

| Artifact | SHA-256 |
| -------- | ------- |
| Constitution 1.0.0 | `31c6874f2a0ae88a21e1114844c4084e9f0e9d8c58d54f7fefc1078af98fb8cd` |
| Genesis attestation | `d72711c57e54025ebd2626b2ba20a1263db7d914e308d7d4ce172f4faee6bb09` |
| Canonical authority policy | `6539f91912d1770ea49449c05ac17a84cef76aec0e22eacc133552eddfb785c2` |
| Materialized authority policy | `6539f91912d1770ea49449c05ac17a84cef76aec0e22eacc133552eddfb785c2` |

The genesis attestation is byte-unchanged. The Constitution correction changes only
reviewed provenance and ledger truth, not article doctrine or the ceremony timestamp.
The self pin still resolves to the canonical Constitution.

## Fresh repaired working-tree gates

Against the clean implementation snapshot with this Auditor report present in the
working tree:

- decision-record integrity passes the entire clean branch history;
- deterministic trace resolves all 34 invariants;
- the repository-reference projection verifies 157 locators in no-write mode;
- focused founding, register, ADR, authority-policy, and review-repair implementation
  contracts pass;
- the complete ordinary floor first exposed five stale fixed-cardinality ADR assertions
  governed by BL-129, then passed after Inspector `08025ba` aligned the contracts.

The complete final exact candidate ladder, including coverage and T1 through T6, must be
restarted after the final Architect closing decision. No result here predeclares that
future exact candidate or Opus verdict.

## Nonclaims

The corrections ratify no additional doctrine and establish no release, deployment,
publication, readiness, evidence promotion, autonomous operation, or re-earned standing.
PC-0004 is not emitted, and R-0004 remains dormant.
