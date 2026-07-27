---
id: R-0005-THIRD-REVIEW-REPAIR-FLOOR-FAILURE
title: R-0005 third-review repair full-floor failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance:
  - KR-R5-037; KR-R5-038; KR-R5-039; Engineer 02aaaf7; Inspector e6a0d9d; Architect 29e3ff5
---

# R-0005 third-review repair full-floor failure

The first complete ordinary floor after the three third-review repairs passed 1,205
tests with eight declared skips and failed eight tests. Seven failures are exact
deterministic projection/corpus drift from the intended lifecycle, documentation, and
diagnose-only ADR changes. The remaining prompt-overlay failure is substantive:
`SKILL-fix-docs-links` still claims broad `docs/**/*.md` mutation through the retired
autofix exemption, producing one `PROMPT_OVERLAY_AUTHORITY_INVERSION` finding.

The bounded correction is to make docs-link recovery diagnose-only, preserving its
broken-link report while removing agent mutation and broad Architect scope. Inspector
fixtures must then be refreshed from the reviewed behavior, and the Architect-owned
repository-reference projection must be regenerated without changing semantic
classifications. No prompt-overlay exception, threshold change, source-set reduction,
or fabricated green result is permitted.
