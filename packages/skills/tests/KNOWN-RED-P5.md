# P5 deferred test rebinding — `@devai-nyx/skills`

Source pin: `d76cd12d2241a1a28a32a0fe629c6531da7fe74d`.

P4 relocated the predecessor tests without changing assertions. The complete
successor run (`pnpm exec vitest run packages/skills/tests`) collected 194 tests:
162 passed and exactly 32 failed. Per the P4/P5 boundary, the 14 complete test files
containing those failures are withheld atomically for Inspector-owned path, assertion,
authority-harness, and baseline rebinding in P5. This also withholds 51 green assertions in those files;
no individual cases were filtered or skipped.

After withholding those complete files, the retained package slice is green:
11 files, 111 tests passed, 0 failed.

## Exact failures and P5 disposition

### `contract/skills-api-surface.test.ts` — 2

- `R20 baseline: skills module API surface (checker-based) checker export inventory of skills/index.ts matches the baseline exactly`
- `R20 baseline: skills module API surface (checker-based) runtime export names agree with the checker inventory (belt and braces)`

Reason: the predecessor's `HERE/../src` assumption resolves to `tests/src` after the
required `tests/contract` relocation. P5 must rebind the structural path and preserve
the checker/runtime parity assertion.

### `contract/skills-cycle-gate.test.ts` — 1

- `R20 structural gate: zero import cycles in skills/** the real skills/ tree has zero cycles (type-only edges included)`

Reason: the same relocated `HERE/../src/skills` assumption resolves to `tests/src/skills`.
P5 must point the gate at `packages/skills/src/skills`.

### `contract/skills-facade-gate.test.ts` — 1

- `R20 skills public façade contains only imports and module re-exports`

Reason: the same relocated `HERE/../src/skills/index.ts` assumption is stale. P5 must
rebind the path while retaining the façade-only assertion.

### `contract/skills-manifest-corpus.test.ts` — 1

- `R20 baseline: 52-skill manifest corpus listSkills() canonical JSON is byte-identical to the baseline (count, order, every field)`

Reason: the predecessor baseline contains predecessor paths (`.devai/state/skills`,
`.devai/state/rgr`, `docs/framework/**`, and singular `test/`). The successor source
correctly emits `record/proofs/work/skill-runs`, `record/proofs/work/rgr`, the
law/product layout, and `tests/`. P5 must create an Inspector-owned successor baseline
without weakening count, order, or field parity.

### `contract/skills-prompt-inventory.test.ts` — 1

- `R20 baseline: static prompt-literal inventory (supplemental) content of ≥120-char template literals matches the baseline (spans emitted, not asserted)`

Reason: the exact predecessor prompt/source literal corpus changed only where the
successor path contract required it. P5 must capture and review the successor corpus.

### `contract/skills-round-corpus.test.ts` — 2

- `R20 baseline: round-machinery corpus via public skills round-orchestrate over a 3-wave catalog (unbacked, missing-prompt) matches the baseline`
- `R20 baseline: round-machinery corpus via public skills round-backlog + round-audit file products over a fixed scorecard match the baseline`

Reason: expected artifacts still name `.devai/local/rounds/round-*` and nested
`audit/`; production now separates `work/rounds/R-NNNN` from `work/audit/R-NNNN` and
writes skill proof artifacts under `record/proofs/`. P5 must rebind fixture paths and
review regenerated exact baselines.

### `unit/bootstrap.test.ts` — 7

- `executeBootstrapPlan --force preserves provenance overwrites empty chain + counters when --force is set (fresh init)`
- `executeBootstrapPlan --force preserves provenance preserves a populated evidence chain even with --force`
- `executeBootstrapPlan --force preserves provenance does NOT preserve unrelated existing files when --force`
- `buildBootstrapPlan: .devai/constitution.md pointer (Phase 21.D, closes D-A-11) plans a self-symlink when targetRoot has a root-level CONSTITUTION.md`
- `buildBootstrapPlan: .devai/constitution.md pointer (Phase 21.D, closes D-A-11) plans a plain-file pointer when targetRoot has no CONSTITUTION.md (adopter case)`
- `executeBootstrapPlan: writes the constitution pointer (Phase 21.D) creates a symlink when the plan declares symlink_target (self case)`
- `executeBootstrapPlan: writes the constitution pointer (Phase 21.D) creates a plain-file pointer when targetRoot has no CONSTITUTION.md (adopter case)`

