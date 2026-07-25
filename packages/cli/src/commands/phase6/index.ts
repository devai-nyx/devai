import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CAC } from 'cac';
import {
  applyFilter,
  assessScorecard,
  classifyFailure,
  composePrompt,
  computeScorecard,
  createLlmClient,
  detectRelabeledSensors,
  diffPrompts,
  dispatchFor,
  freezePrompt,
  loadReadingsFromDir,
  loadScorecardFailureMaxAgeMs,
  loadScorecardNaConfig,
  parseFilterFlags,
  renderScorecard,
  resolveScorecardNaPath,
  scorecardNaCellSet,
  summarizeCells,
  tieBreak,
  tieBreakWithLadder,
  type RenderMode,
  type Scorecard,
  type PromptComposition,
  type PromptComponentInput,
  type PromptLayer,
  type TriageVerdict,
  profileAtLeast,
  readProfile,
} from '#core-compat';
import { validators } from '@devai-nyx/schemas';
import type { SensorReading } from '@devai-nyx/sensors';
import { EXIT_FAIL, EXIT_PASS, EXIT_USAGE } from '@devai-nyx/utils';
import { defineCommand } from '../../define-command.js';
import { validateOrExit } from '../../validate-emit.js';

function emit(json: unknown, human: boolean, humanText: string): void {
  if (human) process.stdout.write(humanText.endsWith('\n') ? humanText : humanText + '\n');
  else process.stdout.write(JSON.stringify(json) + '\n');
}

// ============================================================================
// Triage (3 commands)
// ============================================================================

export const triageClassify = defineCommand({
  name: 'triage classify',
  description:
    'Classify a SensorReading failure (plant_bug | sensor_error | policy_issue | reference_gap | inconclusive)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('triage-classify <reading-file>', 'Classify a SensorReading JSON file')
      .option('--timestamp <iso>', 'generated_at (default: now)')
      .option('--human', 'Human-readable output')
      .action((file: string, options: { timestamp?: string; human?: boolean }) => {
        const reading = JSON.parse(readFileSync(file, 'utf8')) as SensorReading;
        const verdict = classifyFailure(reading, options.timestamp);
        validateOrExit(validators.triage, verdict, 'triage', 'devai govern triage classify');
        emit(
          verdict,
          options.human === true,
          `triage classify: ${verdict.classification} (confidence ${verdict.confidence.score.toFixed(2)})\n  ${verdict.summary}`,
        );
        process.exit(EXIT_PASS);
      });
  },
});

export const triageTieBreak = defineCommand({
  name: 'triage tie-break',
  description: 'Pick the higher-confidence of two TriageVerdicts (Article 23 MVP)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('triage-tie-break <first-file> <second-file>', 'Tie-break two triage verdicts')
      .option(
        '--breaker-family <name>',
        "'claude' | 'codex' | 'mock' | 'claude-cli' | 'codex-cli' — enables Article-23 cross-family ladder. Operator picks a family with a different vendor (anthropic vs openai vs mock). Without this flag, the MVP fallback runs (sync).",
      )
      .option('--repo-root <path>', 'Repo root for LLM telemetry (default: .)')
      .option('--sensor-context <path>', 'File with raw sensor context for the breaker (optional)')
      .option('--human', 'Human-readable output')
      .action(
        async (
          firstFile: string,
          secondFile: string,
          options: {
            breakerFamily?: string;
            repoRoot?: string;
            sensorContext?: string;
            human?: boolean;
          },
        ) => {
          const a = JSON.parse(readFileSync(firstFile, 'utf8')) as TriageVerdict;
          const b = JSON.parse(readFileSync(secondFile, 'utf8')) as TriageVerdict;
          let verdict: TriageVerdict;
          if (options.breakerFamily !== undefined) {
            // Article-23 cross-family ladder.
            const breakerClient = createLlmClient({
              repoRoot: options.repoRoot ?? '.',
              family: options.breakerFamily as
                'claude' | 'codex' | 'mock' | 'claude-cli' | 'codex-cli' | 'auto',
            });
            const sensorContext =
              options.sensorContext !== undefined
                ? readFileSync(options.sensorContext, 'utf8')
                : undefined;
            try {
              verdict = await tieBreakWithLadder({
                first: a,
                second: b,
                breakerClient,
                ...(sensorContext !== undefined && { sensorContext }),
              });
            } catch (err) {
              process.stderr.write(
                `devai govern triage tie break: breaker call failed — ${err instanceof Error ? err.message : String(err)}\n`,
              );
              process.exit(EXIT_FAIL);
            }
          } else {
            verdict = tieBreak({ first: a, second: b });
          }
          validateOrExit(validators.triage, verdict, 'triage', 'devai govern triage tie break');
          emit(
            verdict,
            options.human === true,
            `triage tie-break: ${verdict.classification} won (confidence ${verdict.confidence.score.toFixed(2)}, method=${verdict.confidence.method ?? '?'})`,
          );
          process.exit(EXIT_PASS);
        },
      );
  },
});

