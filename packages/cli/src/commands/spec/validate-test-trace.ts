import { join } from 'node:path';
import type { CAC } from 'cac';
import { validateTestTrace } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_INVARIANTS_DIR, DEFAULT_REPO_ROOT, DEFAULT_TRACE_PATH } from './shared.js';

export const specValidateTestTrace = defineCommand({
  name: 'spec validate-test-trace',
  description: 'Validate complete test-to-invariant trace mappings and lifecycle provenance',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('spec-validate-test-trace', 'Validate complete test-to-invariant trace mappings')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: { repoRoot?: string; human?: boolean }) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const result = validateTestTrace({
          repoRoot,
          tracePath: join(repoRoot, DEFAULT_TRACE_PATH),
          invariantsDir: join(repoRoot, DEFAULT_INVARIANTS_DIR),
        });
        if (options.human === true) {
          const lines = [
            `spec validate-test-trace: ${result.ok ? 'OK' : 'FAIL'}`,
            `  referenced ${String(result.referenced_test_files)}/${String(result.discovered_test_files)}`,
            `  supported=${String(result.supported_test_files)} experimental=${String(result.experimental_test_files)}`,
            ...result.errors.map((error) => `  ${error.file}: ${error.message}`),
          ];
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(JSON.stringify(result) + '\n');
        }
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});
