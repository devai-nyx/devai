#!/usr/bin/env node
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  candidateTreeIdentityEntriesV7,
  claimProduceV4,
  claimsCheckV3,
  claimsCheckV4,
  claimsMaterializeV4,
  controlAttestationV9,
  entryCheckV4,
  materializationsCheckV8,
  materializeV4,
  policyCheckV4,
  reviewCheckV3,
  reviewScopeV3,
  reviewTopicCountV4,
  statusV3,
} from './governed.mjs';
import {
  entryCheckV3,
  expandBraceSelectors,
  impactPlanV3,
  materializeV3,
  policyCheckV3,
  smartConvergeV3,
  v3OutputState,
} from './impact.mjs';
import {
  converge,
  envelope,
  manifest,
  materialize,
  policyCheck,
  rehearse,
  reviewCheck,
  reviewScopeManifest,
  smartConverge,
} from './legacy.mjs';
import { reviewCheckV4, reviewScopeV4, statusV4 } from './review-lifecycle.mjs';

export const CONTROL_CONCERN = 'runtime';

export const CONTROL_ENTRYPOINT = join(
  'scripts',
  ['run', 'round', 'close', 'controls.mjs'].join('-'),
);

export const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const SHA40 = /^[0-9a-f]{40}$/u;

export const SHA256 = /^[0-9a-f]{64}$/u;

export const WORKTREE_REVISION = 'WORKTREE';

export const NORMALIZED_RUNTIME_ARTIFACTS = [
  'scratch/coverage/t1-t3/coverage-final.json',
  'scratch/coverage/t1-t3/subprocess-v8/**',
];

export const AUDIT_CLAIM_IMPLEMENTATION_PATHS = [
  'scripts/round-close-controls/runtime.mjs',
  'scripts/round-close-controls/legacy.mjs',
  'scripts/round-close-controls/impact.mjs',
  'scripts/round-close-controls/governed.mjs',
  'scripts/round-close-controls/review-lifecycle.mjs',
  '.devai/config/round-close-controls.json',
];

export const command = process.argv[2] ?? '';

export const repoRoot = resolve(option('--repo-root') ?? SCRIPT_ROOT);

export const jsonMode = process.argv.includes('--json');

export const policyPath = join(repoRoot, 'law/policy/round-close-controls.json');

export const mirrorPath = join(repoRoot, '.devai/config/round-close-controls.json');

export let candidateBoundRevision = null;

export let candidateBoundPolicy = null;

export const toolchainProbeResultCache = new Map();

export const rawCandidateManifestCache = new Map();

export const candidateBlobDigestCache = new Map();

export const treeEntryCache = new Map();

export const treeIdentityEntryCache = new Map();

/**
 * Every authoritative v4/v5 consumer reachable from the dispatch switch. Each loads
 * policy, profile, schemas, mandates, graph, obligations, claims or linked authority,
 * so each must bind one literal candidate before any worktree byte is read.
 */
