import type { CAC } from 'cac';
import { emitRgr, listRgrs, readRgr, resolveRgr } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = process.cwd();

interface EmitOptions {
  readonly repoRoot?: string;
  readonly taskId?: string;
  readonly discipline?: string;
  readonly summary?: string;
  readonly ambiguity?: string;
  readonly evidence?: string | string[];
  readonly question?: string | string[];
  readonly invariant?: string | string[];
  readonly journey?: string | string[];
  readonly surface?: string | string[];
  readonly riskClass?: string;
  readonly targetAuthority?: string;
  readonly proposedResolution?: string;
  readonly human?: boolean;
}

function asArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const VALID_DISCIPLINES = ['engineer', 'inspector', 'auditor'] as const;
const VALID_RISK_CLASSES = [
  'security',
  'data_loss',
  'compliance',
  'ux',
  'correctness',
  'performance',
  'none',
] as const;
const VALID_TARGET_AUTHORITIES = ['owner', 'architect'] as const;

export const rgrEmit = defineCommand({
  name: 'rgr emit',
  description:
    'Emit a Reference Gap Report (RGR) draft. Persists under .devai/state/rgr/RGR-NNNN.json. Per Article 22 and Phase 11.C / D-39.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('rgr-emit', 'Emit a Reference Gap Report')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--task-id <id>', 'Emitting task id (required, ^TASK-)')
      .option('--discipline <kind>', `Emitting discipline. One of: ${VALID_DISCIPLINES.join(', ')}`)
      .option('--summary <text>', 'Short problem summary (required)')
      .option('--ambiguity <text>', 'Precise ambiguity / contradiction statement (required)')
      .option('--evidence <EV-id>', 'Backing evidence id (repeatable, required)')
      .option(
        '--question <text>',
        'Question for the resolver (repeatable; auto-numbered Q1, Q2, …)',
      )
      .option('--invariant <INV-id>', 'Invariant impacted (repeatable)')
      .option('--journey <JNY-id>', 'Journey impacted (repeatable)')
      .option('--surface <name>', 'Surface impacted (repeatable; free-form)')
      .option('--risk-class <kind>', `One of: ${VALID_RISK_CLASSES.join(', ')}`)
      .option(
        '--target-authority <kind>',
        `Resolver authority. One of: ${VALID_TARGET_AUTHORITIES.join(', ')}`,
      )
      .option('--proposed-resolution <text>', 'Non-authoritative proposed-resolution summary')
      .option('--human', 'Human-readable output')
      .action((options: EmitOptions) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const taskId = options.taskId;
        const discipline = options.discipline;
        const summary = options.summary;
        const ambiguity = options.ambiguity;
        const evidenceRefs = asArray(options.evidence);
        if (taskId === undefined || !/^TASK-/.test(taskId)) {
          process.stderr.write('devai govern rgr emit: --task-id <TASK-…> is required\n');
          process.exit(EXIT_USAGE);
        }
        if (discipline === undefined || !VALID_DISCIPLINES.includes(discipline as never)) {
          process.stderr.write(
            `devai govern rgr emit: --discipline must be one of ${VALID_DISCIPLINES.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        if (summary === undefined || summary.length === 0) {
          process.stderr.write('devai govern rgr emit: --summary is required\n');
          process.exit(EXIT_USAGE);
        }
        if (ambiguity === undefined || ambiguity.length === 0) {
          process.stderr.write('devai govern rgr emit: --ambiguity is required\n');
          process.exit(EXIT_USAGE);
        }
        if (evidenceRefs.length === 0) {
          process.stderr.write(
            'devai govern rgr emit: at least one --evidence <EV-id> is required\n',
          );
          process.exit(EXIT_USAGE);
        }
        if (
          options.riskClass !== undefined &&
          !VALID_RISK_CLASSES.includes(options.riskClass as never)
        ) {
          process.stderr.write(
            `devai govern rgr emit: --risk-class must be one of ${VALID_RISK_CLASSES.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        if (
          options.targetAuthority !== undefined &&
          !VALID_TARGET_AUTHORITIES.includes(options.targetAuthority as never)
        ) {
          process.stderr.write(
            `devai govern rgr emit: --target-authority must be one of ${VALID_TARGET_AUTHORITIES.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        try {
          const questions = asArray(options.question).map((q, i) => ({
            qid: `Q${String(i + 1)}`,
            question: q,
          }));
          const record = emitRgr({
            repoRoot,
            emittingTaskId: taskId,
            emittingDiscipline: discipline as 'engineer' | 'inspector' | 'auditor',
            summary,
            ambiguity,
            evidenceRefs,
            ...(questions.length > 0 && { questions }),
            ...(asArray(options.invariant).length > 0 && {
              invariantsImpacted: asArray(options.invariant),
            }),
            ...(asArray(options.journey).length > 0 && {
              journeysImpacted: asArray(options.journey),
            }),
            ...(asArray(options.surface).length > 0 && { surfaces: asArray(options.surface) }),
            ...(options.riskClass !== undefined && {
              riskClass: options.riskClass as
                | 'security'
                | 'data_loss'
                | 'compliance'
                | 'ux'
                | 'correctness'
                | 'performance'
                | 'none',
            }),
            ...(options.targetAuthority !== undefined && {
              targetAuthority: options.targetAuthority as 'owner' | 'architect',
            }),
            ...(options.proposedResolution !== undefined && {
              proposedResolutionSummary: options.proposedResolution,
            }),
          });
          if (options.human === true) {
            process.stdout.write(
              `rgr emit: ${record.id}  (task=${record.emitting_task_id}, status=${record.status})\n`,
            );
          } else {
            process.stdout.write(JSON.stringify(record) + '\n');
          }
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai govern rgr emit: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const rgrList = defineCommand({
  name: 'rgr list',
  description: 'List Reference Gap Reports under .devai/state/rgr/',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('rgr-list', 'List RGRs')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--status <kind>', 'Filter by status (open|in_review|resolved|rejected|superseded)')
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; status?: string; human?: boolean }) => {
        try {
          let records = listRgrs(options.repoRoot ?? DEFAULT_REPO_ROOT);
          if (options.status !== undefined) {
            records = records.filter((r) => r.status === options.status);
          }
          if (options.human === true) {
            process.stdout.write(
              `rgr list: ${String(records.length)} RGR(s)\n` +
                records
                  .map(
                    (r) =>
                      `  ${r.id}  ${r.status.padEnd(10)}  ${r.emitting_discipline.padEnd(9)}  ${r.emitting_task_id}  '${r.problem.summary}'`,
                  )
                  .join('\n') +
                '\n',
            );
          } else {
            process.stdout.write(JSON.stringify({ count: records.length, rgrs: records }) + '\n');
          }
          process.exitCode = EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai govern rgr list: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

export const rgrShow = defineCommand({
  name: 'rgr show',
  description: 'Print a single RGR record by id',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('rgr-show <rgr-id>', 'Show an RGR record')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .action((rgrId: string, options: { repoRoot?: string }) => {
        const record = readRgr(options.repoRoot ?? DEFAULT_REPO_ROOT, rgrId);
        if (record === null) {
          process.stderr.write(`devai govern rgr show: ${rgrId} not found\n`);
          process.exit(EXIT_FAIL);
        }
        process.stdout.write(JSON.stringify(record, null, 2) + '\n');
        process.exitCode = EXIT_PASS;
      });
  },
});

const VALID_RESOLVE_STATUSES = ['resolved', 'rejected', 'superseded'] as const;

export const rgrResolve = defineCommand({
  name: 'rgr resolve',
  description: 'Apply a resolution to an existing RGR',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('rgr-resolve <rgr-id>', 'Resolve an RGR')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--resolver <name>', 'Resolver identifier (required)')
      .option(
        '--status <kind>',
        `New status. One of: ${VALID_RESOLVE_STATUSES.join(', ')} (default: resolved)`,
      )
      .option('--answer <qid=text>', 'Question answer (repeatable; e.g. Q1=allow_unverified)')
      .option('--resulting-commit <sha>', 'Resulting commit SHA (repeatable)')
      .option('--resumed-task-id <id>', 'Task spawned on the post-resolution integration HEAD')
      .option('--human', 'Human-readable output')
      .action(
        (
          rgrId: string,
          options: {
            repoRoot?: string;
            resolver?: string;
            status?: string;
            answer?: string | string[];
            resultingCommit?: string | string[];
            resumedTaskId?: string;
            human?: boolean;
          },
        ) => {
          if (options.resolver === undefined || options.resolver.length === 0) {
            process.stderr.write('devai govern rgr resolve: --resolver <name> is required\n');
            process.exit(EXIT_USAGE);
          }
          if (
            options.status !== undefined &&
            !VALID_RESOLVE_STATUSES.includes(options.status as never)
          ) {
            process.stderr.write(
              `devai govern rgr resolve: --status must be one of ${VALID_RESOLVE_STATUSES.join(', ')}\n`,
            );
            process.exit(EXIT_USAGE);
          }
          try {
            const answerPairs = asArray(options.answer).map((a) => {
              const eq = a.indexOf('=');
              if (eq <= 0) {
                throw new Error(`--answer expects 'Qn=text' (got '${a}')`);
              }
              return { qid: a.slice(0, eq), answer: a.slice(eq + 1) };
            });
            const record = resolveRgr({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              rgrId,
              resolver: options.resolver,
              ...(answerPairs.length > 0 && { answers: answerPairs }),
              ...(asArray(options.resultingCommit).length > 0 && {
                resultingCommits: asArray(options.resultingCommit),
              }),
              ...(options.resumedTaskId !== undefined && { resumedTaskId: options.resumedTaskId }),
              ...(options.status !== undefined && {
                newStatus: options.status as 'resolved' | 'rejected' | 'superseded',
              }),
            });
            if (options.human === true) {
              process.stdout.write(`rgr resolve: ${record.id} → ${record.status}\n`);
            } else {
              process.stdout.write(JSON.stringify(record) + '\n');
            }
            process.exitCode = EXIT_PASS;
          } catch (err) {
            process.stderr.write(
              `devai govern rgr resolve: ${err instanceof Error ? err.message : String(err)}\n`,
            );
            process.exit(EXIT_FAIL);
          }
        },
      );
  },
});
