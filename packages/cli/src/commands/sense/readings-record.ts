import type { CAC } from 'cac';
import { EXIT_FAIL, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface RecordOptions {
  readonly repoRoot?: string;
  readonly input?: string;
  readonly human?: boolean;
}

const RETIRED =
  'LEGACY_EVIDENCE_WRITER_RETIRED: persist readings through a governed round-bound proof epoch';

export const senseReadingsRecordCmd = defineCommand({
  name: 'sense readings-record',
  description: 'Refuse the retired aggregate-chain reading writer',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-readings-record', 'Legacy writer retained as a fail-closed migration stub')
      .option('--repo-root <path>', 'Retired compatibility option')
      .option('--input <path>', 'Exact SensorReading JSON artifact')
      .option('--human', 'Retired compatibility option')
      .action((options: RecordOptions) => {
        if (options.input === undefined) {
          process.stderr.write('devai sense readings record: --input is required\n');
          process.exitCode = EXIT_USAGE;
          return;
        }
        process.stderr.write(`devai sense readings record: ${RETIRED}\n`);
        process.exitCode = EXIT_FAIL;
      });
  },
});
