import { existsSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import type { CAC } from 'cac';
import { loadDomains, validateInvariants } from '#core-compat';
import { senseSpecIdiomaticity, buildSensorReading } from '@devai-nyx/sensors';
import { defineCommand } from '../../define-command.js';
import { DEFAULT_REPO_ROOT, finishSenseCommand } from './shared.js';

interface Options {
  readonly repoRoot?: string;
  readonly dir?: string;
  readonly domains?: string;
  readonly human?: boolean;
  readonly emitReading?: boolean;
}

const DEFAULT_INVARIANTS_DIR = 'law/invariants';
const DEFAULT_DOMAINS_CANDIDATES = [
  'law/glossary/domains.json',
  '.devai/config/domains.json',
] as const;

function absPath(repoRoot: string, p: string): string {
  return isAbsolute(p) ? p : resolve(repoRoot, p);
}

/**
 * Resolve the domains taxonomy file via a fallback chain (Phase 29.B,
 * closes D-A-26). Returns the first existing path from the chain:
 * 1. Explicit --domains flag.
 * 2. <repoRoot>/law/glossary/domains.json (canonical default).
 * 3. <repoRoot>/.devai/config/domains.json (adopter override fallback).
 * Returns null if none exist.
 */
function resolveDomainsPath(
  repoRoot: string,
  explicit?: string,
): { path: string; tried: readonly string[] } | { path: null; tried: readonly string[] } {
  const tried: string[] = [];
  if (explicit !== undefined) {
    const abs = absPath(repoRoot, explicit);
    tried.push(abs);
    if (existsSync(abs)) return { path: abs, tried };
  }
  for (const c of DEFAULT_DOMAINS_CANDIDATES) {
    const abs = absPath(repoRoot, c);
    tried.push(abs);
    if (existsSync(abs)) return { path: abs, tried };
  }
  return { path: null, tried };
}

/**
 * `devai sense spec idiomaticity` — emit a spec_idiomaticity
 * SensorReading (Phase 26.C, F1×T5). Runs `validateInvariants` with
 * `strictCnl: true` and translates the result into PASS/REVIEW/FAIL.
 *
 * Phase 29.B (D-A-26): falls back to `.devai/config/domains.json`
 * when the canonical `law/glossary/domains.json` is absent. Emits
 * `status: unknown` with `DOMAINS_FILE_NOT_FOUND` finding when no
 * candidate path resolves (graceful no-op, not a hard crash).
 */
export const senseSpecIdiomaticityCmd = defineCommand({
  name: 'sense spec-idiomaticity',
  description:
    'Run invariant validator with --strict-cnl and emit a spec_idiomaticity SensorReading (F1×T5)',
  authority: 'sensor',
  register(cli: CAC): void {
    cli
      .command('sense-spec-idiomaticity', 'Emit a spec_idiomaticity SensorReading (F1×T5)')
      .option('--repo-root <path>', `Working directory (default: ${DEFAULT_REPO_ROOT})`)
      .option('--dir <path>', `Invariants directory (default: ${DEFAULT_INVARIANTS_DIR})`)
      .option(
        '--domains <path>',
        `Domains taxonomy (default: law/glossary/domains.json with fallback to .devai/config/domains.json)`,
      )
      .option('--human', 'Human-readable summary')
      .option(
        '--no-emit-reading',
        'Skip persisting the SensorReading under .devai/state/sensor-readings/',
      )
      .action((options: Options) => {
        const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
        const dir = options.dir ?? join(repoRoot, DEFAULT_INVARIANTS_DIR);
        const resolved = resolveDomainsPath(repoRoot, options.domains);
        if (resolved.path === null) {
          const reading = buildSensorReading({
            sensorName: 'spec-idiomaticity',
            sensorKind: 'spec_idiomaticity',
            command: ['devai', 'sense-spec-idiomaticity'],
            status: 'unknown',
            deterministic: true,
            tier: 'L0',
            findings: [
              {
                severity: 'warning',
                code: 'DOMAINS_FILE_NOT_FOUND',
                message: `No domains taxonomy file found. Tried: ${resolved.tried.join(', ')}`,
              },
            ],
            metrics: { paths_tried: resolved.tried.length },
          });
          finishSenseCommand(reading, {
            repoRoot,
            ...(options.human !== undefined && { human: options.human }),
            ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
          });
          return;
        }
        const domains = loadDomains(resolved.path);
        const validationResult = validateInvariants({
          invariantsDir: dir,
          domains,
          repoRoot,
          strictCnl: true,
        });
        const reading = senseSpecIdiomaticity({ validationResult });
        finishSenseCommand(reading, {
          repoRoot,
          ...(options.human !== undefined && { human: options.human }),
          ...(options.emitReading !== undefined && { emitReading: options.emitReading }),
        });
      });
  },
});
