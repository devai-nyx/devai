---
id: R-0007-PLAN
title: CLI contract, round-subordinate tasks, and executor substrate
type: round-plan
status: draft
date: 2026-08-05
authority: Architect
supersedes: null
superseded_by: null
provenance:
  - OM-019
  - OM-021
  - DII-254
  - work/rounds/R-0007/history/plan.pre-om-019.md
---

# R-0007 — CLI contract and executor substrate

## Objective

Replace the oversized 147-action user surface with seven workflow-facing domains while
preserving useful internal services, fail-closed historical migration, exact authority
boundaries, and complete machine-readable output. Make task execution subordinate to
governed rounds and produce canonical machine descriptors plus minimum migration/operator
guidance for every named category. R-0009 owns the coherent user-facing documentation corpus.
Make the subordinate task contract executor-neutral and auditable so
a round can dispatch deterministic routines, LLM agents, human checkpoints, or governed
composites without conflating model capability with authority.
Establish the GitHub Actions execution foundation and replace unconditional per-commit full
regression with mechanically derived, fail-closed validation classes, while retaining a
mandatory complete cold lane for frozen candidates and round close. Under OM-019, R-0007
leaves narrowing and cache acceleration disabled; R-0008 owns authentication, activation,
paired performance evidence, and rollback.

## Owner-set product direction

- DEVAI has not released `1.0.0` or `1.0.0-rc`; this is the intended pre-RC breaking-change window.
- Default help exposes only `init`, `doctor`, `check`, `sense`, `round`, `evidence`, and `release`.
- `task` and `catalog` remain hidden plumbing.
- Public terminology is `suite`, `preset`, `kind`, `slice`, and `tier`.
- Public harness initialization is `init apply harness`, not `init apply f5`.
- Remote consent is `--write --publish`; `--publish` never implies `--write`.
- Sensor presets are `baseline`, `structural`, `governed`, and `sweep`.
- Check suites are `quick`, `standard`, `full`, and `release`.
- Every governed task belongs to exactly one round and ordinary users operate it through `round run`.
- Every new task declares one closed executor kind: `routine`, `agent`, `human`, or `composite`.
- Agent selection records runtime/model/effort through `exact`, explicitly allowlisted
  `preferred`, or named-versioned `policy` resolution; no implicit fallback is allowed.
- Mutable model availability belongs to an Architect-owned model/runtime registry, not
  hard-coded task-schema enums.
- CI validation is selected by a machine-derived risk class, never by an author assertion.
- GitHub dependency caches accelerate acquisition only and have no test-verdict standing.
- Fast feedback and cold authoritative lanes are distinct; the latter is never satisfied by
  DEVAI result reuse.

## Entry gates

- OM-019 and `AUTHORIZATION.md` grant this scope after B0 declaration and entry check.
- The exact delta after recognized candidate `b1a814a93b0dc186c28a1341354cdf4444609728` is classified and receives an explicit standing disposition.
- Live package/tag evidence confirms no stable `1.0.0` or `1.0.0-rc` publication.
- The applicable authorization is `GRANTED`, not conditional or pending.
- Exact live `origin/main`, open PRs, required checks, and the current registry population are re-read.
- Live repository visibility, Actions plan/features, runner classes, cache/artifact limits,
  rulesets/required checks, fork policy, and current workflow critical path are inventoried.
- The predecessor checkout remains read-only.
- Entry install, prepare, tests, and coverage floors pass or their honest red state is recorded.

## GitHub Actions and commit-validation setpoint

R-0007 performs a live, versioned census of applicable GitHub Actions capabilities. Each
capability receives exactly one `adopt`, `defer`, or `reject` disposition with security,
semantic, cost, and measured critical-path rationale. The minimum adopted foundation is:

- pnpm content-store caching keyed by runner OS/architecture, exact Node and pnpm identities,
  lockfile digest, and effective package-manager configuration; every job still runs frozen
  installation, and neither `node_modules` nor verdict/evidence state is cached;
- reusable workflow or composite-action setup that removes duplicated checkout/toolchain/
  install/report plumbing while keeping inputs, outputs, permissions, and caller/callee
  workflow identities explicit;
