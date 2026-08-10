# Versioning policy

**Scope:** the release contract for `@devai-nyx/*` and what it obligates adopters to do on each release. Per D-118 (canonical consumption model, machine-managed `devai_version`) and D-122 (item 2c: closing the versioning-policy gap D-118 left open).

## The contract

`@devai-nyx/*` (cli, core, effects-check, schemas, sensors, utils) versions and releases together as a fixed Changesets group. The six packages always carry the same version number.

Release preparation and publication are deliberately separate:

1. Before the version PR, an Architect-authored source commit must already
   contain a matching stable Docusaurus snapshot and release metadata whose
   package/Constitution versions agree with the candidate release. The version
   PR cannot manufacture or revise that documentation snapshot.
2. A human-supervised maintainer runs `pnpm changeset version` locally, stamps DEVAI's own `.devai/config/project.json` `devai_version` pin to the resulting fixed-group version, and runs `scripts/rematerialize-release-authority-policy.mjs` as Architect with an explicit ISO timestamp. The command changes only the policy/package version binding and canonical materialization receipt. The maintainer then opens an ordinary version PR, which passes the same `build-and-test` check as every other PR.
3. CI accepts the absence of pending changesets only when the diff is structurally a version-only release and its resulting Git tree is byte-identical to the deterministic release replay from the base commit in a disposable worktree. The replay runs `changeset version` using the validator checkout's installed runtime only when its pnpm installation snapshot exactly matches `pnpm-lock.yaml`, so Changesets resolves the same optional formatter and repository configuration as the canonical command. It then performs the same self-pin update and imports the already-validated, schema-compatible authority-policy rematerialization from the candidate. All six fixed packages must carry equal, increasing versions; all six manifests and changelogs must change (the first fixed-group release of a package may add its changelog); DEVAI's self-pin must make that exact old-to-new transition without changing any other project configuration; the policy must bind that same version and preserve every rule/source byte; at least one changeset must be deleted; and no source, workflow, documentation, or other path may be present. The self-pin and authority policy are the only required non-Changesets paths because Article 36 requires both `devai doctor` and the binding authority runtime to remain true on the candidate tree.
4. After that PR merges, `release.yml` validates the version-only merge and its
   pre-existing docs snapshot again, builds, and runs `pnpm changeset publish`
   with the explicit `NPM_TOKEN` secret. It never falls back to the ambient
   `GITHUB_TOKEN` for package publication.
5. The release workflow verifies that all six package tags point at the validated release commit and atomically pushes any missing tags. A rerun is idempotent; a conflicting local or remote tag fails closed.
6. Package publication and site publication are separate Owner-authorized
   operations. After a package release, `devai docs publish` must publish the
   already-reviewed matching snapshot; `sense site drift` fails when release
   truth has moved beyond deployed Pages truth.

This split is intentional. Pull requests created or updated with a workflow's ambient `GITHUB_TOKEN` do not execute the repository's required `pull_request` workflow, which deadlocks an automated Changesets version PR against the `build-and-test` branch-protection requirement. Version PR authorship therefore stays on the normal human-authorized path; automation begins only after the reviewed version commit reaches `main`.

`NPM_TOKEN` must be a GitHub Packages credential with `write:packages` for the
`devai-nyx` organization. Pre-round W0's supervised 0.6.0 publication exercised
that capability successfully. The secret is guarded for non-empty presence
without printing it and is used only in the publication step. Repository tag
pushes use the workflow-scoped `GITHUB_TOKEN` with `contents: write`; they do
not need to trigger another workflow. The current workflow creates package
tags, not GitHub Release objects.

