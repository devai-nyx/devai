# Wave 08 — as-built, convergence, independent review, and close

Roles in order: Auditor, Architect, Owner-bound independent read-only reviewer. Effort: xhigh reviewer; high orchestration.

Auditor writes exact as-built evidence. Architect writes closing decision/current docs and regenerates every invalidated projection atomically. Freeze one review candidate after two consecutive convergence passes; pass 2 makes no write. Review in a candidate-only clone against all matrix classes, protected properties, local and GitHub trust policies, cache/artifact non-authority, reusable-workflow identity, fast/cold lane separation, crypto threat model, benchmark correctness, and changed/unchanged topics. One repair phase may follow cycle 1; cycle 2 repeats everything. Cycle 2 failure escalates and cycle 3 is forbidden.

Do not push, open PR, merge, publish, release, deploy, promote evidence, or run closure ceremony unless the live mandate separately grants that exact step and all execution-contract gates pass. A review PASS advances matrix rows to REVIEWED_PASS only with exact evidence.
