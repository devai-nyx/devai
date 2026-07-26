import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXCEPTIONS_PATH = join(ROOT, 'law/policy/governed-sha-reference-exceptions.json');
const SHA40 = /\b[0-9a-f]{40}\b/gu;

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
}

function fail(message) {
  process.stderr.write(`governed SHA references: FAIL: ${message}\n`);
  process.exitCode = 1;
}

if (!existsSync(EXCEPTIONS_PATH)) {
  fail(`missing exception registry ${relative(ROOT, EXCEPTIONS_PATH)}`);
} else {
  const parsed = JSON.parse(readFileSync(EXCEPTIONS_PATH, 'utf8'));
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const exceptions = new Map();
  for (const entry of entries) {
    if (
      typeof entry?.sha !== 'string' ||
      !/^[0-9a-f]{40}$/u.test(entry.sha) ||
      typeof entry?.object_kind !== 'string' ||
      entry.object_kind.length === 0 ||
      typeof entry?.reason !== 'string' ||
      entry.reason.length === 0
    ) {
      fail('every exception needs sha, object_kind, and reason');
      continue;
    }
    if (exceptions.has(entry.sha)) {
      fail(`duplicate exception ${entry.sha}`);
      continue;
    }
    exceptions.set(entry.sha, entry);
  }

  const files = [
    join(ROOT, 'law/register/DECISIONS.md'),
    ...markdownFiles(join(ROOT, 'work/audit')),
  ];
  const references = new Map();
  for (const path of files) {
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(SHA40)) {
      const sha = match[0];
      const paths = references.get(sha) ?? new Set();
      paths.add(relative(ROOT, path));
      references.set(sha, paths);
    }
  }

  let resolved = 0;
  let classified = 0;
  for (const [sha, paths] of references) {
    try {
      execFileSync('git', ['cat-file', '-e', sha], { cwd: ROOT, stdio: 'ignore' });
      resolved += 1;
    } catch {
      if (exceptions.has(sha)) {
        classified += 1;
      } else {
        fail(`unresolved ${sha} in ${[...paths].sort().join(', ')}`);
      }
    }
  }

  for (const sha of exceptions.keys()) {
    if (!references.has(sha)) fail(`stale exception ${sha}`);
  }

  if (process.exitCode === undefined) {
    process.stdout.write(
      `governed SHA references: PASS (${references.size} identities; ${resolved} local; ${classified} classified)\n`,
    );
  }
}
