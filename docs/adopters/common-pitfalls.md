# Common pitfalls

A short list of operational gotchas surfaced during DEVAI pilots. Read this if something behaves unexpectedly.

## GitHub Packages install returns 401/403

**Symptom.** Installing `@devai-nyx/cli` or another `@devai-nyx/*` package fails even though the DEVAI source repository is public.

**Cause.** GitHub Packages requires authenticated npm reads. The ambient `GITHUB_TOKEN` of a caller repository does not automatically gain cross-organization package access.

**Fix.** Configure the `@devai-nyx` scope for `https://npm.pkg.github.com` and supply a token authorized for the `devai-nyx` organization with `read:packages`. Never commit the token. For reusable CI where that credential is intentionally unavailable, use the D-121 sibling-checkout-build fallback.

## Pack tuning works in a checkout but not from npm

**Symptom.** Pack resolution or `--pack-tune` cannot find `examples/redox-pack-*` from an installed CLI.

**Cause.** Either an older `@devai-nyx/core` tarball predates bundled packs, or a custom package layout prevents package-relative discovery.

**Fix.** Upgrade to 0.4.0 or later and, if necessary, pass `--packs-root node_modules/@devai-nyx/core`. A sibling checkout can use `--repo-root /path/to/devai`. Verify the installed package contains `node_modules/@devai-nyx/core/examples/redox-pack-*/stack-adapter.json`.

## `pack-resolve` returns `no pack matched`

**Symptom.** `node "$DEVAI/packages/cli/dist/bin.js" pack-resolve --adopter-root <repo>` prints `matched_id: null` and zero candidates.

**Most common cause.** Your repo is a pnpm/Turborepo workspace where `@nestjs/core`, `@angular/core`, `react`, etc. live in `packages/*/package.json` or `apps/*/package.json` — not in the root `package.json`. The `package_dep_present` signal only inspects the root.

**Workaround (Phase 19.B).** The NestJS+Postgres+Angular pack already includes workspace-marker signals (`turbo.json`, `pnpm-workspace.yaml`, `dir_present packages-web`). If your repo doesn't trigger any of those either, add a new file/dir signal to the pack that hits your layout. This is an **Architect** edit to `examples/redox-pack-*/stack-adapter.json`.

## `sense api` finds zero controllers

**Symptom.** `sense api` exits with status `review`, finding 0 endpoints.

**Most common cause.** Your NestJS controllers live somewhere the sensor isn't scanning. The default scan walks the whole `--repo-root`; `--pack-tune` constrains it to the pack's `scan_dir` (default `apps/api/src` for the NestJS packs).

**Fix.** Either pass `--scan-dir <path>` explicitly, or extend the matched pack's `extractor_params.inventory_api.scan_dir`. If your monorepo has multiple backend apps (e.g. `apps/api1/src` + `apps/api2/src`), run `sense api` twice with different `--scan-dir` flags — pack params declare a single default, not a glob set.

## `sense data-model` finds zero tables

**Symptom.** `sense data-model --pack-tune` exits review with empty data-model body.

**Most common cause.** Your migrations live somewhere other than the pack default (`migrations`, `db/migrations`, `apps/api/migrations`). TypeORM auto-generated migrations frequently land at `apps/api/src/db/migrations/`.

**Fix.** Pass `--migration-dirs <csv>` explicitly. Multiple dirs supported: `--migration-dirs db/migrations,apps/api/src/db/migrations`.

## Experimental loop run can't acquire a worktree

**Symptom.** An explicitly activated experimental `loop run --experimental --write` fails with `lock_denied` or `WORKTREE_CAP exceeded`.

**Most common cause.** Stale worktrees from a previous run. The cap is 3 (per D-52); going over it is intentional — DEVAI refuses to spawn rather than thrash.

**Fix.** Preserve and inspect any experimental branch/worktree first. After human review, use `git worktree list` and the worktree runbook to remove only work explicitly approved for cleanup. The controller itself never destroys recoverable work.

## `docs synthesize` produces a stub

**Symptom.** `docs synthesize overview` exits clean but `docs/Overview.md` contains a one-liner like "synthesized in mock mode."

**Most common cause.** `DEVAI_LLM_BACKEND=mock` is set. The mock backend is intentionally stub-only for wiring verification and does not satisfy full-production readiness.

**Fix.** For a real synthesis, prefer the host CLI bridge: verify `claude --version` or `codex --version` succeeds, then leave `DEVAI_LLM_BACKEND` unset or set it to `claude-cli` / `codex-cli`. SDK backends also work with `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` and a budget cap such as `DEVAI_LLM_BUDGET_USD=2.00`.

## Per-worktree DB confusion

**Symptom.** Two parallel tasks see each other's data; a migration runs twice; database is in an unexpected state.

