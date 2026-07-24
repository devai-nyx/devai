import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CAC } from 'cac';
import {
  loadDomains,
  validateGlossary,
  validateInvariants,
  validateJourneys,
  validateTrace,
  validateTestTrace,
  type SpecValidationResult,
} from '#core-compat';
import { validateInvariantStrategies, type InvariantLike } from '@devai-nyx/spec';
import { EXIT_FAIL, EXIT_PASS } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import {
  DEFAULT_DOMAINS_PATH,
  DEFAULT_GLOSSARY_DIR,
  DEFAULT_INVARIANTS_DIR,
  DEFAULT_JOURNEYS_DIR,
  DEFAULT_REPO_ROOT,
  DEFAULT_TRACE_PATH,
  type CommonSpecOptions,
} from './shared.js';
// D-A-38: shared scope-aware action-coverage gate (previously inlined, now shared
// with spec-validate-action-coverage). Eliminates aggregator vs. standalone drift.
import { runActionCoverageCheck } from './validate-action-coverage.js';

interface Options extends CommonSpecOptions {
  readonly domains?: string;
  // D-A-38: forward all D-A-36 options to the shared action-coverage gate.
  readonly scope?: string;
  readonly coverageAuthorities?: string;
  readonly packTune?: boolean;
  readonly packId?: string;
  readonly packsRoot?: string;
  readonly adopterRoot?: string;
}

interface SubReport {
  readonly name: string;
  readonly ok: boolean;
  readonly files_scanned: number;
  readonly error_count: number;
  readonly errors: SpecValidationResult['errors'];
}

