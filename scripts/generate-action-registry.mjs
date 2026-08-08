#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { format } from 'prettier';

const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
const root = resolve(rootArgument ?? '.');
const check = process.argv.includes('--check');
const sourceRelative = 'law/policy/action-registry.json';
const marker = '@generated from law/policy/action-registry.json';
const registry = JSON.parse(readFileSync(join(root, sourceRelative), 'utf8'));

function compareUtf8Bytes(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

if (!Array.isArray(registry.entries)) {
  throw new Error('ACTION_REGISTRY_COUNT_GUARD');
}
const actualCounts = { keep: 0, fold: 0, tombstone: 0 };
const dispositionNames = Object.keys(actualCounts);
for (const entry of registry.entries) {
  if (!Object.hasOwn(actualCounts, entry?.disposition)) {
    throw new Error('ACTION_REGISTRY_COUNT_GUARD');
  }
  actualCounts[entry.disposition] += 1;
}
const declaredCounts = registry.counts;
if (
  declaredCounts === null ||
  typeof declaredCounts !== 'object' ||
  Object.keys(declaredCounts).length !== dispositionNames.length ||
  dispositionNames.some(
    (disposition) =>
      !Number.isSafeInteger(declaredCounts[disposition]) ||
      declaredCounts[disposition] < 0 ||
      declaredCounts[disposition] !== actualCounts[disposition],
  ) ||
  dispositionNames.reduce((total, disposition) => total + declaredCounts[disposition], 0) !==
    registry.entries.length
) {
  throw new Error('ACTION_REGISTRY_COUNT_GUARD');
}
const ids = registry.entries.map((entry) => entry.action_id);
if (new Set(ids).size !== ids.length) throw new Error('ACTION_REGISTRY_ID_DUPLICATE');
if ([...ids].sort(compareUtf8Bytes).some((id, index) => id !== ids[index])) {
  throw new Error('ACTION_REGISTRY_ORDER_DRIFT');
}
for (const entry of registry.entries) {
  if (entry.action_id !== entry.path.join(' ')) {
    throw new Error('ACTION_PATH_DRIFT:' + entry.action_id);
  }
  if (
    entry.disposition !== 'keep' &&
    !(typeof entry.migration === 'string' && entry.migration.length > 0)
  ) {
    throw new Error('ACTION_MIGRATION_MISSING:' + entry.action_id);
  }
  const runnable = entry.disposition === 'keep';
  if (
    entry.output_contract?.mode !== (runnable ? 'action-envelope' : 'router-only') ||
    entry.error_contract?.mode !== (runnable ? 'structured-error-envelope' : 'router-only')
  ) {
    throw new Error('ACTION_RESULT_CONTRACT_MISSING:' + entry.action_id);
  }
}

function generatedModule(preamble, valueName, value) {
  return (
    '// ' +
    marker +
    '\n// Do not edit; run node scripts/generate-action-registry.mjs.\n' +
    preamble +
    '\nexport const ' +
    valueName +
    ' = ' +
    JSON.stringify(value, null, 2) +
    ' as const;\n'
  );
}

const cliEntries = registry.entries.map((entry) => ({
  action_id: entry.action_id,
  internal_binding: entry.internal_binding,
  path: entry.path,
  disposition: entry.disposition,
  lifecycle: entry.lifecycle,
  lifecycle_reason: entry.lifecycle_reason,
  migration: entry.migration,
  never_remint: entry.never_remint,
  visibility: entry.visibility,
  tier: entry.tier,
  profiles: entry.profiles,
  effect: entry.effect,
  authority: entry.authority,
  description: entry.description,
  promotion_criteria: entry.promotion_criteria,
  output_contract: entry.output_contract,
  error_contract: entry.error_contract,
  authority_contract_version: entry.authority_contract_version,
  authority_contract: entry.authority_contract,
}));
const effectEntries = registry.entries
  .filter((entry) => entry.disposition === 'keep')
  .map((entry) => ({
    action_id: entry.internal_binding,
    public_action_id: entry.action_id,
    effect: entry.effect,
    capabilities: entry.authority_contract.capabilities,
  }));
const sensorEntries = registry.entries
  .filter((entry) => entry.authority === 'sensor' || entry.disposition === 'fold')
  .map((entry) => ({
    action_id: entry.action_id,
    internal_binding: entry.internal_binding,
    disposition: entry.disposition,
    migration: entry.migration,
    effect: entry.effect,
  }));

const rawOutputs = new Map([
  [
    'packages/cli/src/generated/action-registry.ts',
    generatedModule(
      "import type { RegistryActionRecord } from '../command-manifest.js';",
      'ACTION_REGISTRY',
      cliEntries,
    ) +
      '\nexport const ACTION_REGISTRY_BY_BINDING = new Map<string, RegistryActionRecord>();\n' +
      'for (const entry of ACTION_REGISTRY) {\n' +
      '  const existing = ACTION_REGISTRY_BY_BINDING.get(entry.internal_binding);\n' +
      "  if (existing === undefined || entry.disposition === 'keep') {\n" +
      '    ACTION_REGISTRY_BY_BINDING.set(entry.internal_binding, entry);\n' +
      '  }\n' +
      '}\n',
  ],
  [
    'packages/effects-check/src/generated/action-catalog.ts',
    generatedModule('', 'ACTION_EFFECT_CONTRACTS', effectEntries),
  ],
  [
    'packages/sensors/src/generated/action-kinds.ts',
    generatedModule('', 'SENSOR_ACTION_KINDS', sensorEntries),
  ],
]);

const outputs = new Map(
  await Promise.all(
    [...rawOutputs].map(async ([relative, bytes]) => [
      relative,
      await format(bytes, {
        parser: 'typescript',
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        endOfLine: 'lf',
        arrowParens: 'always',
      }),
    ]),
  ),
);

let stale = false;
for (const [relative, bytes] of outputs) {
  const target = join(root, relative);
  if (check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== bytes) {
      process.stderr.write('generated action view is stale: ' + relative + '\n');
      stale = true;
    }
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}
if (stale) process.exitCode = 1;
else {
  process.stdout.write(
    String(outputs.size) + ' action registry views ' + (check ? 'verified' : 'generated') + '\n',
  );
}
