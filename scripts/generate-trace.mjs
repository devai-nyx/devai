#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const invariantFiles = execFileSync(
  'find',
  ['law/invariants', '-maxdepth', '1', '-type', 'f', '-name', 'INV-*.json'],
  { cwd: root },
)
  .toString('utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .sort();
const invariantIds = invariantFiles.map((file) => basename(file, '.json'));
const invariantSet = new Set(invariantIds);
const testFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter((file) => /\.(?:test|spec)\.(?:ts|mjs)$/u.test(file))
  .sort();

function invariantSuite(file) {
  if (file.includes('/tests/unit/')) return 'unit';
  if (file.includes('/tests/contract/') || file.startsWith('tests/integration/')) return 'int';
  if (file.startsWith('tests/e2e/')) return 'e2e';
  if (file.startsWith('tests/regression/')) return 'perf';
  if (file.startsWith('tests/containment/')) return 'sec';
  return 'int';
}

function corpusSuite(file) {
  if (file.includes('/tests/unit/')) return 'unit';
  if (file.includes('/tests/contract/')) return 'contract';
  if (file.startsWith('tests/integration/')) return 'int';
  if (file.startsWith('tests/e2e/')) return file.includes('.smoke.') ? 'smoke' : 'e2e';
  if (file.startsWith('tests/regression/')) return 'regression';
  if (file.startsWith('tests/containment/')) return 'sec';
  return 'int';
}

const testRows = [];
const unmarked = [];
for (const file of testFiles) {
  const content = readFileSync(join(root, file), 'utf8');
  const ids = [
    ...new Set(
      [...content.matchAll(/^\/\/ Invariants:\s*(.+)$/gmu)]
        .flatMap((match) => (match[1] ?? '').match(/INV-[A-Z]+-[0-9]+/gu) ?? [])
        .filter((id) => invariantSet.has(id)),
    ),
  ].sort();
  if (ids.length === 0) {
    unmarked.push(file);
    continue;
  }
  testRows.push({ file, ids });
}
if (unmarked.length > 0) {
  process.stderr.write(
    `trace generation refused: ${String(unmarked.length)} test file(s) lack a canonical // Invariants: marker\n${unmarked.join('\n')}\n`,
  );
  process.exit(1);
}

const invariants = invariantIds.map((id) => ({
  id,
  tests: testRows
    .filter((row) => row.ids.includes(id))
    .map((row) => ({
      suite: invariantSuite(row.file),
      path: row.file,
      target_type: 'test',
    })),
}));
const tracedWithTests = invariants.filter((entry) => entry.tests.length > 0).length;
const trace = {
  schemaVersion: '1.0.0',
  version: '1.0.0',
  meta: {
    completeness: {
      min_invariants_with_tests_ratio: tracedWithTests / invariants.length,
      min_must_invariants_with_tests_ratio: tracedWithTests / invariants.length,
      require_doc_links: false,
      require_test_links: true,
    },
    provenance: [
      'R-0002 deterministic regeneration from canonical law/invariants and explicit test markers',
    ],
  },
  invariants,
  test_corpus: testRows.map((row) => ({
    path: row.file,
    suite: corpusSuite(row.file),
    invariant_ids: row.ids,
    lifecycle: 'supported',
  })),
  suites: {
    unit: { command: 'pnpm test:t1' },
    contract: { command: 'pnpm test:t2' },
    integration: { command: 'pnpm test:t3' },
    regression: { command: 'pnpm test:t4' },
    e2e: { command: 'pnpm test:t5' },
    containment: { command: 'pnpm test:t6' },
  },
};
writeFileSync(join(root, 'law/trace.json'), `${JSON.stringify(trace, null, 2)}\n`);
process.stdout.write(
  `${String(invariants.length)} invariants and ${String(testRows.length)} tests materialized\n`,
);
