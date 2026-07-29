// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
import type { AuthorityHostEffectRequest } from '@devai-nyx/authority';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAuthorityHostBroker } from '../../src/authority/broker.js';
import { getFullRegistry, type RegistryEntry } from '../../src/define-command.js';
import { resolveCliVersion } from '../../src/version.js';

const ROOT = new URL('../../../../', import.meta.url).pathname;
const originalArgv = [...process.argv];
const originalStdout = process.stdout.write;
let entries: readonly RegistryEntry[];

beforeAll(async () => {
  process.argv = [process.execPath, 'devai', '--help'];
  process.stdout.write = (() => true) as typeof process.stdout.write;
  await import('../../src/bin.js');
  entries = getFullRegistry();
  process.stdout.write = originalStdout;
  process.argv = [...originalArgv];
});

afterAll(() => {
  process.stdout.write = originalStdout;
  process.argv = [...originalArgv];
});

type Role = 'owner' | 'architect' | 'inspector' | 'engineer' | 'auditor';

function broker(name: string, role: Role, argv: readonly string[], bootstrapPolicy = false) {
  const entry = entries.find((candidate) => candidate.name === name);
  if (entry === undefined) throw new Error(`missing action ${name}`);
  return createAuthorityHostBroker({
    entry,
    entries,
    argv,
    role,
    declaration: { as_role: role },
    repository_root: ROOT,
    package_version: resolveCliVersion(),
    bootstrap_policy: bootstrapPolicy,
  });
}

function effect(
  symbol: string,
  args: readonly unknown[],
  kind: AuthorityHostEffectRequest['kind'] = 'filesystem',
): AuthorityHostEffectRequest {
  return { kind, symbol, arguments: args };
}

