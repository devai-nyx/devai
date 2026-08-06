# R-0008 plan — authenticated cross-gate claim reuse

Status: **PREPARATION AUTHORIZED / B0 AND IMPLEMENTATION BLOCKED**

Execution base: **UNBOUND**

Decision ID: **next free after DII-256, to be rechecked immediately before use**

## 1. Outcome and governing position

R-0008 may introduce cross-gate reuse only by authenticating independently defined assertion results (“gate claims”), not by treating overlapping test-file paths as equivalent executions. The controller retains all sixteen literal gates and their order. Each literal argv remains independently runnable from an empty-state detached exact-candidate checkout. During convergence, a consumer may replace only an assertion whose complete canonical contract is identical to a previously executed, signed, fresh assertion. All other assertions execute.

The named whole gates are deliberately in distinct equivalence classes. `ordinary`, `stage2`, and `coverage` must not reuse one another as a whole. Their protected properties remain mandatory. A claimed one-hour saving from skipping any of those whole gates is therefore rejected. The round may activate only mechanically derived shared sub-assertions that survive the complete adversarial and benchmark gates.

OM-021 additionally requires a GitHub Actions producer path. Remote fast feedback may consume
an exact, independently reproduced canonical DEVAI claim envelope only after its GitHub
OIDC/Sigstore attestation and complete workflow identity policy verify. A separate mandatory
cold authoritative lane executes without DEVAI result reuse. GitHub cache storage remains an
untrusted locator/transport and never becomes the trust root.

References: independent literal executability and complete terminal population (`product/owner-mandates/OM-017.md:51-60,97-101`); complete-class red-first repair (`product/owner-mandates/OM-016.md:82-99`); content-addressed freshness and fail-closed widening (`product/owner-mandates/OM-014.md:44-81`); generic capabilities and independently reproducible identity (`law/register/DECISIONS.md:4834-4841,4903-4928`); two-pass convergence (`work/rounds/EXECUTION-CONTRACT.md:102-171,238-263`).

## 2. Remaining Owner mandate request — not yet granted

OM-019 grants planning, inventory, matrix, and entry-packet preparation; OM-021 adds the
GitHub Actions attestation and fast/cold lane planning scope without granting B0. The following
remaining authority must be recorded by the Owner before B0; this plan does not presume it.

> REQUESTED: After R-0007 closes, authorize R-0008 B0 through close for authenticated
> fresh-result reuse between independently equivalent assertions contained in the sixteen
> authoritative convergence gates and for authenticated GitHub-produced copies of those same
> canonical claims. Bind the literal independent reviewer selector; local/offline Ed25519
> verification trust root, trust epoch, private-key custody and signing eligibility; GitHub
> OIDC/Sigstore issuer, repository, workflow/ref, reusable-workflow chain, event/ref/environment,
> subject and plan/visibility eligibility policy; and a
> role-pure atomic projection activation contract. Authorize activation only for equivalence
> classes derived mechanically from complete command closure and proven byte-identical in a
> canonical claim contract.
>
> This request does NOT authorize removal, weakening, reordering, or population reduction of any literal gate; lowering 70/60/70/70 or any other floor; reusing ordinary as coverage or stage2, or any other non-equivalent result; trusting unsigned/self-signed/self-digested cache bytes as producer authentication; accepting an identity derived from the result artifact; hidden prerequisites; reviewer fallback; mixed-role commits; deployment, publication, package release, tag, GitHub Release, Pages, evidence promotion, real-stynx mutation, predecessor mutation, or R-0010/R-0008 operation outside separately satisfied entry authority.

The mandate must also resolve two blockers in structured terms:

1. bind R-0008’s independent read-only reviewer selector and two-cycle/one-transport-retry budget, with fallback forbidden;
2. authorize or direct a constitutional atomic activation mechanism that satisfies both role-pure ownership and same-commit derived-artifact regeneration. A simple exception allowing mixed Architect/Engineer paths is not requested and is not acceptable.

If either is absent or ambiguous, stop at entry.

## 3. Architect decision contract (next free DII)

### Identifier and scope

DII-254 through DII-256 are occupied. Immediately before the declaration/law
commit, re-read the exact candidate register and use the then-next gapless free identifier.

