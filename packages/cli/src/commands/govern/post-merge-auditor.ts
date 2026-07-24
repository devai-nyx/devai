import { resolve } from 'node:path';
import type { CAC } from 'cac';
import { runPostMergeAuditor } from '@devai-nyx/skills/post-merge-auditor';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { resolveCliVersion } from '../../version.js';

interface Options {
  readonly repoRoot?: string;
  readonly hostReceipt?: string;
}

export const governAuditorPostMergeCmd = defineCommand({
  name: 'govern auditor-post-merge',
  description:
    'Process merge-bound observations through the verified persistent post-merge host adapter',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command(
        'govern-auditor-post-merge',
        'Run the bounded Article 34 observation for a verified merge-event receipt',
      )
      .option('--repo-root <path>', 'Repository root (default: cwd)')
      .option(
        '--host-receipt <path>',
        'Issuer-authentic merge-event receipt from the installed hook',
      )
      .action(async (options: Options) => {
        if (options.hostReceipt === undefined) {
          process.stderr.write('HOST_RECEIPT_MISSING\n');
          process.exitCode = EXIT_USAGE;
          return;
        }
        try {
          const result = await runPostMergeAuditor({
            repoRoot: resolve(options.repoRoot ?? '.'),
            hostReceiptPath: resolve(options.hostReceipt),
            injectFailure: process.env['DEVAI_TEST_POST_MERGE_FAIL'] === '1',
            devaiVersion: resolveCliVersion(),
          });
          process.stdout.write(`${JSON.stringify(result)}\n`);
          process.exitCode = EXIT_PASS;
        } catch (error) {
          process.stderr.write(
            `devai post-merge auditor: ${error instanceof Error ? error.message : String(error)}\n`,
          );
          process.exitCode = EXIT_FAIL;
        }
      });
  },
});
