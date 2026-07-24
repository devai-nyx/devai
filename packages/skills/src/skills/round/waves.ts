import { mkdirSync, spawnSync, writeFileSync } from '@devai-nyx/authority';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GateEvidence } from '../types.js';

export function resolveDevaiCliBin(_cwd: string): string | undefined {
  // D-A-39: explicit env override — always wins when set.
  const envOverride = process.env['DEVAI_CLI_BIN'];
  if (typeof envOverride === 'string' && envOverride.length > 0 && existsSync(envOverride)) {
    return envOverride;
  }
  // Built CLI bin path — resolved from this module location at runtime.
  // The skill is invoked via `devai agent skill run` which means the bin
  // already exists; reusing it is safe. Strategies (in order):
  //   1. Module-co-located dist/ (DEVAI own install — the normal case).
  //   2. The active Node entrypoint when this skill is called by the CLI.
  // Adopter --repo-root is used only as input data (--repo-root flag),
  // never as the DEVAI CLI source root (D-A-39).
  // This helper lived in skills/index.ts before R20.W2.6. Preserve that
  // effective module base after moving one directory deeper into round/.
  const here = dirname(dirname(fileURLToPath(import.meta.url)));
  const binCandidates: string[] = [
    join(here, '../../../cli/dist/bin.js'), // DEVAI own install — dist co-located
    ...(process.argv[1] === undefined ? [] : [process.argv[1]]),
  ];
  return binCandidates.find((p) => existsSync(p));
}
export interface WaveCatalogEntry {
  readonly num: number;
  readonly slug: string;
  readonly goal: string;
  readonly role: string;
  readonly effort: string;
  readonly dependsOn: string;
}

export interface WavePromptHeader {
  readonly role?: string;
  readonly effort?: string;
  /** R4-W4 — when declared, orchestrate invokes this skill in-process for the wave. */
  readonly skill_id?: string;
  /** R4-W4 — RESERVED for future agent-spawn integration (II.b). Unused today. */
  readonly agent_cli?: string;
  readonly model?: string;
  readonly vendor?: string;
}

export interface DispatchedWave {
  readonly num: number;
  readonly slug: string;
  readonly mode: 'skill' | 'poll' | 'skipped' | 'not-dispatched';
  readonly status: 'clean' | 'blocked' | 'aborted' | 'timeout' | 'skipped' | 'not-dispatched';
}

export interface GateRun {
  readonly wave_num: number;
  readonly gate: string;
  readonly status: 'pass' | 'fail';
  readonly fix_attempts?: number;
}

