import type { CellVerdict, Property, Scorecard, Substrate } from '../loop/scorecard.js';

/**
 * Phase 29.J (closes O-2): scorecard view modes.
 * Phase 30.K extends with an options API — orthogonal `transpose`,
 * `color`, `captions`, `brief` flags on top of the two structural
 * modes `grid` and `narrative` (`json` is a third mode that bypasses
 * flags since machine consumers want stable output).
 *
 * Render targets two surfaces:
 *   - Fixed-width terminals: align using a uniform 3-visual-column
 *     verdict cell ("emoji + 1 space" in color mode = 2-cell emoji
 *     + 1 space; "letter + 2 spaces" in plain mode = 1-char letter
 *     + 2 spaces). Both align with the 3-character row/column
 *     labels (T1, F1, …).
 *   - GUI / Markdown renderers (the agentic surface): emit code-
 *     fence-friendly text — no ANSI escapes, no trailing whitespace
 *     past needed alignment. Wrap in ``` for fixed-width preservation.
 */

export type RenderMode = 'narrative' | 'grid' | 'json';

export interface RenderOptions {
  readonly mode: RenderMode;
  /** Swap rows and columns (5×9 → 9×5). Default false. */
  readonly transpose?: boolean;
  /** Use colored Unicode emoji glyphs (true) or single-letter ASCII (false). Default false. */
  readonly color?: boolean;
  /** Show row/column labels around the matrix and verdict word after narrative coords. Default true. */
  readonly captions?: boolean;
  /** Suppress PASS cells (grid: render as faint dot; narrative: omit line). Default false for grid, true for narrative. */
  readonly brief?: boolean;
}

interface ResolvedOptions {
  readonly mode: RenderMode;
  readonly transpose: boolean;
  readonly color: boolean;
  readonly captions: boolean;
  readonly brief: boolean;
}

export interface ScorecardFilter {
  readonly substrate?: string;
  readonly property?: string;
  readonly verdict?: CellVerdict;
}

/**
 * Parse `--filter key=value` repeated CLI flag values into a filter
 * object. Recognised keys: substrate, property, verdict. Unknown
 * keys silently ignored (caller's responsibility to surface
 * usage errors).
 */
export function parseFilterFlags(values: readonly string[] | undefined): ScorecardFilter {
  const out: { -readonly [K in keyof ScorecardFilter]?: ScorecardFilter[K] } = {};
  for (const v of values ?? []) {
    const i = v.indexOf('=');
    if (i < 0) continue;
    const key = v.slice(0, i).trim();
    const value = v.slice(i + 1).trim();
    if (key === 'substrate') out.substrate = value;
    else if (key === 'property') out.property = value;
    else if (key === 'verdict') out.verdict = value as CellVerdict;
  }
  return out as ScorecardFilter;
}

export function applyFilter(scorecard: Scorecard, filter: ScorecardFilter): Scorecard {
  if (
    filter.substrate === undefined &&
    filter.property === undefined &&
    filter.verdict === undefined
  ) {
    return scorecard;
  }
  const cells = scorecard.cells.filter((c) => {
    if (filter.substrate !== undefined && c.substrate !== filter.substrate) return false;
    if (filter.property !== undefined && c.property !== filter.property) return false;
    if (filter.verdict !== undefined && c.verdict !== filter.verdict) return false;
    return true;
  });
  return { ...scorecard, cells };
}

const SUBSTRATES = ['F1', 'F2', 'F3', 'F4', 'F5'] as const;
const PROPERTIES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'] as const;

/**
 * Substrate + property descriptions, sourced from Constitution
 * Article 5. Used to enrich captions (narrative: replaces redundant
 * verdict word at line-end; grid: prints a dimension key below the
 * legend so the F/T short labels remain readable).
 */
const SUBSTRATE_NAMES: Readonly<Record<Substrate, string>> = {
  F1: 'Specification',
  F2: 'Plant',
  F3: 'Observation',
  F4: 'Inventory',
  F5: 'Harness',
};

const PROPERTY_NAMES: Readonly<Record<Property, string>> = {
  T1: 'Coverage',
  T2: 'Depth',
  T3: 'Coherence',
  T4: 'Alignment',
  T5: 'Idiomaticity',
  T6: 'Security',
  T7: 'Performance',
  T8: 'Robustness',
  T9: 'Discipline',
};

/**
 * Verdict palettes. Color uses single-codepoint emoji that render
 * at ~2 cells wide in monospace terminals; plain uses 1-char ASCII
 * letters chosen to be unambiguous (P/R/F/U/N).
 */
