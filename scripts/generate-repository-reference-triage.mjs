#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const targetRelative = 'work/rounds/R-0002/repository-reference-triage.json';
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
writeFileSync(
  join(root, targetRelative),
  `${JSON.stringify({ schemaVersion: '1.0.0', references }, null, 2)}\n`,
);
process.stdout.write(`${String(references.length)} repository references classified\n`);
