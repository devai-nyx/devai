# BR-1 ORCHESTRATOR — bootstrap DEVAI (successor) from the closed predecessor

You are the orchestrating session for round R-0001: the single-session bootstrap of the
DEVAI successor in THIS repository (`devaii`), absorbing from the closed predecessor at
`../devai` (READ-ONLY — you never write there; violating this ends the run).

## Load context in this order (before anything else)

1. `work/devai-ii-succession-dossier.md` — cover + Part X only (state of play).
2. `work/rounds/R-0001/plan.md` — Appendix A is the operative phase map.
3. `scratch/pre-plan/D-terminal-draft.md` — the terminal decision (provisional D-196).
4. `work/rounds/R-0001/AUTHORIZATION.md` — **HARD GATE: if its status reads PENDING, stop
   and ask the human. Do not begin P0.**
5. Per-phase context is listed inside each track prompt — do not preload everything.

## Hard rules (all phases, all subagents — put these in every subagent prompt)

- `../devai` is read-only evidence. Copy from it; never modify it.
- Authority is role-pure: each phase declares its role; commits use
  `git -c user.name="DEVAI <Role>" -c user.email="aarusso@nyxk.com.br"`; never mix roles
  in one commit. Owner decisions are already made (DS-01, REV-0006) — subagents APPLY
  recorded marks; any situation needing a NEW Owner/Architect-ratification judgment is
  reported back, parked in the backlog, never improvised.
- **Verify before commit** — run the relevant checks and READ their output before any
  `git commit` (rehearsal defect #2 was committing red states; it happened twice).
- Fail closed: a check you cannot run is a blocker or a backlog record, never a skip.
- Deferrals are records: anything cut lands in P6's backlog with reason + wave suggestion.
- Evidence values (SHAs, run ids, counts) are cited, never restated from memory — re-read
  them from source when binding.

## Phase sequence (gates between each; do not overlap phases sharing files)

**P0 — Genesis re-init (you, Architect).**
1. Capture provisional predecessor values (read-only): `git -C ../devai rev-parse HEAD`
   and `HEAD^{tree}`; sha256 of `../devai/.devai/state/evidence-chain.json`. Record them
   plus retrieval timestamp in `law/register/attestation/genesis-attestation.json`
   (`frozen: false`; add provenance line "PROVISIONAL pre-freeze binding; re-bind after
   R-Ω" ). Quote the authorization text from AUTHORIZATION.md into DII-1 in
   `law/register/DECISIONS.md` (replace the placeholder body; status stays draft).
2. Re-init: `git checkout --orphan genesis && git add -A && git commit` — message:
   "genesis: DEVAI successor — absorbed from devai@<provisional SHA> under the Owner
   authorization of 2026-07-23 (provisional binding; re-bind after R-Ω)". Then
   `git branch -D main? -> rename genesis to main` (branch -m). The wireframe history is
   gone by design (tabula-rasa mark).
3. GATE: `pnpm vitest run` green (27 tests); attestation validates (it is covered by the
   suite); `git log --oneline | wc -l` == 1.

**P1 — Law** → spawn `01-law.md` (Architect, effort high). GATE: suite green, report read.
**P2 — Product** → spawn `02-product.md` (Architect applying Owner marks, medium). GATE: suite green.
**P3 — Docs** → spawn `03-docs.md` (Architect, high). May run CONCURRENTLY with P4 (disjoint trees).
**P4 — Packages** → spawn `04-packages.md` (Engineer; it fans out per-package itself, high).
   GATE (P3+P4 joint): build green, suite green, no `../devai` writes (`git -C ../devai status` clean).
**P5 — Tests** → spawn `05-tests.md` (Inspector, high). GATE: full tier-run green.
**P6 — Backlog** → spawn `06-backlog.md` (Auditor, medium). GATE: backlog file validates as records.
**P7 — CI** → spawn `07-ci.md` (Engineer, medium). GATE: workflow files lint; local stage-1..3 script passes.
**P8 — Close** → spawn `08-close.md` (Auditor for the as-built; you for the ceremony, high).

After P8: print the FINAL REPORT (template in 08) as your last message; update
`work/devai-ii-succession-dossier.md` cover status line; ensure every commit in
`git log` is role-attributed; leave the repo with the full suite green.

## Subagent spawning contract

For each track: spawn ONE subagent (the packages track fans out internally) with: the
track prompt file content, the hard rules block above, effort as tabled in plan Appendix A,
and instruction that its FINAL message is a structured report: `DONE:` list,
`DEFERRED:` list (reason + suggested wave), `DEFECTS-FOUND:` list, `COMMITS:` shas.
You read every report fully before opening the next phase. If a subagent dies or
returns incoherent output, re-spawn once with its report gap named; twice failed =
park the track in backlog and continue (never silently absorb its scope yourself).

## Stop conditions (halt and ask the human)

AUTHORIZATION.md PENDING · any need to write to `../devai` · any NEW Owner-tier decision
· the P0 gate failing after one fix attempt · total wall-clock exceeding your session
budget with P4 unfinished (then: commit clean state, write handoff, stop).
