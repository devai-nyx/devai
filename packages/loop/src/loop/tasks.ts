import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { parsers } from '@devai-nyx/schemas';
import { join } from 'node:path';
import { provisionTask, dropTask } from './db.js';
import { acquireLocks, releaseLocks } from './locks.js';
import { createWorktree, destroyWorktree } from './worktrees.js';

export type TaskStatus =
  | 'queued'
  | 'ready'
  | 'lock_denied'
  | 'in_progress'
  | 'checkpoint'
  | 'pre_merge'
  | 'merging'
  | 'completed'
  | 'awaiting_human_review'
  | 'experimental_blocked'
  | 'escalated'
  | 'rgr_pending'
  | 'cancelled';

export type TaskDiscipline = 'owner' | 'architect' | 'inspector' | 'engineer' | 'auditor';
export type TaskSubstrate = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';

/**
 * Schema-conformant Task record per task.schema.json
 * (additionalProperties: false). Note: there is no `paused_rgr_id`
 * field — the RGR pause is encoded in `tags` as `rgr_pause:<RGR-id>`,
 * a convention this module owns end-to-end.
 */
export interface TaskRecord {
  schemaVersion: '1.0.0';
  id: string; // TASK-[0-9]{4,}
  status: TaskStatus;
  discipline: TaskDiscipline;
  title: string;
  description?: string;
  lifecycle?: 'supported' | 'experimental';
  acceptance_commands?: string[][];
  target_modules: string[]; // each ^MOD-
  target_substrates: TaskSubstrate[]; // minItems 1
  created_at: string;
  db_isolation: 'database' | 'cluster';
  iteration_count: number;
  spawned_at?: string | null;
  completed_at?: string | null;
  branch?: string | null;
  worktree_id?: string | null; // ^WT- when set
  prompt_composition_id?: string | null;
  priority?: number;
  tags?: string[];
}

const RGR_PAUSE_TAG_PREFIX = 'rgr_pause:';

export function getPausedRgrId(task: Pick<TaskRecord, 'tags'>): string | null {
  for (const t of task.tags ?? []) {
    if (t.startsWith(RGR_PAUSE_TAG_PREFIX)) return t.slice(RGR_PAUSE_TAG_PREFIX.length);
  }
  return null;
}

function setPausedRgrId(task: TaskRecord, rgrId: string): TaskRecord {
  const tags = [...(task.tags ?? []).filter((t) => !t.startsWith(RGR_PAUSE_TAG_PREFIX))];
  tags.push(`${RGR_PAUSE_TAG_PREFIX}${rgrId}`);
  return { ...task, tags };
}

function clearPausedRgrId(task: TaskRecord): TaskRecord {
  const tags = (task.tags ?? []).filter((t) => !t.startsWith(RGR_PAUSE_TAG_PREFIX));
  if (tags.length === 0) {
    const { tags: _drop, ...rest } = task;
    void _drop;
    return rest;
  }
  return { ...task, tags };
}

export interface SpawnTaskOptions {
  readonly repoRoot: string;
  readonly task: Omit<TaskRecord, 'schemaVersion' | 'status' | 'created_at' | 'iteration_count'> & {
    status?: TaskStatus;
  };
  /**
   * If true, create a git worktree for the task after locks acquire.
   * The worktree id is `WT-<task-id>` and the branch defaults to the
   * task id (e.g. `TASK-0001`). Failure to create the worktree releases
   * the locks and surfaces the error.
   */
  readonly withWorktree?: boolean;
  /**
   * If true, provision a per-task Postgres database after locks acquire
   * (and after worktree creation if both are requested). Requires
   * `databaseUrl`. Failure rolls back the worktree (if any) and locks.
   */
  readonly withDb?: boolean;
  readonly databaseUrl?: string;
  /** Base ref for the worktree (default: HEAD). */
  readonly baseRef?: string;
}

function tasksDir(repoRoot: string): string {
  return join(repoRoot, '.devai/state/tasks');
}

function taskPath(repoRoot: string, id: string): string {
  return join(tasksDir(repoRoot), `${id}.json`);
}

export function saveTask(repoRoot: string, task: TaskRecord): void {
  mkdirSync(tasksDir(repoRoot), { recursive: true });
  const validated = parsers.task.parse(task);
  writeFileSync(taskPath(repoRoot, task.id), JSON.stringify(validated, null, 2) + '\n');
}

export function loadTask(repoRoot: string, id: string): TaskRecord {
  const path = taskPath(repoRoot, id);
  if (!existsSync(path)) throw new Error(`task ${id} not found at ${path}`);
  return parsers.task.parseJson<TaskRecord>(readFileSync(path, 'utf8'));
}