**Cause.** The per-task DB convention (one Postgres database per worktree) is documented but not yet fully automated. Phase 9.B+ shipped the substrate; full per-task DB isolation requires the operator to use `--with-db` flags consistently.

**Fix.** Read [../meta/ops/lock-runbook.md](../dev/operations/lock-runbook.md) and [../meta/ops/loop-runbook.md](../dev/operations/loop-runbook.md). Until you've internalized those, prefer running one task at a time.

## Evidence chain is "broken" after manual file ops

**Symptom.** `evidence-verify` fails with "manifest_hash mismatch" or "chain link broken at X".

**Most common cause.** You hand-edited a record in `record/proofs/chain.json` (it's tempting; don't). The chain is hash-chained per Article 32 — any mutation invalidates every downstream record.

**Fix.** Restore the file from git. If the corruption is in a record you don't have a clean copy of, the recovery path is `devai evidence redact <id>` (Phase 17.J) which re-links downstream records explicitly. Don't try to repair by hand.

## `spec validate-all` fails after adding an invariant

**Symptom.** New invariant under `law/invariants/INV-...json` validates as JSON Schema but `spec validate-all` reports `action-coverage` errors.

**Cause.** Phase 9.G's action-coverage gate: every CLI action must be claimed by at least one invariant via `measurable_via`. If your new invariant cites a CLI action that doesn't exist, OR if it doesn't cite any actions, the gate fails.

**Fix.** Ensure each `measurable_via` entry names a real action (check `devai catalog actions`). If the invariant is intentionally non-CLI-measurable, the convention is to file it with `severity: info` and explicitly document why in the invariant body.

## Pack templates don't render

**Symptom.** `SKILL-scaffold-ui` returns `status: skipped` with note "no templates consumed by 'SKILL-scaffold-ui'".

**Cause.** The matched pack has no `templates.ui.*` registered. Currently only `redox-pack-nestjs-postgres-angular` ships UI templates; the other packs (including the React variant) have empty UI template sets pending follow-on work.

**Fix.** Either author the UI templates for your stack (under `examples/redox-pack-*/templates/ui/`) and register them in the pack's `templates` field, or scaffold UI manually for now.

## CI passes locally but fails in GitHub Actions

**Symptom.** All gates green locally; the `ci.yml` workflow fails.

**Most common cause.** Local environment has stale generated types or a build cache. CI starts from a fresh checkout.

**Fix.** Run `pnpm clean && pnpm install --frozen-lockfile && pnpm build && pnpm test && pnpm test:integration` locally. If that passes, push and the CI should pass too. If it still fails, check the workflow log for the first red step (usually a missing env var or a Node version mismatch).

## Phase A landmines

The C-4 stynx adoption pilot (closed at stynx `fc5e249`, retro at `../stynx/docs/devai-phase-a-retro.md`) ran into three predictable but non-obvious adopter-ergonomic snags during DEVAI bootstrap. Phase 20.E ships templates for each; this section documents what to watch for.

### Commit-format collision (D-A-4)

**Symptom.** Your adopter repo uses [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope): subject`) and a husky pre-commit hook running `@commitlint/config-conventional`. DEVAI's per-batch convention is role-prefixed (`Architect: 20.E — ...`). The hook rejects every DEVAI-style commit (no matching type, uppercase subject, missing scope).

**Fix.** Drop in [`templates/commitlint.config.cjs`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/templates/commitlint.config.cjs) — it accepts both shapes via a unioned `headerPattern`. The five DEVAI roles (Owner / Architect / Engineer / Inspector / Auditor) become valid alongside the conventional types. Splice the rules into your existing config if you already have one.

Until the template lands, you can encode the role in a `chore(repo)` scope + body:

```
chore(repo): A.2 — devai init apply-f5 --as-role architect --write

