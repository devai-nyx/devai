# W05.d root-script authority handoff

W05.d asks root package scripts to exercise the porcelain CLI. P4 routes
`lint` and `typecheck` through the CLI because their subprocess contracts are
bounded and read-only:

- `sense lint` permits only `npx eslint --format=json <target>`.
- `sense type check` permits only `npx tsc --noEmit` with an optional
  repository-relative `-p <project>`.

`build` and `test` remain direct root scripts for now. Their sensor actions are
registered as `read`, but they launch subprocesses that may mutate build
outputs, caches, snapshots, or arbitrary targets supplied by `--command`.
The authority broker correctly rejects those subprocesses with
`AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED`. Whitelisting arbitrary commands as
read-only would silently weaken the host-effects boundary.

Runtime evidence captured during P4 integration:

```text
node packages/cli/dist/bin.js sense build --repo-root . \
  --command "pnpm -r --if-present build" --no-emit-reading --format json
=> code=AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED, class=routing-authority, exit=2

node packages/cli/dist/bin.js sense test all --repo-root . \
  --command "pnpm vitest run" --no-emit-reading --format json
=> code=AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED, class=routing-authority, exit=2
```

Follow-up disposition:

1. Define a governed validation-process target and bounded command contract.
2. Reclassify or authorize the subprocess effect without treating arbitrary
   commands as reads.
3. Add authority-boundary tests for allowed build/test invocations and denied
   command smuggling.
4. Complete this in an early post-bootstrap authority/surface wave, then route
   the root `build` and `test` scripts through the porcelain commands.

The dossier explicitly permits W05.d to defer when it cannot be completed
safely during bootstrap. P4 preserves direct, non-recursive scripts so the
workspace build and test gates remain executable.
