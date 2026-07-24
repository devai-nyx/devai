import type { CAC } from 'cac';
import {
  composePrompt,
  createLlmClient,
  metaFromComposition,
  messagesFromComposition,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = '.';

/**
 * Debug command: round-trip a short prompt through the configured
 * provider and print the response + cost telemetry. Useful for
 * checking that API keys are wired correctly and that pricing
 * estimates look reasonable.
 *
 *   ANTHROPIC_API_KEY=... DEVAI_LLM_BACKEND=claude \
 *     devai agent llm probe "say hello"
 *   OPENAI_API_KEY=... DEVAI_LLM_BACKEND=codex \
 *     devai agent llm probe "say hello"
 *
 * Default DEVAI_LLM_BACKEND=mock returns a deterministic echo so
 * tests + CI can exercise this command without external calls.
 */
export const llmProbe = defineCommand({
  name: 'llm probe',
  description:
    'Round-trip a prompt through the configured LLM provider; print response + usage telemetry.',
  authority: 'agent_runtime',
  register(cli: CAC): void {
    cli
      .command('llm-probe <text>', 'Send <text> to the configured LLM family')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option(
        '--family <name>',
        "'claude' | 'codex' | 'mock' | 'claude-cli' | 'codex-cli' | 'auto' (default: auto)",
      )
      .option('--model <name>', 'Override the default model for the family')
      .option('--json-response', 'Request structured JSON output')
      .option('--human', 'Human-readable summary')
      .action(
        async (
          text: string,
          options: {
            repoRoot?: string;
            family?: string;
            model?: string;
            jsonResponse?: boolean;
            human?: boolean;
          },
        ) => {
          if (text === undefined || text.length === 0) {
            process.stderr.write('devai agent llm probe: <text> is required\n');
            process.exit(EXIT_USAGE);
          }
          const family = options.family as
            'claude' | 'codex' | 'mock' | 'claude-cli' | 'codex-cli' | 'auto' | undefined;
          try {
            const client = createLlmClient({
              repoRoot: options.repoRoot ?? DEFAULT_REPO_ROOT,
              ...(family !== undefined && { family }),
              ...(options.model !== undefined && { model: options.model }),
            });
            const composition = composePrompt({
              task_id: 'TASK-0000',
              components: [
                {
                  layer: 'global',
                  name: 'llm-probe.global',
                  body: 'You are a debug probe for DEVAI. Respond briefly.',
                },
                { layer: 'task', name: 'llm-probe.task', body: text },
              ],
              timestamp: new Date().toISOString(),
            });
            const messages = messagesFromComposition([
              {
                layer: 'global',
                name: 'llm-probe.global',
                body: 'You are a debug probe for DEVAI. Respond briefly.',
              },
              { layer: 'task', name: 'llm-probe.task', body: text },
            ]);
            const meta = metaFromComposition(composition, 'devai agent llm probe');
            const response = await client.complete(messages, meta, {
              max_output_tokens: 256,
              ...(options.jsonResponse === true && { response_format_json: true }),
            });
            const payload = {
              prompt_pc_id: composition.id,
              response,
            };
            if (options.human === true) {
              process.stdout.write(
                `llm probe (${response.family}/${response.model}):\n` +
                  `  text: ${response.text}\n` +
                  `  usage: in=${String(response.usage.input_tokens)} out=${String(response.usage.output_tokens)} cost=$${response.usage.cost_usd.toFixed(6)} latency=${String(response.latency_ms)}ms\n` +
                  `  pc_id: ${composition.id}\n`,
              );
            } else {
              process.stdout.write(JSON.stringify(payload) + '\n');
            }
            process.exit(EXIT_PASS);
          } catch (err) {
            process.stderr.write(
              `devai agent llm probe: ${err instanceof Error ? err.message : String(err)}\n`,
            );
            process.exit(EXIT_FAIL);
          }
        },
      );
  },
});
