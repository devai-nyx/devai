import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { minimatch } from 'minimatch';
import { spawnSync } from '@devai-nyx/authority';
import { canonicalSha256 } from '@devai-nyx/utils';

export interface SensorInputPattern {
  readonly pattern: string;
  readonly min_matches?: number;
  readonly reason?: string;
}

export interface SensorInputAlternativeGroup {
  readonly group_id: string;
  readonly any_of: readonly string[];
}

export interface SensorInputSpec {
  readonly kind: string;
  readonly spec_version: number;
  readonly file_inputs: readonly (SensorInputPattern | SensorInputAlternativeGroup)[];
  readonly tool_inputs: readonly string[];
  readonly env_inputs: readonly string[];
  readonly hermetic: true;
}

export interface SensorInputRegistry {
  readonly schemaVersion: '1.0.0';
  readonly id: 'sensor-inputs';
  readonly source_authority: 'F1-architect';
  readonly materialization: Readonly<Record<string, unknown>>;
  readonly specs: readonly SensorInputSpec[];
}

export type SensorInputIntegrityCode =
  | 'SENSOR_INPUT_DEAD_GLOB'
  | 'SENSOR_INPUT_OPTIONAL_REASON_REQUIRED'
  | 'SENSOR_INPUT_ALTERNATIVES_DEAD'
  | 'SENSOR_INPUT_KIND_INELIGIBLE';

export interface SensorInputIntegrityIssue {
  readonly code: SensorInputIntegrityCode;
  readonly kind: string;
  readonly pattern?: string;
  readonly group_id?: string;
  readonly match_count?: number;
  readonly min_matches?: number;
}

export interface SensorInputIntegrityReport {
  readonly ok: boolean;
  readonly issues: readonly SensorInputIntegrityIssue[];
}

export interface SensorInputDigestContext {
  readonly sensor_version: string;
  readonly command_hash: string;
  readonly tool_versions: Readonly<Record<string, string>>;
  readonly env_values: Readonly<Record<string, string>>;
}

export interface SensorInputDigestReport {
  readonly input_digest_sha256: string;
  readonly subject:
    | { readonly kind: 'git_sha'; readonly git_sha: string }
    | {
        readonly kind: 'dirty';
        readonly git_sha: string | null;
        readonly dirty_files: readonly string[];
      };
}

interface IndexedFile {
  readonly path: string;
  readonly blob_sha: string;
}