### Decision in prose

The decision shall state:

1. A gate result is not reusable because its files overlap another gate. Reuse authority attaches to a canonical `gate_claim_contract`, not to a gate label, finding code, output text, duration, or producer-chosen identity.
2. Each literal gate maps to an ordered recipe of claims. The recipe must be derived to a fixpoint from literal argv, package scripts, imported/spawned executables, project references, configs, outputs, and explicit semantic assertions. The concatenated recipe must prove every property of the literal gate. An incomplete or ambiguous recipe makes the gate execute literally; it never creates reuse eligibility.
3. The expected consumer claim identity is recomputed independently from exact candidate and trusted runtime observations before any cache artifact is opened. No expected component may be defaulted from the artifact being authenticated.
4. A reusable result is an `EXECUTED_PASS` claim-result body plus its self-digest and an Ed25519 signature under a candidate-authorized key/trust epoch. A SHA-256 self-digest detects accidental corruption but does not authenticate the writer.
5. The verifier authenticates the public key through exact-candidate policy, verifies the signature over canonical result bytes, recomputes the claim identity, validates dependencies and outputs, and then compares identities. Missing, stale, ambiguous, invalid, untrusted, replayed, or multiply matching artifacts result in `EXECUTE`; if safe execution cannot be formed, `BLOCKED`. They never result in `REUSE_FRESH`.
6. Reuse is permitted only in local convergence and the remote fast-feedback lane. Remote
   reuse requires GitHub-attested canonical DEVAI claim envelopes under the exact
   candidate-authorized workflow identity policy. The mandatory remote cold authoritative
   lane executes the complete applicable population without DEVAI result reuse. Literal
   commands remain independent.
7. Coverage threshold and instrumentation claims, stage2 build/order claims, and ordinary combined-root claims are non-substitutable. Coverage remains whole-only with respect to its coverage execution and outputs.
8. Reuse records name producer gate/claim, consumer gate/claim, exact ordinal, expected identity, presented identity, attestation digest, verification-key ID, and reason. All sixteen terminal gate records remain exactly once and ordered.
9. The complete cache-poisoning threat model and crypto assumptions are normative. An actor able to modify cache files but not the authorized signing key cannot forge a reusable PASS. Compromise of the signer/private key, verifier implementation, exact candidate, or trusted toolchain is outside that guarantee and triggers trust-epoch revocation and rollback, not a false claim of impossibility.

### Generic capability names

Add these named, schema-versioned capabilities under `control_capabilities`; no production code may dispatch on `DII-*` literals:

- `cross_gate_claim_reuse`
- `claim_contract_fixpoint_derivation`
- `consumer_identity_independent_recomputation`
- `signed_result_attestation_required`
- `candidate_bound_verification_trust_root`
- `ambiguous_reuse_executes`
- `ordered_claim_recipe_enforced`
- `protected_gate_properties_non_substitutable`
- `reuse_provenance_terminal_evidence`
- `same_commit_projection_activation`
- `github_actions_attested_claim_producer`
- `github_oidc_workflow_identity_bound`
- `fast_feedback_and_cold_authoritative_lanes`
- `github_cache_has_no_verdict_authority`

### Equivalence identity: what is bound

The canonical claim equivalence key binds every component below. The independent reproducer specification must state canonical JSON rules, sorting, path normalization, encoding, own-digest omission, and exact commands for recreating each digest.

1. `claim_contract_schema_version` — prevents interpreting old bytes under new semantics.
2. `claim_kind` and canonical semantic assertion ID — identifies what is proved, independently of producer gate.
3. exact candidate commit and tree — binds source and identity; history-sensitive claims additionally bind exact base/range.
4. normalized execution recipe: program, argv, cwd, ordered predecessor claims, process-boundary mode, instrumentation/provider mode, timeout/concurrency/retry settings, and complete recursive command-closure digest — preserves execution semantics and order.
5. complete test/assertion population manifest: path, mode, object type, object ID, raw-blob digest, resolved config, include/exclude/filter/shard parameters, and discovered population digest — prevents “same files” from hiding different selection.
6. complete transitive input/dependency manifest and dependency result identities — prevents stale prerequisite reuse.
7. environment manifest/digest, including complete-environment digest where current policy requires it — preserves environment equivalence.
8. toolchain probe manifest/digest — preserves Node, pnpm, Vitest, TypeScript, provider, Git, and other effective tool versions.
9. policy, graph, profile, schema-set, threshold-policy, trust-policy, and command-closure digests — policy changes invalidate reuse.
10. required output contract and observed post-execution output manifest/digest — prevents reuse after missing/tampered outputs.
11. producer execution result body digest and `EXECUTED_PASS` — binds the actual pass evidence.
12. verifier kind, verification key ID/trust epoch or GitHub OIDC/Sigstore issuer and
    attested workflow identity — rejects signatures from revoked, unrelated, or wrong-workflow
    producers and prevents local and GitHub identities from being conflated.