export function listTasks(repoRoot: string): readonly TaskRecord[] {
  const dir = tasksDir(repoRoot);
  if (!existsSync(dir)) return [];
  const records: TaskRecord[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    try {
      records.push(parsers.task.parseJson<TaskRecord>(readFileSync(join(dir, name), 'utf8')));
    } catch {
      // skip
    }
  }
  return records.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export interface SpawnResult {
  readonly task: TaskRecord;
  readonly lock_denied: readonly { target: string; held_by: string }[];
  /** Path of the worktree if one was created; otherwise null. */
  readonly worktree_path: string | null;
  /** Database name provisioned for this task, or null. */
  readonly database: string | null;
  /** Errors encountered after locks were acquired (rolled-back). */
  readonly rollback_reason: string | null;
}

/**
 * Spawn a task and (optionally) compose the full execution environment
 * around it: module locks → git worktree → per-task Postgres database
 * → status=ready (or lock_denied / failed-rollback).
 *
 * The composition is transactional in the rollback sense: if any
 * downstream step (worktree, DB) fails, the upstream steps already
 * taken are reversed (worktree destroyed, locks released). A failed
 * spawn never leaves the substrate half-initialized.
 *
 * Backward-compatible: with `withWorktree:false` and `withDb:false`
 * (the defaults), behavior is exactly the previous MVP — acquire locks
 * + persist record.
 */
export function spawnTask(opts: SpawnTaskOptions): SpawnResult {
  const locksDir = join(opts.repoRoot, '.devai/state/locks');
  const lockResult = acquireLocks({
    locksDir,
    taskId: opts.task.id,
    targets: opts.task.target_modules.map((m) => `F2:${m}`),
  });

  // Lock-denied: never attempt worktree/DB; persist the record and return.
  if (lockResult.denied.length > 0) {
    const task: TaskRecord = {
      schemaVersion: '1.0.0',
      ...opts.task,
      status: 'lock_denied',
      iteration_count: 0,
      created_at: new Date().toISOString(),
    };
    saveTask(opts.repoRoot, task);
    return {
      task,
      lock_denied: lockResult.denied,
      worktree_path: null,
      database: null,
      rollback_reason: null,
    };
  }

  // Locks acquired. Attempt worktree (if requested), then DB (if requested).
  let worktreePath: string | null = null;
  let database: string | null = null;
  const worktreeId = `WT-${opts.task.id}`;

  if (opts.withWorktree === true) {
    try {
      const wt = createWorktree({
        repoRoot: opts.repoRoot,
        id: worktreeId,
        branch: opts.task.id,
        baseRef: opts.baseRef ?? 'HEAD',
        taskId: opts.task.id,
      });
      worktreePath = wt.path;
    } catch (err) {
      // Rollback: release locks; no worktree to destroy.
      releaseLocks({ locksDir, taskId: opts.task.id });
      const task: TaskRecord = {
        schemaVersion: '1.0.0',
        ...opts.task,
        status: 'cancelled',
        iteration_count: 0,
        created_at: new Date().toISOString(),
      };
      saveTask(opts.repoRoot, task);
      return {
        task,
        lock_denied: [],
        worktree_path: null,
        database: null,
        rollback_reason: `worktree creation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (opts.withDb === true) {
    if (opts.databaseUrl === undefined) {
      // Rollback worktree + locks.
      if (opts.withWorktree === true) {
        try {
          destroyWorktree({ repoRoot: opts.repoRoot, id: worktreeId });
        } catch {
          // best-effort
        }
      }
      releaseLocks({ locksDir, taskId: opts.task.id });
      const task: TaskRecord = {
        schemaVersion: '1.0.0',
        ...opts.task,
        status: 'cancelled',
        iteration_count: 0,
        created_at: new Date().toISOString(),
      };
      saveTask(opts.repoRoot, task);
      return {
        task,
        lock_denied: [],
        worktree_path: null,
        database: null,
        rollback_reason: 'DB provisioning requested but databaseUrl is undefined',
      };
    }
    const dbRes = provisionTask({ databaseUrl: opts.databaseUrl, taskId: opts.task.id });
    if (!dbRes.ok) {
      if (opts.withWorktree === true) {
        try {
          destroyWorktree({ repoRoot: opts.repoRoot, id: worktreeId });
        } catch {
          // best-effort
        }
      }
      releaseLocks({ locksDir, taskId: opts.task.id });
      const task: TaskRecord = {
        schemaVersion: '1.0.0',
        ...opts.task,
        status: 'cancelled',
        iteration_count: 0,
        created_at: new Date().toISOString(),
      };
      saveTask(opts.repoRoot, task);
      return {
        task,
        lock_denied: [],
        worktree_path: null,
        database: null,
        rollback_reason: `DB provisioning failed: ${dbRes.error ?? 'unknown error'}`,
      };
    }
    database = dbRes.database ?? null;
  }

  // All steps succeeded — record final state.
  const composed = opts.withWorktree === true || opts.withDb === true;
  const task: TaskRecord = {
    schemaVersion: '1.0.0',
    ...opts.task,
    // If we composed a full environment, the task is in_progress (ready
    // to run). Otherwise it's just 'ready' awaiting environment.
    status: composed ? 'in_progress' : 'ready',
    iteration_count: 0,
    created_at: new Date().toISOString(),
    ...(worktreePath !== null && { worktree_id: worktreeId, branch: opts.task.id }),
  };
  saveTask(opts.repoRoot, task);
  return {
    task,
    lock_denied: [],
    worktree_path: worktreePath,
    database,
    rollback_reason: null,
  };
}

/**
 * Drop the per-task DB if a databaseUrl is supplied. Best-effort.
 * Used by completeTask/escalateTask in their composition paths.
 */
function maybeDropTaskDb(databaseUrl: string | undefined, taskId: string): void {
  if (databaseUrl === undefined) return;
  try {
    dropTask({ databaseUrl, taskId });
  } catch {
    // best-effort; the operator may have already cleaned up.
  }
}

export interface TransitionOptions {
  readonly repoRoot: string;
  readonly taskId: string;
  /** If set, drop the per-task DB during the transition. */
  readonly databaseUrl?: string;
  /** If true, destroy the task's worktree during the transition. */
  readonly destroyWorktree?: boolean;
}

export function completeTask(opts: TransitionOptions): TaskRecord {
  const task = loadTask(opts.repoRoot, opts.taskId);
  const updated: TaskRecord = { ...task, status: 'completed' };
  saveTask(opts.repoRoot, updated);
  if (opts.destroyWorktree === true && typeof task.worktree_id === 'string') {
    try {
      destroyWorktree({ repoRoot: opts.repoRoot, id: task.worktree_id });
    } catch {
      // best-effort
    }
  }
  maybeDropTaskDb(opts.databaseUrl, opts.taskId);
  releaseLocks({ locksDir: join(opts.repoRoot, '.devai/state/locks'), taskId: opts.taskId });
  return updated;
}

export function escalateTask(opts: TransitionOptions): TaskRecord {
  const task = loadTask(opts.repoRoot, opts.taskId);
  const updated: TaskRecord = {
    ...task,
    status: 'escalated',
    ...(typeof task.branch === 'string' &&
      task.branch.length > 0 && {
        branch: `escalated/${task.branch}`,
      }),
  };
  saveTask(opts.repoRoot, updated);
  if (opts.destroyWorktree === true && typeof task.worktree_id === 'string') {
    try {
      destroyWorktree({ repoRoot: opts.repoRoot, id: task.worktree_id });
    } catch {
      // best-effort
    }
  }
  maybeDropTaskDb(opts.databaseUrl, opts.taskId);
  releaseLocks({ locksDir: join(opts.repoRoot, '.devai/state/locks'), taskId: opts.taskId });
  return updated;
}

export interface PauseRgrOptions extends TransitionOptions {
  readonly rgrId: string;
}

export function pauseTaskForRgr(opts: PauseRgrOptions): TaskRecord {
  const task = loadTask(opts.repoRoot, opts.taskId);
  let updated: TaskRecord = {
    ...task,
    status: 'rgr_pending',
    ...(typeof task.branch === 'string' &&
      task.branch.length > 0 && {
        branch: `rgr/${task.branch}`,
      }),
  };
  updated = setPausedRgrId(updated, opts.rgrId);
  saveTask(opts.repoRoot, updated);
  releaseLocks({ locksDir: join(opts.repoRoot, '.devai/state/locks'), taskId: opts.taskId });
  return updated;
}

export interface ResumeRgrOptions {
  readonly repoRoot: string;
  readonly rgrId: string;
}

export function resumeTaskFromRgr(opts: ResumeRgrOptions): TaskRecord {
  const tasks = listTasks(opts.repoRoot);
  const target = tasks.find((t) => getPausedRgrId(t) === opts.rgrId);
  if (target === undefined) throw new Error(`no task paused on RGR ${opts.rgrId}`);
  const cleared = clearPausedRgrId(target);
  const updated: TaskRecord = { ...cleared, status: 'queued' };
  saveTask(opts.repoRoot, updated);
  return updated;
}
