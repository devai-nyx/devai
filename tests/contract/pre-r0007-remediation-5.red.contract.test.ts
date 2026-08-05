// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
//
// Prospective red for R7-F012 (UNDECLARED_STATE_MACHINE_CONTROL_SELECTOR), recorded under
// DII-253 and origin evidence work/audit/R-0007-pre-entry/remediation-4-readiness-pre-check.md.
//
// The exact implementation surfaces these contracts may be repaired on are enumerated in
// tests/contract/pre-r0007-remediation-5.implementation-paths.json. An Engineer diff touching
// any path outside that manifest stops the repair before implementation.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  STATE as HARNESS_STATE,
  SCRIPT,
  disposeHarness,
  fixture as harnessFixture,
  freeze as harnessFreeze,
  readJson as harnessReadJson,
  putJson as harnessPutJson,
  run as harnessRun,
  codes as harnessCodes,
  commit as harnessCommit,
  git as harnessGit,
} from './helpers/r0007-review-harness.js';

vi.setConfig({ testTimeout: 300_000 });

const STATE_PATH = `${HARNESS_STATE}/review-state.json`;
const POLICY_PATH = 'law/policy/round-close-controls.json';
const MIRROR_PATH = '.devai/config/round-close-controls.json';
const SHA256 = /^[a-f0-9]{64}$/u;

interface Transition {
  from: string;
  to: string;
  cycle: number;
  previous_state_digest: string | null;
}

function retainedPath(root: string, digest: string): string {
  return join(root, HARNESS_STATE, 'review-states', `${digest}.json`);
}

function scopeOnce(current: { root: string; base: string }) {
  const frozen = harnessFreeze(current as never);
  const scoped = harnessRun(current as never, 'review-scope', [
    '--base',
    current.base,
    '--candidate',
    frozen.candidate,
  ]);
  return { frozen, scoped };
}

afterAll(() => {
  disposeHarness();
});

