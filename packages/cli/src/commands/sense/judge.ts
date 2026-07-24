import { readFileSync } from 'node:fs';
import type { CAC } from 'cac';
import { createLlmClient } from '#core-compat';
import { senseJudge } from '@devai-nyx/sensors';
import { EXIT_FAIL, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, emit, exitFor } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly rubric?: string;
  readonly rubricText?: string;
  readonly evidence?: string;
  readonly evidenceText?: string;
  readonly family?: string;
  readonly model?: string;
  readonly human?: boolean;
}

/**
 * Phase-9 Batch 9.C: real LLM-backed soft-gate evaluator.
 *
 * Rubric resolution (one of, in priority order):
 *   --rubric-text <body>     inline text
 *   --rubric <name>          .devai/rubrics/<name>.md
 *
 * Evidence resolution (one of):
 *   --evidence-text <body>   inline text
 *   --evidence <path>        file path (recorded on the SensorReading)
 *
 * Family selection: --family claude|codex|auto (default: auto, reads
 * .devai/config/llm.json). DEVAI_LLM_BACKEND env overrides.
 */
export const senseJudgeCmd = defineCommand({
  name: 'sense judge',
  description: 'LLM-backed soft-gate evaluator. Phase-9 Batch 9.C — real implementation.',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'sense-judge <aspect>',
        'Evaluate aspect against rubric + evidence; emit SensorReading',
      )
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--rubric <name>', 'Rubric name (resolved to .devai/rubrics/<name>.md)')
      .option('--rubric-text <body>', 'Inline rubric body')
      .option('--evidence <path>', 'Evidence file path')
      .option('--evidence-text <body>', 'Inline evidence body')
      .option('--family <name>', "'claude' | 'codex' | 'auto' (default: auto)")
      .option('--model <name>', 'Override the default model')
      .option('--human', 'Human-readable summary')
      .action(async (aspect: string, options: Options) => {
        try {
          // Resolve rubric.
          let rubric: string | null = null;
          if (options.rubricText !== undefined) {
            rubric = options.rubricText;
          } else if (options.rubric !== undefined) {
            const path = `${options.repoRoot ?? DEFAULT_REPO_ROOT}/.devai/rubrics/${options.rubric}.md`;
            try {
              rubric = readFileSync(path, 'utf8');
            } catch {
              process.stderr.write(`devai sense judge: cannot read rubric at ${path}\n`);
              process.exit(EXIT_USAGE);
            }
          }
          if (rubric === null) {
            process.stderr.write(
              'devai sense judge: --rubric <name> or --rubric-text <body> is required\n',
            );
            process.exit(EXIT_USAGE);
          }
          // Resolve evidence.
          let evidence: string | null = null;
          let evidencePath: string | undefined;
          if (options.evidenceText !== undefined) {
            evidence = options.evidenceText;
          } else if (options.evidence !== undefined) {
            try {
              evidence = readFileSync(options.evidence, 'utf8');
              evidencePath = options.evidence;
            } catch {
              process.stderr.write(
                `devai sense judge: cannot read evidence at ${options.evidence}\n`,
              );
              process.exit(EXIT_USAGE);
            }
          }
          if (evidence === null) {
            process.stderr.write(
              'devai sense judge: --evidence <path> or --evidence-text <body> is required\n',
            );
            process.exit(EXIT_USAGE);
          }
          const family = options.family as 'claude' | 'codex' | 'auto' | undefined;
          const client = createLlmClient({
            repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
            ...(family !== undefined && { family }),
            ...(options.model !== undefined && { model: options.model }),
          });
          const reading = await senseJudge(
            {
              aspect,
              rubric,
              evidence,
              ...(evidencePath !== undefined && { evidencePath }),
            },
            client,
          );
          emit(reading, options.human === true);
          process.exit(exitFor(reading.status));
        } catch (err) {
          process.stderr.write(
            `devai sense judge: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
