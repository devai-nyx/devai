// R20.W1 matrix row 4 — THE prompt parity authority. Every one of the 52
// skills runs against its fixture with the recording client; outbound LLM
// payloads are captured byte-for-byte modulo the documented masks (fixture
// path → <FIXTURE>, ISO timestamps → <TS>, long hex → <HEX>), and every
// skill is classified prompt-bearing or non-prompt-bearing. At capture the
// battery runs TWICE; a cross-run delta on any skill fails capture loudly
// (recorded volatility must be explained, never normalized away post hoc).
import { aroundEach, describe, expect, it } from 'vitest';
import { withAuthorityHostTestScope } from '../unit/authority-host-test-scope.js';
import { baseline, canonical, CAPTURE } from './r20-harness.js';
import {
  assertRosterComplete,
  loadSpecs,
  runOne,
  type SkillRunCapture,
} from './r20-skill-runner.js';

aroundEach((runTest) => withAuthorityHostTestScope(runTest));

describe('R20 baseline: rendered outbound-payload corpus (52/52)', () => {
  it('payload sequences and classification match the baseline for every skill', async () => {
    const specs = loadSpecs();
    assertRosterComplete(specs);

    const captures = new Map<string, SkillRunCapture>();
    for (const spec of specs) {
      captures.set(spec.skill_id, await runOne(spec));
    }
    if (CAPTURE) {
      // Determinism double-run: re-execute everything and require equality.
      for (const spec of specs) {
        const again = await runOne(spec);
        const a = canonical({
          calls: captures.get(spec.skill_id)?.calls,
          cls: captures.get(spec.skill_id)?.classification,
        });
        const b = canonical({ calls: again.calls, cls: again.classification });
        expect(
          b,
          `${spec.skill_id}: rendered payloads must be deterministic across identical runs`,
        ).toBe(a);
      }
    }

    const bearing = [...captures.values()]
      .filter((c) => c.classification === 'prompt-bearing')
      .map((c) => c.skill_id)
      .sort();
    const nonBearing = [...captures.values()]
      .filter((c) => c.classification === 'non-prompt-bearing')
      .map((c) => c.skill_id)
      .sort();
    expect(bearing.length + nonBearing.length).toBe(52);

    const table = canonical({ prompt_bearing: bearing, non_prompt_bearing: nonBearing });
    expect(table).toBe(baseline('rendered-prompts/classification.json', table).expected);

    for (const [id, cap] of [...captures.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const body = canonical({
        skill_id: id,
        classification: cap.classification,
        calls: cap.calls,
      });
      const { expected } = baseline(`rendered-prompts/${id}.json`, body);
      expect(body, `${id}: outbound payload parity`).toBe(expected);
    }
  }, 600_000);
});

// Invariants: INV-DEVAI-001, INV-DEVAI-008
