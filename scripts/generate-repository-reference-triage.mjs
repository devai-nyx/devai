#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
let rootArgument = '.';
let targetRelative;
let check = false;
for (let index = 0; index < args.length; index++) {
  const argument = args[index];
  if (argument === '--check') {
    check = true;
    continue;
  }
  if (argument === '--target') {
    targetRelative = args[index + 1];
    if (targetRelative === undefined || targetRelative.startsWith('--')) {
      throw new Error('--target requires a repository-relative path');
    }
    index++;
    continue;
  }
  if (argument?.startsWith('--')) throw new Error(`unknown option: ${argument}`);
  if (rootArgument !== '.') throw new Error(`unexpected positional argument: ${argument}`);
  rootArgument = argument ?? '.';
}
if (targetRelative === undefined) {
  throw new Error('--target is required; no closed-round output path is implicit');
}
if (targetRelative.startsWith('/') || targetRelative.split('/').includes('..')) {
  throw new Error('--target must stay within the repository');
}

const root = resolve(rootArgument);
const successorReference = ['devai-nyx', 'devai'].join('/');
const referencePattern = new RegExp(`${successorReference}(?:-original)?`, 'g');

function disposition(file, matched) {
  if (matched.endsWith('-original')) {
    return {
      classification: 'frozen-predecessor',
      action: 'retain',
      rationale:
        'Frozen predecessor identity; retained as an immutable historical or genesis binding.',
    };
  }
  if (
    file.endsWith('package.json') ||
    file.endsWith('pnpm-lock.yaml') ||
    file.endsWith('package-lock.json')
  ) {
    return {
      classification: 'package-metadata',
      action: 'retain',
      rationale: 'Package and repository metadata remains bound to the active successor identity.',
    };
  }
  if (
    file.includes('/predecessor/') ||
    file.startsWith('work/audit/R-0001/') ||
    file.startsWith('work/rounds/R-0001/')
  ) {
    return {
      classification: 'historical-label',
      action: 'retain',
      rationale:
        'Immutable historical text records the repository name used when that evidence was created.',
    };
  }
  if (
    file.startsWith('.devai/config/') ||
    file.includes('/fixtures/') ||
    file.startsWith('docs/site/')
  ) {
    return {
      classification: 'generated-output',
      action: 'retain',
      rationale:
        'Generated or characterized bytes agree with their successor-bound source and remain retained.',
    };
  }
  return {
    classification: 'active-successor',
    action: 'retain',
    rationale: 'Live successor reference; the active repository keeps the devai identity.',
  };
}

const files = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter((file) => file.length > 0 && file !== targetRelative)
  .sort();
const references = [];
for (const file of files) {
  let content;
  try {
    content = readFileSync(join(root, file), 'utf8');
  } catch {
    continue;
  }
  for (const [lineIndex, line] of content.split('\n').entries()) {
    referencePattern.lastIndex = 0;
    for (const match of line.matchAll(referencePattern)) {
      references.push({
        locator: `${file}:${String(lineIndex + 1)}:${String((match.index ?? 0) + 1)}:${match[0]}`,
        ...disposition(file, match[0]),
      });
    }
  }
}
references.sort((left, right) => left.locator.localeCompare(right.locator));
const bytes = `${JSON.stringify({ schemaVersion: '1.0.0', references }, null, 2)}\n`;
const target = join(root, targetRelative);
if (check) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== bytes) {
    process.stderr.write(`repository reference projection is stale: ${targetRelative}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`${String(references.length)} repository references verified\n`);
  }
} else {
  writeFileSync(target, bytes);
  process.stdout.write(`${String(references.length)} repository references classified\n`);
}
