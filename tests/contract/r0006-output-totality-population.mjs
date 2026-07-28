// Inspector executable: full behavioral population gate for the R-0006 cycle-5 repair.
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { ACTION_REGISTRY } from '../../packages/cli/dist/generated/action-registry.js';
import { runCliStage } from '../../packages/cli/dist/action-output.js';
import { validators } from '../../packages/schemas/dist/index.js';

const ROOT = resolve(import.meta.dirname, '../..');
const BIN = resolve(ROOT, 'packages/cli/dist/bin.js');
const outputPath = process.env.R0006_OUTPUT_MATRIX_PATH;
const diagnosticScope = process.env.R0006_OUTPUT_MATRIX_SCOPE;
const diagnosticSensorKind = process.env.R0006_OUTPUT_SENSOR_KIND;
const failures = [];

const omittedEnvironment = new Set([
  'GIT_AUTHOR_NAME',
  'GIT_AUTHOR_EMAIL',
  'GIT_COMMITTER_NAME',
  'GIT_COMMITTER_EMAIL',
  'DEVAII_ROUND_CLOSE_ALLOW_LOCAL_CACHE',
  'DEVAII_ROUND_CLOSE_TRUST_LOCAL_CACHE',
]);
const environment = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !omittedEnvironment.has(key)),
  ),
  CI: 'true',
  GITHUB_ACTIONS: 'true',
  NODE_ENV: 'test',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_ALTERNATE_OBJECT_DIRECTORIES: '',
};

