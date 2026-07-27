// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../../..');
const originalArgv = [...process.argv];
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;
const originalExit = process.exit;

afterEach(() => {
  process.argv = [...originalArgv];
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  process.exit = originalExit;
});

async function run(args: readonly string[]): Promise<{
  stdout: string;
  stderr: string;
  exit: number;
}> {
  vi.resetModules();
  let stdout = '';
  let stderr = '';
  process.argv = ['node', 'devai', ...args, '--format', 'json'];
  process.exitCode = undefined;
  process.stdout.write = ((chunk: unknown) => {
    stdout += typeof chunk === 'string' ? chunk : String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += typeof chunk === 'string' ? chunk : String(chunk);
    return true;
  }) as typeof process.stderr.write;
  await import('../../src/bin.js');
  await new Promise<void>((done) => setImmediate(done));
  return {
    stdout,
    stderr,
    exit: typeof process.exitCode === 'number' ? process.exitCode : 0,
  };
}

const cases: ReadonlyArray<readonly [readonly string[], string]> = [
  [['adopt', 'ci', 'scaffold'], 'adopt ci scaffold'],
  [['adopt', 'hooks', 'install'], 'adopt hooks install'],
  [['adopt', 'upgrade', '--as-role', 'architect', '--write', '--dry-run'], 'adopt upgrade'],
  [['init', 'apply-owner', '--as-role', 'owner', '--write', '--dry-run'], 'init apply-owner'],
  [
    ['init', 'apply-architect', '--as-role', 'architect', '--write', '--dry-run'],
    'init apply-architect',
  ],
  [['work', 'state', 'prune'], 'work state prune'],
  [['catalog', 'actions'], 'catalog actions'],
  [['policy', 'check', 'schemas', '--repo-root', ROOT], 'policy check schemas'],
  [['policy', 'check', 'adrs', '--repo-root', ROOT], 'policy check adrs'],
  [['policy', 'check', 'glob', 'guards', '--repo-root', ROOT], 'policy check glob guards'],
  [['policy', 'check', 'prompt', 'overlays'], 'policy check prompt overlays'],
  [['inventory', 'modules', '--repo-root', ROOT], 'inventory modules'],
  [['inventory', 'routes', '--repo-root', ROOT], 'inventory routes'],
  [['inventory', 'schemas', '--repo-root', ROOT], 'inventory schemas'],
  [['inventory', 'tests', '--repo-root', ROOT], 'inventory tests'],
  [['sense', 'docs', 'drift', '--repo-root', ROOT], 'sense docs drift'],
  [['sense', 'site', 'drift', '--repo-root', ROOT], 'sense site drift'],
  [['sense', 'migrate', 'check', '--repo-root', ROOT], 'sense migrate check'],
  [['work', 'backlog', 'list', '--repo-root', ROOT], 'work backlog list'],
  [['work', 'lock', 'list', '--repo-root', ROOT], 'work lock list'],
  [['work', 'task', 'list', '--repo-root', ROOT], 'work task list'],
  [['work', 'worktree', 'list', '--repo-root', ROOT], 'work worktree list'],
];

