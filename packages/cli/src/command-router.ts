import type { RegistryEntry } from './define-command.js';
import {
  ARCHIVED_SENSOR_KINDS,
  SENSOR_READING_KINDS,
  isArchivedSensorKind,
  isSensorKind,
} from '@devai-nyx/sensors';
import { cliError, renderCliError } from './cli-error.js';

export const EXIT_USAGE = 2;

const SENSOR_INTERNAL_COMMAND: Readonly<Record<string, readonly string[]>> = {
  action_effect_inference: ['check-action-effects'],
  archive_immutability: ['sense-archive-immutability'],
  build: ['sense-build'],
  decision_citation_resolution: ['sense-decision-citation-resolution'],
  decision_record_integrity: ['sense-decision-record-integrity'],
  docs_drift: ['sense-docs-drift'],
  e2e_test: ['sense-test', 'e2e'],
  harness_coherence: ['sense-harness-coherence'],
  harness_coverage: ['sense-harness-coverage'],
  harness_depth: ['sense-harness-depth'],
  harness_green_main: ['sense-harness-green-main'],
  harness_idiomaticity: ['sense-harness-idiomaticity'],
  harness_invariant_alignment: ['sense-harness-invariant-alignment'],
  harness_performance: ['sense-harness-performance'],
  harness_robustness: ['sense-harness-robustness'],
  harness_security: ['sense-harness-security'],
  integration_test: ['sense-test', 'integration'],
  inventory_adherence: ['sense-inventory-adherence'],
  inventory_api: ['sense-api'],
  inventory_coverage: ['sense-coverage'],
  inventory_data_handling: ['sense-data-handling'],
  inventory_data_model: ['sense-data-model'],
  inventory_dep_graph: ['sense-dep-graph'],
  inventory_determinism: ['sense-inventory-determinism'],
  inventory_performance: ['sense-inventory-performance'],
  inventory_rbac: ['sense-rbac'],
  inventory_regeneration: ['sense-readings-rebuild'],
  inventory_routes: ['sense-routes'],
  lint: ['sense-lint'],
  llm_judge: ['sense-judge'],
  migration_check: ['sense-migrate-check'],
  perf_test: ['sense-perf-test'],
  plant_coherence: ['sense-plant-coherence'],
  plant_coverage: ['sense-plant-coverage'],
  plant_depth: ['sense-plant-depth'],
  round_record_integrity: ['sense-round-record-integrity'],
  runtime_probe_api: ['sense-runtime-api'],
  runtime_probe_auth: ['sense-runtime-auth'],
  runtime_probe_data: ['sense-runtime-data'],
  security_scan: ['sense-security-scan'],
  site_drift: ['sense-site-drift'],
  spec_alignment: ['sense-spec-alignment'],
  spec_depth: ['sense-spec-depth'],
  spec_freshness: ['sense-spec-freshness'],
  spec_idiomaticity: ['sense-spec-idiomaticity'],
  spec_performance_targets: ['sense-spec-performance-targets'],
  spec_robustness_targets: ['sense-spec-robustness-targets'],
  spec_security_coverage: ['sense-spec-security-coverage'],
  test_coherence: ['sense-test-coherence'],
  test_coverage_depth: ['sense-test-coverage-depth'],
  test_idiomaticity: ['sense-test-idiomaticity'],
  test_invariant_alignment: ['sense-test-invariant-alignment'],
  test_performance_coverage: ['sense-test-performance-coverage'],
  test_robustness_coverage: ['sense-test-robustness-coverage'],
  test_security_coverage: ['sense-test-security-coverage'],
  test_weakening_review: ['sense-test-weakening'],
  trace_resolution: ['sense-trace-resolve'],
  type_check: ['sense-type-check'],
  unit_test: ['sense-test', 'unit'],
};

function wantsJson(args: readonly string[]): boolean {
  const format = args.lastIndexOf('--format');
  return args.includes('--json') || (format >= 0 && args[format + 1] === 'json');
}

const DOMAIN_SUMMARIES: Readonly<Record<string, string>> = {
  adopt: 'Install and evolve DEVAI adoption infrastructure.',
  agent: 'Inspect and invoke bounded skills, prompts, and LLM bridges.',
  catalog: 'Inspect the live action catalog.',
  docs: 'Generate, validate, synthesize, render, and publish documentation.',
  evidence: 'Record, render, redact, and verify audit evidence.',
  experimental: 'Explicitly opted-in non-production capabilities.',
  govern: 'Score, triage, resolve gaps, and close governance rounds.',
  inventory: 'Derive deterministic repository inventories.',
  policy: 'Run policy-firewall checks.',
  release: 'Evaluate and observe release readiness.',
  sense: 'Observe repository and runtime state through sensors.',
  spec: 'Authoring support and validation for the reference signal.',
  work: 'Supervised backlog, task, worktree, lock, DB, and state operations.',
};

