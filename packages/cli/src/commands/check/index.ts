import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CAC } from 'cac';
import {
  checkForbiddenRegistryCoverage,
  checkPrCompliance,
  checkPromptOverlays,
  listSkills,
  scanForbiddenActions,
  scanInvOverrides,
  validateAdrs,
} from '#core-compat';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
export { checkDocsGovernanceCmd, checkDocsGovernance } from './docs-governance.js';
export type {
  DocsGovernanceReport,
  GovernanceFinding,
  CheckDocsGovernanceOptions,
} from './docs-governance.js';
export { checkCiEconomyCmd, checkCiEconomy } from './ci-economy.js';
export type { CiEconomyReport, CiEconomyFinding, CheckCiEconomyOptions } from './ci-economy.js';
export { checkSensorIntegrityCmd, checkSensorIntegrity } from './sensor-integrity.js';
export type { SensorIntegrityReport, CheckSensorIntegrityOptions } from './sensor-integrity.js';
export { checkGlobGuardsCmd, checkGlobGuards } from './glob-guards.js';
export type { CheckGlobGuardsReport, CheckGlobGuardsOptions } from './glob-guards.js';
export { checkDependenciesCmd, checkDependencies } from './dependencies.js';
export { checkActionEffectsCmd } from './action-effects.js';

const DEFAULT_REPO_ROOT = '.';
const DEFAULT_INVARIANTS_DIR = 'law/invariants';

/**
 * Phase-10 Batch 10.B — `devai policy check overrides`. Scans source for
 * `// inv-override:` annotation blocks, validates each block against
 * inv-override.schema.json + the invariant catalog (severity check
 * + existence check + expiry check), reports findings.
 *
 * Exit codes:
 *   0  — no overrides found OR all overrides valid + non-expired
 *   2  — any findings (malformed / expired / severity-forbids /
 *        unknown-invariant)
 */
export const checkOverrides = defineCommand({
  name: 'check overrides',
  description:
    'Scan source for inv-override annotations; validate against invariant catalog + severity + expiry. Absorbs LAW-00.OVERRIDE.1.',
  authority: 'policy_firewall',
  register(cli: CAC): void {
    cli
      .command('check-overrides', 'Scan + validate inv-override annotations')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--root <path>', 'Source root to scan (repeatable; default: packages)')
      .option(
        '--invariants-dir <path>',
        `Invariants directory (default: ${DEFAULT_INVARIANTS_DIR})`,
      )
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          repoRoot?: string;
          root?: string | string[];
          invariantsDir?: string;
          human?: boolean;
        }) => {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const roots = Array.isArray(options.root)
            ? options.root
            : options.root !== undefined
              ? [options.root]
              : undefined;
          const invariantsDir = options.invariantsDir ?? DEFAULT_INVARIANTS_DIR;

          // Build a minimal invariant catalog map (id → severity) for the
          // override scanner's severity + existence checks. Best-effort:
          // if the directory is unreadable, we still scan but skip those
          // checks.
          const catalog = new Map<string, { severity: string }>();
          try {
            const abs = join(repoRoot, invariantsDir);
            for (const name of readdirSync(abs)) {
              if (!name.endsWith('.json')) continue;
              try {
                const parsed = JSON.parse(readFileSync(join(abs, name), 'utf8')) as {
                  id?: string;
                  severity?: string;
                };
                if (typeof parsed.id === 'string' && typeof parsed.severity === 'string') {
                  catalog.set(parsed.id, { severity: parsed.severity });
                }
              } catch {
                // skip
              }
            }
          } catch {
            // directory missing → no catalog; scanner runs without severity checks
          }

          const result = scanInvOverrides({
            repoRoot,
            ...(roots !== undefined && { roots }),
            ...(catalog.size > 0 && { invariants: catalog }),
          });
          const ok = result.findings.length === 0;
          if (options.human === true) {
            const lines: string[] = [];
            lines.push(
              `check overrides: ${ok ? 'OK' : 'FAIL'} (${String(result.overrides.length)} valid override(s), ${String(result.findings.length)} finding(s))`,
            );
            for (const f of result.findings) {
              lines.push(
                `  [${f.code}] ${f.file}:${String(f.line)}` +
                  (f.invariant_id !== undefined ? ` ${f.invariant_id}` : '') +
                  ` — ${f.message}`,
              );
            }
            for (const o of result.overrides) {
              lines.push(
                `  [ok] ${o.file}:${String(o.line)} ${o.invariant_id} (expires ${o.expires})`,
              );
            }
            process.stdout.write(lines.join('\n') + '\n');
          } else {
            process.stdout.write(JSON.stringify({ ok, ...result }) + '\n');
          }
          process.exit(ok ? EXIT_PASS : EXIT_FAIL);
        },
      );
  },
});

/**
 * Phase-10 Batch 10.C — `devai policy check pr compliance`. Parses an
 * Inv-Compliance: trailer from a PR body (file or stdin), validates
 * cited rule ids against the invariant catalog.
 *
 * Exit codes: 0 OK, 2 any finding, 64 usage error.
 */
