---
adr_id: ADR-LOCAL-PUBLISH-WORKFLOW
title: Local-build publish workflow — deliberate local act, gh-pages branch, no CI
status: accepted
date: 2026-05-26
authors: ["@aarusso"]
tags: [round-13, docs, publish, gh-pages, cli, local-act]
---

# ADR-LOCAL-PUBLISH-WORKFLOW — the local-build → gh-pages publish contract

**Authority:** Architect.
**Related:** Constitution Article 6 (substrate authority-by-path; `docs/` and CLI verbs under `packages/cli/` are Architect-owned). Companion law: [`ADR-DOCS-GOVERNANCE.md`](ADR-DOCS-GOVERNANCE.md) (R13 W01, commit `cf714e7`) — establishes WHAT must publish (Decision 4: publish target = `gh-pages` branch in same repo); this ADR establishes HOW. Successor substrates: `packages/cli/src/commands/docs-publish.ts` (R13 W03, the verb) and `packages/sensors/src/docs-governance.ts` (R13 W04, the enforcement sensor).

## Status

Accepted on 2026-05-26 (R13 W02). Worker 03 implements the CLI verb against this contract; Worker 04 implements the enforcement sensor; Workers 05 and 06 exercise the verb on DEVAI's own docs as the canonical reference run.

## Context

GitHub Pages publishing in the wider ecosystem is conventionally automated via GitHub Actions: a workflow on `main` builds the site, then a third-party action (most commonly `peaceiris/actions-gh-pages`) force-pushes the build output to a `gh-pages` branch. The convenience is real — every merge to `main` produces a fresh site without any operator touch.

DEVAI rejects that convention deliberately. Per [`ADR-DOCS-GOVERNANCE`](ADR-DOCS-GOVERNANCE.md) Decision 4, the publish target is a `gh-pages` branch in the same repo as the source. That decision is the gate this ADR walks through: it establishes WHERE the build output lands; it explicitly delegates HOW to this companion ADR (see ADR-DOCS-GOVERNANCE Decision 4: "The mechanism — how the build artifact reaches the `gh-pages` branch — is the subject of the companion W02 ADR"). ADR-DOCS-GOVERNANCE Alternative (d) further rejects GitHub-Actions-driven publish on the operational ground that a publish failure that only manifests in a CI runner is worse than a failure the operator can iterate on locally.

Two further considerations frame the mechanism. First, Article 6 puts CLI verbs and docs substrates under Architect authority; a publish mechanism authored as a per-repo ad-hoc shell script is per-repo discretion, which is what ADR-DOCS-GOVERNANCE was authored to eliminate. The mechanism must be inherited from DEVAI, like every other DEVAI verb. Second, the framework's existing operational disposition is that humans run the loop deliberately: `devai render matrix`, `devai decision close`, and similar verbs all run locally with the operator watching their output. A publish step that bypasses that discipline by running on a CI runner the operator does not watch is inconsistent with how the rest of the framework operates.

This ADR specifies the mechanism. The CLI verb (W03) and the sensor (W04) ship the substrates that enforce it.

## Decision

Ten enumerated decisions. Together they specify the publish surface, the build-and-push pipeline, the branch convention, the prerequisite repo layout, custom-domain support, authentication, idempotency and safety gates, telemetry, the inheritance model, and the explicit prohibition on CI-driven invocation.

### Decision 1 — Publish surface: a DEVAI CLI verb

The publish surface is a new DEVAI CLI verb: `devai docs publish`. The verb lives in the `@devai-nyx/cli` package; adopters inherit it via the existing sibling-checkout pattern (the same pattern by which adopters today invoke `devai render matrix` and `devai decision close` from a sibling DEVAI checkout).

The verb is NOT a per-repo script. Adopters MUST NOT vendor a copy under `scripts/` or `bin/` in their own repo. The verb is NOT a GitHub Action. Adopters MUST NOT wrap the verb in a `.github/workflows/` job that runs it on CI infrastructure (see Decision 10).

