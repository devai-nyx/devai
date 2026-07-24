---
id: R-0001-P4-LAW-PREREQUISITES-KNOWN-RED
title: P4 law prerequisites and role-pure package handoff
type: round-handoff
status: draft
date: 2026-07-23
authority: Architect
supersedes: null
superseded_by: null
provenance: R-0001/P4; CTX-05; CTX-07; dossier Part IX §2; Constitution Article 6
---

# P4 law prerequisites and role-pure package handoff

## Architect-owned inputs

This prerequisite adds:

- `law/schemas/error.schema.json`, the closed structured-error envelope with exact
  class-to-exit correspondence;
- `law/schemas/sensor-registry.schema.json`, which requires every active entry to name
  an emitter, carry record metadata and scheduled tiers, and either feed nonempty
  scorecard cells or declare `diagnostic: true`;
- `law/policy/sensor-registry.json`, the one source of sensor-kind truth derived from
  the attested predecessor pin
  `d76cd12d2241a1a28a32a0fe629c6531da7fe74d`;
- DII-102 through DII-104, preserving one-registry derivation, FAIL persistence, and
  scheduled scorecard reachability.

The attested pin has 64 enum kinds but only 59 emitter-backed kinds. The live registry
contains those 59. Five compatibility-only kinds with null commands and no emitter are
archived rather than copied into the live set: `api_test`, `db_test`, `journey_test`,
`contract_validation`, and `mutation_test`.

Nine emitter-backed kinds have no cells in the pin's canonical
`packages/core/src/loop/scorecard.ts` map and are therefore explicitly diagnostic:
`runtime_probe_api`, `runtime_probe_auth`, `runtime_probe_data`,
`decision_record_integrity`, `decision_citation_resolution`, `archive_immutability`,
`round_record_integrity`, `site_drift`, and `action_effect_inference`. A duplicate
predecessor map assigns `action_effect_inference` to F5:T4, but importing that
contradiction would invent authority. The canonical-map absence is preserved here for
later reconciliation.

All active kinds include `SWEEP`. Only the exact predecessor run-set membership also
receives `BASELINE`, `TIER2`, or `TIER3`. Design-note state is backlogged truthfully
until successor-local per-kind notes exist.

## Expected red before role-separated wiring

The Architect commit intentionally leaves two existing contract expectations red:

1. the schema directory contains 54 canonical schemas while
   `packages/schemas/src/roster.ts` still contains 52;
2. the decision register parses 107 entries while
   `packages/schemas/tests/contract/register.contract.test.ts` still expects 104.

Direct schema compilation, declared-example validation, policy-instance validation,
registry uniqueness, emitter-path existence at the attested pin, and the 59-live /
5-archived split must be green before this handoff is consumed.

The measured full-suite run at this boundary is 324 passed / 3 failed. The third failure
is independent concurrent P3 state: the glossary corpus has 44 files while
`product.contract.test.ts` still expects 37. It is not caused by this handoff and must
not be relabelled as a P4 law failure.

## Engineer work

- Add `error.schema.json` and `sensor-registry.schema.json` to the sorted package
  roster and generated schema/type exports; update roster comments from 52 to 54.
- Consume the structured-error schema at the CLI error boundary. Do not re-declare the
  envelope or the class/exit map locally.
- Consume `law/policy/sensor-registry.json` as the authority for live kinds, cell
  reachability, tier sets, documentation generation, and tests. Remove parallel
  hand-maintained live-kind enums/maps rather than synchronizing another copy.
- Preserve the five archived kinds as non-live dispositions. Do not emit them.
- Implement same-kind temporal precedence so newer evidence is the only supersession,
  stale FAIL becomes REVIEW-stale, and UNKNOWN cannot overwrite FAIL.
- Preserve diagnostic standing for the nine kinds above until an Architect-authorized
  canonical cell reconciliation changes the registry.

## Inspector work

- Update roster contract expectations from 52 to 54 and register expectations from
  104 to 107.
- Add contract coverage for the exact class/exit pairs, root closure, invalid pair
  rejection, registry id-kind uniqueness, the 59-live / 5-archived boundary,
  emitter-backed liveness, cells-or-diagnostic exclusivity, SWEEP reachability, tier
  membership, and FAIL/UNKNOWN temporal precedence.
- Require a clean full `pnpm vitest run` before P4 closure.

No package or test file is Architect-authorized by this handoff.
