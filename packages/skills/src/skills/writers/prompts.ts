import { loadWriterPrompts } from '../prompt-loader.js';

/**
 * Writer prompt data is intentionally stored under packages/skills/prompts.
 * Keeping this compatibility module preserves the existing writer registry
 * API while making prompt-only changes reviewable without TypeScript churn.
 */
export interface WriterPromptSpec {
  readonly promptGlobal: string;
  readonly promptRole: string;
  /** Soft word cap for the markdown body; null to omit. */
  readonly wordBudget: number | null;
}

export const WRITER_PROMPTS: Readonly<Record<string, WriterPromptSpec>> = loadWriterPrompts();

export function getWriterPromptSpec(skillId: string): WriterPromptSpec {
  const spec = WRITER_PROMPTS[skillId];
  if (spec === undefined) {
    throw new Error(`getWriterPromptSpec: unknown writer skill id '${skillId}'`);
  }
  return spec;
}
