import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmCompleteOptions } from './types.js';

export type JsonResponseSchema = NonNullable<LlmCompleteOptions['response_json_schema']>;

const moduleDir = dirname(fileURLToPath(import.meta.url));
const candidateRoots = [resolve(moduleDir, '../../prompts'), resolve(moduleDir, '../prompts')];
const cache = new Map<string, JsonResponseSchema>();

function responseSchemaAssetsRoot(): string {
  const root = candidateRoots.find((candidate) =>
    existsSync(join(candidate, 'response-schemas/elicit.json')),
  );
  if (root === undefined) {
    throw new Error(
      `DEVAI response-schema assets are unavailable; searched: ${candidateRoots.join(', ')}`,
    );
  }
  return root;
}

function assetNameForMutatingSkill(skillId: string): string {
  if (skillId === 'SKILL-elicit') return 'elicit.json';
  if (skillId === 'SKILL-plan-blueprint') return 'plan-blueprint.json';
  if (skillId === 'SKILL-compile-tests-from-docs') return 'compile-tests.json';
  if (skillId === 'SKILL-feedback-iteration') return 'feedback-iteration.json';
  if (skillId.startsWith('SKILL-write-')) return 'writer.json';
  throw new Error(`STRUCTURED_RESPONSE_SCHEMA_MISSING: ${skillId}`);
}

export function responseSchemaAssetForMutatingSkill(skillId: string): string {
  return join(responseSchemaAssetsRoot(), 'response-schemas', assetNameForMutatingSkill(skillId));
}

export function responseSchemaForMutatingSkill(skillId: string): JsonResponseSchema {
  const asset = responseSchemaAssetForMutatingSkill(skillId);
  const cached = cache.get(asset);
  if (cached !== undefined) return cached;
  const parsed = JSON.parse(readFileSync(asset, 'utf8')) as JsonResponseSchema;
  cache.set(asset, parsed);
  return parsed;
}

export const ELICIT_RESPONSE_SCHEMA = responseSchemaForMutatingSkill('SKILL-elicit');
export const PLAN_BLUEPRINT_RESPONSE_SCHEMA =
  responseSchemaForMutatingSkill('SKILL-plan-blueprint');
export const COMPILE_TESTS_RESPONSE_SCHEMA = responseSchemaForMutatingSkill(
  'SKILL-compile-tests-from-docs',
);
export const FEEDBACK_ITERATION_RESPONSE_SCHEMA = responseSchemaForMutatingSkill(
  'SKILL-feedback-iteration',
);
export const WRITER_RESPONSE_SCHEMA = responseSchemaForMutatingSkill('SKILL-write-overview');
