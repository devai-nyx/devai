---
id: R-0005-DOCUMENTATION-RECONCILIATION
title: Commit-scoped historical and measurement reconciliation
type: round-reconciliation
status: active
date: 2026-07-26
authority: Architect
supersedes: null
superseded_by: null
provenance: [BL-176; BL-177; DII-202; R-0004-SOURCE-CLOSE; R-0004-AS-BUILT]
---

# R-0005 documentation reconciliation

## Commit-scoped closing language

A superseded closing decision describes only the contract and evidence visible at the
commit named by its provenance. Phrases such as “current,” “complete,” “final,” and
“all” in those snapshots are commit-scoped; they do not claim that later repair commits
already existed. A later closing decision supersedes the judgment without rewriting the
earlier body. Future closing decisions must state this scope explicitly.

## Entry and exit measurements

R-0004 began from a **146-action base** and a **54-schema base**. Its governed exit was
**147-action exit** and **55-schema exit** after adding the schema-check action and
action-registry schema. These are different measurement epochs, not competing totals.
R-0005 begins from the 147-action/55-schema exit surface; later R-0005 additions are
reported as their own exit measurement and never relabel the R-0004 base.

## R-0004 terminal-provenance repair cycle

The current R-0004 role-pure batch map must include the sixth-review terminal-provenance
cycle that was visible in the source close but omitted from the as-built table:

| Role      | Commit    | Commit-scoped disposition                                   |
| --------- | --------- | ----------------------------------------------------------- |
| Auditor   | `12f67ed` | Recorded the terminal provenance failure.                   |
| Architect | `7ca26c4` | Made the closing-decision provenance atomic.                |
| Auditor   | `c7dd9fb` | Paired the terminal provenance repair with the observation. |

The Auditor must append this exact map to the current R-0004 as-built during R-0005 B8.
Immutable commits, phase closures, review evidence, and superseded decisions remain
unchanged.
