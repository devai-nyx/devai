---
id: ADR-022
title: R-0007 governed workflow and executor substrate
type: adr
status: active
date: 2026-08-07
authority: Architect
supersedes:
  - R-0007-PLAN#Preset-and-suite-setpoints
  - R-0007-PLAN#Task-executor-setpoint
superseded_by: null
provenance:
  - OM-019; R-0007 canonical plan; R-0007 B1 executable contracts; ADR-010; ADR-012; ADR-019
affected_rules:
  - law/policy/check-suites.json
  - law/policy/sense-presets.json
  - law/policy/round-execution.json
  - law/policy/model-runtime-registry.json
  - law/policy/agent-routing-policies.json
  - law/policy/sensor-registry.json
  - law/schemas/check-suites.schema.json
  - law/schemas/sense-presets.schema.json
  - law/schemas/round-execution.schema.json
  - law/schemas/model-runtime-registry.schema.json
  - law/schemas/agent-routing-policies.schema.json
  - law/schemas/sensor-registry.schema.json
  - law/schemas/task.schema.json
  - law/schemas/task-execution-evidence.schema.json
---

# ADR-022. R-0007 governed workflow and executor substrate

## Status

Accepted and active in R-0007. This decision supersedes only the canonical plan's
provisional `Preset and suite setpoints` and `Task executor setpoint` sections with the
schema-backed rules listed above. It retains every other plan provision and extends
ADR-010 capability/effect inference, ADR-012 round execution, and ADR-019 sensor authority
without reopening their sealed history. It grants no publication, release, or predecessor
authority.

## Context

The successor had individually runnable checks and sensor kinds, but no single
machine-readable definition of the public suites and presets. Task records also lacked a
required round identity and a closed executor contract, allowing runtime choice, authority,
and evidence to become conflated. Mutable provider availability could not safely live in a
task-schema enum, and legacy task records had no fail-closed migration boundary.

R-0007 therefore requires one canonical workflow vocabulary, exact ordered populations,
round-contained task execution, deterministic routine dispatch, governed agent selection,
evidence-bearing human completion, composite dependency checks, and separately recorded
resolution evidence.

## Decision

### Suites, presets, and effects

`law/policy/check-suites.json` is the sole ordered definition of `quick`, `standard`,
`full`, and `release`. Every member has one execution binding, maximum effect, cost class,
and output contract. Unknown members or outcomes are errors and never PASS. The release
suite is readiness observation only; it does not publish.

`law/policy/sense-presets.json` is the sole ordered definition of `baseline`,
`structural`, `governed`, and `sweep`. Preset execution never implicitly persists a
reading. `sweep` requires an explicit round, includes every registry entry whose maximum
effect is exactly `read` in canonical registry order, and reports every excluded
write-capable kind. The old `tier1`, `tier2`, `tier3`, and `all` spellings are migration
guidance only and do not dispatch.

Sensor effects record the maximum intrinsic execution effect, independently of optional
reading persistence. Every non-read sensor entry records its capability ceiling, reviewed
source paths, and rationale. ADR-010's existing capability derivation remains binding:
`net:*` derives `remote-write`; database/workspace mutation derives `local-write`; and
bounded harness-state mutation derives `harness-write`. Accordingly, an LLM judge is not
read-only merely because it emits a reading, and runtime API/auth/data probes are not
read-only because their charters can execute network requests or write-capable SQL. These
kinds are excluded from `sweep` and require the corresponding authority and consent before
dispatch.

### Round-contained task execution

Task schema version 2.0.0 requires `round_id` and exactly one closed `executor` of kind
`routine`, `agent`, `human`, or `composite`. Every executable task belongs to exactly one
active round. `round run` is the ordinary entry point; direct task execution remains hidden
plumbing and cannot bypass containment.

A routine names either one registered action or one literal shell-free argv and declares
inputs, outputs, effects, timeout, and authority checks. An agent names rostered execution
data, bounded iterations, capability requirements, and exactly one selection mode. A human
names a governance role, instructions, completion evidence, and timeout behavior. A
composite names same-round child tasks, dependency order, and failure policy; cycles,
missing children, and cross-round children block before dispatch.

Coupled role execution and merge order is Inspector, Architect, then Engineer, preserving
red-before-repair and law-before-implementation. A role change requires a new session and
commit boundary.

Discipline is the sole authority source. Executor kind, runtime, model, effort, capability,
or routing result cannot grant path, mutation, publication, or external-action authority.

### Model resolution and execution evidence

`law/policy/model-runtime-registry.json` owns runtime and model identities, exact provider
identifiers or governed aliases, supported efforts and capabilities, eligible agent
classes, availability, and replacement metadata. `available` means roster-eligible, not
host-reachable; adapter/provider preflight remains mandatory.

Selection is one of `exact`, `preferred`, or `policy`. Exact selection never substitutes.
Preferred selection considers only the task's ordered allowlist. Policy selection requires
a named and versioned entry from `law/policy/agent-routing-policies.json` and considers
only that entry's ordered roster. No implicit latest version, provider alias, or fallback is
allowed. The first mismatch blocks before provider invocation.

The requested executor object is immutable. `task-execution-evidence.schema.json` stores
its canonical digest and separately records the resolved executor or argv, adapter/tool
versions, selection and fallback decision, prompt identity and digest, input/output
digests, usage/cost, timestamps, verdict, and evidence references. An exact mismatch or
incomplete evidence blocks completion.

Legacy task records remain historical and non-executable until an explicit mapping supplies
both round and executor fields. Runtime code must not infer them from `model_tier`, tags,
prompts, worktrees, or prior executions.

## Consequences

Suite and preset populations become machine-derived and documentation can render them
without copying mutable lists. Deterministic work can execute without an LLM. Agent
fallback is inspectable and bounded, human completion is evidenced, composite scheduling
is fail-closed, and every execution can be tied to an immutable request and candidate.

Conservative effect classification removes provider-backed and write-capable probes from
the read-only sweep. A caller seeking those observations must use explicit authority and
consent rather than receiving a misleading read projection.

## Alternatives Considered

Hard-coding populations in prose, retaining optional task executors, deriving authority
from model capability, embedding mutable model names in the task-schema enum, automatic
provider fallback, copying requested executor data into mutable evidence, inferring legacy
task fields, and treating network calls as read-only were rejected because they introduce
duplicated policy, unmanaged execution, silent substitution, or effect under-declaration.

## Affected Rules

The authoritative affected-rule list is the exact `affected_rules` frontmatter above.