function startsWithPath(path: readonly string[], prefix: readonly string[]): boolean {
  return prefix.every((part, index) => path[index] === part);
}

function renderRows(rows: ReadonlyArray<readonly [string, string]>): string[] {
  const width = Math.min(32, Math.max(...rows.map(([name]) => name.length), 0));
  return rows.map(([name, description]) => `  ${name.padEnd(width)}  ${description}`);
}

export function renderHelp(
  entries: readonly RegistryEntry[],
  version: string,
  prefix: readonly string[] = [],
  includeAll = false,
): string {
  const visible = entries.filter(
    (entry) =>
      entry.lifecycle !== 'retired' &&
      startsWithPath(entry.path, prefix) &&
      (includeAll || entry.tier === 'porcelain' || entry.path.length === prefix.length),
  );
  const lines = [`devai/${version}`, ''];
  lines.push(`Usage: devai${prefix.length > 0 ? ` ${prefix.join(' ')}` : ''} <command> [options]`);
  lines.push('');
  if (prefix.length === 0) {
    lines.push('Common:');
    lines.push(
      ...renderRows([
        ['init', 'Adopt DEVAI in a repository.'],
        ['doctor', 'Diagnose the declared adoption posture.'],
        ['sense', DOMAIN_SUMMARIES.sense ?? ''],
        ['spec', DOMAIN_SUMMARIES.spec ?? ''],
        ['evidence', DOMAIN_SUMMARIES.evidence ?? ''],
      ]),
    );
    lines.push('');
    lines.push('Domains:');
    const domains = Array.from(
      new Set<string>(
        visible
          .map((entry) => entry.path[0])
          .filter((domain): domain is string => domain !== undefined),
      ),
    )
      .filter((domain) => domain !== 'init' && domain !== 'doctor' && domain !== 'experimental')
      .sort();
    lines.push(
      ...renderRows(
        domains.map((domain) => [domain, DOMAIN_SUMMARIES[domain] ?? 'DEVAI command domain.']),
      ),
    );
    if (visible.some((entry) => entry.path[0] === 'experimental')) {
      lines.push('');
      lines.push('Experimental:');
      lines.push(...renderRows([['experimental', DOMAIN_SUMMARIES.experimental ?? '']]));
    }
  } else {
    const exact = visible.find((entry) => entry.path.length === prefix.length);
    if (exact !== undefined) {
      lines[2] = `Usage: devai ${exact.name}${exact.runtime_args === undefined || exact.runtime_args.length === 0 ? '' : ` ${exact.runtime_args}`} [options]`;
      lines.push(exact.description);
      lines.push('');
      lines.push(`Lifecycle: ${exact.lifecycle}`);
      lines.push(`Authority: ${exact.authority}`);
      lines.push(`Effects: ${exact.effects}`);
      if ((exact.runtime_options?.length ?? 0) > 0) {
        lines.push('');
        lines.push('Options:');
        lines.push(
          ...renderRows(
            (exact.runtime_options ?? []).map((option) => [option.flags, option.description]),
          ),
        );
      }
    }
    const children = new Map<string, string>();
    for (const entry of visible) {
      const child = entry.path[prefix.length];
      if (child === undefined) continue;
      const isLeaf = entry.path.length === prefix.length + 1;
      children.set(
        child,
        isLeaf
          ? entry.description
          : prefix.length === 0
            ? (DOMAIN_SUMMARIES[child] ?? `${child} commands.`)
            : `${child} commands.`,
      );
    }
    if (children.size > 0) {
      lines.push('Commands:');
      lines.push(
        ...renderRows(Array.from(children.entries()).sort(([a], [b]) => a.localeCompare(b))),
      );
    }
  }
  lines.push('');
  if (prefix.length === 0 || visible.every((entry) => entry.path.length !== prefix.length)) {
    lines.push('Options:');
    lines.push('  --help       Show help for this command path.');
    lines.push('  --all        Include plumbing commands in help.');
    lines.push('  --help-all   Compatibility spelling for --all.');
    lines.push('  --version    Show the DEVAI CLI version.');
  }
  lines.push('');
  return lines.join('\n');
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j] ?? 0;
      row[j] = Math.min(
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = saved;
    }
  }
  return row[b.length] ?? Math.max(a.length, b.length);
}

