---
adr_id: ADR-004
title: Published truth and operational self-adoption
status: accepted
date: 2026-07-17
authors: ["@aarusso"]
tags: [published-truth, scorecard, documentation, post-merge, state-hygiene, self-adoption, round-21]
---

# ADR-004 — Published truth and operational self-adoption

## Status

Accepted for specification in R21 W01 after explicit Owner approval of the R21
Plan. This ADR freezes contracts for Inspector red-first work. It does not claim
that the scorecard generator, site sensor, post-merge hook, dependency gate,
state policy, aggregate semantics, or documentation reconciliation are already
implemented.

## Context

DEVAI now enforces its supported CLI authority boundary, but several public and
operational truth surfaces remain outside that enforcement:

- the deployed documentation site predates the current package and
  constitutional line and names the wrong organization;
- the self-scorecard generator may select stale or wrong-HEAD evidence and may
  fall back to a synthetic experimental round;
- diagnostic effects are inconsistent: many sense actions are statically
  harness-write while score computation is read-classified yet can auto-append
  tracked evidence, so neither users nor the authority registry can predict
  observation purity from the action contract;
- Article 34 requires a post-merge Auditor path that the hook subsystem rejects;
- dependency state is currently clean but no binding, reproducible gate exists;
- workflow-text substrings can count as invariant-alignment evidence;
- readiness REVIEW and N/A states collapse into binary process failure;
- root gates traverse nested managed worktrees;
- current documentation contains facts that no deterministic claim inventory
  guards.

The common defect is not missing prose. It is a missing provenance boundary:
DEVAI cannot call a value current, published, measured, or self-adopted unless
the producing mechanism proves that exact fact.

## Decision 1: Constitutional disposition and role boundary

R21 requires no constitutional amendment at declaration.

- Articles 1–3 retain the human-supervised supported baseline.
- Articles 6–10 govern every new mutation. A read action cannot append canonical
  state as an undeclared side effect.
- Article 20 forbids post-merge automatic reversion.
- Articles 33–34 already require a quiescent, post-merge Auditor cycle.
- Article 36 requires DEVAI to exercise the same truth mechanisms it exports.
- Article 39 requires UNKNOWN when deployment or scanner truth is unavailable.

The post-merge implementation is deterministic governance automation, not an
agentic code generator and not the experimental autonomous controller. It may
observe and materialize isolated audit state. It may not edit product source,
merge, push, publish, revert, complete tasks, or dispatch a writing agent.

If W02 evidence proves that Article 34 cannot be satisfied without weakening an
existing authority or separation rule, dispatch stops for an Article 40
Architect amendment. Implementation never silently narrows the article.

## Decision 2: Exact-current scorecard contract

Checked-in generated truth has three identities. Collapsing them would create a
self-reference because committing a rendered page necessarily changes HEAD:

- scorecard_subject_sha: the exact source candidate measured by the scorecard;
- render_source_sha: the repository HEAD from which the validated projection is
  rendered; and
- deployed_source_sha: the merged source commit recorded by gh-pages
  provenance.

scripts/gen-self-scorecard.mjs becomes an explicit-input renderer:

    node scripts/gen-self-scorecard.mjs \
      --scorecard <path> \
      --expected-subject-head <40-hex-sha> \
      --max-age-hours 24 \
      [--repo-root <path>] \
      [--out <path>]

The renderer:

1. requires an explicit input path;
2. parses either a scorecard document or the existing skill-output envelope
   whose evidence member is a scorecard;
3. validates the extracted document with scorecard.schema.json;
4. requires integration_head to equal expected-subject-head exactly as a full
   40-hex commit SHA;
5. resolves render_source_sha from the repository rather than caller data;
6. requires generated_at to be a valid instant no more than max-age-hours old
   and not materially in the future;
7. rejects all-zero, placeholder, synthetic, baseline, or experimental
   provenance;
8. requires scorecard_subject_sha to be an ancestor of render_source_sha;
9. mechanically requires every intervening path to be observation/projection
   only: the designated round audit path, closure evidence, the canonical
   current-scorecard projection, or its byte-identical site mirror;
10. derives last_built_at from generated_at, never file mtime;
11. renders both current outputs to temporary files before one atomic
    replacement boundary; and
12. leaves every existing output byte-identical on validation or preparation
    failure.

The renderer also emits a provenance manifest containing schemaVersion,
scorecard_subject_sha, render_source_sha, generated_at, scorecard artifact path
and SHA-256, both output paths and SHA-256 values, the exact allowlisted
intervening paths, and a digest over the canonical manifest with its digest
field omitted. W13 adds deployed_source_sha and gh-pages SHA/run identity in
audit evidence; it does not rewrite the checked-in page to chase its own commit.

