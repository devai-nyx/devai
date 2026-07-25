---
id: R-0005-PLAN
title: Evidence and corrected round mechanics
type: round-plan
status: draft
date: 2026-07-24
authority: Architect
supersedes: null
superseded_by: null
provenance: [OM-002; BL-010; BL-011; BL-015; BL-018; BL-033; BL-045; BL-050; BL-063]
---

# R-0005 — Evidence and corrected round mechanics

## Objective

Implement canonical proof epochs and SWEEP close readings, the reusable local-evidence
gate, clean post-merge observation, bounded prompt overlays, the coordinated invariant
anchor rename, and the approved three-tree/worktree lifecycle.

This round makes evidence machinery executable. It does not authorize evidence reuse or
claim any earned standing.

## Entry gates

R-0004 is merged and closed; action IDs, sensor registry, schema linter, package
topology, and bounded porcelain are stable; all current proof/local-evidence reds are
re-measured.

## Batches

| Batch | Role                     | Work                                                                                                                                                                                                           | Commit gate                                          |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| B0    | Architect                | Declare round with evidence nonclaim; inventory every writer, epoch consumer, round transition, worktree path, and invariant anchor                                                                            | Inventory complete; no hidden second source          |
| B1    | Owner                    | Amend JNY-014 to the approved three-tree doctrine and `.devai/worktrees` setpoint only                                                                                                                         | Exact OM-002 mark; no broader BL-044 work            |
| B2    | Inspector                | Commit reds for chaining/tamper/truncation/errata, SWEEP starvation, local-evidence exact-subject and expiry, prompt firewall, post-merge cleanliness, anchor migration, and round/worktree lifecycle          | All seven items fail for expected reasons            |
| B3    | Architect                | Record BL-015 overlay rule; migrate authoritative invariant field to `authority_docs`; amend ADR-012/law/policy for three-tree, `.devai/` ownership, and committed/ignored boundaries; specify chain-head role | Schema, register, and citation checks                |
| B4    | Engineer                 | Implement BL-010 writer and BL-045 producer/verifier/reusable workflow; integrate source hashes, required jobs, freshness, and exact subject                                                                   | Cross-path byte identity; adversarial evidence tests |
| B5    | Engineer                 | Implement BL-018 cleanup and BL-050 runtime; preserve and adversarially verify the R-0002 ignore/sentinel prerequisite; keep config/pin materialized and committed; never move intent                          | Lifecycle, ignore-boundary, and idempotency tests    |
| B6    | Engineer                 | Wire BL-011 SWEEP persistence and apply BL-015/033 consumers/generation                                                                                                                                        | Every live SWEEP runs or blocks honestly             |
| B7    | Inspector                | Close exact guards; prove authority denial, tamper resistance, retry cleanliness, no caller-selected evidence, and migrated anchor totality                                                                    | Full T1–T6 plus evidence adversaries                 |
| B8    | Machine verbs + Auditor  | Exercise a disposable proof epoch and corrected round close in fixtures; write as-built and fresh all-green coverage                                                                                           | No hand-written `record/`; no standing claim         |
| B9    | Architect + machine verb | Close source and closure PRs under the shared ceremony                                                                                                                                                         | No evidence reuse/promotion                          |

## Acceptance

- Per-round/per-kind JSONL records bind previous-line and terminal hashes; tamper,
  reordering, truncation, and invalid errata fail.
- Every SWEEP sensor executes or returns an honest blocker and persists through the
  canonical writer.
- Local evidence is schema-valid, source-bound, job-bounded, fresh, exact-subject, and
  denied on all malformed or caller-selected paths.
- Prompt overlay findings reach zero only under the recorded bounded rule; malicious
  authority inversion still fails.
- Observation retries are idempotent and leave the persistent worktree clean.
- All invariant authorities use `authority_docs`; no legacy semantic field remains.
- Round close amends intent in place and emits separate audit/proof; worktrees consistently
  use `.devai/worktrees`.
- `.devai/config/` and `.devai/pin/` remain committed authorized materializations;
  `.devai/state/` and `.devai/worktrees/` ignore runtime contents while retaining tracked
  `.gitkeep` sentinels.

## Stops

Stop on imported evidence standing, caller-selected evidence provenance, a round
directory move, use of the pre-fix `round archive`, a product change beyond JNY-014,
automatic promotion, or any proof written by hand.

## Exit claim

Evidence and lifecycle machinery are implemented and tested. Reuse remains disabled
until BL-022; actions-evidence standing remains zero; coverage remains an all-green
regression gate.
