import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { parsers } from '@devai-nyx/schemas';
import { anchorExists } from './anchor-resolver.js';
import { type DomainTaxonomy } from './domains-loader.js';
import { listSpecFiles } from './file-walker.js';
import { findDuplicateIds } from './xref-resolver.js';
import type { SpecValidationError, SpecValidationResult } from './types.js';

export interface ValidateInvariantsOptions {
  readonly invariantsDir: string;
  readonly domains: DomainTaxonomy;
  /** Repo root for resolving authority.docs[].doc relative paths. */
  readonly repoRoot: string;
  /**
   * When true, flag `statement:` fields that lack a recognized
   * CNL modal verb (MUST / MUST NOT / SHOULD / SHOULD NOT / MAY)
   * as `warn`-severity. Off by default to avoid breaking
   * pre-CNL invariants. Absorbed via Phase 11.E (D-39).
   */
  readonly strictCnl?: boolean;
  /**
   * Phase 23.E (closes D-A-22): basename glob patterns to exclude
   * from validation. Files in `invariantsDir` whose basename matches
   * any pattern (after the `INV-` prefix filter) are skipped and
   * reported under `result.files_skipped`. Default:
   * `['*-allowlist.json', '*-data.json']` so adopters can co-locate
   * companion data files (e.g. `INV-RBAC-001-allowlist.json`) in
   * the invariants directory without false-failing the validator.
   * Pass an empty array to disable companion-file exclusion.
   * Patterns support a single `*` wildcard.
   */
  readonly companionPatterns?: readonly string[];
}

const DEFAULT_COMPANION_PATTERNS: readonly string[] = ['*-allowlist.json', '*-data.json'];

function patternToRegExp(pattern: string): RegExp {
  // Escape regex metacharacters except '*', which becomes '.*'.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function isCompanion(baseName: string, patterns: readonly string[]): boolean {
  for (const p of patterns) {
    if (patternToRegExp(p).test(baseName)) return true;
  }
  return false;
}

export interface ValidatedInvariant {
  readonly id: string;
  readonly file: string;
  readonly domain: string;
}

const CNL_MODAL_RE = /\b(MUST NOT|SHOULD NOT|MUST|SHOULD|MAY)\b/;

export interface InvariantsResult extends SpecValidationResult {
  readonly invariants: readonly ValidatedInvariant[];
}

interface InvariantRecord {
  readonly id: string;
  readonly domain: string;
  readonly statement?: string;
  readonly authority?: {
    readonly docs?: ReadonlyArray<{ readonly doc: string; readonly anchor: string }>;
  };
}

/**
 * Load the tombstones registry (if it exists). Returns the set of
 * retired invariant ids. Absorbs LAW-00.AMENDMENT.2 (Batch 10.D).
 */
function loadTombstonedIds(invariantsDir: string): Set<string> {
  const path = join(invariantsDir, 'tombstones.json');
  if (!existsSync(path)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as {
      tombstones?: Array<{ id?: string }>;
    };
    const ids = new Set<string>();
    for (const t of parsed.tombstones ?? []) {
      if (typeof t.id === 'string') ids.add(t.id);
    }
    return ids;
  } catch {
    return new Set();
  }
}