A single source of truth — one verb in one repo — is the same discipline the rest of DEVAI's CLI surface obeys. It is what makes a successor change (e.g., changing the orphan-branch strategy) ship to every adopter in one commit on DEVAI rather than as N adopter-side migrations.

### Decision 2 — Build → publish: three-stage flow

The verb executes three stages in strict sequence. A failure at any stage aborts the run with a non-zero exit code; later stages do not run.

1. **Detect.** Read `.devai/config/project.json` and resolve `docs.builder` (per ADR-DOCS-GOVERNANCE Decision 2). The detect stage fails if `docs.builder` is absent, if it is inconsistent with `repo.kind` (e.g., `library` with `builder: jekyll`), or if `docs.publish_target` is not `gh-pages` in the same repo.

2. **Build.** Invoke the builder's canonical build command. Defaults, overridable by `docs.build_command` in `project.json`:
   - **Docusaurus** — `npm --prefix docs/site run build`. Expected output: `docs/site/build/`.
   - **Jekyll** — `bundle exec jekyll build -s docs/site -d docs/site/_site`. Expected output: `docs/site/_site/`.

   The build stage fails on non-zero builder exit. The verb does not attempt to interpret builder diagnostics; it surfaces them and exits.

3. **Publish.** Push the build output to the `gh-pages` branch in the same repo (origin remote). Use an orphan-branch strategy: the published commit has no parent, sharing no history with `main`. Each publish overwrites the branch tip via force-push. See Decision 3 for the branch contract and Decision 7 for the idempotency gates that fire before any push happens.

The strict-sequence rule means an operator never publishes a stale build: if detect fails, build does not run; if build fails, publish does not run. The verb is a single deterministic pipeline, not a collection of subcommands.

### Decision 3 — gh-pages branch convention

The branch contract is fixed and non-overridable:

