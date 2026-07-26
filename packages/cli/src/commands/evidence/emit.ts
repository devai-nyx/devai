import type { CAC } from 'cac';
import { EXIT_FAIL } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface EmitOptions {
  readonly chain?: string;
  readonly actor?: string;
  readonly actorRole?: string;
  readonly status?: string;
  readonly note?: string | string[];
  readonly artifact?: string | string[];
  readonly taskId?: string;
  readonly worktreeId?: string;
  readonly timestamp?: string;
  readonly git?: boolean;
  readonly repoRoot?: string;
  readonly fromFile?: string;
  readonly stdin?: boolean;
}

const RETIRED =
  'LEGACY_EVIDENCE_WRITER_RETIRED: use a governed round-bound proof epoch; chain.json is read-only compatibility state';

export const evidenceEmit = defineCommand({
  name: 'evidence emit',
  description: 'Refuse writes to the retired aggregate evidence chain',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('evidence-emit [action]', 'Legacy writer retained as a fail-closed migration stub')
      .option('--chain <path>', 'Retired aggregate chain path')
      .option('--actor <name>', 'Retired compatibility option')
      .option('--actor-role <role>', 'Retired compatibility option')
      .option('--status <status>', 'Retired compatibility option')
      .option('--note <msg>', 'Retired compatibility option')
      .option('--artifact <ref>', 'Retired compatibility option')
      .option('--task-id <id>', 'Retired compatibility option')
      .option('--worktree-id <id>', 'Retired compatibility option')
      .option('--timestamp <iso>', 'Retired compatibility option')
      .option('--no-git', 'Retired compatibility option')
      .option('--repo-root <path>', 'Retired compatibility option')
      .option('--from-file <path>', 'Retired compatibility option')
      .option('--stdin', 'Retired compatibility option')
      .action((_action: string | undefined, _options: EmitOptions) => {
        process.stderr.write(`devai evidence emit: ${RETIRED}\n`);
        process.exitCode = EXIT_FAIL;
      });
  },
});
