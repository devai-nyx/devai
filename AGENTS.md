# Instructions for agents — DEVAI successor completion campaign

This is the active DEVAI successor repository. R-0001 completed the bootstrap. The
predecessor completed R-Ω at immutable commit
`05dd242bf72334bfd683096aed380e8240b6b9aa` and is archived as
`devai-nyx/devai-original`.

The predecessor checkout at **`../devai` is READ-ONLY, always**. It remains at the
opening absorption pin and must not be fetched, configured, checked out, or modified.
Read terminal evidence through immutable GitHub objects instead.

## If you are told to run the next round

Read and follow, in order:

1. `product/owner-mandates/OM-002.md`
2. `product/owner-mandates/OM-019.md`
3. `work/rounds/EXECUTION-CONTRACT.md`
4. the next round's `AUTHORIZATION.md`
5. the next round's `plan.md`
6. the next round's `prompts/00-orchestrator.md`
7. every additional source named by its close-control profile

R-0001 is closed historical intent. Do not rerun it or edit its plan, prompts, handoffs,
audit, backlog, or PC-0001. OM-019 adopts R-0007 through R-0012 as: CLI/executor,
authenticated convergence claims, product/docs/site, release, evidence-reuse preparation,
then genuine observation. Canonical plans are committed under `work/rounds/`; each remains
dormant until its own entry gate passes.

## Standing rules

- Authority is role-pure by path: `law/` = Architect; `product/` = Owner marks only;
  `work/rounds/` = Architect; `work/audit/` = Auditor; `docs/` = Architect; `record/` =
  machine verbs only; `packages/` and workspace tooling = Engineer; `tests/` =
  Inspector; `scratch/` = ephemeral.
- OM-002’s target boundary makes `.devai/config/` and `.devai/pin/` committed machine
  materializations from Architect-owned sources, generated and committed by the
  executing Engineer session. R-0002 must establish, and later rounds must preserve,
  `.devai/state/` and `.devai/worktrees/` as ignored Engineer-owned runtime state except
  for tracked `.gitkeep` sentinels.
- Commit as
  `git -c user.name="DEVAI <Role>" -c user.email="aarusso@nyxk.com.br"`.
- Use dedicated worktrees and one role per commit. Read validation output before every
  commit.
- The minimum commit floor is `pnpm run devai:prepare`, `pnpm vitest run`, and
  `git diff --check`, plus affected gates.
- BL-017 closed in R-0002 after the unchanged 70/60/70/70 floors passed. Every later
  round reruns that command as an all-green regression gate; no red exception survives.
- Evidence values are re-read from source when cited, never restated from memory.
- Deferrals are governed records. Missing scope never becomes an informal “later” list.
- No package publication, tag, GitHub Release, Pages deployment, real-stynx mutation, or
  evidence streak is authorized by OM-002.
- Nothing is ratified before R-0003; nothing is released before R-0010’s separate external
  gate; R-0012 requires a fresh Owner mandate before observation or promotion.
