import { existsSync, mkdirSync, readFileSync, writeFileSync } from '@devai-nyx/authority';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import type { CAC } from 'cac';
import {
  appendVerbEvidence,
  buildCiScaffoldPlan,
  buildBootstrapPlan,
  buildConstitutionBindingPlan,
  buildHooksInstallPlan,
  buildUpgradePlan,
  executeCiScaffoldPlan,
  executeBootstrapPlan,
  executeHooksInstallPlan,
  introspectRepo,
  isAdoptionProfile,
  HOOK_NAMES,
  readProfile,
  resolveCanonicalConstitution,
  type CiScaffoldMode,
  type HookName,
  upgradeChecklist,
  verifyConstitutionBinding,
} from '#core-compat';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { executeAuthorityPolicyMaterialization } from '../../authority/command-capabilities.js';
import { resolveCliVersion } from '../../version.js';

const DEFAULT_REPO_ROOT = '.';

function materializeSelfVersionPin(targetRoot: string): {
  path: string;
  constitution_version: string;
  devai_version: string;
} | null {
  const absoluteRoot = resolve(targetRoot);
  const constitutionPath = join(absoluteRoot, 'law/constitution.md');
  if (!existsSync(constitutionPath)) return null;
  const path = '.devai/pin/versions.json';
  const target = join(absoluteRoot, path);
  if (!existsSync(target)) return null;
  const constitution = readFileSync(constitutionPath, 'utf8');
  const constitutionVersion = /^\*\*Version:\*\*\s+([^\s]+)$/m.exec(constitution)?.[1];
  if (constitutionVersion === undefined) {
    throw new Error('canonical self Constitution has no **Version:** binding');
  }
  const devaiVersion = resolveCliVersion();
  writeFileSync(
    target,
    `${JSON.stringify(
      {
        devai_version: devaiVersion,
        constitution_version: constitutionVersion,
        _status: 'active materialization',
      },
      null,
      2,
    )}\n`,
  );
  return { path, constitution_version: constitutionVersion, devai_version: devaiVersion };
}

function emit(json: unknown, human: boolean, humanText: string): void {
  if (human) process.stdout.write(humanText.endsWith('\n') ? humanText : humanText + '\n');
  else process.stdout.write(JSON.stringify(json) + '\n');
}

interface InitOptions {
  readonly target?: string;
  readonly force?: boolean;
  readonly stampVersion?: string;
  readonly introspect?: boolean;
  readonly tier?: string;
  readonly include?: string;
  readonly hook?: string;
  readonly command?: string;
  readonly output?: string;
  readonly devaiRef?: string;
  readonly mode?: string;
  readonly chainFile?: string;
  readonly human?: boolean;
}

type InitSegment = 'owner' | 'architect' | 'harness';
type InitInclude = 'ci' | 'hooks';
const CI_SCAFFOLD_MODES: readonly CiScaffoldMode[] = ['gate', 'verify'];

function validateInitTier(options: InitOptions): void {
  if (options.tier !== undefined && !isAdoptionProfile(options.tier)) {
    process.stderr.write(
      `devai init: --tier must be one of tier1 | tier2 | tier3 (got '${options.tier}')\n`,
    );
    process.exit(EXIT_USAGE);
  }
}

function initPlanFor(options: InitOptions) {
  const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
  return buildBootstrapPlan({
    targetRoot,
    version: options.stampVersion ?? resolveCliVersion(),
    ...(options.tier !== undefined && isAdoptionProfile(options.tier) && { profile: options.tier }),
  });
}

function inspectForInit(options: InitOptions) {
  if (options.introspect !== true) return null;
  const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
  const introspection = introspectRepo({ targetRoot: resolve(targetRoot) });
  if (!validators.repoIntrospection(introspection)) {
    process.stderr.write(
      `devai init --introspect: introspection failed schema validation: ${JSON.stringify(validators.repoIntrospection.errors)}\n`,
    );
    process.exit(EXIT_FAIL);
  }
  return introspection;
}