- a mechanically derived job DAG that parallelizes only independent checks, preserves build
  dependencies and tier/process order, and uses matrices only where each cell is a complete
  declared population;
- event-specific concurrency: superseded PR feedback may cancel; main, merge-queue, frozen
  candidate, convergence, and round-close authoritative runs must not be cancelled or silently
  replaced;
- immutable full-SHA action references, least-privilege job permissions, explicit fork/PR
  cache boundaries, bounded retention, structured reports, annotations, workflow summaries,
  and timing telemetry;
- artifacts for reports and inter-job bytes only, with digest verification before consumption
  and no PASS authority until R-0008's authenticated-claim contract is separately authorized;
- a fast feedback lane plus a mandatory cache-independent DEVAI-result cold lane. Dependency
  download caching remains permitted in the cold lane only because frozen install revalidates
  the lockfile and cached bytes carry no verdict.

GitHub-hosted larger runners, merge queues, rulesets, or other paid/administrative features
are adopted only if entry proves availability, cost acceptance, and separate authority for any
settings mutation. Self-hosted runners, mutable action tags, caching `node_modules`, raw cache
hits as evidence, unsound test sharding, and artifacts trusted merely because GitHub stored
them are rejected.

### Mechanical commit validation classes

Replace the unconditional `pnpm vitest run` before every commit with one classifier command
that derives a machine-readable validation plan from the exact base-to-candidate diff and the
candidate-bound affected-test, command-closure, schema, materialization, and governance graphs.
It must process additions, modifications, deletions, exact renames, symlinks, generated-source
edges, package scripts, workflow YAML, mixed-role/mixed-class commits, and unresolved dynamic
dependencies. Authors cannot select or lower the class. The strictest derived class wins;
unknown or incomplete derivation widens, never narrows.

| Class                 | Typical scope                                                                                | Mandatory minimum                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `governance-text`     | Owner mandates, round plans/prompts, non-executable docs                                     | changed-file formatting and `git diff --check`; frontmatter/schema; exact references; authority census; uniqueness; affected trace/digest checks         |
| `law-and-schema`      | law, policy, schemas, registries, canonical descriptors/materializations                     | prepare; schema/policy/trace/materialization/governance checks; complete mechanically affected tests; full Vitest if closure is incomplete               |
| `runtime-and-tests`   | packages, scripts, workspace tooling, workflows, test code/config                            | prepare and static checks; complete affected-test closure; affected tier, DB, workflow, and coverage gates; full Vitest if impact is broad or unresolved |
| `candidate-and-close` | classifier/trust activation, frozen candidate, convergence, round close, release eligibility | complete applicable authoritative cold population from the active close profile, including literal independent execution where required                  |

Every class retains `git diff --check`. The classifier result binds base/candidate, changed
path statuses, derived dependencies, selected and omitted commands with reasons, policy/graph/
toolchain identity, and observed exits. Any classifier/policy/graph implementation change is
`candidate-and-close` for bootstrap. A scheduled or main-bound cold sentinel compares the
classifier's predicted population with complete execution; one false negative disables
classified validation and restores the former complete floor until a governed repair closes
the complete defect class.

R-0007 does not activate narrowing or cache acceleration. It retains the complete fallback
floor and records the implemented fail-closed foundation only. R-0008 must separately bind
its trust root, then obtain paired current-workflow and candidate-workflow runs on the same
exact source and runner class before any activation or wall-time claim. Semantic populations
precede timing; a feature with no positive median critical-path saving and no separately proved
security or operability benefit remains disabled.

## Target surface

No target or historical count is pre-authorized. Entry recomputes the live registry,
generated views, runtime registrations, built binary, consumers, and one-to-one migration
fixture. Every source identity receives exactly one keep, fold, or tombstone disposition
before any target count gains standing.

## Preset and suite setpoints

### Sense presets

| Preset       | Required population                                                                                                               | Intended use                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `baseline`   | build, lint, type check, unit test                                                                                                | fast local feedback                              |
| `structural` | baseline plus API/routes/data/RBAC/data-handling/dependency inventories and spec depth/alignment                                  | repository understanding and reference alignment |
| `governed`   | structural plus spec freshness/idiomaticity, test-invariant alignment, harness coverage/depth/coherence/alignment, and docs drift | governed pull-request and round evidence         |
| `sweep`      | every registered read-only sensor kind in canonical order                                                                         | exhaustive round-bound observation               |

