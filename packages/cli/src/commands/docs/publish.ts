import { spawnSync } from '@devai-nyx/authority';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { join, resolve } from 'node:path';
import type { CAC } from 'cac';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = process.cwd();
const VALID_BUILDERS = ['docusaurus', 'jekyll'] as const;
type Builder = (typeof VALID_BUILDERS)[number];
const VALID_KINDS = ['library', 'application'] as const;
type RepoKind = (typeof VALID_KINDS)[number];

interface PublishOptions {
  readonly repoRoot?: string;
  readonly builder?: string;
  readonly message?: string;
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly human?: boolean;
}

interface DetectResult {
  readonly kind: RepoKind;
  readonly builder: Builder;
  readonly build_command: string;
  readonly output_dir: string;
  readonly custom_domain?: string;
  readonly gh_pages_branch: string;
  readonly publish_target: string;
  readonly opt_out_adr_missing?: boolean;
}

interface ProjectConfig {
  readonly repo?: { readonly kind?: string };
  readonly docs?: {
    readonly builder?: string;
    readonly build_command?: string;
    readonly output_dir?: string;
    readonly custom_domain?: string | null;
    readonly publish_target?: string;
    readonly gh_pages_branch?: string;
  };
}

const BUILDER_DEFAULTS: Record<
  Builder,
  { readonly build_command: string; readonly output_dir: string }
> = {
  docusaurus: {
    build_command: 'npm --prefix docs/site run build',
    output_dir: 'docs/site/build',
  },
  jekyll: {
    build_command: 'bundle exec jekyll build -s docs/site -d docs/site/_site',
    output_dir: 'docs/site/_site',
  },
};

interface TelemetryEvent {
  readonly attempts_total: number;
  readonly errors_total?: { readonly stage: 'detect' | 'build' | 'publish' };
  readonly duration_ms: number;
  readonly outcome: 'success' | 'failure' | 'dry_run';
}

function emitTelemetry(event: TelemetryEvent): void {
  // ADR §8: emit via @stynx/logging if importable; else stderr summary.
  // @stynx/logging is not currently a dependency in DEVAI; fall back to a
  // single stderr line in a parseable JSON format.
  const record: Record<string, unknown> = {
    docs_publish_attempts_total: event.attempts_total,
    docs_publish_duration_ms: event.duration_ms,
    outcome: event.outcome,
  };
  if (event.errors_total) {
    record['docs_publish_errors_total'] = 1;
    record['stage'] = event.errors_total.stage;
  }
  try {
    process.stderr.write(`telemetry ${JSON.stringify(record)}\n`);
  } catch {
    /* best effort */
  }
}

function readProjectConfig(repoRoot: string): ProjectConfig | null {
  const cfgPath = join(repoRoot, '.devai/config/project.json');
  if (!existsSync(cfgPath)) return null;
  try {
    return JSON.parse(readFileSync(cfgPath, 'utf8')) as ProjectConfig;
  } catch {
    return null;
  }
}

/**
 * Stage 1 — Detect (ADR §1–§2).
 *
 * Reads `.devai/config/project.json` and validates `repo.kind` ∈
 * {library, application} and `docs.builder` ∈ {docusaurus, jekyll}.
 * `library` MUST be docusaurus. `application` + `jekyll` requires
 * `law/adr/ADR-DOCS-BUILDER-OPT-OUT.md` (this verb WARNs on absence;
 * the W04 sensor is the authoritative hard-fail gate).
 */
