---
title: Contributor guide
---

# Contributor guide

Contributor material is organized as runbooks. Concepts stay in
[theory](../theory/), adopter how-to stays in [adopters](../adopters/), and
normative rules stay in [law](../../law/).

## Test tiers

| Tier | Name        | Home                         | Batch gate                              |
| ---- | ----------- | ---------------------------- | --------------------------------------- |
| T0   | Static      | lint and type configuration  | every batch                             |
| T1   | Unit        | `packages/*/tests/unit/`     | every batch                             |
| T2   | Contract    | `packages/*/tests/contract/` | every batch; hard gate                  |
| T3   | Integration | `tests/integration/`         | every batch                             |
| T4   | Regression  | `tests/regression/`          | pre-close; hard gate                    |
| T5   | Smoke / E2E | `tests/e2e/`                 | pre-close and release                   |
| T6   | Containment | `tests/containment/`         | pre-close and every experimental change |

Every batch runs the checks applicable to the paths it changes and reads their
output before commit. Round close expands to the full tier sweep. A check that
cannot run is a blocker or a recorded backlog item, never a silent skip.

## Runbooks

- [Development process](process.md)
- [Contributing](contributing.md)
- [Round workflow](round-workflow/)
- [Operations](operations/)
- [Security](security/)