export const AUTHORITATIVE_CONSUMERS = new Set([
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
export const SELF_BINDING_COMMANDS = new Set(['control-attestation']);

export let livePolicy = null;

export let bootstrapFindings = [];

export function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function stable(value) {
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

export function canonical(value) {
  return `${JSON.stringify(stable(value))}\n`;
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function run(program, args, options = {}) {
  return spawnSync(program, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    input: options.input,
    env: { ...process.env, ...options.env },
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function gitResult(root, args, options = {}) {
  return run('git', args, { ...options, cwd: root });
}

export function git(root, args, options = {}) {
  const result = gitResult(root, args, options);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

export function gitBytes(root, args) {
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

export function finding(code, message, extra = {}) {
  return { code, message, ...extra };
}

export function emit(result) {
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

export function loadPolicy(findings) {
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
/**
 * Per DII-253 the edge-to-cycle rule is declared in law, never duplicated in control
 * source. Two sites previously encoded it with different literal sets that happened to
 * agree; nothing kept them agreeing, and a literal that duplicates its own declaration is
 * a defect whether or not the two currently match.
 */
export function edgeCycleV7(policy, from, to) {
  const declared = policy?.review_state_machine?.cycle_two_states;
  if (!Array.isArray(declared)) return 1;
  const cycleTwo = new Set(declared);
  return cycleTwo.has(from) || cycleTwo.has(to) ? 2 : 1;
}

/**
 * The exact edge sequence a cycle emits, read from law. review-scope used to hold this
 * list inline, so the declaration could say one thing while the controller did another.
 */
export function emittedSequenceV7(policy, cycle) {
  const declared = policy?.review_state_machine?.emitted_transition_sequences?.[`cycle-${cycle}`];
  return Array.isArray(declared) ? declared : null;
}

export function capability(context, name) {
  const declared = context?.policy?.control_capabilities ?? context?.control_capabilities ?? null;
  if (declared === null || typeof declared !== 'object') return false;
  return declared[name] === true;
}

export function globExpression(glob) {
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

export function matches(path, glob) {
  return globExpression(glob).test(path);
}

export function trackedPaths(root, revision = 'HEAD') {
  if (revision === WORKTREE_REVISION) {
    return git(root, ['ls-files']).split('\n').filter(Boolean).sort();
  }
  return git(root, ['ls-tree', '-r', '--name-only', revision]).split('\n').filter(Boolean).sort();
}

export function candidateFile(root, revision, path) {
  if (revision === WORKTREE_REVISION) return readFileSync(join(root, path), 'utf8');
  return gitBytes(root, ['show', `${revision}:${path}`]).toString('utf8');
}

export function pathsForGlobs(root, revision, globs) {
  return trackedPaths(root, revision).filter((path) => globs.some((glob) => matches(path, glob)));
}

export function digestPaths(root, revision, globs) {
  const entries = pathsForGlobs(root, revision, globs).map((path) => ({
    path,
    digest: sha256(candidateFile(root, revision, path)),
  }));
  return sha256(canonical(entries));
}

export function cleanStatus(root) {
  return git(root, ['status', '--porcelain', '--untracked-files=all']);
}

export function workspaceSnapshot(root, normalizedRuntimeArtifacts) {
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

export function coverageDigest(root) {
  const path = join(root, 'scratch/coverage/t1-t3/coverage-summary.json');
  return existsSync(path) ? sha256(readFileSync(path)) : null;
}

export function stateDirectory(root, round) {
  return join(root, '.devai/state/round-runs', round, 'close');
}

export function writeState(root, round, name, value) {
  const directory = stateDirectory(root, round);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

export function readState(root, round, name) {
  const path = join(stateDirectory(root, round), name);
  if (!existsSync(path)) return { status: 'missing', value: null };
  try {
    return { status: 'valid', value: readJson(path) };
  } catch (error) {
    return { status: 'malformed', value: null, error: String(error) };
  }
}

export function configuredStatePath(template, round) {
  return String(template ?? '').replaceAll('{round}', round);
}

export function nulPaths(result) {
  return String(result.stdout ?? '')
    .split('\0')
    .filter(Boolean);
}

export function worktreeInputEntries(root, globs) {
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

export function filesystemPaths(root, includeState = false) {
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

export function outputEntries(root, specs) {
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

export function toolchainFingerprint(policy, findings) {
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

export function environmentFingerprint(policy) {
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

export function toolchainManifestV5(policy, probeIds, findings) {
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

export function completeEnvironmentManifestV6() {
  const entries = Object.keys(process.env)
    .sort()
    .map((name) => ({ name, digest: sha256(process.env[name] ?? '') }));
  return {
    name: '__ALL_ENVIRONMENT__',
    mode: 'complete-environment-sha256',
    digest: sha256(canonical(entries)),
  };
}

export function environmentManifestV5(policy, inputIds, findings) {
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
export function executableProgramsV7(command, programs) {
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

export function deriveGateCommandClosureV7(context, gate) {
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

export function validateGateCommandClosureV6(context, findings) {
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

export function observedPersistentOutputsV6(root, declaredSelectors) {
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

export function rawCandidateInputManifest(revision, selectors) {
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

export function gateFreshnessProfileV5(context, gate, findings) {
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

export function freshnessCachePath(policy, round, taskId) {
  const root = configuredStatePath(policy?.freshness?.state_root, round);
  const safe = taskId.replaceAll(/[^a-zA-Z0-9._-]/gu, '_');
  return join(repoRoot, root, 'tasks', `${safe}.json`);
}

export function freshnessRecordDigest(record) {
  const { result_digest: _ignored, ...body } = record;
  return sha256(canonical(body));
}

export function readFreshnessCache(path, schemaPath) {
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

export function writeFreshnessCache(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canonical(value));
}

export function taskInputGlobs(policy, task) {
  const sets = policy?.freshness?.input_sets ?? {};
  return [
    ...new Set(
      (task.input_sets ?? []).flatMap((set) => (Array.isArray(sets[set]) ? sets[set] : [])),
    ),
  ].sort();
}

export function remoteEnvironment(policy) {
  return (policy?.freshness?.remote_environment_indicators ?? []).some((name) => {
    const value = String(process.env[name] ?? '').toLowerCase();
    return value !== '' && value !== '0' && value !== 'false';
  });
}

export function blockedResults(policy) {
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

export function semanticCodeShape(source) {
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

export function containsJsonKey(value, key) {
  if (Array.isArray(value)) return value.some((entry) => containsJsonKey(entry, key));
  if (value !== null && typeof value === 'object') {
    return (
      Object.hasOwn(value, key) || Object.values(value).some((entry) => containsJsonKey(entry, key))
    );
  }
  return false;
}

export function semanticContentFindings(root, revision, paths) {
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

export function priorReviewPaths(reviewPolicy, root, revision) {
  return [
    ...new Set([
      ...(reviewPolicy?.prior_reviews ?? []),
      ...pathsForGlobs(root, revision, reviewPolicy?.prior_review_globs ?? []),
    ]),
  ].sort();
}

export function markedJson(source, markers) {
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

export function expectedAuditCurrentClaims(policy, root, revision) {
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

export function auditCurrentClaimFindings(policy, root, revision) {
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

export function runRoundCloseControls() {
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
}
