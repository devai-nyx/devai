#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

function fail(message) {
  process.stderr.write(`CI_REPORT_TRANSPORT_UNBOUND: ${message}\n`);
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

const args = parseArgs(process.argv.slice(2));
const directoryArg = args.get('directory');
const summaryPath = args.get('summary');
const coverageDirectoryArg = args.get('coverage-directory');
const maxFiles = Number(args.get('max-files') ?? 128);
const maxBytes = Number(args.get('max-bytes') ?? 16_777_216);
if (
  !directoryArg ||
  !summaryPath ||
  !Number.isSafeInteger(maxFiles) ||
  maxFiles < 1 ||
  !Number.isSafeInteger(maxBytes) ||
  maxBytes < 1
) {
  fail('--directory, --summary, and positive integer bounds are required');
}
if (isAbsolute(directoryArg) || directoryArg.split('/').includes('..')) {
  fail('report directory must be repository-relative and may not traverse parents');
}
const root = realpathSync('.');
const directory = resolve(root, directoryArg);
mkdirSync(directory, { recursive: true });

let retainedCoverage = null;
if (coverageDirectoryArg) {
  if (isAbsolute(coverageDirectoryArg) || coverageDirectoryArg.split('/').includes('..')) {
    fail('coverage directory must be repository-relative and may not traverse parents');
  }
  const source = resolve(root, coverageDirectoryArg, 'coverage-summary.json');
  if (existsSync(source)) {
    const targetDirectory = resolve(directory, 'coverage');
    mkdirSync(targetDirectory, { recursive: true });
    const target = resolve(targetDirectory, 'coverage-summary.json');
    copyFileSync(source, target);
    retainedCoverage = relative(directory, target);
  }
}

function walk(current) {
  const files = [];
  for (const name of readdirSync(current).sort()) {
    if (name === 'manifest.sha256' || name === 'transport.json') continue;
    const path = resolve(current, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink())
      fail(`symlink is forbidden in report transport: ${relative(root, path)}`);
    if (stat.isDirectory()) files.push(...walk(path));
    else if (stat.isFile()) files.push(path);
    else fail(`non-regular report entry is forbidden: ${relative(root, path)}`);
  }
  return files;
}

const digestBuildStarted = process.hrtime.bigint();
const files = walk(directory);
if (files.length > maxFiles) fail(`report has ${files.length} files; maximum is ${maxFiles}`);
let bytes = 0;
const manifest = [];
for (const path of files) {
  const content = readFileSync(path);
  bytes += content.byteLength;
  if (bytes > maxBytes) fail(`report exceeds maximum ${maxBytes} bytes`);
  const name = relative(directory, path);
  manifest.push({
    path: name,
    bytes: content.byteLength,
    sha256: createHash('sha256').update(content).digest('hex'),
  });
}
const manifestText =
  manifest.map((entry) => `${entry.sha256}  ${entry.path}`).join('\n') +
  (manifest.length ? '\n' : '');
writeFileSync(resolve(directory, 'manifest.sha256'), manifestText);
const digestBuildMs = Math.round(Number(process.hrtime.bigint() - digestBuildStarted) / 1_000_000);
const verificationStarted = process.hrtime.bigint();
for (const entry of manifest) {
  const observed = createHash('sha256')
    .update(readFileSync(resolve(directory, entry.path)))
    .digest('hex');
  if (observed !== entry.sha256) fail(`local digest verification failed for ${entry.path}`);
}
const localArtifactVerificationMs = Math.round(
  Number(process.hrtime.bigint() - verificationStarted) / 1_000_000,
);

function policyState(path, field) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), 'utf8'))?.[field] ?? null;
  } catch {
    return null;
  }
}

const telemetry = existsSync(resolve(directory, 'telemetry.json'))
  ? readJson(resolve(directory, 'telemetry.json'))
  : null;
const structuredReports = manifest
  .map((entry) => entry.path)
  .filter(
    (path) =>
      path === 'execution.json' ||
      path === 'observation.json' ||
      path.startsWith('commands/') ||
      path === retainedCoverage,
  );