export function detect(repoRoot: string, builderOverride?: string): DetectResult {
  const cfg = readProjectConfig(repoRoot);
  if (!cfg) {
    throw new Error(
      `missing or unreadable .devai/config/project.json at ${repoRoot} (required for docs publish; per ADR-LOCAL-PUBLISH-WORKFLOW §2)`,
    );
  }
  const kindRaw = cfg.repo?.kind;
  if (kindRaw === undefined || !VALID_KINDS.includes(kindRaw as RepoKind)) {
    throw new Error(
      `repo.kind in .devai/config/project.json must be one of ${VALID_KINDS.join(', ')}; got ${String(kindRaw)} (ADR-DOCS-GOVERNANCE Decision 1)`,
    );
  }
  const kind = kindRaw as RepoKind;

  const builderRaw = builderOverride ?? cfg.docs?.builder;
  if (builderRaw === undefined || !VALID_BUILDERS.includes(builderRaw as Builder)) {
    throw new Error(
      `docs.builder must be one of ${VALID_BUILDERS.join(', ')}; got ${String(builderRaw)} (ADR-DOCS-GOVERNANCE Decision 2)`,
    );
  }
  const builder = builderRaw as Builder;

  // Library MUST be docusaurus (ADR-DOCS-GOVERNANCE Decision 2 — no opt-out).
  if (kind === 'library' && builder !== 'docusaurus') {
    throw new Error(
      `library repos MUST use docusaurus; got builder=${builder} (ADR-DOCS-GOVERNANCE Decision 2)`,
    );
  }

  // Application + jekyll requires opt-out ADR (ADR-DOCS-GOVERNANCE Decision 3).
  // W04 sensor is authoritative; W03 only WARNs.
  let optOutAdrMissing = false;
  if (kind === 'application' && builder === 'jekyll') {
    const adrPath = join(repoRoot, 'law/adr/ADR-DOCS-BUILDER-OPT-OUT.md');
    if (!existsSync(adrPath)) {
      process.stderr.write(
        `docs publish: WARN — application + jekyll requires law/adr/ADR-DOCS-BUILDER-OPT-OUT.md (ADR-DOCS-GOVERNANCE Decision 3). The W04 sensor (devai policy check docs governance) is the authoritative gate.\n`,
      );
      optOutAdrMissing = true;
    }
  }

  // Publish target — if explicit, must be gh-pages-same-repo. Default ok.
  const publishTarget = cfg.docs?.publish_target ?? 'gh-pages';
  if (publishTarget !== 'gh-pages') {
    throw new Error(
      `docs.publish_target must be 'gh-pages' in same repo; got '${publishTarget}' (ADR-DOCS-GOVERNANCE Decision 4)`,
    );
  }

  const defaults = BUILDER_DEFAULTS[builder];
  const result: DetectResult = {
    kind,
    builder,
    build_command: cfg.docs?.build_command ?? defaults.build_command,
    output_dir: cfg.docs?.output_dir ?? defaults.output_dir,
    gh_pages_branch: cfg.docs?.gh_pages_branch ?? 'gh-pages',
    publish_target: publishTarget,
    ...(typeof cfg.docs?.custom_domain === 'string' &&
      cfg.docs.custom_domain.trim().length > 0 && { custom_domain: cfg.docs.custom_domain }),
    ...(optOutAdrMissing && { opt_out_adr_missing: true }),
  };
  return result;
}

interface BuildResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly output_dir_abs: string;
}

/**
 * Stage 2 — Build (ADR §2). Spawns `docs.build_command` (default per builder)
 * in the repo root. Fails fast on non-zero exit; the verb does not interpret
 * builder diagnostics, only surfaces them.
 */
export function build(repoRoot: string, det: DetectResult): BuildResult {
  const [cmd, ...args] = det.build_command.split(/\s+/);
  if (cmd === undefined) {
    throw new Error(`docs publish: build_command is empty for builder=${det.builder}`);
  }
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
  return {
    status: r.status ?? 1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    output_dir_abs: resolve(repoRoot, det.output_dir),
  };
}

