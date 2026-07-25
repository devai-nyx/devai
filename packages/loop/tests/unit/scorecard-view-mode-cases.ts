import { describe, expect, it } from 'vitest';
import type { Scorecard } from '../../src/loop/scorecard.js';
import {
  applyFilter,
  parseFilterFlags,
  renderGrid,
  renderNarrative,
  renderScorecard,
} from '../../src/scorecard/view-modes.js';

const scorecard: Scorecard = {
  schemaVersion: '1.0.0',
  id: 'SC-20260724T000000-001',
  generated_at: '2026-07-24T00:00:00.000Z',
  integration_head: 'a'.repeat(40),
  thresholds_used: { source: 'fixture' },
  cells: [
    { substrate: 'F1', property: 'T1', verdict: 'PASS', deterministic: true },
    { substrate: 'F1', property: 'T2', verdict: 'FAIL', deterministic: true },
    { substrate: 'F2', property: 'T1', verdict: 'REVIEW', deterministic: false },
    { substrate: 'F3', property: 'T3', verdict: 'UNKNOWN', deterministic: true },
    { substrate: 'F4', property: 'T5', verdict: 'N/A', deterministic: true },
  ],
  substrate_aggregates: {},
  invariant_rollups: [],
  overall: { verdict: 'FAIL' },
};

describe('scorecard view filters', () => {
  it('parses recognized repeated flags and ignores malformed or unknown flags', () => {
    expect(
      parseFilterFlags([
        'substrate=F1',
        'property = T2',
        'verdict=FAIL',
        'unknown=value',
        'malformed',
      ]),
    ).toEqual({ substrate: 'F1', property: 'T2', verdict: 'FAIL' });
    expect(parseFilterFlags(undefined)).toEqual({});
  });

  it('returns the same object when no filter is active and combines active predicates', () => {
    expect(applyFilter(scorecard, {})).toBe(scorecard);
    const filtered = applyFilter(scorecard, {
      substrate: 'F1',
      property: 'T2',
      verdict: 'FAIL',
    });
    expect(filtered).not.toBe(scorecard);
    expect(filtered.cells).toEqual([scorecard.cells[1]]);
    expect(filtered.overall).toEqual(scorecard.overall);
  });
});

describe('scorecard rendering', () => {
  it('renders JSON as stable indented machine output', () => {
    expect(renderScorecard(scorecard, 'json')).toBe(JSON.stringify(scorecard, null, 2));
    expect(renderScorecard(scorecard, { mode: 'json', brief: true })).toBe(
      JSON.stringify(scorecard, null, 2),
    );
  });

  it('renders a captioned plain grid with placeholders and quiet pass cells', () => {
    const rendered = renderGrid(scorecard);

    expect(rendered).toContain('F overall FAIL');
    expect(rendered).toContain('5 cells');
    expect(rendered).toContain('T1 T2 T3 T4 T5 T6 T7 T8 T9');
    expect(rendered).toContain('p  F  ·');
    expect(rendered).toContain('legend  P pass');
    expect(rendered).toContain('F dims  F1 Specification');
    expect(rendered).toContain('T dims  T1 Coverage');
  });

  it('renders transposed color grids without captions', () => {
    const rendered = renderScorecard(scorecard, {
      mode: 'grid',
      transpose: true,
      color: true,
      captions: false,
      brief: false,
    });

    expect(rendered).toContain('🔴 overall FAIL');
    expect(rendered).toContain('🟢');
    expect(rendered).toContain('🔴');
    expect(rendered).not.toContain('F dims');
    expect(rendered).not.toContain('T dims');
  });

  it('sorts narrative output by severity and suppresses passes in brief mode', () => {
    const rendered = renderNarrative(scorecard);
    const fail = rendered.indexOf('F  F1×T2');
    const review = rendered.indexOf('R  F2×T1');
    const unknown = rendered.indexOf('U  F3×T3');
    const na = rendered.indexOf('N  F4×T5');

    expect(fail).toBeGreaterThan(0);
    expect(review).toBeGreaterThan(fail);
    expect(unknown).toBeGreaterThan(review);
    expect(na).toBeGreaterThan(unknown);
    expect(rendered).not.toContain('F1×T1');
    expect(rendered).toContain('Specification × Depth');
  });

  it('supports legacy full color narrative and transposed uncaptained narrative', () => {
    const legacy = renderScorecard(scorecard, 'narrative');
    const transposed = renderNarrative(scorecard, {
      transpose: true,
      captions: false,
      color: false,
      brief: false,
    });

    expect(legacy).toContain('🟢  F1×T1');
    expect(legacy).toContain('🔴  F1×T2');
    expect(transposed).toContain('P  T1×F1');
    expect(transposed).not.toContain('Specification × Coverage');
  });
});
