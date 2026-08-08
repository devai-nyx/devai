#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, posix, relative, resolve } from 'node:path';

const CLASSIFIER_VERSION = '1.0.0';
const CLASS_ORDER = [
  'governance-text',
  'law-and-schema',
  'runtime-and-tests',
  'candidate-and-close',
];
const POLICY_PATH = 'law/policy/round-close-controls.json';
const CLASSIFIER_POLICY_PATH = 'law/policy/commit-validation.json';
const GRAPH_PATH = 'work/rounds/R-0007/affected-test-graph.json';
const PLAN_DIGEST_METHOD = 'sha256-canonical-json-with-plan-digest-field-omitted';
const SHA40 = /^[0-9a-f]{40}$/;
const GLOB_CACHE = new Map();
const BLOB_CACHE = new Map();

function fail(code, reason) {
  process.stderr.write(`${code}: ${reason}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const values = new Map();
  const flags = new Set();
  const valueArguments = new Set([
    '--repo-root',
    '--round',
    '--base',
    '--candidate',
    '--sentinel-observation',
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--class' || argument.startsWith('--class=')) {
      fail(
        'COMMIT_VALIDATION_CLASS_UNDERBOUND',
        'author-provided validation classes are forbidden; the candidate diff is authoritative',
      );
    }
    if (argument === '--json') {
      flags.add(argument);
      continue;
    }
    if (!valueArguments.has(argument)) {
      fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `unknown classifier argument ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `${argument} requires one value`);
    }
    values.set(argument, value);
    index += 1;
  }

  for (const required of ['--repo-root', '--round', '--base', '--candidate']) {
    if (!values.has(required)) {
      fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `${required} is required`);
    }
  }
  if (!flags.has('--json')) {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', '--json is required for the machine interface');
  }
  return {
    repoRoot: resolve(values.get('--repo-root')),
    round: values.get('--round'),
    base: values.get('--base'),
    candidate: values.get('--candidate'),
    sentinelObservation: values.get('--sentinel-observation') ?? null,
  };
}

function run(repoRoot, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
  if (result.error || result.status !== 0) {
    if (options.allowFailure) return result;
    const detail = String(result.stderr || result.error?.message || '').trim();
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function git(repoRoot, args, options = {}) {
  return run(repoRoot, 'git', args, options);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function planDigest(plan) {
  const body = { ...plan };
  delete body.plan_digest_sha256;
  return sha256(canonicalize(body));
}

function validateCommit(repoRoot, value, label) {
  if (!SHA40.test(value)) {
    fail(
      'COMMIT_VALIDATION_CLOSURE_INCOMPLETE',
      `${label} must be one literal lowercase 40-hex commit`,
    );
  }
  const type = git(repoRoot, ['cat-file', '-t', value], { allowFailure: true });
  if (type.status !== 0 || String(type.stdout).trim() !== 'commit') {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `${label} does not resolve to a commit`);
  }
  const resolved = String(
    git(repoRoot, ['rev-parse', '--verify', `${value}^{commit}`]).stdout,
  ).trim();
  if (resolved !== value) {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `${label} did not resolve exactly`);
  }
  return resolved;
}

function candidateBlob(repoRoot, candidate, path) {
  const cacheKey = `${repoRoot}\0${candidate}\0${path}`;
  if (BLOB_CACHE.has(cacheKey)) return BLOB_CACHE.get(cacheKey);
  const result = git(repoRoot, ['cat-file', 'blob', `${candidate}:${path}`], {
    encoding: 'buffer',
    allowFailure: true,
  });
  const blob = result.status === 0 ? Buffer.from(result.stdout) : null;
  BLOB_CACHE.set(cacheKey, blob);
  return blob;
}

function candidateBlobBatch(repoRoot, candidate, paths) {
  const uniquePaths = [...new Set(paths)];
  const missing = uniquePaths.filter(
    (path) => !BLOB_CACHE.has(`${repoRoot}\0${candidate}\0${path}`),
  );
  if (missing.length > 0) {
    const result = spawnSync('git', ['cat-file', '--batch'], {
      cwd: repoRoot,
      encoding: 'buffer',
      input: Buffer.from(`${missing.map((path) => `${candidate}:${path}`).join('\n')}\n`),
      maxBuffer: 128 * 1024 * 1024,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    });
    if (result.error || result.status !== 0) {
      throw new Error(`git cat-file --batch failed: ${String(result.stderr || result.error)}`);
    }
    const output = Buffer.from(result.stdout);
    let offset = 0;
    for (const path of missing) {
      const lineEnd = output.indexOf(10, offset);
      if (lineEnd < 0) throw new Error(`truncated candidate blob batch at ${path}`);
      const header = output.subarray(offset, lineEnd).toString('utf8');
      const cacheKey = `${repoRoot}\0${candidate}\0${path}`;
      offset = lineEnd + 1;
      if (header.endsWith(' missing')) {
        BLOB_CACHE.set(cacheKey, null);
        continue;
      }
      const size = Number(header.split(' ').at(-1));
      if (!Number.isSafeInteger(size) || size < 0 || offset + size > output.length) {
        throw new Error(`invalid candidate blob batch header for ${path}`);
      }
      BLOB_CACHE.set(cacheKey, Buffer.from(output.subarray(offset, offset + size)));
      offset += size + 1;
    }
  }
  return new Map(
    uniquePaths.map((path) => [path, BLOB_CACHE.get(`${repoRoot}\0${candidate}\0${path}`)]),
  );
}

function requiredCandidateBlob(repoRoot, candidate, path) {
  const blob = candidateBlob(repoRoot, candidate, path);
  if (blob === null) {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `candidate object is missing ${path}`);
  }
  return blob;
}

