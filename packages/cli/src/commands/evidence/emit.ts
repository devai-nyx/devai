import { readFileSync, readSync } from 'node:fs';
import type { CAC } from 'cac';
import {
  appendRecord,
  deriveEvidenceId,
  gatherGitContext,
  loadChain,
  type DraftEvidence,
  type EvidenceArtifact,
  type EvidenceContext,
  type FindingsSummary,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_CHAIN_PATH = 'record/proofs/chain.json';

const VALID_ACTOR_ROLES = new Set([
  'human:owner',
  'human:architect',
  'human:inspector',
  'human:engineer',
  'human:auditor',
  'agent:owner',
  'agent:architect',
  'agent:inspector',
  'agent:engineer',
  'agent:auditor',
  'harness',
]);

const VALID_STATUSES = new Set(['started', 'completed', 'failed', 'escalated', 'paused']);

interface EmitOptions {
  readonly chain?: string;
  readonly actor?: string;
  readonly actorRole?: string;
  readonly status?: string;
  readonly note?: string | string[];
  readonly artifact?: string | string[];
  readonly taskId?: string;
  readonly worktreeId?: string;
  readonly timestamp?: string;
  readonly git?: boolean;
  readonly repoRoot?: string;
  readonly fromFile?: string;
  readonly stdin?: boolean;
}

interface FileInput {
  readonly action: string;
  readonly actor: string;
  readonly actor_role: string;
  readonly status: string;
  readonly context: EvidenceContext;
  readonly timestamp?: string;
  readonly artifacts?: readonly EvidenceArtifact[];
  readonly notes?: readonly string[];
  readonly findings_summary?: FindingsSummary;
}

function usageError(message: string): never {
  process.stderr.write(`devai evidence emit: ${message}\n`);
  process.exit(EXIT_USAGE);
}

function parseArtifact(ref: string): EvidenceArtifact {
  const colonIdx = ref.lastIndexOf(':');
  if (colonIdx === -1) {
    throw new Error(`invalid --artifact "${ref}": expected path:sha256 (or path: for null sha)`);
  }
  const path = ref.slice(0, colonIdx);
  const sha = ref.slice(colonIdx + 1);
  return { path, sha256: sha.length > 0 ? sha : null };
}

function toArray<T>(v: T | readonly T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? [...v] : [v as T];
}

function readStdinSync(): string {
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(8192);
  while (true) {
    let bytesRead = 0;
    try {
      bytesRead = readSync(0, buf, 0, buf.length, null);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EAGAIN') continue;
      if (code === 'EOF') break;
      throw err;
    }
    if (bytesRead === 0) break;
    chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function validateFileInput(input: unknown): FileInput {
  if (input === null || typeof input !== 'object') {
    throw new Error('input must be a JSON object');
  }
  const obj = input as Record<string, unknown>;
  for (const field of ['action', 'actor', 'actor_role', 'status']) {
    if (typeof obj[field] !== 'string' || (obj[field] as string).length === 0) {
      throw new Error(`missing or invalid required field '${field}'`);
    }
  }
  if (obj.context === null || typeof obj.context !== 'object') {
    throw new Error("missing or invalid required field 'context'");
  }
  return obj as unknown as FileInput;
}

function buildDraftFromFlags(
  action: string,
  options: EmitOptions,
  chainHead: string | null,
): DraftEvidence {
  if (
    options.actor === undefined ||
    options.actorRole === undefined ||
    options.status === undefined
  ) {
    usageError('--actor, --actor-role, --status are required (or use --from-file/--stdin)');
  }
  if (!VALID_ACTOR_ROLES.has(options.actorRole)) {
    usageError(`invalid --actor-role '${options.actorRole}'`);
  }
  if (!VALID_STATUSES.has(options.status)) {
    usageError(`invalid --status '${options.status}'`);
  }

  const timestamp = options.timestamp ?? new Date().toISOString();
  const useGit = options.git !== false;
  const repoRoot = options.repoRoot ?? process.cwd();
  const gitCtx = useGit ? gatherGitContext(repoRoot) : { head_sha: null, dirty_files: [] };

  const context: EvidenceContext = {
    repo_root: repoRoot,
    ...(options.taskId !== undefined && { task_id: options.taskId }),
    ...(options.worktreeId !== undefined && { worktree_id: options.worktreeId }),
    git: gitCtx,
  };

  const artifacts: EvidenceArtifact[] = toArray(options.artifact).map(parseArtifact);
  const notes = toArray(options.note);

  const id = deriveEvidenceId({
    timestamp,
    actor: options.actor,
    actor_role: options.actorRole,
    action,
    status: options.status,
    git_head_sha: gitCtx.head_sha,
    artifact_sha256s: artifacts.map((a) => a.sha256),
    previous_run_hash: chainHead,
  });

  return {
    id,
    timestamp,
    actor: options.actor,
    actor_role: options.actorRole,
    action,
    status: options.status,
    context,
    artifacts,
    ...(notes.length > 0 && { notes }),
  };
}

function buildDraftFromFile(input: FileInput, chainHead: string | null): DraftEvidence {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const artifacts: EvidenceArtifact[] = input.artifacts ? [...input.artifacts] : [];
  const id = deriveEvidenceId({
    timestamp,
    actor: input.actor,
    actor_role: input.actor_role,
    action: input.action,
    status: input.status,
    git_head_sha: input.context.git.head_sha,
    artifact_sha256s: artifacts.map((a) => a.sha256),
    previous_run_hash: chainHead,
  });
  return {
    id,
    timestamp,
    actor: input.actor,
    actor_role: input.actor_role,
    action: input.action,
    status: input.status,
    context: input.context,
    artifacts,
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.findings_summary !== undefined && { findings_summary: input.findings_summary }),
  };
}

export const evidenceEmit = defineCommand({
  name: 'evidence emit',
  description: 'Append a new evidence record to the chain',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('evidence-emit [action]', 'Append a new evidence record to the chain')
      .option('--chain <path>', `Path to evidence chain file (default: ${DEFAULT_CHAIN_PATH})`)
      .option('--actor <name>', 'Actor name (required in flags mode)')
      .option('--actor-role <role>', 'Actor role (required in flags mode)')
      .option('--status <status>', 'Record status: started|completed|failed|escalated|paused')
      .option('--note <msg>', 'Free-form note (repeatable)')
      .option('--artifact <ref>', 'Artifact reference path:sha256 (repeatable; path: for null sha)')
      .option('--task-id <id>', 'Task ID context')
      .option('--worktree-id <id>', 'Worktree ID context')
      .option('--timestamp <iso>', 'Override the timestamp (default: now)')
      .option('--no-git', 'Skip git context gathering')
      .option('--repo-root <path>', 'Override repo_root (default: cwd)')
      .option('--from-file <path>', 'Read full record JSON from path')
      .option('--stdin', 'Read full record JSON from stdin (mutually exclusive with --from-file)')
      .action((action: string | undefined, options: EmitOptions) => {
        try {
          const chainPath = options.chain ?? DEFAULT_CHAIN_PATH;
          const fromFile = options.fromFile !== undefined;
          const fromStdin = options.stdin === true;

          if (fromFile && fromStdin) {
            usageError('--from-file and --stdin are mutually exclusive');
          }

          let draft: DraftEvidence;

          if (fromFile || fromStdin) {
            if (
              options.actor !== undefined ||
              options.actorRole !== undefined ||
              options.status !== undefined ||
              action !== undefined
            ) {
              usageError(
                '--from-file/--stdin cannot be combined with --actor/--actor-role/--status or the action positional',
              );
            }
            const text = fromStdin
              ? readStdinSync()
              : readFileSync(options.fromFile as string, 'utf8');
            const input = validateFileInput(JSON.parse(text));
            const chain = loadChain(chainPath);
            draft = buildDraftFromFile(input, chain.head);
          } else {
            if (action === undefined) {
              usageError('missing positional <action>');
            }
            const chain = loadChain(chainPath);
            draft = buildDraftFromFlags(action, options, chain.head);
          }

          const record = appendRecord(chainPath, draft);
          process.stdout.write(
            JSON.stringify({ id: record.id, manifest_hash: record.manifest_hash }) + '\n',
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai evidence emit: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
