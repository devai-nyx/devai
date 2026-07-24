import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import type { CAC } from 'cac';
import { spawnSync } from '@devai-nyx/authority';
import {
  appendVerbEvidence,
  validateActionsEvidenceShadowTuple,
  type ActionsEvidenceShadowDecision,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_CHAIN_PATH = 'record/proofs/chain.json';
const TUPLE_FILES = ['manifest.json', 'full-result.json', 'decision.json'] as const;

interface ActionsVerifyOptions {
  readonly repoRoot?: string;
  readonly tuple?: string;
  readonly chain?: string;
  readonly human?: boolean;
}

function repoRelative(repoRoot: string, path: string): string {
  const result = relative(repoRoot, path);
  if (result.length === 0 || result === '..' || result.startsWith(`..${sep}`)) {
    throw new Error('tuple directory must be contained by --repo-root');
  }
  return result.split(sep).join('/');
}

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function mergeParents(repoRoot: string, mergeSha: string): string[] {
  const result = spawnSync('git', ['rev-list', '--parents', '-n', '1', mergeSha], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `cannot resolve imported merge ${mergeSha}: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
  const [resolved, ...parents] = result.stdout
    .trim()
    .split(/\s+/u)
    .filter((value) => value.length > 0);
  if (resolved !== mergeSha) throw new Error(`cannot resolve imported merge ${mergeSha}`);
  return parents;
}

export const evidenceActionsVerify = defineCommand({
  name: 'evidence actions-verify',
  description:
    'Validate an imported Actions shadow tuple and append its byte-exact digests to the Article-32 evidence chain.',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command(
        'evidence-actions-verify',
        'Validate and durably record an imported Actions shadow tuple',
      )
      .option('--repo-root <path>', 'Repository root (default: cwd)')
      .option(
        '--tuple <path>',
        'Imported tuple directory containing the three canonical JSON files',
      )
      .option('--chain <path>', `Evidence chain path (default: ${DEFAULT_CHAIN_PATH})`)
      .option('--human', 'Human-readable output')
      .action((options: ActionsVerifyOptions) => {
        try {
          const repoRoot = resolve(options.repoRoot ?? process.cwd());
          if (options.tuple === undefined) throw new Error('--tuple is required');
          const tupleRoot = resolve(repoRoot, options.tuple);
          const tupleRelative = repoRelative(repoRoot, tupleRoot);
          const paths = Object.fromEntries(
            TUPLE_FILES.map((name) => [name, resolve(tupleRoot, name)]),
          ) as Record<(typeof TUPLE_FILES)[number], string>;
          const manifest = parseJson(paths['manifest.json']);
          const fullResult = parseJson(paths['full-result.json']);
          const decision = parseJson(paths['decision.json']);
          const mergeSha = (decision as Partial<ActionsEvidenceShadowDecision>).mergedCommitSha;
          if (typeof mergeSha !== 'string') throw new Error('shadow decision merge SHA is missing');
          const observation = validateActionsEvidenceShadowTuple({
            manifest,
            fullResult,
            decision,
            mergeParents: mergeParents(repoRoot, mergeSha),
          });
          const artifacts = TUPLE_FILES.map((name) => ({
            path: `${tupleRelative}/${name}`,
            sha256: sha256(paths[name]),
          }));
          const recorded = appendVerbEvidence({
            repoRoot,
            chainPath: resolve(repoRoot, options.chain ?? DEFAULT_CHAIN_PATH),
            action: 'ci.actions-evidence.shadow',
            status: 'completed',
            artifacts,
            notes: [
              `main merge ${observation.mergeSha}`,
              `disposition ${observation.disposition}`,
              `shadow/full equivalent ${String(observation.shadowFullEquivalent)}`,
            ],
          });
          if (!recorded.ok || recorded.id === undefined) {
            throw new Error(recorded.error ?? 'evidence-chain append failed');
          }
          if (options.human === true) {
            process.stdout.write(
              `actions evidence verify: ${observation.disposition} for ${observation.mergeSha}\n` +
                `  evidence: ${recorded.id}\n` +
                `  tuple: ${tupleRelative}\n`,
            );
          } else {
            process.stdout.write(
              `${JSON.stringify({ ok: true, observation, evidence_id: recorded.id, artifacts }, null, 2)}\n`,
            );
          }
          process.exitCode = EXIT_PASS;
        } catch (error) {
          process.stderr.write(
            `devai evidence actions verify: ${error instanceof Error ? error.message : String(error)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
