#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

function fail(message) {
  process.stderr.write(`CI_CANDIDATE_RANGE_UNBOUND: ${message}\n`);
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

const args = parseArgs(process.argv.slice(2));
const root = realpathSync(resolve(args.get('repo-root') ?? '.'));
const eventPath = args.get('event-path');
const outputPath = args.get('output');
if (!eventPath || !outputPath) fail('--event-path and --output are required');

let event;
try {
  event = JSON.parse(readFileSync(resolve(eventPath), 'utf8'));
} catch (error) {
  fail(`event payload is unreadable: ${error instanceof Error ? error.message : String(error)}`);
}

const eventName = process.env.GITHUB_EVENT_NAME ?? '';
const head = git(root, ['rev-parse', 'HEAD']);
const eventCandidate =
  eventName === 'pull_request'
    ? event.pull_request?.head?.sha
    : (event.after ?? process.env.GITHUB_SHA);
if (typeof eventCandidate !== 'string' || !/^[0-9a-f]{40}$/u.test(eventCandidate)) {
  fail(`event ${eventName || '<unknown>'} does not bind a full candidate SHA`);
}
if (head !== eventCandidate)
  fail(`checked-out HEAD ${head} differs from event candidate ${eventCandidate}`);

let base = eventName === 'pull_request' ? event.pull_request?.base?.sha : event.before;
if (typeof base !== 'string' || /^0{40}$/u.test(base)) {
  base = git(root, ['rev-parse', `${head}^`]);
}
if (!/^[0-9a-f]{40}$/u.test(base))
  fail(`event ${eventName || '<unknown>'} does not bind a full base SHA`);
git(root, ['cat-file', '-e', `${base}^{commit}`]);
git(root, ['merge-base', '--is-ancestor', base, head]);

const output = [
  `base=${base}`,
  `candidate=${head}`,
  `event_name=${eventName}`,
  `range=${base}..${head}`,
  '',
].join('\n');
appendFileSync(resolve(outputPath), output);
process.stdout.write(
  JSON.stringify({ base, candidate: head, event_name: eventName, range: `${base}..${head}` }) +
    '\n',
);
