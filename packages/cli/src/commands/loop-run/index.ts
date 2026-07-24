import type { CAC } from 'cac';
import {
  appendBacklog,
  compactBacklog,
  createLlmClient,
  getSkill,
  pickNextTask,
  readBacklog,
  releaseLocks,
  resolveSensorParams,
  spawnTask,
  updateBacklogStatus,
  loadTask,
  saveTask,
} from '#core-compat';
import { join } from 'node:path';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { experimentalLoopRefusal } from '../../runtime-policy.js';

const DEFAULT_REPO_ROOT = '.';

/**
 * Phase 24.C (closes D-A-24): resolve adopter pack's
 * `extractor_params.llm.llm_timeouts: {[skillId]: ms}` for the
 * effective LLM-call timeout registry. Returns undefined when no
 * pack matches or the pack declares no llm timeouts. Skipping
 * pack resolution failures silently (timeout config is an opt-in
 * convenience, not a correctness gate).
 */
function resolvePackLlmTimeouts(repoRoot: string): Readonly<Record<string, number>> | undefined {
  try {
    const resolved = resolveSensorParams({ adopterRoot: repoRoot, sensorKind: 'llm' });
    const raw = resolved?.params['llm_timeouts'];
    if (raw === undefined || raw === null || typeof raw !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Phase-9 Batch 9.D — the autonomous orchestrator.
 *
 * `devai experimental loop run` reads the backlog, picks the highest-priority
 * queued task, spawns it with worktree+DB composition, invokes
 * SKILL-feedback-iteration with the shared LlmClient, and integrates
 * (or escalates) on the outcome.
 *
 * Per ADR-001:
 *   - Backlog is the only work queue (Article 35).
 *   - Per-task environment via task spawn --with-worktree --with-db.
 *   - Inner loop is SKILL-feedback-iteration; iteration cap is the
 *     task's max_iterations (default 3, Article 19).
 *   - On status:pass → mark backlog completed + task completed.
 *   - On status:fail → escalate task; mark backlog cancelled.
 */
export const loopRun = defineCommand({
  name: 'loop run',
  description: '[experimental] Prepare the next backlog task for human review.',
  authority: 'mesh_controller',
  lifecycle: 'experimental',
  lifecycle_reason:
    'D-126: autonomous preparation is opt-in and cannot merge, complete, or discard recoverable work.',
  promotion_criteria: [
    'Correct commit and integration semantics with no work-loss path',
    'Task-specific acceptance and complete hard-gate enforcement',
    'Deterministic full-loop E2E and a supervised live-adopter pilot',
  ],
  register(cli: CAC): void {
    cli
      .command('loop-run', 'Pick + spawn + iterate the next backlog task')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--max-iterations <n>', 'Override iteration cap (default: 3)')
      .option('--with-db', 'Provision per-task DB (requires --database-url)')
      .option('--database-url <url>', 'Postgres URL for --with-db')
      .option('--family <name>', "'claude' | 'codex' | 'auto' (default: auto)")
      .option(
        '--llm-timeout-ms <n>',
        'Override LLM call timeout (ms). Wins over per-skill defaults + pack config. Per-skill defaults: SKILL-feedback-iteration 600s, SKILL-triage/fix-* 300s, SKILL-assess-state 60s, others 120s. Phase 24.C / D-A-24.',
      )
      .option('--dry-run', 'Pick the task and print the plan; do NOT spawn or run the iteration')
      .option('--experimental', 'Acknowledge the experimental autonomous-loop lifecycle')
      .option('--write', 'Authorize this invocation to mutate the task worktree')
      .option('--human', 'Human-readable output')
      .action(
        async (options: {
          repoRoot?: string;
          maxIterations?: number;
          withDb?: boolean;
          databaseUrl?: string;
          family?: string;
          llmTimeoutMs?: number;
          dryRun?: boolean;
          experimental?: boolean;
          write?: boolean;
          human?: boolean;
        }) => {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const entry = pickNextTask(repoRoot);
          if (entry === null) {
            const payload = { picked: null, reason: 'backlog is empty or fully completed' };
            if (options.human === true) {
              process.stdout.write('loop run: backlog is empty or fully completed\n');
            } else {
              process.stdout.write(JSON.stringify(payload) + '\n');
            }
            process.exit(EXIT_PASS);
          }

          if (options.dryRun === true) {
            const payload = { picked: entry, dry_run: true, lifecycle: 'experimental' };
            if (options.human === true) {
              process.stdout.write(
                `loop run (dry): would pick ${entry.id} (priority ${String(entry.priority)}) — '${entry.title}'\n`,
              );
            } else {
              process.stdout.write(JSON.stringify(payload) + '\n');
            }
            process.exit(EXIT_PASS);
          }

          const refusal = experimentalLoopRefusal({
            repoRoot,
            experimental: options.experimental === true,
            write: options.write === true,
          });
          if (refusal !== null) {
            const payload = {
              code: 'EXPERIMENTAL_ACTIVATION_REQUIRED',
              lifecycle: 'experimental',
              error: refusal,
            };
            if (options.human === true) {
              process.stderr.write(
                `devai experimental loop run: experimental activation refused — ${refusal}\n`,
              );
            } else {
              process.stderr.write(JSON.stringify(payload) + '\n');
            }
            process.exit(EXIT_USAGE);
          }

          if (entry.description === undefined || entry.description.trim().length === 0) {
            process.stderr.write(
              'devai experimental loop run: experimental execution requires a task description\n',
            );
            process.exit(EXIT_USAGE);
          }
          if (entry.acceptance_commands === undefined || entry.acceptance_commands.length === 0) {
            process.stderr.write(
              'devai experimental loop run: experimental execution requires at least one acceptance command\n',
            );
            process.exit(EXIT_USAGE);
          }

          if (options.withDb === true && options.databaseUrl === undefined) {
            process.stderr.write(
              'devai experimental loop run: --with-db requires --database-url\n',
            );
            process.exit(EXIT_USAGE);
          }

          // 1. Mark in-progress in backlog.
          updateBacklogStatus(repoRoot, entry.id, 'in_progress');

          // 2. Spawn the task with the full environment.
          const targetModules = entry.target_modules ?? ['MOD-core'];
          const targetSubstrates = entry.target_substrates ?? (['F2'] as const);
          const spawn = spawnTask({
            repoRoot,
            task: {
              id: entry.id,
              title: entry.title,
              discipline: entry.discipline ?? 'engineer',
              target_modules: [...targetModules],
              target_substrates: [...targetSubstrates],
              db_isolation: entry.db_isolation ?? 'database',
              lifecycle: 'experimental',
              acceptance_commands: entry.acceptance_commands.map((command) => [...command]),
              ...(entry.description !== undefined && { description: entry.description }),
            },
            withWorktree: true,
            ...(options.withDb === true && { withDb: true, databaseUrl: options.databaseUrl }),
          });

          if (spawn.rollback_reason !== null || spawn.task.status === 'lock_denied') {
            updateBacklogStatus(repoRoot, entry.id, 'cancelled');
            const note =
              spawn.rollback_reason ?? `lock_denied: ${String(spawn.lock_denied.length)} module(s)`;
            if (options.human === true) {
              process.stdout.write(`loop run: spawn failed — ${note}\n`);
            } else {
              process.stdout.write(JSON.stringify({ picked: entry, spawn, error: note }) + '\n');
            }
            process.exit(EXIT_FAIL);
          }

          const worktreePath = spawn.worktree_path;
          if (worktreePath === null) {
            updateBacklogStatus(repoRoot, entry.id, 'cancelled');
            process.stderr.write(
              'devai experimental loop run: spawn succeeded but no worktree path returned\n',
            );
            process.exit(EXIT_FAIL);
          }

          // 3. Run SKILL-feedback-iteration with shared LlmClient, inside a
          // recovery boundary (R18.C.1, D-133/H5): from this point the task
          // is marked in_progress and holds locks + a worktree — an
          // unexpected exception must land in the same recoverable end-state
          // as a normal failure (experimental_blocked, locks released,
          // worktree preserved, recovery note emitted), never a strand.
          let result: Awaited<ReturnType<NonNullable<ReturnType<typeof getSkill>>['run']>>;
          try {
            if (process.env['DEVAI_TEST_INJECT_SKILL_ERROR'] === '1') {
              // Test-only injection seam for the crash-recovery contract
              // (packages/cli/test/loop-crash-recovery.integration.test.ts).
              throw new Error('injected skill error (DEVAI_TEST_INJECT_SKILL_ERROR)');
            }
            const skill = getSkill('SKILL-feedback-iteration');
            if (skill === null) throw new Error('SKILL-feedback-iteration not registered');
            const family = options.family as 'claude' | 'codex' | 'auto' | undefined;
            const packTimeouts = resolvePackLlmTimeouts(repoRoot);
            const llm = createLlmClient({
              repoRoot,
              ...(family !== undefined && { family }),
              ...(options.llmTimeoutMs !== undefined && {
                llmTimeoutOverrideMs: Number(options.llmTimeoutMs),
              }),
              ...(packTimeouts !== undefined && { packTimeouts }),
            });
            result = await skill.run({
              repoRoot,
              timestamp: new Date().toISOString(),
              llm,
              inputs: {
                task_id: entry.id,
                task_title: entry.title,
                task_description: entry.description ?? '',
                worktree_root: worktreePath,
                max_iterations: options.maxIterations ?? 3,
                acceptance_commands: entry.acceptance_commands,
                allowed_write_scopes: skill.manifest.allowed_write_scopes,
              },
            });
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            try {
              releaseLocks({ locksDir: join(repoRoot, '.devai/state/locks'), taskId: entry.id });
            } catch {
              // lock release is best-effort during crash recovery
            }
            try {
              const crashedTask = loadTask(repoRoot, entry.id);
              saveTask(repoRoot, { ...crashedTask, status: 'experimental_blocked' });
            } catch {
              // task record may not exist if spawn partially failed
            }
            updateBacklogStatus(repoRoot, entry.id, 'experimental_blocked');
            const recovery = {
              picked: entry,
              final_status: 'experimental_blocked',
              lifecycle: 'experimental',
              crash: reason,
              human_review_required: true,
              worktree_preserved: true,
              branch_preserved: true,
              recovery: `worktree preserved at ${worktreePath}; locks released; re-queue after human review`,
            };
            if (options.human === true) {
              process.stdout.write(
                `loop run [experimental]: ${entry.id} → experimental_blocked (crash: ${reason})\n` +
                  `  review worktree: ${worktreePath}\n`,
              );
            } else {
              process.stdout.write(JSON.stringify(recovery) + '\n');
            }
            process.exit(EXIT_FAIL);
          }

          // 4. Stop at the human-review boundary. Never merge, complete,
          // push, rename branches, or destroy recoverable work (D-126).
          const finalStatus =
            result.status === 'pass' ? 'awaiting_human_review' : 'experimental_blocked';
          const task = loadTask(repoRoot, entry.id);
          saveTask(repoRoot, { ...task, status: finalStatus });
          updateBacklogStatus(repoRoot, entry.id, finalStatus);

          const payload = {
            picked: entry,
            spawn,
            iteration_result: result,
            final_status: finalStatus,
            lifecycle: 'experimental',
            human_review_required: true,
            worktree_preserved: true,
            branch_preserved: true,
          };
          if (options.human === true) {
            process.stdout.write(
              `loop run [experimental]: ${entry.id} → ${finalStatus} (skill ${result.status})\n` +
                `  review worktree: ${worktreePath}\n` +
                (result.notes !== undefined ? '  ' + result.notes.join('\n  ') + '\n' : ''),
            );
          } else {
            process.stdout.write(JSON.stringify(payload) + '\n');
          }
          process.exit(finalStatus === 'awaiting_human_review' ? EXIT_PASS : EXIT_FAIL);
        },
      );
  },
});

// =====================================================================
// `devai backlog ...` commands
// =====================================================================

export const backlogAdd = defineCommand({
  name: 'backlog add',
  description: 'Append a task to the backlog.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('backlog-add <title>', 'Add a task to the backlog')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--priority <n>', 'Priority 0-100 (default: 50)')
      .option(
        '--discipline <name>',
        'owner|architect|inspector|engineer|auditor (default: engineer)',
      )
      .option('--module <id>', 'Target module (repeatable; default: MOD-core)')
      .option('--substrate <id>', 'F1|F2|F3|F4|F5 (repeatable; default: F2)')
      .option('--description <text>', 'Task description')
      .option(
        '--acceptance-command <json>',
        'Task acceptance argv as JSON array; repeatable, e.g. ["pnpm","test"]',
      )
      .option('--human', 'Human-readable output')
      .action(
        (
          title: string,
          options: {
            repoRoot?: string;
            priority?: number;
            discipline?: string;
            module?: string | string[];
            substrate?: string | string[];
            description?: string;
            acceptanceCommand?: string | string[];
            human?: boolean;
          },
        ) => {
          const modules = Array.isArray(options.module)
            ? options.module
            : options.module !== undefined
              ? [options.module]
              : ['MOD-core'];
          const substrates = (
            Array.isArray(options.substrate)
              ? options.substrate
              : options.substrate !== undefined
                ? [options.substrate]
                : ['F2']
          ) as ('F1' | 'F2' | 'F3' | 'F4' | 'F5')[];
          const rawAcceptance = Array.isArray(options.acceptanceCommand)
            ? options.acceptanceCommand
            : options.acceptanceCommand !== undefined
              ? [options.acceptanceCommand]
              : [];
          const acceptanceCommands: string[][] = [];
          for (const raw of rawAcceptance) {
            try {
              const parsed = JSON.parse(raw) as unknown;
              if (
                !Array.isArray(parsed) ||
                parsed.length === 0 ||
                !parsed.every((part) => typeof part === 'string' && part.length > 0)
              ) {
                throw new Error('expected a non-empty JSON string array');
              }
              acceptanceCommands.push(parsed as string[]);
            } catch (error) {
              process.stderr.write(
                `devai work backlog add: invalid --acceptance-command '${raw}': ${error instanceof Error ? error.message : String(error)}\n`,
              );
              process.exit(EXIT_USAGE);
            }
          }
          const entry = appendBacklog(options.repoRoot ?? DEFAULT_REPO_ROOT, {
            title,
            priority: options.priority ?? 50,
            ...(options.discipline !== undefined && {
              discipline: options.discipline as 'engineer',
            }),
            target_modules: modules,
            target_substrates: substrates,
            ...(options.description !== undefined && { description: options.description }),
            ...(acceptanceCommands.length > 0 && {
              acceptance_commands: acceptanceCommands,
            }),
          });
          if (options.human === true) {
            process.stdout.write(
              `backlog add: ${entry.id} '${entry.title}' priority=${String(entry.priority)}\n`,
            );
          } else {
            process.stdout.write(JSON.stringify(entry) + '\n');
          }
          process.exit(EXIT_PASS);
        },
      );
  },
});

export const backlogList = defineCommand({
  name: 'backlog list',
  description: 'List backlog entries sorted by priority descending.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('backlog-list', 'List backlog entries')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const entries = readBacklog(options.repoRoot ?? DEFAULT_REPO_ROOT);
        if (options.human === true) {
          process.stdout.write(`backlog list: ${String(entries.length)} entry(ies)\n`);
          for (const e of entries) {
            process.stdout.write(
              `  ${e.id.padEnd(12)} p=${String(e.priority).padStart(3)} [${(e.status ?? 'queued').padEnd(11)}] ${e.title}\n`,
            );
          }
        } else {
          process.stdout.write(JSON.stringify({ count: entries.length, entries }) + '\n');
        }
        process.exit(EXIT_PASS);
      });
  },
});

