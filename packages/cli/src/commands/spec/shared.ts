import type { SpecValidationError, SpecValidationResult } from '#core-compat';

export const DEFAULT_REPO_ROOT = '.';
export const DEFAULT_DOMAINS_PATH = '.devai/config/domains.json';
export const DEFAULT_INVARIANTS_DIR = 'law/invariants';
export const DEFAULT_JOURNEYS_DIR = 'product/journeys';
export const DEFAULT_TRACE_PATH = 'law/trace.json';
export const DEFAULT_GLOSSARY_DIR = 'law/glossary';

export interface CommonSpecOptions {
  readonly repoRoot?: string;
  readonly human?: boolean;
}

export function renderHuman(label: string, result: SpecValidationResult): string {
  const lines: string[] = [];
  lines.push(`${label}: ${result.ok ? 'OK' : 'FAIL'} (${String(result.files_scanned)} file(s))`);
  for (const e of result.errors) {
    lines.push(`  [✗] ${e.file}${e.pointer ? ` ${e.pointer}` : ''}`);
    lines.push(`      ${e.message}`);
  }
  return lines.join('\n') + '\n';
}

export function renderJson(result: SpecValidationResult & Record<string, unknown>): string {
  return JSON.stringify(result) + '\n';
}

export function formatErrors(errors: readonly SpecValidationError[]): string {
  return errors.map((e) => `${e.file}${e.pointer ? ` ${e.pointer}` : ''}: ${e.message}`).join('\n');
}
