// R-0007 B1 Inspector red contract.
// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-020
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderHelp, routeArgv } from '../../packages/cli/src/command-router.js';
import type { RegistryEntry } from '../../packages/cli/src/define-command.js';

const ROOT = resolve(import.meta.dirname, '../..');
const MIGRATION_MAP = 'work/rounds/R-0007/inventory/old-to-new-command-map.md';
const REGISTRY = 'law/policy/action-registry.json';

// Derived at the exact admitted B1 base, ed40ea5a73d7e2168c48aa8eb6f789724d42fec3.
// These digests freeze identities and row guidance, not a guessed numeric population.
const LIVE_OLD_ACTIONS_SHA256 = 'decf1541ae3a1d43b3c410d527e7d987b862c5fd7525ccd0dade0b63647ea87f';
const LIVE_MIGRATION_MAP_SHA256 =
  '717871edd7ac72155c1ad56bad6dbcf2088c47d9ce99445ff43db451da13f081';

const DEFAULT_DOMAINS = ['check', 'doctor', 'evidence', 'init', 'release', 'round', 'sense'];
const HIDDEN_DOMAINS = ['catalog', 'task'];
const TARGET_DOMAINS = new Set([...DEFAULT_DOMAINS, ...HIDDEN_DOMAINS]);

type Disposition = 'keep' | 'fold' | 'tombstone';

interface ActionEntry {
  readonly action_id: string;
  readonly internal_binding: string;
  readonly path: readonly string[];
  readonly disposition: Disposition;
  readonly lifecycle: 'supported' | 'experimental' | 'retired';
  readonly migration: string | null;
  readonly visibility: 'common' | 'standard' | 'advanced' | 'maintainer';
  readonly tier: 'porcelain' | 'plumbing';
  readonly profiles: readonly ('tier1' | 'tier2' | 'tier3')[];
  readonly effect: 'read' | 'harness-write' | 'local-write' | 'remote-write';
  readonly authority: RegistryEntry['authority'] | null;
  readonly description: string;
  readonly authority_contract_version: '1.0.0';
  readonly authority_contract: RegistryEntry['authority_contract'];
  readonly output_contract: RegistryEntry['output_contract'];
  readonly error_contract: RegistryEntry['error_contract'];
}

interface MigrationRow {
  readonly oldAction: string;
  readonly rawMigration: string;
  readonly guidance: string;
}

const registry = JSON.parse(readFileSync(resolve(ROOT, REGISTRY), 'utf8')) as {
  readonly entries: readonly ActionEntry[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function parseMigrationRows(): readonly MigrationRow[] {
  const source = readFileSync(resolve(ROOT, MIGRATION_MAP), 'utf8').split(
    '## Global vocabulary and consent migration',
  )[0];
  if (source === undefined) throw new Error('R7_B1_MIGRATION_COMMAND_SECTION_MISSING');

  const rows: MigrationRow[] = [];
  for (const line of source.split('\n')) {
    const match = line.match(/^\| `([^`]+)`\s+\|\s*(.+?)\s*\|\s*$/u);
    if (match?.[1] === undefined || match[2] === undefined) continue;
    const rawMigration = match[2].trim().replace(/\s+/gu, ' ');
    rows.push({
      oldAction: match[1],
      rawMigration,
      guidance: rawMigration.replaceAll('**', '').replaceAll('`', ''),
    });
  }
  return rows;
}

const migrationRows = parseMigrationRows();