function candidateJson(repoRoot, candidate, path) {
  const blob = requiredCandidateBlob(repoRoot, candidate, path);
  try {
    return { raw: blob, value: JSON.parse(blob.toString('utf8')) };
  } catch (error) {
    fail(
      'COMMIT_VALIDATION_CLOSURE_INCOMPLETE',
      `candidate ${path} is not valid JSON: ${error.message}`,
    );
  }
}

function trackedPaths(repoRoot, candidate) {
  const output = git(repoRoot, ['ls-tree', '-r', '-z', '--name-only', candidate], {
    encoding: 'buffer',
  }).stdout;
  return Buffer.from(output)
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
}

function treeEntry(repoRoot, commit, path) {
  const output = git(repoRoot, ['ls-tree', '-z', commit, '--', path], {
    encoding: 'buffer',
  }).stdout;
  const record = Buffer.from(output).toString('utf8').split('\0')[0];
  if (!record) return null;
  const separator = record.indexOf('\t');
  if (separator < 0) return null;
  const [mode, type, object] = record.slice(0, separator).split(' ');
  const entryType =
    mode === '120000'
      ? 'symlink'
      : mode === '160000' || type === 'commit'
        ? 'submodule'
        : 'regular-file';
  return { mode, type, object, entryType };
}

function expandBraces(pattern) {
  const match = pattern.match(/\{([^{}]+)\}/);
  if (!match) return [pattern];
  return match[1]
    .split(',')
    .flatMap((choice) =>
      expandBraces(
        `${pattern.slice(0, match.index)}${choice}${pattern.slice(match.index + match[0].length)}`,
      ),
    );
}

function globRegex(pattern) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*') {
      if (pattern[index + 1] === '*') {
        index += 1;
        if (pattern[index + 1] === '/') {
          index += 1;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
    } else if (character === '?') {
      source += '[^/]';
    } else {
      source += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`${source}$`);
}

function matches(path, selector) {
  let regexes = GLOB_CACHE.get(selector);
  if (!regexes) {
    regexes = expandBraces(selector).map(globRegex);
    GLOB_CACHE.set(selector, regexes);
  }
  return regexes.some((regex) => regex.test(path));
}

function matchesAny(path, selectors = []) {
  return selectors.some((selector) => matches(path, selector));
}

function parseDiff(repoRoot, base, candidate) {
  const argv = ['git', 'diff', '--name-status', '-z', '-M', '--find-renames', base, candidate];
  const raw = Buffer.from(
    git(repoRoot, argv.slice(1), {
      encoding: 'buffer',
    }).stdout,
  );
  const fields = raw.toString('utf8').split('\0');
  if (fields.at(-1) === '') fields.pop();
  const records = [];
  let nonExactSimilarity = false;

  for (let index = 0; index < fields.length;) {
    const rawStatus = fields[index++];
    if (!rawStatus) continue;
    if (/^[RC]\d+$/.test(rawStatus)) {
      const oldPath = fields[index++];
      const path = fields[index++];
      if (!oldPath || !path) {
        fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `truncated ${rawStatus} diff record`);
      }
      if (rawStatus === 'R100' || rawStatus === 'C100') {
        records.push({ status: rawStatus, oldPath, path });
      } else {
        nonExactSimilarity = true;
        records.push({ status: 'D', path: oldPath });
        records.push({ status: 'A', path });
      }
      continue;
    }
    if (!['A', 'M', 'D', 'T'].includes(rawStatus)) {
      fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `unsupported diff status ${rawStatus}`);
    }
    const path = fields[index++];
    if (!path) fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `truncated ${rawStatus} diff record`);
    records.push({ status: rawStatus, path });
  }
  if (records.length === 0) {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', 'base-to-candidate diff is empty');
  }
  return { argv, raw, records, nonExactSimilarity };
}