function segmentedPlan(plan: ReturnType<typeof buildBootstrapPlan>, segment: InitSegment) {
  const entries = plan.entries.filter((entry) => {
    if (segment === 'owner') {
      return entry.path.startsWith('product/') || entry.path.startsWith('law/glossary/');
    }
    if (segment === 'architect') {
      return (
        entry.path.startsWith('docs/') ||
        entry.path.startsWith('work/') ||
        (entry.path.startsWith('law/') && !entry.path.startsWith('law/glossary/'))
      );
    }
    return (
      !entry.path.startsWith('product/') &&
      !entry.path.startsWith('docs/') &&
      !entry.path.startsWith('work/') &&
      !entry.path.startsWith('law/')
    );
  });
  return {
    ...plan,
    entries,
    summary: {
      create: entries.filter((entry) => entry.action === 'create').length,
      overwrite: entries.filter((entry) => entry.action === 'overwrite').length,
      skip: entries.filter((entry) => entry.action === 'skip-exists').length,
    },
  };
}

function canonicalInitPlanFor(options: InitOptions) {
  const plan = initPlanFor(options);
  const segments = (['owner', 'architect', 'harness'] as const).map((segment) => {
    const projection = segmentedPlan(plan, segment);
    return { segment, entries: projection.entries, summary: projection.summary };
  });
  const partition = segments.flatMap(({ entries }) => entries.map(({ path }) => path));
  if (partition.length !== plan.entries.length || new Set(partition).size !== partition.length) {
    throw new Error('INIT_SEGMENT_PARTITION_INVALID');
  }
  return {
    ...plan,
    segments,
  };
}

function requestedIncludes(options: InitOptions, segment: InitSegment): readonly InitInclude[] {
  if (options.include === undefined) return [];
  const includes = options.include
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const allowed = segment === 'architect' ? ['hooks'] : segment === 'harness' ? ['ci'] : [];
  const invalid = includes.find((value) => !allowed.includes(value));
  if (
    includes.length === 0 ||
    invalid !== undefined ||
    new Set(includes).size !== includes.length
  ) {
    const expected = allowed.length === 0 ? 'no components' : allowed.join(' | ');
    process.stderr.write(
      `devai init apply ${segment}: --include accepts ${expected} (got '${options.include}')\n`,
    );
    process.exit(EXIT_USAGE);
  }
  return includes as readonly InitInclude[];
}

function executeIncludedComponents(
  targetRoot: string,
  includes: readonly InitInclude[],
  force: boolean,
  options: InitOptions,
): readonly Record<string, unknown>[] {
  return includes.map((component) => {
    if (component === 'ci') {
      const plan = buildCiScaffoldPlan({
        targetRoot,
        ...(options.output !== undefined && { outputPath: options.output }),
        ...(options.devaiRef !== undefined && { devaiRef: options.devaiRef }),
        ...(options.mode !== undefined && { mode: options.mode as CiScaffoldMode }),
        ...(options.chainFile !== undefined && { chainFile: options.chainFile }),
      });
      const result = executeCiScaffoldPlan(plan, { force });
      return { component, plan, result };
    }
    const plan = buildHooksInstallPlan({
      targetRoot,
      devaiVersion: resolveCliVersion(),
      ...(options.hook !== undefined && { hook: options.hook as HookName }),
      ...(options.command !== undefined && { command: options.command }),
    });
    executeHooksInstallPlan(plan);
    return { component, plan, result: { executed: true } };
  });
}

function addInitOptions(command: ReturnType<CAC['command']>, includeIntrospection: boolean) {
  command
    .option('--target <path>', `Target directory (default: ${DEFAULT_REPO_ROOT})`)
    .option('--stamp-version <v>', 'DEVAI version stamp for reproducible plans')
    .option('--tier <tier>', 'Adoption tier: tier1 | tier2 | tier3')
    .option('--human', 'Human-readable output');
  if (includeIntrospection) command.option('--introspect', 'Include repository introspection');
  return command;
}

