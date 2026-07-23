---
adr_id: ADR-003
title: Constitutionally narrow runtime authority enforcement
status: accepted
date: 2026-07-15
authors: ["@aarusso"]
tags: [authority, runtime, policy, sessions, article-6, round-19]
---

# ADR-003 — Constitutionally narrow runtime authority enforcement

## Status

Accepted for specification in R19 W01. This ADR freezes the contract that the
Inspector and Engineer waves must prove and implement. At W01 there is no claim
that the CLI, policy loader, sessions, issuer, or final mutation adapters exist.
The W0 authority module is a deliberately non-enforcing decision seam.

## Context

Constitution Articles 6 and 7 already require DEVAI to refuse runtime writes
that exceed an explicitly declared human role. The current CLI enforces consent
and lifecycle posture, but it does not yet declare a constitutional principal,
resolve a version-bound path policy, or re-authorize concrete resources at the
side-effect boundary. The W0 seam supplies typed subjects, plans, decisions, and
adapter interfaces, but a structurally reconstructed decision is still
indistinguishable from a value produced by a trusted issuer.

DEVAI also needs project-specific rules that the universal Article 6 table does
not enumerate: package sources, package-local tests, workflows, scripts,
changesets, governance files, and machine-owned state. Article 6 expressly
permits additive client mappings, so those rules belong in an additive DEVAI-self
policy rather than in the Constitution.

## Decision

### 1. Constitutional disposition

No constitutional amendment is required.

| Article | Existing rule | R19 interpretation |
|---|---|---|
| 6 | Runtime writes are authorized by path; client extensions are additive; host-external writes require an adapter | The immutable core policy implements the stated mapping. The DEVAI-self policy only classifies additional project surfaces and cannot replace or weaken core rules. |
| 7 | A human declares exactly one of five roles; no inference or silent elevation | A mutating human invocation supplies exactly one `--as-role` or `--authority-session`. Environment variables never grant authority. |
| 8 | Agent disciplines inherit the corresponding human authority | An external agent uses the human declaration selected by its operator. A machine principal is a trusted runtime transition, never an agent-selected role. |
| 9 | Higher authority wins | Core constitutional denies and protected classes outrank project extensions and broad source rules. Extensions cannot authorize a constitutional prohibition. |
| 10 | A discipline cannot set and actuate against its own reference | One invocation/declaration has one human role. Cross-role mutations require a new invocation/declaration boundary; either may use a direct flag or persisted authority session. Derived machine identity cannot widen the initiator. |
| 14 | Per-invariant mutation rules are enforced by runtime/host adapter | The planner and final boundary evaluate change-policy obligations in addition to resource authority. |

Git-ref, database, and remote-resource controls strengthen the same runtime
boundary. They do not change the constitutional filesystem allocation.

### 2. Human declarations and sessions

A human-principal mutation accepts exactly one declaration source:

```text
devai <mutating command> --as-role <owner|architect|inspector|engineer|auditor> --write
devai <mutating command> --authority-session <session-id> --write
devai work session start --as-role <role> --write
devai work session end --authority-session <session-id> --write
```

`--as-role` and `--authority-session` are mutually exclusive. Missing,
conflicting, malformed, expired, revoked, repository-mismatched, constitution-
mismatched, package-mismatched, or policy-stale declarations refuse before
handler dispatch. `DEVAI_ROLE`, `DEVAI_SESSION`, and analogous ambient values
are diagnostic input at most and never an authorization source. Reads need no
role. A human-principal dry run requires a role so its policy result is useful,
but remains non-mutating and readiness-ineligible.

An authority session is an explicit, expiring F5-state record. It binds role,
repository, policy, package, constitution, creator invocation, and expiry.
There is no implicit current session. Public output may expose the session ID
and declaration source, but never bearer material or a reusable capability.

### 3. Trusted machine derivation

Machine principals are derived only by a trusted runtime adapter from the
registered action, transition, verified invocation origin, and invocation ID.
They cannot be parsed from caller JSON, flags, environment variables, plan
data, or an authority-session record.

Audit provenance recognizes four closed actor/transition labels:
`harness` ↔ `harness-write`, `bootstrap` ↔ `bootstrap`, `upgrade` ↔ `upgrade`,
and `release` ↔ `release`. Mutation-authorizing action and policy contracts
admit only the first, third, and fourth pairs. Actor identity is not authority
by itself. `bootstrap` is a non-authorizing planner/orchestrator identity and
cannot be the allow subject of a mutation rule or action contract. Every
machine allow is the intersection of one
exact action ID, one operation, one typed resource selector, one matching
actor/transition pair, preserved initiation requirements, and explicit
consent. There is no "machine may write anything" rule.

A machine contract lists a non-empty set of human roles permitted to initiate
that exact transition. Runtime context binds exactly one actual `initiated_by`
role from that set and requires it to equal the invocation flag or referenced
session. Architect-only upgrade/release contracts therefore list only
`architect`; generic verb-attributed F5 state transitions may list all five
roles where the Constitution permits any declared discipline. They never use
`initiator: none` to avoid preserving a real human initiator.

Policy materialization illustrates the rule. The initiating invocation must be
explicitly Architect-authorized (direct `--as-role architect` or a valid
Architect session) and carry `--write`. Only after those facts are verified may
the runtime derive the `upgrade` machine principal that owns the F5 write. The
derived context records `initiated_by` and must match the invocation's human
principal and consent. It cannot erase, substitute for, elevate, or widen that
initiator. Missing/wrong role, missing consent, caller-declared machine actor,
forged derivation, or mismatched `initiated_by` refuses before materialization.

### 4. Policy materialization and lifecycle

`.devai/config/authority-policy.json` is a materialized product, never a
hand-authored source. It validates against `authority-policy.schema.json` and
binds:

- framework package name and version;
- Constitution version and SHA-256;
- immutable source-policy ID, version, and digest;
- every additive extension ID, version, and digest;
- the resolved rule-set digest and materialization digest;
- materializing action/invocation, derived upgrade identity, and preserved
  Architect initiator;
- enforcement and host postures.

Digests are canonical JSON SHA-256 values over the named object with its own
digest field omitted. Load recomputes every digest. Missing, stale, downgraded,
hand-divergent, or non-additive policies refuse mutation.

The loader also enforces semantic constraints JSON Schema cannot express:
`rule_id` values and `extension_id` values are independently unique; session
expiry is later than creation; revocation is not earlier than creation; shadow
expiry is later than materialization; and every parsed instant is valid.
An otherwise-valid shadow policy observed at or after its expiry is stale, not
semantically malformed. Violations refuse under the exact classifications in
section 11.

`binding` is the supported default. `shadow` is migration-only, must carry an
Architect approver, reason, and future expiry, and is loud in help, JSON, doctor,
and evidence. No invocation flag may downgrade a materialized binding policy.
Shadow evaluates the real plan but is never readiness-eligible.

### 5. Deterministic precedence

Policy resolution first classifies the exact target identity, then filters by
action, trusted subject, operation, and consent before ordering the remaining
rules by the following immutable precedence. A rule at a
lower tier cannot cancel a match at a higher tier. Two highest-tier matches that
resolve to different authority sets or effects are ambiguous and deny. An
explicit joint-authority set is one rule, not an ambiguity. No match denies.

| Tier | Class | Rule |
|---:|---|---|
| 1000 | Constitutional deny / immutable transition | Explicit immutable deny and trusted-transition-only rules win over every extension. |
| 900 | Machine-owned core | F4 inventory, F5 configuration/upgrade, and verb-attributed F5 state may be written only by their named derived transition. |
| 800 | Protected observation | Inspector test paths and test-intent configuration outrank every broad source/config rule, including when nested below `packages/**/src/**`. |
| 750 | Auditor observation | `docs/work/*/audit/**` is Auditor output and outranks the surrounding Architect working-paper rule. |
| 700 | Explicit joint reference | `docs/framework/glossary/**` resolves to the single role set `{owner, architect}`. |
| 650 | Narrow human reference | Owner product paths and enumerated Architect paths. |
| 500 | Broad plant/source | Engineer project implementation and tooling paths. |
| 0 | Default | Unknown, unclassified, invalid, or peer-conflicting targets deny. |

Within one tier, exact identity outranks a constrained glob, which outranks a
broad glob. Specificity only chooses between rules that grant the same authority
semantics; it never resolves a contradictory equal-tier result. Source and
destination of a rename are authorized independently.

### 6. Immutable core filesystem table

The built-in table is a direct executable transcription of Article 6. Adopter
extensions may add narrower project paths but may not delete, replace, lower,
or broaden these entries.

| Resource selector | Operation | Authorized subject | Tier |
|---|---|---|---:|
| `docs/framework/product/**` | create/update/delete/rename | human Owner | 650 |
| `docs/framework/glossary/**` | create/update/delete/rename | human Owner or Architect (joint) | 700 |
| `docs/start/**`, `docs/theory/**`, `docs/framework/**` excluding product, `docs/roles/**`, `docs/adopters/**`, `docs/reference/**`, `docs/meta/**`, `README.md` | create/update/delete/rename | human Architect | 650 |
| `docs/work/*/audit/**` | create/update/delete/rename | human Auditor | 750 |
| `docs/work/**` excluding the Auditor path | create/update/delete/rename | human Architect | 650 |
| `apps/**`, `libs/**`, `db/migrations/**`, `db/seeds/**`, `iac/**`, declared root build scripts | create/update/delete/rename | human Engineer | 500 |
| `**/test/**`, `**/*.test.ts`, `**/*.spec.ts`, `tests/**`, `e2e/**`, declared test-intent configuration | create/update/delete/rename | human Inspector | 800 |
| `.devai/inventory/**` | regenerate only | derived `harness`/`harness-write` transition restricted to exact inventory action IDs | 900 |
| `.devai/state/**` | append/transition through registered verb only | derived harness machine transition attributed to the executing verb | 900 |
| `.devai/**` excluding inventory/state/worktrees | upgrade/materialize only | derived upgrade machine transition with any required preserved human initiator | 900 |
| `.devai/worktrees/**` | lifecycle operations only | registered worktree transition | 900 |

### 7. DEVAI-self additive table

This is the minimum additive policy for DEVAI itself. The core table above
still wins. These entries classify real project paths; they do not amend
Article 6.