export const triageDispatch = defineCommand({
  name: 'triage dispatch',
  description: 'Print the discipline a classification should route to',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('triage-dispatch <verdict-file>', 'Dispatch target for a triage verdict')
      .option('--human', 'Human-readable output')
      .action((file: string, options: { human?: boolean }) => {
        const verdict = JSON.parse(readFileSync(file, 'utf8')) as TriageVerdict;
        const target = dispatchFor(verdict);
        emit(
          target,
          options.human === true,
          `triage dispatch: ${target.classification} → ${target.discipline} (${target.action})`,
        );
        process.exit(EXIT_PASS);
      });
  },
});

// ============================================================================
// Scorecard (4 commands)
// ============================================================================

/**
 * Load SensorReadings from either a JSON array file (--readings-file)
 * or a directory of per-sensor JSON files (--readings-dir). The
 * directory variant is the natural shape when each `devai sense …`
 * command's stdout is redirected to a separate file, which is how the
 * CI self-application pipeline feeds the scorecard.
 *
 * Phase 25.B: the directory walker is now the shared
 * `loadReadingsFromDir` from `@devai-nyx/loop`, which both
 * SKILL-compute-scorecard and SKILL-assess-state also use.
 */
/**
 * Phase 34.B (D-91): resolve the default scorecard-na config path.
 *
 * If `--readings-dir` is passed and it ends with `.devai/state/sensor-
 * readings`, the carve-out file is expected to live alongside it at
 * `<repoRoot>/.devai/config/scorecard-na.json`. This is the
 * semantically correct default: the carve-out belongs to the repo
 * being scored, not to whatever cwd happens to be running the CLI
 * (e.g. integration tests invoke score-compute from the DEVAI cwd
 * but pass a `--readings-dir` pointing at a temp adopter — the
 * adopter's carve-out, if any, is what should apply).
 *
 * Fall back to cwd's default file when no readings-dir is passed or
 * it doesn't follow the conventional location.
 */
function resolveDefaultScorecardNaPath(readingsDir: string | undefined): string {
  if (readingsDir !== undefined) {
    const normalized = readingsDir.replace(/\/+$/, '');
    // Match either `<repo>/.devai/state/sensor-readings` (canonical)
    // or `<repo>/.devai/state/sensor-readings/<kind>` (per-kind subdir
    // shape; tests sometimes point at a single kind to scope the run).
    const match = normalized.match(/^(.+?)\/\.devai\/state\/sensor-readings(?:\/[^/]+)?$/);
    if (match !== null) {
      const repoRoot = match[1] ?? '.';
      return resolveScorecardNaPath(repoRoot.length > 0 ? repoRoot : '.');
    }
  }
  return resolveScorecardNaPath();
}

function resolveDefaultScorecardRepoRoot(readingsDir: string): string {
  const normalized = readingsDir.replace(/\/+$/, '');
  const match = normalized.match(/^(.+?)\/\.devai\/state\/sensor-readings(?:\/[^/]+)?$/);
  return resolve(match?.[1] ?? '.');
}

function loadReadings(opts: {
  readingsFile?: string;
  readingsDir?: string;
  latestPerKind?: boolean;
}): SensorReading[] {
  const readings: SensorReading[] = [];
  if (opts.readingsFile !== undefined) {
    const parsed = JSON.parse(readFileSync(opts.readingsFile, 'utf8')) as unknown;
    if (Array.isArray(parsed)) {
      for (const r of parsed) readings.push(r as SensorReading);
    } else {
      readings.push(parsed as SensorReading);
    }
  }
  if (opts.readingsDir !== undefined) {
    if (!existsSync(opts.readingsDir)) {
      throw new Error(`--readings-dir does not exist: ${opts.readingsDir}`);
    }
    readings.push(
      ...loadReadingsFromDir(
        opts.readingsDir,
        opts.latestPerKind === true ? { latestPerKind: true } : {},
      ),
    );
  }
  return readings;
}

