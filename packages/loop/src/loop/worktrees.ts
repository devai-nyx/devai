import { execFileSync } from '@devai-nyx/authority';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { join, resolve } from 'node:path';

export interface WorktreeRecord {
  readonly id: string;
  readonly path: string;
  readonly branch: string;
  readonly task_id?: string;
  readonly created_at: string;
  readonly human_adopted?: boolean;
}

export interface CreateWorktreeOptions {
  readonly repoRoot: string;
  /** Worktree id, e.g. WT-<task-id> or WT-human-<branch>. */
  readonly id: string;
  /** Branch to create or check out. */
  readonly branch: string;
  /** Base ref (default: HEAD). */
  readonly baseRef?: string;
  readonly taskId?: string;
  readonly humanAdopted?: boolean;
}

function worktreesDir(repoRoot: string): string {
  return join(repoRoot, 'scratch/worktrees');
}

function registryPath(repoRoot: string): string {
  return join(repoRoot, '.devai/state/worktrees.json');
}

interface WorktreeRegistry {
  worktrees: WorktreeRecord[];
}

function loadRegistry(repoRoot: string): WorktreeRegistry {
  const path = registryPath(repoRoot);
  if (!existsSync(path)) return { worktrees: [] };
  return JSON.parse(readFileSync(path, 'utf8')) as WorktreeRegistry;
}

function saveRegistry(repoRoot: string, registry: WorktreeRegistry): void {
  const path = registryPath(repoRoot);
  mkdirSync(join(repoRoot, '.devai/state'), { recursive: true });
  writeFileSync(path, JSON.stringify(registry, null, 2) + '\n');
}

/**
 * Per-host cap on concurrent non-adopted worktrees. Set by D-52
 * (Phase 16.C; supersedes D-11's earlier value of 6). Human-adopted
 * worktrees are cap-exempt — they reflect deliberate human review
 * paths, not autonomous-loop parallelism. The cap can be raised
 * project-locally by editing this constant; a future `.devai/config/
 * limits.json` override surface is documented in D-52 as the
 * migration path when adopters need higher concurrency.
 */
export const WORKTREE_CAP = 3;

/**
 * Count active worktrees, excluding human-adopted ones (cap-exempt).
 * Active means present in the registry; orphan detection is the
 * separate `reapWorktrees` flow.
 */
function activeNonAdoptedCount(registry: WorktreeRegistry): number {
  return registry.worktrees.filter((w) => w.human_adopted !== true).length;
}

export function createWorktree(opts: CreateWorktreeOptions): WorktreeRecord {
  const registry = loadRegistry(opts.repoRoot);

  // Cap enforcement (D-52). Human-adopted worktrees are cap-exempt.
  // Re-creating an existing worktree id (the registry-update flow
  // below dedupes by id) does not count against the cap.
  const reusingExisting = registry.worktrees.some((w) => w.id === opts.id);
  if (
    !reusingExisting &&
    opts.humanAdopted !== true &&
    activeNonAdoptedCount(registry) >= WORKTREE_CAP
  ) {
    throw new Error(
      `worktree cap exceeded: ${String(WORKTREE_CAP)} non-adopted worktrees already active. ` +
        `Reap stale entries (devai work worktree reap) or wait for a task to complete. ` +
        `Cap is governed by D-52; human-adopted worktrees are exempt.`,
    );
  }

  const wtRoot = worktreesDir(opts.repoRoot);
  mkdirSync(wtRoot, { recursive: true });
  const wtPath = join(wtRoot, opts.id);

  execFileSync('git', ['worktree', 'add', '-b', opts.branch, wtPath, opts.baseRef ?? 'HEAD'], {
    cwd: opts.repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const record: WorktreeRecord = {
    id: opts.id,
    path: resolve(wtPath),
    branch: opts.branch,
    ...(opts.taskId !== undefined && { task_id: opts.taskId }),
    created_at: new Date().toISOString(),
    ...(opts.humanAdopted === true && { human_adopted: true }),
  };
  registry.worktrees = registry.worktrees.filter((w) => w.id !== opts.id);
  registry.worktrees.push(record);
  saveRegistry(opts.repoRoot, registry);
  return record;
}

export function destroyWorktree(opts: { repoRoot: string; id: string }): void {
  const registry = loadRegistry(opts.repoRoot);
  const record = registry.worktrees.find((w) => w.id === opts.id);
  if (record !== undefined) {
    try {
      execFileSync('git', ['worktree', 'remove', record.path, '--force'], {
        cwd: opts.repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      // Fall back to manual rm.
      try {
        rmSync(record.path, { recursive: true, force: true });
      } catch {
        // give up
      }
    }
  }
  registry.worktrees = registry.worktrees.filter((w) => w.id !== opts.id);
  saveRegistry(opts.repoRoot, registry);
}

export function listWorktrees(opts: { repoRoot: string }): readonly WorktreeRecord[] {
  return [...loadRegistry(opts.repoRoot).worktrees].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
}

export interface AdoptWorktreeOptions {
  readonly repoRoot: string;
  readonly branch: string;
}

export function adoptWorktree(opts: AdoptWorktreeOptions): WorktreeRecord {
  return createWorktree({
    repoRoot: opts.repoRoot,
    id: `WT-human-${opts.branch.replace(/\//g, '-')}`,
    branch: opts.branch,
    baseRef: opts.branch,
    humanAdopted: true,
  });
}

/** Detect orphan worktrees and either log or remove them. */
export function reapWorktrees(opts: { repoRoot: string }): readonly string[] {
  const reaped: string[] = [];
  const registry = loadRegistry(opts.repoRoot);
  const remaining: WorktreeRecord[] = [];
  for (const w of registry.worktrees) {
    if (!existsSync(w.path)) {
      reaped.push(w.id);
      continue;
    }
    remaining.push(w);
  }
  // Also detect directories under scratch/worktrees/ that the registry doesn't know about.
  const wtRoot = worktreesDir(opts.repoRoot);
  if (existsSync(wtRoot)) {
    for (const name of readdirSync(wtRoot)) {
      if (!remaining.some((w) => w.id === name)) {
        const fullPath = join(wtRoot, name);
        try {
          execFileSync('git', ['worktree', 'remove', fullPath, '--force'], {
            cwd: opts.repoRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        } catch {
          rmSync(fullPath, { recursive: true, force: true });
        }
        reaped.push(name);
      }
    }
  }
  registry.worktrees = remaining;
  saveRegistry(opts.repoRoot, registry);
  return reaped.sort();
}
