# CLI tests withheld for P5

Raw relocation was run before withholding:

- 14 files, 52 tests
- 7 passed, 11 failed, 34 skipped
- retained after fixing import paths only: 3 files, 14 tests, all green

The following whole predecessor files remain P5-owned because their repository
root / built-binary harness assumes the predecessor's flat `test/` directory,
or because the test asserts predecessor paths and surface counts. No assertion
was rewritten in P4.

- `action-coverage.contract.test.ts`
  - `current documentation contains no obsolete pre-0.5 CLI invocation`
  - `privileged release workflow actions are pinned to immutable commit SHAs`
  - all built-catalog and skill-manifest cases
  - reason: computes the root as `packages/`, calls the retired root
    `scripts/check-cli-migration.mjs`, and requires P5 successor fixtures.
- `action-effects-binding.integration.test.ts`
  - `executes the production analyzer and passes the canonical repository`
  - reason: built-binary path and extracted-action expectations require the P5
    successor action fixture.
- `bare-domain-help.integration.test.ts`
  - every non-leaf domain, every depth-2 group, unknown-command, and unrelated
    suggestion cases
  - reason: built-binary path assumes predecessor `test/`.
- `built-cli-guard.integration.test.ts`
  - `packages/cli/dist/bin.js exists — skipIfNotBuilt suites are actually running`
  - reason: the relocated path resolves `tests/dist/bin.js`.
- `ci-scaffold.test.ts`
  - all `buildCiScaffoldPlan` and `executeCiScaffoldPlan` cases
  - reason: requires relocation of the Inspector-owned authority-host test
    scope; its expected chain path also remains predecessor-specific.
- `cli-help.smoke.test.ts`
  - all help, version, catalog, skill count, unknown route, domain help, and
    obsolete spelling cases
  - reason: built-binary path assumes predecessor `test/`; skill/action counts
    are successor test-content changes.
- `hooks-install.test.ts`
  - all `buildHooksInstallPlan` and `executeHooksInstallPlan` cases
  - reason: requires the Inspector-owned authority-host test scope and
    successor constitution fixtures.
- `no-exit-after-emit.contract.test.ts`
  - `no non-exempt command file calls process.exit(EXIT_PASS)`
  - reason: command-root resolution points at `tests/src/commands`.
- `post-merge-auditor.e2e.test.ts`
  - missing/forged receipt, exactly-once, busy-lock, observation failure, and
    retry cases
  - reason: built driver path plus predecessor `.devai/worktrees` and authority
    materialization fixtures must be rebound together in P5.
- `sensor-descriptor-cli-parity.integration.test.ts`
  - `binds every runnable descriptor to one live public action`
  - reason: its one-action-per-sensor assertion is intentionally superseded by
    W05.a's registry-derived `sense run <kind>` collapse.
- `usage-exit-codes.integration.test.ts`
  - all missing-argument cases and mutation-help non-authorizing case
  - reason: authorized built-driver path assumes predecessor `test/`.

P5 disposition: relocate each file under the successor tier rail, rebind its
root/binary/authority fixtures, update successor-owned assertions, then remove
the corresponding entry from this file only when that entire file is green.
