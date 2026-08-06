# Round 12 planning diagnosis

Status: planning evidence only. No authority is granted and no repository mutation is authorized.

## Planning source

- Primary repository: `/Users/aarusso/Development/stech/devaii`; its `main` was clean at inspection and pointed to `722e8a3438f3534260ac4f24c3eecc59e76f905b`.
- The primary checkout does not contain OM-014 through OM-017, DII-249 through DII-252, or the requested R-0007 profile and graph.
- The requested authority was therefore read from the clean existing worktree `/Users/aarusso/Development/stech/devaii-pre-r0007-remediation-3` at exact commit `6c4c687931bed8c7c2e8f27f44d0aa8aa1878ecf`. This is a planning source, not a proposed execution base.
- A future round entry must fetch the successor, re-read live `origin/main`, and stop unless the selected exact base contains the required authority. No SHA in this diagnosis reserves a base.
- The predecessor checkout was not read, fetched, configured, checked out, or modified.

## Confirmed controller state

- The policy roster has sixteen ordered literal commands (`law/policy/round-close-controls.json:475-593`).
- The current authoritative-gate cache is per task: its path contains `taskId/taskKey` and lookup recomputes the same task ID (`scripts/run-round-close-controls.mjs:3928-3985,4524-4566`). This prevents cross-gate lookup even when a smaller semantic claim could be identical.
- The existing key binds task ID, argv, cwd, profile, complete candidate input and dependency manifests, policy, graph, toolchain, environment, outputs, and candidate (`scripts/run-round-close-controls.mjs:4524-4565`; schema at `law/schemas/task-freshness.schema.json:9-193`). It binds an execution-shaped task, not an independently named assertion/claim.
- Cache records are self-digested and schema checked (`scripts/run-round-close-controls.mjs:3939-3975`) but not signed by an independently trusted producer. A same-user writer can fabricate a structurally valid record and recompute its SHA-256. Therefore the current cache is integrity checked, not authenticated against cache poisoning.
- Only `EXECUTED_PASS` is reusable; remote mode disables local cache (`law/policy/round-close-controls.json:118-150,492-504`). Coverage is whole-only and its retained output population is digest-bound (`work/rounds/R-0007/affected-test-graph.json:621-650`).

## Population facts

- The exact candidate contains 166 tracked `*.test.ts` files: T1 92, T2 56, T3 9, T4 2, T5 6, T6 1. These are file counts, not suite or test-case counts. They were obtained by classifying `git ls-files` against the seven configured include families.
- Root `pnpm vitest run` loads `vitest.config.ts`, which synchronously runs `devai:prepare`, then uses Vitest's default discovery (`vitest.config.ts:1-13`).
- `ci:stage2` expands to `build`, then separate T1 and T2 invocations (`package.json:24,28-29,38`); its tracked population is 148 files, but the run that executes it must report actual discovered files, suites, cases, skips, and duration.
- Despite the script name `test:coverage:t1-t3`, the current coverage config includes all six tier families, totaling the same 166 tracked files (`tests/config/t1-t3.coverage.config.ts:20-49`). It also uses a custom V8 subprocess provider and enforces policy thresholds. The plan must not record this as a 166-suite or T1-T3-only result.
- Thresholds are lines 70, branches 60, functions 70, statements 70 (`law/policy/thresholds.json:1-8`).

## Soundness conclusion

There is no sound whole-result reuse edge among `ordinary`, `stage2`, and `coverage`:

- `ordinary -> coverage` is forbidden: ordinary has no V8-instrumented evidence, retained coverage outputs, or threshold verdict.
- `coverage -> ordinary` is forbidden: the instrumentation environment is different, and an instrumented pass does not prove the uninstrumented root-config execution.
- `ordinary -> stage2` is forbidden: it does not prove a clean build occurred before T1, nor that T1 and T2 passed as separate ordered processes.
- `stage2 -> ordinary` is forbidden: T1+T2 is not the root default all-tier population or its combined execution environment.
- Combining stage2 with the separate T3-T6 gates still does not prove ordinary's one combined root run; combining ordinary with a build result still does not prove stage2's ordered separate T1/T2 processes.

The only safe optimisation class is reuse of a separately authenticated assertion whose complete contract is identical in both gate recipes—for example a preparation or deterministic projection sub-assertion—while each gate's non-equivalent assertions still execute in their required order. Eligibility must be derived and independently validated; no initial edge may be hand-waved from overlapping file paths.

## Open authority/feasibility blockers

1. No Owner mandate currently grants R-0008 or a signing trust root. The plan supplies a request only.
2. DII-254 is now occupied by the uniqueness decision. R-0008 entry must recheck the next
   gapless free identifier immediately before its Architect declaration; plans reserve no ID.
3. Authenticated anti-forgery reuse needs an independently verifiable signature trust root. SHA-256 self-digests alone are insufficient. If the Owner will not authorize an Ed25519 public-key trust policy and controlled signer, cross-gate reuse must stop before implementation.
4. Repository rules assign `law/**` to Architect and `.devai/config/**` to the executing Engineer (`AGENTS.md`; `work/rounds/EXECUTION-CONTRACT.md:33-43`), while the user requires a derived artifact to be regenerated in the same commit that invalidates it. A law-policy change immediately invalidates `.devai/config/round-close-controls.json` (`law/policy/round-close-controls.json:85-116,615-620`). One ordinary role-pure commit cannot modify both. Entry must obtain an Architect decision defining an atomic, role-pure activation mechanism, or stop. The plan does not invent a mixed-role exception.
