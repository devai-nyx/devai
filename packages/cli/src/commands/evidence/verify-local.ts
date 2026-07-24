import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from '@devai-nyx/authority';
import type { CAC } from 'cac';
import {
  LocalEvidenceError,
  normalizeActorList,
  verifyLocalEvidence,
  type VerifyContext,
  type VerifyMode,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface VerifyLocalOptions {
  readonly repoRoot?: string;
  readonly mode?: string;
  readonly manifest?: string;
  readonly actor?: string;
  readonly trustedActors?: string;
  readonly eventName?: string;
  readonly ref?: string;
  readonly headMessage?: string;
  readonly changedFiles?: string;
}

interface GithubEvent {
  readonly head_commit?: { readonly message?: string };
  readonly before?: string;
}

function readEvent(): GithubEvent {
  const path = process.env['GITHUB_EVENT_PATH'];
  if (path === undefined || !existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as GithubEvent;
  } catch {
    return {};
  }
}

function isAllZeroSha(value: string): boolean {
  return value.length > 0 && /^0+$/u.test(value);
}

function gitChangedFiles(repoRoot: string, before: string, after: string): string[] | null {
  if (before.length === 0 || after.length === 0) return null;
  const args = isAllZeroSha(before)
    ? ['diff-tree', '--no-commit-id', '--name-only', '-r', after]
    : ['diff', '--name-only', `${before}..${after}`];
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/u).filter((f) => f.length > 0);
}

function resolveChangedFiles(repoRoot: string, options: VerifyLocalOptions): string[] | null {
  if (options.changedFiles !== undefined) {
    return readFileSync(options.changedFiles, 'utf8')
      .split(/\r?\n/u)
      .filter((f) => f.length > 0);
  }
  const fromEnv = process.env['LOCAL_EVIDENCE_CHANGED_FILES'];
  if (fromEnv !== undefined && fromEnv.length > 0) {
    return fromEnv.split(/\r?\n/u).filter((f) => f.length > 0);
  }
  const event = readEvent();
  const before = event.before ?? process.env['GITHUB_EVENT_BEFORE'] ?? '';
  const after = process.env['GITHUB_SHA'] ?? '';
  return gitChangedFiles(repoRoot, before, after);
}

export const evidenceVerifyLocal = defineCommand({
  name: 'evidence verify-local',
  description: 'Verify a local-CI evidence manifest against the declared policy (fail-closed)',
  authority: 'policy_firewall',
  extended_doc: `Promoted from the stynx C-4 prototype by D-117 (ADR-CI-ECONOMY Decisions 1-3).

The single verifier behind the reusable evidence gate
(.github/workflows/reusable-evidence-gate.yml): it decides whether a
direct main push carrying a \`Local-CI-Evidence:\` commit trailer may
skip the heavy remote tiers. Fallback semantics are never-silently-open:
no claim → evidence_mode=false and heavy tiers run; a claimed manifest
that is missing, stale, tree-mismatched, laxer than the declared
\`ci_economy.local_evidence\` policy, untrusted, or accompanied by
policy-sensitive file changes → hard FAIL.

Modes: \`gate\` (emit evidence_mode output for downstream jobs),
\`auto\` (standalone policy verification in CI), \`strict\` (local
pre-push validation, no trust/trailer requirements).

Gate mode emits a parseable \`evidence_mode=true|false\` stdout line. The
host workflow owns any requested \`GITHUB_OUTPUT\` file mutation; this read
action never appends canonical state or arbitrary files (D-139).`,
  register(cli: CAC): void {
    cli
      .command(
        'evidence-verify-local',
        'Verify a local-CI evidence manifest against the declared policy (fail-closed)',
      )
      .option('--mode <mode>', 'auto|strict|gate (default: auto)')
      .option('--manifest <path>', 'Override the declared manifest path')
      .option('--actor <github-user>', 'Actor to validate against the trusted-actor allowlist')
      .option(
        '--trusted-actors <list>',
        'Trusted actors (comma/space/semicolon separated; default: env LOCAL_EVIDENCE_TRUSTED_ACTORS)',
      )
      .option('--event-name <name>', 'Override GITHUB_EVENT_NAME')
      .option('--ref <ref>', 'Override GITHUB_REF')
      .option('--head-message <msg>', 'Override the head commit message (trailer source)')
      .option(
        '--changed-files <path>',
        'Newline-separated changed-file list for forbidden-path checks',
      )
      .option('--repo-root <path>', 'Repo root (default: cwd)')
      .action((options: VerifyLocalOptions) => {
        const mode = (options.mode ?? 'auto') as VerifyMode;
        if (!['auto', 'strict', 'gate'].includes(mode)) {
          process.stderr.write(`devai evidence local verify: unsupported --mode ${mode}\n`);
          process.exit(EXIT_USAGE);
        }
        const repoRoot = options.repoRoot ?? process.cwd();
        try {
          const event = readEvent();
          const context: VerifyContext = {
            eventName: options.eventName ?? process.env['GITHUB_EVENT_NAME'] ?? '',
            ref: options.ref ?? process.env['GITHUB_REF'] ?? '',
            actor: options.actor ?? process.env['GITHUB_ACTOR'] ?? '',
            headMessage:
              options.headMessage ??
              process.env['LOCAL_EVIDENCE_HEAD_MESSAGE'] ??
              event.head_commit?.message ??
              '',
            changedFiles: resolveChangedFiles(repoRoot, options),
          };
          const trustedActors = normalizeActorList(
            options.trustedActors ?? process.env['LOCAL_EVIDENCE_TRUSTED_ACTORS'] ?? '',
          );

          const result = verifyLocalEvidence({
            repoRoot,
            mode,
            context,
            trustedActors,
            ...(options.manifest !== undefined && { manifestPath: options.manifest }),
          });

          process.stdout.write(
            `${mode === 'gate' ? `evidence_mode=${result.evidenceMode ? 'true' : 'false'}\n` : ''}${result.message}\n`,
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          if (mode === 'gate') process.stdout.write('evidence_mode=false\n');
          const msg = err instanceof Error ? err.message : String(err);
          const kind = err instanceof LocalEvidenceError ? 'policy failure' : 'error';
          process.stderr.write(`devai evidence local verify (${kind}): ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
