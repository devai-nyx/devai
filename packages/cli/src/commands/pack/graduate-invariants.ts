import { copyFileSync, existsSync, mkdirSync, readFileSync } from '@devai-nyx/authority';
import { basename, dirname, isAbsolute, join, resolve as pathResolve } from 'node:path';
import type { CAC } from 'cac';
import { resolveStackAdapterPack, type StackAdapterPack } from '#core-compat';
import { validators } from '@devai-nyx/schemas';
import { EXIT_FAIL, EXIT_PASS, EXIT_REVIEW, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

const DEFAULT_REPO_ROOT = '.';

/**
 * Follow-on B (Phase 17.G post-audit): graduate a stack-adapter
 * pack's seed_invariants into the adopter's
 * law/invariants/ tree.
 *
 * Steps:
 *   1. Resolve the pack (via --pack-id, --pack-dir, or auto-detect).
 *   2. For each path in pack.seed_invariants[], read + validate it
 *      against invariant.schema.json.
 *   3. Copy to <target-repo>/law/invariants/<id>.json.
 *      Collision detection: existing file with the same id is
 *      skipped unless --force.
 *   4. Report per-file: copied | skipped (exists) | error (schema).
 *
 * Exit-code policy:
 *   EXIT_PASS    every seed invariant copied or skipped cleanly
 *   EXIT_REVIEW  at least one skipped (collision; --force not set)
 *   EXIT_FAIL    at least one schema-invalid OR no pack matched
 */

interface Options {
  readonly repoRoot?: string;
  readonly targetRoot?: string;
  readonly packId?: string;
  readonly packDir?: string;
  readonly seedsDir?: string;
  readonly force?: boolean;
  readonly dryRun?: boolean;
  readonly human?: boolean;
}

type PerFileResult =
  | { status: 'copied'; source: string; target: string; invariant_id: string }
  | { status: 'skipped-exists'; source: string; target: string; invariant_id: string }
  | { status: 'error'; source: string; message: string };

export const packGraduateInvariants = defineCommand({
  name: 'pack graduate-invariants',
  description: "Copy a stack-adapter pack's seed_invariants into law/invariants/.",
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command(
        'pack-graduate-invariants',
        "Graduate seed_invariants from a stack-adapter pack into the adopter's invariant catalog",
      )
      .option(
        '--repo-root <path>',
        `Repo root where the pack lives (default: ${DEFAULT_REPO_ROOT})`,
      )
      .option(
        '--target-root <path>',
        'Repo root where invariants will be written (default: same as --repo-root)',
      )
      .option('--pack-id <id>', 'Force a specific pack id; bypasses auto-detection')
      .option(
        '--pack-dir <path>',
        'Direct path to a pack dir (alternative to --pack-id; useful for out-of-tree packs)',
      )
      .option('--seeds-dir <csv>', 'Additional pack directories to consider during auto-detect')
      .option('--force', 'Overwrite existing INV-*.json files with same id (default: skip)')
      .option('--dry-run', 'Do not copy; report what would happen')
      .option('--human', 'Human-readable summary')
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const targetRoot = options.targetRoot ?? repoRoot;

        let pack: StackAdapterPack | null = null;
        if (options.packDir !== undefined) {
          // Direct-load path: read the manifest at the given dir.
          const manifestPath = join(options.packDir, 'stack-adapter.json');
          if (!existsSync(manifestPath)) {
            process.stderr.write(
              `pack graduate-invariants: no stack-adapter.json at ${options.packDir}\n`,
            );
            process.exit(EXIT_USAGE);
          }
          try {
            const body = JSON.parse(readFileSync(manifestPath, 'utf8')) as StackAdapterPack;
            pack = { ...body, _packDir: pathResolve(options.packDir) };
          } catch (err) {
            process.stderr.write(
              `pack graduate-invariants: failed to parse ${manifestPath}: ${err instanceof Error ? err.message : String(err)}\n`,
            );
            process.exit(EXIT_FAIL);
          }
        } else {
          const additional = options.seedsDir
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const resolution = resolveStackAdapterPack({
            repoRoot,
            ...(options.packId !== undefined && { explicitId: options.packId }),
            ...(additional !== undefined &&
              additional.length > 0 && { additionalDirs: additional }),
          });
          pack = resolution.matched;
          if (pack === null) {
            const msg =
              options.packId !== undefined
                ? `no pack matched id '${options.packId}'`
                : 'no pack matched the current repo (detect signals; pass --pack-id or --pack-dir to force)';
            process.stderr.write(`pack graduate-invariants: ${msg}\n`);
            process.exit(EXIT_FAIL);
          }
        }

        const packDir = pack._packDir;
        if (packDir === undefined) {
          process.stderr.write(
            'pack graduate-invariants: resolved pack has no _packDir (internal error)\n',
          );
          process.exit(EXIT_FAIL);
        }
        const seedPaths = pack.seed_invariants ?? [];
        if (seedPaths.length === 0) {
          const out = {
            pack_id: pack.id,
            results: [] as PerFileResult[],
            counts: { copied: 0, 'skipped-exists': 0, error: 0 },
            notes: ['pack has empty seed_invariants[]; nothing to graduate'],
          };
          if (options.human === true) {
            process.stdout.write(
              `pack graduate-invariants ${pack.id}: 0 seed invariants (nothing to graduate)\n`,
            );
          } else {
            process.stdout.write(JSON.stringify(out) + '\n');
          }
          process.exitCode = EXIT_PASS;
          return;
        }

        const results: PerFileResult[] = [];
        const targetDir = join(targetRoot, 'law/invariants');

        for (const rel of seedPaths) {
          const sourcePath = isAbsolute(rel) ? rel : join(packDir, rel);
          if (!existsSync(sourcePath)) {
            results.push({
              status: 'error',
              source: sourcePath,
              message: 'seed_invariants entry does not exist on disk',
            });
            continue;
          }
          let body: unknown;
          try {
            body = JSON.parse(readFileSync(sourcePath, 'utf8'));
          } catch (err) {
            results.push({
              status: 'error',
              source: sourcePath,
              message: `parse error: ${err instanceof Error ? err.message : String(err)}`,
            });
            continue;
          }
          const ok = validators.invariant(body);
          if (!ok) {
            results.push({
              status: 'error',
              source: sourcePath,
              message: `schema invalid: ${JSON.stringify(validators.invariant.errors)}`,
            });
            continue;
          }
          const typed = body as { id: string };
          const targetPath = join(targetDir, `${typed.id}.json`);
          if (existsSync(targetPath) && options.force !== true) {
            results.push({
              status: 'skipped-exists',
              source: sourcePath,
              target: targetPath,
              invariant_id: typed.id,
            });
            continue;
          }
          if (options.dryRun !== true) {
            try {
              mkdirSync(dirname(targetPath), { recursive: true });
              copyFileSync(sourcePath, targetPath);
            } catch (err) {
              results.push({
                status: 'error',
                source: sourcePath,
                message: `copy failed: ${err instanceof Error ? err.message : String(err)}`,
              });
              continue;
            }
          }
          results.push({
            status: 'copied',
            source: sourcePath,
            target: targetPath,
            invariant_id: typed.id,
          });
        }

        const counts = {
          copied: results.filter((r) => r.status === 'copied').length,
          'skipped-exists': results.filter((r) => r.status === 'skipped-exists').length,
          error: results.filter((r) => r.status === 'error').length,
        };

        if (options.human === true) {
          process.stdout.write(
            `pack graduate-invariants ${pack.id}: ${String(counts.copied)} copied` +
              (counts['skipped-exists'] > 0
                ? `, ${String(counts['skipped-exists'])} skipped (existing)`
                : '') +
              (counts.error > 0 ? `, ${String(counts.error)} errors` : '') +
              (options.dryRun === true ? ' (dry-run)' : '') +
              '\n',
          );
          for (const r of results) {
            if (r.status === 'copied') {
              process.stdout.write(`  + ${r.invariant_id} -> ${r.target}\n`);
            } else if (r.status === 'skipped-exists') {
              process.stdout.write(`  ~ ${r.invariant_id} (exists at ${r.target})\n`);
            } else {
              process.stdout.write(`  ! ${basename(r.source)}: ${r.message.slice(0, 200)}\n`);
            }
          }
        } else {
          process.stdout.write(JSON.stringify({ pack_id: pack.id, counts, results }) + '\n');
        }

        if (counts.error > 0) process.exit(EXIT_FAIL);
        process.exitCode = counts['skipped-exists'] > 0 ? EXIT_REVIEW : EXIT_PASS;
      });
  },
});
