#!/usr/bin/env node
// DII-254 / OM-019: resolve every governed round through one fail-closed,
// policy-owned artifact identity. This checker intentionally reads working-tree bytes,
// including untracked files, because an untracked conflicting artifact must not hide from
// local governance or doctor.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

const moduleUrl = new URL(import.meta.url);
const importedRepoRoot = moduleUrl.searchParams.get('repoRoot');
const repoRoot = resolve(importedRepoRoot ?? option('--repo-root') ?? process.cwd());
moduleUrl.search = '';
const directInvocation =
  process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(moduleUrl));
const jsonOutput = process.argv.includes('--json');
const policyRelative = 'law/policy/round-artifact-uniqueness.json';
const findings = [];

function normalized(path) {
  return path.replaceAll(sep, '/').replace(/^\.\//u, '');
}

function contained(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || isAbsolute(relativePath))
    return false;
  const absolute = resolve(repoRoot, relativePath);
  const fromRoot = relative(repoRoot, absolute);
  return fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`) && !isAbsolute(fromRoot);
}

function add(code, round, artifact, message, details = {}) {
  findings.push({ code, round, artifact, message, ...details });
}

function readJson(relativePath, round, artifact) {
  const absolute = join(repoRoot, relativePath);
  if (!existsSync(absolute)) {
    add('ROUND_ARTIFACT_MISSING', round, artifact, `${round}: required ${artifact} is missing`, {
      paths: [relativePath],
    });
    return null;
  }
  try {
    return JSON.parse(readFileSync(absolute, 'utf8'));
  } catch (error) {
    add(
      'ROUND_ARTIFACT_MALFORMED',
      round,
      artifact,
      `${round}: ${artifact} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { paths: [relativePath] },
    );
    return null;
  }
}

function filesBelow(relativeRoot) {
  const absoluteRoot = join(repoRoot, relativeRoot);
  if (!existsSync(absoluteRoot)) return [];
  const files = [];
  const visit = (absolute) => {
    for (const name of readdirSync(absolute).sort()) {
      const child = join(absolute, name);
      const stat = statSync(child);
      if (stat.isDirectory()) visit(child);
      else if (stat.isFile()) files.push(normalized(relative(repoRoot, child)));
    }
  };
  visit(absoluteRoot);
  return files;
}

function fencedJsonObjects(text) {
  const values = [];
  for (const match of text.matchAll(/```json\s*\n([\s\S]*?)\n```/gu)) {
    try {
      values.push(JSON.parse(match[1]));
    } catch {
      // A malformed fence cannot become a complete binding. Other repository controls own
      // general mandate syntax; this gate treats it as non-authoritative.
    }
  }
  return values;
}

function completeBinding(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.schemaVersion === '2.0.0' &&
    value.devai_reviewer_binding === true &&
    typeof value.mandate_id === 'string' &&
    value.mandate_status === 'active' &&
    typeof value.round === 'string' &&
    typeof value.model_selector === 'string' &&
    value.role === 'independent-read-only' &&
    value.semantic_census === 'complete' &&
    Number.isInteger(value.substantive_cycles) &&
    Number.isInteger(value.transport_retries) &&
    value.fallback === 'forbidden'
  );
}

function activeBindings() {
  const root = 'product/owner-mandates';
  const bindings = [];
  for (const path of filesBelow(root).filter((path) => path.endsWith('.md'))) {
    for (const value of fencedJsonObjects(readFileSync(join(repoRoot, path), 'utf8'))) {
      if (completeBinding(value)) bindings.push({ ...value, path });
    }
  }
  return bindings;
}

let policy = null;
try {
  policy = JSON.parse(readFileSync(join(repoRoot, policyRelative), 'utf8'));
} catch (error) {
  add(
    'ROUND_ARTIFACT_POLICY_INVALID',
    'GLOBAL',
    'policy',
    `round artifact uniqueness policy is missing or malformed: ${error instanceof Error ? error.message : String(error)}`,
    { paths: [policyRelative] },
  );
}

