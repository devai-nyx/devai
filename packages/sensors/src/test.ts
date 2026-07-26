import { runCommand } from './run-command.js';
import { buildSensorReading, type SensorReading, type SensorStatus } from './sensor-reading.js';

export type TestSuite = 'unit' | 'integration' | 'regression' | 'e2e' | 'all';

export interface TestOptions {
  readonly cwd: string;
  readonly suite: TestSuite;
  readonly timeoutMs?: number;
}

function defaultCommand(suite: TestSuite): readonly string[] {
  switch (suite) {
    case 'unit':
      return ['pnpm', 'test'];
    case 'integration':
      return ['pnpm', 'test:integration'];
    case 'regression':
      return ['pnpm', 'test:regression'];
    case 'e2e':
      return ['pnpm', 'test:e2e'];
    case 'all':
      return ['pnpm', 'vitest', 'run'];
  }
}

const VITEST_SUMMARY = /Tests\s+(\d+) passed(?:\s+\|\s+(\d+) failed)?/;

export function senseTest(opts: TestOptions): SensorReading {
  const args = [...defaultCommand(opts.suite)];
  const result = runCommand(args, { cwd: opts.cwd, timeoutMs: opts.timeoutMs ?? 600_000 });

  let passed = 0;
  let failed = 0;
  const m = VITEST_SUMMARY.exec(result.stdout) ?? VITEST_SUMMARY.exec(result.stderr);
  if (m) {
    passed = Number(m[1] ?? 0);
    failed = Number(m[2] ?? 0);
  }

  const status: SensorStatus = result.exit_code === 0 ? 'pass' : failed > 0 ? 'fail' : 'error';

  // Map suite → SensorKind. 'regression' and 'all' both surface as unit_test
  // since the schema's enum doesn't include those granularities.
  const sensorKind =
    opts.suite === 'integration'
      ? 'integration_test'
      : opts.suite === 'e2e'
        ? 'e2e_test'
        : 'unit_test';
  // Determinism by suite (Phase-6 scorecard's F3×T9 cell depends on this):
  // - unit + regression tests are expected deterministic; flake = bug.
  // - integration/e2e suites depend on external substrates and are not.
  // - 'all' is a mix; conservatively mark non-deterministic.
  const deterministic = opts.suite === 'unit' || opts.suite === 'regression';
  return buildSensorReading({
    sensorName: `test.${opts.suite}`,
    sensorKind,
    command: args,
    status,
    deterministic,
    exit_code: result.exit_code,
    duration_ms: result.duration_ms,
    out_head: result.stdout,
    err_head: result.stderr,
    killed: result.killed,
    metrics: { tests_passed: passed, tests_failed: failed },
  });
}