const defaultCases: ReadonlyArray<readonly [readonly string[], string, number]> = [
  [['agent', 'prompt', 'compose'], 'agent prompt compose', 2],
  [['agent', 'prompt', 'diff'], 'agent prompt diff', 2],
  [['agent', 'prompt', 'freeze'], 'agent prompt freeze', 2],
  [['agent', 'skill', 'list'], 'agent skill list', 0],
  [['docs', 'decisions', 'render'], 'docs decisions render', 0],
  [['docs', 'links'], 'docs links', 0],
  [['docs', 'rounds', 'render'], 'docs rounds render', 0],
  [['evidence', 'chain', 'verify'], 'evidence chain verify', 2],
  [['evidence', 'local', 'verify'], 'evidence local verify', 0],
  [['govern', 'phase', 'ledger'], 'govern phase ledger', 0],
  [['govern', 'rgr', 'list'], 'govern rgr list', 0],
  [['govern', 'rgr', 'show'], 'govern rgr show', 2],
  [['govern', 'score', 'assess'], 'govern score assess', 2],
  [['govern', 'score', 'backlog', 'refresh'], 'govern score backlog refresh', 0],
  [['govern', 'score', 'compute'], 'govern score compute', 0],
  [['govern', 'score', 'view'], 'govern score view', 2],
  [['govern', 'triage', 'classify'], 'govern triage classify', 2],
  [['govern', 'triage', 'dispatch'], 'govern triage dispatch', 2],
  [['govern', 'triage', 'tie', 'break'], 'govern triage tie break', 2],
  [['init', 'plan'], 'init plan', 0],
  [['inventory', 'adherence'], 'inventory adherence', 0],
  [['inventory', 'components'], 'inventory components', 0],
  [['inventory', 'contracts'], 'inventory contracts', 2],
  [['inventory', 'coverage'], 'inventory coverage', 0],
  [['inventory', 'dependencies'], 'inventory dependencies', 0],
  [['inventory', 'glossary'], 'inventory glossary', 0],
  [['inventory', 'regen'], 'inventory regen', 0],
  [['policy', 'check', 'ci', 'economy'], 'policy check ci economy', 2],
  [['policy', 'check', 'docs', 'governance'], 'policy check docs governance', 2],
  [['policy', 'check', 'forbidden', 'actions'], 'policy check forbidden actions', 0],
  [['policy', 'check', 'overrides'], 'policy check overrides', 0],
  [['policy', 'check', 'pr', 'compliance'], 'policy check pr compliance', 2],
  [['policy', 'check', 'sensor', 'integrity'], 'policy check sensor integrity', 0],
  [['round', 'status'], 'round status', 2],
  [['sense', 'build'], 'sense build', 0],
  [['sense', 'inventory', 'api'], 'sense inventory api', 0],
  [['sense', 'inventory', 'data', 'model'], 'sense inventory data model', 0],
  [['sense', 'inventory', 'performance'], 'sense inventory performance', 0],
  [['sense', 'inventory', 'rbac'], 'sense inventory rbac', 0],
  [
    [
      'sense',
      'run',
      '--set',
      'sweep',
      '--round',
      'R-0999',
      '--dry-run',
      '--repo-root',
      ROOT,
      '--as-role',
      'auditor',
      '--write',
    ],
    'sense run',
    0,
  ],
  [['sense', 'lint'], 'sense lint', 0],
  [['sense', 'spec', 'idiomaticity'], 'sense spec idiomaticity', 3],
  [['sense', 'test'], 'sense test', 2],
  [['sense', 'trace', 'resolve'], 'sense trace resolve', 0],
  [['sense', 'type', 'check'], 'sense type check', 0],
  [['spec', 'blueprint', 'diff'], 'spec blueprint diff', 2],
  [['spec', 'blueprint', 'plan'], 'spec blueprint plan', 2],
  [['spec', 'blueprint', 'validate'], 'spec blueprint validate', 2],
  [['spec', 'validate', 'action', 'coverage'], 'spec validate action coverage', 2],
  [['spec', 'validate', 'all'], 'spec validate all', 2],
  [['spec', 'validate', 'glossary'], 'spec validate glossary', 2],
  [['spec', 'validate', 'invariant', 'strategies'], 'spec validate invariant strategies', 0],
  [['spec', 'validate', 'invariants'], 'spec validate invariants', 2],
  [['spec', 'validate', 'journeys'], 'spec validate journeys', 2],
  [['spec', 'validate', 'schema'], 'spec validate schema', 2],
  [['spec', 'validate', 'test', 'trace'], 'spec validate test trace', 2],
  [['spec', 'validate', 'trace'], 'spec validate trace', 2],
  [['work', 'backlog', 'next'], 'work backlog next', 0],
  [['work', 'db', 'status'], 'work db status', 0],
  [
    [
      'verify',
      'translation',
      '--witness',
      'scratch/missing-witness.json',
      '--repo-root',
      ROOT,
      '--as-role',
      'inspector',
      '--write',
    ],
    'verify translation',
    2,
  ],
  [
    [
      'work',
      'session',
      'start',
      '--target',
      ROOT,
      '--ttl-minutes',
      '0',
      '--as-role',
      'auditor',
      '--write',
    ],
    'work session start',
    7,
  ],
];

describe('public read-action runtime seams', () => {
  it.each(cases)(
    '%s executes %s in-process',
    async (args, actionId) => {
      const result = await run(args);
      expect(result.exit, `${actionId}: ${result.stderr}`).toBe(0);
      expect(result.stderr, actionId).toBe('');
      expect(JSON.parse(result.stdout)).toMatchObject({
        schemaVersion: '1.0.0',
        action_id: actionId,
        ok: true,
      });
    },
    30_000,
  );

  it.each(defaultCases)(
    '%s executes %s with exit %s in-process',
    async (args, actionId, expectedExit) => {
      const result = await run(args);
      expect(result.exit, `${actionId}: ${result.stderr}`).toBe(expectedExit);
      const channel = expectedExit === 0 ? result.stdout : result.stderr;
      expect(expectedExit === 0 ? result.stderr : result.stdout, actionId).toBe('');
      expect(channel.trimStart().startsWith('{'), `${actionId}: ${channel}`).toBe(true);
      expect(JSON.parse(channel)).toMatchObject({
        schemaVersion: '1.0.0',
        action_id: actionId,
        ok: expectedExit === 0,
      });
    },
    30_000,
  );
});