const VERDICT_GLYPH_EMOJI: Readonly<Record<CellVerdict, string>> = {
  PASS: '🟢',
  REVIEW: '🟡',
  FAIL: '🔴',
  UNKNOWN: '⚪',
  'N/A': '⬛',
};

const VERDICT_GLYPH_PLAIN: Readonly<Record<CellVerdict, string>> = {
  PASS: 'P',
  REVIEW: 'R',
  FAIL: 'F',
  UNKNOWN: 'U',
  'N/A': 'N',
};

/**
 * "Silent pass" — a deliberately quiet glyph for PASS cells that the
 * brief view suppresses. Distinct from the loud `🟢` so the eye
 * skips it; distinct from a generic empty/missing-data marker so a
 * reader still knows a verdict was computed. In color mode we use
 * the green square (same hue as 🟢, different shape = "muted");
 * in plain mode a lowercase `p` (cf. uppercase `P` for emphatic pass).
 */
const SILENT_PASS_GLYPH_EMOJI = '🟩';
const SILENT_PASS_GLYPH_PLAIN = 'p';

/** Missing-data / filter-suppressed (not a PASS): faint dot, both palettes. */
const EMPTY_CELL_GLYPH = '·';

const VERDICT_ORDER: Readonly<Record<CellVerdict, number>> = {
  FAIL: 0,
  REVIEW: 1,
  UNKNOWN: 2,
  'N/A': 3,
  PASS: 4,
};

/**
 * One verdict-cell slot. We target a uniform 3-visual-column width
 * so the grid lines up under fixed-width fonts:
 *   color=true  → "🟢 " : emoji (≈2 cells) + 1 space
 *   color=false → "P  " : 1-char letter + 2 spaces
 */
function glyphCell(glyph: string, color: boolean): string {
  return color ? `${glyph} ` : `${glyph}  `;
}

/** Faint placeholder for empty / filter-suppressed cells, same width as a verdict cell. */
function emptyCell(): string {
  return `${EMPTY_CELL_GLYPH}  `;
}

/** Quiet glyph for a PASS cell hidden by brief mode — same width as a verdict cell. */
function silentPassCell(color: boolean): string {
  return color ? `${SILENT_PASS_GLYPH_EMOJI} ` : `${SILENT_PASS_GLYPH_PLAIN}  `;
}

function countByVerdict(scorecard: Scorecard): Record<CellVerdict, number> {
  const counts: Record<CellVerdict, number> = { PASS: 0, REVIEW: 0, FAIL: 0, UNKNOWN: 0, 'N/A': 0 };
  for (const c of scorecard.cells) counts[c.verdict]++;
  return counts;
}

function renderLegend(palette: Readonly<Record<CellVerdict, string>>): string {
  return `legend  ${palette.PASS} pass   ${palette.REVIEW} review   ${palette.FAIL} fail   ${palette.UNKNOWN} unknown   ${palette['N/A']} n/a`;
}

function renderSummary(
  scorecard: Scorecard,
  palette: Readonly<Record<CellVerdict, string>>,
): string {
  const c = countByVerdict(scorecard);
  const total = scorecard.cells.length;
  const overall = scorecard.overall?.verdict ?? 'UNKNOWN';
  return [
    `${palette[overall]} overall ${overall}`,
    `${total} cells`,
    `${palette.PASS} ${c.PASS}`,
    `${palette.REVIEW} ${c.REVIEW}`,
    `${palette.FAIL} ${c.FAIL}`,
    `${palette.UNKNOWN} ${c.UNKNOWN}`,
    `${palette['N/A']} ${c['N/A']}`,
  ].join('   ');
}

function resolveOptions(input: RenderMode | RenderOptions): ResolvedOptions {
  if (typeof input === 'string') {
    // Legacy string mode shorthand: preserve pre-30.K defaults
    // (emoji on, full listing) so existing callers don't change shape.
    return { mode: input, transpose: false, color: true, captions: true, brief: false };
  }
  return {
    mode: input.mode,
    transpose: input.transpose ?? false,
    color: input.color ?? false,
    captions: input.captions ?? true,
    // brief defaults to true in both modes — non-PASS cells carry the
    // signal; suppressed PASS cells render as silent-pass squares.
    brief: input.brief ?? true,
  };
}

