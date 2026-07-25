# DEVAI — Theory of a Governed Control System for AI-Assisted Software Engineering

_The unified theoretical treatment: control-theoretic model, constitutional-legal model, and the argument for both._

Antonio A. Russo (aarusso@nyxk.com.br)
Maintained as live documentation. Supersedes the three historical papers previously kept under `docs/theory/papers/` (see Appendix C for provenance and the retrieval SHAs).

---

### How to read this document

This is the single canonical long-form treatment of the theory DEVAI is built on. It is **maintained, not frozen**: unlike its predecessors — which were dated snapshots that drifted — this document describes the system as it is, and is corrected when the system changes. Volatile ground truth (counts, thresholds, current round status) is stated here only where it illustrates structure; the authoritative values live in [`law/constitution.md`](../reference/law.md), `law/register/DECISIONS.md`, `work/rounds/R-0001/plan.md`, and the schema and sensor catalogs, several of them guarded against drift by `devai sense docs drift`.

Every substantive claim cites a Constitution article (`Article N`), a numbered decision (`D-N`), or an ADR. If a claim has no citation, treat it as hand-waving.

Two audiences are served at two depths:

- **Chapters 1–10** develop the architecture in prose, using two framings — control engineering and constitutional law — that are introduced together in Chapter 2 and carried in parallel throughout.
- **Chapter 11** condenses the formal control-theoretic model (state space, controllability, observability, mode-switching, convergence posture) for readers fluent in modern control theory.

Appendix A maps notation; Appendix B indexes the figures; Appendix C records provenance, predecessors, and rejected alternatives; Appendix D is the citation summary.

### Table of contents

