#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function fail(message) {
  process.stderr.write(`CI_TELEMETRY_UNBOUND: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
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

function readTelemetry(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`telemetry is unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const file = args.get('file');
const operation = args.get('operation');
const span = args.get('span');
if (!file || !operation || !span) fail('--file, --operation, and --span are required');
if (!/^[a-z][a-z0-9-]*$/u.test(span)) fail(`invalid span identity ${span}`);
const path = resolve(file);
const now = Date.now();
const timestamp = new Date(now).toISOString();

function exactCandidate() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

if (operation === 'start') {
  let telemetry;
  if (existsSync(path)) {
    telemetry = readTelemetry(path);
  } else {
    telemetry = {
      schemaVersion: '1.0.0',
      authority: 'non-authoritative-local-timing-observation',
      exact_candidate: exactCandidate(),
      workflow_run_id: process.env.GITHUB_RUN_ID ?? null,
      workflow_run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
      runner_class: process.env.RUNNER_ENVIRONMENT ?? null,
      spans: {},
      externally_required: {
        queue_ms: null,
        remote_artifact_upload_ms: null,
        remote_artifact_verification_ms: null,
        reason: 'These values require an observed GitHub run and are never synthesized locally.',
      },
    };
  }
  if (telemetry.spans?.[span] !== undefined) fail(`span ${span} already exists`);
  telemetry.spans ??= {};
  telemetry.spans[span] = { started_at: timestamp, started_epoch_ms: now };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(telemetry, null, 2)}\n`);
  process.exit(0);
}

if (operation === 'finish') {
  const telemetry = readTelemetry(path);
  const current = telemetry.spans?.[span];
  if (!current || !Number.isFinite(current.started_epoch_ms) || current.finished_at !== undefined) {
    fail(`span ${span} has no unfinished start observation`);
  }
  current.finished_at = timestamp;
  current.finished_epoch_ms = now;
  current.duration_ms = Math.max(0, now - current.started_epoch_ms);
  current.status = args.get('status') ?? 'observed';
  writeFileSync(path, `${JSON.stringify(telemetry, null, 2)}\n`);
  process.exit(0);
}

fail(`unknown operation ${operation}`);