export const checkPrComplianceCmd = defineCommand({
  name: 'check pr-compliance',
  description:
    'Parse + validate the Inv-Compliance: PR trailer. Absorbs LAW-00.READING.2 / LAW-12.CITE.1.',
  authority: 'policy_firewall',
  register(cli: CAC): void {
    cli
      .command('check-pr-compliance', 'Validate Inv-Compliance: trailer in a PR body')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--pr-body-file <path>', 'Read PR body from file (else: stdin)')
      .option(
        '--invariants-dir <path>',
        `Invariants directory (default: ${DEFAULT_INVARIANTS_DIR})`,
      )
      .option('--optional', 'Treat missing trailer as OK (default: required)')
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          repoRoot?: string;
          prBodyFile?: string;
          invariantsDir?: string;
          optional?: boolean;
          human?: boolean;
        }) => {
          let body: string;
          if (options.prBodyFile !== undefined) {
            try {
              body = readFileSync(options.prBodyFile, 'utf8');
            } catch (err) {
              process.stderr.write(
                `devai policy check pr compliance: cannot read ${options.prBodyFile}: ${err instanceof Error ? err.message : String(err)}\n`,
              );
              process.exit(EXIT_USAGE);
            }
          } else if (!process.stdin.isTTY) {
            // Read from stdin (synchronous).
            try {
              body = readFileSync(0, 'utf8');
            } catch {
              body = '';
            }
          } else {
            process.stderr.write(
              'devai policy check pr compliance: --pr-body-file or stdin is required\n',
            );
            process.exit(EXIT_USAGE);
          }

          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const invariantsDir = options.invariantsDir ?? DEFAULT_INVARIANTS_DIR;
          const invariantIds = new Set<string>();
          try {
            const abs = join(repoRoot, invariantsDir);
            for (const name of readdirSync(abs)) {
              if (!name.endsWith('.json')) continue;
              try {
                const parsed = JSON.parse(readFileSync(join(abs, name), 'utf8')) as { id?: string };
                if (typeof parsed.id === 'string') invariantIds.add(parsed.id);
              } catch {
                // skip
              }
            }
          } catch {
            // no catalog → existence check is skipped
          }

          const result = checkPrCompliance({
            body,
            ...(invariantIds.size > 0 && { invariant_ids: invariantIds }),
            required: options.optional !== true,
          });
          if (options.human === true) {
            const lines: string[] = [];
            lines.push(
              `check pr-compliance: ${result.ok ? 'OK' : 'FAIL'} (${String(result.cited_ids.length)} cited id(s), ${String(result.findings.length)} finding(s))`,
            );
            for (const f of result.findings) {
              lines.push(
                `  [${f.code}]${f.invariant_id !== undefined ? ` ${f.invariant_id}` : ''} — ${f.message}`,
              );
            }
            if (result.cited_ids.length > 0) {
              lines.push(`  cited: ${result.cited_ids.join(', ')}`);
            }
            process.stdout.write(lines.join('\n') + '\n');
          } else {
            process.stdout.write(JSON.stringify(result) + '\n');
          }
          process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
        },
      );
  },
});

const DEFAULT_ADR_DIR = 'law/adr';

/**
 * Phase-10 Batch 10.F — `devai policy check adrs`. Validates ADR markdown
 * files: front-matter conforms to adr.schema.json, filename matches
 * adr_id, body contains the mandatory sections, sequential numbering.
 */
