import { createHash } from 'node:crypto';
import { basename, join, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import type { RegistryEntry } from '../define-command.js';

type JsonRecord = Record<string, unknown>;

const POLICY_VERSION = '1.0.0';
const CONSENT = Object.freeze({ write: true, allow_publish: false, experimental: false });

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonical(value));
}

export function canonicalSha256(value: unknown): string {
  return sha256Bytes(canonicalBytes(value));
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function actionIds(
  entries: readonly RegistryEntry[],
  predicate: (entry: RegistryEntry) => boolean,
): string[] {
  return entries
    .filter((entry) => entry.effects !== 'read' && predicate(entry))
    .map((entry) => entry.name)
    .sort();
}

function humanActions(entries: readonly RegistryEntry[], role: string): string[] {
  return actionIds(entries, (entry) => {
    const subject = entry.authority_contract.subject;
    return subject.kind === 'human' && subject.allowed_roles.includes(role as never);
  });
}

function machineActions(entries: readonly RegistryEntry[], actor: string): string[] {
  return actionIds(
    entries,
    (entry) =>
      entry.authority_contract.subject.kind === 'derived-machine' &&
      entry.authority_contract.subject.actor === actor,
  );
}

function fsSelector(repositoryId: string, glob: string) {
  return {
    kind: 'fs',
    repository_id: repositoryId,
    canonical_relative_path_glob: glob,
    operations: ['create', 'update', 'delete', 'rename'],
  };
}

function gitSelector(repositoryId: string) {
  return {
    kind: 'git-ref',
    repository_id: repositoryId,
    ref_glob: 'refs/**',
    operations: ['create', 'update', 'delete', 'merge', 'push'],
  };
}

function dbSelector() {
  return {
    kind: 'db',
    connection_id: 'devai-control',
    database_id_glob: '**',
    object_id_glob: '**',
    operations: ['insert', 'update', 'delete', 'ddl', 'execute'],
  };
}

function policySubjects(entry: RegistryEntry): JsonRecord[] {
  const subject = entry.authority_contract.subject;
  if (subject.kind === 'human') return [{ kind: 'human', roles: [...subject.allowed_roles] }];
  if (subject.kind === 'derived-machine') {
    const initiator =
      subject.initiator === 'none'
        ? 'none'
        : {
            allowed_roles: [...subject.initiator.allowed_roles],
            preserve_in_context: true,
          };
    return [
      {
        kind: 'derived-machine',
        actor: subject.actor,
        transition: subject.transition,
        initiator,
      },
    ];
  }
  return [];
}

function entriesForKind(entries: readonly RegistryEntry[], kind: string): RegistryEntry[] {
  return entries.filter(
    (entry) =>
      entry.effects !== 'read' &&
      entry.authority_contract.planner.kind !== 'none' &&
      entry.authority_contract.planner.target_kinds.includes(kind as never),
  );
}

function perActionRules(
  entries: readonly RegistryEntry[],
  kind: string,
  selectorFor: (entry: RegistryEntry) => readonly JsonRecord[],
): Array<ReturnType<typeof rule>> {
  return entriesForKind(entries, kind).flatMap((entry) =>
    selectorFor(entry).map((selector, index) =>
      rule({
        id: `self-${kind}-${entry.name.replaceAll(' ', '-')}-${String(index + 1)}`,
        origin: 'additive-extension',
        precedence: 500,
        actionIds: [entry.name],
        selector,
        subjects: policySubjects(entry),
        consent:
          kind === 'remote' && selector.publication === true
            ? { ...entry.authority_contract.consent, allow_publish: true }
            : (entry.authority_contract.consent as JsonRecord),
        rationale: `DEVAI-self typed ${kind} authority for ${entry.name}.`,
      }),
    ),
  );
}

function remoteSelectors(entry: RegistryEntry): readonly JsonRecord[] {
  if (entry.name === 'docs publish') {
    return [
      {
        kind: 'remote',
        system_id: 'github-pages',
        endpoint_ids: ['publish-docs'],
        operation_ids: ['publish'],
        publication: true,
      },
    ];
  }
  if (entry.name === 'agent skill run') {
    return [
      {
        kind: 'remote',
        system_id: 'local-llm',
        endpoint_ids: ['claude', 'codex'],
        operation_ids: ['invoke'],
        publication: false,
      },
      {
        kind: 'remote',
        system_id: 'git-origin',
        endpoint_ids: ['current-branch'],
        operation_ids: ['push'],
        publication: true,
      },
      {
        kind: 'remote',
        system_id: 'github',
        endpoint_ids: ['pull-requests'],
        operation_ids: ['create'],
        publication: true,
      },
      {
        kind: 'remote',
        system_id: 'local-validation',
        endpoint_ids: [
          'feedback-lint',
          'feedback-typecheck',
          'feedback-unit-test',
          'feedback-acceptance',
        ],
        operation_ids: ['invoke'],
        publication: false,
      },
    ];
  }
  if (entry.name === 'evidence test record') {
    return [
      {
        kind: 'remote',
        system_id: 'local-command',
        endpoint_ids: ['test-runner'],
        operation_ids: ['invoke'],
        publication: false,
      },
    ];
  }
  return [
    {
      kind: 'remote',
      system_id: 'local-llm',
      endpoint_ids: ['claude', 'codex'],
      operation_ids: ['invoke'],
      publication: false,
    },
  ];
}

function rule(input: {
  id: string;
  origin: 'immutable-core' | 'additive-extension';
  precedence: 500 | 650 | 700 | 750 | 800 | 900;
  actionIds: readonly string[];
  selector: JsonRecord;
  subjects: readonly JsonRecord[];
  consent?: JsonRecord;
  rationale: string;
}) {
  if (input.actionIds.length === 0) return undefined;
  return {
    rule_id: input.id,
    origin: input.origin,
    precedence: input.precedence,
    action_ids: [...input.actionIds],
    selector: input.selector,
    effect: 'allow',
    subjects: [...input.subjects],
    required_consent: input.consent ?? CONSENT,
    constitutional_anchors: [6, 7, 8, 9, 10],
    rationale: input.rationale,
  };
}

function defined<T>(values: readonly (T | undefined)[]): T[] {
  return values.filter((value): value is T => value !== undefined);
}

function subjectGroups(entries: readonly RegistryEntry[]) {
  return {
    owner: humanActions(entries, 'owner'),
    architect: humanActions(entries, 'architect'),
    inspector: humanActions(entries, 'inspector'),
    engineer: humanActions(entries, 'engineer'),
    auditor: humanActions(entries, 'auditor'),
    harness: [
      ...new Set([...machineActions(entries, 'harness'), 'init record', 'skill record']),
    ].sort(),
    upgrade: machineActions(entries, 'upgrade'),
    release: machineActions(entries, 'release'),
  };
}

function machineSubject(actor: 'harness' | 'upgrade' | 'release') {
  return {
    kind: 'derived-machine',
    actor,
    transition: actor === 'harness' ? 'harness-write' : actor,
    initiator: {
      allowed_roles:
        actor === 'harness'
          ? ['owner', 'architect', 'inspector', 'engineer', 'auditor']
          : ['architect'],
      preserve_in_context: true,
    },
  };
}

export function repositoryIdFor(root: string): string {
  const absolute = resolve(root);
  if (
    existsSync(join(absolute, 'packages/cli/src/bin.ts')) &&
    existsSync(join(absolute, 'law/constitution.md'))
  ) {
    return 'devai-self';
  }
  return basename(absolute).replaceAll(/[^A-Za-z0-9._-]/gu, '-') || 'adopter-repository';
}

export function authorityBindings(root: string, packageVersion: string) {
  const selfConstitution = join(resolve(root), 'law/constitution.md');
  const pinnedConstitution = join(resolve(root), '.devai/pin/constitution.md');
  const constitutionPath = existsSync(selfConstitution) ? selfConstitution : pinnedConstitution;
  const constitutionText = existsSync(constitutionPath)
    ? readFileSync(constitutionPath, 'utf8')
    : '# DEVAI Constitution\n\n**Version:** 0.5.0\n';
  const constitutionVersion =
    /\*\*Version:\*\*\s*([0-9]+\.[0-9]+\.[0-9]+)/u.exec(constitutionText)?.[1] ?? '0.5.0';
  return {
    repository_id: repositoryIdFor(root),
    package_binding: { name: '@devai-nyx/cli', version: packageVersion },
    constitution_binding: {
      version: constitutionVersion,
      digest_sha256: createHash('sha256').update(constitutionText).digest('hex'),
    },
  };
}

export function buildTrustedAuthoritySources(
  entries: readonly RegistryEntry[],
  root: string,
  packageVersion: string,
) {
  const bindings = authorityBindings(root, packageVersion);
  const repositoryId = bindings.repository_id;
  const groups = subjectGroups(entries);
  const human = (role: string) => [{ kind: 'human', roles: [role] }];
  const joint = [{ kind: 'human', roles: ['owner', 'architect'] }];
  const coreRules = defined([
    rule({
      id: 'core-owner-product-root',
      origin: 'immutable-core',
      precedence: 650,
      actionIds: groups.owner,
      selector: fsSelector(repositoryId, 'product'),
      subjects: human('owner'),
      rationale: 'Article 6 Owner product directory authority.',
    }),
    rule({
      id: 'core-owner-product',
      origin: 'immutable-core',
      precedence: 650,
      actionIds: groups.owner,
      selector: fsSelector(repositoryId, 'product/**'),
      subjects: human('owner'),
      rationale: 'Article 6 Owner product authority.',
    }),
    rule({
      id: 'core-joint-glossary-root',
      origin: 'immutable-core',
      precedence: 700,
      actionIds: [...new Set([...groups.owner, ...groups.architect])].sort(),
      selector: fsSelector(repositoryId, 'law/glossary'),
      subjects: joint,
      rationale: 'Article 6 joint Owner and Architect glossary directory authority.',
    }),
    rule({
      id: 'core-joint-glossary',
      origin: 'immutable-core',
      precedence: 700,
      actionIds: [...new Set([...groups.owner, ...groups.architect])].sort(),
      selector: fsSelector(repositoryId, 'law/glossary/**'),
      subjects: joint,
      rationale: 'Article 6 joint Owner and Architect glossary authority.',
    }),
    rule({
      id: 'core-architect-docs-root',
      origin: 'immutable-core',
      precedence: 650,
      actionIds: groups.architect,
      selector: fsSelector(repositoryId, 'docs'),
      subjects: human('architect'),
      rationale: 'Article 6 Architect reference directory authority.',
    }),
    rule({
      id: 'core-architect-docs',
      origin: 'immutable-core',
      precedence: 650,
      actionIds: groups.architect,
      selector: fsSelector(repositoryId, 'docs/**'),
      subjects: human('architect'),
      rationale: 'Article 6 Architect reference authority.',
    }),
    rule({
      id: 'core-auditor-observation-root',
      origin: 'immutable-core',
      precedence: 750,
      actionIds: groups.auditor,
      selector: fsSelector(repositoryId, '.devai/local/rounds/*/audit'),
      subjects: human('auditor'),
      rationale: 'Article 6 Auditor observation output directory authority.',
    }),
    rule({
      id: 'core-auditor-observation',
      origin: 'immutable-core',
      precedence: 750,
      actionIds: groups.auditor,
      selector: fsSelector(repositoryId, '.devai/local/rounds/*/audit/**'),
      subjects: human('auditor'),
      rationale: 'Article 6 Auditor observation output authority.',
    }),
    ...['.devai/local', '.devai/local/rounds', '.devai/local/rounds/*'].map((path, index) =>
      rule({
        id: `core-round-workspace-container-${String(index + 1)}`,
        origin: 'immutable-core',
        precedence: 750,
        actionIds: [...new Set([...groups.architect, ...groups.auditor])].sort(),
        selector: fsSelector(repositoryId, path),
        subjects: [...human('architect'), ...human('auditor')],
        rationale: 'Article 6 role-bounded runtime round workspace container authority.',
      }),
    ),
    rule({
      id: 'core-architect-local-rounds-root',
      origin: 'immutable-core',
      precedence: 750,
      actionIds: groups.architect,
      selector: fsSelector(repositoryId, '.devai/local/rounds'),
      subjects: human('architect'),
      rationale: 'Article 6 Architect runtime round workspace authority.',
    }),
    rule({
      id: 'core-architect-local-rounds',
      origin: 'immutable-core',
      precedence: 750,
      actionIds: groups.architect,
      selector: fsSelector(repositoryId, '.devai/local/rounds/**'),
      subjects: human('architect'),
      rationale: 'Article 6 Architect runtime round workspace authority.',
    }),
    rule({
      id: 'core-inspector-tests',
      origin: 'immutable-core',
      precedence: 800,
      actionIds: groups.inspector,
      selector: fsSelector(repositoryId, '**/test/**'),
      subjects: human('inspector'),
      rationale: 'Article 6 Inspector test authority.',
    }),
    rule({
      id: 'core-inspector-tests-plural',
      origin: 'immutable-core',
      precedence: 800,
      actionIds: groups.inspector,
      selector: fsSelector(repositoryId, '**/tests/**'),
      subjects: human('inspector'),
      rationale: 'Article 6 Inspector test authority for conventional plural test directories.',
    }),
    rule({
      id: 'core-harness-state',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: groups.harness,
      selector: fsSelector(repositoryId, '.devai/state/**'),
      subjects: [machineSubject('harness')],
      rationale: 'Article 6 verb-attributed harness state transition.',
    }),
    rule({
      id: 'core-harness-state-root',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: groups.harness,
      selector: fsSelector(repositoryId, '.devai/state'),
      subjects: [machineSubject('harness')],
      rationale: 'Article 6 verb-attributed harness state directory transition.',
    }),
    rule({
      id: 'core-harness-state-prune-coverage',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: ['work state prune'],
      selector: fsSelector(repositoryId, 'coverage/**'),
      subjects: [machineSubject('harness')],
      rationale: 'Article 6 verb-attributed pruning of the declared disposable coverage root.',
    }),
    rule({
      id: 'core-harness-worktrees',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: groups.harness,
      selector: fsSelector(repositoryId, '.devai/worktrees/**'),
      subjects: [machineSubject('harness')],
      rationale: 'Article 6 verb-attributed harness worktree-control transition.',
    }),
    rule({
      id: 'core-harness-worktrees-root',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: groups.harness,
      selector: fsSelector(repositoryId, '.devai/worktrees'),
      subjects: [machineSubject('harness')],
      rationale: 'Article 6 verb-attributed harness worktree-control directory transition.',
    }),
    rule({
      id: 'core-harness-inventory',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: groups.harness,
      selector: fsSelector(repositoryId, 'record/derived/inventory/**'),
      subjects: [machineSubject('harness')],
      rationale: 'Article 6 inventory-machine transition.',
    }),
    rule({
      id: 'core-upgrade-config',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: groups.upgrade,
      selector: fsSelector(repositoryId, '.devai/config/**'),
      subjects: [machineSubject('upgrade')],
      rationale: 'Article 6 derived upgrade transition for F5 configuration.',
    }),
    rule({
      id: 'core-architect-post-merge-host-adapter',
      origin: 'immutable-core',
      precedence: 900,
      actionIds: ['adopt hooks install'],
      selector: fsSelector(repositoryId, '.devai/config/post-merge-host-adapter.json'),
      subjects: human('architect'),
      rationale:
        'Article 34 Architect-authorized installation of the verified post-merge host adapter.',
    }),
    ...['.devai/state', '.devai/state/init-introspection.json'].map((path, index) =>
      rule({
        id: `core-upgrade-init-introspection-${String(index + 1)}`,
        origin: 'immutable-core',
        precedence: 900,
        actionIds: ['init apply-f5'],
        selector: fsSelector(repositoryId, path),
        subjects: [machineSubject('upgrade')],
        rationale:
          'Article 6 verb-attributed state output for the exact introspecting F5 bootstrap action.',
      }),
    ),
    ...[
      '.devai/worktrees',
      '.devai/worktrees/**',
      'docs/site/build',
      'docs/site/build/**',
      'docs/site/_site',
      'docs/site/_site/**',
      // Verb-attributed publish bookkeeping (Article 6 F5 state): the gate-4
      // baseline `docs publish` persists after a successful gh-pages push,
      // plus the state directory itself for repos that predate it. Absent
      // from this surface, the persist was denied at the policy layer and
      // the stale baseline forced --force on every later publish.
      '.devai/state',
      '.devai/state/docs-publish-baseline.txt',
    ].map((path, index) =>
      rule({
        id: `core-release-runtime-${String(index + 1)}`,
        origin: 'immutable-core',
        precedence: 900,
        actionIds: groups.release,
        selector: fsSelector(repositoryId, path),
        subjects: [machineSubject('release')],
        consent: { write: true, allow_publish: true, experimental: false },
        rationale: 'Article 6 Architect-initiated release transition runtime surface.',
      }),
    ),
    ...[
      '.devai',
      '.devai/config',
      '.devai/constitution.md',
      '.devai/pin',
      '.devai/pin/constitution.md',
      '.gitignore',
    ].map((path, index) =>
      rule({
        id: `core-upgrade-bootstrap-${String(index + 1)}`,
        origin: 'immutable-core',
        precedence: 900,
        actionIds: groups.upgrade,
        selector: fsSelector(repositoryId, path),
        subjects: [machineSubject('upgrade')],
        rationale: 'Article 6 derived upgrade transition for the exact F5 bootstrap surface.',
      }),
    ),
  ]);

  const rootEngineerPaths = [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig*.json',
    'vitest*.ts',
    'eslint.config.js',
    '.prettier*',
  ];
  const rootArchitectPaths = [
    'README.md',
    'AGENTS.md',
    'CLAUDE.md',
    'SECURITY.md',
    'CHANGELOG.md',
    '.changeset/**',
  ];
  const additiveRules = defined([
    ...perActionRules(entries, 'git-ref', () => [gitSelector(repositoryId)]),
    ...perActionRules(entries, 'db', () => [dbSelector()]),
    ...perActionRules(entries, 'remote', remoteSelectors),
    rule({
      id: 'self-engineer-packages',
      origin: 'additive-extension',
      precedence: 500,
      actionIds: [...new Set([...groups.engineer, 'experimental loop run'])].sort(),
      selector: fsSelector(repositoryId, 'packages/**'),
      subjects: [...human('engineer'), machineSubject('harness')],
      rationale: 'DEVAI-self Engineer implementation authority.',
    }),
    rule({
      id: 'self-engineer-scripts',
      origin: 'additive-extension',
      precedence: 500,
      actionIds: [...new Set([...groups.engineer, 'experimental loop run'])].sort(),
      selector: fsSelector(repositoryId, 'scripts/**'),
      subjects: [...human('engineer'), machineSubject('harness')],
      rationale: 'DEVAI-self Engineer tooling authority.',
    }),
    rule({
      id: 'self-engineer-workflows',
      origin: 'additive-extension',
      precedence: 500,
      actionIds: [...new Set([...groups.engineer, 'experimental loop run'])].sort(),
      selector: fsSelector(repositoryId, '.github/**'),
      subjects: [...human('engineer'), machineSubject('harness')],
      rationale: 'DEVAI-self Engineer workflow implementation authority.',
    }),
    ...[
      '.git/hooks',
      '.git/hooks/**',
      '.git/devai',
      '.git/devai/**',
      '.husky',
      '.husky/**',
      '.devai/config',
      '.devai/config/post-merge-host-adapter.json',
    ].map((path, index) =>
      rule({
        id: `self-architect-hooks-${String(index + 1)}`,
        origin: 'additive-extension',
        precedence: 500,
        actionIds: ['adopt hooks install'],
        selector: fsSelector(repositoryId, path),
        subjects: human('architect'),
        rationale:
          'DEVAI-self Architect authority for the exact local hook and host-adapter installation action.',
      }),
    ),
    ...rootEngineerPaths.map((path, index) =>
      rule({
        id: `self-engineer-root-${String(index + 1)}`,
        origin: 'additive-extension',
        precedence: 500,
        actionIds: [...new Set([...groups.engineer, 'experimental loop run'])].sort(),
        selector: fsSelector(repositoryId, path),
        subjects: [...human('engineer'), machineSubject('harness')],
        rationale: 'DEVAI-self Engineer root tooling authority.',
      }),
    ),
    ...rootArchitectPaths.map((path, index) =>
      rule({
        id: `self-architect-root-${String(index + 1)}`,
        origin: 'additive-extension',
        precedence: 650,
        actionIds: groups.architect,
        selector: fsSelector(repositoryId, path),
        subjects: human('architect'),
        rationale: 'DEVAI-self Architect governance authority.',
      }),
    ),
  ]);

  const sourceDocument = {
    policy_id: 'devai-core-authority',
    policy_version: POLICY_VERSION,
    rules: coreRules,
  };
  const extensionDocument = {
    extension_id: 'devai-self-authority',
    extension_version: POLICY_VERSION,
    rules: additiveRules,
  };
  const immutableCore = {
    policy_id: 'devai-core-authority',
    policy_version: POLICY_VERSION,
    source_document: sourceDocument,
    canonical_source_bytes: canonicalBytes(sourceDocument),
    rules: coreRules,
  };
  const additiveExtensions = [
    {
      extension_id: 'devai-self-authority',
      extension_version: POLICY_VERSION,
      source_document: extensionDocument,
      canonical_source_bytes: canonicalBytes(extensionDocument),
      rules: additiveRules,
    },
  ];
  const rules = [...coreRules, ...additiveRules];
  const provenance = {
    policy_id: 'devai-authority',
    policy_version: packageVersion,
    repository_id: repositoryId,
    framework_package: bindings.package_binding,
    constitution: bindings.constitution_binding,
    source_policy: {
      policy_id: 'devai-core-authority',
      policy_version: POLICY_VERSION,
      digest_sha256: sha256Bytes(canonicalBytes(sourceDocument)),
    },
    additive_extensions: [
      {
        extension_id: 'devai-self-authority',
        extension_version: POLICY_VERSION,
        digest_sha256: sha256Bytes(canonicalBytes(extensionDocument)),
      },
    ],
    resolved_digest_sha256: canonicalSha256(rules),
    materialized_from: { kind: 'project-config', path: '.devai/config/authority-policy.json' },
  };
  return {
    ...bindings,
    immutableCore,
    additiveExtensions,
    rules,
    provenance,
    virtualPolicy: {
      document: { raw: { rules }, canonical_bytes: canonicalBytes({ rules }), view: { rules } },
      provenance,
      resolved_rule_bytes: canonicalBytes(rules),
    },
  };
}
