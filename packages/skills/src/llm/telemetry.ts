import { appendFileSync, mkdirSync } from '@devai-nyx/authority';
import { dirname, join } from 'node:path';
import type { LlmFamily, LlmPromptMeta, LlmResponse } from './types.js';

/**
 * Append-only LLM usage log. Every successful provider call writes one
 * line to record/proofs/work/llm-usage.jsonl. Easy to grep and sum:
 *
 *   jq -s 'map(.cost_usd) | add' record/proofs/work/llm-usage.jsonl
 *
 * Local + nightly runs accumulate cost; the bounded-CI-LLM decision
 * (option (ii)) will use this to compute per-build budgets.
 */

export interface UsageRow {
  readonly ts: string;
  readonly family: LlmFamily;
  readonly model: string;
  readonly caller: string | null;
  readonly prompt_pc_id: string | null;
  readonly stack_sha256: string | null;
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cost_usd: number;
  readonly latency_ms: number;
}

let cumulative_usd = 0;
let cumulative_input = 0;
let cumulative_output = 0;

const USAGE_LOG_REL = 'record/proofs/work/llm-usage.jsonl';

export function getUsageLogPath(repoRoot: string): string {
  return join(repoRoot, USAGE_LOG_REL);
}

export function recordUsage(repoRoot: string, response: LlmResponse, meta: LlmPromptMeta): void {
  cumulative_usd += response.usage.cost_usd;
  cumulative_input += response.usage.input_tokens;
  cumulative_output += response.usage.output_tokens;
  const row: UsageRow = {
    ts: new Date().toISOString(),
    family: response.family,
    model: response.model,
    caller: meta.caller ?? null,
    prompt_pc_id: meta.prompt_pc_id ?? null,
    stack_sha256: meta.stack_sha256 ?? null,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cost_usd: response.usage.cost_usd,
    latency_ms: response.latency_ms,
  };
  const path = getUsageLogPath(repoRoot);
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, JSON.stringify(row) + '\n');
  } catch {
    // best-effort persistence
  }
}

export function getCumulativeUsdThisProcess(): number {
  return cumulative_usd;
}

export function getCumulativeTokensThisProcess(): { input: number; output: number } {
  return { input: cumulative_input, output: cumulative_output };
}

/**
 * Reset the in-process counters. Mostly for unit tests; production
 * code never needs this.
 */
export function resetUsageCounters(): void {
  cumulative_usd = 0;
  cumulative_input = 0;
  cumulative_output = 0;
}

// =====================================================================
// Budget cap
// =====================================================================

export class LlmBudgetExceededError extends Error {
  constructor(
    public readonly spent_usd: number,
    public readonly budget_usd: number,
  ) {
    super(`LLM budget exceeded: spent $${spent_usd.toFixed(4)} of $${budget_usd.toFixed(2)} cap`);
    this.name = 'LlmBudgetExceededError';
  }
}

/**
 * Throws LlmBudgetExceededError if the in-process cumulative cost has
 * crossed the cap. Skills using LlmClient should catch this and demote
 * to status:fail with an actionable note.
 *
 * Reads DEVAI_LLM_BUDGET_USD env at construction-time (parsed once);
 * a value of 0 or unset means no cap.
 */
const ENV_BUDGET = (() => {
  const raw = process.env.DEVAI_LLM_BUDGET_USD;
  if (raw === undefined || raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
})();

export function getBudgetUsd(): number {
  return ENV_BUDGET;
}

export function assertWithinBudget(): void {
  if (ENV_BUDGET === 0) return;
  if (cumulative_usd >= ENV_BUDGET) {
    throw new LlmBudgetExceededError(cumulative_usd, ENV_BUDGET);
  }
}