- **Branch name.** `gh-pages` exactly. Not overridable per-repo. Cross-repo predictability — every adopter's site lives at the same branch name — is more valuable than per-repo flexibility on a name that no human reads anyway.
- **Contents.** ONLY the built site (the contents of the builder's output directory, copied to the branch root), plus a `.nojekyll` marker (so GitHub Pages does not run its own Jekyll processor over a Docusaurus build), plus an optional `CNAME` file when a custom domain is configured (Decision 5).
- **History.** Orphan. Each `devai docs publish` invocation produces a single commit with no parent. Force-push is permitted and is the normal case; history on `gh-pages` is not preserved. The docs lifecycle is single-source-of-truth via `main` (the docs source lives in `main`'s `docs/site/` subtree); `gh-pages` is a build artifact, not a history substrate.
- **Dry-run.** `devai docs publish --dry-run` outputs the planned push (branch, commit message, file count, total bytes) without invoking `git push`. The dry-run flag is for operator confidence on first runs and as a debugging aid; it is not a substitute for the build stage (which does run under `--dry-run`).

The orphan + force-push pattern is the canonical way to publish build artifacts to GitHub Pages without polluting `main`'s history. It is the strategy `peaceiris/actions-gh-pages` uses internally; this ADR adopts the strategy and rejects the tooling.

### Decision 4 — Repo-side prerequisites

Each adopter repo ships a builder-specific scaffold under `docs/site/`:

- **Docusaurus.** `docs/site/docusaurus.config.ts`, `docs/site/sidebars.ts`, `docs/site/package.json` with a `build` script, and the standard Docusaurus directory layout (`src/`, `static/`, `docs/` or content roots as configured).
- **Jekyll.** `docs/site/_config.yml`, `docs/site/Gemfile`, and the standard Jekyll layout.

The repo's primary `docs/` tree (ADRs under `docs/meta/adr/`, contracts under `docs/framework/contracts/`, schemas under `docs/framework/schemas/`, engineering under `docs/framework/arch/`, ops under `docs/meta/ops/`) **stays exactly where it is**. The site under `docs/site/` IMPORTS those existing markdown files via the builder's standard mechanism: Docusaurus's `customizeUrl` plugin pattern, symlinks, or include directives in the relevant builder.

Co-locating ADRs and the Docusaurus site at the same root would force every ADR file to acquire builder-specific front-matter (e.g., `sidebar_position`) and would let builder churn rewrite Architect-owned files. The `docs/site/` subtree is what the builder owns; the rest of `docs/` is governance substrate that builders consume but never modify.

### Decision 5 — Custom domain support

If `.devai/config/project.json` carries `docs.custom_domain` (a string with a valid domain name), the publish stage writes a `CNAME` file at the gh-pages branch root containing that value (no trailing newline beyond the canonical single LF). If the field is absent, no `CNAME` is written and any existing `CNAME` on the branch is overwritten away by the force-push (which is the intended behavior: removing the custom-domain config and republishing removes the CNAME).

The verb does not attempt to validate the domain DNS configuration; that is a GitHub Pages concern, surfaced through the GitHub web UI's Pages settings. The verb's responsibility ends at materializing the file.

### Decision 6 — Authentication: local git credentials only

The publish stage authenticates to the remote using the local user's git credentials — either an SSH key configured for `origin`, or `gh auth` credentials, or an HTTPS credential helper. The verb does NOT read a Personal Access Token from an environment variable. The verb does NOT prompt for a password.

The local-credentials posture is what makes the deliberate-local-act model coherent: a CI runner with a service-account token can be misused at scale; a developer's own SSH key cannot. CI integration is explicitly out of scope (Decision 10).

### Decision 7 — Idempotency and safety gates

Before any push happens, the publish stage runs four idempotency / safety gates. Each gate that fails aborts the run with a specific diagnostic; a `--force` flag toggles only the fourth gate (with an explicit warning printed to stderr).

1. **Working tree clean on `main`.** Refuse to publish if the working tree has uncommitted changes. A publish from a dirty tree could ship a docs version that the source-of-truth (committed `main`) does not reflect.
2. **`main` pushed to origin.** Refuse to publish if local `main` is ahead of `origin/main`. The same atomicity argument as ADR-DOCS-GOVERNANCE Decision 4: a `gh-pages` publish whose corresponding `main` commit is not on origin breaks the single audit trail.
3. **Builder exit code zero.** Refuse to publish if the build stage exited non-zero. Enforced by the strict-sequence rule of Decision 2; restated here as a safety property.
4. **Non-stomping.** Refuse to publish if `gh-pages` on origin has been advanced since the local commit baseline (some other operator or some past run published more recently than the local checkout knows about). Prevents an overlapping publish from a second operator on a second machine from silently overwriting the first. Bypassed only by `--force` with the explicit warning.

The gates are listed in execution order: detect failures land before build failures land before push failures. The `--force` flag explicitly does NOT bypass gates 1–3; a dirty tree, an unpushed `main`, or a failed build cannot be `--force`d past.

### Decision 8 — Telemetry

Per-publish telemetry, emitted at the end of the run regardless of outcome:

- `docs_publish_attempts_total` — counter, incremented once per verb invocation.
- `docs_publish_errors_total{stage=detect|build|publish}` — counter labeled by the stage that failed (or omitted on success).
- `docs_publish_duration_ms` — histogram (or gauge if histogram is not available), wall-clock duration of the full run.

Emit through `@stynx/logging` if a logger is configured in the runtime environment; fall back to a single stderr line in a parseable format otherwise. Telemetry is for operator-side metrics (how often does the publish fail? where?), not for cross-repo aggregation; no central collector is implied.

### Decision 9 — Inheritance: sibling-checkout, not vendoring

Adopters DO NOT copy the publish script into their repo. Adopters DO NOT add a dependency on a `@devai-nyx/docs-publish` package. The verb is invoked from a sibling DEVAI checkout, the same way `devai render matrix` and `devai decision close` are invoked today.

Concretely: the operator stands in the adopter repo's root directory and runs `<path-to-devai-checkout>/packages/cli/dist/bin.js docs publish` (or, via the shim that adopters already configure, simply `devai docs publish`). The verb reads the adopter's `.devai/config/project.json` to discover the builder and the publish target; it does not require any per-adopter installation or configuration step beyond the existing sibling-checkout setup.

The verb is the single source of truth. Every adopter that has the sibling-checkout setup automatically gets the latest publish semantics by pulling DEVAI's `main`.

### Decision 10 — CI integration: NOT permitted by default

Adopter repos MUST NOT add a `.github/workflows/` job (or any other CI runner job) that invokes `devai docs publish`. The publishing model is a deliberate local act; running it from CI defeats the operational discipline this ADR was written to establish.

Override requires a successor ADR. The successor must enumerate (a) what changed and why a deliberate-local-act is no longer the right discipline, (b) what supplementary safeguards replace the local-credentials gate, and (c) the migration path for adopters who already run the local verb. The bar is intentionally high: the W04 sensor MAY (in a future minor) flag the presence of a workflow file that invokes `devai docs publish` as a hard-fail finding, citing this decision.

The W04 enforcement boundary stops at the adopter repo's own files. DEVAI does not police what third parties do with the verb in their forks; the constraint binds adopters who declare themselves under DEVAI governance via `.devai/config/project.json`.

## Consequences

**Positive.**

- **No CI dependency for publishing.** Publishing works on the operator's machine with their existing git credentials. There is no token-scoping problem, no CI runner image to maintain, no third-party action with supply-chain surface to vet. A publish failure is debuggable where it failed, not in a CI runner the operator does not own.
- **Deliberate human-in-loop.** Every publish is a deliberate operator act. The four idempotency gates (Decision 7) catch the four most common ways a publish goes wrong; the gates run on the operator's machine where their output is visible. The discipline is the same one the rest of the DEVAI loop obeys.
- **Consistent across adopters via inheritance (Decision 9).** Every governed repo publishes the same way because they all invoke the same verb from a sibling DEVAI checkout. A successor change ships in one commit on DEVAI rather than as N adopter-side migrations. Article 6's authority-by-path discipline applies cleanly: the verb is Architect-owned in DEVAI; adopters consume it.

**Negative / trade-offs.**

- **No automatic preview deploys for PRs.** A common GH-Actions-driven pattern publishes a preview build to a per-PR subdirectory of `gh-pages`. The local-act model does not support this; an operator who wants to preview a PR's docs runs the builder locally and opens `docs/site/build/` in a browser. Mitigated by the fact that DEVAI's loop already runs deterministic local checks; a docs preview is one more local-run artifact, not a CI-rendered one.
- **Publisher must have local builder toolchain installed.** A Docusaurus publish requires Node.js and `npm`; a Jekyll publish requires Ruby and `bundler`. CI-driven publish would let operators publish without those toolchains present. Mitigated by the fact that any operator authoring docs is already running the builder locally to iterate on content; the publish step adds no toolchain requirement beyond what authoring already requires.
- **Concurrent publish from two operators requires care.** The non-stomping gate (Decision 7 gate 4) protects against silent stomping but cannot prevent two operators from racing each other through the gate. The deliberate-local-act model assumes publishing is rare and coordinated (one operator publishes per release, not per-merge), which is also the conventional GitHub Pages discipline for human-edited content.
- **No automatic notification of publish failure.** A CI-driven publish that fails posts to GitHub's checks UI; a local-act publish that fails surfaces only to the operator who ran it. Telemetry (Decision 8) captures the fact, but no broadcast happens. The trade-off is intentional: silent failure on CI is worse than visible failure on the operator's terminal.

## Alternatives Considered

**(a) GitHub Pages from `main/docs` folder.** Rejected. GitHub Pages can serve from a `/docs` folder on `main` directly, without any `gh-pages` branch. The setup is one toggle in the repo's Pages settings; no build step, no force-push.

Couples docs versioning to code releases: every docs change becomes a commit on `main`, every docs build is implicit at GitHub's render time (no Docusaurus / Jekyll preprocessing — just raw Markdown rendering), and the resulting site has none of the Docusaurus search / versioning / sidebar affordances that ADR-DOCS-GOVERNANCE Decision 2 requires for library repos. The pattern works for a flat README-as-site; it does not work for a library's API reference. Rejecting it preserves the builder requirement.

**(b) `peaceiris/actions-gh-pages` (or equivalent GH Action).** Rejected. The action does exactly what this ADR's CLI verb does — orphan-branch publish to `gh-pages` — but on a CI runner triggered by a workflow file. The convenience is undeniable; every merge to `main` publishes automatically.

Adds a CI dependency. Adds magic: the publish happens on infrastructure the operator does not own, with credentials (a service-account token) the operator does not see, in a workflow file that becomes the surface for any future drift. ADR-DOCS-GOVERNANCE Alternative (d) rejected GH-Actions publish on the operability ground (CI-runner debugging is worse than local debugging); this ADR's Decision 10 makes the prohibition explicit. The deliberate-local-act model is the antithesis of this convenience; the convenience is the cost.

**(c) Separate docs repo (e.g., `devai-docs`).** Rejected. ADR-DOCS-GOVERNANCE Alternative (e) rejected this option on the atomicity ground: a feature ships as a code-and-docs pair in one commit on `main` under the same-repo model; a separate docs repo splits `git log` and creates a synchronization problem. The publish mechanism inherits that decision — same-repo `gh-pages` is the publish target, and this ADR specifies how to reach it.

**(d) Per-repo ad-hoc publish scripts.** Rejected. Status quo before this ADR. Each repo's `scripts/publish-docs.sh` would drift independently; the law would be unenforceable (Decision 1's no-vendoring rule and Decision 9's sibling-checkout pattern exist to prevent this). Replaced by the single CLI verb.

## Affected Rules / References

- **[`ADR-DOCS-GOVERNANCE.md`](ADR-DOCS-GOVERNANCE.md)** (R13 W01, commit `cf714e7`) — the law this ADR's mechanism serves. Decision 4 of that ADR delegates HOW to this companion; Alternative (d) of that ADR rejects GH-Actions publish on operability grounds; this ADR's Decision 10 makes the rejection explicit and enforceable. Read both ADRs as a pair; one is law, the other is mechanism.
- **Constitution Article 6** (substrate authority-by-path) — establishes Architect authority over `docs/` and over CLI verbs under `packages/cli/`. This ADR exercises that authority for the publish mechanism.
- **Constitution Article 36** (DEVAI applies to itself) — DEVAI's own docs publish via this verb in W05/W06 as the reference implementation. A mechanism that cannot be exercised on the framework's own docs cannot legitimately constrain adopters.
- **`packages/cli/src/commands/docs-publish.ts`** (R13 W03, lands sequentially after this ADR) — the CLI verb that implements every decision above. Cited by path; the file exists after W03 commits.
- **`packages/sensors/src/docs-governance.ts`** (R13 W04, lands sequentially after this ADR) — the sensor that enforces ADR-DOCS-GOVERNANCE's law and (per Decision 10's note above) MAY enforce this ADR's CI-prohibition rule in a future minor. Cited by path; the file exists after W04 commits.
- **`.devai/config/project.json` schema** — read by the detect stage (Decision 2). `docs.builder`, `docs.build_command` (optional), `docs.custom_domain` (optional), `docs.publish_target` (validated to be `gh-pages` same-repo).
- **R13 worker prompts:** `align/devai/round-13/prompts/00-orchestrator.md`, `align/devai/round-13/prompts/01-docs-governance-adr.md`, `align/devai/round-13/prompts/02-local-publish-spec-adr.md` (this ADR's brief), `03-cli-verb-impl.md` (W03), `04-sensor-impl.md` (W04).
- **`peaceiris/actions-gh-pages`** — the GitHub Action this ADR explicitly rejects (Alternative b, Decision 10). Referenced for the orphan-branch strategy this ADR adopts; rejected for the CI-runner invocation pattern.
