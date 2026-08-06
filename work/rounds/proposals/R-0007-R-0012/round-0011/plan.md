---
id: R-0011-PROPOSED-RESEQUENCED-PLAN
title: Evidence-reuse authorization preparation
type: temporary-round-plan
status: draft-non-authoritative
date: 2026-08-02
source: work/rounds/R-0009
---

# R-0011 — Evidence-reuse authorization preparation

## Objective

Replace predecessor first-parent authorization assumptions with successor records, prove
every fail-closed fallback, close the semantic-review decision without expanding trust,
and prepare transparent observation for R-0012.

This is **evidence authorization reuse**, not R-0008’s build/test result cache. The two
mechanisms have separate identities, policies, threat models, and claims.

## Entry gates

- R-0010 Phase B is published, independently verified, and closed.
- Source PRs still run full; no successor promotion streak exists.
- Subject authority from former R-0009 is explicitly rebound to R-0011.
- R-0012 observation mandate remains pending.

## Batches

| Batch | Role                     | Work                                                                                                            | Gate                     |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------ |
| B0    | Architect                | Declare streak zero; freeze successor authorization/revocation and qualifying-run definitions                   | no predecessor import    |
| B1    | Inspector                | Reds for absent, malformed, head-only, self-authorized, revoked, unresolved, stale, and source-PR authorization | every case runs full     |
| B2    | Architect                | Rebind first-parent records; retain semantic-review inability to PASS absent qualifying adapter evidence        | no trust expansion       |
| B3    | Engineer                 | First-parent resolution through exact base object and observation-only metrics; full-run fallback               | no caller/head authority |
| B4    | Inspector                | Valid first-parent-only reuse, revocation, weekly/source nonpromotion, metric non-authority                     | adversaries green        |
| B5    | Auditor                  | Prove zero prior streak/imported standing; prepare R-0012 zero-baseline handoff without starting it             | counters zero/current    |
| B6    | Architect + machine verb | Close R-0011                                                                                                    | R-0012 pending           |

## Acceptance, stops, and claim ceiling

Missing/malformed/head-only/self-authored/revoked/stale/unresolved records run full. Only a
valid first-parent successor record authorizes reuse. Source PRs run full; weekly audits and
metrics cannot promote or relabel outcomes. `semantic-review` remains unable to PASS. No
streak run is counted.

Stop on predecessor decision reuse, current-HEAD/self authorization, trust expansion,
counted run, or promotion activation. Exit claim: evidence reuse authorization is correctly
prepared, but promotion remains unearned/inactive and R-0012 still requires fresh authority.
