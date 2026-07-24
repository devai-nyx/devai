import type { CAC } from 'cac';
import { loadChain } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_CHAIN_PATH = 'record/proofs/chain.json';

interface ChainHeadOptions {
  readonly chain?: string;
}

export const evidenceChainHead = defineCommand({
  name: 'evidence chain-head',
  description: 'Print the current head hash of the evidence chain',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('evidence-chain-head', 'Print the current head hash of the evidence chain')
      .option('--chain <path>', `Path to evidence chain file (default: ${DEFAULT_CHAIN_PATH})`)
      .action((options: ChainHeadOptions) => {
        try {
          const chainPath = options.chain ?? DEFAULT_CHAIN_PATH;
          const chain = loadChain(chainPath);
          process.stdout.write((chain.head ?? '') + '\n');
          process.exitCode = EXIT_PASS;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai evidence chain head: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
