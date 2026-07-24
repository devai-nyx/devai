import type { CAC } from 'cac';
import {
  acquireLocks,
  adoptWorktree,
  clusterStatus,
  completeTask,
  createWorktree,
  destroyWorktree,
  dropTask as dbDropTask,
  escalateTask,
  listLocks,
  listTasks,
  listWorktrees,
  pauseTaskForRgr,
  provisionTask,
  reapLocks,
  reapWorktrees,
  rebuildTemplate,
  releaseLocks,
  resumeTaskFromRgr,
  spawnTask,
  startShared,
  stopShared,
  TASK_ID_PATTERN,
} from '#core-compat';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { validateOrExit } from '../../validate-emit.js';

const SUBSTRATE_VALUES: ReadonlySet<string> = new Set(['F1', 'F2', 'F3', 'F4', 'F5']);
const DISCIPLINE_VALUES: ReadonlySet<string> = new Set([
  'owner',
  'architect',
  'inspector',
  'engineer',
  'auditor',
]);

/**
 * Normalize a module ref to MOD-* form. Accepts both bare names and
 * already-prefixed values; rejects empty strings.
 */
function normalizeModuleId(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) throw new Error('module id is empty');
  return trimmed.startsWith('MOD-') ? trimmed : `MOD-${trimmed}`;
}

const DEFAULT_REPO_ROOT = '.';

function emit(json: unknown, human: boolean, humanText: string): void {
  if (human) process.stdout.write(humanText.endsWith('\n') ? humanText : humanText + '\n');
  else process.stdout.write(JSON.stringify(json) + '\n');
}

function locksDir(repoRoot: string): string {
  return `${repoRoot}/.devai/state/locks`;
}

// ============================================================================
// DB lifecycle (5 commands)
// ============================================================================

export const dbStartShared = defineCommand({
  name: 'db start-shared',
  description: 'Start the shared dev Postgres cluster via Docker.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('db-start-shared', 'Start the shared dev Postgres cluster (Docker)')
      .option('--port <n>', 'Host port (default: 5433)')
      .option('--image <ref>', 'Postgres image (default: postgres:15-alpine)')
      .option('--container-name <name>', 'Docker container name (default: devai-shared-pg)')
      .option('--human', 'Human-readable output')
      .action(
        (options: { port?: number; image?: string; containerName?: string; human?: boolean }) => {
          const password = process.env['DEVAI_DB_PASSWORD'];
          if (password === undefined || password.length === 0) {
            process.stderr.write(
              'devai work db start shared: DEVAI_DB_PASSWORD is required; plaintext password flags are not accepted\n',
            );
            process.exit(EXIT_USAGE);
          }
          const result = startShared({
            ...(options.port !== undefined && { port: options.port }),
            ...(options.image !== undefined && { image: options.image }),
            password,
            ...(options.containerName !== undefined && { containerName: options.containerName }),
          });
          emit(
            result,
            options.human === true,
            `db start-shared: ${result.ok ? 'ok' : 'FAIL'}` +
              (result.connection !== undefined
                ? `\n  url: ${result.connection.redacted_url}`
                : '') +
              (result.error !== undefined ? `\n  error: ${result.error}` : ''),
          );
          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        },
      );
  },
});

