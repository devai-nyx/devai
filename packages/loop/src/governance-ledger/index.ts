import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { validators } from '@devai-nyx/schemas';
import { readProcessSync } from '@devai-nyx/authority';

export interface GovernanceFinding {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface GovernanceIntegrityReport {
  readonly ok: boolean;
  readonly findings: readonly GovernanceFinding[];
}

export interface ParsedGovernanceRecord {
  readonly path: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly body: string;
  readonly source: string;
}

interface ArchiveManifest {
  readonly files?: readonly {
    readonly path?: unknown;
    readonly sha256?: unknown;
  }[];
}

const DECISION_ID = /\b(?:DII-[0-9]+|ADR-[A-Za-z0-9-]+)\b/gu;
const DEFAULT_RECORDS_DIR = 'law/adr';
const DEFAULT_ROUNDS_DIR = 'work/rounds';
const DEFAULT_ARCHIVE_DIR = 'law/adr/predecessor';

function scalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === '[]') return [];
  if (trimmed === '{}') return {};
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    return inner.length === 0 ? [] : inner.split(',').map((item) => scalar(item));
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?[0-9]+$/u.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseYamlSubset(source: string): Record<string, unknown> {
  const lines = source
    .split('\n')
    .map((raw) => ({
      raw,
      indent: raw.length - raw.trimStart().length,
      text: raw.trim(),
    }))
    .filter((line) => line.text.length > 0 && !line.text.startsWith('#'));

  function parseObject(start: number, indent: number): [Record<string, unknown>, number] {
    const result: Record<string, unknown> = {};
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (line === undefined || line.indent < indent) break;
      if (line.indent > indent || line.text.startsWith('- ')) break;
      const colon = line.text.indexOf(':');
      if (colon < 1) {
        index += 1;
        continue;
      }
      const key = line.text.slice(0, colon).trim();
      const value = line.text.slice(colon + 1).trim();
      if (value.length > 0) {
        result[key] = scalar(value);
        index += 1;
        continue;
      }
      const next = lines[index + 1];
      if (next === undefined || next.indent <= indent) {
        result[key] = {};
        index += 1;
      } else if (next.text.startsWith('- ')) {
        const [items, nextIndex] = parseArray(index + 1, next.indent);
        result[key] = items;
        index = nextIndex;
      } else {
        const [child, nextIndex] = parseObject(index + 1, next.indent);
        result[key] = child;
        index = nextIndex;
      }
    }
    return [result, index];
  }

  function parseArray(start: number, indent: number): [unknown[], number] {
    const result: unknown[] = [];
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (line === undefined || line.indent < indent) break;
      if (line.indent !== indent || !line.text.startsWith('- ')) break;
      const item = line.text.slice(2).trim();
      if (item.includes(':')) {
        const colon = item.indexOf(':');
        const object: Record<string, unknown> = {
          [item.slice(0, colon).trim()]: scalar(item.slice(colon + 1).trim()),
        };
        index += 1;
        while (index < lines.length) {
          const nested = lines[index];
          if (nested === undefined || nested.indent <= indent) break;
          const nestedColon = nested.text.indexOf(':');
          if (nestedColon < 1) {
            index += 1;
            continue;
          }
          const key = nested.text.slice(0, nestedColon).trim();
          const value = nested.text.slice(nestedColon + 1).trim();
          if (value.length > 0) {
            object[key] = scalar(value);
            index += 1;
          } else {
            const after = lines[index + 1];
            if (after === undefined || after.indent <= nested.indent) {
              object[key] = {};
              index += 1;
            } else if (after.text.startsWith('- ')) {
              const [items, nextIndex] = parseArray(index + 1, after.indent);
              object[key] = items;
              index = nextIndex;
            } else {
              const [child, nextIndex] = parseObject(index + 1, after.indent);
              object[key] = child;
              index = nextIndex;
            }
          }
        }
        result.push(object);
      } else {
        result.push(scalar(item));
        index += 1;
      }
    }
    return [result, index];
  }

  return parseObject(0, lines[0]?.indent ?? 0)[0];
}

export function parseGovernanceRecord(path: string): ParsedGovernanceRecord {
  const source = readFileSync(path, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n(?:\r?\n)?/u.exec(source);
  if (match === null) {
    throw new Error('frontmatter is required');
  }
  return {
    path,
    frontmatter: parseYamlSubset(match[1] ?? ''),
    body: source.slice(match[0].length),
    source,
  };
}

function markdownFiles(dir: string): readonly string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md' && name !== 'codex-pre-v1.md')
    .map((name) => join(dir, name))
    .sort((left, right) =>
      basename(left).localeCompare(basename(right), undefined, { numeric: true }),
    );
}

