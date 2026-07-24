# `SKILL-fix-lint`

**Authority:** Engineer.
**Source manifest:** [`packages/core/src/skills/index.ts`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/packages/core/src/skills/index.ts) — `skillFixLint`.

## Purpose

Universal gate-recovery for the lint gate. Reproduces the failing gate locally, runs `eslint --fix`, and re-evaluates. Called by [`SKILL-round-orchestrate`](./round-orchestrate.md) when a wave gate flags a lint regression.

## What it does

1. Run `sense lint` — short-circuit to PASS if already clean.
2. Run `npx eslint --fix .` against the repo.
3. Re-run `sense lint`. Emit `{ before, after }` evidence under `record/proofs/skills/SKILL-fix-lint/<ts>.json`.

## Status semantics

- `pass` — `sense lint` is green after the fix attempt.
- `fail` — Unfixed lint errors remain. The round-orchestrator escalates to a blocker.

## How adopters consume

```bash
devai agent skill run SKILL-fix-lint --repo-root .
```

Or invoked automatically by the round-orchestrate skill on wave-gate failure.

## See also

- Round-loop overview: [README.md](./README.md).
- Companion skills: [`fix-build.md`](./fix-build.md), [`fix-test.md`](./fix-test.md).
- Pre-existing skill since Phase 8 MVP; surfaced here under DEVAI R2 / W11.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/skills/fix-lint.md (classification CURRENT).