`sweep` requires `--round R-NNNN`, performs no implicit persistence, and lists excluded
write-capable operations. Old preset spellings migrate as `tier1 -> baseline`, `tier2 ->
structural`, `tier3 -> governed`, and `all -> governed`.

### Check suites

| Suite      | Required population                                                                                                         | Intended use                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `quick`    | build, lint, type check, unit tests, essential schema/config loading                                                        | developer feedback                                     |
| `standard` | quick plus invariant/journey/glossary/trace/test-trace/strategy/action coverage and ordinary policy checks                  | default PR acceptance                                  |
| `full`     | standard plus full tests, inventory, docs/CI/policy, mutation, security/performance, harness, and coverage gates            | complete deterministic local verification              |
| `release`  | full plus evidence, release scorecard, dependency/security, provenance, changeset/version, and workflow-reference readiness | eligibility for separately authorized release ceremony |

The exact ordered membership of every suite and preset is Architect-owned policy,
machine-consumed by the runtime, and rendered into documentation. Prose must never carry
an independent copy of these lists.

## Task executor setpoint

The breaking task schema revision requires `round_id` and a closed `executor`
discriminated union:

- `routine`: a registered action or explicit shell-free argv with relative cwd,
  declared inputs/outputs/effects, timeout, and authority checks;
- `agent`: a rostered runtime/model/effort, optional registered skill ID,
  prompt-composition reference, bounded iterations, capabilities, and one selection
  mode;
- `human`: a required governance role, instructions/reference, completion evidence,
  and timeout/escalation behavior;
- `composite`: explicit same-round child task IDs and dependency order, with cycles
  rejected before dispatch.

`discipline` remains the authority source. Executor kind, model capability, and model
size never grant path, publication, or external-action authority.

Agent selection modes are `exact` (no substitution), `preferred` (only an explicit
ordered fallback allowlist), and `policy` (only a named, versioned routing policy).
Model/runtime registry entries bind stable ID, vendor/family, adapter, exact provider
identifier or governed alias, supported efforts, capabilities, eligible agent classes,
availability, and replacement metadata. Model names remain registry data so roster
updates do not require task-schema changes.

The task stores the immutable requested executor contract. A separate rostered
task-execution evidence record stores the resolved runtime/model/effort or canonical
argv, adapter/tool versions, prompt ID/hash, input and output digests, selection/fallback
decision, usage/cost where applicable, timestamps, verdict, and evidence references.
Exact mismatch blocks before execution.

Existing pre-revision task records are inventoried at entry. They remain historical and
cannot execute until an explicit mapping supplies round and executor fields. The runtime
must not infer these fields from `model_tier`, tags, prompts, worktrees, or prior runs.

## Batches