function suggestion(
  input: readonly string[],
  entries: readonly RegistryEntry[],
): string | undefined {
  const wanted = input.join(' ');
  return entries
    .map((entry) => entry.path.join(' '))
    .sort((a, b) => distance(wanted, a) - distance(wanted, b))[0];
}

export type RouteResult =
  | { readonly kind: 'dispatch'; readonly argv: string[] }
  | { readonly kind: 'output'; readonly text: string; readonly exitCode: number };

export function invocationIsNonMutating(internalName: string, args: readonly string[]): boolean {
  if (args.includes('--check')) return true;
  if (internalName === 'mutation-verify' && !args.includes('--save-baseline')) return true;
  return (
    ['init', 'adopt', 'upgrade', 'ci-scaffold', 'hooks-install', 'state-prune'].includes(
      internalName,
    ) && !args.includes('--write')
  );
}

export function routeArgv(
  argv: readonly string[],
  entries: readonly RegistryEntry[],
  version: string,
): RouteResult {
  const args = argv.slice(2);
  if (args[0] === 'sense' && args[1] === 'run' && args.includes('--list')) {
    return {
      kind: 'output',
      text: `${JSON.stringify({
        schemaVersion: '1.0.0',
        count: SENSOR_READING_KINDS.length,
        kinds: SENSOR_READING_KINDS,
      })}\n`,
      exitCode: 0,
    };
  }
  if (
    args[0] === 'sense' &&
    args[1] === 'run' &&
    args[2] !== undefined &&
    !args[2].startsWith('-')
  ) {
    const kind = args[2];
    if (isSensorKind(kind)) {
      const internal = SENSOR_INTERNAL_COMMAND[kind];
      if (internal === undefined) {
        const error = cliError({
          code: 'SENSOR_REGISTRY_DIVERGENCE',
          class: 'contract-violation',
          exit: 7,
          message: `Registered sensor kind '${kind}' has no CLI emitter binding.`,
          remediation: 'Run devai policy check sensor integrity.',
          refs: { record: 'DII-103' },
          context: { kind },
        });
        return { kind: 'output', text: renderCliError(error, wantsJson(args)), exitCode: 7 };
      }
      const remaining = args.slice(3).filter((arg) => arg !== '--json');
      return {
        kind: 'dispatch',
        argv: [...argv.slice(0, 2), ...internal, ...remaining],
      };
    }
    const archived = isArchivedSensorKind(kind);
    const disposition = ARCHIVED_SENSOR_KINDS.find((entry) => entry.kind === kind);
    const error = cliError({
      code: archived ? 'SENSOR_KIND_RETIRED' : 'SENSOR_KIND_UNKNOWN',
      class: 'routing-authority',
      exit: 2,
      message: archived
        ? `Sensor kind '${kind}' is retired.`
        : `Sensor kind '${kind}' is not registered.`,
      remediation:
        disposition?.replacement === null || disposition === undefined
          ? 'Run devai sense run --list.'
          : `Use devai sense run ${disposition.replacement}.`,
      refs: { record: 'DII-103' },
      context: { kind },
    });
    return { kind: 'output', text: renderCliError(error, wantsJson(args)), exitCode: 2 };
  }
  if (args[0] === 'work' && args[1] === 'backlog' && args[2] === 'compact') {
    const error = cliError({
      code: 'ACTION_RETIRED',
      class: 'routing-authority',
      exit: 2,
      message: "Action 'work backlog compact' is retired.",
      remediation: 'Use devai work backlog list.',
      refs: { record: 'DII-104' },
      context: { action: 'work backlog compact', successor: 'work backlog list' },
    });
    return { kind: 'output', text: renderCliError(error, wantsJson(args)), exitCode: 2 };
  }
  if (args[0] === 'policy' && args[1] === 'check' && args[2] === 'schemas') {
    return {
      kind: 'dispatch',
      argv: [...argv.slice(0, 2), 'check-schemas', ...args.slice(3)],
    };
  }
  const obsoleteFlag = args.find((arg) => ['--execute', '--apply', '--human'].includes(arg));
  if (obsoleteFlag !== undefined) {
    const replacement = obsoleteFlag === '--human' ? '--format human' : '--write';
    return {
      kind: 'output',
      text: `devai: ${obsoleteFlag} is not part of the 0.5 public contract; use ${replacement}\n`,
      exitCode: EXIT_USAGE,
    };
  }
  if (
    args.length === 0 ||
    args[0] === '--help' ||
    args[0] === '-h' ||
    args[0] === '--all' ||
    args[0] === '--help-all'
  ) {
    return {
      kind: 'output',
      text: renderHelp(entries, version, [], args.includes('--all') || args.includes('--help-all')),
      exitCode: 0,
    };
  }
  if (args[0] === '--version' || args[0] === '-v') return { kind: 'dispatch', argv: [...argv] };

  const optionIndex = args.findIndex((arg) => arg.startsWith('-'));
  const words = args.slice(0, optionIndex < 0 ? args.length : optionIndex);
  const exact = entries
    .filter((entry) => startsWithPath(words, entry.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (exact !== undefined) {
    let remaining = args.slice(exact.path.length);
    const formatIndex = remaining.lastIndexOf('--format');
    if (formatIndex >= 0) {
      const format = remaining[formatIndex + 1];
      if (format === 'json' || format === 'human') {
        remaining = remaining.filter(
          (_, index) => index !== formatIndex && index !== formatIndex + 1,
        );
      }
      if (format === 'human') {
        const supportsHuman = exact.runtime_supports_human === true;
        if (!supportsHuman) {
          return {
            kind: 'output',
            text: `devai ${exact.name}: human output is not available for this action\n`,
            exitCode: EXIT_USAGE,
          };
        }
        remaining = [...remaining, '--human'];
      }
    }
    const wantsHelp =
      remaining.includes('--help') ||
      remaining.includes('-h') ||
      remaining.includes('--all') ||
      remaining.includes('--help-all');
    if (wantsHelp) {
      return {
        kind: 'output',
        text: renderHelp(
          entries,
          version,
          exact.path,
          remaining.includes('--all') || remaining.includes('--help-all'),
        ),
        exitCode: 0,
      };
    }
    if (!wantsHelp) {
      if (
        exact.effects === 'local-write' &&
        !remaining.includes('--write') &&
        !invocationIsNonMutating(exact.internal_name, remaining)
      ) {
        return {
          kind: 'output',
          text: `devai ${exact.name}: local mutation requires --write\n`,
          exitCode: EXIT_USAGE,
        };
      }
      if (
        exact.effects === 'remote-write' &&
        !remaining.includes('--dry-run') &&
        !invocationIsNonMutating(exact.internal_name, remaining) &&
        (!remaining.includes('--write') || !remaining.includes('--allow-publish'))
      ) {
        return {
          kind: 'output',
          text: `devai ${exact.name}: remote mutation requires --write --allow-publish\n`,
          exitCode: EXIT_USAGE,
        };
      }
    }
    let translated = remaining;
    if (exact.internal_name !== 'skill-run' && exact.internal_name !== 'loop-run') {
      translated = translated.filter((arg) => arg !== '--write' && arg !== '--allow-publish');
    }
    if (
      ['init', 'adopt', 'upgrade', 'ci-scaffold', 'hooks-install'].includes(exact.internal_name) &&
      remaining.includes('--write')
    ) {
      translated = [...translated, '--execute'];
    }
    if (exact.internal_name === 'state-prune' && remaining.includes('--write'))
      translated = [...translated, '--apply'];
    return {
      kind: 'dispatch',
      argv: [...argv.slice(0, 2), exact.internal_name, ...translated],
    };
  }

  const prefixMatches = entries.filter((entry) => startsWithPath(entry.path, words));
  if (prefixMatches.length > 0) {
    // R17.C.2 (D-131): a bare valid domain/group path renders that node's
    // help exactly as `--help` would, instead of falling through to the
    // unknown-command suggester. Fail-closed exit 2 remains reserved for
    // paths that match nothing.
    return {
      kind: 'output',
      text: renderHelp(
        entries,
        version,
        words,
        args.includes('--all') || args.includes('--help-all'),
      ),
      exitCode: 0,
    };
  }
  const maybe = suggestion(words, entries);
  const error = cliError({
    code: 'ROUTE_UNKNOWN',
    class: 'routing-authority',
    exit: 2,
    message: `Unknown or incomplete command '${words.join(' ')}'.`,
    remediation: maybe === undefined ? 'Run devai --help.' : `Did you mean 'devai ${maybe}'?`,
    refs: { doc: 'docs/reference/cli/' },
    context: { argv: words },
  });
  return {
    kind: 'output',
    text: renderCliError(error, wantsJson(args)),
    exitCode: EXIT_USAGE,
  };
}
