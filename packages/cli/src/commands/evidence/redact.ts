import type { CAC } from 'cac';
import { EXIT_FAIL } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface RedactOptions {
  readonly chain?: string;
  readonly field?: string | string[];
  readonly pattern?: string | string[];
  readonly actor?: string;
  readonly actorRole?: string;
  readonly repoRoot?: string;
  readonly timestamp?: string;
}

const RETIRED =
  'LEGACY_EVIDENCE_WRITER_RETIRED: use a governed round-bound proof epoch; chain.json is read-only compatibility state';

export const evidenceRedact = defineCommand({
  name: 'evidence redact',
  description: 'Refuse mutation of the retired aggregate evidence chain',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command(
        'evidence-redact <target-id>',
        'Legacy writer retained as a fail-closed migration stub',
      )
      .option('--chain <path>', 'Retired aggregate chain path')
      .option('--field <name>', 'Retired compatibility option')
      .option('--pattern <regex>', 'Retired compatibility option')
      .option('--actor <name>', 'Retired compatibility option')
      .option('--actor-role <role>', 'Retired compatibility option')
      .option('--repo-root <path>', 'Retired compatibility option')
      .option('--timestamp <iso>', 'Retired compatibility option')
      .action((_targetId: string, _options: RedactOptions) => {
        process.stderr.write(`devai evidence redact: ${RETIRED}\n`);
        process.exitCode = EXIT_FAIL;
      });
  },
});
