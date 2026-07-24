# `SKILL-fix-build`

**Authority:** Engineer.
**Source manifest:** [`packages/core/src/skills/index.ts`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/packages/core/src/skills/index.ts) — `skillFixBuild`.

## Purpose

Diagnose a failing build gate. Read-only — surfaces the SensorReading for downstream remediation rather than mutating source. Future variants may apply minimal mechanical fixes under `host_mutation_policy: write_requires_flag`.

## What it does

1. Run `sense build`.
2. If `pass`, return `pass` with the SensorReading as evidence.
3. If non-pass, return `fail` with the SensorReading as evidence (errors, file paths, exit codes).

## Status semantics

- `pass` — `sense build` is green.
- `fail` — Build still broken. The round-orchestrator escalates to a blocker.

## How adopters consume

```bash
devai agent skill run SKILL-fix-build --repo-root .
```

Or invoked automatically by the round-orchestrate skill on wave-gate failure.

## See also

- Round-loop overview: [README.md](./README.md).
- Companion skills: [`fix-lint.md`](./fix-lint.md), [`fix-test.md`](./fix-test.md).
- Pre-existing skill since Phase 8 MVP; surfaced here under DEVAI R2 / W11.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/skills/fix-build.md (classification CURRENT).
