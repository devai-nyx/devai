# Instructions for Claude Code — DEVAI successor repository (bootstrap-ready)

This repository is the DEVAI successor, prepared for round **R-0001: the bootstrap**.
The predecessor is at **`../devai` — READ-ONLY, always**: it is absorption source and
evidence archive; writing to it under any circumstance is a hard violation.

## If you are the bootstrap orchestrator (fresh session, told to "run the bootstrap")

Read and follow, in order:
1. `work/rounds/R-0001/AUTHORIZATION.md` — the gate (GRANTED 2026-07-23; verify, don't assume).
2. `work/rounds/R-0001/prompts/00-orchestrator.md` — your full operating prompt (P0–P8).
3. `work/rounds/R-0001/plan.md` Appendix A — the phase map.
Everything you need is in-repo: the dossier at `work/devai-ii-succession-dossier.md`,
context packs and reviews under `scratch/` (gitignored but present on disk).

## Standing rules (any session, any task)

- Authority is role-pure by path (draft Article 6 table, `law/constitution.md`):
  law/ = Architect · product/ = Owner marks only · work/rounds/ = Architect ·
  work/audit/ = Auditor · docs/ = Architect · record/ = machine only ·
  packages/ = Engineer · tests/ = Inspector · scratch/ = ephemeral.
  Commit as `git -c user.name="DEVAI <Role>" -c user.email="aarusso@nyxk.com.br"`.
- **Verify before commit** — run checks and READ output first (rehearsal defect #2).
- Owner decisions are already recorded (DS-01, REV-0006, the granted authorization);
  APPLY them; never invent new ones — park questions in the backlog.
- Gates: `pnpm vitest run` is the current floor (27+ contract tests); it must be green
  at every commit unless a KNOWN-RED is documented with a backlog pointer.
- Evidence values are re-read from source when cited, never restated from memory.
- Nothing here is ratified: everything is `status: draft` until the ratification round
  after the human runs R-Ω in the predecessor.