function execute(args, cwd, extraEnvironment = {}) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...environment, ...extraEnvironment },
  });
  return {
    argv: args,
    status: result.status,
    signal: result.signal,
    timed_out: result.error?.code === 'ETIMEDOUT',
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function parseSingle(text) {
  try {
    const value = JSON.parse(text);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function inspectMachine(result, actionId) {
  const channel = result.stdout.length > 0 ? result.stdout : result.stderr;
  const opposite = result.stdout.length > 0 ? result.stderr : result.stdout;
  const parsed = parseSingle(channel);
  const envelopeValid = parsed.ok && validators.actionResult(parsed.value);
  const value = parsed.ok ? parsed.value : null;
  const exitEqual = value?.ok === true ? result.status === 0 : value?.error?.exit === result.status;
  const valid =
    !result.timed_out &&
    opposite === '' &&
    envelopeValid &&
    value?.action_id === actionId &&
    exitEqual &&
    !channel.includes('node:fs:') &&
    !channel.includes('\n    at ');
  return { valid, envelope_valid: envelopeValid, exit_equal: exitEqual, envelope: value };
}

function stableDomain(value) {
  if (value?.sensor?.kind !== undefined) {
    return {
      sensor_kind: value.sensor.kind,
      status: value.status ?? null,
      verdict: value.verdict ?? null,
    };
  }
  if (typeof value?.command === 'string' && typeof value?.exit_code === 'number') {
    return {
      command: value.command,
      exit_code: value.exit_code,
      status: value.status ?? null,
      tier: value.tier ?? null,
    };
  }
  return undefined;
}

function semantic(machine) {
  const value = machine.envelope;
  if (value?.ok === false) {
    const parsedMessage = parseSingle(String(value.error?.message ?? ''));
    const domain = parsedMessage.ok ? stableDomain(parsedMessage.value) : undefined;
    if (domain !== undefined) return { ok: false, exit: value.error?.exit, ...domain };
    return {
      ok: false,
      code: value.error?.code,
      class: value.error?.class,
      exit: value.error?.exit,
      message: value.error?.message,
    };
  }
  const payload = value?.result?.value;
  return {
    ok: true,
    media_type: value?.result?.media_type,
    sensor_kind: payload?.sensor?.kind ?? null,
    status: payload?.status ?? null,
    verdict: payload?.verdict ?? null,
  };
}

function sameSemantic(left, right) {
  return JSON.stringify(semantic(left)) === JSON.stringify(semantic(right));
}

function humanMachineEquivalent(human, machine) {
  const value = machine.envelope;
  if (value?.ok === true) return human.status === 0;
  if (human.status === 0 || value?.ok !== false) return false;
  if (value.error?.exit !== 7) return true;
  const humanText = (human.stderr.length > 0 ? human.stderr : human.stdout).trim();
  const machineText = String(value.error?.message ?? '').trim();
  if (humanText.length === 0 || machineText.length === 0) return false;
  if (
    humanText === machineText ||
    humanText.includes(machineText) ||
    machineText.includes(humanText)
  ) {
    return true;
  }
  const humanParsed = parseSingle(humanText);
  const machineParsed = parseSingle(machineText);
  const humanDomain = humanParsed.ok ? stableDomain(humanParsed.value) : undefined;
  const machineDomain = machineParsed.ok ? stableDomain(machineParsed.value) : undefined;
  if (humanDomain !== undefined && machineDomain !== undefined) {
    return JSON.stringify(humanDomain) === JSON.stringify(machineDomain);
  }
  return (
    humanParsed.ok &&
    machineParsed.ok &&
    JSON.stringify(humanParsed.value) === JSON.stringify(machineParsed.value)
  );
}

function executeProducer(
  actionId,
  args,
  root,
  fixtureStrategy,
  expectedHumanExit,
  expectedMachineExit = 7,
  extraEnvironment = {},
) {
  const human = execute(args, root, extraEnvironment);
  const json = execute([...args, '--json'], root, extraEnvironment);
  const format = execute([...args, '--format', 'json'], root, extraEnvironment);
  const jsonInspection = inspectMachine(json, actionId);
  const formatInspection = inspectMachine(format, actionId);
  const spellingEquivalent = sameSemantic(jsonInspection, formatInspection);
  const humanEquivalent =
    humanMachineEquivalent(human, jsonInspection) &&
    humanMachineEquivalent(human, formatInspection);
  const valid =
    human.status === expectedHumanExit &&
    json.status === expectedMachineExit &&
    format.status === expectedMachineExit &&
    jsonInspection.valid &&
    formatInspection.valid &&
    spellingEquivalent &&
    humanEquivalent;
  recordFailure(
    'noncanonical-producer',
    actionId,
    valid,
    `expected human ${String(expectedHumanExit)} and canonical machine ${String(expectedMachineExit)} with equivalent domain semantics`,
  );
  return {
    producer_id: actionId,
    action_id: actionId,
    invocation_fixture: { root, strategy: fixtureStrategy, argv: args },
    human_result: human,
    machine_json_result: json,
    machine_format_json_result: format,
    envelope_validation: {
      bare_json: jsonInspection.envelope_valid,
      format_json: formatInspection.envelope_valid,
    },
    process_error_exit_equality: {
      bare_json: jsonInspection.exit_equal,
      format_json: formatInspection.exit_equal,
    },
    machine_spellings_semantically_equivalent: spellingEquivalent,
    human_machine_domain_semantically_equivalent: humanEquivalent,
    disposition: 'EXECUTED_SAFE_FAILURE',
  };
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'devai-r0006-output-totality-'));
  spawnSync('git', ['init', '-q'], { cwd: root, env: environment });
  cpSync(join(ROOT, 'law'), join(root, 'law'), { recursive: true });
  mkdirSync(join(root, '.devai'), { recursive: true });
  cpSync(join(ROOT, '.devai/pin'), join(root, '.devai/pin'), { recursive: true });
  copyFileSync(join(ROOT, 'package.json'), join(root, 'package.json'));
  copyFileSync(join(ROOT, 'pnpm-workspace.yaml'), join(root, 'pnpm-workspace.yaml'));
  const materialized = execute(
    ['adopt', 'upgrade', '--target', root, '--write', '--as-role', 'architect'],
    root,
  );
  if (materialized.status !== 0)
    failures.push(`fixture authority materialization: ${materialized.stderr}`);
  const identityChecks = ['user.name', 'user.email'].map((key) =>
    spawnSync('git', ['config', '--get', key], { cwd: root, env: environment, encoding: 'utf8' }),
  );
  if (identityChecks.some((result) => result.status === 0 || result.stdout !== '')) {
    failures.push('fixture inherited ambient Git identity');
  }
  if (existsSync(join(root, '.git/objects/info/alternates'))) {
    failures.push('fixture inherited Git object alternates');
  }
  return root;
}

function recordFailure(scope, id, condition, detail) {
  if (!condition) failures.push(`${scope}:${id}:${detail}`);
}

const root = fixture();
let artifact;
try {
  const retained = ACTION_REGISTRY.filter((entry) => entry.disposition === 'keep');
  const actionRows = (diagnosticScope === undefined ? retained : []).map((entry) => {
    const refusal = [];
    const human = execute([...entry.path, ...refusal], root);
    const json = execute([...entry.path, ...refusal, '--json'], root);
    const format = execute([...entry.path, ...refusal, '--format', 'json'], root);
    const jsonInspection = inspectMachine(json, entry.action_id);
    const formatInspection = inspectMachine(format, entry.action_id);
    const equivalent = sameSemantic(jsonInspection, formatInspection);
    const humanEquivalent =
      humanMachineEquivalent(human, jsonInspection) &&
      humanMachineEquivalent(human, formatInspection);
    const refused =
      jsonInspection.envelope?.ok === false &&
      ['routing-authority', 'precondition'].includes(jsonInspection.envelope?.error?.class);
    const disposition = refused
      ? 'EXECUTED_FAIL_CLOSED_REFUSAL'
      : jsonInspection.envelope?.ok === true
        ? 'EXECUTED_SAFE_SUCCESS'
        : 'EXECUTED_SAFE_FAILURE';
    const valid = jsonInspection.valid && formatInspection.valid && equivalent && humanEquivalent;
    recordFailure('action', entry.action_id, valid, 'machine execution invalid or inequivalent');
    return {
      action_id: entry.action_id,
      invocation_fixture: {
        root,
        strategy:
          entry.effect === 'read'
            ? 'isolated-safe-handler-or-input-failure'
            : 'authority-refusal-before-mutation',
        refusal,
      },
      human_result: human,
      machine_json_result: json,
      machine_format_json_result: format,
      envelope_validation: {
        bare_json: jsonInspection.envelope_valid,
        format_json: formatInspection.envelope_valid,
      },
      process_error_exit_equality: {
        bare_json: jsonInspection.exit_equal,
        format_json: formatInspection.exit_equal,
      },
      machine_spellings_semantically_equivalent: equivalent,
      human_machine_domain_semantically_equivalent: humanEquivalent,
      disposition,
    };
  });

  const sensorRegistry = JSON.parse(
    readFileSync(join(ROOT, 'law/policy/sensor-registry.json'), 'utf8'),
  );
  const sensorRows = (diagnosticScope === 'producers' ? [] : sensorRegistry.entries)
    .filter((entry) => diagnosticSensorKind === undefined || entry.kind === diagnosticSensorKind)
    .map((entry) => {
      const base = ['sense', 'run', entry.kind, '--repo-root', root];
      const human = execute(base, root);
      const json = execute([...base, '--json'], root);
      const format = execute([...base, '--format', 'json'], root);
      const jsonInspection = inspectMachine(json, 'sense run');
      const formatInspection = inspectMachine(format, 'sense run');
      const equivalent = sameSemantic(jsonInspection, formatInspection);
      const humanEquivalent =
        humanMachineEquivalent(human, jsonInspection) &&
        humanMachineEquivalent(human, formatInspection);
      const valid = jsonInspection.valid && formatInspection.valid && equivalent && humanEquivalent;
      recordFailure('sensor', entry.kind, valid, 'machine execution invalid or inequivalent');
      return {
        sensor_kind: entry.kind,
        action_id: 'sense run',
        invocation_fixture: { root, strategy: 'isolated-canonical-law-fixture' },
        human_result: human,
        machine_json_result: json,
        machine_format_json_result: format,
        envelope_validation: {
          bare_json: jsonInspection.envelope_valid,
          format_json: formatInspection.envelope_valid,
        },
        process_error_exit_equality: {
          bare_json: jsonInspection.exit_equal,
          format_json: formatInspection.exit_equal,
        },
        machine_spellings_semantically_equivalent: equivalent,
        human_machine_domain_semantically_equivalent: humanEquivalent,
        disposition:
          jsonInspection.envelope?.ok === true ? 'EXECUTED_SAFE_SUCCESS' : 'EXECUTED_SAFE_FAILURE',
      };
    });

  const listBase = ['sense', 'run', '--list'];
  const listHuman = execute(listBase, root);
  const listJson = execute([...listBase, '--json'], root);
  const listFormat = execute([...listBase, '--format', 'json'], root);
  const listJsonInspection = inspectMachine(listJson, 'sense run');
  const listFormatInspection = inspectMachine(listFormat, 'sense run');
  const listEquivalent = sameSemantic(listJsonInspection, listFormatInspection);
  const listHumanEquivalent =
    humanMachineEquivalent(listHuman, listJsonInspection) &&
    humanMachineEquivalent(listHuman, listFormatInspection);
  recordFailure(
    'sensor',
    '--list',
    listJsonInspection.valid && listFormatInspection.valid && listEquivalent && listHumanEquivalent,
    'list execution invalid or inequivalent',
  );
  const listRow = {
    sensor_kind: '--list',
    action_id: 'sense run',
    invocation_fixture: { root, strategy: 'isolated-canonical-law-fixture' },
    human_result: listHuman,
    machine_json_result: listJson,
    machine_format_json_result: listFormat,
    envelope_validation: {
      bare_json: listJsonInspection.envelope_valid,
      format_json: listFormatInspection.envelope_valid,
    },
    process_error_exit_equality: {
      bare_json: listJsonInspection.exit_equal,
      format_json: listFormatInspection.exit_equal,
    },
    machine_spellings_semantically_equivalent: listEquivalent,
    human_machine_domain_semantically_equivalent: listHumanEquivalent,
    disposition: 'EXECUTED_SAFE_SUCCESS',
  };

  const producerDir = join(root, '.devai/state/r0006-output-totality');
  mkdirSync(producerDir, { recursive: true });
  const invalidBlueprint = join(producerDir, 'invalid-blueprint.json');
  copyFileSync(
    join(ROOT, 'packages/skills/tests/contract/fixtures/r20-baseline/BP-DEMO-BOOKMARK-001.json'),
    invalidBlueprint,
  );
  const fixturePackagePath = join(root, 'package.json');
  const fixturePackage = JSON.parse(readFileSync(fixturePackagePath, 'utf8'));
  fixturePackage.packageManager = 'pnpm@10.0.0';
  writeFileSync(fixturePackagePath, `${JSON.stringify(fixturePackage, null, 2)}\n`);
  copyFileSync(join(ROOT, 'pnpm-lock.yaml'), join(root, 'pnpm-lock.yaml'));
  mkdirSync(join(root, 'docs/site'), { recursive: true });
  copyFileSync(
    join(ROOT, 'docs/site/package-lock.json'),
    join(root, 'docs/site/package-lock.json'),
  );
  const dependencyFixturePath = join(producerDir, 'dependency-review.json');
  const dependencyFixture = JSON.parse(
    readFileSync(
      join(ROOT, 'packages/cli/tests/unit/fixtures/r21/dependencies/low-moderate.json'),
      'utf8',
    ),
  );
  dependencyFixture.scanner = {
    name: 'devai-test-scanner',
    version: '1.0.0',
    database_updated_at: '2026-07-28T00:00:00.000Z',
  };
  dependencyFixture.generated_at = '2026-07-28T00:00:00.000Z';
  dependencyFixture.lockfile_sha256 = undefined;
  writeFileSync(dependencyFixturePath, `${JSON.stringify(dependencyFixture, null, 2)}\n`);
  const readingsDir = join(producerDir, 'sensor-readings');
  mkdirSync(readingsDir, { recursive: true });
  const reading = (id, kind) => ({
    schemaVersion: '1.0.0',
    id,
    sensor: { name: kind, kind },
    timestamp: '2026-07-28T00:00:00.000Z',
    status: 'pass',
    deterministic: true,
    command: 'pnpm run governance:check',
    command_hash: 'a'.repeat(64),
  });
  writeFileSync(
    join(readingsDir, 'lint.json'),
    `${JSON.stringify(reading('SR-1111111111111111', 'lint'))}\n`,
  );
  writeFileSync(
    join(readingsDir, 'type-check.json'),
    `${JSON.stringify(reading('SR-2222222222222222', 'type_check'))}\n`,
  );
  const docsDir = join(root, 'docs');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'population.md'), '```mermaid\ngraph TD\nA-->B\n```\n');
  const packDir = join(producerDir, 'pack');
  cpSync(
    join(
      ROOT,
      'packages/skills/tests/contract/fixtures/r20-baseline/redox-pack-nestjs-postgres-angular',
    ),
    packDir,
    { recursive: true },
  );
  const packManifestPath = join(packDir, 'stack-adapter.json');
  const packManifest = JSON.parse(readFileSync(packManifestPath, 'utf8'));
  packManifest.seed_invariants = ['seed/INV-DEVAI-002.json'];
  writeFileSync(packManifestPath, `${JSON.stringify(packManifest, null, 2)}\n`);
  mkdirSync(join(packDir, 'seed'), { recursive: true });
  copyFileSync(
    join(root, 'law/invariants/INV-DEVAI-002.json'),
    join(packDir, 'seed/INV-DEVAI-002.json'),
  );
  const mutationSchema = join(root, 'law/schemas/mutation-scenario.schema.json');
  rmSync(mutationSchema, { force: true });

  const producerRows = [
    executeProducer(
      'spec blueprint diff',
      ['spec', 'blueprint', 'diff', invalidBlueprint, '--against', root],
      root,
      'isolated-valid-blueprint-with-inventory-deltas-review',
      1,
    ),
    executeProducer(
      'policy check dependencies',
      ['policy', 'check', 'dependencies', '--repo-root', root],
      root,
      'isolated-low-and-moderate-advisory-review',
      1,
      7,
      {
        DEVAI_TEST_PNPM_DEPENDENCY_SCAN_FIXTURE: dependencyFixturePath,
        DEVAI_TEST_NPM_DEPENDENCY_SCAN_FIXTURE: dependencyFixturePath,
      },
    ),
    executeProducer(
      'policy check sensor integrity',
      [
        'policy',
        'check',
        'sensor',
        'integrity',
        '--repo-root',
        root,
        '--readings-dir',
        readingsDir,
      ],
      root,
      'isolated-relabeled-reading-review',
      1,
    ),
    executeProducer(
      'docs render mermaid',
      ['docs', 'render', 'mermaid', '--repo-root', root, '--write', '--as-role', 'architect'],
      root,
      'isolated-mermaid-with-absent-executable-boundary',
      1,
    ),
    executeProducer(
      'inventory suggest',
      [
        'inventory',
        'suggest',
        '--from-inventory',
        '--repo-root',
        root,
        '--dry-run',
        '--write',
        '--as-role',
        'owner',
      ],
      root,
      'isolated-unread-inventory-review-with-dry-run',
      1,
    ),
    executeProducer(
      'adopt pack graduate',
      [
        'adopt',
        'pack',
        'graduate',
        '--pack-dir',
        packDir,
        '--target-root',
        root,
        '--dry-run',
        '--write',
        '--as-role',
        'architect',
      ],
      root,
      'isolated-existing-invariant-dry-run-review',
      1,
    ),
    executeProducer(
      'adopt pack resolve',
      ['adopt', 'pack', 'resolve', '--repo-root', root, '--adopter-root', root],
      root,
      'isolated-no-pack-review',
      1,
    ),
    executeProducer(
      'sense run',
      ['sense', 'run', 'security_scan', '--repo-root', root],
      root,
      'isolated-security-scan-failure',
      1,
      6,
    ),
    executeProducer(
      'sense mutation run',
      [
        'sense',
        'mutation',
        'run',
        '--repo-root',
        root,
        '--scenarios',
        producerDir,
        '--write',
        '--as-role',
        'owner',
      ],
      root,
      'isolated-missing-mutation-schema-config-failure',
      65,
    ),
    executeProducer(
      'evidence test record',
      [
        'evidence',
        'test',
        'record',
        '--tier',
        'unit',
        '--cmd',
        'exit 23',
        '--repo-root',
        root,
        '--write',
        '--as-role',
        'auditor',
      ],
      root,
      'isolated-child-process-exit-23',
      23,
    ),
  ];
  const mockedProducerPath = join(producerDir, 'mocked-producers.json');
  const mockedProducerRun = spawnSync(
    'pnpm',
    ['vitest', 'run', 'tests/contract/r0006-output-totality-mocked-producers.contract.test.ts'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...environment, R0006_MOCKED_PRODUCER_PATH: mockedProducerPath },
    },
  );
  if (mockedProducerRun.status !== 0 || !existsSync(mockedProducerPath)) {
    failures.push(
      `mocked producer execution failed: ${mockedProducerRun.stderr || mockedProducerRun.stdout}`,
    );
  } else {
    const mockedRows = JSON.parse(readFileSync(mockedProducerPath, 'utf8'));
    if (Array.isArray(mockedRows)) producerRows.push(...mockedRows);
    else failures.push('mocked producer artifact was not an array');
  }

  const stageEntry = { name: 'catalog actions' };
  const stageRows = [
    'initialization',
    'registry-validation',
    'authorization',
    'routing',
    'handler-dispatch',
  ].map((stage) => {
    let rendered = '';
    const original = process.stderr.write;
    process.stderr.write = (chunk) => {
      rendered += String(chunk);
      return true;
    };
    process.exitCode = undefined;
    const result = runCliStage(stageEntry, stage, () => {
      throw new Error(`R0006_${stage.toUpperCase().replaceAll('-', '_')}_THROW`);
    });
    process.stderr.write = original;
    const parsed = parseSingle(rendered);
    const valid =
      result.ok === false &&
      parsed.ok &&
      validators.actionResult(parsed.value) &&
      parsed.value.action_id === 'catalog actions' &&
      parsed.value.error?.exit === process.exitCode &&
      process.exitCode === 6;
    recordFailure('throw-stage', stage, valid, 'throw escaped or envelope/status mismatch');
    const row = {
      stage,
      invocation_fixture: { strategy: 'production-stage-seam-non-allowlisted-error' },
      machine_result: { status: process.exitCode, stdout: '', stderr: rendered },
      envelope_validation: parsed.ok && validators.actionResult(parsed.value),
      process_error_exit_equality: parsed.ok && parsed.value.error?.exit === process.exitCode,
      disposition: 'EXECUTED_SAFE_FAILURE',
    };
    process.exitCode = undefined;
    return row;
  });

  const expectedPopulation = {
    retained_actions: 147,
    sensor_kinds: 59,
    sensor_list: 1,
    noncanonical_exit_producers: 13,
    non_allowlisted_throw_stages: 5,
  };
  const observedPopulation = {
    retained_actions: actionRows.length,
    unique_retained_actions: new Set(actionRows.map((row) => row.action_id)).size,
    sensor_kinds: sensorRows.length,
    unique_sensor_kinds: new Set(sensorRows.map((row) => row.sensor_kind)).size,
    sensor_list: 1,
    noncanonical_exit_producers: producerRows.length,
    unique_noncanonical_exit_producers: new Set(producerRows.map((row) => row.producer_id)).size,
    non_allowlisted_throw_stages: stageRows.length,
    unique_non_allowlisted_throw_stages: new Set(stageRows.map((row) => row.stage)).size,
  };
  for (const [population, expected] of Object.entries(expectedPopulation)) {
    const observed = observedPopulation[population];
    recordFailure(
      'population',
      population,
      observed === expected,
      `expected ${expected}; observed ${observed}`,
    );
  }
  recordFailure(
    'population',
    'unique_retained_actions',
    observedPopulation.unique_retained_actions === expectedPopulation.retained_actions,
    `expected ${expectedPopulation.retained_actions}; observed ${observedPopulation.unique_retained_actions}`,
  );
  recordFailure(
    'population',
    'unique_sensor_kinds',
    observedPopulation.unique_sensor_kinds === expectedPopulation.sensor_kinds,
    `expected ${expectedPopulation.sensor_kinds}; observed ${observedPopulation.unique_sensor_kinds}`,
  );
  recordFailure(
    'population',
    'unique_noncanonical_exit_producers',
    observedPopulation.unique_noncanonical_exit_producers ===
      expectedPopulation.noncanonical_exit_producers,
    `expected ${expectedPopulation.noncanonical_exit_producers}; observed ${observedPopulation.unique_noncanonical_exit_producers}`,
  );
  recordFailure(
    'population',
    'unique_non_allowlisted_throw_stages',
    observedPopulation.unique_non_allowlisted_throw_stages ===
      expectedPopulation.non_allowlisted_throw_stages,
    `expected ${expectedPopulation.non_allowlisted_throw_stages}; observed ${observedPopulation.unique_non_allowlisted_throw_stages}`,
  );

  artifact = {
    schemaVersion: '1.0.0',
    id: 'R-0006-OUTPUT-TOTALITY-POPULATION',
    round: 'R-0006',
    authority: 'Inspector observation for Auditor adoption',
    implementation_subjects: [
      'a8bec1c66379449c1b3d82879c765fc062cb49a0',
      'f8886676d81e560fc85be3914e7f2e129ebb61c3',
      '3be16cb1dca53a2614ced355f9de35bb1b65f752',
      '2f1a24b4e0f42dd2eacbce1da83ea741b66a2486',
    ],
    environment: {
      CI: true,
      GITHUB_ACTIONS: true,
      ambient_git_identity: false,
      trusted_local_cache: false,
      git_alternates: false,
      external_mutation: false,
    },
    expected_population: expectedPopulation,
    observed_population: observedPopulation,
    actions: actionRows,
    sensors: sensorRows,
    sensor_list: listRow,
    noncanonical_exit_producers: producerRows,
    throw_stages: stageRows,
    failures,
    verdict: failures.length === 0 ? 'PASS' : 'FAIL',
  };
} finally {
  rmSync(root, { recursive: true, force: true });
}

if (outputPath !== undefined) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
}
process.stdout.write(
  `${JSON.stringify({
    verdict: artifact.verdict,
    expected_population: artifact.expected_population,
    observed_population: artifact.observed_population,
    failures: artifact.failures,
  })}\n`,
);
if (artifact.verdict !== 'PASS') process.exitCode = 1;
