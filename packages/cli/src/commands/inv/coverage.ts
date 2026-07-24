import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { normalizeCoverage } from '#core-compat';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, emit, type CommonInvOptions } from './shared.js';

const DEFAULT_COVERAGE_PATH = 'coverage/coverage-final.json';
const DEFAULT_THRESHOLDS_PATH = '.devai/config/thresholds.json';

type ThresholdKey = 'statements' | 'branches' | 'functions' | 'lines';
const THRESHOLD_KEYS: ReadonlySet<ThresholdKey> = new Set([
  'statements',
  'branches',
  'functions',
  'lines',
]);

type Thresholds = Partial<Record<ThresholdKey, number>>;

interface Options extends CommonInvOptions {
  readonly coverage?: string;
  readonly thresholds?: string;
  readonly failUnder?: string | string[];
}

/**
 * Parse `--fail-under key=value` pairs (repeatable). Each value must
 * be in [0,1]; the gate compares against (covered / total).
 */
function parseFailUnder(raw: string | string[] | undefined): Thresholds {
  const list = Array.isArray(raw) ? raw : raw !== undefined ? [raw] : [];
  const out: Thresholds = {};
  for (const spec of list) {
    const eq = spec.indexOf('=');
    if (eq === -1) {
      throw new Error(`invalid --fail-under '${spec}': expected key=value`);
    }
    const key = spec.slice(0, eq);
    const value = Number(spec.slice(eq + 1));
    if (!THRESHOLD_KEYS.has(key as ThresholdKey)) {
      throw new Error(
        `invalid --fail-under key '${key}': expected one of ${[...THRESHOLD_KEYS].join('|')}`,
      );
    }
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(
        `invalid --fail-under value '${spec.slice(eq + 1)}': expected a number in [0,1]`,
      );
    }
    out[key as ThresholdKey] = value;
  }
  return out;
}

function loadThresholds(path: string): Thresholds {
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { coverage?: Thresholds };
    return parsed.coverage ?? {};
  } catch {
    return {};
  }
}

interface GateResult {
  readonly key: ThresholdKey;
  readonly threshold: number;
  readonly actual: number;
  readonly ok: boolean;
}

function evaluateGate(
  summary: { [K in `${ThresholdKey}_total` | `${ThresholdKey}_covered`]: number },
  thresholds: Thresholds,
): GateResult[] {
  const out: GateResult[] = [];
  for (const key of THRESHOLD_KEYS) {
    const threshold = thresholds[key];
    if (threshold === undefined) continue;
    const total = summary[`${key}_total` as keyof typeof summary];
    const covered = summary[`${key}_covered` as keyof typeof summary];
    const actual = total === 0 ? 1 : covered / total;
    out.push({ key, threshold, actual, ok: actual >= threshold });
  }
  return out;
}

export const invCoverage = defineCommand({
  name: 'inv coverage',
  description:
    'Normalize coverage-final.json into a flat summary. With --fail-under, gate against thresholds.',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command(
        'inv-coverage',
        'Normalize Jest/Vitest coverage-final.json into a flat summary; optional threshold gate',
      )
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--coverage <path>', `Coverage file (default: <repo-root>/${DEFAULT_COVERAGE_PATH})`)
      .option(
        '--thresholds <path>',
        `Thresholds config (default: <repo-root>/${DEFAULT_THRESHOLDS_PATH})`,
      )
      .option(
        '--fail-under <key=value>',
        'Threshold gate (repeatable; keys: statements|branches|functions|lines; values in [0,1]). Overrides thresholds.json for the matching keys.',
      )
      .option('--human', 'Human-readable output')
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const coveragePath = options.coverage ?? join(repoRoot, DEFAULT_COVERAGE_PATH);
          const thresholdsPath = options.thresholds ?? join(repoRoot, DEFAULT_THRESHOLDS_PATH);

          const cliOverrides = parseFailUnder(options.failUnder);
          const gateActive = Object.keys(cliOverrides).length > 0;
          const thresholds = gateActive
            ? { ...loadThresholds(thresholdsPath), ...cliOverrides }
            : {};

          const result = normalizeCoverage({ coveragePath });

          if (result.missing) {
            emit(
              { ...result, gate: null },
              options.human === true,
              `inv coverage: no coverage file at ${coveragePath}`,
            );
            process.exitCode = EXIT_PASS;
            return;
          }

          if (result.summary === null) {
            // Defensive — `missing` is false above, so summary should be
            // populated. Surface the inconsistency rather than crash.
            emit(
              { ...result, gate: null },
              options.human === true,
              `inv coverage: coverage file present but produced no summary (${coveragePath})`,
            );
            process.exitCode = EXIT_FAIL;
            return;
          }
          const summary = result.summary;
          const gate = gateActive
            ? evaluateGate(summary as unknown as Parameters<typeof evaluateGate>[0], thresholds)
            : [];
          const gateOk = gate.every((g) => g.ok);

          const humanLines: string[] = [
            `inv coverage: ${String(summary.statements_covered)}/${String(summary.statements_total)} statements covered across ${String(summary.files_count)} file(s)`,
          ];
          if (gateActive) {
            humanLines.push(`  gate: ${gateOk ? 'PASS' : 'FAIL'}`);
            for (const g of gate) {
              const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
              humanLines.push(
                `    [${g.ok ? '✓' : '✗'}] ${g.key.padEnd(11)} ${pct(g.actual)} (threshold ${pct(g.threshold)})`,
              );
            }
          }

          emit(
            { ...result, gate: gateActive ? { ok: gateOk, results: gate } : null },
            options.human === true,
            humanLines.join('\n'),
          );
          process.exitCode = gateActive && !gateOk ? EXIT_FAIL : EXIT_PASS;
        } catch (err) {
          process.stderr.write(
            `devai inventory coverage: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_FAIL);
        }
      });
  },
});
