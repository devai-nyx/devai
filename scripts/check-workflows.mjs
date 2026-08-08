#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMap, parseDocument } from 'yaml';

const workflowDir = join(process.cwd(), '.github', 'workflows');
const actionDir = join(process.cwd(), '.github', 'actions');
const findings = new Set();
const localActions = new Map();
const actionsWithFrozenInstall = new Set();

function report(file, diagnostic, detail) {
  findings.add(`${diagnostic}: ${file}: ${detail}`);
}

let files = [];
try {
  files = readdirSync(workflowDir)
    .filter((name) => /\.ya?ml$/u.test(name))
    .sort();
} catch (error) {
  report('.github/workflows', 'CI_WORKFLOW_DIRECTORY_UNREADABLE', String(error));
}

function asObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function triggerNames(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return Object.keys(asObject(value));
}

function visit(value, path, file) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${path}[${String(index)}]`, file));
    return;
  }
  if (value === null || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = path.length === 0 ? key : `${path}.${key}`;
    if (key === 'paths' || key === 'paths-ignore') {
      report(
        file,
        'CI_REQUIRED_GATE_PATH_FILTERED',
        `${childPath} may silently skip a required gate`,
      );
    }
    visit(child, childPath, file);
  }
}

function checkPermissions(file, permissions, path) {
  if (permissions === undefined) {
    if (path === 'permissions') {
      report(file, 'CI_WORKFLOW_PERMISSION_WIDENED', 'workflow permissions must be explicit');
    }
    return;
  }
  if (typeof permissions === 'string') {
    report(file, 'CI_WORKFLOW_PERMISSION_WIDENED', `${path} must be an explicit read-only map`);
    return;
  }
  if (permissions === null || typeof permissions !== 'object' || Array.isArray(permissions)) {
    report(file, 'CI_WORKFLOW_PERMISSION_WIDENED', `${path} is not a permission map`);
    return;
  }
  for (const [scope, access] of Object.entries(permissions)) {
    if (scope !== 'contents' || !['read', 'none'].includes(String(access))) {
      report(file, 'CI_WORKFLOW_PERMISSION_WIDENED', `${path}.${scope} grants ${String(access)}`);
    }
  }
}

function isLocalUse(target) {
  return target.startsWith('./');
}

function actionName(target) {
  return target.split('@', 1)[0]?.toLowerCase() ?? '';
}

function checkActionReferences(file, source) {
  for (const match of source.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)(.*)$/gmu)) {
    const target = match[1] ?? '';
    const suffix = match[2] ?? '';
    if (isLocalUse(target)) continue;
    if (!/@[0-9a-f]{40}$/u.test(target)) {
      report(file, 'CI_ACTION_REFERENCE_MUTABLE', `${target} must use an immutable 40-hex SHA`);
    } else if (!/#\s*v[0-9]/u.test(suffix)) {
      report(
        file,
        'CI_ACTION_REFERENCE_VERSION_UNBOUND',
        `${target} needs a readable version comment`,
      );
    }
  }
}

const forbiddenCachePath =
  /(^|[\s/])(node_modules|\.devai\/(?:config|pin|state|worktrees)|coverage|record\/proofs)(?:[\s/]|$)/iu;
const forbiddenArtifactPath =
  /(^|[\s/])(node_modules|\.devai\/(?:config|pin|state|worktrees)|record\/proofs)(?:[\s/]|$)/iu;
const verdictTerm = /(?:^|[-_.\s/])(pass|verdict|result|evidence|coverage)(?:[-_.\s/]|$)/iu;
const passAuthorityTerm = /(?:^|[-_.\s/])(pass|verdict|gate-pass)(?:[-_.\s/]|$)/iu;

function hasFrozenInstall(run) {
  return /(?:^|[;&|\n]\s*)pnpm\s+install\s+--frozen-lockfile(?:\s|$)/u.test(run);
}

function checkCachesAndArtifacts(file, jobId, job) {
  const steps = Array.isArray(job.steps) ? job.steps : [];
  let downloadPath;
  let artifactDigestVerified = false;

  for (const [index, rawStep] of steps.entries()) {
    const step = asObject(rawStep);
    const uses = typeof step.uses === 'string' ? step.uses : '';
    const name = actionName(uses);
    const withValues = asObject(step.with);
    const run = typeof step.run === 'string' ? step.run : '';
    const condition = typeof step.if === 'string' ? step.if : '';
    const location = `jobs.${jobId}.steps[${String(index)}]`;

    if (
      name === 'actions/cache' ||
      name === 'actions/cache/restore' ||
      name === 'actions/cache/save'
    ) {
      const cachePath = String(withValues.path ?? '');
      const key = String(withValues.key ?? '');
      const restoreKeys = String(withValues['restore-keys'] ?? '');
      if (forbiddenCachePath.test(cachePath)) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} caches forbidden path ${JSON.stringify(cachePath)}`,
        );
      }
      if (verdictTerm.test(key) || verdictTerm.test(restoreKeys)) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} gives a verdict/evidence namespace to unauthenticated cache bytes`,
        );
      }
      if (/github\.(?:base_ref|event\.pull_request\.base)/u.test(`${key}\n${restoreKeys}`)) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} permits fork-controlled restoration through a base-ref cache namespace`,
        );
      }
      const acquisitionBindings = [
        /runner\.os/u,
        /runner\.arch/u,
        /node/iu,
        /pnpm/iu,
        /pnpm-lock\.yaml/u,
        /\.npmrc/u,
        /pnpm-workspace\.yaml/u,
        /package\.json/u,
      ];
      if (
        !/(?:pnpm|store)/iu.test(cachePath) ||
        acquisitionBindings.some((binding) => !binding.test(key))
      ) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} cache path/key does not bind the complete pnpm acquisition identity`,
        );
      }
      if (condition.length === 0) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} cache is not disabled at the fork boundary`,
        );
      } else if (
        !/inputs\.cache-enabled/u.test(condition) &&
        !(
          /github\.event_name\s*!=\s*['"]pull_request['"]/u.test(condition) &&
          /github\.event\.pull_request\.head\.repo\.full_name\s*==\s*github\.repository/u.test(
            condition,
          )
        )
      ) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} cache condition does not prove the fork boundary`,
        );
      }
    }

    if (name === 'actions/setup-node' && withValues.cache !== undefined) {
      report(
        file,
        'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
        `${location} must use the explicit governed pnpm-store cache key`,
      );
    }

    if (/cache-hit/u.test(condition)) {
      report(
        file,
        'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
        `${location} condition lets cache state select executable population`,
      );
    }
    if (hasFrozenInstall(run) && condition.length > 0) {
      report(
        file,
        'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
        `${location} condition can skip pnpm install --frozen-lockfile`,
      );
    }
    if (/pnpm\s+install\b/u.test(run) && !hasFrozenInstall(run)) {
      report(file, 'CI_FROZEN_INSTALL_MISSING', `${location} runs a non-frozen pnpm installation`);
    }

    if (name === 'actions/download-artifact') {
      downloadPath = String(withValues.path ?? '.');
      artifactDigestVerified = false;
      if (passAuthorityTerm.test(String(withValues.name ?? ''))) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} names transported bytes as a verdict`,
        );
      }
    }

    const verifiesArtifactDigest =
      /(?:sha256sum|shasum).*--check|verify[^\n]*(?:digest|manifest)/iu.test(run);
    const derivesArtifactPass =
      passAuthorityTerm.test(run) ||
      /\bconclusion\b/iu.test(run) ||
      /(?:GITHUB_OUTPUT[^\n]*(?:verdict|pass)|(?:verdict|pass)[^\n]*GITHUB_OUTPUT)/iu.test(run);
    if (name === 'actions/upload-artifact') {
      const retention = Number(withValues['retention-days']);
      if (!Number.isInteger(retention) || retention < 1 || retention > 90) {
        report(file, 'CI_ARTIFACT_RETENTION_UNBOUND', `${location} needs retention-days in 1..90`);
      }
      if (forbiddenArtifactPath.test(String(withValues.path ?? ''))) {
        report(
          file,
          'CI_ARTIFACT_FORBIDDEN_PATH',
          `${location} uploads authority or runtime state`,
        );
      }
    }

    if (
      downloadPath !== undefined &&
      run.length > 0 &&
      (derivesArtifactPass ||
        (!artifactDigestVerified && verdictTerm.test(run) && !verifiesArtifactDigest))
    ) {
      report(
        file,
        'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
        `${location} derives authority from undigested artifact bytes in ${JSON.stringify(downloadPath)}`,
      );
    }
    if (downloadPath !== undefined && verifiesArtifactDigest) artifactDigestVerified = true;
  }

  const commands = steps
    .map((rawStep) => asObject(rawStep))
    .filter((step) => typeof step.run === 'string')
    .map((step) => String(step.run));
  const needsDependencies = commands.some((run) =>
    /\bpnpm\s+(?:run|vitest|exec|devai)\b/u.test(run),
  );
  const unconditionalFrozenInstall = steps.some((rawStep) => {
    const step = asObject(rawStep);
    return (
      (typeof step.run === 'string' && step.if === undefined && hasFrozenInstall(step.run)) ||
      (typeof step.uses === 'string' &&
        step.if === undefined &&
        actionsWithFrozenInstall.has(step.uses))
    );
  });
  if (needsDependencies && !unconditionalFrozenInstall) {
    report(
      file,
      'CI_FROZEN_INSTALL_MISSING',
      `jobs.${jobId} executes pnpm tooling without unconditional pnpm install --frozen-lockfile`,
    );
  }
}

