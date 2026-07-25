---
id: R-0002-CLAUDE-OPUS-CLOSE-REVIEW-4
title: Fourth Claude Opus 5 exact-candidate close review
type: audit-report
status: active
date: 2026-07-25
authority: Auditor
supersedes: null
superseded_by: null
provenance: [exact read-only claude-opus-5 review of 892c24b8ec96603dc62b67a55bb5a9085db5b170]
---

# Fourth Claude Opus 5 exact-candidate close review

## Invocation boundary

The review ran after the reported 05:50 America/Sao_Paulo quota reset through literal
model selector `claude-opus-5`, effort `max`, plan permission mode, no session
persistence, and read-only tools. Edit, write, notebook, web fetch, and web search were
disabled. No fallback and no Fable model was used for the review.

Exact base: `cc0084ba38fb6d583f79fddd38554524714c4fa4`.

Exact candidate: `892c24b8ec96603dc62b67a55bb5a9085db5b170`.

## Verdict

**FAIL.** The candidate may not advance to push or exact-SHA remote checks.

## Actionable findings

### High

1. `AGENTS.md`, `CLAUDE.md`, and `work/rounds/R-0005/plan.md` retain active BL-017
   red/R-0006 instructions. The retirement guard omits those files and its pattern
   misses the surviving `BL-017 is the release throttle` phrase. BL-074 is not closed.
2. DII-134 overstates forbidden-path coverage. Neutral in-place mutation of
   `law/constitution.md`, `law/trace.json`, and `record/proofs/**` does not match the
   canonical forbidden registry, while the authority policy permits proof updates.

### Medium

3. DII-105 binds the original R-0002 plan digest
   `4db25005ab7adc0fff3ca0e9a332870d709aa7c4343830ca5dc0dfca62c6b568`, but the
   current plan digest is
   `29e05473ab1c413552140e62ea93300a90de52aadf0f1cda73ecd6765830a7c5`;
   no later decision discloses or re-binds that change.
4. DII-135 and the as-built cite nonexistent field
   `failed_validation_criterion`. PC-0002 actually contains two failing criteria, but
   neither names standalone gate token `coverage-t1-t3`.
5. BL-065, BL-080, and BL-084 are assigned to R-0004 and BL-063 to R-0005 in the
   backlog, but the campaign and prepared plan provenance do not carry them.
6. The Inspector Git read scope allows `git show`, absent from the production CLI
   broker, so BL-083's exact-mirror acceptance is unmet.
7. Sealed-history verification reports clean when `.git` metadata is absent.
8. A malformed forbidden-actions registry parses to an empty registry and produces a
   clean scan.

### Low

9. `.prettierignore` defines the global formatting boundary without a mechanical
   allowlist contract.
10. Repository-reference generation uses locale-sensitive ordering and lacks a
    no-write check mode; this remains within BL-065/R-0004.
11. The untracked PC-0003 scratch template is stale and would be unsafe operational
    input if followed.

## Confirmed green evidence

The reviewer independently confirmed the local mechanical ladder, exact predecessor
bindings, role purity, append-only PC handling, 155 exact repository-reference
locators, 34/34 non-vacuous invariant links across 115 tracked tests, byte-identical
policy mirrors, the Corepack digest, absence of projection wrappers/import-only test
files, and the no-ratification/no-release/no-readiness ceiling.

## Required disposition

Govern the defects, repair them red-first and role-pure, correct the false close
statements, and obtain a fresh exact-candidate `claude-opus-5` review before push.