| Batch | Role                                                              | Work                                                                                                                                                                                                                                                                                                                                                                                                             | Commit gate                                                                                                                        |
| ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| B0    | Owner + Auditor                                                   | Record only the granted mandate; inventory current surface, version standing, terminology, consumers, and defects                                                                                                                                                                                                                                                                                                | No implementation; exact baseline and authority                                                                                    |
| B1    | Inspector                                                         | Commit red contracts for population, migration, help, vocabulary, suites, presets, round-task containment, executors, model routing, effects, output totality, Actions security/DAG/cache behavior, and validation classification                                                                                                                                                                                | Reds prove admitted defects without weakening prior evidence                                                                       |
| B2    | Architect                                                         | Decide CLI IA, registry dispositions, schemas, suite/preset descriptors, task-round/executor model, model/runtime registry, execution evidence, GitHub Actions feature dispositions, validation classes, and documentation information architecture                                                                                                                                                              | One canonical meaning for every public term, enumeration, and CI validation decision                                               |
| B3A   | Engineer                                                          | Implement the typed executor substrate, registry resolver, four executor adapters/boundaries, legacy refusal, and requested/resolved execution evidence                                                                                                                                                                                                                                                          | Focused executor contracts pass; no implicit fallback or authority widening                                                        |
| B3B   | Engineer                                                          | Implement registry/router/help plus init, check, sense, round/task, evidence, and release façades in parallel role-pure worktrees                                                                                                                                                                                                                                                                                | Round/CLI consumes B3A; no shelling through retired routes; generated views exact                                                  |
| B3C   | Engineer                                                          | Implement classified validation and GitHub Actions foundation: cache-safe setup, reusable workflow plumbing, semantic DAG/concurrency, reports/artifacts, telemetry, and cold sentinel                                                                                                                                                                                                                           | Cache never grants PASS; classifier fails closed; cold lane retains complete proof                                                 |
| B4    | Inspector                                                         | Verify all retained/historical routes, façade behavior, executor dispatch, model routing, effect authority, suite/preset membership, task containment, and source/binary parity                                                                                                                                                                                                                                  | Complete executable population; no silent skips                                                                                    |
| B5    | Architect                                                         | Produce canonical machine descriptors and minimum migration/operator material consumed by R-0009                                                                                                                                                                                                                                                                                                                 | No duplicated mutable enumeration                                                                                                  |
| B6    | Inspector                                                         | Run descriptor, migration, example, obsolete-vocabulary, model-roster, and generated-byte acceptance                                                                                                                                                                                                                                                                                                             | Canonical material matches runtime and policy exactly                                                                              |
| B7    | Auditor + Inspector + Architect + Engineer + independent reviewer | Audit complete classes; repair the exact OM-022 historical exception consumer; decompose the close controller by DII-258; repair both B6 coverage-profile cases within their original 5-second and 90-second budgets; execute the non-reentrant independent 16-command proof; align stale OM-017/OM-019 close inputs; converge twice; review the exact candidate; and record an honest pre-RC/non-release result | Every topic dispositioned; any repair restarts convergence/review; no timeout inflation, activation, reuse, site, or savings claim |
| B8    | Architect + machine verb                                          | Close only through the then-authorized ceremony                                                                                                                                                                                                                                                                                                                                                                  | No inferred publication, readiness, or release claim                                                                               |

## Canonical reference handoff to R-0009

B5 creates canonical descriptors and minimum safe migration/operator guidance. The R-0009
handoff covers:

1. CLI overview and seven-workflow mental model.
2. Vocabulary: suite, preset, kind, slice, tier, round, subordinate task, role, effect, verdict, lifecycle, porcelain, and plumbing.
3. Check suites: membership, ordering, cost, prerequisites, outputs, exit behavior, when to use, and examples.
4. Sense presets: membership, cumulative relationships, sweep exclusions, persistence boundary, outputs, and examples.
5. Sensor kinds: generated complete registry with purpose, emitter, inputs, outputs, mapped scorecard cells, diagnostic standing, preset membership, prerequisites, and effect.
6. Inventory slices: exact contents, supported stacks, deterministic inputs, output body, limitations, and examples.
7. Adoption tiers: obligations and advisory/binding behavior; explicitly distinct from suites and presets.
8. Rounds, tasks, and executors: ownership, cardinality, lifecycle, waves,
   dependencies, resource isolation, recovery, hidden task plumbing, four executor kinds,
   three agent-selection modes, fallback refusal, model/runtime/effort resolution, and
   requested-versus-resolved evidence.
9. Authority and effects: roles, read/harness-write/local-write/remote-write, `--write`, and `--publish`.
10. Migration guide: every old command and vocabulary spelling to its successor or removal disposition.
11. Model/runtime reference: generated roster of vendors/families, adapters, runnable
    models or governed aliases, supported efforts, capabilities, availability,
    replacement metadata, and selection eligibility.

Every descriptor must answer for each value: what it means, what it contains, when
to use it, when not to use it, required inputs and tools, output contract, expected
effects, failure/unknown/skipped semantics, cost class, and at least one correct example.

Sensor-kind and migration tables are generated from canonical machine records. Suite,
preset, slice, tier, executor, selection, model/runtime, role, effect, verdict, and
lifecycle tables are rendered from their
respective canonical policies/schemas. Narrative pages link to generated tables rather
than repeating mutable populations.

