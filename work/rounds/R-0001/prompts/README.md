---
id: R-0001-PROMPTS
title: BR-1 bootstrap prompt pack — manifest
type: index
status: draft
date: 2026-07-23
authority: Architect (round plan Appendix A binds the phase map)
provenance: [plan.md Appendix A; Owner answers of 2026-07-23; dossier Parts IV/VII/VIII/IX/X; CTX-01..12; REV-0001..0007]
---

# BR-1 prompt pack

## How to launch

1. Owner grants `../AUTHORIZATION.md` (status → GRANTED with the verbatim text).
2. Open a fresh Claude Code session with cwd `/Users/aarusso/Development/stech/devaii`.
3. Paste the full content of `00-orchestrator.md` as the opening prompt.
4. The session runs P0→P8 with gates; it stops only at the stop conditions.

## The pack

| File | Phase | Role | Effort |
|---|---|---|---|
| 00-orchestrator.md | session + P0 + gates | Architect (orchestration) | high |
| 01-law.md | P1 | Architect | high |
| 02-product.md | P2 | Architect executing Owner marks | medium |
| 03-docs.md | P3 (∥ P4) | Architect | high |
| 04-packages.md | P4 (internal fan-out, layered) | Engineer ×N | high |
| 05-tests.md | P5 | Inspector | high |
| 06-backlog.md | P6 | Auditor | medium |
| 07-ci.md | P7 | Engineer | medium |
| 08-close.md | P8 | Auditor + orchestrator | high |

Design invariants: role-pure commits · verify-before-commit · ../devai read-only ·
Owner marks applied never invented · deferrals become backlog records · structured
reports (DONE/DEFERRED/DEFECTS/COMMITS) read in full between phases.
