---
title: Theory
sidebar_position: 1
slug: /theory
---

# Theory

> DEVAI uses two vocabularies literally, not metaphorically: the vocabulary of
> **feedback control** (Articles 1–3) and the vocabulary of **constitutional
> law** (the Constitution itself, Article 40). The control framing dictates how
> authority is allocated, how concurrency is mediated, how failures are routed,
> and how convergence is gated; the legal framing makes those constraints
> legible, amendable only by due process, and enforceable by an independent
> observer.

## The canonical treatment

The complete theoretical framework lives in one maintained document:

**[`devai-theory.md`](./devai-theory.md)** — the unified treatment (~90-minute
full read; chapters are self-contained). It develops the architecture through
both framings in parallel, condenses the formal discrete-time MIMO model for
control engineers (Chapter 11), records the provenance of the design and its
rejected alternatives (Appendix C), and carries 28 figures rendered from the
committed sources under `docs/theory/diagrams/`. A PDF can be built with
`bash docs/theory/build/build-theory.sh`.

It supersedes the three historical papers formerly kept under
`docs/theory/papers/` (the two-orchestra predecessor and the two Phase-13
snapshots, retired per D-166); their final texts remain in git history,
anchored in the document's Appendix C.

## The metaphor map, at a glance

| DEVAI term           | Control-theory term                    | Legal term                             | Anchor             |
| -------------------- | -------------------------------------- | -------------------------------------- | ------------------ |
| Specification (F1)   | Reference signal _r(k)_                | The statute book                       | Art. 2, 4          |
| Code (F2)            | Plant _P_                              | The governed conduct                   | Art. 2, 4          |
| Test (F3)            | Sensor _y(k)_                          | Evidence-gathering apparatus           | Art. 29            |
| Inventory (F4)       | State estimate _x̂_                     | The public registry                    | Art. 4, 33         |
| Harness (F5)         | Controller infrastructure              | The institutions and records           | Art. 4             |
| Five roles           | Separated controllers                  | Separation of powers                   | Art. 7–10          |
| Authority-by-path    | Actuator authority limits              | Jurisdiction                           | Art. 6             |
| Declared effect sets | Certified actuation envelope           | Enumerated powers / ultra-vires review | D-150–D-159        |
| Hard gate            | Deterministic error component          | Strict-liability rule                  | Art. 17            |
| Soft gate            | Stochastic error, explicit uncertainty | Rubric-bound discretion                | Art. 18, 39        |
| Severity ladder      | Weighting matrix **Q**                 | Hierarchy of norms                     | Art. 11            |
| Triage               | Fault detection & isolation            | Jurisdictional assignment              | Art. 15            |
| RGR                  | Reference-disturbance request          | Petition for clarification             | Art. 22            |
| Tie-breaker ladder   | Gain-scheduled arbitration             | Appellate review                       | Art. 23            |
| Iteration cap        | Anti-windup / saturation               | Procedural retrial limit               | Art. 19            |
| Evidence chain       | Flight recorder                        | Court record, chain of custody         | Art. 32–33         |
| Auditor              | Estimator outside the loop             | Independent judiciary                  | Art. 7, 33         |
| Dark promotion       | Shadow-mode commissioning              | _Vacatio legis_                        | D-146, D-164–D-165 |

## Where to go next

- The Constitution itself: [`framework/constitution`](../reference/law.md). Forty articles; cite by number.
- The scorecard mechanics: [`framework/scorecard`](./framework/scorecard.md).
- The supported and experimental loop boundaries: [`framework/loop`](./framework/loop.md).

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/index.md (classification CURRENT).