Filename ordering, directory scanning, mtime, and docs/work/round-9007 are not
truth selectors. findLatestScorecard and the Round 9007 fallback are removed.
No-data is a hard generator failure, not a successful page that implies
freshness. UNKNOWN cells remain UNKNOWN and never promote readiness.

The canonical current scorecard Markdown and the synced site page are rendered
from the same validated in-memory value and must be byte-identical.

## Decision 3: Renderer truth and deployed truth are separate

A Docusaurus production build is authoritative for source-renderer integrity.
Current content uses native fail-closed configuration:

- onBrokenLinks is throw;
- onBrokenAnchors is throw;
- current and versioned route generation completes without ignored failures.

Historical snapshots are not rewritten to manufacture green output. R21 creates
one truthful stable 0.6.0 snapshot from the actual 0.6.0 release source and
removes 0.1.1 and 0.2.0 from the active selector while preserving Git history.
The next channel is explicitly unreleased.

The supported sensor path is:

    devai sense site drift

It emits a supported site_drift SensorReading and measures repository and
deployment provenance independently:

| Condition | Status | Promotion |
|---|---|---|
| Exact published source, renderer green, no later published-input or package-release delta | pass | Eligible |
| Later commits touch published inputs but no later package release exists | review | Ineligible |
| A package release or package-version change exists after the published source | fail | Ineligible |
| Provenance is missing, malformed, unreachable, non-ancestral, or too stale to establish | unknown | Ineligible |
| Only unrelated source commits follow the published source | pass | Eligible |

UNKNOWN exits successfully as an observation per INV-DEVAI-012 but blocks live
publication close. A local pass cannot substitute for the W13 live verification.
The Docusaurus canonical URL, organization, repository link, sitemap, and Pages
host all name devai-nyx.

## Decision 4: Version and publication coupling

The strict version-only release PR remains narrow. Documentation version cuts
do not get smuggled into that PR.

Before a version PR is eligible to merge, its parent commit must already contain
a stable docs snapshot whose declared package version and Constitution version
match the proposed package manifests. The release preflight fails when the
snapshot is missing or mismatched.

After package publication, the local deliberate docs-publish action remains the
only supported value-producing path under ADR-LOCAL-PUBLISH-WORKFLOW. It runs
only from pushed, clean, green, merged main after explicit Owner authorization.
The resulting gh-pages commit records the exact source SHA. Live verification
must pass before closure.

R21 installs and tests this coupling but publishes no package. It publishes the
site once at W12. The two pending authority changesets remain byte-identical and
R22 performs the next combined package release after R20 integration.

## Decision 5: Observation is pure; persistence is a separate mutation

D-120 Decision 1 is superseded only where it made diagnostic completion
persist and auto-chain by default. Its evidence format, integrity, N/A-only-from
configuration rule, anti-relabel guarantee, and attribution rules remain in
force.

The following supported observation families are non-recording by default:

- sense commands, including sense run;
- govern score compute and view;
- spec validation;
- evidence verification;
- doctor and policy checks;
- the post-merge Auditor composite's internal measurements.

Observation may read canonical state but does not create SensorReadings, append
the evidence chain, update decisions, write scorecards, or mutate source.
DEVAI_EVIDENCE_AUTOCHAIN is no longer required to make a supported read safe and
cannot be the only safety boundary.

Persisting a SensorReading is a distinct registered mutation:

    devai sense readings record \
      --input <sensor-reading.json> \
      --as-role <role> \
      --write

The action validates the input, records the exact current repository and
invocation provenance, derives the bounded harness-write transition, writes one
content-addressed reading, and appends one evidence record. Replay is
idempotent. Canonical persistence cannot be selected through a flag on a read
action.

Commands that already have a separately registered mutation action, such as
evidence emit, retain that explicit action. Output to an arbitrary requested
file is a filesystem mutation and remains subject to the R19 action contract.

The full repository gate chain runs observations only and must leave every
tracked state byte-identical. Positive persistence tests run in disposable
repositories.

## Decision 6: Managed worktree isolation

A root gate evaluates exactly one Git worktree. It must not recursively inspect
another worktree nested below the root.

The canonical excluded set is:

- every non-root worktree path returned by git worktree list --porcelain that
  is lexically or physically inside the evaluated root;