### Deliberately unbound fields

- Producer and consumer gate IDs are excluded from the **equivalence key** because identical claims must compare across gates; they remain mandatory provenance fields outside the key and are signed.
- Round ID is excluded from claim equivalence only if candidate, policy/profile/graph/schema/trust epoch and every other component are identical; it remains signed provenance. This permits content freshness rather than calendar freshness.
- Wall-clock timestamps, duration, PID, temp paths, log paths, hostnames, cache path, and scheduling order outside the claim recipe are excluded because they do not change the assertion. Timestamp age alone has no freshness standing.
- stdout/stderr bytes are not semantic equivalence inputs unless a claim contract declares them required outputs; their digests remain signed evidence. This is safe because verdict, assertion population, dependencies, and declared outputs are bound directly.
- The signature is not part of the claim identity (avoids circular identity); it authenticates the complete result envelope containing that identity.
- Source gate label is not a substitute for semantic contract and conveys no eligibility.
- GitHub run ID, job name, artifact name, cache key, cache hit, actor display name, and workflow
  conclusion are provenance only. They are excluded from semantic equivalence because they do
  not define the claim, but their applicable authenticated workflow identity fields remain
  signed/attested and policy-checked before remote reuse.

### Schemas and policy surfaces

Architect-owned additions/changes:

- `law/register/DECISIONS.md` — next-free DII declaration and later close decision.
- `law/schemas/gate-claim-contract.schema.json` — canonical assertion contract and recipe.
- `law/schemas/gate-result-attestation.schema.json` — signed executed result, provenance, signature, and trust epoch.
- `law/schemas/github-actions-claim-provenance.schema.json` — GitHub attestation bundle,
  OIDC/Sigstore identity, reusable-workflow chain, subject digest, event/ref/environment and
  verification outcome; no cache- or conclusion-derived PASS.
- `law/schemas/task-freshness.schema.json` — version bump; distinguish task execution key from cross-gate claim identity and require source attestation for cross-gate reuse.
- `law/schemas/affected-test-graph.schema.json` — version bump; claim recipes, protected properties, derivation, and explicit eligibility population.
- `law/schemas/affected-test-execution.schema.json` — source/consumer identities and attestation verification outcome.
- `law/schemas/round-convergence.schema.json` — claim population digests, reuse provenance, benchmark/population equality fields.
- `law/schemas/round-close-profile.schema.json` — signer/trust paths and R-0008 evidence paths; no default.
- `law/schemas/remediation-closure-matrix.schema.json` — generalize campaign/round identity and derive the class floor from the bound matrix/registry instead of the legacy hardcoded minimum (`law/schemas/remediation-closure-matrix.schema.json:30-69`).
- `law/policy/round-close-controls.json` — capability version bump, schema registrations,
  local and GitHub trust-root policy, equivalence rules, protected properties, fail-closed
  results, fast/cold lane separation, and unchanged sixteen-command roster.
- `law/policy/governed-sequencing.json` — R-0008 bindings and atomic projection activation rule.
- `work/rounds/R-0008/close-control-profile.json`, `affected-test-graph.json`, `current-closure-matrix.json`, `review-obligations.json`, `control-provenance.json`, `plan.md`, prompts, authorization, and handoffs.
- `law/trace.json` — regenerate in the same Architect commit as any trace source change.

The exact derived command-closure arrays/digests must be generated from the future exact candidate; this plan contains no invented digest. The generating run is `node scripts/run-round-close-controls.mjs policy-check --candidate <literal-40-hex>` or the new Architect-authorized deterministic generation mode defined before use.

