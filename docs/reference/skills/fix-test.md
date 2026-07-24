# `SKILL-fix-test`

**Authority:** Engineer.
**Source manifest:** [`packages/core/src/skills/index.ts`](https://github.com/devai-nyx/devai/blob/d76cd12d2241a1a28a32a0fe629c6531da7fe74d/packages/core/src/skills/index.ts) — `skillFixTest`.

## Purpose

Diagnose a failing test gate. Read-only diagnosis; surfaces the SensorReading for downstream remediation. Mirrors `SKILL-fix-build` for the test surface.

## What it does

1. Run `sense test --suite unit`.
2. If `pass`, return `pass` with the SensorReading.
3. If non-pass, return `fail` with the SensorReading (test names, error messages, exit codes).

## Status semantics

- `pass` — Unit suite is green.
- `fail` — Tests still red. The round-orchestrator escalates to a blocker.

## How adopters consume

```bash
devai agent skill run SKILL-fix-test --repo-root .
```

Or invoked automatically by the round-orchestrate skill on wave-gate failure.

## See also

- Round-loop overview: [README.md](./README.md).
- Companion skills: [`fix-lint.md`](./fix-lint.md), [`fix-build.md`](./fix-build.md).
- Pre-existing skill since Phase 8 MVP; surfaced here under DEVAI R2 / W11.

---

> Provenance: migrated from devai@d76cd12d2241a1a28a32a0fe629c6531da7fe74d path docs/reference/skills/fix-test.md (classification CURRENT).