function git(repoRoot: string, args: readonly string[]): string | null {
  const result = readProcessSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function gitFile(repoRoot: string, commit: string, path: string): string | null {
  return git(repoRoot, ['show', `${commit}:${path}`]);
}

function normalizedSealedFrontmatter(record: ParsedGovernanceRecord): string {
  const { status: _lifecycle, superseded_by: _replacement, ...rest } = record.frontmatter;
  return JSON.stringify(rest);
}

function replacementId(record: ParsedGovernanceRecord): string | null {
  const value = record.frontmatter['superseded_by'];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function sealedTransitionAllowed(
  before: ParsedGovernanceRecord,
  after: ParsedGovernanceRecord,
): boolean {
  const beforeStatus = String(before.frontmatter['status']);
  const afterStatus = String(after.frontmatter['status']);
  const beforeReplacement = replacementId(before);
  const afterReplacement = replacementId(after);

  if (beforeStatus === 'active') {
    if (afterStatus === 'active') return afterReplacement === beforeReplacement;
    if (afterStatus === 'superseded') {
      return beforeReplacement === null && afterReplacement !== null;
    }
    if (afterStatus === 'tombstoned') return afterReplacement === beforeReplacement;
    return false;
  }
  return (
    ['superseded', 'tombstoned'].includes(beforeStatus) &&
    afterStatus === beforeStatus &&
    afterReplacement === beforeReplacement
  );
}

function sealedHistoryFindings(
  repoRoot: string,
  record: ParsedGovernanceRecord,
): GovernanceFinding[] {
  const rel = relative(repoRoot, record.path);
  const commits = (git(repoRoot, ['log', '--follow', '--format=%H', '--reverse', '--', rel]) ?? '')
    .split('\n')
    .filter(Boolean);
  let sealed: ParsedGovernanceRecord | undefined;
  let sealIndex = -1;
  for (const [index, commit] of commits.entries()) {
    const source = gitFile(repoRoot, commit, rel);
    if (source === null) continue;
    try {
      const candidate = parseRecordSource(rel, source);
      if (
        validators.recordMeta(candidate.frontmatter) &&
        ['active', 'superseded', 'tombstoned'].includes(String(candidate.frontmatter['status']))
      ) {
        sealed = candidate;
        sealIndex = index;
        break;
      }
    } catch {
      // Legacy ADR revisions before the schema-bound migration are not sealing commits.
    }
  }
  if (sealed === undefined || sealIndex < 0) return [];
  for (const commit of commits.slice(sealIndex + 1)) {
    const laterSource = gitFile(repoRoot, commit, rel);
    if (laterSource === null) continue;
    let later: ParsedGovernanceRecord;
    try {
      later = parseRecordSource(rel, laterSource);
    } catch (error) {
      return [
        {
          code: 'DECISION_HISTORY_PARSE_INVALID',
          message: `${rel} has malformed post-seal history at ${commit}: ${error instanceof Error ? error.message : String(error)}.`,
          path: rel,
        },
      ];
    }
    if (
      later.body !== sealed.body ||
      normalizedSealedFrontmatter(later) !== normalizedSealedFrontmatter(sealed) ||
      !sealedTransitionAllowed(sealed, later)
    ) {
      return [
        {
          code: 'DECISION_LOCKED_BODY_MUTATED',
          message: `${rel} changed after its sealing commit; only a canonical terminal lifecycle transition is allowed.`,
          path: rel,
        },
      ];
    }
    sealed = later;
  }
  return [];
}

function parseRecordSource(path: string, source: string): ParsedGovernanceRecord {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n(?:\r?\n)?/u.exec(source);
  if (match === null) throw new Error('frontmatter is required');
  return {
    path,
    frontmatter: parseYamlSubset(match[1] ?? ''),
    body: source.slice(match[0].length),
    source,
  };
}

export function decisionRecordIntegrity(options: {
  readonly repoRoot: string;
  readonly recordsDir?: string;
}): GovernanceIntegrityReport {
  const recordsDir = resolve(options.repoRoot, options.recordsDir ?? DEFAULT_RECORDS_DIR);
  const findings: GovernanceFinding[] = [];
  if (git(options.repoRoot, ['rev-parse', '--is-shallow-repository']) === 'true') {
    findings.push({
      code: 'DECISION_HISTORY_SHALLOW',
      message: 'Sealed decision history requires a complete Git history; shallow history cannot pass.',
      path: relative(options.repoRoot, recordsDir),
    });
  }
  const records = new Map<string, ParsedGovernanceRecord>();
  for (const path of markdownFiles(recordsDir)) {
    let record: ParsedGovernanceRecord;
    try {
      record = parseGovernanceRecord(path);
    } catch (error) {
      findings.push({
        code: 'DECISION_FRONTMATTER_INVALID',
        message: `${relative(options.repoRoot, path)}: ${error instanceof Error ? error.message : String(error)}`,
        path: relative(options.repoRoot, path),
      });
      continue;
    }
    if (!validators.recordMeta(record.frontmatter)) {
      findings.push({
        code: 'DECISION_SCHEMA_INVALID',
        message: `${relative(options.repoRoot, path)} does not satisfy decision-record.schema.json.`,
        path: relative(options.repoRoot, path),
      });
    }
    const id = String(record.frontmatter['id'] ?? '');
    if (basename(path, '.md') !== id && !basename(path, '.md').startsWith(`${id}-`)) {
      findings.push({
        code: 'DECISION_ID_FILENAME_MISMATCH',
        message: `${relative(options.repoRoot, path)} declares ${id || '(missing id)'}.`,
        path: relative(options.repoRoot, path),
      });
    }
    if (records.has(id)) {
      findings.push({
        code: 'DECISION_ID_DUPLICATE',
        message: `${id} is declared by more than one record.`,
        path: relative(options.repoRoot, path),
      });
    }
    records.set(id, record);
    findings.push(...sealedHistoryFindings(options.repoRoot, record));
  }

  for (const [id, record] of records) {
    const supersedes = Array.isArray(record.frontmatter['supersedes'])
      ? record.frontmatter['supersedes'].map(String)
      : [];
    const supersededBy =
      typeof record.frontmatter['superseded_by'] === 'string'
        ? [record.frontmatter['superseded_by']]
        : [];
    for (const target of supersedes) {
      const other = records.get(target);
      const reverse =
        typeof other?.frontmatter['superseded_by'] === 'string'
          ? [other.frontmatter['superseded_by']]
          : [];
      if (other === undefined || !reverse.includes(id)) {
        findings.push({
          code: 'DECISION_SUPERSESSION_ASYMMETRIC',
          message: `${id} supersedes ${target}, but the reverse link does not resolve.`,
          path: relative(options.repoRoot, record.path),
        });
      }
    }
    for (const target of supersededBy) {
      const other = records.get(target);
      const reverse = Array.isArray(other?.frontmatter['supersedes'])
        ? other.frontmatter['supersedes'].map(String)
        : [];
      if (other === undefined || !reverse.includes(id)) {
        findings.push({
          code: 'DECISION_SUPERSESSION_ASYMMETRIC',
          message: `${id} is superseded by ${target}, but the reverse link does not resolve.`,
          path: relative(options.repoRoot, record.path),
        });
      }
    }
  }
  return { ok: findings.length === 0, findings };
}

function walkFiles(path: string): readonly string[] {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  if (!stat.isDirectory()) return [];
  return readdirSync(path).flatMap((entry) => walkFiles(join(path, entry)));
}

export function decisionCitationResolution(options: {
  readonly repoRoot: string;
  readonly roots?: readonly string[];
  readonly recordsDir?: string;
}): GovernanceIntegrityReport {
  const recordsDir = resolve(options.repoRoot, options.recordsDir ?? DEFAULT_RECORDS_DIR);
  const resolved = new Set(markdownFiles(recordsDir).map((path) => basename(path, '.md')));
  const roots = options.roots ?? ['README.md', 'law', 'product', 'docs', 'packages', 'work'];
  const strictRoots = options.roots !== undefined;
  const findings: GovernanceFinding[] = [];
  for (const path of roots.flatMap((root) => walkFiles(resolve(options.repoRoot, root)))) {
    const rel = relative(options.repoRoot, path);
    if (
      path.includes(`${join('node_modules', '')}`) ||
      path.includes(`${join('dist', '')}`) ||
      (!strictRoots &&
        (path.startsWith(recordsDir) ||
          rel.startsWith('law/register/') ||
          rel.startsWith('law/adr/predecessor/') ||
          rel.startsWith('docs/site/versioned_docs/') ||
          rel.startsWith('docs/adopters/') ||
          rel.startsWith(['work', 'rounds', ''].join('/')) ||
          /(^|\/)(?:test|tests|fixtures)\//u.test(rel) ||
          rel.endsWith('CHANGELOG.md') ||
          rel.startsWith('packages/schemas/src/generated/'))) ||
      !/\.(?:md|ts|mts|js|mjs|json|ya?ml)$/u.test(path)
    ) {
      continue;
    }
    const body = readFileSync(path, 'utf8');
    for (const match of new Set(body.match(DECISION_ID) ?? [])) {
      if (!strictRoots && match.startsWith('ADR-') && !/^ADR-[0-9]{3}$/u.test(match)) {
        continue;
      }
      if (!resolved.has(match)) {
        findings.push({
          code: 'DECISION_CITATION_UNRESOLVED',
          message: `${rel} cites missing ${match}.`,
          path: rel,
        });
      }
    }
  }
  return { ok: findings.length === 0, findings };
}

export function archiveImmutability(options: {
  readonly repoRoot: string;
  readonly archiveDir?: string;
}): GovernanceIntegrityReport {
  const archiveDir = resolve(options.repoRoot, options.archiveDir ?? DEFAULT_ARCHIVE_DIR);
  const manifestPath = join(archiveDir, 'MANIFEST.json');
  if (!existsSync(archiveDir)) return { ok: true, findings: [] };
  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      findings: [
        {
          code: 'ARCHIVE_MANIFEST_MISSING',
          message: `${relative(options.repoRoot, archiveDir)} has no MANIFEST.json.`,
          path: relative(options.repoRoot, archiveDir),
        },
      ],
    };
  }
  let manifest: ArchiveManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ArchiveManifest;
  } catch {
    return {
      ok: false,
      findings: [
        {
          code: 'ARCHIVE_MANIFEST_INVALID',
          message: 'MANIFEST.json is not valid JSON.',
          path: relative(options.repoRoot, manifestPath),
        },
      ],
    };
  }
  const findings: GovernanceFinding[] = [];
  const declared = new Set<string>();
  for (const entry of manifest.files ?? []) {
    if (typeof entry.path !== 'string' || typeof entry.sha256 !== 'string') {
      findings.push({
        code: 'ARCHIVE_MANIFEST_INVALID',
        message: 'Every manifest entry requires string path and sha256 fields.',
        path: relative(options.repoRoot, manifestPath),
      });
      continue;
    }
    declared.add(entry.path);
    const path = join(archiveDir, entry.path);
    if (!existsSync(path)) {
      findings.push({
        code: 'ARCHIVE_FILE_MISSING',
        message: `${entry.path} is declared but absent.`,
        path: relative(options.repoRoot, path),
      });
      continue;
    }
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (actual !== entry.sha256) {
      findings.push({
        code: 'ARCHIVE_HASH_MISMATCH',
        message: `${entry.path} does not match its frozen SHA-256.`,
        path: relative(options.repoRoot, path),
      });
    }
  }
  for (const path of walkFiles(archiveDir)) {
    const rel = relative(archiveDir, path);
    if (rel !== 'MANIFEST.json' && !declared.has(rel)) {
      findings.push({
        code: 'ARCHIVE_FILE_UNDECLARED',
        message: `${rel} is not pinned by MANIFEST.json.`,
        path: relative(options.repoRoot, path),
      });
    }
  }
  return { ok: findings.length === 0, findings };
}