## 4. Equivalence decisions for protected gates

| Consumer | Proposed producer | Decision  | Missing proof                                                                     |
| -------- | ----------------- | --------- | --------------------------------------------------------------------------------- |
| coverage | ordinary          | forbidden | V8 provider environment, retained coverage outputs, 70/60/70/70 threshold verdict |
| coverage | stage2            | forbidden | instrumentation, full configured population, thresholds, coverage outputs         |
| stage2   | ordinary          | forbidden | build-before-test, separate T1 then T2 processes and order                        |
| stage2   | coverage          | forbidden | build dependency and uninstrumented separate tier order                           |
| ordinary | coverage          | forbidden | uninstrumented root-config combined execution                                     |
| ordinary | stage2            | forbidden | T3–T6 and combined root execution                                                 |

Order dependence is preserved by binding process boundaries and the ordered predecessor-claim list into each claim identity. A T2 result produced after a different predecessor identity cannot satisfy “T2 after this exact T1 after this exact build.” An explicit adversary reverses T1/T2 and another pre-seeds state that makes T2 pass only after T1; both must produce `GATE_ASSERTION_NOT_PROVEN` at stage2’s exact ordinal and execute the correct recipe.

## 5. Inspector red population

The machine-readable matrix is `work/rounds/R-0008/current-closure-matrix.json`. Its twelve
classes and twenty-six exact test IDs are mandatory, not examples. Each test must call production
behavior or its exported pure verifier. No test passes merely because source text contains a
finding code.

Specific red expectations:

- R8-001/002: an omitted component produces `CROSS_GATE_EQUIVALENCE_IDENTITY_MISMATCH`; payload contains both 64-hex identities and the exact consumer ordinal.
- R8-003/004/005: each unsound edge produces `GATE_ASSERTION_NOT_PROVEN` naming `coverage.thresholds`, `stage2.build-before-t1`, or `stage2.t1-before-t2`, respectively.
- R8-006: changing a PASS and recomputing its SHA-256 still produces `REUSE_ATTESTATION_INVALID`.
- R8-007: a valid Ed25519 signature under an untrusted key produces `REUSE_ATTESTATION_INVALID` with exact key ID.
- R8-008: each replay mutation produces `REUSE_IDENTITY_REPLAYED` or the precise component mismatch and executes the consumer.
- R8-009/010: removing an independent source or copying an expected value from the artifact produces `EXPECTED_REUSE_IDENTITY_UNAVAILABLE`.
- R8-011/012: at every ordinal, invalid reuse yields no `REUSED_FRESH_PASS`, retains sixteen terminal records, and makes freeze ineligible.
- R8-013/014: a delayed projection or mixed-role commit produces `DERIVED_ARTIFACT_NOT_ATOMIC` with source commit and derived path.
- R8-015/016: mismatched populations or mislabeled counts invalidate the benchmark.
- R8-017/018: empty-state detached literal execution needs no signer/cache/controller injection.
- R8-019/020: wrong GitHub issuer/repository/workflow/ref/chain/event/environment or subject
  bytes produce `GITHUB_CLAIM_ATTESTATION_IDENTITY_MISMATCH` with exact expected/presented fields.
- R8-021/022: cache/artifact/run/conclusion metadata without a verified canonical claim produces
  `GITHUB_UNAUTHENTICATED_RESULT_HAS_NO_AUTHORITY` and executes the consumer.
- R8-023/024: unauthorized caller/callee identity or verifier self-attestation produces
  `GITHUB_REUSABLE_WORKFLOW_IDENTITY_UNAUTHORIZED`.
- R8-025/026: fast success cannot satisfy cold authority; reuse/cancellation/incomplete cold
  execution produces `COLD_AUTHORITATIVE_LANE_NOT_PROVEN`.

If the defect returns, R8-F001/F002 loses semantic equivalence, F003/F004 permits forged or self-authenticating results, F005 creates false green terminal evidence, F006 creates unreproducible commits, F007 confuses speed with correctness, and F008 violates R7-F005.

## 6. Engineer implementation surfaces

Exact anticipated paths (Engineer may not expand them without a governed scope amendment):