| Resource selector | Authorized subject | Tier / note |
|---|---|---|
| `packages/**/test/**`, `**/*.test.ts`, `**/*.spec.ts`, `tests/**`, E2E paths, test-intent Vitest configuration | human Inspector | 800; test-over-source is mandatory |
| `packages/**/src/**`, `.github/**`, `scripts/**`, package manifests, lockfiles, build/release implementation, ordinary root tooling config | human Engineer | 500 |
| `.changeset/**`, `BUILD-PLAN.md`, `DESIGN-DECISIONS.md`, `CHANGELOG.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, governance prose | human Architect | 650 unless a narrower core rule wins |
| `docs/framework/product/**` | human Owner | 650 |
| `docs/framework/glossary/**` | human Owner or Architect (joint) | 700 |
| `docs/work/*/audit/**` | human Auditor | 750 |
| all other current F1 documentation paths named by Article 6 | human Architect | 650 |
| `.devai/inventory/**` | derived `harness`/`harness-write`, exact inventory action IDs only | 900 |
| `.devai/state/**` | registered verb-attributed transition | 900 |
| `.devai/config/**` and constitutional upgrades | derived upgrade transition preserving required human initiator | 900 |

Machine transitions used by DEVAI itself add the following narrow rules. The
planner resolves each row into exact targets before authorization; these rows
are upper bounds, not blanket write grants.

| Exact action / transition | Permitted resources and operations | Preserved initiation and consent |
|---|---|---|
| `adopt upgrade` / `upgrade` | Only the exact upgrade plan: versioned F5/config artifacts, Constitution binding when selected, and the enumerated migration targets for the requested version transition. | Explicit human Architect declaration or valid Architect session plus `--write`; `initiated_by` must equal the invocation declaration. |
| `release version` / `release` | Only deterministic fixed-group version surfaces: the five `packages/*/package.json` files, their five package changelogs, the reviewed root release notes when declared by the release plan, consumed `.changeset/*.md` files, and the DEVAI self version pin. The version-only replay must match byte-for-byte; source/workflow edits deny. | Explicit Architect release authorization plus `--write`, bound to the exact base/candidate SHAs and target version. |
| `release tag` / `release` | Only the five expected package tag refs for the validated fixed-group version, each pointing at the validated release commit. Existing conflicting refs deny. | The same preserved release authorization plus `--write`; pushing tags additionally requires recorded publish consent. |
| `release publish` / `release` | Only the five `@devai-nyx/*` package/version endpoint IDs on the configured GitHub Packages system. No arbitrary registry, repository, URL, package, or version is selectable. | The preserved release authorization must include `--allow-publish`; a verified protected-main/post-merge origin may carry that prior consent but cannot synthesize it. |

For supervised CI release, the human authorization is captured before merge in
the exact release-control/version plan and is bound to its candidate SHA. The
post-merge trusted origin may derive the release actor only when the protected
merge, plan digest, candidate tree, version-only replay, and recorded consent
all match. A generic CI event, branch push, package script, or possession of a
registry token grants no release authority.

Bootstrap is deliberately different. The live bootstrap planner creates only
F1/F5 surfaces: Owner product README content; Architect arch, contracts, and
meta README content; the root Constitution binding; `.devai/config/**`; and
verb-attributed `.devai/state/**`. It creates no F2 or F3 plant/test surface.
Because Article 6 keeps those F1 paths human-owned and makes F5 configuration
upgrade-only, an additive policy cannot grant `bootstrap` direct write access.
The pre-1.0 cutover preserves D-129's root onboarding entry point while
replacing the current monolithic `devai init --write` apply with distinct
registered action IDs. Authority never varies by an option on one generic
apply action:

| Exact action ID | Authority boundary |
|---|---|
| `init plan` | Non-mutating; the bootstrap identity may assemble and digest an exact segmented plan but authorizes no target. |
| `init apply-owner` | Exact Owner-product batch, explicit human Owner declaration plus `--write`. |
| `init apply-architect` | Exact Architect F1 batch, explicit human Architect declaration plus `--write`. |
| `init apply-f5` | Exact Constitution/F5-config batch executed as derived `upgrade` with preserved Architect declaration plus `--write`. The name deliberately avoids implying bootstrap or generic harness authority. |
| internal `init record` | Separate exact F5 state/evidence append, executed as `harness`/`harness-write`, attributed to this registered trusted subtransition, and preserving the successful apply invocation's one actual initiator and authentic receipt. It is not a routable public CLI leaf and cannot write a planned target. |

Owner and Architect batches require distinct invocation/declaration boundaries;
each may use direct `--as-role` or a valid authority session. One `init`
invocation cannot silently span roles, and bootstrap possession of an exact
plan cannot apply any batch. Existing unrelated files and targets absent from
the corresponding batch deny. The current `devai init --write` interface is
removed pre-1.0: callers first run `devai init plan`, then invoke each applicable
apply action under its required declaration boundary. Each successful apply
invokes internal `init record` within the same invocation; callers cannot invoke
or reforge that transition, no public instruction names it as a callable leaf,
and recording is not a manual optional step. A future recovery command would
require an authentic apply receipt plus the same role/declaration, but is not
part of W01. Historical `init --execute` references remain forensic snapshots
and do not describe the current pre-cutover CLI.

### 8. Non-filesystem resources

Every mutation is either an exact whole-plan or an exact, independently
authorized bounded batch.

Planner classification is fail closed and describes what the current runtime
can prove before the first effect, not what a handler happens to write after it
starts. The bootstrap apply segments (`init apply-owner`,
`init apply-architect`, and `init apply-f5`) and `upgrade` are exact because a
trusted planner materializes their complete filesystem target set before
authorization. The internal `init record` subtransition is separately exact.
All other live mutating actions are explicitly selector-bounded until they gain
an action-specific pre-effect planner and a typed whole-plan atomic adapter.
This includes apparently small state verbs: evidence-chain and recovery writes
are part of their execution unit and may not be omitted merely to obtain an
`exact-plan` label.

The live registry enumerates both sets. A newly registered mutator that appears
in neither, or in both, fails registry construction. Each bounded action still
declares finite `max_batches`, `max_targets_per_batch`, and
`max_total_targets`; every materialized batch is homogeneous by final adapter,
registered in order, policy-resolved target by target, receipt-bound as one
complete unit, and recoverably recorded. The selector is a discovery ceiling,
not authority: the immutable/additive policy must independently allow every
exact target. Promotion from bounded to exact therefore requires moving target
discovery ahead of handler execution, not merely changing registry metadata.

| Resource | Stable identity | Required authorization |
|---|---|---|
| Filesystem | repository ID + canonical repository-relative path + operation | lexical and realpath containment; source and destination on rename; symlink/TOCTOU recheck immediately before apply |
| Git ref | repository ID + full ref + operation + optional remote ID | explicit ref class; protected integration/ref operations deny unless a narrow rule grants them |
| Database | connection ID + database ID + object ID + operation | logical IDs only; exact DDL/execute boundary; no connection URLs, passwords, or tokens |
| Remote | system ID + endpoint ID + operation ID + publication bit | semantic allowlist; remote publication also requires `--allow-publish`; no credential-bearing URL |

### 9. Action contract and staged cutover

`actions-list-output.schema.json` keeps `authority` as the existing subsystem
owner taxonomy (`sensor`, `specifier`, and peers). It is not a constitutional
principal and is never silently repurposed.

Every action has a separate record validating against
`authority-action-contract.schema.json`: explicit effect, authority subject,
consent, planner, target kinds, and final boundary. There is no default effect
or default-to-read escape. Reads explicitly declare `effect: read`, subject
`none`, and no planner/boundary. Every mutation declares a human or named
derived-machine subject plus a concrete planner and boundary. Registry
construction fails on absent or unknown metadata.

W01 adds optional version linkage to the presentation catalog so the existing
catalog remains independently valid. W02/W03 must pin that every mutating live
action has an exact contract; W06 makes that check binding. This staging avoids
turning an Architect specification commit into an unowned runtime failure.

### 10. Evidence contract and issuer authenticity

Historical `evidence.schema.json` records remain valid. New governed mutation
evidence must additionally validate against `authority-evidence.schema.json`
and link from the legacy envelope's optional authority block. The exact record
contains principal/declaration provenance, policy/constitution/package digests,
mode, target summaries, decision/reason codes, host posture, and readiness
eligibility. It contains no secret, absolute host path, nonce, bearer token, or
capability.

Bootstrap provenance is audit-only and cannot contradict its non-authorizing
contract. A bootstrap evidence record is valid only for a read/plan or for an
attempted mutation explicitly evaluated `deny` and disposed `refuse`;
it is always authority-ineligible. A binding-mode `allow`/`proceed` mutation
record naming bootstrap is invalid even if every digest is well formed.
Likewise, upgrade and release evidence must preserve an actual Architect
`initiated_by`; `none` or another role is invalid.

Evidence is audit data, never authorization. A concrete process-local issuer
maintains a non-serializable, single-use issuance record bound to invocation,
subject, policy, decision, adapter, and expiry. Final prepare/apply accepts only
issuer membership from the active issuer and consumes it once. Structural
clones, correctly rehashed reconstructions, foreign-issuer values, expired
values, and replays refuse. Public decision/evidence JSON cannot be converted
back into a capability.

### 11. Frozen internal TypeScript contracts

W02–W04 use the following exact internal contracts. These functions and their
opaque brands are runtime composition internals: they are absent from the
`@devai-nyx/core` package root and authority root, and are available to the CLI
only through the unsupported internal composition subpath frozen below.
Callers may supply only the `input` objects;
trusted registries, schema validators, clocks, binding facts, digest functions,
session readers, and the issuer-owned receipt-store identity enter through
`deps`. An expected invalid,
stale, ambiguous, unauthorized, or replayed value is returned as tagged data.
An operational dependency failure is also tagged data. Only a programmer
invariant violation, or an injected dependency violating its declared return
contract, may throw.

W04 first corrects the public W0 vocabulary so direct CLI provenance and
bounded-batch plan linkage are representable without fabricating session state
or batch authenticity. This is an exact replacement in
`packages/core/src/authority/types.ts` and
`packages/core/src/authority/principals.ts`, not a second internal principal
shape:

```ts
export type HumanPrincipal =
  | Readonly<{
      kind: 'human';
      role: HumanRole;
      declaration: Readonly<{ source: 'cli-flag'; declared_at: string }>;
    }>
  | Readonly<{
      kind: 'human';
      role: HumanRole;
      declaration: Readonly<{
        source: 'session-state';
        session_id: string;
        declared_at: string;
      }>;
    }>;

export type DeclareHumanPrincipalInput =
  | Readonly<{
      role: string;
      source: 'cli-flag';
      declared_at: string;
      session_id?: never;
    }>
  | Readonly<{
      role: string;
      source: 'session-state';
      session_id: string;
      declared_at: string;
    }>;

export type TrustedInvocationOrigin =
  | Readonly<{ kind: 'direct-cli'; invocation_id: string }>
  | Readonly<{ kind: 'interactive-session'; session_id: string }>
  | Readonly<{
      kind: 'ci-run';
      provider: string;
      repository_id: string;
      workflow_id: string;
      run_id: string;
      event: string;
    }>
  | Readonly<{
      kind: 'post-merge-hook';
      repository_id: string;
      hook_id: string;
      merged_commit: string;
    }>
  | Readonly<{
      kind: 'host-adapter';
      adapter_id: string;
      invocation_id: string;
    }>;

export interface AuthorityPolicyProvenance {
  readonly policy_id: string;
  readonly policy_version: string;
  readonly repository_id: string;
  readonly framework_package: Readonly<{
    name: '@devai-nyx/cli';
    version: string;
  }>;
  readonly constitution: Readonly<{
    version: string;
    digest_sha256: string;
  }>;
  readonly source_policy: Readonly<{
    policy_id: 'devai-core-authority';
    policy_version: string;
    digest_sha256: string;
  }>;
  readonly additive_extensions: readonly Readonly<{
    extension_id: string;
    extension_version: string;
    digest_sha256: string;
  }>[];
  readonly resolved_digest_sha256: string;
  readonly materialized_from: Readonly<{
    kind: 'project-config';
    path: '.devai/config/authority-policy.json';
  }>;
}

export interface MachineAuthorityContext {
  readonly kind: 'trusted-transition';
  readonly principal: MachinePrincipal;
  readonly initiated_by?: HumanPrincipal;
  readonly action_id: string;
  readonly consent: Readonly<{
    write: boolean;
    allow_publish: boolean;
    experimental: boolean;
  }>;
}

export interface MutationBatch {
  readonly batch_id: string;
  readonly plan_id: string;
  readonly ordinal: number;
  readonly targets: readonly ResourceTarget[];
  readonly atomicity: 'whole-batch';
}
```

`declareHumanPrincipal` retains its existing name and return type but accepts
the corrected `DeclareHumanPrincipalInput` union. `cli-flag` forbids
`session_id`; `session-state` requires it. `host-adapter` remains a trusted
invocation origin only and is not a human declaration source. A direct flag
resolves with `origin: { kind: 'direct-cli', invocation_id }`; a persisted
session resolves with `origin: { kind: 'interactive-session', session_id }`.
`HumanAuthorityContext` and `MachineAuthorityContext.initiated_by` therefore
consume the corrected public `HumanPrincipal` directly. No adapter may create
a synthetic session ID for direct CLI provenance. The W0 correction also makes
policy provenance repository/package/Constitution/source/extension complete
and makes machine context retain the exact consent it was derived from. The
`MutationBatch` replacement adds only required `plan_id`; it is a deterministic
non-capability linkage field, not a brand, planner receipt, or proof of batch
issuance.

```ts
import type {
  AuthorityDecisionSubject,
  AuthorityPolicyProvenance,
  Decision,
  HumanPrincipal,
  HumanRole,
  MachineAuthorityContext,
  ResourceTarget,
  ResourceTargetSelector,
  TrustedInvocationOrigin,
  VerifiedDecisionBinding,
} from '../types.js';

type AuthorityUsageError<C extends string> = Readonly<{
  ok: false;
  category: 'usage-error';
  code: C;
  reasons: readonly string[];
}>;

type AuthorityRefusal<C extends string> = Readonly<{
  ok: false;
  category: 'refused';
  code: C;
  reasons: readonly string[];
}>;

type AuthorityDependencyError<C extends string> = Readonly<{
  ok: false;
  category: 'dependency-error';
  code: C;
  reasons: readonly string[];
}>;

type AuthoritySuccess<T> = Readonly<{ ok: true; value: T }>;

type MutationConsent = Readonly<{
  write: boolean;
  allow_publish: boolean;
  experimental: boolean;
}>;

type HumanDeclarationProvenance<R extends HumanRole = HumanRole> =
  | Readonly<{
      role: R;
      declaration_source: 'cli-flag';
      session_id?: never;
    }>
  | Readonly<{
      role: R;
      declaration_source: 'session-state';
      session_id: string;
    }>;

type AuthorityEnforcementConfiguration =
  | Readonly<{ mode: 'binding' }>
  | Readonly<{
      mode: 'shadow';
      shadow: Readonly<{
        reason: string;
        approved_by: HumanDeclarationProvenance<'architect'>;
        expires_at: string;
      }>;
    }>;

type AuthorityHostEnforcementConfiguration =
  | Readonly<{ mode: 'cli-only' }>
  | Readonly<{
      mode: 'host-integrated';
      adapter: Readonly<{ adapter_id: string; adapter_version: string }>;
    }>;

type AuthorityRuleSubject =
  | Readonly<{ kind: 'human'; roles: readonly HumanRole[] }>
  | Readonly<{
      kind: 'derived-machine';
      actor: 'harness' | 'upgrade' | 'release';
      transition: 'harness-write' | 'upgrade' | 'release';
      initiator:
        | 'none'
        | Readonly<{ allowed_roles: readonly HumanRole[]; preserve_in_context: true }>;
    }>;

interface AuthorityRuleView {
  readonly rule_id: string;
  readonly origin: 'immutable-core' | 'additive-extension';
  readonly precedence: 500 | 650 | 700 | 750 | 800 | 900 | 1000;
  readonly action_ids: readonly string[];
  readonly selector: ResourceTargetSelector;
  readonly effect: 'allow' | 'deny';
  readonly subjects: readonly AuthorityRuleSubject[];
  readonly required_consent: Readonly<{
    write: boolean;
    allow_publish: boolean;
    experimental: boolean;
  }>;
  readonly constitutional_anchors: readonly number[];
  readonly rationale: string;
}

declare const validatedAuthorityPolicyDocument: unique symbol;
interface ValidatedAuthorityPolicyDocument {
  readonly [validatedAuthorityPolicyDocument]: true;
  readonly raw: unknown;
  readonly canonical_bytes: Uint8Array;
  readonly view: Readonly<{
    policy_id: string;
    policy_version: string;
    repository_id: string;
    framework_package: Readonly<{ name: '@devai-nyx/cli'; version: string }>;
    constitution: Readonly<{ version: string; digest_sha256: string }>;
    source_policy: Readonly<{
      policy_id: 'devai-core-authority';
      policy_version: string;
      digest_sha256: string;
    }>;
    additive_extensions: readonly Readonly<{
      extension_id: string;
      extension_version: string;
      digest_sha256: string;
    }>[];
    resolved_digest_sha256: string;
    materialized_at: string;
    materialization: Readonly<{
      action_id: 'adopt upgrade';
      invocation_id: string;
      machine_principal: Readonly<{
        kind: 'machine';
        actor: 'upgrade';
        transition: 'upgrade';
        trusted_adapter_id: string;
        context_digest_sha256: string;
      }>;
      initiated_by: Readonly<{ kind: 'human' }> &
        HumanDeclarationProvenance<'architect'>;
      consent: Readonly<{ write: true }>;
      materialization_digest_sha256: string;
    }>;
    enforcement: AuthorityEnforcementConfiguration;
    host_enforcement: AuthorityHostEnforcementConfiguration;
    rules: readonly AuthorityRuleView[];
  }>;
}

interface AuthoritySessionViewBase {
  readonly session_id: string;
  readonly repository_id: string;
  readonly role: HumanRole;
  readonly declaration_source: 'cli-flag';
  readonly created_at: string;
  readonly expires_at: string;
  readonly created_by_invocation_id: string;
  readonly policy_binding: Readonly<{
    policy_id: string;
    policy_version: string;
    resolved_digest_sha256: string;
  }>;
  readonly constitution_binding: Readonly<{ version: string; digest_sha256: string }>;
  readonly package_binding: Readonly<{ name: '@devai-nyx/cli'; version: string }>;
  readonly session_digest_sha256: string;
}

type AuthoritySessionView =
  | (AuthoritySessionViewBase &
      Readonly<{
        status: 'active' | 'expired';
        revocation?: never;
        stale_reason?: never;
      }>)
  | (AuthoritySessionViewBase &
      Readonly<{
        status: 'revoked';
        revocation: Readonly<{
          revoked_at: string;
          revoked_by_invocation_id: string;
          reason: string;
        }>;
        stale_reason?: never;
      }>)
  | (AuthoritySessionViewBase &
      Readonly<{
        status: 'stale';
        revocation?: never;
        stale_reason:
          | 'policy-changed'
          | 'constitution-changed'
          | 'package-changed'
          | 'repository-mismatch';
      }>);

declare const validatedAuthoritySessionDocument: unique symbol;
interface ValidatedAuthoritySessionDocument {
  readonly [validatedAuthoritySessionDocument]: true;
  readonly raw: unknown;
  readonly canonical_bytes: Uint8Array;
  readonly view: AuthoritySessionView;
}

interface AuthorityActionContractView {
  readonly action_id: string;
  readonly effect: 'read' | 'harness-write' | 'local-write' | 'remote-write';
  readonly subject:
    | Readonly<{ kind: 'none' }>
    | Readonly<{ kind: 'human'; allowed_roles: readonly HumanRole[] }>
    | Readonly<{
        kind: 'derived-machine';
        actor: 'harness' | 'upgrade' | 'release';
        transition: 'harness-write' | 'upgrade' | 'release';
        initiator:
          | 'none'
          | Readonly<{ allowed_roles: readonly HumanRole[]; preserve_in_context: true }>;
      }>;
  readonly consent: Readonly<{
    write: boolean;
    allow_publish: boolean;
    experimental: boolean;
  }>;
  readonly planner:
    | Readonly<{ kind: 'none' }>
    | Readonly<{
        kind: 'exact-plan';
        planner_id: string;
        target_kinds: readonly ResourceTarget['kind'][];
        atomicity: 'whole-plan';
      }>
    | Readonly<{
        kind: 'bounded-batches';
        planner_id: string;
        target_kinds: readonly ResourceTarget['kind'][];
        bounds: Readonly<{
          max_batches: number;
          max_targets_per_batch: number;
          max_total_targets: number;
        }>;
        recovery: 'preserve-and-report';
      }>;
  readonly boundary:
    | Readonly<{ kind: 'none' }>
    | Readonly<{
        kind: 'mutation-adapters';
        adapter_ids: readonly string[];
        final_reverification: true;
      }>;
  readonly readiness: Readonly<{
    requires_binding: boolean;
    independent_acceptance_required: true;
  }>;
}

declare const validatedAuthorityActionContractDocument: unique symbol;
interface ValidatedAuthorityActionContractDocument {
  readonly [validatedAuthorityActionContractDocument]: true;
  readonly raw: unknown;
  readonly canonical_bytes: Uint8Array;
  readonly view: AuthorityActionContractView;
}

declare const validatedAuthorityEvidenceDocument: unique symbol;
interface ValidatedAuthorityEvidenceDocument {
  readonly [validatedAuthorityEvidenceDocument]: true;
  readonly raw: unknown;
  readonly canonical_bytes: Uint8Array;
  readonly view: Readonly<{
    record_kind: 'audit-only-non-capability';
    id: string;
    timestamp: string;
    invocation_id: string;
    repository_id: string;
    action_id: string;
    action_effect: 'read' | 'harness-write' | 'local-write' | 'remote-write';
    dry_run: boolean;
    principal:
      | Readonly<{
          kind: 'human';
          role: HumanRole;
          declaration_source: 'cli-flag';
          session_id?: never;
        }>
      | Readonly<{
          kind: 'human';
          role: HumanRole;
          declaration_source: 'session-state';
          session_id: string;
        }>
      | Readonly<{
          kind: 'derived-machine';
          actor: 'harness' | 'bootstrap' | 'upgrade' | 'release';
          transition: 'harness-write' | 'bootstrap' | 'upgrade' | 'release';
          trusted_adapter_id: string;
          context_digest_sha256: string;
          initiated_by:
            | 'none'
            | Readonly<{
                role: HumanRole;
                declaration_source: 'cli-flag';
                session_id?: never;
              }>
            | Readonly<{
                role: HumanRole;
                declaration_source: 'session-state';
                session_id: string;
              }>;
        }>;
    policy_binding: Readonly<{
      policy_id: string;
      policy_version: string;
      package_version: string;
      constitution_version: string;
      constitution_digest_sha256: string;
      source_digest_sha256: string;
      resolved_digest_sha256: string;
      extension_digests_sha256: readonly string[];
    }>;
    enforcement_mode: 'shadow' | 'binding';
    host_enforcement: Readonly<{
      mode: 'cli-only' | 'host-integrated';
      adapter_id?: string;
      attestation: 'not-applicable' | 'verified' | 'failed';
    }>;
    targets: Readonly<{
      count: number;
      kinds: readonly ResourceTarget['kind'][];
      target_ids_digest_sha256: string;
      summary: readonly Readonly<{
        kind: ResourceTarget['kind'];
        operation: string;
        resource_id: string;
      }>[];
    }>;
    decision: Readonly<{
      decision_id: string;
      decision_digest_sha256: string;
      subject_digest_sha256: string;
      evaluation: 'allow' | 'deny' | 'not-applicable';
      disposition: 'proceed' | 'refuse';
      reason_code: string;
      reasons: readonly string[];
    }>;
    issuer_audit: Readonly<{
      issuer_id: string;
      issuer_version: string;
      issued_at: string;
      capability_material_present: false;
      replayable: false;
    }>;
    readiness: Readonly<{
      authority_eligible: boolean;
      production_ready: false;
      reason: string;
    }>;
  }>;
}

declare const loadedAuthorityPolicy: unique symbol;
interface LoadedAuthorityPolicy {
  readonly [loadedAuthorityPolicy]: true;
  readonly document: ValidatedAuthorityPolicyDocument;
  readonly provenance: AuthorityPolicyProvenance;
  readonly resolved_rule_bytes: Uint8Array;
}

declare const trustedImmutableAuthorityPolicy: unique symbol;
interface TrustedImmutableAuthorityPolicy {
  readonly [trustedImmutableAuthorityPolicy]: true;
  readonly policy_id: 'devai-core-authority';
  readonly policy_version: string;
  readonly source_document: unknown;
  readonly canonical_source_bytes: Uint8Array;
  readonly rules: readonly AuthorityRuleView[];
}

declare const trustedAdditiveAuthorityPolicy: unique symbol;
interface TrustedAdditiveAuthorityPolicy {
  readonly [trustedAdditiveAuthorityPolicy]: true;
  readonly extension_id: string;
  readonly extension_version: string;
  readonly source_document: unknown;
  readonly canonical_source_bytes: Uint8Array;
  readonly rules: readonly AuthorityRuleView[];
}

declare const trustedAuthorityActionContractRegistry: unique symbol;
interface TrustedAuthorityActionContractRegistry {
  readonly [trustedAuthorityActionContractRegistry]: true;
  readonly get: (action_id: string) =>
    | ValidatedAuthorityActionContractDocument
    | undefined;
}

interface UntrustedAuthorityDeclarationInput {
  readonly as_role?: unknown;
  readonly authority_session?: unknown;
}

declare const authorityDeclarationReceipt: unique symbol;
interface AuthorityDeclarationReceipt {
  readonly [authorityDeclarationReceipt]: true;
}

declare const authorityContextReceipt: unique symbol;
interface AuthorityContextReceipt {
  readonly [authorityContextReceipt]: true;
}

declare const trustedAuthorityRuntimeReceiptStore: unique symbol;
interface TrustedAuthorityRuntimeReceiptStore {
  readonly [trustedAuthorityRuntimeReceiptStore]: true;
}

type ResolveAuthorityDeclarationSuccess =
  | Readonly<{
      kind: 'read';
      action_id: string;
      action_effect: 'read';
      principal: null;
      declaration_receipt: null;
      context_receipt: AuthorityContextReceipt;
    }>
  | Readonly<{
      kind: 'human';
      action_id: string;
      action_effect: 'harness-write' | 'local-write' | 'remote-write';
      principal: HumanPrincipal;
      declaration_receipt: AuthorityDeclarationReceipt;
      context_receipt: AuthorityContextReceipt;
    }>
  | Readonly<{
      kind: 'machine-initiation';
      action_id: string;
      action_effect: 'harness-write' | 'local-write' | 'remote-write';
      initiated_by: HumanPrincipal;
      declaration_receipt: AuthorityDeclarationReceipt;
      context_receipt: null;
    }>;

type AuthorityDeclarationUsageCode =
  | 'AUTHORITY_DECLARATION_MISSING'
  | 'AUTHORITY_DECLARATION_CONFLICT'
  | 'AUTHORITY_DECLARATION_NOT_APPLICABLE'
  | 'AUTHORITY_DECLARATION_FIELD_INVALID'
  | 'AUTHORITY_MACHINE_DECLARATION_FORBIDDEN'
  | 'AUTHORITY_ROLE_INVALID'
  | 'AUTHORITY_SESSION_ID_INVALID';

type AuthorityDeclarationRefusalCode =
  | 'AUTHORITY_ACTION_CONTRACT_NOT_FOUND'
  | 'AUTHORITY_ACTION_CONTRACT_INVALID'
  | 'AUTHORITY_ACTION_CONSENT_MISMATCH'
  | 'AUTHORITY_HUMAN_ROLE_DENIED'
  | 'AUTHORITY_SESSION_NOT_FOUND'
  | 'AUTHORITY_SESSION_SCHEMA_INVALID'
  | 'AUTHORITY_SESSION_DIGEST_MISMATCH'
  | 'AUTHORITY_SESSION_EXPIRED'
  | 'AUTHORITY_SESSION_REVOKED'
  | 'AUTHORITY_SESSION_STALE'
  | 'AUTHORITY_SESSION_REPOSITORY_MISMATCH'
  | 'AUTHORITY_SESSION_POLICY_MISMATCH'
  | 'AUTHORITY_SESSION_CONSTITUTION_MISMATCH'
  | 'AUTHORITY_SESSION_PACKAGE_MISMATCH';

interface ResolveAuthorityDeclarationDependencies {
  readonly now: string;
  readonly repository_id: string;
  readonly policy_binding: AuthorityPolicyProvenance;
  readonly constitution_binding: Readonly<{ version: string; digest_sha256: string }>;
  readonly package_binding: Readonly<{ name: '@devai-nyx/cli'; version: string }>;
  readonly actionContracts: TrustedAuthorityActionContractRegistry;
  readonly receiptStore: TrustedAuthorityRuntimeReceiptStore;
  readonly canonicalSha256: (value: unknown) => string;
  readonly readSession: (session_id: string) =>
    | AuthoritySuccess<unknown | undefined>
    | AuthorityDependencyError<'AUTHORITY_SESSION_STORE_UNAVAILABLE'>;
  readonly validateSessionSchema: (value: unknown) =>
    | AuthoritySuccess<ValidatedAuthoritySessionDocument>
    | AuthorityRefusal<'AUTHORITY_SESSION_SCHEMA_INVALID'>
    | AuthorityDependencyError<'AUTHORITY_SESSION_VALIDATOR_UNAVAILABLE'>;
}

type ResolveAuthorityDeclarationResult =
  | AuthoritySuccess<ResolveAuthorityDeclarationSuccess>
  | AuthorityUsageError<AuthorityDeclarationUsageCode>
  | AuthorityRefusal<AuthorityDeclarationRefusalCode>
  | AuthorityDependencyError<
      'AUTHORITY_SESSION_STORE_UNAVAILABLE' | 'AUTHORITY_SESSION_VALIDATOR_UNAVAILABLE'
    >;

function resolveAuthorityDeclaration(
  input: Readonly<{
    action_id: string;
    invocation_id: string;
    dry_run: boolean;
    declaration: UntrustedAuthorityDeclarationInput;
    consent: MutationConsent;
  }>,
  deps: ResolveAuthorityDeclarationDependencies,
): ResolveAuthorityDeclarationResult;

type AuthorityPolicyLoadRefusalCode =
  | 'AUTHORITY_POLICY_MISSING'
  | 'AUTHORITY_POLICY_SCHEMA_INVALID'
  | 'AUTHORITY_POLICY_SEMANTIC_INVALID'
  | 'AUTHORITY_POLICY_DIGEST_MISMATCH'
  | 'AUTHORITY_POLICY_SOURCE_RULE_MISMATCH'
  | 'AUTHORITY_POLICY_RESOLVED_BYTES_MISMATCH'
  | 'AUTHORITY_POLICY_BINDING_MISMATCH'
  | 'AUTHORITY_POLICY_DOWNGRADE'
  | 'AUTHORITY_POLICY_STALE'
  | 'AUTHORITY_POLICY_EXTENSION_NON_ADDITIVE';

interface LoadAuthorityPolicyInput {
  readonly document: unknown;
}

interface LoadAuthorityPolicyDependencies {
  readonly now: string;
  readonly expected_repository_id: string;
  readonly expected_policy_id: string;
  readonly expected_minimum_policy_version: string;
  readonly expected_package: Readonly<{ name: '@devai-nyx/cli'; version: string }>;
  readonly expected_constitution: Readonly<{ version: string; digest_sha256: string }>;
  readonly immutableCore: TrustedImmutableAuthorityPolicy;
  readonly additiveExtensions: readonly TrustedAdditiveAuthorityPolicy[];
  readonly validatePolicySchema: (value: unknown) =>
    | AuthoritySuccess<ValidatedAuthorityPolicyDocument>
    | AuthorityRefusal<'AUTHORITY_POLICY_SCHEMA_INVALID'>
    | AuthorityDependencyError<'AUTHORITY_POLICY_VALIDATOR_UNAVAILABLE'>;
  readonly canonicalSha256: (value: unknown) => string;
  readonly canonicalBytes: (value: unknown) => Uint8Array;
  readonly sha256Bytes: (bytes: Uint8Array) => string;
}

type LoadAuthorityPolicyResult =
  | AuthoritySuccess<LoadedAuthorityPolicy>
  | AuthorityRefusal<AuthorityPolicyLoadRefusalCode>
  | AuthorityDependencyError<'AUTHORITY_POLICY_VALIDATOR_UNAVAILABLE'>;

function loadAuthorityPolicy(
  input: LoadAuthorityPolicyInput,
  deps: LoadAuthorityPolicyDependencies,
): LoadAuthorityPolicyResult;

interface DeriveMachineAuthorityContextInput {
  readonly action_id: string;
  readonly invocation_id: string;
  readonly declaration_receipt: AuthorityDeclarationReceipt;
  readonly consent: MutationConsent;
}

interface DeriveMachineAuthorityContextDependencies {
  readonly actionContracts: TrustedAuthorityActionContractRegistry;
  readonly verifiedOrigin: TrustedInvocationOrigin;
  readonly trusted_adapter_id: string;
  readonly receiptStore: TrustedAuthorityRuntimeReceiptStore;
  readonly canonicalSha256: (value: unknown) => string;
}

type MachineContextCode =
  | 'AUTHORITY_ACTION_CONTRACT_NOT_FOUND'
  | 'AUTHORITY_ACTION_NOT_MACHINE_DERIVED'
  | 'AUTHORITY_MACHINE_TRANSITION_NOT_AUTHORIZING'
  | 'AUTHORITY_MACHINE_INITIATOR_REQUIRED'
  | 'AUTHORITY_MACHINE_INITIATOR_FORBIDDEN'
  | 'AUTHORITY_MACHINE_INITIATOR_ROLE_DENIED'
  | 'AUTHORITY_MACHINE_ORIGIN_MISMATCH'
  | 'AUTHORITY_DECLARATION_RECEIPT_UNKNOWN'
  | 'AUTHORITY_DECLARATION_RECEIPT_REPLAYED'
  | 'AUTHORITY_DECLARATION_RECEIPT_BINDING_MISMATCH'
  | 'AUTHORITY_MACHINE_CONSENT_MISSING';

type DeriveMachineAuthorityContextResult =
  | AuthoritySuccess<Readonly<{
      context: MachineAuthorityContext;
      context_receipt: AuthorityContextReceipt;
    }>>
  | AuthorityRefusal<MachineContextCode>;

function deriveMachineAuthorityContext(
  input: DeriveMachineAuthorityContextInput,
  deps: DeriveMachineAuthorityContextDependencies,
): DeriveMachineAuthorityContextResult;

declare const policyMaterializationAuthorization: unique symbol;
interface PolicyMaterializationAuthorization {
  readonly [policyMaterializationAuthorization]: true;
}

type PolicyMaterializationAuthorizationCode =
  | 'AUTHORITY_MATERIALIZATION_ACTION_INVALID'
  | 'AUTHORITY_MATERIALIZATION_ARCHITECT_REQUIRED'
  | 'AUTHORITY_MATERIALIZATION_WRITE_CONSENT_REQUIRED'
  | 'AUTHORITY_MATERIALIZATION_AUTHORIZATION_UNKNOWN'
  | 'AUTHORITY_MATERIALIZATION_AUTHORIZATION_REPLAYED'
  | 'AUTHORITY_MATERIALIZATION_AUTHORIZATION_BINDING_MISMATCH';

interface AuthorizePolicyMaterializationInput {
  readonly action_id: 'adopt upgrade';
  readonly invocation_id: string;
  readonly target_operation: 'create' | 'update';
  readonly declaration: UntrustedAuthorityDeclarationInput;
  readonly consent: MutationConsent;
}

interface AuthorizePolicyMaterializationDependencies {
  readonly receiptStore: TrustedAuthorityRuntimeReceiptStore;
  readonly declaration: Omit<ResolveAuthorityDeclarationDependencies, 'receiptStore'>;
  readonly derivation: Omit<DeriveMachineAuthorityContextDependencies, 'receiptStore'>;
}

type AuthorizePolicyMaterializationResult =
  | AuthoritySuccess<PolicyMaterializationAuthorization>
  | AuthorityUsageError<AuthorityDeclarationUsageCode>
  | AuthorityRefusal<
      | AuthorityDeclarationRefusalCode
      | MachineContextCode
      | PolicyMaterializationAuthorizationCode
    >
  | AuthorityDependencyError<
      'AUTHORITY_SESSION_STORE_UNAVAILABLE' | 'AUTHORITY_SESSION_VALIDATOR_UNAVAILABLE'
    >;

function authorizePolicyMaterialization(
  input: AuthorizePolicyMaterializationInput,
  deps: AuthorizePolicyMaterializationDependencies,
): AuthorizePolicyMaterializationResult;

interface MaterializeAuthorityPolicyInput {
  readonly repository_id: string;
  readonly enforcement: AuthorityEnforcementConfiguration;
  readonly host_enforcement: AuthorityHostEnforcementConfiguration;
  readonly authorization: PolicyMaterializationAuthorization;
  readonly target_operation: 'create' | 'update';
}

interface MaterializeAuthorityPolicyDependencies {
  readonly materialized_at: string;
  readonly package_binding: Readonly<{ name: '@devai-nyx/cli'; version: string }>;
  readonly constitution_binding: Readonly<{ version: string; digest_sha256: string }>;
  readonly immutableCore: TrustedImmutableAuthorityPolicy;
  readonly additiveExtensions: readonly TrustedAdditiveAuthorityPolicy[];
  readonly receiptStore: TrustedAuthorityRuntimeReceiptStore;
  readonly validatePolicySchema: (value: unknown) =>
    | AuthoritySuccess<ValidatedAuthorityPolicyDocument>
    | AuthorityRefusal<'AUTHORITY_MATERIALIZED_POLICY_SCHEMA_INVALID'>
    | AuthorityDependencyError<'AUTHORITY_POLICY_VALIDATOR_UNAVAILABLE'>;
  readonly canonicalSha256: (value: unknown) => string;
  readonly canonicalBytes: (value: unknown) => Uint8Array;
  readonly sha256Bytes: (bytes: Uint8Array) => string;
}

type PolicyMaterializationCode =
  | 'AUTHORITY_POLICY_SOURCE_INVALID'
  | 'AUTHORITY_POLICY_EXTENSION_INVALID'
  | 'AUTHORITY_POLICY_EXTENSION_NON_ADDITIVE'
  | 'AUTHORITY_POLICY_DUPLICATE_RULE_ID'
  | 'AUTHORITY_POLICY_DUPLICATE_EXTENSION_ID'
  | 'AUTHORITY_MATERIALIZATION_BINDING_MISMATCH'
  | 'AUTHORITY_MATERIALIZED_POLICY_SCHEMA_INVALID'
  | 'AUTHORITY_MATERIALIZATION_AUTHORIZATION_UNKNOWN'
  | 'AUTHORITY_MATERIALIZATION_AUTHORIZATION_REPLAYED'
  | 'AUTHORITY_MATERIALIZATION_AUTHORIZATION_BINDING_MISMATCH'
  | 'AUTHORITY_POLICY_SHADOW_INVALID';

type MaterializeAuthorityPolicyResult =
  | AuthoritySuccess<Readonly<{
      document: ValidatedAuthorityPolicyDocument;
      artifact: Readonly<{
        kind: 'fs';
        repository_id: string;
        canonical_relative_path: '.devai/config/authority-policy.json';
        operation: 'create' | 'update';
        bytes: Uint8Array;
        digest_sha256: string;
      }>;
    }>>
  | AuthorityRefusal<PolicyMaterializationCode>
  | AuthorityDependencyError<'AUTHORITY_POLICY_VALIDATOR_UNAVAILABLE'>;

function materializeAuthorityPolicy(
  input: MaterializeAuthorityPolicyInput,
  deps: MaterializeAuthorityPolicyDependencies,
): MaterializeAuthorityPolicyResult;

type AuthorityResourceKind = ResourceTarget['kind'];

type AuthorityResourceByKind<K extends AuthorityResourceKind> = Extract<
  ResourceTarget,
  { kind: K }
>;

type AuthorityResourceOperation<K extends AuthorityResourceKind> =
  K extends 'remote'
    ? Extract<ResourceTarget, { kind: 'remote' }>['operation_id']
    : AuthorityResourceByKind<K> extends Readonly<{ operation: infer O extends string }>
      ? O
      : never;

interface AuthorityPolicyQueryBase {
  readonly action_id: string;
  readonly context_receipt: AuthorityContextReceipt;
  readonly consent: MutationConsent;
}

type AuthorityPolicyQueryFor<K extends AuthorityResourceKind> =
  AuthorityPolicyQueryBase &
    Readonly<{
      resource: AuthorityResourceByKind<K>;
      operation: AuthorityResourceOperation<K>;
    }>;

type AuthorityPolicyQuery = {
  [K in AuthorityResourceKind]: AuthorityPolicyQueryFor<K>;
}[AuthorityResourceKind];

declare const trustedPolicyAllow: unique symbol;
interface AuthorityPolicyAllowBase {
  readonly outcome: 'allow';
  readonly code: 'POLICY_ALLOW';
  readonly policy_binding_digest_sha256: string;
  readonly resource_target_id: string;
  readonly matched_rule_ids: readonly string[];
  readonly obligations: readonly string[];
  readonly query_digest_sha256: string;
  readonly [trustedPolicyAllow]: true;
}

type AuthorityPolicyAllow = {
  [K in AuthorityResourceKind]: AuthorityPolicyAllowBase &
    Readonly<{
      resource_kind: K;
      operation: AuthorityResourceOperation<K>;
    }>;
}[AuthorityResourceKind];

type AuthorityPolicyDenialCode =
  | 'AUTHORITY_QUERY_INVALID'
  | 'AUTHORITY_QUERY_OPERATION_MISMATCH'
  | 'AUTHORITY_CONTEXT_RECEIPT_UNKNOWN'
  | 'AUTHORITY_CONTEXT_RECEIPT_REPLAYED'
  | 'AUTHORITY_CONTEXT_RECEIPT_BINDING_MISMATCH'
  | 'AUTHORITY_POLICY_BINDING_MISMATCH'
  | 'AUTHORITY_ACTION_DENIED'
  | 'AUTHORITY_SUBJECT_DENIED'
  | 'AUTHORITY_OPERATION_DENIED'
  | 'AUTHORITY_CONSENT_REQUIRED'
  | 'UNCLASSIFIED_RESOURCE'
  | 'AMBIGUOUS_POLICY_MATCH'
  | 'POLICY_DENY';

declare const trustedPolicyDeny: unique symbol;
interface AuthorityPolicyDenyBase {
  readonly outcome: 'deny';
  readonly category: 'refused';
  readonly code: AuthorityPolicyDenialCode;
  readonly policy_binding_digest_sha256: string;
  readonly resource_target_id: string;
  readonly matched_rule_ids: readonly string[];
  readonly reasons: readonly string[];
  readonly obligations: readonly string[];
  readonly query_digest_sha256: string;
  readonly [trustedPolicyDeny]: true;
}

type AuthorityPolicyDeny = {
  [K in AuthorityResourceKind]: AuthorityPolicyDenyBase &
    Readonly<{
      resource_kind: K;
      operation: AuthorityResourceOperation<K>;
    }>;
}[AuthorityResourceKind];

type ResolveAuthorityPolicyResult = AuthorityPolicyAllow | AuthorityPolicyDeny;
type AuthorityPolicyAllowSetInput = readonly AuthorityPolicyAllow[];

function resolveAuthorityPolicy(
  policy: LoadedAuthorityPolicy,
  query: AuthorityPolicyQuery,
  deps: Readonly<{
    receiptStore: TrustedAuthorityRuntimeReceiptStore;
    canonicalSha256: (value: unknown) => string;
  }>,
): ResolveAuthorityPolicyResult;

declare const authorityDecisionReceipt: unique symbol;
interface AuthorityDecisionReceipt {
  readonly [authorityDecisionReceipt]: true;
}

type AllowDecisionIssueResult =
  | Readonly<{
      issued: true;
      outcome: 'allow';
      decision: Decision;
      receipt: AuthorityDecisionReceipt;
    }>
  | AuthorityRefusal<AllowDecisionIssueCode>;

type AllowDecisionIssueCode =
  | 'AUTHORITY_DECISION_INPUT_INVALID'
  | 'AUTHORITY_DECISION_ISSUER_CLOSED'
  | 'AUTHORITY_CONTEXT_RECEIPT_UNKNOWN'
  | 'AUTHORITY_CONTEXT_RECEIPT_REPLAYED'
  | 'AUTHORITY_CONTEXT_RECEIPT_BINDING_MISMATCH'
  | 'AUTHORITY_DECISION_SUBJECT_NOT_EXACT'
  | 'AUTHORITY_DECISION_RESOLUTION_MISSING'
  | 'AUTHORITY_DECISION_RESOLUTION_EXTRA'
  | 'AUTHORITY_DECISION_RESOLUTION_DUPLICATE'
  | 'AUTHORITY_DECISION_RESOLUTION_FOREIGN_POLICY'
  | 'AUTHORITY_DECISION_RESOLUTION_QUERY_MISMATCH';

type DenialDecisionIssueCode =
  | 'AUTHORITY_DECISION_INPUT_INVALID'
  | 'AUTHORITY_DECISION_DENIAL_UNKNOWN'
  | 'AUTHORITY_DECISION_DENIAL_BINDING_MISMATCH'
  | 'AUTHORITY_DECISION_ISSUER_CLOSED'
  | 'AUTHORITY_CONTEXT_RECEIPT_UNKNOWN'
  | 'AUTHORITY_CONTEXT_RECEIPT_REPLAYED'
  | 'AUTHORITY_CONTEXT_RECEIPT_BINDING_MISMATCH';

type DenialDecisionIssueResult =
  | Readonly<{ issued: true; outcome: 'deny'; decision: Decision }>
  | AuthorityRefusal<DenialDecisionIssueCode>;

type DecisionConsumeCode =
  | 'AUTHORITY_DECISION_ISSUER_CLOSED'
  | 'AUTHORITY_DECISION_RECEIPT_UNKNOWN'
  | 'AUTHORITY_DECISION_RECEIPT_EXPIRED'
  | 'AUTHORITY_DECISION_RECEIPT_REPLAYED'
  | 'AUTHORITY_DECISION_RECEIPT_FOREIGN_ISSUER'
  | 'AUTHORITY_DECISION_RECEIPT_BINDING_MISMATCH';

type DecisionConsumeResult =
  | AuthoritySuccess<VerifiedDecisionBinding>
  | AuthorityRefusal<DecisionConsumeCode>;

interface AuthorityDecisionIssuer extends TrustedAuthorityRuntimeReceiptStore {
  readonly issuer_id: string;
  readonly issuer_version: string;
  issueAllow(input: Readonly<{
    resolutions: AuthorityPolicyAllowSetInput;
    subject: AuthorityDecisionSubject;
    context_receipt: AuthorityContextReceipt;
    invocation_id: string;
    boundary_adapter_id: string;
  }>): AllowDecisionIssueResult;
  issueDenial(input: Readonly<{
    resolution: AuthorityPolicyDeny;
    subject: AuthorityDecisionSubject;
    context_receipt: AuthorityContextReceipt;
    invocation_id: string;
  }>): DenialDecisionIssueResult;
  consume(input: Readonly<{
    receipt: AuthorityDecisionReceipt;
    subject: AuthorityDecisionSubject;
    invocation_id: string;
    adapter_id: string;
  }>): DecisionConsumeResult;
  dispose():
    | AuthoritySuccess<Readonly<{ disposed: true }>>
    | AuthorityRefusal<'AUTHORITY_DECISION_ISSUER_CLOSED'>;
}

interface CreateAuthorityDecisionIssuerDependencies {
  readonly issuer_id: string;
  readonly issuer_version: string;
  readonly invocation_id: string;
  readonly canonicalSha256: (value: unknown) => string;
  readonly randomId: () => string;
  readonly now: () => string;
  /** Integer milliseconds in the closed interval 1..30000. */
  readonly receipt_ttl_ms: number;
}