export const backlogNext = defineCommand({
  name: 'backlog next',
  description: 'Peek the highest-priority queued backlog entry.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('backlog-next', 'Show the next backlog task without spawning it')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const entry = pickNextTask(options.repoRoot ?? DEFAULT_REPO_ROOT);
        if (options.human === true) {
          process.stdout.write(
            entry === null
              ? 'backlog next: (empty)\n'
              : `backlog next: ${entry.id} p=${String(entry.priority)} '${entry.title}'\n`,
          );
        } else {
          process.stdout.write(JSON.stringify({ next: entry }) + '\n');
        }
        process.exit(EXIT_PASS);
      });
  },
});

export const backlogComplete = defineCommand({
  name: 'backlog complete',
  description: 'Mark a backlog entry completed.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('backlog-complete <id>', 'Mark a backlog entry completed')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((id: string, options: { repoRoot?: string; human?: boolean }) => {
        const updated = updateBacklogStatus(options.repoRoot ?? DEFAULT_REPO_ROOT, id, 'completed');
        if (updated === null) {
          process.stderr.write(`devai work backlog complete: ${id} not found\n`);
          process.exit(EXIT_USAGE);
        }
        if (options.human === true) {
          process.stdout.write(`backlog complete: ${id} → completed\n`);
        } else {
          process.stdout.write(JSON.stringify(updated) + '\n');
        }
        process.exit(EXIT_PASS);
      });
  },
});

export const backlogCompact = defineCommand({
  name: 'backlog compact',
  description: 'Rewrite the backlog file with the latest-wins snapshot.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('backlog-compact', 'Compact the append-only backlog')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const count = compactBacklog(options.repoRoot ?? DEFAULT_REPO_ROOT);
        if (options.human === true) {
          process.stdout.write(`backlog compact: ${String(count)} entry(ies) retained\n`);
        } else {
          process.stdout.write(JSON.stringify({ retained: count }) + '\n');
        }
        process.exit(EXIT_PASS);
      });
  },
});
