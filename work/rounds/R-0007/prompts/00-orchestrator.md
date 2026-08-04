# R-0007 ORCHESTRATOR — product, docs, and deploy-ready site

R-0007 remains dormant until live entry validation passes. Read OM-002, OM-003,
OM-014, DII-246, the shared execution contract, authorization, plan, close-control
profile, affected-test graph, obligation registry, current-claim registry, R-0006
closure, combined audit, docs migration manifest, product contracts, action registry,
docs generators, History, Docusaurus configuration, and deploy workflow.

Before B0, fetch and prove clean `main == origin/main`, run preparation policy
validation, prove graph and obligation population completeness, and confirm the OM-018
admission gate PASS and Review Run 2 PASS. Per OM-018 the pre-B0 handoff is
declaration-tolerant: do **not** run `round-close:entry-check` before B0 — it is
declaration-bearing and correctly blocks on the unbound declaration. Run it after B0
and before B1. The reviewer is already bound by Owner mandate: OM-017 binds the literal
`claude-opus-5` selector with no fallback, retained by OM-018. Do not select, infer, or
substitute a model; an inactive, ambiguous, conflicting, or unavailable binding stops
the round. Silent fallback is forbidden.

At B0, record a schema-valid structured round-declaration marker in the Architect
decision and update the profile declaration slot with that decision ID and the exact
then-main SHA. Every later base argument must equal that candidate-tree marker and be an
ancestor of the candidate; never select a shorter convenient range.

Execute B0 through B9 by risk slice. Install the deploy-refusal guard before changing
site configuration. The Owner batch follows only approved line-level dispositions.
The Architect classifies every historical or active reference. The Engineer generates
outputs; nobody hand-edits them. Build and hash the site locally but never deploy.

Before each affected gate, generate the impact plan. Execute every selected shard and
every conservative widening. Reuse a local PASS only when its complete content,
dependency, output, environment, toolchain, policy, and graph key verifies. An unknown
or incomplete relationship runs the full suite. Coverage remains whole-only. Remote
exact-head and exact-main CI run every authoritative gate without local cache trust.

Before independent review, finish an internal P0/P1/P2 obligation rehearsal, repair
the complete population of every discovered defect class, materialize and validate all
current claims, converge twice, pass the candidate-only clone rehearsal, freeze one
exact candidate, and generate its complete semantic review scope. Any semantic or
current-tree change invalidates candidate, convergence, claims, rehearsal, manifests,
review, and publication standing.

The Owner-bound reviewer processes every topic exactly once, including unchanged
topics, and continues after blockers. `REUSED_FRESH_PASS` requires independent current
digest and evidence verification and is forbidden for changed topics. Each finding
must name a deterministic same-class population query, every affected instance, and a
machine-checkable repair condition. Truncated, malformed, omitted, duplicated,
unknown, stale, or identity-mismatched output is invalid and never PASS.

Cycle 1 reviews the complete population. One role-pure repair phase may close every
reported class, after which all invalidated artifacts are regenerated and cycle 2
reviews the entire new population. Cycle-2 failure stops as `ESCALATION_REQUIRED`.
Cycle 3 is forbidden. One transport-invalid attempt may retry the unchanged cycle; a
second stops as `REVIEW_TRANSPORT_BLOCKED`.

Publish only the exact validated reviewed head. Merge only with green exact-head CI,
then verify exact-main CI. Close through the governed two-PR ceremony. No Pages action,
deployment, package publication, tag, GitHub Release, external release claim, evidence
promotion, real-stynx mutation, or predecessor mutation is authorized.

Final report:

`ENTRY BINDING / REFERENCE MAP / PRODUCT DISPOSITIONS / P0 DOCS / P1 DOCS / P2 DOCS /
CLI PAGES / PROJECTIONS / HISTORY HASHES / SITE ARTIFACT SHA / DEPLOY GUARD / IMPACT
PLAN / COLD-WARM EXECUTIONS / CURRENT CLAIMS / REVIEW TOPICS / REVIEW CYCLES / BATCH
COMMITS / GATES / EXACT-HEAD CI / EXACT-MAIN CI / CLOSURE / DEPLOYMENT NONCLAIM`.
