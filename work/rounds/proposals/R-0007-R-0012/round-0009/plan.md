---
id: R-0009-PROPOSED-RESEQUENCED-PLAN
title: Product semantics, complete user documentation, and deploy-ready site
type: temporary-round-plan
status: draft-non-authoritative
date: 2026-08-02
sources: [work/rounds/R-0007; work/rounds/R-0007 documentation waves]
---

# R-0009 — Product, documentation, and deploy-ready site

## Objective

Apply approved product dispositions, document the stabilized CLI/executor/convergence
model, generate all canonical references and projections, rebind active documentation by
risk, finalize frozen History, and build an exact deployable successor site artifact
without deploying it.

This merges former R-0007 with the documentation waves split from temporary Round 11.
One round owns the coherent user corpus, preventing a CLI-reference rewrite immediately
after the product/site round.

## Entry gates

- R-0008 is merged/closed; R-0007 CLI/executor and R-0008 convergence contracts are stable.
- The former R-0007 subject authority is explicitly rebound to R-0009; no mechanical
  authorization renumbering.
- All production gates, tier gates, unchanged coverage floors, generated registries, and
  authenticated convergence are green.
- External Pages/release gate remains ungranted.

## Risk order

P0: authority, effects, state/proof placement, destructive actions, mutable/current claims,
repository identity, deploy guard, History integrity, task/executor authority, cache/reuse
trust. P1: commands, suites/presets, adoption, CI, round procedures, generated references.
P2: theory, historical labels, counts, diagrams, indexes. Complete P0 before P1 before P2.

## Batches

| Batch | Role                     | Work                                                                                                                                    | Gate                                 |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| B0    | Architect                | Declare round; freeze per-reference semantic mapping and documentation IA                                                               | every occurrence classified          |
| B1    | Engineer                 | Fail-closed deploy refusal requiring later exact-candidate external grant                                                               | accidental deploy nonzero            |
| B2    | Inspector                | Product/docs/reference/site reds: command resolution, enumeration parity, repository existence, generated identity, claims and examples | complete categories red              |
| B3    | Owner                    | Apply approved journey/use-case dispositions line by line                                                                               | no new product choice inferred       |
| B4    | Architect                | Rebind P0 docs and frozen History from re-read sources                                                                                  | authority/history exact              |
| B5    | Engineer                 | Generate CLI pages and product projections from stabilized registries/policies                                                          | direct output edits rejected         |
| B6    | Architect                | Write conceptual/reference/migration docs and site source                                                                               | one canonical source per enumeration |
| B7    | Inspector                | Product, CLI reference, docs, links, site drift, examples, obsolete vocabulary, and model-roster sweeps                                 | zero drift/broken links              |
| B8    | Auditor                  | Audit risk slices and hash exact built site artifact                                                                                    | deployable, not deployed             |
| B9    | Architect + machine verb | Close source and closure boundaries                                                                                                     | no Pages action                      |

## Mandatory user documentation

The corpus must explain, not merely list:

1. Seven-domain CLI overview and workflow.
2. `suite`, `preset`, `kind`, `slice`, `tier`, round, subordinate task, role, effect,
   verdict, lifecycle, porcelain, and plumbing.
3. Check suites `quick`, `standard`, `full`, `release`: generated membership/order,
   prerequisites, cost, outputs, exits, uses, non-uses, examples.
4. Sense presets `baseline`, `structural`, `governed`, `sweep`: cumulative relations,
   exclusions, persistence boundary, outputs, examples.
5. Every sensor kind and inventory slice from canonical registry.
6. Adoption tiers, explicitly distinct from suites/presets.
7. Rounds, subordinate tasks, four executors, three selection modes, model/runtime/effort
   resolution, fallback refusal, requested/resolved evidence, recovery, and isolation.
8. Authority/effects, including `--write` and `--publish` independence.
9. Complete old-to-new command/vocabulary migration.
10. Generated model/runtime roster and availability/replacement semantics.
11. Authenticated convergence: when results may be reused, why protected gates cannot
    substitute, signature/trust epoch, fail-closed execution, remote uncached behavior.

For every enumerated value: meaning, contents, use/non-use, inputs/tools, output, effects,
failure/unknown/skipped semantics, cost class, and correct example. Narrative pages link to
generated tables rather than copying mutable membership.

## Acceptance

- Every active product/action reference resolves or is explicitly inactive.
- CLI, task/executor, model/runtime, suite/preset/kind/slice/tier and convergence docs match
  canonical runtime/policy exactly.
- History uses recomputable immutable predecessor hashes and honest nonclaims.
- Generated pages/projections/site bytes reproduce deterministically.
- Active docs contain no retired doctrine; historical material is labelled.
- Site build/typecheck/links/drift/reference/example tests pass.
- Built artifact is hash-bound to exact source commit; no deploy workflow executes.

## Stops and claim ceiling

Stop on new Owner product choice, bulk mechanical semantic replacement, duplicated policy
truth, mutable-main historical citation, direct generated edit, missing deploy guard,
undocumented enumeration, Pages deployment, or released wording. Exit claim: product and
documentation are semantically current and the site artifact is deploy-ready; nothing is
deployed or released.