- `scripts/run-round-close-controls.mjs` — claim derivation, independent identity computation, signature verification, cross-gate lookup, ambiguity handling, provenance, benchmark mode, and fail-closed fallback.
- `scripts/check-governed-sequencing.mjs` — same-commit projection/role validation.
- `package.json` — only if an explicit deterministic claim/benchmark command is required; all existing literal gate argv remain unchanged.
- `vitest.config.ts` and `tests/config/t1-t3.coverage.config.ts` — only if needed to expose independently authenticated preparation claims without changing standalone behavior or populations. The misleading coverage title/name may be corrected, never the population or threshold.
- `.devai/config/round-close-controls.json` — exact materialization produced by the authorized verb, committed by the executing Engineer under the atomic activation mechanism.
- `.github/workflows/ci.yml` — fast-feedback consumer and mandatory cold authoritative lane;
  no GitHub settings mutation.
- `.github/workflows/reusable-evidence-gate.yml` — verify the canonical envelope, artifact
  digest, GitHub attestation bundle and exact workflow identity before exposing eligibility.
- `.github/workflows/round-gates.yml` — cold authoritative execution remains complete and
  non-cancellable; no whole-gate substitution.
- Any generated schema registry currently produced by `devai:prepare`, if and only if the changed schemas feed it.

No package source path is authorized unless the red contract proves the controller script cannot own the behavior. No private signing key may appear anywhere in the repository, `.devai/state` evidence, test snapshots, logs, shell history artifacts, or commits.

## 7. Cache-poisoning threat model and false-green argument

### Threat model

Adversary can read/write/delete/replay cache files and workflow artifacts, choose cache/artifact
names and paths, recompute unkeyed hashes, create its own signing key, trigger workflows from
forks or unauthorized refs/events, imitate job/actor names, invoke an unauthorized reusable
workflow, and supply malformed/duplicate attestations. It cannot alter the exact candidate
without changing its identity, obtain the authorized local private key, forge the authorized
GitHub OIDC/Sigstore identity, subvert signature/attestation verification, or alter the trusted
controller/toolchain without changing bound digests. Same-user cache write access and GitHub
storage location are therefore not trusted.

Only the convergence controller may request a signature after an actual zero-exit execution whose complete claim population and outputs were observed. The signer signs canonical result-envelope bytes. Verification uses candidate-bound public material and trust epoch. The expected identity is computed before reading cache. A valid signature with the wrong independently recomputed identity is rejected. Replay is safe only when every bound component is exactly identical—the definition of intended content reuse.

The executable adversary generates an authorized fixture key and an untrusted fixture key, executes one claim, then exhaustively mutates each signed field, recomputes self-digests, re-signs with the wrong key, replays across candidate/policy/toolchain/environment/output/order changes, and duplicates matches. It asserts the named check, exact ordinal, exact expected/presented identity, and `EXECUTE`, not a bare finding code.

The GitHub adversary also uses fixture attestation bundles to vary issuer, repository,
workflow/ref, reusable-workflow chain, event/ref/environment, subject digest and artifact bytes
independently; substitutes a successful but unauthorized workflow conclusion; and replays a
valid bundle across claims. Each mismatch executes the consumer or blocks safely and names the
exact failed identity field. Verification must work from retained bundle and subject bytes, not
from a live producer-only API.

### False green

Within the stated cryptographic and trusted-computing-base assumptions, false green through cache substitution is prevented by conjunction, not probability: authorized local signature or
verified GitHub attestation under the exact workflow policy **and** independently recomputed
identical contract **and** fresh dependencies/outputs **and** unambiguous source are all
required. Failure of any term executes or blocks. A compromised authorized signer, GitHub
identity policy, producer workflow or verifier remains a declared trust-root compromise; it
triggers epoch/policy revocation, cache invalidation, optimisation disablement, and a fresh
uncached convergence. The plan does not claim cryptographic impossibility outside its assumptions.

## 8. Role-pure batch sequence and commit gates

No batch begins until its predecessor commit and evidence are independently verified. Every commit runs `pnpm run devai:prepare`, `pnpm vitest run`, `git diff --check`, plus affected gates, and its output is read before commit (`work/rounds/EXECUTION-CONTRACT.md:61-93`). Known-red focused tests are permitted only in their explicitly recorded pre-repair phase; the unchanged all-green baseline may not be converted to an exception.