const DEFAULT_SCORECARD_GLOBS = [
  '.devai/state/skills/SKILL-compute-scorecard/*.json',
  '.devai/state/scorecards/latest.json',
] as const;

interface ScorecardViewOptions {
  readonly mode?: string;
  readonly transpose?: boolean;
  readonly color?: boolean;
  readonly emoji?: boolean;
  readonly captions?: boolean;
  readonly brief?: boolean;
  readonly full?: boolean;
  readonly filter?: string | string[];
}

function normalizeList(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

function resolveRenderMode(value: string | undefined): RenderMode {
  const mode = value ?? 'grid';
  if (mode === 'grid' || mode === 'narrative' || mode === 'json') return mode;
  throw new Error(`invalid --mode '${mode}': expected grid, narrative, or json`);
}

function renderScorecardForCli(scorecard: Scorecard, options: ScorecardViewOptions): string {
  const mode = resolveRenderMode(options.mode);
  const filtered = applyFilter(scorecard, parseFilterFlags(normalizeList(options.filter)));
  const color = options.color ?? process.stdout.isTTY === true;
  const brief = options.full === true ? false : (options.brief ?? mode === 'narrative');
  return renderScorecard(filtered, {
    mode,
    transpose: options.transpose ?? mode === 'grid',
    color: color || options.emoji === true,
    captions: options.captions ?? true,
    brief,
  });
}

function scorecardFilesFromSkillDir(): string[] {
  const dir = '.devai/state/skills/SKILL-compute-scorecard';
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(dir, name))
    .filter((path) => {
      try {
        return statSync(path).isFile();
      } catch {
        return false;
      }
    });
}

function newestFile(paths: readonly string[]): string | undefined {
  let newest: { path: string; mtimeMs: number } | undefined;
  for (const path of paths) {
    try {
      const stat = statSync(path);
      if (!stat.isFile()) continue;
      if (newest === undefined || stat.mtimeMs > newest.mtimeMs) {
        newest = { path, mtimeMs: stat.mtimeMs };
      }
    } catch {
      // Ignore paths that disappear while resolving.
    }
  }
  return newest?.path;
}

function discoverScorecardFile(): string {
  const skillFile = newestFile(scorecardFilesFromSkillDir());
  if (skillFile !== undefined) return skillFile;
  const canonical = '.devai/state/scorecards/latest.json';
  if (existsSync(canonical)) return canonical;
  throw new Error(`missing scorecard file; searched ${DEFAULT_SCORECARD_GLOBS.join(', ')}`);
}

function loadScorecardFile(file: string): Scorecard {
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  const candidate =
    parsed !== null &&
    typeof parsed === 'object' &&
    'evidence' in parsed &&
    (parsed as { evidence?: unknown }).evidence !== undefined
      ? (parsed as { evidence: unknown }).evidence
      : parsed;
  if (!validators.scorecard(candidate)) {
    throw new Error(
      `scorecard JSON at ${file} fails scorecard.schema.json: ${JSON.stringify(validators.scorecard.errors)}`,
    );
  }
  return candidate as Scorecard;
}