function checkCompositeInputConsumption(file, action) {
  const declaredInputs = asObject(action.inputs);
  const serialized = JSON.stringify(action.runs);
  const consumedInputs = [
    ...serialized.matchAll(/\binputs\.([A-Za-z_][A-Za-z0-9_-]*)/gu),
    ...serialized.matchAll(/\binputs\[['"]([A-Za-z_][A-Za-z0-9_-]*)['"]\]/gu),
  ].map((match) => match[1] ?? '');
  for (const input of consumedInputs) {
    if (!Object.hasOwn(declaredInputs, input)) {
      report(
        file,
        'CI_REUSABLE_INPUT_UNBOUND',
        `composite action consumes undeclared input ${input}`,
      );
    }
  }
  if (/\bsecrets(?:\.|\[)/u.test(serialized)) {
    report(file, 'CI_REUSABLE_INPUT_UNBOUND', 'composite action consumes an implicit secret');
  }
}

function collectActionFiles(directory, relative = '.github/actions') {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const collected = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const relativePath = `${relative}/${entry.name}`;
    if (entry.isDirectory()) collected.push(...collectActionFiles(path, relativePath));
    else if (/^action\.ya?ml$/u.test(entry.name)) collected.push({ path, relativePath });
  }
  return collected;
}

function checkLocalActionUses(file, steps, workflowTriggers = []) {
  for (const [index, rawStep] of steps.entries()) {
    const step = asObject(rawStep);
    if (typeof step.uses !== 'string' || !step.uses.startsWith('./.github/actions/')) continue;
    const location = `steps[${String(index)}]`;
    if (!localActions.has(step.uses)) {
      report(file, 'CI_LOCAL_ACTION_UNRESOLVED', `${location} calls missing ${step.uses}`);
      continue;
    }
    const target = localActions.get(step.uses);
    const declarations = asObject(target.action.inputs);
    const supplied = asObject(step.with);
    for (const input of Object.keys(supplied)) {
      if (!Object.hasOwn(declarations, input)) {
        report(file, 'CI_REUSABLE_INPUT_UNBOUND', `${location} supplies undeclared input ${input}`);
      }
    }
    for (const [input, definition] of Object.entries(declarations)) {
      const contract = asObject(definition);
      if (
        contract.required === true &&
        contract.default === undefined &&
        !Object.hasOwn(supplied, input)
      ) {
        report(file, 'CI_REUSABLE_INPUT_UNBOUND', `${location} omits required input ${input}`);
      }
    }
    if (
      step.uses.endsWith('/r7-pnpm-setup') &&
      workflowTriggers.some((trigger) => ['pull_request', 'pull_request_target'].includes(trigger))
    ) {
      const cacheEnabled = String(asObject(step.with)['cache-enabled'] ?? 'false');
      const explicitlyDisabled = cacheEnabled === 'false';
      const sameRepositoryOnly =
        /github\.event_name\s*!=\s*['"]pull_request['"]/u.test(cacheEnabled) &&
        /github\.event\.pull_request\.head\.repo\.full_name\s*==\s*github\.repository/u.test(
          cacheEnabled,
        ) &&
        cacheEnabled.includes('||');
      if (!explicitlyDisabled && !sameRepositoryOnly) {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          `${location} enables the pnpm cache for an untrusted fork pull request`,
        );
      }
    }
  }
}

function workflowCallDeclaration(workflow) {
  const triggers = asObject(workflow.on);
  const call = asObject(triggers.workflow_call);
  return {
    enabled: triggerNames(workflow.on).includes('workflow_call'),
    inputs: asObject(call.inputs),
    secrets: asObject(call.secrets),
  };
}

function checkReusableConsumption(file, workflow) {
  const declaration = workflowCallDeclaration(workflow);
  if (!declaration.enabled) return;
  const serialized = JSON.stringify(workflow);
  const consumedInputs = [
    ...serialized.matchAll(/\binputs\.([A-Za-z_][A-Za-z0-9_-]*)/gu),
    ...serialized.matchAll(/\binputs\[['"]([A-Za-z_][A-Za-z0-9_-]*)['"]\]/gu),
  ].map((match) => match[1] ?? '');
  for (const input of consumedInputs) {
    if (!Object.hasOwn(declaration.inputs, input)) {
      report(file, 'CI_REUSABLE_INPUT_UNBOUND', `consumes undeclared workflow_call input ${input}`);
    }
  }
  const consumedSecrets = [
    ...serialized.matchAll(/\bsecrets\.([A-Za-z_][A-Za-z0-9_]*)/gu),
    ...serialized.matchAll(/\bsecrets\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/gu),
  ].map((match) => match[1] ?? '');
  for (const secret of consumedSecrets) {
    if (!Object.hasOwn(declaration.secrets, secret)) {
      report(
        file,
        'CI_REUSABLE_INPUT_UNBOUND',
        `consumes undeclared workflow_call secret ${secret}`,
      );
    }
  }
}

function matrixKeys(matrix) {
  const keys = new Set(Object.keys(matrix).filter((key) => !['include', 'exclude'].includes(key)));
  if (Array.isArray(matrix.include)) {
    for (const cell of matrix.include) {
      for (const key of Object.keys(asObject(cell))) keys.add(key);
    }
  }
  return [...keys];
}

function checkMatrix(file, jobId, job) {
  const strategy = asObject(job.strategy);
  if (strategy.matrix === undefined) return;
  if (strategy['fail-fast'] !== false) {
    report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', `jobs.${jobId} matrix must set fail-fast: false`);
  }
  if (
    strategy.matrix === null ||
    typeof strategy.matrix !== 'object' ||
    Array.isArray(strategy.matrix)
  ) {
    report(
      file,
      'CI_SEMANTIC_DEPENDENCY_LOST',
      `jobs.${jobId} matrix is dynamic or structurally incomplete`,
    );
    return;
  }
  const matrix = asObject(strategy.matrix);
  for (const [axis, cells] of Object.entries(matrix)) {
    if (['include', 'exclude'].includes(axis)) continue;
    if (
      !Array.isArray(cells) ||
      cells.length === 0 ||
      new Set(cells.map(String)).size !== cells.length
    ) {
      report(
        file,
        'CI_SEMANTIC_DEPENDENCY_LOST',
        `jobs.${jobId} matrix.${axis} must be a nonempty unique declared population`,
      );
    }
  }
  const executableSteps = (Array.isArray(job.steps) ? job.steps : []).map((rawStep) => {
    const step = asObject(rawStep);
    return { run: step.run, uses: step.uses, with: step.with, env: step.env };
  });
  const executableSurface = JSON.stringify({
    runsOn: job['runs-on'],
    container: job.container,
    services: job.services,
    steps: executableSteps,
    uses: job.uses,
    with: job.with,
  });
  for (const key of matrixKeys(matrix)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    if (!new RegExp(`matrix\\.${escaped}(?:[^A-Za-z0-9_-]|$)`, 'u').test(executableSurface)) {
      report(
        file,
        'CI_SEMANTIC_DEPENDENCY_LOST',
        `jobs.${jobId} declares matrix.${key} but no executable cell consumes it`,
      );
    }
  }
}

function commandPositions(job) {
  const runs = (Array.isArray(job.steps) ? job.steps : [])
    .map((step) => asObject(step).run)
    .filter((run) => typeof run === 'string');
  const joined = runs.join('\n');
  const position = (pattern) => {
    const match = pattern.exec(joined);
    return match === null ? -1 : match.index;
  };
  return {
    joined,
    stage1: position(/pnpm\s+run\s+ci:stage1\b/u),
    stage2: position(/pnpm\s+run\s+ci:stage2\b/u),
    stage3: position(/pnpm\s+run\s+ci:stage3\b/u),
    coverage: position(/pnpm\s+run\s+(?:ci:stage3|test:coverage:t1-t3)\b/u),
    governance: position(/pnpm\s+run\s+ci:governance\b/u),
    changesets: position(/pnpm\s+run\s+ci:changesets\b/u),
    build: position(/pnpm\s+run\s+build\b/u),
    t1: position(/pnpm\s+run\s+test:t1\b/u),
    t2: position(/pnpm\s+run\s+test:t2\b/u),
    t4: position(/pnpm\s+run\s+test:t4\b/u),
    t5: position(/pnpm\s+run\s+test:t5\b/u),
    t6: position(/pnpm\s+run\s+test:t6\b/u),
  };
}

function checkSemanticDag(file, workflow) {
  const jobs = asObject(workflow.jobs);
  const metadata = new Map(
    Object.entries(jobs).map(([jobId, rawJob]) => [jobId, commandPositions(asObject(rawJob))]),
  );
  const dependencies = new Map(
    Object.entries(jobs).map(([jobId, rawJob]) => [jobId, asArray(asObject(rawJob).needs)]),
  );

  if (file === 'round-gates.yml') {
    for (const phase of ['t4', 't5', 't6']) {
      if (![...metadata.values()].some((positions) => positions[phase] >= 0)) {
        report(
          file,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          `required ${phase.toUpperCase()} population is missing`,
        );
      }
    }
  }

  const reaches = (jobId, predicate, seen = new Set()) => {
    if (seen.has(jobId)) return false;
    seen.add(jobId);
    for (const dependency of dependencies.get(jobId) ?? []) {
      if (!jobs[dependency]) {
        report(
          file,
          'CI_SEMANTIC_DEPENDENCY_LOST',
          `jobs.${jobId} needs missing job ${dependency}`,
        );
        continue;
      }
      if (predicate(metadata.get(dependency))) return true;
      if (reaches(dependency, predicate, seen)) return true;
    }
    return false;
  };

  const requiresUpstream = (phase, prerequisite, label) => {
    for (const [jobId, positions] of metadata) {
      if (positions[phase] < 0) continue;
      const inJob = positions[prerequisite] >= 0 && positions[prerequisite] < positions[phase];
      const upstream = reaches(jobId, (other) => other?.[prerequisite] >= 0);
      if (!inJob && !upstream) {
        report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', `jobs.${jobId} ${label}`);
      }
    }
  };

  requiresUpstream('stage2', 'stage1', 'runs stage2 without the stage1/build boundary');
  requiresUpstream('stage3', 'stage2', 'runs merged coverage without stage2');
  requiresUpstream('stage3', 'changesets', 'runs merged coverage without changeset classification');
  requiresUpstream('t5', 't4', 'runs T5 without a needs path from T4');
  requiresUpstream('t6', 't5', 'runs T6 without a needs path from T5');

  for (const [jobId, positions] of metadata) {
    if (positions.t2 >= 0) {
      const correctLocalOrder =
        positions.build >= 0 &&
        positions.build < positions.t1 &&
        positions.t1 >= 0 &&
        positions.t1 < positions.t2;
      const upstreamBuild = reaches(jobId, (other) => other?.build >= 0 || other?.stage1 >= 0);
      const upstreamT1 = reaches(jobId, (other) => other?.t1 >= 0);
      if (!correctLocalOrder && !(upstreamBuild && upstreamT1)) {
        report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', `jobs.${jobId} loses build -> T1 -> T2 order`);
      }
    }
  }

  for (const [jobId, rawJob] of Object.entries(jobs)) {
    const job = asObject(rawJob);
    const uses = job.uses;
    if (typeof uses !== 'string' || !uses.endsWith('/round-gates.yml')) continue;
    if (!reaches(jobId, (other) => other?.coverage >= 0)) {
      report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', `jobs.${jobId} lacks merged coverage needs`);
    }
    if (!reaches(jobId, (other) => other?.governance >= 0)) {
      report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', `jobs.${jobId} lacks governance needs`);
    }
  }
  for (const [jobId, positions] of metadata) {
    if (positions.coverage < 0) continue;
    const job = asObject(jobs[jobId]);
    const postgres = asObject(asObject(job.services).postgres);
    if (Object.keys(postgres).length === 0 || String(asObject(job.env).DEVAI_DB_TESTS) !== '1') {
      report(
        file,
        'CI_SEMANTIC_DEPENDENCY_LOST',
        `jobs.${jobId} loses DB-enabled coverage instrumentation`,
      );
    }
  }
}

function checkConcurrency(file, workflow, path = 'concurrency') {
  const concurrency = asObject(workflow.concurrency);
  if (Object.keys(concurrency).length === 0) return;
  const cancellation = concurrency['cancel-in-progress'];
  if (cancellation === undefined || cancellation === false) return;
  const triggers = triggerNames(workflow.on);
  const authoritative = triggers.some((trigger) =>
    ['push', 'merge_group', 'schedule', 'workflow_dispatch', 'workflow_call'].includes(trigger),
  );
  if (!authoritative) return;
  const normalized = String(cancellation).replace(/\s+/gu, ' ').trim();
  const prEquality =
    /(?:github\.event_name\s*==\s*['"]pull_request['"]|['"]pull_request['"]\s*==\s*github\.event_name)/u;
  if (!prEquality.test(normalized) || normalized.includes('||')) {
    report(
      file,
      'CI_SEMANTIC_DEPENDENCY_LOST',
      `${path}.cancel-in-progress can cancel an authoritative main/merge/candidate/sentinel/close run`,
    );
  }
}

function loadColdRoster() {
  const path = join(process.cwd(), 'law', 'policy', 'round-close-controls.json');
  try {
    const policy = JSON.parse(readFileSync(path, 'utf8'));
    const commands = asObject(policy).convergence?.commands;
    if (!Array.isArray(commands) || commands.length === 0) throw new Error('empty command roster');
    return commands.map((entry) => {
      const command = asObject(entry);
      if (typeof command.id !== 'string' || !Array.isArray(command.argv)) {
        throw new Error('malformed command roster');
      }
      return { id: command.id, shell: command.argv.map(String).join(' ') };
    });
  } catch (error) {
    report('law/policy/round-close-controls.json', 'CI_COLD_ROSTER_UNBOUND', String(error));
    return [];
  }
}

function checkColdSentinel(workflow, roster) {
  const file = 'cold-sentinel.yml';
  const jobs = Object.values(asObject(workflow.jobs)).map(asObject);
  const allRuns = jobs
    .flatMap((job) => (Array.isArray(job.steps) ? job.steps : []))
    .map((step) => asObject(step).run)
    .filter((run) => typeof run === 'string')
    .join('\n');
  let prior = -1;
  for (const command of roster) {
    const first = allRuns.indexOf(command.shell);
    const second = first < 0 ? -1 : allRuns.indexOf(command.shell, first + command.shell.length);
    if (first < 0 || second >= 0 || first <= prior) {
      report(
        file,
        'CI_SEMANTIC_DEPENDENCY_LOST',
        `cold roster command ${command.id} must occur exactly once in declared order`,
      );
    }
    if (first >= 0) prior = first;
  }
  const triggers = triggerNames(workflow.on);
  for (const required of ['push', 'schedule', 'workflow_dispatch']) {
    if (!triggers.includes(required)) {
      report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', `cold sentinel lacks ${required} trigger`);
    }
  }
  const pushBranches = asArray(asObject(asObject(workflow.on).push).branches);
  if (pushBranches.length !== 1 || pushBranches[0] !== 'main') {
    report(file, 'CI_SEMANTIC_DEPENDENCY_LOST', 'cold sentinel push trigger must be exact main');
  }
  if (asObject(workflow.concurrency)['cancel-in-progress'] !== false) {
    report(
      file,
      'CI_SEMANTIC_DEPENDENCY_LOST',
      'cold sentinel must explicitly disable cancellation',
    );
  }
  for (const job of jobs) {
    for (const step of Array.isArray(job.steps) ? job.steps : []) {
      const value = asObject(asObject(step).with)['cache-enabled'];
      if (String(value ?? 'false') !== 'false') {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          'cold authoritative setup must disable dependency-cache restoration',
        );
      }
      if (actionName(String(asObject(step).uses ?? '')) === 'actions/download-artifact') {
        report(
          file,
          'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
          'cold authoritative lane cannot download a result artifact',
        );
      }
    }
  }
}

const coldRoster = loadColdRoster();

for (const { path, relativePath } of collectActionFiles(actionDir)) {
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch (error) {
    report(relativePath, 'CI_LOCAL_ACTION_UNREADABLE', String(error));
    continue;
  }
  checkActionReferences(relativePath, source);
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    for (const error of document.errors) {
      report(relativePath, 'CI_LOCAL_ACTION_YAML_INVALID', error.message);
    }
    continue;
  }
  if (!isMap(document.contents)) {
    report(relativePath, 'CI_LOCAL_ACTION_ROOT_INVALID', 'action root must be a mapping');
    continue;
  }
  const action = document.toJS();
  const runs = asObject(action.runs);
  if (runs.using !== 'composite' || !Array.isArray(runs.steps)) {
    report(relativePath, 'CI_LOCAL_ACTION_ROOT_INVALID', 'local action must be a composite');
    continue;
  }
  const target = `./${relativePath.replace(/\/action\.ya?ml$/u, '')}`;
  localActions.set(target, { action, relativePath });
  checkCompositeInputConsumption(relativePath, action);
  checkCachesAndArtifacts(relativePath, 'composite', { steps: runs.steps });
  if (
    runs.steps.some((rawStep) => {
      const step = asObject(rawStep);
      return typeof step.run === 'string' && step.if === undefined && hasFrozenInstall(step.run);
    })
  ) {
    actionsWithFrozenInstall.add(target);
  }
  const cacheInput = asObject(action.inputs)['cache-enabled'];
  if (
    runs.steps.some(
      (rawStep) => actionName(String(asObject(rawStep).uses ?? '')) === 'actions/cache',
    ) &&
    String(asObject(cacheInput).default) !== 'false'
  ) {
    report(
      relativePath,
      'CI_UNAUTHENTICATED_BYTES_HAVE_NO_VERDICT_AUTHORITY',
      'cache-enabled must default to false',
    );
  }
}
for (const { action, relativePath } of localActions.values()) {
  checkLocalActionUses(relativePath, asObject(action.runs).steps ?? []);
}

const parsed = new Map();
for (const file of files) {
  let source;
  try {
    source = readFileSync(join(workflowDir, file), 'utf8');
  } catch (error) {
    report(file, 'CI_WORKFLOW_UNREADABLE', String(error));
    continue;
  }
  checkActionReferences(file, source);
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    for (const error of document.errors) report(file, 'CI_WORKFLOW_YAML_INVALID', error.message);
    continue;
  }
  if (!isMap(document.contents)) {
    report(file, 'CI_WORKFLOW_ROOT_INVALID', 'workflow root must be a mapping');
    continue;
  }
  const workflow = document.toJS();
  parsed.set(file, workflow);
  if (typeof workflow.name !== 'string' || workflow.name.length === 0) {
    report(file, 'CI_WORKFLOW_NAME_MISSING', 'missing workflow name');
  }
  if (workflow.on === undefined || workflow.on === null) {
    report(file, 'CI_WORKFLOW_TRIGGER_MISSING', 'missing triggers');
  }
  if (workflow.jobs === undefined || workflow.jobs === null) {
    report(file, 'CI_WORKFLOW_JOBS_MISSING', 'missing jobs');
  }
  visit(workflow, '', file);
  checkPermissions(file, workflow.permissions, 'permissions');
  checkReusableConsumption(file, workflow);
  checkConcurrency(file, workflow);

  for (const [jobId, rawJob] of Object.entries(asObject(workflow.jobs))) {
    const job = asObject(rawJob);
    checkPermissions(file, job.permissions, `jobs.${jobId}.permissions`);
    checkCachesAndArtifacts(file, jobId, job);
    checkMatrix(file, jobId, job);
    checkLocalActionUses(
      file,
      Array.isArray(job.steps) ? job.steps : [],
      triggerNames(workflow.on),
    );
    checkConcurrency(
      file,
      { on: workflow.on, concurrency: job.concurrency },
      `jobs.${jobId}.concurrency`,
    );
  }
  checkSemanticDag(file, workflow);
}

for (const [file, workflow] of parsed) {
  for (const [jobId, rawJob] of Object.entries(asObject(workflow.jobs))) {
    const job = asObject(rawJob);
    if (typeof job.uses !== 'string' || !job.uses.startsWith('./.github/workflows/')) continue;
    const calleeFile = job.uses.slice('./.github/workflows/'.length);
    const callee = parsed.get(calleeFile);
    if (callee === undefined) {
      report(file, 'CI_REUSABLE_INPUT_UNBOUND', `jobs.${jobId} calls missing ${job.uses}`);
      continue;
    }
    const declaration = workflowCallDeclaration(callee);
    if (!declaration.enabled) {
      report(file, 'CI_REUSABLE_INPUT_UNBOUND', `jobs.${jobId} target lacks workflow_call`);
      continue;
    }
    const suppliedInputs = asObject(job.with);
    for (const input of Object.keys(suppliedInputs)) {
      if (!Object.hasOwn(declaration.inputs, input)) {
        report(
          file,
          'CI_REUSABLE_INPUT_UNBOUND',
          `jobs.${jobId} supplies undeclared input ${input}`,
        );
      }
    }
    for (const [input, definition] of Object.entries(declaration.inputs)) {
      if (asObject(definition).required === true && !Object.hasOwn(suppliedInputs, input)) {
        report(file, 'CI_REUSABLE_INPUT_UNBOUND', `jobs.${jobId} omits required input ${input}`);
      }
    }
    if (job.secrets === 'inherit') {
      report(file, 'CI_REUSABLE_INPUT_UNBOUND', `jobs.${jobId} uses unbounded secrets: inherit`);
    } else {
      const suppliedSecrets = asObject(job.secrets);
      for (const secret of Object.keys(suppliedSecrets)) {
        if (!Object.hasOwn(declaration.secrets, secret)) {
          report(
            file,
            'CI_REUSABLE_INPUT_UNBOUND',
            `jobs.${jobId} supplies undeclared secret ${secret}`,
          );
        }
      }
      for (const [secret, definition] of Object.entries(declaration.secrets)) {
        if (asObject(definition).required === true && !Object.hasOwn(suppliedSecrets, secret)) {
          report(
            file,
            'CI_REUSABLE_INPUT_UNBOUND',
            `jobs.${jobId} omits required secret ${secret}`,
          );
        }
      }
    }
  }
}

const coldSentinel = parsed.get('cold-sentinel.yml');
if (coldSentinel === undefined) {
  report(
    'cold-sentinel.yml',
    'CI_SEMANTIC_DEPENDENCY_LOST',
    'mandatory cold authoritative sentinel is missing',
  );
} else {
  checkColdSentinel(coldSentinel, coldRoster);
}

if (files.length === 0)
  report('.github/workflows', 'CI_WORKFLOW_POPULATION_EMPTY', 'no files found');

if (findings.size > 0) {
  process.stderr.write(
    `workflow lint: FAIL\n${[...findings].map((finding) => `- ${finding}`).join('\n')}\n`,
  );
  process.exit(1);
}

process.stdout.write(`workflow lint: PASS (${String(files.length)} workflow files)\n`);