export function roundRecordIntegrity(options: {
  readonly repoRoot: string;
  readonly roundsDir?: string;
}): GovernanceIntegrityReport {
  const roundsDir = resolve(options.repoRoot, options.roundsDir ?? DEFAULT_ROUNDS_DIR);
  const findings: GovernanceFinding[] = [];
  if (!existsSync(roundsDir)) return { ok: true, findings };
  for (const name of readdirSync(roundsDir).sort()) {
    const dir = join(roundsDir, name);
    if (!statSync(dir).isDirectory()) continue;
    const recordPath = join(dir, 'record.md');
    if (!existsSync(recordPath)) {
      findings.push({
        code: 'ROUND_RECORD_MISSING',
        message: `${name} has no record.md.`,
        path: relative(options.repoRoot, dir),
      });
      continue;
    }
    let record: ParsedGovernanceRecord;
    try {
      record = parseGovernanceRecord(recordPath);
    } catch {
      findings.push({
        code: 'ROUND_RECORD_SCHEMA_INVALID',
        message: `${name}/record.md has invalid frontmatter.`,
        path: relative(options.repoRoot, recordPath),
      });
      continue;
    }
    if (!validators.recordMeta(record.frontmatter)) {
      findings.push({
        code: 'ROUND_RECORD_SCHEMA_INVALID',
        message: `${name}/record.md does not satisfy round-record.schema.json.`,
        path: relative(options.repoRoot, recordPath),
      });
    }
    if (record.frontmatter['status'] === 'closed') {
      const phaseClosure = String(record.frontmatter['phase_closure'] ?? '');
      const phaseLedgerPath = join(options.repoRoot, 'record/derived/indexes/rounds.md');
      if (
        phaseClosure.length === 0 ||
        !existsSync(phaseLedgerPath) ||
        !readFileSync(phaseLedgerPath, 'utf8').includes(phaseClosure)
      ) {
        findings.push({
          code: 'ROUND_PHASE_CLOSURE_UNRESOLVED',
          message: `${name} cites missing phase closure ${phaseClosure || '(none)'}.`,
          path: relative(options.repoRoot, recordPath),
        });
      }
      const rel = relative(options.repoRoot, dir);
      const commits = (git(options.repoRoot, ['log', '--format=%H', '--reverse', '--', rel]) ?? '')
        .split('\n')
        .filter(Boolean);
      if (commits.length > 1) {
        const sealedTree = git(options.repoRoot, ['rev-parse', `${commits[0]}:${rel}`]);
        const currentTree = git(options.repoRoot, ['rev-parse', `HEAD:${rel}`]);
        if (sealedTree !== null && currentTree !== null && sealedTree !== currentTree) {
          findings.push({
            code: 'ROUND_ARCHIVE_MUTATED',
            message: `${name} changed after its first closed commit.`,
            path: rel,
          });
        }
      }
    }
  }
  return { ok: findings.length === 0, findings };
}

