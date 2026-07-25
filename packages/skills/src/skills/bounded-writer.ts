import { mkdirSync, writeFileSync } from '@devai-nyx/authority';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, sep } from 'node:path';

export interface BoundedWriteObservation {
  readonly canonical_relative_path: string;
  readonly operation: 'create' | 'update';
}

/**
 * R20's W0-compatible observation seam. It deliberately cannot authorize a
 * mutation: R19 owns binding policy and the final host-effect boundary. The
 * default is a no-op passthrough so this extraction preserves behavior; R22
 * can connect the binding adapter without moving writer logic again.
 */
export type BoundedWriteObserver = (observation: BoundedWriteObservation) => void;

const observePassthrough: BoundedWriteObserver = () => undefined;

export interface ExactReplacement {
  readonly path: string;
  readonly find: string;
  readonly replace: string;
}

export interface BoundedSourceContext {
  readonly files: ReadonlyArray<{ readonly path: string; readonly content: string }>;
  readonly rejected: readonly string[];
}

function pathAllowed(rel: string, allowedScopes: ReadonlyArray<string>): boolean {
  return allowedScopes.some((glob) => {
    if (glob === '**') return true;
    const literalPrefix = glob.replace(/\*\*?$/g, '').replace(/\*/g, '');
    return rel.startsWith(literalPrefix);
  });
}

function safeRelativePath(value: string): string | null {
  const rel = value.trim();
  if (rel.length === 0 || rel.startsWith('-') || rel.includes('..') || isAbsolute(rel)) {
    return null;
  }
  return rel;
}

function containedExistingFile(
  worktreeRoot: string,
  value: string,
  allowedScopes: ReadonlyArray<string>,
): { rel: string; abs: string } | null {
  const rel = safeRelativePath(value);
  if (rel === null || !pathAllowed(rel, allowedScopes)) return null;
  const abs = join(worktreeRoot, rel);
  try {
    if (!existsSync(abs) || !statSync(abs).isFile()) return null;
    const rootReal = realpathSync(worktreeRoot);
    const targetReal = realpathSync(abs);
    if (targetReal !== rootReal && !targetReal.startsWith(rootReal + sep)) return null;
    return { rel, abs };
  } catch {
    return null;
  }
}

function occurrenceCount(value: string, search: string): number {
  let count = 0;
  let offset = 0;
  while (offset <= value.length - search.length) {
    const index = value.indexOf(search, offset);
    if (index < 0) break;
    count += 1;
    offset = index + 1;
  }
  return count;
}

/**
 * Read provider context only from exact, caller-declared file scopes. Glob
 * scopes are deliberately not expanded. Exact paths that escape containment,
 * are not regular files, or exceed either byte ceiling are reported as
 * rejected; content is never silently truncated.
 */
export function readExactBoundedSourceContext(
  worktreeRoot: string,
  allowedScopes: ReadonlyArray<string>,
  limits: { readonly maxFileBytes: number; readonly maxTotalBytes: number },
): BoundedSourceContext {
  const files: Array<{ path: string; content: string }> = [];
  const rejected: string[] = [];
  let totalBytes = 0;
  for (const scope of allowedScopes) {
    if (/[*?[\]]/u.test(scope)) continue;
    const resolved = containedExistingFile(worktreeRoot, scope, allowedScopes);
    if (resolved === null) {
      rejected.push(scope);
      continue;
    }
    try {
      const content = readFileSync(resolved.abs, 'utf8');
      const bytes = Buffer.byteLength(content, 'utf8');
      if (
        bytes > limits.maxFileBytes ||
        totalBytes + bytes > limits.maxTotalBytes ||
        limits.maxFileBytes < 0 ||
        limits.maxTotalBytes < 0
      ) {
        rejected.push(resolved.rel);
        continue;
      }
      files.push({ path: resolved.rel, content });
      totalBytes += bytes;
    } catch {
      rejected.push(resolved.rel);
    }
  }
  return { files, rejected };
}