interface GitResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function git(repoRoot: string, args: readonly string[]): GitResult {
  const r = spawnSync('git', [...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

/**
 * Preflight gates (ADR §7). Returns first failure reason, or undefined.
 *
 *   1. Dirty worktree → refuse.
 *   2. main local ahead of origin → refuse.
 *   3. build success → enforced by call-order, restated here.
 *   4. gh-pages not newer than baseline → refuse unless --force.
 */
export function preflights(
  repoRoot: string,
  ghPagesBranch: string,
  opts: { readonly force: boolean },
): { ok: true } | { ok: false; reason: string } {
  // Gate 1: dirty worktree.
  const status = git(repoRoot, ['status', '--porcelain']);
  if (status.status !== 0) {
    return { ok: false, reason: `git status failed: ${status.stderr.trim()}` };
  }
  if (status.stdout.trim().length > 0) {
    return {
      ok: false,
      reason:
        'working tree has uncommitted changes; refuse to publish (ADR-LOCAL-PUBLISH-WORKFLOW §7 gate 1). Commit or stash, then retry.',
    };
  }

  // Gate 2: local branch pushed (HEAD == upstream).
  const local = git(repoRoot, ['rev-parse', 'HEAD']);
  const upstream = git(repoRoot, ['rev-parse', '@{u}']);
  if (local.status === 0 && upstream.status === 0) {
    const localSha = local.stdout.trim();
    const upstreamSha = upstream.stdout.trim();
    if (localSha !== upstreamSha) {
      // Check whether local is ahead.
      const ahead = git(repoRoot, ['rev-list', '--count', `${upstreamSha}..${localSha}`]);
      if (ahead.status === 0 && Number(ahead.stdout.trim()) > 0) {
        return {
          ok: false,
          reason:
            'local branch is ahead of upstream; refuse to publish (ADR-LOCAL-PUBLISH-WORKFLOW §7 gate 2). Push the source branch first, then retry.',
        };
      }
    }
  }

  // Gate 4: gh-pages not advanced unexpectedly. Best-effort: fetch + compare.
  if (!opts.force) {
    git(repoRoot, ['fetch', '--quiet', 'origin', ghPagesBranch]);
    const ghPagesTip = git(repoRoot, ['rev-parse', `refs/remotes/origin/${ghPagesBranch}`]);
    if (ghPagesTip.status === 0) {
      // Compare against baseline persisted under .devai/state/docs-publish-baseline.txt
      const baselinePath = join(repoRoot, '.devai/state/docs-publish-baseline.txt');
      if (existsSync(baselinePath)) {
        const baselineSha = readFileSync(baselinePath, 'utf8').trim();
        const currentSha = ghPagesTip.stdout.trim();
        if (baselineSha.length > 0 && baselineSha !== currentSha) {
          return {
            ok: false,
            reason: `gh-pages on origin has advanced (baseline=${baselineSha.slice(0, 7)}, remote=${currentSha.slice(0, 7)}); refuse to publish without --force (ADR-LOCAL-PUBLISH-WORKFLOW §7 gate 4).`,
          };
        }
      }
    }
  }

  return { ok: true };
}

interface PublishPlan {
  readonly branch: string;
  readonly commit_sha_source: string;
  readonly commit_message: string;
  readonly file_count: number;
  readonly total_bytes: number;
  readonly cname?: string;
  readonly output_dir_abs: string;
}

function countFiles(dir: string): { count: number; bytes: number } {
  let count = 0;
  let bytes = 0;
  const walk = (d: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else if (entry.isFile()) {
        count += 1;
        try {
          bytes += statSync(p).size;
        } catch {
          /* skip */
        }
      }
    }
  };
  if (existsSync(dir)) walk(dir);
  return { count, bytes };
}

/**
 * Stage 3 — Publish (ADR §3). Orphan-branch + force-push to gh-pages.
 * Returns the publish plan (also used by --dry-run).
 */
export function planPublish(
  repoRoot: string,
  det: DetectResult,
  buildRes: BuildResult,
  customMessage?: string,
): PublishPlan {
  const head = git(repoRoot, ['rev-parse', 'HEAD']);
  const sourceSha = head.status === 0 ? head.stdout.trim() : 'UNKNOWN';
  const { count, bytes } = countFiles(buildRes.output_dir_abs);
  const message = customMessage ?? `docs: publish from ${sourceSha}`;
  const plan: PublishPlan = {
    branch: det.gh_pages_branch,
    commit_sha_source: sourceSha,
    commit_message: message,
    file_count: count,
    total_bytes: bytes,
    output_dir_abs: buildRes.output_dir_abs,
    ...(det.custom_domain !== undefined && { cname: det.custom_domain }),
  };
  return plan;
}

interface PublishResult {
  readonly pushed: boolean;
  readonly commit_sha?: string;
  readonly remote_branch: string;
}

/**
 * Execute publish (force-push-with-lease). Uses a temp worktree with an
 * orphan branch so the source repo is untouched.
 */
export function publish(repoRoot: string, plan: PublishPlan): PublishResult {
  const worktreeRoot = join(repoRoot, '.devai/worktrees');
  mkdirSync(worktreeRoot, { recursive: true });
  const tmpWt = mkdtempSync(join(worktreeRoot, 'devai-docs-publish-'));
  try {
    // Init a fresh bare-ish workspace by initializing a clone-detached worktree.
    // Strategy: create an orphan branch in the source repo, push, then delete.
    const orphanBranch = `gh-pages-publish-${Date.now().toString(36)}`;

    // Create orphan branch worktree.
    const addRes = git(repoRoot, ['worktree', 'add', '--detach', tmpWt]);
    if (addRes.status !== 0) {
      throw new Error(`git worktree add failed: ${addRes.stderr.trim()}`);
    }

    try {
      // In the worktree, make an orphan branch with no parents.
      const orphan = git(tmpWt, ['checkout', '--orphan', orphanBranch]);
      if (orphan.status !== 0) {
        throw new Error(`git checkout --orphan failed: ${orphan.stderr.trim()}`);
      }
      const rmAll = git(tmpWt, ['rm', '-rf', '.']);
      // rm -rf in a fresh worktree may succeed or hit "did not match any files" — both OK.
      void rmAll;

      // Clean any remaining files (orphan still has stage entries cleared, but
      // workdir may have untracked content).
      for (const entry of readdirSync(tmpWt)) {
        if (entry === '.git') continue;
        rmSync(join(tmpWt, entry), { recursive: true, force: true });
      }

      // Copy build output into worktree root.
      for (const entry of readdirSync(plan.output_dir_abs)) {
        cpSync(join(plan.output_dir_abs, entry), join(tmpWt, entry), { recursive: true });
      }

      // Write .nojekyll (always — ADR §3 / brief §7).
      writeFileSync(join(tmpWt, '.nojekyll'), '');

      // Write CNAME if configured.
      if (plan.cname !== undefined) {
        writeFileSync(join(tmpWt, 'CNAME'), plan.cname + '\n');
      }

      // Stage everything.
      const addAll = git(tmpWt, ['add', '-A']);
      if (addAll.status !== 0) {
        throw new Error(`git add -A failed: ${addAll.stderr.trim()}`);
      }
      const commit = git(tmpWt, ['commit', '-m', plan.commit_message]);
      if (commit.status !== 0) {
        throw new Error(`git commit failed: ${commit.stderr.trim() || commit.stdout.trim()}`);
      }

      // Get the orphan commit sha.
      const sha = git(tmpWt, ['rev-parse', 'HEAD']);
      const commitSha = sha.status === 0 ? sha.stdout.trim() : undefined;

      // Force-push with-lease to origin/<gh_pages_branch>.
      const push = git(tmpWt, [
        'push',
        '--force-with-lease',
        'origin',
        `HEAD:refs/heads/${plan.branch}`,
      ]);
      if (push.status !== 0) {
        throw new Error(`git push failed: ${push.stderr.trim() || push.stdout.trim()}`);
      }

      // Persist new baseline. A publish that cannot record what it published
      // has not completed its contract: the gate-4 baseline is what protects
      // the next publish from silently overwriting concurrent work, and a
      // swallowed failure here previously left stale baselines that forced
      // --force on every later publish. Surface the failure explicitly
      // (Article 39); the push itself has already succeeded and is reported.
      const baselineDir = join(repoRoot, '.devai/state');
      if (commitSha !== undefined) {
        try {
          mkdirSync(baselineDir, { recursive: true });
          writeFileSync(join(baselineDir, 'docs-publish-baseline.txt'), commitSha + '\n');
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          throw new Error(
            `pushed ${commitSha} to origin/${plan.branch}, but persisting the gate-4 baseline ` +
              `(.devai/state/docs-publish-baseline.txt) failed: ${detail}. The publish is live; ` +
              `sync the baseline before the next publish or gate 4 will raise a false alarm.`,
          );
        }
      }

      const result: PublishResult = {
        pushed: true,
        remote_branch: plan.branch,
        ...(commitSha !== undefined && { commit_sha: commitSha }),
      };
      return result;
    } finally {
      // Drop the temporary orphan branch ref from the source repo if it lingered.
      git(repoRoot, ['worktree', 'remove', '--force', tmpWt]);
      git(repoRoot, ['branch', '-D', orphanBranch]);
    }
  } finally {
    try {
      rmSync(tmpWt, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

interface RunSummary {
  readonly ok: boolean;
  readonly detect?: DetectResult;
  readonly build?: { readonly status: number };
  readonly plan?: PublishPlan;
  readonly publish?: PublishResult;
  readonly dry_run: boolean;
  readonly error?: { readonly stage: 'detect' | 'build' | 'publish'; readonly message: string };
}

function emitOutput(payload: RunSummary, human: boolean): void {
  if (human) {
    if (payload.ok && payload.dry_run && payload.plan) {
      process.stdout.write(`docs publish [dry-run]\n`);
      process.stdout.write(`  branch:       ${payload.plan.branch}\n`);
      process.stdout.write(`  source:       ${payload.plan.commit_sha_source}\n`);
      process.stdout.write(`  message:      ${payload.plan.commit_message}\n`);
      process.stdout.write(`  file_count:   ${String(payload.plan.file_count)}\n`);
      process.stdout.write(`  total_bytes:  ${String(payload.plan.total_bytes)}\n`);
      if (payload.plan.cname) {
        process.stdout.write(`  cname:        ${payload.plan.cname}\n`);
      }
      process.stdout.write(`  output_dir:   ${payload.plan.output_dir_abs}\n`);
      return;
    }
    if (payload.ok && payload.publish) {
      process.stdout.write(
        `docs publish: pushed ${payload.publish.commit_sha ?? '?'} to origin/${payload.publish.remote_branch}\n`,
      );
      return;
    }
    if (!payload.ok && payload.error) {
      process.stderr.write(
        `docs publish failed at ${payload.error.stage}: ${payload.error.message}\n`,
      );
      return;
    }
  } else {
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  }
}

export const docsPublish = defineCommand({
  name: 'docs publish',
  description:
    'Build and force-push docs/site to the gh-pages branch (orphan + with-lease). Three-stage flow: detect → build → publish. Per ADR-LOCAL-PUBLISH-WORKFLOW.',
  authority: 'release_controller',
  extended_doc: [
    '### Flow',
    '',
    'Three sequential stages; failure aborts the run.',
    '',
    '1. **detect** — read `.devai/config/project.json`, validate `repo.kind` + `docs.builder` per ADR-DOCS-GOVERNANCE.',
    '2. **build** — spawn the builder (`docs.build_command`, default per-builder).',
    '3. **publish** — orphan-branch + force-push-with-lease to `gh-pages`.',
    '',
    '### Safety preflights (ADR-LOCAL-PUBLISH-WORKFLOW §7)',
    '',
    '- Working tree clean. Refuse on uncommitted changes.',
    '- Local branch pushed. Refuse if local is ahead of upstream.',
    '- Build exit 0. Refuse on non-zero builder exit.',
    '- gh-pages not newer than baseline. Bypassed only by `--force`.',
    '',
    '### Flags',
    '',
    '- `--repo-root <path>` — default cwd.',
    '- `--builder <docusaurus|jekyll>` — override `docs.builder` (debugging).',
    '- `--message <text>` — publish commit message (default `docs: publish from <sha>`).',
    '- `--dry-run` — run detect + build; print planned action; do not push.',
    '- `--force` — bypass the gh-pages-newer gate ONLY (explicit ack).',
    '- `--format human` — human-readable output.',
    '',
    '### Telemetry (ADR §8)',
    '',
    '- `docs_publish_attempts_total` (counter).',
    '- `docs_publish_errors_total{stage=detect|build|publish}` (counter on failure).',
    '- `docs_publish_duration_ms` (duration of full run).',
    '',
    'Emitted on stderr as a single JSON line (fallback when `@stynx/logging` is not present).',
    '',
    '### Inheritance (ADR §9)',
    '',
    'Adopters invoke this verb from a sibling DEVAI checkout, the same way `devai evidence test matrix` and `devai spec decision close` are invoked. Adopters MUST NOT vendor the verb into their own repo or wrap it in a `.github/workflows/` job (ADR §10).',
  ].join('\n'),
  register(cli: CAC): void {
    cli
      .command('docs-publish', 'Build + push docs/site to gh-pages (local-act publish)')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--builder <name>', `Override docs.builder (one of: ${VALID_BUILDERS.join(', ')})`)
      .option('--message <text>', "Publish commit message (default: 'docs: publish from <sha>')")
      .option('--dry-run', 'Run detect + build; print planned action; do not push')
      .option('--force', 'Bypass the gh-pages-newer preflight gate (explicit ack)')
      .option('--human', 'Human-readable output')
      .action((options: PublishOptions) => {
        const start = Date.now();
        const repoRoot = resolve(options.repoRoot ?? DEFAULT_REPO_ROOT);
        const human = options.human === true;
        const dryRun = options.dryRun === true;
        const force = options.force === true;

        // Stage 1: Detect.
        let det: DetectResult;
        try {
          det = detect(repoRoot, options.builder);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          emitTelemetry({
            attempts_total: 1,
            errors_total: { stage: 'detect' },
            duration_ms: Date.now() - start,
            outcome: 'failure',
          });
          emitOutput(
            { ok: false, dry_run: dryRun, error: { stage: 'detect', message: msg } },
            human,
          );
          process.exit(EXIT_FAIL);
        }

        // Preflight gates 1+2+4 (gate 3 is checked after build).
        // Gate 4 requires fetch which is fine to run before build.
        // Skip in dry-run? No — preflights still produce useful signal.
        const pf = preflights(repoRoot, det.gh_pages_branch, { force });
        if (!pf.ok && !dryRun) {
          emitTelemetry({
            attempts_total: 1,
            errors_total: { stage: 'publish' },
            duration_ms: Date.now() - start,
            outcome: 'failure',
          });
          emitOutput(
            {
              ok: false,
              dry_run: dryRun,
              detect: det,
              error: { stage: 'publish', message: pf.reason },
            },
            human,
          );
          process.exit(EXIT_FAIL);
        }

        // Stage 2: Build.
        let buildRes: BuildResult;
        try {
          buildRes = build(repoRoot, det);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          emitTelemetry({
            attempts_total: 1,
            errors_total: { stage: 'build' },
            duration_ms: Date.now() - start,
            outcome: 'failure',
          });
          emitOutput(
            { ok: false, dry_run: dryRun, detect: det, error: { stage: 'build', message: msg } },
            human,
          );
          process.exit(EXIT_FAIL);
        }
        if (buildRes.status !== 0) {
          // Surface builder diagnostics (last few lines of stderr).
          const tail = buildRes.stderr.split('\n').slice(-20).join('\n');
          emitTelemetry({
            attempts_total: 1,
            errors_total: { stage: 'build' },
            duration_ms: Date.now() - start,
            outcome: 'failure',
          });
          emitOutput(
            {
              ok: false,
              dry_run: dryRun,
              detect: det,
              build: { status: buildRes.status },
              error: {
                stage: 'build',
                message: `builder exited ${String(buildRes.status)}; tail:\n${tail}`,
              },
            },
            human,
          );
          process.exit(EXIT_FAIL);
        }
        if (!existsSync(buildRes.output_dir_abs)) {
          emitTelemetry({
            attempts_total: 1,
            errors_total: { stage: 'build' },
            duration_ms: Date.now() - start,
            outcome: 'failure',
          });
          emitOutput(
            {
              ok: false,
              dry_run: dryRun,
              detect: det,
              build: { status: buildRes.status },
              error: {
                stage: 'build',
                message: `expected output directory ${buildRes.output_dir_abs} does not exist after build`,
              },
            },
            human,
          );
          process.exit(EXIT_FAIL);
        }

        // Stage 3: Publish plan.
        const plan = planPublish(repoRoot, det, buildRes, options.message);

        if (dryRun) {
          // In dry-run, surface preflight failures as a warning rather than abort.
          if (!pf.ok) {
            process.stderr.write(`docs publish [dry-run]: preflight would fail: ${pf.reason}\n`);
          }
          emitTelemetry({
            attempts_total: 1,
            duration_ms: Date.now() - start,
            outcome: 'dry_run',
          });
          emitOutput({ ok: true, dry_run: true, detect: det, build: { status: 0 }, plan }, human);
          process.exitCode = EXIT_PASS;
          return;
        }

        // Real publish.
        try {
          const result = publish(repoRoot, plan);
          emitTelemetry({
            attempts_total: 1,
            duration_ms: Date.now() - start,
            outcome: 'success',
          });
          emitOutput(
            { ok: true, dry_run: false, detect: det, build: { status: 0 }, plan, publish: result },
            human,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          emitTelemetry({
            attempts_total: 1,
            errors_total: { stage: 'publish' },
            duration_ms: Date.now() - start,
            outcome: 'failure',
          });
          emitOutput(
            {
              ok: false,
              dry_run: false,
              detect: det,
              build: { status: 0 },
              plan,
              error: { stage: 'publish', message: msg },
            },
            human,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});

// Quiet unused — kept exported for tests.
void EXIT_USAGE;