Role: Architect.
```

The stynx pilot used this workaround for the seven Phase A commits — it works, but the role declaration is buried in the body rather than the subject line.

### lint-staged rewrites hash-chained evidence (D-A-5)

**Symptom.** `record/proofs/chain.json` (Article-32 hash-chained ledger) is staged alongside other files. `lint-staged` runs `prettier --write` against every staged JSON, reformatting the chained record. The next `devai chain verify` flags the file as tampered because the canonical-JSON hash no longer matches.

**Why it matters.** The evidence chain is the auditor-trustworthy record DEVAI produces. A chain break means the substrate's central guarantee — every state mutation has a verifiable predecessor — is gone, and the only way to recover is to rebuild the chain from scratch. That's expensive on a real adopter repo and forensically lossy.

**Fix.** Apply both:

1. [`templates/.gitattributes`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/templates/.gitattributes) — marks `record/proofs/**` as `linguist-generated=true -text` so Git tooling treats the directory as opaque.
2. [`templates/lint-staged-snippet.md`](./templates/lint-staged-snippet.md) — `.prettierignore` + `lint-staged` config skipping `record/proofs/**`.

Phase A only adds new state files (no existing record is rewritten), so the chain stays intact during bootstrap even without these — but as soon as your team's autonomous loop is running and the same evidence record is touched by multiple commits, the hazard becomes a real one.

### Workspace tooling needs `PNPM_HOME` on PATH

**Symptom.** `pnpm link --global` for the DEVAI CLI succeeds; `devai` then doesn't resolve on PATH unless you set `PNPM_HOME` per command.

**Fix.** Append the standard pnpm setup lines to your shell rc:

```bash
export PNPM_HOME="$HOME/Library/pnpm"   # or ~/.local/share/pnpm on Linux
export PATH="$PNPM_HOME:$PATH"
```

Or run `pnpm setup`, which writes the equivalent lines.

This is a pnpm setup quirk, not a DEVAI bug — but it's the first thing every adopter hits.

## LLM call timeouts and per-skill defaults

**Symptom.** `devai experimental loop run --family claude --max-iterations 1` (with `DEVAI_LLM_BACKEND=claude-cli`) escalates the task with `claude-cli call timed out after Nms (pre-flight probe succeeded)`. The pre-flight `claude --version` probe passes — the binary is on PATH and authenticated — but the actual LLM prompt call doesn't return in time. Adding more files to the prompt makes it worse.

**Why it matters.** The autonomous loop's `SKILL-feedback-iteration` invocation has high p95 latency against any non-trivial Engineer task. The `claude-cli` OAuth flow + host-CLI's own model selection + prompt-caching adds 3-5x overhead vs. the direct-API path. The pre-25.C defaults were tuned to the direct-API case; substantive iterations against real codebases via claude-cli routinely exceeded them.

**Fix.** Phase 25.C raised the per-skill defaults and added a backend-aware multiplier that scales the per-skill default by 3x when the resolved LLM family is `claude-cli` or `codex-cli`. The new effective defaults:

| Skill                                                  | claude-cli OAuth p95 | Direct-API (Sonnet) p95 | Base default (25.C) | claude-cli effective (3×) |
| ------------------------------------------------------ | -------------------- | ----------------------- | ------------------- | ------------------------- |
| `SKILL-feedback-iteration`                             | 25–35 min            | 3–8 min                 | **1800s** (30min)   | **5400s** (90min)         |
| `SKILL-fix-lint` / `-build` / `-test` / `SKILL-triage` | 5–15 min             | 1–3 min                 | **900s** (15min)    | **2700s** (45min)         |
| `SKILL-write-*` writers                                | 5–12 min             | 1–3 min                 | **900s**            | **2700s**                 |
| `SKILL-assess-state`                                   | 1–3 min              | 30–90s                  | **300s** (5min)     | **900s** (15min)          |
| default (unknown skill)                                | —                    | —                       | **300s**            | **300s** (not multiplied) |

Latency numbers above are 95th-percentile observations against the stynx C-4 pilot's adoption arc (47 commits, 2026-05 timeframe). Your numbers will vary — measure against your own workload and override per-skill via the pack-config registry if needed.

### Override precedence

Resolved at LLM-call time, high → low:

1. **Caller `opts.timeout_ms`** — the skill code itself passes a per-call value (rare; reserved for unusual within-skill needs). Bypasses the multiplier.
2. **CLI flag `--llm-timeout-ms <n>`** — per-invocation override on `loop-run`, `skill-run`, `docs-synthesize`. Bypasses the multiplier (you set an absolute value, the framework honours it).
3. **Pack config `extractor_params.llm.llm_timeouts: {[skillId]: ms}`** — adopter-pack-tuned per-skill values. Bypasses the multiplier (your pack values are already adopter-tuned absolutes).
4. **Per-skill default × backend multiplier** — the table above.
5. **Writer-default × backend multiplier** — for any skill id matching the `SKILL-write-*` prefix.
6. **Global fallback** — 300s, unscaled.

On timeout, the error message names the source verbatim — e.g.

```text
claude-cli call timed out after 5400000ms (pre-flight probe succeeded). The CLI is on PATH but did not return in time — consider increasing --timeout-ms or simplifying the prompt. Source: built-in default for SKILL-feedback-iteration (5400000ms × 3x backend multiplier (base 1800000ms)). To increase, retry with --llm-timeout-ms 7200000 (next step) or set extractor_params.llm.llm_timeouts.SKILL-feedback-iteration = 7200000 on your stack-adapter pack.
```

The next-step suggestion (`--llm-timeout-ms 7200000` above) walks the `[60s, 120s, 300s, 600s, 1800s, 3600s]` ladder by default; for values already above 3600s, it doubles.

### Tuning the multiplier off

If you're running against a fast direct-API backend (e.g. Sonnet 4.6 via `ANTHROPIC_API_KEY`) but DEVAI's family-detection picks the wrong family, the easiest override is the pack-config registry — set explicit absolute values for each skill and they bypass the multiplier entirely. There is no separate switch to disable the multiplier independently from the per-skill default; that conflation is intentional (the multiplier is the empirically-validated correction for CLI-bridge latency, not a knob).

### Phase history

- **24.C** introduced the per-skill default registry + `--llm-timeout-ms` CLI flag + `llm_timeouts` pack config key + the `TimeoutResolverWrapper` precedence chain. Initial defaults were tuned to the direct-API case.
- **25.C** raised the defaults to reflect claude-cli OAuth p95 latency and added the backend-aware multiplier. See [D-73](../../law/adr/README.md) / [D-74](../../law/adr/README.md) and stynx U2's verification of TASK-0005 for context.

## Estimating coverage burn-down effort: read src/ before counting tests

**Symptom.** You're about to flip F3×T2 (`sense-test-coverage-depth`) from REVIEW to PASS by raising sub-80% packages over the threshold. The natural recon — read each package's existing aggregate coverage + integration spec layout, classify "has int suite vs. doesn't," estimate hours — produces effort numbers that turn out to be 2–3× too high once you start executing.

**Why it matters.** The wasted budget is real. The C-4 stynx pilot's U15 recon (`../stynx/docs/pilots/c-4/phase-i-retro.md` §25) classified `packages/backend` at ~6–8 hr and `packages/flow` at ~5–7 hr on the premise that both needed an integration scaffold against testcontainers. Actual execution (U17–U20, commits `7ad00e2` + `03b5669`) shipped backend → 84%, audit → 91%, flow → 81% with **zero integration infrastructure** in ~2–3 hr each.

**Cause.** "Doesn't have an int suite" is doing two unrelated jobs at once:

- **(a)** _concrete IO instantiation in src/_ — `new Pool(...)`, `new CognitoIdentityProviderClient(...)`, `createClient(...)`, `new Redis(...)`. Mockable only by either spinning real infra (testcontainers / localstack / etc.) or wrapping each call site at test time. High effort.
- **(b)** _interface-injected IO in src/_ — every external dependency arrives via a small typed interface in the constructor (`PgQueryableClient`, `SqlExecutor`, `AuditSink`, `FlowDomainAdapter`, etc.). Mockable with a trivial in-test stub. Low effort.

`sense-test-coverage-depth` measures the coverage percentage and the redox-pack tunes the threshold, but neither sensor nor pack distinguishes (a) from (b). Both get filed as "no int suite" and estimated as if (a).

**Heuristic to apply before estimating.** Before assigning hours to a sub-threshold package, grep its `src/` tree once:

```sh
# Concrete-instantiation smell (category (a) — needs real infra or call-site wrapping):
rg -n 'new \w*Client\(|new Pool\(|new Redis\(|createClient\(' packages/<pkg>/src

# Interface-injection smell (category (b) — mockable-unit territory):
rg -n 'constructor\([^)]*\b[A-Z]\w+(Client|Adapter|Sink|Executor|Registry|Factory|Repository)\b' packages/<pkg>/src
```

If the first command returns nothing and the second returns hits in most files, you're in (b): estimate at the **mockable-unit** rate (~2–3 hr/package) regardless of the absent integration suite. If the first command returns hits, you're in (a) and the original estimate stands.

**Fix.** Apply the heuristic at recon time. Re-classify (b) packages off the int-suite track before you commit to hours; the test plan in those cases is mocked-interface unit specs and is almost always cheaper than the int-suite plan would have been.

**Why this isn't (yet) a sensor.** A `sense-plant-testability` sensor that classifies each package as (a)/(b) and feeds an effort-estimation skill is the natural full solution. DEVAI hasn't shipped it because the signal currently rests on a single adopter (C-4 stynx) and a single coverage burn-down. The framework's policy after the substrate-expansion trilogy (Phases 26–28) is to defer new substrate until corroborating evidence accumulates; a second adopter hitting the same shape — or a third package within stynx where the heuristic above proves wrong in the same direction — is the trigger to promote this from adopter guidance to a sensor. Track here until then.

## Further reading

- [../meta/ops/](../dev/operations) — the runbooks for evidence chain, locks, worktrees, the autonomous loop.
- [../meta/security/](../dev/security) — forbidden-action surfaces, threat model.
- [`law/adr/README.md`](../../law/adr/README.md) — every canonical "why is this like that" answer.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/common-pitfalls.md (classification CURRENT).