No new `devai docs` user domain is introduced. R-0007 does not claim complete narrative
documentation or a deploy-ready site. R-0009 owns conceptual education, generated pages,
site integration, links, and final user-facing completeness.

## Acceptance

- Default help shows exactly seven workflow domains.
- `task` and `catalog` are absent from default help and visible only in expanded plumbing help.
- Every task record requires a valid `round_id` and belongs to its declared active round.
- Every task record requires exactly one valid executor contract.
- `round run` is the normal task execution path.
- Deterministic routines run without an LLM; agent work uses only rostered
  runtime/model/effort combinations; human completion requires evidence; composites
  reject cycles and cross-round children.
- `exact` never substitutes; `preferred` uses only its explicit ordered allowlist;
  `policy` uses only its named/versioned routing policy, and every resolution is recorded.
- Requested executor data remains immutable and resolved execution evidence is complete.
- Legacy task records cannot execute until explicitly mapped; no round/executor/model/
  effort inference is permitted.
- All 147 formerly runnable routes have exactly one retained/folded/tombstoned disposition.
- Old vocabulary and flags fail closed with exact migration guidance.
- `sense migrate` is correctly declared as a DB-writing action.
- `release status`, chain-head inspection, and report-only translation are classified by their actual effects.
- Suites and presets are registry-derived and match their canonical descriptors structurally.
- Every registered sensor kind and inventory slice appears exactly once in user-facing reference output.
- Every executor kind, agent-selection mode, runtime, rostered model, and supported
  effort appears exactly once in its canonical user-facing reference.
- Every applicable GitHub Actions feature has one live `adopt`/`defer`/`reject` disposition.
- Dependency cache poisoning or a cache miss changes duration only, never verdict or population.
- Reusable setup preserves explicit permissions, inputs, toolchain, and workflow identity.
- PR cancellation cannot cancel or replace main/merge-queue/frozen-candidate/round-close proof.
- The validation classifier assigns all four classes correctly across additions, deletions,
  renames, symlinks, generated edges, YAML/script indirection, mixed changes, and unknowns.
- Governance-text commits do not run unconditional full Vitest; runtime/law uncertainty widens;
  candidate-and-close executes the complete active cold profile.
- The cold sentinel detects seeded classifier omissions and automatically disables narrowing.
- R-0007 leaves classified narrowing and dependency-cache acceleration disabled and makes no
  CI wall-time claim; paired activation evidence remains an R-0008 obligation.
- The close controller is decomposed into the five DII-258 concern modules without changing
  literal argv, candidate identity, persisted state, result, or exit semantics.
- The complete B6 inventory and canonical-example acceptance populations pass under the
  coverage profile inside their unchanged five-second and 90-second budgets.
- All 16 authoritative commands pass independently in different freshly installed detached
  clones, outside every suite that the roster itself invokes.
- The R-0009 handoff contains enough canonical semantics to explain every enumeration without copying a mutable list.
- All action envelopes, error envelopes, authority refusals, and aggregate exits are total.
- All unchanged 70/60/70/70 coverage floors remain green.

## Stops

Stop on missing authority, live evidence of a stable/RC publication, role impurity,
predecessor mutation, registry-count guesswork, undocumented enumeration, duplicated
policy truth, implicit task independence, implicit sensor persistence, write-effect
under-declaration, implicit model fallback, unrostered runnable model, executor-derived
authority, task-request mutation, cache-derived PASS, mutable action pin, permission widening,
unsound matrix/shard, cancelled authoritative run, classifier false negative, self-selected
validation class, missing cold sentinel, weakened tests/coverage, generated/source/binary drift, or any
external publication without its separate grant.

## Claim ceiling

Completion establishes a simplified pre-RC CLI/executor contract and canonical reference
handoff plus an implemented, disabled, fail-closed GitHub Actions and commit-validation
foundation. It does not establish authenticated result reuse, validation/cache activation,
paired performance standing or rollback (R-0008), complete user documentation or site
readiness (R-0009), release, deployment, production readiness, autonomous readiness, or
evidence promotion.
