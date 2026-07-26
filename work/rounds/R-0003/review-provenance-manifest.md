---
id: R-0003-REV-PROVENANCE-MANIFEST
title: Durable founding-review provenance manifest
type: round-artifact
status: active
date: 2026-07-25
authority: Architect
supersedes: null
superseded_by: null
provenance: [BL-125; R-0001 scratch review inputs; DII-152]
---

# Durable founding-review provenance manifest

The R-0001 review inputs were originally placed under ignored `scratch/review/` for the
bootstrap. R-0003 discovered that three of those identifiers remained load-bearing in
active founding artifacts. This manifest graduates their exact bytes to a durable
governed path without changing their historical content, authority, or conclusions.
The scratch copies remain ephemeral and non-authoritative.

| Review     | Durable copy  | SHA-256                                                            | Attribution and disposition                                                                                                                             |
| ---------- | ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REV-0001` | `REV-0001.md` | `4b9f317ae63695077088999fc9d979929d7c7e76a6317ff02f41949a8915085d` | Architect draft preserved exactly; its stale 0.6.0 source label is historical and corrected for live law by DII-152.                                    |
| `REV-0003` | `REV-0003.md` | `da4223ac70b9f662c8e8efade42cd64f2c82f3a06655f87059d4a982e9d2015f` | Architect ADR disposition draft preserved exactly; DII-149 remains a preserved draft, while active DII-153 carries the corrected successor disposition. |
| `REV-0006` | `REV-0006.md` | `7d8bdb3ed0fb3f7d13b5ac892f0a7baf75d534bfd4460764847b2f1b2e2754bc` | Auditor-method review with recorded Owner marks preserved exactly; the durable Owner acts govern product meaning.                                       |

The copies live beside this manifest under `work/rounds/R-0003/reviews/`. Hash mismatch,
absence, or reliance on the scratch path is a provenance failure.
