import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SkillPromptSpec {
  readonly global: string;
  readonly role: string;
}

export interface WriterPromptSpecData {
  readonly promptGlobal: string;
  readonly promptRole: string;
  readonly wordBudget: number | null;
}

export type PromptLifecycle = 'prompt-bearing' | 'conditional' | 'non-prompt-bearing';

export interface PromptIndexEntry {
  readonly skill_id: string;
  readonly lifecycle: PromptLifecycle;
  readonly asset: string | null;
}

interface PromptIndexFile {
  readonly schema_version: '1.0.0';
  readonly skills: readonly PromptIndexEntry[];
}

const moduleDir = dirname(fileURLToPath(import.meta.url));
const candidateRoots = [resolve(moduleDir, '../../prompts'), resolve(moduleDir, '../prompts')];
const cache = new Map<string, unknown>();

export function promptAssetsRoot(): string {
  const root = candidateRoots.find((candidate) => existsSync(join(candidate, 'index.json')));
  if (root === undefined) {
    throw new Error(`DEVAI prompt assets are unavailable; searched: ${candidateRoots.join(', ')}`);
  }
  return root;
}

function loadJson<T>(relativePath: string): T {
  const cached = cache.get(relativePath);
  if (cached !== undefined) return cached as T;
  const absolutePath = join(promptAssetsRoot(), relativePath);
  const parsed = JSON.parse(readFileSync(absolutePath, 'utf8')) as T;
  cache.set(relativePath, parsed);
  return parsed;
}

export function loadSkillPrompt(skillId: string): SkillPromptSpec {
  const prompts = loadJson<Record<string, SkillPromptSpec>>('skills.json');
  const prompt = prompts[skillId];
  if (prompt === undefined) throw new Error(`No prompt asset registered for ${skillId}`);
  return prompt;
}

export function loadWriterPrompts(): Readonly<Record<string, WriterPromptSpecData>> {
  return loadJson<Record<string, WriterPromptSpecData>>('writers.json');
}

export function loadSharedPrompt(name: string): string {
  const prompts = loadJson<Record<string, string>>('shared.json');
  const prompt = prompts[name];
  if (prompt === undefined) throw new Error(`No shared prompt asset registered for ${name}`);
  return prompt;
}

export function loadPromptIndex(): readonly PromptIndexEntry[] {
  return loadJson<PromptIndexFile>('index.json').skills;
}
