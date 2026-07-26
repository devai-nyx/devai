---
id: R-0004-EXIT-LADDER-GOVERNANCE-FAILURE
title: Exact-candidate dev-scoped SQL governance failure
type: audit-report
status: active
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: null
provenance: [candidate 0621f12794d4c2cab500d6098fe90a4d22023ee7; governance gate; BL-142]
---

# Exact-candidate dev-scoped SQL governance failure

Candidate `0621f12794d4c2cab500d6098fe90a4d22023ee7` passed the complete local
Stage 1 through Stage 3 ladder, including lint, typecheck, T1, T2, build, and unchanged
coverage floors. Changeset classification also passed. Governance then stopped at the
strict forbidden-action scan with two `FORBID-DROP-PROD` findings:

- Architect commit `b8783e6c9b07ae6d79c167567e095f7d7b347f0b` added the canonical
  `work db drop` description `DROP DATABASE devai_task_<id>`;
- Engineer commit `cb88dfdc0ff71760d698707ce115bff37e25fd28` generated the same
  governed dev-task description into the CLI consumer.

The forbidden rule itself says the operation is forbidden **outside dev**, but the
production history scanner currently matches the SQL phrase without evaluating the
same changed line's explicit `devai_task_` or `devai_template` scope. The result is a
false positive on the existing bounded development-database feature. No later
governance sub-gate, T4–T6 run, formatting gate, or Opus review ran.

BL-142 governs a narrow fail-closed correction. It must ignore only a dangerous SQL
occurrence whose own line carries an approved exact development-database identity, and
must still report another unscoped or production-named occurrence in the same commit.
No blanket commit, file, role, registry, or forbidden-action waiver is permitted.