function classifyPath(path, classifierPolicy) {
  for (const rule of classifierPolicy.classification_rules ?? []) {
    if (matchesAny(path, rule.selectors)) return rule.class;
  }
  return 'unknown';
}

function strictest(classes) {
  let winner = 'governance-text';
  for (const value of classes) {
    const normalized = value === 'unknown' ? 'candidate-and-close' : value;
    if (CLASS_ORDER.indexOf(normalized) > CLASS_ORDER.indexOf(winner)) winner = normalized;
  }
  return winner;
}

function changedPathRecords(repoRoot, base, candidate, diff, classifierPolicy) {
  return diff.records.map((record) => {
    const paths = record.oldPath ? [record.oldPath, record.path] : [record.path];
    const pathClass = strictest(paths.map((path) => classifyPath(path, classifierPolicy)));
    const entryCommit = record.status === 'D' ? base : candidate;
    const entry = treeEntry(repoRoot, entryCommit, record.path);
    const result = {
      status: record.status,
      path: record.path,
      entry_type: entry?.entryType ?? 'absent',
      reason: `The exact ${record.status} record classifies ${paths.join(' and ')} as ${pathClass}.`,
      path_class: paths.some((path) => classifyPath(path, classifierPolicy) === 'unknown')
        ? 'unknown'
        : pathClass,
    };
    if (record.oldPath) result.old_path = record.oldPath;
    return result;
  });
}

function addDependency(collection, dependency) {
  const key = `${dependency.source_path}\0${dependency.target}\0${dependency.kind}`;
  if (!collection.has(key)) collection.set(key, dependency);
}