if (
  policy === null ||
  typeof policy !== 'object' ||
  policy.schemaVersion !== '1.0.0' ||
  policy.policy_id !== 'round-artifact-uniqueness' ||
  typeof policy.canonical_root !== 'string' ||
  !Array.isArray(policy.non_runtime_roots) ||
  !Array.isArray(policy.rounds)
) {
  if (findings.length === 0)
    add(
      'ROUND_ARTIFACT_POLICY_INVALID',
      'GLOBAL',
      'policy',
      'round artifact uniqueness policy has an unsupported or incomplete shape',
      { paths: [policyRelative] },
    );
} else {
  const roundPattern = new RegExp(policy.round_pattern ?? '^R-[0-9]{4}$', 'u');
  const roundGroups = new Map();
  const directoryGroups = new Map();
  for (const entry of policy.rounds) {
    const round = typeof entry?.round === 'string' ? entry.round : 'UNKNOWN';
    const directory = typeof entry?.canonical_dir === 'string' ? entry.canonical_dir : 'UNKNOWN';
    const rounds = roundGroups.get(round) ?? [];
    rounds.push(entry);
    roundGroups.set(round, rounds);
    const directories = directoryGroups.get(directory) ?? [];
    directories.push(round);
    directoryGroups.set(directory, directories);
    if (!roundPattern.test(round))
      add('ROUND_ARTIFACT_ROUND_INVALID', round, 'round', `${round}: round identity is invalid`);
  }

  for (const [round, entries] of roundGroups)
    if (entries.length !== 1)
      add(
        'ROUND_ARTIFACT_DUPLICATE_ROUND',
        round,
        'round',
        `${round}: duplicate round registry entries (${String(entries.length)})`,
        { identities: entries.map((entry) => entry.canonical_dir ?? 'UNKNOWN') },
      );
  for (const [directory, rounds] of directoryGroups)
    if (rounds.length !== 1)
      add(
        'ROUND_ARTIFACT_DUPLICATE_DIRECTORY',
        rounds.join(','),
        'canonical_dir',
        `canonical_dir ${directory} is shared by ${rounds.join(', ')}`,
        { paths: [directory], identities: rounds },
      );

  const bindings = activeBindings();
  const runtimeRoots = new Map();
  for (const entry of policy.rounds) {
    const round = entry?.round;
    const directory = entry?.canonical_dir;
    const requirements = entry?.requirements;
    if (typeof round !== 'string' || typeof directory !== 'string' || requirements === null)
      continue;
    const expectedDirectory = `${policy.canonical_root}/${round}`;
    if (!contained(directory) || normalized(directory) !== expectedDirectory)
      add(
        'ROUND_ARTIFACT_CANONICAL_DIRECTORY_MISMATCH',
        round,
        'canonical_dir',
        `${round}: canonical_dir ${directory} does not equal ${expectedDirectory}`,
        { paths: [directory, expectedDirectory] },
      );

    const exact = {
      plan: `${directory}/plan.md`,
      authorization: `${directory}/AUTHORIZATION.md`,
      profile: `${directory}/close-control-profile.json`,
    };
    for (const artifact of ['plan', 'authorization', 'profile']) {
      const required = requirements?.[artifact] === true;
      const present = contained(exact[artifact]) && existsSync(join(repoRoot, exact[artifact]));
      if (required && !present)
        add(
          'ROUND_ARTIFACT_MISSING',
          round,
          artifact,
          `${round}: required ${artifact} is missing`,
          { paths: [exact[artifact]] },
        );
      if (!required && present)
        add(
          'ROUND_ARTIFACT_FORBIDDEN',
          round,
          artifact,
          `${round}: forbidden ${artifact} exists in state ${String(entry.state)}`,
          { paths: [exact[artifact]] },
        );
    }

    if (requirements?.profile !== true || !existsSync(join(repoRoot, exact.profile))) continue;
    const profile = readJson(exact.profile, round, 'profile');
    if (profile === null) continue;
    if (profile.round !== round)
      add(
        'ROUND_ARTIFACT_PROFILE_ROUND_MISMATCH',
        round,
        'profile',
        `${round}: profile declares ${String(profile.round)}`,
        { paths: [exact.profile], identities: [round, String(profile.round)] },
      );
    for (const artifact of ['plan', 'authorization']) {
      const selected = profile.sources?.[artifact];
      if (selected !== exact[artifact])
        add(
          'ROUND_ARTIFACT_SOURCE_MISMATCH',
          round,
          artifact,
          `${round}: profile ${artifact} source ${String(selected)} does not equal ${exact[artifact]}`,
          { paths: [String(selected), exact[artifact]] },
        );
    }

    if (requirements?.runtime_root === true) {
      const stateRoot = profile.runtime?.state_root;
      const expectedPrefix = `.devai/state/round-runs/${round}/`;
      if (
        typeof stateRoot !== 'string' ||
        !contained(stateRoot) ||
        !normalized(stateRoot).startsWith(expectedPrefix)
      )
        add(
          'ROUND_ARTIFACT_RUNTIME_ROOT_INVALID',
          round,
          'runtime_root',
          `${round}: runtime_root ${String(stateRoot)} escapes or is outside ${expectedPrefix}`,
          { paths: [String(stateRoot)] },
        );
      else {
        const normalizedRoot = normalized(stateRoot).replace(/\/+$/u, '');
        const owners = runtimeRoots.get(normalizedRoot) ?? [];
        owners.push(round);
        runtimeRoots.set(normalizedRoot, owners);
      }
    }

    if (requirements?.reviewer === true) {
      const candidates = bindings.filter((binding) => binding.round === round);
      const identities = candidates.map((binding) => `${binding.mandate_id}@${binding.path}`);
      if (candidates.length !== 1) {
        add(
          candidates.length === 0
            ? 'ROUND_ARTIFACT_REVIEWER_MISSING'
            : 'ROUND_ARTIFACT_REVIEWER_AMBIGUOUS',
          round,
          'reviewer',
          `${round}: reviewer binding requires exactly one active complete identity; found ${String(candidates.length)} (expected ${String(profile.reviewer?.mandate_id)})${identities.length > 0 ? `: ${identities.join(', ')}` : ''}`,
          { identities },
        );
      } else {
        const binding = candidates[0];
        const expected = profile.reviewer ?? {};
        const mismatches = [
          ['mandate_id', expected.mandate_id, binding.mandate_id],
          ['model_selector', expected.model_selector, binding.model_selector],
          ['role', expected.role, binding.role],
          ['fallback', expected.fallback, binding.fallback],
        ].filter(([, left, right]) => left !== right);
        if (mismatches.length > 0)
          add(
            'ROUND_ARTIFACT_REVIEWER_MISMATCH',
            round,
            'reviewer',
            `${round}: reviewer profile/binding mismatch: ${mismatches
              .map(([field, left, right]) => `${field}=${String(left)} vs ${String(right)}`)
              .join(', ')}`,
            { identities: [String(expected.mandate_id), String(binding.mandate_id)] },
          );
      }
    }
  }

  for (const [runtimeRoot, rounds] of runtimeRoots)
    if (rounds.length !== 1)
      add(
        'ROUND_ARTIFACT_RUNTIME_ROOT_SHARED',
        rounds.join(','),
        'runtime_root',
        `runtime_root ${runtimeRoot} is shared by ${rounds.join(', ')}`,
        { paths: [runtimeRoot], identities: rounds },
      );

  for (const nonRuntimeRoot of policy.non_runtime_roots) {
    if (typeof nonRuntimeRoot !== 'string' || !contained(nonRuntimeRoot)) {
      add(
        'ROUND_ARTIFACT_NON_RUNTIME_ROOT_INVALID',
        'GLOBAL',
        'proposal',
        `non-runtime proposal root ${String(nonRuntimeRoot)} escapes the repository`,
      );
      continue;
    }
    for (const path of filesBelow(nonRuntimeRoot)) {
      const text = readFileSync(join(repoRoot, path), 'utf8');
      const classes = [];
      if (basename(path) === 'close-control-profile.json') classes.push('close-control-profile');
      if (/"devai_reviewer_binding"\s*:\s*true/u.test(text)) classes.push('reviewer-binding');
      if (/"devai_round_declaration"\s*:\s*true/u.test(text)) classes.push('round-declaration');
      if (/\.devai\/state\/round-runs\//u.test(text)) classes.push('runtime-root');
      if (classes.length > 0)
        add(
          'ROUND_ARTIFACT_NON_RUNTIME_LEAK',
          'GLOBAL',
          'proposal',
          `proposal/non-runtime path ${path} contains runtime-discoverable ${classes.join(', ')}`,
          { paths: [path], identities: classes },
        );
    }
  }
}

export const report = {
  ok: findings.length === 0,
  gate: 'round-artifact-uniqueness',
  policy: policyRelative,
  findings,
};

if (directInvocation) {
  if (jsonOutput) process.stdout.write(`${JSON.stringify(report)}\n`);
  else if (report.ok) process.stdout.write('round artifact uniqueness: PASS\n');
  else {
    process.stderr.write('round artifact uniqueness: FAIL\n');
    for (const finding of findings) process.stderr.write(`[${finding.code}] ${finding.message}\n`);
  }

  process.exit(report.ok ? 0 : 1);
}
