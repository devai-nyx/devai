# Test profiles

Tests have one primary local node, selected by package or by the root
contract/integration boundary. The task graph is declared in
`test-tasks.json`; a future content-addressed runner will execute only
invalidated nodes.

`pnpm test` is the simple full-local fallback. Package-scoped commands such
as `pnpm run test:cli` are the leaf commands used by the affected profile.
None of them prepares or builds the workspace implicitly.

The RC profile prepares and builds once, then executes one coverage node over
the complete RC population: package, contract, integration, PostgreSQL, E2E,
performance, soak, and containment tests. Every test is collected once by
`test:coverage:rc`; the narrower `test:db:rc`, `test:e2e:rc`,
`test:performance:rc`, and `test:containment:rc` commands are diagnostic slices,
not additional RC-profile work.

The affected profile is explicitly allowlisted to generation, build, and cheap
local test nodes. Matching an RC-only input never pulls coverage, database,
E2E, performance, or containment work into an affected run.

The coverage node reads the four unchanged floors from
`law/policy/thresholds.json`: statements 70, branches 60, functions 70, and
lines 70. Coverage is an RC gate, not a routine local command.

The legacy `t1-t3.coverage.config.ts` and `t6.containment.config.ts` paths
are temporary aliases because the current product `check` adapter still
loads those exact files. They must disappear with that production caller.