function dependencyClosure({ repoRoot, candidate, changedRecords, paths, closePolicy, graph }) {
  const dependencies = new Map();
  const impactedNodeIds = new Set();
  let dynamic = false;
  let incomplete = false;

  const changedPopulation = new Set();
  for (const record of changedRecords) {
    changedPopulation.add(record.path);
    if (record.old_path) changedPopulation.add(record.old_path);
  }

  for (const projection of closePolicy.projections ?? []) {
    const sourceHits = [...changedPopulation].filter((path) =>
      matchesAny(path, projection.sources),
    );
    const outputHits = [...changedPopulation].filter((path) =>
      matchesAny(path, projection.outputs),
    );
    for (const source of sourceHits) {
      for (const target of projection.outputs ?? []) {
        addDependency(dependencies, {
          source_path: source,
          target,
          kind: 'generated-source',
          reason: `Projection ${projection.id} generates this candidate materialization.`,
        });
      }
    }
    for (const output of outputHits) {
      for (const target of projection.sources ?? []) {
        addDependency(dependencies, {
          source_path: output,
          target,
          kind: 'materialization',
          reason: `Projection ${projection.id} binds this output to its authoritative source.`,
        });
      }
    }
  }

  for (const change of changedRecords) {
    if (change.entry_type !== 'symlink' || change.status === 'D') continue;
    const bytes = candidateBlob(repoRoot, candidate, change.path);
    if (bytes === null) {
      incomplete = true;
      continue;
    }
    const targetText = bytes.toString('utf8');
    const target = posix.normalize(posix.join(posix.dirname(change.path), targetText));
    const outside = target === '..' || target.startsWith('../') || target.startsWith('/');
    addDependency(dependencies, {
      source_path: change.path,
      target: outside ? targetText : target,
      kind: outside ? 'dynamic-unknown' : 'symlink-target',
      reason: outside
        ? 'The symlink target escapes the candidate repository and cannot be followed.'
        : 'The symlink entry binds its literal candidate link target without dereference.',
    });
    if (outside) dynamic = true;
  }

  const nodeById = new Map((graph.nodes ?? []).map((node) => [node.id, node]));
  const queue = [];
  for (const node of graph.nodes ?? []) {
    if (node.kind === 'fallback') continue;
    const hits = [...changedPopulation].filter((path) => matchesAny(path, node.input_selectors));
    if (hits.length === 0) continue;
    impactedNodeIds.add(node.id);
    queue.push(node.id);
    for (const source of hits) {
      addDependency(dependencies, {
        source_path: source,
        target: node.id,
        kind: node.kind === 'test-shard' ? 'affected-test' : 'command-closure',
        reason: `Affected-test graph node ${node.id} selects this candidate-bound closure.`,
      });
    }
  }
  while (queue.length > 0) {
    const id = queue.shift();
    const node = nodeById.get(id);
    for (const dependencyId of node?.depends_on ?? []) {
      if (impactedNodeIds.has(dependencyId)) continue;
      impactedNodeIds.add(dependencyId);
      queue.push(dependencyId);
      addDependency(dependencies, {
        source_path: id,
        target: dependencyId,
        kind: 'affected-test',
        reason: `Affected-test graph dependency of ${id}.`,
      });
    }
  }

  for (const shared of graph.shared_inputs ?? []) {
    const hits = [...changedPopulation].filter((path) => matchesAny(path, shared.selectors));
    for (const source of hits) {
      for (const target of shared.invalidates ?? []) {
        addDependency(dependencies, {
          source_path: source,
          target,
          kind:
            target.includes('coverage') || target.includes('suite')
              ? 'affected-test'
              : 'governance',
          reason: `Shared input ${shared.id} invalidates ${target}.`,
        });
      }
    }
  }

  const packageBytes = candidateBlob(repoRoot, candidate, 'package.json');
  let packageScripts = {};
  if (packageBytes !== null) {
    try {
      packageScripts = JSON.parse(packageBytes.toString('utf8')).scripts ?? {};
    } catch {
      incomplete = true;
    }
  }

  const scanExecutable = (sourcePath, text, seen = new Set()) => {
    if (seen.has(sourcePath)) return;
    seen.add(sourcePath);
    if (
      /process\.argv|globalThis\s*\[|\beval\s*\(|\bFunction\s*\(|\bimport\s*\(\s*[^'"`]/.test(
        text,
      ) ||
      /\brequire\s*\(\s*[^'"`]/.test(text)
    ) {
      dynamic = true;
      addDependency(dependencies, {
        source_path: sourcePath,
        target: 'runtime-selected-dependency',
        kind: 'dynamic-unknown',
        reason: 'Executable dependency resolution depends on runtime data.',
      });
    }
    for (const match of text.matchAll(
      /(?:^|[;&|]\s*|\brun:\s*)(?:pnpm\s+(?:run\s+)?)([a-zA-Z0-9:_-]+)/gm,
    )) {
      const scriptId = match[1];
      const script = packageScripts[scriptId];
      addDependency(dependencies, {
        source_path: sourcePath,
        target: `package.json#scripts.${scriptId}`,
        kind: 'package-script',
        reason: `Candidate executable invokes package script ${scriptId}.`,
      });
      if (typeof script !== 'string') {
        dynamic = true;
        incomplete = true;
        continue;
      }
      scanExecutable(`package.json#scripts.${scriptId}`, script, seen);
    }
    for (const match of text.matchAll(
      /\bnode\s+((?:\.?\.?\/)?[a-zA-Z0-9_./-]+\.(?:mjs|cjs|js))\b/g,
    )) {
      const executable = posix.normalize(match[1].replace(/^\.\//, ''));
      addDependency(dependencies, {
        source_path: sourcePath,
        target: executable,
        kind: 'package-script',
        reason: 'Candidate package-script closure reaches this executable.',
      });
      const bytes = candidateBlob(repoRoot, candidate, executable);
      if (bytes === null) {
        dynamic = true;
        incomplete = true;
      } else {
        scanExecutable(executable, bytes.toString('utf8'), seen);
      }
    }
  };

  const executableChanged = [...changedPopulation].filter(
    (path) =>
      path === 'package.json' ||
      path.startsWith('.github/workflows/') ||
      path.startsWith('scripts/'),
  );
  for (const path of executableChanged) {
    const bytes = candidateBlob(repoRoot, candidate, path);
    if (bytes !== null) scanExecutable(path, bytes.toString('utf8'));
  }

  for (const workflow of paths.filter((path) => path.startsWith('.github/workflows/'))) {
    if (!changedPopulation.has(workflow)) continue;
    const bytes = candidateBlob(repoRoot, candidate, workflow);
    if (bytes === null) continue;
    const text = bytes.toString('utf8');
    for (const match of text.matchAll(/\buses:\s*['"]?(\.\/[^\s'"]+)/g)) {
      const target = posix.normalize(match[1].replace(/^\.\//, ''));
      addDependency(dependencies, {
        source_path: workflow,
        target,
        kind: 'workflow-call',
        reason: 'Candidate workflow reaches this literal local workflow or action.',
      });
      if (!paths.includes(target) && !paths.some((path) => path.startsWith(`${target}/`))) {
        dynamic = true;
        incomplete = true;
      }
    }
  }

  return {
    dependencies: [...dependencies.values()].sort((left, right) =>
      `${left.source_path}\0${left.target}\0${left.kind}`.localeCompare(
        `${right.source_path}\0${right.target}\0${right.kind}`,
      ),
    ),
    impactedNodeIds,
    dynamic,
    incomplete,
  };
}

function concreteGlobalCommands(
  classifierPolicy,
  base,
  candidate,
  changed,
  graph,
  impactedNodeIds,
) {
  const affectedPaths = [];
  const tierCommands = [];
  const nodeById = new Map((graph.nodes ?? []).map((node) => [node.id, node]));
  for (const id of impactedNodeIds) {
    const node = nodeById.get(id);
    if (!node?.command) continue;
    if (node.kind === 'test-shard') {
      const runIndex = node.command.indexOf('run');
      affectedPaths.push(...node.command.slice(runIndex + 1));
    } else if (node.kind === 'gate') {
      tierCommands.push(node.command);
    }
  }
  const uniqueAffected = [...new Set(affectedPaths)].sort();
  const formattable = changed
    .filter((path) => /(^|\/)[^.][^/]*\.(json|jsonl|md|mjs|ts|yml|yaml)$/.test(path))
    .sort();

  return (classifierPolicy.global_commands ?? []).map((command) => {
    let argv = command.argv.flatMap((argument) => {
      if (argument === '<exact-base>') return [base];
      if (argument === '<exact-candidate>') return [candidate];
      if (argument === '<changed-format-supported-paths...>')
        return formattable.length ? formattable : ['.'];
      if (argument === '<ordered-affected-test-paths...>')
        return uniqueAffected.length ? uniqueAffected : ['tests'];
      if (argument === '<exact-argv-from-candidate-command-closure>') {
        return tierCommands[0] ?? ['pnpm', 'vitest', 'run'];
      }
      return [argument];
    });
    if (argv[0] === '<exact-argv-from-candidate-command-closure>') argv = ['pnpm', 'vitest', 'run'];
    return { ...command, argv, exit_code: null };
  });
}

function toolchainIdentity(repoRoot, candidate, closePolicy) {
  let packageRecord = {};
  const packageBytes = candidateBlob(repoRoot, candidate, 'package.json');
  if (packageBytes !== null) {
    try {
      packageRecord = JSON.parse(packageBytes.toString('utf8'));
    } catch {
      packageRecord = {};
    }
  }
  const dependencyVersions = {
    vitest: packageRecord.devDependencies?.vitest ?? packageRecord.dependencies?.vitest,
    typescript: packageRecord.devDependencies?.typescript ?? packageRecord.dependencies?.typescript,
    prettier: packageRecord.devDependencies?.prettier ?? packageRecord.dependencies?.prettier,
    eslint: packageRecord.devDependencies?.eslint ?? packageRecord.dependencies?.eslint,
  };
  return (closePolicy.freshness?.toolchain ?? []).map((probe) => {
    let observed;
    if (probe.id === 'node') observed = process.version;
    else if (probe.id === 'pnpm') observed = packageRecord.packageManager ?? 'candidate-unbound';
    else if (probe.id === 'git') {
      const result = git(repoRoot, ['--version'], { allowFailure: true });
      observed = String(result.stdout || result.stderr || '').trim() || 'unavailable';
    } else {
      observed = dependencyVersions[probe.id]
        ? `candidate-declared:${dependencyVersions[probe.id]}`
        : 'candidate-unbound';
    }
    return {
      id: probe.id,
      argv: probe.argv,
      observed,
    };
  });
}

function closureInputs(repoRoot, candidate, paths, closePolicy, rawInputs) {
  const descriptors = new Map();
  const add = (kind, path, reason) => {
    const key = `${kind}\0${path}`;
    if (!descriptors.has(key)) descriptors.set(key, { kind, path, reason });
  };
  add('command-closure-policy', POLICY_PATH, 'The plan binds the candidate command closure.');
  add(
    'commit-validation-policy',
    CLASSIFIER_POLICY_PATH,
    'The plan binds the candidate classifier policy.',
  );
  add('affected-test-graph', GRAPH_PATH, 'The plan binds the candidate affected-test graph.');
  for (const path of paths) {
    if (matches(path, 'law/schemas/**')) add('schema', path, 'Candidate schema closure input.');
    if (path.startsWith('.github/workflows/'))
      add('workflow', path, 'Candidate workflow closure input.');
  }
  for (const projection of closePolicy.projections ?? []) {
    for (const path of paths) {
      if (matchesAny(path, projection.sources) || matchesAny(path, projection.outputs)) {
        add('materialization', path, `Projection ${projection.id} closure input.`);
      }
    }
  }
  for (const path of rawInputs.governanceSources ?? []) {
    add('governance-control', path, 'Candidate governance-control closure input.');
  }
  add('package-script', 'package.json', 'Candidate package-script registry.');
  const blobs = candidateBlobBatch(
    repoRoot,
    candidate,
    [...descriptors.values()].map((record) => record.path),
  );
  return [...descriptors.values()]
    .filter((record) => blobs.get(record.path) !== null)
    .map((record) => ({ ...record, digest_sha256: sha256(blobs.get(record.path)) }))
    .sort((left, right) =>
      `${left.kind}\0${left.path}`.localeCompare(`${right.kind}\0${right.path}`),
    );
}

function commandPlan({
  validationClass,
  widened,
  classifierPolicy,
  closePolicy,
  globalCommands,
  changedPaths,
  impactedNodeIds,
}) {
  const globalById = new Map(globalCommands.map((command) => [command.id, command]));
  const closeCommands = (closePolicy.convergence?.commands ?? []).map((command) => ({
    id: command.id,
    argv: command.argv,
    cwd: '.',
    reason: 'The active close profile requires this complete cold command in declared order.',
    exit_code: null,
  }));
  const closeById = new Map(closeCommands.map((command) => [command.id, command]));
  const selectedIds = [];

  if (validationClass === 'candidate-and-close') {
    selectedIds.push(...closeCommands.map((command) => command.id));
  } else {
    const classPolicy = (classifierPolicy.classes ?? []).find(
      (entry) => entry.id === validationClass,
    );
    selectedIds.push(...(classPolicy?.mandatory_command_ids ?? []));
    const population = new Set(
      changedPaths.flatMap((change) => [
        change.path,
        ...(change.old_path ? [change.old_path] : []),
      ]),
    );
    const has = (selector) => [...population].some((path) => matches(path, selector));
    if (validationClass === 'governance-text') {
      if (has('law/adr/**')) selectedIds.push('policy-check-adrs');
      if (has('work/rounds/**')) selectedIds.push('round-artifact-uniqueness', 'sha-references');
      selectedIds.push('repository-references');
    }
    if (validationClass === 'law-and-schema') {
      if (has('law/policy/action-registry.json')) selectedIds.push('action-registry');
      if (has('law/invariants/**') || has('law/trace.json')) selectedIds.push('trace');
      selectedIds.push('repository-references', 'sha-references');
    }
    if (validationClass === 'runtime-and-tests') {
      if (has('.github/workflows/**')) selectedIds.push('workflow-contracts');
      if (impactedNodeIds.size > 0) selectedIds.push('affected-tests');
      if ([...population].some((path) => /^(packages|scripts|tests)\//.test(path))) {
        selectedIds.push('coverage');
      }
    }
    if (widened) selectedIds.push('ordinary', 'coverage');
  }

  const uniqueSelectedIds = [...new Set(selectedIds)];
  const selected = uniqueSelectedIds.map((id) => {
    const command = closeById.get(id) ?? globalById.get(id);
    if (!command) {
      fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', `selected unknown command ${id}`);
    }
    return command;
  });
  const universe = new Map();
  for (const command of [...globalCommands, ...closeCommands]) {
    if (!universe.has(command.id)) universe.set(command.id, command);
  }
  const selectedSet = new Set(uniqueSelectedIds);
  const omitted = [...universe.values()]
    .filter((command) => !selectedSet.has(command.id))
    .map((command) => ({
      ...command,
      reason: `Omitted because ${validationClass}${widened ? ' widened fallback' : ''} does not select ${command.id}.`,
      exit_code: null,
    }));
  return { selected, omitted };
}

function buildPlan(context, options = {}) {
  const {
    repoRoot,
    round,
    base,
    candidate,
    closePolicy,
    closePolicyRaw,
    classifierPolicy,
    classifierPolicyRaw,
    graph,
    graphRaw,
    paths,
    diff,
  } = context;
  const changedPaths = changedPathRecords(repoRoot, base, candidate, diff, classifierPolicy);
  const closure = dependencyClosure({
    repoRoot,
    candidate,
    changedRecords: changedPaths,
    paths,
    closePolicy,
    graph,
  });
  const dependencyClasses = closure.dependencies
    .map((dependency) => classifyPath(dependency.target, classifierPolicy))
    .filter((dependencyClass) => dependencyClass !== 'unknown');
  const derivedClasses = [...changedPaths.map((change) => change.path_class), ...dependencyClasses];
  let validationClass = options.forceClass ?? strictest(derivedClasses);
  let widened = Boolean(diff.nonExactSimilarity || closure.dynamic || closure.incomplete);
  if (changedPaths.some((change) => change.path_class === 'unknown')) {
    validationClass = 'candidate-and-close';
    widened = true;
  }
  const diagnostics = [];
  if (diff.nonExactSimilarity || closure.incomplete) {
    diagnostics.push({
      code: 'COMMIT_VALIDATION_CLOSURE_INCOMPLETE',
      severity: 'blocking',
      reason: 'A non-exact rename or unresolved dependency widened the command population.',
    });
  }
  if (closure.dynamic) {
    diagnostics.push({
      code: 'DYNAMIC_DEPENDENCY_AMBIGUOUS',
      severity: 'blocking',
      reason: 'Runtime-selected dependency indirection requires the complete safe fallback.',
    });
    diagnostics.push({
      code: 'COMMIT_VALIDATION_CLASS_UNDERBOUND',
      severity: 'blocking',
      reason: 'A narrower author-visible class would underbind the dynamic dependency closure.',
    });
  }
  const unknownPaths = changedPaths
    .filter((change) => change.path_class === 'unknown')
    .map((change) => change.path);
  if (unknownPaths.length > 0) {
    diagnostics.push({
      code: 'COMMIT_VALIDATION_PATH_UNKNOWN',
      severity: 'blocking',
      reason: 'An unclassified path widens to candidate-and-close.',
      paths: unknownPaths,
    });
  }

  if (options.forceClass === 'candidate-and-close') widened = true;
  const changedPopulation = changedPaths.flatMap((change) => [
    change.path,
    ...(change.old_path ? [change.old_path] : []),
  ]);
  const globalCommands = concreteGlobalCommands(
    classifierPolicy,
    base,
    candidate,
    changedPopulation,
    graph,
    closure.impactedNodeIds,
  );
  const commands = commandPlan({
    validationClass,
    widened,
    classifierPolicy,
    closePolicy,
    globalCommands,
    changedPaths,
    impactedNodeIds: closure.impactedNodeIds,
  });
  const plan = {
    schemaVersion: '1.0.0',
    classifier_version: CLASSIFIER_VERSION,
    round,
    base_sha: base,
    candidate_sha: candidate,
    validation_class: validationClass,
    narrowing_enabled: validationClass !== 'candidate-and-close' && !widened,
    widened,
    changed_paths: changedPaths,
    derived_dependencies: closure.dependencies,
    selected_commands: commands.selected,
    omitted_commands: commands.omitted,
    diagnostics,
    policy_identity: { path: POLICY_PATH, digest_sha256: sha256(closePolicyRaw) },
    classifier_policy_identity: {
      path: CLASSIFIER_POLICY_PATH,
      digest_sha256: sha256(classifierPolicyRaw),
    },
    graph_identity: { path: GRAPH_PATH, digest_sha256: sha256(graphRaw) },
    toolchain_identity: toolchainIdentity(repoRoot, candidate, closePolicy),
    diff_identity: {
      argv: diff.argv,
      record_format: 'status-aware-nul',
      digest_sha256: sha256(diff.raw),
    },
    closure_inputs: closureInputs(
      repoRoot,
      candidate,
      paths,
      closePolicy,
      classifierPolicy.exact_inputs ?? {},
    ),
    plan_digest_method: PLAN_DIGEST_METHOD,
    plan_digest_sha256: '',
  };
  if (options.disablement) plan.disablement = options.disablement;
  plan.plan_digest_sha256 = planDigest(plan);
  return plan;
}

function observationPath(repoRoot, path) {
  const absolute = isAbsolute(path) ? path : resolve(repoRoot, path);
  const repoRelative = relative(repoRoot, absolute).split('\\').join('/');
  return repoRelative && !repoRelative.startsWith('../') ? repoRelative : absolute;
}

function applySentinel(context, plan, path) {
  let bytes;
  let observation;
  try {
    bytes = readFileSync(isAbsolute(path) ? path : resolve(context.repoRoot, path));
    observation = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(
      'CLASSIFIER_FALSE_NEGATIVE',
      `sentinel observation is missing or malformed: ${error.message}`,
    );
  }
  if (
    observation?.schemaVersion !== '1.0.0' ||
    observation.exact_base !== context.base ||
    observation.exact_candidate !== context.candidate ||
    !Array.isArray(observation.predicted?.commands) ||
    !Array.isArray(observation.cold_observed?.commands)
  ) {
    fail(
      'CLASSIFIER_FALSE_NEGATIVE',
      'sentinel observation is stale, unbound, or structurally incomplete',
    );
  }
  const predictedIds = new Set(observation.predicted.commands.map((command) => command.id));
  const mismatches = observation.cold_observed.commands
    .filter(
      (command) =>
        typeof command?.id === 'string' &&
        Number.isInteger(command.exit_code) &&
        command.exit_code !== 0 &&
        !predictedIds.has(command.id),
    )
    .map((command) => ({
      command_id: command.id,
      predicted: 'OMITTED',
      observed_exit: command.exit_code,
    }));
  if (mismatches.length === 0) return plan;

  const fallback = buildPlan(context, {
    forceClass: 'candidate-and-close',
    disablement: { diagnostic: 'CLASSIFIER_FALSE_NEGATIVE', until: 'governed-repair' },
  });
  fallback.diagnostics.push({
    code: 'CLASSIFIER_FALSE_NEGATIVE',
    severity: 'blocking',
    reason: 'A complete same-candidate cold command failed after the classifier omitted it.',
  });
  fallback.plan_digest_sha256 = planDigest(fallback);
  const report = {
    schemaVersion: '1.0.0',
    ok: false,
    diagnostic: 'CLASSIFIER_FALSE_NEGATIVE',
    exact_base: context.base,
    exact_candidate: context.candidate,
    narrowing_enabled: false,
    mismatches,
    observation_identity: {
      path: observationPath(context.repoRoot, path),
      digest_sha256: sha256(bytes),
    },
    fallback_plan: fallback,
  };
  process.stdout.write(`${JSON.stringify(report)}\n`);
  process.stderr.write(
    `CLASSIFIER_FALSE_NEGATIVE: ${mismatches.length} omitted cold command(s) failed; narrowing disabled\n`,
  );
  process.exit(1);
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const base = validateCommit(args.repoRoot, args.base, 'base');
  const candidate = validateCommit(args.repoRoot, args.candidate, 'candidate');
  const ancestry = git(args.repoRoot, ['merge-base', '--is-ancestor', base, candidate], {
    allowFailure: true,
  });
  if (ancestry.status !== 0) {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', 'base is not an ancestor of candidate');
  }
  const close = candidateJson(args.repoRoot, candidate, POLICY_PATH);
  const classifier = candidateJson(args.repoRoot, candidate, CLASSIFIER_POLICY_PATH);
  const graph = candidateJson(args.repoRoot, candidate, GRAPH_PATH);
  if (args.round !== classifier.value.round || args.round !== graph.value.round) {
    fail('COMMIT_VALIDATION_CLOSURE_INCOMPLETE', 'round does not match candidate policy and graph');
  }
  const paths = trackedPaths(args.repoRoot, candidate);
  const diff = parseDiff(args.repoRoot, base, candidate);
  const context = {
    repoRoot: args.repoRoot,
    round: args.round,
    base,
    candidate,
    closePolicy: close.value,
    closePolicyRaw: close.raw,
    classifierPolicy: classifier.value,
    classifierPolicyRaw: classifier.raw,
    graph: graph.value,
    graphRaw: graph.raw,
    paths,
    diff,
  };
  const plan = buildPlan(context);
  const result = args.sentinelObservation
    ? applySentinel(context, plan, args.sentinelObservation)
    : plan;
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

try {
  main();
} catch (error) {
  fail(
    'COMMIT_VALIDATION_CLOSURE_INCOMPLETE',
    error instanceof Error ? error.message : String(error),
  );
}
