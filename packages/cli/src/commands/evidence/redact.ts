import type { CAC } from 'cac';
import {
  appendRecord,
  deriveEvidenceId,
  loadChain,
  redactRecord,
  type DraftEvidence,
  type EvidenceContext,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE, type RedactionPolicy } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_CHAIN_PATH = 'record/proofs/chain.json';
const DEFAULT_ACTOR = 'harness';
const DEFAULT_ACTOR_ROLE = 'harness';

interface RedactOptions {
  readonly chain?: string;
  readonly field?: string | string[];
  readonly pattern?: string | string[];
  readonly actor?: string;
  readonly actorRole?: string;
  readonly repoRoot?: string;
  readonly timestamp?: string;
}

function toArray<T>(v: T | readonly T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? [...v] : [v as T];
}

function usageError(message: string): never {
  process.stderr.write(`devai evidence redact: ${message}\n`);
  process.exit(EXIT_USAGE);
}

export const evidenceRedact = defineCommand({
  name: 'evidence redact',
  description:
    'Apply a redaction policy to a record, re-link downstream, and log a redaction event',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command(
        'evidence-redact <target-id>',
        'Apply a redaction policy to a record, re-link downstream, and log a redaction event',
      )
      .option('--chain <path>', `Path to evidence chain file (default: ${DEFAULT_CHAIN_PATH})`)
      .option('--field <name>', 'Field name to redact wholesale (repeatable)')
      .option('--pattern <regex>', 'JS regex (with g-flag forced) to redact (repeatable)')
      .option('--actor <name>', `Actor for the redaction event (default: ${DEFAULT_ACTOR})`)
      .option(
        '--actor-role <role>',
        `Actor role for the redaction event (default: ${DEFAULT_ACTOR_ROLE})`,
      )
      .option('--repo-root <path>', 'repo_root for the redaction event (default: cwd)')
      .option('--timestamp <iso>', 'Override the redaction-event timestamp (default: now)')
      .action((targetId: string, options: RedactOptions) => {
        try {
          const chainPath = options.chain ?? DEFAULT_CHAIN_PATH;
          const fields = toArray(options.field);
          const patternStrings = toArray(options.pattern);

          if (fields.length === 0 && patternStrings.length === 0) {
            usageError('at least one --field or --pattern is required');
          }

          const patterns = patternStrings.map((p) => {
            try {
              return new RegExp(p, 'g');
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              usageError(`invalid --pattern "${p}": ${msg}`);
            }
          });
          const policy: RedactionPolicy = { fields, patterns };

          const redactResult = redactRecord({ chainPath, targetId, policy });

          const actor = options.actor ?? DEFAULT_ACTOR;
          const actorRole = options.actorRole ?? DEFAULT_ACTOR_ROLE;
          const timestamp = options.timestamp ?? new Date().toISOString();
          const repoRoot = options.repoRoot ?? process.cwd();

          const context: EvidenceContext = {
            repo_root: repoRoot,
            git: { head_sha: null, dirty_files: [] },
          };

          const chainAfterRedact = loadChain(chainPath);
          const eventId = deriveEvidenceId({
            timestamp,
            actor,
            actor_role: actorRole,
            action: 'evidence.redact',
            status: 'completed',
            git_head_sha: null,
            artifact_sha256s: [],
            previous_run_hash: chainAfterRedact.head,
          });

          const notes = [
            `target_record_id=${targetId}`,
            `new_target_hash=${redactResult.target.manifest_hash}`,
            `relinked_downstream=${String(redactResult.relinkedCount)}`,
            ...(fields.length > 0 ? [`fields_redacted=${fields.join(',')}`] : []),
            ...(patternStrings.length > 0 ? [`patterns_redacted=${patternStrings.join('|')}`] : []),
          ];

          const eventDraft: DraftEvidence = {
            id: eventId,
            timestamp,
            actor,
            actor_role: actorRole,
            action: 'evidence.redact',
            status: 'completed',
            context,
            artifacts: [],
            notes,
          };

          const eventRecord = appendRecord(chainPath, eventDraft);
          process.stdout.write(
            JSON.stringify({
              target_id: targetId,
              new_target_hash: redactResult.target.manifest_hash,
              relinked_count: redactResult.relinkedCount,
              redaction_event_id: eventRecord.id,
              new_head: eventRecord.manifest_hash,
            }) + '\n',
          );
          process.exitCode = EXIT_PASS;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai evidence redact: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