function renderDimensionKey(): readonly string[] {
  const fLine = SUBSTRATES.map((s) => `${s} ${SUBSTRATE_NAMES[s]}`).join('   ');
  const tLine = PROPERTIES.map((p) => `${p} ${PROPERTY_NAMES[p]}`).join('   ');
  return [`F dims  ${fLine}`, `T dims  ${tLine}`];
}

function renderGridView(scorecard: Scorecard, opts: ResolvedOptions): string {
  const palette = opts.color ? VERDICT_GLYPH_EMOJI : VERDICT_GLYPH_PLAIN;
  const at: Record<string, CellVerdict> = {};
  for (const cell of scorecard.cells) {
    at[`${cell.substrate}:${cell.property}`] = cell.verdict;
  }
  const rowAxis = opts.transpose ? PROPERTIES : SUBSTRATES;
  const colAxis = opts.transpose ? SUBSTRATES : PROPERTIES;
  const lookup = (rowLabel: string, colLabel: string): CellVerdict | undefined =>
    opts.transpose ? at[`${colLabel}:${rowLabel}`] : at[`${rowLabel}:${colLabel}`];

  const indent = '      ';
  const lines: string[] = [renderSummary(scorecard, palette), ''];
  if (opts.captions) {
    lines.push(indent + colAxis.map((c) => c.padEnd(3, ' ')).join(''));
  }
  for (const r of rowAxis) {
    const cellStrs: string[] = [];
    for (const c of colAxis) {
      const v = lookup(r, c);
      if (v === undefined) {
        cellStrs.push(emptyCell());
      } else if (opts.brief && v === 'PASS') {
        cellStrs.push(silentPassCell(opts.color));
      } else {
        cellStrs.push(glyphCell(palette[v], opts.color));
      }
    }
    const body = cellStrs.join('');
    lines.push(opts.captions ? `  ${r}  ${body}${r}` : `  ${body}`);
  }
  lines.push('', renderLegend(palette));
  if (opts.captions) {
    lines.push('', ...renderDimensionKey());
  }
  return lines.join('\n');
}

function renderNarrativeView(scorecard: Scorecard, opts: ResolvedOptions): string {
  const palette = opts.color ? VERDICT_GLYPH_EMOJI : VERDICT_GLYPH_PLAIN;
  let cells = [...scorecard.cells];
  if (opts.brief) cells = cells.filter((c) => c.verdict !== 'PASS');
  cells.sort((a, b) => {
    const d = VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict];
    if (d !== 0) return d;
    if (a.substrate !== b.substrate) return a.substrate < b.substrate ? -1 : 1;
    return a.property < b.property ? -1 : 1;
  });
  const lines = [renderSummary(scorecard, palette), ''];
  // Width-align coords so the dimension-description column lines up.
  // "F1×T1" is 5 chars; keep that width across both axis orderings.
  for (const c of cells) {
    const coord = opts.transpose ? `${c.property}×${c.substrate}` : `${c.substrate}×${c.property}`;
    const fName = SUBSTRATE_NAMES[c.substrate as Substrate];
    const tName = PROPERTY_NAMES[c.property as Property];
    const description = opts.transpose ? `${tName} × ${fName}` : `${fName} × ${tName}`;
    const trailing = opts.captions ? `  ${description}` : '';
    lines.push(`  ${palette[c.verdict]}  ${coord}${trailing}`);
  }
  lines.push('', renderLegend(palette));
  return lines.join('\n');
}

/** Grid view with the full options API. */
export function renderGrid(scorecard: Scorecard, options?: Omit<RenderOptions, 'mode'>): string {
  return renderGridView(scorecard, resolveOptions({ mode: 'grid', ...(options ?? {}) }));
}

/** Narrative view with the full options API. */
export function renderNarrative(
  scorecard: Scorecard,
  options?: Omit<RenderOptions, 'mode'>,
): string {
  return renderNarrativeView(scorecard, resolveOptions({ mode: 'narrative', ...(options ?? {}) }));
}

/**
 * Single entry point. Accepts either a legacy mode string
 * (back-compat: emoji on, full listing) or a RenderOptions object
 * (per-flag defaults — color off, captions on, brief on for
 * narrative only).
 */
export function renderScorecard(scorecard: Scorecard, options: RenderMode | RenderOptions): string {
  const opts = resolveOptions(options);
  switch (opts.mode) {
    case 'json':
      return JSON.stringify(scorecard, null, 2);
    case 'grid':
      return renderGridView(scorecard, opts);
    case 'narrative':
    default:
      return renderNarrativeView(scorecard, opts);
  }
}