Reason: assertions name predecessor paths: `.devai/state/evidence-chain.json`,
`docs/framework/product`, and root `CONSTITUTION.md`. Production now uses
`record/proofs/chain.json`, successor static trees, self `law/constitution.md`, and
adopter `.devai/pin/constitution.md`. P5 must update exact path assertions and fixtures.

### `unit/constitution.test.ts` — 6

- `verifyConstitutionBinding reports ok when the pin matches the vendored copy exactly`
- `verifyConstitutionBinding reports not-ok when the pinned sha256 does not match the vendored copy (tamper/stale)`
- `verifyConstitutionBinding reports not-ok when the pinned version does not match the vendored copy version`
- `verifyConstitutionBinding reports not-ok (no pin) when only a vendored copy exists`
- `buildConstitutionBindingPlan self case: symlinks to ../CONSTITUTION.md and writes no pin`
- `buildConstitutionBindingPlan adopter case: vendors a root copy + pin when canonical text resolves`

Reason: fixtures and expectations still write/read root `CONSTITUTION.md`. P5 must
exercise the successor self source at `law/constitution.md`, adopter pin at
`.devai/pin/constitution.md`, and the updated pointer target.

### `unit/firewall-overlaps.test.ts` — 1

- ``R12 W2 — isAutofixSelfScope hardened gate REJECTS `*/*/adr/**/*.md` (prefix contains wildcard before `**`)``

Reason: this predecessor wildcard only overlapped the old multi-segment ADR prefix.
P5 must supply an equivalent malicious wildcard for `law/adr/` while preserving the
autofix-containment assertion.

### `unit/introspect.test.ts` — 1

- `introspectRepo introspects the DEVAI repo itself and finds the pnpm/TS shape`

Reason: the relocated file's predecessor-relative `REPO_ROOT` no longer points at the
workspace root. P5 must rebind only that fixture root.

### `unit/prompt-firewall.test.ts` — 3

- `checkPromptOverlays flags coding-agent/write naming CONSTITUTION.md as critical`
- `checkPromptOverlays flags write tier naming docs/product as Owner-inverted`
- `checkPromptOverlays warns on JOINT_RESERVED (glossary) without review-agent class`

Reason: fixtures name predecessor authority paths. P5 must use
`law/constitution.md`, `product/`, and `law/glossary/` respectively, retaining the
critical/owner/joint-warning semantics.

### `contract/mutating-llm-artifact-emission.red.test.ts` — 4

- `R28 mutating LLM skills emit attributable candidate bytes SKILL-elicit writes its structured draft under the declared owner scope`
- `R28 mutating LLM skills emit attributable candidate bytes SKILL-plan-blueprint writes its structured draft under the declared owner scope`
- `R28 mutating LLM skills emit attributable candidate bytes SKILL-compile-tests-from-docs writes a deterministic todo stub at its bounded path`
- `R28 mutating LLM skills emit attributable candidate bytes all three skills refuse to overwrite an existing deterministic candidate path`

Reason: fixtures and assertions still use `docs/framework/product`,
`docs/framework/arch/invariants`, and `packages/core/test/generated`. Production now
uses `product/`, `law/invariants`, and `packages/skills/tests/contract/generated`.
P5 must rebind those paths while preserving exact attribution and no-overwrite checks.

### `contract/skills-fingerprint-behavior.test.ts` — 1

- `R20 baseline: fingerprint + behavior corpus (52/52) A37 evidence / explicit N/A + behavior signatures match the baseline for every skill`

Reason: the relocated predecessor authority test harness rejects the sensor build
subprocess as `AUTHORITY_TEST_PROCESS_NOT_READ_ONLY`. P5 must use the successor
authority harness and then review the successor path-driven fingerprint baseline.

### `contract/skills-rendered-prompts.test.ts` — 1

- `R20 baseline: rendered outbound-payload corpus (52/52) payload sequences and classification match the baseline for every skill`

Reason: the same predecessor authority harness rejects the sensor build subprocess
before prompt capture. P5 must use the successor authority harness and review the
rendered successor corpus without weakening payload/classification parity.

## Verification

- Pre-defer: 25 files, 194 tests; 162 passed, exactly 32 failed.
- Retained P4 slice: 11 files, 111 tests; all passed.
- No source build failures: `pnpm --filter @devai-nyx/skills build` passed and staged
  the bundled constitution and prompt assets.