### B-1 — Owner authority (Owner)

Record the granted mandate only after Owner approval. Bind round, scope, reviewer, signer/trust root, atomic activation resolution, exclusions, two cycles, one transport retry, no fallback. Gate: schema-valid active mandate census; otherwise stop.

### B0 — declaration (Architect)

From fresh live `origin/main`, create the dedicated branch/worktree and bind exact base, plan digest, scope, known-red posture, and claims ceiling. Recheck next DII ID. No implementation. Gate: entry-check on exact commit, clean boundaries, predecessor read-only proof via immutable GitHub objects.

### B1 — law and round contract (Architect)

Commit the declaration decision (next free DII), schemas, policy contract, R-0008 profile/graph/matrix/obligations/provenance, and sequencing contract. Generate `law/trace.json` and all Architect-owned command-closure entries/digests **within this commit** from its exact source bytes. The policy/materialization atomicity mechanism must ensure this commit does not invalidate an Engineer-owned mirror without same-commit activation. If that cannot be achieved role-purely, stop; do not use a follow-up materialization commit as a workaround.

Gate: schema validation; no `DII-*` production dispatch literals; exact 16-command roster unchanged; closure derivation equality; trace check; sequencing; diff check; focused law contracts.

### B2 — red contracts (Inspector)

Add the ten focused red files named in the closure matrix and all twenty-six test IDs. The complete population must fail for the intended runtime reason. Regenerate `law/trace.json` in this same commit only through an already-authorized role-pure projection mechanism; if Inspector-owned tests invalidate Architect-owned trace and same-commit regeneration would violate role purity, the B1 atomic activation decision must already provide a constitutional solution or execution stops.

Gate: each test is individually observed red; combined focused population is red; unchanged baseline regressions remain green except the exact prospective reds.

### B3 — red evidence (Auditor)

Record one immutable run at the exact B2 commit: command, start/finish status, exit, exact failing test IDs, `test_file_count`, `test_suite_count`, `test_case_count`, `passed_case_count`, `failed_case_count`, `skipped_case_count`, and evidence digests. Never call a file count a suite count. No implementation commit may later modify this evidence.

### B4 — implementation and materialization (Engineer)

Implement the exact red-bound surfaces, including local signature and GitHub attestation
verification, fast/cold lane wiring, and GitHub cache non-authority. Generate
`.devai/config/round-close-controls.json`, any Engineer-owned generated schema registry, and any command-closure materialization in the **same commit that changes its source**, using the B1 atomic activation contract. Preserve literal argv and standalone fallback. Gate: all focused tests green; signature, GitHub identity, cache/artifact and replay adversaries green; all previous cache/freshness tests green; prepare; full Vitest; tier gates; coverage; sequencing; materializations; trace; registry; diff.

### B5 — Inspector acceptance (Inspector)

Add acceptance/adversarial expansions only; do not accommodate implementation defects. Exercise every key component independently, all 16 ordinals, both passes, empty/duplicate caches, signer absent/revoked, output tamper, order dependence, and named protected gates. Any test-source change regenerates its affected trace within the same atomic commit mechanism.

### B6 — Auditor correctness and benchmark evidence (Auditor)

At one exact clean candidate and, for GitHub comparisons, the same declared runner class, execute:

1. a detached, empty-state, no-reuse literal run of each of the sixteen argv independently;
2. cold controller convergence with cross-gate reuse disabled;
3. cold controller convergence with feature enabled but empty cache;
4. warm controller convergence using only eligible signed claims;
5. one repeat of steps 2–4 to reduce one-off noise.
6. remote fast-feedback runs with cold/miss and warm/hit dependency state, then eligible and
   ineligible GitHub-attested claim artifacts;
7. a remote mandatory cold authoritative run with DEVAI result reuse forcibly disabled.

Compare semantic populations before timing. Record queue, setup, install, artifact transfer,
attestation verification, job, gate, claim and workflow critical-path seconds; runner class;
dependency cache hit/miss; local/GitHub verifier mode; executed/reused claim counts; 16 terminal
gate records; test file/suite/case/pass/fail/skip counts; threshold values/verdicts; output
manifests; and CPU/OS/toolchain/environment digests. The exact commands and counts are produced
by these runs; none are prefilled in the plan.

