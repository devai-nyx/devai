import type { CAC } from 'cac';
import { verifyChain } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_CHAIN_PATH = 'record/proofs/chain.json';

interface VerifyOptions {
  readonly chain?: string;
  readonly human?: boolean;
}

export const evidenceVerify = defineCommand({
  name: 'evidence verify',
  description: 'Verify the evidence chain (hash + link integrity)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('evidence-verify', 'Verify the evidence chain (hash + link integrity)')
      .option('--chain <path>', `Path to evidence chain file (default: ${DEFAULT_CHAIN_PATH})`)
      .option('--human', 'Emit a human-readable summary to stdout instead of JSON')
      .action((options: VerifyOptions) => {
        try {
          const chainPath = options.chain ?? DEFAULT_CHAIN_PATH;
          const result = verifyChain(chainPath);
          if (options.human) {
            if (result.valid) {
              process.stdout.write('evidence chain: valid\n');
            } else {
              process.stdout.write('evidence chain: INVALID\n');
              for (const error of result.errors) {
                process.stdout.write(`  - ${error}\n`);
              }
            }
          } else {
            process.stdout.write(JSON.stringify(result) + '\n');
          }
          process.exitCode = result.valid ? EXIT_PASS : EXIT_FAIL;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai evidence chain verify: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