export const initPlan = defineCommand({
  name: 'init plan',
  description: 'Build the exact segmented bootstrap plan without authorizing a mutation.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    addInitOptions(
      cli.command('init-plan', 'Generate the non-authorizing bootstrap plan'),
      true,
    ).action((options: InitOptions) => {
      validateInitTier(options);
      const introspection = inspectForInit(options);
      const plan = canonicalInitPlanFor(options);
      emit(
        introspection === null ? plan : { introspection, plan },
        options.human === true,
        `init plan: ${String(plan.summary.create)} would be created, ${String(plan.summary.skip)} already exist\n${plan.entries
          .map((entry) => `  ${entry.action === 'create' ? '+' : '·'} ${entry.path}`)
          .join('\n')}`,
      );
      process.exitCode = EXIT_PASS;
    });
  },
});

function initApplyDefinition(segment: InitSegment) {
  return defineCommand({
    name: `init apply ${segment}`,
    description:
      segment === 'owner'
        ? 'Apply the Owner-owned initialization projection with explicit write consent.'
        : segment === 'architect'
          ? 'Apply the Architect-owned initialization projection with explicit write consent.'
          : 'Apply the canonical harness projection with explicit Architect-initiated write consent.',
    authority: 'mesh_controller' as const,
    register(cli: CAC): void {
      const command = addInitOptions(
        cli.command(`init-apply-${segment}`, `Apply the exact ${segment} bootstrap segment`),
        segment === 'harness',
      ).option('--force', 'Overwrite existing non-provenance files in this segment');
      if (segment === 'architect') {
        command
          .option('--include <component>', 'Also install the hooks component: hooks')
          .option('--hook <name>', `${HOOK_NAMES.join(' | ')} (default: pre-push)`)
          .option(
            '--command <cmd>',
            'Hook command (default: devai check --only forbidden-actions --strict)',
          );
      } else if (segment === 'harness') {
        command
          .option('--include <component>', 'Also install the CI component: ci')
          .option(
            '--output <path>',
            'CI output path (default: <target>/.github/workflows/devai-gates.yml)',
          )
          .option('--devai-ref <ref>', 'Reusable workflow git ref (default: main)')
          .option('--mode <mode>', `${CI_SCAFFOLD_MODES.join(' | ')} (default: gate)`)
          .option('--chain-file <path>', 'Evidence chain path passed to the reusable workflow');
      }
      command.action((options: InitOptions) => {
        validateInitTier(options);
        const includes = requestedIncludes(options, segment);
        if (options.hook !== undefined && !HOOK_NAMES.includes(options.hook as HookName)) {
          process.stderr.write(
            `devai init apply architect: --hook must be one of ${HOOK_NAMES.join(' | ')} (got '${options.hook}')\n`,
          );
          process.exit(EXIT_USAGE);
        }
        if (
          options.mode !== undefined &&
          !CI_SCAFFOLD_MODES.includes(options.mode as CiScaffoldMode)
        ) {
          process.stderr.write(
            `devai init apply harness: --mode must be one of ${CI_SCAFFOLD_MODES.join(' | ')} (got '${options.mode}')\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const introspection = segment === 'harness' ? inspectForInit(options) : null;
        const plan = segmentedPlan(initPlanFor(options), segment);
        const result =
          includes.length === 0
            ? executeBootstrapPlan(plan, { force: options.force === true })
            : { created: [], overwritten: [], skipped: [], preserved: [] };
        if (includes.length === 0 && segment === 'harness' && introspection !== null) {
          const outPath = join(
            resolve(options.target ?? DEFAULT_REPO_ROOT),
            '.devai/state/init-introspection.json',
          );
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, JSON.stringify(introspection, null, 2) + '\n');
        }
        const included = executeIncludedComponents(
          options.target ?? DEFAULT_REPO_ROOT,
          includes,
          options.force === true,
          options,
        );
        const includedHuman = included.map((entry) => {
          const component = entry['component'];
          const componentPlan = entry['plan'] as Record<string, unknown>;
          if (component === 'hooks') {
            return `hooks install: ${String(componentPlan['action'])} ${String(componentPlan['path'])} (${String(componentPlan['manager'])}, ${String(componentPlan['hook'])} → \`${String(componentPlan['command'])}\`)`;
          }
          const componentResult = entry['result'] as Record<string, unknown>;
          return `ci scaffold: ${componentResult['written'] === true ? 'wrote' : 'skipped'} ${String(componentPlan['path'])}`;
        });
        emit(
          introspection === null
            ? { plan, result, included }
            : { introspection, plan, result, included },
          options.human === true,
          `init apply ${segment}: ${String(result.created.length)} created, ${String(result.overwritten.length)} overwritten, ${String(result.skipped.length)} skipped, ${String(result.preserved.length)} preserved${included.length > 0 ? `, ${String(included.length)} included component(s)\n${includedHuman.join('\n')}` : ''}`,
        );
        process.exitCode = EXIT_PASS;
      });
    },
  });
}

