# R-0007 ORCHESTRATOR — CLI contract and executor substrate

## Model and coordination

- Root orchestrator: use the active session selected by the operator; this prompt does not
  select a model.
- Use at most the available concurrency; keep one slot for the orchestrator.
- Spawn agents only for bounded tasks with exact role, worktree, path allowlist, base SHA, tests, and stop conditions.
- No two active agents may edit the same file or worktree.
- A role change is a new agent/session and commit boundary.
- Specialist selection follows explicit task authority and availability; never infer or
  substitute the independently bound close reviewer.

## Mandatory reads and entry

Read `AGENTS.md`, current Owner mandates, consolidated audit/backlog, shared execution
contract, live authorization/plan/prompts, CLI ADR, action/sensor registries and schemas,
versioning policy, release discipline, current handlers, tests, package scripts, and this
entire committed R-0007 packet, including `inventory/old-to-new-command-map.md`. Re-read live
remote and release evidence. Classify every commit after the recognized
`b1a814a93b0dc186c28a1341354cdf4444609728` PASS; if no
existing rule carries the PASS across that exact delta, stop for Owner disposition. If a stable or
RC 1.0 publication exists, or authorization is not expressly GRANTED, stop.

Create a dedicated `codex/` integration worktree only after entry passes. Never mutate
the predecessor. Preserve exact red evidence. Use role-pure commits and read every gate
output before committing.

The independent close reviewer is already bound by Owner mandate OM-017. The exact selector
lives only in the mandate and profile, with no fallback.

Do not select, infer, or substitute a model for that role. Silent fallback is forbidden. An
unavailable or conflicting binding blocks review without changing the selector.

## Wave execution

Execute the split prompts in order:

1. `01-entry-authority-audit.md`
2. `02-inspector-red.md`
3. `03-architect-setpoint.md`
4. `04-executor-substrate.md`
5. `05-engineer-implementation.md`
6. `06-inspector-acceptance.md`
7. `07-user-documentation.md` — canonical descriptors and R-0009 handoff only
8. `08-documentation-acceptance.md` — handoff acceptance only
9. `09-audit-review-close.md`

Within an eligible wave, maximize safe parallelism using disjoint worktrees and files.
Do not begin an Engineer wave before the corresponding Inspector red and Architect
setpoint are committed. Wave 4 must pass its focused executor gates before Wave 5
consumes the substrate. Do not begin final review before documentation acceptance.

## Global implementation setpoint

- Seven default domains: init, doctor, check, sense, round, evidence, release.
- Hidden task/catalog plumbing only.
- Public vocabulary: suite, preset, kind, slice, tier.
- Harness, not F5, in public onboarding.
- Remote consent: `--write --publish`.
- Check suites: quick, standard, full, release.
- Sense presets: baseline, structural, governed, sweep.
- Every task requires one active round and normally executes through `round run`.
- Every task declares exactly one `routine`, `agent`, `human`, or `composite` executor.
- Agent selection is `exact`, explicitly allowlisted `preferred`, or named/versioned
  `policy`; fallback is never implicit.
- Model/runtime/effort availability is canonical registry data. Discipline remains the
  authority source, and resolved execution is evidenced separately from the immutable
  task request.
- Registry counts are unbound until mechanically recomputed from the live one-to-one map.
- Canonical descriptors are policy-derived and part of acceptance; R-0009 owns the complete user corpus.

## Verification and close

Run the complete minimum and exit floors, coverage, DB-enabled cases, production binary
population, migration map, suite/preset membership, executor/model-routing/evidence
contracts, canonical descriptor and migration-handoff coverage,
links, generated parity, and obsolete-vocabulary checks. Converge twice with a clean
second pass, obtain independent exact-candidate review, and restart convergence/review
after any repair.

Do not push, open a PR, merge, publish, tag, release, deploy, or archive without the
then-current explicit authorization.

Final report:

`AUTHORIZATION / LIVE VERSION STANDING / BASE SHA / CURRENT POPULATION / TARGET
POPULATION / MIGRATION MAP / SUITES / PRESETS / KINDS / SLICES / TIERS / ROUND-TASK
CONTAINMENT / EXECUTORS / MODEL+EFFORT ROUTING / EXECUTION EVIDENCE /
AUTHORITY+EFFECTS / USER DOCS / TESTS / COVERAGE / CONVERGENCE / REVIEW /
AUDIT / NONRELEASE CLAIM`.
