---
id: ROUNDS-INDEX
title: Governed round campaign index
type: index
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; R-0002-PREFLIGHT-AUDIT; R-0002-PREFLIGHT-BACKLOG]
---

# Governed round campaign index

R-0001 is closed historical bootstrap intent. Its files remain in place and are never
rewritten. Current future work is the serial successor-completion campaign:

| Round  | Purpose                                   | Authorization                                 |
| ------ | ----------------------------------------- | --------------------------------------------- |
| R-0002 | Frozen re-bind and operational-law repair | Granted for repository work                   |
| R-0003 | Founding ratification                     | Granted after R-0002 gate                     |
| R-0004 | Action identity and governed surface      | Granted after R-0003 gate                     |
| R-0005 | Evidence and corrected round mechanics    | Granted after R-0004 gate                     |
| R-0006 | Contracts and coverage depth              | Granted after R-0005 gate                     |
| R-0007 | Product/docs/site release preparation     | Conditionally granted after R-0006; no deploy |
| R-0008 | 1.0.0 release candidate and adopter proof | Preparation granted; external release pending |
| R-0009 | Evidence-reuse preparation                | Conditional on published R-0008 close         |
| R-0010 | Genuine evidence observation              | Prepared only; fresh Owner mandate required   |

Read `CAMPAIGN.md` for item ownership and dependencies and `EXECUTION-CONTRACT.md` for
rules shared by every orchestrator. Each round directory contains its own authorization,
plan, and copy-pasteable orchestrator prompt.

The current plan does not claim that any future round has executed. A round becomes
current only when its entry gate passes against live `main`.