- **Pre-1.0 minor bump = a release-train boundary.** It may be additive or intentionally breaking while DEVAI remains pre-release. Breaking changes require an explicit migration guide, an exhaustive machine-readable map where applicable, and release notes that name the removed contract. DEVAI 0.5 follows this rule for the CLI reorganization.
- **Post-1.0 minor bump = additive.** New CLI verbs, optional schema fields, advisory `devai doctor` checks, and new sensor kinds must leave adopters on the preceding minor operational.
- **Major bump = breaking after 1.0.** State-shape changes under `record/proofs/`, config-shape changes under `.devai/config/`, removed or renamed CLI verbs, or a schema field becoming required. A major release ships `devai adopt upgrade` migration steps covering the specific state/config changes.
- **Patch bump** = everything else (bug fixes, doc-only changes, internal refactors with no observable contract change).

Before 1.0, DEVAI uses the minor number as its compatibility boundary in accordance with SemVer's initial-development rules. After 1.0, a required state/config change is major regardless of diff size.

## The constitution-version rule

Every release's CHANGELOG entry names which `law/constitution.md` version ships in that release. This is the machine-checkable half: `devai doctor`'s `constitution-binding` check (D-119) already verifies an adopter's pinned `constitution.version` against the vendored copy's own header, and flags (advisory) when the pin lags what the currently-installed `@devai-nyx/core` would resolve via `devai adopt upgrade --constitution`. The CHANGELOG rule exists so a human reading release notes never has to separately go look up "did this release also bump the constitution" — it's stated inline, every time, whether or not the constitution actually moved in that release (a release that doesn't touch it says so: "constitution: unchanged, still v0.3.0").

## Consumption model and "which devai am I running"

Canonical consumption is versioned GitHub Packages (D-118) — `@devai-nyx/cli` installed as a normal pinned dependency. Sibling-checkout linking (`pnpm link --global`, the C-4 reference-adopter pattern) remains supported but must be declared: `devai_consumption: "sibling-checkout"` in `.devai/config/project.json` (D-122, item 2b). Absence is assumed `npm-package`; `devai doctor`'s `devai-consumption-declared` check compares the declaration against the CLI's actual resolved provenance and fails on an undeclared mismatch — most commonly a repo that's silently drifted onto a sibling-checkout link without saying so.

GitHub Packages requires authenticated npm reads even when the corresponding source repository is public. Cross-organization callers cannot assume their ambient `GITHUB_TOKEN` can read `devai-nyx` packages; installation needs a token authorized for that organization with `read:packages`. The D-121 reusable-evidence workflow intentionally retains a public sibling-checkout-build path when that package credential is unavailable.

Starting with 0.4.0, `@devai-nyx/core` carries the canonical `examples/redox-pack-*` tree. Runtime discovery is package-relative and normally zero-flag; custom layouts may pass `--packs-root node_modules/@devai-nyx/core`. `@devai-nyx/schemas` likewise exposes raw schemas at `@devai-nyx/schemas/schemas/*.json` in addition to its root validators API.

For either consumption model, "which devai am I running" is always answerable from `devai doctor`'s `devai-version-match` check output:

- **npm-package**: `info.pinned` (the repo's declared `devai_version`) vs `info.running` (the installed package's actual version) — binding at tier3, advisory below.
- **sibling-checkout**: `info.provenance.git_sha` — the exact commit of the sibling checkout currently in effect, independent of whatever `devai_version` happens to be pinned (that field is decorative for this consumption mode; only the SHA is load-bearing).

## Upgrading

```bash
devai adopt upgrade --from <installed-version> --to <target-version>   # plan-only by default; --write --force to apply
devai adopt upgrade --constitution                                     # refresh the vendored constitution + pin independently
devai adopt upgrade --profile <tier>                                   # emit the climb checklist for an adoption-tier bump
```

The three `upgrade` modes are independent — a major CLI-version bump, a constitution refresh, and a profile climb are three separate decisions that don't have to land in the same commit.

## See also

- D-118 (`devai_version` machine-managed, canonical consumption model), D-119 (constitution binding), D-122 (provenance tracking, `devai_consumption` declaration).
- [`local-evidence-runbook.md`](./local-evidence-runbook.md) — the other D-117-family mechanism this policy doc's neighbors document.
- `CHANGELOG.md` — where the constitution-version rule is applied in practice.