describe('R7-F012 undeclared state-machine control selector', () => {
  it('R7-022-EVERY-EDGE-PERSISTS-PREDECESSOR binds a retained artifact on every non-initial edge', () => {
    const current = harnessFixture(true);
    const { scoped } = scopeOnce(current);
    expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);

    const state = harnessReadJson(current.root, STATE_PATH);
    const history = state.transition_history as Transition[];
    expect(history.length, 'review-scope must emit more than the initial edge').toBeGreaterThan(1);

    // The sole legitimate null predecessor is the DRAFT origin. DRAFT is the machine's
    // initial state rather than a state that was passed through, so no predecessor artifact
    // exists to authenticate. Every other edge names a state the machine actually occupied,
    // and OM-017 requires that state to be a complete persisted artifact.
    expect(history[0]?.from, 'the first edge must originate at DRAFT').toBe('DRAFT');
    expect(history[0]?.previous_state_digest).toBeNull();

    const unpersisted: string[] = [];
    for (const [index, entry] of history.entries()) {
      if (index === 0) continue;
      const digest = entry.previous_state_digest;
      if (typeof digest !== 'string' || !SHA256.test(digest)) {
        unpersisted.push(`${entry.from}->${entry.to}: predecessor identity is null`);
        continue;
      }
      if (!existsSync(retainedPath(current.root, digest)))
        unpersisted.push(`${entry.from}->${entry.to}: no retained predecessor artifact`);
    }
    expect(
      unpersisted,
      `edges accepted without a persisted predecessor: ${unpersisted.join(', ')}`,
    ).toEqual([]);
  });

  it('R7-022-EVERY-EDGE-PREDECESSOR-MUTATION-BLOCKS fails on one mutated byte of any predecessor', () => {
    const current = harnessFixture(true);
    const { frozen, scoped } = scopeOnce(current);
    expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);

    const state = harnessReadJson(current.root, STATE_PATH);
    const history = state.transition_history as Transition[];
    const digests = history
      .slice(1)
      .map(({ previous_state_digest: digest }) => digest)
      .filter((digest): digest is string => typeof digest === 'string' && SHA256.test(digest));
    expect(
      digests.length,
      'every non-initial edge must contribute a retained predecessor to mutate',
    ).toBe(history.length - 1);

    // A digest-only substitution would not prove the artifact is authenticated, so each
    // retained predecessor is mutated in place and then restored.
    const undetected: string[] = [];
    for (const digest of digests) {
      const path = retainedPath(current.root, digest);
      const original = readFileSync(path, 'utf8');
      const mutated = JSON.parse(original) as Record<string, unknown>;
      mutated.round = `${String(mutated.round)}-mutated`;
      harnessPutJson(current.root, `${HARNESS_STATE}/review-states/${digest}.json`, mutated);
      const outcome = harnessRun(current, 'review-check', ['--candidate', frozen.candidate]);
      const observed = harnessCodes(outcome);
      // Two codes express the same failure at different depths, and which one fires depends
      // only on how far back the mutated artifact sits. REVIEW_STATE_PREDECESSOR_INVALID is
      // the top-level chain check on the state's own previous_state_digest;
      // REVIEW_STATE_PREDECESSOR_STATE_INVALID is the per-transition corroboration. Either
      // is a blocking predecessor-authentication failure, and the run must not survive.
      const blocked =
        outcome.status !== 0 &&
        (observed.includes('REVIEW_STATE_PREDECESSOR_STATE_INVALID') ||
          observed.includes('REVIEW_STATE_PREDECESSOR_INVALID'));
      if (!blocked) undetected.push(`${digest} -> [${observed.join(', ')}]`);
      harnessPutJson(
        current.root,
        `${HARNESS_STATE}/review-states/${digest}.json`,
        JSON.parse(original) as Record<string, unknown>,
      );
    }
    expect(undetected, `mutated predecessors accepted: ${undetected.join(', ')}`).toEqual([]);
  });

  it('R7-022-POLICY-DRIVEN-BOTH-DIRECTIONS follows the declaration when it shrinks and when it grows', () => {
    // A controller that keeps its literals and intersects them with policy passes a
    // removal-only test. Both directions are required: the emitted population must shrink
    // when the declaration shrinks and return when the declaration returns.
    const declared = (
      harnessReadJson(harnessFixture(true).root, POLICY_PATH) as {
        review_state_machine: {
          emitted_transition_sequences: Record<string, Array<[string, string]>>;
        };
      }
    ).review_state_machine.emitted_transition_sequences['cycle-1'];
    // A matcher does not narrow the type, and an absent declaration would otherwise surface
    // three compiler errors instead of one legible contract failure.
    if (declared === undefined) throw new Error('policy must declare the cycle-1 emitted sequence');
    expect(declared.length).toBe(3);

    // Each direction observes a fresh fixture. Reusing one would leave a review state
    // anchored to the previous policy digest, so the second observation would fail on
    // REVIEW_STATE_IDENTITY_INVALID rather than on the sequence it is meant to measure.
    const observe = (sequence: Array<[string, string]>, label: string): Array<[string, string]> => {
      const current = harnessFixture(true);
      const next = harnessReadJson(current.root, POLICY_PATH) as {
        review_state_machine: {
          emitted_transition_sequences: Record<string, Array<[string, string]>>;
        };
      };
      next.review_state_machine.emitted_transition_sequences['cycle-1'] = sequence;
      harnessPutJson(current.root, POLICY_PATH, next);
      harnessPutJson(current.root, MIRROR_PATH, next);
      // The restored direction reproduces the fixture's own declaration byte for byte, so
      // there is nothing to commit. Committing unconditionally would fail on an empty diff
      // and hide the observation behind a fixture error.
      if (harnessGit(current.root, ['status', '--porcelain']) !== '')
        harnessCommit(current.root, `declare cycle-1 as ${label}`);
      const { scoped } = scopeOnce(current);
      expect(scoped.status, JSON.stringify(scoped.value, null, 2)).toBe(0);
      const state = harnessReadJson(current.root, STATE_PATH);
      return (state.transition_history as Transition[]).map(({ from, to }) => [from, to]);
    };

    const shortened = declared.slice(0, 2);
    expect(
      observe(shortened, 'two edges'),
      'the emitted sequence must follow a shrunk declaration',
    ).toEqual(shortened);
    expect(
      observe(declared, 'three edges'),
      'the emitted sequence must follow a restored declaration',
    ).toEqual(declared);
  });

  it('R7-022-POLICY-SCHEMA-FAIL-CLOSED rejects a policy document that violates its own schema', () => {
    const current = harnessFixture(true);
    const policy = harnessReadJson(current.root, POLICY_PATH) as {
      review_state_machine: Record<string, unknown>;
    };
    delete policy.review_state_machine.initial_state;
    harnessPutJson(current.root, POLICY_PATH, policy);
    // Refresh the machine materialization in the same edit. Without it the run stops at
    // POLICY_MIRROR_DRIFT and never reaches schema validation, which would make this
    // contract pass on a neighbouring check rather than the one it names.
    harnessPutJson(current.root, MIRROR_PATH, policy);
    harnessCommit(current.root, 'remove a required policy declaration');
    // Resolve the candidate directly rather than through freeze: convergence itself now
    // refuses the invalid policy, and a helper failing first would hide the finding this
    // contract exists to observe.
    const candidate = harnessGit(current.root, ['rev-parse', 'HEAD']);
    const outcome = harnessRun(current, 'policy-check', ['--candidate', candidate]);
    expect(outcome.status, JSON.stringify(outcome.value, null, 2)).not.toBe(0);
    expect(harnessCodes(outcome)).toContain('POLICY_DOCUMENT_INVALID');
  });

  it('R7-022-NO-STATE-MACHINE-LITERAL leaves no edge-pair literal in the controller', () => {
    // Supplementary to the behavioural proof above, not a substitute for it: a source scan
    // cannot show that policy is consulted, only that the duplicate encoding is gone. Edge
    // pairs are asserted rather than bare state names because state vocabulary legitimately
    // appears in unrelated positions such as gate status values.
    const source = readFileSync(SCRIPT, 'utf8');
    const pairs = source.match(/['"`][A-Z][A-Z0-9_]*->[A-Z][A-Z0-9_]*['"`]/gu) ?? [];
    expect(
      [...new Set(pairs)].sort(),
      'state-machine edges must be read from law, never duplicated as controller literals',
    ).toEqual([]);
  });
});
