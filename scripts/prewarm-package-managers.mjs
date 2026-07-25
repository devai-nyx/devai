#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const INTEGRITY_UPGRADES = new Map([
  [
    'pnpm@10.0.0',
    'pnpm@10.0.0+sha512.b8fef5494bd3fe4cbd4edabd0745df2ee5be3e4b0b8b08fa643aa3e4c6702ccc0f00d68fa8a8c9858a735a0032485a44990ed2810526c875e416f001b17df12b',
  ],
]);

function usage(message) {
  if (message !== undefined) process.stderr.write(`${message}\n`);
  process.stderr.write(
    'usage: node scripts/prewarm-package-managers.mjs [--repo-root <path>] [--list]\n',
  );
  process.exitCode = 2;
}

function parseArgs(argv) {
  let repoRoot = process.cwd();
  let list = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo-root') {
      const value = argv[index + 1];
      if (value === undefined) {
        usage('--repo-root requires a path');
        return null;
      }
      repoRoot = resolve(value);
      index += 1;
    } else if (arg === '--list') {
      list = true;
    } else {
      usage(`unknown argument: ${String(arg)}`);
      return null;
    }
  }
  return { repoRoot, list };
}

function collectPackageManagers(value, found) {
  if (Array.isArray(value)) {
    for (const item of value) collectPackageManagers(item, found);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (
        key === 'packageManager' &&
        typeof child === 'string' &&
        /^[a-z][a-z0-9._-]*@[0-9]/i.test(child)
      ) {
        const requirement = child.includes('+sha') ? child : INTEGRITY_UPGRADES.get(child);
        if (requirement === undefined) {
          throw new Error(
            `packageManager requirement lacks an approved integrity digest: ${child}`,
          );
        }
        found.add(requirement);
      }
      collectPackageManagers(child, found);
    }
    return;
  }
  if (typeof value !== 'string' || !value.includes('packageManager')) return;
  try {
    collectPackageManagers(JSON.parse(value), found);
  } catch (error) {
    throw new Error(
      `embedded packageManager JSON is malformed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function packageManagerRequirements(repoRoot) {
  const found = new Set();
  collectPackageManagers(
    JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')),
    found,
  );

  const fixtureDir = resolve(
    repoRoot,
    'packages/skills/tests/contract/fixtures/r20-baseline/inputs',
  );
  for (const name of readdirSync(fixtureDir).sort()) {
    if (!name.endsWith('.json')) continue;
    collectPackageManagers(JSON.parse(readFileSync(resolve(fixtureDir, name), 'utf8')), found);
  }
  return [...found];
}

const options = parseArgs(process.argv.slice(2));
if (options !== null) {
  const requirements = packageManagerRequirements(options.repoRoot);
  if (options.list) {
    process.stdout.write(`${JSON.stringify(requirements)}\n`);
  } else {
    for (const requirement of requirements) {
      const result = spawnSync('corepack', ['prepare', requirement], {
        cwd: options.repoRoot,
        env: process.env,
        encoding: 'utf8',
        stdio: 'inherit',
      });
      if (result.error !== undefined) {
        process.stderr.write(`prewarm package managers: ${requirement}: ${result.error.message}\n`);
        process.exitCode = 1;
        break;
      }
      if (result.status !== 0) {
        process.exitCode = result.status ?? 1;
        break;
      }
    }
  }
}