export const specValidateAll = defineCommand({
  name: 'spec validate-all',
  description: 'Run every spec validator and aggregate the result',
  authority: 'specifier',
  register(cli: CAC): void {
    cli
      .command('spec-validate-all', 'Run every spec validator and aggregate the result')
      .option('--repo-root <path>', `Repo root (default: ${DEFAULT_REPO_ROOT})`)
      .option('--domains <path>', `Domains taxonomy (default: ${DEFAULT_DOMAINS_PATH})`)
      .option('--human', 'Emit a human-readable summary instead of JSON')
      // D-A-38: surface all D-A-36 options on the aggregator (option (a) — most flexible;
      // adopters who need scope overrides don't have to use the standalone command).
      .option(
        '--scope <s>',
        'self | adopter (default: auto-detect). Forwarded to the action-coverage gate. D-A-38 / D-A-36.',
      )
      .option(
        '--coverage-authorities <list>',
        "Comma-separated authority list for adopter-scope substring discovery. Default: 'sensor,specifier'. D-A-38 / D-A-36.",
      )
      .option(
        '--pack-tune',
        'Apply pack extractor_params for action_coverage as defaults. D-A-38 / D-A-36.',
      )
      .option('--pack-id <id>', 'Explicit pack id (skips fingerprint matching). D-A-38 / D-A-36.')
      .option(
        '--packs-root <path>',
        'Override packs directory for pack discovery. D-A-38 / D-A-36.',
      )
      .option(
        '--adopter-root <path>',
        'Adopter project root for pack-tune resolution (default: --repo-root). D-A-38 / D-A-36.',
      )
      .action((options: Options) => {
        try {
          const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
          const domainsPath = options.domains ?? join(repoRoot, DEFAULT_DOMAINS_PATH);
          const domains = loadDomains(domainsPath);

          const inv = validateInvariants({
            invariantsDir: join(repoRoot, DEFAULT_INVARIANTS_DIR),
            domains,
            repoRoot,
          });
          const invariantIds = new Set(inv.invariants.map((i) => i.id));
          const jrn = validateJourneys({
            journeysDir: join(repoRoot, DEFAULT_JOURNEYS_DIR),
            invariantIds,
          });
          const trc = validateTrace({
            tracePath: join(repoRoot, DEFAULT_TRACE_PATH),
            invariantIds,
          });
          const testTrace = validateTestTrace({
            repoRoot,
            tracePath: join(repoRoot, DEFAULT_TRACE_PATH),
            invariantsDir: join(repoRoot, DEFAULT_INVARIANTS_DIR),
          });
          const gls = validateGlossary({
            glossaryDir: join(repoRoot, DEFAULT_GLOSSARY_DIR),
            invariantIds,
          });
          const strategyInvariants = readdirSync(join(repoRoot, DEFAULT_INVARIANTS_DIR))
            .filter((name) => /^INV-[A-Z0-9-]+\.json$/u.test(name))
            .sort()
            .map(
              (name) =>
                JSON.parse(
                  readFileSync(join(repoRoot, DEFAULT_INVARIANTS_DIR, name), 'utf8'),
                ) as InvariantLike,
            );
          const strategies = validateInvariantStrategies(strategyInvariants);
          const strategyErrors: SpecValidationResult['errors'] = strategies.findings.map(
            (finding) => ({
              file: DEFAULT_INVARIANTS_DIR,
              message: finding,
            }),
          );

          // Phase-9 Batch 9.A.3: action-coverage gate. Runs ONLY when
          // the repo's invariants actually claim framework actions
          // (i.e., measurable_via is populated somewhere). Client repos
          // that author their own invariants without referencing
          // framework actions skip this gate — they should rely on
          // their own client-action coverage instead.
          //
          // D-A-38: replaced the inlined gate (validate-all.ts:87-101 pre-fix)
          // with a call to the shared scope-aware implementation from
          // validate-action-coverage.ts. This eliminates the adopter-scope drift
          // that caused 137 false-positive errors (STYNX S11 retro). Sibling of
          // D-A-36 (3b52bcc) which fixed the standalone command.
          const invariantsDir = join(repoRoot, DEFAULT_INVARIANTS_DIR);
          const coverageResult = runActionCoverageCheck({
            repoRoot,
            invariantsDir,
            domains,
            scope: options.scope,
            coverageAuthorities: options.coverageAuthorities,
            adopterRoot: options.adopterRoot,
            packTune: options.packTune,
            packId: options.packId,
            packsRoot: options.packsRoot,
          });

          // Preserve actionCoverageActive gate semantics: only include the
          // action-coverage sub-report when at least one invariant declares
          // measurable_via (i.e., when claimedCount > 0).
          const actionCoverageActive = coverageResult.claimedCount > 0;
          const actionCoverageErrors: SpecValidationResult['errors'] = coverageResult.unclaimed.map(
            (name) => ({
              file: 'law/invariants/',
              message: `action '${name}' is not claimed by any invariant.measurable_via`,
            }),
          );
          const actionCoverageOk = coverageResult.ok;

          const subReports: SubReport[] = [
            {
              name: 'invariants',
              ok: inv.ok,
              files_scanned: inv.files_scanned,
              error_count: inv.errors.length,
              errors: inv.errors,
            },
            {
              name: 'journeys',
              ok: jrn.ok,
              files_scanned: jrn.files_scanned,
              error_count: jrn.errors.length,
              errors: jrn.errors,
            },
            {
              name: 'trace',
              ok: trc.ok,
              files_scanned: trc.files_scanned,
              error_count: trc.errors.length,
              errors: trc.errors,
            },
            {
              name: 'test-trace',
              ok: testTrace.ok,
              files_scanned: testTrace.files_scanned,
              error_count: testTrace.errors.length,
              errors: testTrace.errors,
            },
            {
              name: 'glossary',
              ok: gls.ok,
              files_scanned: gls.files_scanned,
              error_count: gls.errors.length,
              errors: gls.errors,
            },
            {
              name: 'invariant-strategies',
              ok: strategies.status !== 'fail',
              files_scanned: strategies.population,
              error_count: strategyErrors.length,
              errors: strategyErrors,
            },
            ...(actionCoverageActive
              ? [
                  {
                    name: 'action-coverage',
                    ok: actionCoverageOk,
                    files_scanned: coverageResult.registeredCount,
                    error_count: actionCoverageErrors.length,
                    errors: actionCoverageErrors,
                  } as SubReport,
                ]
              : []),
          ];

          const ok = subReports.every((r) => r.ok);

          if (options.human) {
            const lines: string[] = [`spec validate-all: ${ok ? 'OK' : 'FAIL'}`];
            for (const r of subReports) {
              lines.push(
                `  [${r.ok ? '✓' : '✗'}] ${r.name} (${String(r.files_scanned)} file(s), ${String(r.error_count)} error(s))`,
              );
              for (const e of r.errors) {
                lines.push(`      ${e.file}${e.pointer ? ` ${e.pointer}` : ''}: ${e.message}`);
              }
            }
            process.stdout.write(lines.join('\n') + '\n');
          } else {
            process.stdout.write(JSON.stringify({ ok, reports: subReports }) + '\n');
          }

          process.exit(ok ? EXIT_PASS : EXIT_FAIL);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`devai spec validate all: ${msg}\n`);
          process.exit(EXIT_FAIL);
        }
      });
  },
});
