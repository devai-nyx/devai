#!/usr/bin/env node

/**
 * Local mirror of the default CI stages.
 *
 * Usage: pnpm run ci:local
 *
 * Stage 3 honors DEVAI_DB_TESTS and DEVAI_DB_URL when the caller has prepared
 * a local Postgres instance. CI supplies both variables and a service
 * container. Until BL-017 closes P5-KR-011, stage 3 is expected to execute and
 * fail the unweakened merged-coverage thresholds; this runner remains
 * fail-closed and returns that non-zero status.
 */

import { spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const stages = [
  ['stage 1 / static', 'ci:stage1'],
  ['stage 2 / fast gates', 'ci:stage2'],
  ['stage 3 / merged T1+T3 coverage', 'ci:stage3'],
];

if (process.argv.includes('--help')) {
  process.stdout.write(
    [
      'Run the same stage 1-3 scripts used by .github/workflows/ci.yml.',
      '',
      'Usage: pnpm run ci:local',
      '',
      'Optional DB-backed T3 coverage:',
      '  DEVAI_DB_TESTS=1 DEVAI_DB_URL=<postgres-url> pnpm run ci:local',
      '',
      'The runner refuses EVIDENCE_MODE until BL-022 and BL-038 are closed.',
      'Merged coverage remains fail-closed under P5-KR-011 / BL-017.',
      '',
    ].join('\n'),
  );
  process.exit(0);
}

const evidence = spawnSync(process.execPath, ['scripts/refuse-evidence-mode.mjs'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
if (evidence.error !== undefined) throw evidence.error;
if (evidence.status !== 0) process.exit(evidence.status ?? 1);

for (const [label, script] of stages) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(pnpm, ['run', script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error !== undefined) throw result.error;
  if (result.status !== 0) {
    if (script === 'ci:stage3') {
      process.stderr.write(
        '\nRED: merged coverage executed and failed closed. See P5-KR-011 and BL-017.\n',
      );
    }
    process.exit(result.status ?? 1);
  }
}

process.stdout.write('\nPASS: local CI stages 1-3 completed.\n');
