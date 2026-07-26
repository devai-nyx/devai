import { existsSync, mkdirSync, readFileSync, writeFileSync } from '@devai-nyx/authority';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import type { CAC } from 'cac';
import {
  appendVerbEvidence,
  buildBootstrapPlan,
  buildConstitutionBindingPlan,
  buildUpgradePlan,
  executeBootstrapPlan,
  introspectRepo,
  isAdoptionProfile,
  readProfile,
  resolveCanonicalConstitution,
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
  readonly profile?: string;
  readonly human?: boolean;
}

type InitSegment = 'owner' | 'architect' | 'f5';

function validateInitProfile(options: InitOptions): void {
  if (options.profile !== undefined && !isAdoptionProfile(options.profile)) {
    process.stderr.write(
      `devai init: --profile must be one of tier1 | tier2 | tier3 (got '${options.profile}')\n`,
    );
    process.exit(EXIT_USAGE);
  }
}

function initPlanFor(options: InitOptions) {
  const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
  return buildBootstrapPlan({
    targetRoot,
    version: options.stampVersion ?? resolveCliVersion(),
    ...(options.profile !== undefined &&
      isAdoptionProfile(options.profile) && { profile: options.profile }),
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
      return entry.path.startsWith('docs/') && !entry.path.startsWith('product/');
    }
    return !entry.path.startsWith('docs/') && !entry.path.startsWith('.devai/state/');
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

function addInitOptions(command: ReturnType<CAC['command']>, includeIntrospection: boolean) {
  command
    .option('--target <path>', `Target directory (default: ${DEFAULT_REPO_ROOT})`)
    .option('--stamp-version <v>', 'DEVAI version stamp for reproducible plans')
    .option('--profile <tier>', 'Adoption profile: tier1 | tier2 | tier3')
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
      validateInitProfile(options);
      const introspection = inspectForInit(options);
      const plan = initPlanFor(options);
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
    name: `init apply-${segment}`,
    description:
      segment === 'owner'
        ? 'Apply the exact owner bootstrap segment under its declared authority.'
        : `Apply only the ${segment} bootstrap segment under its declared authority.`,
    authority: 'mesh_controller' as const,
    register(cli: CAC): void {
      addInitOptions(
        cli.command(`init-apply-${segment}`, `Apply the exact ${segment} bootstrap segment`),
        segment === 'f5',
      )
        .option('--force', 'Overwrite existing non-provenance files in this segment')
        .action((options: InitOptions) => {
          validateInitProfile(options);
          const introspection = segment === 'f5' ? inspectForInit(options) : null;
          const plan = segmentedPlan(initPlanFor(options), segment);
          const result = executeBootstrapPlan(plan, { force: options.force === true });
          if (segment === 'f5' && introspection !== null) {
            const outPath = join(
              resolve(options.target ?? DEFAULT_REPO_ROOT),
              '.devai/state/init-introspection.json',
            );
            mkdirSync(dirname(outPath), { recursive: true });
            writeFileSync(outPath, JSON.stringify(introspection, null, 2) + '\n');
          }
          emit(
            introspection === null ? { plan, result } : { introspection, plan, result },
            options.human === true,
            `init apply-${segment}: ${String(result.created.length)} created, ${String(result.overwritten.length)} overwritten, ${String(result.skipped.length)} skipped, ${String(result.preserved.length)} preserved`,
          );
          process.exitCode = EXIT_PASS;
        });
    },
  });
}

export const initApplyOwner = initApplyDefinition('owner');
export const initApplyArchitect = initApplyDefinition('architect');
export const initApplyF5 = initApplyDefinition('f5');

export const upgrade = defineCommand({
  name: 'upgrade',
  description: 'Plan an upgrade from one DEVAI version to another (no apply without --write)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('upgrade', 'Plan a DEVAI upgrade (or apply with --execute --force)')
      .option('--target <path>', `Target directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--from <v>', 'Current version (required unless --profile)')
      .option('--to <v>', 'Target version (required unless --profile)')
      .option(
        '--profile <tier>',
        'Emit the climb checklist from the declared profile to <tier> (plan-only; D-112)',
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
          profile?: string;
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
                'devai adopt upgrade --subprocess-effects: canonical F1 source is missing\n',
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
                'devai adopt upgrade --subprocess-effects: canonical F1 source is not valid JSON\n',
              );
              process.exitCode = EXIT_FAIL;
              return;
            }
            if (!validators.subprocessEffects(document)) {
              process.stderr.write(
                `devai adopt upgrade --subprocess-effects: canonical F1 source fails schema validation: ${JSON.stringify(validators.subprocessEffects.errors)}\n`,
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
                'devai adopt upgrade --constitution: no canonical constitution text could be resolved\n',
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
          // D-112: profile-climb checklist mode. Plan-only by design
          // (consistent with upgrade's plan/execute split): the human
          // works the list, then edits project.json's profile key.
          if (options.profile !== undefined) {
            if (!isAdoptionProfile(options.profile)) {
              process.stderr.write(
                `devai adopt upgrade: --profile must be one of tier1 | tier2 | tier3 (got '${options.profile}')\n`,
              );
              process.exit(EXIT_USAGE);
            }
            const targetRoot = options.target ?? DEFAULT_REPO_ROOT;
            const declared = readProfile(targetRoot);
            const steps = upgradeChecklist(declared, options.profile);
            if (options.human === true) {
              const lines = [
                `upgrade --profile: ${declared} → ${options.profile} (${String(steps.length)} step(s))`,
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
                JSON.stringify({ from: declared, to: options.profile, steps }, null, 2) + '\n',
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
            process.stderr.write('devai adopt upgrade: --from and --to are required\n');
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
