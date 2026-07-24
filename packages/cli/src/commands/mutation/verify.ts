import { copyFileSync, existsSync, mkdirSync, readFileSync } from '@devai-nyx/authority';
import { dirname, resolve } from 'node:path';
import type { CAC } from 'cac';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';

/**
 * D-A-44 — `devai sense mutation verify`.
 *
 * Canonical verification companion to `devai sense mutation run`. It keeps
 * the shared implementation semantics established by D-A-44 while exposing
 * only the 0.5 hierarchical command path.
 *
 * The implementation is intentionally duplicated rather than re-exported:
 *   - The two commands carry their own `defineCommand` registry entries
 *     (the action catalog enumerates `mutation verify` as a distinct verb).
 *   - The duplication is ~80 lines and never drifts in practice (changing
 *     one without the other is caught by the byte-identity gate in
 *     `docs cli --check` because both render to identical extended_doc
 *     text).
 */

const DEFAULT_THRESHOLDS = '.devai/config/thresholds.json';
const DEFAULT_BASELINE = '.devai/state/mutation/baseline.json';
const DEFAULT_CURRENT = '.devai/state/mutation/current.json';

interface Options {
  readonly baseline?: string;
  readonly current?: string;
  readonly thresholds?: string;
  readonly repoRoot?: string;
  readonly human?: boolean;
  readonly saveBaseline?: boolean;
}

interface MutationReport {
  readonly mutation_score?: number;
  readonly survived?: number;
  readonly metrics?: {
    readonly mutationScore?: number;
    readonly survived?: number;
  };
}

interface Thresholds {
  readonly mutation?: {
    readonly score_min?: number;
    readonly survived_max?: number;
  };
}

function readReport(p: string): MutationReport {
  return JSON.parse(readFileSync(p, 'utf8')) as MutationReport;
}

function scoreOf(r: MutationReport): number | undefined {
  if (typeof r.mutation_score === 'number') return r.mutation_score;
  if (typeof r.metrics?.mutationScore === 'number') return r.metrics.mutationScore;
  return undefined;
}

function survivedOf(r: MutationReport): number | undefined {
  if (typeof r.survived === 'number') return r.survived;
  if (typeof r.metrics?.survived === 'number') return r.metrics.survived;
  return undefined;
}

function readThresholds(p: string): Thresholds | undefined {
  if (!existsSync(p)) return undefined;
  return JSON.parse(readFileSync(p, 'utf8')) as Thresholds;
}

interface Finding {
  readonly kind: 'below_threshold' | 'regression_score' | 'regression_survived';
  readonly message: string;
}

export const mutationVerify = defineCommand({
  name: 'mutation verify',
  description:
    'Compare the current mutation report with its baseline and thresholds. Exits non-zero on regression or threshold breach.',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'mutation-verify',
        'Alias of verify-mutation; compare current vs baseline + thresholds',
      )
      .option('--baseline <path>', `Baseline report path (default: ${DEFAULT_BASELINE})`)
      .option('--current <path>', `Current report path (default: ${DEFAULT_CURRENT})`)
      .option('--thresholds <path>', `Thresholds file (default: ${DEFAULT_THRESHOLDS})`)
      .option('--repo-root <path>', 'Repo root (default: cwd)')
      .option('--human', 'Human-readable diff; otherwise JSON envelope on stdout')
      .option(
        '--save-baseline',
        'After a clean verify (no findings), copy --current → --baseline to ratchet the baseline forward. No-op on FAIL.',
      )
      .action((options: Options) => {
        try {
          const repoRoot = resolve(options.repoRoot ?? process.cwd());
          const currentPath = resolve(repoRoot, options.current ?? DEFAULT_CURRENT);
          if (!existsSync(currentPath)) {
            process.stderr.write(
              `devai sense mutation verify: --current report not found at ${currentPath}\n`,
            );
            process.exit(EXIT_USAGE);
          }
          const current = readReport(currentPath);
          const curScore = scoreOf(current);
          const curSurvived = survivedOf(current);

          const baselinePath = resolve(repoRoot, options.baseline ?? DEFAULT_BASELINE);
          const baseline = existsSync(baselinePath) ? readReport(baselinePath) : undefined;
          const baseScore = baseline ? scoreOf(baseline) : undefined;
          const baseSurvived = baseline ? survivedOf(baseline) : undefined;

          const thresholdsPath = resolve(repoRoot, options.thresholds ?? DEFAULT_THRESHOLDS);
          const thresholds = readThresholds(thresholdsPath);
          const minScore = thresholds?.mutation?.score_min;
          const maxSurvived = thresholds?.mutation?.survived_max;

          const findings: Finding[] = [];
          if (typeof minScore === 'number' && typeof curScore === 'number' && curScore < minScore) {
            findings.push({
              kind: 'below_threshold',
              message: `mutation score ${curScore.toFixed(1)}% < threshold ${String(minScore)}%`,
            });
          }
          if (
            typeof maxSurvived === 'number' &&
            typeof curSurvived === 'number' &&
            curSurvived > maxSurvived
          ) {
            findings.push({
              kind: 'below_threshold',
              message: `survived mutants ${String(curSurvived)} > ceiling ${String(maxSurvived)}`,
            });
          }
          if (
            typeof baseScore === 'number' &&
            typeof curScore === 'number' &&
            curScore < baseScore
          ) {
            findings.push({
              kind: 'regression_score',
              message: `mutation score regressed: ${curScore.toFixed(1)}% < baseline ${baseScore.toFixed(1)}%`,
            });
          }
          if (
            typeof baseSurvived === 'number' &&
            typeof curSurvived === 'number' &&
            curSurvived > baseSurvived
          ) {
            findings.push({
              kind: 'regression_survived',
              message: `survived mutants regressed: ${String(curSurvived)} > baseline ${String(baseSurvived)}`,
            });
          }

          const result = {
            ok: findings.length === 0,
            current: { mutation_score: curScore ?? null, survived: curSurvived ?? null },
            baseline: baseline
              ? { mutation_score: baseScore ?? null, survived: baseSurvived ?? null }
              : null,
            thresholds: thresholds?.mutation ?? null,
            findings,
          };

          let savedBaseline = false;
          if (options.saveBaseline === true && result.ok) {
            mkdirSync(dirname(baselinePath), { recursive: true });
            copyFileSync(currentPath, baselinePath);
            savedBaseline = true;
          }

          if (options.human === true) {
            const verdict = result.ok ? 'PASS' : 'FAIL';
            process.stdout.write(`devai sense mutation verify: ${verdict}\n`);
            process.stdout.write(
              `  current: score=${curScore?.toFixed?.(1) ?? 'n/a'}% survived=${curSurvived ?? 'n/a'}\n`,
            );
            if (baseline) {
              process.stdout.write(
                `  baseline: score=${baseScore?.toFixed?.(1) ?? 'n/a'}% survived=${baseSurvived ?? 'n/a'}\n`,
              );
            }
            for (const f of findings) {
              process.stdout.write(`  - ${f.kind}: ${f.message}\n`);
            }
            if (savedBaseline) {
              process.stdout.write(`  baseline ratcheted: ${currentPath} → ${baselinePath}\n`);
            }
          } else {
            process.stdout.write(
              JSON.stringify({ ...result, saved_baseline: savedBaseline }) + '\n',
            );
          }

          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai sense mutation verify: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