### B7 — as-built and convergence (Auditor, then Architect)

Auditor records the exact implementation subject and all evidence. Architect writes current docs and closing decision without copying volatile unbound values into self-referential tracked prose. Regenerate all affected projections in the same invalidating commit. Then run two consecutive convergence passes on one exact review candidate; pass 2 makes zero writes. The remote cold authoritative lane remains complete and without DEVAI result reuse; only the separate fast-feedback lane may consume authenticated equivalent claims.

### B8/B9 — independent review and source close

Run the Owner-bound read-only reviewer on a clean candidate-only clone. Cycle 1 covers every matrix class, changed/unchanged topic, crypto threat, protected property, and benchmark correctness. One role-pure repair phase may follow. Cycle 2 repeats the full population. Cycle-2 failure is `ESCALATION_REQUIRED`; cycle 3 is forbidden. One invalid transport retry per unchanged cycle is allowed. PASS freezes the candidate under the execution contract. Push/PR/merge occurs only if separately authorized by the mandate and all exact-head checks are green; this plan itself performs none.

## 9. Auditor evidence contract

Every evidence record binds exact commit/tree, command argv/cwd, clean-before/after, exit, start/end monotonic duration, policy/profile/graph/schema/trust digests, environment/toolchain, and output digest. Counts use distinct names:

- `authoritative_gate_count` (expected 16, re-derived from policy)
- `tracked_test_file_count` (current diagnosis 166; future run re-derives)
- `discovered_test_file_count`
- `test_suite_count`
- `test_case_count`
- `passed_test_case_count`, `failed_test_case_count`, `skipped_test_case_count`
- `executed_claim_count`, `reused_claim_count`, `ineligible_claim_count`
- `coverage_line_percent`, `coverage_branch_percent`, `coverage_function_percent`, `coverage_statement_percent`

The coverage producing run reports the actual configured population. It may not call it T1–T3 merely because the script path does. The Auditor independently verifies every signature with the documented public key and reproduces each reused identity from retained artifacts, following DII-252’s amendment (`law/register/DECISIONS.md:4903-4928`).

## 10. Entry gates

- Required predecessor rounds are closed according to live `governed-sequencing.json`; R-0008 is not inserted ahead of active governed work by this plan.
- Active unambiguous Owner R-0008 mandate and reviewer binding.
- Exact live base equals `origin/main`, clean primary and dedicated worktree, no conflicting PR/scope drift.
- Requested authority files exist in exact base; primary drift from the planning source is reconciled.
- DII ID rechecked gapless/free.
- Signer public trust root and operational private-key custody design approved; no private key in repository.
- GitHub repository visibility/plan proves attestation availability; Owner binds exact
  OIDC/Sigstore issuer, repository, workflow/ref, reusable-workflow chain, event/ref/environment,
  subject and verifier policy. If unavailable, remote reuse remains disabled rather than
  falling back to artifact/cache/workflow-conclusion trust.
- Atomic role-pure same-commit projection mechanism proved feasible.
- `pnpm install --frozen-lockfile`, prepare, baseline full tests, all tiers, coverage 70/60/70/70, sequencing, governance, materialization and reference checks green.
- No predecessor or real-stynx write.

## 11. Exit gates

- Twelve matrix rows advance RED_REQUIRED -> RED_PROVED -> GREEN_PROVED -> REVIEWED_PASS using exact evidence; no literal counts substitute for bound populations.
- All named adversaries, including GitHub OIDC/Sigstore, workflow-identity, cache/artifact and
  fast/cold-lane cases, pass and report exact check, ordinal, identity and subject payloads.
- All sixteen literal commands independently pass from clean detached empty-state checkout.
- Whole-gate edges among ordinary/stage2/coverage remain forbidden.
- No threshold/population/order/instrumentation/build assertion changes.
- Independently retained artifacts reproduce each reused identity and verify every signature.
- Paired correctness populations are identical before any speed claim.
- Positive benchmark saving exists for activated claims; otherwise activation remains disabled and the round closes as a validated non-activation or rolls back.
- Two clean semantically equivalent convergence passes, second no-write.
- Owner-bound independent review PASS within budget; full uncached remote exact-head CI green.
- Remote fast feedback accepts only independently reproduced GitHub-attested canonical claims;
  the mandatory cold authoritative lane accepts no DEVAI result reuse and remains non-cancellable.
