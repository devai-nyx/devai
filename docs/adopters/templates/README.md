# Adopter templates

Drop-in artifacts for adopter repos. Phase 20.E (closes the C-4 stynx-pilot retro findings D-A-4 + D-A-5).

| File | Purpose | Closes |
|---|---|---|
| [`commitlint.config.cjs`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/templates/commitlint.config.cjs) | Accepts both DEVAI role-prefix subjects (`Architect: ...`) and Conventional Commits. Drop in or splice the rules into an existing config. | D-A-4 |
| [`.gitattributes`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/docs/adopters/templates/.gitattributes) | Marks `record/proofs/**` as `linguist-generated` + disables line-ending normalization so Git tooling doesn't rewrite hash-chained evidence records. | D-A-5 |
| [`lint-staged-snippet.md`](./lint-staged-snippet.md) | `.prettierignore` + `lint-staged` config snippets that skip `record/proofs/**`. | D-A-5 |

## Why these are templates and not committed defaults

DEVAI installs into the adopter repo as a sibling checkout — it does not own the adopter's tool config (commitlint, husky, prettier, lint-staged, etc.). Each adopter's preexisting policies vary, and overriding them silently would be a category mistake. These templates document the minimum set DEVAI's substrate needs (commit-format compatibility + ledger protection) without mandating how an adopter wires them.

If you're starting a fresh adopter repo and have no opinionated commit/lint config yet, the simplest path is:

```bash
cp $DEVAI/docs/adopters/templates/commitlint.config.cjs ./commitlint.config.cjs
cp $DEVAI/docs/adopters/templates/.gitattributes ./.gitattributes
# Then splice the lint-staged-snippet.md content into your config.
```

If you already have `commitlint.config.cjs` or `.gitattributes`, splice the relevant lines instead. Both files are designed to merge cleanly with conventional defaults.

## How `commitlint.config.cjs` is wired (Phase 21.F note)

The template deliberately disables five rules inherited from `@commitlint/config-conventional`: `type-empty`, `type-enum`, `scope-empty`, `scope-enum`, and `subject-case`. This is intentional. The `parserOpts.headerPattern` regex IS the gate — a commit either matches one of two unioned branches (DEVAI role-prefix OR Conventional Commits) or it fails parsing entirely. The disabled rules would otherwise fire spuriously against the role-prefix branch because their `type` capture is undefined when that branch matches.

This pattern was discovered during the C-4 stynx pilot's Phase G (governance retirement) when the original Phase-20.E template hit `type-empty: never` rejections against DEVAI-shape commits. The fix landed in stynx's `tools/repo-config/commitlint.config.cjs` and was absorbed back into the DEVAI template at Phase 21.F.

If your team has stronger commit conventions (e.g., enforcing a specific scope set), you can tighten the disabled rules — but do it carefully: any rule that inspects `type`, `scope`, or subject case will need to special-case the role-prefix branch where those fields are null.

## Phase A landmines

See [`docs/adopters/common-pitfalls.md`'s "Phase A landmines" subsection](../common-pitfalls.md#phase-a-landmines) for the narrative behind why these templates exist.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/adopters/templates/README.md (classification CURRENT).