/** R4-W4 — parse the markdown "Wave catalog" table from the orchestrator prompt. */
export function parseWaveCatalog(orchestratorText: string): WaveCatalogEntry[] {
  // Find the "## Wave catalog" heading and the table beneath it.
  const lines = orchestratorText.split('\n');
  let inSection = false;
  let inTable = false;
  const out: WaveCatalogEntry[] = [];
  for (const line of lines) {
    if (/^##+\s+Wave catalog/i.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^##+\s/.test(line)) {
      // next heading — section over
      break;
    }
    if (!inSection) continue;
    if (line.startsWith('|') && line.includes('---')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith('|')) continue; // out of table
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 5) continue;
    const numMatch = /^(\d+)$/.exec(cells[0] ?? '');
    if (numMatch === null) continue;
    const num = Number.parseInt(numMatch[1] as string, 10);
    if (num === 0) continue; // skip the orchestrator row
    const slug = (cells[1] ?? '').replace(/`/g, '').trim();
    out.push({
      num,
      slug,
      goal: cells[2] ?? '',
      role: cells[3] ?? '',
      effort: cells[4] ?? '',
      dependsOn: cells[5] ?? '',
    });
  }
  return out;
}

/** R4-W4 — parse YAML front matter at the top of a wave prompt. */
export function parseWavePromptHeader(text: string): WavePromptHeader {
  const match = /^---\n([\s\S]*?)\n---/m.exec(text);
  if (match === null) return {};
  const yaml = match[1] ?? '';
  const result: Record<string, string> = {};
  for (const line of yaml.split('\n')) {
    const kvMatch = /^([a-z_]+):\s*(.+?)\s*$/.exec(line);
    if (kvMatch !== null) {
      const key = kvMatch[1] as string;
      const val = (kvMatch[2] as string).replace(/^['"]|['"]$/g, '');
      result[key] = val;
    }
  }
  return result as WavePromptHeader;
}

/**
 * R11 (closes R6 F-4) — heuristic to detect auto-generated waves with no
 * real skill or agent backing them. An unbacked wave is one where:
 *   1. The YAML front matter has no `dispatch:`, `skill_id:`, or `agent_cli:` field.
 *   2. The wave prompt body doesn't reference a real skill ID (SKILL-*).
 *
 * Conservative: when in doubt, return false (fall through to full timeout).
 * This is the canonical "is this wave stubs-only / auto-materialized?" check.
 */
export function isUnbackedWave(promptPath: string): boolean {
  try {
    const text = readFileSync(promptPath, 'utf8');
    // Check front matter for dispatch: / skill_id: / agent_cli: — any is a backing signal.
    const fmMatch = /^---\n([\s\S]*?)\n---/m.exec(text);
    if (fmMatch !== null) {
      const fm = fmMatch[1] ?? '';
      if (/^\s*(dispatch|skill_id|agent_cli)\s*:/m.test(fm)) {
        return false; // explicitly backed
      }
    }
    // Check body for SKILL-* dispatch references outside front matter.
    // Match only dispatch-like invocations (e.g. "run SKILL-foo", "Dispatch to SKILL-foo",
    // "skill_id: SKILL-foo"). Exclude attribution/provenance lines like
    // "Auto-generated by SKILL-round-backlog" (by/from/generated-by prefix).
    const body = fmMatch !== null ? text.slice((fmMatch[0] ?? '').length) : text;
    // Remove attribution lines before scanning for dispatch references.
    const bodyNoAttrib = body.replace(/\b(?:by|from|generated\s+by)\s+SKILL-[a-z][a-z0-9-]*/gi, '');
    if (/\bSKILL-[a-z][a-z0-9-]*\b/.test(bodyNoAttrib)) {
      return false; // body references a skill by ID in a dispatch context — probably backed
    }
    // No dispatch:, no skill_id:, no agent_cli:, no SKILL-* in body.
    return true;
  } catch {
    // If we can't read the file, treat conservatively as backed (full timeout).
    return false;
  }
}

/** R4-W4 — locate the wave's prompt file by zero-padded number prefix. */
export function findWavePromptFile(promptsDir: string, waveNum: number): string | null {
  if (!existsSync(promptsDir)) return null;
  const prefix = String(waveNum).padStart(2, '0') + '-';
  const entries = readdirSync(promptsDir);
  for (const name of entries) {
    if (name.startsWith(prefix) && name.endsWith('.md')) {
      return join(promptsDir, name);
    }
  }
  return null;
}

/** R4-W4 — read the wave log's status if present. */
export function readWaveLogStatus(
  logPath: string,
):
  | 'clean'
  | 'blocked'
  | 'aborted'
  | 'dispatched'
  | 'in_progress'
  | 'not-dispatched'
  | 'not_present' {
  if (!existsSync(logPath)) return 'not_present';
  try {
    const text = readFileSync(logPath, 'utf8');
    const m =
      /\*\*Status:\*\*\s+(clean|blocked|aborted|dispatched|in_progress|not-dispatched)/i.exec(text);
    const captured = m === null ? undefined : m[1];
    if (captured !== undefined) {
      return captured.toLowerCase() as
        'clean' | 'blocked' | 'aborted' | 'dispatched' | 'in_progress' | 'not-dispatched';
    }
    return 'in_progress';
  } catch {
    return 'not_present';
  }
}

/** R4-W4 — write a minimal wave log. Agents executing prompt-only waves should overwrite with the full template when they update status to clean. */
export function writeWaveLog(
  logPath: string,
  opts: {
    roundN: number | string;
    waveNum: number;
    slug: string;
    status: 'clean' | 'blocked' | 'aborted' | 'dispatched' | 'not-dispatched';
    summary?: string;
  },
): void {
  const ts = new Date().toISOString();
  const body = `# R${String(opts.roundN)}-W${String(opts.waveNum)} — ${opts.slug}

**Closed:** ${ts}
**Status:** ${opts.status}

${opts.summary ?? '_Minimal log written by SKILL-round-orchestrate. Agents executing prompt-only waves SHOULD overwrite this with the full per-wave log template from docs/adopters/round-break.md §7 when they update status to clean._'}
`;
  writeFileSync(logPath, body);
}

/** R4-W4 — poll a wave log until its status flips out of {dispatched, in_progress}; or timeout. */
export async function pollWaveLog(
  logPath: string,
  timeoutMs: number,
  pollIntervalMs = 1000,
): Promise<'clean' | 'blocked' | 'aborted' | 'timeout'> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const s = readWaveLogStatus(logPath);
    if (s === 'clean' || s === 'blocked' || s === 'aborted') return s;
    await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return 'timeout';
}

const GATE_TAIL_CAP = 4096;

/**
 * R10 (D-A-40 / ADR Decision 4) — locate a gate command, consulting
 * `.devai/config/project.json`'s `hardFailGates.<gate>` first, then
 * falling back to the DEVAI defaults. Returns `null` when neither
 * resolves (caller emits a `not-configured` GateEvidence).
 *
 * Project-config values may be either:
 *   - a string: a shell-style command line (split on whitespace);
 *   - an object: { cmd: string, args: string[] }.
 *
 * `source` is `project-config` when the mapping came from the project
 * config (even if the value is empty/null — that's an explicit opt-out
 * which we honor as not-configured), and `devai-default` otherwise.
 */
export function resolveGateCommand(
  gateId: string,
  repoRoot: string,
):
  | {
      command: string;
      argv: string[];
      source: 'devai-default' | 'project-config';
      configKey?: string;
      cliBin?: string;
    }
  | {
      source: 'project-config' | 'devai-default';
      configKey?: string;
      reason: string;
      cliBin?: string;
    } {
  // 1. Project-config lookup. `hardFailGates.<gate>` per ADR §"runGate signature change".
  const projectConfigPath = join(repoRoot, '.devai/config/project.json');
  if (existsSync(projectConfigPath)) {
    try {
      const cfg = JSON.parse(readFileSync(projectConfigPath, 'utf8')) as Record<string, unknown>;
      const gates = cfg['hardFailGates'];
      if (gates !== undefined && gates !== null && typeof gates === 'object') {
        const raw = (gates as Record<string, unknown>)[gateId];
        if (raw !== undefined) {
          // Explicit null/empty-string → explicit opt-out from this adopter.
          if (raw === null || raw === '') {
            return {
              source: 'project-config',
              configKey: `hardFailGates.${gateId}`,
              reason: `project.json explicitly maps hardFailGates.${gateId} to null/empty — gate is opted-out`,
            };
          }
          if (typeof raw === 'string') {
            const parts = raw.split(/\s+/).filter((p) => p.length > 0);
            if (parts.length > 0) {
              return {
                command: raw,
                argv: parts,
                source: 'project-config',
                configKey: `hardFailGates.${gateId}`,
              };
            }
          } else if (typeof raw === 'object') {
            const o = raw as { cmd?: unknown; args?: unknown };
            if (typeof o.cmd === 'string' && o.cmd.length > 0) {
              const args = Array.isArray(o.args)
                ? o.args.filter((x): x is string => typeof x === 'string')
                : [];
              return {
                command: `${o.cmd} ${args.join(' ')}`.trim(),
                argv: [o.cmd, ...args],
                source: 'project-config',
                configKey: `hardFailGates.${gateId}`,
              };
            }
          }
        }
      }
    } catch {
      // malformed project.json — fall through to defaults
    }
  }

  // 2. DEVAI defaults.
  const devaiCliBin = resolveDevaiCliBin(repoRoot);
  const defaults: Record<string, { cmd: string; args: string[]; needsCli?: boolean }> = {
    lint: { cmd: 'pnpm', args: ['lint'] },
    typecheck: { cmd: 'pnpm', args: ['typecheck'] },
    test: { cmd: 'pnpm', args: ['test'] },
    'docs-links': {
      cmd: process.execPath,
      args:
        devaiCliBin === undefined ? [] : [devaiCliBin, 'docs', 'links', '--repo-root', repoRoot],
      needsCli: true,
    },
    'action-coverage': {
      cmd: process.execPath,
      args:
        devaiCliBin === undefined
          ? []
          : [devaiCliBin, 'spec', 'validate', 'action', 'coverage', '--repo-root', repoRoot],
      needsCli: true,
    },
  };
  const def = defaults[gateId];
  if (def === undefined) {
    return {
      source: 'devai-default',
      reason: `unknown gate '${gateId}' — no DEVAI default and no project-config mapping`,
    };
  }
  if (def.needsCli === true && devaiCliBin === undefined) {
    return {
      source: 'devai-default',
      reason: `DEVAI default for '${gateId}' requires the devai CLI bin, which was not found on PATH or via the standard search`,
    };
  }
  return {
    command: `${def.cmd} ${def.args.join(' ')}`.trim(),
    argv: [def.cmd, ...def.args],
    source: 'devai-default',
    ...(def.needsCli === true && devaiCliBin !== undefined && { cliBin: devaiCliBin }),
  };
}

/**
 * R10 (D-A-40 / ADR Decision 3) — run a single gate by id. Returns the
 * full GateEvidence object. When stdout/stderr exceed GATE_TAIL_CAP,
 * the full streams persist to `record/proofs/work/skill-runs/SKILL-round-verify-publish/<run-id>/gate-<id>.{stdout,stderr}.log`.
 *
 * Back-compat: legacy callers that only read `status` and shallow-read
 * `evidence.gate_id`/`evidence.cmd`/`evidence.cli_bin` continue to work
 * because those keys are mirrored on the returned object.
 *
 * `source` defaults to `'devai-default' | 'project-config'`; the
 * verify-publish caller overrides to `'extra-gate'` for gates passed
 * via `inputs.extra_gates`.
 */
export function runGate(
  gateId: string,
  repoRoot: string,
  opts?: { runId?: string; sourceOverride?: 'extra-gate' },
): { status: 'pass' | 'fail' | 'not-configured' | 'error'; evidence: GateEvidence } {
  const resolved = resolveGateCommand(gateId, repoRoot);
  if (!('command' in resolved)) {
    // not-configured branch (Decision 4).
    const ev: GateEvidence = {
      gate: gateId,
      gate_id: gateId,
      status: 'not-configured',
      source: opts?.sourceOverride ?? resolved.source,
      ...(resolved.configKey !== undefined && { config_key: resolved.configKey }),
      reason: resolved.reason,
    };
    return { status: 'not-configured', evidence: ev };
  }

  const startedAt = new Date().toISOString();
  const tStart = Date.now();
  const [bin, ...argv] = resolved.argv;
  const r = spawnSync(bin as string, argv, { cwd: repoRoot, encoding: 'utf8' });
  const tEnd = Date.now();
  const endedAt = new Date().toISOString();
  const stdout = r.stdout ?? '';
  const stderr = r.stderr ?? '';

  // Persist full streams when they exceed the tail cap. Best-effort:
  // a failed write doesn't fail the gate.
  let stdoutPath: string | undefined;
  let stderrPath: string | undefined;
  if (stdout.length > GATE_TAIL_CAP || stderr.length > GATE_TAIL_CAP) {
    const runId = opts?.runId ?? `run-${tStart.toString(36)}`;
    const dir = join(repoRoot, 'record/proofs/work/skill-runs/SKILL-round-verify-publish', runId);
    try {
      mkdirSync(dir, { recursive: true });
      if (stdout.length > GATE_TAIL_CAP) {
        const rel = `record/proofs/work/skill-runs/SKILL-round-verify-publish/${runId}/gate-${gateId}.stdout.log`;
        writeFileSync(join(repoRoot, rel), stdout);
        stdoutPath = rel;
      }
      if (stderr.length > GATE_TAIL_CAP) {
        const rel = `record/proofs/work/skill-runs/SKILL-round-verify-publish/${runId}/gate-${gateId}.stderr.log`;
        writeFileSync(join(repoRoot, rel), stderr);
        stderrPath = rel;
      }
    } catch {
      // best-effort
    }
  }

  const status: 'pass' | 'fail' = r.status === 0 ? 'pass' : 'fail';
  const ev: GateEvidence = {
    gate: gateId,
    gate_id: gateId,
    status,
    source: opts?.sourceOverride ?? resolved.source,
    command: resolved.command,
    cmd: resolved.command,
    argv: resolved.argv,
    cwd: repoRoot,
    exit_code: r.status,
    started_at: startedAt,
    ended_at: endedAt,
    duration_ms: tEnd - tStart,
    stdout_tail: stdout.slice(-GATE_TAIL_CAP),
    stderr_tail: stderr.slice(-GATE_TAIL_CAP),
    ...(stdoutPath !== undefined && { stdout_path: stdoutPath }),
    ...(stderrPath !== undefined && { stderr_path: stderrPath }),
    ...(resolved.configKey !== undefined && { config_key: resolved.configKey }),
    ...(resolved.cliBin !== undefined && { cli_bin: resolved.cliBin }),
  };
  return { status, evidence: ev };
}

/** R4-W4 — append a kind=escalate record to .devai/state/decisions.jsonl.
 * Thin wrapper over R5-W1's appendDecisionRecord; preserves the orchestrate
 * call sites. Returns the new id, or null if a duplicate was skipped. */

export const MANDATORY_MIN_GATES = [
  'lint',
  'typecheck',
  'test',
  'docs-links',
  'action-coverage',
] as const;
