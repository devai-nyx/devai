import type { CAC } from 'cac';
import { EXIT_PASS } from '@devai-nyx/utils';
import { executeAuthoritySessionOperation } from '../../authority/command-capabilities.js';
import { defineCommand } from '../../define-command.js';

type SessionResult = Readonly<{
  session_id: string;
  role: string;
  status: string;
  expires_at: string;
}>;

function emit(result: SessionResult, human: boolean): void {
  process.stdout.write(
    human
      ? `authority session ${result.status}: ${result.session_id} (${result.role}, expires ${result.expires_at})\n`
      : `${JSON.stringify(result)}\n`,
  );
  process.exitCode = EXIT_PASS;
}

export const workSessionStart = defineCommand({
  name: 'work session start',
  description: 'Start an explicit repository- and policy-bound authority session.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('work-session-start', 'Start an expiring authority session')
      .option('--target <path>', 'Target repository (default: current directory)')
      .option('--ttl-minutes <n>', 'Session lifetime in minutes (1..1440; default: 60)')
      .option('--human', 'Human-readable output')
      .action((options: { human?: boolean }) => {
        emit(executeAuthoritySessionOperation() as SessionResult, options.human === true);
      });
  },
});

export const workSessionEnd = defineCommand({
  name: 'work session end',
  description: 'Revoke the explicitly selected authority session.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('work-session-end', 'Revoke an authority session')
      .option('--target <path>', 'Target repository (default: current directory)')
      .option('--human', 'Human-readable output')
      .action((options: { human?: boolean }) => {
        emit(executeAuthoritySessionOperation() as SessionResult, options.human === true);
      });
  },
});