function successorActionIds(rows: readonly MigrationRow[]): readonly string[] {
  const actions = new Set<string>();
  for (const row of rows) {
    if (/^retained\b/u.test(row.guidance)) actions.add(row.oldAction);
    for (const match of row.rawMigration.matchAll(/`([^`]+)`/gu)) {
      const phrase = match[1];
      if (phrase === undefined) continue;
      const words = phrase.trim().split(/\s+/u);
      const domain = words[0];
      if (domain === undefined || !TARGET_DOMAINS.has(domain)) continue;
      let end = words.findIndex(
        (word, index) => index > 0 && (word.startsWith('--') || word.startsWith('<')),
      );
      if (end < 0) end = words.length;
      // The adopted grammar has one parameterized action, `sense run <kind>`;
      // sensor kinds are registry values and must not become action identities.
      if (domain === 'sense' && words[1] === 'run') end = Math.min(end, 2);
      actions.add(words.slice(0, end).join(' '));
    }
  }
  return [...actions].sort(compareUtf8);
}

const targetActionIds = successorActionIds(migrationRows);
const targetActionSet = new Set(targetActionIds);

function expectedDisposition(row: MigrationRow): Disposition {
  if (targetActionSet.has(row.oldAction)) return 'keep';
  return row.rawMigration.includes('**REMOVED**') ? 'tombstone' : 'fold';
}

function asRuntimeEntries(entries: readonly ActionEntry[]): readonly RegistryEntry[] {
  return entries.map(
    (entry) =>
      ({
        name: entry.action_id,
        previous_name: entry.internal_binding,
        internal_name: entry.internal_binding.replaceAll(' ', '-'),
        path: entry.path,
        disposition: entry.disposition,
        lifecycle: entry.lifecycle,
        lifecycle_reason: 'canonical registry fixture',
        migration: entry.migration,
        visibility: entry.visibility,
        tier: entry.tier,
        profiles: entry.profiles,
        effects: entry.effect,
        authority: entry.authority ?? 'mesh_controller',
        description: entry.description,
        promotion_criteria: [],
        authority_contract_version: entry.authority_contract_version,
        authority_contract: entry.authority_contract,
        output_contract: entry.output_contract,
        error_contract: entry.error_contract,
      }) satisfies RegistryEntry,
  );
}

function helpDomains(help: string): readonly string[] {
  const domains = new Set<string>();
  let inCommandSection = false;
  for (const line of help.split('\n')) {
    if (['Common:', 'Domains:', 'Experimental:'].includes(line)) {
      inCommandSection = true;
      continue;
    }
    if (/^[A-Z][A-Za-z-]+:$/u.test(line)) {
      inCommandSection = false;
      continue;
    }
    if (!inCommandSection) continue;
    const match = line.match(/^\s{2}([a-z][a-z0-9-]*)\s{2,}/u);
    if (match?.[1] !== undefined) domains.add(match[1]);
  }
  return [...domains].sort(compareUtf8);
}

function remediationFrom(text: string): string | undefined {
  try {
    const error = JSON.parse(text) as { readonly remediation?: string };
    return error.remediation;
  } catch {
    return text.match(/ Remediation: (.+)\n$/u)?.[1];
  }
}

function migrationRefusalViolation(
  args: readonly string[],
  remediation: string,
): string | undefined {
  const result = routeArgv(
    ['node', 'devai', ...args, '--json'],
    asRuntimeEntries(registry.entries.filter((entry) => entry.disposition === 'keep')),
    '1.0.0-red',
  );
  const invocation = `devai ${args.join(' ')}`;
  if (result.kind !== 'output') return `${invocation}:dispatched`;
  if (result.exitCode !== 2) return `${invocation}:exit=${String(result.exitCode)}`;
  const observed = remediationFrom(result.text);
  return observed === remediation
    ? undefined
    : `${invocation}:remediation=${JSON.stringify(observed)}:expected=${JSON.stringify(remediation)}`;
}

describe('R-0007 B1 surface and migration red contracts', () => {
  it('R7-B1-SURFACE-001 freezes the exact admitted old-action and migration-row populations', () => {
    const duplicateRows = migrationRows
      .map((row) => row.oldAction)
      .filter((action, index, all) => all.indexOf(action) !== index);
    expect(duplicateRows).toEqual([]);

    const sortedRows = [...migrationRows].sort((left, right) =>
      compareUtf8(left.oldAction, right.oldAction),
    );
    expect(sha256(sortedRows.map((row) => row.oldAction).join('\n'))).toBe(LIVE_OLD_ACTIONS_SHA256);
    expect(
      sha256(sortedRows.map((row) => `${row.oldAction}\0${row.rawMigration}`).join('\n')),
    ).toBe(LIVE_MIGRATION_MAP_SHA256);

    const registryMultiplicity = migrationRows
      .map((row) => ({
        action: row.oldAction,
        matches: registry.entries.filter((entry) => entry.action_id === row.oldAction).length,
      }))
      .filter(({ matches }) => matches !== 1);
    expect(registryMultiplicity).toEqual([]);
  });

  it('R7-B1-SURFACE-002 makes the live kept action population exactly the map-derived successor population', () => {
    const actual = registry.entries
      .filter((entry) => entry.disposition === 'keep')
      .map((entry) => entry.action_id)
      .sort(compareUtf8);
    expect({
      missing: targetActionIds.filter((action) => !actual.includes(action)),
      unexpected: actual.filter((action) => !targetActionSet.has(action)),
    }).toEqual({ missing: [], unexpected: [] });
    expect(actual).toEqual(targetActionIds);
  });

  it('R7-B1-SURFACE-003 accounts for every old route with its exact disposition and map guidance', () => {
    const drift: string[] = [];
    for (const row of migrationRows) {
      const entry = registry.entries.find((candidate) => candidate.action_id === row.oldAction);
      if (entry === undefined) {
        drift.push(`${row.oldAction}:missing`);
        continue;
      }
      const disposition = expectedDisposition(row);
      if (entry.disposition !== disposition) {
        drift.push(`${row.oldAction}:disposition=${entry.disposition}:expected=${disposition}`);
      }
      const migration = disposition === 'keep' ? null : row.guidance;
      if (entry.migration !== migration) {
        drift.push(
          `${row.oldAction}:migration=${JSON.stringify(entry.migration)}:expected=${JSON.stringify(migration)}`,
        );
      }
    }
    expect(drift).toEqual([]);
  });

  it('R7-B1-SURFACE-004 shows exactly seven default domains and only two expanded plumbing domains', () => {
    const runtime = asRuntimeEntries(
      registry.entries.filter((entry) => entry.disposition === 'keep'),
    );
    const defaultDomains = helpDomains(renderHelp(runtime, '1.0.0-red'));
    const expandedDomains = helpDomains(renderHelp(runtime, '1.0.0-red', [], true));
    expect({ defaultDomains, expandedDomains }).toEqual({
      defaultDomains: DEFAULT_DOMAINS,
      expandedDomains: [...DEFAULT_DOMAINS, ...HIDDEN_DOMAINS].sort(compareUtf8),
    });
  });

  it('R7-B1-SURFACE-005 keeps task and catalog plumbing out of default help but reachable in expanded help', () => {
    const kept = registry.entries.filter((entry) => entry.disposition === 'keep');
    const runtime = asRuntimeEntries(kept);
    const defaultDomains = helpDomains(renderHelp(runtime, '1.0.0-red'));
    const expandedDomains = helpDomains(renderHelp(runtime, '1.0.0-red', [], true));
    const violations: string[] = [];
    for (const domain of HIDDEN_DOMAINS) {
      const entries = kept.filter((entry) => entry.path[0] === domain);
      if (entries.length === 0) violations.push(`${domain}:live-plumbing-missing`);
      if (!entries.every((entry) => entry.tier === 'plumbing')) {
        violations.push(`${domain}:non-plumbing-entry`);
      }
      if (defaultDomains.includes(domain)) violations.push(`${domain}:visible-by-default`);
      if (!expandedDomains.includes(domain)) violations.push(`${domain}:absent-from-expanded-help`);
      const domainHelp = routeArgv(['node', 'devai', domain, '--help-all'], runtime, '1.0.0-red');
      if (
        domainHelp.kind !== 'output' ||
        domainHelp.exitCode !== 0 ||
        !domainHelp.text.includes(`Usage: devai ${domain}`)
      ) {
        violations.push(`${domain}:expanded-domain-help-unreachable`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('R7-B1-SURFACE-006 rejects both f5 route spellings with exact harness guidance', () => {
    const violations = [
      migrationRefusalViolation(['init', 'apply-f5'], 'Use devai init apply harness.'),
      migrationRefusalViolation(['init', 'apply', 'f5'], 'Use devai init apply harness.'),
    ].filter((violation): violation is string => violation !== undefined);
    expect(violations).toEqual([]);
  });

  it('R7-B1-SURFACE-007 rejects --allow-publish with exact --write --publish guidance', () => {
    expect(
      migrationRefusalViolation(
        ['release', 'publish', 'docs', '--write', '--allow-publish'],
        'Use --publish with --write.',
      ),
    ).toBeUndefined();
  });

  it('R7-B1-SURFACE-008 rejects every check --profile spelling with exact --suite guidance', () => {
    const violations = ['quick', 'standard', 'full', 'release']
      .map((suite) =>
        migrationRefusalViolation(['check', '--profile', suite], `Use --suite ${suite}.`),
      )
      .filter((violation): violation is string => violation !== undefined);
    expect(violations).toEqual([]);
  });

  it('R7-B1-SURFACE-009 rejects every sense --set spelling with its exact --preset guidance', () => {
    const violations = (
      [
        ['baseline', 'baseline'],
        ['tier1', 'baseline'],
        ['tier2', 'structural'],
        ['tier3', 'governed'],
        ['all', 'governed'],
        ['sweep', 'sweep --round R-NNNN'],
      ] as const
    )
      .map(([oldSet, replacement]) =>
        migrationRefusalViolation(
          ['sense', 'run', '--set', oldSet],
          `Use --preset ${replacement}.`,
        ),
      )
      .filter((violation): violation is string => violation !== undefined);
    expect(violations).toEqual([]);
  });

  it('R7-B1-SURFACE-010 refuses every map-folded or tombstoned old route before dispatch', () => {
    const runtime = asRuntimeEntries(
      registry.entries.filter((entry) => entry.disposition === 'keep'),
    );
    const violations: string[] = [];
    for (const row of migrationRows.filter(
      (candidate) => expectedDisposition(candidate) !== 'keep',
    )) {
      const result = routeArgv(
        ['node', 'devai', ...row.oldAction.split(' ')],
        runtime,
        '1.0.0-red',
      );
      if (result.kind === 'dispatch') {
        violations.push(`${row.oldAction}:dispatched`);
      } else if (result.exitCode !== 2) {
        violations.push(`${row.oldAction}:exit=${String(result.exitCode)}`);
      } else if (!result.text.includes(row.guidance)) {
        violations.push(`${row.oldAction}:missing-guidance=${JSON.stringify(row.guidance)}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('R7-B1-SURFACE-011 makes the router itself non-dispatching for canonical folds and tombstones', () => {
    const runtime = asRuntimeEntries(registry.entries);
    const violations = registry.entries
      .filter((entry) => entry.disposition !== 'keep')
      .map((entry) => ({
        entry,
        result: routeArgv(['node', 'devai', ...entry.path], runtime, '1.0.0-red'),
      }))
      .filter(({ result }) => result.kind === 'dispatch')
      .map(({ entry }) => `${entry.disposition}:${entry.action_id}`);
    expect(violations).toEqual([]);
  });
});