/**
 * Prepare exact replacements entirely in memory, then perform one bounded
 * full-content write per affected file. Invalid anchors or paths reject the
 * whole batch before any write.
 */
export function applyExactReplacementsBounded(
  worktreeRoot: string,
  replacements: ReadonlyArray<ExactReplacement>,
  allowedScopes: ReadonlyArray<string>,
  observe: BoundedWriteObserver = observePassthrough,
): { written: string[]; rejected: string[] } {
  const contents = new Map<string, string>();
  const order: string[] = [];
  const rejected: string[] = [];

  for (const replacement of replacements) {
    const resolved = containedExistingFile(worktreeRoot, replacement.path, allowedScopes);
    const rejectedPath = replacement.path.trim();
    if (
      resolved === null ||
      replacement.find.length === 0 ||
      replacement.find === replacement.replace
    ) {
      rejected.push(rejectedPath);
      continue;
    }
    let content = contents.get(resolved.rel);
    if (content === undefined) {
      try {
        content = readFileSync(resolved.abs, 'utf8');
      } catch {
        rejected.push(resolved.rel);
        continue;
      }
      contents.set(resolved.rel, content);
      order.push(resolved.rel);
    }
    if (occurrenceCount(content, replacement.find) !== 1) {
      rejected.push(resolved.rel);
      continue;
    }
    contents.set(resolved.rel, content.replace(replacement.find, replacement.replace));
  }

  if (replacements.length === 0 || rejected.length > 0) {
    return { written: [], rejected: [...new Set(rejected)] };
  }
  return applyEditsBounded(
    worktreeRoot,
    order.map((path) => ({ path, content: contents.get(path) as string })),
    allowedScopes,
    observe,
  );
}

/**
 * Apply a proposed edit set to a worktree, after validating each path
 * against the allowed-scope policy. Returns the list of paths actually
 * written (skipping rejected paths). Per ADR-001 §8 safety rails.
 */
export function applyEditsBounded(
  worktreeRoot: string,
  edits: ReadonlyArray<{ path: string; content: string }>,
  allowedScopes: ReadonlyArray<string>,
  observe: BoundedWriteObserver = observePassthrough,
): { written: string[]; rejected: string[] } {
  const written: string[] = [];
  const rejected: string[] = [];
  for (const e of edits) {
    const rel = e.path.trim();
    if (rel.length === 0 || rel.startsWith('-') || rel.includes('..') || isAbsolute(rel)) {
      rejected.push(rel);
      continue;
    }
    // For the MVP scope check, '**' allows everything; otherwise we
    // require the path to start with a literal prefix of the glob.
    // Stricter glob matching can land later.
    const allowed = pathAllowed(rel, allowedScopes);
    if (!allowed) {
      rejected.push(rel);
      continue;
    }
    const abs = join(worktreeRoot, rel);
    // R18.C.2 (D-133/H5): literal-prefix matching alone allowed a symlinked
    // directory inside the worktree to carry an in-scope relative path
    // outside the boundary. Resolve the deepest existing ancestor of the
    // target through realpath and require it to stay inside the worktree's
    // own realpath before any directory creation or write happens.
    try {
      const rootReal = realpathSync(worktreeRoot);
      let probe = dirname(abs);
      while (!existsSync(probe)) probe = dirname(probe);
      const probeReal = realpathSync(probe);
      if (probeReal !== rootReal && !probeReal.startsWith(rootReal + sep)) {
        rejected.push(rel);
        continue;
      }
    } catch {
      rejected.push(rel);
      continue;
    }
    try {
      observe({
        canonical_relative_path: rel,
        operation: existsSync(abs) ? 'update' : 'create',
      });
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, e.content);
      written.push(rel);
    } catch {
      rejected.push(rel);
    }
  }
  return { written, rejected };
}