- .devai/worktrees/**;
- .claude/worktrees/**;
- existing generated/dependency exclusions such as .git, node_modules, dist,
  coverage, and generated code.

Lint, formatting, source-search guards, and any root directory walker share this
contract. Hard-coded exclusions alone are insufficient; discovered nested
worktree roots are authoritative. A candidate worktree is validated by invoking
the same gate from that worktree's own root.

## Decision 7: Article 34 post-merge implementation

Installing a post-merge adapter is an explicit Architect-authorized host
mutation:

    devai adopt hooks install \
      --hook post-merge \
      --as-role architect \
      --write

Installation preserves the existing marker-block/idempotency contract and
materializes a repository-, adapter-, hook-digest-, policy-, and Constitution-
bound host attestation. That installation is the bounded standing consent for
the exact observation transition; it is not a reusable general write grant.

The hook invokes the internal composition path:

    devai govern auditor post-merge --host-receipt <path>

That path accepts neither a caller-selected human role nor invocation-level
write consent. The verified installed adapter issues an exact merge-event
receipt; only then may the runtime derive the existing harness/harness-write
machine pair for the exact post-merge-observation action and isolated state
resources. A direct caller, environment variable, copied receipt, stale hook
digest, wrong repository, wrong merge, or unverified host adapter refuses
before state creation. Human Auditor identity is reserved for later promotion
of selected observations into docs/work/<round>/audit.

The composite:

1. processes each exact integration merge SHA once;
2. creates or reuses one detached persistent inventory worktree under
   .devai/worktrees/auditor-post-merge;
3. advances that clean observation checkout to each merge SHA while preserving
   ignored append-only observation state;
4. regenerates F4 inventory into isolated output, computes the exact-subject
   scorecard, derives backlog deltas, and produces a status assessment as
   Article 33 requires;
5. stores an immutable digest-linked observation bundle under
   .devai/state/post-merge-auditor/<merge-sha>/ inside the persistent worktree;
6. leaves both the integration checkout and observation checkout free of
   tracked changes;
7. uses a repository-scoped lock and merge-SHA idempotency key; and
8. reports failure visibly to stderr and the observation state without trying
   to undo the merge.

The installed-checkout adapter covers merges executed in that checkout. When a
remote service performs integration, the next verified synchronization of the
declared persistent checkout enumerates and processes every unseen first-parent
merge between the last observation and the synchronized HEAD, rather than only
the newest SHA. The cadence claim is healthy only while the named persistent
checkout and hook attestation are current and no merge remains unobserved.

A repository that requires immediate remote-merge observation must declare a
separate verified host integration that delivers every merge event to a
persistent DEVAI host. A GitHub-hosted ephemeral runner alone is not a
persistent inventory worktree and cannot satisfy Article 34. In cli-only mode,
without either a current installed-checkout synchronization adapter or a named
verified remote adapter, cadence is UNKNOWN and non-promoting. DEVAI never
claims a universal remote guarantee from local hook installation.

The composite never calls an LLM, an agent skill, the experimental loop, Git
merge/push, package or site publication, task completion, source cleanup, or
destructive worktree deletion. A failed observation remains failed until a
human resolves and reruns it. Quiescent integration creates no timer activity.

The ignored observation bundle is runtime F5 state, not a supported readiness
attestation. A human Auditor promotes selected evidence into
docs/work/<round>/audit only during the role-correct audit wave.

## Decision 8: Dependency-security result contract

The supported path is:

    devai policy check dependencies

The gate scans the complete pnpm lockfile, including development dependencies
that execute in build, test, release, or documentation supply chains. It uses a
pinned scanner/tool version and normalizes output to:

- schemaVersion;
- scanner name/version and advisory-database timestamp;
- generated_at;
- lockfile SHA-256;
- status;
- advisories with stable ID, package, severity, affected range, fixed versions,
  and aliases;
- applied waivers with reason, approver, and expiry;
- findings and counts by severity.

Severity order is info, low, moderate, high, critical. Unwaived high or critical
findings fail. Lower findings produce review until explicitly accepted or
remediated. Missing fixes do not downgrade severity.

A waiver is exact-advisory, exact-package, reasoned, human-approved, and
time-bounded. Unknown or expired waivers fail. Malformed output, scanner
unavailability, an unpinned scanner, stale advisory data, or a lockfile digest
mismatch yields UNKNOWN and a failing binding CI gate. Network failure never
becomes a clean scan.

The clean pnpm 10 observation at R21 declaration is a baseline fact, not proof
that the gate exists.

## Decision 9: Aggregate readiness and alignment semantics

sense run consumes each child's structured SensorReading JSON. It reports:

- execution_status: pass or error;
- readiness_status: pass, review, fail, unknown, or na;
- applicable_count and na_count;
- counts for every status;
- one result entry per command with parsed status and process metadata.

The scorecard N/A configuration determines exclusion. All N/A yields
readiness_status na. Among applicable readings, fail dominates, then review,
then unknown, then pass. Malformed/missing child JSON or spawn failure is an
execution error, not a readiness FAIL.

Process exit is non-zero for execution error or applicable readiness fail.
Review, unknown, N/A, and pass exit zero while retaining their structured,
non-promoting status. Human output prints execution and readiness separately.

Invariant alignment requires both:

1. an executable, fail-closed workflow step that invokes the exact required
   canonical action; and
2. fresh successful evidence bound to the candidate HEAD, or equivalent
   successful evidence produced in the same workflow run.

Comments, display names, echo/printf, quoted command strings, disabled steps,
continue-on-error, ignored failures, shell fallbacks, and outputs that are never
checked do not count. Existing any/all mode semantics remain unchanged.

## Decision 10: Current claims, guides, and CI self-adoption

Current hand-written facts that can drift are registered in
docs/meta/current-claims.json. Each entry declares:

- stable claim ID;
- current document/path or selector;
- authoritative source or query;
- comparison/renderer;
- historical exclusion policy;
- owner role;
- failure severity.

Historical papers and version snapshots are explicitly historical and excluded
only through exact paths, never wildcard prose exemptions.

docs/adopters is the canonical location for user/adoption guidance. Root
duplicates are removed or become unambiguous pointers; generators, sync rules,
and inbound links follow the canonical source.

DEVAI self-adopts the exported reusable evidence gate as one CI job for the law
it asks adopters to consume. DEVAI-specific full-signal jobs remain because this
framework repository has a wider self-verification obligation. The hybrid
posture is deliberate and recorded; it is not duplication by accident and does
not reduce the binding close chain.

## Decision 11: Evidence and closure

Repository candidate truth and deployed truth are separate verdicts. W10 may
recommend the source candidate only. W13 establishes live Pages truth. Remote
uncertainty is UNKNOWN and blocks W14.

Experimental readings and Round 9007 remain auditable but cannot select current
scorecard evidence or promote supported readiness. Round 9007 is labeled
historical experimental after its fallback dependency is removed.

No worker publishes. W12 requires fresh explicit Owner authorization and
publishes the site once from merged main. Any source or workflow correction
after merge is a new shipment. The post-merge attestation branch is
evidence-only and a replacement attestation supersedes any invalidated record.

## Consequences

Positive:

- Public claims are bound to exact source and time rather than file naming.
- Read actions become genuinely read-only under the R19 authority model.
- Article 34 becomes deterministic and testable without introducing autonomous
  code generation.
- Dependency and workflow evidence fail closed.
- Root gates become stable in the presence of managed worktrees.
- DEVAI exercises the same reusable evidence law it exports.

Trade-offs:

- Existing users relying on automatic SensorReading persistence must adopt the
  explicit record action. DEVAI is pre-1.0; W08 provides migration guidance.
- Post-merge observation may report UNKNOWN or failure after a successful merge.
  It never reverts that merge.
- Live Pages verification remains an external dependency and can delay closure.
- A full-lockfile dependency scan can expose development-only advisories that a
  production-only scan hides; this is intentional for the toolchain supply
  chain.

## Alternatives Considered

**Keep automatic diagnostic persistence and rely on an environment variable in
CI.** Rejected. The action registry would continue to describe read and write
effects inconsistently, and forgetting one ambient variable would still dirty
canonical state.

**Render whichever scorecard file sorts newest.** Rejected. Filename and mtime
do not prove subject identity, freshness, or non-synthetic provenance.

**Treat a local site build as deployed truth.** Rejected. Renderer correctness
does not prove which source SHA gh-pages currently serves.

**Run Article 34 only in GitHub-hosted Actions.** Rejected. An ephemeral runner
is not the persistent inventory worktree required by the Constitution and
cannot honestly establish that host posture.

**Have the hook invoke an Auditor role flag.** Rejected. A hook cannot fabricate
a human constitutional declaration. Verified host origin must derive a bounded
machine transition, while a human Auditor separately promotes reports.

**Scan only production dependencies.** Rejected. DEVAI's build, test, release,
and documentation toolchain executes development dependencies and is part of
the framework supply-chain boundary.

**Count command text anywhere in workflow YAML as invariant evidence.**
Rejected. Comments, echoes, and ignored commands are not measurements.

## Affected Rules

- Constitution Articles 1–3, 6–10, 16, 20, 33–36, and 39.
- D-120, superseded only for default recording by read-classified diagnostics.
- D-126, human-supervised supported baseline and experimental loop containment.
- D-129, registry-derived CLI and fail-closed routing.
- D-134, attest-what-ships closure ceremony.
- D-135/D-136 and ADR-003, binding authority and explicit mutation contracts.
- ADR-CI-ECONOMY, ADR-DOCS-GOVERNANCE, ADR-DOCS-IA, and
  ADR-LOCAL-PUBLISH-WORKFLOW.
- docs/work/round-21/Plan.md and its inventories.
