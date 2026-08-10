# Install path

Goal: from "I have a repo and want to try DEVAI" to "every gate is green against my unmodified repo," in 15–30 minutes.

## Prerequisites

| Tool                    | Minimum | Notes                                                                                               |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| Node.js                 | 24.0    | Pinned in `engines.node`.                                                                           |
| pnpm                    | 9       | Other managers detected but unsupported.                                                            |
| git                     | 2.40    | Worktree subsystem needs modern `git worktree`.                                                     |
| Postgres                | 15      | Full-production readiness assumes `postgresql://$USER@localhost:5432/devai_test` or `DEVAI_DB_URL`. |
| `claude` or `codex` CLI | Current | Full-production docs synthesis uses a real host LLM bridge by default.                              |

## Step 1 — Install DEVAI

The supported consumption model is a pinned `@devai-nyx/cli` dependency from GitHub Packages. Add the following project-level `.npmrc`; it names the registry and reads the credential from the environment without storing the token in the repository:

```ini
@devai-nyx:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Load a token authorized for the `devai-nyx` organization with `read:packages`, then resolve the current published CLI and save that resolved version exactly:

```bash
export NODE_AUTH_TOKEN='<read-packages-token>'
pnpm add -D --save-exact @devai-nyx/cli@latest
```

`@latest` is consulted only during this install. `--save-exact` and the generated lockfile pin the selected version for subsequent reproducible installs.

Verify the binary is reachable:

```bash
pnpm exec devai --version
```

GitHub Packages requires authentication for npm reads even when the source repository is public. A caller repository's ambient `GITHUB_TOKEN` generally cannot read packages across organizations; use `NODE_AUTH_TOKEN` with a `read:packages` token authorized for `devai-nyx`. Never commit the token or a rendered credential-bearing `.npmrc`. A sibling checkout remains a development-only convenience when working on DEVAI itself.

## Step 2 — Verify DEVAI itself

Package consumers verify the installed CLI and their adopter posture:

```bash
pnpm exec devai --version
pnpm exec devai doctor --adopter --repo-root . --format human
```

DEVAI contributors use the repository's full gate chain; adopters do not need the DEVAI source checkout merely to validate their installation.

## Step 3 — Point DEVAI at your repo

DEVAI commands take an explicit `--repo-root` (the adopter repo) or `--adopter-root` (where applicable). Bundled packs resolve automatically from the installed `@devai-nyx/core` package.

```bash
pnpm exec devai adopt pack resolve \
  --adopter-root . \
  --format human
```

If package-relative discovery is unavailable in a custom install, pass `--packs-root node_modules/@devai-nyx/core`. A sibling DEVAI checkout may be passed explicitly during framework development.

Expected output: one matched pack with the stack family that fits your repo (e.g. `redox-pack-nestjs-postgres-angular`). If you see `no pack matched`, jump to [pack-resolution.md](./pack-resolution.md) — the existing detect signals may need widening.

## Step 4 — Declare your role

Before touching anything substantive, decide which authority you're operating under. The five-role authority model is summarized in [role-declaration.md](./role-declaration.md). For most first-time adopters, the answer is **Engineer** (code under `packages/`) or **Architect** (spec/schema/docs work).

## Step 4.5 — Confirm the LLM backend

DEVAI runs against five LLM-backend families: `claude-cli` and `codex-cli` (host CLI bridges that inherit your OAuth session), `claude` and `codex` (SDK; require API keys), and `mock` (explicit hermetic wiring mode). When `DEVAI_LLM_BACKEND` is unset, DEVAI checks `.devai/config/llm.json`, then prefers `claude-cli`, then `codex-cli`, and falls back to `mock` only when no natural real provider is available.

| Backend      | When to use                                                                                                                                                           | Setup                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-cli` | Default production path when the Claude Code CLI is installed and logged in.                                                                                          | Verify `claude --version` succeeds. `DEVAI_LLM_BACKEND` may be omitted or set to `claude-cli`. The host CLI's `--max-budget-usd` flag is honoured if `.devai/config/llm.json` sets `max_budget_usd_cli`. |
| `codex-cli`  | Default production fallback when `claude` is absent and the `codex` CLI is installed and logged in.                                                                   | Verify `codex --version` succeeds. `DEVAI_LLM_BACKEND` may be omitted or set to `codex-cli`.                                                                                                             |
| `claude`     | Production synthesis with your own Anthropic API key + budget cap.                                                                                                    | `export ANTHROPIC_API_KEY=…; export DEVAI_LLM_BUDGET_USD=1.00; export DEVAI_LLM_BACKEND=claude`                                                                                                          |
| `codex`      | Production synthesis with your own OpenAI API key + budget cap.                                                                                                       | `export OPENAI_API_KEY=…; export DEVAI_LLM_BUDGET_USD=1.00; export DEVAI_LLM_BACKEND=codex`                                                                                                              |
| `mock`       | Wiring verification and deterministic hermetic runs only. Writer skills emit deterministic stub markdown labelled "Mock backend output for wiring verification only." | `export DEVAI_LLM_BACKEND=mock`. Mock runs do not satisfy full-production readiness.                                                                                                                     |

