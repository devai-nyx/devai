---
id: R-0007-MIGRATION-NARRATIVE
title: R-0007 minimum safe CLI migration narrative
type: inventory
status: active
date: 2026-08-07
authority: Architect
provenance:
  - ADR-023
  - work/rounds/R-0007/inventory/old-to-new-command-map.md
  - law/policy/action-registry.json
---

# Minimum safe CLI migration narrative

R-0007 is a pre-release breaking grammar change. It does not preserve historical commands as
aliases. An old command is usable only through the exact successor named by the canonical
old-to-new map; a removed or tombstoned command must refuse dispatch. Silence, prefix matching,
and best-effort reinterpretation are not migration behavior.

This narrative explains how to use the canonical migration table safely. It does not copy
that table, claim that its planned rendered page exists, or replace
`inventory/old-to-new-command-map.md` and `law/policy/action-registry.json` as sources.

## Operator procedure

1. Identify the complete historical action path or global spelling used by the script or
   runbook. Do not shorten it to a likely new prefix.
2. Resolve that identity in the generated migration reference. The reference must contain
   exactly one row derived from the canonical map.
3. If the row names a successor, replace the complete invocation and re-evaluate its current
   inputs, effects, role, and consent requirements. Migration never carries prior authority.
4. If the row says the capability is removed, stop. Use the stated operator-owned or governed
   alternative only when it independently fits the task and authority boundary.
5. Run help or a read-only/dry-run fixture for the new grammar before enabling any write.
6. Supply `--write` only for a declared write effect. Supply `--publish` only when publication
   is separately authorized; it is additional consent and never implies `--write`.
7. Treat a missing, duplicate, conflicting, or unparseable migration row as a blocking
   documentation defect. Do not guess a successor.

## New mental model

Ordinary command selection begins with one of the seven workflow domains frozen by the CLI
contract: initialization, diagnosis, acceptance checks, observation, governed rounds,
evidence, and release work. Hidden task and catalog commands are plumbing rather than public
workflows.

Use acceptance checks for declared pass/fail gates and sensing for observations. Use a check
suite to select an ordered acceptance population; use a sense preset to select an ordered
observation population. A sensor kind identifies one observation implementation. An inventory
slice selects one deterministic repository projection. An adoption tier expresses governance
obligations and is neither a suite nor a preset. A porcelain/plumbing surface tier describes
visibility, not adoption maturity.

Tasks no longer operate as independent public work. Every new task belongs to exactly one
active round, declares exactly one executor contract, and normally runs through the round
workflow. Hidden task plumbing still requires the declared round. A legacy task without an
explicit round and executor mapping is historical data and cannot execute.

## Consent and authority do not migrate implicitly

Changing a spelling does not preserve an old effect assumption. The current action registry
defines each successor's effect and authority contract. Read, harness-write, local-write, and
remote-write are distinct. Role discipline remains the source of path authority; routine,
agent, human, or composite execution and model capability cannot widen it.

Publishing consent is independent. A migrated publication invocation requires both explicit
write consent and explicit publish consent, plus the separate Owner or round authorization for
the external effect. Documentation and a successful local command cannot grant that authority.

## Generated migration acceptance

The future migration reference must derive every historical action row and every global
vocabulary/consent row from the complete canonical map. It prefixes row identities by class,
preserves source order, emits each identity once, and reports missing, extra, duplicate, or
registry-conflicting rows. Counts are calculated from the candidate; no prose count is
authoritative.

Folded actions name an exact successor. Tombstoned and removed actions retain their historical
identity and refusal. Retained hidden plumbing is labelled as plumbing and does not appear as a
new public workflow. Historical spelling is permitted on that migration page precisely so the
operator can find it; active examples elsewhere use only the new grammar.

## Claim boundary

This file is the B2 safe-migration setpoint for later R-0007 materialization. It is not the
generated migration reference, not complete narrative user documentation, not a deploy-ready
site, and not evidence of release, deployment, or publication. R-0009 remains dormant behind
its own dependency and entry gates.
