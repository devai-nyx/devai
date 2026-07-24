import type { RoundVerdict } from '../types.js';
import { computeScorecardDelta } from './state.js';

export function buildCloseoutMd(opts: {
  roundN: number | string;
  goal: string;
  verdict: RoundVerdict;
  closingCommits: string[];
  gateResults: { gate: string; status: 'pass' | 'fail' | 'not-configured' }[];
  scorecardDelta: ReturnType<typeof computeScorecardDelta>;
  waveStatuses: { wave: string; status: string }[];
  blockers: { id: string; subject: string; description: string; waveId?: string }[];
}): string {
  const ts = new Date().toISOString();
  const closingCommitsLine =
    opts.closingCommits.length === 0
      ? '_(to be set on commit; will replace this placeholder with the actual SHA)_'
      : opts.closingCommits.map((s) => `\`${s}\``).join(', ');
  const gateStatusGlyph = (s: 'pass' | 'fail' | 'not-configured'): string => {
    if (s === 'pass') return '✓ pass';
    if (s === 'fail') return '✗ fail';
    return '∅ not-configured';
  };
  const gateTable =
    opts.gateResults.length === 0
      ? '_(no gates re-run; verify-publish in degraded mode)_'
      : '| Gate | Status |\n|------|--------|\n' +
        opts.gateResults.map((g) => `| ${g.gate} | ${gateStatusGlyph(g.status)} |`).join('\n');
  // R10 (D-A-40): summary line per ADR Decision 4 — "P pass / F fail / N not-configured".
  const gatePass = opts.gateResults.filter((g) => g.status === 'pass').length;
  const gateFail = opts.gateResults.filter((g) => g.status === 'fail').length;
  const gateNotConfigured = opts.gateResults.filter((g) => g.status === 'not-configured').length;
  const gateSummary = `Gates: ${String(gatePass)} pass / ${String(gateFail)} fail / ${String(gateNotConfigured)} not-configured`;
  const deltaTable =
    opts.scorecardDelta.flipped.length === 0
      ? '_(no cell verdicts changed)_'
      : '| Cell | Before | After |\n|------|--------|-------|\n' +
        opts.scorecardDelta.flipped
          .map((d) => `| ${d.cell} | ${d.before} | ${d.after} |`)
          .join('\n');
  const waveTable =
    opts.waveStatuses.length === 0
      ? '_(no waves detected)_'
      : '| Wave | Status |\n|------|--------|\n' +
        opts.waveStatuses
          .map((w) => `| R${String(opts.roundN)}-${w.wave} | ${w.status} |`)
          .join('\n');
  const blockerList =
    opts.blockers.length === 0
      ? '_None._'
      : opts.blockers
          .map(
            (b) =>
              `- **${b.id}** — ${b.subject}${b.waveId !== undefined ? ` (${b.waveId})` : ''}\n  ${b.description}`,
          )
          .join('\n');
  return `# R${String(opts.roundN)} Closeout — ${opts.goal}

**Closed:** ${ts}
**Verdict:** ${opts.verdict}
**Closing commit(s):** ${closingCommitsLine}

## Goal

${opts.goal}

## Outcome

Auto-materialized by SKILL-round-verify-publish (R4-W5 real execution). Gates re-run, scorecard recomputed, blockers lifted from \`.devai/state/decisions.jsonl\`, wave statuses scanned.

## Measurements

### Gates re-run

${gateSummary}

${gateTable}

### Scorecard delta

- Before: ${String(opts.scorecardDelta.before_count)} cells
- After: ${String(opts.scorecardDelta.after_count)} cells
- Cells with changed verdicts: ${String(opts.scorecardDelta.flipped.length)}

${deltaTable}

## Backlog disposition

${waveTable}

## Blockers

${blockerList}

## Next round prep

_(populate via human review; auto-detection of next-round items is out of scope this round)_
`;
}