function runGit(repoRoot: string, args: readonly string[]): string {
  const result = spawnSync('git', [...args], { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(
      `SENSOR_INPUT_GIT_ERROR: git ${args.join(' ')}: ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout;
}

function tryGit(repoRoot: string, args: readonly string[]): string | null {
  const result = spawnSync('git', [...args], { cwd: repoRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout : null;
}

function nulEntries(output: string): readonly string[] {
  return output.split('\0').filter((entry) => entry.length > 0);
}

function trackedPaths(repoRoot: string): readonly string[] {
  return [...nulEntries(runGit(repoRoot, ['ls-files', '-z']))].sort();
}

function indexedFiles(repoRoot: string): readonly IndexedFile[] {
  const entries = nulEntries(runGit(repoRoot, ['ls-files', '-s', '-z']));
  const files: IndexedFile[] = [];
  for (const entry of entries) {
    const match = /^(?:\d+) ([a-f0-9]+) \d\t(.*)$/u.exec(entry);
    if (match === null || match[1] === undefined || match[2] === undefined) {
      throw new Error(`SENSOR_INPUT_GIT_INDEX_INVALID: ${entry}`);
    }
    files.push({ path: match[2], blob_sha: match[1] });
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function dirtyPaths(repoRoot: string): ReadonlySet<string> {
  const paths = new Set<string>();
  for (const args of [
    ['diff', '--name-only', '-z'],
    ['diff', '--cached', '--name-only', '-z'],
    ['ls-files', '--others', '--exclude-standard', '-z'],
  ] as const) {
    for (const path of nulEntries(runGit(repoRoot, args))) paths.add(path);
  }
  return paths;
}

function isPattern(
  input: SensorInputPattern | SensorInputAlternativeGroup,
): input is SensorInputPattern {
  return 'pattern' in input;
}

function matches(pattern: string, path: string): boolean {
  return minimatch(path, pattern, { dot: true });
}

function specMatchesPath(spec: SensorInputSpec, path: string): boolean {
  return spec.file_inputs.some((input) =>
    isPattern(input)
      ? matches(input.pattern, path)
      : input.any_of.some((pattern) => matches(pattern, path)),
  );
}

export function evaluateSensorInputIntegrity(
  repoRoot: string,
  registry: SensorInputRegistry,
): SensorInputIntegrityReport {
  const files = trackedPaths(repoRoot);
  const issues: SensorInputIntegrityIssue[] = [];
  for (const spec of registry.specs) {
    if (spec.hermetic !== true) {
      issues.push({ code: 'SENSOR_INPUT_KIND_INELIGIBLE', kind: spec.kind });
      continue;
    }
    for (const input of spec.file_inputs) {
      if (isPattern(input)) {
        const count = files.filter((path) => matches(input.pattern, path)).length;
        const minimum = input.min_matches ?? 1;
        if (minimum === 0 && (input.reason === undefined || input.reason.length === 0)) {
          issues.push({
            code: 'SENSOR_INPUT_OPTIONAL_REASON_REQUIRED',
            kind: spec.kind,
            pattern: input.pattern,
          });
        }
        if (count < minimum) {
          issues.push({
            code: 'SENSOR_INPUT_DEAD_GLOB',
            kind: spec.kind,
            pattern: input.pattern,
            match_count: count,
            min_matches: minimum,
          });
        }
        continue;
      }
      const live = input.any_of.some((pattern) => files.some((path) => matches(pattern, path)));
      if (!live) {
        issues.push({
          code: 'SENSOR_INPUT_ALTERNATIVES_DEAD',
          kind: spec.kind,
          group_id: input.group_id,
        });
      }
    }
  }
  return { ok: issues.length === 0, issues };
}

function declaredValues(
  names: readonly string[],
  values: Readonly<Record<string, string>>,
  missingCode: string,
): Readonly<Record<string, string>> {
  const selected: Record<string, string> = {};
  for (const name of [...names].sort()) {
    const value = values[name];
    if (value === undefined) throw new Error(`${missingCode}: ${name}`);
    selected[name] = value;
  }
  return selected;
}

export function computeSensorInputDigest(
  repoRoot: string,
  spec: SensorInputSpec,
  context: SensorInputDigestContext,
): SensorInputDigestReport {
  const indexed = indexedFiles(repoRoot);
  const dirty = dirtyPaths(repoRoot);
  const candidates = new Set(indexed.map((file) => file.path));
  for (const path of dirty) candidates.add(path);
  const matched = [...candidates].filter((path) => specMatchesPath(spec, path)).sort();
  const indexByPath = new Map(indexed.map((file) => [file.path, file.blob_sha]));
  const fileInputs = matched.map((path) => {
    if (!dirty.has(path)) {
      const blob = indexByPath.get(path);
      if (blob === undefined) throw new Error(`SENSOR_INPUT_INDEX_BLOB_MISSING: ${path}`);
      return { path, blob_sha: blob };
    }
    if (!existsSync(join(repoRoot, path))) return { path, blob_sha: 'deleted' };
    return { path, blob_sha: runGit(repoRoot, ['hash-object', '--', path]).trim() };
  });
  const matchedDirty = matched.filter((path) => dirty.has(path));
  const gitSha = tryGit(repoRoot, ['rev-parse', 'HEAD'])?.trim() || null;
  const toolVersions = declaredValues(
    spec.tool_inputs,
    context.tool_versions,
    'SENSOR_INPUT_TOOL_VERSION_MISSING',
  );
  const envValues = declaredValues(
    spec.env_inputs,
    context.env_values,
    'SENSOR_INPUT_ENV_VALUE_MISSING',
  );
  const subject =
    matchedDirty.length === 0 && gitSha !== null
      ? ({ kind: 'git_sha', git_sha: gitSha } as const)
      : ({ kind: 'dirty', git_sha: gitSha, dirty_files: matchedDirty } as const);
  return {
    input_digest_sha256: canonicalSha256({
      kind: spec.kind,
      spec_version: spec.spec_version,
      sensor_version: context.sensor_version,
      command_hash: context.command_hash,
      tool_versions: toolVersions,
      env_values: envValues,
      files: fileInputs,
      subject,
    }),
    subject,
  };
}
