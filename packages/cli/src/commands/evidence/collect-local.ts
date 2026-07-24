import type { CAC } from 'cac';
import { collectLocalEvidence } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

interface CollectLocalOptions {
  readonly repoRoot?: string;
  readonly job?: string | string[];
  readonly output?: string;
  readonly human?: boolean;
}

function toArray<T>(v: T | readonly T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? [...v] : [v as T];
}

export const evidenceCollectLocal = defineCommand({
  name: 'evidence collect-local',
  description: 'Assemble a local-CI evidence manifest from per-job artifact directories',
  authority: 'mesh_controller',
  extended_doc: `Promoted from the stynx C-4 prototype by D-117 (ADR-CI-ECONOMY Decisions 1-3).

Run the heavy CI tiers locally, capture each job's artifacts (with a
\`metadata.txt\` of \`key=value\` lines declaring at least \`job\` and
\`platform\`), then collect:

    devai evidence local collect \\
      --job all-linux:reports/ci-local/<run-a> \\
      --job release:reports/ci-local/<run-b>

The manifest is written to the path declared in
\`ci_economy.local_evidence.manifest_path\` (default
\`.ci/evidence/local-ci.json\`), validated against
local-evidence-manifest.schema.json, and bound to the exact tree via
a sourceHash over every git-tracked file. Commit it with a
\`Local-CI-Evidence: <manifest-path>\` trailer to claim evidence mode
on a direct main push. Local evidence is a maintainer shortcut for
direct pushes — it never replaces pull-request CI.`,
  register(cli: CAC): void {
    cli
      .command(
        'evidence-collect-local',
        'Assemble a local-CI evidence manifest from per-job artifact directories',
      )
      .option('--job <name:dir>', 'Job name and artifact directory, colon-separated (repeatable)')
      .option('--output <path>', 'Override the declared manifest output path')
      .option('--repo-root <path>', 'Repo root (default: cwd)')
      .option('--human', 'Emit a human-readable summary instead of JSON')
      .action((options: CollectLocalOptions) => {
        try {
          const repoRoot = options.repoRoot ?? process.cwd();
          const jobDirs: Record<string, string> = {};
          for (const ref of toArray(options.job)) {
            const colonIdx = ref.indexOf(':');
            if (colonIdx <= 0 || colonIdx === ref.length - 1) {
              process.stderr.write(
                `devai evidence local collect: invalid --job "${ref}": expected name:dir\n`,
              );
              process.exit(EXIT_USAGE);
            }
            jobDirs[ref.slice(0, colonIdx)] = ref.slice(colonIdx + 1);
          }
          if (Object.keys(jobDirs).length === 0) {
            process.stderr.write(
              'devai evidence local collect: at least one --job <name:dir> is required\n',
            );
            process.exit(EXIT_USAGE);
          }

          const result = collectLocalEvidence({
            repoRoot,
            jobDirs,
            ...(options.output !== undefined && { outputPath: options.output }),
          });
          if (options.human === true) {
            process.stdout.write(
              `evidence collect-local: wrote ${result.outputPath}\n` +
                `  jobs: ${Object.keys(result.manifest.jobs).join(', ')}\n` +
                `  sourceHash: ${result.manifest.sourceHash.value} (${String(result.manifest.sourceHash.fileCount)} files)\n`,
            );
          } else {
            process.stdout.write(
              JSON.stringify({
                output: result.outputPath,
                sourceHash: result.manifest.sourceHash,
                jobs: Object.keys(result.manifest.jobs),
              }) + '\n',
            );
          }
          process.exitCode = EXIT_PASS;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai evidence local collect: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