const gateTimings = {};
for (const [span, observation] of Object.entries(telemetry?.spans ?? {})) {
  if (span.startsWith('gate-') && Number.isFinite(observation?.duration_ms)) {
    gateTimings[span.slice('gate-'.length)] = observation.duration_ms;
  }
}
if (existsSync(resolve(directory, 'execution.json'))) {
  const execution = readJson(resolve(directory, 'execution.json'));
  for (const command of execution.commands ?? []) {
    if (typeof command.id === 'string' && Number.isFinite(command.duration_ms)) {
      gateTimings[command.id] = command.duration_ms;
    }
  }
}
const commandDirectory = resolve(directory, 'commands');
if (existsSync(commandDirectory)) {
  for (const name of readdirSync(commandDirectory).filter((entry) => entry.endsWith('.json'))) {
    const command = readJson(resolve(commandDirectory, name));
    if (typeof command.id === 'string' && Number.isFinite(command.duration_ms)) {
      gateTimings[command.id] = command.duration_ms;
    }
  }
}
const coverageTotals = retainedCoverage
  ? (readJson(resolve(directory, retainedCoverage)).total ?? null)
  : null;
const transport = {
  schemaVersion: '1.0.0',
  authority: 'non-authoritative-transport',
  exact_candidate: telemetry?.exact_candidate ?? process.env.GITHUB_SHA ?? null,
  workflow_run_id: process.env.GITHUB_RUN_ID ?? null,
  workflow_run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  file_count: manifest.length,
  total_bytes: bytes,
  manifest_sha256: createHash('sha256').update(manifestText).digest('hex'),
  structured_reports: structuredReports,
  coverage_summary: retainedCoverage,
  coverage_totals: coverageTotals,
  report_limitations: {
    detailed_test_case_json: null,
    reason:
      'The frozen policy argv does not emit a case-level JSON file; command identity, exit, signal, and duration are retained without changing that population.',
  },
  timings_ms: {
    setup: telemetry?.spans?.setup?.duration_ms ?? null,
    install: telemetry?.spans?.install?.duration_ms ?? null,
    job_observed_after_checkout:
      telemetry?.spans?.['job-observed-after-checkout']?.duration_ms ?? null,
    jobs: {
      observed_after_checkout:
        telemetry?.spans?.['job-observed-after-checkout']?.duration_ms ?? null,
    },
    gates: gateTimings,
    digest_manifest_build: digestBuildMs,
    local_artifact_digest_verification: localArtifactVerificationMs,
    queue: null,
    remote_artifact_upload: null,
    remote_artifact_verification: null,
  },
  activation: {
    implementation_status: policyState('law/policy/commit-validation.json', 'status'),
    feature_policy_status: policyState('law/policy/github-actions-features.json', 'status'),
    activation_standing: 'disabled-pending-paired-github-observation',
    implementation_is_activation: false,
    paired_github_observation_required: true,
  },
  warning: 'Artifact existence, cache state, and transported PASS text grant no verdict authority.',
};
writeFileSync(resolve(directory, 'transport.json'), `${JSON.stringify(transport, null, 2)}\n`);
const duration = (value) => (value === null ? 'unobserved' : `${String(value)} ms`);
appendFileSync(
  resolve(summaryPath),
  [
    '## R-0007 CI observation',
    '',
    `- Candidate: \`${transport.exact_candidate ?? 'unbound'}\``,
    `- Report files: ${manifest.length}`,
    `- Report bytes: ${bytes}`,
    `- Manifest SHA-256: \`${transport.manifest_sha256}\``,
    `- Runner-local setup: ${duration(transport.timings_ms.setup)}`,
    `- Frozen install: ${duration(transport.timings_ms.install)}`,
    `- Runner-local job after checkout: ${duration(transport.timings_ms.job_observed_after_checkout)}`,
    `- Local digest verification: ${localArtifactVerificationMs} ms`,
    `- Coverage JSON: ${retainedCoverage ?? 'not produced by this population'}`,
    `- Gate timing records: ${Object.keys(gateTimings).length}`,
    '- Detailed test-case JSON: not emitted by the frozen command population; structured command exits and durations are retained instead.',
    '- Queue and remote artifact timings: require a real GitHub observation; no numeric value was synthesized.',
    '- Activation: implementation only; classified narrowing/cache activation still requires complete paired GitHub evidence.',
    '- Standing: non-authoritative transport only; every semantic gate must execute.',
    '',
  ].join('\n'),
);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(
      `structured report is unreadable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