export const scoreCompute = defineCommand({
  name: 'score compute',
  description: 'Compute the F×T scorecard from SensorReadings',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('score-compute', 'Compute a scorecard from --readings-file and/or --readings-dir')
      .option('--readings-file <path>', 'JSON file: one SensorReading or array of them')
      .option('--readings-dir <path>', 'Directory: each *.json is a SensorReading (or array)')
      .option('--timestamp <iso>', 'generated_at (default: now)')
      .option('--integration-head <sha>', 'integration_head (default: HEAD sentinel)')
      .option(
        '--scorecard-na <path>',
        'Per-repo N/A override config (Phase 34.B / D-91). Default: <cwd>/.devai/config/scorecard-na.json (no-op if absent).',
      )
      .option(
        '--latest-per-kind',
        'Keep only the most recent SensorReading per sensor.kind when loading from --readings-dir (Phase 38.C / D-99). Avoids stale-SR pollution under worst-wins semantics. Default off.',
      )
      .option(
        '--view <grid|narrative|json>',
        'Render the computed scorecard through a view mode instead of the default JSON/human output',
      )
      .option('--transpose', 'Transpose scorecard grid axes (default true for grid views)')
      .option('--color', 'Use the existing colored glyph palette')
      .option('--no-color', 'Use plain ASCII glyphs')
      .option('--emoji', 'Enable the existing Unicode glyph palette')
      .option('--captions', 'Show row/column captions (default)')
      .option('--no-captions', 'Hide row/column captions')
      .option('--brief', 'Brief view')
      .option('--full', 'Full view')
      .option(
        '--filter <key=value>',
        'Filter scorecard cells; repeatable. Keys: substrate, property, verdict',
      )
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          readingsFile?: string;
          readingsDir?: string;
          timestamp?: string;
          integrationHead?: string;
          scorecardNa?: string;
          latestPerKind?: boolean;
          view?: string;
          transpose?: boolean;
          color?: boolean;
          emoji?: boolean;
          captions?: boolean;
          brief?: boolean;
          full?: boolean;
          filter?: string | string[];
          human?: boolean;
        }) => {
          const readings = loadReadings(options);
          const timestamp = options.timestamp ?? new Date().toISOString();
          const integrationHead = options.integrationHead ?? '0'.repeat(39) + 'f';
          // D-120: anti-relabeling advisory — surfaces readings that
          // share a command_hash across distinct sensor.kind values
          // (one command's exit code fanned into several cells).
          // Non-blocking here; `devai policy check sensor integrity` is the
          // dedicated gate for CI.
          const relabelGroups = detectRelabeledSensors(readings);
          // Phase 34.B (D-91): per-repo N/A overlay. Explicit
          // --scorecard-na overrides the default lookup. The
          // default tries to find the carve-out next to the
          // scored repo's readings dir first (so the carve-out
          // travels with the readings being scored), then falls
          // back to cwd. Absent default file is a no-op;
          // schema-invalid file hard-throws.
          const naPath = options.scorecardNa ?? resolveDefaultScorecardNaPath(options.readingsDir);
          const naConfig = loadScorecardNaConfig(naPath);
          const naCells = scorecardNaCellSet(naConfig);
          const scorecard = computeScorecard({
            timestamp,
            integrationHead,
            readings,
            naCells,
            staleFailAfterMs: loadScorecardFailureMaxAgeMs(
              options.readingsDir === undefined
                ? process.cwd()
                : resolveDefaultScorecardRepoRoot(options.readingsDir),
            ),
          });
          validateOrExit(
            validators.scorecard,
            scorecard,
            'scorecard',
            'devai govern score compute',
          );
          const s = summarizeCells(scorecard.cells);
          // D-112: below tier3 the scorecard is computed identically
          // but does not gate — exit PASS regardless of cell verdicts.
          // The JSON body is unchanged; only exit semantics move.
          const profile = readProfile(process.cwd());
          const gating = profileAtLeast(profile, 'tier3');
          const advisoryNote = gating
            ? ''
            : `\n  (advisory: profile ${profile} — scorecard does not gate below tier3)`;
          const relabelNote =
            relabelGroups.length > 0
              ? `\n  (advisory: ${String(relabelGroups.length)} command_hash group(s) shared across distinct sensor kinds — run \`devai policy check sensor integrity\`)`
              : '';

          if (options.view !== undefined) {
            try {
              process.stdout.write(
                renderScorecardForCli(scorecard, { ...options, mode: options.view }) + '\n',
              );
            } catch (err) {
              process.stderr.write(
                `devai govern score compute: ${err instanceof Error ? err.message : String(err)}\n`,
              );
              process.exit(EXIT_USAGE);
            }
            process.exit(gating && s.fail > 0 ? EXIT_FAIL : EXIT_PASS);
          }
          emit(
            scorecard,
            options.human === true,
            `score compute: ${String(s.pass)}/${String(s.total)} cells passing` +
              ` (fail ${String(s.fail)}, review ${String(s.review)},` +
              ` unknown ${String(s.unknown)}, na ${String(s.na)})` +
              `\n  overall: ${scorecard.overall.verdict}` +
              advisoryNote +
              relabelNote,
          );
          process.exit(gating && s.fail > 0 ? EXIT_FAIL : EXIT_PASS);
        },
      );
  },
});