Run `node "$DEVAI/packages/cli/dist/bin.js" doctor --format human` to surface which bridges are available on your machine — the `llm-bridges` row reports `claude-cli` / `codex-cli` presence + version + usability, with an actionable hint per family. This is the recommended way to confirm CLI-bridge wiring before pointing `docs synthesize` at it.

The CLI bridges are the easiest onboarding path: an adopter who already uses Claude Code interactively can adopt DEVAI without managing a second credential. Auth, rate limiting, and per-call cost reporting are delegated to the host CLI; DEVAI records the envelope's `usage` and `total_cost_usd` in `record/proofs/llm-usage.jsonl` exactly as it does for the SDK families.

## Step 4.6 — Check your adopter health with `devai doctor`

Phase 21.B (closes D-A-9) split `devai doctor` into three postures so adopters get useful signal instead of by-design false-positives. Run:

```bash
pnpm exec devai doctor --format human --repo-root /path/to/your/repo
```

The default behaviour (`--auto`) sniffs the repo-root: if it has DEVAI's monorepo shape (both `packages/cli/src/bin.ts` and `examples/redox-pack-*` directly under it), doctor picks `--self` and runs the full self-check set. Otherwise it picks `--adopter` and runs the subset that applies to adopter repos (the live run is authoritative if this table drifts):

| Check                        | Adopter | Notes                                                                                                                                                                                        |
| ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspace-layout`           | —       | DEVAI-self-only (checks `packages/{cli,core,...}`).                                                                                                                                          |
| `f1-paths-present`           | ✓       | Adopter version checks the substrate roots the role-separated `init apply-owner` and `init apply-architect` segments seed; framework schemas are consumed from `@devai-nyx/schemas`.         |
| `schemas-loadable`           | —       | Cascades from above.                                                                                                                                                                         |
| `constitution-symlink`       | ✓       | Requires `.devai/constitution.md` to exist and point at a valid `law/constitution.md`. Phase 21.D relaxes the accepted shapes for adopters (symlink to sibling devai or plain-file pointer). |
| `agents-claude-sync`         | ✓       | Adopter must ship a `CLAUDE.md` and `AGENTS.md` at repo root referencing Constitution Article 6, the five role names, and the canonical reading-order sources.                               |
| `chain-dir-writable`         | ✓       |                                                                                                                                                                                              |
| `evidence-chain-valid`       | ✓       |                                                                                                                                                                                              |
| `llm-bridges`                | ✓       |                                                                                                                                                                                              |
| `docs-governance`            | ✓       | Requires `.devai/config/project.json` with `repo.kind` and `docs.builder` declared.                                                                                                          |
| `devai-version-match`        | ✓       | Declared `devai_version` must match the CLI actually resolving (D-118).                                                                                                                      |
| `constitution-binding`       | ✓       | Vendored-copy constitution binding shape (D-119); pointer-only cannot satisfy tier3.                                                                                                         |
| `devai-consumption-declared` | ✓       | `devai_consumption` declared in project config (D-122) — ends sibling-linking as a silent default.                                                                                           |

If you want to force a posture (e.g. you're auditing the DEVAI checkout from inside an adopter cwd, or vice versa), pass `--self` or `--adopter` explicitly. The three flags are mutually exclusive; supplying more than one is a usage failure (exit 2, before any side effect — the 0.5 contract).

A freshly bootstrapped adopter plus a `CLAUDE.md`, `AGENTS.md`, and materialized authority policy should pass all binding checks under `--adopter`. Do not pin a check count; supported checks are additive.

## Step 5 — Pick a path: brownfield or greenfield

- Existing repo: run `sense inventory` after explicit initialization.
- New module: use the bounded `devai-scaffold` recipe variant.

Both paths converge: `devai spec blueprint diff <spec> --against <repo>` compares a blueprint against a brownfield inventory. The same substrate handles both.

## Common install hiccups

- `pnpm install` fails with peer-dep warnings: ensure pnpm version ≥ 9. Older pnpm has stricter peer resolution.
- `pnpm test` reports `Class extends value [object Module]`: typecheck/build wasn't run first. `pnpm gen-types && pnpm build` resolves it.
- `pnpm exec devai` shows "command not found": confirm `@devai-nyx/cli` is installed in the current workspace and the GitHub Packages token has `read:packages`.

Use `devai doctor` and focused checks to diagnose setup failures.