function createAuthorityDecisionIssuer(
  deps: CreateAuthorityDecisionIssuerDependencies,
): AuthorityDecisionIssuer;

type AuthorityEvidenceCode =
  | 'AUTHORITY_EVIDENCE_SCHEMA_INVALID'
  | 'AUTHORITY_EVIDENCE_SEMANTIC_INVALID'
  | 'AUTHORITY_EVIDENCE_PROVENANCE_INVALID'
  | 'AUTHORITY_EVIDENCE_BOOTSTRAP_INVALID'
  | 'AUTHORITY_EVIDENCE_INITIATOR_INVALID'
  | 'AUTHORITY_EVIDENCE_TIMESTAMP_INVALID'
  | 'AUTHORITY_EVIDENCE_BINDING_MISMATCH'
  | 'AUTHORITY_EVIDENCE_ISSUER_INVALID'
  | 'AUTHORITY_EVIDENCE_READINESS_INVALID';

interface CurrentAuthorityEvidenceBindings {
  readonly now: string;
  readonly repository_id: string;
  readonly policy: AuthorityPolicyProvenance;
  readonly package: Readonly<{ name: '@devai-nyx/cli'; version: string }>;
  readonly constitution: Readonly<{ version: string; digest_sha256: string }>;
  readonly issuer: Readonly<{ issuer_id: string; issuer_version: string }>;
  readonly actionContracts: TrustedAuthorityActionContractRegistry;
}