describe('authority broker production boundary depth', () => {
  it('authorizes bounded filesystem effects and tracks descriptor lifecycles', () => {
    const host = broker('work state prune', 'engineer', [
      'work',
      'state',
      'prune',
      '--as-role',
      'engineer',
      '--write',
    ]);
    try {
      let applied = 0;
      expect(
        host.scope.apply_effect(effect('openSync', ['.devai/state/broker-depth.json', 'w']), () => {
          applied += 1;
          return 41;
        }),
      ).toBe(41);
      expect(
        host.scope.apply_effect(effect('writeSync', [41, '{}\n']), () => {
          applied += 1;
          return 3;
        }),
      ).toBe(3);
      expect(
        host.scope.apply_effect(effect('closeSync', [41]), () => {
          applied += 1;
        }),
      ).toBeUndefined();
      expect(applied).toBe(3);
      expect(
        host.scope.apply_effect(effect('mkdirSync', [ROOT, { recursive: true }]), () => {
          throw new Error('existing directory must be a no-op');
        }),
      ).toBeUndefined();
    } finally {
      host.dispose();
    }
  });

  it('commits exact-plan effects as one unit and rejects conflicting targets', () => {
    const host = broker(
      'init apply-owner',
      'owner',
      ['init', 'apply-owner', '--as-role', 'owner', '--write'],
      true,
    );
    try {
      let applied = 0;
      host.scope.apply_effect(effect('writeFileSync', ['product/broker-a.json', '{}\n']), () => {
        applied += 1;
      });
      host.scope.apply_effect(effect('writeFileSync', ['product/broker-b.json', '{}\n']), () => {
        applied += 1;
      });
      expect(applied).toBe(0);
      host.commit_exact?.();
      expect(applied).toBe(2);
      expect(() =>
        host.scope.apply_effect(
          effect('spawnSync', ['git', ['update-ref', 'refs/heads/x', 'HEAD']], 'process'),
          () => undefined,
        ),
      ).toThrow('AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED');
    } finally {
      host.dispose();
    }

    const conflict = broker(
      'init apply-owner',
      'owner',
      ['init', 'apply-owner', '--as-role', 'owner', '--write'],
      true,
    );
    try {
      conflict.scope.apply_effect(
        effect('writeFileSync', ['product/conflict.json', '{}\n']),
        () => undefined,
      );
      conflict.scope.apply_effect(effect('rmSync', ['product/conflict.json']), () => undefined);
      expect(() => conflict.commit_exact?.()).toThrow('AUTHORITY_EXACT_PLAN_TARGET_CONFLICT');
    } finally {
      conflict.dispose();
    }
  });

  it('passes read-only processes and refuses unadapted process or read-action mutation', () => {
    const host = broker('sense run', 'auditor', [
      'sense',
      'run',
      '--as-role',
      'auditor',
      '--write',
    ]);
    try {
      expect(
        host.scope.apply_effect(effect('spawnSync', ['git', ['status']], 'process'), () => 'ok'),
      ).toBe('ok');
      expect(() =>
        host.scope.apply_effect(effect('spawnSync', ['sh', ['-lc', 'true']], 'process'), () => 'x'),
      ).toThrow('AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED');
    } finally {
      host.dispose();
    }

    const read = broker('catalog actions', 'auditor', ['catalog', 'actions']);
    try {
      expect(() =>
        read.scope.apply_effect(effect('writeFileSync', ['scratch/forbidden', 'x']), () => 'x'),
      ).toThrow('AUTHORITY_READ_ACTION_MUTATION_FORBIDDEN');
      expect(() =>
        read.scope.apply_effect(effect('spawnSync', ['sh', ['-lc', 'true']], 'process'), () => 'x'),
      ).toThrow('AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED');
    } finally {
      read.dispose();
    }
  });

  it('fails closed for invalid session, skill-record, and skill write scopes', () => {
    const session = broker('work session start', 'auditor', [
      'work',
      'session',
      'start',
      '--ttl-minutes',
      '0',
      '--as-role',
      'auditor',
      '--write',
    ]);
    try {
      expect(() => session.session_operation?.()).toThrow('AUTHORITY_SESSION_TTL_INVALID');
      expect(session.record_init('owner')).toMatchObject({
        scope: { action_id: 'init record' },
      });
      expect(() => session.record_skill('invalid', () => undefined)).toThrow(
        'AUTHORITY_SKILL_ID_INVALID',
      );
    } finally {
      session.dispose();
    }

    const skill = broker('agent skill run', 'engineer', [
      'node',
      'devai',
      'agent',
      'skill',
      'run',
      'SKILL-fixture',
      '--as-role',
      'engineer',
      '--write',
    ]);
    try {
      expect(() =>
        skill.scope.apply_effect(
          effect('writeFileSync', ['law/forbidden.json', '{}\n']),
          () => undefined,
        ),
      ).toThrow('AUTHORITY_SKILL_WRITE_SCOPE_DENIED');
    } finally {
      skill.dispose();
    }
  });

  it('classifies the complete governed process-target matrix without executing host commands', () => {
    const cases: ReadonlyArray<
      readonly [string, Role, readonly string[], string, readonly string[]]
    > = [
      [
        'agent skill run',
        'engineer',
        ['node', 'devai', 'agent', 'skill', 'run', 'SKILL-feedback-iteration'],
        'npx',
        ['eslint', '--format=json', '.'],
      ],
      [
        'agent skill run',
        'engineer',
        ['node', 'devai', 'agent', 'skill', 'run', 'SKILL-feedback-iteration'],
        'npx',
        ['tsc', '--noEmit'],
      ],
      [
        'agent skill run',
        'engineer',
        ['node', 'devai', 'agent', 'skill', 'run', 'SKILL-feedback-iteration'],
        'pnpm',
        ['test'],
      ],
      [
        'agent skill run',
        'engineer',
        ['node', 'devai', 'agent', 'skill', 'run', 'SKILL-feedback-iteration'],
        'node',
        ['--test', '--test-name-pattern', 'works', 'packages/cli/tests/a.test.ts'],
      ],
      [
        'work db provision',
        'engineer',
        [],
        'psql',
        ['postgres://host/db-name', '-c', 'CREATE TABLE x()'],
      ],
      [
        'work db provision',
        'engineer',
        [],
        'psql',
        ['postgres://host/db-name', '-c', 'INSERT INTO x VALUES (1)'],
      ],
      [
        'work db provision',
        'engineer',
        [],
        'psql',
        ['postgres://host/db-name', '-c', 'UPDATE x SET a=1'],
      ],
      [
        'work db provision',
        'engineer',
        [],
        'psql',
        ['postgres://host/db-name', '-c', 'DELETE FROM x'],
      ],
      ['work db provision', 'engineer', [], 'psql', ['not-a-url', '-c', 'SELECT 1']],
      ['work db start shared', 'engineer', [], 'docker', ['run', '--name', 'fixture-db']],
      ['work db start shared', 'engineer', [], 'docker', ['start', 'fixture-db']],
      ['work db stop shared', 'engineer', [], 'docker', ['stop', 'fixture-db']],
      ['verify translation', 'inspector', [], 'docker', ['run', '--rm', 'fixture']],
      ['verify translation', 'inspector', [], 'sandbox-exec', ['-p', '(version 1)', 'node']],
      ['docs publish', 'engineer', [], 'git', ['push', 'origin', 'gh-pages']],
      ['agent skill run', 'engineer', [], 'git', ['push', 'origin', 'HEAD']],
      ['adopt upgrade', 'architect', [], 'git', ['fetch', 'upstream remote!', 'branch/name']],
      ['docs publish', 'engineer', [], 'git', ['checkout', '--orphan', 'gh-pages']],
      ['docs publish', 'engineer', [], 'git', ['branch', '-D', 'temporary']],
      [
        'experimental loop run',
        'engineer',
        [],
        'git',
        ['worktree', 'add', '-b', 'fixture', '/tmp/wt'],
      ],
      ['experimental loop run', 'engineer', [], 'git', ['worktree', 'remove', '/tmp/wt']],
      ['experimental loop run', 'engineer', [], 'git', ['add', 'packages/cli/src/bin.ts']],
      ['experimental loop run', 'engineer', [], 'git', ['rm', 'packages/cli/src/bin.ts']],
      ['experimental loop run', 'engineer', [], 'git', ['commit', '-m', 'fixture']],
      ['experimental loop run', 'engineer', [], 'git', ['mv', 'scratch/a', 'scratch/b']],
      ['agent skill run', 'engineer', [], 'gh', ['pr', 'create', '--draft']],
      ['docs publish', 'engineer', [], 'npm', ['--prefix', 'docs/site', 'run', 'build']],
      [
        'docs publish',
        'engineer',
        [],
        'bundle',
        ['exec', 'jekyll', 'build', '-s', 'docs/site', '-d', 'docs/site/_site'],
      ],
      ['evidence test record', 'auditor', [], 'sh', ['-c', 'pnpm test']],
      ['experimental loop run', 'engineer', [], 'claude', ['-p', 'fixture']],
      ['experimental loop run', 'engineer', [], 'codex', ['exec', 'fixture']],
      [
        'docs render mermaid',
        'engineer',
        [],
        'mmdc',
        ['--input', 'a.mmd', '--output', 'scratch/a.svg'],
      ],
    ];

    let classified = 0;
    for (const [name, role, argv, executable, args] of cases) {
      const host = broker(name, role, argv);
      try {
        try {
          host.scope.apply_effect(effect('spawnSync', [executable, args], 'process'), () => {
            classified += 1;
            return 'applied';
          });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          classified += 1;
        }
      } finally {
        host.dispose();
      }
    }
    expect(classified).toBe(cases.length);
  });

  it('admits only exact read-only subprocess shapes for sensor actions', () => {
    const cases: ReadonlyArray<readonly [string, string, readonly string[], boolean]> = [
      ['sense lint', 'npx', ['eslint', '--format=json', '.'], true],
      ['sense lint', 'npx', ['eslint', '--fix', '.'], false],
      ['sense type check', 'npx', ['tsc', '--noEmit'], true],
      ['sense type check', 'npx', ['tsc', '--noEmit', '-p', 'packages/cli/tsconfig.json'], true],
      ['sense type check', 'npx', ['tsc', '--noEmit', '-p', '../outside.json'], false],
      ['sense build', 'pnpm', ['-r', 'build'], true],
      ['sense test', 'pnpm', ['vitest', 'run'], true],
      [
        'sense test',
        'pnpm',
        ['vitest', 'run', '--config', 'tests/config/t4.regression.config.ts'],
        true,
      ],
      ['sense test', 'pnpm', ['vitest', 'watch'], false],
      ['sense run', 'true', [], true],
      ['sense run', 'false', [], true],
      ['sense run', 'node', ['-e', 'process.exit(1);'], true],
      ['sense run', 'node', ['--version'], true],
      ['sense run', 'pnpm', ['audit', '--json'], true],
      ['sense run', 'npm', ['audit', '--json', '--package-lock-only'], true],
      ['sense run', 'sh', ['-lc', 'command -v claude'], true],
      ['sense run', 'sh', ['-lc', 'echo unsafe'], false],
      ['sense run', 'git', ['rev-parse', 'HEAD'], true],
      ['sense run', 'docker', ['ps'], true],
      ['sense run', 'command', ['-v', 'git'], true],
    ];
    for (const [name, executable, args, allowed] of cases) {
      const host = broker(name, 'auditor', []);
      try {
        const invoke = () =>
          host.scope.apply_effect(effect('spawnSync', [executable, args], 'process'), () => 'ok');
        if (allowed) expect(invoke()).toBe('ok');
        else expect(invoke).toThrow('AUTHORITY_HOST_PROCESS_ADAPTER_REQUIRED');
      } finally {
        host.dispose();
      }
    }
  });

  it('fails closed for malformed filesystem targets, escapes, descriptors, and session endings', () => {
    const host = broker('work state prune', 'engineer', [
      'work',
      'state',
      'prune',
      '--as-role',
      'engineer',
      '--write',
    ]);
    try {
      expect(() =>
        host.scope.apply_effect(effect('writeFileSync', [undefined]), () => undefined),
      ).toThrow('AUTHORITY_FS_TARGET_INVALID');
      expect(() =>
        host.scope.apply_effect(effect('writeFileSync', ['/tmp/outside']), () => undefined),
      ).toThrow('AUTHORITY_FS_SYMLINK_ESCAPE');
      expect(() =>
        host.scope.apply_effect(effect('writeSync', [999, 'x']), () => undefined),
      ).toThrow('AUTHORITY_FS_DESCRIPTOR_UNKNOWN');
      host.scope.apply_effect(
        effect('renameSync', ['.devai/state/from', '.devai/state/to']),
        () => undefined,
      );
      host.scope.apply_effect(
        effect('copyFileSync', ['.devai/state/from', '.devai/state/copied']),
        () => undefined,
      );
      host.scope.apply_effect(
        effect('symlinkSync', ['.devai/state/from', '.devai/state/link']),
        () => undefined,
      );
    } finally {
      host.dispose();
    }

    const endingEntry = entries.find((entry) => entry.name === 'work session end');
    if (endingEntry === undefined) throw new Error('missing work session end');
    const ending = createAuthorityHostBroker({
      entry: endingEntry,
      entries,
      argv: ['work', 'session', 'end'],
      role: 'auditor',
      declaration: { authority_session: 'AUTH-SESSION-missing' },
      repository_root: ROOT,
      package_version: resolveCliVersion(),
      bootstrap_policy: false,
    });
    try {
      expect(() => ending.session_operation?.()).toThrow('AUTHORITY_SESSION_NOT_FOUND');
    } finally {
      ending.dispose();
    }
  });
});
