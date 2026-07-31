#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHA40 = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const WORKTREE_REVISION = 'WORKTREE';
const NORMALIZED_RUNTIME_ARTIFACTS = [
  'scratch/coverage/t1-t3/coverage-final.json',
  'scratch/coverage/t1-t3/subprocess-v8/**',
];
const AUDIT_CLAIM_IMPLEMENTATION_PATHS = [
  'scripts/run-round-close-controls.mjs',
  '.devai/config/round-close-controls.json',
];

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const command = process.argv[2] ?? '';
const repoRoot = resolve(option('--repo-root') ?? SCRIPT_ROOT);
const jsonMode = process.argv.includes('--json');
const policyPath = join(repoRoot, 'law/policy/round-close-controls.json');
const mirrorPath = join(repoRoot, '.devai/config/round-close-controls.json');
let candidateBoundRevision = null;
let candidateBoundPolicy = null;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function canonical(value) {
  return `${JSON.stringify(stable(value))}\n`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(program, args, options = {}) {
  return spawnSync(program, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    input: options.input,
    env: { ...process.env, ...options.env },
    maxBuffer: 64 * 1024 * 1024,
  });
}

function gitResult(root, args, options = {}) {
  return run('git', args, { ...options, cwd: root });
}

function git(root, args, options = {}) {
  const result = gitResult(root, args, options);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function gitBytes(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: null,
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${String(result.stderr ?? result.stdout)}`);
  }
  return result.stdout;
}

function finding(code, message, extra = {}) {
  return { code, message, ...extra };
}

function emit(result) {
  if (jsonMode) process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (result.ok) process.stdout.write(`round close controls: PASS (${result.command})\n`);
  else
    process.stderr.write(
      `round close controls: FAIL (${result.command})\n${result.findings
        .map(({ code, message }) => `${code}: ${message}`)
        .join('\n')}\n`,
    );
  process.exitCode = result.ok ? 0 : 1;
}

function loadPolicy(findings) {
  if (candidateBoundPolicy !== null) return candidateBoundPolicy;
  if (!existsSync(policyPath)) {
    findings.push(finding('POLICY_MISSING', `missing ${relative(repoRoot, policyPath)}`));
    return null;
  }
  try {
    return readJson(policyPath);
  } catch (error) {
    findings.push(finding('POLICY_MALFORMED', String(error)));
    return null;
  }
}

/**
 * Control behaviour is selected by a named generic capability declared in policy,
 * never by comparing a profile decision id against a literal. A capability that is
 * not declared is off, so an older policy keeps its older behaviour without any
 * control source naming a decision.
 */
function capability(context, name) {
  const declared = context?.policy?.control_capabilities ?? context?.control_capabilities ?? null;
  if (declared === null || typeof declared !== 'object') return false;
  return declared[name] === true;
}

function globExpression(glob) {
  let expression = '';
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    const next = glob[index + 1];
    if (character === '*' && next === '*') {
      if (glob[index + 2] === '/') {
        expression += '(?:.*/)?';
        index += 2;
      } else {
        expression += '.*';
        index += 1;
      }
    } else if (character === '*') expression += '[^/]*';
    else if ('\\.^$+?()[]{}|'.includes(character)) expression += `\\${character}`;
    else expression += character;
  }
  return new RegExp(`^${expression}$`, 'u');
}

function matches(path, glob) {
  return globExpression(glob).test(path);
}

function trackedPaths(root, revision = 'HEAD') {
  if (revision === WORKTREE_REVISION) {
    return git(root, ['ls-files']).split('\n').filter(Boolean).sort();
  }
  return git(root, ['ls-tree', '-r', '--name-only', revision]).split('\n').filter(Boolean).sort();
}

function candidateFile(root, revision, path) {
  if (revision === WORKTREE_REVISION) return readFileSync(join(root, path), 'utf8');
  return gitBytes(root, ['show', `${revision}:${path}`]).toString('utf8');
}

function pathsForGlobs(root, revision, globs) {
  return trackedPaths(root, revision).filter((path) => globs.some((glob) => matches(path, glob)));
}

function digestPaths(root, revision, globs) {
  const entries = pathsForGlobs(root, revision, globs).map((path) => ({
    path,
    digest: sha256(candidateFile(root, revision, path)),
  }));
  return sha256(canonical(entries));
}

function cleanStatus(root) {
  return git(root, ['status', '--porcelain', '--untracked-files=all']);
}

function workspaceSnapshot(root, normalizedRuntimeArtifacts) {
  const entries = [];
  const excluded = new Set(['.git', 'node_modules']);
  function visit(directory, prefix = '') {
    for (const name of readdirSync(directory).sort()) {
      const path = prefix.length === 0 ? name : `${prefix}/${name}`;
      if (excluded.has(name) || path === '.devai/state' || path.startsWith('.devai/state/'))
        continue;
      if (normalizedRuntimeArtifacts.some((glob) => matches(path, glob))) continue;
      const absolute = join(directory, name);
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, path);
      else if (stat.isSymbolicLink())
        entries.push({ path, kind: 'symlink', value: readlinkSync(absolute) });
      else if (stat.isFile())
        entries.push({ path, kind: 'file', digest: sha256(readFileSync(absolute)) });
    }
  }
  visit(root);
  return sha256(canonical(entries));
}

function coverageDigest(root) {
  const path = join(root, 'scratch/coverage/t1-t3/coverage-summary.json');
  return existsSync(path) ? sha256(readFileSync(path)) : null;
}

function stateDirectory(root, round) {
  return join(root, '.devai/state/round-runs', round, 'close');
}

function writeState(root, round, name, value) {
  const directory = stateDirectory(root, round);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

function readState(root, round, name) {
  const path = join(stateDirectory(root, round), name);
  if (!existsSync(path)) return { status: 'missing', value: null };
  try {
    return { status: 'valid', value: readJson(path) };
  } catch (error) {
    return { status: 'malformed', value: null, error: String(error) };
  }
}

function configuredStatePath(template, round) {
  return String(template ?? '').replaceAll('{round}', round);
}

function nulPaths(result) {
  return String(result.stdout ?? '')
    .split('\0')
    .filter(Boolean);
}

function worktreeInputEntries(root, globs) {
  const paths = new Set([
    ...nulPaths(gitResult(root, ['ls-files', '-z'])),
    ...nulPaths(gitResult(root, ['ls-files', '--others', '--exclude-standard', '-z'])),
  ]);
  const entries = [];
  for (const path of [...paths].sort()) {
    if (!(globs ?? []).some((glob) => matches(path, glob))) continue;
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      entries.push({ path, kind: 'deleted', digest: sha256('DELETED\n') });
      continue;
    }
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink())
      entries.push({ path, kind: 'symlink', digest: sha256(readlinkSync(absolute)) });
    else if (stat.isFile())
      entries.push({ path, kind: 'file', digest: sha256(readFileSync(absolute)) });
  }
  return entries;
}

function filesystemPaths(root, includeState = false) {
  const paths = [];
  function visit(directory, prefix = '') {
    for (const name of readdirSync(directory).sort()) {
      const path = prefix.length === 0 ? name : `${prefix}/${name}`;
      if (name === '.git' || name === 'node_modules') continue;
      if (!includeState && (path === '.devai/state' || path.startsWith('.devai/state/'))) continue;
      const absolute = join(directory, name);
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, path);
      else if (stat.isFile() || stat.isSymbolicLink()) paths.push(path);
    }
  }
  visit(root);
  return paths;
}

function outputEntries(root, specs) {
  const paths = filesystemPaths(root);
  const outputs = [];
  const missing = [];
  for (const spec of specs ?? []) {
    const matchesForSpec = paths.filter((path) => matches(path, spec));
    if (matchesForSpec.length === 0) missing.push(spec);
    for (const path of matchesForSpec) {
      if (outputs.some((entry) => entry.path === path)) continue;
      const absolute = join(root, path);
      const stat = lstatSync(absolute);
      outputs.push({
        path,
        digest: sha256(stat.isSymbolicLink() ? readlinkSync(absolute) : readFileSync(absolute)),
      });
    }
  }
  return { outputs: outputs.sort((left, right) => left.path.localeCompare(right.path)), missing };
}

function toolchainFingerprint(policy, findings) {
  const readings = [];
  for (const tool of policy?.freshness?.toolchain ?? []) {
    const [program, ...args] = tool.argv ?? [];
    const result = run(program, args, { cwd: repoRoot });
    readings.push({
      id: tool.id,
      argv: tool.argv,
      exit_code: result.status ?? 1,
      stdout_sha256: sha256(result.stdout ?? ''),
      stderr_sha256: sha256(result.stderr ?? ''),
    });
    if (result.status !== 0)
      findings.push(
        finding('FRESHNESS_TOOLCHAIN_BLOCKED', `toolchain probe ${tool.id} failed`, {
          tool: tool.id,
          exit_code: result.status ?? 1,
        }),
      );
  }
  return sha256(canonical(readings));
}

function environmentFingerprint(policy) {
  const readings = (policy?.freshness?.environment_allowlist ?? []).map((entry) => {
    const value = process.env[entry.name];
    return {
      name: entry.name,
      mode: entry.mode,
      value:
        entry.mode === 'presence'
          ? value === undefined
            ? 'absent'
            : 'present'
          : sha256(value ?? 'UNSET'),
    };
  });
  return sha256(canonical(readings));
}

const toolchainProbeResultCache = new Map();

function toolchainManifestV5(policy, probeIds, findings) {
  const probes = new Map((policy?.freshness?.toolchain ?? []).map((probe) => [probe.id, probe]));
  const manifest = [];
  for (const id of [...new Set(probeIds ?? [])].sort()) {
    const probe = probes.get(id);
    if (probe === undefined || !Array.isArray(probe.argv) || probe.argv.length === 0) {
      findings.push(
        finding('GATE_TOOLCHAIN_PROBE_MISSING', 'gate-specific toolchain probe is not declared', {
          probe_id: id,
        }),
      );
      continue;
    }
    const probeKey = canonical({ cwd: repoRoot, argv: probe.argv });
    let result = toolchainProbeResultCache.get(probeKey);
    if (result === undefined) {
      const [program, ...args] = probe.argv;
      result = run(program, args, { cwd: repoRoot });
      toolchainProbeResultCache.set(probeKey, result);
    }
    const entry = {
      id,
      argv: probe.argv,
      output_digest: sha256(
        canonical({
          exit_code: result.status ?? 1,
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
        }),
      ),
    };
    manifest.push(entry);
    if (result.status !== 0)
      findings.push(
        finding(
          'GATE_TOOLCHAIN_PROBE_CHANGED',
          'gate toolchain probe did not resolve successfully',
          { probe_id: id, exit_code: result.status ?? 1 },
        ),
      );
  }
  return manifest;
}

function completeEnvironmentManifestV6() {
  const entries = Object.keys(process.env)
    .sort()
    .map((name) => ({ name, digest: sha256(process.env[name] ?? '') }));
  return {
    name: '__ALL_ENVIRONMENT__',
    mode: 'complete-environment-sha256',
    digest: sha256(canonical(entries)),
  };
}

function environmentManifestV5(policy, inputIds, findings) {
  const declared = new Map(
    (policy?.freshness?.environment_allowlist ?? []).map((entry) => [entry.name, entry]),
  );
  return [...new Set(inputIds ?? [])].sort().map((name) => {
    if (name === '__ALL_ENVIRONMENT__') return completeEnvironmentManifestV6();
    const specification = declared.get(name);
    if (specification === undefined)
      findings.push(
        finding('GATE_FRESHNESS_PROFILE_INCOMPLETE', 'gate environment input is not allowlisted', {
          name,
        }),
      );
    const value = process.env[name];
    const canonicalValue =
      specification?.mode === 'presence'
        ? value === undefined
          ? 'absent'
          : 'present'
        : (value ?? 'UNSET');
    return {
      name,
      mode: specification?.mode ?? 'value-sha256',
      digest: sha256(canonicalValue),
    };
  });
}

/**
 * Programs are parsed generically from the command string. A name allowlist is not
 * derivation: any token in leading position of a command segment, or following a
 * package-runner verb, is a program regardless of whether this file has heard of it.
 */
function executableProgramsV7(command, programs) {
  for (const segment of command.split(/&&|\|\||\||;/gu)) {
    const parts = segment
      .trim()
      .split(/\s+/u)
      .filter((part) => part.length > 0);
    let index = 0;
    // Skip environment assignments such as CI=1 before the program token.
    while (index < parts.length && /^[A-Za-z_][A-Za-z0-9_]*=/u.test(parts[index])) index += 1;
    const head = parts[index];
    if (head === undefined) continue;
    const named = head.replace(/^.*\//u, '');
    if (/^[A-Za-z@][\w.@/-]*$/u.test(named)) programs.add(named);
    // A package runner delegates to a further program: pnpm exec <program>, npx <program>.
    if (/^(?:pnpm|npm|npx|yarn)$/u.test(named)) {
      let next = index + 1;
      while (next < parts.length && /^(?:exec|run|--silent|-s|--)$/u.test(parts[next])) next += 1;
      const delegated = parts[next]?.replace(/^.*\//u, '');
      if (delegated !== undefined && /^[A-Za-z@][\w.@/-]*$/u.test(delegated))
        programs.add(delegated);
    }
  }
}

function deriveGateCommandClosureV7(context, gate) {
  const scripts = new Set();
  const programs = new Set();
  const executables = new Set();
  const projectReferences = new Set();
  const revision = SHA40.test(context.candidate ?? '') ? context.candidate : WORKTREE_REVISION;
  const readCandidateJson = (path) => JSON.parse(candidateFile(repoRoot, revision, path));
  const rootPackage = readCandidateJson('package.json');
  const rootScripts = rootPackage.scripts ?? {};
  const workspacePackages = new Map();
  for (const path of trackedPaths(repoRoot, revision).filter((entry) =>
    /^packages\/[^/]+\/package\.json$/u.test(entry),
  )) {
    const packageValue = readCandidateJson(path);
    if (typeof packageValue.name === 'string')
      workspacePackages.set(packageValue.name, {
        root: dirname(path),
        scripts: packageValue.scripts ?? {},
      });
  }
  const visited = new Set();
  const scannedExecutables = new Set();
  /**
   * Executable closure to a fixpoint. An executable that cannot be read from the
   * candidate object is recorded as a blocking member rather than dropped, and module
   * edges are followed so second-order executables are visible.
   */
  /**
   * `required` distinguishes a genuine executable reference, such as `node <path>` or a
   * spawn literal, from a module edge discovered inside a scanned source. Only the
   * former blocks when unreadable: an import edge may be type-only, or may be a literal
   * inside generated-code text, and treating those as missing executables would
   * manufacture false blocking findings.
   */
  const scanProgramSource = (relativePath, required = true) => {
    const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//u, '');
    if (scannedExecutables.has(normalized)) return;
    scannedExecutables.add(normalized);
    let source;
    try {
      source = candidateFile(repoRoot, revision, normalized);
    } catch {
      // Silently dropping an unreadable executable is what hid generated binaries from
      // every gate closure. Record it so the digest changes and the gate can block.
      if (required) executables.add(`missing:${normalized}`);
      return;
    }
    executables.add(normalized);
    for (const match of source.matchAll(
      /(?:spawnSync|execFileSync|spawn|execFile)\s*\(\s*['"]([^'"]+)['"]/gu,
    ))
      programs.add(match[1]);
    // Follow import, require and dynamic-import edges to their repository sources.
    const base = dirname(normalized);
    for (const match of source.matchAll(
      /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"](\.[^'"]+)['"]/gu,
    )) {
      const target = join(base, match[1]).replaceAll('\\', '/');
      const variants = [
        target,
        `${target}.js`,
        `${target}.mjs`,
        `${target}.cjs`,
        `${target}.ts`,
        `${target}/index.js`,
        `${target}/index.ts`,
      ];
      const resolved = variants.find((entry) => {
        try {
          candidateFile(repoRoot, revision, entry);
          return true;
        } catch {
          return false;
        }
      });
      if (resolved !== undefined) scanProgramSource(resolved, false);
    }
  };
  /**
   * TypeScript project closure to a fixpoint: every reachable project is visited once,
   * following `references` transitively and `extends` chains, and binding each
   * project's declared outputs and roots. A depth-one scan left base configs and
   * second-order references outside every gate closure.
   */
  const visitProject = (projectPath) => {
    const normalized = projectPath.replaceAll('\\', '/').replace(/^\.\//u, '');
    if (visited.has(`project:${normalized}`)) return;
    visited.add(`project:${normalized}`);
    let project;
    try {
      project = readCandidateJson(normalized);
    } catch {
      projectReferences.add(`missing:${normalized}`);
      return;
    }
    projectReferences.add(normalized);
    const projectRoot = dirname(normalized);
    const extended = project.extends;
    for (const entry of Array.isArray(extended) ? extended : extended ? [extended] : []) {
      const target = join(projectRoot, String(entry)).replaceAll('\\', '/');
      const withSuffix = /\.json$/u.test(target) ? target : `${target}.json`;
      projectReferences.add(`${normalized}-extends->${withSuffix}`);
      visitProject(withSuffix);
    }
    const options = project.compilerOptions ?? {};
    for (const [key, value] of Object.entries(options))
      if (/^(?:outDir|rootDir|outFile|tsBuildInfoFile|declarationDir)$/u.test(key))
        projectReferences.add(
          `${normalized}-${key}->${join(projectRoot, String(value)).replaceAll('\\', '/')}`,
        );
    for (const key of ['include', 'files', 'exclude'])
      for (const entry of project[key] ?? [])
        projectReferences.add(
          `${normalized}-${key}->${join(projectRoot, String(entry)).replaceAll('\\', '/')}`,
        );
    const references = (project.references ?? []).map(({ path }) => String(path));
    if (new Set(references).size !== references.length)
      projectReferences.add(`duplicate:${normalized}`);
    for (const reference of references) {
      const target = join(projectRoot, reference).replaceAll('\\', '/');
      const withConfig = /\.json$/u.test(target) ? target : `${target}/tsconfig.json`;
      projectReferences.add(`${normalized}->${target}`);
      visitProject(withConfig);
    }
  };
  const scanProject = (packageRoot, command) => {
    if (!/\btsc\b/u.test(command)) return;
    const configured = /(?:^|\s)(?:-p|--project)\s+([^\s;&|]+)/u.exec(command)?.[1];
    const projectPath = configured
      ? join(packageRoot, configured).replaceAll('\\', '/')
      : `${packageRoot === '.' ? '' : `${packageRoot}/`}tsconfig.json`;
    visitProject(projectPath);
  };
  const visitScript = (packageName, packageRoot, packageScripts, name) => {
    const key = `${packageName}:${name}`;
    if (visited.has(key) || typeof packageScripts[name] !== 'string') return;
    visited.add(key);
    scripts.add(packageName === 'root' ? name : key);
    const scriptCommand = packageScripts[name];
    scanProject(packageRoot, scriptCommand);
    const commandParts = scriptCommand.split(/&&|\|\||;/gu).map((part) => part.trim());
    for (const part of commandParts) {
      executableProgramsV7(part, programs);
      for (const match of part.matchAll(/\bpnpm(?:\s+run)?\s+([a-zA-Z0-9:._-]+)/gu))
        if (Object.hasOwn(packageScripts, match[1]))
          visitScript(packageName, packageRoot, packageScripts, match[1]);
      for (const match of part.matchAll(
        /\bpnpm\s+--filter\s+([^\s]+)\s+(?:run\s+)?([a-zA-Z0-9:._-]+)/gu,
      )) {
        const selected = workspacePackages.get(match[1]);
        if (selected !== undefined)
          visitScript(match[1], selected.root, selected.scripts, match[2]);
        else scripts.add(`${match[1]}:${match[2]}`);
        programs.add('pnpm');
      }
      for (const match of part.matchAll(/\bnode\s+([^\s;&|]+)/gu)) {
        const executable = join(packageRoot, match[1]).replaceAll('\\', '/');
        scanProgramSource(executable);
      }
    }
  };
  const [program, ...args] = gate.argv ?? [];
  if (program !== undefined) programs.add(program);
  const rootScript =
    program === 'pnpm' && args[0] === 'run'
      ? args[1]
      : program === 'pnpm' && Object.hasOwn(rootScripts, args[0])
        ? args[0]
        : null;
  if (rootScript !== null && rootScript !== undefined)
    visitScript('root', '.', rootScripts, rootScript);
  else {
    scripts.add(`direct:${gate.id}`);
    if (program === 'pnpm' && args[0] === 'exec' && args[1] !== undefined) programs.add(args[1]);
    if (program === 'pnpm' && args[0] === 'vitest') programs.add('vitest');
    if (program === 'node' && args[0] !== undefined) scanProgramSource(args[0]);
  }
  const semantics = {
    scripts: [...scripts].sort(),
    programs: [...programs].sort(),
    executables: [...executables].sort(),
    project_references: [...projectReferences].sort(),
  };
  return {
    gate_id: gate.id,
    derivation: 'recursive-policy-command-v1',
    scripts: semantics.scripts,
    programs: semantics.programs,
    executables: semantics.executables,
    project_references: semantics.project_references,
    closure_digest: sha256(canonical(semantics)),
  };
}

function validateGateCommandClosureV6(context, findings) {
  const commands = context.policy?.convergence?.commands ?? [];
  const closures = context.graph?.command_closure ?? [];
  const expected = commands.map(({ id }) => id);
  const actual = closures.map(({ gate_id: id }) => id);
  if (
    canonical(actual) !== canonical(expected) ||
    closures.some(
      ({ scripts, programs }) =>
        !Array.isArray(scripts) ||
        scripts.length === 0 ||
        !Array.isArray(programs) ||
        programs.length === 0,
    )
  )
    findings.push(
      finding(
        'GATE_COMMAND_CLOSURE_INCOMPLETE',
        'every authoritative gate requires one ordered nonempty script and program closure',
      ),
    );
  const derivedClosureRequired =
    context.graph?.freshness_identity?.candidate === 'literal-commit-and-tree' ||
    closures.some((entry) => Object.hasOwn(entry, 'derivation'));
  for (const gate of derivedClosureRequired ? commands : []) {
    const declared = closures.find(({ gate_id }) => gate_id === gate.id);
    const derived = deriveGateCommandClosureV7(context, gate);
    if (
      declared?.derivation !== derived.derivation ||
      canonical([...(declared?.scripts ?? [])].sort()) !== canonical(derived.scripts) ||
      canonical([...(declared?.programs ?? [])].sort()) !== canonical(derived.programs) ||
      (capability(context, 'gate_closure_digest_enforced') &&
        declared?.closure_digest !== derived.closure_digest)
    )
      findings.push(
        finding(
          'GATE_COMMAND_CLOSURE_DERIVATION_INVALID',
          'declared gate closure differs from recursively derived command semantics',
          { gate_id: gate.id, declared, derived },
        ),
      );
  }
  const profileIds = (context.graph?.gate_freshness_profiles ?? []).map(({ gate_id }) => gate_id);
  if (canonical(profileIds) !== canonical(expected))
    findings.push(
      finding(
        'GATE_FRESHNESS_PROFILE_INCOMPLETE',
        'freshness profile population differs from authoritative commands',
      ),
    );
}

function observedPersistentOutputsV6(root, declaredSelectors) {
  const declared = v3OutputState(declaredSelectors ?? []);
  const statusPaths = nulPaths(
    gitResult(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
  )
    .map((entry) => entry.slice(3))
    .filter(Boolean);
  const observed = statusPaths
    .filter(
      (path) =>
        existsSync(join(root, path)) &&
        !path.startsWith('.devai/state/') &&
        path !== '.devai/state',
    )
    .map((path) => ({
      path,
      present: true,
      digest: sha256(readFileSync(join(root, path))),
    }));
  return {
    missing: declared.missing,
    outputs: [
      ...new Map([...declared.outputs, ...observed].map((entry) => [entry.path, entry])).values(),
    ].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

const rawCandidateManifestCache = new Map();
const candidateBlobDigestCache = new Map();

function rawCandidateInputManifest(revision, selectors) {
  const expandedSelectors = [...new Set((selectors ?? []).flatMap(expandBraceSelectors))].sort();
  const manifestKey = canonical({ repoRoot, revision, selectors: expandedSelectors });
  const cached = rawCandidateManifestCache.get(manifestKey);
  if (cached !== undefined) return cached;
  const tree = candidateTreeIdentityEntriesV7(revision);
  const paths = pathsForGlobs(repoRoot, revision, expandedSelectors);
  const manifest = paths.map((path) => {
    const identity = tree.get(path);
    const objectId = identity?.object_id;
    let digest = candidateBlobDigestCache.get(objectId);
    if (digest === undefined) {
      digest = sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId]));
      candidateBlobDigestCache.set(objectId, digest);
    }
    return {
      source: path,
      present: true,
      digest,
      mode: identity?.mode,
      object_type: identity?.object_type,
      object_id: identity?.object_id,
    };
  });
  rawCandidateManifestCache.set(manifestKey, manifest);
  return manifest;
}

function gateFreshnessProfileV5(context, gate, findings) {
  const profiles = context.graph?.gate_freshness_profiles ?? [];
  const matchesForGate = profiles.filter(({ gate_id }) => gate_id === gate.id);
  const named = matchesForGate.filter(({ gate_id }) => gate_id === gate.freshness_profile);
  if (matchesForGate.length !== 1 || named.length !== 1) {
    findings.push(
      finding(
        'GATE_FRESHNESS_PROFILE_INCOMPLETE',
        'gate must resolve exactly one matching freshness profile',
        { gate_id: gate.id, count: matchesForGate.length },
      ),
    );
    return null;
  }
  const profile = named[0];
  if (
    !Array.isArray(profile.input_selectors) ||
    profile.input_selectors.length === 0 ||
    !Array.isArray(profile.dependency_selectors) ||
    profile.dependency_selectors.length === 0 ||
    !Array.isArray(profile.toolchain_probe_ids) ||
    profile.toolchain_probe_ids.length === 0 ||
    !Array.isArray(profile.environment_input_ids) ||
    profile.environment_input_ids.length === 0 ||
    !['none', 'digest-required'].includes(profile.output_contract) ||
    (profile.output_contract === 'digest-required' &&
      (!Array.isArray(profile.required_outputs) || profile.required_outputs.length === 0)) ||
    (profile.output_contract === 'none' && (profile.required_outputs ?? []).length !== 0) ||
    profile.universal_input_proof !== 'tracked-candidate-tree' ||
    profile.output_observation !== 'declared-plus-observed' ||
    !profile.input_selectors.includes('**/*') ||
    !profile.dependency_selectors.includes('**/*') ||
    !profile.environment_input_ids.includes('__ALL_ENVIRONMENT__') ||
    canonical([...profile.toolchain_probe_ids].sort()) !==
      canonical((context.policy.freshness?.toolchain ?? []).map(({ id }) => id).sort())
  ) {
    findings.push(
      finding(
        'GATE_FRESHNESS_PROFILE_INCOMPLETE',
        'gate freshness profile omits an effective key component',
        { gate_id: gate.id },
      ),
    );
    return null;
  }
  return profile;
}

function freshnessCachePath(policy, round, taskId) {
  const root = configuredStatePath(policy?.freshness?.state_root, round);
  const safe = taskId.replaceAll(/[^a-zA-Z0-9._-]/gu, '_');
  return join(repoRoot, root, 'tasks', `${safe}.json`);
}

function freshnessRecordDigest(record) {
  const { result_digest: _ignored, ...body } = record;
  return sha256(canonical(body));
}

function readFreshnessCache(path, schemaPath) {
  if (!existsSync(path)) return null;
  try {
    const value = readJson(path);
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(readJson(schemaPath));
    if (!validate(value) || value.result_digest !== freshnessRecordDigest(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function writeFreshnessCache(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canonical(value));
}

function taskInputGlobs(policy, task) {
  const sets = policy?.freshness?.input_sets ?? {};
  return [
    ...new Set(
      (task.input_sets ?? []).flatMap((set) => (Array.isArray(sets[set]) ? sets[set] : [])),
    ),
  ].sort();
}

function remoteEnvironment(policy) {
  return (policy?.freshness?.remote_environment_indicators ?? []).some((name) => {
    const value = String(process.env[name] ?? '').toLowerCase();
    return value !== '' && value !== '0' && value !== 'false';
  });
}

function blockedResults(policy) {
  return (policy?.convergence?.commands ?? []).map((gate) => ({
    id: gate.id,
    task_id: gate.id,
    argv: gate.argv,
    exit_code: null,
    outcome: 'BLOCKED',
    stdout_sha256: sha256(''),
    stderr_sha256: sha256(''),
  }));
}

function semanticCodeShape(source) {
  let output = '';
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      output += '\n';
      continue;
    }
    if (character === '/' && next === '*') {
      index += 2;
      while (index < source.length - 1 && !(source[index] === '*' && source[index + 1] === '/')) {
        if (source[index] === '\n') output += '\n';
        index += 1;
      }
      index += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      const quote = character;
      output += '__STRING__';
      for (index += 1; index < source.length; index += 1) {
        if (source[index] === '\\') index += 1;
        else if (source[index] === quote) break;
        else if (source[index] === '\n') output += '\n';
      }
      continue;
    }
    output += character;
  }
  return output;
}

function containsJsonKey(value, key) {
  if (Array.isArray(value)) return value.some((entry) => containsJsonKey(entry, key));
  if (value !== null && typeof value === 'object') {
    return (
      Object.hasOwn(value, key) || Object.values(value).some((entry) => containsJsonKey(entry, key))
    );
  }
  return false;
}

function semanticContentFindings(root, revision, paths) {
  const findings = [];
  for (const path of paths) {
    const source = candidateFile(root, revision, path);
    if (path.endsWith('.json')) {
      try {
        if (containsJsonKey(JSON.parse(source), 'fixed_count')) {
          findings.push(
            finding('SEMANTIC_FIXED_COUNT', 'fixed governed count in population', { path }),
          );
        }
      } catch {
        // Syntax validity is enforced by the owning schema or compiler gate.
      }
      continue;
    }
    const shape = semanticCodeShape(source);
    if (
      /\b(?:ACTION_(?:FLOOR|CEILING)|(?:FIXED|GOVERNED)_[A-Z0-9_]*COUNT)\s*=\s*\d+/u.test(shape)
    ) {
      findings.push(
        finding('SEMANTIC_FIXED_COUNT', 'fixed governed count in population', { path }),
      );
    }
    if (/\bexpect\(\s*([A-Za-z_$][\w$]*)\s*\)\.(?:toBe|toEqual)\(\s*\1\s*\)/u.test(shape)) {
      findings.push(
        finding('SEMANTIC_SELF_COMPARISON', 'literal self-comparison in population', { path }),
      );
    }
    if (/\breadFileSync\(\s*__STRING__\s*\)\s*\)?\s*\.toContain\(/u.test(shape)) {
      findings.push(
        finding('SEMANTIC_NAMED_FILE_ONLY', 'direct named-file-only assertion in population', {
          path,
        }),
      );
    }
  }
  return findings;
}

function priorReviewPaths(reviewPolicy, root, revision) {
  return [
    ...new Set([
      ...(reviewPolicy?.prior_reviews ?? []),
      ...pathsForGlobs(root, revision, reviewPolicy?.prior_review_globs ?? []),
    ]),
  ].sort();
}

function markedJson(source, markers) {
  const start = source.indexOf(markers?.start ?? '');
  const end = source.indexOf(markers?.end ?? '');
  if (start < 0 || end <= start) return null;
  try {
    const value = JSON.parse(source.slice(start + markers.start.length, end).trim());
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function expectedAuditCurrentClaims(policy, root, revision) {
  const trace = JSON.parse(candidateFile(root, revision, 'law/trace.json'));
  const sequencing = JSON.parse(
    candidateFile(root, revision, 'law/policy/governed-sequencing.json'),
  );
  const operational = JSON.parse(
    candidateFile(root, revision, 'law/policy/operational-values.json'),
  );
  const governedRound = option('--round') ?? policy?.round ?? '';
  const roundExceptions = (sequencing.historical_commit_exceptions ?? []).filter(
    (entry) => entry?.round === governedRound,
  );
  const directEntries = (operational.entries ?? []).filter((entry) => entry?.mode === 'direct');
  const failureRecords = priorReviewPaths(policy.review_scope, root, revision).filter(
    (path) =>
      path.includes('failure') ||
      /^verdict:\s*FAIL\s*$/mu.test(candidateFile(root, revision, path)),
  );
  return {
    trace_invariants: (trace.invariants ?? []).length,
    trace_test_sources: (trace.test_corpus ?? []).length,
    trace_assertion_sites: (trace.test_corpus ?? []).reduce(
      (total, entry) => total + Number(entry?.assertion_count ?? 0),
      0,
    ),
    r0006_sequencing_exception_entries: roundExceptions.length,
    r0006_sequencing_exception_commits: roundExceptions.reduce(
      (total, entry) => total + (entry.implementation_commits ?? []).length,
      0,
    ),
    operational_direct_rows: directEntries.length,
    operational_distinct_direct_value_homes: new Set(
      directEntries.map((entry) => entry.canonical_home),
    ).size,
    operational_total_value_homes: Object.keys(operational.values ?? {}).length,
    prior_b9_failure_records: failureRecords.length,
  };
}

function auditCurrentClaimFindings(policy, root, revision) {
  const findings = [];
  const currentPolicy = policy?.audit_current_claims;
  if (
    currentPolicy === null ||
    typeof currentPolicy !== 'object' ||
    !Array.isArray(currentPolicy.documents) ||
    currentPolicy.documents.length === 0 ||
    currentPolicy.volatile_current_numeric_prose_forbidden !== true
  ) {
    return [
      finding('AUDIT_CURRENT_CLAIM_POLICY_INVALID', 'governed current-claim policy is missing'),
    ];
  }
  let expected;
  try {
    expected = expectedAuditCurrentClaims(policy, root, revision);
  } catch (error) {
    return [
      finding('AUDIT_CURRENT_CLAIM_SOURCE_INVALID', `cannot derive current claims: ${error}`),
    ];
  }
  for (const document of currentPolicy.documents) {
    let source;
    try {
      source = candidateFile(root, revision, document.path);
    } catch (error) {
      findings.push(
        finding('AUDIT_CURRENT_CLAIM_DRIFT', `governed audit document is unavailable: ${error}`, {
          path: document.path,
          implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS,
        }),
      );
      continue;
    }
    const actual = markedJson(source, currentPolicy.markers);
    const selected = Object.fromEntries(
      (document.claims ?? []).map((claim) => [claim, expected[claim]]),
    );
    if (actual === null || canonical(actual) !== canonical(selected)) {
      findings.push(
        finding(
          'AUDIT_CURRENT_CLAIM_DRIFT',
          'governed Auditor current claims differ from their machine sources',
          {
            path: document.path,
            expected: selected,
            actual,
            implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS,
            details: {
              path: document.path,
              implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS,
            },
          },
        ),
      );
    }
    const start = source.indexOf(currentPolicy.markers.start);
    const end = source.indexOf(currentPolicy.markers.end);
    const prose =
      start >= 0 && end > start
        ? `${source.slice(0, start)}${source.slice(end + currentPolicy.markers.end.length)}`
        : source;
    for (const paragraph of prose.split(/\n\s*\n/u)) {
      if (
        /\b(?:current|currently|latest|now)\b/iu.test(paragraph) &&
        /\b\d[\d,.]*%?\b/u.test(paragraph) &&
        /\b(?:trace|sequenc|review|coverage|suite|range|population|assertion|test source)\w*/iu.test(
          paragraph,
        ) &&
        !/\b[0-9a-f]{40}\b/u.test(paragraph)
      ) {
        findings.push(
          finding(
            'AUDIT_CURRENT_PROSE_UNBOUND',
            'volatile current numeric audit prose must be machine-claimed or exact-subject-bound',
            { path: document.path, implementation_paths: AUDIT_CLAIM_IMPLEMENTATION_PATHS },
          ),
        );
      }
    }
  }
  return findings;
}

function policyFindings(policy, root = repoRoot, revision = 'HEAD', options = {}) {
  const findings = [];
  const assertions = policy?.semantic_assertions;
  if (assertions === null || typeof assertions !== 'object' || Array.isArray(assertions)) {
    findings.push(finding('SEMANTIC_ASSERTION_VACUOUS', 'semantic_assertions must be an object'));
    return findings;
  }
  const serialized = JSON.stringify(assertions);
  const populations = Array.isArray(assertions.population_sources)
    ? assertions.population_sources
    : [];
  if (
    serialized.includes('"fixed_count":') ||
    assertions.fixed_counts_forbidden !== true ||
    assertions.self_comparisons_forbidden !== true ||
    assertions.named_file_only_forbidden !== true ||
    populations.length === 0 ||
    populations.every((source) => typeof source === 'string' && !source.includes('*')) ||
    (Array.isArray(assertions.compare) &&
      assertions.compare.length === 2 &&
      assertions.compare[0] === assertions.compare[1])
  ) {
    findings.push(
      finding(
        'SEMANTIC_ASSERTION_VACUOUS',
        'fixed counts, self-comparisons, and named-file-only populations are forbidden',
      ),
    );
  }
  for (const source of populations) {
    if (
      typeof source === 'string' &&
      source.includes('*') &&
      pathsForGlobs(root, revision, [source]).length === 0
    ) {
      findings.push(
        finding('SEMANTIC_POPULATION_EMPTY', `semantic population ${source} is empty`, {
          path: source,
        }),
      );
    }
  }
  const populationPaths = [...new Set(pathsForGlobs(root, revision, populations))];
  findings.push(...semanticContentFindings(root, revision, populationPaths));
  if (options.skipMirrorPairs !== true) {
    for (const pair of assertions.mirror_pairs ?? []) {
      const source = typeof pair?.source === 'string' ? join(root, pair.source) : '';
      const mirror = typeof pair?.mirror === 'string' ? join(root, pair.mirror) : '';
      if (
        source.length === 0 ||
        mirror.length === 0 ||
        !existsSync(source) ||
        !existsSync(mirror) ||
        !readFileSync(source).equals(readFileSync(mirror))
      ) {
        findings.push(
          finding('POLICY_MIRROR_DRIFT', 'governed source and mirror must be byte-identical', {
            source: pair?.source,
            mirror: pair?.mirror,
          }),
        );
      }
    }
  }
  const identities = policy?.identities;
  if (
    !Array.isArray(identities?.fields) ||
    JSON.stringify(identities.fields) !==
      JSON.stringify(['implementation_subject', 'review_candidate', 'published_head']) ||
    identities.required_kind !== 'commit' ||
    identities.publishability !== 'candidate-only-no-alternates'
  ) {
    findings.push(
      finding('POLICY_IDENTITY_CONTRACT_INVALID', 'three exact identities are required'),
    );
  }
  if (
    policy?.governed_range?.mode === undefined ||
    policy.governed_range.fixed_windows_forbidden !== true
  ) {
    findings.push(finding('POLICY_RANGE_CONTRACT_INVALID', 'exact-base range policy is required'));
  }
  if (policy?.convergence?.passes !== 2 || policy?.convergence?.second_pass !== 'no-write-clean') {
    findings.push(
      finding('POLICY_CONVERGENCE_INVALID', 'two passes with a no-write second pass are required'),
    );
  }
  if (
    JSON.stringify(policy?.convergence?.normalized_runtime_artifacts) !==
    JSON.stringify(NORMALIZED_RUNTIME_ARTIFACTS)
  ) {
    findings.push(
      finding(
        'POLICY_CONVERGENCE_RUNTIME_ARTIFACTS_INVALID',
        'only the exact retained coverage runtime artifacts may be normalized',
      ),
    );
  }
  if (policy?.schemaVersion === '2.0.0') {
    if (
      typeof policy?.review?.record !== 'string' ||
      policy.review.record.length === 0 ||
      policy.review.record.startsWith('/')
    ) {
      findings.push(
        finding(
          'POLICY_FINAL_REVIEW_RECORD_INVALID',
          'one stable repository-relative final review record is required',
        ),
      );
    }
    if (
      typeof policy?.review_scope?.review_cycles?.mode !== 'string' ||
      policy.review_scope.review_cycles.minimum !== 1 ||
      policy.review_scope.review_cycles.failure !== 'repair-complete-class-and-rereview' ||
      policy.review_scope.review_cycles.forced_pass !== false
    ) {
      findings.push(
        finding(
          'REVIEW_CYCLE_POLICY_INVALID',
          'the declared legacy review-cycle policy is invalid',
        ),
      );
    }
    findings.push(...auditCurrentClaimFindings(policy, root, revision));
  }
  return findings;
}

function policyCheck() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy !== null) findings.push(...policyFindings(policy, repoRoot, 'WORKTREE'));
  emit({ ok: findings.length === 0, command: 'policy-check', findings });
}

function materialize() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy !== null)
    findings.push(...policyFindings(policy, repoRoot, 'WORKTREE', { skipMirrorPairs: true }));
  if (findings.length === 0) {
    mkdirSync(dirname(mirrorPath), { recursive: true });
    writeFileSync(mirrorPath, readFileSync(policyPath));
    findings.push(...policyFindings(policy, repoRoot, 'WORKTREE'));
  }
  emit({
    ok: findings.length === 0,
    command: 'materialize',
    output: relative(repoRoot, mirrorPath),
    findings,
  });
}

function declaredBase(root, policy, revision, findings) {
  const decisionPath = 'law/register/DECISIONS.md';
  let source = '';
  try {
    source = candidateFile(root, revision, decisionPath);
  } catch (error) {
    findings.push(finding('DECLARATION_MISSING', String(error), { path: decisionPath }));
    return '';
  }
  const decisionId = policy?.declaration?.decision_id;
  const sectionIndex = source.indexOf(`### ${decisionId} `);
  const section = sectionIndex === -1 ? '' : source.slice(sectionIndex);
  let expression;
  try {
    expression = new RegExp(policy.declaration.base_pattern, 'u');
  } catch (error) {
    findings.push(finding('DECLARATION_PATTERN_INVALID', String(error)));
    return '';
  }
  const base = expression.exec(section)?.[1] ?? '';
  if (!SHA40.test(base))
    findings.push(finding('DECLARATION_BASE_INVALID', 'exact declaration base missing'));
  return base;
}

function isolatedClone(root, candidate) {
  const temporary = mkdtempSync(join(tmpdir(), 'devai-candidate-only-'));
  const bare = join(temporary, 'candidate.git');
  const checkout = join(temporary, 'checkout');
  git(temporary, ['init', '--bare', '-q', bare]);
  const fetched = gitResult(bare, [
    '-c',
    'uploadpack.allowReachableSHA1InWant=true',
    'fetch',
    '--no-tags',
    root,
    `${candidate}:refs/heads/candidate`,
  ]);
  if (fetched.status !== 0) {
    rmSync(temporary, { recursive: true, force: true });
    throw new Error(`candidate-only fetch failed: ${fetched.stderr || fetched.stdout}`);
  }
  git(temporary, [
    'clone',
    '-q',
    '--no-local',
    '--single-branch',
    '--branch',
    'candidate',
    bare,
    checkout,
  ]);
  const alternates = [
    join(bare, 'objects/info/alternates'),
    join(checkout, '.git/objects/info/alternates'),
  ].some(existsSync);
  return {
    temporary,
    bare,
    checkout,
    alternates,
    refs: git(checkout, ['for-each-ref', '--format=%(refname)']).split('\n').filter(Boolean).sort(),
  };
}

function exceptionRegistry(root) {
  if (!existsSync(join(root, 'law/policy/governed-sha-reference-exceptions.json'))) return [];
  const value = readJson(join(root, 'law/policy/governed-sha-reference-exceptions.json'));
  return Array.isArray(value.entries) ? value.entries : [];
}

function candidateIdentityReferences(root, candidate, policy) {
  const sources = pathsForGlobs(root, candidate, policy.governed_identity_sources ?? []);
  const references = new Map();
  for (const path of sources) {
    const source = candidateFile(root, candidate, path);
    for (const match of source.matchAll(/\b[0-9a-f]{40}\b/gu)) {
      const paths = references.get(match[0]) ?? new Set();
      paths.add(path);
      references.set(match[0], paths);
    }
  }
  return references;
}

function inspectIdentity(root, cloneRoot, value, field, findings) {
  if (!SHA40.test(value ?? '')) {
    findings.push(
      finding('GIT_IDENTITY_NOT_FULL', `${field} must be one exact forty-hex identity`, { field }),
    );
    return;
  }
  const local = gitResult(root, ['cat-file', '-t', value]);
  if (local.status !== 0) {
    findings.push(
      finding('GIT_IDENTITY_UNRESOLVED', `${field} does not resolve`, { field, sha: value }),
    );
    return;
  }
  if (local.stdout.trim() !== 'commit') {
    findings.push(
      finding('GIT_IDENTITY_WRONG_KIND', `${field} must resolve to a commit`, {
        field,
        sha: value,
        object_kind: local.stdout.trim(),
      }),
    );
    return;
  }
  const isolated = gitResult(cloneRoot, ['cat-file', '-t', value]);
  if (isolated.status !== 0) {
    findings.push(
      finding('GIT_IDENTITY_NOT_PUBLISHABLE', `${field} is absent from candidate-only history`, {
        field,
        sha: value,
      }),
    );
  }
}

function verifyCandidateIdentities(root, candidate, policy, fields, findings) {
  let isolated;
  try {
    isolated = isolatedClone(root, candidate);
  } catch (error) {
    findings.push(finding('CANDIDATE_CLONE_FAILED', String(error)));
    return null;
  }
  try {
    if (isolated.alternates) {
      findings.push(finding('CANDIDATE_CLONE_ALTERNATES', 'candidate-only clone has alternates'));
    }
    for (const [field, value] of Object.entries(fields)) {
      inspectIdentity(root, isolated.checkout, value, field, findings);
    }
    const references = candidateIdentityReferences(root, candidate, policy);
    const exceptions = new Map(exceptionRegistry(root).map((entry) => [entry.sha, entry]));
    const identities = [];
    for (const [sha, paths] of references) {
      const object = gitResult(isolated.checkout, ['cat-file', '-t', sha]);
      if (object.status === 0) {
        identities.push({
          sha,
          object_kind: object.stdout.trim(),
          status: 'reachable',
          paths: [...paths].sort(),
        });
        continue;
      }
      const exception = exceptions.get(sha);
      const allowed = new Set(exception?.allowed_paths ?? []);
      const actual = [...paths].sort();
      const exact =
        exception !== undefined &&
        typeof exception.object_kind === 'string' &&
        exception.object_kind.length > 0 &&
        typeof exception.reason === 'string' &&
        exception.reason.length > 0 &&
        actual.length === allowed.size &&
        actual.every((path) => allowed.has(path));
      if (!exact) {
        findings.push(
          finding(
            'GIT_IDENTITY_NOT_PUBLISHABLE',
            `${sha} is absent from candidate-only history and lacks exact classification`,
            { sha, paths: actual },
          ),
        );
      } else {
        identities.push({
          sha,
          object_kind: exception.object_kind,
          status: 'classified',
          paths: actual,
        });
      }
    }
    return {
      method: 'bundle-single-branch',
      alternates: false,
      refs: isolated.refs,
      identities,
      ok: findings.every(({ code }) => !code.startsWith('GIT_IDENTITY_')),
    };
  } finally {
    rmSync(isolated.temporary, { recursive: true, force: true });
  }
}

function authorRole(author) {
  const match = /^DEVAI (Architect|Owner|Engineer|Inspector|Auditor|Machine)$/u.exec(author);
  return match?.[1] ?? null;
}

function rolePathMap(root, base, head, policy, findings) {
  const commits = git(root, ['rev-list', '--reverse', `${base}..${head}`])
    .split('\n')
    .filter(Boolean);
  const commitSet = new Set(commits);
  const exceptions = new Map();
  const exceptionEntries = Array.isArray(policy.role_path_exceptions)
    ? policy.role_path_exceptions
    : [];
  const decisions = readFileSync(join(root, 'law/register/DECISIONS.md'), 'utf8');

  for (const entry of exceptionEntries) {
    const structurallyValid =
      entry !== null &&
      typeof entry === 'object' &&
      SHA40.test(entry.commit ?? '') &&
      typeof entry.role === 'string' &&
      Array.isArray(entry.paths) &&
      entry.paths.length > 0 &&
      new Set(entry.paths).size === entry.paths.length &&
      entry.paths.every(
        (path) => typeof path === 'string' && path.length > 0 && !/[?*[\]{}]/u.test(path),
      ) &&
      typeof entry.decision_id === 'string' &&
      entry.decision_id.length > 0 &&
      typeof entry.reason === 'string' &&
      entry.reason.trim().length > 0;
    if (!structurallyValid || exceptions.has(entry?.commit)) {
      findings.push(
        finding('ROLE_PATH_EXCEPTION_INVALID', 'role-path exception is malformed or duplicated', {
          commit: entry?.commit ?? null,
        }),
      );
      continue;
    }
    exceptions.set(entry.commit, entry);
    if (!commitSet.has(entry.commit)) {
      findings.push(
        finding('ROLE_PATH_EXCEPTION_UNUSED', 'role-path exception commit is outside the range', {
          commit: entry.commit,
        }),
      );
    }
  }

  return commits.map((sha) => {
    const author = git(root, ['show', '-s', '--format=%an', sha]);
    const role = authorRole(author);
    const paths = git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
      .split('\n')
      .filter(Boolean)
      .sort();
    const allowed = role === null ? [] : (policy.role_paths?.[role] ?? []);
    const unauthorizedPaths = paths.filter((path) => !allowed.some((glob) => matches(path, glob)));
    const exception = exceptions.get(sha);
    let exceptionAuthorized = false;
    if (exception !== undefined) {
      const declaredPaths = [...exception.paths].sort();
      const pathSetMatches =
        declaredPaths.length === unauthorizedPaths.length &&
        declaredPaths.every((path, index) => path === unauthorizedPaths[index]);
      const roleMatches = role !== null && exception.role === role;
      const decisionResolves = decisions.includes(`### ${exception.decision_id} `);
      if (!roleMatches) {
        findings.push(
          finding('ROLE_PATH_EXCEPTION_ROLE_MISMATCH', 'role-path exception role is not actual', {
            sha,
            actual_role: role,
            declared_role: exception.role,
          }),
        );
      }
      if (!pathSetMatches) {
        findings.push(
          finding(
            'ROLE_PATH_EXCEPTION_PATH_MISMATCH',
            'role-path exception paths do not equal the exact unauthorized path set',
            { sha, declared_paths: declaredPaths, unauthorized_paths: unauthorizedPaths },
          ),
        );
      }
      if (!decisionResolves) {
        findings.push(
          finding(
            'ROLE_PATH_EXCEPTION_DECISION_UNRESOLVED',
            'role-path exception decision does not resolve',
            { sha, decision_id: exception.decision_id },
          ),
        );
      }
      exceptionAuthorized = roleMatches && pathSetMatches && decisionResolves;
    }
    const pathAuthorized =
      role !== null && paths.length > 0 && (unauthorizedPaths.length === 0 || exceptionAuthorized);
    if (!pathAuthorized) {
      findings.push(
        finding('ROLE_PATH_VIOLATION', `${sha} is not role-pure`, { sha, author, role, paths }),
      );
    }
    return {
      commit: sha,
      author,
      role: role ?? 'Unknown',
      paths,
      path_authorized: pathAuthorized,
      role_path_exception: exceptionAuthorized
        ? { decision_id: exception.decision_id, paths: [...exception.paths].sort() }
        : null,
    };
  });
}

function rolePathEvidenceV7(base, candidate, policy) {
  const localFindings = [];
  const population = rolePathMap(repoRoot, base, candidate, policy, localFindings);
  return population.map((entry) => {
    const [authorName, authorEmail] = git(repoRoot, [
      'show',
      '-s',
      '--format=%an%x00%ae',
      entry.commit,
    ]).split('\0');
    return {
      commit_sha: entry.commit,
      author_name: authorName,
      author_email: authorEmail,
      paths: entry.paths,
      classification: entry.role,
      verdict: entry.path_authorized ? 'ROLE_PURE' : 'ROLE_PATH_VIOLATION',
      finding_codes: localFindings
        .filter(({ sha }) => sha === entry.commit)
        .map(({ code }) => code)
        .sort(),
    };
  });
}

function projectionDigests(root, candidate, policy) {
  return (policy.projections ?? []).map((projection) => ({
    id: projection.id,
    sources_sha256: digestPaths(root, candidate, projection.sources ?? []),
    outputs_sha256: digestPaths(root, candidate, projection.outputs ?? []),
  }));
}

function coverageReading(root) {
  const path = join(root, 'scratch/coverage/t1-t3/coverage-summary.json');
  if (!existsSync(path)) return null;
  const total = readJson(path).total;
  const value = (key) => Number(total?.[key]?.pct);
  const result = {
    statements: value('statements'),
    branches: value('branches'),
    functions: value('functions'),
    lines: value('lines'),
  };
  return Object.values(result).every(Number.isFinite) ? result : null;
}

function validCommandResult(actual, expected) {
  const successful = ['pass', 'EXECUTED_PASS', 'SKIPPED_FRESH'].includes(actual?.outcome);
  return (
    actual?.id === expected?.id &&
    JSON.stringify(actual?.argv) === JSON.stringify(expected?.argv) &&
    actual?.exit_code === 0 &&
    successful &&
    /^[0-9a-f]{64}$/u.test(actual?.stdout_sha256 ?? '') &&
    /^[0-9a-f]{64}$/u.test(actual?.stderr_sha256 ?? '')
  );
}

function semanticResults(results) {
  return (results ?? []).map(
    ({ id, argv, exit_code, outcome, result_digest, reused_result_digest }) => ({
      id,
      argv,
      exit_code,
      outcome: ['pass', 'EXECUTED_PASS', 'SKIPPED_FRESH'].includes(outcome) ? 'pass' : 'fail',
      effective_result_digest: reused_result_digest ?? result_digest ?? null,
    }),
  );
}

function validateConvergenceState(state, policy, base, head, root) {
  if (
    state?.ok !== true ||
    state?.base !== base ||
    state?.head !== head ||
    !Array.isArray(state?.passes) ||
    state.passes.length !== 2 ||
    !Array.isArray(state?.findings) ||
    state.findings.length !== 0 ||
    state?.result_equivalent !== true
  )
    return false;
  const expected = policy.convergence.commands ?? [];
  const coverageSha = coverageDigest(root);
  if (coverageSha === null) return false;
  for (const [index, pass] of state.passes.entries()) {
    if (
      pass?.pass !== index + 1 ||
      pass?.clean_before !== true ||
      pass?.clean_after !== true ||
      pass?.head_before !== head ||
      pass?.head_after !== head ||
      pass?.coverage_sha256 !== coverageSha ||
      typeof pass?.workspace_sha256 !== 'string' ||
      !Array.isArray(pass?.results) ||
      pass.results.length !== expected.length ||
      !pass.results.every((result, resultIndex) =>
        validCommandResult(result, expected[resultIndex]),
      )
    )
      return false;
  }
  return (
    state.passes[0].workspace_sha256 === state.passes[1].workspace_sha256 &&
    canonical(semanticResults(state.passes[0].results)) ===
      canonical(semanticResults(state.passes[1].results))
  );
}

function validRehearsalResult(result) {
  return (
    SHA40.test(result?.source_merge ?? '') &&
    SHA40.test(result?.closure_head ?? '') &&
    SHA40.test(result?.schema_ancestor ?? '') &&
    SHA40.test(result?.verb_ancestor ?? '') &&
    result?.production_verb_exercised === true &&
    result?.record_schema_valid === true &&
    result?.exact_range_valid === true &&
    result?.ok === true
  );
}

function manifest() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'manifest', findings });
  const round = option('--round') ?? '';
  const implementationSubject = option('--implementation-subject') ?? '';
  const reviewCandidate = option('--review-candidate') ?? '';
  const publishedHead = option('--published-head') ?? '';
  findings.push(...policyFindings(policy, repoRoot, publishedHead || 'HEAD'));
  if (process.argv.includes('--history-window')) {
    findings.push(
      finding('FIXED_HISTORY_WINDOW_FORBIDDEN', 'candidate range must never use a last-N window'),
    );
  }
  const base = declaredBase(repoRoot, policy, publishedHead || 'HEAD', findings);
  const suppliedBase = option('--base');
  if (suppliedBase !== undefined && suppliedBase !== base) {
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'supplied base differs from the declaration', {
        expected: base,
        actual: suppliedBase,
      }),
    );
  }
  if (SHA40.test(base) && SHA40.test(publishedHead)) {
    const ancestry = gitResult(repoRoot, ['merge-base', '--is-ancestor', base, publishedHead]);
    if (ancestry.status !== 0) {
      findings.push(
        finding('CANDIDATE_RANGE_MISMATCH', 'published head does not descend from base'),
      );
    }
  }
  const cleanClone = SHA40.test(publishedHead)
    ? verifyCandidateIdentities(
        repoRoot,
        publishedHead,
        policy,
        {
          exact_base: base,
          implementation_subject: implementationSubject,
          review_candidate: reviewCandidate,
          published_head: publishedHead,
        },
        findings,
      )
    : null;
  if (SHA40.test(implementationSubject) && SHA40.test(reviewCandidate)) {
    if (
      gitResult(repoRoot, ['merge-base', '--is-ancestor', implementationSubject, reviewCandidate])
        .status !== 0
    )
      findings.push(
        finding(
          'IDENTITY_ORDER_INVALID',
          'review_candidate must descend from implementation_subject',
        ),
      );
  }
  if (SHA40.test(reviewCandidate) && SHA40.test(publishedHead)) {
    if (
      gitResult(repoRoot, ['merge-base', '--is-ancestor', reviewCandidate, publishedHead])
        .status !== 0
    )
      findings.push(
        finding('IDENTITY_ORDER_INVALID', 'published_head must descend from review_candidate'),
      );
  }
  const convergenceState = readState(repoRoot, round, 'convergence.json');
  if (convergenceState.status === 'missing')
    findings.push(finding('CONVERGENCE_RESULT_MISSING', 'run converge first'));
  if (convergenceState.status === 'malformed')
    findings.push(
      finding('MANIFEST_STATE_MALFORMED', 'convergence result is malformed', {
        state: 'convergence.json',
        error: convergenceState.error,
      }),
    );
  if (
    convergenceState.status === 'valid' &&
    (convergenceState.value?.base !== base || convergenceState.value?.head !== publishedHead)
  )
    findings.push(
      finding('CONVERGENCE_RESULT_STALE', 'convergence result belongs to another candidate', {
        expected_base: base,
        expected_head: publishedHead,
        actual_base: convergenceState.value?.base,
        actual_head: convergenceState.value?.head,
      }),
    );
  if (
    convergenceState.status === 'valid' &&
    !validateConvergenceState(convergenceState.value, policy, base, publishedHead, repoRoot)
  )
    findings.push(
      finding(
        'CONVERGENCE_STATE_INVALID',
        'convergence state does not prove two exact equivalent clean passes',
      ),
    );
  const rehearsalState = readState(repoRoot, round, 'closure-rehearsal.json');
  if (rehearsalState.status === 'missing')
    findings.push(finding('CLOSURE_REHEARSAL_MISSING', 'run rehearse first'));
  if (rehearsalState.status === 'malformed')
    findings.push(
      finding('MANIFEST_STATE_MALFORMED', 'closure rehearsal result is malformed', {
        state: 'closure-rehearsal.json',
        error: rehearsalState.error,
      }),
    );
  if (
    rehearsalState.status === 'valid' &&
    (rehearsalState.value?.base !== base || rehearsalState.value?.candidate !== publishedHead)
  )
    findings.push(
      finding('CLOSURE_REHEARSAL_STALE', 'closure rehearsal belongs to another candidate', {
        expected_base: base,
        expected_candidate: publishedHead,
        actual_base: rehearsalState.value?.base,
        actual_candidate: rehearsalState.value?.candidate,
      }),
    );
  if (rehearsalState.status === 'valid' && !validRehearsalResult(rehearsalState.value?.result)) {
    findings.push(
      finding('CLOSURE_REHEARSAL_INVALID', 'closure rehearsal state is not production evidence'),
    );
  } else if (
    rehearsalState.status === 'valid' &&
    rehearsalState.value?.base === base &&
    rehearsalState.value?.candidate === publishedHead
  ) {
    const replayFindings = [];
    const replay = performRehearsal(policy, round, base, publishedHead, replayFindings);
    if (
      replayFindings.length > 0 ||
      replay === null ||
      canonical(replay) !== canonical(rehearsalState.value.result)
    ) {
      findings.push(
        finding(
          'CLOSURE_REHEARSAL_INVALID',
          'closure rehearsal cannot be reproduced from the exact candidate',
          { replay_findings: replayFindings },
        ),
      );
    }
  }
  const convergence = convergenceState.value;
  const rehearsal = rehearsalState.value;
  const coverage = coverageReading(repoRoot);
  if (coverage === null)
    findings.push(finding('COVERAGE_RESULT_MISSING', 'coverage summary missing'));

  let output = null;
  if (
    SHA40.test(base) &&
    SHA40.test(publishedHead) &&
    cleanClone?.ok === true &&
    convergence?.ok === true &&
    rehearsal?.ok === true &&
    coverage !== null
  ) {
    const commits = git(repoRoot, ['rev-list', '--reverse', `${base}..${publishedHead}`])
      .split('\n')
      .filter(Boolean);
    const rolePathCommits = rolePathMap(repoRoot, base, publishedHead, policy, findings);
    const results = convergence.passes
      .flatMap((pass) => pass.results)
      .map((result) => ({
        id: result.id,
        argv: result.argv,
        exit_code: result.exit_code ?? 1,
        outcome: ['pass', 'EXECUTED_PASS', 'SKIPPED_FRESH'].includes(result.outcome)
          ? 'pass'
          : 'fail',
        stdout_sha256: result.stdout_sha256,
        stderr_sha256: result.stderr_sha256,
      }));
    const testIds = new Set(['ordinary', 'stage2', 't4', 't5', 't6', 'coverage']);
    const body = {
      schemaVersion: '1.0.0',
      round,
      exact_base: base,
      implementation_subject: implementationSubject,
      review_candidate: reviewCandidate,
      published_head: publishedHead,
      candidate_tree: git(repoRoot, ['rev-parse', `${publishedHead}^{tree}`]),
      governed_range: { base, head: publishedHead, commits },
      role_path_commits: rolePathCommits,
      projection_materialization_digests: projectionDigests(repoRoot, publishedHead, policy),
      test_results: results.filter(({ id }) => testIds.has(id)),
      coverage,
      clean_clone: cleanClone,
      gate_results: results,
      convergence: { passes: 2, second_pass_no_write: true, clean: true },
      closure_rehearsal: rehearsal.result,
    };
    output = {
      ...body,
      manifest_digest_sha256: sha256(canonical(body)),
    };
    const schemaPath = join(repoRoot, policy.manifest_schema);
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(readJson(schemaPath));
    if (!validate(output)) {
      findings.push(
        finding('MANIFEST_SCHEMA_INVALID', 'candidate manifest failed schema validation', {
          errors: validate.errors,
        }),
      );
    }
  }
  const ok = findings.length === 0 && output !== null;
  if (ok && process.argv.includes('--write')) {
    const previous = readState(repoRoot, round, 'candidate-manifest.json');
    if (
      previous.status === 'valid' &&
      previous.value?.manifest_digest_sha256 !== output.manifest_digest_sha256
    ) {
      const historyDirectory = join(stateDirectory(repoRoot, round), 'candidate-manifests');
      mkdirSync(historyDirectory, { recursive: true });
      const identity = SHA40.test(previous.value?.review_candidate ?? '')
        ? previous.value.review_candidate
        : 'unknown-candidate';
      writeFileSync(
        join(
          historyDirectory,
          `${identity}-${previous.value.manifest_digest_sha256 ?? 'unknown'}.json`,
        ),
        canonical(previous.value),
      );
    }
    writeState(repoRoot, round, 'candidate-manifest.json', output);
  }
  emit({ ok, command: 'manifest', manifest: output, findings });
}

function commandResult(id, argv, result) {
  const exitCode = result.status ?? 1;
  return {
    id,
    argv,
    exit_code: exitCode,
    outcome: exitCode === 0 ? 'pass' : 'fail',
    stdout_sha256: sha256(result.stdout ?? ''),
    stderr_sha256: sha256(result.stderr ?? ''),
  };
}

function converge() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'converge', findings });
  findings.push(...policyFindings(policy));
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactHead = git(repoRoot, ['rev-parse', head]);
  const checkedOutHead = git(repoRoot, ['rev-parse', 'HEAD']);
  if (checkedOutHead !== exactHead) {
    findings.push(
      finding('CONVERGENCE_HEAD_MISMATCH', 'checkout does not equal the convergence head', {
        expected: exactHead,
        actual: checkedOutHead,
      }),
    );
  }
  const declared = declaredBase(repoRoot, policy, exactHead, findings);
  if (base !== declared) {
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'convergence base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  }
  const passes = [];
  for (let passNumber = 1; passNumber <= 2; passNumber += 1) {
    const headBefore = git(repoRoot, ['rev-parse', 'HEAD']);
    if (headBefore !== exactHead) {
      findings.push(
        finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} head drifted`, {
          pass: passNumber,
          expected: exactHead,
          actual: headBefore,
        }),
      );
      break;
    }
    const before = cleanStatus(repoRoot);
    if (before.length > 0) {
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} did not start clean`, {
          pass: passNumber,
        }),
      );
      break;
    }
    const results = [];
    for (const gate of policy.convergence.commands ?? []) {
      if (git(repoRoot, ['rev-parse', 'HEAD']) !== exactHead) {
        findings.push(
          finding('CONVERGENCE_HEAD_MISMATCH', `head drifted before gate ${gate.id}`, {
            pass: passNumber,
            gate: gate.id,
          }),
        );
        break;
      }
      const [program, ...args] = gate.argv ?? [];
      const result = run(program, args, { cwd: repoRoot });
      results.push(commandResult(gate.id, gate.argv, result));
      if (result.status !== 0) {
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', `gate ${gate.id} failed`, {
            pass: passNumber,
            gate: gate.id,
            exit_code: result.status ?? 1,
          }),
        );
      }
      if (git(repoRoot, ['rev-parse', 'HEAD']) !== exactHead) {
        findings.push(
          finding('CONVERGENCE_HEAD_MISMATCH', `gate ${gate.id} changed HEAD`, {
            pass: passNumber,
            gate: gate.id,
          }),
        );
        break;
      }
    }
    const after = cleanStatus(repoRoot);
    const headAfter = git(repoRoot, ['rev-parse', 'HEAD']);
    if (after.length > 0) {
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} wrote repository paths`, {
          pass: passNumber,
        }),
      );
    }
    if (headAfter !== exactHead) {
      findings.push(
        finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} ended at another head`, {
          pass: passNumber,
          expected: exactHead,
          actual: headAfter,
        }),
      );
    }
    passes.push({
      pass: passNumber,
      results,
      clean_before: before.length === 0,
      clean_after: after.length === 0,
      head_before: headBefore,
      head_after: headAfter,
      coverage_sha256: coverageDigest(repoRoot),
      workspace_sha256: workspaceSnapshot(
        repoRoot,
        policy.convergence.normalized_runtime_artifacts,
      ),
    });
    if (findings.length > 0) break;
  }
  const resultEquivalent =
    passes.length === 2 &&
    canonical(semanticResults(passes[0].results)) === canonical(semanticResults(passes[1].results));
  if (passes.length === 2 && passes[0].workspace_sha256 !== passes[1].workspace_sha256) {
    findings.push(
      finding(
        'CONVERGENCE_WRITE_DETECTED',
        'the second pass changed relevant tracked, untracked, ignored, or generated content',
      ),
    );
  }
  if (passes.length === 2 && passes[0].coverage_sha256 !== passes[1].coverage_sha256) {
    findings.push(
      finding('CONVERGENCE_COVERAGE_DRIFT', 'coverage bytes differ across convergence passes'),
    );
  }
  if (passes.length === 2 && !resultEquivalent) {
    findings.push(
      finding('CONVERGENCE_RESULT_DRIFT', 'ordered command outcomes differ across passes'),
    );
  }
  const ok = findings.length === 0 && passes.length === 2;
  const state = {
    ok,
    base,
    head: exactHead,
    passes,
    result_equivalent: resultEquivalent,
    findings,
  };
  if (ok) writeState(repoRoot, round, 'convergence.json', state);
  emit({ ...state, command: 'converge' });
}

function smartConverge() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'smart-converge', findings });
  const freshness = policy.freshness;
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactHead = git(repoRoot, ['rev-parse', head]);
  const checkedOutHead = git(repoRoot, ['rev-parse', 'HEAD']);
  const declared = declaredBase(repoRoot, policy, exactHead, findings);
  if (checkedOutHead !== exactHead)
    findings.push(
      finding('CONVERGENCE_HEAD_MISMATCH', 'checkout does not equal the smart-convergence head', {
        expected: exactHead,
        actual: checkedOutHead,
      }),
    );
  if (base !== declared)
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'smart-convergence base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  if (
    freshness === null ||
    typeof freshness !== 'object' ||
    freshness.partial_coverage_merge !== 'forbidden' ||
    freshness.coverage_reuse !== 'whole-identical-inputs-and-outputs-only' ||
    freshness.remote_cache_trusted !== false
  )
    findings.push(
      finding(
        'FRESHNESS_POLICY_INVALID',
        'content-addressed freshness policy is missing or weakened',
      ),
    );

  const commands = policy?.convergence?.commands ?? [];
  const tasks = freshness?.tasks ?? [];
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  if (
    commands.length === 0 ||
    commands.length !== tasks.length ||
    commands.some((gate) => !taskById.has(gate.id)) ||
    tasks.some((task) => !commands.some((gate) => gate.id === task.id))
  )
    findings.push(
      finding(
        'FRESHNESS_TASK_CENSUS_INVALID',
        'freshness tasks and convergence commands must form an exact population',
      ),
    );
  const coverageTask = taskById.get('coverage');
  if (
    coverageTask !== undefined &&
    (coverageTask.coverage_mode !== 'whole-only' ||
      !(coverageTask.input_sets ?? []).includes('coverage'))
  )
    findings.push(
      finding('FRESHNESS_COVERAGE_POLICY_INVALID', 'coverage must remain a whole-only task'),
    );

  const toolchainDigest = toolchainFingerprint(policy, findings);
  const environmentDigest = environmentFingerprint(policy);
  const schemaPath = join(repoRoot, policy.freshness_schema ?? '');
  if (!existsSync(schemaPath))
    findings.push(finding('FRESHNESS_SCHEMA_MISSING', 'task freshness schema is missing'));
  const remote = remoteEnvironment(policy);
  const producedThisInvocation = new Set();
  const passes = [];

  for (let passNumber = 1; passNumber <= 2; passNumber += 1) {
    const headBefore = git(repoRoot, ['rev-parse', 'HEAD']);
    const before = cleanStatus(repoRoot);
    if (headBefore !== exactHead || before.length > 0 || findings.length > 0) {
      if (before.length > 0)
        findings.push(
          finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} did not start clean`, {
            pass: passNumber,
          }),
        );
      if (headBefore !== exactHead)
        findings.push(
          finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} head drifted`, {
            pass: passNumber,
            expected: exactHead,
            actual: headBefore,
          }),
        );
      passes.push({
        pass: passNumber,
        results: blockedResults(policy),
        clean_before: before.length === 0,
        clean_after: before.length === 0,
        head_before: headBefore,
        head_after: headBefore,
        coverage_sha256: coverageDigest(repoRoot),
        workspace_sha256: workspaceSnapshot(
          repoRoot,
          policy.convergence.normalized_runtime_artifacts ?? [],
        ),
      });
      break;
    }

    const results = [];
    const resultById = new Map();
    for (const gate of commands) {
      const task = taskById.get(gate.id);
      if (task === undefined) continue;
      const dependencies = {};
      let dependencyBlocked = false;
      for (const dependency of task.dependencies ?? []) {
        const result = resultById.get(dependency);
        if (
          result === undefined ||
          !['EXECUTED_PASS', 'SKIPPED_FRESH'].includes(result.outcome) ||
          typeof result.task_key !== 'string'
        ) {
          dependencyBlocked = true;
          break;
        }
        dependencies[dependency] = result.task_key;
      }
      if (dependencyBlocked) {
        const blocked = {
          id: gate.id,
          task_id: gate.id,
          argv: gate.argv,
          exit_code: null,
          outcome: 'BLOCKED',
          stdout_sha256: sha256(''),
          stderr_sha256: sha256(''),
        };
        results.push(blocked);
        resultById.set(gate.id, blocked);
        findings.push(
          finding('FRESHNESS_DEPENDENCY_BLOCKED', `task ${gate.id} has no fresh dependency`, {
            gate: gate.id,
            pass: passNumber,
          }),
        );
        continue;
      }

      const inputGlobs = taskInputGlobs(policy, task);
      const inputEntries = worktreeInputEntries(repoRoot, inputGlobs);
      const inputDigest = sha256(canonical({ globs: inputGlobs, entries: inputEntries }));
      const keyBody = {
        policy_version: freshness.policy_version,
        task_id: gate.id,
        argv: gate.argv,
        cwd: '.',
        input_digest: inputDigest,
        dependency_keys: dependencies,
        output_specs: task.outputs ?? [],
        toolchain_digest: toolchainDigest,
        environment_digest: environmentDigest,
      };
      const taskKey = sha256(canonical(keyBody));
      const cachePath = freshnessCachePath(policy, round, gate.id);
      const cache = existsSync(schemaPath) ? readFreshnessCache(cachePath, schemaPath) : null;
      const currentOutputs = outputEntries(repoRoot, task.outputs ?? []);
      const trustedCache = !remote || producedThisInvocation.has(gate.id);
      const reusable =
        trustedCache &&
        cache?.outcome === 'EXECUTED_PASS' &&
        cache.task_key === taskKey &&
        currentOutputs.missing.length === 0 &&
        canonical(cache.outputs ?? []) === canonical(currentOutputs.outputs);

      if (reusable) {
        const body = {
          schemaVersion: '1.0.0',
          policy_version: freshness.policy_version,
          task_id: gate.id,
          argv: gate.argv,
          cwd: '.',
          task_key: taskKey,
          input_digest: inputDigest,
          dependency_keys: dependencies,
          toolchain_digest: toolchainDigest,
          environment_digest: environmentDigest,
          producing_candidate: cache.producing_candidate,
          outcome: 'SKIPPED_FRESH',
          exit_code: 0,
          stdout_sha256: cache.stdout_sha256,
          stderr_sha256: cache.stderr_sha256,
          reused_result_digest: cache.result_digest,
          outputs: currentOutputs.outputs,
          freshness_reason:
            'identical content-addressed PASS, fresh dependencies, and byte-identical outputs',
        };
        const skipped = { ...body, result_digest: freshnessRecordDigest(body), id: gate.id };
        results.push(skipped);
        resultById.set(gate.id, skipped);
        continue;
      }

      const [program, ...args] = gate.argv ?? [];
      const executed = run(program, args, { cwd: repoRoot });
      const exitCode = executed.status ?? 1;
      const afterOutputs = outputEntries(repoRoot, task.outputs ?? []);
      const body = {
        schemaVersion: '1.0.0',
        policy_version: freshness.policy_version,
        task_id: gate.id,
        argv: gate.argv,
        cwd: '.',
        task_key: taskKey,
        input_digest: inputDigest,
        dependency_keys: dependencies,
        toolchain_digest: toolchainDigest,
        environment_digest: environmentDigest,
        producing_candidate: exactHead,
        outcome:
          exitCode === 0 && afterOutputs.missing.length === 0 ? 'EXECUTED_PASS' : 'EXECUTED_FAIL',
        exit_code: exitCode,
        stdout_sha256: sha256(executed.stdout ?? ''),
        stderr_sha256: sha256(executed.stderr ?? ''),
        reused_result_digest: null,
        outputs: afterOutputs.outputs,
        freshness_reason: 'task executed for the current content-addressed key',
      };
      const cacheRecord = { ...body, result_digest: freshnessRecordDigest(body) };
      writeFreshnessCache(cachePath, cacheRecord);
      const runtimeResult = { ...cacheRecord, id: gate.id };
      results.push(runtimeResult);
      resultById.set(gate.id, runtimeResult);
      producedThisInvocation.add(gate.id);
      if (runtimeResult.outcome !== 'EXECUTED_PASS')
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', `gate ${gate.id} failed or omitted outputs`, {
            pass: passNumber,
            gate: gate.id,
            exit_code: exitCode,
            missing_outputs: afterOutputs.missing,
          }),
        );
    }

    const after = cleanStatus(repoRoot);
    const headAfter = git(repoRoot, ['rev-parse', 'HEAD']);
    if (after.length > 0)
      findings.push(
        finding('CONVERGENCE_DIRTY_TREE', `pass ${String(passNumber)} wrote repository paths`, {
          pass: passNumber,
        }),
      );
    if (headAfter !== exactHead)
      findings.push(
        finding('CONVERGENCE_HEAD_MISMATCH', `pass ${String(passNumber)} ended at another head`, {
          pass: passNumber,
          expected: exactHead,
          actual: headAfter,
        }),
      );
    passes.push({
      pass: passNumber,
      results,
      clean_before: before.length === 0,
      clean_after: after.length === 0,
      head_before: headBefore,
      head_after: headAfter,
      coverage_sha256: coverageDigest(repoRoot),
      workspace_sha256: workspaceSnapshot(
        repoRoot,
        policy.convergence.normalized_runtime_artifacts ?? [],
      ),
    });
    if (findings.length > 0) break;
  }

  const resultEquivalent =
    passes.length === 2 &&
    canonical(semanticResults(passes[0].results)) === canonical(semanticResults(passes[1].results));
  if (passes.length === 2 && passes[0].workspace_sha256 !== passes[1].workspace_sha256)
    findings.push(
      finding('CONVERGENCE_WRITE_DETECTED', 'smart-convergence workspace digests differ'),
    );
  if (passes.length === 2 && passes[0].coverage_sha256 !== passes[1].coverage_sha256)
    findings.push(
      finding('CONVERGENCE_COVERAGE_DRIFT', 'smart-convergence coverage digests differ'),
    );
  if (passes.length === 2 && !resultEquivalent)
    findings.push(
      finding('CONVERGENCE_RESULT_DRIFT', 'smart-convergence effective results differ'),
    );
  const ok = findings.length === 0 && passes.length === 2;
  const state = {
    ok,
    mode: 'content-addressed',
    base,
    head: exactHead,
    remote_cache_trusted: false,
    passes,
    result_equivalent: resultEquivalent,
    findings,
  };
  if (ok) writeState(repoRoot, round, 'convergence.json', state);
  emit({ ...state, command: 'smart-converge' });
}

function changedCommits(root, base, head) {
  return git(root, ['rev-list', '--reverse', `${base}..${head}`])
    .split('\n')
    .filter(Boolean)
    .map((sha) => ({
      sha,
      author: git(root, ['show', '-s', '--format=%an', sha]),
      paths: git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
        .split('\n')
        .filter(Boolean),
    }));
}

function optionalCandidateFile(root, revision, path) {
  try {
    return candidateFile(root, revision, path);
  } catch {
    return null;
  }
}

function contentStatus(current, previous) {
  if (previous === null) return 'added';
  if (current === null) return 'removed';
  return current === previous ? 'unchanged' : 'changed';
}

function reviewTopicId(kind, key) {
  return `${kind}:${sha256(key).slice(0, 24)}`;
}

function markdownRequirements(source) {
  const requirements = [];
  const modal =
    /\b(?:must|requires?|required|may not|do not|never|only|stop|blocked|forbidden)\b/iu;
  for (const [index, line] of source.split('\n').entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || /^[-|: ]+$/u.test(trimmed)) continue;
    const listed = /^(?:[-*]|\d+\.)\s+/u.test(trimmed);
    const table = trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---');
    if (!listed && !table && !modal.test(trimmed)) continue;
    requirements.push({ line: index + 1, claim: trimmed.replace(/^[-*]\s+/u, '') });
  }
  return requirements;
}

function priorReviewFindings(source) {
  return source
    .split('\n')
    .map((line, index) => ({ line: index + 1, match: /^###\s+(P[0-3]\s+—\s+.+)$/u.exec(line) }))
    .filter(({ match }) => match !== null)
    .map(({ line, match }) => ({ line, claim: match[1] }));
}

function candidateManifestValue(path) {
  try {
    const value = readJson(path);
    const { manifest_digest_sha256: claimed, ...body } = value;
    const digest = sha256(canonical(body));
    if (claimed !== digest || !SHA40.test(value.review_candidate ?? '')) return null;
    return { value, digest };
  } catch {
    return null;
  }
}

function reviewScopeManifest() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'review-scope', findings });
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const candidate = option('--candidate') ?? '';
  const reviewPolicy = policy.review_scope;
  const declared = declaredBase(repoRoot, policy, candidate || 'HEAD', findings);
  if (base !== declared)
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'review-scope base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  if (
    !SHA40.test(candidate) ||
    gitResult(repoRoot, ['cat-file', '-e', `${candidate}^{commit}`]).status !== 0
  )
    findings.push(
      finding('REVIEW_SCOPE_CANDIDATE_INVALID', 'review candidate is not an exact commit'),
    );
  if (reviewPolicy === null || typeof reviewPolicy !== 'object')
    findings.push(finding('REVIEW_SCOPE_POLICY_INVALID', 'review-scope policy is missing'));

  const currentManifestPath = join(
    repoRoot,
    configuredStatePath(reviewPolicy?.candidate_manifest_state, round),
  );
  const currentManifest = candidateManifestValue(currentManifestPath);
  if (currentManifest === null || currentManifest.value.review_candidate !== candidate)
    findings.push(
      finding(
        'REVIEW_SCOPE_CANDIDATE_MANIFEST_INVALID',
        'current candidate manifest is missing, malformed, or stale',
      ),
    );

  const historyPattern = configuredStatePath(reviewPolicy?.candidate_manifest_history, round);
  const historyPaths = filesystemPaths(repoRoot, true)
    .filter((path) => matches(path, historyPattern))
    .sort();
  const previousManifests = historyPaths
    .map((path) => candidateManifestValue(join(repoRoot, path)))
    .filter((value) => value !== null && value.digest !== currentManifest?.digest);
  const previousCandidate = previousManifests.at(-1)?.value?.review_candidate ?? base;
  const convergenceState = readState(repoRoot, round, 'convergence.json');
  const taskKeys = [
    ...new Set(
      (convergenceState.value?.passes ?? [])
        .flatMap((pass) => pass.results ?? [])
        .filter((result) => ['EXECUTED_PASS', 'SKIPPED_FRESH'].includes(result.outcome))
        .map((result) => result.task_key)
        .filter((key) => /^[0-9a-f]{64}$/u.test(key ?? '')),
    ),
  ].sort();
  const topics = [];

  const addTopic = ({
    kind,
    key,
    claim,
    paths,
    current,
    previous,
    adversaries,
    findings: prior = [],
  }) => {
    const status = contentStatus(current, previous);
    const pathDigests = paths.map((path) => ({
      path,
      digest: sha256(optionalCandidateFile(repoRoot, candidate, path) ?? 'MISSING\n'),
    }));
    topics.push({
      topic_id: reviewTopicId(kind, key),
      claim,
      governing_paths: [...new Set(paths)].sort(),
      current_digest: sha256(current ?? 'MISSING\n'),
      previous_digest: previous === null ? null : sha256(previous),
      changed_status: status,
      required_adversaries: [...new Set(adversaries)].sort(),
      previous_findings: [...new Set(prior)].sort(),
      freshness_proof: {
        method:
          status === 'unchanged' && taskKeys.length > 0 ? 'content-addressed' : 'recheck-required',
        inputs_digest: sha256(canonical(pathDigests)),
        task_keys: taskKeys,
        independent_recomputation_required: true,
      },
      required_disposition: status === 'unchanged' ? 'REUSED_FRESH_PASS' : 'RECHECKED_PASS',
    });
  };

  if (SHA40.test(base) && SHA40.test(candidate)) {
    const changed = statusAwareChangedPaths(base, candidate);
    for (const path of changed) {
      addTopic({
        kind: 'changed-path',
        key: path,
        claim: `Inspect the exact candidate change at ${path}`,
        paths: [path],
        current: optionalCandidateFile(repoRoot, candidate, path),
        previous: optionalCandidateFile(repoRoot, previousCandidate, path),
        adversaries: ['inspect-exact-diff', 'exercise-affected-behavior'],
      });
    }
  }

  for (const path of reviewPolicy?.requirement_sources ?? []) {
    const current = optionalCandidateFile(repoRoot, candidate, path);
    const previous = optionalCandidateFile(repoRoot, previousCandidate, path);
    if (current === null) {
      findings.push(
        finding('REVIEW_SCOPE_SOURCE_MISSING', 'requirement source is missing', { path }),
      );
      continue;
    }
    for (const requirement of markdownRequirements(current)) {
      const existed = previous?.includes(requirement.claim) === true ? requirement.claim : null;
      addTopic({
        kind: 'requirement',
        key: `${path}:${String(requirement.line)}:${requirement.claim}`,
        claim: requirement.claim,
        paths: [path],
        current: requirement.claim,
        previous: existed,
        adversaries: ['recheck-requirement', 'challenge-counterexample'],
      });
    }
  }

  for (const path of reviewPolicy?.controlling_sources ?? []) {
    const current = optionalCandidateFile(repoRoot, candidate, path);
    const previous = optionalCandidateFile(repoRoot, previousCandidate, path);
    if (current === null) {
      findings.push(
        finding('REVIEW_SCOPE_SOURCE_MISSING', 'controlling source is missing', { path }),
      );
      continue;
    }
    addTopic({
      kind: 'control',
      key: path,
      claim: `Recheck controlling source ${path}`,
      paths: [path],
      current,
      previous,
      adversaries: ['recompute-control-digest', 'challenge-policy-bypass'],
    });
  }

  for (const path of priorReviewPaths(reviewPolicy, repoRoot, candidate)) {
    const current = optionalCandidateFile(repoRoot, candidate, path);
    if (current === null) {
      findings.push(finding('REVIEW_SCOPE_SOURCE_MISSING', 'prior review is missing', { path }));
      continue;
    }
    for (const prior of priorReviewFindings(current)) {
      addTopic({
        kind: 'previous-finding',
        key: `${path}:${String(prior.line)}:${prior.claim}`,
        claim: `Recheck prior finding class: ${prior.claim}`,
        paths: [path],
        current: prior.claim,
        previous: prior.claim,
        adversaries: ['reproduce-defect-class', 'sweep-same-class-population'],
        findings: [prior.claim],
      });
    }
  }

  if (currentManifest !== null) {
    addTopic({
      kind: 'candidate-manifest',
      key: 'current',
      claim: 'Recompute the current candidate manifest identity and digest',
      paths: [configuredStatePath(reviewPolicy.candidate_manifest_state, round)],
      current: currentManifest.digest,
      previous: previousManifests.at(-1)?.digest ?? null,
      adversaries: ['recompute-manifest-digest', 'compare-candidate-identity'],
    });
  }

  topics.sort((left, right) => left.topic_id.localeCompare(right.topic_id));
  if (new Set(topics.map(({ topic_id }) => topic_id)).size !== topics.length)
    findings.push(finding('REVIEW_TOPIC_DUPLICATED', 'generated review topic IDs are not unique'));
  const body =
    currentManifest === null || !SHA40.test(candidate)
      ? null
      : {
          schemaVersion: '1.0.0',
          policy_version: reviewPolicy.policy_version,
          round,
          exact_base: base,
          review_candidate: candidate,
          candidate_tree: git(repoRoot, ['rev-parse', `${candidate}^{tree}`]),
          current_candidate_manifest_digest: currentManifest.digest,
          previous_candidate_manifest_digests: previousManifests.map(({ digest }) => digest).sort(),
          topic_count: topics.length,
          topics,
        };
  const manifestValue =
    body === null ? null : { ...body, manifest_digest_sha256: sha256(canonical(body)) };
  if (manifestValue !== null) {
    try {
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);
      const validate = ajv.compile(readJson(join(repoRoot, policy.review_scope_schema)));
      if (!validate(manifestValue))
        findings.push(
          finding('REVIEW_SCOPE_SCHEMA_INVALID', 'review-scope manifest failed schema validation', {
            errors: validate.errors,
          }),
        );
    } catch (error) {
      findings.push(finding('REVIEW_SCOPE_SCHEMA_INVALID', String(error)));
    }
  }
  const ok = findings.length === 0 && manifestValue !== null && topics.length > 0;
  if (ok)
    writeState(
      repoRoot,
      round,
      configuredStatePath(reviewPolicy.manifest_state, round).split('/').at(-1),
      manifestValue,
    );
  emit({ ok, command: 'review-scope', manifest: manifestValue, findings });
}

function parseReviewDispositions(source, markers) {
  const start = source.indexOf(markers.start);
  const end = source.indexOf(markers.end);
  if (start === -1 || end === -1 || end <= start) return null;
  const serialized = source.slice(start + markers.start.length, end).trim();
  try {
    const value = JSON.parse(serialized);
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function reviewCheck() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'review-check', findings });
  const reviewPolicy = policy.review_scope;
  const round = option('--round') ?? '';
  const candidate = option('--candidate') ?? '';
  const record = option('--review-record') ?? '';
  const cycle = Number(option('--cycle') ?? '1');
  if (
    !Number.isInteger(cycle) ||
    cycle < (reviewPolicy?.review_cycles?.minimum ?? Number.POSITIVE_INFINITY) ||
    typeof reviewPolicy?.review_cycles?.mode !== 'string'
  )
    findings.push(
      finding(
        'REVIEW_CYCLE_BUDGET_EXHAUSTED',
        'review cycle is outside the declared legacy review protocol',
        { cycle },
      ),
    );
  const manifestPath = join(repoRoot, configuredStatePath(reviewPolicy?.manifest_state, round));
  let manifestValue = null;
  try {
    manifestValue = readJson(manifestPath);
    const { manifest_digest_sha256: claimed, ...body } = manifestValue;
    if (
      claimed !== sha256(canonical(body)) ||
      manifestValue.review_candidate !== candidate ||
      manifestValue.topic_count !== manifestValue.topics?.length
    )
      throw new Error('review-scope manifest identity or digest mismatch');
  } catch (error) {
    findings.push(finding('REVIEW_SCOPE_MANIFEST_INVALID', String(error)));
  }
  let dispositions = null;
  try {
    dispositions = parseReviewDispositions(
      readFileSync(join(repoRoot, record), 'utf8'),
      reviewPolicy.review_record_markers,
    );
    if (dispositions === null) throw new Error('review disposition block is missing or malformed');
  } catch (error) {
    findings.push(finding('REVIEW_TOPIC_DISPOSITIONS_INVALID', String(error)));
  }
  if (manifestValue !== null && dispositions !== null) {
    const topics = new Map(manifestValue.topics.map((topic) => [topic.topic_id, topic]));
    const seen = new Set();
    for (const disposition of dispositions) {
      if (seen.has(disposition?.topic_id))
        findings.push(
          finding('REVIEW_TOPIC_DUPLICATED', 'review topic has more than one disposition', {
            topic_id: disposition?.topic_id,
          }),
        );
      seen.add(disposition?.topic_id);
      const topic = topics.get(disposition?.topic_id);
      if (topic === undefined) {
        findings.push(
          finding('REVIEW_TOPIC_UNKNOWN', 'review record contains an unknown topic', {
            topic_id: disposition?.topic_id,
          }),
        );
        continue;
      }
      if (!(reviewPolicy.dispositions ?? []).includes(disposition?.disposition))
        findings.push(
          finding('REVIEW_TOPIC_DISPOSITION_INVALID', 'review topic disposition is invalid', {
            topic_id: disposition.topic_id,
          }),
        );
      if (disposition?.recomputed_digest !== topic.current_digest)
        findings.push(
          finding('REVIEW_TOPIC_DIGEST_INVALID', 'reviewer digest does not match current topic', {
            topic_id: disposition.topic_id,
          }),
        );
      if (
        disposition?.disposition === 'REUSED_FRESH_PASS' &&
        (topic.changed_status !== 'unchanged' ||
          topic.freshness_proof?.method !== 'content-addressed' ||
          disposition?.freshness_verified !== true ||
          typeof disposition?.rationale !== 'string' ||
          disposition.rationale.trim().length < 20 ||
          /^unchanged\.?$/iu.test(disposition.rationale.trim()))
      )
        findings.push(
          finding(
            'REVIEW_TOPIC_FRESHNESS_UNVERIFIED',
            'reused topic lacks independent digest, freshness, or invariant reasoning',
            { topic_id: disposition.topic_id },
          ),
        );
      if (['RECHECKED_FAIL', 'BLOCKED'].includes(disposition?.disposition))
        findings.push(
          finding('REVIEW_TOPIC_NOT_PASSING', 'review topic is failed or blocked', {
            topic_id: disposition.topic_id,
          }),
        );
    }
    for (const topicId of topics.keys()) {
      if (!seen.has(topicId))
        findings.push(
          finding('REVIEW_TOPIC_OMITTED', 'mandatory review topic has no disposition', {
            topic_id: topicId,
          }),
        );
    }
  }
  emit({
    ok: findings.length === 0,
    command: 'review-check',
    round,
    candidate,
    cycle,
    findings,
  });
}

function parseReviewRecord(source) {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(source);
  if (match === null) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator <= 0) return null;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

function reviewManifest(policy, findings) {
  const inferredRound =
    option('--round') ?? /R-[0-9]{4}/u.exec(policy?.review?.record ?? '')?.[0] ?? 'UNKNOWN';
  const relativePath =
    policy?.review?.manifest_state ??
    `.devai/state/round-runs/${inferredRound}/close/candidate-manifest.json`;
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) {
    findings.push(finding('REVIEW_RECORD_INVALID', 'candidate manifest state is missing'));
    return null;
  }
  try {
    const manifestValue = readJson(path);
    const { manifest_digest_sha256: claimed, ...body } = manifestValue;
    const recomputed = sha256(canonical(body));
    if (!SHA40.test(manifestValue.review_candidate ?? '') || claimed !== recomputed) {
      findings.push(
        finding('REVIEW_RECORD_INVALID', 'candidate manifest identity or digest is invalid'),
      );
      return null;
    }
    return { value: manifestValue, digest: recomputed };
  } catch (error) {
    findings.push(finding('REVIEW_RECORD_INVALID', `candidate manifest is malformed: ${error}`));
    return null;
  }
}

function envelope() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'envelope', findings });
  const head = option('--head') ?? 'HEAD';
  const reviewRecord = option('--review-record') ?? '';
  const exactHead = SHA40.test(head) ? head : git(repoRoot, ['rev-parse', head]);
  if (process.argv.includes('--reviewed-sha')) {
    findings.push(
      finding(
        'REVIEWED_SHA_CALLER_FORBIDDEN',
        'the reviewed identity must be derived from the candidate manifest and review record',
      ),
    );
  }
  if (reviewRecord !== policy.review.record) {
    findings.push(finding('REVIEW_RECORD_NOT_EXACT', 'review record differs from policy'));
  }
  const manifestState = reviewManifest(policy, findings);
  const reviewedSha = manifestState?.value?.review_candidate ?? option('--reviewed-sha') ?? '';
  let reviewFields = null;
  try {
    reviewFields = parseReviewRecord(candidateFile(repoRoot, exactHead, reviewRecord));
  } catch (error) {
    findings.push(finding('REVIEW_RECORD_INVALID', `review record is unavailable: ${error}`));
  }
  const requiredVerdict = policy.review.required_verdict ?? 'PASS';
  const requiredModel = policy.review.required_model;
  if (
    reviewFields === null ||
    reviewFields.verdict !== requiredVerdict ||
    (typeof requiredModel === 'string' && reviewFields.reviewer_model !== requiredModel) ||
    reviewFields.review_candidate !== reviewedSha ||
    reviewFields.manifest_digest_sha256 !== manifestState?.digest
  ) {
    findings.push(
      finding(
        'REVIEW_RECORD_INVALID',
        'review record must bind exact PASS, model, candidate, and manifest digest',
      ),
    );
  }
  const commits =
    SHA40.test(reviewedSha) && SHA40.test(exactHead)
      ? changedCommits(repoRoot, reviewedSha, exactHead)
      : [];
  let reviewCommits = 0;
  const projectionOutputs = new Map();
  const projections = new Map();
  for (const projection of policy.projections ?? []) {
    projections.set(projection.id, projection);
    for (const output of projection.outputs ?? []) projectionOutputs.set(output, projection.id);
  }
  const allowedProjectionIds = new Set(policy.review.allowed_projection_ids ?? []);
  const usedProjectionIds = new Set();
  for (const commit of commits) {
    for (const path of commit.paths) {
      if (path === reviewRecord) {
        reviewCommits += 1;
        if (commit.author !== policy.review.record_author || commit.paths.length !== 1) {
          findings.push(
            finding(
              'REVIEW_RECORD_ATTRIBUTION_INVALID',
              'review record must be one Auditor-only commit',
              {
                sha: commit.sha,
                path,
              },
            ),
          );
        }
        continue;
      }
      const projectionId = projectionOutputs.get(path);
      if (projectionId !== undefined && allowedProjectionIds.has(projectionId)) {
        usedProjectionIds.add(projectionId);
        if (commit.author !== 'DEVAI Architect') {
          findings.push(
            finding(
              'REVIEW_ENVELOPE_PROJECTION_ATTRIBUTION',
              'admitted projection output must be committed by the Architect',
              { sha: commit.sha, path, projection_id: projectionId },
            ),
          );
        }
        continue;
      }
      if (projectionId !== undefined) {
        findings.push(
          finding('REVIEW_ENVELOPE_PROJECTION_DRIFT', 'projection output is not policy-admitted', {
            sha: commit.sha,
            path,
          }),
        );
      }
      if ((policy.review.frozen_paths ?? []).some((glob) => matches(path, glob))) {
        findings.push(
          finding('REVIEW_FREEZE_VIOLATION', 'post-PASS frozen path changed', {
            sha: commit.sha,
            path,
          }),
        );
      } else if (path.startsWith('work/audit/')) {
        findings.push(
          finding('REVIEW_ENVELOPE_EXTRA_AUDIT', 'only the exact review record is allowed', {
            sha: commit.sha,
            path,
          }),
        );
      } else {
        findings.push(
          finding('REVIEW_ENVELOPE_SOURCE_MUTATION', 'path is outside the exact review envelope', {
            sha: commit.sha,
            path,
          }),
        );
      }
    }
  }
  for (const projectionId of usedProjectionIds) {
    const projection = projections.get(projectionId);
    let isolated;
    try {
      isolated = isolatedClone(repoRoot, exactHead);
      const [program, ...args] = projection.command ?? [];
      const result =
        typeof program === 'string' && program.length > 0
          ? run(program, args, { cwd: isolated.checkout })
          : { status: 1, stdout: '', stderr: 'projection command is empty' };
      if (result.status !== 0) {
        findings.push(
          finding(
            'REVIEW_ENVELOPE_PROJECTION_DRIFT',
            'admitted projection is not reproducible at the envelope head',
            {
              projection_id: projectionId,
              exit_code: result.status ?? 1,
              stdout: result.stdout,
              stderr: result.stderr,
            },
          ),
        );
      }
    } catch (error) {
      findings.push(
        finding(
          'REVIEW_ENVELOPE_PROJECTION_DRIFT',
          'admitted projection could not be verified in an isolated candidate clone',
          { projection_id: projectionId, error: String(error) },
        ),
      );
    } finally {
      if (isolated !== undefined) rmSync(isolated.temporary, { recursive: true, force: true });
    }
  }
  if (reviewCommits !== 1) {
    findings.push(
      finding(
        'REVIEW_RECORD_CARDINALITY',
        'review envelope requires exactly one review-record commit',
      ),
    );
  }
  emit({
    ok: findings.length === 0,
    command: 'envelope',
    reviewed_sha: reviewedSha,
    head: exactHead,
    findings,
  });
}

function lastPathCommit(root, revision, path) {
  const result = gitResult(root, ['log', '-1', '--format=%H', revision, '--', path]);
  return result.status === 0 ? result.stdout.trim() : '';
}

function commitTree(root, tree, parents, message, author) {
  return git(root, ['commit-tree', tree, ...parents.flatMap((parent) => ['-p', parent])], {
    input: `${message}\n`,
    env: {
      GIT_AUTHOR_NAME: author,
      GIT_AUTHOR_EMAIL: 'aarusso@nyxk.com.br',
      GIT_COMMITTER_NAME: author,
      GIT_COMMITTER_EMAIL: 'aarusso@nyxk.com.br',
      GIT_AUTHOR_DATE: '2000-01-01T00:00:00Z',
      GIT_COMMITTER_DATE: '2000-01-01T00:00:00Z',
    },
  });
}

function schemaAccepts(root, schemaPath, value) {
  try {
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const commonPath = join(root, 'law/schemas/common-defs.schema.json');
    if (existsSync(commonPath)) ajv.addSchema(readJson(commonPath));
    return ajv.compile(readJson(join(root, schemaPath)))(value) === true;
  } catch {
    return false;
  }
}

function performRehearsal(policy, round, base, candidate, findings) {
  let isolated;
  try {
    isolated = isolatedClone(repoRoot, candidate);
  } catch (error) {
    findings.push(finding('CANDIDATE_CLONE_FAILED', String(error)));
    return null;
  }
  try {
    const schemaPath = policy.rehearsal.schema_path;
    const verbPath = policy.rehearsal.verb_path;
    for (const [path, label] of [
      [schemaPath, 'closure schema'],
      [verbPath, 'closure verb'],
    ]) {
      if (gitResult(isolated.checkout, ['cat-file', '-e', `${candidate}:${path}`]).status !== 0) {
        findings.push(
          finding('CLOSURE_PREREQUISITE_MISSING', `${label} absent from candidate`, { path }),
        );
      }
    }
    if (findings.length > 0) return null;

    for (const argv of policy.rehearsal.prepare ?? []) {
      const [program, ...args] = argv;
      const prepared = run(program, args, { cwd: isolated.checkout });
      if (prepared.status !== 0) {
        findings.push(
          finding(
            'CLOSURE_REHEARSAL_PREPARE_FAILED',
            `rehearsal prepare failed: ${argv.join(' ')}`,
            {
              exit_code: prepared.status ?? 1,
              stdout: prepared.stdout,
              stderr: prepared.stderr,
            },
          ),
        );
        return null;
      }
    }

    const tree = git(isolated.checkout, ['rev-parse', `${candidate}^{tree}`]);
    const sourceMerge = commitTree(
      isolated.checkout,
      tree,
      [base, candidate],
      `${round} non-standing source merge rehearsal`,
      'DEVAI Architect',
    );
    const draft = {
      round_id: `${round}-rehearsal`,
      title: 'Non-standing entry-control closure rehearsal',
      // Synthetic non-standing draft. The decision identities are read from the
      // governing policy rather than pinned to literals, so no control source names
      // a decision id.
      declaring_decision: policy.rehearsal?.declaring_decision ?? policy.decision_id,
      closing_decision: policy.rehearsal?.closing_decision ?? policy.decision_id,
      batches: [
        {
          id: 'entry-control-rehearsal',
          roles: ['Architect'],
          commit: candidate,
          headline: 'Non-standing exact candidate input',
        },
      ],
      gates: { rehearsal: { status: 'pass', detail: 'isolated candidate-only execution' } },
      source_repo_deleted: false,
      validation_criteria: [
        {
          criterion: 'production closure verb and exact Machine-only range',
          verdict: 'pass',
          evidence: 'non-standing isolated rehearsal',
        },
      ],
      closed_at: '2000-01-01T00:00:00.000Z',
      merged_as: sourceMerge,
      release_disposition: 'none-preratification',
    };
    const [program, ...args] = policy.rehearsal.command ?? [];
    const closure =
      typeof program === 'string' && program.length > 0
        ? run(
            program,
            [
              ...args,
              '--repo-root',
              isolated.checkout,
              '--stdin',
              '--as-role',
              'auditor',
              '--write',
            ],
            { cwd: isolated.checkout, input: `${JSON.stringify(draft)}\n` },
          )
        : { status: 1, stdout: '', stderr: 'rehearsal command is empty' };
    if (closure.status !== 0) {
      findings.push(
        finding('CLOSURE_REHEARSAL_VERB_FAILED', 'production phase-close command failed', {
          exit_code: closure.status ?? 1,
          stdout: closure.stdout,
          stderr: closure.stderr,
        }),
      );
      return null;
    }
    let emitted;
    try {
      emitted = JSON.parse(closure.stdout);
    } catch (error) {
      findings.push(finding('CLOSURE_REHEARSAL_VERB_FAILED', `invalid verb output: ${error}`));
      return null;
    }
    const absoluteRecordPath = resolve(isolated.checkout, emitted.path ?? '');
    const recordPath = relative(isolated.checkout, absoluteRecordPath);
    if (
      emitted?.ok !== true ||
      !matches(
        recordPath,
        policy.rehearsal.closure_path_glob ?? policy.rehearsal.closure_path ?? '',
      ) ||
      recordPath.startsWith('..') ||
      !existsSync(absoluteRecordPath) ||
      canonical(readJson(absoluteRecordPath)) !== canonical(emitted.record)
    ) {
      findings.push(
        finding('CLOSURE_REHEARSAL_VERB_FAILED', 'verb did not emit one canonical closure record'),
      );
      return null;
    }
    const recordSchemaValid = schemaAccepts(isolated.checkout, schemaPath, emitted.record);
    if (!recordSchemaValid) {
      findings.push(
        finding('CLOSURE_REHEARSAL_SCHEMA_INVALID', 'production record failed closure schema'),
      );
      return null;
    }

    const indexPath = join(isolated.temporary, 'closure.index');
    git(isolated.checkout, ['read-tree', sourceMerge], { env: { GIT_INDEX_FILE: indexPath } });
    const blob = git(isolated.checkout, ['hash-object', '-w', '--stdin'], {
      input: readFileSync(absoluteRecordPath),
    });
    git(isolated.checkout, ['update-index', '--add', '--cacheinfo', '100644', blob, recordPath], {
      env: { GIT_INDEX_FILE: indexPath },
    });
    const closureTree = git(isolated.checkout, ['write-tree'], {
      env: { GIT_INDEX_FILE: indexPath },
    });
    const closureHead = commitTree(
      isolated.checkout,
      closureTree,
      [sourceMerge],
      `${round} non-standing closure-only rehearsal`,
      'DEVAI Machine',
    );
    const closurePaths = git(isolated.checkout, [
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '-r',
      closureHead,
    ])
      .split('\n')
      .filter(Boolean);
    const exactPath =
      closurePaths.length === 1 &&
      closurePaths[0] === recordPath &&
      matches(
        recordPath,
        policy.rehearsal.closure_path_glob ?? policy.rehearsal.closure_path ?? '',
      );
    let exactRangeValid =
      exactPath &&
      git(isolated.checkout, ['show', '-s', '--format=%an', closureHead]) === 'DEVAI Machine';
    const rangeCommand = policy.rehearsal.range_check ?? [];
    if (exactRangeValid && rangeCommand.length > 0) {
      const [rangeProgram, ...rangeArgs] = rangeCommand;
      const checked = run(
        rangeProgram,
        [
          ...rangeArgs,
          '--repo-root',
          isolated.checkout,
          '--base',
          sourceMerge,
          '--head',
          closureHead,
          '--json',
        ],
        { cwd: isolated.checkout },
      );
      let checkedOutput = null;
      try {
        checkedOutput = JSON.parse(checked.stdout);
      } catch {
        // The failed exact-range result is reported below.
      }
      exactRangeValid =
        checked.status === 0 &&
        checkedOutput?.ok === true &&
        checkedOutput?.commits_checked === 1 &&
        checkedOutput?.base === sourceMerge &&
        checkedOutput?.head === closureHead;
      if (!exactRangeValid) {
        findings.push(
          finding('CLOSURE_REHEARSAL_RANGE_INVALID', 'production sequencing rejected exact range', {
            exit_code: checked.status ?? 1,
            stdout: checked.stdout,
            stderr: checked.stderr,
          }),
        );
      }
    }
    if (!exactRangeValid) {
      findings.push(
        finding('CLOSURE_REHEARSAL_NOT_PC_ONLY', 'rehearsal range is not one Machine PC path'),
      );
    }
    const result = {
      source_merge: sourceMerge,
      closure_head: closureHead,
      schema_ancestor: lastPathCommit(isolated.checkout, candidate, schemaPath),
      verb_ancestor: lastPathCommit(isolated.checkout, candidate, verbPath),
      production_verb_exercised: true,
      record_schema_valid: recordSchemaValid,
      exact_range_valid: exactRangeValid,
      ok: findings.length === 0,
    };
    return result;
  } finally {
    rmSync(isolated.temporary, { recursive: true, force: true });
  }
}

function rehearse() {
  const findings = [];
  const policy = loadPolicy(findings);
  if (policy === null) return emit({ ok: false, command: 'rehearse', findings });
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const candidate = option('--candidate') ?? '';
  const declared = declaredBase(repoRoot, policy, candidate, findings);
  if (base !== declared) {
    findings.push(
      finding('CANDIDATE_RANGE_MISMATCH', 'rehearsal base differs from declaration', {
        expected: declared,
        actual: base,
      }),
    );
  }
  const result = performRehearsal(policy, round, base, candidate, findings);
  const ok = findings.length === 0 && result?.ok === true;
  if (ok) writeState(repoRoot, round, 'closure-rehearsal.json', { ok, base, candidate, result });
  emit({ ok, command: 'rehearse', result, findings });
}

function validateDocument(value, schemaFile, findings, code, label) {
  try {
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    const readSchema = (path) =>
      candidateBoundRevision === null
        ? readJson(join(repoRoot, path))
        : JSON.parse(candidateFile(repoRoot, candidateBoundRevision, path));
    const commonPath = 'law/schemas/common-defs.schema.json';
    try {
      ajv.addSchema(readSchema(commonPath));
    } catch {
      // Schemas that predate common definitions remain valid without the optional registry.
    }
    const validate = ajv.compile(readSchema(schemaFile));
    if (!validate(value)) {
      findings.push(
        finding(code, `${label} failed schema validation`, { errors: validate.errors }),
      );
      return false;
    }
    return true;
  } catch (error) {
    findings.push(finding(code, `${label} could not be validated: ${String(error)}`));
    return false;
  }
}

function v3ProfilePath(policy, round) {
  return String(policy?.profile_discovery?.path_template ?? '').replaceAll('{round}', round);
}

function loadV3Context(round, findings) {
  const policy = loadPolicy(findings);
  if (policy === null) return null;
  if (!['3.0.0', '4.0.0', '5.0.0'].includes(policy.schemaVersion)) {
    findings.push(
      finding('POLICY_VERSION_INVALID', 'generic close controls require policy v3, v4, or v5'),
    );
    return null;
  }
  if (!new RegExp(policy.profile_discovery?.round_pattern ?? '^$').test(round)) {
    findings.push(
      finding('ROUND_INVALID', 'round must match the configured round pattern', { round }),
    );
    return null;
  }
  const profilePath = v3ProfilePath(policy, round);
  let profile;
  try {
    profile = readJson(join(repoRoot, profilePath));
  } catch (error) {
    findings.push(
      finding('ROUND_PROFILE_INVALID', `round profile is unavailable: ${String(error)}`, {
        path: profilePath,
      }),
    );
    return null;
  }
  validateDocument(
    profile,
    policy.schemas.round_profile,
    findings,
    'ROUND_PROFILE_INVALID',
    'round profile',
  );
  if (profile.round !== round || profile.policy_version !== policy.policy_version) {
    findings.push(
      finding(
        'ROUND_PROFILE_IDENTITY_INVALID',
        'round profile identity does not match policy invocation',
        {
          expected_round: round,
          actual_round: profile.round,
        },
      ),
    );
  }
  const documents = {};
  for (const [key, schemaKey] of [
    ['graph', 'affected_test_graph'],
    ['obligations', 'semantic_obligations'],
    ['claims', 'current_claims'],
  ]) {
    const sourceKey =
      key === 'graph' ? 'affected_test_graph' : key === 'claims' ? 'current_claims' : key;
    const path = profile.sources?.[sourceKey];
    try {
      documents[key] = readJson(join(repoRoot, path));
      validateDocument(
        documents[key],
        policy.schemas[schemaKey],
        findings,
        `${key.toUpperCase()}_INVALID`,
        key,
      );
      if (documents[key].round !== round) {
        findings.push(
          finding(`${key.toUpperCase()}_ROUND_INVALID`, `${key} round differs from profile`, {
            path,
          }),
        );
      }
    } catch (error) {
      findings.push(
        finding(`${key.toUpperCase()}_INVALID`, `${key} is unavailable: ${String(error)}`, {
          path,
        }),
      );
    }
  }
  if (documents.graph !== undefined) {
    const ids = documents.graph.nodes.map((node) => node.id);
    const idSet = new Set(ids);
    if (idSet.size !== ids.length)
      findings.push(finding('GRAPH_NODE_DUPLICATED', 'graph node IDs must be unique'));
    for (const node of documents.graph.nodes) {
      for (const dependency of node.depends_on ?? []) {
        if (!idSet.has(dependency))
          findings.push(
            finding('GRAPH_DEPENDENCY_UNKNOWN', 'graph dependency is unknown', {
              node: node.id,
              dependency,
            }),
          );
      }
    }
    if (documents.graph.authoritative_gates !== undefined) {
      const graphGates = documents.graph.authoritative_gates.map(({ gate_id }) => gate_id).sort();
      const policyGates = (policy.convergence?.commands ?? []).map(({ id }) => id).sort();
      if (canonical(graphGates) !== canonical(policyGates))
        findings.push(
          finding(
            'GRAPH_AUTHORITATIVE_GATE_POPULATION_INCOMPLETE',
            'graph authoritative-gate census must equal the policy command population',
          ),
        );
    }
  }
  return {
    policy,
    profile,
    profilePath,
    graph: documents.graph,
    obligations: documents.obligations,
    claims: documents.claims,
    digests: {
      policy: sha256(canonical(policy)),
      profile: sha256(canonical(profile)),
      graph:
        documents.graph === undefined ? sha256('MISSING\n') : sha256(canonical(documents.graph)),
      obligations:
        documents.obligations === undefined
          ? sha256('MISSING\n')
          : sha256(canonical(documents.obligations)),
      claims:
        documents.claims === undefined ? sha256('MISSING\n') : sha256(canonical(documents.claims)),
    },
  };
}

function expandBraceSelectors(selector) {
  const match = /\{([^{}]+)\}/u.exec(selector);
  if (match === null) return [selector];
  return match[1]
    .split(',')
    .flatMap((choice) =>
      expandBraceSelectors(
        `${selector.slice(0, match.index)}${choice}${selector.slice(match.index + match[0].length)}`,
      ),
    );
}

function selectorMatches(path, selector) {
  return expandBraceSelectors(selector).some((expanded) => matches(path, expanded));
}

function selectorsMatch(path, selectors) {
  return (selectors ?? []).some((selector) => selectorMatches(path, selector));
}

function v3Remote(policy) {
  return (policy.freshness.remote_environment_indicators ?? []).some((name) => {
    const value = String(process.env[name] ?? '').toLowerCase();
    return value !== '' && value !== '0' && value !== 'false';
  });
}

function reviewerBindingFindings(context) {
  const findings = [];
  const reviewer = context.profile.reviewer;
  if (reviewer?.fallback !== 'forbidden') {
    findings.push(
      finding('REVIEWER_FALLBACK_FORBIDDEN', 'reviewer fallback must remain forbidden'),
    );
  }
  if (reviewer?.mandate_id === null || reviewer?.model_selector === null) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_UNBOUND',
        'round reviewer is not yet bound by an Owner mandate',
      ),
    );
    return findings;
  }
  const mandatesRoot = join(repoRoot, 'product/owner-mandates');
  const mandatePaths = existsSync(mandatesRoot)
    ? readdirSync(mandatesRoot)
        .filter((name) => /^OM-[0-9]+\.md$/u.test(name))
        .sort()
    : [];
  const parseFields = (source) => {
    const fields = {};
    for (const line of source.split('\n')) {
      const match = /^([a-z_]+):\s*([^#]*?)\s*$/u.exec(line);
      if (match !== null && fields[match[1]] === undefined) fields[match[1]] = match[2];
    }
    return fields;
  };
  const census = mandatePaths.map((name) => {
    const source = readFileSync(join(mandatesRoot, name), 'utf8');
    return {
      mandate_id: name.slice(0, -3),
      source,
      fields: parseFields(source),
    };
  });
  const activeOwner = census.filter(
    ({ fields }) => fields.status === 'active' && fields.authority === 'Owner',
  );
  const relevant = activeOwner.filter(
    ({ fields, source }) =>
      fields.round === context.profile.round || source.includes(context.profile.round),
  );
  const selected = census.find(({ mandate_id }) => mandate_id === reviewer.mandate_id);
  if (selected === undefined) {
    findings.push(
      finding('ENTRY_BLOCKED_REVIEWER_BINDING_INVALID', 'reviewer mandate is missing', {
        mandate_id: reviewer.mandate_id,
      }),
    );
  } else if (selected.fields.status !== 'active' || selected.fields.authority !== 'Owner') {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_INACTIVE',
        'reviewer mandate is not one active Owner mandate',
      ),
    );
  }
  if (relevant.length > 1) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS',
        'more than one active Owner mandate references the round reviewer binding',
        { mandate_ids: relevant.map(({ mandate_id }) => mandate_id) },
      ),
    );
  }
  if (
    selected === undefined ||
    selected.fields.round !== context.profile.round ||
    selected.fields.model_selector !== reviewer.model_selector ||
    selected.fields.role !== 'independent-read-only' ||
    selected.fields.semantic_census !== 'complete' ||
    selected.fields.substantive_cycles !== '2' ||
    selected.fields.transport_retries !== '1' ||
    selected.fields.fallback !== 'forbidden'
  ) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_CONFLICT',
        'reviewer mandate does not bind the exact round and model',
      ),
    );
  }
  if (
    relevant.some(({ fields }) => fields.fallback !== undefined && fields.fallback !== 'forbidden')
  ) {
    findings.push(
      finding('REVIEWER_FALLBACK_FORBIDDEN', 'an active round binding permits reviewer fallback'),
    );
  }
  return findings;
}

function policyCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const phase = option('--phase') ?? 'pre-entry-preparation';
  const context = loadV3Context(round, findings);
  if (context !== null) {
    if (phase !== 'pre-entry-preparation' && phase !== context.profile.phase) {
      findings.push(
        finding('ROUND_PHASE_INVALID', 'requested phase differs from the round profile', {
          phase,
          profile_phase: context.profile.phase,
        }),
      );
    }
    if (!existsSync(mirrorPath) || !readFileSync(policyPath).equals(readFileSync(mirrorPath))) {
      findings.push(
        finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
      );
    }
  }
  const binding = context === null ? [] : reviewerBindingFindings(context);
  const diagnostics = binding.filter(({ code }) => code === 'ENTRY_BLOCKED_REVIEWER_UNBOUND');
  const bindingErrors = binding.filter(({ code }) => code !== 'ENTRY_BLOCKED_REVIEWER_UNBOUND');
  findings.push(...bindingErrors);
  emit({
    ok: findings.length === 0,
    command: 'policy-check',
    round,
    phase,
    entry_ready: binding.length === 0,
    diagnostics,
    findings,
  });
}

function materializeV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV3Context(round, findings);
  if (context !== null && findings.length === 0) {
    mkdirSync(dirname(mirrorPath), { recursive: true });
    const temporary = `${mirrorPath}.tmp-${String(process.pid)}`;
    writeFileSync(temporary, readFileSync(policyPath));
    renameSync(temporary, mirrorPath);
  }
  emit({
    ok: findings.length === 0,
    command: 'materialize',
    round,
    output: relative(repoRoot, mirrorPath),
    findings,
  });
}

function entryCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV3Context(round, findings);
  if (context !== null) findings.push(...reviewerBindingFindings(context));
  emit({
    ok: findings.length === 0,
    command: 'entry-check',
    round,
    entry_ready: entryReadinessV9(context, null, findings).entry_ready,
    findings,
  });
}

function committedChangeRecords(base, head, findings) {
  try {
    const bytes = gitBytes(repoRoot, [
      'diff',
      '--name-status',
      '-z',
      '-M',
      '--find-renames',
      base,
      head,
    ]);
    const fields = bytes.toString('utf8').split('\0').filter(Boolean);
    const records = [];
    for (let index = 0; index < fields.length;) {
      const status = fields[index++];
      if (!/^(?:A|C[0-9]+|D|M|R[0-9]+|T|U|X|B)$/u.test(status)) {
        findings.push(
          finding('COMMITTED_CHANGE_RECORD_INVALID', 'committed change status is malformed', {
            status,
          }),
        );
        return null;
      }
      if (/^[RC]/u.test(status)) {
        const preimage = fields[index++];
        const postimage = fields[index++];
        if (!preimage || !postimage) {
          findings.push(
            finding('COMMITTED_CHANGE_RECORD_INVALID', 'rename/copy record lacks both paths', {
              status,
            }),
          );
          return null;
        }
        records.push({
          record_id: sha256(canonical({ status, preimage, postimage })),
          status,
          preimage,
          postimage,
          paths: [preimage, postimage],
        });
      } else {
        const path = fields[index++];
        if (!path) {
          findings.push(
            finding('COMMITTED_CHANGE_RECORD_INVALID', 'change record lacks its path', { status }),
          );
          return null;
        }
        records.push({
          record_id: sha256(canonical({ status, path })),
          status,
          preimage: status === 'A' ? null : path,
          postimage: status === 'D' ? null : path,
          paths: [path],
        });
      }
    }
    return records;
  } catch (error) {
    findings.push(finding('COMMITTED_CHANGE_RECORD_INVALID', String(error), { base, head }));
    return null;
  }
}

function statusAwareChangedPaths(base, head) {
  const localFindings = [];
  const records = committedChangeRecords(base, head, localFindings);
  if (records === null || localFindings.length > 0) {
    throw new Error(localFindings.map(({ code, message }) => `${code}: ${message}`).join('; '));
  }
  return [...new Set(records.flatMap(({ paths }) => paths))].sort();
}

function changedPathPopulation(base, head, findings) {
  try {
    const exactBase = git(repoRoot, ['rev-parse', base]);
    const worktreeMode = head === 'WORKTREE';
    const exactHead = git(repoRoot, ['rev-parse', worktreeMode ? 'HEAD' : head]);
    const committedRecords = committedChangeRecords(exactBase, exactHead, findings);
    if (committedRecords === null) return null;
    const committed = committedRecords.flatMap(({ paths }) => paths);
    const changedWithStatus = (args) => {
      const fields = nulPaths(gitResult(repoRoot, ['diff', '--name-status', '-z', ...args]));
      const paths = [];
      for (let index = 0; index < fields.length;) {
        const status = fields[index++];
        if (/^[RC]/u.test(status)) paths.push(fields[index++], fields[index++]);
        else paths.push(fields[index++]);
      }
      return paths.filter(Boolean);
    };
    const worktree = worktreeMode
      ? [
          ...changedWithStatus([]),
          ...changedWithStatus(['--cached']),
          ...nulPaths(gitResult(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z'])),
        ]
      : [];
    return {
      exactBase,
      exactHead,
      worktreeMode,
      committedRecords,
      paths: [...new Set([...committed, ...worktree])].sort(),
    };
  } catch (error) {
    findings.push(finding('IMPACT_RANGE_INVALID', String(error), { base, head }));
    return null;
  }
}

function topologicalNodes(graph, findings) {
  const byId = new Map((graph?.nodes ?? []).map((node) => [node.id, node]));
  const visiting = new Set();
  const visited = new Set();
  const ordered = [];
  const visit = (id) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      findings.push(finding('GRAPH_CYCLE', 'affected-test graph must be acyclic', { node: id }));
      return;
    }
    const node = byId.get(id);
    if (node === undefined) return;
    visiting.add(id);
    for (const dependency of node.depends_on ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(node);
  };
  for (const node of graph?.nodes ?? []) visit(node.id);
  return ordered;
}

/**
 * Loader classification by binding flow rather than specimen matching.
 *
 * A file is ambiguous when it can reach a module loader through a value this analysis
 * cannot prove constant. Identifiers are tainted from any initializer that names a
 * loader, taint propagates transitively through further bindings, and a call of a
 * tainted identifier, a call through a computed member, or a loader call with a
 * non-literal argument all widen. Anything not proved safe widens; the cost of a false
 * widen is a longer run, the cost of a false narrow is an untested change.
 */
function hasAmbiguousLoaderV6(source) {
  if (/\beval\s*\(/u.test(source)) return true;

  const literalArgument = (argument) => {
    const value = String(argument ?? '').trim();
    return (
      /^'(?:[^'\\]|\\.)*'$/u.test(value) ||
      /^"(?:[^"\\]|\\.)*"$/u.test(value) ||
      (/^`(?:[^`\\]|\\.)*`$/u.test(value) && !value.includes('${'))
    );
  };

  // A call through a computed member on any object cannot be proved constant here.
  if (/[\w$)\]]\s*\[[^\]\n]+\]\s*\(/u.test(source)) return true;

  // Seeds: an initializer that names a loader, however it is reached.
  const loaderSeed =
    /\brequire\b|\bcreateRequire\b|\bimport\s*\.\s*meta\s*\.\s*resolve\b|\bprocess\s*\.\s*mainModule\b|\[\s*['"](?:require|resolve|createRequire)['"]\s*\]/u;

  const tainted = new Set();
  const bindings = [];
  for (const match of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/gu))
    bindings.push({ name: match[1], initializer: match[2] });
  // Destructured loader bindings, from any source object.
  for (const match of source.matchAll(
    /\b(?:const|let|var)\s*\{\s*(?:require|createRequire)\s*(?::\s*([A-Za-z_$][\w$]*)\s*)?\}\s*=\s*([^;\n]+)/gu,
  ))
    tainted.add(match[1] ?? 'require');

  for (const { name, initializer } of bindings) if (loaderSeed.test(initializer)) tainted.add(name);

  // Propagate transitively: a binding initialised from a tainted identifier is tainted.
  for (let pass = 0; pass < bindings.length + 1; pass += 1) {
    let changed = false;
    for (const { name, initializer } of bindings) {
      if (tainted.has(name)) continue;
      for (const candidate of tainted)
        if (new RegExp(`\\b${candidate}\\b`, 'u').test(initializer)) {
          tainted.add(name);
          changed = true;
          break;
        }
    }
    if (!changed) break;
  }

  // A call of any tainted identifier widens unless every argument is a literal.
  for (const name of tainted) {
    const call = new RegExp(`\\b${name}\\s*(?:\\?\\.)?\\s*\\(([^)]*)\\)`, 'gu');
    for (const match of source.matchAll(call)) if (!literalArgument(match[1])) return true;
    // Applied, bound or reflected invocation cannot be proved constant.
    if (new RegExp(`\\b${name}\\s*\\.\\s*(?:apply|call|bind)\\s*\\(`, 'u').test(source))
      return true;
    if (new RegExp(`\\bReflect\\s*\\.\\s*apply\\s*\\(\\s*${name}\\b`, 'u').test(source))
      return true;
  }

  // Direct loader forms, including the sequence-expression and optional-call spellings.
  if (/\(\s*0\s*,\s*(?:[\w$]+\s*\.\s*)*require\s*\)\s*\(/u.test(source)) return true;
  if (/\brequire\s*\?\.\s*\(/u.test(source)) return true;
  if (/\bReflect\s*\.\s*apply\s*\(\s*(?:[\w$]+\s*\.\s*)*require\b/u.test(source)) return true;
  if (/\b(?:[\w$]+\s*\.\s*)*require\s*\.\s*(?:apply|call|bind)\s*\(/u.test(source)) return true;

  const families = [
    /\bimport\s*\(([^)]*)\)/gu,
    /(?:^|[^.\w$])require\s*\(([^)]*)\)/gu,
    /\brequire\s*\.\s*resolve\s*\(([^)]*)\)/gu,
    /\bimport\s*\.\s*meta\s*\.\s*resolve\s*\(([^)]*)\)/gu,
    /\bcreateRequire\s*\(([^)]*)\)/gu,
    /\b[\w$]+\s*\.\s*require\s*\(([^)]*)\)/gu,
  ];
  for (const expression of families)
    for (const match of source.matchAll(expression)) if (!literalArgument(match[1])) return true;
  return false;
}

function v3InputEntries(selectors) {
  const expanded = [...new Set((selectors ?? []).flatMap(expandBraceSelectors))];
  return worktreeInputEntries(repoRoot, expanded).map((entry) => ({
    source: entry.path,
    present: entry.kind !== 'deleted',
    digest: entry.kind === 'deleted' ? null : entry.digest,
  }));
}

function v3OutputState(specs) {
  const expanded = [...new Set((specs ?? []).flatMap(expandBraceSelectors))];
  const current = outputEntries(repoRoot, expanded);
  return {
    missing: current.missing,
    outputs: [
      ...current.outputs.map((entry) => ({
        path: entry.path,
        present: true,
        digest: entry.digest,
      })),
      ...current.missing.map((path) => ({ path, present: false, digest: null })),
    ].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function v3CachePath(context, taskId, taskKey) {
  return join(
    repoRoot,
    context.profile.runtime.state_root,
    'freshness',
    'tasks',
    taskId,
    `${taskKey}.json`,
  );
}

function v3ReadCache(context, expected, findings) {
  const path = v3CachePath(context, expected.task_id, expected.task_key);
  if (!existsSync(path)) return null;
  try {
    const value = readJson(path);
    if (
      !validateDocument(value, context.policy.schemas.task_freshness, [], 'CACHE_INVALID', 'cache')
    )
      throw new Error('cache schema is invalid');
    const { result_digest: claimed, ...body } = value;
    if (claimed !== sha256(canonical(body)) || value.result !== 'EXECUTED_PASS')
      throw new Error('cache digest or PASS result is invalid');
    for (const key of [
      'round',
      'task_id',
      'task_key',
      'gate_freshness_profile_digest',
      'input_manifest',
      'argv',
      'cwd',
      'input_manifest_digest',
      'dependency_input_manifest',
      'dependency_keys',
      'dependency_results',
      'policy_digest',
      'graph_digest',
      'toolchain_digest',
      'toolchain_manifest',
      'environment_digest',
      'environment_manifest',
      'output_contract',
      'producing_candidate',
    ]) {
      if (canonical(value[key]) !== canonical(expected[key]))
        throw new Error(`cache field ${key} does not match the planned task`);
    }
    return value;
  } catch (error) {
    findings.push(
      finding('CACHE_RECORD_IDENTITY_INVALID', 'cached PASS does not bind exact task identity', {
        task_id: expected.task_id,
        detail: String(error),
      }),
    );
    return null;
  }
}

function v3WriteCache(context, taskId, taskKey, value) {
  const path = v3CachePath(context, taskId, taskKey);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${String(process.pid)}`;
  writeFileSync(temporary, canonical(value));
  renameSync(temporary, path);
}

function buildImpactPlan(context, base, head, findings) {
  const range = changedPathPopulation(base, head, findings);
  if (range === null || context.graph === undefined) return null;
  const remote = v3Remote(context.policy);
  const ordered = topologicalNodes(context.graph, findings);
  const selected = new Map();
  const select = (id, code, paths = [], fallback = null) => {
    const current = selected.get(id) ?? { reasons: new Set(), paths: new Set(), fallback };
    current.reasons.add(code);
    for (const path of paths) current.paths.add(path);
    if (fallback !== null) current.fallback = fallback;
    selected.set(id, current);
  };
  if (remote) {
    for (const node of ordered) select(node.id, 'REMOTE_FULL');
  } else {
    if (range.worktreeMode && range.paths.length > 0) {
      select(
        context.graph.fallbacks.incomplete_population,
        'WORKTREE_POPULATION_UNFROZEN',
        range.paths,
        context.graph.fallbacks.incomplete_population,
      );
      select(context.graph.coverage.node, 'COVERAGE_RELEVANT_CHANGE', range.paths);
    }
    for (const shared of context.graph.shared_inputs ?? []) {
      const paths = range.paths.filter((path) => selectorsMatch(path, shared.selectors));
      if (paths.length > 0)
        for (const id of shared.invalidates ?? []) select(id, 'SHARED_INPUT_CHANGED', paths);
    }
    for (const node of ordered) {
      // Fallback nodes describe the complete population that must execute when
      // precision is impossible. Their broad input selectors participate in
      // freshness keys, but are not ordinary impact edges: treating them as
      // such would widen every narrow source or test change to the full suite.
      if (node.kind === 'fallback') continue;
      const paths = range.paths.filter((path) => selectorsMatch(path, node.input_selectors));
      if (paths.length > 0)
        select(
          node.id,
          node.kind === 'test-shard' ? 'AFFECTED_INPUT_CHANGED' : 'GATE_INPUT_CHANGED',
          paths,
        );
    }
    const unknown = range.paths.filter(
      (path) =>
        !ordered.some(
          (node) => node.kind !== 'fallback' && selectorsMatch(path, node.input_selectors),
        ) &&
        !(context.graph.shared_inputs ?? []).some((shared) =>
          selectorsMatch(path, shared.selectors),
        ),
    );
    if (unknown.length > 0) {
      select(
        context.graph.fallbacks.unknown_dependency,
        'UNKNOWN_DEPENDENCY',
        unknown,
        context.graph.fallbacks.unknown_dependency,
      );
      select(
        context.graph.coverage.node,
        'UNKNOWN_DEPENDENCY',
        unknown,
        context.graph.coverage.node,
      );
    }
    const dynamic = new Set();
    const inspectObject = (revision, path) => {
      if (path === null) return;
      try {
        if (hasAmbiguousLoaderV6(candidateFile(repoRoot, revision, path))) dynamic.add(path);
      } catch {
        // Non-text and absent objects are covered by graph ownership and unknown fallback.
      }
    };
    for (const record of range.committedRecords) {
      inspectObject(range.exactBase, record.preimage);
      inspectObject(range.exactHead, record.postimage);
    }
    if (range.worktreeMode)
      for (const path of range.paths) {
        const absolute = join(repoRoot, path);
        if (existsSync(absolute)) {
          try {
            if (hasAmbiguousLoaderV6(readFileSync(absolute, 'utf8'))) dynamic.add(path);
          } catch {
            // The conservative ownership fallback handles unreadable worktree inputs.
          }
        }
      }
    if (dynamic.size > 0) {
      const dynamicPaths = [...dynamic].sort();
      select(
        context.graph.fallbacks.dynamic_import,
        'DYNAMIC_DEPENDENCY_AMBIGUOUS',
        dynamicPaths,
        context.graph.fallbacks.dynamic_import,
      );
      select(
        context.graph.coverage.node,
        'DYNAMIC_DEPENDENCY_AMBIGUOUS',
        dynamicPaths,
        context.graph.coverage.node,
      );
    }
    const coverageRelevant = range.paths.filter((path) =>
      selectorsMatch(path, [
        ...(context.graph.population.coverage_relevant ?? []),
        ...(context.graph.authoritative_gates === undefined
          ? []
          : [
              ...(context.graph.population.production ?? []),
              ...(context.graph.population.tests ?? []),
            ]),
      ]),
    );
    if (coverageRelevant.length > 0)
      select(context.graph.coverage.node, 'COVERAGE_RELEVANT_CHANGE', coverageRelevant);
  }
  const byId = new Map(ordered.map((node) => [node.id, node]));
  const includeDependencies = (id) => {
    for (const dependency of byId.get(id)?.depends_on ?? []) {
      if (!selected.has(dependency)) select(dependency, 'TRANSITIVE_DEPENDENCY');
      includeDependencies(dependency);
    }
  };
  for (const id of [...selected.keys()]) includeDependencies(id);

  const allProbeIds = (context.policy.freshness?.toolchain ?? []).map(({ id }) => id);
  const allEnvironmentIds = (context.policy.freshness?.environment_allowlist ?? []).map(
    ({ name }) => name,
  );
  const toolchainManifest = toolchainManifestV5(context.policy, allProbeIds, findings);
  const environmentManifest = environmentManifestV5(context.policy, allEnvironmentIds, findings);
  const toolchainDigest = sha256(canonical(toolchainManifest));
  const environmentDigest = sha256(canonical(environmentManifest));
  const planned = [];
  const plannedById = new Map();
  const resultKeys = new Map();
  for (const node of ordered) {
    const inputEntries = v3InputEntries([
      ...node.input_selectors,
      context.profilePath,
      context.profile.sources.affected_test_graph,
      'law/policy/round-close-controls.json',
    ]);
    const inputManifestDigest = sha256(canonical(inputEntries));
    const dependencyKeys = Object.fromEntries(
      (node.depends_on ?? [])
        .filter((id) => resultKeys.has(id))
        .map((id) => [id, resultKeys.get(id)]),
    );
    const outputState = v3OutputState(node.outputs ?? []);
    const dependencyInputManifest = [
      ...new Map(
        (node.depends_on ?? [])
          .flatMap((id) => plannedById.get(id)?.input_manifest ?? [])
          .map((entry) => [entry.source, entry]),
      ).values(),
    ].sort((left, right) => left.source.localeCompare(right.source));
    const outputContract = (node.outputs ?? []).length > 0 ? 'digest-required' : 'none';
    const gateFreshnessProfileDigest = sha256(
      canonical({
        node_id: node.id,
        input_selectors: node.input_selectors,
        dependencies: node.depends_on ?? [],
        toolchain_probe_ids: allProbeIds,
        environment_input_ids: allEnvironmentIds,
        output_contract: outputContract,
        required_outputs: node.outputs ?? [],
      }),
    );
    const keyBody = {
      task_id: node.id,
      argv: node.command,
      cwd: node.cwd,
      gate_freshness_profile_digest: gateFreshnessProfileDigest,
      input_manifest: inputEntries,
      input_manifest_digest: inputManifestDigest,
      dependency_input_manifest: dependencyInputManifest,
      dependency_keys: dependencyKeys,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      toolchain_digest: toolchainDigest,
      toolchain_manifest: toolchainManifest,
      environment_digest: environmentDigest,
      environment_manifest: environmentManifest,
      output_contract: outputContract,
      producing_candidate: range.exactHead,
    };
    const taskKey = sha256(canonical(keyBody));
    resultKeys.set(node.id, taskKey);
    const expectedCache = {
      round: context.profile.round,
      task_id: node.id,
      task_key: taskKey,
      argv: node.command,
      cwd: node.cwd,
      gate_freshness_profile_digest: gateFreshnessProfileDigest,
      input_manifest: inputEntries,
      input_manifest_digest: inputManifestDigest,
      dependency_input_manifest: dependencyInputManifest,
      dependency_keys: dependencyKeys,
      dependency_results: Object.fromEntries(
        (node.depends_on ?? [])
          .map((id) => [id, plannedById.get(id)])
          .filter(([, dependency]) => dependency?.outcome === 'REUSE_FRESH')
          .map(([id, dependency]) => [
            id,
            {
              task_key: dependency.task_key,
              result_digest: dependency.cache.result_digest,
              fresh_pass: true,
            },
          ]),
      ),
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      toolchain_digest: toolchainDigest,
      toolchain_manifest: toolchainManifest,
      environment_digest: environmentDigest,
      environment_manifest: environmentManifest,
      output_contract: outputContract,
      producing_candidate: range.exactHead,
    };
    const cache = remote ? null : v3ReadCache(context, expectedCache, findings);
    const outputsFresh =
      outputState.missing.length === 0 &&
      cache !== null &&
      canonical(cache.outputs ?? []) === canonical(outputState.outputs);
    const selection = selected.get(node.id);
    const dependenciesFresh = (node.depends_on ?? []).every(
      (id) => plannedById.get(id)?.outcome === 'REUSE_FRESH',
    );
    let outcome = 'BLOCKED';
    let reasonCodes = ['NO_FRESH_RESULT'];
    if (remote) {
      outcome = 'EXECUTE';
      reasonCodes = ['REMOTE_FULL'];
    } else if (cache !== null && outputsFresh && dependenciesFresh) {
      outcome = 'REUSE_FRESH';
      reasonCodes =
        selection === undefined
          ? ['UNCHANGED_FRESH_PASS']
          : [...selection.reasons, 'CONTENT_IDENTICAL_PASS'];
    } else if (selection !== undefined || cache !== null) {
      outcome = 'EXECUTE';
      reasonCodes = [
        ...(selection?.reasons ?? []),
        ...(dependenciesFresh ? [] : ['DEPENDENCY_PASS_STALE']),
      ];
      if (cache !== null && !outputsFresh) reasonCodes.push('OUTPUT_INVALIDATED');
    }
    const plannedNode = {
      node_id: node.id,
      outcome,
      reason_codes: [...new Set(reasonCodes)].sort(),
      changed_inputs: [...(selection?.paths ?? [])].sort(),
      task_key: taskKey,
      dependency_keys: dependencyKeys,
      dependency_results: expectedCache.dependency_results,
      fallback_population: selection?.fallback ?? null,
      argv: node.command,
      cwd: node.cwd,
      gate_freshness_profile_digest: gateFreshnessProfileDigest,
      input_manifest: inputEntries,
      outputs: outputState.outputs,
      input_manifest_digest: inputManifestDigest,
      dependency_input_manifest: dependencyInputManifest,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      toolchain_digest: toolchainDigest,
      toolchain_manifest: toolchainManifest,
      environment_digest: environmentDigest,
      environment_manifest: environmentManifest,
      output_contract: outputContract,
      cache,
    };
    planned.push(plannedNode);
    plannedById.set(node.id, plannedNode);
  }
  return { range, remote, nodes: planned };
}

function impactPlanV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactContextCandidate = git(repoRoot, [
    'rev-parse',
    `${head === WORKTREE_REVISION ? 'HEAD' : head}^{commit}`,
  ]);
  const context = ['4.0.0', '5.0.0'].includes(livePolicy?.schemaVersion)
    ? loadV4Context(round, findings, exactContextCandidate)
    : loadV3Context(round, findings);
  const plan = context === null ? null : buildImpactPlan(context, base, head, findings);
  const blockingFindings = findings.filter(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID');
  emit({
    ok: blockingFindings.length === 0 && plan !== null,
    command: 'impact-plan',
    round,
    base: plan?.range.exactBase ?? base,
    head: plan?.range.exactHead ?? head,
    remote: plan?.remote ?? false,
    cache_trusted: plan === null ? false : !plan.remote,
    nodes: (plan?.nodes ?? []).map(({ cache: _cache, ...node }) => node),
    findings,
  });
}

function executeCompleteGatePopulationV8(gates, runner) {
  return gates.map((gate, ordinal) => ({ gate_id: gate.id, ...runner(gate, ordinal) }));
}

function smartConvergeV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = option('--base') ?? '';
  const head = option('--head') ?? 'HEAD';
  const exactHead = git(repoRoot, ['rev-parse', head]);
  const exactBase = git(repoRoot, ['rev-parse', base]);
  const exactHeadBefore = git(repoRoot, ['rev-parse', 'HEAD']);
  if (exactHeadBefore !== exactHead)
    findings.push(finding('CONVERGENCE_HEAD_MISMATCH', 'checkout differs from requested head'));
  if (cleanStatus(repoRoot).length > 0)
    findings.push(finding('CONVERGENCE_DIRTY_TREE', 'smart convergence requires a clean worktree'));
  const context = ['4.0.0', '5.0.0'].includes(livePolicy?.schemaVersion)
    ? loadV4Context(round, findings, exactHead)
    : loadV3Context(round, findings);
  let roundDeclaration = null;
  if (['4.0.0', '5.0.0'].includes(context?.policy.schemaVersion)) {
    roundDeclaration = roundDeclarationV4(context, exactHead, findings);
    if (
      roundDeclaration === null ||
      roundDeclaration.declaration.exact_base !== exactBase ||
      gitResult(repoRoot, ['merge-base', '--is-ancestor', exactBase, exactHead]).status !== 0
    )
      findings.push(
        finding(
          'CONVERGENCE_DECLARATION_INVALID',
          'smart convergence requires the candidate-tree B0 decision and exact declared ancestor base',
        ),
      );
  }
  const passes = [];
  let executedTests = 0;
  let reusedTests = 0;
  const isBlocking = () => findings.some(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID');
  const executeAffected = (plan) => {
    const results = [];
    const passing = new Map();
    for (const item of plan.nodes) {
      const node = context.graph.nodes.find(({ id }) => id === item.node_id);
      if (item.outcome === 'BLOCKED') {
        results.push({
          ...item,
          cache: undefined,
          plan_outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: null,
        });
        continue;
      }
      const dependenciesPass = (node.depends_on ?? []).every((id) => passing.has(id));
      if (!dependenciesPass) {
        results.push({
          ...item,
          cache: undefined,
          plan_outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: null,
        });
        findings.push(
          finding('FRESHNESS_DEPENDENCY_BLOCKED', 'task dependency did not pass', {
            task_id: node.id,
          }),
        );
        continue;
      }
      if (item.outcome === 'REUSE_FRESH') {
        passing.set(node.id, item.cache);
        if (node.kind === 'test-shard' || node.id === context.graph.fallbacks.unknown_dependency)
          reusedTests += 1;
        results.push({
          ...item,
          cache: undefined,
          plan_outcome: 'REUSE_FRESH',
          result: 'REUSED_FRESH_PASS',
          exit_code: 0,
          reused_result_digest: item.cache.result_digest,
        });
        continue;
      }
      const [program, ...args] = node.command;
      const executed = run(program, args, { cwd: resolve(repoRoot, node.cwd) });
      const outputState = v3OutputState(node.outputs ?? []);
      const result =
        executed.status === 0 && outputState.missing.length === 0
          ? 'EXECUTED_PASS'
          : 'EXECUTED_FAIL';
      const dependencyResults = Object.fromEntries(
        (node.depends_on ?? []).map((id) => {
          const record = passing.get(id);
          return [
            id,
            { task_key: record.task_key, result_digest: record.result_digest, fresh_pass: true },
          ];
        }),
      );
      const body = {
        schemaVersion: context.policy.schemaVersion === '5.0.0' ? '3.0.0' : '2.0.0',
        policy_version: context.policy.freshness.policy_version,
        graph_version: context.graph.graph_version,
        round,
        task_id: node.id,
        plan_outcome: 'EXECUTE',
        reason_codes: item.reason_codes,
        changed_inputs: item.changed_inputs,
        fallback_population: item.fallback_population,
        argv: node.command,
        cwd: node.cwd,
        task_key: item.task_key,
        gate_freshness_profile_digest: item.gate_freshness_profile_digest,
        input_manifest: item.input_manifest,
        input_manifest_digest: item.input_manifest_digest,
        dependency_input_manifest: item.dependency_input_manifest,
        dependency_keys: item.dependency_keys,
        dependency_results: dependencyResults,
        policy_digest: item.policy_digest,
        graph_digest: item.graph_digest,
        toolchain_digest: item.toolchain_digest,
        toolchain_manifest: item.toolchain_manifest,
        environment_digest: item.environment_digest,
        environment_manifest: item.environment_manifest,
        producing_candidate: exactHead,
        result,
        exit_code: executed.status ?? 1,
        stdout_sha256: sha256(executed.stdout ?? ''),
        stderr_sha256: sha256(executed.stderr ?? ''),
        reused_result_digest: null,
        output_contract: item.output_contract,
        outputs: outputState.outputs,
        freshness_reason: 'executed for the exact content-addressed task key',
      };
      const record = { ...body, result_digest: sha256(canonical(body)) };
      if (result === 'EXECUTED_PASS') {
        v3WriteCache(context, node.id, item.task_key, record);
        passing.set(node.id, record);
      } else {
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', 'affected task failed', {
            task_id: node.id,
            exit_code: executed.status ?? 1,
            stderr: executed.stderr,
          }),
        );
      }
      if (node.kind === 'test-shard' || node.id === context.graph.fallbacks.unknown_dependency)
        executedTests += 1;
      results.push(record);
    }
    return results;
  };
  const executePolicyGates = () => {
    const results = [];
    const completePopulation = executeCompleteGatePopulationV8(
      context.policy.convergence?.commands ?? [],
      (gate) => ({ gate }),
    );
    for (const { gate } of completePopulation) {
      const argv = [...gate.argv];
      const gateProfile =
        context.policy.schemaVersion === '5.0.0'
          ? gateFreshnessProfileV5(context, gate, findings)
          : {
              gate_id: gate.id,
              input_selectors: context.policy.semantic_assertions?.population_sources ?? [],
              dependency_selectors: [
                context.profilePath,
                context.profile.sources.affected_test_graph,
              ],
              toolchain_probe_ids: (context.policy.freshness?.toolchain ?? []).map(({ id }) => id),
              environment_input_ids: (context.policy.freshness?.environment_allowlist ?? []).map(
                ({ name }) => name,
              ),
              output_contract: 'none',
              required_outputs: [],
            };
      if (gateProfile === null) {
        findings.push(
          finding(
            'GATE_FRESHNESS_PROFILE_INCOMPLETE',
            'authoritative gate has no resolvable freshness profile',
            { gate_id: gate.id },
          ),
        );
        results.push({
          node_id: gate.id,
          gate_id: gate.id,
          outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: 1,
          task_key: null,
          output_digest: null,
        });
        continue;
      }
      const inputManifest = rawCandidateInputManifest(exactHead, gateProfile.input_selectors);
      const dependencyInputManifest = rawCandidateInputManifest(
        exactHead,
        gateProfile.dependency_selectors,
      );
      const toolchainManifest = toolchainManifestV5(
        context.policy,
        gateProfile.toolchain_probe_ids,
        findings,
      );
      const environmentManifest = environmentManifestV5(
        context.policy,
        gateProfile.environment_input_ids,
        findings,
      );
      const toolchainDigest = sha256(canonical(toolchainManifest));
      const environmentDigest = sha256(canonical(environmentManifest));
      const outputState = observedPersistentOutputsV6(repoRoot, gateProfile.required_outputs);
      const gateFreshnessProfileDigest = sha256(canonical(gateProfile));
      const inputManifestDigest = sha256(canonical(inputManifest));
      const taskId = `gate-${gate.id}`;
      const keyBody = {
        task_id: taskId,
        argv,
        cwd: '.',
        gate_freshness_profile_digest: gateFreshnessProfileDigest,
        input_manifest: inputManifest,
        input_manifest_digest: inputManifestDigest,
        dependency_input_manifest: dependencyInputManifest,
        dependency_keys: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        toolchain_manifest: toolchainManifest,
        environment_digest: environmentDigest,
        environment_manifest: environmentManifest,
        output_contract: gateProfile.output_contract,
        outputs: outputState.outputs,
        producing_candidate: exactHead,
      };
      const taskKey = sha256(canonical(keyBody));
      const expected = {
        round,
        task_id: taskId,
        task_key: taskKey,
        argv,
        cwd: '.',
        gate_freshness_profile_digest: gateFreshnessProfileDigest,
        input_manifest: inputManifest,
        input_manifest_digest: inputManifestDigest,
        dependency_input_manifest: dependencyInputManifest,
        dependency_keys: {},
        dependency_results: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        toolchain_manifest: toolchainManifest,
        environment_digest: environmentDigest,
        environment_manifest: environmentManifest,
        output_contract: gateProfile.output_contract,
        producing_candidate: exactHead,
      };
      const cache = v3Remote(context.policy) ? null : v3ReadCache(context, expected, findings);
      const outputsFresh =
        cache !== null &&
        outputState.missing.length === 0 &&
        canonical(cache.outputs ?? []) === canonical(outputState.outputs);
      if (outputsFresh) {
        results.push({
          node_id: gate.id,
          gate_id: gate.id,
          outcome: 'REUSE_FRESH',
          result: 'REUSED_FRESH_PASS',
          exit_code: 0,
          task_key: taskKey,
          output_digest: cache.result_digest,
        });
        continue;
      }
      const [program, ...args] = argv;
      const executed = run(program, args, { cwd: repoRoot });
      const outputsAfter = observedPersistentOutputsV6(repoRoot, gateProfile.required_outputs);
      const result =
        executed.status === 0 && outputsAfter.missing.length === 0
          ? 'EXECUTED_PASS'
          : 'EXECUTED_FAIL';
      if (outputsAfter.missing.length > 0)
        findings.push(
          finding(
            'GATE_REQUIRED_OUTPUT_MISSING',
            'gate completed without its complete required output population',
            { gate_id: gate.id, missing: outputsAfter.missing },
          ),
        );
      if (
        cache !== null &&
        outputState.missing.length === 0 &&
        canonical(cache.outputs ?? []) !== canonical(outputState.outputs)
      ) {
        // A changed output never reuses the old PASS; successful execution below replaces it atomically.
        if (result !== 'EXECUTED_PASS')
          findings.push(
            finding(
              'GATE_REQUIRED_OUTPUT_TAMPERED',
              'tampered gate output could not be regenerated',
              { gate_id: gate.id },
            ),
          );
      }
      const body = {
        schemaVersion: context.policy.schemaVersion === '5.0.0' ? '3.0.0' : '2.0.0',
        policy_version: context.policy.freshness.policy_version,
        graph_version: context.graph.graph_version,
        round,
        task_id: taskId,
        plan_outcome: 'EXECUTE',
        reason_codes: ['AUTHORITATIVE_POLICY_GATE'],
        changed_inputs: [],
        fallback_population: null,
        argv,
        cwd: '.',
        task_key: taskKey,
        gate_freshness_profile_digest: gateFreshnessProfileDigest,
        input_manifest: inputManifest,
        input_manifest_digest: inputManifestDigest,
        dependency_input_manifest: dependencyInputManifest,
        dependency_keys: {},
        dependency_results: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        toolchain_manifest: toolchainManifest,
        environment_digest: environmentDigest,
        environment_manifest: environmentManifest,
        producing_candidate: exactHead,
        result,
        exit_code: executed.status ?? 1,
        stdout_sha256: sha256(executed.stdout ?? ''),
        stderr_sha256: sha256(executed.stderr ?? ''),
        reused_result_digest: null,
        output_contract: gateProfile.output_contract,
        outputs: outputsAfter.outputs,
        freshness_reason: 'executed authoritative policy gate for exact candidate',
      };
      const record = { ...body, result_digest: sha256(canonical(body)) };
      if (result === 'EXECUTED_PASS') v3WriteCache(context, taskId, taskKey, record);
      else
        findings.push(
          finding('CONVERGENCE_GATE_FAILED', 'authoritative policy gate failed', {
            task_id: gate.id,
            exit_code: executed.status ?? 1,
            stderr: executed.stderr,
          }),
        );
      results.push({
        node_id: gate.id,
        gate_id: gate.id,
        outcome: 'EXECUTE',
        result,
        exit_code: executed.status ?? 1,
        task_key: taskKey,
        output_digest: record.result_digest,
      });
    }
    return results;
  };
  for (let passNumber = 1; passNumber <= 2 && context !== null && !isBlocking(); passNumber += 1) {
    const headBefore = git(repoRoot, ['rev-parse', 'HEAD']);
    const statusBefore = cleanStatus(repoRoot);
    const plan = buildImpactPlan(context, base, exactHead, findings);
    if (plan === null) break;
    const affectedResults = executeAffected(plan);
    // A blocking impact plan must not erase the population. Every declared gate keeps
    // an ordered terminal record carrying its identity and an exit code, so terminal
    // evidence still accounts for all sixteen commands.
    const results = isBlocking()
      ? (context.policy.convergence?.commands ?? []).map((gate) => ({
          node_id: gate.id,
          gate_id: gate.id,
          outcome: 'BLOCKED',
          result: 'BLOCKED',
          exit_code: 1,
          task_key: null,
          output_digest: null,
        }))
      : executePolicyGates();
    const headAfter = git(repoRoot, ['rev-parse', 'HEAD']);
    const statusAfter = cleanStatus(repoRoot);
    if (headBefore !== exactHead || headAfter !== exactHead)
      findings.push(finding('CONVERGENCE_HEAD_MISMATCH', 'pass changed exact HEAD identity'));
    if (statusBefore !== '' || statusAfter !== '')
      findings.push(finding('CONVERGENCE_PASS_WROTE_TREE', 'pass boundary is not clean'));
    passes.push({
      pass: passNumber,
      results,
      affected_results: affectedResults,
      head_before: headBefore,
      head_after: headAfter,
    });
  }
  const normalizedPass = (pass) =>
    pass.results.map(({ node_id, task_key, result }) => ({
      node_id,
      task_key,
      pass: result === 'EXECUTED_PASS' || result === 'REUSED_FRESH_PASS',
    }));
  const passBoundariesEquivalent =
    passes.length === 2 &&
    canonical(normalizedPass(passes[0])) === canonical(normalizedPass(passes[1]));
  const exactHeadAfter = git(repoRoot, ['rev-parse', 'HEAD']);
  const secondPassNoWrite = passes.length === 2 && cleanStatus(repoRoot) === '';
  if (!passBoundariesEquivalent)
    findings.push(
      finding('CONVERGENCE_PASS_MISMATCH', 'two policy-gate passes are not equivalent'),
    );
  let ok =
    !isBlocking() && passes.length === 2 && secondPassNoWrite && exactHeadAfter === exactHead;
  if (ok && context !== null) {
    if (['4.0.0', '5.0.0'].includes(context.policy.schemaVersion)) {
      const tree = git(repoRoot, ['rev-parse', `${exactHead}^{tree}`]);
      const gateIds = (context.policy.convergence?.commands ?? []).map(({ id }) => id);
      const semanticPopulationDigest = sha256(canonical(gateIds));
      const convergencePasses = passes.map((pass, index) => {
        const gateResults = gateIds.map((gateId) => {
          const actual = pass.results.find(({ node_id }) => node_id === gateId);
          const body = {
            gate_id: gateId,
            outcome: actual?.result === 'EXECUTED_PASS' ? 'EXECUTED_PASS' : 'REUSED_FRESH_PASS',
            task_key: actual.task_key,
            output_digest: actual.output_digest,
          };
          return withSelfDigest(body, 'result_digest');
        });
        return withSelfDigest(
          {
            pass_number: index + 1,
            head_before: pass.head_before,
            head_after: pass.head_after,
            tree_sha: tree,
            clean_before: true,
            clean_after: true,
            writes: [],
            gate_results: gateResults,
            semantic_population_digest: semanticPopulationDigest,
          },
          'pass_digest_sha256',
        );
      });
      const candidateIdentityDigest = candidateIdentityDigestV4(
        context,
        exactBase,
        exactHead,
        tree,
      );
      const impactExecution = affectedExecutionV4(context, exactBase, exactHead, passes, findings);
      if (impactExecution !== null && !isBlocking())
        writeJsonAtomic(join(repoRoot, context.profile.runtime.impact_execution), impactExecution);
      const convergence = withSelfDigest(
        {
          schemaVersion: '1.0.0',
          round,
          exact_base: exactBase,
          candidate_sha: exactHead,
          candidate_tree: tree,
          candidate_identity_digest: candidateIdentityDigest,
          policy_digest: context.digests.policy,
          profile_digest: context.digests.profile,
          authoritative_gate_ids: gateIds,
          authoritative_population_digest: semanticPopulationDigest,
          impact_execution_digest: impactExecution?.execution_digest_sha256 ?? sha256('MISSING\n'),
          passes: convergencePasses,
        },
        'convergence_digest_sha256',
      );
      validateDocument(
        convergence,
        context.policy.schemas.round_convergence,
        findings,
        'CONVERGENCE_SCHEMA_INVALID',
        'convergence evidence',
      );
      if (!isBlocking())
        writeJsonAtomic(join(repoRoot, context.profile.runtime.convergence_evidence), convergence);
      const ledger = !isBlocking()
        ? materializeClaimsV4(context, convergence, exactHead, findings)
        : null;
      const binding = reviewerBindingV4(context, exactHead);
      findings.push(...binding.findings);
      if (binding.selected === null)
        findings.push(
          binding.diagnostic ??
            finding(
              'ENTRY_BLOCKED_REVIEWER_UNBOUND',
              'candidate freeze requires an authenticated reviewer binding',
            ),
        );
      const activeControlCensus =
        context.policy.schemaVersion === '5.0.0'
          ? deriveActiveControlCensusV5(context, exactHead, findings)
          : null;
      if (activeControlCensus !== null && !isBlocking())
        writeJsonAtomic(
          join(repoRoot, context.profile.runtime.active_control_census),
          activeControlCensus,
        );
      if (ledger !== null && binding.selected !== null && !isBlocking()) {
        const candidateManifest = withSelfDigest(
          {
            schemaVersion: context.policy.schemaVersion === '5.0.0' ? '3.0.0' : '2.0.0',
            round,
            base_sha: exactBase,
            candidate_sha: exactHead,
            tree_sha: tree,
            profile_digest: context.digests.profile,
            policy_digest: context.digests.policy,
            graph_digest: context.digests.graph,
            candidate_identity_digest: candidateIdentityDigest,
            convergence_digest: convergence.convergence_digest_sha256,
            claims_digest: ledger.claims_digest_sha256,
            reviewer_binding_digest: binding.selected.digest,
            ...(activeControlCensus === null
              ? {}
              : { active_control_census_digest: activeControlCensus.census_digest_sha256 }),
            declaration_id: roundDeclaration.declaration.decision_id,
            declaration_digest: roundDeclaration.digest,
            impact_execution_digest: impactExecution.execution_digest_sha256,
          },
          'manifest_digest_sha256',
        );
        validateDocument(
          candidateManifest,
          context.policy.schemas.candidate_manifest,
          findings,
          'CANDIDATE_MANIFEST_SCHEMA_INVALID',
          'candidate manifest',
        );
        if (!isBlocking())
          writeJsonAtomic(
            join(repoRoot, context.profile.runtime.candidate_manifest),
            candidateManifest,
          );
      }
      ok = !isBlocking();
      if (!ok) {
        rmSync(join(repoRoot, context.profile.runtime.candidate_manifest), { force: true });
        rmSync(join(repoRoot, context.profile.runtime.convergence_evidence), { force: true });
        rmSync(join(repoRoot, context.profile.runtime.materialized_claims), { force: true });
        rmSync(join(repoRoot, context.profile.runtime.impact_execution), { force: true });
        if (context.profile.runtime.active_control_census)
          rmSync(join(repoRoot, context.profile.runtime.active_control_census), { force: true });
      }
    } else {
      const convergenceBody = { ok, base: exactBase, head: exactHead, passes };
      const convergence = {
        ...convergenceBody,
        convergence_digest_sha256: sha256(canonical(convergenceBody)),
      };
      writeState(repoRoot, round, 'convergence.json', convergence);
      const candidateBody = {
        schemaVersion: '1.0.0',
        round,
        base_sha: exactBase,
        candidate_sha: exactHead,
        tree_sha: git(repoRoot, ['rev-parse', `${exactHead}^{tree}`]),
        profile_digest: context.digests.profile,
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        convergence_digest: convergence.convergence_digest_sha256,
      };
      writeState(repoRoot, round, 'candidate-manifest.json', {
        ...candidateBody,
        manifest_digest_sha256: sha256(canonical(candidateBody)),
      });
    }
  }
  emit({
    ok,
    command: 'smart-converge',
    round,
    base,
    head: exactHead,
    exact_head_before: exactHeadBefore,
    exact_head_after: exactHeadAfter,
    second_pass_no_write: secondPassNoWrite,
    pass_boundaries_equivalent: passBoundariesEquivalent,
    passes,
    executed_test_nodes: executedTests,
    reused_test_nodes: reusedTests,
    findings,
  });
}

function claimsCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidateArg = option('--candidate') ?? 'HEAD';
  const candidate = git(repoRoot, ['rev-parse', candidateArg]);
  const context = loadV3Context(round, findings);
  if (context !== null) {
    if (context.claims.mode !== 'materialized' || context.claims.candidate !== candidate) {
      findings.push(
        finding(
          'CLAIM_UNRESOLVED',
          'current-claim ledger is not materialized for the exact candidate',
        ),
      );
    }
    for (const claim of context.claims.claims ?? []) {
      if (
        claim.source_digest === null ||
        claim.value_digest === null ||
        claim.source_paths.some((path) => path.includes('<'))
      ) {
        findings.push(
          finding('CLAIM_UNRESOLVED', 'claim has unresolved source or value identity', {
            claim_id: claim.claim_id,
          }),
        );
      }
      if (context.claims.mode !== 'materialized') continue;
      const sourceManifest = v3InputEntries(claim.source_paths ?? []);
      const sourceDigest = sha256(canonical(sourceManifest));
      if (claim.source_digest !== sourceDigest)
        findings.push(
          finding('CLAIM_SOURCE_DIGEST_INVALID', 'claim source digest is stale or incorrect', {
            claim_id: claim.claim_id,
            recomputed_digest: sourceDigest,
          }),
        );
      const resolvedProducer = claim.resolved_producer ?? claim.producer;
      const [program, ...args] = resolvedProducer ?? [];
      if (program === undefined) {
        findings.push(
          finding('CLAIM_PRODUCER_INVALID', 'claim producer is empty', {
            claim_id: claim.claim_id,
          }),
        );
        continue;
      }
      const produced = run(program, args, { cwd: repoRoot });
      if (produced.status !== 0) {
        findings.push(
          finding('CLAIM_PRODUCER_FAILED', 'claim producer did not complete successfully', {
            claim_id: claim.claim_id,
            exit_code: produced.status ?? 1,
          }),
        );
        continue;
      }
      let extracted;
      try {
        let value;
        try {
          value = JSON.parse(produced.stdout);
        } catch {
          value = produced.stdout.trim();
        }
        if (claim.extractor === '$') extracted = value;
        else {
          const tokens = String(claim.extractor)
            .replace(/^\$\.?/u, '')
            .split('.')
            .filter(Boolean);
          extracted = tokens.reduce((current, token) => current?.[token], value);
        }
        if (extracted === undefined) throw new Error('extractor resolved no value');
      } catch (error) {
        findings.push(
          finding('CLAIM_EXTRACTOR_INVALID', 'claim extractor could not resolve producer output', {
            claim_id: claim.claim_id,
            detail: String(error),
          }),
        );
        continue;
      }
      const valueDigest = sha256(canonical(extracted));
      if (claim.value_digest !== valueDigest)
        findings.push(
          finding('CLAIM_VALUE_DIGEST_INVALID', 'claim value digest is stale or incorrect', {
            claim_id: claim.claim_id,
            recomputed_digest: valueDigest,
          }),
        );
    }
  }
  emit({ ok: findings.length === 0, command: 'claims-check', round, candidate, findings });
}

const treeEntryCache = new Map();
const treeIdentityEntryCache = new Map();

function candidateTreeIdentityEntriesV7(candidate) {
  if (treeIdentityEntryCache.has(candidate)) return treeIdentityEntryCache.get(candidate);
  const entries = new Map();
  for (const line of git(repoRoot, ['ls-tree', '-r', candidate]).split('\n').filter(Boolean)) {
    const match = /^([0-9]+)\s+(\w+)\s+([0-9a-f]+)\t(.+)$/u.exec(line);
    if (match !== null)
      entries.set(match[4], {
        mode: match[1],
        object_type: match[2],
        object_id: match[3],
      });
  }
  treeIdentityEntryCache.set(candidate, entries);
  return entries;
}

function candidateTreeEntries(candidate) {
  if (treeEntryCache.has(candidate)) return treeEntryCache.get(candidate);
  const entries = new Map(
    [...candidateTreeIdentityEntriesV7(candidate)].map(([path, identity]) => [
      path,
      identity.object_id,
    ]),
  );
  treeEntryCache.set(candidate, entries);
  return entries;
}

function candidateDigestForPaths(candidate, paths) {
  const tree = candidateTreeEntries(candidate);
  const entries = [...new Set(paths)].sort().map((path) => ({
    path,
    digest: tree.has(path) ? sha256(String(tree.get(path))) : sha256('MISSING\n'),
  }));
  return sha256(canonical(entries));
}

function reviewScopeV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = git(repoRoot, ['rev-parse', option('--base') ?? '']);
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const cycle = Number(option('--cycle') ?? '1');
  if (![1, 2].includes(cycle))
    findings.push(
      finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'only review cycles 1 and 2 are permitted', {
        cycle,
      }),
    );
  const context = loadV3Context(round, findings);
  if (context === null) {
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const candidateManifestPath = join(repoRoot, context.profile.runtime.candidate_manifest);
  let candidateManifest = null;
  try {
    candidateManifest = readJson(candidateManifestPath);
    const { manifest_digest_sha256: claimed, ...body } = candidateManifest;
    if (
      claimed !== sha256(canonical(body)) ||
      candidateManifest.round !== round ||
      candidateManifest.base_sha !== base ||
      candidateManifest.candidate_sha !== candidate ||
      candidateManifest.tree_sha !== git(repoRoot, ['rev-parse', `${candidate}^{tree}`])
    )
      throw new Error('candidate manifest digest or exact identity mismatch');
  } catch (error) {
    findings.push(
      finding('CANDIDATE_MANIFEST_REQUIRED', 'an authentic exact-candidate manifest is required', {
        path: relative(repoRoot, candidateManifestPath),
        detail: String(error),
      }),
    );
  }
  if (candidateManifest === null) {
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const identityObligation =
    (context.obligations.obligations ?? []).find(({ obligation_id }) =>
      /IDENTITY$/u.test(obligation_id),
    ) ?? context.obligations.obligations?.[0];
  if (identityObligation === undefined) {
    findings.push(
      finding('REVIEW_OBLIGATION_IDENTITY_MISSING', 'review census needs an identity obligation'),
    );
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const topics = [];
  const addTopic = ({
    topicId,
    topicKind,
    obligationId = identityObligation.obligation_id,
    risk = 'P1',
    claim,
    sourceRefs,
    governingPaths,
    requiredEvidence,
    currentDigest,
    previousDigest = null,
    changedStatus = 'changed',
    requiredAdversaries,
    previousFindingClasses = [],
    allowReuse = false,
  }) => {
    topics.push({
      topic_id: topicId,
      topic_kind: topicKind,
      obligation_id: obligationId,
      risk,
      claim,
      source_refs: [...new Set(sourceRefs)],
      governing_paths: [...new Set(governingPaths)],
      required_evidence: [...new Set(requiredEvidence)],
      current_digest: currentDigest,
      previous_digest: previousDigest,
      changed_status: changedStatus,
      required_adversaries: [...new Set(requiredAdversaries)],
      previous_finding_classes: [...new Set(previousFindingClasses)],
      freshness_proof: {
        method:
          allowReuse && changedStatus === 'unchanged' ? 'content-addressed' : 'recheck-required',
        inputs_digest: currentDigest,
        evidence_digest: sha256(canonical(requiredEvidence)),
        task_keys: [],
        independent_recomputation_required: true,
      },
      allowed_dispositions:
        allowReuse && changedStatus === 'unchanged'
          ? ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED']
          : ['RECHECKED_PASS', 'RECHECKED_FAIL', 'BLOCKED'],
    });
  };
  for (const obligation of context.obligations.obligations ?? []) {
    const currentPaths = pathsForGlobs(
      repoRoot,
      candidate,
      obligation.governing_paths.flatMap(expandBraceSelectors),
    );
    const previousPaths = pathsForGlobs(
      repoRoot,
      base,
      obligation.governing_paths.flatMap(expandBraceSelectors),
    );
    const currentDigest = candidateDigestForPaths(candidate, currentPaths);
    const previousDigest = candidateDigestForPaths(base, previousPaths);
    const unchanged = currentDigest === previousDigest;
    addTopic({
      topicId: `obligation:${obligation.obligation_id.toLowerCase()}`,
      topicKind: 'semantic-obligation',
      obligationId: obligation.obligation_id,
      risk: obligation.risk,
      claim: obligation.claim,
      sourceRefs: obligation.source_refs,
      governingPaths: obligation.governing_paths,
      requiredEvidence: obligation.required_evidence,
      currentDigest,
      previousDigest,
      changedStatus: unchanged ? 'unchanged' : 'changed',
      requiredAdversaries: obligation.required_adversaries,
      previousFindingClasses: obligation.finding_classes,
      allowReuse: obligation.reuse_policy === 'digest-and-evidence-recheck',
    });
  }
  const changedPaths = statusAwareChangedPaths(base, candidate);
  for (const path of changedPaths) {
    addTopic({
      topicId: `changed-path:${sha256(path).slice(0, 24)}`,
      topicKind: 'changed-path',
      risk: 'P0',
      claim: `Inspect exact candidate change at ${path}`,
      sourceRefs: [path],
      governingPaths: [path],
      requiredEvidence: ['exact diff', 'affected behavior'],
      currentDigest: candidateDigestForPaths(candidate, [path]),
      previousDigest: candidateDigestForPaths(base, [path]),
      requiredAdversaries: ['inspect-exact-diff', 'exercise-affected-behavior'],
    });
  }
  const activeControls = [
    context.profilePath,
    'law/policy/round-close-controls.json',
    context.profile.sources.authorization,
    context.profile.sources.plan,
    context.profile.sources.orchestrator,
    ...(context.profile.sources.additional_controls ?? []),
  ];
  const activeControlsDigest = candidateDigestForPaths(candidate, activeControls);
  addTopic({
    topicId: 'active-control:complete-census',
    topicKind: 'active-control',
    risk: 'P0',
    claim: 'Every active controlling source is applied to the exact candidate.',
    sourceRefs: activeControls,
    governingPaths: activeControls,
    requiredEvidence: ['complete active-control digest and conflict census'],
    currentDigest: activeControlsDigest,
    requiredAdversaries: ['omitted-control', 'conflicting-control'],
  });
  for (const claim of context.claims.claims ?? []) {
    addTopic({
      topicId: `current-claim:${claim.claim_id}`,
      topicKind: 'current-claim',
      risk: 'P1',
      claim: `Recompute volatile claim ${claim.claim_id}.`,
      sourceRefs: [context.profile.sources.current_claims, ...claim.source_paths],
      governingPaths: [context.profile.sources.current_claims, ...claim.source_paths],
      requiredEvidence: [claim.producer.join(' '), claim.extractor],
      currentDigest: sha256(canonical(claim)),
      requiredAdversaries: ['stale-source-digest', 'stale-value-digest'],
    });
  }
  const priorFindingClasses = [];
  const registryPath = context.profile.sources.prior_finding_registry;
  if (registryPath !== undefined && existsSync(join(repoRoot, registryPath))) {
    const registry = readJson(join(repoRoot, registryPath));
    priorFindingClasses.push(
      ...(registry.finding_classes ?? []).map((entry) => ({
        id: entry.defect_class_id,
        source: registryPath,
        value: entry,
      })),
    );
  } else {
    for (const source of context.profile.sources.prior_findings ?? [])
      priorFindingClasses.push({ id: source, source, value: source });
  }
  for (const entry of priorFindingClasses) {
    addTopic({
      topicId: `previous-finding-class:${sha256(entry.id).slice(0, 24)}`,
      topicKind: 'previous-finding-class',
      risk: entry.value.severity ?? 'P1',
      claim: `Recheck complete prior defect class ${entry.id}.`,
      sourceRefs: [entry.source],
      governingPaths: [
        existsSync(join(repoRoot, entry.source)) ? entry.source : context.profilePath,
      ],
      requiredEvidence: [entry.value.repair_condition ?? 'complete same-class sweep'],
      currentDigest: sha256(canonical(entry.value)),
      requiredAdversaries: [
        entry.value.population_query ?? 'repeat prior defect-class population query',
      ],
      previousFindingClasses: [entry.id],
    });
  }
  addTopic({
    topicId: `candidate-identity:${candidate.slice(0, 16)}`,
    topicKind: 'candidate-identity',
    risk: 'P0',
    claim: 'Review binds the authentic exact candidate manifest.',
    sourceRefs: [context.profile.runtime.candidate_manifest],
    governingPaths: [context.profilePath],
    requiredEvidence: ['candidate SHA, tree SHA, base SHA, and self-digest'],
    currentDigest: candidateManifest.manifest_digest_sha256,
    requiredAdversaries: ['wrong-base', 'wrong-candidate', 'wrong-tree', 'tampered-manifest'],
  });
  const convergenceState = readState(repoRoot, round, 'convergence.json');
  const convergenceEvidence =
    convergenceState.status === 'valid' ? convergenceState.value : candidateManifest;
  const convergenceEvidenceDigest = sha256(canonical(convergenceEvidence));
  addTopic({
    topicId: `convergence-evidence:${convergenceEvidenceDigest.slice(0, 24)}`,
    topicKind: 'convergence-evidence',
    risk: 'P0',
    claim: 'Convergence evidence covers the exact frozen candidate.',
    sourceRefs: [
      context.profile.runtime.candidate_manifest,
      `${context.profile.runtime.state_root}/convergence.json`,
    ],
    governingPaths: [context.profilePath],
    requiredEvidence: ['two complete equivalent policy-gate passes and affected-task plan'],
    currentDigest: convergenceEvidenceDigest,
    requiredAdversaries: ['stale-convergence', 'partial-gate-population'],
  });
  topics.sort((left, right) => left.topic_id.localeCompare(right.topic_id));
  const priorFindingsDigest = sha256(canonical(priorFindingClasses));
  const body = {
    schemaVersion: '2.0.0',
    policy_version: context.policy.review_scope.policy_version,
    round,
    cycle,
    exact_base: base,
    review_candidate: candidate,
    candidate_tree: candidateManifest.tree_sha,
    policy_digest: context.digests.policy,
    profile_digest: context.digests.profile,
    graph_digest: context.digests.graph,
    obligations_digest: context.digests.obligations,
    claims_digest: context.digests.claims,
    active_controls_digest: activeControlsDigest,
    prior_findings_digest: priorFindingsDigest,
    impact_plan_digest: sha256(canonical({ base, candidate, changedPaths })),
    convergence_evidence_digest: convergenceEvidenceDigest,
    current_candidate_manifest_digest: candidateManifest.manifest_digest_sha256,
    previous_candidate_manifest_digests: [],
    topic_count: topics.length,
    topics,
  };
  const manifestValue = { ...body, manifest_digest_sha256: sha256(canonical(body)) };
  validateDocument(
    manifestValue,
    context.policy.schemas.review_scope,
    findings,
    'REVIEW_SCOPE_SCHEMA_INVALID',
    'review scope',
  );
  if (findings.length === 0) {
    const path = join(repoRoot, context.profile.runtime.review_scope);
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.tmp-${String(process.pid)}`;
    writeFileSync(temporary, canonical(manifestValue));
    renameSync(temporary, path);
  }
  emit({
    ok: findings.length === 0,
    command: 'review-scope',
    round,
    cycle,
    manifest: manifestValue,
    findings,
  });
}

function parseStructuredReviewResult(path) {
  const source = readFileSync(path, 'utf8').trim();
  try {
    return JSON.parse(source);
  } catch {
    const records = source
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const headers = records.filter(({ type }) => type === 'header');
    const terminals = records.filter(({ type }) => type === 'terminal');
    const allowed = new Set(['header', 'disposition', 'finding', 'terminal']);
    const canonicalStream =
      records.length >= 2 &&
      records[0]?.type === 'header' &&
      records.at(-1)?.type === 'terminal' &&
      headers.length === 1 &&
      terminals.length === 1 &&
      records.every(({ type }) => allowed.has(type));
    const header = headers[0] ?? {};
    const terminalRecord = terminals[0];
    const parsed = {
      ...header,
      dispositions: records
        .filter(({ type }) => type === 'disposition')
        .map(({ type: _type, ...value }) => value),
      findings: records
        .filter(({ type }) => type === 'finding')
        .map(({ type: _type, ...value }) => value),
      terminal:
        terminalRecord === undefined
          ? undefined
          : (({ type: _type, ...value }) => value)(terminalRecord),
    };
    delete parsed.type;
    Object.defineProperty(parsed, '__jsonlCanonical', {
      value: canonicalStream,
      enumerable: false,
    });
    return parsed;
  }
}

function recordInvalidTransport(context, round, cycle, candidate, manifestDigest) {
  const name = `review-transport-${String(cycle)}.json`;
  const prior = readState(repoRoot, round, name);
  const sameIdentity =
    prior.value?.candidate === candidate &&
    prior.value?.cycle === cycle &&
    prior.value?.manifest_digest === manifestDigest;
  const attempts = Number(sameIdentity ? (prior.value?.attempts ?? 0) : 0) + 1;
  writeState(repoRoot, round, name, {
    attempts,
    round,
    cycle,
    candidate,
    manifest_digest: manifestDigest,
  });
  if (attempts > context.profile.review_budget.transport_retries_per_cycle) {
    writeState(repoRoot, round, 'review-state.json', {
      state: 'REVIEW_TRANSPORT_BLOCKED',
      cycle,
      candidate,
      manifest_digest: manifestDigest,
    });
    return true;
  }
  return false;
}

function reviewCheckV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const cycle = Number(option('--cycle') ?? '1');
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const context = loadV3Context(round, findings);
  if (![1, 2].includes(cycle)) {
    findings.push(
      finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'review cycle 3 is mechanically forbidden', {
        cycle,
      }),
    );
    emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
    return;
  }
  if (context === null)
    return emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
  let manifestValue = null;
  try {
    manifestValue = readJson(join(repoRoot, context.profile.runtime.review_scope));
    const { manifest_digest_sha256: claimed, ...body } = manifestValue;
    if (
      claimed !== sha256(canonical(body)) ||
      manifestValue.review_candidate !== candidate ||
      manifestValue.cycle !== cycle
    ) {
      throw new Error('review-scope identity or digest mismatch');
    }
  } catch (error) {
    findings.push(finding('REVIEW_SCOPE_MANIFEST_INVALID', String(error)));
  }
  const storedState = readState(repoRoot, round, 'review-state.json');
  if (
    cycle === 2 &&
    (storedState.status !== 'valid' ||
      storedState.value?.state !== 'REPAIR_REQUIRED' ||
      storedState.value?.candidate === candidate)
  ) {
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_INVALID',
        'cycle 2 requires a cycle-1 repair state and a newly frozen candidate',
      ),
    );
  }
  let result = null;
  try {
    result = parseStructuredReviewResult(resolve(repoRoot, option('--review-result') ?? ''));
    if (result.__jsonlCanonical === false)
      findings.push(
        finding(
          'REVIEW_JSONL_NON_CANONICAL',
          'JSONL must contain exactly one first header, one last terminal, and only known records',
        ),
      );
    if (
      !validateDocument(
        result,
        context.policy.schemas.review_result,
        findings,
        'REVIEW_RESULT_INVALID',
        'review result',
      )
    )
      result = null;
  } catch (error) {
    findings.push(
      finding('REVIEW_RESULT_INVALID', `review result is malformed or truncated: ${String(error)}`),
    );
  }
  if (result === null || manifestValue === null) {
    const blocked = recordInvalidTransport(
      context,
      round,
      cycle,
      candidate,
      manifestValue?.manifest_digest_sha256 ?? null,
    );
    if (blocked)
      findings.push(finding('REVIEW_TRANSPORT_BLOCKED', 'transport retry budget is exhausted'));
    emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
    return;
  }
  if (
    result.round !== round ||
    result.cycle !== cycle ||
    result.review_candidate !== candidate ||
    result.manifest_digest !== manifestValue.manifest_digest_sha256 ||
    result.policy_digest !== manifestValue.policy_digest
  ) {
    findings.push(
      finding(
        'REVIEW_RESULT_IDENTITY_INVALID',
        'review result does not bind exact candidate, manifest, policy, and cycle',
      ),
    );
  }
  const topics = new Map(manifestValue.topics.map((topic) => [topic.topic_id, topic]));
  const resultFindings = new Map((result.findings ?? []).map((entry) => [entry.finding_id, entry]));
  const seen = new Set();
  for (const disposition of result.dispositions) {
    if (seen.has(disposition.topic_id))
      findings.push(
        finding('REVIEW_TOPIC_DUPLICATED', 'review topic is duplicated', {
          topic_id: disposition.topic_id,
        }),
      );
    seen.add(disposition.topic_id);
    const topic = topics.get(disposition.topic_id);
    if (topic === undefined) {
      findings.push(
        finding('REVIEW_TOPIC_UNKNOWN', 'review result contains unknown topic', {
          topic_id: disposition.topic_id,
        }),
      );
      continue;
    }
    if (!topic.allowed_dispositions.includes(disposition.disposition))
      findings.push(
        finding('REVIEW_TOPIC_DISPOSITION_INVALID', 'disposition is not allowed for topic state', {
          topic_id: disposition.topic_id,
        }),
      );
    if (disposition.recomputed_digest !== topic.current_digest)
      findings.push(
        finding('REVIEW_TOPIC_DIGEST_INVALID', 'topic digest was not independently recomputed', {
          topic_id: disposition.topic_id,
        }),
      );
    if (
      disposition.disposition === 'REUSED_FRESH_PASS' &&
      (topic.changed_status !== 'unchanged' ||
        disposition.evidence_refs.length === 0 ||
        disposition.justification.trim().length < 20)
    )
      findings.push(
        finding(
          'REVIEW_TOPIC_FRESHNESS_UNVERIFIED',
          'unchanged topic reuse lacks independent evidence and reasoning',
          { topic_id: disposition.topic_id },
        ),
      );
    if (['RECHECKED_FAIL', 'BLOCKED'].includes(disposition.disposition))
      findings.push(
        finding('REVIEW_TOPIC_NOT_PASSING', 'topic is failed or blocked', {
          topic_id: disposition.topic_id,
        }),
      );
    for (const findingId of disposition.finding_ids ?? []) {
      const linked = resultFindings.get(findingId);
      if (linked === undefined || !(linked.topic_ids ?? []).includes(disposition.topic_id))
        findings.push(
          finding(
            'REVIEW_FINDING_LINK_INVALID',
            'disposition finding link is orphaned or mismatched',
            {
              topic_id: disposition.topic_id,
              finding_id: findingId,
            },
          ),
        );
    }
  }
  for (const entry of result.findings ?? []) {
    for (const topicId of entry.topic_ids ?? []) {
      const disposition = result.dispositions.find(({ topic_id }) => topic_id === topicId);
      if (disposition === undefined || !(disposition.finding_ids ?? []).includes(entry.finding_id))
        findings.push(
          finding('REVIEW_FINDING_LINK_INVALID', 'finding topic link is not reciprocal', {
            topic_id: topicId,
            finding_id: entry.finding_id,
          }),
        );
    }
  }
  for (const id of topics.keys())
    if (!seen.has(id))
      findings.push(
        finding('REVIEW_TOPIC_OMITTED', 'mandatory topic is omitted', { topic_id: id }),
      );
  const counts = Object.fromEntries(
    ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'].map((name) => [
      name,
      result.dispositions.filter(({ disposition }) => disposition === name).length,
    ]),
  );
  if (
    result.terminal.topic_count !== topics.size ||
    result.terminal.finding_count !== result.findings.length ||
    canonical(result.terminal.disposition_counts) !== canonical(counts) ||
    result.terminal.complete !== true
  )
    findings.push(
      finding('REVIEW_TERMINAL_INVALID', 'terminal counts do not match the complete parsed result'),
    );
  if (
    result.terminal.verdict === 'PASS' &&
    (findings.length > 0 || result.findings.some(({ severity }) => ['P0', 'P1'].includes(severity)))
  ) {
    findings.push(
      finding(
        'REVIEW_PASS_INVALID',
        'PASS contains failed, blocked, incomplete, or unresolved high-risk findings',
      ),
    );
  }
  const valid = findings.length === 0;
  const state =
    valid && result.terminal.verdict === 'PASS'
      ? 'PASS'
      : cycle === 1
        ? 'REPAIR_REQUIRED'
        : 'ESCALATION_REQUIRED';
  writeState(repoRoot, round, 'review-state.json', {
    state,
    cycle,
    candidate,
    manifest_digest: manifestValue.manifest_digest_sha256,
  });
  emit({
    ok: valid && result.terminal.verdict === 'PASS',
    command: 'review-check',
    round,
    candidate,
    cycle,
    state,
    findings,
  });
}

function statusV3() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV3Context(round, findings);
  const stored = readState(repoRoot, round, 'review-state.json');
  const state = stored.status === 'valid' ? stored.value.state : 'DRAFT';
  const cycle = Number(stored.value?.cycle ?? 0);
  const transport =
    cycle > 0
      ? readState(repoRoot, round, `review-transport-${String(cycle)}.json`)
      : { value: null };
  const binding = context === null ? [] : reviewerBindingFindings(context);
  emit({
    ok: findings.length === 0,
    command: 'status',
    round,
    state,
    substantive_cycles: {
      used: cycle,
      maximum: context?.profile.review_budget.substantive_cycles ?? 2,
    },
    transport_retries_per_cycle: {
      used: Number(transport.value?.attempts ?? 0),
      maximum: context?.profile.review_budget.transport_retries_per_cycle ?? 1,
    },
    entry_ready: binding.length === 0,
    diagnostics: binding,
    findings,
  });
}

// Policy v4 is intentionally implemented beside the immutable v2/v3 compatibility
// engines. Runtime evidence is authenticated at every read boundary; parseable JSON
// alone never has standing.
function loadV4Context(round, findings, candidate = null) {
  const policy = loadPolicy(findings);
  if (policy === null) return null;
  if (!['4.0.0', '5.0.0'].includes(policy.schemaVersion)) {
    findings.push(
      finding('POLICY_VERSION_INVALID', 'generic close controls require policy v4 or v5'),
    );
    return null;
  }
  let roundExpression;
  try {
    roundExpression = new RegExp(policy.profile_discovery?.round_pattern ?? '^$', 'u');
  } catch (error) {
    findings.push(finding('ROUND_PATTERN_INVALID', String(error)));
    return null;
  }
  if (!roundExpression.test(round)) {
    findings.push(finding('ROUND_INVALID', 'round must match the configured pattern', { round }));
    return null;
  }
  const profilePath = v3ProfilePath(policy, round);
  let profile;
  try {
    profile =
      candidate === null
        ? readJson(join(repoRoot, profilePath))
        : JSON.parse(candidateFile(repoRoot, candidate, profilePath));
  } catch (error) {
    findings.push(
      finding('ROUND_PROFILE_INVALID', `round profile is unavailable: ${String(error)}`),
    );
    return null;
  }
  validateDocument(
    profile,
    policy.schemas.round_profile,
    findings,
    'ROUND_PROFILE_INVALID',
    'round profile',
  );
  if (profile.round !== round || profile.policy_version !== policy.policy_version) {
    findings.push(
      finding('ROUND_PROFILE_IDENTITY_INVALID', 'round profile differs from policy invocation'),
    );
  }
  const loadRoundDocument = (sourceKey, schemaKey, code) => {
    const path = profile.sources?.[sourceKey];
    try {
      const value =
        candidate === null
          ? readJson(join(repoRoot, path))
          : JSON.parse(candidateFile(repoRoot, candidate, path));
      if (sourceKey === 'current_claims' && value.mode === 'registry') {
        const registryFindings = [];
        validateDocument(value, policy.schemas[schemaKey], registryFindings, code, sourceKey);
        for (const entry of registryFindings) {
          const remainingErrors = (entry.errors ?? []).filter(
            (error) =>
              !(
                error.keyword === 'pattern' &&
                /^\/claims\/[0-9]+\/runtime_parameters\/[^/]+\/source$/u.test(error.instancePath)
              ),
          );
          if (remainingErrors.length > 0 || !Array.isArray(entry.errors))
            findings.push({
              ...entry,
              ...(Array.isArray(entry.errors) ? { errors: remainingErrors } : {}),
            });
        }
      } else {
        validateDocument(value, policy.schemas[schemaKey], findings, code, sourceKey);
      }
      if (Object.hasOwn(value, 'round') && value.round !== round)
        findings.push(finding(`${code}_ROUND`, `${sourceKey} round differs from profile`));
      return value;
    } catch (error) {
      findings.push(finding(code, `${sourceKey} is unavailable: ${String(error)}`, { path }));
      return null;
    }
  };
  const graph = loadRoundDocument('affected_test_graph', 'affected_test_graph', 'GRAPH_INVALID');
  const obligations = loadRoundDocument(
    'obligations',
    'semantic_obligations',
    'OBLIGATIONS_INVALID',
  );
  let obligationBaseline = null;
  if (profile.sources?.obligation_baseline) {
    try {
      obligationBaseline =
        candidate === null
          ? readJson(join(repoRoot, profile.sources.obligation_baseline))
          : JSON.parse(candidateFile(repoRoot, candidate, profile.sources.obligation_baseline));
      if (
        obligationBaseline.round !== round ||
        obligationBaseline.derivation !== 'independent-policy-baseline'
      )
        findings.push(
          finding(
            'OBLIGATION_BASELINE_INVALID',
            'independent obligation baseline identity is invalid',
          ),
        );
    } catch (error) {
      findings.push(
        finding('OBLIGATION_BASELINE_INVALID', 'independent obligation baseline is unavailable', {
          detail: String(error),
        }),
      );
    }
  }
  const claimsRegistry = loadRoundDocument('current_claims', 'current_claims', 'CLAIMS_INVALID');
  const priorFindingRegistry = profile.sources?.prior_finding_registry
    ? loadRoundDocument(
        'prior_finding_registry',
        'prior_finding_registry',
        'PRIOR_FINDINGS_INVALID',
      )
    : null;
  const controlProvenance = profile.sources?.control_provenance
    ? loadRoundDocument('control_provenance', 'control_provenance', 'CONTROL_PROVENANCE_INVALID')
    : null;
  const remediationClosureMatrix = profile.sources?.remediation_closure_matrix
    ? loadRoundDocument(
        'remediation_closure_matrix',
        'remediation_closure_matrix',
        'REMEDIATION_CLOSURE_MATRIX_INVALID',
      )
    : null;
  // The bound closure matrix must enumerate every class still OPEN in the
  // independently loaded prior-finding registry. The floor is derived from evidence,
  // so a coordinated deletion from the matrix and its tests still fails here.
  if (
    capability({ policy }, 'closure_matrix_registry_floor') &&
    remediationClosureMatrix !== null &&
    priorFindingRegistry !== null
  ) {
    const bound = new Set(
      (remediationClosureMatrix.classes ?? []).map(({ finding_id: id }) => String(id)),
    );
    const missing = (priorFindingRegistry.finding_classes ?? [])
      .filter(({ disposition }) => disposition === 'OPEN')
      .map(({ finding_id: id }) => String(id))
      .filter((id) => !bound.has(id));
    if (missing.length > 0)
      findings.push(
        finding(
          'REMEDIATION_MATRIX_POPULATION_INCOMPLETE',
          'bound closure matrix omits prior findings that remain OPEN in the registry',
          { missing, matrix: profile.sources.remediation_closure_matrix },
        ),
      );
  }
  if (graph !== null) {
    topologicalNodes(graph, findings);
    validateGateCommandClosureV6({ policy, graph, candidate, profile }, findings);
  }
  return {
    policy,
    profile,
    profilePath,
    graph,
    obligations,
    obligationBaseline,
    claimsRegistry,
    priorFindingRegistry,
    controlProvenance,
    remediationClosureMatrix,
    candidate,
    digests: {
      policy: sha256(canonical(policy)),
      profile: sha256(canonical(profile)),
      graph: graph === null ? sha256('MISSING\n') : sha256(canonical(graph)),
      obligations: obligations === null ? sha256('MISSING\n') : sha256(canonical(obligations)),
      obligationBaseline:
        obligationBaseline === null ? sha256('MISSING\n') : sha256(canonical(obligationBaseline)),
      claimsRegistry:
        claimsRegistry === null ? sha256('MISSING\n') : sha256(canonical(claimsRegistry)),
      priorFindings:
        priorFindingRegistry === null
          ? sha256(canonical([]))
          : sha256(canonical(priorFindingRegistry)),
      controlProvenance:
        controlProvenance === null ? sha256('MISSING\n') : sha256(canonical(controlProvenance)),
      remediationClosureMatrix:
        remediationClosureMatrix === null
          ? sha256('MISSING\n')
          : sha256(canonical(remediationClosureMatrix)),
    },
  };
}

function selfDigestValid(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const { [field]: claimed, ...body } = value;
  return typeof claimed === 'string' && claimed === sha256(canonical(body));
}

function withSelfDigest(body, field) {
  return { ...body, [field]: sha256(canonical(body)) };
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${String(process.pid)}-${sha256(String(Date.now())).slice(0, 8)}`;
  writeFileSync(temporary, canonical(value));
  renameSync(temporary, path);
}

function writeBytesAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${String(process.pid)}-${sha256(String(Date.now())).slice(0, 8)}`;
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}

function parseMandateContainer(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source);
  if (match === null) return null;
  try {
    const value = parseYaml(match[1]);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function fencedBindingObjects(source, markerField = 'devai_reviewer_binding') {
  const values = [];
  const malformed = [];
  const expression = /```(?:json|yaml|yml)\s*\r?\n([\s\S]*?)\r?\n```/giu;
  for (const match of source.matchAll(expression)) {
    const raw = match[1].trim();
    let value;
    try {
      value = /^\s*\{/u.test(raw) ? JSON.parse(raw) : parseYaml(raw);
    } catch (error) {
      if (raw.includes(markerField)) malformed.push(String(error));
      continue;
    }
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.hasOwn(value, markerField)
    )
      values.push(value);
  }
  return { values, malformed };
}

function resolveExactCandidateV6(revision, findings) {
  if (!SHA40.test(revision)) {
    findings.push(
      finding(
        'REVIEWER_BINDING_CANDIDATE_REQUIRED',
        'authoritative reviewer boundary requires a literal 40-hex candidate commit',
        { revision },
      ),
    );
    return null;
  }
  try {
    const candidate = git(repoRoot, ['rev-parse', `${revision}^{commit}`]);
    if (!SHA40.test(candidate)) throw new Error('resolved revision is not one exact commit SHA');
    return candidate;
  } catch (error) {
    findings.push(
      finding(
        'REVIEWER_BINDING_CANDIDATE_REQUIRED',
        'reviewer authority requires one exact candidate commit',
        { revision, detail: String(error) },
      ),
    );
    return null;
  }
}

/**
 * An authoritative consumer binds exactly one literal candidate. The revision is never
 * inferred from the worktree, and no worktree byte is read to decide whether the rule
 * applies: reading mutable policy or profile here would let a dirty tree choose its own
 * strictness, which is the defect this resolution closes.
 */
function resolveConsumerCandidateV8(_round, findings) {
  return resolveExactCandidateV6(option('--candidate') ?? '', findings);
}

function reviewerBindingV4(context, revision) {
  const findings = [];
  const candidates = [];
  const exactCandidate = resolveExactCandidateV6(revision, findings);
  if (exactCandidate === null)
    return { findings, diagnostic: null, selected: null, profileBound: false };
  let tracked;
  try {
    tracked = trackedPaths(repoRoot, exactCandidate).filter((path) =>
      /^product\/owner-mandates\/OM-[0-9]+\.md$/u.test(path),
    );
  } catch (error) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_UNREADABLE',
        'candidate-tree reviewer binding census is unavailable',
        { revision: exactCandidate, detail: String(error) },
      ),
    );
    return { findings, diagnostic: null, selected: null, profileBound: false };
  }
  for (const path of tracked) {
    let source;
    try {
      source = git(repoRoot, ['show', `${exactCandidate}:${path}`]);
    } catch (error) {
      findings.push(
        finding(
          'ENTRY_BLOCKED_REVIEWER_BINDING_UNREADABLE',
          'tracked reviewer binding source is unreadable',
          { path, detail: String(error) },
        ),
      );
      continue;
    }
    const container = parseMandateContainer(source);
    const extracted = fencedBindingObjects(source);
    for (const detail of extracted.malformed)
      findings.push(
        finding(
          'ENTRY_BLOCKED_REVIEWER_BINDING_SCHEMA_INVALID',
          'reviewer binding marker is malformed',
          { path, detail },
        ),
      );
    for (const marker of extracted.values) {
      const local = [];
      const valid = validateDocument(
        marker,
        context.policy.schemas.reviewer_binding,
        local,
        'ENTRY_BLOCKED_REVIEWER_BINDING_SCHEMA_INVALID',
        'reviewer binding',
      );
      if (!valid) {
        findings.push(...local.map((entry) => ({ ...entry, path })));
        continue;
      }
      if (
        container === null ||
        container.id !== marker.mandate_id ||
        container.status !== marker.mandate_status ||
        container.authority !== 'Owner'
      ) {
        findings.push(
          finding(
            'ENTRY_BLOCKED_REVIEWER_BINDING_CONTAINER_MISMATCH',
            'binding marker disagrees with its Owner mandate container',
            { path },
          ),
        );
        continue;
      }
      candidates.push({ path, marker, digest: sha256(canonical(marker)) });
    }
  }
  const relevant = candidates.filter(({ marker }) => marker.round === context.profile.round);
  const reviewer = context.profile.reviewer;
  const profileBound = reviewer?.mandate_id !== null && reviewer?.model_selector !== null;
  if (relevant.length > 1)
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_AMBIGUOUS',
        'more than one complete active binding selects the round',
        { mandate_ids: relevant.map(({ marker }) => marker.mandate_id) },
      ),
    );
  if (relevant.length === 0) {
    const diagnostic = finding(
      'ENTRY_BLOCKED_REVIEWER_UNBOUND',
      'round reviewer has no tracked complete active binding',
    );
    return { findings, diagnostic, selected: null, profileBound };
  }
  const selected = relevant[0];
  if (reviewer?.fallback !== 'forbidden')
    findings.push(
      finding('REVIEWER_FALLBACK_FORBIDDEN', 'reviewer fallback must remain forbidden'),
    );
  if (
    !profileBound ||
    selected.marker.mandate_id !== reviewer.mandate_id ||
    selected.marker.model_selector !== reviewer.model_selector ||
    selected.marker.role !== reviewer.role ||
    selected.marker.fallback !== reviewer.fallback
  ) {
    findings.push(
      finding(
        'ENTRY_BLOCKED_REVIEWER_BINDING_CONFLICT',
        'profile and structured reviewer binding disagree',
      ),
    );
  }
  return { findings, diagnostic: null, selected, profileBound };
}

function roundDeclarationV4(context, candidate, findings, required = true) {
  const candidates = [];
  const path = 'law/register/DECISIONS.md';
  let source = '';
  try {
    source = git(repoRoot, ['show', `${candidate}:${path}`]);
  } catch (error) {
    if (required)
      findings.push(
        finding('ROUND_DECLARATION_INVALID', 'exact candidate declaration register is unreadable', {
          detail: String(error),
        }),
      );
    return null;
  }
  const sections = source.split(/(?=^### DII-[0-9]+\b)/gmu);
  for (const section of sections) {
    const heading = /^### (DII-[0-9]+)\b/mu.exec(section)?.[1];
    if (heading === undefined) continue;
    const extracted = fencedBindingObjects(section, 'devai_round_declaration');
    for (const detail of extracted.malformed)
      findings.push(
        finding('ROUND_DECLARATION_MALFORMED', 'marker-shaped round declaration is malformed', {
          decision_id: heading,
          detail,
        }),
      );
    for (const { devai_round_declaration: marker, ...value } of extracted.values) {
      if (marker !== true) continue;
      const declaration = { devai_round_declaration: marker, ...value };
      const local = [];
      if (
        validateDocument(
          declaration,
          context.policy.schemas.round_declaration,
          local,
          'ROUND_DECLARATION_SCHEMA_INVALID',
          'round declaration',
        ) &&
        declaration.round === context.profile.round &&
        declaration.decision_id === heading
      )
        candidates.push({ path, declaration, digest: sha256(canonical(declaration)) });
      else findings.push(...local);
    }
  }
  if (candidates.length !== 1) {
    if (required)
      findings.push(
        finding(
          'ROUND_DECLARATION_INVALID',
          'exact candidate tree must contain exactly one schema-valid round declaration',
          { count: candidates.length },
        ),
      );
    return null;
  }
  const selected = candidates[0];
  if (
    context.profile.declaration?.decision_id !== selected.declaration.decision_id ||
    context.profile.declaration?.exact_base !== selected.declaration.exact_base
  ) {
    findings.push(
      finding(
        'ROUND_DECLARATION_INVALID',
        'profile declaration differs from the exact candidate-tree Architect marker',
      ),
    );
    return null;
  }
  return selected;
}

function deriveControlProvenanceV6(context, candidate, findings) {
  const tree = candidateTreeEntries(candidate);
  const provenancePath = context.profile.sources.control_provenance;
  let provenance;
  try {
    provenance = JSON.parse(candidateFile(repoRoot, candidate, provenancePath));
    validateDocument(
      provenance,
      context.policy.schemas.control_provenance,
      findings,
      'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
      'control provenance',
    );
  } catch (error) {
    findings.push(
      finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'control provenance cannot be authenticated', {
        detail: String(error),
      }),
    );
    return null;
  }
  if (
    provenance.round !== context.profile.round ||
    (provenance.root_decision !== context.policy.decision_id &&
      provenance.discovery_mode?.decisions !== 'exact-register-transitive-from-root')
  ) {
    findings.push(
      finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'control provenance root identity is stale'),
    );
  }

  const entries = [];
  const ids = new Set();
  const paths = new Set();
  const sourceBytes = (sourceRef) => {
    const [path, fragment] = sourceRef.split('#', 2);
    const objectId = tree.get(path);
    if (objectId === undefined) throw new Error(`untracked source ${path}`);
    const raw = gitBytes(repoRoot, ['cat-file', 'blob', objectId]);
    if (fragment === undefined) return raw;
    const text = raw.toString('utf8');
    if (/^DII-[0-9]+$/u.test(fragment)) {
      const sections = text.split(/(?=^### DII-[0-9]+\b)/gmu);
      const section = sections.find((value) => value.startsWith(`### ${fragment} `));
      if (section === undefined) throw new Error(`decision section ${fragment} is missing`);
      return Buffer.from(section);
    }
    return raw;
  };
  const add = (controlId, kind, sourceRef, derivation, status = 'active') => {
    if (ids.has(controlId)) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_DUPLICATE_ID', 'active control ID is duplicated', {
          control_id: controlId,
        }),
      );
      return;
    }
    if (paths.has(sourceRef)) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_DUPLICATE_PATH', 'active control source is duplicated', {
          path: sourceRef,
        }),
      );
      return;
    }
    if (status !== 'active') {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_INACTIVE', 'referenced control is not active', {
          control_id: controlId,
          path: sourceRef,
          status,
        }),
      );
      return;
    }
    try {
      ids.add(controlId);
      paths.add(sourceRef);
      entries.push({
        control_id: controlId,
        kind,
        path: sourceRef,
        status: 'active',
        derivation,
        raw_digest: sha256(sourceBytes(sourceRef)),
      });
    } catch (error) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_UNTRACKED', 'derived control source is unresolved', {
          control_id: controlId,
          path: sourceRef,
          detail: String(error),
        }),
      );
    }
  };
  const addSource = (sourceRef, derivation = 'profile-source') => {
    if (typeof sourceRef !== 'string' || sourceRef.length === 0 || paths.has(sourceRef)) return;
    add(`source:${sha256(sourceRef).slice(0, 24)}`, 'tracked-manifest', sourceRef, derivation);
  };

  const decisionRows = provenance.decisions ?? [];
  const decisionIds = decisionRows.map(({ decision_id }) => decision_id);
  if (new Set(decisionIds).size !== decisionIds.length)
    findings.push(
      finding(
        'ACTIVE_CONTROL_CENSUS_DUPLICATE_ID',
        'decision identifiers must be unique before provenance map construction',
      ),
    );
  const decisions = new Map(decisionRows.map((entry) => [entry.decision_id, entry]));
  const visiting = new Set();
  const visited = new Set();
  const registerSource = candidateFile(repoRoot, candidate, provenance.decision_register);
  const registerSections = new Map(
    registerSource
      .split(/(?=^### DII-[0-9]+\b)/gmu)
      .map((section) => [/^### (DII-[0-9]+)\b/mu.exec(section)?.[1], section])
      .filter(([decisionId]) => decisionId !== undefined),
  );
  const derivedDependencies = (decisionId) => {
    const section = registerSections.get(decisionId) ?? '';
    const metadata = section.split('\n')[1] ?? '';
    return [
      ...new Set(
        [...metadata.matchAll(/\bDII-[0-9]+\b/gu)]
          .map(([id]) => id)
          .filter((id) => id !== decisionId && registerSections.has(id)),
      ),
    ].sort();
  };
  for (const row of decisionRows) {
    const derived = derivedDependencies(row.decision_id);
    if (canonical([...(row.depends_on ?? [])].sort()) !== canonical(derived))
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
          'declared decision edges differ from exact-register dependencies',
          { decision_id: row.decision_id, declared: row.depends_on ?? [], derived },
        ),
      );
  }
  const visitDecision = (decisionId) => {
    if (visited.has(decisionId)) return;
    if (visiting.has(decisionId)) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'decision provenance contains a cycle', {
          decision_id: decisionId,
        }),
      );
      return;
    }
    const declaration = decisions.get(decisionId);
    if (declaration === undefined) {
      findings.push(
        finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'transitive decision is undeclared', {
          decision_id: decisionId,
        }),
      );
      return;
    }
    visiting.add(decisionId);
    for (const dependency of declaration.depends_on ?? []) visitDecision(dependency);
    visiting.delete(decisionId);
    visited.add(decisionId);
    const section = registerSections.get(decisionId);
    const active =
      section !== undefined &&
      /`type: decision · status: active · authority: Architect\b/u.test(section);
    add(
      decisionId,
      'architect-decision',
      `${provenance.decision_register}#${decisionId}`,
      'decision-provenance',
      declaration.status === 'active' && active ? 'active' : 'inactive',
    );
  };
  visitDecision(provenance.root_decision);
  if (visited.size !== decisions.size)
    findings.push(
      finding('ACTIVE_CONTROL_CENSUS_EXTRA', 'provenance declares unreachable decision rows'),
    );

  const mandateDerivationRequired =
    provenance.discovery_mode?.owner_mandates === 'exact-candidate-transitive-references';
  const referencedMandateIds = new Set();
  const collectMandateReferences = (value) => {
    for (const match of value.matchAll(/\bOM-[0-9]+\b/gu)) referencedMandateIds.add(match[0]);
  };
  for (const decisionId of visited) {
    const section = registerSections.get(decisionId);
    if (section !== undefined) collectMandateReferences(section.split('\n')[1] ?? '');
  }
  for (const path of [
    context.profile.sources.authorization,
    context.profile.sources.plan,
    context.profile.sources.orchestrator,
  ])
    if (typeof path === 'string')
      collectMandateReferences(candidateFile(repoRoot, candidate, path));
  const mandateRows = provenance.owner_mandates ?? [];
  const declaredMandateIds = mandateRows.map(({ mandate_id: mandateId }) => mandateId);
  if (
    mandateDerivationRequired &&
    (new Set(declaredMandateIds).size !== declaredMandateIds.length ||
      canonical([...declaredMandateIds].sort()) !== canonical([...referencedMandateIds].sort()))
  )
    findings.push(
      finding(
        'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
        'declared Owner mandates differ from exact-candidate transitive authority references',
        {
          declared: [...declaredMandateIds].sort(),
          derived: [...referencedMandateIds].sort(),
        },
      ),
    );

  for (const mandate of mandateRows) {
    if (mandate.path !== `product/owner-mandates/${mandate.mandate_id}.md`)
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_DECLARATION_MISMATCH',
          'Owner mandate path differs from its exact conventional identity',
          { mandate_id: mandate.mandate_id, path: mandate.path },
        ),
      );
    let container = null;
    try {
      container = parseMandateContainer(candidateFile(repoRoot, candidate, mandate.path));
    } catch {
      container = null;
    }
    const status =
      container?.id === mandate.mandate_id &&
      container?.authority === 'Owner' &&
      container?.status === mandate.required_status
        ? 'active'
        : 'inactive';
    if (status !== 'active')
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_CONFLICT',
          'Owner mandate container conflicts with structured control provenance',
          { mandate_id: mandate.mandate_id, path: mandate.path },
        ),
      );
    add(mandate.mandate_id, 'owner-mandate', mandate.path, 'authority-reference', status);
  }

  add(context.policy.policy_id, 'policy', 'law/policy/round-close-controls.json', 'profile-source');
  for (const [schemaId, path] of Object.entries(context.policy.schemas ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  ))
    add(`schema:${schemaId}`, 'policy-schema', path, 'policy-schema-map');
  add(`profile:${context.profile.round}`, 'round-profile', context.profilePath, 'profile-source');
  add(
    `graph:${context.profile.round}`,
    'affected-test-graph',
    context.profile.sources.affected_test_graph,
    'profile-source',
  );
  add(
    `obligations:${context.profile.round}`,
    'obligation-registry',
    context.profile.sources.obligations,
    'profile-source',
  );
  add(
    `claims:${context.profile.round}`,
    'current-claim-registry',
    context.profile.sources.current_claims,
    'profile-source',
  );
  add(
    `prior-findings:${context.profile.round}`,
    'prior-finding-registry',
    context.profile.sources.prior_finding_registry,
    'profile-source',
  );
  addSource(provenancePath);
  addSource(context.profile.sources.remediation_closure_matrix);
  for (const path of provenance.manifest_roots ?? []) addSource(path, 'profile-manifest');
  for (const path of provenance.normative_source_roots ?? []) addSource(path, 'profile-manifest');
  for (const findingClass of context.priorFindingRegistry?.finding_classes ?? [])
    addSource(findingClass.origin_evidence.split('#', 1)[0], 'profile-manifest');
  for (const obligation of context.obligations?.obligations ?? [])
    for (const sourceRef of obligation.source_refs ?? []) addSource(sourceRef, 'profile-manifest');

  if (context.profile.declaration?.decision_id !== null) {
    const declaration = roundDeclarationV4(context, candidate, findings);
    if (declaration !== null && !paths.has(declaration.path))
      add(
        `declaration:${declaration.declaration.decision_id}`,
        'round-declaration',
        declaration.path,
        'declaration-binding',
      );
  }

  entries.sort((left, right) =>
    `${left.kind}\0${left.control_id}\0${left.path}`.localeCompare(
      `${right.kind}\0${right.control_id}\0${right.path}`,
    ),
  );
  const body = {
    schemaVersion: '1.0.0',
    round: context.profile.round,
    candidate_sha: candidate,
    candidate_tree: git(repoRoot, ['rev-parse', `${candidate}^{tree}`]),
    policy_digest: context.digests.policy,
    profile_digest: context.digests.profile,
    entries,
    entry_count: entries.length,
    population_digest: sha256(canonical(entries)),
  };
  const census = withSelfDigest(body, 'census_digest_sha256');
  if (entries.length === 0)
    findings.push(finding('ACTIVE_CONTROL_CENSUS_INCOMPLETE', 'active control census is empty'));
  validateDocument(
    census,
    context.policy.schemas.active_control_census,
    findings,
    'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
    'active control census',
  );
  return findings.some(({ code }) => code.startsWith('ACTIVE_CONTROL_CENSUS_')) ? null : census;
}

function deriveActiveControlCensusV5(context, candidate, findings) {
  return deriveControlProvenanceV6(context, candidate, findings);
}

function affectedExecutionV4(context, exactBase, candidate, passes, findings) {
  const executionPasses = passes.map((pass, index) => {
    const nodes = pass.affected_results.map((entry) => {
      const body = {
        node_id: entry.node_id ?? entry.task_id,
        outcome: entry.plan_outcome ?? entry.outcome,
        result: entry.result,
        reason_codes: [...new Set(entry.reason_codes ?? ['NO_FRESH_RESULT'])].sort(),
        changed_inputs: [...new Set(entry.changed_inputs ?? [])].sort(),
        task_key: entry.task_key,
        gate_freshness_profile_digest: entry.gate_freshness_profile_digest,
        input_manifest_digest: entry.input_manifest_digest,
        dependency_input_manifest_digest: sha256(canonical(entry.dependency_input_manifest ?? [])),
        dependency_keys: entry.dependency_keys ?? {},
        toolchain_digest: entry.toolchain_digest,
        environment_digest: entry.environment_digest,
        fallback_population: entry.fallback_population ?? null,
        output_contract: entry.output_contract ?? 'none',
        outputs_digest: sha256(canonical(entry.outputs ?? [])),
      };
      return withSelfDigest(body, 'result_digest');
    });
    const plan = nodes.map(
      ({ result: _result, result_digest: _digest, outputs_digest: _outputs, ...entry }) => entry,
    );
    return withSelfDigest(
      {
        pass_number: index + 1,
        plan_digest: sha256(canonical(plan)),
        result_population_digest: sha256(canonical(nodes)),
        nodes,
      },
      'pass_digest_sha256',
    );
  });
  const changeRecords = (committedChangeRecords(exactBase, candidate, findings) ?? []).map(
    (record) => {
      const body = {
        record_id: record.record_id,
        status: record.status.startsWith('R')
          ? 'R'
          : record.status.startsWith('C')
            ? 'C'
            : record.status,
        preimage: record.preimage,
        postimage: record.postimage,
        affected_paths: [...new Set(record.paths)].sort(),
      };
      return { ...body, record_digest: sha256(canonical(body)) };
    },
  );
  const execution = withSelfDigest(
    {
      schemaVersion: context.policy.schemaVersion === '5.0.0' ? '2.0.0' : '1.0.0',
      round: context.profile.round,
      exact_base: exactBase,
      candidate_sha: candidate,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
      ...(context.policy.schemaVersion === '5.0.0' ? { change_records: changeRecords } : {}),
      passes: executionPasses,
    },
    'execution_digest_sha256',
  );
  const validationFindings = [];
  validateDocument(
    execution,
    context.policy.schemas.affected_test_execution,
    validationFindings,
    'AFFECTED_EXECUTION_INVALID',
    'affected-test execution',
  );
  findings.push(...validationFindings);
  return validationFindings.length === 0 ? execution : null;
}

/**
 * One readiness computation for policy-check, entry-check and status. Readiness is
 * false whenever any ENTRY_BLOCKED_* condition holds, whether it arrives as a finding
 * or as the unbound round declaration, so the three consumers cannot disagree.
 */
function entryReadinessV9(context, resolution, findings) {
  const blocked = findings
    .map(({ code }) => String(code))
    .filter((code) => code.startsWith('ENTRY_BLOCKED_'));
  const declarationUnbound =
    context === null ||
    context.profile?.declaration?.decision_id === null ||
    context.profile?.declaration?.decision_id === undefined ||
    context.profile?.declaration?.exact_base === null ||
    context.profile?.declaration?.exact_base === undefined;
  if (declarationUnbound) blocked.push('ENTRY_BLOCKED_DECLARATION_UNBOUND');
  if (resolution !== null && resolution?.selected === null)
    blocked.push('ENTRY_BLOCKED_REVIEWER_BINDING_UNRESOLVED');
  const codes = [...new Set(blocked)];
  return {
    entry_ready: codes.length === 0 && findings.length === 0,
    blocked: codes,
    declaration_unbound: declarationUnbound,
  };
}

function policyCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const phase = option('--phase') ?? 'pre-entry-preparation';
  const exactCandidate = resolveConsumerCandidateV8(round, findings);
  const context = loadV4Context(round, findings, exactCandidate);
  let resolution = null;
  let declarationDiagnostic = null;
  if (context !== null) {
    try {
      const policyBytes = candidateFile(
        repoRoot,
        exactCandidate,
        'law/policy/round-close-controls.json',
      );
      const mirrorBytes = candidateFile(
        repoRoot,
        exactCandidate,
        '.devai/config/round-close-controls.json',
      );
      if (policyBytes !== mirrorBytes)
        findings.push(
          finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
        );
    } catch (error) {
      findings.push(
        finding(
          'POLICY_MIRROR_DRIFT',
          `candidate materialization is unavailable: ${String(error)}`,
        ),
      );
    }
    resolution = reviewerBindingV4(context, exactCandidate ?? 'INVALID');
    findings.push(...resolution.findings);
    if (exactCandidate !== null && context.policy.schemaVersion === '5.0.0') {
      validateNormativeSourceCoverageV6(context, exactCandidate, findings);
      deriveControlProvenanceV6(context, exactCandidate, findings);
    }
    if (resolution.diagnostic !== null && resolution.profileBound)
      findings.push(resolution.diagnostic);
    if (
      context.profile.declaration?.decision_id === null ||
      context.profile.declaration?.exact_base === null
    )
      declarationDiagnostic = finding(
        'ENTRY_BLOCKED_DECLARATION_UNBOUND',
        'round has no structured B0 decision and exact base declaration',
      );
  }
  const diagnostics = [
    ...(resolution?.diagnostic !== null && resolution?.profileBound === false
      ? [resolution.diagnostic]
      : []),
    ...(declarationDiagnostic === null ? [] : [declarationDiagnostic]),
  ];
  emit({
    ok: findings.length === 0,
    command: 'policy-check',
    round,
    phase,
    entry_ready: entryReadinessV9(context, resolution, findings).entry_ready,
    diagnostics,
    findings,
  });
}

function entryCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const head = resolveConsumerCandidateV8(round, findings);
  const context = loadV4Context(round, findings, head);
  if (cleanStatus(repoRoot) !== '')
    findings.push(
      finding('ENTRY_BLOCKED_DIRTY_WORKTREE', 'entry requires a clean exact-HEAD worktree'),
    );
  let declarationDiagnostic = null;
  if (context !== null) {
    if (
      context.profile.declaration?.decision_id === null ||
      context.profile.declaration?.exact_base === null
    ) {
      declarationDiagnostic = finding(
        'DECLARATION_PENDING_B0',
        'structured round declaration remains intentionally unbound until B0',
      );
      findings.push(
        finding(
          'ENTRY_BLOCKED_DECLARATION_UNBOUND',
          'entry requires one structured B0 decision and exact base declaration',
        ),
      );
    }
    const resolution = reviewerBindingV4(context, head ?? 'INVALID');
    findings.push(...resolution.findings);
    if (resolution.diagnostic !== null) findings.push(resolution.diagnostic);
  }
  emit({
    ok: findings.length === 0,
    command: 'entry-check',
    round,
    entry_ready: entryReadinessV9(context, null, findings).entry_ready,
    diagnostics: declarationDiagnostic === null ? [] : [declarationDiagnostic],
    findings,
  });
}

function materializeV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const context = loadV4Context(round, findings);
  if (context !== null && findings.length === 0) {
    mkdirSync(dirname(mirrorPath), { recursive: true });
    const temporary = `${mirrorPath}.tmp-${String(process.pid)}`;
    writeFileSync(temporary, readFileSync(policyPath));
    renameSync(temporary, mirrorPath);
  }
  emit({
    ok: findings.length === 0,
    command: 'materialize',
    round,
    output: relative(repoRoot, mirrorPath),
    findings,
  });
}

function materializationsCheckV8() {
  const findings = [];
  try {
    const compared = run('git', [
      'diff',
      '--no-index',
      '--quiet',
      '--',
      relative(repoRoot, policyPath),
      relative(repoRoot, mirrorPath),
    ]);
    if (compared.status !== 0)
      findings.push(
        finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
      );
  } catch (error) {
    findings.push(finding('POLICY_MIRROR_DRIFT', String(error)));
  }
  emit({ ok: findings.length === 0, command: 'materializations-check', findings });
}

/**
 * Self-binding authoritative attestation. A static policy argv cannot carry a 40-hex
 * candidate, so this gate derives one: it refuses a dirty tree, resolves the checked-out
 * commit to one literal identity, proves the working tree matches that commit's tree,
 * and then reads every byte of authority from that Git object. Any mutable byte fails it
 * closed, so worktree substitution cannot influence the verdict. It restores the
 * reviewer-binding census, normative-source coverage and control-provenance derivation
 * that the degraded materializations gate had dropped from the literal roster.
 */
function controlAttestationV9() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidate = candidateBoundRevision;
  if (candidate === null) {
    emit({
      ok: false,
      command: 'control-attestation',
      findings: [
        finding(
          'REVIEWER_BINDING_CANDIDATE_REQUIRED',
          'attestation requires a clean tree at one literal commit',
        ),
      ],
    });
    return;
  }
  const workingTree = git(repoRoot, ['rev-parse', 'HEAD^{tree}']);
  const committedTree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
  if (workingTree !== committedTree)
    findings.push(
      finding('CONTROL_ATTESTATION_TREE_MISMATCH', 'working tree differs from the bound commit', {
        working_tree: workingTree,
        committed_tree: committedTree,
      }),
    );
  try {
    const policyBytes = candidateFile(repoRoot, candidate, 'law/policy/round-close-controls.json');
    const mirrorBytes = candidateFile(
      repoRoot,
      candidate,
      '.devai/config/round-close-controls.json',
    );
    if (policyBytes !== mirrorBytes)
      findings.push(
        finding('POLICY_MIRROR_DRIFT', 'generic policy and Engineer materialization differ'),
      );
  } catch (error) {
    findings.push(finding('POLICY_MIRROR_DRIFT', String(error)));
  }
  const context = loadV4Context(round, findings, candidate);
  if (context !== null) {
    const resolution = reviewerBindingV4(context, candidate);
    findings.push(...resolution.findings);
    if (resolution.diagnostic !== null && resolution.profileBound)
      findings.push(resolution.diagnostic);
    if (context.policy.schemaVersion === '5.0.0') {
      validateNormativeSourceCoverageV6(context, candidate, findings);
      deriveControlProvenanceV6(context, candidate, findings);
    }
  }
  emit({
    ok: findings.length === 0,
    command: 'control-attestation',
    round,
    candidate,
    findings,
  });
}

function candidateIdentityDigestV4(context, base, candidate, tree) {
  return sha256(
    canonical({
      round: context.profile.round,
      base_sha: base,
      candidate_sha: candidate,
      tree_sha: tree,
      profile_digest: context.digests.profile,
      policy_digest: context.digests.policy,
      graph_digest: context.digests.graph,
    }),
  );
}

function readJsonPrecisely(path, missingCode, malformedCode, findings) {
  if (!existsSync(path)) {
    findings.push(finding(missingCode, `missing runtime artifact ${relative(repoRoot, path)}`));
    return null;
  }
  try {
    return readJson(path);
  } catch (error) {
    findings.push(
      finding(malformedCode, `malformed runtime artifact: ${String(error)}`, {
        path: relative(repoRoot, path),
      }),
    );
    return null;
  }
}

function validateNormativeSourceCoverageV6(context, candidate, findings) {
  let registry;
  let provenance;
  let baseline;
  try {
    registry = JSON.parse(candidateFile(repoRoot, candidate, context.profile.sources.obligations));
    provenance = JSON.parse(
      candidateFile(repoRoot, candidate, context.profile.sources.control_provenance),
    );
    if (
      provenance.discovery_mode?.normative_sources === 'independent-obligation-baseline' &&
      typeof context.profile.sources.obligation_baseline !== 'string'
    ) {
      findings.push(
        finding(
          'SEMANTIC_OBLIGATION_BASELINE_MISMATCH',
          'schema-v5 review profiles require an independent obligation baseline',
        ),
      );
      return false;
    }
    baseline = context.profile.sources.obligation_baseline
      ? JSON.parse(candidateFile(repoRoot, candidate, context.profile.sources.obligation_baseline))
      : {
          normative_source_paths: provenance.normative_source_roots ?? [],
          obligation_ids: (registry.obligations ?? []).map(({ obligation_id }) => obligation_id),
        };
  } catch (error) {
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_SOURCE_UNREGISTERED',
        'normative source registry is unavailable in the exact candidate',
        { detail: String(error) },
      ),
    );
    return false;
  }
  const baselinePaths = baseline.normative_source_paths ?? [];
  const baselineIds = baseline.obligation_ids ?? [];
  const expectedPaths = [...new Set(baselinePaths)].sort();
  if (
    new Set(baselinePaths).size !== baselinePaths.length ||
    new Set(baselineIds).size !== baselineIds.length ||
    canonical([...(provenance.normative_source_roots ?? [])].sort()) !== canonical(expectedPaths)
  )
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_BASELINE_MISMATCH',
        'declared normative populations differ from the independent baseline',
      ),
    );
  const rows = registry.normative_sources ?? [];
  const actualPaths = rows.map(({ path }) => path).sort();
  if (
    new Set(actualPaths).size !== actualPaths.length ||
    canonical(actualPaths) !== canonical(expectedPaths)
  )
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_SOURCE_UNREGISTERED',
        'normative source additions, removals, or duplicate rows are forbidden',
      ),
    );
  const knownIds = (registry.obligations ?? []).map(({ obligation_id }) => obligation_id);
  if (canonical([...knownIds].sort()) !== canonical([...baselineIds].sort()))
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_BASELINE_MISMATCH',
        'registered obligation IDs differ from the independent baseline',
      ),
    );
  if (new Set(knownIds).size !== knownIds.length)
    findings.push(
      finding('SEMANTIC_OBLIGATION_ID_DUPLICATE', 'obligation identifiers are duplicated'),
    );
  const known = new Set(knownIds);
  const covered = new Set();
  const candidateTree = candidateTreeEntries(candidate);
  for (const row of rows) {
    let actualDigest = null;
    try {
      const objectId = candidateTree.get(row.path);
      if (objectId !== undefined)
        actualDigest = sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId]));
    } catch {
      actualDigest = null;
    }
    if (!SHA256.test(row.source_digest_sha256 ?? '') || row.source_digest_sha256 !== actualDigest)
      findings.push(
        finding(
          'SEMANTIC_OBLIGATION_SOURCE_DIGEST_INVALID',
          'normative source digest differs from exact candidate bytes',
          { path: row.path },
        ),
      );
    if (new Set(row.obligation_ids ?? []).size !== (row.obligation_ids ?? []).length)
      findings.push(
        finding(
          'SEMANTIC_OBLIGATION_ID_DUPLICATE',
          'one normative source repeats an obligation mapping',
          { path: row.path },
        ),
      );
    for (const id of row.obligation_ids ?? []) {
      if (!known.has(id))
        findings.push(
          finding('SEMANTIC_OBLIGATION_ID_UNKNOWN', 'normative source maps an unknown obligation', {
            path: row.path,
            obligation_id: id,
          }),
        );
      covered.add(id);
    }
  }
  const uncovered = knownIds.filter((id) => !covered.has(id));
  if (uncovered.length > 0)
    findings.push(
      finding(
        'SEMANTIC_OBLIGATION_ID_UNCOVERED',
        'registered obligations lack a normative source mapping',
        { obligation_ids: uncovered },
      ),
    );
  return !findings.some(({ code }) => code.startsWith('SEMANTIC_OBLIGATION_'));
}

function authenticateCandidateProofV4(context, base, candidate, findings) {
  const candidatePath = join(repoRoot, context.profile.runtime.candidate_manifest);
  const convergencePath = join(repoRoot, context.profile.runtime.convergence_evidence);
  const manifest = readJsonPrecisely(
    candidatePath,
    'CANDIDATE_MANIFEST_MISSING',
    'CANDIDATE_MANIFEST_MALFORMED',
    findings,
  );
  if (manifest === null) return null;
  if (
    !validateDocument(
      manifest,
      context.policy.schemas.candidate_manifest,
      findings,
      'CANDIDATE_MANIFEST_SCHEMA_INVALID',
      'candidate manifest',
    )
  )
    return null;
  if (!selfDigestValid(manifest, 'manifest_digest_sha256')) {
    findings.push(
      finding(
        'CANDIDATE_MANIFEST_SELF_DIGEST_INVALID',
        'candidate manifest self-digest is invalid',
      ),
    );
    return null;
  }
  const tree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
  if (context.policy.schemaVersion === '5.0.0')
    validateNormativeSourceCoverageV6(context, candidate, findings);
  const declaration = roundDeclarationV4(context, candidate, findings);
  const identityChecks = {
    round: manifest.round === context.profile.round,
    base_sha: manifest.base_sha === base,
    candidate_sha: manifest.candidate_sha === candidate,
    tree_sha: manifest.tree_sha === tree,
    policy_digest: manifest.policy_digest === context.digests.policy,
    profile_digest: manifest.profile_digest === context.digests.profile,
    graph_digest: manifest.graph_digest === context.digests.graph,
    declaration_present: declaration !== null,
    declaration_id:
      declaration !== null && manifest.declaration_id === declaration.declaration.decision_id,
    declaration_digest: declaration !== null && manifest.declaration_digest === declaration.digest,
    declaration_base: declaration !== null && declaration.declaration.exact_base === base,
  };
  if (Object.values(identityChecks).some((passed) => !passed)) {
    findings.push(
      finding(
        'CANDIDATE_MANIFEST_IDENTITY_INVALID',
        'candidate manifest does not bind the exact invocation',
        {
          failed_checks: Object.entries(identityChecks)
            .filter(([, passed]) => !passed)
            .map(([id]) => id),
        },
      ),
    );
    return null;
  }
  const binding = reviewerBindingV4(context, candidate);
  findings.push(...binding.findings);
  if (
    binding.selected === null ||
    binding.diagnostic !== null ||
    manifest.reviewer_binding_digest !== binding.selected.digest
  ) {
    findings.push(
      finding(
        'CANDIDATE_REVIEWER_BINDING_INVALID',
        'candidate manifest does not bind the exact candidate-tree reviewer census',
      ),
    );
    return null;
  }
  let activeControlCensus = null;
  if (context.policy.schemaVersion === '5.0.0') {
    activeControlCensus = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.active_control_census),
      'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
      'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID',
      findings,
    );
    const censusFindings = [];
    const expectedCensus = deriveActiveControlCensusV5(context, candidate, censusFindings);
    findings.push(...censusFindings);
    if (
      activeControlCensus === null ||
      expectedCensus === null ||
      !validateDocument(
        activeControlCensus,
        context.policy.schemas.active_control_census,
        findings,
        'ACTIVE_CONTROL_CENSUS_INCOMPLETE',
        'active control census',
      ) ||
      !selfDigestValid(activeControlCensus, 'census_digest_sha256') ||
      canonical(activeControlCensus) !== canonical(expectedCensus) ||
      manifest.active_control_census_digest !== expectedCensus.census_digest_sha256
    ) {
      findings.push(
        finding(
          'ACTIVE_CONTROL_CENSUS_RAW_IDENTITY_INVALID',
          'candidate manifest does not bind the independently derived raw-byte control census',
        ),
      );
      return null;
    }
  }
  const convergence = readJsonPrecisely(
    convergencePath,
    'CONVERGENCE_EVIDENCE_MISSING',
    'CONVERGENCE_EVIDENCE_MALFORMED',
    findings,
  );
  if (convergence === null) return null;
  if (
    !validateDocument(
      convergence,
      context.policy.schemas.round_convergence,
      findings,
      'CONVERGENCE_SCHEMA_INVALID',
      'convergence evidence',
    )
  )
    return null;
  if (!selfDigestValid(convergence, 'convergence_digest_sha256')) {
    findings.push(
      finding('CONVERGENCE_SELF_DIGEST_INVALID', 'convergence evidence self-digest is invalid'),
    );
    return null;
  }
  const impact = readJsonPrecisely(
    join(repoRoot, context.profile.runtime.impact_execution),
    'AFFECTED_EXECUTION_MISSING',
    'AFFECTED_EXECUTION_MALFORMED',
    findings,
  );
  if (
    impact === null ||
    !validateDocument(
      impact,
      context.policy.schemas.affected_test_execution,
      findings,
      'AFFECTED_EXECUTION_INVALID',
      'affected-test execution',
    ) ||
    !selfDigestValid(impact, 'execution_digest_sha256') ||
    impact.round !== context.profile.round ||
    impact.exact_base !== base ||
    impact.candidate_sha !== candidate ||
    impact.policy_digest !== context.digests.policy ||
    impact.graph_digest !== context.digests.graph ||
    convergence.impact_execution_digest !== impact.execution_digest_sha256 ||
    manifest.impact_execution_digest !== impact.execution_digest_sha256
  ) {
    findings.push(
      finding(
        'AFFECTED_EXECUTION_IDENTITY_INVALID',
        'affected-test execution evidence is missing, forged, or cross-bound to another candidate',
      ),
    );
    return null;
  }
  const expectedNodeIds = (context.graph?.nodes ?? []).map(({ id }) => id);
  const planFindings = [];
  const currentPlan = buildImpactPlan(context, base, candidate, planFindings);
  const expectedNodes = new Map((currentPlan?.nodes ?? []).map((node) => [node.node_id, node]));
  let impactComplete = Array.isArray(impact.passes) && impact.passes.length === 2;
  const impactIssues = [];
  if (
    currentPlan === null ||
    planFindings.some(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID')
  )
    impactComplete = false;
  for (const [index, pass] of (impact.passes ?? []).entries()) {
    const ids = (pass.nodes ?? []).map(({ node_id }) => node_id);
    if (
      !selfDigestValid(pass, 'pass_digest_sha256') ||
      pass.pass_number !== index + 1 ||
      canonical([...ids].sort()) !== canonical([...expectedNodeIds].sort()) ||
      new Set(ids).size !== ids.length ||
      pass.result_population_digest !== sha256(canonical(pass.nodes))
    ) {
      impactComplete = false;
      impactIssues.push(`pass-${String(index + 1)}-identity`);
    }
    const plan = (pass.nodes ?? []).map(
      ({ result: _result, result_digest: _digest, outputs_digest: _outputs, ...entry }) => entry,
    );
    if (pass.plan_digest !== sha256(canonical(plan))) {
      impactComplete = false;
      impactIssues.push(`pass-${String(index + 1)}-plan`);
    }
    for (const node of pass.nodes ?? []) {
      if (
        !selfDigestValid(node, 'result_digest') ||
        !['EXECUTED_PASS', 'REUSED_FRESH_PASS', 'BLOCKED'].includes(node.result)
      ) {
        impactComplete = false;
        impactIssues.push(`${node.node_id}-result`);
      }
      if (node.result === 'BLOCKED') {
        if (node.outcome !== 'BLOCKED' || expectedNodes.get(node.node_id)?.outcome !== 'BLOCKED') {
          impactComplete = false;
          impactIssues.push(`${node.node_id}-blocked`);
        }
        continue;
      }
      try {
        const cache = readJson(v3CachePath(context, node.node_id, node.task_key));
        const { result_digest: cacheDigest, ...cacheBody } = cache;
        const expected = expectedNodes.get(node.node_id);
        if (
          expected === undefined ||
          cacheDigest !== sha256(canonical(cacheBody)) ||
          cache.task_key !== node.task_key ||
          node.task_key !== expected.task_key ||
          [
            'argv',
            'cwd',
            'input_manifest_digest',
            'dependency_keys',
            'policy_digest',
            'graph_digest',
            'toolchain_digest',
            'environment_digest',
          ].some((key) => canonical(cache[key]) !== canonical(expected[key])) ||
          cache.result !== 'EXECUTED_PASS' ||
          node.outputs_digest !== sha256(canonical(cache.outputs ?? []))
        ) {
          impactComplete = false;
          impactIssues.push(`${node.node_id}-cache`);
        }
      } catch {
        impactComplete = false;
        impactIssues.push(`${node.node_id}-cache-missing`);
      }
    }
  }
  if (!impactComplete) {
    findings.push(
      finding(
        'AFFECTED_EXECUTION_POPULATION_INCOMPLETE',
        'affected-test execution does not prove every graph node exactly once in both passes',
        { issues: [...new Set(impactIssues)] },
      ),
    );
    return null;
  }
  const gateIds = (context.policy.convergence?.commands ?? []).map(({ id }) => id);
  const exactPopulation = sha256(canonical(gateIds));
  const toolchainDigest = toolchainFingerprint(context.policy, findings);
  const environmentDigest = environmentFingerprint(context.policy);
  const candidateEntries = candidateTreeEntries(candidate);
  const expectedGates = new Map(
    (context.policy.convergence?.commands ?? []).map((gate) => {
      let argv = [...gate.argv];
      if (
        argv[0] === 'node' &&
        argv[1] === 'scripts/run-round-close-controls.mjs' &&
        argv[2] === 'policy-check'
      )
        argv = [
          ...argv,
          '--round',
          context.profile.round,
          '--phase',
          'pre-entry-preparation',
          '--repo-root',
          repoRoot,
        ];
      if (context.policy.schemaVersion === '5.0.0') {
        const profile = gateFreshnessProfileV5(context, gate, findings);
        if (profile === null) return [gate.id, null];
        const inputManifest = rawCandidateInputManifest(candidate, profile.input_selectors);
        const dependencyInputManifest = rawCandidateInputManifest(
          candidate,
          profile.dependency_selectors,
        );
        const localToolchainManifest = toolchainManifestV5(
          context.policy,
          profile.toolchain_probe_ids,
          findings,
        );
        const localEnvironmentManifest = environmentManifestV5(
          context.policy,
          profile.environment_input_ids,
          findings,
        );
        const outputs =
          profile.output_contract === 'digest-required'
            ? v3OutputState(profile.required_outputs).outputs
            : [];
        const keyBody = {
          task_id: `gate-${gate.id}`,
          argv,
          cwd: '.',
          gate_freshness_profile_digest: sha256(canonical(profile)),
          input_manifest: inputManifest,
          input_manifest_digest: sha256(canonical(inputManifest)),
          dependency_input_manifest: dependencyInputManifest,
          dependency_keys: {},
          policy_digest: context.digests.policy,
          graph_digest: context.digests.graph,
          toolchain_digest: sha256(canonical(localToolchainManifest)),
          toolchain_manifest: localToolchainManifest,
          environment_digest: sha256(canonical(localEnvironmentManifest)),
          environment_manifest: localEnvironmentManifest,
          output_contract: profile.output_contract,
          outputs,
          producing_candidate: candidate,
        };
        return [gate.id, { ...keyBody, task_key: sha256(canonical(keyBody)) }];
      }
      const inputManifestDigest = sha256(
        canonical({
          argv,
          inputs: pathsForGlobs(
            repoRoot,
            candidate,
            context.policy.semantic_assertions?.population_sources ?? [],
          ).map((path) => ({ path, blob: candidateEntries.get(path) })),
          policy: context.digests.policy,
          profile: context.digests.profile,
          graph: context.digests.graph,
        }),
      );
      const keyBody = {
        task_id: `gate-${gate.id}`,
        argv,
        cwd: '.',
        input_manifest_digest: inputManifestDigest,
        dependency_keys: {},
        policy_digest: context.digests.policy,
        graph_digest: context.digests.graph,
        toolchain_digest: toolchainDigest,
        environment_digest: environmentDigest,
      };
      return [gate.id, { ...keyBody, task_key: sha256(canonical(keyBody)) }];
    }),
  );
  let populationComplete =
    canonical(convergence.authoritative_gate_ids) === canonical(gateIds) &&
    convergence.authoritative_population_digest === exactPopulation &&
    Array.isArray(convergence.passes) &&
    convergence.passes.length === 2;
  const semanticPasses = [];
  for (const [index, pass] of (convergence.passes ?? []).entries()) {
    if (!selfDigestValid(pass, 'pass_digest_sha256')) populationComplete = false;
    const ids = (pass.gate_results ?? []).map(({ gate_id }) => gate_id);
    if (
      canonical(ids) !== canonical(gateIds) ||
      new Set(ids).size !== ids.length ||
      pass.pass_number !== index + 1 ||
      pass.head_before !== candidate ||
      pass.head_after !== candidate ||
      pass.tree_sha !== tree ||
      pass.clean_before !== true ||
      pass.clean_after !== true ||
      (index === 1 && (pass.writes ?? []).length !== 0) ||
      pass.semantic_population_digest !== exactPopulation
    )
      populationComplete = false;
    const semanticResults = [];
    for (const result of pass.gate_results ?? []) {
      if (!selfDigestValid(result, 'result_digest')) populationComplete = false;
      try {
        const cache = readJson(v3CachePath(context, `gate-${result.gate_id}`, result.task_key));
        const { result_digest: cacheDigest, ...cacheBody } = cache;
        const expected = expectedGates.get(result.gate_id);
        const authenticatedFields =
          context.policy.schemaVersion === '5.0.0'
            ? [
                'task_id',
                'argv',
                'cwd',
                'gate_freshness_profile_digest',
                'input_manifest',
                'input_manifest_digest',
                'dependency_input_manifest',
                'dependency_keys',
                'policy_digest',
                'graph_digest',
                'toolchain_digest',
                'toolchain_manifest',
                'environment_digest',
                'environment_manifest',
                'output_contract',
                'outputs',
                'producing_candidate',
              ]
            : [
                'task_id',
                'argv',
                'cwd',
                'input_manifest_digest',
                'dependency_keys',
                'policy_digest',
                'graph_digest',
                'toolchain_digest',
                'environment_digest',
              ];
        if (
          expected === undefined ||
          expected === null ||
          cacheDigest !== sha256(canonical(cacheBody)) ||
          cacheDigest !== result.output_digest ||
          cache.task_key !== result.task_key ||
          result.task_key !== expected.task_key ||
          authenticatedFields.some((key) => canonical(cache[key]) !== canonical(expected[key])) ||
          cache.result !== 'EXECUTED_PASS'
        )
          populationComplete = false;
      } catch {
        populationComplete = false;
      }
      semanticResults.push({
        gate_id: result.gate_id,
        task_key: result.task_key,
        output_digest: result.output_digest,
      });
    }
    semanticPasses.push(semanticResults);
  }
  if (semanticPasses.length !== 2 || canonical(semanticPasses[0]) !== canonical(semanticPasses[1]))
    populationComplete = false;
  if (!populationComplete) {
    findings.push(
      finding(
        'CONVERGENCE_GATE_POPULATION_INCOMPLETE',
        'convergence does not contain two exact complete equivalent passes',
      ),
    );
    return null;
  }
  const identityDigest = candidateIdentityDigestV4(context, base, candidate, tree);
  if (
    manifest.candidate_identity_digest !== identityDigest ||
    convergence.candidate_identity_digest !== identityDigest ||
    convergence.exact_base !== base ||
    convergence.candidate_sha !== candidate ||
    convergence.candidate_tree !== tree ||
    manifest.convergence_digest !== convergence.convergence_digest_sha256
  ) {
    findings.push(
      finding(
        'CONVERGENCE_CANDIDATE_CROSS_DIGEST_INVALID',
        'candidate and convergence evidence do not share one exact identity and digest',
      ),
    );
    return null;
  }
  return { manifest, convergence, impact, tree, identityDigest, activeControlCensus };
}

function runtimeClaimValuesV4(context, convergence, candidate, findings, phase = 'pre-review') {
  const values = { exact_base: convergence?.exact_base, candidate_sha: candidate };
  const phasePrefix = `runtime-inputs.${phase}.`;
  const required = new Set();
  for (const claim of context.claimsRegistry?.claims ?? []) {
    for (const [name, specification] of Object.entries(claim.runtime_parameters ?? {})) {
      if (specification.source === 'convergence.exact_base') values[name] = convergence?.exact_base;
      else if (specification.source === 'convergence.candidate_sha') values[name] = candidate;
      else if (specification.source.startsWith(phasePrefix))
        required.add(specification.source.slice(phasePrefix.length));
    }
  }
  if (required.size === 0) return values;
  const runtimePath =
    context.profile.runtime[
      phase === 'post-publication' ? 'post_publication_claim_inputs' : 'pre_review_claim_inputs'
    ];
  const inputs = readJsonPrecisely(
    join(repoRoot, runtimePath),
    'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
    'CLAIM_RUNTIME_INPUTS_MALFORMED',
    findings,
  );
  if (inputs === null) return values;
  if (
    !validateDocument(
      inputs,
      context.policy.schemas.claim_runtime_inputs,
      findings,
      'CLAIM_RUNTIME_INPUTS_SCHEMA_INVALID',
      'claim runtime inputs',
    ) ||
    !selfDigestValid(inputs, 'inputs_digest_sha256') ||
    inputs.round !== context.profile.round ||
    inputs.phase !== phase ||
    inputs.candidate !== candidate
  ) {
    findings.push(
      finding(
        'CLAIM_RUNTIME_INPUTS_INVALID',
        'runtime inputs are not schema-valid, self-digested, phase-bound, and candidate-bound',
      ),
    );
    return values;
  }
  const ids = inputs.inputs.map(({ input_id }) => input_id);
  if (
    new Set(ids).size !== ids.length ||
    canonical([...ids].sort()) !== canonical([...required].sort())
  )
    findings.push(
      finding(
        'CLAIM_RUNTIME_INPUT_POPULATION_INVALID',
        'runtime input population differs from the exact required phase population',
      ),
    );
  for (const input of inputs.inputs) {
    if (
      !selfDigestValid(input, 'input_digest_sha256') ||
      new Set(input.evidence_manifest.map(({ ref }) => ref)).size !== input.evidence_manifest.length
    ) {
      findings.push(
        finding(
          'CLAIM_RUNTIME_INPUT_INVALID',
          'runtime input or evidence reference population is unauthenticated',
          { input_id: input.input_id },
        ),
      );
      continue;
    }
    for (const evidence of input.evidence_manifest) {
      const evidencePath = resolve(repoRoot, evidence.ref);
      if (
        (!evidencePath.startsWith(`${repoRoot}/`) && evidencePath !== repoRoot) ||
        !existsSync(evidencePath) ||
        !lstatSync(evidencePath).isFile() ||
        evidence.content_digest !== sha256(readFileSync(evidencePath))
      )
        findings.push(
          finding(
            'CLAIM_RUNTIME_INPUT_EVIDENCE_INVALID',
            'runtime input evidence digest is stale or unavailable',
            { input_id: input.input_id, ref: evidence.ref },
          ),
        );
    }
    const parameter = [...(context.claimsRegistry?.claims ?? [])]
      .flatMap((claim) => Object.entries(claim.runtime_parameters ?? {}))
      .find(
        ([_name, specification]) => specification.source === `${phasePrefix}${input.input_id}`,
      )?.[0];
    if (parameter !== undefined) values[parameter] = input.value;
  }
  return values;
}

function claimSourceManifestV4(selectors, candidate, tree, claimId, producerOutputDigest) {
  const manifest = [];
  for (const selector of selectors ?? []) {
    if (selector === '.git') {
      manifest.push({
        path: `git:commit/${candidate}`,
        state: 'present',
        content_digest: sha256(canonical({ candidate_sha: candidate, tree_sha: tree })),
      });
      continue;
    }
    if (selector === `producer-output:${claimId}`) {
      manifest.push({ path: selector, state: 'present', content_digest: producerOutputDigest });
      continue;
    }
    for (const entry of v3InputEntries([selector]))
      manifest.push({
        path: entry.source,
        state: entry.present ? 'present' : 'absent',
        content_digest: entry.digest,
      });
  }
  return [...new Map(manifest.map((entry) => [entry.path, entry])).values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

function extractClaimValueV4(raw, extractor) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw.trim();
  }
  if (extractor === '$') return value;
  const tokens = String(extractor)
    .replace(/^\$\.?/u, '')
    .replace(/\[([0-9]+)\]/gu, '.$1')
    .split('.')
    .filter(Boolean);
  return tokens.reduce((current, token) => current?.[token], value);
}

function renderedClaimProofV4(claim, location, extracted, _findings) {
  const absolute = join(repoRoot, location);
  if (!existsSync(absolute)) return null;
  const source = readFileSync(absolute, 'utf8');
  if (/\b(?:TBD|TODO|FIXME)\b|<[^>]+>/iu.test(source)) return { placeholderInvalid: true };
  const prefix = `DEVAI_CLAIM:${claim.claim_id}=`;
  const lines = source.split(/\r?\n/u).filter((line) => line.startsWith(prefix));
  if (lines.length !== 1) return { markerInvalid: true };
  const raw = lines[0].slice(prefix.length).trim();
  let rendered;
  try {
    rendered = JSON.parse(raw);
  } catch {
    rendered = raw;
  }
  if (
    typeof extracted === 'number' &&
    typeof rendered === 'string' &&
    /^-?[0-9]+(?:\.[0-9]+)?$/u.test(rendered)
  )
    rendered = Number(rendered);
  const body = {
    location,
    claim_marker: prefix,
    content_digest: sha256(source),
    extracted_rendered_value_digest: sha256(canonical(rendered)),
  };
  return { ...body, verification_digest: sha256(canonical(body)), rendered };
}

function materializeClaimsV4(context, convergence, candidate, findings, phase = 'pre-review') {
  const blockingCount = () =>
    findings.filter(({ code }) => code !== 'CACHE_RECORD_IDENTITY_INVALID').length;
  const startingBlocking = blockingCount();
  const postPublication = phase === 'post-publication';
  const preReview = postPublication
    ? validateClaimsV4(context, candidate, findings, 'materialized')
    : null;
  if (postPublication) {
    const candidateManifest = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.candidate_manifest),
      'CANDIDATE_MANIFEST_MISSING',
      'CANDIDATE_MANIFEST_MALFORMED',
      findings,
    );
    if (
      candidateManifest === null ||
      !validateDocument(
        candidateManifest,
        context.policy.schemas.candidate_manifest,
        findings,
        'CANDIDATE_MANIFEST_SCHEMA_INVALID',
        'candidate manifest',
      ) ||
      !selfDigestValid(candidateManifest, 'manifest_digest_sha256') ||
      candidateManifest.claims_digest !== preReview?.claims_digest_sha256 ||
      candidateManifest.candidate_sha !== candidate
    )
      findings.push(
        finding(
          'CLAIM_PRE_REVIEW_DIGEST_INVALID',
          'post-publication materialization requires the authenticated reviewed candidate and pre-review ledger',
        ),
      );
  }
  const runtimeValues = runtimeClaimValuesV4(context, convergence, candidate, findings, phase);
  const tree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
  const claims = [];
  for (const declaration of context.claimsRegistry?.claims ?? []) {
    if (!postPublication && declaration.availability === 'post-publication') {
      claims.push({
        ...declaration,
        proof_status: 'DEFERRED_POST_PUBLICATION',
        deferred_proof: {
          required_at: 'post-publication',
          declaration_digest: sha256(canonical(declaration)),
        },
      });
      continue;
    }
    if (postPublication && declaration.availability === 'pre-review') {
      const priorClaim = (preReview?.claims ?? []).find(
        ({ claim_id }) => claim_id === declaration.claim_id,
      );
      if (priorClaim === undefined)
        findings.push(
          finding(
            'CLAIM_POPULATION_INVALID',
            'post-publication receipt lacks a pre-review proven claim',
            { claim_id: declaration.claim_id },
          ),
        );
      else claims.push(priorClaim);
      continue;
    }
    let unresolved = false;
    const resolveValue = (value) =>
      value.replace(/\{([^{}]+)\}/gu, (_whole, name) => {
        if (runtimeValues[name] === undefined) unresolved = true;
        return runtimeValues[name] ?? `{${name}}`;
      });
    const resolvedProducer = declaration.producer.map(resolveValue);
    const resolvedSources = declaration.source_paths.map(resolveValue);
    if (unresolved) {
      findings.push(
        finding(
          'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
          'required runtime claim parameter is unresolved',
          { claim_id: declaration.claim_id },
        ),
      );
      continue;
    }
    const [program, ...args] = resolvedProducer;
    const produced = run(program, args, { cwd: repoRoot });
    if (produced.status !== 0) {
      findings.push(
        finding('CLAIM_PRODUCER_FAILED', 'claim producer failed', {
          claim_id: declaration.claim_id,
          exit_code: produced.status ?? 1,
        }),
      );
      continue;
    }
    const extracted = extractClaimValueV4(produced.stdout ?? '', declaration.extractor);
    if (extracted === undefined) {
      findings.push(
        finding('CLAIM_EXTRACTOR_INVALID', 'claim extractor did not resolve a value', {
          claim_id: declaration.claim_id,
        }),
      );
      continue;
    }
    const producerOutputDigest = sha256(produced.stdout ?? '');
    const sourceManifest = claimSourceManifestV4(
      resolvedSources,
      candidate,
      tree,
      declaration.claim_id,
      producerOutputDigest,
    );
    if (sourceManifest.length === 0) {
      findings.push(
        finding('CLAIM_SOURCE_MANIFEST_INVALID', 'resolved claim source population is empty', {
          claim_id: declaration.claim_id,
        }),
      );
      continue;
    }
    const renderedProofs = [];
    for (const location of declaration.rendered_locations ?? []) {
      const proof = renderedClaimProofV4(declaration, location, extracted, findings);
      if (
        proof === null ||
        proof.markerInvalid === true ||
        canonical(proof.rendered) !== canonical(extracted)
      ) {
        findings.push(
          finding(
            'CLAIM_RENDERED_MARKER_INVALID',
            'rendered claim marker is absent or does not equal the extracted value',
            { claim_id: declaration.claim_id, location },
          ),
        );
        continue;
      }
      const { rendered: _rendered, ...body } = proof;
      renderedProofs.push(body);
    }
    claims.push({
      ...declaration,
      proof_status: 'PROVEN',
      resolved_producer: resolvedProducer,
      source_manifest: sourceManifest,
      source_digest: sha256(canonical(sourceManifest)),
      producer_output_digest: producerOutputDigest,
      extracted_value: extracted,
      value_digest: sha256(canonical(extracted)),
      rendered_proofs: renderedProofs,
      rendered_verification_digest: sha256(canonical(renderedProofs)),
    });
  }
  if (
    blockingCount() > startingBlocking ||
    claims.length !== (context.claimsRegistry?.claims ?? []).length
  )
    return null;
  const body = {
    schemaVersion: '2.0.0',
    ledger_version: context.claimsRegistry.ledger_version,
    round: context.profile.round,
    mode: postPublication ? 'post-publication' : 'materialized',
    candidate,
    claims,
    pre_review_claims_digest: postPublication ? preReview.claims_digest_sha256 : null,
  };
  const ledger = withSelfDigest(body, 'claims_digest_sha256');
  validateDocument(
    ledger,
    context.policy.schemas.current_claims,
    findings,
    'CLAIM_LEDGER_SCHEMA_INVALID',
    'materialized claims',
  );
  if (blockingCount() === startingBlocking)
    writeJsonAtomic(
      join(
        repoRoot,
        postPublication
          ? context.profile.runtime.post_publication_claims
          : context.profile.runtime.materialized_claims,
      ),
      ledger,
    );
  return blockingCount() === startingBlocking ? ledger : null;
}

function validateClaimsV4(context, candidate, findings, requestedMode = 'materialized') {
  const path = join(
    repoRoot,
    requestedMode === 'post-publication'
      ? context.profile.runtime.post_publication_claims
      : context.profile.runtime.materialized_claims,
  );
  const ledger = readJsonPrecisely(
    path,
    'CLAIM_MATERIALIZATION_REQUIRED',
    'CLAIM_MATERIALIZATION_MALFORMED',
    findings,
  );
  if (ledger === null) return null;
  if (ledger.mode !== requestedMode) {
    findings.push(
      finding('CLAIM_MATERIALIZATION_REQUIRED', `runtime claim ledger must be ${requestedMode}`),
    );
    return null;
  }
  validateDocument(
    ledger,
    context.policy.schemas.current_claims,
    findings,
    'CLAIM_LEDGER_SCHEMA_INVALID',
    'materialized claims',
  );
  if (!selfDigestValid(ledger, 'claims_digest_sha256'))
    findings.push(
      finding(
        'CLAIM_LEDGER_SELF_DIGEST_INVALID',
        'materialized claim ledger self-digest is invalid',
      ),
    );
  if (ledger.candidate !== candidate)
    findings.push(finding('CLAIM_CANDIDATE_INVALID', 'materialized claims bind another candidate'));
  const declarations = new Map(
    (context.claimsRegistry?.claims ?? []).map((claim) => [claim.claim_id, claim]),
  );
  const declarationIds = [...declarations.keys()].sort();
  const ledgerIds = (ledger.claims ?? []).map(({ claim_id }) => claim_id);
  if (
    new Set(ledgerIds).size !== ledgerIds.length ||
    canonical([...ledgerIds].sort()) !== canonical(declarationIds)
  ) {
    findings.push(
      finding(
        'CLAIM_POPULATION_INVALID',
        'materialized claims must exactly equal the declaration population',
      ),
    );
  }
  let convergence = null;
  try {
    convergence = readJson(join(repoRoot, context.profile.runtime.convergence_evidence));
  } catch {
    convergence = null;
  }
  const runtimeValues = runtimeClaimValuesV4(
    context,
    convergence,
    candidate,
    findings,
    requestedMode === 'post-publication' ? 'post-publication' : 'pre-review',
  );
  let authenticatedPreReview = null;
  if (requestedMode === 'post-publication') {
    const preReview = validateClaimsV4(context, candidate, findings, 'materialized');
    authenticatedPreReview = preReview;
    const candidateManifest = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.candidate_manifest),
      'CANDIDATE_MANIFEST_MISSING',
      'CANDIDATE_MANIFEST_MALFORMED',
      findings,
    );
    if (candidateManifest !== null) {
      validateDocument(
        candidateManifest,
        context.policy.schemas.candidate_manifest,
        findings,
        'CANDIDATE_MANIFEST_SCHEMA_INVALID',
        'candidate manifest',
      );
    }
    if (
      preReview === null ||
      candidateManifest === null ||
      !selfDigestValid(candidateManifest, 'manifest_digest_sha256') ||
      ledger.pre_review_claims_digest !== preReview.claims_digest_sha256 ||
      preReview.candidate !== candidate ||
      candidateManifest.candidate_sha !== candidate ||
      candidateManifest.claims_digest !== preReview.claims_digest_sha256
    )
      findings.push(
        finding(
          'CLAIM_PRE_REVIEW_DIGEST_INVALID',
          'post-publication receipt does not bind the authenticated pre-review ledger and candidate manifest',
        ),
      );
  } else if (ledger.pre_review_claims_digest !== null) {
    findings.push(
      finding(
        'CLAIM_PRE_REVIEW_DIGEST_INVALID',
        'pre-review materialization cannot bind itself as a receipt',
      ),
    );
  }
  for (const claim of ledger.claims ?? []) {
    const declaration = declarations.get(claim.claim_id);
    if (declaration === undefined) {
      findings.push(
        finding('CLAIM_UNKNOWN', 'materialized claim is not declared', {
          claim_id: claim.claim_id,
        }),
      );
      continue;
    }
    if (requestedMode === 'post-publication' && declaration.availability === 'pre-review') {
      const expectedPrior = (authenticatedPreReview?.claims ?? []).find(
        ({ claim_id }) => claim_id === claim.claim_id,
      );
      if (expectedPrior === undefined || canonical(claim) !== canonical(expectedPrior))
        findings.push(
          finding(
            'CLAIM_PRE_REVIEW_CLAIM_INVALID',
            'post-publication receipt altered a pre-review proven claim',
            { claim_id: claim.claim_id },
          ),
        );
      continue;
    }
    if (claim.proof_status === 'DEFERRED_POST_PUBLICATION') {
      if (
        requestedMode !== 'materialized' ||
        declaration.availability !== 'post-publication' ||
        claim.deferred_proof?.declaration_digest !== sha256(canonical(declaration))
      )
        findings.push(
          finding(
            'CLAIM_DEFERRED_INVALID',
            'deferred claim declaration is unavailable, altered, or unauthenticated',
            { claim_id: claim.claim_id },
          ),
        );
      continue;
    }
    let unresolved = false;
    const expectedProducer = declaration.producer.map((argument) =>
      argument.replace(/\{([^{}]+)\}/gu, (_whole, name) => {
        const value = runtimeValues[name];
        if (value === undefined) unresolved = true;
        return value ?? `{${name}}`;
      }),
    );
    const expectedSources = declaration.source_paths.map((source) =>
      source.replace(/\{([^{}]+)\}/gu, (_whole, name) => {
        const value = runtimeValues[name];
        if (value === undefined) unresolved = true;
        return value ?? `{${name}}`;
      }),
    );
    if (unresolved) {
      findings.push(
        finding(
          'CLAIM_RUNTIME_PARAMETER_UNRESOLVED',
          'required runtime claim parameter is unresolved',
          { claim_id: claim.claim_id },
        ),
      );
      continue;
    }
    if (canonical(claim.resolved_producer) !== canonical(expectedProducer))
      findings.push(
        finding('CLAIM_RESOLVED_PRODUCER_INVALID', 'resolved producer differs from declaration', {
          claim_id: claim.claim_id,
        }),
      );
    const [program, ...args] = expectedProducer;
    const produced = run(program, args, { cwd: repoRoot });
    if (produced.status !== 0) {
      findings.push(
        finding('CLAIM_PRODUCER_FAILED', 'claim producer failed', { claim_id: claim.claim_id }),
      );
      continue;
    }
    if (requestedMode === 'post-publication' && claim.claim_id === 'ci.exact-head') {
      const prNumber = runtimeValues.source_pr_number;
      const head = run('gh', ['pr', 'view', String(prNumber ?? ''), '--json', 'headRefOid'], {
        cwd: repoRoot,
      });
      let headRefOid = null;
      try {
        headRefOid = JSON.parse(head.stdout ?? '{}').headRefOid;
      } catch {
        headRefOid = null;
      }
      if (head.status !== 0 || headRefOid !== candidate)
        findings.push(
          finding(
            'CLAIM_CI_EXACT_HEAD_INVALID',
            'post-publication CI proof does not belong to the exact reviewed candidate',
            { claim_id: claim.claim_id },
          ),
        );
    }
    if (claim.producer_output_digest !== sha256(produced.stdout ?? ''))
      findings.push(
        finding('CLAIM_PRODUCER_OUTPUT_DIGEST_INVALID', 'producer output digest is invalid', {
          claim_id: claim.claim_id,
        }),
      );
    const tree = git(repoRoot, ['rev-parse', `${candidate}^{tree}`]);
    const expectedSourceManifest = claimSourceManifestV4(
      expectedSources,
      candidate,
      tree,
      claim.claim_id,
      sha256(produced.stdout ?? ''),
    );
    if (
      (expectedSources.includes('.git') || (claim.source_paths ?? []).includes('.git')) &&
      (claim.source_manifest ?? []).length === 0
    )
      findings.push(
        finding(
          'CLAIM_GIT_IDENTITY_MANIFEST_INVALID',
          'Git-backed claim requires a nonempty exact commit-and-tree identity manifest',
          { claim_id: claim.claim_id },
        ),
      );
    if (canonical(claim.source_manifest) !== canonical(expectedSourceManifest))
      findings.push(
        finding(
          'CLAIM_SOURCE_MANIFEST_INVALID',
          'source manifest differs from current complete population',
          { claim_id: claim.claim_id },
        ),
      );
    if (claim.source_digest !== sha256(canonical(expectedSourceManifest)))
      findings.push(
        finding('CLAIM_SOURCE_DIGEST_INVALID', 'source manifest digest is invalid', {
          claim_id: claim.claim_id,
        }),
      );
    const extracted = extractClaimValueV4(produced.stdout ?? '', declaration.extractor);
    if (canonical(claim.extracted_value) !== canonical(extracted))
      findings.push(
        finding('CLAIM_EXTRACTED_VALUE_INVALID', 'stored extracted value differs from producer', {
          claim_id: claim.claim_id,
        }),
      );
    if (claim.value_digest !== sha256(canonical(extracted)))
      findings.push(
        finding('CLAIM_VALUE_DIGEST_INVALID', 'extracted value digest is invalid', {
          claim_id: claim.claim_id,
        }),
      );
    const proofLocations = (claim.rendered_proofs ?? []).map(({ location }) => location).sort();
    const declaredLocations = [...(declaration.rendered_locations ?? [])].sort();
    if (canonical(proofLocations) !== canonical(declaredLocations))
      findings.push(
        finding(
          'CLAIM_RENDERED_LOCATION_SET_INVALID',
          'rendered proof locations differ from declaration',
          { claim_id: claim.claim_id },
        ),
      );
    const expectedProofs = [];
    for (const location of declaredLocations) {
      const expected = renderedClaimProofV4(claim, location, extracted, findings);
      const actual = (claim.rendered_proofs ?? []).find((proof) => proof.location === location);
      if (expected?.placeholderInvalid === true)
        findings.push(
          finding(
            'CLAIM_PLACEHOLDER_RESIDUE',
            'rendered claim location contains unresolved placeholder residue',
            { claim_id: claim.claim_id, location },
          ),
        );
      if (
        expected === null ||
        expected?.markerInvalid === true ||
        expected?.placeholderInvalid === true ||
        actual?.claim_marker !== `DEVAI_CLAIM:${claim.claim_id}=`
      ) {
        findings.push(
          finding(
            'CLAIM_RENDERED_MARKER_INVALID',
            'rendered claim marker is missing, duplicated, or mismatched',
            { claim_id: claim.claim_id, location },
          ),
        );
        continue;
      }
      if (expected === null || actual === undefined) continue;
      if (actual.content_digest !== expected.content_digest)
        findings.push(
          finding('CLAIM_RENDERED_CONTENT_DIGEST_INVALID', 'rendered content digest is invalid', {
            claim_id: claim.claim_id,
            location,
          }),
        );
      if (actual.extracted_rendered_value_digest !== expected.extracted_rendered_value_digest)
        findings.push(
          finding('CLAIM_RENDERED_VALUE_DIGEST_INVALID', 'rendered value digest is invalid', {
            claim_id: claim.claim_id,
            location,
          }),
        );
      if (actual.verification_digest !== expected.verification_digest)
        findings.push(
          finding(
            'CLAIM_RENDERED_PROOF_DIGEST_INVALID',
            'rendered proof verification digest is invalid',
            { claim_id: claim.claim_id, location },
          ),
        );
      const { rendered: _rendered, ...expectedProof } = expected;
      expectedProofs.push(expectedProof);
    }
    if (claim.rendered_verification_digest !== sha256(canonical(expectedProofs)))
      findings.push(
        finding(
          'CLAIM_RENDERED_VERIFICATION_DIGEST_INVALID',
          'aggregate rendered verification digest is invalid',
          { claim_id: claim.claim_id },
        ),
      );
  }
  return ledger;
}

function claimsCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const requestedMode =
    option('--mode') === 'post-publication' ||
    option('--phase') === 'post-publication' ||
    process.argv.includes('--post-publication')
      ? 'post-publication'
      : 'materialized';
  const context = loadV4Context(round, findings);
  if (context !== null && process.argv.includes('--materialize')) {
    const convergence = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.convergence_evidence),
      'CONVERGENCE_EVIDENCE_MISSING',
      'CONVERGENCE_EVIDENCE_MALFORMED',
      findings,
    );
    if (convergence !== null)
      materializeClaimsV4(
        context,
        convergence,
        candidate,
        findings,
        requestedMode === 'post-publication' ? 'post-publication' : 'pre-review',
      );
  }
  const ledger =
    context === null ? null : validateClaimsV4(context, candidate, findings, requestedMode);
  emit({
    ok: findings.length === 0 && ledger !== null,
    command: 'claims-check',
    round,
    candidate,
    mode: requestedMode,
    materialized_path:
      requestedMode === 'post-publication'
        ? context?.profile.runtime.post_publication_claims
        : context?.profile.runtime.materialized_claims,
    pre_review_claims_digest: ledger?.pre_review_claims_digest ?? null,
    findings,
  });
}

function claimsMaterializeV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const phase = option('--phase') === 'post-publication' ? 'post-publication' : 'pre-review';
  const context = loadV4Context(round, findings);
  let convergence = null;
  if (context !== null)
    convergence = readJsonPrecisely(
      join(repoRoot, context.profile.runtime.convergence_evidence),
      'CONVERGENCE_EVIDENCE_MISSING',
      'CONVERGENCE_EVIDENCE_MALFORMED',
      findings,
    );
  const ledger =
    context !== null && convergence !== null
      ? materializeClaimsV4(context, convergence, candidate, findings, phase)
      : null;
  emit({
    ok: findings.length === 0 && ledger !== null,
    command: 'claims-materialize',
    round,
    candidate,
    phase,
    materialized_path:
      context === null
        ? null
        : phase === 'post-publication'
          ? context.profile.runtime.post_publication_claims
          : context.profile.runtime.materialized_claims,
    claims_digest_sha256: ledger?.claims_digest_sha256 ?? null,
    findings,
  });
}

function resolveTopicEvidenceV6(context, proof, ref) {
  if (['review-scope', 'review-state', 'review-transport'].includes(ref)) return null;
  const runtimeAliases = new Map([
    ['candidate manifest', context.profile.runtime.candidate_manifest],
    ['candidate-manifest', context.profile.runtime.candidate_manifest],
    ['convergence evidence', context.profile.runtime.convergence_evidence],
    ['convergence-evidence', context.profile.runtime.convergence_evidence],
    ['impact-execution', context.profile.runtime.impact_execution],
    ['active-control-census', context.profile.runtime.active_control_census],
    ['current-claims', context.profile.runtime.materialized_claims],
    ['claim-runtime-inputs', context.profile.runtime.pre_review_claim_inputs],
    ['review-scope', context.profile.runtime.review_scope],
    ['review-state', context.profile.runtime.review_state],
    ['review-transport', context.profile.runtime.review_transport],
  ]);
  const runtimePath =
    runtimeAliases.get(ref) ??
    [...runtimeAliases.values()].find((configuredPath) => configuredPath === ref);
  if (runtimePath !== undefined) {
    const absolute = join(repoRoot, runtimePath);
    if (!existsSync(absolute)) return null;
    return { ref, digest: sha256(readFileSync(absolute)) };
  }
  if (ref === 'reviewer-binding') {
    const binding = reviewerBindingV4(context, proof.manifest.candidate_sha);
    return binding.selected === null ? null : { ref, digest: binding.selected.digest };
  }
  if (ref === 'prior-finding-registry') {
    const path = context.profile.sources.prior_finding_registry;
    const objectId = candidateTreeEntries(proof.manifest.candidate_sha).get(path);
    return objectId === undefined
      ? null
      : { ref, digest: sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId])) };
  }
  if (ref === 'git:exact-range') {
    const records = committedChangeRecords(
      proof.manifest.base_sha,
      proof.manifest.candidate_sha,
      [],
    );
    return records === null ? null : { ref, digest: sha256(canonical(records)) };
  }
  if (ref === 'git:role-path-census') {
    return {
      ref,
      digest: sha256(
        canonical(
          rolePathEvidenceV7(proof.manifest.base_sha, proof.manifest.candidate_sha, context.policy),
        ),
      ),
    };
  }
  if (ref.startsWith('gate:')) {
    const gateId = ref.slice('gate:'.length);
    const gate = (proof.convergence.passes?.[1]?.gate_results ?? []).find(
      ({ gate_id: id }) => id === gateId,
    );
    return gate === undefined ? null : { ref, digest: gate.result_digest };
  }
  if (ref.startsWith('claim:')) {
    const ledger = readJson(join(repoRoot, context.profile.runtime.materialized_claims));
    const claim = (ledger.claims ?? []).find(({ claim_id }) => `claim:${claim_id}` === ref);
    return claim === undefined ? null : { ref, digest: sha256(canonical(claim)) };
  }
  const normalizedRef = ref.startsWith('path:') ? ref.slice('path:'.length) : ref;
  const path = normalizedRef.split('#', 1)[0];
  let objectId =
    path === undefined || path === ''
      ? undefined
      : candidateTreeEntries(proof.manifest.candidate_sha).get(path);
  let revision = proof.manifest.candidate_sha;
  if (objectId === undefined && path !== undefined && path !== '') {
    objectId = candidateTreeEntries(proof.manifest.base_sha).get(path);
    revision = proof.manifest.base_sha;
  }
  if (objectId === undefined) return null;
  try {
    return {
      ref,
      digest: sha256(
        canonical({ revision, blob: sha256(gitBytes(repoRoot, ['cat-file', 'blob', objectId])) }),
      ),
    };
  } catch {
    return null;
  }
}

function topicEvidenceManifestV4(context, proof, sourceRefs, requiredEvidence) {
  const refs = ['candidate manifest', 'convergence evidence', ...sourceRefs, ...requiredEvidence];
  const resolved = refs.map((ref) => resolveTopicEvidenceV6(context, proof, ref));
  if (resolved.some((entry) => entry === null)) return null;
  return [...new Map(resolved.map((entry) => [entry.ref, entry])).values()];
}

function topicTaskKeysV4(proof, requiredEvidence) {
  const gateIds = new Set(
    requiredEvidence
      .filter((ref) => ref.startsWith('gate:'))
      .map((ref) => ref.slice('gate:'.length)),
  );
  return (proof.convergence.passes?.[1]?.gate_results ?? [])
    .filter(({ gate_id }) => gateIds.has(gate_id))
    .map(({ task_key }) => task_key);
}

function makeReviewTopicsV4(context, base, candidate, proof, ledger, findings = []) {
  const topics = [];
  const add = ({
    topicId,
    topicKind,
    obligationId,
    risk = 'P1',
    claim,
    sourceRefs,
    governingPaths,
    requiredEvidence,
    currentDigest,
    previousDigest = null,
    changedStatus = 'changed',
    adversaries,
    previousClasses = [],
    reusable = false,
    changeRecord = null,
  }) => {
    const stableEvidenceRef = (ref) => {
      if (context.policy.schemaVersion !== '5.0.0') return ref;
      if (ref === context.profile.runtime.candidate_manifest) return 'candidate manifest';
      if (ref === context.profile.runtime.convergence_evidence) return 'convergence evidence';
      return ref;
    };
    const uniqueSourceRefs = [...new Set(sourceRefs.map(stableEvidenceRef))];
    const uniqueRequiredEvidence = [...new Set(requiredEvidence.map(stableEvidenceRef))];
    const evidenceManifest = topicEvidenceManifestV4(
      context,
      proof,
      uniqueSourceRefs,
      uniqueRequiredEvidence,
    );
    if (evidenceManifest === null)
      findings.push(
        finding('UNRESOLVED_TOPIC_EVIDENCE', 'review topic contains unresolved evidence', {
          topic_id: topicId,
          evidence_refs: [...uniqueSourceRefs, ...uniqueRequiredEvidence],
        }),
      );
    const reuseEligible = reusable && changedStatus === 'unchanged' && evidenceManifest !== null;
    const taskKeys = reuseEligible ? topicTaskKeysV4(proof, uniqueRequiredEvidence) : [];
    topics.push({
      topic_id: topicId,
      topic_kind: topicKind,
      obligation_id: obligationId,
      risk,
      claim,
      source_refs: uniqueSourceRefs,
      governing_paths: [...new Set(governingPaths)],
      required_evidence: uniqueRequiredEvidence,
      current_digest: currentDigest,
      previous_digest: previousDigest,
      changed_status: changedStatus,
      required_adversaries: [...new Set(adversaries)],
      previous_finding_classes: [...new Set(previousClasses)],
      ...(context.policy.schemaVersion === '5.0.0'
        ? {
            change_record: changeRecord ?? {
              status: 'NOT_APPLICABLE',
              record_id: null,
              role: 'not-applicable',
              preimage: null,
              postimage: null,
              record_digest: null,
            },
          }
        : {}),
      freshness_proof: {
        method: reuseEligible ? 'content-addressed' : 'recheck-required',
        inputs_digest: currentDigest,
        evidence_digest: sha256(
          canonical(
            evidenceManifest ?? {
              unresolved_refs: [...uniqueSourceRefs, ...uniqueRequiredEvidence],
            },
          ),
        ),
        task_keys: taskKeys,
        independent_recomputation_required: true,
      },
      allowed_dispositions: reuseEligible
        ? ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED']
        : ['RECHECKED_PASS', 'RECHECKED_FAIL', 'BLOCKED'],
    });
  };
  const identityObligation = (context.obligations?.obligations ?? [])[0];
  for (const obligation of context.obligations?.obligations ?? []) {
    const selectors = obligation.governing_paths.flatMap(expandBraceSelectors);
    const currentPaths = pathsForGlobs(repoRoot, candidate, selectors);
    const previousPaths = pathsForGlobs(repoRoot, base, selectors);
    const currentDigest = candidateDigestForPaths(candidate, currentPaths);
    const previousDigest = candidateDigestForPaths(base, previousPaths);
    add({
      topicId: `obligation:${obligation.obligation_id.toLowerCase()}`,
      topicKind: 'semantic-obligation',
      obligationId: obligation.obligation_id,
      risk: obligation.risk,
      claim: obligation.claim,
      sourceRefs: obligation.source_refs,
      governingPaths: obligation.governing_paths,
      requiredEvidence: obligation.required_evidence,
      currentDigest,
      previousDigest,
      changedStatus: currentDigest === previousDigest ? 'unchanged' : 'changed',
      adversaries: obligation.required_adversaries,
      previousClasses: obligation.finding_classes,
      reusable: obligation.reuse_policy === 'digest-and-evidence-recheck',
    });
  }
  const fallbackObligation = identityObligation?.obligation_id;
  const changeRecords = committedChangeRecords(base, candidate, []) ?? [];
  for (const record of changeRecords) {
    for (const [path, role] of record.preimage !== null &&
    record.postimage !== null &&
    record.preimage !== record.postimage
      ? [
          [record.preimage, 'preimage'],
          [record.postimage, 'postimage'],
        ]
      : [[record.postimage ?? record.preimage, 'single']]) {
      const normalizedStatus = record.status.startsWith('R')
        ? 'R'
        : record.status.startsWith('C')
          ? 'C'
          : record.status;
      const changeRecord = {
        status: normalizedStatus,
        record_id: record.record_id,
        role,
        preimage: record.preimage,
        postimage: record.postimage,
        record_digest: sha256(canonical(record)),
      };
      add({
        topicId: `changed-path:${sha256(`${record.record_id}:${role}:${path}`).slice(0, 24)}`,
        topicKind: 'changed-path',
        obligationId: fallbackObligation,
        risk: 'P0',
        claim: `Inspect exact candidate ${role} change at ${path}`,
        sourceRefs: [path],
        governingPaths: [path],
        requiredEvidence: ['git:exact-range'],
        currentDigest: candidateDigestForPaths(candidate, [path]),
        previousDigest: candidateDigestForPaths(base, [path]),
        adversaries: ['inspect-exact-diff'],
        changeRecord,
      });
    }
  }
  const controls = proof.activeControlCensus?.entries?.map(({ path }) => path) ?? [
    context.profilePath,
    'law/policy/round-close-controls.json',
  ];
  add({
    topicId: 'active-control:complete-census',
    topicKind: 'active-control',
    obligationId: fallbackObligation,
    risk: 'P0',
    claim: 'Apply every active control.',
    sourceRefs: controls,
    governingPaths: controls,
    requiredEvidence: ['active-control-census'],
    currentDigest:
      proof.activeControlCensus?.census_digest_sha256 ??
      candidateDigestForPaths(candidate, controls),
    adversaries: ['omitted-control'],
  });
  for (const currentClaim of ledger.claims ?? [])
    add({
      topicId: `current-claim:${currentClaim.claim_id}`,
      topicKind: 'current-claim',
      obligationId: fallbackObligation,
      claim: `Recompute current claim ${currentClaim.claim_id}.`,
      sourceRefs: [context.profile.runtime.materialized_claims],
      governingPaths: [context.profile.sources.current_claims],
      requiredEvidence: [`claim:${currentClaim.claim_id}`],
      currentDigest: sha256(canonical(currentClaim)),
      adversaries: ['stale-claim'],
    });
  const priorByClass = new Map();
  for (const entry of context.priorFindingRegistry?.finding_classes ?? []) {
    const population = priorByClass.get(entry.defect_class_id) ?? [];
    population.push(entry);
    priorByClass.set(entry.defect_class_id, population);
  }
  for (const [defectClassId, population] of priorByClass) {
    const origins = [...population].sort((left, right) =>
      left.finding_id.localeCompare(right.finding_id),
    );
    const severity = origins.some(({ severity: value }) => value === 'P0')
      ? 'P0'
      : origins.some(({ severity: value }) => value === 'P1')
        ? 'P1'
        : 'P2';
    add({
      topicId: `previous-finding-class:${sha256(defectClassId).slice(0, 24)}`,
      topicKind: 'previous-finding-class',
      obligationId: fallbackObligation,
      risk: severity,
      claim: `Recheck ${defectClassId} across every recorded origin: ${origins.map(({ finding_id }) => finding_id).join(', ')}.`,
      sourceRefs: [
        context.profile.sources.prior_finding_registry,
        ...origins.map(({ origin_evidence }) => origin_evidence),
      ],
      governingPaths: [context.profile.sources.prior_finding_registry],
      requiredEvidence: ['prior-finding-registry'],
      currentDigest: sha256(canonical(origins)),
      adversaries: origins.map(({ population_query }) => population_query),
      previousClasses: [defectClassId],
    });
  }
  add({
    topicId: `candidate-identity:${candidate.slice(0, 16)}`,
    topicKind: 'candidate-identity',
    obligationId: fallbackObligation,
    risk: 'P0',
    claim: 'Authenticate exact candidate identity.',
    sourceRefs: [context.profile.runtime.candidate_manifest],
    governingPaths: [context.profilePath],
    requiredEvidence: ['candidate manifest'],
    currentDigest: proof.manifest.manifest_digest_sha256,
    adversaries: ['tampered-manifest'],
  });
  add({
    topicId: `convergence-evidence:${proof.convergence.convergence_digest_sha256.slice(0, 24)}`,
    topicKind: 'convergence-evidence',
    obligationId: fallbackObligation,
    risk: 'P0',
    claim: 'Authenticate exact convergence evidence.',
    sourceRefs: [context.profile.runtime.convergence_evidence],
    governingPaths: [context.profilePath],
    requiredEvidence: ['convergence-evidence'],
    currentDigest: proof.convergence.convergence_digest_sha256,
    adversaries: ['partial-pass'],
  });
  if (context.policy.schemaVersion === '5.0.0') {
    for (const record of changeRecords.filter(({ status }) => status.startsWith('R'))) {
      const linked = topics.filter(
        ({ change_record: value }) => value?.record_id === record.record_id,
      );
      if (!linked.some(({ change_record: value }) => value.role === 'preimage'))
        throw new Error('RENAME_PREIMAGE_INVALIDATION_MISSING');
      if (!linked.some(({ change_record: value }) => value.role === 'postimage'))
        throw new Error('RENAME_POSTIMAGE_INVALIDATION_MISSING');
      if (linked.length !== 2 || new Set(linked.map(({ topic_id }) => topic_id)).size !== 2)
        throw new Error('RENAME_CHANGED_PATH_TOPIC_LINK_INVALID');
    }
  }
  return topics.sort((left, right) => left.topic_id.localeCompare(right.topic_id));
}

function reviewTopicCountV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const base = git(repoRoot, ['rev-parse', option('--base') ?? '']);
  const candidate = git(repoRoot, ['rev-parse', option('--candidate') ?? 'HEAD']);
  const context = loadV4Context(round, findings);
  let topicCount = null;
  if (context !== null && findings.length === 0) {
    const changedPaths = statusAwareChangedPaths(base, candidate);
    topicCount =
      (context.obligations?.obligations ?? []).length +
      changedPaths.length +
      1 +
      (context.claimsRegistry?.claims ?? []).length +
      new Set(
        (context.priorFindingRegistry?.finding_classes ?? []).map(
          ({ defect_class_id }) => defect_class_id,
        ),
      ).size +
      2;
  }
  emit({
    ok: findings.length === 0 && topicCount !== null,
    command: 'review-topic-count',
    round,
    base,
    candidate,
    topic_count: topicCount,
    findings,
  });
}

function claimProduceV4() {
  const findings = [];
  const kind = option('--kind') ?? '';
  const sourcePath = option('--path') ?? '';
  const absolute = resolve(repoRoot, sourcePath);
  if (
    ['json-file', 'file-sha256'].includes(kind) &&
    (sourcePath === '' ||
      (!absolute.startsWith(`${repoRoot}/`) && absolute !== repoRoot) ||
      !existsSync(absolute) ||
      !lstatSync(absolute).isFile())
  ) {
    emit({
      ok: false,
      command: 'claim-produce',
      kind,
      findings: [
        finding(
          'CLAIM_PRODUCER_SOURCE_INVALID',
          'claim producer path must name one existing repository file',
        ),
      ],
    });
    return;
  }
  try {
    let value;
    if (kind === 'json-file') {
      const parsed = readJson(absolute);
      value = extractClaimValueV4(canonical(parsed), option('--extractor') ?? '$');
      if (value === undefined) throw new Error('extractor did not resolve a value');
    } else if (kind === 'file-sha256') {
      value = { sha256: sha256(readFileSync(absolute)) };
    } else if (kind === 'github-pr-exact-head') {
      const pr = option('--pr') ?? '';
      const candidate = option('--candidate') ?? '';
      if (!/^[0-9]+$/u.test(pr) || !SHA40.test(candidate))
        throw new Error('PR number and exact candidate SHA are required');
      const identity = run('gh', ['pr', 'view', pr, '--json', 'headRefOid,state'], {
        cwd: repoRoot,
      });
      const checks = run('gh', ['pr', 'checks', pr, '--required', '--json', 'name,state,link'], {
        cwd: repoRoot,
      });
      const parsedIdentity = identity.status === 0 ? JSON.parse(identity.stdout) : null;
      const parsedChecks = checks.status === 0 ? JSON.parse(checks.stdout) : null;
      if (
        parsedIdentity?.headRefOid !== candidate ||
        parsedIdentity?.state !== 'OPEN' ||
        !Array.isArray(parsedChecks) ||
        parsedChecks.length === 0 ||
        parsedChecks.some(({ state }) => state !== 'SUCCESS')
      )
        throw new Error(
          'PR identity or nonempty exact-head required-check population is not passing',
        );
      value = {
        pr: Number(pr),
        candidate,
        headRefOid: parsedIdentity.headRefOid,
        checks: parsedChecks.sort((left, right) =>
          `${left.name}\0${left.link}`.localeCompare(`${right.name}\0${right.link}`),
        ),
      };
    } else if (kind === 'vitest-list') {
      const listed = run('pnpm', ['vitest', 'list', '--json'], { cwd: repoRoot });
      if (listed.status !== 0) throw new Error('vitest list failed');
      const population = JSON.parse(listed.stdout);
      if (!Array.isArray(population)) throw new Error('vitest list did not return an array');
      value = population
        .map((entry) => ({ ...entry, file: relative(repoRoot, resolve(String(entry.file))) }))
        .sort((left, right) => canonical(left).localeCompare(canonical(right)));
    } else {
      throw new Error(`unsupported claim producer kind ${kind}`);
    }
    process.stdout.write(`${JSON.stringify(value)}\n`);
  } catch (error) {
    findings.push(finding('CLAIM_PRODUCER_INVALID', String(error)));
    emit({ ok: false, command: 'claim-produce', kind, findings });
  }
}

function transitionV4(from, to, proof, links = {}) {
  return withSelfDigest(
    {
      from,
      to,
      candidate_sha: proof.manifest.candidate_sha,
      candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
      review_scope_digest: links.review_scope_digest ?? null,
      review_result_digest: links.review_result_digest ?? null,
      transport_digest: links.transport_digest ?? null,
      repair_evidence_digest: links.repair_evidence_digest ?? null,
      previous_state_digest: links.previous_state_digest ?? null,
    },
    'transition_digest_sha256',
  );
}

function persistedReviewArtifactDigestV7(artifact, selfDigestField) {
  if (!selfDigestValid(artifact, selfDigestField)) return null;
  return artifact[selfDigestField];
}

function validateTransitionEdgeV6(context, transition, index, prior, findings) {
  const allowed = context.policy.review_state_machine?.allowed_transitions?.[transition.from] ?? [];
  if (!allowed.includes(transition.to) || (prior !== null && transition.from !== prior.to))
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_EDGE_INVALID',
        'transition edge is absent from the policy graph or skips its predecessor',
        { ordinal: index + 1 },
      ),
    );
  if (
    prior !== null &&
    (persistedReviewArtifactDigestV7(prior, 'transition_digest_sha256') === null ||
      transition.previous_transition_digest !== prior.transition_digest_sha256)
  )
    findings.push(
      finding(
        'REVIEW_STATE_PREDECESSOR_STATE_INVALID',
        'transition does not bind the exact persisted predecessor transition artifact',
        { ordinal: index + 1 },
      ),
    );
  const expectedCycle =
    transition.from === 'REPAIR_REQUIRED' ||
    transition.from === 'CYCLE_2_ACTIVE' ||
    ['NEW_CANDIDATE_FROZEN', 'CYCLE_2_ACTIVE', 'ESCALATION_REQUIRED'].includes(transition.to) ||
    (transition.from === 'CYCLE_2_ACTIVE' && transition.to === 'PASS')
      ? 2
      : 1;
  if (transition.cycle !== expectedCycle)
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_CYCLE_INVALID',
        'transition cycle differs from its declared state-machine edge',
        { ordinal: index + 1 },
      ),
    );
  if (index === 0) {
    if (transition.from !== 'DRAFT' || transition.previous_state_digest !== null)
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_STATE_INVALID',
          'first transition must begin at DRAFT without predecessor state',
        ),
      );
  } else {
    // Per DII-252, the predecessor identity is the predecessor artifact self-digest,
    // corroborated rather than recomputed from a private field selection. A derivation
    // only the producing implementation can reproduce is not independently checkable.
    const claimed = transition.previous_state_digest;
    const retainedPath = join(
      dirname(join(repoRoot, context.profile.runtime.review_state)),
      'review-states',
      `${String(claimed)}.json`,
    );
    const retained =
      typeof claimed === 'string' && SHA256.test(claimed) && existsSync(retainedPath)
        ? readJson(retainedPath)
        : null;
    const corroborated =
      typeof claimed === 'string' &&
      SHA256.test(claimed) &&
      (retained === null ||
        (selfDigestValid(retained, 'state_digest_sha256') &&
          retained.state_digest_sha256 === claimed));
    if (!corroborated)
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_STATE_INVALID',
          'transition predecessor identity is absent or contradicts its retained artifact',
          { ordinal: index + 1 },
        ),
      );
  }
}

function reauthenticateTransportV6(
  context,
  state,
  scope,
  transport,
  attempt,
  previous,
  findings,
  expected = null,
) {
  const identity = {
    round: state.round,
    cycle: state.cycle,
    candidate_sha: state.candidate_sha,
    candidate_tree: state.tree_sha,
    policy_digest: state.policy_digest,
    profile_digest: state.profile_digest,
    candidate_manifest_digest: state.candidate_manifest_digest,
    review_scope_digest: state.review_scope_digest,
    scope_identity_digest: scope?.identity_proof?.identity_digest_sha256,
    reviewer_binding_digest: state.reviewer_binding_digest,
    active_control_census_digest: state.active_control_census_digest,
  };
  const invalid =
    !validateDocument(
      transport,
      context.policy.schemas.review_transport,
      findings,
      'REVIEW_TRANSPORT_CHAIN_INVALID',
      'review transport',
    ) ||
    !selfDigestValid(transport, 'transport_digest_sha256') ||
    transport.attempt !== attempt ||
    transport.previous_transport_digest !== previous ||
    Object.entries(identity).some(([field, value]) => transport[field] !== value) ||
    (expected !== null &&
      Object.entries(expected).some(([field, value]) => transport[field] !== value)) ||
    !SHA256.test(transport.state_before_digest ?? '');
  if (invalid)
    findings.push(
      finding(
        'REVIEW_TRANSPORT_CHAIN_INVALID',
        'persisted transport does not authenticate its complete attempt identity',
        { attempt },
      ),
    );
  return !invalid;
}

function reauthenticateReviewResultV6(context, state, scope, result, findings) {
  const topicMap = new Map((scope?.topics ?? []).map((topic) => [topic.topic_id, topic]));
  const seen = new Set();
  for (const disposition of result.dispositions ?? []) {
    const topic = topicMap.get(disposition.topic_id);
    if (topic === undefined || seen.has(disposition.topic_id))
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_COUNTS_INVALID',
          'persisted result has an unknown or duplicated topic',
          { topic_id: disposition.topic_id },
        ),
      );
    else {
      const inputs = disposition.recomputed_inputs_manifest ?? [];
      const evidence = disposition.recomputed_evidence_manifest ?? [];
      const evidenceRefs = evidence.map(({ ref }) => ref);
      const taskFreshness = disposition.recomputed_task_freshness_manifest ?? [];
      const taskKeys = taskFreshness.map(({ task_key }) => task_key);
      const proofBody = {
        topic_id: topic.topic_id,
        disposition: disposition.disposition,
        recomputed_digest: topic.current_digest,
        recomputed_inputs_manifest: inputs,
        recomputed_evidence_manifest: evidence,
        recomputed_evidence_digest: sha256(canonical(evidence)),
        recomputed_evidence_refs_digest: sha256(canonical(evidenceRefs)),
        recomputed_task_keys: taskKeys,
        recomputed_task_freshness_manifest: taskFreshness,
        evidence_refs: evidenceRefs,
      };
      if (
        !topic.allowed_dispositions.includes(disposition.disposition) ||
        disposition.recomputed_digest !== topic.current_digest ||
        !Array.isArray(disposition.recomputed_inputs_manifest) ||
        disposition.recomputed_inputs_manifest.length === 0 ||
        !Array.isArray(disposition.recomputed_evidence_manifest) ||
        disposition.recomputed_evidence_manifest.length === 0 ||
        canonical(disposition.evidence_refs) !== canonical(evidenceRefs) ||
        disposition.recomputed_evidence_digest !== sha256(canonical(evidence)) ||
        disposition.recomputed_evidence_refs_digest !== sha256(canonical(evidenceRefs)) ||
        canonical(disposition.recomputed_task_keys) !== canonical(taskKeys) ||
        disposition.proof_digest_sha256 !== sha256(canonical(proofBody))
      )
        findings.push(
          finding(
            'REVIEW_STATE_RESULT_PROOF_INVALID',
            'persisted topic proof cannot be independently reconstructed',
            { topic_id: disposition.topic_id },
          ),
        );
    }
    seen.add(disposition.topic_id);
  }
  if ([...topicMap.keys()].some((id) => !seen.has(id)))
    findings.push(
      finding('REVIEW_STATE_RESULT_COUNTS_INVALID', 'persisted result omits review topics'),
    );
  const findingMap = new Map();
  for (const entry of result.findings ?? []) {
    if (findingMap.has(entry.finding_id))
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_FINDING_INVALID',
          'persisted finding identifiers are duplicated',
          { finding_id: entry.finding_id },
        ),
      );
    findingMap.set(entry.finding_id, entry);
    if (
      typeof entry.defect_class_id !== 'string' ||
      entry.defect_class_id.length === 0 ||
      typeof entry.population_query !== 'string' ||
      entry.population_query.length === 0 ||
      !Array.isArray(entry.affected_instances) ||
      entry.affected_instances.length === 0 ||
      typeof entry.repair_acceptance !== 'string' ||
      entry.repair_acceptance.length === 0 ||
      !Array.isArray(entry.topic_ids) ||
      entry.topic_ids.length === 0
    )
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_FINDING_INVALID',
          'persisted finding lacks its complete-class population proof',
          { finding_id: entry.finding_id },
        ),
      );
  }
  for (const disposition of result.dispositions ?? [])
    for (const findingId of disposition.finding_ids ?? []) {
      const entry = findingMap.get(findingId);
      if (entry === undefined || !(entry.topic_ids ?? []).includes(disposition.topic_id))
        findings.push(
          finding(
            'REVIEW_STATE_RESULT_FINDING_LINK_INVALID',
            'persisted disposition finding link is not reciprocal',
            { topic_id: disposition.topic_id, finding_id: findingId },
          ),
        );
    }
  for (const entry of result.findings ?? [])
    for (const topicId of entry.topic_ids ?? []) {
      const disposition = (result.dispositions ?? []).find(({ topic_id }) => topic_id === topicId);
      if (disposition === undefined || !(disposition.finding_ids ?? []).includes(entry.finding_id))
        findings.push(
          finding(
            'REVIEW_STATE_RESULT_FINDING_LINK_INVALID',
            'persisted finding topic link is not reciprocal',
            { topic_id: topicId, finding_id: entry.finding_id },
          ),
        );
    }
  const counts = Object.fromEntries(
    ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'].map((name) => [
      name,
      (result.dispositions ?? []).filter(({ disposition }) => disposition === name).length,
    ]),
  );
  const identityValid =
    result.round === state.round &&
    result.cycle === state.cycle &&
    result.review_candidate === state.candidate_sha &&
    result.manifest_digest === state.review_scope_digest &&
    result.scope_identity_digest === scope?.identity_proof?.identity_digest_sha256 &&
    result.policy_digest === state.policy_digest &&
    result.candidate_manifest_digest === state.candidate_manifest_digest &&
    result.reviewer_binding_digest === state.reviewer_binding_digest &&
    result.active_control_census_digest === state.active_control_census_digest;
  if (!identityValid)
    findings.push(
      finding('REVIEW_STATE_RESULT_IDENTITY_INVALID', 'persisted review result identity is stale'),
    );
  if (
    result.terminal?.topic_count !== (scope?.topics ?? []).length ||
    result.terminal?.finding_count !== (result.findings ?? []).length ||
    canonical(result.terminal?.disposition_counts) !== canonical(counts)
  )
    findings.push(
      finding('REVIEW_STATE_RESULT_COUNTS_INVALID', 'persisted review result counts are stale'),
    );
  if (
    result.terminal?.complete !== true ||
    !['PASS', 'FAIL', 'BLOCKED', 'INVALID'].includes(result.terminal?.verdict)
  )
    findings.push(
      finding('REVIEW_STATE_RESULT_TERMINAL_INVALID', 'persisted review terminal is invalid'),
    );
  const hasNonPassing = (result.dispositions ?? []).some(({ disposition }) =>
    ['RECHECKED_FAIL', 'BLOCKED'].includes(disposition),
  );
  const hasFindings = (result.findings ?? []).length > 0;
  if (
    (result.terminal?.verdict === 'PASS' && (hasNonPassing || hasFindings)) ||
    (result.terminal?.verdict === 'FAIL' && !hasNonPassing && !hasFindings)
  )
    findings.push(
      finding(
        'REVIEW_STATE_RESULT_TERMINAL_INVALID',
        'persisted review verdict contradicts its dispositions or findings',
      ),
    );
}

/**
 * Reads the prior failure review result that a repair claims to close. The digest comes
 * from the authenticated state record, so the expected class population is derived from
 * independent evidence rather than from the repair artifact being checked.
 */
function readPriorFailureResultV9(context, state) {
  const digest = state.prior_failure_result_digest;
  if (typeof digest !== 'string' || !SHA256.test(digest)) return null;
  const resultsRoot = join(
    dirname(join(repoRoot, context.profile.runtime.review_result)),
    'review-results',
  );
  const exact = join(resultsRoot, `${digest}.json`);
  const candidatePaths = [exact, join(repoRoot, context.profile.runtime.review_result)];
  for (const path of candidatePaths) {
    if (!existsSync(path)) continue;
    try {
      const value = readJson(path);
      if (value.result_digest_sha256 === digest) return value;
    } catch {
      // A malformed prior result is reported by the ordinary result authentication.
    }
  }
  return null;
}

function reauthenticateRepairEvidenceV6(context, state, repair, findings, expectedClasses = null) {
  const schemaValid = validateDocument(
    repair,
    context.policy.schemas.review_repair_evidence,
    findings,
    'REVIEW_STATE_REPAIR_LINK_INVALID',
    'review repair evidence',
  );
  const identityChecks = {
    schema: schemaValid,
    self_digest: selfDigestValid(repair, 'repair_evidence_digest_sha256'),
    evidence_digest: repair.repair_evidence_digest_sha256 === state.repair_evidence_digest,
    result_digest: repair.prior_review_result_digest === state.prior_failure_result_digest,
    failure_state: repair.prior_failure_state_digest === state.prior_failure_state_digest,
    failure_transport:
      repair.prior_failure_transport_digest === state.prior_failure_transport_digest,
    prior_candidate: repair.prior_candidate_sha === state.previous_candidate_sha,
    new_candidate: repair.new_candidate_sha === state.candidate_sha,
    repaired_class_population:
      expectedClasses === null ||
      JSON.stringify(
        [...(repair.repaired_classes ?? [])].map(({ defect_class_id }) => defect_class_id).sort(),
      ) === JSON.stringify([...expectedClasses].sort()),
  };
  if (Object.values(identityChecks).some((passed) => !passed))
    findings.push(
      finding(
        'REVIEW_STATE_REPAIR_LINK_INVALID',
        'consumed repair evidence does not authenticate the complete failure chain',
        {
          failed_checks: Object.entries(identityChecks)
            .filter(([, passed]) => !passed)
            .map(([id]) => id),
        },
      ),
    );
}

function makeReviewStateV4(context, proof, scopeDigest, state, cycle, history, extra = {}) {
  const resolution = reviewerBindingV4(context, proof.manifest.candidate_sha);
  if (context.policy.schemaVersion !== '5.0.0')
    return withSelfDigest(
      {
        schemaVersion: '2.0.0',
        round: context.profile.round,
        state,
        cycle,
        base_sha: proof.manifest.base_sha,
        candidate_sha: proof.manifest.candidate_sha,
        tree_sha: proof.manifest.tree_sha,
        profile_digest: context.digests.profile,
        policy_digest: context.digests.policy,
        candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
        review_scope_digest: scopeDigest,
        reviewer_binding_digest: resolution.selected?.digest,
        transition_history: history,
        transport_attempts: 0,
        ...extra,
      },
      'state_digest_sha256',
    );
  let previousTransitionDigest = null;
  const canonicalHistory = history.map((transition, index) => {
    const transitionCycle =
      ['REPAIR_REQUIRED', 'NEW_CANDIDATE_FROZEN', 'CYCLE_2_ACTIVE'].includes(transition.from) ||
      ['NEW_CANDIDATE_FROZEN', 'CYCLE_2_ACTIVE', 'ESCALATION_REQUIRED'].includes(transition.to)
        ? 2
        : 1;
    const body = {
      from: transition.from,
      to: transition.to,
      ordinal: index + 1,
      cycle: transitionCycle,
      candidate_sha: transition.candidate_sha,
      candidate_manifest_digest: transition.candidate_manifest_digest ?? null,
      review_scope_digest: transition.review_scope_digest ?? null,
      review_result_digest: transition.review_result_digest ?? null,
      transport_digest: transition.transport_digest ?? null,
      repair_evidence_digest: transition.repair_evidence_digest ?? null,
      previous_state_digest: index === 0 ? null : (transition.previous_state_digest ?? null),
      previous_state_artifact:
        index === 0
          ? null
          : {
              state_path: context.profile.runtime.review_state,
              artifact_digest_sha256: previousTransitionDigest,
              canonicalization: 'stable-json-minus-self-digest',
            },
      previous_transition_digest: previousTransitionDigest,
    };
    const authenticated = withSelfDigest(body, 'transition_digest_sha256');
    previousTransitionDigest = authenticated.transition_digest_sha256;
    return authenticated;
  });
  const body = {
    schemaVersion: '3.0.0',
    round: context.profile.round,
    state,
    cycle,
    base_sha: proof.manifest.base_sha,
    candidate_sha: proof.manifest.candidate_sha,
    tree_sha: proof.manifest.tree_sha,
    profile_digest: context.digests.profile,
    policy_digest: context.digests.policy,
    candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
    review_scope_digest: scopeDigest,
    reviewer_binding_digest: resolution.selected?.digest,
    active_control_census_digest: proof.activeControlCensus?.census_digest_sha256,
    previous_candidate_sha: extra.previous_candidate_sha ?? null,
    prior_failure_result_digest: extra.prior_failure_result_digest ?? null,
    prior_failure_state_digest: extra.prior_failure_state_digest ?? null,
    prior_failure_transport_digest: extra.prior_failure_transport_digest ?? null,
    repair_evidence_digest: extra.repair_evidence_digest ?? null,
    transition_history: canonicalHistory,
    history_digest: sha256(canonical(canonicalHistory)),
    latest_transition_digest: previousTransitionDigest,
    previous_state_digest: extra.previous_state_digest ?? null,
    transport_attempts: extra.transport_attempts ?? 0,
    transport_history_digests: extra.transport_history_digests ?? [],
    current_transport_digest: extra.current_transport_digest ?? null,
    current_review_result_digest: extra.current_review_result_digest ?? null,
  };
  return withSelfDigest(body, 'state_digest_sha256');
}

function validateRepairEvidenceV4(context, priorState, newProof, findings) {
  const path = join(repoRoot, context.profile.runtime.review_repair_evidence);
  const repair = readJsonPrecisely(
    path,
    'REVIEW_REPAIR_EVIDENCE_MISSING',
    'REVIEW_REPAIR_EVIDENCE_MALFORMED',
    findings,
  );
  if (repair === null) return null;
  const v2IdentityLinkFields = [
    'prior_failure_transition_digest',
    'prior_failure_transport_digest',
    'new_candidate_manifest_digest',
    'repair_state_before_digest',
  ];
  if (
    repair.schemaVersion === '2.0.0' &&
    !v2IdentityLinkFields.every((field) => SHA256.test(repair[field] ?? ''))
  )
    findings.push(
      finding(
        'REVIEW_REPAIR_EVIDENCE_INCOMPLETE',
        'repair evidence lacks its complete authenticated V2 identity-link population',
      ),
    );
  if (
    !validateDocument(
      repair,
      context.policy.schemas.review_repair_evidence,
      findings,
      'REVIEW_REPAIR_EVIDENCE_SCHEMA_INVALID',
      'review repair evidence',
    ) ||
    !selfDigestValid(repair, 'repair_evidence_digest_sha256')
  ) {
    findings.push(
      finding(
        'REVIEW_REPAIR_EVIDENCE_SELF_DIGEST_INVALID',
        'repair evidence self-digest is invalid',
      ),
    );
    return null;
  }
  const priorResultFindings = [];
  const priorResultPath = capability(context, 'exact_prior_result_path')
    ? join(
        dirname(join(repoRoot, context.profile.runtime.review_result)),
        'review-results',
        `${priorState.prior_failure_result_digest}.json`,
      )
    : join(repoRoot, context.profile.runtime.review_result);
  const priorResult = readJsonPrecisely(
    priorResultPath,
    'REVIEW_PRIOR_FAILURE_RESULT_MISSING',
    'REVIEW_PRIOR_FAILURE_RESULT_MALFORMED',
    priorResultFindings,
  );
  findings.push(...priorResultFindings);
  let valid = priorResult !== null;
  if (priorResult !== null) {
    valid =
      validateDocument(
        priorResult,
        context.policy.schemas.review_result,
        findings,
        'REVIEW_PRIOR_FAILURE_RESULT_INVALID',
        'prior failure result',
      ) && valid;
    if (
      !selfDigestValid(priorResult, 'result_digest_sha256') ||
      priorResult.result_digest_sha256 !== priorState.prior_failure_result_digest ||
      priorResult.terminal?.verdict !== 'FAIL'
    )
      valid = false;
  }
  const grouped = new Map();
  for (const entry of priorResult?.findings ?? []) {
    const current = grouped.get(entry.defect_class_id) ?? {
      population_query: entry.population_query,
      affected_instances: [],
    };
    if (current.population_query !== entry.population_query) valid = false;
    current.affected_instances.push(...entry.affected_instances);
    grouped.set(entry.defect_class_id, current);
  }
  const repairedIds = (repair.repaired_classes ?? []).map(({ defect_class_id }) => defect_class_id);
  if (new Set(repairedIds).size !== repairedIds.length) valid = false;
  const repairedMap = new Map(
    (repair.repaired_classes ?? []).map((entry) => [entry.defect_class_id, entry]),
  );
  const expectedV2IdentityLinks = {
    prior_failure_transition_digest: priorState.latest_transition_digest,
    prior_failure_transport_digest: priorState.current_transport_digest,
    new_candidate_manifest_digest: newProof.manifest.manifest_digest_sha256,
    repair_state_before_digest: priorState.state_digest_sha256,
  };
  const v2IdentityLinksValid =
    repair.schemaVersion !== '2.0.0' ||
    Object.entries(expectedV2IdentityLinks).every(
      ([field, expectedDigest]) =>
        SHA256.test(expectedDigest ?? '') && repair[field] === expectedDigest,
    );
  valid =
    repair.prior_candidate_sha === priorState.candidate_sha &&
    repair.prior_candidate_manifest_digest === priorState.candidate_manifest_digest &&
    repair.prior_review_scope_digest === priorState.review_scope_digest &&
    repair.prior_review_result_digest === priorState.prior_failure_result_digest &&
    repair.prior_failure_state_digest === priorState.state_digest_sha256 &&
    repair.new_candidate_sha === newProof.manifest.candidate_sha &&
    repair.new_candidate_sha !== priorState.candidate_sha &&
    v2IdentityLinksValid &&
    canonical([...grouped.keys()].sort()) === canonical([...repairedMap.keys()].sort()) &&
    valid;
  if (
    gitResult(repoRoot, [
      'merge-base',
      '--is-ancestor',
      priorState.candidate_sha,
      repair.new_candidate_sha,
    ]).status !== 0
  )
    valid = false;
  const exactChangedPaths = statusAwareChangedPaths(
    priorState.candidate_sha,
    repair.new_candidate_sha,
  );
  const semanticChangedPaths = exactChangedPaths.filter((changedPath) => {
    try {
      const persistedTransport = JSON.parse(
        git(repoRoot, ['show', `${repair.new_candidate_sha}:${changedPath}`]),
      );
      return (
        persistedTransport.result_digest_sha256 !== priorState.prior_failure_result_digest ||
        !selfDigestValid(persistedTransport, 'result_digest_sha256')
      );
    } catch {
      return true;
    }
  });
  const claimedChangedPaths = [
    ...new Set((repair.repaired_classes ?? []).flatMap(({ changed_paths }) => changed_paths)),
  ].sort();
  if (canonical(claimedChangedPaths) !== canonical(semanticChangedPaths)) valid = false;
  const newTree = candidateTreeEntries(repair.new_candidate_sha);
  for (const [id, entry] of grouped) {
    const repaired = repairedMap.get(id);
    const instances = [...new Set(entry.affected_instances)].sort();
    if (
      repaired === undefined ||
      repaired.population_query !== entry.population_query ||
      canonical([...repaired.affected_instances].sort()) !== canonical(instances) ||
      canonical([...repaired.repaired_instances].sort()) !== canonical(instances) ||
      !(repaired.verification_refs ?? []).every((ref) => newTree.has(ref))
    )
      valid = false;
  }
  if (!valid)
    findings.push(
      finding(
        'REVIEW_REPAIR_EVIDENCE_INCOMPLETE',
        'repair evidence does not cover the exact prior failed-class population',
      ),
    );
  return valid ? repair : null;
}

function reviewScopeV4() {
  const findings = [];
  const round = option('--round') ?? '';
  // A missing or unresolvable base is a blocking finding, never an uncaught throw.
  const baseExpression = option('--base') ?? '';
  const baseResolution = gitResult(repoRoot, ['rev-parse', baseExpression]);
  if (baseExpression === '' || baseResolution.status !== 0)
    return emit({
      ok: false,
      command: 'review-scope',
      round,
      base: baseExpression,
      findings: [
        finding('REVIEW_SCOPE_BASE_REQUIRED', 'review scope requires one resolvable exact base', {
          revision: baseExpression,
        }),
      ],
    });
  const base = baseResolution.stdout.trim();
  const candidateExpression = option('--candidate') ?? 'HEAD';
  const candidate = resolveExactCandidateV6(candidateExpression, findings);
  const cycle = Number(option('--cycle') ?? '1');
  if (candidate === null)
    return emit({
      ok: false,
      command: 'review-scope',
      round,
      base,
      candidate: candidateExpression,
      cycle,
      findings,
    });
  const context = loadV4Context(round, findings, candidate);
  if (![1, 2].includes(cycle))
    findings.push(finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'only cycles 1 and 2 are permitted'));
  let existingState = null;
  let terminalReentry = false;
  if (context !== null && existsSync(join(repoRoot, context.profile.runtime.review_state))) {
    const stateFindings = [];
    existingState = readAuthenticatedStateV4(context, stateFindings, null);
    findings.push(...stateFindings);
    if (
      existingState !== null &&
      (context.policy.review_state_machine.terminal_states ?? []).includes(existingState.state)
    ) {
      terminalReentry = true;
      findings.push(finding('REVIEW_STATE_TERMINAL', 'terminal review state has no successor'));
    } else if (cycle === 1 && existingState !== null)
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'cycle 1 scope cannot overwrite authenticated review history',
        ),
      );
  }
  const proof =
    context === null ? null : authenticateCandidateProofV4(context, base, candidate, findings);
  const ledger = context === null ? null : validateClaimsV4(context, candidate, findings);
  const binding = context === null ? null : reviewerBindingV4(context, candidate);
  if (binding !== null) {
    findings.push(...binding.findings);
    if (binding.diagnostic !== null) findings.push(binding.diagnostic);
  }
  let priorState = null;
  let repair = null;
  if (context !== null && proof !== null && cycle === 2) {
    priorState = readAuthenticatedStateV4(context, findings, null);
    if (priorState?.state !== 'REPAIR_REQUIRED')
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'cycle 2 requires authenticated REPAIR_REQUIRED state',
        ),
      );
    if (priorState !== null)
      repair = validateRepairEvidenceV4(context, priorState, proof, findings);
  }
  if (
    proof !== null &&
    ledger !== null &&
    proof.manifest.claims_digest !== ledger.claims_digest_sha256
  ) {
    findings.push(
      finding(
        'CANDIDATE_CLAIMS_CROSS_DIGEST_INVALID',
        'candidate manifest and materialized claims do not share one digest',
      ),
    );
  }
  if (
    context === null ||
    proof === null ||
    ledger === null ||
    binding?.selected === null ||
    findings.length > 0
  ) {
    if (context !== null && !terminalReentry) {
      rmSync(join(repoRoot, context.profile.runtime.review_scope), { force: true });
    }
    emit({ ok: false, command: 'review-scope', round, cycle, manifest: null, findings });
    return;
  }
  const topics = makeReviewTopicsV4(context, base, candidate, proof, ledger, findings);
  if (new Set(topics.map(({ topic_id }) => topic_id)).size !== topics.length)
    findings.push(
      finding('REVIEW_TOPIC_DUPLICATED', 'generated review topic identifiers must be unique'),
    );
  const activeControls = [
    context.profilePath,
    'law/policy/round-close-controls.json',
    context.profile.sources.authorization,
    context.profile.sources.plan,
    context.profile.sources.orchestrator,
    ...(context.profile.sources.additional_controls ?? []),
  ];
  const previousCandidateManifestDigests =
    priorState === null ? [] : [priorState.candidate_manifest_digest];
  const identityBody = {
    invocation_round: round,
    invocation_cycle: cycle,
    invocation_candidate: candidate,
    candidate_tree_from_git: proof.tree,
    policy_version_from_policy: context.policy.review_scope.policy_version,
    previous_candidate_manifest_digests_from_state: previousCandidateManifestDigests,
  };
  const identityProof = {
    ...identityBody,
    identity_digest_sha256: sha256(canonical(identityBody)),
  };
  const body = {
    schemaVersion: context.policy.schemaVersion === '5.0.0' ? '4.0.0' : '3.0.0',
    policy_version: context.policy.review_scope.policy_version,
    round,
    cycle,
    exact_base: base,
    review_candidate: candidate,
    candidate_tree: proof.tree,
    policy_digest: context.digests.policy,
    profile_digest: context.digests.profile,
    graph_digest: context.digests.graph,
    obligations_digest: context.digests.obligations,
    claims_digest: ledger.claims_digest_sha256,
    ...(context.policy.schemaVersion === '5.0.0'
      ? {
          active_control_census_digest: proof.activeControlCensus.census_digest_sha256,
          identity_proof: identityProof,
        }
      : {
          active_controls_digest: candidateDigestForPaths(
            candidate,
            activeControls.filter((path) => candidateTreeEntries(candidate).has(path)),
          ),
        }),
    prior_findings_digest: context.digests.priorFindings,
    impact_plan_digest: proof.impact.execution_digest_sha256,
    convergence_evidence_digest: proof.convergence.convergence_digest_sha256,
    candidate_identity_digest: proof.identityDigest,
    current_candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
    previous_candidate_manifest_digests: previousCandidateManifestDigests,
    topic_count: topics.length,
    topics,
  };
  const manifest = withSelfDigest(body, 'manifest_digest_sha256');
  validateDocument(
    manifest,
    context.policy.schemas.review_scope,
    findings,
    'REVIEW_SCOPE_SCHEMA_INVALID',
    'review scope',
  );
  if (findings.length === 0) {
    writeJsonAtomic(join(repoRoot, context.profile.runtime.review_scope), manifest);
    const history =
      priorState === null
        ? [
            transitionV4('DRAFT', 'PREFLIGHT_GREEN', proof, {
              review_scope_digest: manifest.manifest_digest_sha256,
            }),
            transitionV4('PREFLIGHT_GREEN', 'CANDIDATE_FROZEN', proof, {
              review_scope_digest: manifest.manifest_digest_sha256,
            }),
            transitionV4('CANDIDATE_FROZEN', 'CYCLE_1_ACTIVE', proof, {
              review_scope_digest: manifest.manifest_digest_sha256,
            }),
          ]
        : [
            ...priorState.transition_history,
            transitionV4('REPAIR_REQUIRED', 'PREFLIGHT_GREEN', proof, {
              review_scope_digest: manifest.manifest_digest_sha256,
              previous_state_digest: priorState.state_digest_sha256,
              repair_evidence_digest: repair.repair_evidence_digest_sha256,
            }),
            transitionV4('PREFLIGHT_GREEN', 'NEW_CANDIDATE_FROZEN', proof, {
              review_scope_digest: manifest.manifest_digest_sha256,
              repair_evidence_digest: repair.repair_evidence_digest_sha256,
            }),
            transitionV4('NEW_CANDIDATE_FROZEN', 'CYCLE_2_ACTIVE', proof, {
              review_scope_digest: manifest.manifest_digest_sha256,
              repair_evidence_digest: repair.repair_evidence_digest_sha256,
            }),
          ];
    const state = makeReviewStateV4(
      context,
      proof,
      manifest.manifest_digest_sha256,
      cycle === 1 ? 'CYCLE_1_ACTIVE' : 'CYCLE_2_ACTIVE',
      cycle,
      history,
      cycle === 2
        ? {
            previous_candidate_sha: priorState.candidate_sha,
            prior_failure_result_digest: repair.prior_review_result_digest,
            prior_failure_state_digest: repair.prior_failure_state_digest,
            prior_failure_transport_digest: repair.prior_failure_transport_digest,
            repair_evidence_digest: repair.repair_evidence_digest_sha256,
          }
        : {},
    );
    if (
      context.policy.schemaVersion === '5.0.0' &&
      capability(context, 'review_scope_state_persistence')
    )
      persistStateV5(context, state);
    else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), state);
  }
  emit({
    ok: findings.length === 0,
    command: 'review-scope',
    round,
    cycle,
    manifest: findings.length === 0 ? manifest : null,
    findings,
  });
}

function readAuthenticatedStateV4(context, findings, expected) {
  const path = join(repoRoot, context.profile.runtime.review_state);
  const state = readJsonPrecisely(path, 'REVIEW_STATE_MISSING', 'REVIEW_STATE_MALFORMED', findings);
  if (state === null) return null;
  if (
    !validateDocument(
      state,
      context.policy.schemas.review_state,
      findings,
      'REVIEW_STATE_SCHEMA_INVALID',
      'review state',
    )
  )
    return null;
  if (!selfDigestValid(state, 'state_digest_sha256')) {
    findings.push(
      finding('REVIEW_STATE_SELF_DIGEST_INVALID', 'review state self-digest is invalid'),
    );
    return null;
  }
  if (
    context.policy.schemaVersion === '5.0.0' &&
    capability(context, 'predecessor_artifact_authentication') &&
    state.previous_state_digest !== null
  ) {
    const predecessorPath = join(
      dirname(path),
      'review-states',
      `${state.previous_state_digest}.json`,
    );
    if (!existsSync(predecessorPath)) {
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_MISSING',
          'exact predecessor state artifact is not persisted',
        ),
      );
      return null;
    }
    const predecessor = readJson(predecessorPath);
    if (
      !selfDigestValid(predecessor, 'state_digest_sha256') ||
      predecessor.state_digest_sha256 !== state.previous_state_digest
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_INVALID',
          'persisted predecessor state artifact does not match its exact self-digest',
        ),
      );
      return null;
    }
  }
  for (const transition of state.transition_history ?? [])
    if (!selfDigestValid(transition, 'transition_digest_sha256')) {
      findings.push(
        finding('REVIEW_STATE_TRANSITION_DIGEST_INVALID', 'review transition digest is invalid'),
      );
      return null;
    }
  if (context.policy.schemaVersion === '5.0.0') {
    const exactArtifactChain = capability(context, 'exact_artifact_chain');
    const history = state.transition_history ?? [];
    const scopePath = join(repoRoot, context.profile.runtime.review_scope);
    const scope = existsSync(scopePath) ? readJson(scopePath) : null;
    let previousDigest = null;
    let previousTo = null;
    for (let index = 0; index < history.length; index += 1) {
      const transition = history[index];
      validateTransitionEdgeV6(context, transition, index, history[index - 1] ?? null, findings);
      if (
        transition.ordinal !== index + 1 ||
        transition.previous_transition_digest !== previousDigest ||
        (previousTo !== null && transition.from !== previousTo)
      ) {
        findings.push(
          finding(
            'REVIEW_STATE_HISTORY_NONCANONICAL',
            'review transition history is reordered, skipped, or duplicated',
            { ordinal: index + 1 },
          ),
        );
        return null;
      }
      if (index > 0 && transition.previous_transition_digest === null) {
        findings.push(
          finding(
            'REVIEW_STATE_PREDECESSOR_MISSING',
            'review transition predecessor digest is missing',
          ),
        );
        return null;
      }
      previousDigest = transition.transition_digest_sha256;
      previousTo = transition.to;
    }
    if (
      state.history_digest !== sha256(canonical(history)) ||
      state.latest_transition_digest !== previousDigest
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_PREDECESSOR_INVALID',
          'review state history digest or transition tip is stale or forged',
        ),
      );
      return null;
    }
    const cycleOneStates = new Set([
      'DRAFT',
      'CANDIDATE_FROZEN',
      'CYCLE_1_ACTIVE',
      'REPAIR_REQUIRED',
    ]);
    const cycleTwoStates = new Set([
      'NEW_CANDIDATE_FROZEN',
      'CYCLE_2_ACTIVE',
      'ESCALATION_REQUIRED',
    ]);
    if (
      (cycleOneStates.has(state.state) && state.cycle !== 1) ||
      (cycleTwoStates.has(state.state) && state.cycle !== 2)
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_CYCLE_INVALID',
          'review state and cycle do not match the declared graph',
        ),
      );
      return null;
    }
    if ((state.transport_history_digests ?? []).length !== state.transport_attempts) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_ATTEMPT_POPULATION_INCOMPLETE',
          'nonzero transport attempts lack the exact persisted digest population',
        ),
      );
      return null;
    }
    let priorTransportDigest = null;
    for (let attempt = 1; attempt <= state.transport_attempts; attempt += 1) {
      const attemptPath = join(
        repoRoot,
        context.profile.runtime.review_transport_root,
        `attempt-${String(attempt)}.json`,
      );
      if (!existsSync(attemptPath)) {
        findings.push(
          finding('REVIEW_TRANSPORT_CHAIN_MISSING', 'persisted transport attempt is missing', {
            attempt,
          }),
        );
        return null;
      }
      const transport = readJson(attemptPath);
      const payloadPath = join(
        repoRoot,
        context.profile.runtime.review_transport_root,
        `attempt-${String(attempt)}.payload`,
      );
      const payloadDigest = exactArtifactChain
        ? existsSync(payloadPath)
          ? sha256(readFileSync(payloadPath))
          : null
        : transport.payload_digest;
      const isCurrentValid =
        transport.transport_digest_sha256 === state.current_transport_digest &&
        state.current_review_result_digest !== null;
      // The state-before identity is corroborated against the authenticated state chain,
      // which the transport cannot influence.
      //
      // Two wrong answers were tried before this one and both are rejected here. Taking
      // the expectation from the transport is a tautology: the transport is compared
      // with a copy of its own field. Taking it from the current state digest is also
      // wrong: the writer records state_before_digest from the state as it stood when
      // the transport was written, and the state is then re-digested with an incremented
      // attempt count, so the current digest is legitimately different and the check
      // would raise a false chain failure on every retry.
      //
      // The authenticated chain is the current state identity plus every predecessor
      // identity recorded in its own transition history.
      const authenticatedStateIdentities = new Set(
        [
          state.state_digest_sha256,
          ...(state.transition_history ?? []).map(
            ({ previous_state_digest: previous }) => previous,
          ),
        ].filter((value) => typeof value === 'string' && SHA256.test(value)),
      );
      const stateBeforePath = join(
        dirname(path),
        'review-states',
        `${transport.state_before_digest}.json`,
      );
      let stateBeforeAuthentic = !exactArtifactChain;
      if (exactArtifactChain) {
        const claimed = transport.state_before_digest;
        const retained = existsSync(stateBeforePath) ? readJson(stateBeforePath) : null;
        stateBeforeAuthentic =
          retained !== null &&
          selfDigestValid(retained, 'state_digest_sha256') &&
          retained.state_digest_sha256 === claimed &&
          authenticatedStateIdentities.has(claimed);
      }
      if (
        !reauthenticateTransportV6(
          context,
          state,
          scope,
          transport,
          attempt,
          priorTransportDigest,
          findings,
          exactArtifactChain
            ? {
                payload_digest: payloadDigest,
                validation: isCurrentValid ? 'VALID' : 'INVALID_TRANSPORT',
                // state_before_digest is deliberately absent: it is corroborated against
                // the authenticated state chain above, not by equality with a value this
                // function could only take from the transport or the current state.
              }
            : null,
        ) ||
        (exactArtifactChain && payloadDigest === null) ||
        (exactArtifactChain && !stateBeforeAuthentic) ||
        transport.transport_digest_sha256 !== state.transport_history_digests[attempt - 1]
      ) {
        findings.push(
          finding(
            attempt > 1 ? 'REVIEW_TRANSPORT_PREDECESSOR_INVALID' : 'REVIEW_TRANSPORT_CHAIN_INVALID',
            'persisted transport attempt chain is stale, reordered, or forged',
            { attempt },
          ),
        );
        return null;
      }
      priorTransportDigest = transport.transport_digest_sha256;
    }
    if (state.current_transport_digest !== priorTransportDigest) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_CHAIN_INVALID',
          'state transport tip does not equal the authenticated attempt chain',
        ),
      );
      return null;
    }
    if (state.state === 'REVIEW_TRANSPORT_BLOCKED' && state.transport_attempts !== 2) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_BLOCKED',
          'transport terminal requires exactly two exhausted malformed attempts',
        ),
      );
      return null;
    }
    if (state.current_review_result_digest !== null && state.current_transport_digest === null) {
      findings.push(
        finding(
          'REVIEW_TRANSPORT_PAYLOAD_RESULT_MISMATCH',
          'review result is not bound to one authenticated successful transport',
        ),
      );
      return null;
    }
    if (state.current_review_result_digest !== null) {
      const resultPath = exactArtifactChain
        ? join(
            dirname(join(repoRoot, context.profile.runtime.review_result)),
            'review-results',
            `${state.current_review_result_digest}.json`,
          )
        : join(repoRoot, context.profile.runtime.review_result);
      if (!existsSync(resultPath)) {
        findings.push(
          finding('REVIEW_STATE_RESULT_MISSING', 'review state result artifact is missing'),
        );
        return null;
      }
      const result = readJson(resultPath);
      if (
        !validateDocument(
          result,
          context.policy.schemas.review_result,
          findings,
          'REVIEW_STATE_RESULT_INVALID',
          'review result',
        ) ||
        !selfDigestValid(result, 'result_digest_sha256') ||
        result.result_digest_sha256 !== state.current_review_result_digest
      ) {
        findings.push(
          finding('REVIEW_STATE_RESULT_INVALID', 'review state result artifact is stale or forged'),
        );
        return null;
      }
      reauthenticateReviewResultV6(context, state, scope, result, findings);
    }
    if (state.repair_evidence_digest !== null) {
      const repairPath = join(repoRoot, context.profile.runtime.review_repair_evidence);
      if (!existsSync(repairPath)) {
        findings.push(finding('REVIEW_STATE_REPAIR_MISSING', 'review repair artifact is missing'));
        return null;
      }
      const repair = readJson(repairPath);
      // The expected repaired-class population is derived from the authenticated prior
      // failure result, not defaulted to null. With a null expectation the population
      // check evaluated true unconditionally and proved nothing.
      let expectedRepairedClasses = null;
      if (capability(context, 'predecessor_artifact_authentication')) {
        const priorResult = readPriorFailureResultV9(context, state);
        if (priorResult !== null)
          expectedRepairedClasses = [
            ...new Set(
              (priorResult.findings ?? [])
                .map(({ defect_class_id: id }) => String(id))
                .filter((id) => id !== 'undefined'),
            ),
          ];
      }
      reauthenticateRepairEvidenceV6(context, state, repair, findings, expectedRepairedClasses);
      if (
        !selfDigestValid(repair, 'repair_evidence_digest_sha256') ||
        repair.repair_evidence_digest_sha256 !== state.repair_evidence_digest
      ) {
        findings.push(
          finding('REVIEW_STATE_REPAIR_INVALID', 'review repair artifact is stale or forged'),
        );
        return null;
      }
    }
    if (state.state === 'REPAIR_REQUIRED' && state.prior_failure_result_digest === null) {
      findings.push(
        finding(
          'REVIEW_STATE_RESULT_MISSING',
          'repair-required state lacks its authenticated failure result',
        ),
      );
      return null;
    }
    if (state.state === 'CYCLE_2_ACTIVE' && state.repair_evidence_digest === null) {
      findings.push(
        finding('REVIEW_STATE_REPAIR_MISSING', 'cycle 2 lacks authenticated repair evidence'),
      );
      return null;
    }
  }
  const allowed = context.policy.review_state_machine.allowed_transitions ?? {};
  const binding = reviewerBindingV4(context, state.candidate_sha);
  findings.push(...binding.findings);
  let anchored =
    state.round === context.profile.round &&
    state.profile_digest === context.digests.profile &&
    state.policy_digest === context.digests.policy &&
    binding.selected !== null &&
    state.reviewer_binding_digest === binding.selected.digest;
  try {
    anchored =
      anchored &&
      git(repoRoot, ['rev-parse', `${state.candidate_sha}^{tree}`]) === state.tree_sha &&
      gitResult(repoRoot, ['merge-base', '--is-ancestor', state.base_sha, state.candidate_sha])
        .status === 0;
  } catch {
    anchored = false;
  }
  if (!anchored) {
    findings.push(
      finding(
        'REVIEW_STATE_IDENTITY_INVALID',
        'review state is not anchored to current policy, profile, candidate tree, base, and reviewer',
      ),
    );
    return null;
  }
  const prefix = state.transition_history.slice(0, 3).map(({ from, to }) => `${from}->${to}`);
  if (
    canonical(prefix) !==
    canonical([
      'DRAFT->PREFLIGHT_GREEN',
      'PREFLIGHT_GREEN->CANDIDATE_FROZEN',
      'CANDIDATE_FROZEN->CYCLE_1_ACTIVE',
    ])
  ) {
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_INVALID',
        'review history lacks the complete authenticated cycle-1 prefix',
      ),
    );
    return null;
  }
  for (let index = 0; index < state.transition_history.length; index += 1) {
    const transition = state.transition_history[index];
    if (
      !(allowed[transition.from] ?? []).includes(transition.to) ||
      (index > 0 && state.transition_history[index - 1].to !== transition.from)
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'review transition history contains an undeclared or discontinuous edge',
        ),
      );
      return null;
    }
  }
  if (state.transition_history.at(-1)?.to !== state.state) {
    findings.push(
      finding('REVIEW_STATE_TRANSITION_INVALID', 'review state does not equal terminal transition'),
    );
    return null;
  }
  const terminalTransition = state.transition_history.at(-1);
  if (
    terminalTransition.candidate_sha !== state.candidate_sha ||
    terminalTransition.candidate_manifest_digest !== state.candidate_manifest_digest ||
    terminalTransition.review_scope_digest !== state.review_scope_digest
  ) {
    findings.push(
      finding(
        'REVIEW_STATE_TRANSITION_INVALID',
        'terminal transition does not bind top-level state identity',
      ),
    );
    return null;
  }
  for (const transition of state.transition_history) {
    if (
      ['PASS', 'REPAIR_REQUIRED', 'ESCALATION_REQUIRED', 'REVIEW_TRANSPORT_BLOCKED'].includes(
        transition.to,
      ) &&
      transition.previous_state_digest === null
    ) {
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'state-changing result or transport transition lacks predecessor state digest',
        ),
      );
      return null;
    }
  }
  if (
    expected !== null &&
    (state.round !== expected.round ||
      state.cycle !== expected.cycle ||
      state.candidate_sha !== expected.candidate ||
      state.candidate_manifest_digest !== expected.candidate_manifest_digest ||
      state.review_scope_digest !== expected.review_scope_digest ||
      state.profile_digest !== context.digests.profile ||
      state.policy_digest !== context.digests.policy)
  ) {
    findings.push(
      finding('REVIEW_STATE_IDENTITY_INVALID', 'review state belongs to another exact identity'),
    );
    return null;
  }
  if ((context.policy.review_state_machine.terminal_states ?? []).includes(state.state)) {
    const terminalCycle =
      terminalTransition.from === 'CYCLE_1_ACTIVE'
        ? 1
        : terminalTransition.from === 'CYCLE_2_ACTIVE'
          ? 2
          : null;
    if (terminalCycle === null || state.cycle !== terminalCycle) {
      findings.push(
        finding(
          'REVIEW_STATE_TRANSITION_INVALID',
          'terminal state cycle does not match its authenticated active-cycle predecessor',
        ),
      );
      return null;
    }
  }
  return state;
}

function parseReviewResultV4(path, findings) {
  let source;
  try {
    source = readFileSync(path, 'utf8').trim();
  } catch (error) {
    findings.push(finding('REVIEW_RESULT_INVALID', String(error)));
    return null;
  }
  try {
    return JSON.parse(source);
  } catch {
    try {
      const records = source
        .split(/\r?\n/u)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const knownTypes = new Set(['header', 'disposition', 'finding', 'terminal']);
      if (
        records.some(({ type }) => !knownTypes.has(type)) ||
        records[0]?.type !== 'header' ||
        records.at(-1)?.type !== 'terminal' ||
        records.filter(({ type }) => type === 'header').length !== 1 ||
        records.filter(({ type }) => type === 'terminal').length !== 1
      )
        throw new Error('non-canonical JSONL stream');
      const header = { ...records[0] };
      delete header.type;
      return {
        ...header,
        dispositions: records
          .filter(({ type }) => type === 'disposition')
          .map(({ type: _type, ...entry }) => entry),
        findings: records
          .filter(({ type }) => type === 'finding')
          .map(({ type: _type, ...entry }) => entry),
        terminal: (({ type: _type, ...entry }) => entry)(records.at(-1)),
      };
    } catch (error) {
      const detail = String(error);
      findings.push(
        finding(
          detail.includes('non-canonical JSONL stream')
            ? 'REVIEW_JSONL_NON_CANONICAL'
            : 'REVIEW_RESULT_INVALID',
          `malformed or truncated review result: ${detail}`,
        ),
      );
      return null;
    }
  }
}

function validateReuseV4(context, topic, disposition, proof, findings) {
  if (
    !Array.isArray(disposition.recomputed_inputs_manifest) ||
    disposition.recomputed_inputs_manifest.length === 0
  )
    findings.push(
      finding(
        'REVIEW_REUSE_INPUT_MANIFEST_MISSING',
        'reused topic has no recomputed input manifest',
        { topic_id: topic.topic_id },
      ),
    );
  else {
    const paths = pathsForGlobs(
      repoRoot,
      proof.manifest.candidate_sha,
      topic.governing_paths.flatMap(expandBraceSelectors),
    );
    const tree = candidateTreeEntries(proof.manifest.candidate_sha);
    const expected = paths.map((source) => ({ source, digest: sha256(String(tree.get(source))) }));
    if (
      canonical(disposition.recomputed_inputs_manifest) !== canonical(expected) ||
      sha256(canonical(expected.map(({ source, digest }) => ({ path: source, digest })))) !==
        topic.current_digest
    )
      findings.push(
        finding('REVIEW_REUSE_INPUT_MANIFEST_STALE', 'recomputed input manifest is stale', {
          topic_id: topic.topic_id,
        }),
      );
  }
  if (
    !Array.isArray(disposition.recomputed_evidence_manifest) ||
    disposition.recomputed_evidence_manifest.length === 0
  )
    findings.push(
      finding(
        'REVIEW_REUSE_EVIDENCE_MANIFEST_MISSING',
        'reused topic has no recomputed evidence manifest',
        { topic_id: topic.topic_id },
      ),
    );
  else {
    const expectedEvidence = topicEvidenceManifestV4(
      context,
      proof,
      topic.source_refs,
      topic.required_evidence,
    );
    if (expectedEvidence === null)
      findings.push(
        finding(
          'REVIEW_REUSE_EVIDENCE_UNRESOLVED',
          'reused topic has evidence that cannot be mechanically resolved',
          { topic_id: topic.topic_id },
        ),
      );
    else {
      const actualEvidence = disposition.recomputed_evidence_manifest;
      const expectedRefs = expectedEvidence.map(({ ref }) => ref);
      const actualRefs = actualEvidence.map(({ ref }) => ref);
      if (canonical(actualRefs) !== canonical(expectedRefs))
        findings.push(
          finding(
            'REVIEW_REUSE_EVIDENCE_MANIFEST_INCOMPLETE',
            'recomputed evidence does not contain the exact per-topic reference population',
            { topic_id: topic.topic_id },
          ),
        );
      else if (canonical(actualEvidence) !== canonical(expectedEvidence))
        findings.push(
          finding(
            'REVIEW_REUSE_EVIDENCE_MANIFEST_STALE',
            'recomputed per-topic evidence contains a stale digest',
            { topic_id: topic.topic_id },
          ),
        );
      if (disposition.recomputed_evidence_digest !== sha256(canonical(expectedEvidence)))
        findings.push(
          finding(
            'REVIEW_REUSE_EVIDENCE_DIGEST_INVALID',
            'recomputed evidence aggregate digest is stale',
            { topic_id: topic.topic_id },
          ),
        );
    }
  }
  const expectedKeys = topicTaskKeysV4(proof, topic.required_evidence);
  if (
    !Array.isArray(disposition.recomputed_task_keys) ||
    (expectedKeys.length > 0 && disposition.recomputed_task_keys.length === 0)
  )
    findings.push(
      finding(
        'REVIEW_REUSE_TASK_KEY_REQUIRED',
        'reused topic requires its current relevant PASS task keys',
        { topic_id: topic.topic_id },
      ),
    );
  else {
    if (canonical(disposition.recomputed_task_keys) !== canonical(expectedKeys))
      findings.push(
        finding(
          'REVIEW_REUSE_TASK_KEY_STALE',
          'reused topic task keys are not the current exact relevant PASS population',
          { topic_id: topic.topic_id },
        ),
      );
  }
}

function dispositionInputsV5(topic, proof) {
  const tree = candidateTreeEntries(proof.manifest.candidate_sha);
  const paths = pathsForGlobs(
    repoRoot,
    proof.manifest.candidate_sha,
    topic.governing_paths.flatMap(expandBraceSelectors),
  );
  const entries = paths.map((source) => ({
    source,
    digest: sha256(gitBytes(repoRoot, ['cat-file', 'blob', tree.get(source)])),
  }));
  if (entries.length === 0) {
    for (const source of topic.governing_paths)
      entries.push({
        source,
        digest: sha256(
          canonical({ source, state: 'absent', candidate: proof.manifest.candidate_sha }),
        ),
      });
  }
  return entries.sort((left, right) => left.source.localeCompare(right.source));
}

function dispositionEvidenceV5(context, topic, proof) {
  const refs = [
    'candidate manifest',
    'convergence evidence',
    ...topic.source_refs,
    ...topic.required_evidence,
  ];
  const resolved = refs.map((ref) => resolveTopicEvidenceV6(context, proof, ref));
  if (resolved.some((entry) => entry === null)) return null;
  return [...new Map(resolved.map((entry) => [entry.ref, entry])).values()];
}

function authenticateTypedEvidenceV6(context, topic, disposition, proof, findings) {
  const evidence = dispositionEvidenceV5(context, topic, proof);
  if (evidence === null) {
    findings.push(
      finding('UNRESOLVED_TOPIC_EVIDENCE', 'topic evidence has an unresolved typed reference', {
        topic_id: topic.topic_id,
      }),
    );
    return null;
  }
  const supplied = disposition.recomputed_evidence_manifest ?? [];
  if (canonical(supplied) !== canonical(evidence))
    findings.push(
      finding(
        'REVIEW_EVIDENCE_IDENTITY_INVALID',
        'review evidence differs from independently resolved exact bytes',
        { topic_id: topic.topic_id },
      ),
    );
  return evidence;
}

function taskFreshnessManifestV5(context, topic, proof) {
  const taskKeys = topicTaskKeysV4(proof, topic.required_evidence);
  const records = [];
  for (const taskKey of taskKeys) {
    const gate = (proof.convergence.passes?.[1]?.gate_results ?? []).find(
      ({ task_key: key }) => key === taskKey,
    );
    if (gate === undefined) continue;
    const taskId = `gate-${gate.gate_id}`;
    const cache = readJson(v3CachePath(context, taskId, taskKey));
    records.push({
      task_id: taskId,
      task_key: taskKey,
      result_digest: cache.result_digest,
      evidence_ref: `gate:${gate.gate_id}`,
    });
  }
  return records;
}

function authenticateDispositionProofV5(context, topic, disposition, proof, findings) {
  const inputs = dispositionInputsV5(topic, proof);
  const evidence = authenticateTypedEvidenceV6(context, topic, disposition, proof, findings);
  if (evidence === null) return;
  const evidenceDigest = sha256(canonical(evidence));
  const evidenceRefs = evidence.map(({ ref }) => ref);
  const evidenceRefsDigest = sha256(canonical(evidenceRefs));
  const taskFreshness = taskFreshnessManifestV5(context, topic, proof);
  const taskKeys = taskFreshness.map(({ task_key }) => task_key);
  if (
    canonical(disposition.recomputed_inputs_manifest) !== canonical(inputs) ||
    disposition.recomputed_digest !== topic.current_digest
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_INPUTS_INVALID',
        'disposition input proof differs from the exact current topic population',
        { topic_id: topic.topic_id },
      ),
    );
  if (
    canonical(disposition.recomputed_evidence_manifest) !== canonical(evidence) ||
    disposition.recomputed_evidence_digest !== evidenceDigest
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_EVIDENCE_INVALID',
        'disposition evidence proof differs from the exact current evidence population',
        { topic_id: topic.topic_id },
      ),
    );
  if (
    canonical(disposition.evidence_refs) !== canonical(evidenceRefs) ||
    disposition.recomputed_evidence_refs_digest !== evidenceRefsDigest
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_EVIDENCE_REFS_INVALID',
        'disposition evidence-reference set is incomplete or stale',
        { topic_id: topic.topic_id },
      ),
    );
  if (
    canonical(disposition.recomputed_task_freshness_manifest) !== canonical(taskFreshness) ||
    canonical(disposition.recomputed_task_keys) !== canonical(taskKeys)
  )
    findings.push(
      finding(
        'REVIEW_DISPOSITION_TASK_FRESHNESS_INVALID',
        'disposition task freshness population is incomplete or stale',
        { topic_id: topic.topic_id },
      ),
    );
  const proofBody = {
    topic_id: topic.topic_id,
    disposition: disposition.disposition,
    recomputed_digest: topic.current_digest,
    recomputed_inputs_manifest: inputs,
    recomputed_evidence_manifest: evidence,
    recomputed_evidence_digest: evidenceDigest,
    recomputed_evidence_refs_digest: evidenceRefsDigest,
    recomputed_task_keys: taskKeys,
    recomputed_task_freshness_manifest: taskFreshness,
    evidence_refs: evidenceRefs,
  };
  if (disposition.proof_digest_sha256 !== sha256(canonical(proofBody)))
    findings.push(
      finding('REVIEW_DISPOSITION_PROOF_INVALID', 'disposition aggregate proof digest is invalid', {
        topic_id: topic.topic_id,
      }),
    );
}

function reviewScopeIdentityV5(context, scope, round, cycle, candidate, state) {
  const previousDigests =
    cycle === 1
      ? []
      : [
          ...new Set(
            (state?.transition_history ?? [])
              .map(({ candidate_manifest_digest }) => candidate_manifest_digest)
              .filter(
                (digest) => digest !== null && digest !== scope.current_candidate_manifest_digest,
              ),
          ),
        ];
  const body = {
    invocation_round: round,
    invocation_cycle: cycle,
    invocation_candidate: candidate,
    candidate_tree_from_git: git(repoRoot, ['rev-parse', `${candidate}^{tree}`]),
    policy_version_from_policy: context.policy.review_scope.policy_version,
    previous_candidate_manifest_digests_from_state: previousDigests,
  };
  return { ...body, identity_digest_sha256: sha256(canonical(body)) };
}

function validateReviewScopeIdentityV5(context, scope, round, cycle, candidate, state, findings) {
  const expected = reviewScopeIdentityV5(context, scope, round, cycle, candidate, state);
  const checks = [
    ['round', scope.round, round, 'REVIEW_SCOPE_IDENTITY_ROUND_INVALID'],
    ['cycle', scope.cycle, cycle, 'REVIEW_SCOPE_IDENTITY_CYCLE_INVALID'],
    [
      'review_candidate',
      scope.review_candidate,
      candidate,
      'REVIEW_SCOPE_IDENTITY_REVIEW_CANDIDATE_INVALID',
    ],
    [
      'candidate_tree',
      scope.candidate_tree,
      expected.candidate_tree_from_git,
      'REVIEW_SCOPE_IDENTITY_CANDIDATE_TREE_INVALID',
    ],
    [
      'policy_version',
      scope.policy_version,
      expected.policy_version_from_policy,
      'REVIEW_SCOPE_IDENTITY_POLICY_VERSION_INVALID',
    ],
    [
      'previous_candidate_manifest_digests',
      scope.previous_candidate_manifest_digests,
      expected.previous_candidate_manifest_digests_from_state,
      'REVIEW_SCOPE_IDENTITY_PREVIOUS_CANDIDATE_MANIFEST_DIGESTS_INVALID',
    ],
  ];
  const failed = checks.filter(([, actual, wanted]) => canonical(actual) !== canonical(wanted));
  for (const [field, actual, wanted, code] of failed)
    findings.push(
      finding(
        code,
        'review scope core identity differs from independently derived invocation state',
        { field, expected: wanted, actual },
      ),
    );
  if (failed.length > 1)
    findings.push(
      finding(
        'REVIEW_SCOPE_IDENTITY_COMBINED_INVALID',
        'multiple review scope identity fields are invalid',
      ),
    );
  if (canonical(scope.identity_proof) !== canonical(expected))
    findings.push(
      finding(
        'REVIEW_SCOPE_IDENTITY_PRETRANSPORT_REJECTED',
        'scope identity proof does not match independent pre-transport recomputation',
      ),
    );
  return failed.length === 0 && canonical(scope.identity_proof) === canonical(expected);
}

function writeAuthenticatedTransportV5(
  context,
  state,
  scope,
  payloadDigest,
  validation,
  previousTransportDigest = null,
  payloadBytes = null,
) {
  const attempt = Number(state.transport_attempts ?? 0) + 1;
  const body = {
    schemaVersion: '2.0.0',
    round: state.round,
    cycle: state.cycle,
    attempt,
    candidate_sha: state.candidate_sha,
    candidate_tree: state.tree_sha,
    policy_digest: state.policy_digest,
    profile_digest: state.profile_digest,
    candidate_manifest_digest: state.candidate_manifest_digest,
    review_scope_digest: state.review_scope_digest,
    scope_identity_digest: scope.identity_proof.identity_digest_sha256,
    reviewer_binding_digest: state.reviewer_binding_digest,
    active_control_census_digest: state.active_control_census_digest,
    payload_digest: payloadDigest,
    validation,
    state_before_digest: state.state_digest_sha256,
    previous_transport_digest: previousTransportDigest,
  };
  const transport = withSelfDigest(body, 'transport_digest_sha256');
  const path = join(
    repoRoot,
    context.profile.runtime.review_transport_root,
    `attempt-${String(attempt)}.json`,
  );
  if (payloadBytes !== null)
    writeBytesAtomic(
      join(
        repoRoot,
        context.profile.runtime.review_transport_root,
        `attempt-${String(attempt)}.payload`,
      ),
      payloadBytes,
    );
  writeJsonAtomic(path, transport);
  writeJsonAtomic(join(repoRoot, context.profile.runtime.review_transport), transport);
  return transport;
}

function persistStateV5(context, state) {
  const currentPath = join(repoRoot, context.profile.runtime.review_state);
  const historyRoot = join(dirname(currentPath), 'review-states');
  if (existsSync(currentPath)) {
    try {
      const previous = readJson(currentPath);
      if (selfDigestValid(previous, 'state_digest_sha256'))
        writeJsonAtomic(join(historyRoot, `${previous.state_digest_sha256}.json`), previous);
    } catch {
      // The authenticated read boundary will reject a malformed predecessor.
    }
  }
  writeJsonAtomic(currentPath, state);
  if (selfDigestValid(state, 'state_digest_sha256'))
    writeJsonAtomic(join(historyRoot, `${state.state_digest_sha256}.json`), state);
}

function persistReviewResultV8(context, result) {
  const currentPath = join(repoRoot, context.profile.runtime.review_result);
  writeJsonAtomic(currentPath, result);
  if (selfDigestValid(result, 'result_digest_sha256'))
    writeJsonAtomic(
      join(dirname(currentPath), 'review-results', `${result.result_digest_sha256}.json`),
      result,
    );
}

function invalidTransportV5(context, state, scope, payloadDigest, findings, payloadBytes = null) {
  const priorDigest = state.current_transport_digest ?? null;
  const transport = writeAuthenticatedTransportV5(
    context,
    state,
    scope,
    payloadDigest,
    'INVALID_TRANSPORT',
    priorDigest,
    payloadBytes,
  );
  const attempts = state.transport_attempts + 1;
  let history = state.transition_history;
  let nextStateName = state.state;
  if (attempts >= 2) {
    nextStateName = 'REVIEW_TRANSPORT_BLOCKED';
    const priorTransition = history.at(-1)?.transition_digest_sha256 ?? null;
    const transitionBody = {
      from: state.state,
      to: nextStateName,
      ordinal: history.length + 1,
      cycle: state.cycle,
      candidate_sha: state.candidate_sha,
      candidate_manifest_digest: state.candidate_manifest_digest,
      review_scope_digest: state.review_scope_digest,
      review_result_digest: null,
      transport_digest: transport.transport_digest_sha256,
      repair_evidence_digest: state.repair_evidence_digest,
      previous_state_digest: state.state_digest_sha256,
      previous_transition_digest: priorTransition,
    };
    history = [...history, withSelfDigest(transitionBody, 'transition_digest_sha256')];
  }
  const { state_digest_sha256: _oldDigest, ...body } = state;
  const updatedBody = {
    ...body,
    state: nextStateName,
    transition_history: history,
    history_digest: sha256(canonical(history)),
    latest_transition_digest: history.at(-1)?.transition_digest_sha256 ?? null,
    previous_state_digest: state.state_digest_sha256,
    transport_attempts: attempts,
    transport_history_digests: [
      ...state.transport_history_digests,
      transport.transport_digest_sha256,
    ],
    current_transport_digest: transport.transport_digest_sha256,
  };
  const updatedState = withSelfDigest(updatedBody, 'state_digest_sha256');
  if (capability(context, 'invalid_transport_state_persistence'))
    persistStateV5(context, updatedState);
  else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), updatedState);
  if (attempts >= 2)
    findings.push(finding('REVIEW_TRANSPORT_BLOCKED', 'transport retry budget is exhausted'));
}

function invalidTransportV4(context, state, payloadDigest, findings) {
  const transportPath = join(repoRoot, context.profile.runtime.review_transport);
  let prior = null;
  try {
    if (existsSync(transportPath)) prior = readJson(transportPath);
  } catch {
    prior = null;
  }
  const attempt = Number(state.transport_attempts ?? 0) + 1;
  if (attempt === 2) {
    const priorFindings = [];
    const { state_digest_sha256: _stateDigest, ...currentStateBody } = state;
    const stateBeforeFirst = withSelfDigest(
      { ...currentStateBody, transport_attempts: 0 },
      'state_digest_sha256',
    ).state_digest_sha256;
    const priorValid =
      prior !== null &&
      validateDocument(
        prior,
        context.policy.schemas.review_transport,
        priorFindings,
        'REVIEW_TRANSPORT_INVALID',
        'review transport',
      ) &&
      selfDigestValid(prior, 'transport_digest_sha256') &&
      prior.attempt === 1 &&
      prior.previous_transport_digest === null &&
      prior.round === state.round &&
      prior.cycle === state.cycle &&
      prior.candidate_sha === state.candidate_sha &&
      prior.candidate_manifest_digest === state.candidate_manifest_digest &&
      prior.review_scope_digest === state.review_scope_digest &&
      prior.reviewer_binding_digest === state.reviewer_binding_digest &&
      prior.state_before_digest === stateBeforeFirst;
    if (!priorValid)
      findings.push(
        finding(
          'REVIEW_TRANSPORT_CHAIN_INVALID',
          'second transport attempt lacks one authenticated predecessor',
        ),
      );
  }
  const body = {
    schemaVersion: '1.0.0',
    round: state.round,
    cycle: state.cycle,
    attempt: Math.min(attempt, 2),
    candidate_sha: state.candidate_sha,
    candidate_manifest_digest: state.candidate_manifest_digest,
    review_scope_digest: state.review_scope_digest,
    reviewer_binding_digest: state.reviewer_binding_digest,
    payload_digest: payloadDigest,
    validation: 'INVALID_TRANSPORT',
    state_before_digest: state.state_digest_sha256,
    previous_transport_digest: prior?.transport_digest_sha256 ?? null,
  };
  const transport = withSelfDigest(body, 'transport_digest_sha256');
  writeJsonAtomic(transportPath, transport);
  if (attempt > context.profile.review_budget.transport_retries_per_cycle) {
    const { state_digest_sha256: _oldStateDigest, ...stateBody } = state;
    const authenticated = withSelfDigest(
      {
        ...stateBody,
        state: 'REVIEW_TRANSPORT_BLOCKED',
        transport_attempts: 2,
        transition_history: [
          ...state.transition_history,
          transitionV4(
            state.state,
            'REVIEW_TRANSPORT_BLOCKED',
            {
              manifest: {
                candidate_sha: state.candidate_sha,
                manifest_digest_sha256: state.candidate_manifest_digest,
              },
            },
            {
              review_scope_digest: state.review_scope_digest,
              transport_digest: transport.transport_digest_sha256,
              previous_state_digest: state.state_digest_sha256,
            },
          ),
        ],
      },
      'state_digest_sha256',
    );
    writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), authenticated);
    findings.push(finding('REVIEW_TRANSPORT_BLOCKED', 'transport retry budget is exhausted'));
  } else {
    const { state_digest_sha256: _oldStateDigest, ...stateBody } = state;
    const updated = withSelfDigest(
      { ...stateBody, transport_attempts: attempt },
      'state_digest_sha256',
    );
    writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), updated);
  }
}

function reviewCheckV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const cycle = Number(option('--cycle') ?? '1');
  const candidateExpression = option('--candidate') ?? 'HEAD';
  if (![1, 2].includes(cycle))
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate: candidateExpression,
      cycle,
      findings: [finding('REVIEW_CYCLE_BUDGET_EXHAUSTED', 'cycle 3 is forbidden')],
    });
  const candidate = resolveExactCandidateV6(candidateExpression, findings);
  if (candidate === null)
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate: candidateExpression,
      cycle,
      findings,
    });
  const context = loadV4Context(round, findings, candidate);
  if (context === null)
    return emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
  const scopePath = join(repoRoot, context.profile.runtime.review_scope);
  const scope = readJsonPrecisely(
    scopePath,
    'REVIEW_SCOPE_MANIFEST_INVALID',
    'REVIEW_SCOPE_MANIFEST_INVALID',
    findings,
  );
  if (scope !== null) {
    validateDocument(
      scope,
      context.policy.schemas.review_scope,
      findings,
      'REVIEW_SCOPE_SCHEMA_INVALID',
      'review scope',
    );
    if (!selfDigestValid(scope, 'manifest_digest_sha256'))
      findings.push(
        finding('REVIEW_SCOPE_SELF_DIGEST_INVALID', 'review scope self-digest is invalid'),
      );
  }
  const proof =
    scope === null
      ? null
      : authenticateCandidateProofV4(context, scope.exact_base, candidate, findings);
  const ledger = proof === null ? null : validateClaimsV4(context, candidate, findings);
  const binding = reviewerBindingV4(context, candidate);
  findings.push(...binding.findings);
  if (binding.diagnostic !== null) findings.push(binding.diagnostic);
  if (proof !== null && ledger !== null && scope !== null) {
    const expectedTopics = makeReviewTopicsV4(
      context,
      scope.exact_base,
      candidate,
      proof,
      ledger,
      findings,
    );
    const activeControls = [
      context.profilePath,
      'law/policy/round-close-controls.json',
      context.profile.sources.authorization,
      context.profile.sources.plan,
      context.profile.sources.orchestrator,
      ...(context.profile.sources.additional_controls ?? []),
    ];
    const activeControlsValid =
      context.policy.schemaVersion === '5.0.0'
        ? scope.active_control_census_digest === proof.activeControlCensus?.census_digest_sha256
        : scope.active_controls_digest ===
          candidateDigestForPaths(
            candidate,
            activeControls.filter((path) => candidateTreeEntries(candidate).has(path)),
          );
    if (
      canonical(scope.topics) !== canonical(expectedTopics) ||
      scope.topic_count !== expectedTopics.length ||
      scope.claims_digest !== ledger.claims_digest_sha256 ||
      proof.manifest.claims_digest !== ledger.claims_digest_sha256 ||
      scope.policy_digest !== context.digests.policy ||
      scope.profile_digest !== context.digests.profile ||
      scope.graph_digest !== context.digests.graph ||
      scope.obligations_digest !== context.digests.obligations ||
      scope.prior_findings_digest !== context.digests.priorFindings ||
      !activeControlsValid ||
      scope.impact_plan_digest !== proof.impact.execution_digest_sha256 ||
      scope.convergence_evidence_digest !== proof.convergence.convergence_digest_sha256 ||
      scope.candidate_identity_digest !== proof.identityDigest ||
      scope.current_candidate_manifest_digest !== proof.manifest.manifest_digest_sha256
    )
      findings.push(
        finding(
          'REVIEW_SCOPE_RECOMPUTATION_INVALID',
          'review scope differs from the independently regenerated exact population',
        ),
      );
  }
  const state =
    scope === null || proof === null
      ? null
      : readAuthenticatedStateV4(context, findings, {
          round,
          cycle,
          candidate,
          candidate_manifest_digest: proof.manifest.manifest_digest_sha256,
          review_scope_digest: scope.manifest_digest_sha256,
        });
  if (context.policy.schemaVersion === '5.0.0' && scope !== null && state !== null)
    validateReviewScopeIdentityV5(context, scope, round, cycle, candidate, state, findings);
  if (
    state !== null &&
    (context.policy.review_state_machine.terminal_states ?? []).includes(state.state)
  ) {
    findings.push(finding('REVIEW_STATE_TERMINAL', 'terminal review state has no successor'));
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate,
      cycle,
      state: state.state,
      findings,
    });
  }
  if (findings.length > 0 || state === null || proof === null)
    return emit({ ok: false, command: 'review-check', round, candidate, cycle, findings });
  const transportFindings = [];
  const resultPath = resolve(repoRoot, option('--review-result') ?? '');
  const result = parseReviewResultV4(resultPath, transportFindings);
  if (result === null) {
    if (context.policy.schemaVersion === '5.0.0')
      invalidTransportV5(
        context,
        state,
        scope,
        existsSync(resultPath) ? sha256(readFileSync(resultPath)) : sha256('MISSING\n'),
        findings,
        existsSync(resultPath) ? readFileSync(resultPath) : Buffer.from('MISSING\n'),
      );
    else
      invalidTransportV4(
        context,
        state,
        existsSync(resultPath) ? sha256(readFileSync(resultPath)) : sha256('MISSING\n'),
        findings,
      );
    findings.push(...transportFindings);
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate,
      cycle,
      state: findings.some(({ code }) => code === 'REVIEW_TRANSPORT_BLOCKED')
        ? 'REVIEW_TRANSPORT_BLOCKED'
        : state.state,
      findings,
    });
  }
  const duplicateIds = [];
  const seenFindingIds = new Set();
  for (const entry of result.findings ?? []) {
    if (seenFindingIds.has(entry.finding_id)) duplicateIds.push(entry.finding_id);
    seenFindingIds.add(entry.finding_id);
  }
  if (duplicateIds.length > 0)
    findings.push(
      finding('REVIEW_FINDING_ID_DUPLICATE', 'finding identifiers must be globally unique', {
        finding_ids: duplicateIds,
      }),
    );
  validateDocument(
    result,
    context.policy.schemas.review_result,
    findings,
    'REVIEW_RESULT_INVALID',
    'review result',
  );
  if (!selfDigestValid(result, 'result_digest_sha256'))
    findings.push(
      finding('REVIEW_RESULT_SELF_DIGEST_INVALID', 'review result self-digest is invalid'),
    );
  if (
    result.round !== round ||
    result.cycle !== cycle ||
    result.review_candidate !== candidate ||
    result.manifest_digest !== scope.manifest_digest_sha256 ||
    result.policy_digest !== context.digests.policy ||
    result.candidate_manifest_digest !== proof.manifest.manifest_digest_sha256 ||
    result.reviewer_binding_digest !== binding.selected?.digest ||
    (context.policy.schemaVersion === '5.0.0' &&
      (result.scope_identity_digest !== scope.identity_proof.identity_digest_sha256 ||
        result.active_control_census_digest !== proof.activeControlCensus?.census_digest_sha256 ||
        result.state_before_digest !== state.state_digest_sha256))
  )
    findings.push(
      finding('REVIEW_RESULT_IDENTITY_INVALID', 'review result does not bind exact artifacts'),
    );
  const topicMap = new Map(scope.topics.map((topic) => [topic.topic_id, topic]));
  const seenTopics = new Set();
  for (const disposition of result.dispositions ?? []) {
    if (seenTopics.has(disposition.topic_id))
      findings.push(
        finding('REVIEW_TOPIC_DUPLICATED', 'topic disposition is duplicated', {
          topic_id: disposition.topic_id,
        }),
      );
    seenTopics.add(disposition.topic_id);
    const topic = topicMap.get(disposition.topic_id);
    if (topic === undefined) {
      findings.push(finding('REVIEW_TOPIC_UNKNOWN', 'unknown review topic'));
      continue;
    }
    if (!topic.allowed_dispositions.includes(disposition.disposition))
      findings.push(finding('REVIEW_TOPIC_DISPOSITION_INVALID', 'topic disposition is forbidden'));
    if (disposition.recomputed_digest !== topic.current_digest)
      findings.push(
        finding('REVIEW_TOPIC_DIGEST_INVALID', 'topic digest differs from current scope'),
      );
    if (context.policy.schemaVersion === '5.0.0')
      authenticateDispositionProofV5(context, topic, disposition, proof, findings);
    else if (disposition.disposition === 'REUSED_FRESH_PASS')
      validateReuseV4(context, topic, disposition, proof, findings);
  }
  for (const topicId of topicMap.keys())
    if (!seenTopics.has(topicId))
      findings.push(
        finding('REVIEW_TOPIC_OMITTED', 'mandatory topic is omitted', { topic_id: topicId }),
      );
  const resultFindingMap = new Map(
    (result.findings ?? []).map((entry) => [entry.finding_id, entry]),
  );
  for (const disposition of result.dispositions ?? [])
    for (const id of disposition.finding_ids ?? [])
      if (!(resultFindingMap.get(id)?.topic_ids ?? []).includes(disposition.topic_id))
        findings.push(finding('REVIEW_FINDING_LINK_INVALID', 'finding link is not reciprocal'));
  for (const entry of result.findings ?? [])
    for (const topicId of entry.topic_ids ?? []) {
      const disposition = (result.dispositions ?? []).find(({ topic_id }) => topic_id === topicId);
      if (disposition === undefined || !(disposition.finding_ids ?? []).includes(entry.finding_id))
        findings.push(
          finding('REVIEW_FINDING_LINK_INVALID', 'finding topic link is not reciprocal'),
        );
    }
  const counts = Object.fromEntries(
    ['RECHECKED_PASS', 'RECHECKED_FAIL', 'REUSED_FRESH_PASS', 'BLOCKED'].map((name) => [
      name,
      (result.dispositions ?? []).filter(({ disposition }) => disposition === name).length,
    ]),
  );
  if (
    result.terminal?.topic_count !== topicMap.size ||
    result.terminal?.finding_count !== (result.findings ?? []).length ||
    canonical(result.terminal?.disposition_counts) !== canonical(counts) ||
    result.terminal?.complete !== true
  )
    findings.push(
      finding('REVIEW_TERMINAL_INVALID', 'terminal counts do not match complete result'),
    );
  const hasNonPassing = (result.dispositions ?? []).some(({ disposition }) =>
    ['RECHECKED_FAIL', 'BLOCKED'].includes(disposition),
  );
  const hasHighRisk = (result.findings ?? []).some(({ severity }) =>
    ['P0', 'P1'].includes(severity),
  );
  if (result.terminal?.verdict === 'PASS' && hasNonPassing)
    findings.push(finding('REVIEW_TOPIC_NOT_PASSING', 'PASS contains a failed or blocked topic'));
  if (
    result.terminal?.verdict === 'PASS' &&
    (hasNonPassing || hasHighRisk || (result.findings ?? []).length > 0)
  )
    findings.push(
      finding('REVIEW_PASS_INVALID', 'PASS contains failed, blocked, or unresolved findings'),
    );
  const structuralFailure = findings.length > 0;
  if (structuralFailure) {
    if (context.policy.schemaVersion === '5.0.0')
      invalidTransportV5(
        context,
        state,
        scope,
        sha256(readFileSync(resultPath)),
        findings,
        readFileSync(resultPath),
      );
    else invalidTransportV4(context, state, sha256(readFileSync(resultPath)), findings);
    return emit({
      ok: false,
      command: 'review-check',
      round,
      candidate,
      cycle,
      state: findings.some(({ code }) => code === 'REVIEW_TRANSPORT_BLOCKED')
        ? 'REVIEW_TRANSPORT_BLOCKED'
        : state.state,
      findings,
    });
  }
  const validTransport =
    context.policy.schemaVersion === '5.0.0'
      ? writeAuthenticatedTransportV5(
          context,
          state,
          scope,
          sha256(readFileSync(resultPath)),
          'VALID',
          state.current_transport_digest ?? null,
          readFileSync(resultPath),
        )
      : null;
  if (context.policy.schemaVersion === '5.0.0' && capability(context, 'review_result_persistence'))
    persistReviewResultV8(context, result);
  else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_result), result);
  const verdict = result.terminal.verdict;
  const next =
    verdict === 'PASS' ? 'PASS' : cycle === 1 ? 'REPAIR_REQUIRED' : 'ESCALATION_REQUIRED';
  const transition = transitionV4(state.state, next, proof, {
    review_scope_digest: scope.manifest_digest_sha256,
    review_result_digest: result.result_digest_sha256,
    transport_digest: validTransport?.transport_digest_sha256 ?? null,
    previous_state_digest: state.state_digest_sha256,
  });
  const nextState = makeReviewStateV4(
    context,
    proof,
    scope.manifest_digest_sha256,
    next,
    cycle,
    [...state.transition_history, transition],
    {
      previous_state_digest: state.state_digest_sha256,
      transport_attempts:
        context.policy.schemaVersion === '5.0.0'
          ? state.transport_attempts + 1
          : state.transport_attempts,
      transport_history_digests:
        context.policy.schemaVersion === '5.0.0'
          ? [...state.transport_history_digests, validTransport.transport_digest_sha256]
          : undefined,
      current_transport_digest: validTransport?.transport_digest_sha256 ?? null,
      current_review_result_digest: result.result_digest_sha256,
      ...(next === 'REPAIR_REQUIRED'
        ? {
            prior_failure_result_digest: result.result_digest_sha256,
            prior_failure_state_digest: state.state_digest_sha256,
            prior_failure_transport_digest: validTransport?.transport_digest_sha256 ?? null,
            previous_candidate_sha: null,
            repair_evidence_digest: null,
          }
        : {}),
    },
  );
  if (context.policy.schemaVersion === '5.0.0' && capability(context, 'next_state_persistence'))
    persistStateV5(context, nextState);
  else writeJsonAtomic(join(repoRoot, context.profile.runtime.review_state), nextState);
  emit({
    ok: next === 'PASS',
    command: 'review-check',
    round,
    candidate,
    cycle,
    state: next,
    findings:
      next === 'PASS'
        ? []
        : [finding('REVIEW_TOPIC_NOT_PASSING', 'valid exhaustive review reported findings')],
  });
}

function statusV4() {
  const findings = [];
  const round = option('--round') ?? '';
  const exactCandidate = resolveConsumerCandidateV8(round, findings);
  const context = loadV4Context(round, findings, exactCandidate);
  const binding = context === null ? null : reviewerBindingV4(context, exactCandidate ?? 'INVALID');
  if (binding !== null) {
    findings.push(...binding.findings);
    if (binding.diagnostic !== null && binding.profileBound) findings.push(binding.diagnostic);
  }
  let state = 'DRAFT';
  let used = 0;
  let attempts = 0;
  if (context !== null && existsSync(join(repoRoot, context.profile.runtime.review_state))) {
    const stateFindings = [];
    const stored = readAuthenticatedStateV4(context, stateFindings, null);
    if (stored !== null) {
      state = stored.state;
      used = stored.cycle;
      attempts = stored.transport_attempts;
    }
    findings.push(...stateFindings);
  }
  emit({
    ok: findings.length === 0,
    command: 'status',
    round,
    state,
    substantive_cycles: { used, maximum: context?.profile.review_budget.substantive_cycles ?? 2 },
    transport_retries_per_cycle: {
      used: attempts,
      maximum: context?.profile.review_budget.transport_retries_per_cycle ?? 1,
    },
    entry_ready: entryReadinessV9(context, binding ?? null, findings).entry_ready,
    diagnostics:
      binding?.diagnostic !== null && binding?.profileBound === false ? [binding.diagnostic] : [],
    findings,
  });
}

/**
 * Every authoritative v4/v5 consumer reachable from the dispatch switch. Each loads
 * policy, profile, schemas, mandates, graph, obligations, claims or linked authority,
 * so each must bind one literal candidate before any worktree byte is read.
 */
const AUTHORITATIVE_CONSUMERS = new Set([
  'policy-check',
  'entry-check',
  'status',
  'impact-plan',
  'smart-converge',
  'review-scope',
  'review-check',
  'claims-check',
  'claims-materialize',
  'claim-produce',
  'review-topic-count',
  'materialize',
  'materializations-check',
  'manifest',
  'envelope',
  'rehearse',
]);

/**
 * The self-binding attestation gate takes no candidate. It derives one from the
 * checked-out commit and proves the working tree matches that commit's tree, so a
 * mutable byte fails it closed rather than selecting its own authority.
 */
const SELF_BINDING_COMMANDS = new Set(['control-attestation']);

let livePolicy = null;
let bootstrapFindings = [];
try {
  // smart-converge names its candidate with --head; every other consumer uses
  // --candidate. Neither accepts an omitted, symbolic, abbreviated or ambiguous form.
  const suppliedCandidate =
    command === 'smart-converge'
      ? (option('--head') ?? option('--candidate') ?? '')
      : (option('--candidate') ?? '');
  if (AUTHORITATIVE_CONSUMERS.has(command)) {
    const resolved =
      SHA40.test(suppliedCandidate) &&
      gitResult(repoRoot, ['cat-file', '-e', `${suppliedCandidate}^{commit}`]).status === 0
        ? suppliedCandidate
        : null;
    if (resolved === null)
      bootstrapFindings.push(
        finding(
          'REVIEWER_BINDING_CANDIDATE_REQUIRED',
          'authoritative consumers require one literal 40-hex candidate commit before dispatch',
          { command, revision: suppliedCandidate },
        ),
      );
    else {
      candidateBoundRevision = resolved;
      candidateBoundPolicy = JSON.parse(
        candidateFile(repoRoot, resolved, 'law/policy/round-close-controls.json'),
      );
      livePolicy = candidateBoundPolicy;
    }
  } else if (SELF_BINDING_COMMANDS.has(command)) {
    const head = git(repoRoot, ['rev-parse', 'HEAD']);
    if (!SHA40.test(head) || cleanStatus(repoRoot) !== '')
      bootstrapFindings.push(
        finding(
          'REVIEWER_BINDING_CANDIDATE_REQUIRED',
          'self-binding attestation requires a clean tree at one literal commit',
          { command, revision: head },
        ),
      );
    else {
      candidateBoundRevision = head;
      candidateBoundPolicy = JSON.parse(
        candidateFile(repoRoot, head, 'law/policy/round-close-controls.json'),
      );
      livePolicy = candidateBoundPolicy;
    }
  } else livePolicy = readJson(policyPath);
} catch (error) {
  bootstrapFindings.push(
    finding('REVIEWER_BINDING_CANDIDATE_REQUIRED', 'candidate authority could not be loaded', {
      command,
      detail: String(error),
    }),
  );
}
if (bootstrapFindings.length > 0) {
  emit({ ok: false, command: command || 'missing', findings: bootstrapFindings });
  process.exit(process.exitCode ?? 1);
}
const genericV3 = livePolicy?.schemaVersion === '3.0.0';
const genericV4 = livePolicy?.schemaVersion === '4.0.0';
const genericV5 = livePolicy?.schemaVersion === '5.0.0';

/**
 * No authoritative consumer may terminate without emitting a structured result. An
 * uncaught throw gives a caller silence, which is indistinguishable from finding
 * nothing wrong; a blocking finding is a refusal a caller can act on.
 */
try {
  switch (
    genericV5
      ? `v4:${command}`
      : genericV4
        ? `v4:${command}`
        : genericV3
          ? `v3:${command}`
          : command
  ) {
    case 'v4:policy-check':
      policyCheckV4();
      break;
    case 'v4:materialize':
      materializeV4();
      break;
    case 'v4:materializations-check':
      materializationsCheckV8();
      break;
    case 'v4:control-attestation':
      controlAttestationV9();
      break;
    case 'v4:entry-check':
      entryCheckV4();
      break;
    case 'v4:impact-plan':
      impactPlanV3();
      break;
    case 'v4:smart-converge':
      smartConvergeV3();
      break;
    case 'v4:review-topic-count':
      reviewTopicCountV4();
      break;
    case 'v4:claim-produce':
      claimProduceV4();
      break;
    case 'v4:claims-check':
      claimsCheckV4();
      break;
    case 'v4:claims-materialize':
      claimsMaterializeV4();
      break;
    case 'v4:review-scope':
      reviewScopeV4();
      break;
    case 'v4:review-check':
      reviewCheckV4();
      break;
    case 'v4:status':
      statusV4();
      break;
    case 'v4:manifest':
      manifest();
      break;
    case 'v4:envelope':
      envelope();
      break;
    case 'v4:rehearse':
      rehearse();
      break;
    case 'v3:policy-check':
      policyCheckV3();
      break;
    case 'v3:materialize':
      materializeV3();
      break;
    case 'v3:materializations-check':
      materializationsCheckV8();
      break;
    case 'v3:control-attestation':
      controlAttestationV9();
      break;
    case 'v3:entry-check':
      entryCheckV3();
      break;
    case 'v3:impact-plan':
      impactPlanV3();
      break;
    case 'v3:smart-converge':
      smartConvergeV3();
      break;
    case 'v3:claims-check':
      claimsCheckV3();
      break;
    case 'v3:review-scope':
      reviewScopeV3();
      break;
    case 'v3:review-check':
      reviewCheckV3();
      break;
    case 'v3:status':
      statusV3();
      break;
    case 'v3:manifest':
      manifest();
      break;
    case 'v3:envelope':
      envelope();
      break;
    case 'v3:rehearse':
      rehearse();
      break;
    case 'policy-check':
      policyCheck();
      break;
    case 'materialize':
      materialize();
      break;
    case 'materializations-check':
      materializationsCheckV8();
      break;
    case 'control-attestation':
      controlAttestationV9();
      break;
    case 'manifest':
      manifest();
      break;
    case 'converge':
      converge();
      break;
    case 'smart-converge':
      smartConverge();
      break;
    case 'review-scope':
      reviewScopeManifest();
      break;
    case 'review-check':
      reviewCheck();
      break;
    case 'envelope':
      envelope();
      break;
    case 'rehearse':
      rehearse();
      break;
    default:
      emit({
        ok: false,
        command: command || 'missing',
        findings: [
          finding(
            'COMMAND_INVALID',
            'expected policy-check, materialize, manifest, converge, smart-converge, review-scope, review-check, envelope, or rehearse',
          ),
        ],
      });
  }
} catch (error) {
  emit({
    ok: false,
    command: command || 'missing',
    findings: [
      finding(
        'CONSUMER_TERMINATED_WITHOUT_RESULT',
        'command terminated before emitting a structured result',
        { command, detail: String(error) },
      ),
    ],
  });
}
