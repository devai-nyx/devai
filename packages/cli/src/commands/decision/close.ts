import type { CAC } from 'cac';
import { closeDecision, closeDecisionsFromRound } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = process.cwd();

const VALID_DISPOSITIONS = ['closed', 'superseded', 'invalidated'] as const;
type Disposition = (typeof VALID_DISPOSITIONS)[number];

interface CloseOptions {
  readonly repoRoot?: string;
  readonly disposition?: string;
  readonly evidence?: string;
  readonly note?: string;
  readonly force?: boolean;
  readonly fromRound?: string;
  readonly resolvedBy?: string;
  readonly human?: boolean;
}

/**
 * D-A-42 — `devai spec decision close`.
 *
 * Append-only closure for ledger records. Writes a new
 * `kind: 'resolution'` record referencing the original DEC via
 * `resolves_dec_id`. The original record's bytes are never modified;
 * the ledger remains append-only (per docs/adopters/decisions-ledger.md
 * "Append discipline").
 *
 * Two modes:
 *   - Single id: `devai spec decision close DEC-NNNN --disposition <kind> ...`
 *   - Batch:     `devai spec decision close --from-round <R-id> --disposition <kind> ...`
 *
 * `--force` allows appending a second resolution record for an already-
 * resolved DEC (e.g. when a `closed` decision is later superseded).
 */
export const decisionClose = defineCommand({
  name: 'decision close',
  description:
    'Append a resolution record to the decisions ledger (closed | superseded | invalidated). Original DEC record is not modified. Per D-A-42.',
  authority: 'mesh_controller',
  extended_doc: [
    '### Single-id form',
    '',
    '```',
    'devai spec decision close DEC-0001 \\',
    '  --disposition closed \\',
    '  --evidence commit:abc1234 \\',
    '  --note "shipped in R5-W4"',
    '```',
    '',
    '### Batch form (close every open DEC from a given round)',
    '',
    '```',
    'devai spec decision close \\',
    '  --from-round R3 \\',
    '  --disposition closed \\',
    '  --evidence "path/to/round-closeout.md" \\',
    '  --note "TEAT migration: backlog actioned in R5"',
    '```',
    '',
    '### Flags',
    '',
    '- `--disposition <kind>` (required) — one of `closed | superseded | invalidated`.',
    '- `--evidence <ref>` — pointer to the evidence justifying the resolution (file path, commit sha, run-id). Optional but recommended.',
    '- `--note <text>` — free-text note appended to the resolution record.',
    '- `--from-round <id>` — batch mode: close every open DEC whose `context.round_id` matches the prefix (e.g. `R3` matches `R3`, `R3-W1`, `R3-W2-A.1`). Mutually exclusive with the positional DEC id.',
    '- `--resolved-by <token>` — identity of the resolver (default: `human:<git-user>` if a git config user is set, else `human:cli`).',
    '- `--force` — append a resolution record even if the DEC already has one. Without `--force`, double-closure is a non-zero exit.',
    '',
    '### Exit codes',
    '',
    '- `0` — at least one resolution record written.',
    '- `2` — validation error (unknown DEC id, double-closure without `--force`, missing required flag).',
    '',
    '### Schema',
    '',
    'The resolution record validates against',
    '[`law/schemas/decisions.schema.json#/$defs/resolutionRecord`](../../framework/contracts/decisions.schema.json).',
    '',
    '### Migration recipes',
    '',
    'See [`docs/reference/skills/round-execute.md`](../skills/round-execute.md) "Adopter operations"',
    'for SGP (4 records) and TEAT (22 records) migration paths.',
  ].join('\n'),
  register(cli: CAC): void {
    cli
      .command('decision-close [decId]', 'Close a DEC ledger entry (append-only resolution record)')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--disposition <kind>', `One of: ${VALID_DISPOSITIONS.join(', ')} (required)`)
      .option('--evidence <ref>', 'Pointer to evidence (path, commit sha, run-id)')
      .option('--note <text>', 'Free-text note attached to the resolution')
      .option('--resolved-by <token>', 'Identity of the resolver (default: human:cli)')
      .option('--from-round <id>', 'Batch: close every open DEC from this round prefix (e.g. R3)')
      .option('--force', 'Append a resolution even if the DEC already has one')
      .option('--human', 'Human-readable output')
      .action((decIdArg: string | undefined, options: CloseOptions) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const dispositionRaw = options.disposition;
        if (
          dispositionRaw === undefined ||
          !VALID_DISPOSITIONS.includes(dispositionRaw as Disposition)
        ) {
          process.stderr.write(
            `devai spec decision close: --disposition must be one of ${VALID_DISPOSITIONS.join(', ')}\n`,
          );
          process.exit(EXIT_USAGE);
        }
        const disposition = dispositionRaw as Disposition;
        const resolvedBy = options.resolvedBy ?? 'human:cli';
        const force = options.force === true;

        const fromRound = options.fromRound;
        const usingBatch = fromRound !== undefined && fromRound.length > 0;
        const usingSingle = decIdArg !== undefined && decIdArg.length > 0;

        if (usingBatch && usingSingle) {
          process.stderr.write(
            'devai spec decision close: --from-round and a positional DEC id are mutually exclusive\n',
          );
          process.exit(EXIT_USAGE);
        }
        if (!usingBatch && !usingSingle) {
          process.stderr.write(
            'devai spec decision close: pass a DEC id (e.g. DEC-0001) or --from-round <id>\n',
          );
          process.exit(EXIT_USAGE);
        }

        try {
          if (usingBatch) {
            const ids = closeDecisionsFromRound(repoRoot, {
              round: fromRound,
              disposition,
              resolvedBy,
              ...(options.evidence !== undefined && { evidenceRef: options.evidence }),
              ...(options.note !== undefined && { note: options.note }),
              force,
            });
            if (options.human === true) {
              process.stdout.write(
                `Wrote ${String(ids.length)} resolution record(s) for round prefix '${fromRound}'.\n`,
              );
              for (const id of ids) process.stdout.write(`  ${id}\n`);
            } else {
              process.stdout.write(
                JSON.stringify({ ok: true, count: ids.length, ids }, null, 2) + '\n',
              );
            }
            process.exitCode = EXIT_PASS;
            return;
          }
          // Single-id form
          const decId = decIdArg as string;
          const id = closeDecision(repoRoot, {
            decId,
            disposition,
            resolvedBy,
            ...(options.evidence !== undefined && { evidenceRef: options.evidence }),
            ...(options.note !== undefined && { note: options.note }),
            force,
          });
          if (options.human === true) {
            process.stdout.write(`Wrote resolution: ${id}\n`);
          } else {
            process.stdout.write(
              JSON.stringify({ ok: true, id, resolves_dec_id: decId, disposition }, null, 2) + '\n',
            );
          }
          process.exitCode = EXIT_PASS;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai spec decision close: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
