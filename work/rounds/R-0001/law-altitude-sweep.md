---
id: R-0001-LAW-ALTITUDE-SWEEP
title: Constitution altitude sweep
type: round-finding
status: draft
date: 2026-07-23
authority: Architect
supersedes: null
superseded_by: null
provenance: Constitution W01 Annex item 6; R-0001/P1 LAW track
---

# Constitution altitude sweep

All 42 articles were read in full. No judgment-bearing article text was silently
rewritten. Three mechanical successor-path/count-description defects were corrected:
the preamble now describes Articles 41–42 accurately, Article 7 points to `work/audit/`,
and Article 13 points to `law/trace.json`.

Article 42 stays in Part XI. Evidence is a distinct constitutional concern; moving it
into Parts VII or VIII would not improve the doctrine and would re-anchor existing
references. Current source contains 34 invariant records, 56 `authority.docs` references,
and 32 constitution-article anchors. The earlier “55 imported anchors” wording is
therefore not a safe current count.

## Operational values to route into policy

These are findings, not constitutional amendments. Until a later Architect round
extracts them, the article text remains the draft source of truth.

| Article | Operational value embedded in the article | Recommended policy home | Suggested wave |
|---|---|---|---|
| 1 | Primary stack names and one-resolved-stack mechanics | stack-adapter policy | post-bootstrap W02 |
| 11 | Invariant id pattern, severity vocabulary, and exact readiness-bearing subset | common definitions + invariant policy | post-bootstrap W02 |
| 13 | Canonical trace path and completeness-ratio mechanics | docs/trace IA policy | R-0001 P3/P4 |
| 14 | `change_policy` field mechanics and approval flags | invariant schema + authority policy | post-bootstrap W02 |
| 15 | Four triage tokens and their routes | triage schema + routing policy | R-0001 P4 |
| 16 | Cycle A/B/C command composition and counter behavior | cycle policy | post-bootstrap W05 |
| 17 | Exact hard-gate command/check inventory | gate registry | R-0001 P4/P5 |
| 18 | Soft-gate rubric list, model separation preference, and thresholds path | scorecard/model policy | post-bootstrap W05 |
| 19 | Default attempt count, experimental 3+1 cap, and `experimental_blocked` token | iteration policy + task schema | post-bootstrap W05 |
| 21 | Escalated branch naming, notification channel, preservation duration, and disposable-database handling | escalation policy | post-bootstrap W05 |
| 22 | RGR fields, `rgr/<task-id>` naming, `rgr-pending`, and worktree disposal sequence | RGR schema + lifecycle policy | post-bootstrap W05 |
| 23 | Concrete model-family ladder ordering | model-routing policy (already identified by the article) | post-bootstrap W05 |
| 24 | Coupled-triplet branch derivation and merge/rebase choreography | work orchestration policy | post-bootstrap W05 |
| 25 | Lock key shape, denial priority bump, and repeated-denial threshold | lock policy | post-bootstrap W05 |
| 26 | Checkpoint cadence and mandatory completion checkpoint | work orchestration policy | post-bootstrap W05 |
| 27 | Worktree root, cap, cache list, and lockfile fallback | worktree policy | post-bootstrap W05 |
| 28 | Integration branch name `main` | repository policy | R-0001 P4/P7 |
| 30 | Weakening metrics, 20% default, absolute floor, and exemption algorithm | thresholds policy | R-0001 P4 |
| 31 | Quarantine metadata, review cadence, and eventual hard-fail rule | test/quarantine policy | R-0001 P5 |
| 32 | Concrete `SensorReading` field set | sensor-reading schema | R-0001 P4 |
| 34 | Post-merge hook, persistent worktree, and on-demand cadence | observation policy | post-bootstrap W05 |
| 37 | Prompt layer names and fingerprint structure | prompt-composition schema + policy | R-0001 P4 |
| 39 | `unknown`, `inconclusive`, and confidence-interval representations | shared definitions + result schemas | post-bootstrap W02 |
| 40 | Release/upgrade verb mechanics and client pin behavior | upgrade policy | post-bootstrap W06 |

## No extraction recommended

Articles 2–10, 12, 20, 29, 33, 35–36, 38, and 41–42 are predominantly durable
mission, authority, safety, or evidence doctrine. Articles not listed above contain no
operational value whose extraction would materially improve constitutional altitude.
