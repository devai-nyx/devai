# P8 — CLOSE (Auditor for the as-built · orchestrator for the ceremony · effort: high)

Two actors, strictly separated:

## 8a — Auditor subagent (writes only work/audit/R-0001/)

Finalize `work/audit/R-0001/as-built.md` from P6's seed + the complete phase reports:
per-phase planned-vs-actual, the full deferral census (must reconcile 1:1 with
backlog.md — an item in a report but in neither backlog nor DONE is a finding), defect
list with graduated-guard status, and the honest claims boundary: what this round DID
(bootstrap executed, populations governed, suite green, provisional binding) and DID NOT
(no ratification, no release, no readiness, predecessor unfrozen, attestation draft).
Recommend, never ratify.

## 8b — Orchestrator ceremony (you, after reading 8a in full)

1. **Verify the whole**: full tier ladder green; `git -C ../devai status` clean;
   every commit role-attributed (`git log --format='%an'` contains only DEVAI <Role>
   names); backlog validates; zero unresolved placeholder markers outside scratch/.
2. **Closure record**: if the ported CLI's `govern phase close`-equivalent runs, use it;
   otherwise hand-author `record/proofs/compliance/closures/PC-0001.json` against
   `phase-closure.schema.json` (validate!): round R-0001, merged_as = the closing commit,
   release_disposition: `none-preratification`, batches = the phase table with head
   commits. PC numbering starts fresh at PC-0001 per doctrine.
3. **Proof epoch**: write `record/proofs/work/test-results/R-0001.jsonl` — one
   line-hash-chained line per tier run (tier, command, verdict, timestamp read from the
   run logs); terminal hash recorded inside PC-0001's evidence field. (If P4/P5 shipped
   a proper epoch writer, use it; else this is the hand-authored v1 and the writer stays
   backlogged.)
4. Final commits (role-pure: closure = the verb's attribution or Architect for the
   hand-authored record with a note), then the FINAL REPORT as your last message:

```
BR-1 FINAL REPORT
Genesis: <sha> (provisional predecessor pin <sha>, re-bind pending R-Ω)
Phases: P0..P8 — status each, one line
Suite: <n> tests green | tiers run: <list>
Populations governed: <table with counts>
Deferred: <n> items → backlog.md (P0-blockers: <list>)
Owner actions outstanding: run R-Ω in the predecessor (manifest supplement +
  terminal D-196 + freeze + rename + banner), then the re-bind + ratification round.
Claims: bootstrap complete; nothing ratified, nothing released, no readiness.
```

Update the dossier cover status line (work/ copy) to post-bootstrap state. Stop.
