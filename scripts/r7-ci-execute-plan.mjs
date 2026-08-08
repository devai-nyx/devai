#!/usr/bin/env node

import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

function fail(message) {
  process.stderr.write(`COMMIT_VALIDATION_PLAN_EXECUTION_UNBOUND: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined)
      fail(`invalid argument near ${key ?? '<end>'}`);
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

function commandCwd(root, declared) {
  if (typeof declared !== 'string' || declared.length === 0 || isAbsolute(declared)) {
    fail(`command cwd must be a non-empty repository-relative path; received ${String(declared)}`);
  }
  const target = resolve(root, declared);
  const rel = relative(root, target);
  if (rel.startsWith('..') || isAbsolute(rel)) fail(`command cwd escapes repository: ${declared}`);
  return target;
}

const args = parseArgs(process.argv.slice(2));
const root = realpathSync(resolve(args.get('repo-root') ?? '.'));
const planPath = args.get('plan');
const outputPath = args.get('output');
if (!planPath || !outputPath) fail('--plan and --output are required');

let plan;
try {
  plan = JSON.parse(readFileSync(resolve(planPath), 'utf8'));
} catch (error) {
  fail(`plan is unreadable: ${error instanceof Error ? error.message : String(error)}`);
}
const head = git(root, ['rev-parse', 'HEAD']);
if (plan.candidate_sha !== head || !/^[0-9a-f]{40}$/u.test(plan.base_sha ?? '')) {
  fail(
    `plan range ${String(plan.base_sha)}..${String(plan.candidate_sha)} does not bind HEAD ${head}`,
  );
}
git(root, ['merge-base', '--is-ancestor', plan.base_sha, plan.candidate_sha]);
if (!Array.isArray(plan.selected_commands) || !Array.isArray(plan.omitted_commands)) {
  fail('selected_commands and omitted_commands must both be arrays');
}

let effectiveCommands = plan.selected_commands;
let effectiveValidationClass = plan.validation_class;
let narrowingActive = plan.narrowing_enabled === true;
let activation = null;
const activationPolicyPath = args.get('activation-policy');
const coldPolicyPath = args.get('cold-policy');
if ((activationPolicyPath && !coldPolicyPath) || (!activationPolicyPath && coldPolicyPath)) {
  fail('--activation-policy and --cold-policy must be supplied together');
}
if (activationPolicyPath && coldPolicyPath) {
  let activationPolicy;
  let coldPolicy;
  let activationPolicyBytes;
  let coldPolicyBytes;
  try {
    activationPolicyBytes = readFileSync(resolve(root, activationPolicyPath));
    coldPolicyBytes = readFileSync(resolve(root, coldPolicyPath));
    activationPolicy = JSON.parse(activationPolicyBytes.toString('utf8'));
    coldPolicy = JSON.parse(coldPolicyBytes.toString('utf8'));
  } catch (error) {
    fail(
      `activation policy is unreadable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const initialState = activationPolicy?.activation?.initial_state;
  const explicitlyActive =
    activationPolicy?.activation?.current_state === 'enabled-after-paired-evidence';
  activation = {
    policy_status: activationPolicy?.status ?? null,
    initial_state: initialState ?? null,
    current_state: activationPolicy?.activation?.current_state ?? null,
    narrowing_active: explicitlyActive,
    policy_identity: {
      path: activationPolicyPath,
      digest_sha256: createHash('sha256').update(activationPolicyBytes).digest('hex'),
    },
    cold_policy_identity: {
      path: coldPolicyPath,
      digest_sha256: createHash('sha256').update(coldPolicyBytes).digest('hex'),
    },
    reason: explicitlyActive
      ? 'The Architect policy explicitly records completed paired-evidence activation.'
      : 'Implementation is present, but narrowing remains disabled pending paired GitHub evidence and proved rollback.',
  };
  if (!explicitlyActive) {
    const coldCommands = coldPolicy?.convergence?.commands;
    if (!Array.isArray(coldCommands) || coldCommands.length !== 16) {
      fail('dormant activation requires the exact 16-command cold fallback population');
    }
    effectiveCommands = coldCommands.map((command) => ({
      id: command.id,
      argv: command.argv,
      cwd: command.cwd ?? '.',
      reason:
        'Classified narrowing is implemented but inactive; the exact active cold fallback remains mandatory.',
      exit_code: null,
    }));
    effectiveValidationClass = 'candidate-and-close';
    narrowingActive = false;
  }
}

const records = [];
for (const [ordinal, command] of effectiveCommands.entries()) {
  if (
    typeof command?.id !== 'string' ||
    !Array.isArray(command.argv) ||
    command.argv.length === 0 ||
    !command.argv.every((part) => typeof part === 'string' && part.length > 0)
  ) {
    fail(`selected command ${ordinal + 1} is malformed`);
  }
  const cwd = commandCwd(root, command.cwd);
  if (git(root, ['rev-parse', 'HEAD']) !== head) fail(`HEAD changed before ${command.id}`);
  const startedAt = new Date().toISOString();
  const started = process.hrtime.bigint();
  process.stdout.write(
    `::group::validation ${ordinal + 1}/${effectiveCommands.length} ${command.id}\n`,
  );
  const result = spawnSync(command.argv[0], command.argv.slice(1), {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });
  process.stdout.write('::endgroup::\n');
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  records.push({
    id: command.id,
    argv: command.argv,
    cwd: command.cwd,
    reason: command.reason,
    started_at: startedAt,
    duration_ms: Math.round(elapsedMs),
    exit_code: result.status ?? 1,
    signal: result.signal ?? null,
  });
}

const ok =
  records.length === effectiveCommands.length && records.every((entry) => entry.exit_code === 0);
const report = {
  schemaVersion: '1.0.0',
  authority: 'non-authoritative-observation',
  base_sha: plan.base_sha,
  candidate_sha: plan.candidate_sha,
  validation_class: effectiveValidationClass,
  classifier_validation_class: plan.validation_class,
  classifier_narrowing_enabled: plan.narrowing_enabled,
  narrowing_active: narrowingActive,
  activation,
  result: ok ? 'PASS' : 'FAIL',
  commands: records,
  omitted_commands: narrowingActive ? plan.omitted_commands : [],
  classifier_omitted_commands: plan.omitted_commands,
};
mkdirSync(dirname(resolve(outputPath)), { recursive: true });
writeFileSync(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`);
if (!ok) process.exitCode = 1;