export function renderDecisionRecords(options: {
  readonly repoRoot: string;
  readonly recordsDir?: string;
}): string {
  const recordsDir = resolve(options.repoRoot, options.recordsDir ?? DEFAULT_RECORDS_DIR);
  const bodies = markdownFiles(recordsDir).map((path) => parseGovernanceRecord(path).body);
  return [
    '# Design Decisions',
    '',
    '<!-- generated from canonical records; do not edit -->',
    '',
    ...bodies,
  ].join('\n');
}

export function renderDecisionIndex(options: {
  readonly repoRoot: string;
  readonly recordsDir?: string;
}): string {
  const recordsDir = resolve(options.repoRoot, options.recordsDir ?? DEFAULT_RECORDS_DIR);
  const rows = markdownFiles(recordsDir).map((path) => {
    const record = parseGovernanceRecord(path);
    return [
      String(record.frontmatter['id'] ?? ''),
      String(record.frontmatter['title'] ?? ''),
      String(record.frontmatter['status'] ?? ''),
      String(record.frontmatter['round'] ?? ''),
      String(record.frontmatter['date'] ?? ''),
    ];
  });
  return [
    '# Governance decision records',
    '',
    '<!-- generated from canonical record frontmatter; do not edit -->',
    '',
    '| ID | Title | Status | Round | Date |',
    '|---|---|---|---|---|',
    ...rows.map(
      ([id, title, status, round, date]) =>
        `| [${id}](./${id}.md) | ${title} | ${status} | ${round} | ${date} |`,
    ),
    '',
  ].join('\n');
}

export function renderRoundRecords(options: {
  readonly repoRoot: string;
  readonly roundsDir?: string;
}): string {
  const roundsDir = resolve(options.repoRoot, options.roundsDir ?? DEFAULT_ROUNDS_DIR);
  if (!existsSync(roundsDir)) return '# Governed Rounds\n';
  const bodies = readdirSync(roundsDir)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((name) => join(roundsDir, name, 'record.md'))
    .filter(existsSync)
    .map((path) => parseGovernanceRecord(path).body);
  return [
    '# Governed Rounds',
    '',
    '<!-- generated from sealed round records -->',
    '',
    ...bodies,
  ].join('\n');
}

export const governanceLedger = {
  decisionRecordIntegrity,
  decisionCitationResolution,
  archiveImmutability,
  roundRecordIntegrity,
  renderDecisionRecords,
  renderDecisionIndex,
  renderRoundRecords,
} as const;