type ValidateAuthorityEvidenceResult =
  | AuthoritySuccess<Readonly<{
      evidence: ValidatedAuthorityEvidenceDocument;
      audit_only: true;
    }>>
  | AuthorityRefusal<AuthorityEvidenceCode>
  | AuthorityDependencyError<'AUTHORITY_EVIDENCE_VALIDATOR_UNAVAILABLE'>;

function validateAuthorityEvidence(
  input: unknown,
  deps: Readonly<{
    current: CurrentAuthorityEvidenceBindings;
    canonicalSha256: (value: unknown) => string;
    validateSchema: (value: unknown) =>
      | AuthoritySuccess<ValidatedAuthorityEvidenceDocument>
      | AuthorityRefusal<'AUTHORITY_EVIDENCE_SCHEMA_INVALID'>
      | AuthorityDependencyError<'AUTHORITY_EVIDENCE_VALIDATOR_UNAVAILABLE'>;
  }>,
): ValidateAuthorityEvidenceResult;
```

`resolveAuthorityDeclaration` first obtains the exact validated action contract
for `action_id`; caller-provided effect or subject metadata is never accepted.
The untrusted declaration object permits exactly `as_role` and
`authority_session`. Presence of any machine-selection key—`principal`,
`principal_kind`, `actor`, `machine_actor`, `transition`, `machine_transition`,
`trusted_adapter_id`, or `initiated_by`—returns
`AUTHORITY_MACHINE_DECLARATION_FORBIDDEN`; any other own enumerable string key
returns `AUTHORITY_DECLARATION_FIELD_INVALID`. Forbidden-machine detection
precedes the generic unknown-field code, and neither class is silently removed.
A read contract succeeds with `principal: null` and a runtime-issued context
receipt when the declaration object is empty. Any role/session declaration on a
read is `AUTHORITY_DECLARATION_NOT_APPLICABLE`. Every mutation, including a
mutation invoked in dry-run mode, requires the declaration prescribed by the
validated contract. Dry-run changes the boundary disposition, not the action's
effect or authority requirement. A syntactically valid human role absent from
the action contract's exact `allowed_roles` returns
`AUTHORITY_HUMAN_ROLE_DENIED`, never `AUTHORITY_ACTION_CONSENT_MISMATCH`.
Human mutation resolution returns both a
human declaration receipt and its human context receipt. A machine action
returns only the required initiating-human declaration receipt; only
`deriveMachineAuthorityContext` may turn it into the derived-machine context
receipt.

After session AJV success and before status or current-binding checks,
declaration resolution recomputes
`canonicalSha256(validatedSession.raw with session_digest_sha256 omitted)` and
requires exact lowercase-hex equality with `view.session_digest_sha256`.
Mismatch is `AUTHORITY_SESSION_DIGEST_MISMATCH`; the schema validator's brand
does not confer digest trust. The injected `canonicalSha256` implementation is
the same canonical JSON digest implementation used by policy bindings.

`createAuthorityDecisionIssuer` is the sole constructor and owner of the
process-local receipt store. The returned issuer also carries the opaque
`TrustedAuthorityRuntimeReceiptStore` brand, so composition creates it first and
injects that exact issuer identity as `receiptStore` into declaration,
derivation, materialization and resolution dependencies. The brand exposes no
store read/write method; runtime modules use only private, non-aggregator
helpers keyed by the issuer identity. All manipulation remains module-private, and a
structural or cast value has no private membership. This is passive dependency
injection through one of the eight frozen APIs, not a ninth value API.
The CLI constructs exactly one issuer/store per `invocation_id`, after the
invocation ID is fixed and before any declaration/context receipt is issued.
Every issuer method's `invocation_id` must equal the constructor binding. The
CLI must call `dispose()` in `finally` for every exit path, including read-only
success/refusal and exceptions, so unused read contexts as well as mutation
contexts and decision receipts close. An issuer/store is never cached or reused
across CLI invocations.

Declaration and context receipts are deep-frozen identity objects registered
in private issuer-owned `WeakMap`s. Their records bind action, effect,
invocation, dry-run posture, repository, complete policy provenance, package,
Constitution, consent, principal and trusted origin as applicable. No public
method accepts a plain `HumanPrincipal`, `AuthorityContext`, or caller-created
receipt in place of this chain. Machine derivation atomically consumes its
declaration receipt, validates every binding and preserves the exact consent in
`MachineAuthorityContext`, then issues one context receipt. Unknown identities,
clones, replays and mismatches return the corresponding stable receipt refusal.
`AUTHORITY_MACHINE_INITIATOR_MISMATCH` is deliberately absent: action-contract
or receipt-record drift is `AUTHORITY_DECLARATION_RECEIPT_BINDING_MISMATCH`; a
current contract that rejects the preserved role is
`AUTHORITY_MACHINE_INITIATOR_ROLE_DENIED`; and direct/session origin mismatch is
`AUTHORITY_MACHINE_ORIGIN_MISMATCH`. Each remaining machine code has a concrete
trigger.
Read and human context receipts remain active for the exact target-resolution
set and are atomically closed by decision issuance, denial issuance, or issuer
disposal; they cannot cross invocation, action, repository, policy or consent
bindings.

`loadAuthorityPolicy` validates an already-read untrusted document with the
canonical AJV validator, then recomputes provenance rather than trusting
document digests. For each injected immutable-core or additive source it
canonicalizes `source_document`, requires byte equality with
`canonical_source_bytes`, hashes those exact bytes, and verifies the source's
declared identity. It deterministically merges the trusted rule sets while
enforcing additive-only semantics, canonicalizes the resolved rule array into
`resolved_rule_bytes`, and requires byte equality with the validated
document's canonicalized `rules`. The recomputed source, ordered extension and
resolved digests, repository, CLI package and Constitution bindings must equal
the validated document. Success returns the complete recomputed
`AuthorityPolicyProvenance`; no expected digest supplied by the untrusted
document or caller is authoritative.

Load classification is frozen. `input.document === undefined` returns
`AUTHORITY_POLICY_MISSING` without invoking AJV. `null`, arrays, primitives,
missing/extra properties, and other wrong structural shapes return
`AUTHORITY_POLICY_SCHEMA_INVALID`. Once the value has the object/field shape
needed to inspect its semantic scalars, an invalid policy, package, immutable
source, or additive-extension version; an invalid `materialized_at` or shadow
`expires_at`; a `materialized_at` later than `deps.now`; or a shadow expiry not
strictly later than `materialized_at` returns
`AUTHORITY_POLICY_SEMANTIC_INVALID`. Those semantic classifications apply even
when the same malformed scalar would also fail a schema pattern or format.
Remaining AJV failure is `AUTHORITY_POLICY_SCHEMA_INVALID`.

After structure and semantics, multi-defect load precedence is exact:

1. trusted source identity/rule/canonical-byte mismatch:
   `AUTHORITY_POLICY_SOURCE_RULE_MISMATCH`;
2. a weakening, replacement or outranking extension:
   `AUTHORITY_POLICY_EXTENSION_NON_ADDITIVE`;
3. recomputed merged-rule bytes differing from document rules:
   `AUTHORITY_POLICY_RESOLVED_BYTES_MISMATCH`;
4. recomputed immutable-source, ordered-extension, or resolved digest differing
   from its declared digest: `AUTHORITY_POLICY_DIGEST_MISMATCH`;
5. repository, policy ID, CLI package, Constitution, or other current binding
   mismatch: `AUTHORITY_POLICY_BINDING_MISMATCH`;
6. a strictly valid loaded `policy_version` below the strictly valid
   `expected_minimum_policy_version`: `AUTHORITY_POLICY_DOWNGRADE`;
7. an otherwise-valid shadow policy with `shadow.expires_at <= deps.now`:
   `AUTHORITY_POLICY_STALE`.

`AUTHORITY_POLICY_STALE` has no age heuristic and never applies to binding
policies. A valid old `materialized_at` alone is not stale. An invalid/future
materialization instant or invalid expiry chronology remains semantic-invalid;
binding, source and version failures retain the earlier specific code instead
of being relabeled stale.

All version parsing/comparison uses a local dependency-free SemVer 2.0.0
implementation. It requires three dot-separated numeric core identifiers with
no leading zero except `0`; optional prerelease identifiers are nonempty ASCII
alphanumeric/hyphen components and numeric prerelease identifiers have no
leading zero; optional build identifiers obey the same nonempty character
grammar and are ignored for precedence. Core numeric identifiers compare as
arbitrary-precision decimal strings. A release is greater than its prerelease.
Prerelease components compare left-to-right: numeric numerically, numeric lower
than nonnumeric, and nonnumeric by ASCII lexical order; after equal components,
the shorter list is lower. No locale, floating-point conversion, range syntax,
coercion, leading `v`, whitespace trimming, or new SemVer dependency is allowed.
An invalid version in a loaded or trusted source document is semantic-invalid;
an invalid trusted `expected_minimum_policy_version` is an injected dependency
contract violation and may throw. The W01 schema remains an outer envelope, so
a SemVer-valid form it independently forbids still returns schema-invalid.

`authorizePolicyMaterialization` accepts only the validated `adopt upgrade`
action chain, an Architect human initiator, exact write consent and a trusted
upgrade origin. It returns a deep-frozen identity authorization registered in
the receipt store with action, invocation, repository, target path and
operation, principal/declaration origin, context receipt, consent, package,
Constitution, immutable-source and ordered-extension bindings. The handle has
no public data fields. `materializeAuthorityPolicy` atomically consumes it
before construction, refuses unknown, replayed or binding-mismatched handles,
and never permits a retry with the same handle.

`materializeAuthorityPolicy` is deterministic for fixed `input`/`deps` and
performs no filesystem write. It derives rules and provenance only from the
trusted immutable/additive source documents and current repository/package/
Constitution bindings, constructs the raw document, and runs the canonical AJV
validator. Only the validator may create the branded
`ValidatedAuthorityPolicyDocument`. Success returns that branded document plus
the exact repository-bound create/update artifact at
`.devai/config/authority-policy.json`; artifact bytes are the document's exact
canonical UTF-8 bytes and the digest is over those bytes. Schema failure,
validator dependency failure and authorization lifecycle failure remain
distinct tagged results.

Materialization checks one fixed precedence and stops at the first failure:

1. authorization identity absent from every issuer/store registry:
   `AUTHORITY_MATERIALIZATION_AUTHORIZATION_UNKNOWN`;
2. known authorization already consumed:
   `AUTHORITY_MATERIALIZATION_AUTHORIZATION_REPLAYED`;
3. known live authorization whose private record is corrupt, belongs to a
   different issuer/store, or fails its stored action/invocation/context/
   principal/consent/package/Constitution/source/extension binding:
   `AUTHORITY_MATERIALIZATION_AUTHORIZATION_BINDING_MISMATCH`;
4. valid authorization whose stored repository or target operation differs
   from caller `input.repository_id` or `input.target_operation`:
   `AUTHORITY_MATERIALIZATION_BINDING_MISMATCH`;
5. source invalid, extension invalid, duplicate extension ID, duplicate rule
   ID, non-additive extension, invalid shadow semantics, then constructed AJV
   failure, using their corresponding `PolicyMaterializationCode` in that
   exact order.

The authorization is atomically marked consumed when its live private record
is claimed, before step 4 or later construction. Thus a caller binding or
source/schema failure cannot reuse the same handle; unknown and cross-store
values never consume any valid handle. Validator unavailability is returned as
the dependency error only when execution reaches the AJV step.

`resolveAuthorityPolicy` evaluates exactly one correlated
action/context-receipt/operation/resource/consent query; a remote target has
only `operation_id`, while the other target kinds use their own `operation`
member. Plans and batches call it once per exact target and never submit a
selector as an apply authorization. The resolver first verifies private
context-receipt membership and all query bindings, then projects the trusted
subject context from the receipt store. Both allow and deny results bind
`policy_binding_digest_sha256 = canonicalSha256(policy.provenance)`, exact
resource kind, target ID and operation, and
`query_digest_sha256 = canonicalSha256({ policy_binding_digest_sha256,
action_id, subject, operation, resource, consent })` where `subject` is that
trusted projection. The resolver deep-freezes and separately records every
allow and deny object identity plus policy/query metadata in private
`WeakMap`s. Private non-aggregator inspection helpers in
`policy-resolver.ts` are not additional runtime APIs. Structural or JSON-cloned
outcomes are never trusted, even when all public fields match.

Selector matching is platform-independent. Filesystem candidates are nonempty
canonical POSIX repository-relative paths: `/` is the only separator;
`posix.normalize(value) === value`; and leading `/`, any backslash, NUL, empty,
`.` or `..` segment, repeated slash, and trailing slash are invalid. Filesystem
glob patterns follow the same relative/separator and segment restrictions
without normalizing away glob tokens. Git refs and DB logical IDs are matched
as complete strings and likewise reject a leading slash, backslash or NUL.
Matching is case-sensitive and includes dotfiles/dot-segments other than the
forbidden literal `.`/`..` segments.

Filesystem `canonical_relative_path_glob`, Git `ref_glob`, and each DB
`database_id_glob`/`object_id_glob` use `minimatch` 9 on the entire string with
exactly these options:

```text
{
  dot: true,
  nocase: false,
  nonegate: true,
  nocomment: true,
  noext: true,
  nobrace: true,
  noglobstar: false,
  matchBase: false,
  windowsPathsNoEscape: false,
  platform: "linux"
}
```

There is no negation, comment, extglob or brace interpretation. FS/Git/DB
operations match by exact membership in the selector operation list, and
repository/connection/database constraints match their exact fields before
glob evaluation. Remote matching uses no minimatch: `system_id` is exact,
`endpoint_id` and `operation_id` use exact case-sensitive array membership, and
`publication` equals the selector boolean.

An FS `rename` query is well formed only when
`rename_from_canonical_relative_path` is present, canonical, and distinct from
the canonical destination. A non-rename query containing that field is
`AUTHORITY_QUERY_INVALID`. Source and destination are classified and matched
independently under the same exact action, `rename` operation, subject and
consent; allow requires both to allow. The one query digest covers the full
resource including both paths, and `matched_rule_ids` is the stable sorted union
of both sides. When source and destination fail differently, the resolver order
below chooses the earlier code; a same-code tie records source before
destination.

Resolver validation/evaluation has one total order. For any single- or
multi-defect call, return the first applicable code and do not continue to a
later stage:

1. receipt identity absent from every issuer/store registry:
   `AUTHORITY_CONTEXT_RECEIPT_UNKNOWN`;
2. known receipt already closed/consumed: `AUTHORITY_CONTEXT_RECEIPT_REPLAYED`;
3. absent/extra/wrong-kind query fields, invalid target/selector syntax,
   unsupported operation-member shape (including remote `operation` or
   non-remote `operation_id`), or malformed rename:
   `AUTHORITY_QUERY_INVALID`;
4. well-formed correlated query `operation` differing from the resource's
   `operation`, or from remote `resource.operation_id`:
   `AUTHORITY_QUERY_OPERATION_MISMATCH`;
5. live receipt whose action, invocation, repository, effect, consent or other
   non-policy query binding differs: `AUTHORITY_CONTEXT_RECEIPT_BINDING_MISMATCH`;
6. loaded policy/provenance differing from the receipt's policy binding:
   `AUTHORITY_POLICY_BINDING_MISMATCH`;
7. no selector classifies the exact resource identity (or either rename side),
   ignoring action/subject/operation/consent: `UNCLASSIFIED_RESOURCE`;
8. classified rules exist but none names the exact action:
   `AUTHORITY_ACTION_DENIED`;
9. action rules exist but none admits the trusted subject:
   `AUTHORITY_SUBJECT_DENIED`;
10. subject rules exist but none admits the exact resource operation:
    `AUTHORITY_OPERATION_DENIED`;
11. otherwise-applicable rules require a missing consent bit:
    `AUTHORITY_CONSENT_REQUIRED`;
12. the highest-tier/specificity candidates conflict in effect or authority
    set: `AMBIGUOUS_POLICY_MATCH`;
13. the resolved highest candidate is explicit deny: `POLICY_DENY`;
14. otherwise return the privately tracked `POLICY_ALLOW` result.

An operation string not granted by a rule is therefore
`AUTHORITY_OPERATION_DENIED`; `AUTHORITY_QUERY_OPERATION_MISMATCH` is reserved
for disagreement inside an otherwise well-formed query/resource pair. Receipt
binding mismatch does not absorb loaded-policy mismatch, and stale/load errors
never enter resolver precedence because only `LoadedAuthorityPolicy` is
accepted.

For an interactive machine derivation, a `cli-flag` initiator requires the
same invocation's `direct-cli` origin, while a `session-state` initiator
requires an `interactive-session` origin carrying the same session ID.
Mismatch is `AUTHORITY_MACHINE_ORIGIN_MISMATCH`; caller input cannot choose the
origin. CI/post-merge origins remain available only where the trusted action
contract and its separate authorization artifact permit them.

The validator dependencies are the canonical AJV validators for the four W01
schemas. They alone create the local `Validated*Document` brands after schema
success, retain raw `unknown` plus canonical bytes, and expose only the exact
compiled runtime view. The core runtime does not import
`packages/schemas/generated/**`, and W04 does not add or widen a schemas package
export. Issuer construction throws on a non-integer or out-of-range receipt TTL
because that is a trusted dependency contract violation; expected authority
outcomes never throw.

The issuer/store has no method accepting a caller-supplied `Decision` for blessing or
verification. `issueAllow` alone creates a receipt, binds its intended final
`boundary_adapter_id`, and computes issuance/expiry from the issuer-owned clock
and bounded TTL; caller time cannot extend it. `issueDenial` requires a
privately tracked deny identity, returns an audit decision with no receipt and
can never produce a `VerifiedDecisionBinding`. It closes the bound context just
as allow issuance does. Unknown/cloned denies and deny/context mismatches return
the frozen denial-issue codes.

Issuer subject mapping is exact. An `exact-plan` subject with any `batch`, and
a `bounded-batches` subject without one structurally exact plan-linked batch,
return `AUTHORITY_DECISION_SUBJECT_NOT_EXACT`. For bounded plans the issuer
requires `batch.plan_id === plan.plan_id`, a nonempty batch ID, a nonnegative
safe-integer ordinal, `atomicity: 'whole-batch'`, a nonempty target list at or
below `max_targets_per_batch`, unique target IDs, and every target matching at
least one plan selector under the frozen matcher. Missing batch, another-plan
batch, target outside all selectors, duplicate/extra target, or any malformed
batch field uses the same subject-not-exact code. `AUTHORITY_DECISION_INPUT_INVALID`
is reserved for malformed non-subject fields and structural invariants such as
an invalid invocation/adapter identifier, non-array resolution input, or an
unrecognized structural allow object; it never substitutes for a well-shaped
but non-exact subject.

`issueAllow` accepts the complete allow-resolution set, never one representative
allow. It derives the expected targets and queries from trusted subject data:
an `exact-plan` requires no batch and uses every `plan.targets` entry; a
`bounded-batches` subject requires one exact `batch` and uses every
`batch.targets` entry. It recomputes each expected query from the subject's
envelope action/consent, the context bound to the supplied receipt, each exact
target operation/resource and the subject policy binding. It requires exactly
one privately tracked allow with the same policy/query bindings for every
expected target, with no missing, extra, duplicate or foreign-policy result.
Any mismatch creates neither decision receipt nor binding. Thus one target
allow cannot authorize a multi-target plan, and a selector cannot authorize a
bounded apply. Set-refusal precedence is deterministic: closed issuer; invalid
or mismatched context receipt; non-exact subject; unrecognized allow identity;
duplicate target ID or query digest; foreign policy; extra target; same-target
query mismatch; then missing target.

These issuer checks establish policy-set exactness only. `MutationBatch.plan_id`
is neither opaque nor authentic, and the issuer does not claim that a batch was
issued by the trusted planner, is next in execution order, or remains within
cumulative `max_batches`/`max_total_targets`. W05 owns a private planner/final-
adapter batch registry that binds plan ID/digest, batch ID, ordinal, exact target
digest, bounds and invocation; it alone issues batch identity and records
cumulative execution state, replay, partial-effect evidence and recovery.
Final prepare/apply must re-verify registry membership, next-state/cumulative
bounds, decision subject/receipt and recovery state immediately before effect.
A structurally fabricated in-plan batch may satisfy issuer policy exactness, but
without planner-registry membership the final adapter refuses and performs no
effect. An issuer decision or receipt alone is insufficient.

`consume` re-verifies the adapter, invocation, subject, context digest and all
other stored bindings, then atomically burns the process-local decision receipt.
JSON round trips, structural clones, foreign issuers and second use return
tagged refusal data. First `dispose()` atomically closes the issuer, invalidates
all outstanding decision receipts and active contexts owned by it, and returns
success. Every later issue, consume or dispose returns
`AUTHORITY_DECISION_ISSUER_CLOSED`.

`validateAuthorityEvidence` uses one total classifier. Base object/type/
required/additional-property/enum/pattern failures are
`AUTHORITY_EVIDENCE_SCHEMA_INVALID`; the runtime recognizes the specialized
cross-field cases below before mapping a full-schema `allOf` failure to that
generic code. It then stops on the first applicable condition:

1. target `count !== summary.length`, `kinds` differs from the ASCII-sorted
   distinct summary kinds,
   `target_ids_digest_sha256 !== canonicalSha256(ASCII-sorted resource_id
   array)`, or decision pairing is incoherent (`allow/proceed`, `deny/refuse`,
   and `not-applicable/proceed` for reads are the only positive pairs):
   `AUTHORITY_EVIDENCE_SEMANTIC_INVALID`;
2. invalid `timestamp`/`issued_at`, either later than `current.now`, or
   `issued_at > timestamp`: `AUTHORITY_EVIDENCE_TIMESTAMP_INVALID`;
3. repository or complete policy/package/Constitution value differs from
   `current`: `AUTHORITY_EVIDENCE_BINDING_MISMATCH`;
4. issuer ID or version differs from `current.issuer`:
   `AUTHORITY_EVIDENCE_ISSUER_INVALID`;
5. action contract absent, action effect differing from the validated contract,
   a human mutation role outside its contract subject, derived actor/transition
   differing from its contract subject, or any non-bootstrap read evidence
   carrying the schema-required human/machine principal despite the read
   contract's subject `none`:
   `AUTHORITY_EVIDENCE_PROVENANCE_INVALID`;
6. bootstrap evidence other than a read `not-applicable/proceed` record or a
   mutation `deny/refuse` record, or any bootstrap record marked
   authority-eligible: `AUTHORITY_EVIDENCE_BOOTSTRAP_INVALID`;
7. a derived contract with initiator `none` carrying an initiator, a contract
   requiring an initiator carrying `none`, or a preserved initiator role outside
   the contract's exact allowed roles: `AUTHORITY_EVIDENCE_INITIATOR_INVALID`;
8. `authority_eligible: true` unless all are true—binding mode, non-read,
   non-dry-run, `allow/proceed`, non-bootstrap, action contract
   `requires_binding`, and either CLI-only host posture or verified
   host-integrated attestation: `AUTHORITY_EVIDENCE_READINESS_INVALID`.

The current clock string and current action-contract registry are trusted
dependency contracts; an invalid `current.now` or branded registry violating
its return contract may throw. Each semantic refusal above is reachable and is
not collapsed into provenance or readiness. Success returns audit-only data and
no receipt, binding, principal, context, grant or capability. No authorization
function accepts its result.

Ordinary current read invocations emit no `authority-evidence` record: live read
declaration has `principal: null`, while the frozen W01 evidence schema has no
principal-none variant. The sole accepted read evidence is the explicit
historical/audit bootstrap exception from section 10, with
`not-applicable/proceed` and `authority_eligible: false`; step 5 exempts only
that record shape so step 6 can validate it. Tests must not invent a human or
machine authority principal for a live read.

Exact module ownership is frozen as follows; `runtime-internal` means absent
from both `packages/core/src/authority/index.ts` and
`packages/core/src/index.ts`, with package access only through the listed
internal aggregator.

| Module | Sole ownership | Export posture |
|---|---|---|
| `packages/core/src/authority/types.ts` | Corrected discriminated `HumanPrincipal`, direct-CLI-capable `TrustedInvocationOrigin`, complete provenance/context, and plan-linked `MutationBatch` W0 vocabulary | existing W0 public authority export |
| `packages/core/src/authority/principals.ts` | Corrected `DeclareHumanPrincipalInput` and `declareHumanPrincipal` validation | existing W0 public authority export |
| `packages/core/src/authority/runtime/contracts.ts` | All local `Validated*Document` views, result categories/codes, trusted dependency interfaces, and opaque brands | runtime-internal |
| `packages/core/src/authority/runtime/declaration.ts` | `resolveAuthorityDeclaration` | runtime-internal |
| `packages/core/src/authority/runtime/machine-context.ts` | `deriveMachineAuthorityContext` | runtime-internal |
| `packages/core/src/authority/runtime/policy-loader.ts` | `loadAuthorityPolicy` | runtime-internal |
| `packages/core/src/authority/runtime/policy-materializer.ts` | `authorizePolicyMaterialization`, `materializeAuthorityPolicy` | runtime-internal |
| `packages/core/src/authority/runtime/policy-resolver.ts` | `resolveAuthorityPolicy` and creation/tracking of opaque allow and deny brands | runtime-internal |
| `packages/core/src/authority/runtime/decision-issuer.ts` | `createAuthorityDecisionIssuer`, sole process-local receipt-store construction/ownership, clock/TTL, receipt consumption and disposal | runtime-internal |
| `packages/core/src/authority/runtime/evidence-validator.ts` | `validateAuthorityEvidence` | runtime-internal |
| `packages/core/src/authority/runtime/index.ts` | Sole aggregator for the preceding modules; adds no ninth API | exported only as `@devai-nyx/core/internal/authority-runtime` |

W04 adds the exact `packages/core/package.json` export
`./internal/authority-runtime` with `types`, `development`, and `default`
targets aligned to that aggregator. The existing W0 root/authority exports
remain unchanged; no parallel public runtime facade is added. The subpath is
unsupported for adopters and exists solely for trusted package composition;
W05 CLI integration imports the runtime only through it. Export-map hiding is
not a security boundary: opaque brand provenance, issuer-store membership,
one-shot consumption, binding checks, and final-adapter re-verification remain
load-bearing even for code able to import the internal subpath.

### 12. Exit and output semantics

- `category: usage-error` maps to exit 2.
- `category: refused` maps to exit 1.
- `category: dependency-error` maps to exit 1 with a stable non-secret code;
  it is never translated into an authority denial or allow.
- Usage error (missing/malformed/conflicting declaration): exit 2.
- Valid request refused by authority or stale policy/session: exit 1.
- Authorized success or read-only inspection: exit 0.

Human output is concise. JSON exposes stable reason codes, principal kind,
human role where applicable, declaration source, policy/constitution/package
versions and digests, enforcement/host mode, non-secret target summaries, and
readiness eligibility. It excludes absolute host paths and credentials.
Session-backed provenance includes its public, non-capability `session_id`;
direct `cli-flag` provenance forbids a synthetic session ID. `host-adapter` is
not a caller declaration source in the W01 contract: host posture and its
non-secret adapter attestation are recorded separately.

`cli-only` claims only DEVAI CLI/runtime enforcement. `host-integrated` is
healthy only when the named adapter is installed and its attestation verifies;
configuration alone is not evidence. Failed host attestation blocks
host-derived authority without disguising the remaining CLI-only boundary.

### 13. Migration state machine

The supported migration is:

```text
unmaterialized -> shadow-observation -> binding
                       |                  |
                       +-- expired -------+-- re-materialize on drift
```

Inventory and inspection are read-only. Materialization requires the preserved
Architect+`--write` initiation described above. Shadow is time-bounded and
readiness-ineligible. Binding is the only supported readiness posture. Rollback
means re-materializing a prior valid additive policy under a new audited
upgrade invocation; there is no bypass or command-line downgrade flag.

## Consequences

- R19 enforcement is deliberately narrow: DEVAI CLI/runtime only unless a
  verified host adapter is present.
- The final mutation adapter, not the router, is the load-bearing boundary.
- Inspector tests nested in broad source trees cannot be swallowed by an
  Engineer rule.
- Materialized policy and sessions become stale on package, Constitution,
  source, extension, or resolved-digest drift.
- Shadow, dry-run, read passthrough, denial, ambiguous policy, and unclassified
  resources cannot promote supported readiness.
- W01 adds contracts and setpoints only; red-first W02/W03 and implementation
  W04–W06 remain required before any enforcement claim.

## Alternatives Considered

1. **Router-only role check.** Rejected because direct handlers and library
   calls bypass it and because it does not authorize concrete resources.
2. **A role environment variable.** Rejected because ambient inherited state
   is implicit, spoofable, and violates Article 7's explicit declaration.
3. **Caller-declared machine roles.** Rejected because it silently elevates the
   caller into F5 transitions.
4. **First-match-wins glob policy.** Rejected because file ordering would become
   authority and broad rules could swallow protected tests.
5. **Evidence record as capability.** Rejected because durable audit data is
   replayable by design.
6. **Amend Article 6 with DEVAI package paths.** Rejected because its additive
   extension clause already provides the correct project-specific mechanism.

## Affected Rules

- Constitution Articles 6–10, 14, 36, 39, and 40.
- D-3, D-6, D-8, D-30, D-126, D-129, D-134, and D-135.
- `authority-policy.schema.json`, `authority-session.schema.json`,
  `authority-action-contract.schema.json`, and
  `authority-evidence.schema.json`.
- `INV-AUTH-001` through `INV-AUTH-004` and canonical trace.
