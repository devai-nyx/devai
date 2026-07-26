#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

function values(argv, flag) {
  const result = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === flag && argv[index + 1] !== undefined) {
      result.push(argv[index + 1]);
      index += 1;
    }
  }
  return result;
}

function single(argv, flag, fallback) {
  return values(argv, flag).at(-1) ?? fallback;
}

function trackedTests(repoRoot) {
  const result = spawnSync('git', ['ls-files', '*test.ts', '*test.tsx'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'cannot enumerate tracked test sources');
  }
  return result.stdout.split(/\r?\n/u).filter(Boolean);
}

function governedPath(repoRoot, value) {
  const absolute = resolve(repoRoot, value);
  const rel = relative(repoRoot, absolute);
  if (rel.length === 0 || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`conditional-skip path escapes repository: ${value}`);
  }
  return rel.split(sep).join('/');
}

function propertyName(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression !== undefined &&
    ts.isStringLiteralLike(node.argumentExpression)
  ) {
    return node.argumentExpression.text;
  }
  return null;
}

export function sourceIntroducesConditionalSkip(path, sourceText) {
  const source = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true);
  let found = false;
  function visit(node) {
    const name = propertyName(node);
    if (name === 'skip' || name === 'skipIf' || name === 'runIf') found = true;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      /(?:skip|runIf)/iu.test(node.expression.text)
    ) {
      found = true;
    }
    if (!found) ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}

export function detectConditionalSkipSources(repoRoot, paths) {
  return [...new Set(paths)]
    .map((path) => governedPath(repoRoot, path))
    .filter((path) => existsSync(resolve(repoRoot, path)))
    .filter((path) =>
      sourceIntroducesConditionalSkip(path, readFileSync(resolve(repoRoot, path), 'utf8')),
    )
    .sort();
}

function main() {
  const argv = process.argv.slice(2);
  const repoRoot = resolve(single(argv, '--repo-root', '.'));
  const selected = values(argv, '--file');
  const sources = detectConditionalSkipSources(
    repoRoot,
    selected.length > 0 ? selected : trackedTests(repoRoot),
  );
  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ sources })}\n`);
  } else {
    process.stdout.write(`${sources.join('\n')}${sources.length > 0 ? '\n' : ''}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