export const dbStopShared = defineCommand({
  name: 'db stop-shared',
  description: 'Stop the shared dev Postgres cluster Docker container.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('db-stop-shared', 'Stop the shared dev Postgres cluster')
      .option('--container-name <name>', 'Docker container name (default: devai-shared-pg)')
      .option('--human', 'Human-readable output')
      .action((options: { containerName?: string; human?: boolean }) => {
        const result = stopShared({
          ...(options.containerName !== undefined && { containerName: options.containerName }),
        });
        emit(
          result,
          options.human === true,
          `db stop-shared: ${result.ok ? 'ok' : 'FAIL'}` +
            (result.error !== undefined ? ` (${result.error})` : ''),
        );
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

export const dbStatus = defineCommand({
  name: 'db status',
  description: 'Report shared-cluster + per-task DB status.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('db-status', 'Cluster + per-task DB status')
      .option('--container-name <name>', 'Docker container name (default: devai-shared-pg)')
      .option('--database-url <url>', 'Postgres URL for per-task DB enumeration')
      .option('--human', 'Human-readable output')
      .action((options: { containerName?: string; databaseUrl?: string; human?: boolean }) => {
        const result = clusterStatus({
          ...(options.containerName !== undefined && { containerName: options.containerName }),
          ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
        });
        emit(
          result,
          options.human === true,
          `db status: container ${result.container.name} ${result.container.running ? 'RUNNING' : 'STOPPED'}\n  task DBs: ${result.task_dbs.length === 0 ? '(none)' : result.task_dbs.join(', ')}`,
        );
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

export const dbRebuildTemplate = defineCommand({
  name: 'db rebuild-template',
  description: 'Drop+recreate the devai_template database',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('db-rebuild-template', 'Drop+recreate devai_template')
      .option('--database-url <url>', 'Postgres URL (required)')
      .option('--human', 'Human-readable output')
      .action((options: { databaseUrl?: string; human?: boolean }) => {
        if (options.databaseUrl === undefined) {
          process.stderr.write('devai work db rebuild template: --database-url is required\n');
          process.exit(EXIT_USAGE);
        }
        const result = rebuildTemplate({ databaseUrl: options.databaseUrl });
        emit(
          result,
          options.human === true,
          `db rebuild-template: ${result.ok ? 'ok' : 'FAIL'} (${result.error ?? ''})`,
        );
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

export const dbProvision = defineCommand({
  name: 'db provision',
  description: 'CREATE DATABASE devai_task_<id> TEMPLATE devai_template',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('db-provision <task-id>', 'Provision a per-task DB from the template')
      .option('--database-url <url>', 'Postgres URL (required)')
      .option('--human', 'Human-readable output')
      .action((taskId: string, options: { databaseUrl?: string; human?: boolean }) => {
        if (options.databaseUrl === undefined) {
          process.stderr.write('devai work db provision: --database-url is required\n');
          process.exit(EXIT_USAGE);
        }
        const result = provisionTask({ databaseUrl: options.databaseUrl, taskId });
        emit(
          result,
          options.human === true,
          `db provision: ${result.ok ? 'ok' : 'FAIL'} (${result.database ?? result.error ?? ''})`,
        );
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

export const dbDrop = defineCommand({
  name: 'db drop',
  description: 'Terminate connections + DROP DATABASE devai_task_<id>',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('db-drop <task-id>', 'Drop a per-task DB')
      .option('--database-url <url>', 'Postgres URL (required)')
      .option('--human', 'Human-readable output')
      .action((taskId: string, options: { databaseUrl?: string; human?: boolean }) => {
        if (options.databaseUrl === undefined) {
          process.stderr.write('devai work db drop: --database-url is required\n');
          process.exit(EXIT_USAGE);
        }
        const result = dbDropTask({ databaseUrl: options.databaseUrl, taskId });
        emit(
          result,
          options.human === true,
          `db drop: ${result.ok ? 'ok' : 'FAIL'} (${result.database ?? result.error ?? ''})`,
        );
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

// ============================================================================
// Lock subsystem (4 commands)
// ============================================================================

export const lockAcquire = defineCommand({
  name: 'lock acquire',
  description: 'Acquire module-level locks for a task',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('lock-acquire <task-id>', 'Acquire locks (one lock per --target)')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--target <ref>', 'Target as <substrate>:<module> (repeatable)')
      .option('--ttl-ms <n>', 'Lock TTL in ms (default: 3600000 = 1 hour)')
      .option('--human', 'Human-readable output')
      .action(
        (
          taskId: string,
          options: {
            repoRoot?: string;
            target?: string | string[];
            ttlMs?: string;
            human?: boolean;
          },
        ) => {
          const targets = Array.isArray(options.target)
            ? options.target
            : options.target !== undefined
              ? [options.target]
              : [];
          if (targets.length === 0) {
            process.stderr.write('devai work lock acquire: at least one --target is required\n');
            process.exit(EXIT_USAGE);
          }
          const result = acquireLocks({
            locksDir: locksDir(options.repoRoot ?? DEFAULT_REPO_ROOT),
            taskId,
            targets,
            ...(options.ttlMs !== undefined && { ttlMs: Number(options.ttlMs) }),
          });
          emit(
            result,
            options.human === true,
            `lock acquire: ${String(result.acquired.length)} acquired, ${String(result.denied.length)} denied`,
          );
          process.exit(result.denied.length === 0 ? EXIT_PASS : EXIT_FAIL);
        },
      );
  },
});

export const lockRelease = defineCommand({
  name: 'lock release',
  description: 'Release every lock held by a task',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('lock-release <task-id>', 'Release every lock held by this task')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((taskId: string, options: { repoRoot?: string; human?: boolean }) => {
        const released = releaseLocks({
          locksDir: locksDir(options.repoRoot ?? DEFAULT_REPO_ROOT),
          taskId,
        });
        emit(
          { released },
          options.human === true,
          `lock release: ${String(released.length)} lock(s) released for ${taskId}`,
        );
        process.exit(EXIT_PASS);
      });
  },
});

export const lockList = defineCommand({
  name: 'lock list',
  description: 'List all currently-held locks',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('lock-list', 'List held locks')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const locks = listLocks({ locksDir: locksDir(options.repoRoot ?? DEFAULT_REPO_ROOT) });
        emit(
          { count: locks.length, locks },
          options.human === true,
          `lock list: ${String(locks.length)} held lock(s)\n` +
            locks
              .map(
                (l) =>
                  `  ${l.task_id}  ${l.substrate}:${l.module}  (age: ${String(Math.round((Date.now() - new Date(l.acquired_at).getTime()) / 1000))}s)`,
              )
              .join('\n'),
        );
        process.exit(EXIT_PASS);
      });
  },
});

export const lockReap = defineCommand({
  name: 'lock reap',
  description: 'Remove expired locks (TTL janitor)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('lock-reap', 'Reap expired locks')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const removed = reapLocks({ locksDir: locksDir(options.repoRoot ?? DEFAULT_REPO_ROOT) });
        emit(
          { removed },
          options.human === true,
          `lock reap: ${String(removed.length)} expired lock(s) removed`,
        );
        process.exit(EXIT_PASS);
      });
  },
});

// ============================================================================
// Worktree subsystem (5 commands)
// ============================================================================

export const worktreeCreate = defineCommand({
  name: 'worktree create',
  description: 'Create a git worktree under .devai/worktrees/<id>',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('worktree-create <id>', 'Create a git worktree')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--branch <name>', 'Branch to create (default: <id>)')
      .option('--base-ref <ref>', 'Base ref (default: HEAD)')
      .option('--task-id <id>', 'Associated task id')
      .option('--human', 'Human-readable output')
      .action(
        (
          id: string,
          options: {
            repoRoot?: string;
            branch?: string;
            baseRef?: string;
            taskId?: string;
            human?: boolean;
          },
        ) => {
          try {
            const record = createWorktree({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              id,
              branch: options.branch ?? id,
              ...(options.baseRef !== undefined && { baseRef: options.baseRef }),
              ...(options.taskId !== undefined && { taskId: options.taskId }),
            });
            emit(
              record,
              options.human === true,
              `worktree create: ${record.path} on ${record.branch}`,
            );
            process.exit(EXIT_PASS);
          } catch (err) {
            process.stderr.write(
              `devai work worktree create: ${err instanceof Error ? err.message : String(err)}\n`,
            );
            process.exit(EXIT_FAIL);
          }
        },
      );
  },
});

export const worktreeDestroy = defineCommand({
  name: 'worktree destroy',
  description: 'Remove a git worktree and unregister it',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('worktree-destroy <id>', 'Remove a worktree')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((id: string, options: { repoRoot?: string; human?: boolean }) => {
        try {
          destroyWorktree({ repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT, id });
          emit({ id, destroyed: true }, options.human === true, `worktree destroy: ${id} removed`);
          process.exit(EXIT_PASS);
        } catch (err) {
          process.stderr.write(
            `devai work worktree destroy: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const worktreeList = defineCommand({
  name: 'worktree list',
  description: 'List registered worktrees',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('worktree-list', 'List worktrees')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const records = listWorktrees({ repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT });
        emit(
          { count: records.length, worktrees: records },
          options.human === true,
          `worktree list: ${String(records.length)} worktree(s)\n` +
            records.map((w) => `  ${w.id}  ${w.branch}  (${w.path})`).join('\n'),
        );
        process.exit(EXIT_PASS);
      });
  },
});

export const worktreeAdopt = defineCommand({
  name: 'worktree adopt',
  description: 'Adopt an existing branch into a human-flagged worktree (cap-exempt)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('worktree-adopt <branch>', 'Adopt a branch as a human-flagged worktree')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((branch: string, options: { repoRoot?: string; human?: boolean }) => {
        try {
          const record = adoptWorktree({ repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT, branch });
          emit(record, options.human === true, `worktree adopt: ${record.id} on ${record.branch}`);
          process.exit(EXIT_PASS);
        } catch (err) {
          process.stderr.write(
            `devai work worktree adopt: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const worktreeReap = defineCommand({
  name: 'worktree reap',
  description: 'Remove orphan worktrees not in the registry',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('worktree-reap', 'Reap orphan worktrees')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const reaped = reapWorktrees({ repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT });
        emit(
          { reaped },
          options.human === true,
          `worktree reap: ${String(reaped.length)} orphan(s) removed`,
        );
        process.exit(EXIT_PASS);
      });
  },
});

// ============================================================================
// Task lifecycle (5 commands)
// ============================================================================

export const taskSpawn = defineCommand({
  name: 'task spawn',
  description:
    'Spawn a task: acquire locks; optionally create worktree and provision per-task DB (atomic with rollback on failure)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('task-spawn <task-id>', 'Spawn a task record')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--title <text>', 'Task title (required)')
      .option('--discipline <name>', 'owner|architect|inspector|engineer|auditor (required)')
      .option('--module <id>', 'Target module (repeatable; required for locks)')
      .option('--substrate <id>', 'F1|F2|F3|F4|F5 (repeatable; required)')
      .option(
        '--with-worktree',
        'After locks, create a git worktree under .devai/worktrees/WT-<id>',
      )
      .option(
        '--with-db',
        'After worktree, provision devai_task_<id> Postgres database (requires --database-url)',
      )
      .option('--database-url <url>', 'Postgres URL (required for --with-db)')
      .option('--base-ref <ref>', 'Base ref for the worktree (default: HEAD)')
      .option('--human', 'Human-readable output')
      .action(
        (
          taskId: string,
          options: {
            repoRoot?: string;
            title?: string;
            discipline?: string;
            module?: string | string[];
            substrate?: string | string[];
            withWorktree?: boolean;
            withDb?: boolean;
            databaseUrl?: string;
            baseRef?: string;
            human?: boolean;
          },
        ) => {
          if (options.title === undefined || options.discipline === undefined) {
            process.stderr.write('devai work task spawn: --title and --discipline are required\n');
            process.exit(EXIT_USAGE);
          }
          if (!TASK_ID_PATTERN.test(taskId)) {
            process.stderr.write(
              `devai work task spawn: task id '${taskId}' must match TASK-<digits> (e.g. TASK-0001)\n`,
            );
            process.exit(EXIT_USAGE);
          }
          if (!DISCIPLINE_VALUES.has(options.discipline)) {
            process.stderr.write(
              `devai work task spawn: invalid --discipline '${options.discipline}' (expected: ${[...DISCIPLINE_VALUES].join('|')})\n`,
            );
            process.exit(EXIT_USAGE);
          }
          const rawModules = Array.isArray(options.module)
            ? options.module
            : options.module !== undefined
              ? [options.module]
              : [];
          const modules: string[] = [];
          for (const m of rawModules) {
            try {
              modules.push(normalizeModuleId(m));
            } catch (err) {
              process.stderr.write(
                `devai work task spawn: ${err instanceof Error ? err.message : String(err)}\n`,
              );
              process.exit(EXIT_USAGE);
            }
          }
          const rawSubstrates = Array.isArray(options.substrate)
            ? options.substrate
            : options.substrate !== undefined
              ? [options.substrate]
              : [];
          if (rawSubstrates.length === 0) {
            process.stderr.write(
              'devai work task spawn: at least one --substrate is required (per task.schema.json target_substrates minItems:1)\n',
            );
            process.exit(EXIT_USAGE);
          }
          for (const s of rawSubstrates) {
            if (!SUBSTRATE_VALUES.has(s)) {
              process.stderr.write(
                `devai work task spawn: invalid --substrate '${s}' (expected: F1|F2|F3|F4|F5)\n`,
              );
              process.exit(EXIT_USAGE);
            }
          }
          const substrates = rawSubstrates as ('F1' | 'F2' | 'F3' | 'F4' | 'F5')[];
          if (options.withDb === true && options.databaseUrl === undefined) {
            process.stderr.write('devai work task spawn: --with-db requires --database-url\n');
            process.exit(EXIT_USAGE);
          }
          const result = spawnTask({
            repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
            task: {
              id: taskId,
              title: options.title,
              discipline: options.discipline as 'engineer',
              target_modules: modules,
              target_substrates: substrates,
              db_isolation: 'database',
            },
            ...(options.withWorktree === true && { withWorktree: true }),
            ...(options.withDb === true && { withDb: true }),
            ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
            ...(options.baseRef !== undefined && { baseRef: options.baseRef }),
          });
          validateOrExit(validators.task, result.task, 'task', 'devai work task spawn');
          const extras: string[] = [];
          if (result.worktree_path !== null) extras.push(`worktree=${result.worktree_path}`);
          if (result.database !== null) extras.push(`db=${result.database}`);
          if (result.rollback_reason !== null)
            extras.push(`ROLLED BACK: ${result.rollback_reason}`);
          emit(
            result,
            options.human === true,
            `task spawn: ${result.task.id} → ${result.task.status}` +
              (result.lock_denied.length > 0
                ? ` (${String(result.lock_denied.length)} denied)`
                : '') +
              (extras.length > 0 ? `\n  ${extras.join('\n  ')}` : ''),
          );
          // Exit non-zero for lock_denied or rolled-back-to-cancelled.
          const isFailure =
            result.task.status === 'lock_denied' ||
            result.task.status === 'cancelled' ||
            result.rollback_reason !== null;
          process.exit(isFailure ? EXIT_FAIL : EXIT_PASS);
        },
      );
  },
});

export const taskComplete = defineCommand({
  name: 'task complete',
  description: 'Mark a task completed (releases locks; optionally tears down worktree + DB)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('task-complete <task-id>', 'Mark task completed')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--destroy-worktree', 'Also destroy the task worktree if present')
      .option('--database-url <url>', 'If set, drop the per-task Postgres database')
      .option('--human', 'Human-readable output')
      .action(
        (
          taskId: string,
          options: {
            repoRoot?: string;
            destroyWorktree?: boolean;
            databaseUrl?: string;
            human?: boolean;
          },
        ) => {
          try {
            const updated = completeTask({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              taskId,
              ...(options.destroyWorktree === true && { destroyWorktree: true }),
              ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
            });
            validateOrExit(validators.task, updated, 'task', 'devai work task complete');
            emit(
              updated,
              options.human === true,
              `task complete: ${updated.id} → ${updated.status}`,
            );
            process.exit(EXIT_PASS);
          } catch (err) {
            process.stderr.write(
              `devai work task complete: ${err instanceof Error ? err.message : String(err)}\n`,
            );
            process.exit(EXIT_FAIL);
          }
        },
      );
  },
});

export const taskEscalate = defineCommand({
  name: 'task escalate',
  description: 'Escalate a task to human (renames branch + releases locks; optional tear-down)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('task-escalate <task-id>', 'Escalate a task to human')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--destroy-worktree', 'Also destroy the task worktree if present')
      .option('--database-url <url>', 'If set, drop the per-task Postgres database')
      .option('--human', 'Human-readable output')
      .action(
        (
          taskId: string,
          options: {
            repoRoot?: string;
            destroyWorktree?: boolean;
            databaseUrl?: string;
            human?: boolean;
          },
        ) => {
          try {
            const updated = escalateTask({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              taskId,
              ...(options.destroyWorktree === true && { destroyWorktree: true }),
              ...(options.databaseUrl !== undefined && { databaseUrl: options.databaseUrl }),
            });
            validateOrExit(validators.task, updated, 'task', 'devai work task escalate');
            emit(
              updated,
              options.human === true,
              `task escalate: ${updated.id} → ${updated.status} (${updated.branch ?? ''})`,
            );
            process.exit(EXIT_PASS);
          } catch (err) {
            process.stderr.write(
              `devai work task escalate: ${err instanceof Error ? err.message : String(err)}\n`,
            );
            process.exit(EXIT_FAIL);
          }
        },
      );
  },
});

export const taskPauseRgr = defineCommand({
  name: 'task pause-rgr',
  description: 'Pause a task on a Reference Gap Report',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('task-pause-rgr <task-id>', 'Pause a task on an RGR')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--rgr-id <id>', 'RGR id (required)')
      .option('--human', 'Human-readable output')
      .action((taskId: string, options: { repoRoot?: string; rgrId?: string; human?: boolean }) => {
        if (options.rgrId === undefined) {
          process.stderr.write('devai work task pause rgr: --rgr-id is required\n');
          process.exit(EXIT_USAGE);
        }
        try {
          const updated = pauseTaskForRgr({
            repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
            taskId,
            rgrId: options.rgrId,
          });
          validateOrExit(validators.task, updated, 'task', 'devai work task pause rgr');
          emit(
            updated,
            options.human === true,
            `task pause-rgr: ${updated.id} → ${updated.status}`,
          );
          process.exit(EXIT_PASS);
        } catch (err) {
          process.stderr.write(
            `devai work task pause rgr: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const taskResumeRgr = defineCommand({
  name: 'task resume-rgr',
  description: 'Resume the task paused on an RGR',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('task-resume-rgr <rgr-id>', 'Resume the task paused on this RGR')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((rgrId: string, options: { repoRoot?: string; human?: boolean }) => {
        try {
          const updated = resumeTaskFromRgr({
            repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
            rgrId,
          });
          validateOrExit(validators.task, updated, 'task', 'devai work task resume rgr');
          emit(
            updated,
            options.human === true,
            `task resume-rgr: ${updated.id} → ${updated.status}`,
          );
          process.exit(EXIT_PASS);
        } catch (err) {
          process.stderr.write(
            `devai work task resume rgr: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const taskList = defineCommand({
  name: 'task list',
  description: 'List all task records',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('task-list', 'List task records')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const records = listTasks(options.repoRoot ?? DEFAULT_REPO_ROOT);
        emit(
          { count: records.length, tasks: records },
          options.human === true,
          `task list: ${String(records.length)} task(s)\n` +
            records.map((t) => `  ${t.id}  ${t.status}  ${t.discipline}  '${t.title}'`).join('\n'),
        );
        process.exit(EXIT_PASS);
      });
  },
});