export function validateInvariants(opts: ValidateInvariantsOptions): InvariantsResult {
  const allFiles = listSpecFiles(opts.invariantsDir, 'INV-');
  const patterns = opts.companionPatterns ?? DEFAULT_COMPANION_PATTERNS;
  const files: string[] = [];
  const skipped: string[] = [];
  for (const f of allFiles) {
    if (isCompanion(basename(f), patterns)) skipped.push(f);
    else files.push(f);
  }
  const errors: SpecValidationError[] = [];
  const loaded: Array<{ file: string; record: InvariantRecord }> = [];
  const tombstoned = loadTombstonedIds(opts.invariantsDir);

  for (const file of files) {
    const parsed = parsers.invariant.safeParseJson(readFileSync(file, 'utf8'));
    if (!parsed.ok && parsed.error.kind === 'json-syntax') {
      errors.push({ file, message: `JSON parse error: ${parsed.error.message}` });
      continue;
    }
    if (!parsed.ok) {
      for (const e of parsed.error.issues) {
        errors.push({
          file,
          pointer: e.instancePath || undefined,
          message: `${e.message ?? 'schema violation'} (${e.keyword})`,
        });
      }
      continue;
    }
    const record: InvariantRecord = parsed.value;

    // Filename consistency: basename should be `<id>.json`.
    const expectedName = `${record.id}.json`;
    if (basename(file) !== expectedName) {
      errors.push({
        file,
        message: `filename '${basename(file)}' does not match id '${record.id}' (expected ${expectedName})`,
      });
    }

    // Domain code consistency.
    if (!opts.domains.all.has(record.domain)) {
      errors.push({
        file,
        pointer: '/domain',
        message: `domain '${record.domain}' is not in the configured taxonomy (.devai/config/domains.json)`,
      });
    }
    // Domain in id must match the domain field.
    const idDomainMatch = /^INV-([A-Z][A-Z0-9]{1,15})-[0-9]{3}$/.exec(record.id);
    if (idDomainMatch && idDomainMatch[1] !== record.domain) {
      errors.push({
        file,
        pointer: '/id',
        message: `id domain '${idDomainMatch[1]}' does not match 'domain' field '${record.domain}'`,
      });
    }

    // Authority anchor resolution.
    for (const [i, d] of (record.authority?.docs ?? []).entries()) {
      const docPath = isAbsolute(d.doc) ? d.doc : resolve(dirname(file), '..', '..', '..', d.doc);
      // Simpler resolution: prefer repo-root anchor.
      const repoDocPath = resolve(opts.repoRoot, d.doc);
      const candidates = [repoDocPath, docPath];
      let resolved = false;
      for (const p of candidates) {
        if (anchorExists(p, d.anchor)) {
          resolved = true;
          break;
        }
      }
      if (!resolved) {
        errors.push({
          file,
          pointer: `/authority/docs/${String(i)}/anchor`,
          message: `cannot resolve anchor '${d.anchor}' in doc '${d.doc}' (tried ${candidates.join(', ')})`,
        });
      }
    }

    // Optional CNL strict-mode check (Phase 11.E). Surfaces as a
    // warning embedded in the errors array with a recognizable
    // prefix so callers can distinguish if needed; the gate still
    // hard-fails because the schema requires statement non-empty.
    if (opts.strictCnl && typeof record.statement === 'string') {
      if (!CNL_MODAL_RE.test(record.statement)) {
        errors.push({
          file,
          pointer: '/statement',
          code: 'STATEMENT_LACKS_CNL_MODAL',
          severity: 'warning',
          message: `cnl-warn: statement lacks a recognized modal verb (MUST / MUST NOT / SHOULD / SHOULD NOT / MAY); see law/invariants`,
        });
      }
    }

    loaded.push({ file, record });
  }

  // ID uniqueness across the set.
  const dups = findDuplicateIds(loaded.map((l) => ({ id: l.record.id, file: l.file })));
  for (const d of dups) {
    errors.push({
      file: d.files.join(' | '),
      message: `duplicate invariant id '${d.id}' across files: ${d.files.join(', ')}`,
    });
  }

  // Tombstone enforcement (Batch 10.D / LAW-00.AMENDMENT.2):
  // an id that appears in tombstones.json MUST NOT be reused by a
  // new active invariant.
  for (const l of loaded) {
    if (tombstoned.has(l.record.id)) {
      errors.push({
        file: l.file,
        pointer: '/id',
        message: `invariant id '${l.record.id}' is tombstoned (see law/invariants/tombstones.json); ids never reused`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    files_scanned: files.length,
    files_skipped: skipped.length,
    skipped_files: skipped,
    invariants: loaded.map((l) => ({
      id: l.record.id,
      file: l.file,
      domain: l.record.domain,
    })),
  };
}