export const checkAdrs = defineCommand({
  name: 'check adrs',
  description:
    'Validate ADR shape (front-matter + mandatory sections + sequential numbering). Absorbs LAW-14.ADR.*.',
  authority: 'policy_firewall',
  register(cli: CAC): void {
    cli
      .command('check-adrs', 'Validate ADRs under law/adr/')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--adrs-dir <path>', `ADR directory (default: ${DEFAULT_ADR_DIR})`)
      .option('--human', 'Human-readable output')
      .action((options: { repoRoot?: string; adrsDir?: string; human?: boolean }) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const adrsDir = options.adrsDir ?? DEFAULT_ADR_DIR;
        const result = validateAdrs({ adrsDir: join(repoRoot, adrsDir) });
        if (options.human === true) {
          const lines: string[] = [];
          lines.push(
            `check adrs: ${result.ok ? 'OK' : 'FAIL'} (${String(result.files_scanned)} file(s), ${String(result.errors.length)} error(s))`,
          );
          for (const e of result.errors) {
            lines.push(
              `  [✗] ${e.file}${e.pointer !== undefined ? ` ${e.pointer}` : ''} — ${e.message}`,
            );
          }
          for (const a of result.adrs) {
            lines.push(`  [✓] ${a.adr_id} ${a.status} — ${a.title}`);
          }
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(JSON.stringify(result) + '\n');
        }
        process.exit(result.ok ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

/**
 * Phase-10 Batch 10.H — `devai policy check forbidden actions`. Scans recent
 * git activity against .devai/config/forbidden-actions.json patterns.
 * Reports findings; doesn't block (LAW-12.FORBID.2's runtime block is
 * an operator-installed hook).
 */
export const checkForbiddenActions = defineCommand({
  name: 'check forbidden-actions',
  description:
    'Scan recent git commits for matches against .devai/config/forbidden-actions.json. Absorbs LAW-12.FORBID.1.',
  authority: 'policy_firewall',
  register(cli: CAC): void {
    cli
      .command('check-forbidden-actions', 'Scan for forbidden-action signatures in git history')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--max-commits <n>', 'How many recent commits to scan (default: 50)')
      .option(
        '--strict',
        'Exit FAIL on any commit-history finding or unwaived canonical-coverage gap; --strict remains accepted for compatibility',
      )
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          repoRoot?: string;
          maxCommits?: number;
          strict?: boolean;
          human?: boolean;
        }) => {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const result = scanForbiddenActions({
            repoRoot,
            ...(options.maxCommits !== undefined && { maxCommits: options.maxCommits }),
          });
          // D-123 (item 6): extend-not-replace. A registry missing a
          // canonical entry without a recorded waiver is a finding,
          // not silence.
          const coverage = checkForbiddenRegistryCoverage(
            join(repoRoot, '.devai/config/forbidden-actions.json'),
          );
          const payload = { ...result, coverage };
          if (options.human === true) {
            const lines: string[] = [];
            lines.push(
              `check forbidden-actions: ${result.findings.length === 0 ? 'OK' : 'WARN'} (${String(result.registry_entries)} registry entries, ${String(result.findings.length)} finding(s))`,
            );
            for (const f of result.findings) {
              lines.push(
                `  [${f.forbidden_id}] ${f.source} ${f.ref.slice(0, 12)} — matched '${f.matched}'`,
              );
            }
            lines.push(
              `  coverage: ${coverage.ok ? 'OK' : 'GAP'} (${String(coverage.present.length)}/${String(coverage.canonical_total)} canonical present, ${String(coverage.waived.length)} waived, ${String(coverage.unwaived_missing.length)} unwaived-missing)`,
            );
            for (const id of coverage.unwaived_missing) {
              lines.push(
                `    [!] ${id} missing — extend the registry or add a waiver with a reason`,
              );
            }
            for (const w of coverage.waived) {
              lines.push(`    [waived] ${w.id} — ${w.reason}`);
            }
            process.stdout.write(lines.join('\n') + '\n');
          } else {
            process.stdout.write(JSON.stringify(payload) + '\n');
          }
          process.exit(result.findings.length > 0 || !coverage.ok ? EXIT_FAIL : EXIT_PASS);
        },
      );
  },
});

/**
 * Phase 12.B / D-42 — `devai policy check prompt overlays`. Inspects skill
 * manifests for authority-inversion attacks: scopes that grant
 * Constructor-tier surfaces write access to Architect / Owner /
 * Inspector reserved paths. Findings emerge per skill_id + scope.
 *
 * Exit codes:
 *   0 — no findings, or only warning-severity findings
 *   2 — any finding of error or critical severity, OR --strict
 *       with any findings at all
 */
export const checkPromptOverlaysCmd = defineCommand({
  name: 'check prompt-overlays',
  description:
    'Inspect skill manifests for authority-inversion: scopes granting Constructor-tier writes over Architect/Owner/Inspector-reserved paths. Per Phase 12.B (D-42).',
  authority: 'policy_firewall',
  register(cli: CAC): void {
    cli
      .command(
        'check-prompt-overlays',
        'Scan skill manifests for authority-inversion in allowed_write_scopes',
      )
      .option(
        '--strict',
        'Exit non-zero on any finding, including warnings (default: exit non-zero only on error/critical)',
      )
      .option('--human', 'Human-readable output')
      .action((options: { strict?: boolean; human?: boolean }) => {
        const manifests = listSkills();
        const verdict = checkPromptOverlays({ manifests });
        if (options.human === true) {
          const lines: string[] = [];
          lines.push(
            `check prompt-overlays: ${verdict.ok ? 'OK' : 'FAIL'}  (${String(verdict.manifests_checked)} manifest(s), ${String(verdict.findings.length)} finding(s))`,
          );
          for (const f of verdict.findings) {
            lines.push(`  [${f.severity}] ${f.code}: ${f.message}`);
          }
          process.stdout.write(lines.join('\n') + '\n');
        } else {
          process.stdout.write(JSON.stringify(verdict) + '\n');
        }
        const hasBlocking = verdict.findings.some(
          (f) => f.severity === 'error' || f.severity === 'critical',
        );
        const exitNonZero = (options.strict === true && verdict.findings.length > 0) || hasBlocking;
        process.exit(exitNonZero ? EXIT_FAIL : EXIT_PASS);
      });
  },
});
