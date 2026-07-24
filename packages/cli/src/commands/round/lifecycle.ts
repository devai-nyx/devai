import type { CAC } from 'cac';
import {
  archiveGovernedRound,
  declareGovernedRound,
  governedRoundStatus,
  RoundLifecycleError,
  scaffoldGovernedRound,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface RoundOptions {
  readonly repoRoot?: string;
  readonly round?: string;
  readonly record?: string;
  readonly human?: boolean;
}

function requiredRound(options: RoundOptions, command: string): string | undefined {
  if (options.round !== undefined) return options.round;
  process.stderr.write(`devai round ${command}: --round is required\n`);
  process.exitCode = EXIT_USAGE;
  return undefined;
}

function emit(payload: unknown, human: boolean, text: string): void {
  process.stdout.write(human ? `${text}\n` : `${JSON.stringify(payload)}\n`);
  process.exitCode = EXIT_PASS;
}

function governed(command: string, operation: () => unknown): unknown {
  try {
    return operation();
  } catch (error) {
    const code = error instanceof RoundLifecycleError ? error.code : 'ROUND_OPERATION_FAILED';
    process.stderr.write(`devai round ${command}: ${code}\n`);
    process.exitCode = EXIT_FAIL;
    return undefined;
  }
}

export const roundScaffold = defineCommand({
  name: 'round scaffold',
  description: 'Create a deterministic governed-round skeleton under work/rounds.',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('round-scaffold', 'Scaffold one local governed round')
      .option('--repo-root <path>', 'Repository root (default: cwd)')
      .option('--round <id>', 'Round number or round-N id')
      .option('--human', 'Human-readable output')
      .action((options: RoundOptions) => {
        const round = requiredRound(options, 'scaffold');
        if (round === undefined) return;
        const result = governed('scaffold', () =>
          scaffoldGovernedRound({ repoRoot: options.repoRoot ?? '.', round }),
        );
        if (result !== undefined) {
          emit(result, options.human === true, `round scaffold: ${round}`);
        }
      });
  },
});

export const roundDeclare = defineCommand({
  name: 'round declare',
  description:
    'Validate a public round-record JSON input and declare it in the local round workspace.',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('round-declare', 'Declare one schema-valid governed round')
      .option('--repo-root <path>', 'Repository root (default: cwd)')
      .option('--round <id>', 'Round number or round-N id')
      .option('--record <path>', 'Path to a round-record JSON instance')
      .option('--human', 'Human-readable output')
      .action((options: RoundOptions) => {
        const round = requiredRound(options, 'declare');
        if (round === undefined) return;
        if (options.record === undefined) {
          process.stderr.write('devai round declare: --record is required\n');
          process.exitCode = EXIT_USAGE;
          return;
        }
        const result = governed('declare', () =>
          declareGovernedRound({
            repoRoot: options.repoRoot ?? '.',
            round,
            recordPath: options.record as string,
          }),
        );
        if (result !== undefined) emit(result, options.human === true, `round declare: ${round}`);
      });
  },
});

export const roundStatus = defineCommand({
  name: 'round status',
  description:
    'Read one local or archived governed round and report its schema-valid canonical status.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('round-status', 'Report one governed round')
      .option('--repo-root <path>', 'Repository root (default: cwd)')
      .option('--round <id>', 'Round number or round-N id')
      .option('--human', 'Human-readable output')
      .action((options: RoundOptions) => {
        const round = requiredRound(options, 'status');
        if (round === undefined) return;
        const result = governed('status', () =>
          governedRoundStatus({ repoRoot: options.repoRoot ?? '.', round }),
        );
        if (result !== undefined) {
          const typed = result as ReturnType<typeof governedRoundStatus>;
          emit(
            result,
            options.human === true,
            `round status: ${typed.id} ${String(typed.record['status'])} (${typed.location})`,
          );
        }
      });
  },
});

export const roundArchive = defineCommand({
  name: 'round archive',
  description: 'Archive a fully closed governed round after every binding precondition resolves.',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('round-archive', 'Archive a fully closed governed round')
      .option('--repo-root <path>', 'Repository root (default: cwd)')
      .option('--round <id>', 'Round number or round-N id')
      .option('--human', 'Human-readable output')
      .action((options: RoundOptions) => {
        const round = requiredRound(options, 'archive');
        if (round === undefined) return;
        const result = governed('archive', () =>
          archiveGovernedRound({ repoRoot: options.repoRoot ?? '.', round }),
        );
        if (result !== undefined) emit(result, options.human === true, `round archive: ${round}`);
      });
  },
});
