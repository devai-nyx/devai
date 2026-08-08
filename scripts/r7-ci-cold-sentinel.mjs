#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const EXPECTED_IDS = [
  'formatting',
  'preparation',
  'action-registry',
  'trace',
  'repository-references',
  'materializations',
  'diff-check',
  'ordinary',
  'stage1',
  'stage2',
  't4',
  't5',
  't6',
  'changesets',
  'coverage',
  'governance',
];

function fail(message) {
  process.stderr.write(`COLD_SENTINEL_POPULATION_UNBOUND: ${message}\n`);
  process.exit(1);
}

function parsePairs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      fail(`invalid argument near ${key ?? '<end>'}`);
    }
    values.set(key.slice(2), value);
  }
  return values;
}

function git(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    fail(`git ${args.join(' ')} failed`);
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    fail(`${label} is unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function activeRoster(root, policyPath) {
  const policy = readJson(resolve(root, policyPath), 'cold policy');
  const commands = policy?.convergence?.commands;
  if (!Array.isArray(commands) || commands.length !== EXPECTED_IDS.length) {
    fail(`active cold roster must contain exactly ${EXPECTED_IDS.length} commands`);
  }
  if (JSON.stringify(commands.map((command) => command.id)) !== JSON.stringify(EXPECTED_IDS)) {
    fail('active cold roster IDs or ordering differ from the exact R-0007 population');
  }
  for (const command of commands) {
    if (
      !Array.isArray(command.argv) ||
      command.argv.length === 0 ||
      !command.argv.every((part) => typeof part === 'string' && part.length > 0)
    ) {
      fail(`cold command ${String(command.id)} has malformed argv`);
    }
  }
  return commands;
}

const separator = process.argv.indexOf('--');
const flagArgs = process.argv.slice(2, separator >= 0 ? separator : undefined);
const commandArgv = separator >= 0 ? process.argv.slice(separator + 1) : [];
const args = parsePairs(flagArgs);
const root = realpathSync(resolve(args.get('repo-root') ?? '.'));
const policyPath = args.get('policy') ?? 'law/policy/round-close-controls.json';

if (args.has('execute')) {
  const id = args.get('execute');
  const ordinal = Number(args.get('ordinal'));
  const recordsDirectory = args.get('records');
  if (!id || !recordsDirectory || !Number.isInteger(ordinal) || ordinal < 1) {
    fail('--execute requires --ordinal and --records');
  }
  const commands = activeRoster(root, policyPath);
  const expected = commands[ordinal - 1];
  if (expected?.id !== id || JSON.stringify(expected.argv) !== JSON.stringify(commandArgv)) {
    fail(`declared command ${ordinal}/${id} differs from the candidate policy roster`);
  }
  const candidate = git(root, ['rev-parse', 'HEAD']);
  const startedAt = new Date().toISOString();
  const started = process.hrtime.bigint();
  const result = spawnSync(commandArgv[0], commandArgv.slice(1), {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });
  const record = {
    id,
    ordinal,
    argv: commandArgv,
    cwd: '.',
    candidate_sha: candidate,
    started_at: startedAt,
    duration_ms: Math.round(Number(process.hrtime.bigint() - started) / 1_000_000),
    exit_code: result.status ?? 1,
    signal: result.signal ?? null,
  };
  mkdirSync(resolve(recordsDirectory), { recursive: true });
  writeFileSync(
    resolve(recordsDirectory, `${String(ordinal).padStart(2, '0')}-${id}.json`),
    `${JSON.stringify(record, null, 2)}\n`,
  );
  process.exit(record.exit_code);
}

const observationPath = args.get('observation');
if (!observationPath) fail('--observation is required');

if (args.has('assert')) {
  const observation = readJson(observationPath, 'observation');
  const predictedOk = observation.predicted?.result === 'PASS';
  const coldOk = observation.cold_observed?.result === 'PASS';
  if (!predictedOk || !coldOk) {
    process.stderr.write(
      `COLD_SENTINEL_GATE_FAILED: predicted=${String(observation.predicted?.result)} cold=${String(observation.cold_observed?.result)}\n`,
    );
    process.exit(1);
  }
  process.exit(0);
}

if (!args.has('finalize')) fail('one of --execute, --finalize, or --assert is required');
const planPath = args.get('plan');
const recordsDirectory = args.get('records');
const base = args.get('base');
const candidate = args.get('candidate');
if (!planPath || !recordsDirectory || !base || !candidate) {
  fail('--finalize requires --plan, --records, --base, and --candidate');
}
const head = git(root, ['rev-parse', 'HEAD']);
if (candidate !== head || !/^[0-9a-f]{40}$/u.test(base)) {
  fail(`range ${base}..${candidate} does not bind HEAD ${head}`);
}
git(root, ['merge-base', '--is-ancestor', base, candidate]);
const commands = activeRoster(root, policyPath);
const plan = readJson(planPath, 'prediction plan');
if (plan.base_sha !== base || plan.candidate_sha !== candidate) {
  fail('prediction plan does not bind the sentinel range');
}
if (!Array.isArray(plan.selected_commands) || !Array.isArray(plan.omitted_commands)) {
  fail('prediction plan lacks selected and omitted command populations');
}

const recordFiles = readdirSync(resolve(recordsDirectory)).filter((name) => name.endsWith('.json'));
if (recordFiles.length !== EXPECTED_IDS.length) {
  fail(`cold execution emitted ${recordFiles.length} records; expected ${EXPECTED_IDS.length}`);
}
const records = recordFiles
  .map((name) => readJson(resolve(recordsDirectory, name), `cold record ${name}`))
  .sort((left, right) => left.ordinal - right.ordinal);
for (const [index, record] of records.entries()) {
  const command = commands[index];
  if (
    record.ordinal !== index + 1 ||
    record.id !== command.id ||
    record.candidate_sha !== candidate ||
    JSON.stringify(record.argv) !== JSON.stringify(command.argv)
  ) {
    fail(`cold record ${index + 1} differs from the exact candidate roster`);
  }
}

const selectedIds = new Set(plan.selected_commands.map((command) => command.id));
const allIds = new Set(commands.map((command) => command.id));
for (const id of selectedIds) {
  if (!allIds.has(id)) fail(`predicted command ${String(id)} is outside the active cold roster`);
}
const predictedRecords = records.filter((record) => selectedIds.has(record.id));
const predictedOk = predictedRecords.every((record) => record.exit_code === 0);
const coldOk = records.every((record) => record.exit_code === 0);
const observation = {
  schemaVersion: '1.0.0',
  authority: 'non-authoritative-observation',
  exact_base: base,
  exact_candidate: candidate,
  predicted: {
    result: predictedOk ? 'PASS' : 'FAIL',
    commands: predictedRecords,
  },
  cold_observed: {
    result: coldOk ? 'PASS' : 'FAIL',
    commands: records,
  },
};
mkdirSync(dirname(resolve(observationPath)), { recursive: true });
writeFileSync(resolve(observationPath), `${JSON.stringify(observation, null, 2)}\n`);