- No forbidden deployment/publication/release/evidence/predecessor/stynx effect.

## 12. Stop conditions

Stop immediately on missing authority, DII collision, dirty identity boundary, scope-changing drift, mixed-role commit, inability to achieve same-commit derived artifacts, missing signer or GitHub trust policy, private-key exposure, unavailable attestation feature silently bypassed, wrong issuer/repository/workflow/ref/reusable-workflow/event/environment/subject accepted, cache hit/artifact ID/workflow conclusion treated as PASS, unsigned/self-digested reuse, identity sourced from cache, ambiguous match, false `REUSE_FRESH`, protected-property loss, threshold or population reduction, ordinal/population omission, count-label confusion, nonpositive or correctness-invalid benchmark, third review cycle, reviewer fallback, predecessor/real-stynx write, or external publication/deployment action outside later authority.

## 13. Expected wall-clock saving and measurement

For the three named whole-gate substitutions, the expected saving is **0 seconds**, because none is equivalent. The user’s approximate one-hour overlap is not safely removable under the stated properties.

For authenticated shared sub-claims, this cannot be determined without B6. Before activation, the controller derives eligible claim edges and the Auditor measures paired local and GitHub cold/feature-disabled, cold/feature-enabled, and warm/feature-enabled runs twice on one exact candidate and declared runner class. The accepted saving is the median workflow critical-path difference between correctness-equivalent runs, with queue, setup, install, artifact transfer and signature/attestation verification included. Report absolute seconds, percentage, per-claim avoided duration, and confidence caveat. Do not extrapolate from file overlap or summed job time. A zero/negative result disables activation unless an independently evidenced security or operability benefit justifies keeping a non-speed feature.

## 14. What does not change; surrendered properties

Does not change: sixteen literal argv/order, clean detached standalone capability, all test populations, Vitest configs except truthful naming if authorized, V8 coverage environment, whole-coverage rule, 70/60/70/70, BL-017 all-green status, stage2 build and tier order, ordinary combined root run, mandatory remote full cold CI without DEVAI result reuse, review budget, authority paths, predecessor/external boundaries, release/deployment prohibition.

Properties surrendered: **none**. If a positive saving requires surrendering any protected property, abandon the optimisation.

## 15. Hermetic CI lane comparison

A separate mandatory hermetic cold lane is required as an independent validator of order, instrumentation, clean-build behavior, signature/attestation verification, and full execution without DEVAI result reuse. It is not a substitute for authenticated reuse because a different environment identity cannot satisfy a claim unless that environment is part of the exact contract, and running every property cold remains the safety backstop rather than the speed mechanism. Prefer GitHub OIDC/Sigstore for GitHub-produced claims because it avoids a repository-held remote private key and authenticates workflow provenance; retain Owner-bound Ed25519 for local/offline claims. If either trust policy cannot be established, disable that reuse path and retain the hermetic lane; slow honest green is better than unauthenticated fast green.

## 16. Rollback

Cross-gate reuse is capability-gated and deny-by-default. Rollback disables
`cross_gate_claim_reuse` and `github_actions_attested_claim_producer`, revokes/increments the
local trust epoch and/or GitHub workflow trust policy, ignores/deletes only ignored runtime
cache through the authorized controller operation, disables fast-lane DEVAI result reuse, and
executes every literal gate. Do not change the roster or thresholds. Before merge, abandon or role-purely revert the last batch. After merge, use new role-pure revert commits and fresh uncached convergence; never destructive reset a shared/dirty tree.

Rollback triggers: any false `REUSE_FRESH`; any independently unreproducible identity; signature bypass/forgery; signer key exposure; ambiguous source accepted; population/threshold/order/build/instrumentation mismatch; protected gate skipped; detached literal failure; benchmark correctness mismatch; remote/local semantic divergence; or reviewer P0/P1 unsoundness. Preserve all evidence and open a separately authorized remediation campaign if trust was compromised.
