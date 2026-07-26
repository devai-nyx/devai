---
id: R-0004-COMMAND-PARITY-TYPECHECK-FAILURE
title: R-0004 command-parity guard typecheck failure
type: audit-report
status: superseded
date: 2026-07-26
authority: Auditor
supersedes: null
superseded_by: R-0004-COMMAND-PARITY-TYPECHECK-CORRECTION
provenance: [Inspector bf9a690; BL-170; TS2345 at r0004-governed-surface.red.contract.test.ts:48]
---

# R-0004 command-parity guard typecheck failure

After Inspector `bf9a690` established the intended five-item BL-167 red evidence,
`pnpm run typecheck` failed with one `TS2345`: `node.arguments[0]` remained
`Expression | undefined` under `noUncheckedIndexedAccess` even after the length guard.
The failure is confined to the new Inspector AST traversal; production, law, and the
five-item behavioral reading are unchanged.

BL-170 governs an Inspector-only explicit first-argument narrowing. Typecheck and the
focused behavioral guard must then show respectively green compilation and the same five
intentional metadata drifts. No source push, PR, release, deployment, or external gate
action occurred.