export const initApplyOwner = initApplyDefinition('owner');
export const initApplyArchitect = initApplyDefinition('architect');
export const initApplyHarness = initApplyDefinition('harness');
// Temporary source-assembly compatibility for the integration Engineer; this is not a route.
export const initApplyF5 = initApplyHarness;

export const initUpgrade = defineCommand({
  name: 'init upgrade',
  description: 'Plan or apply the canonical DEVAI upgrade transition.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('init-upgrade', 'Plan a DEVAI upgrade (or apply with --write --force)')
      .option('--target <path>', `Target directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--from <v>', 'Current version (required unless --tier)')
      .option('--to <v>', 'Target version (required unless --tier)')
      .option(
        '--tier <tier>',
        'Emit the climb checklist from the declared adoption tier to <tier> (plan-only; D-112)',
      )
      .option(
        '--constitution',
        'Refresh .devai/pin/constitution.md from the resolved canonical text and update its digest pin.',
      )
      .option(
        '--subprocess-effects',
        'Materialize the Architect-owned subprocess-effects F1 source into .devai/config with byte identity',
      )
      .option(
        '--operational-law',
        'Materialize the canonical domains, forbidden-actions, glob-guards, scorecard N/A, and threshold policies with byte identity',
      )
      .option('--execute', 'Apply the plan (default: print plan only)')
      .option('--force', 'With --execute: overwrite changed files')
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          target?: string;
          from?: string;
          to?: string;
          tier?: string;
          constitution?: boolean;
          subprocessEffects?: boolean;
          operationalLaw?: boolean;
          execute?: boolean;
          force?: boolean;
          human?: boolean;
        }) => {
          if (options.operationalLaw === true) {
            const targetRoot = resolve(options.target ?? DEFAULT_REPO_ROOT);
            const files = [
              'domains.json',
              'forbidden-actions.json',
              'glob-guards.json',
              'scorecard-na.json',
              'thresholds.json',
            ] as const;
            const materializations = files.map((file) => {
              const sourcePath = join(targetRoot, 'law/policy', file);
              if (!existsSync(sourcePath)) {
                throw new Error(`canonical operational-law source is missing: ${sourcePath}`);
              }
              const bytes = readFileSync(sourcePath);
              JSON.parse(bytes.toString('utf8'));
              return {
                source: `law/policy/${file}`,
                target: `.devai/config/${file}`,
                digest_sha256: createHash('sha256').update(bytes).digest('hex'),
                byte_identity_required: true as const,
                bytes,
              };
            });
            const plan = materializations.map(({ bytes: _bytes, ...entry }) => entry);
            if (options.execute !== true) {
              emit(
                { plan },
                options.human === true,
                `upgrade --operational-law (plan only): ${String(plan.length)} exact materializations`,
              );
              process.exitCode = EXIT_PASS;
              return;
            }
            for (const entry of materializations) {
              const targetPath = join(targetRoot, entry.target);
              mkdirSync(dirname(targetPath), { recursive: true });
              writeFileSync(targetPath, entry.bytes);
            }
            emit(
              { materialized: plan },
              options.human === true,
              `upgrade --operational-law: ${String(plan.length)} exact materializations`,
            );
            process.exitCode = EXIT_PASS;
            return;
          }
          if (options.subprocessEffects === true) {
            const targetRoot = resolve(options.target ?? DEFAULT_REPO_ROOT);
            const sourcePath = join(targetRoot, 'law/policy/subprocess-effects.json');
            const targetPath = join(targetRoot, '.devai/config/subprocess-effects.json');
            if (!existsSync(sourcePath)) {
              process.stderr.write(
                'devai init upgrade --subprocess-effects: canonical F1 source is missing\n',
              );
              process.exitCode = EXIT_FAIL;
              return;
            }
            const bytes = readFileSync(sourcePath);
            let document: unknown;
            try {
              document = JSON.parse(bytes.toString('utf8')) as unknown;
            } catch {
              process.stderr.write(
                'devai init upgrade --subprocess-effects: canonical F1 source is not valid JSON\n',
              );
              process.exitCode = EXIT_FAIL;
              return;
            }
            if (!validators.subprocessEffects(document)) {
              process.stderr.write(
                `devai init upgrade --subprocess-effects: canonical F1 source fails schema validation: ${JSON.stringify(validators.subprocessEffects.errors)}\n`,
              );
              process.exitCode = EXIT_FAIL;
              return;
            }
            const digestSha256 = createHash('sha256').update(bytes).digest('hex');
            const plan = {
              source: 'law/policy/subprocess-effects.json',
              target: '.devai/config/subprocess-effects.json',
              digest_sha256: digestSha256,
              byte_identity_required: true,
            };
            if (options.execute !== true) {
              emit(
                { plan },
                options.human === true,
                `upgrade --subprocess-effects (plan only): ${plan.source} → ${plan.target} (${digestSha256})`,
              );
              process.exitCode = EXIT_PASS;
              return;
            }
            mkdirSync(dirname(targetPath), { recursive: true });
            writeFileSync(targetPath, bytes);
            emit(
              { materialized: plan },
              options.human === true,
              `upgrade --subprocess-effects: ${plan.target} (${digestSha256})`,
            );
            process.exitCode = EXIT_PASS;
            return;
          }
          // D-119: constitution-refresh mode. Vendors a fresh copy of
          // the resolved canonical constitution text at the repo
          // root, updates the {version, sha256} pin in project.json,
          // and (on --execute) chains a constitution.updated record —
          // constitutional changes in an adopter become an auditable
          // Article 32 event, not a silent file edit.
          if (options.constitution === true) {
            const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
            const canonical = resolveCanonicalConstitution();
            if (canonical === null) {
              process.stderr.write(
                'devai init upgrade --constitution: no canonical constitution text could be resolved\n',
              );
              process.exit(EXIT_FAIL);
            }
            const before = verifyConstitutionBinding(targetRoot);
            const toVersion = canonical.version ?? 'unknown';
            const fromVersion = before.pin?.version ?? 'none';

            if (options.execute !== true) {
              emit(
                {
                  from: fromVersion,
                  to: toVersion,
                  source: canonical.source,
                  sha256: canonical.sha256,
                },
                options.human === true,
                `upgrade --constitution (plan only): ${fromVersion} → ${toVersion} (source: ${canonical.source})\n` +
                  '  re-run with --write to refresh .devai/pin/constitution.md + the project.json pin',
              );
              process.exitCode = EXIT_PASS;
              return;
            }

            const vendoredPath = join(targetRoot, '.devai/pin/constitution.md');
            mkdirSync(dirname(vendoredPath), { recursive: true });
            writeFileSync(vendoredPath, canonical.text);
            const pointerPath = join(targetRoot, '.devai/constitution.md');
            if (!existsSync(pointerPath)) {
              const binding = buildConstitutionBindingPlan(targetRoot, resolveCliVersion());
              mkdirSync(dirname(pointerPath), { recursive: true });
              writeFileSync(pointerPath, binding.pointerFile.content);
            }

            const configPath = join(targetRoot, '.devai/config/project.json');
            const config = existsSync(configPath)
              ? (JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>)
              : {};
            const pin =
              canonical.version !== null
                ? { version: canonical.version, sha256: canonical.sha256 }
                : null;
            if (pin !== null) {
              mkdirSync(dirname(configPath), { recursive: true });
              writeFileSync(
                configPath,
                JSON.stringify({ ...config, constitution: pin }, null, 2) + '\n',
              );
            }

            const chained = appendVerbEvidence({
              repoRoot: targetRoot,
              automatic: true,
              action: 'constitution.updated',
              status: 'completed',
              notes: [`from=${fromVersion}`, `to=${toVersion}`, `source=${canonical.source}`],
            });
            if (!chained.ok) {
              process.stderr.write(
                `warning: could not append constitution.updated to the evidence chain: ${chained.error ?? 'unknown'}\n`,
              );
            }

            emit(
              { from: fromVersion, to: toVersion, source: canonical.source, chained: chained.ok },
              options.human === true,
              `upgrade --constitution: ${fromVersion} → ${toVersion} (source: ${canonical.source})` +
                (chained.ok ? '\n  chained: constitution.updated' : ''),
            );
            process.exitCode = EXIT_PASS;
            return;
          }
          // D-112: tier-climb checklist mode. Plan-only by design
          // (consistent with upgrade's plan/execute split): the human
          // works the list, then edits project.json's profile key.
          if (options.tier !== undefined) {
            if (!isAdoptionProfile(options.tier)) {
              process.stderr.write(
                `devai init upgrade: --tier must be one of tier1 | tier2 | tier3 (got '${options.tier}')\n`,
              );
              process.exit(EXIT_USAGE);
            }
            const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
            const declared = readProfile(targetRoot);
            const steps = upgradeChecklist(declared, options.tier);
            if (options.human === true) {
              const lines = [
                `init upgrade --tier: ${declared} → ${options.tier} (${String(steps.length)} step(s))`,
                ...steps.map((st, i) => `  ${String(i + 1)}. ${st.step}\n     ${st.detail}`),
              ];
              if (steps.length === 0) {
                lines.push('  nothing to do — target tier is not above the declared profile');
              }
              lines.push(
                'When the list is done, set "profile" in .devai/config/project.json and re-run devai doctor.',
              );
              process.stdout.write(lines.join('\n') + '\n');
            } else {
              process.stdout.write(
                JSON.stringify({ from: declared, to: options.tier, steps }, null, 2) + '\n',
              );
            }
            process.exitCode = EXIT_PASS;
            return;
          }
          if (options.execute === true && options.from === undefined && options.to === undefined) {
            const artifact = executeAuthorityPolicyMaterialization() as {
              path: string;
              operation: string;
              digest_sha256: string;
            };
            const versionPin = materializeSelfVersionPin(options.target ?? DEFAULT_REPO_ROOT);
            emit(
              { artifact, version_pin: versionPin },
              options.human === true,
              `authority policy ${artifact.operation}: ${artifact.path} (${artifact.digest_sha256})` +
                (versionPin === null
                  ? ''
                  : `\nversion pin materialized: ${versionPin.path} (${versionPin.constitution_version})`),
            );
            process.exitCode = EXIT_PASS;
            return;
          }
          if (options.from === undefined || options.to === undefined) {
            process.stderr.write('devai init upgrade: --from and --to are required\n');
            process.exit(EXIT_FAIL);
          }
          const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
          const plan = buildUpgradePlan({
            targetRoot,
            fromVersion: options.from,
            toVersion: options.to,
          });
          if (options.execute === true) {
            // Reuse executeBootstrapPlan over the upgrade plan's entries
            // by wrapping it in a BootstrapPlan shape.
            const bootstrapShaped = {
              target_root: targetRoot,
              devai_version: options.to,
              entries: plan.entries,
              summary: { create: 0, overwrite: plan.entries.length, skip: 0 },
            };
            const result = executeBootstrapPlan(bootstrapShaped, { force: options.force === true });
            emit(
              { plan, result },
              options.human === true,
              `upgrade --write: ${String(result.created.length)} created, ${String(result.overwritten.length)} overwritten`,
            );
            process.exitCode = EXIT_PASS;
            return;
          }
          emit(
            plan,
            options.human === true,
            `upgrade ${options.from} → ${options.to}: ${String(plan.entries.length)} entry(ies) to change\n` +
              plan.entries.map((e) => `  ${e.action} ${e.path}`).join('\n'),
          );
          process.exitCode = EXIT_PASS;
        },
      );
  },
});

// Temporary source-assembly compatibility for the integration Engineer; this is not a route.
export const upgrade = initUpgrade;