1. [The problem this framework addresses](#1-the-problem-this-framework-addresses)
2. [Two framings, one system](#2-two-framings-one-system)
3. [Substrates, transversals, and the aspect grid](#3-substrates-transversals-and-the-aspect-grid)
4. [Authority as actuator constraint](#4-authority-as-actuator-constraint)
5. [The reference signal](#5-the-reference-signal)
6. [Sensors and observation](#6-sensors-and-observation)
7. [The control loop](#7-the-control-loop)
8. [Evidence and the rule of written record](#8-evidence-and-the-rule-of-written-record)
9. [Concurrency](#9-concurrency)
10. [Self-application](#10-self-application)
11. [The formal model](#11-the-formal-model)
12. [What the framework guarantees, and what it does not](#12-what-the-framework-guarantees-and-what-it-does-not)
13. [Conclusions](#13-conclusions)

Appendices: [A — Notation](#appendix-a--notation) · [B — Figure index](#appendix-b--figure-index) · [C — Provenance and rejected alternatives](#appendix-c--provenance-and-rejected-alternatives) · [D — Citation summary](#appendix-d--citation-summary)

---

## 1. The problem this framework addresses

Large language models produce syntactically valid code in essentially any mainstream stack. That capability is no longer the bottleneck. The unresolved problems sit upstream and downstream of generation:

- **Upstream:** specifications are ambiguous, incomplete, or contradictory; the model resolves ambiguity by guessing, and the guess looks plausible enough to merge.
- **Downstream:** tests get edited to match generated behavior rather than stakeholder intent; security regressions slip through because the rule that would have caught them was implicit; architectural decisions accumulate without anyone tracking which decision drove which constraint.

These are not problems a model solves by getting better at code. They are problems of _governance over what the model is allowed to decide_, _observability into what it decided_, and _closed-loop control over how decisions propagate_. They arise whenever a capable agent operates on a system whose reference signal is malleable.

DEVAI's narrow claim: the framework shapes the development environment so that an LLM-backed agent (or a human) operating through its runtime **cannot** silently resolve specification ambiguity in code, **cannot** weaken tests to hide plant failure, and **cannot** actuate outside its declared authority. For every action DEVAI itself executes, the refusal is mechanical — enforced by the runtime's authority broker and capability seams before mutation (Article 6). For actions taken by unrestricted host tools (editors, shells, external agents), the same rules are advisory unless the project declares a verified host adapter; the framework reports that boundary honestly rather than implying an enforcement it does not possess (Article 6, Constitution 0.4.0 amendment, D-126). This honesty about the enforcement perimeter is itself a design principle: the framework never claims to be an operating-system sandbox.

The broader claim: the costs of this discipline are real (a declared stack, a learning curve, an audit trail to maintain) and recoverable — the same discipline accelerates merging by eliminating the categories of failure it precludes, and accelerates onboarding by making the framework's vocabulary mechanical rather than tribal. The remainder of the document defends both claims.

### 1.1. Diagnostics — why naive AI-assisted development fails

Seven failure modes motivated the design. Each pairs a diagnosis with the structural response the framework shipped.

#### 1.1.1. Reference-signal instability

Requirements exist as a heterogeneous mixture: tickets, partially updated documents, meeting notes, chat threads, implied behavior in existing code. An LLM agent treats these sources interchangeably. In control terms (D-1, Article 2), this is driving a plant with multiple conflicting reference signals while editing the setpoints during actuation. The system has no stable target.

**Response** (D-6, D-7, D-8; Articles 11–13): the **invariant** is the atomic unit of specification — machine-checkable, uniquely identified, stored at a stable path under Architect authority. Owner intent compiles to Architect-authored invariants via explicit references on journey artifacts. Code areas claim invariants via the trace. Anything not expressed as an invariant or a related journey is not a setpoint and is not promised.

#### 1.1.2. Hidden decisions under ambiguity

When the specification is incomplete, the implementing agent must choose — and LLMs excel at producing a working-looking implementation under incomplete specification, which is precisely the failure mode. The choice becomes a de facto specification, encoded in code, never reviewed as a decision.

**Response** (Article 22): the **Reference Gap Report** (RGR) is the only authorized upward semantic feedback path from implementation disciplines to specification disciplines. On a reference gap the task _pauses_; it does not resume until the Architect or Owner produces a superseding specification. The agent cannot silently embed a guess; the work literally stops. The pause cost is bounded by Architect responsiveness; the alternative — undiscovered assumptions accreted into the codebase — is unbounded.

#### 1.1.3. Tests as malleable artifacts

Tests are the system's sensors. If a sensor can be re-calibrated by the actor whose actuation it measures, the loop collapses: tests become self-justifying. AI accelerates the collapse because editing the test is locally cheaper than fixing the code.

**Response** (Articles 29–30, D-1, D-3): tests are formally classified as **sensors** under **Inspector** authority, a non-extensible singleton discipline (Article 8) precisely to prevent sensor-calibration fragmentation. Every commit touching F3 is AST-diffed against its parent; weakening events are quantified (assertion count, expect-call count, HTTP-status assertions, skip/todo/only annotations, removed invariant references) and unjustified weakening is a hard-gate FAIL (Article 30). Per-invariant change policy can forbid weakening outright regardless of magnitude (Article 14).

#### 1.1.4. Authority blur

Naive AI-assisted development treats "the agent" as a monolith with write access wherever it has filesystem access: one misconfigured prompt away from editing the spec it was supposed to satisfy, or the test it was supposed to pass.

**Response** (Articles 6–10, D-3): five roles with disjoint write authority over disjoint path domains, enforced by the runtime for every mutation performed through it — role declaration (`--as-role` or a repository-bound authority session), explicit consent for state-changing actions, and refusal before mutation. Since Round 25, the enforcement is doubled by a **capability seam**: every CLI action carries a declared effect set, a static reachability analyzer computes the effects each action can actually reach, and `declared ⊇ inferred` is a fail-closed CI gate (D-156–D-159). Cross-role work requires a session boundary; the runtime does not infer or silently elevate a role (Article 7).

#### 1.1.5. Architectural entropy

Without a record of why each decision was made, structural choices become unrecoverable: "is this load-bearing?" has no answer.

**Response**: an append-only **decision log** (`law/register/DECISIONS.md`, D-1 onward — over 165 entries) records every load-bearing choice with alternatives, rationale, and lock status; corrections supersede via new entries rather than edits. ADRs record per-feature decisions with mandatory sections. Locked entries function as precedent with strong stare decisis; soft entries are revisable guidance with an evidence threshold for revisiting.

#### 1.1.6. Audit-trail tampering

If the audit trail can be edited after the fact, post-hoc reconstruction is fiction: the agent that made a controversial change can rewrite the record of what it did.

**Response** (Articles 32–33; Chapter 8): every governed action emits a record onto a **hash-chained evidence ledger**. `devai evidence chain verify` walks the chain; the first mismatch is the corruption point. Redaction exists but is itself a recorded, attributable operation. The chain is append-only from every actuator's perspective.

#### 1.1.7. Cost-control failure

LLM-backed agents have real per-call costs; a runaway loop can exhaust a budget in minutes, and without telemetry the operator cannot answer "what did this cost?"

**Response**: the LLM substrate caps cumulative spend, logs per-call cost, and exits cleanly on budget exhaustion; CI defaults to a mock backend that spends nothing (D-55). The cap is simultaneously a usability feature and a denial-of-budget security boundary.

These seven diagnoses share one root: **in naive AI-assisted development, meaning is mutable by the same process that implements it**. Every mechanism in the rest of this document is a structural answer to some projection of that root cause.

## 2. Two framings, one system

DEVAI is described throughout by two vocabularies used _literally_, not decoratively: the vocabulary of **feedback control** and the vocabulary of **constitutional law**. Both are binding on mechanism design — the Constitution says so explicitly for the control frame (Article 2: "binding on framework vocabulary, mechanism design, and gate semantics"), and _is_ the legal frame (a ratified, versioned, amendable axiom set with enumerated powers, jurisdictions, and an amendment process, Article 40).

The two framings are not redundant. They answer different questions:

- The **control framing** answers _dynamics_ questions: is the system converging toward its reference? Is the actuator saturated? Is a sensor faulty or is the plant faulty? What happens when the controller fails?
- The **legal framing** answers _authority_ questions: who may change what? Under which procedure? What happens when rules conflict? How does a rule itself change, and who is bound in the meantime?

A governance harness for AI-assisted development needs both, because its central risk is precisely the coupling of the two: an actuator capable enough to change the rules that govern it. The control framing makes that risk visible as a forbidden feedback path; the legal framing makes the prohibition _legible_ — citable, amendable only by due process, and enforceable by an independent branch.

**Figure 21** (`diagrams/svg/fig-21-rosetta.svg`) lays out the full correspondence. The load-bearing rows:

![Figure 21](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-21-rosetta.svg)

| Mechanism                                         | Control-theory reading                                                   | Legal reading                                                            | Anchor                      |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------- |
| Specification (F1)                                | Reference signal _r(k)_                                                  | The statute book: constitution, statutes, regulations                    | Art. 2, 4, 11               |
| Code (F2)                                         | Plant _P_                                                                | The governed conduct                                                     | Art. 2, 4                   |
| Test (F3)                                         | Sensor _y(k)_                                                            | Testimony / evidence-gathering apparatus                                 | Art. 29                     |
| Inventory (F4)                                    | State estimate _x̂_                                                       | The public registry (derived, never authored)                            | Art. 4, 33                  |
| Harness (F5)                                      | Controller infrastructure                                                | The institutions themselves: courts, procedures, records                 | Art. 4                      |
| Five roles                                        | Separated controllers with disjoint actuation ranges                     | Separation of powers                                                     | Art. 7–10                   |
| Authority-by-path                                 | Actuator authority limits per state subspace                             | Jurisdiction                                                             | Art. 6                      |
| Declared effect sets + `declared ⊇ inferred` gate | Certified actuation envelope; static proof the actuator cannot exceed it | Enumerated powers + ultra-vires review                                   | D-150–D-159                 |
| Hard gate                                         | Deterministic component of error                                         | Strict-liability rules: no discretion, no balancing                      | Art. 17                     |
| Soft gate (PASS / REVIEW / FAIL)                  | Stochastic error component with explicit uncertainty                     | Judicial discretion under a published rubric                             | Art. 18, 39                 |
| Severity ladder                                   | Weighting matrix **Q** on the error norm                                 | Hierarchy of norms: constitutional law → statute → regulation → guidance | Art. 11                     |
| Invariant override                                | Bounded, expiring relaxation of a constraint                             | Variance / waiver with sunset clause                                     | Art. 11                     |
| Triage                                            | Fault detection and isolation                                            | Jurisdictional assignment: which forum hears this failure                | Art. 15                     |
| RGR                                               | The only lawful upward reference edit                                    | Petition for clarification; certiorari to the rule-maker                 | Art. 22                     |
| Tie-breaker ladder                                | Multi-model arbitration / gain scheduling of judges                      | Appellate review, terminating at the human bench                         | Art. 23                     |
| Iteration cap                                     | Anti-windup / saturation                                                 | Procedural limit on retrial                                              | Art. 19                     |
| Test-weakening prohibition                        | Sensor-tampering prevention                                              | Evidence-tampering statute                                               | Art. 30                     |
| Evidence chain                                    | Flight recorder; persistent audit observer                               | The court record; chain of custody                                       | Art. 32–33, Ch. 8           |
| Auditor                                           | State estimator outside the loop                                         | Comptroller / judiciary: observes, recommends, never ratifies            | Art. 7, 33                  |
| Decision log (D-entries)                          | Design-history record of controller synthesis                            | Case law; locked entries carry stare decisis                             | `law/register/DECISIONS.md` |
| Constitutional amendment                          | Re-certification of the loop's axioms                                    | Constitutional amendment, prior text preserved                           | Art. 40                     |
| Dark promotion (shipped, not activated)           | Shadow-mode commissioning before loop closure                            | _Vacatio legis_: enacted, verified, not yet in force                     | D-146, D-164–D-165, Ch. 8   |
| Supported vs. experimental mode                   | Manual supervisory control vs. uncertified autopilot                     | Powers in force vs. powers enacted under trial provisions                | Art. 1, 3, 19               |

### 2.1. Why the control framing is binding

Articles 1–3 fix the frame: DEVAI is a multi-loop, multi-dimensional control and governance harness (Article 1); documents are the reference signal, code the plant, tests the sensors, error the deviation of measurement from reference, with humans and explicitly directed agents supplying control input while DEVAI constrains it (Article 2); and the system operates as a **steady-state regulator** with no terminal "done" state (Article 3).

Other framings were considered and rejected (D-1). Process metaphors (pipelines, kanban) describe motion through stages but make "is the system in steady state?" inexpressible. Compiler metaphors describe artifact transformations but obscure _whose authority sets each artifact_. State-machine metaphors elide whether actuation is pushing the plant toward reference or away from it. The control framing is the one that forces precision on exactly the three things the others blur: authority is the difference between setpoint-setters and actuators; tests are sensors, so sensor-tampering is a category of failure with a name; and convergence has a definition — error magnitude below threshold, not trending upward.

### 2.2. Why the legal framing is binding

The legal framing is not a pedagogical veneer over the control model; it is what makes the control topology _governable over time_. Three properties come from law, not from control theory:

1. **Legibility of constraint.** A forbidden feedback path enforced by opaque machinery invites silent erosion. A forbidden path stated as a numbered article — citable in commit messages, session transcripts, and reviews ("per Article 25, locks before worktree") — makes every enforcement act reviewable against its authority. The project's operating discipline mandates the citation practice precisely so the cited article actually governs.

2. **Change under due process.** A control system's topology is fixed at design time; a governance system's topology must survive being changed. Article 40 provides the amendment procedure: prior text preserved verbatim, rationale recorded, version bumped, clients pinned to versions and upgraded only explicitly. The amendment history (0.1.1 → 0.6.0 so far) reads exactly like a body of constitutional case law — and Chapter 10 shows a case where an audit forced the constitution, not the practice, to change.

3. **Bound conduct during transition.** Legal systems have vocabulary for machinery that is enacted but not yet in force, powers exercised provisionally, and evidence admissible only after authentication. DEVAI needed all three (Chapter 8's dark promotion, Article 19's experimental attempts, the Actions-evidence authentication contracts) — and the control literature simply has no names for them. Shadow-mode commissioning is the closest analog, and the framework uses both terms.

### 2.3. Where each vocabulary stretches

Honesty about the analogies' limits, in both directions:

- **The plant is not stationary.** Classical control assumes a time-invariant plant; the DEVAI plant is the code _as it evolves_ — every commit changes _P_. The framework treats this as a discrete-time time-varying plant where each commit is a state update, re-identified via inventory (F4) on every merge.
- **Agents are not LTI controllers.** Stochastic language-model controllers are not linear, not time-invariant, not characterizable by frequency response. The framework compensates with black-box treatment (bounded I/O, bounded cost, bounded iterations — Chapter 11), multi-model arbitration (Article 23), and saturation (Article 19).
- **Soft gates are not classical sensors.** A sensor reporting a confidence interval is closer to a probabilistic estimator. Article 39 makes `unknown` and `inconclusive` first-class verdicts rather than forcing precision.
- **The legal system has no adversarial litigants.** DEVAI's "courts" resolve disagreements between disciplines and between stochastic judges, not disputes between parties with standing. The appellate ladder terminates at the human bench in bounded steps; there is no adversarial discovery, and the analogy should not be pushed there.
- **The constitution binds machinery, not people.** Human operators outside the runtime are constrained advisorily (CLAUDE.md-class instructions) unless a host adapter is declared. The framework states this boundary (Article 6) rather than claiming a jurisdiction it cannot enforce — the legal analog is a statute honest about its territorial limits.

## 3. Substrates, transversals, and the aspect grid

Per Article 4 and D-2, every artifact in a governed repository belongs to exactly one of five **fundamental substrates**, and every substrate is evaluated against the same nine **transversal properties** (Article 5). The Cartesian product is the **aspect grid** — the framework's MIMO error surface.

### 3.1. The five substrates

**Figure 3** (`diagrams/svg/fig-03-state-decomposition.svg`) shows the decomposition.

![Figure 3](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-03-state-decomposition.svg)

| ID  | Substrate     | Control reading                       | Legal reading                      | Authority                                                                    | Lifecycle                               |
| --- | ------------- | ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| F1  | Specification | Reference signal                      | Statute book                       | Owner (business tier) + Architect (engineering tier)                         | Long-lived; supersedes via version bump |
| F2  | Plant         | System under control                  | Governed conduct                   | Engineer                                                                     | Short-lived; mutates per task           |
| F3  | Observation   | Sensors                               | Evidence-gathering apparatus       | Inspector                                                                    | Long-lived; tightens per invariant      |
| F4  | Inventory     | Plant identification / state estimate | Public registry                    | None — derived deterministically, never authored                             | Recomputed                              |
| F5  | Harness       | Controller infrastructure             | The institutions and their records | Framework (`devai adopt upgrade`); runtime state appended by executing verbs | Append-only or upgrade-only             |

The partition is by **authority and lifecycle**, not by file type or technology layer — the load-bearing choice. Alternatives considered and rejected (D-2): lifecycle-phase partitions (Design/Build/Test/Deploy) are not orthogonal in a steady-state model; quality-attribute partitions are exactly the transversal properties and promoting them to fundamentals collapses the artifact distinction; stakeholder partitions conflate authority with artifact kind. The substrate boundary is also the natural concurrency boundary (Chapter 9): distinct file populations, distinct authorities, distinct sensor regimes, distinct lock scopes.

F4 and F5 are elevated to fundamentals — not treated as bookkeeping — because their lifecycle and authority differ enough to justify it. F4 is _regenerated, never authored_ (Article 6: no human or agent writes). F5 splits into configuration/machinery (modified only via `devai adopt upgrade`) and **runtime state paths** (`record/proofs/`): ledger and observation records written by DEVAI verbs as a side effect of execution, attributed to the executing verb rather than the session role (Article 6, added in the 0.5.0 amendment — Chapter 10 tells that story). Treating F4 and F5 as first-class makes questions like "is the inventory byte-identical across runs?" and "does the evidence chain verify?" well-defined grid cells rather than smuggled assumptions.

### 3.2. The nine transversals

Article 5 fixes the transversal list:

| ID  | Property                 | The question it asks of every substrate                                                                      |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| T1  | Coverage                 | Is the substrate's ground covered — specs for the surfaces, tests for the invariants, code for the journeys? |
| T2  | Depth                    | Is the coverage substantive or superficial?                                                                  |
| T3  | Coherence                | Is the substrate internally consistent?                                                                      |
| T4  | Alignment                | Does the substrate agree with its upstream authority?                                                        |
| T5  | Idiomaticity             | Does it follow the declared stack's idiom?                                                                   |
| T6  | Security & Privacy       | Does it uphold the security posture?                                                                         |
| T7  | Performance & Efficiency | Is it performant — and cheap enough to keep running?                                                         |
| T8  | Robustness               | Does it degrade gracefully?                                                                                  |
| T9  | Discipline               | Were the rules followed in producing it?                                                                     |

The sensor catalog mirrors the grid directly: the `spec-*`, `plant-*`, `test-*`, and `harness-*` sensor families (Chapter 6) are named substrate-by-transversal — `spec-freshness`, `test-coverage-depth`, `harness-green-main`, `plant-coherence` — so a red cell names both its substrate and its failed property.

### 3.3. The aspect grid and the scorecard

5 × 9 = 45 cells. Some are degenerate (e.g., Inventory × Idiomaticity) and are marked N/A per Article 5, with the per-repository N/A set itself a governed artifact (`scorecard-na-config.schema.json`) rather than an ambient convention. **Figure 7** (`diagrams/svg/fig-07-scorecard-chips.svg`) shows the grid.

![Figure 7](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-07-scorecard-chips.svg)

`devai govern score compute` aggregates the latest sensor readings into the grid; `devai govern score assess` maps the grid to a recommended gate disposition. The grid is the answer to a question every team faces and few answer with structure: _what does it mean for a software project to be healthy?_ Single-number health scores lose all dimensional information; pass/fail CI covers roughly one cell and is compatible with substantial silent decay; a coverage percentage is a single cell. The grid is the smallest structure that asks every relevant question without smuggling answers. The cost is threshold-tuning per adopter; the benefit is that "where are we red, and why?" has a precise answer.

In control terms the scorecard is the **MIMO error matrix** — error decomposed by (substrate × transversal). In legal terms it is the inspection report of every institution against every duty: no cell may be silently skipped, and an unanswerable cell must say `unknown` (Article 39) or be explicitly ruled N/A.

## 4. Authority as actuator constraint

Authority is the load-bearing axis of the framework, and the place where the two framings fuse: the legal question _who may change what_ is implemented as the control question _which state subspaces can each actuator reach_.

### 4.1. The five roles

Article 7: a human declares one of five roles at session start; the declaration constrains which runtime actions and which externally operated agent disciplines the harness may authorize during that session.

| Role      | Authority                                                              | Substrate                                           |
| --------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| Owner     | Business and behavioral specs                                          | F1 (business tier); glossary jointly with Architect |
| Architect | Engineering specs, invariants, trace, ADRs, schemas                    | F1 (engineering tier)                               |
| Inspector | Tests at all levels                                                    | F3                                                  |
| Engineer  | Application code                                                       | F2                                                  |
| Auditor   | Read-only observation; reports to the designated observation path only | none (observes all)                                 |

The number is not arbitrary. Five is the smallest decomposition that preserves two separations the predecessor architecture bundled away (Appendix C): **Owner ≠ Architect**, because the Owner authors intent in structured natural language and the Architect compiles it into machine-checkable invariants (Article 12) — a _compilation gap_ that keeps business stakeholders out of JSON-Schema literacy; and **Engineer ≠ Inspector**, because a role that writes both the code and the test that measures it can capture its own sensor (Article 10, Article 29).

Extensibility is asymmetric by design (Article 8): Owner, Architect, and Engineer are extensible into specializations sharing the parent's authority; **Inspector and Auditor are non-extensible singletons** — a second Inspector calibrating sensors differently defeats the calibration discipline, and fragmented observation authority defeats the observer. Roles whose value lies in singularity stay singular.

The **Auditor** deserves emphasis: observer authority, outside the loop (Article 33). It regenerates inventory, recomputes scorecards, compiles the backlog, produces assessments — and never actuates. Its reports go only to the designated observation path, and constitutionally "an Auditor report may recommend, never ratify" (Article 7). A role that both observes and actuates cannot be trusted to report on the consequences of its own actions; the separation is the same structural pattern as an independent judiciary, and Chapter 10 shows what happened when the constitution got that separation subtly wrong.

### 4.2. The authority chain and the anti-inversion rule

Article 9 fixes the hierarchy: **Human > Constitution > Architect/Owner > Contracts > Engineer**. Closer-to-code documents lose against higher-level documents on contradiction — a docstring loses to an ADR, an ADR loses to the constitution, and the constitution yields only to the human Architect acting through the upgrade process. This is _lex superior_ as a running rule, and it exists to prevent the canonical inversion: agents rewriting high-level documents to match code they have written.

Article 10 applies the same rule inside a single iteration: no discipline may both set its own reference and actuate against it. Architect may not edit code; Engineer may not edit tests; Inspector may not edit specifications. Coordinated cross-substrate work traverses the chain via coupled task triplets (Chapter 9).

### 4.3. Jurisdiction: authority-by-path

Article 6 grounds authority in the filesystem: every write performed through the DEVAI runtime is checked against a path-domain mapping and refused before mutation on violation. Owner paths, Architect paths, working-papers paths (with the Auditor's designated observation carve-out), Engineer paths, Inspector paths, the never-authored F4 domain, and the two-part F5 domain (upgrade-only machinery vs. verb-attributed runtime state). Clients may extend the mapping additively; the core mapping is immutable per version.

This is jurisdiction in the strict sense: authority defined over territory, with the map itself constitutional. And it is the control-theoretic saturation set: the runtime's write-refusal makes each role's reachable state subspace a hard constraint, not a convention.

### 4.4. Enumerated powers: the capability seam

Rounds 24–25 (D-150 through D-159) added a second, independent enforcement layer beneath the role check — the framework's answer to a subtler question: _not "is this role allowed to do this," but "can this action even reach an effect its catalog entry does not declare?"_

Every CLI action carries a **declared effect** (`read`, `local-write`, `harness-write`, `remote-write`) and a declared **capability set** in the action manifest. The host seam — filesystem, subprocess, network, database — is split into capability modules aligned with Article 6's path domains, with distinct read and write wrappers and a runtime cross-domain assertion primitive; an action reaches the host only through the seam module matching its declared capabilities, and enforcement binds on the final canonical target of the operation, not a caller-selected module (D-157).

Above the runtime seam sits a **static reachability analyzer** (`@devai-nyx/effects-check`, surfaced as the `action-effect-inference` sensor): for each of the cataloged actions it computes the capability set actually reachable from the action's implementation, including a 23-template registry of fixed subprocess invocations and explicit dispositions for every dynamic subprocess edge, governed as an F1 contract (`subprocess-effects.schema.json`, D-150/D-152/D-153). The CI gate is **`declared ⊇ inferred`, fail-closed**: an action whose code can reach an undeclared effect fails the build before the coverage gate runs (D-158–D-159). Under-declaration in effect reporting also fails closed.

Read the layer in both vocabularies:

- **Control:** the declared capability set is the actuator's certified envelope — an input-constraint set — and the analyzer is a static proof that the actuation cannot leave it regardless of controller behavior. Where classical saturation clips a signal at runtime, this certifies the reachable set at design time; the runtime seam then enforces it per-operation as defense in depth.
- **Legal:** capabilities are **enumerated powers**, and the `declared ⊇ inferred` gate is standing **ultra-vires review** — any act beyond the enumerated powers is void (build-failed) per se, no showing of harm required. A capability is _necessary, never sufficient_: possessing the power does not bypass the role, policy, target, and consent checks that still bind at runtime (D-156).

**Figure 22** (`diagrams/svg/fig-22-effect-gate.svg`) shows the pipeline; **Figure 23** (`diagrams/svg/fig-23-path-domains.svg`) shows the Article-6 path domains behind the seam.

![Figure 22](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-22-effect-gate.svg)

![Figure 23](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-23-path-domains.svg)

### 4.5. Forbidden feedback paths

The role, jurisdiction, and capability layers jointly encode the framework's central topological constraint: certain directed edges in the signal-flow graph are forbidden. **Figure 13** (`diagrams/svg/fig-13-forbidden-paths.svg`).

![Figure 13](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-13-forbidden-paths.svg)

| #   | Forbidden edge             | Failure precluded                                                                |
| --- | -------------------------- | -------------------------------------------------------------------------------- |
| E1  | Plant → Reference          | Code cannot rewrite the spec ("satisfy the reference by editing the reference")  |
| E2  | Plant → Sensor             | Code cannot rewrite the test (sensor capture)                                    |
| E3  | Sensor → Plant             | The Inspector cannot bypass the controller and edit code to make tests pass      |
| E4  | Controller → past Evidence | History cannot be revised by its author (append is permitted; retro-edit is not) |
| E5  | Controller → Reference     | The degenerate restatement of E1 for the actuating agent itself                  |

Each edge maps to a diagnostic of §1.1, and each is enforced below the level of review — at the authority broker, the capability seam, or the hash chain. The framework's bet (defended empirically in every organization that has watched process discipline die under deadline pressure): **procedural rules erode; structural rules must be explicitly dismantled**. A rule that must be dismantled leaves a record.

Two auxiliary mechanisms complete the topology. The **prompt firewall** (D-42; **Figure 14**, `diagrams/svg/fig-14-prompt-firewall.svg`) rejects prompt-overlay compositions that would _instruct_ an agent toward an authority inversion — a pre-actuation topology check that saves the runtime refusal for the second line of defense. **Input saturation in depth** (**Figure 11**, `diagrams/svg/fig-11-input-saturation.svg`): the composition layer declares the scope, the runtime checks each mutation, and review sees the diff; each layer is independently sufficient for its slice, and the system tolerates misconfiguration of any one.

![Figure 14](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-14-prompt-firewall.svg)

![Figure 11](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-11-input-saturation.svg)

### 4.6. The honest perimeter

What the above governs mechanically is **every mutation performed through the DEVAI runtime**. An unrestricted host tool — an editor, a shell, an ungoverned agent — is outside that perimeter; for those surfaces the same rules are advisory unless the project declares a verified host adapter, and DEVAI must report that boundary rather than imply control it does not possess (Article 6; the 0.4.0 amendment, D-126, exists because an earlier posture claimed more than the machinery could enforce). The theory here is the same as §2.3's last bullet: a constraint system gains credibility by stating its jurisdiction precisely.

## 5. The reference signal

### 5.1. Invariants as atomic specification units

The atomic unit of Architect-authored specification is the **invariant** (Article 11, D-6): unique ID (`INV-<DOMAIN>-<NNN>`), severity, type, canonical statement, rationale, scope, change policy, verification declaration, and authority anchors back to source documents. Invariants are the control setpoints: every test references one or more invariants; every scorecard computation is ultimately reducible to invariant-level measurements.

Granularity was chosen deliberately (D-6): free-form prose is not machine-checkable (prose is what the _authority anchors_ point to, not the unit itself); ADRs are decisions, not constraints, and re-reading a decision on every gate check makes the gate impractical. The sweet spot is one observable per invariant — coarser makes the trace too fuzzy to localize violations; finer bloats the catalog without adding signal.

### 5.2. The severity ladder as hierarchy of norms

Every invariant carries one of five severities (Article 11, reconciled to the shipped vocabulary by the 0.6.0 amendment, D-148; **Figure 24**, `diagrams/svg/fig-24-severity-pyramid.svg`):

![Figure 24](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-24-severity-pyramid.svg)

| Tier             | Binding force                                  | Override?                          | Legal analog                   |
| ---------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------ |
| `constitutional` | Absolute; changes only via Architect amendment | No                                 | Constitutional law             |
| `hard-fail`      | Blocks unconditionally                         | No                                 | Primary statute                |
| `gate`           | Blocks its declared gate                       | Yes — justified, expiring override | Regulation admitting variances |
| `warn`           | Surfaces without blocking                      | Yes                                | Official guidance              |
| `advisory`       | Non-binding                                    | (override itself advisory)         | Recommendation                 |

This is a hierarchy of norms in the Kelsenian sense, and it is machine-enforced: the schema rejects overrides on the top two tiers. Overrides on the lower tiers are variances with due process — reason, ticket, approver, mandatory expiry — scanned by `devai policy check overrides`, with expirations surfacing as findings. In the control reading, the ladder is the diagonal weighting matrix **Q** on the error norm (Chapter 11): a constitutional violation has effectively infinite weight and cannot be balanced by any number of advisory satisfactions.

The 0.6.0 amendment added a fail-closed clause worth quoting for its theory content: the **readiness-bearing set** is exactly `constitutional`, `hard-fail`, and `gate`, and any readiness computation over that set must resolve _at least one_ invariant — "resolving an empty set is a gate failure and never a passing, ready, or complete result" (Article 11). A vacuous universal quantifier is a classic verification bug and a classic legal loophole; the constitution closes it at the axiom level.

### 5.3. CNL shaping

Invariant statements follow a Controlled Natural Language form — `<Actor> <MODAL> <Behavior> [WHEN <Condition>] [UNLESS <Exception>] [WITHIN <Bound>]` — with RFC-2119 modals aligned to the severity ladder. "Authentication should be enforced on protected endpoints" is unactionable; "The API MUST return HTTP 401 WHEN a protected endpoint is requested WITHOUT a valid bearer token" names actor, modal, behavior, and condition. In control terms this is **reference shaping**: the raw setpoint is filtered into a trajectory the controller can actually track, and the shaping is deliberately lossy — it discards subjective ambiguity. In legal terms it is statutory drafting style: terms of art, enumerated conditions, no purple prose. The discipline costs authoring effort and repays it in enforcement reliability.

### 5.4. Trace, and adherence in both directions

The **trace** (Article 13) maps each invariant to its authority anchors (why it exists), its tests (how it is measured), and its code areas (where it binds). Architect-authored; Inspector and Engineer consume but never edit; completeness ratios are deterministic gate inputs.

Adherence is checked in both directions (**Figure 8**, `diagrams/svg/fig-08-adherence.svg`): **forward** — every invariant reaches at least one sensor (unmeasured law is dead letter); **reverse** — every discovered plant surface (route, module, component, dependency) is claimed by some invariant's code areas (`inv adherence-reverse`; unclaimed surfaces are ungoverned conduct and become triage candidates). Both directions clean is what "the reference is observable and the plant is governed" means operationally; formally, the two projections are the framework's observability mass over F1 × F2 (Chapter 11).

![Figure 8](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-08-adherence.svg)

### 5.5. Versioning, tombstones, and citation stability

Every invariant carries its own version; material changes bump it, and supersession is explicit. Retired IDs are recorded in `tombstones.json` and **must not be reused** — the validator hard-fails reuse. The forensic principle is docket-number stability: a citation to `INV-AUTH-007` in an old audit refers to one definition forever, even after retirement. The same principle governs the decision log (supersede, never edit) and the constitution (prior text preserved verbatim in the amendment history, Article 40): **in every governed artifact class, identity is stable and history is append-only.**

For external consumption, the **RTD bundle** (D-41) aggregates invariants + trace + journeys + glossary + tombstones + ADRs + forbidden-actions into one signed manifest with per-slice hashes and sub-verdicts — canonical for _citation_, while the distributed validators remain canonical for _authoring_. The predecessor architecture made the bundle a gate; canonical DEVAI rejected that (single point of failure for the whole spec — Appendix C).

## 6. Sensors and observation

### 6.1. Test as sensor — the structural axiom

Article 29 states the framework's most consequential classification: **a test is a sensor on the plant**. Tests measure plant behavior against specification; they are not malleable documentation and must not be modified to make failing code pass. The classification does structural work: it moves tests into their own substrate (F3), under their own authority (Inspector), outside the actuating role's reach — the sensor-actuator decoupling whose absence is diagnostic §1.1.3.

The classification comes with teeth (Article 30): AST-diff of every F3-touching commit, quantified weakening metrics, thresholds with a split-not-weaken exemption, and the rule that weakening is _justified only by a tracked invariant change_ — otherwise it is a hard-gate FAIL or, within thresholds, a REVIEW that must be strengthened back, justified, or escalated as an RGR. An Inspector acting alone has **no authorized route** to weaken a test; relaxation of an over-strict assertion requires either an Architect invariant change or an RGR. In legal terms, Article 30 is an evidence-tampering statute, and the "tracked invariant change" clause is its _mens rea_ element: the same edit is lawful pursuant to a recorded change of law and unlawful without one.

Flaky sensors get a quarantine with due process (Article 31): trace-recorded metadata, exclusion from hard-gate aggregation, standing Auditor scrutiny pressuring the list toward zero, and a rule that indefinite quarantine is itself a hard-gate failure. A sensor may be recused; it may not be quietly unplugged.

### 6.2. The sensor catalog

Article 32 requires every executable sensor to emit through one normalized envelope — the `SensorReading` schema: status, evidence path, timestamp, command and command hash, failure mode, structured findings. Scorecard composition is polymorphic over sensor types via this contract; adding a sensor never changes the aggregation machinery. The reading's status enumeration includes explicitly epistemic values — a `killed` or `error` reading is a _sensor_ fault, not a plant fault, and triages differently (Article 15, Article 39).

The generated [sensor registry](../reference/sensor-registry.md) currently exposes **58 sensor descriptors** covering **60 reading kinds**. Descriptor identity, reading-kind membership, lifecycle, commands, and pack bindings come from one typed registry and are checked for parity (D-191). The descriptors are organized in families that mirror the aspect grid (**Figure 26**, `diagrams/svg/fig-26-sensor-taxonomy.svg`):

![Figure 26](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-26-sensor-taxonomy.svg)

| Family                       | Examples                                                                                                   | What it observes                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Build health                 | `type-check`, `lint`, `build`, `test`, `migrate-check`                                                     | F2 deterministic health — the classical hard-gate sensors                             |
| Inventory (L0 introspection) | `inventory-routes`, `inventory-dep-graph`, `inventory-rbac`, `inventory-data-model`, `inventory-adherence` | Deterministic plant identification, including brownfield repos before any spec exists |
| Spec quality                 | `spec-alignment`, `spec-freshness`, `spec-depth`, `spec-security-coverage`                                 | F1 against the transversals                                                           |
| Test quality                 | `test-coverage-depth`, `test-weakening`, `test-invariant-alignment`, `test-pattern-walker`                 | F3 against the transversals                                                           |
| Plant quality                | `plant-coherence`, `plant-coverage`, `plant-depth`                                                         | F2 beyond the deterministic gates                                                     |
| Harness                      | `harness-green-main`, `harness-coverage`, `harness-security`, `harness-robustness`                         | F5 — the control system observing itself (Article 36)                                 |
| Runtime probes               | `runtime-probe` (API / auth / data)                                                                        | The deployed plant, not just its source                                               |
| Drift & integrity            | `docs-drift`, `site-drift`, `security-scan`, `trace-resolve`, `action-effect-inference`                    | Cross-artifact consistency, including the documentation you are reading               |
| Stochastic                   | `judge`                                                                                                    | LLM-judged semantic checks — the only sensor with non-zero noise                      |

Two theory points hide in this roster. First, the framework observes **all five substrates**, including itself: the `harness-*` family scores F5 with the same machinery that scores the client's code, which is Article 36 made mechanical. Second, the stochastic sensor is _isolated and labeled_: exactly one family reports with confidence rather than determinism, its verdicts are tri-state with REVIEW routed to the arbitration ladder (Article 18, Article 23), and the evaluator must be a different model instance — preferably family — from the working agent, so no agent is judge of its own output.

### 6.3. Typed trust boundaries

Round 23 (D-148, D-149) hardened the observation pipeline's inner interfaces: every artifact crossing an I/O boundary — sensor readings, task records, evidence records, config — is parsed through AJV-backed typed boundary parsers generated from the canonical schemas ("parse, don't validate," applied at the seam). In control terms this is **signal conditioning**: the raw channel is conditioned into a typed signal at the boundary, so downstream logic never consumes an unvalidated measurement. In legal terms it is authentication of evidence before admission: nothing enters the record unverified. Schema-instance validation is a hard-gate component (Article 17's contract-validation clause), so a malformed reading is a gate failure, not a runtime surprise.

### 6.4. The observation economy — measured, and honestly refused

Sensing costs wall-clock and compute, and the temptation to cache sensor results is the temptation to _sample less_. Round 26 handled this the constitutional way: **measure first, under a pre-committed threshold**. Declarative sensor input specs (`sensor-input-spec.schema.json`) and git-anchored input digests were added for the hermetic L0 sensor kinds, and a report-only harness measured what an input-keyed action cache _would have_ skipped: 21.07% gross, 14.98% net of digest overhead — beneath the pre-registered 30%-or-60s opening threshold. The Owner accordingly recorded the cache as **skipped**: no cache, no replay envelope, no incremental behavior is authorized (D-162, D-164).

The episode earns its place in a theory document because it exercised Article 39 (explicit uncertainty over false precision) against the framework's own roadmap: a plausible optimization was piloted as measurement, the measurement came back negative, and the mechanism was refused _with the evidence recorded_. The residue is not waste — the input-spec registry and integrity check remain as governed contracts, and the measurement stands as precedent for the next proposal. Sampling-rate economics were treated as an empirical question, not an article of faith.

## 7. The control loop

### 7.1. Operating mode: a regulator with a human at the wheel

Article 3 defines the posture: DEVAI operates as a **steady-state regulator** with no terminal "done" state. Humans or authorized external callers add and dispatch work; the framework regulates it through the loop and retains evidence of its disposition. **The supported harness never invents, dequeues, edits, merges, or publishes work on its own.** An explicitly enabled experimental controller may automate a bounded subset — under stricter policy, without production-readiness standing, and with its evidence labeled experimental (Articles 1, 3; the 0.4.0 amendment, D-126).

This division — _supported_ human-steered regulation vs. _experimental_ bounded autonomy — is load-bearing throughout this chapter and marks the largest single posture change from the framework's earlier descriptions. The control reading: the supported mode is manual supervisory control with the machine enforcing interlocks; the experimental mode is an autopilot under certification, flown only with a test pilot's explicit consent and never carrying passengers. The legal reading: powers in force versus powers enacted under trial provisions.

### 7.2. Loop entry: triage

Every failure entering the framework is classified before anyone remediates (Article 15; **Figure 9**, `diagrams/svg/fig-09-triage-fdi.svg`), into exactly one of four classes, each routing to the authority competent to repair it:

![Figure 9](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-09-triage-fdi.svg)

| Class           | Meaning                                                   | Routes to                 |
| --------------- | --------------------------------------------------------- | ------------------------- |
| `plant-bug`     | Code violates clear specification                         | Engineer                  |
| `sensor-error`  | Test, probe, or adapter is wrong, stale, or misconfigured | Inspector                 |
| `policy-issue`  | Harness policy or threshold misconfigured                 | Harness review            |
| `reference-gap` | Specification silent, contradictory, or ambiguous         | Architect / Owner via RGR |

No discipline begins feedback work until triage has classified and a human has approved the route. In control terms triage is **fault detection and isolation** upstream of the controller — without it, the loop over-actuates on the plant when the sensor is at fault, or loops unproductively against an unreachable reference. In legal terms it is jurisdictional assignment: which forum hears this failure. Classification confidence below threshold goes to the arbitration ladder (Article 23), and `inconclusive` is a permitted verdict (Article 39).

### 7.3. Cycles and gates

The loop runs at three cycle levels (Article 16): **Cycle A** — within-iteration checkpoint (type-check, lint, affected-only tests; no iteration-counter advance); **Cycle B** — the pre-merge gate, where the iteration cap applies; **Cycle C** — post-merge integration, full scorecard including soft gates and Auditor regeneration, once per merge.

The gate itself decomposes exactly along the deterministic/stochastic boundary:

- The **hard gate** (Article 17) is the deterministic component of error: type-check, lint errors, build, all assigned test suites, migrations from empty database, contract validation with byte-identical regeneration, inventory regeneration, and the AST-diff test-weakening check. Binary verdicts only. A merge requires it fully green; it is non-negotiable — strict liability, no balancing test.
- The **soft gate** (Article 18) is the stochastic component: LLM-judged scorings against documented rubrics (spec coherence, idiomaticity beyond linters, test depth, traceability quality, mutation kill rate where applicable). Verdicts are tri-state **PASS / REVIEW / FAIL**, with REVIEW routed to the tie-breaker ladder — discretion exists, but it is published-rubric discretion with an appeals process, never silent.

The evaluator-independence rule (Article 18) bears repeating as theory: the judging model must be distinct from the working agent — at minimum a different instance with no shared context, preferably a different family. _Nemo iudex in causa sua_, implemented as an infrastructure constraint.

### 7.4. Bounded convergence: the iteration cap and the ladder

A mutation-capable Cycle-B convergence attempt is bounded by policy and explicit human consent; the supported default is **one attempt**, with larger bounded values a human decision (Article 19). When experimental autonomous execution is enabled, its policy may authorize three default-tier attempts plus one bumped-tier attempt — the bump is the fourth and final; exhaustion produces `experimental_blocked` and never authorizes an automatic merge, replacement task, or destructive cleanup. Cycle-A micro-iterations don't count against the cap: the cap exists to prevent thrashing, not work.

When stochastic judgments disagree — soft-gate REVIEW, contested triage, inter-discipline disagreement — the **tie-breaking ladder** (Article 23) resolves: (1) independent verification by a model from a different family, same context; (2) a larger model in the same family; (3) a larger model in the alternate family; (4) the human. Concrete families and tier ordering are F5 policy, deliberately not constitutional text (the 0.3.0 amendment moved them out — vendor names have a shelf life of months, axioms of years). **Figure 16** (`diagrams/svg/fig-16-article23-ladder.svg`).

![Figure 16](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-16-article23-ladder.svg)

The ladder encodes a falsifiable hypothesis about failure taxonomy: quantitative failures yield to a more capable model in the same family; qualitative failures yield to a different family's different priors; what survives both needs a human, because it is usually a spec or context failure no model can resolve without new input. In control terms the ladder is discrete **gain scheduling** across a finite controller family; in legal terms it is appellate review with a terminal bench. Either way the guarantee is the same: **bounded escalation with a defined exit, never a silent loop** (**Figure 18**, `diagrams/svg/fig-18-termination.svg`).

![Figure 18](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-18-termination.svg)

Escalation has a lifecycle (Article 21): the backlog entry becomes `escalated` with full context, locks release, recoverable work and its worktree are preserved until explicit human disposition, no replacement task is spawned. And merged history is ratchet-protected (Article 20): the framework never rolls back integration HEAD as automated remediation — a revert is a deliberate human act, performed as a new corrective task.

### 7.5. The RGR: the never-guess discipline

The **Reference Gap Report** (Article 22; **Figure 4**, `diagrams/svg/fig-04-rgr-loop.svg`) is the loop's single most important behavioral rule and its most distinctive control structure. When triage classifies a failure as `reference-gap` — or any discipline hits an ambiguity it cannot resolve within its authority — it emits an RGR carrying the artifact under examination, the specific ambiguity, impacted surfaces, risk classification, gathered evidence, structured questions with candidate answers, and an optional _non-authoritative_ suggested resolution. The emitting task pauses: locks released, branch preserved, backlog entry `rgr-pending`. The RGR routes as a high-priority item to Architect or Owner; after the spec update merges, the paused task becomes eligible for human re-queue with the resolution as context.

![Figure 4](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-04-rgr-loop.svg)

Constitutionally, "RGR is the only authorized upward semantic feedback path from implementation disciplines to specification disciplines" (Article 22). In control terms it is a **reference-disturbance request**: the controller signals that the setpoint is undefined at the operating point and holds actuation until the exogenous authority supplies Δr — the loop never synthesizes its own reference. In legal terms it is the petition for clarification: the lower forum certifies a question to the rule-maker instead of legislating from the bench, and the docket records both question and answer.

### 7.6. The experimental inner loop

When the experimental controller is explicitly enabled (`--experimental --write`, project opt-in), one full iteration is: sense → triage → score → assess → act (a bounded LLM-actuated edit within the active skill's declared write scopes) → re-sense (**Figure 10**, `diagrams/svg/fig-10-inner-loop-sequence.svg`). The exit set is exhaustive: success, iteration cap, budget exhaustion, or `rgr_pending`; every iteration emits a hash-chained agent-run record with prompt-composition hashes, files read and written, commands, cost, and verdict. It stops with recoverable work awaiting human review — it does not merge, and its evidence is labeled experimental and non-promoting.

![Figure 10](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-10-inner-loop-sequence.svg)

The feedforward path is worth its own note (**Figures 5 and 12**, `diagrams/svg/fig-05-feedforward-composer.svg`, `diagrams/svg/fig-12-feedforward-layers.svg`): prompts are composed deterministically from layered components — global, role, discipline, task, payload, overlay — each hashed, with an aggregate stack hash (Article 37). The composition carries the CNL statement of the targeted invariant (reference feedforward), repository introspection (plant-model feedforward), and prior agent-run history (controller internal state). Determinism makes feedforward drift _detectable and attributable_ — the prompt firewall's role — which is the controller-parameter-identification discipline that black-box LLM controllers otherwise lack.

![Figure 5](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-05-feedforward-composer.svg)

![Figure 12](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-12-feedforward-layers.svg)

## 8. Evidence and the rule of written record

If Chapter 4 is the framework's separation of powers, this chapter is its court record. The unifying principle: **an action that leaves no verifiable record did not, for governance purposes, happen** — and a record that can be silently rewritten is worse than none.

### 8.1. The hash-chained ledger

Every governed action appends a typed evidence record to a hash-chained ledger under the F5 state paths: each record carries the previous record's hash and its own content hash, making the chain append-only and tamper-evident. `devai evidence chain verify` walks the chain end to end; the first mismatch is the corruption point. `evidence chain-head` cites the current head; `evidence emit` appends; `evidence redact` removes sensitive content _as a recorded, attributable operation_ — a sealed record, not an erasure (**Figure 25**, `diagrams/svg/fig-25-evidence-chain.svg`).

![Figure 25](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-25-evidence-chain.svg)

The dual reading is exact. Control: the chain is the **flight recorder** — a persistent observer whose state the controller cannot revise, which is what makes post-hoc system identification (Auditor analysis, per-tier convergence statistics, incident forensics) trustworthy even under an adversarial or misconfigured controller. Legal: it is the **court record with chain of custody** — every filing stamped, every disposition preserved, tampering detectable by any clerk with the verify verb.

Attribution follows Article 6's F5-state rule: runtime-recorded state is attributed to the _executing verb_, not the session role, and committed by the session that produced it. The clerk's stamp records which instrument wrote the entry — a distinction the 0.5.0 amendment had to invent (Chapter 10).

### 8.2. Evidence-first CI and authority contracts

Since Round 22 (D-145–D-147) the CI pipeline is itself an evidence producer: runs collect local evidence manifests (`local-evidence-manifest.schema.json`), authority sessions and their action contracts are schema-governed artifacts (`authority-session`, `authority-evidence`, `authority-action-contract`), and release ceremonies replay against recorded evidence rather than against assertion. The gate sweep a batch must pass locally is definitionally the same set CI enforces (D-99) — one law, two courts, no venue shopping.

### 8.3. Dark promotion: machinery enacted but not in force

The Actions-evidence arc (Rounds 22–27) is the framework's most deliberate exercise of a concept that control theory lacks a name for and law names precisely: _**vacatio legis**_ — the interval between a law's enactment and its entry into force.

The mechanism at issue: reusing verified evidence from an exact-tree GitHub Actions run — immutable, hash-identified source trees; durable tuple import through the host-effects seam; `evidence actions-verify` — so that a CI conclusion about tree _T_ can stand as evidence for tree _T_ elsewhere, without re-execution (ratified in principle by D-146 and ADR-005). The risk is equally clear: evidence reuse that shortcuts execution is one miscalibration away from self-certification, the very failure mode Article 17's non-negotiable hard gate exists to preclude.

The framework's answer was to **ship the machinery dark** (D-164): fully implemented, exercised on every run, its gate mode pinned to `verify` (report-only), its promotion selector hardcoded to full execution — enacted, but not in force. Graduation was then made a _judicial_ act rather than an engineering one: a pre-registered eight-condition conjunct (real-run fallback evidence across the failure classes, an independent promotion-disabled full audit, a durable Auditor record produced without relabeling any disposition, hit-rate and durability thresholds), each condition resolved on recorded evidence, with an explicit human Owner ruling on the one condition requiring interpretation, and the Architect's mechanical re-verification recorded decision-by-decision (D-165). Even after graduation, _activation_ remains a separate, role-separated sequence — schema batch, validation coverage, authorization batch — each merge under full CI.

Both framings earn their keep here. Control: this is **shadow-mode commissioning** — the new estimator runs open-loop alongside the certified one, its outputs compared but not consumed, and the loop is closed only after the shadow record meets pre-registered acceptance criteria; promotion of an uncertified estimator into the loop is the control-room error this procedure exists to prevent. Legal: the statute was enacted, published, and tested in _vacatio legis_; its entry into force required findings of fact on a fixed record, a ruling by the competent authority, and separate implementing acts — and promoted runs are barred from counting toward the concurrent soak that is itself part of the evidentiary record (D-163), because evidence produced by the mechanism under trial cannot bootstrap the trial's own success.

The general principle, stated once: **in DEVAI, new power is never granted and exercised in the same act.** Capability seams (declare, then infer, then bind — R24's shadow before R25's gate), the sensor cache (measure, then refuse), Actions evidence (ship dark, then graduate, then activate) — every recent expansion of the harness's own authority followed the same three-beat: _enact, verify in shadow, bring into force by separate recorded decision_. That is the framework applying its constitutional theory to itself, which is Chapter 10's subject.

## 9. Concurrency

Concurrency in DEVAI is mediated by the same authority structure that governs everything else — the substrate boundary is the concurrency boundary.

- **Coupled task triplets** (Article 24): work spanning the authority chain is grouped into an Architect task (invariants), an Inspector task (tests), and an Engineer task (code), sharing a group ID. Branches form a pipeline — each created from its upstream's HEAD, merged in authority order, downstream rebasing on upstream merge. The authority chain is thus realized _in the branch topology_: multi-rate cascaded control in git.
- **Checkpoints** (Article 26): upstream emits an explicit checkpoint when its work reaches a stable consumable state; downstream rebases at checkpoints, not on every commit — pipeline synchronization at declared stable points, with human authorization in supported operation.
- **Module-level semantic locking** (Article 25): before a task worktree is created, the runtime acquires locks on the `(substrate, module)` pairs the task declares, keyed to F4 inventory units. Denied tasks re-queue with a priority bump; repeated denial flags for human review. Locks release on merge, escalation, or RGR pause. Two controllers cannot actuate the same plant region.
- **Worktree discipline** (Article 27): all externally operated agent work occurs in dedicated worktrees; the root checkout is reserved for humans. The active-worktree cap is a policy parameter, not constitutional text (the 0.3.0 amendment demoted the number after the constitution's hard-coded "six" spent twenty-three phases contradicted by the enforced value of three, D-52 — a small case study in keeping volatile values out of axioms).
- **Single integration branch** (Article 28): task branches merge directly to `main`; no staging layer. One integration point means one place where Cycle C runs and one history the evidence chain notarizes.
- **Task lifecycle** (**Figure 19**, `diagrams/svg/fig-19-task-lifecycle.svg`): per-task state transitions (queued → ready → in-progress → checkpoint → pre-merge → merged, with `rgr-pending`, `escalated`, and `cancelled` exits) are atomic and linearizable per task — concurrent readers never observe a partial transition.

![Figure 19](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-19-task-lifecycle.svg)

## 10. Self-application

Article 36: the F5 substrate is scored by the same machinery that scores F1–F4; DEVAI applies to its own development, from Phase 0, non-negotiably. A framework that cannot be applied to itself cannot be trusted elsewhere.

### 10.1. What self-application looks like today

The repository this document lives in is a governed DEVAI plant. Its specs validate against its schemas; its generated sensor registry is checked against reading kinds, commands, and pack bindings; its inventory regeneration and scorecard surfaces have deterministic contracts; and its supported release chain is exercised against itself. This does not mean every descriptor has a runnable producer, every optional provider is called on each close, or every advisory sensor is a binding release gate. Commits are role-tagged (Architect / Engineer / Inspector / Auditor), cross-role work observes session boundaries, and every batch closes against its declared gate set (D-99, D-191, D-192). The self-baseline (`examples/devai-self-baseline/`) pins DEVAI's own dependency-graph inventory as a regression anchor.

Honest gaps are recorded rather than airbrushed, per Article 39: the Owner tier is thin (a framework-substrate repo has no business stakeholder writing journeys — recognized via project-type classification); the experimental loop has not authored a production round of DEVAI itself; and the framework's history includes stretches where a shipped tool went unexercised on the repo until a later phase closed the gap.

### 10.2. The audit that amended the constitution

The sharpest theory result self-application has produced is constitutional amendment **0.5.0** (R18, D-133). A post-merge external audit found that **every Auditor commit in the repository's history formally violated Article 7**: the article made the Auditor read-only on F1/F5, while Article 33 obliged the same role to produce reports, recompute scorecards, and regenerate state — duties with no designated writable destination. Meanwhile runtime state appends fired on _every_ role's verb executions, making the old F5 "modified only via the upgrade verb" clause unsatisfiable by anyone.

The cause was structural, not behavioral — the constitution had assigned duties without granting the minimal power to discharge them — and the remedy was constitutional, not practical: Article 6 gained the designated Auditor observation path and the F5 state-path carve-out with verb attribution; Article 7 was amended to name the destination, restate the no-commit rule around it, and add the boundary sentence _"an Auditor report may recommend, never ratify."_ The amendment legalized exactly what Article 33 already required and nothing more; prior reports stayed where they were as history, the rule applying forward.

Read as separation-of-powers doctrine, this is a textbook episode: an independent overseer, obligations and powers misaligned in the founding text, a review that found the _text_ defective rather than the conduct, and a narrow amendment preserving the prior text verbatim. Read as control engineering: the observer had no authorized output channel, every observation was overwriting some other subsystem's state, and the fix was to give the estimator its own register file. Both readings are correct, and the fact that the framework's own machinery — audit cadence, decision log, amendment process — _detected and repaired a defect in its own constitution_ is the strongest evidence available that the governance is real rather than ceremonial.

### 10.3. Amendment history as case law

The full amendment sequence (**Figure 28**, `diagrams/svg/fig-28-amendment-timeline.svg`) is compact enough to read as doctrine:

![Figure 28](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-28-amendment-timeline.svg)

| Version | Holding                                                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.1   | Clarification: state the iteration-cap arithmetic and the Inspector's no-independent-weakening rule explicitly.                                                                                          |
| 0.2.0   | First exercise of Article 40; authority-by-path re-enumerated for the published documentation IA.                                                                                                        |
| 0.3.0   | Altitude doctrine: volatile operational values (worktree cap, model families, "fixed stack") moved from constitutional text to policy artifacts — the constitution states only what must always be true. |
| 0.4.0   | Honest-perimeter doctrine: supported vs. experimental posture; enforcement claims bounded to what the runtime executes; human initiation and consent made constitutional.                                |
| 0.5.0   | Separation-of-powers repair: the Auditor's designated observation path and verb-attributed F5 state (§10.2).                                                                                             |
| 0.6.0   | Vocabulary reconciliation and the non-vacuous readiness clause: the five-tier severity ladder in constitutional text; empty readiness sets fail closed.                                                  |

Each entry preserves prior text, states rationale, and binds forward — and each encodes a reusable principle (altitude, honesty, alignment of duty with power, fail-closed quantifiers) that later mechanisms cite. That is case law in the exact sense: decided instances that discipline future design.

## 11. The formal model

This chapter condenses the control-theoretic formalization for readers fluent in modern control. It assumes discrete-time state-space models, structural controllability/observability, supervisory mode-switching, and observer design at the structural level; it does not assume familiarity with software practice. **Figure 1** (`diagrams/svg/fig-01-system-overview.svg`) gives the top-level signal flow; **Figure 2** (`diagrams/svg/fig-02-three-loops.svg`) the nested-loop architecture.

![Figure 1](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-01-system-overview.svg)

![Figure 2](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-02-three-loops.svg)

### 11.1. Plant, state, and inputs

The plant state x(k) ∈ 𝒳 at sample k decomposes by authority and lifecycle into the five substrates (D-2):

    x(k) = [ x_F1(k), x_F2(k), x_F3(k), x_F4(k), x_F5(k) ]ᵀ

with the transition

    x(k+1) = f( x(k), u(k), d(k), w(k) )

where **u(k)** is the control input (file edits and governed actions), constrained to an admissible set 𝒰_allowed(k); **d(k)** are reference disturbances (exogenous Architect/Owner edits to F1); **w(k)** are plant disturbances (dependency updates, environment drift), bounded but unstructured. The map f — filesystem semantics, compilation, dependency resolution — is highly nonlinear and treated as a black box; all analysis is topological, over constraints on u and the structure of observation.

The admissible input set is the intersection of three independently enforced constraints:

    𝒰_allowed(k) = 𝒰_role(σ(k)) ∩ 𝒰_cap(a(k)) ∩ 𝒰_scope(π(k))

- 𝒰_role(σ): the declared session role's authority-by-path jurisdiction (Article 6) — which state subspaces this controller may write at all.
- 𝒰_cap(a): the executing action's declared capability set, statically certified by the reachability gate `declared ⊇ inferred` (D-156–D-159) — which effects this actuator can reach _regardless of instruction_.
- 𝒰_scope(π): the active skill or task configuration's declared write scopes — the per-task envelope.

The middle term is the structurally novel one: it is a _design-time proof_ about the actuator's reachable effect set, not a runtime clip. The composition means an out-of-envelope actuation requires simultaneous failure of a static certification, a runtime seam assertion, and review — independent mechanisms with uncorrelated failure modes.

The plant is **time-varying by construction** (every accepted u changes P) and is re-identified after every merge by deterministic inventory regeneration (F4): pure projection, no innovation noise, byte-identical across runs.

### 11.2. Reference and error

The reference r(k) ∈ {0,1}^N is the satisfaction vector over the N active invariants, weighted by the severity ladder's diagonal matrix **Q** = diag(q₁ … q_N) with tiers ordered `constitutional` ≫ `hard-fail` ≫ `gate` ≫ `warn` ≫ `advisory`; the readiness-bearing subset is exactly the top three (Article 11), and a readiness computation whose index set is empty is defined to fail (the non-vacuous clause). The error norm is ‖e(k)‖²_Q = e(k)ᵀ Q e(k); constitutional weight is implemented as a saturating threshold above which any violation escalates immediately, so no accumulation of low-tier satisfactions can offset it.

Reference evolution r(k+1) = r(k) + Δr_Architect + Δr_Owner is **exogenous to every loop the machine closes**: no controller has actuation authority over F1. When the reference is locally undefined — ambiguous, silent, contradictory — the controller's only move is the RGR: a reference-disturbance _request_ that pauses actuation until the exogenous authority supplies Δr (Article 22; **Figures 17, 20**, `diagrams/svg/fig-17-rgr-loop-redux.svg`, `diagrams/svg/fig-20-reference-disturbance.svg`).

![Figure 17](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-17-rgr-loop-redux.svg)

![Figure 20](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-20-reference-disturbance.svg)

### 11.3. Sensors and observer

Sensor j reads y_j(k) = h_j(x_F1, x_F2, x_F3, v_j(k)) — sensors observe the plant cross-section, never the observer's own output or the audit trail. All channels are deterministic (v ≡ 0) except the LLM `judge` family, whose non-zero noise is handled by tri-state verdicts, evaluator independence, and ladder arbitration rather than by a stochastic filter. Every channel emits through the uniform `SensorReading` envelope with an explicitly epistemic status set (Articles 32, 39): the observer distinguishes _plant fault_ from _sensor fault_ as a typed value, then triage acts as the FDI block routing each failure to the authority competent to repair it (Article 15).

The observer proper is a three-stage deterministic pipeline (**Figure 6**, `diagrams/svg/fig-06-observer-pipeline.svg`): inventory regeneration (state identification) → scorecard composition over the 45-cell aspect grid (the MIMO error surface, Chapter 3) → assessment (threshold map from the grid to a gate disposition). All three stages are re-runnable and produce schema-validated artifacts; the estimate is reproducible from the record.

![Figure 6](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-06-observer-pipeline.svg)

### 11.4. Controllability and observability

Define the controllable subspace 𝒞(k) as the set of state changes reachable by admissible input sequences. The topology of Chapter 4 gives:

    𝒞(k) ⊆ span(x_F2) ∪ span(x_F5⁺)

where F5⁺ is the append-only component (evidence growth, agent-run records). Excluded by construction: x_F1 (reference exogenous), x_F3 (sensors under separated authority), x_F4 (derived, not actuated), x_F5⁻ (past records immutable). **The plant is deliberately under-controllable** — classical design would call this a defect; here the safety properties _are_ the uncontrollable complement (**Figure 15**, `diagrams/svg/fig-15-controllable-subspace.svg`). Within 𝒞(k), authority is structural while capability is empirical: when the active controller cannot find u, the supervisor swaps controllers rather than the topology widening.

![Figure 15](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-15-controllable-subspace.svg)

Observability is structural and complete at substrate granularity: every substrate has at least one dedicated sensor family (Chapter 6), including F5 — the harness observes itself, per Article 36. Observability _mass_ over the F1 × F2 cross-section is quantified by the invariant–sensor incidence matrix Φ (Φ_ij = 1 iff sensor j can produce findings for invariant i): forward adherence requires every row non-zero (no unmeasured law), reverse adherence requires every discovered plant surface claimed by some invariant (no ungoverned conduct); both are computed, gated quantities, not aspirations.

Detectability holds by construction — any unsatisfied readiness-bearing invariant is at least one sensor away from detection. Stabilizability holds over 𝒞(k); for reference-deficient modes the system is _deliberately not stabilizable by the machine_ and relies on the RGR path. The regime classification:

| Regime             | Controllable                              | Observable          | Response                            |
| ------------------ | ----------------------------------------- | ------------------- | ----------------------------------- |
| Standard           | yes                                       | yes                 | loop converges                      |
| Capability deficit | structurally yes, controller can't find u | yes                 | ladder swaps controllers (Art. 23)  |
| Reference deficit  | no — reference inconsistent               | detected via triage | RGR; human supplies Δr              |
| Sensor deficit     | yes                                       | no                  | triage → `sensor-error` → Inspector |
| Total failure      | no                                        | no                  | manual escalation; Auditor post-hoc |

### 11.5. Supervision, switching, and termination

The mode space factors as 𝓜 = 𝓜_ladder × 𝓜_task (arbitration tiers × task lifecycle). The ladder is a Ramadge–Wonham-style supervisor over a finite controller family — discrete gain scheduling, not parameter tuning — with dwell time bounded below by the iteration period, so chattering is physically precluded. Task lifecycle transitions are atomic and linearizable per task; every transition emits an evidence event, so the mode trajectory is reconstructible from the record.

The framework claims **bounded escalation**, not Lyapunov stability:

> For any initial state and any reference, the closed loop reaches one of the terminal conditions — convergence (‖e‖_Q ≤ ε), iteration-cap exhaustion, budget exhaustion, reference deficiency (RGR), or escalation to human — in finite time, with each termination recorded and classified. There is no silent-loop path.

This is weaker than asymptotic stability and stronger than best-effort: the guarantee an application class with an opaque, stochastic controller actually admits. Cumulative cost ∑c(k) ≤ C_max is a hard constraint (fuel-limited actuation, not a disturbance); wall-time and cost are bounded by tiers × cap × per-iteration bounds even when convergence is not achieved.

### 11.6. Relation to standard architectures

The design borrows from and is reducible to none of: **cascaded control** (the outer loop supplies the inner loop's _controller_, not its setpoint; the outermost loop modifies the reference itself); **RW supervisory control** (applies cleanly at the mode level, hopeless at the plant level); **MPC** (no model of f or K exists to optimize over; the guarantee is bounded escalation, not recursive feasibility); **ILC** (iteration history rides the feedforward prompt stack, but no explicit update law is synthesized — the black-box controller is responsible for exploiting it). The distinct identity: **safety by topology under black-box actuation** — forbidden edges, certified envelopes, bounded escalation, authority decomposition as the state decomposition. Safety is invariant under controller replacement; only performance is at stake when the model changes.

### 11.7. Open problems

Standing honestly open: convergence-rate characterization per task class (the record contains the data; the analysis is unbuilt); ladder calibration (which tier ordering, task-aware or not — policy accommodates any answer); statistical disturbance models for cost-aware scheduling; multi-task scheduling beyond FIFO-with-locks; and restricted-class formal convergence proofs (a Lyapunov candidate exists in ‖e‖_Q, but its per-iteration decrease is exactly what an opaque controller cannot guarantee). None of these gaps threaten the safety claims, which do not depend on controller analysis; all of them bound the _performance_ claims, which remain empirical.

## 12. What the framework guarantees, and what it does not

**Structural guarantees**, each tied to its enforcement layer, for actions performed through the runtime:

1. An agent operating in role X cannot mutate outside X's jurisdiction (Articles 6–7; authority broker).
2. An action cannot reach an effect outside its declared capability set without failing CI (D-156–D-159; static reachability gate + runtime seam).
3. A test cannot be weakened to hide plant failure without a tracked invariant change (Articles 29–30; AST-diff gate).
4. The audit trail is tamper-evident, and redaction is itself recorded (Articles 32–33; hash chain).
5. Ambiguity produces a paused task and an RGR, never an embedded guess (Article 22).
6. Specification identity is stable: versions supersede, tombstoned IDs never return, prior constitutional text is preserved (Articles 11, 40).
7. Convergence attempts are bounded in iterations and cost, with exhaustive, recorded exit conditions (Articles 19, 23).
8. New harness power is never granted and exercised in the same act: shadow first, separate recorded decision to bind (Chapter 8; D-150–D-165 as precedent).

**Explicitly not guaranteed:** correctness (a green gate means no current sensor detects deviation — necessary, not sufficient); convergence (escalation is correct behavior, not failure); zero overhead; enforcement over ungoverned host tools absent a declared adapter (the honest perimeter, §4.6); and frictionless adoption — the discipline is the product, and teams unwilling to absorb invariants-before-code, RGRs-instead-of-guesses, and separated roles should not adopt it.

The shape of the bet: as models grow more capable, the ratio of "speed at which the wrong thing can be done" to "speed at which review catches it" widens. DEVAI bets on structure over process — refusal over exhortation, records over recollection — and prices that structure so it is cheaper to keep than to drop.

## 13. Conclusions

The framework's choices — the control frame, the constitutional frame, five separated roles, invariants as atomic setpoints, capability-certified actuation, evidence as flight-recorded court record, bounded escalation, dark promotion of new power, self-application — are not independent good ideas. They are one idea projected through two vocabularies: **meaning must not be mutable by the process that implements it, and power over meaning must be legible, separated, and recorded.**

The strongest evidence the document can offer is the system's own history: a constitution that has amended itself under audit six times without once editing its past; a decision log whose corrections supersede rather than overwrite; an optimization refused because its own pre-registered measurement came back negative; and a mechanism for trusting external evidence that spent its probation dark, was graduated on findings of fact, and still awaits its separate act of activation. A framework is credible on exactly this record — not the record it claims, the record it can verify.

Disagreement that cites a D-entry or an article is more useful than agreement that cites nothing. Both are welcome; the docket is public.

## Appendix A — Notation

| Symbol                               | Meaning                                                                  | Section      |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------ |
| x(k), x_Fj(k)                        | Plant state; substrate component j ∈ {1..5}                              | §11.1        |
| u(k)                                 | Control input (file edits, governed actions)                             | §11.1        |
| 𝒰_allowed = 𝒰_role ∩ 𝒰_cap ∩ 𝒰_scope | Admissible input set: jurisdiction ∩ certified capabilities ∩ task scope | §11.1        |
| d(k), w(k), v(k)                     | Reference disturbance; plant disturbance; sensor noise                   | §11.1, §11.3 |
| r(k)                                 | Reference: invariant-satisfaction vector                                 | §11.2        |
| Q                                    | Severity-weighting diagonal matrix (the hierarchy of norms)              | §11.2, §5.2  |
| e(k), ‖e‖_Q                          | Error signal; severity-weighted error norm                               | §11.2        |
| y(k), x̂(k)                           | Sensor outputs; observer state estimate                                  | §11.3        |
| Φ                                    | Invariant–sensor incidence matrix (observability mass)                   | §11.4        |
| 𝒞(k), 𝒪(k)                           | Controllable / observable subspaces                                      | §11.4        |
| 𝓜 = 𝓜_ladder × 𝓜_task                | Composite mode space                                                     | §11.5        |
| K, π(k)                              | Inner controller; active controller configuration (ladder tier)          | §11.5        |
| N_max, C_max, c(k)                   | Iteration cap; cumulative cost budget; per-iteration cost                | §11.5        |
| E1–E5                                | Forbidden feedback edges                                                 | §4.5         |

## Appendix B — Figure index

All figures are hand-authored SVGs under [`diagrams/svg/`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/), with pre-rendered PDFs under `diagrams/pdf/` and per-figure authoring briefs under `diagrams/prompts/`. The shared palette (reference / plant / sensor / observer / harness / controller / supervisor / human / forbidden) is documented in `diagrams/prompts/README.md`.

| Figure                                             | File                               | Anchors |
| -------------------------------------------------- | ---------------------------------- | ------- |
| 1 — System overview: top-level signal flow         | `fig-01-system-overview.svg`       | §11     |
| 2 — Three nested loops with timescale separation   | `fig-02-three-loops.svg`           | §11     |
| 3 — State decomposition by authority and lifecycle | `fig-03-state-decomposition.svg`   | §3.1    |
| 4 — The RGR loop                                   | `fig-04-rgr-loop.svg`              | §7.5    |
| 5 — Feedforward composer                           | `fig-05-feedforward-composer.svg`  | §7.6    |
| 6 — Observer pipeline                              | `fig-06-observer-pipeline.svg`     | §11.3   |
| 7 — The aspect grid / scorecard                    | `fig-07-scorecard-chips.svg`       | §3.3    |
| 8 — Forward and reverse adherence                  | `fig-08-adherence.svg`             | §5.4    |
| 9 — Triage as fault detection and isolation        | `fig-09-triage-fdi.svg`            | §7.2    |
| 10 — Experimental inner-loop iteration             | `fig-10-inner-loop-sequence.svg`   | §7.6    |
| 11 — Input saturation in depth                     | `fig-11-input-saturation.svg`      | §4.5    |
| 12 — Feedforward layers                            | `fig-12-feedforward-layers.svg`    | §7.6    |
| 13 — Forbidden feedback paths                      | `fig-13-forbidden-paths.svg`       | §4.5    |
| 14 — Prompt firewall                               | `fig-14-prompt-firewall.svg`       | §4.5    |
| 15 — Controllable subspace                         | `fig-15-controllable-subspace.svg` | §11.4   |
| 16 — Tie-breaking ladder                           | `fig-16-article23-ladder.svg`      | §7.4    |
| 17 — RGR as reference-update feedback              | `fig-17-rgr-loop-redux.svg`        | §11.2   |
| 18 — Termination guarantee                         | `fig-18-termination.svg`           | §7.4    |
| 19 — Task lifecycle state machine                  | `fig-19-task-lifecycle.svg`        | §9      |
| 20 — Reference-disturbance handling                | `fig-20-reference-disturbance.svg` | §11.2   |
| 21 — The rosetta map: control ↔ mechanism ↔ law    | `fig-21-rosetta.svg`               | §2      |
| 22 — Effect gate: declared ⊇ inferred              | `fig-22-effect-gate.svg`           | §4.4    |
| 23 — Host seam path domains (Article 6)            | `fig-23-path-domains.svg`          | §4.4    |
| 24 — Severity ladder as hierarchy of norms         | `fig-24-severity-pyramid.svg`      | §5.2    |
| 25 — Evidence chain and dark promotion             | `fig-25-evidence-chain.svg`        | §8      |
| 26 — Sensor taxonomy                               | `fig-26-sensor-taxonomy.svg`       | §6.2    |
| 27 — Adoption paths: greenfield and brownfield     | `fig-27-adoption-paths.svg`        | §C.4    |
| 28 — Constitutional amendment timeline             | `fig-28-amendment-timeline.svg`    | §10.3   |

## Appendix C — Provenance and rejected alternatives

This document supersedes three papers formerly kept under `docs/theory/papers/`. Their full texts are preserved in git history; retrieval anchors are given below. What follows is the forensic narrative — what each predecessor proposed, what was absorbed, what was rejected, and why the rejections were correct.

### C.1. The predecessor drafts

**`stech-law`** was an internal parallel attempt at the same substrate, first misread as a peer constitution (D-37), then recognized as a predecessor to be absorbed and deleted (D-38). Ten of its mechanisms were absorbed wholesale — the severity ladder, invariant overrides, tombstones, per-invariant versioning, the ADR validator, the forbidden-actions registry, agent-run evidence, project types — and its stack-specific invariants became the law-pack scaffold. The forensic trail survives via tags on every absorbed invariant, and D-37 stands unedited beside the D-38 that superseded it, per the append-only rule.

**`tools/devai`** was a paper-derived control-plane draft — the "old orchestra." Its comparative analysis (D-39) absorbed seven mechanisms (CNL authoring, RGR persistence, reverse adherence, repo introspection, release gates, runtime probes, action-authority tags) and put six framing decisions to explicit resolution (D-40 through D-46). The draft and its repo were deleted after absorption.

**The old-orchestra paper** ("A Control-Theoretic, Agent-Based Architecture for Reliable AI-Assisted Engineering," 2026-01, archived 2026-05) was the founding document of that rejected architecture. Its diagnostic core — the failure modes of naive AI-assisted development, the control framing, the sketch of forbidden feedback paths — survives, absorbed into Chapters 1 and 4 of this document. Its architecture does not, on four counts:

1. **Two orchestras vs. five roles** (D-3, D-40). The draft bundled Owner ∪ Architect into a "Specifier" orchestra and Engineer ∪ Inspector into a "Constructor" orchestra. Rejected because both bundles erase load-bearing separations: the Owner/Architect compilation gap (Article 12), and the Engineer/Inspector sensor discipline (Articles 10, 29). Five is the smallest decomposition preserving both.
2. **External control plane vs. embedded package** (D-4). The draft ran DEVAI as a separate orchestrating process. Rejected for operational weight: two repositories, explicit version coupling, harder inspection. The embedded model pays instead with the F5 substrate classification and explicit upgrade drift management.
3. **RTD-as-gate vs. distributed validators + citable bundle** (D-41). The draft gated all implementation on one unified Ready-to-Develop artifact — a single point of failure where a typo in one journey blocks all engineering. Canonical DEVAI validates each artifact independently and computes the bundle on demand for citation.
4. **Paper-as-canon vs. decision-log-as-canon**. The draft's architecture flowed from its paper; corrections meant either revising the paper (losing forensics) or tolerating divergence (losing authority). Canonical DEVAI derives from numbered decisions, append-only. The fate of the predecessor paper — drifting out of sync with the implementation it described — and, later, the drift of this document's own two predecessors, are the empirical vindication. This document is maintained _because_ that lesson was learned twice.

Vocabulary from the draft that did not survive: "orchestras," "mesh controller," "Contract Elicitation Agent," "Policy Firewall" / "Policy Packs" (their use cases covered by invariants + overrides, D-45), the PORM case study (replaced by self-application — an actual, Chapter 10, instead of a hypothetical).

### C.2. The two snapshot papers

The synthesis paper ("DEVAI — A Governed, Sensor-Driven Loop…") and the control-engineering paper ("DEVAI as a Discrete-Time MIMO Control System") were May-2026 / Phase-13 syntheses of the canonical architecture. Their arguments are substantially preserved — Chapters 1–7 and 11 of this document descend directly from them — but as documents they exhibited the drift pathology described in C.1: self-labeled frozen snapshots, retroactively patched with strikethroughs and later decisions, describing a fixed-stack, autonomous-by-default, ~90-action system that no longer existed. Consolidated per D-75's layout decision and superseded here; among the material corrections: the fixed stack became a **declared stack** with stack-adapter packs (0.3.0 amendment, D-57); the autonomous loop became the explicitly experimental, non-promoting profile (0.4.0, D-126); tool-layer enforcement claims were bounded to the runtime perimeter (§4.6); the transversal list, severity vocabulary, gate semantics, and all counts were reconciled to the shipped constitution and catalogs; and everything from Rounds 18–27 (capability seams, evidence-first CI, typed boundaries, dark promotion, the sensor-cache refusal, amendments 0.5.0–0.6.0) postdates them entirely.

### C.3. Retrieval

The final committed texts of all three papers are at git path `docs/theory/papers/` as of the commit that introduced this document (see that commit's parent for `paper.md`, `paper-control-engineering.md`, and `paper-old-orchestra.md`). `git log --follow` on those paths reaches every earlier revision, including the pre-consolidation `docs/papers/` locations.

### C.4. Adoption paths (the practical corollary)

The declared-stack decision reshaped adoption into two shipped paths (**Figure 27**, `diagrams/svg/fig-27-adoption-paths.svg`): **greenfield** — blueprint + scaffold substrate, seeded with the law-pack's cluster invariants; **brownfield** — deterministic L0 introspection sensors inventory the existing plant first, doc-synthesis writers draft the missing reference tier, `inv suggest` proposes invariant candidates from inventory, and stack-adapter packs (`devai adopt pack resolve` / `graduate`) carry detection signals, writer overlays, and seed invariants per stack. In the theory's terms: greenfield writes the constitution before the conduct; brownfield performs plant identification first and then legislates for the plant it actually found.

![Figure 27](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/theory/diagrams/svg/fig-27-adoption-paths.svg)

## Appendix D — Citation summary

**Constitution** (v0.7.0, 40 articles): Articles 1–3 (mission, frame, operating mode), 4–5 (substrates, transversals), 6 (authority-by-path; F5 state paths), 7–10 (roles, disciplines, authority chain, in-iteration separation), 11 (invariant; five-tier severity; non-vacuous readiness), 12 (Owner compilation), 13 (trace), 14 (per-invariant change policy), 15 (triage), 16 (cycles), 17 (hard gate), 18 (soft gate), 19 (iteration cap), 20 (no automatic revert), 21 (escalation lifecycle), 22 (RGR), 23 (tie-breaking ladder), 24–28 (triplets, locks, checkpoints, worktrees, single integration branch), 29–32 (test as sensor, weakening prohibition, quarantine, sensor uniformity), 33–35 (Auditor, cadence, backlog), 36–39 (self-application, prompt governance, JSON canon, explicit uncertainty), 40 (amendments). Amendment history: 0.1.1, 0.2.0, 0.3.0 (D-108), 0.4.0 (D-126), 0.5.0 (D-133), 0.6.0 (D-148), 0.7.0 (D-189).

**Decisions**: D-1 (control frame), D-2 (substrates × transversals), D-3 (five roles), D-4 (embedded package), D-5→D-57 (fixed stack → declared stack + adapter packs), D-6/D-7/D-8 (invariant granularity, compilation, trace), D-37→D-46 (predecessor absorption and rejection), D-41 (RTD bundle), D-42 (prompt firewall), D-52 (worktree cap as policy), D-55 (mock LLM in CI), D-75 (papers consolidation), D-99 (per-batch gates = CI gates), D-108 (drift-remediation amendments), D-126 (supervised-readiness posture), D-133 (Auditor amendment), D-134 (closure at the merge), D-143/D-144 (integration-gate reliability), D-145–D-147 (evidence-first CI, Actions evidence shadow), D-148/D-149 (Article-11 reconciliation, typed boundaries), D-150–D-155 (capability contracts, subprocess effects, shadow analyzer), D-156–D-159 (binding effect seams, final-target enforcement, merged-lane proof), D-160–D-163 (soak, overlap rulings), D-162/D-164 (sensor-cache measurement and refusal; dark promotion), D-165 (Actions-evidence graduation), D-166 (this document's unification decision).

**ADRs**: ADR-001 (autonomous loop), ADR-003 (runtime authority enforcement), ADR-005 (Actions-run evidence).

---

_This document is Architect-authority F1 content (Article 6). Cross-references are checked by `devai docs links`; counts it shares with guarded surfaces are cross-checked by `devai sense docs drift`. Corrections follow the standing rule: supersede with citation, never silently rewrite history._

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/theory/devai-theory.md (classification CURRENT).