export const scoreView = defineCommand({
  name: 'score view',
  description: 'Render a scorecard artifact with grid, narrative, or JSON view modes',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('score-view [scorecard-file]', 'Render a scorecard JSON artifact')
      .option('--mode <grid|narrative|json>', 'View mode (default: grid)')
      .option('--transpose', 'Transpose scorecard grid axes (default true for grid)')
      .option('--color', 'Use the existing colored glyph palette')
      .option('--no-color', 'Use plain ASCII glyphs')
      .option('--emoji', 'Enable the existing Unicode glyph palette')
      .option('--captions', 'Show row/column captions (default)')
      .option('--no-captions', 'Hide row/column captions')
      .option('--brief', 'Brief view')
      .option('--full', 'Full view')
      .option(
        '--filter <key=value>',
        'Filter scorecard cells; repeatable. Keys: substrate, property, verdict',
      )
      .action((file: string | undefined, options: ScorecardViewOptions) => {
        let resolvedFile: string;
        try {
          resolvedFile = file ?? discoverScorecardFile();
          const scorecard = loadScorecardFile(resolvedFile);
          process.stdout.write(renderScorecardForCli(scorecard, options) + '\n');
          process.exit(EXIT_PASS);
        } catch (err) {
          process.stderr.write(
            `devai govern score view: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(EXIT_USAGE);
        }
      });
  },
});

export const scoreAssess = defineCommand({
  name: 'score assess',
  description: 'Generate a narrative assessment from a scorecard',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('score-assess <scorecard-file>', 'Assess a scorecard')
      .option('--timestamp <iso>', 'generated_at (default: now)')
      .option(
        '--readings-dir <path>',
        'Directory of SensorReading files (one per *.json, or nested <kind>/<id>.json). Phase 23.I: enables per-cell-class narrative (FAIL cells quote findings; REVIEW cells list reason codes).',
      )
      .option('--human', 'Human-readable output')
      .action(
        (file: string, options: { timestamp?: string; readingsDir?: string; human?: boolean }) => {
          const scorecard = JSON.parse(readFileSync(file, 'utf8')) as never;
          const readings =
            options.readingsDir !== undefined
              ? loadReadings({ readingsDir: options.readingsDir })
              : [];
          const assessment = assessScorecard(
            scorecard,
            options.timestamp ?? new Date().toISOString(),
            1,
            readings,
          );
          validateOrExit(
            validators.assessment,
            assessment,
            'assessment',
            'devai govern score assess',
          );
          emit(assessment, options.human === true, `score assess: ${assessment.narrative}`);
          process.exit(EXIT_PASS);
        },
      );
  },
});

export const scoreBacklogRefresh = defineCommand({
  name: 'score backlog-refresh',
  description: 'Refresh the backlog from scorecard deltas (Phase-6 MVP: prints plan)',
  authority: 'mesh_controller',
  register(cli: CAC): void {
    cli
      .command('score-backlog-refresh', 'Plan backlog updates from a scorecard delta')
      .option('--human', 'Human-readable output')
      .action((options: { human?: boolean }) => {
        emit(
          {
            planned: 0,
            message:
              'Phase-6 MVP: backlog persistence + auditor-driven refresh ships in Phase 8 alongside SKILL-compile-backlog',
          },
          options.human === true,
          'score backlog-refresh: 0 backlog item(s) planned (Phase-6 MVP — see SKILL-compile-backlog in Phase 8)',
        );
        process.exit(EXIT_PASS);
      });
  },
});

// ============================================================================
// Prompts (3 commands)
// ============================================================================

const PROMPT_LAYERS: ReadonlySet<PromptLayer> = new Set([
  'global',
  'role',
  'discipline',
  'task',
  'payload',
  'overlay',
]);

export const promptsCompose = defineCommand({
  name: 'prompts compose',
  description: 'Compose a deterministic prompt stack from named components',
  authority: 'agent_runtime',
  register(cli: CAC): void {
    cli
      .command('prompts-compose', 'Compose a deterministic prompt stack')
      .option(
        '--component <layer:name=path>',
        'Component file (repeatable; e.g. role:engineer.role=docs/role.md). Layer ∈ global|role|discipline|task|payload|overlay.',
      )
      .option('--task-id <id>', 'Task id (required, must match ^TASK-)')
      .option('--timestamp <iso>', 'generated_at (default: now)')
      .option('--human', 'Human-readable output')
      .action(
        (options: {
          component?: string | string[];
          taskId?: string;
          timestamp?: string;
          human?: boolean;
        }) => {
          if (options.taskId === undefined) {
            process.stderr.write(
              'devai agent prompt compose: --task-id is required (per prompt-composition.schema.json)\n',
            );
            process.exit(EXIT_USAGE);
          }
          const list = Array.isArray(options.component)
            ? options.component
            : options.component !== undefined
              ? [options.component]
              : [];
          if (list.length === 0) {
            process.stderr.write(
              'devai agent prompt compose: at least one --component is required\n',
            );
            process.exit(EXIT_USAGE);
          }
          const components: PromptComponentInput[] = list.map((spec) => {
            // Format: layer:name=path
            const colon = spec.indexOf(':');
            const eq = spec.indexOf('=');
            if (colon === -1 || eq === -1 || colon > eq) {
              throw new Error(`invalid --component '${spec}': expected layer:name=path`);
            }
            const layer = spec.slice(0, colon) as PromptLayer;
            if (!PROMPT_LAYERS.has(layer)) {
              throw new Error(
                `invalid --component layer '${layer}': expected one of ${[...PROMPT_LAYERS].join('|')}`,
              );
            }
            const name = spec.slice(colon + 1, eq);
            const path = spec.slice(eq + 1);
            return { layer, name, body: readFileSync(path, 'utf8'), source: path };
          });
          const composition = composePrompt({
            task_id: options.taskId,
            components,
            timestamp: options.timestamp ?? new Date().toISOString(),
          });
          validateOrExit(
            validators.promptComposition,
            composition,
            'prompt-composition',
            'devai agent prompt compose',
          );
          emit(
            composition,
            options.human === true,
            `prompts compose: ${composition.id}\n  stack_sha256: ${composition.stack_sha256}\n  components: ${composition.components.map((c) => `${c.layer}:${c.name}`).join(', ')}`,
          );
          process.exit(EXIT_PASS);
        },
      );
  },
});

export const promptsDiff = defineCommand({
  name: 'prompts diff',
  description: 'Diff two prompt compositions; report changed component names',
  authority: 'agent_runtime',
  register(cli: CAC): void {
    cli
      .command('prompts-diff <a-file> <b-file>', 'Diff two PromptComposition JSONs')
      .option('--human', 'Human-readable output')
      .action((aFile: string, bFile: string, options: { human?: boolean }) => {
        const a = JSON.parse(readFileSync(aFile, 'utf8')) as PromptComposition;
        const b = JSON.parse(readFileSync(bFile, 'utf8')) as PromptComposition;
        const diff = diffPrompts(a, b);
        emit(
          diff,
          options.human === true,
          `prompts diff: ${diff.equal ? 'equal' : 'differs'}\n  changed: ${diff.changed_components.join(', ') || '(none)'}\n  added: ${diff.added.join(', ') || '(none)'}\n  removed: ${diff.removed.join(', ') || '(none)'}`,
        );
        process.exit(diff.equal ? EXIT_PASS : EXIT_FAIL);
      });
  },
});

export const promptsFreeze = defineCommand({
  name: 'prompts freeze',
  description: 'Snapshot a prompt composition for governed loops (Article 37)',
  authority: 'agent_runtime',
  register(cli: CAC): void {
    cli
      .command('prompts-freeze <composition-file>', 'Freeze a prompt composition')
      .option('--human', 'Human-readable output')
      .action((file: string, options: { human?: boolean }) => {
        const composition = JSON.parse(readFileSync(file, 'utf8')) as PromptComposition;
        const frozen = freezePrompt(composition);
        validateOrExit(
          validators.promptComposition,
          frozen,
          'prompt-composition',
          'devai agent prompt freeze',
        );
        emit(
          frozen,
          options.human === true,
          `prompts freeze: ${frozen.id} frozen (stack_sha256 ${frozen.stack_sha256})`,
        );
        process.exit(EXIT_PASS);
      });
  },
});
