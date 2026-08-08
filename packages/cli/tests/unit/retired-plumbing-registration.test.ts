// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// Inspector executable: folded and tombstoned implementation modules may remain
// available as source-level plumbing, but the runtime registry must exclude them.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import {
  createAuthorityDecisionIssuer,
  runWithAuthorityHostEffects,
  type AuthorityHostEffectScope,
} from '@devai-nyx/authority';
import type { CAC } from '../../node_modules/cac/dist/index.d.ts';
import { describe, expect, it } from 'vitest';
import * as blueprint from '../../src/commands/blueprint/index.js';
import * as check from '../../src/commands/check/index.js';
import * as ci from '../../src/commands/ci/index.js';
import * as coverage from '../../src/commands/coverage/index.js';
import * as decision from '../../src/commands/decision/index.js';
import * as docs from '../../src/commands/docs/index.js';
import * as evidence from '../../src/commands/evidence/index.js';
import * as govern from '../../src/commands/govern/post-merge-auditor.js';
import * as hooks from '../../src/commands/hooks/index.js';
import * as init from '../../src/commands/init/index.js';
import * as inventory from '../../src/commands/inv/index.js';
import * as llm from '../../src/commands/llm/index.js';
import * as loop from '../../src/commands/loop/index.js';
import * as loopRun from '../../src/commands/loop-run/index.js';
import * as mutation from '../../src/commands/mutation/index.js';
import * as pack from '../../src/commands/pack/index.js';
import * as phase from '../../src/commands/phase/index.js';
import * as phase6 from '../../src/commands/phase6/index.js';
import * as record from '../../src/commands/record/index.js';
import * as release from '../../src/commands/release/index.js';
import * as render from '../../src/commands/render/index.js';
import * as rgr from '../../src/commands/rgr/index.js';
import * as round from '../../src/commands/round/index.js';
import * as rtd from '../../src/commands/rtd/index.js';
import * as sense from '../../src/commands/sense/index.js';
import * as runtimeProbe from '../../src/commands/sense/runtime-probe.js';
import * as skill from '../../src/commands/skill/index.js';
import * as spec from '../../src/commands/spec/index.js';
import * as state from '../../src/commands/state/index.js';
import * as verify from '../../src/commands/verify/index.js';
import * as workSession from '../../src/commands/work/session.js';
import { getFullRegistry } from '../../src/define-command.js';
import { ACTION_REGISTRY } from '../../src/generated/action-registry.js';

const { cac } = createRequire(import.meta.url)('../../node_modules/cac/index-compat.js') as {
  cac: (name?: string) => CAC;
};

const ROOT = resolve(import.meta.dirname, '../../../..');

interface RegisterableDefinition {
  readonly name: string;
  register(cli: CAC): void;
}

const MODULES = [
  blueprint,
  check,
  ci,
  coverage,
  decision,
  docs,
  evidence,
  govern,
  hooks,
  init,
  inventory,
  llm,
  loop,
  loopRun,
  mutation,
  pack,
  phase,
  phase6,
  record,
  release,
  render,
  rgr,
  round,
  rtd,
  sense,
  runtimeProbe,
  skill,
  spec,
  state,
  verify,
  workSession,
] as const;

function isDefinition(value: unknown): value is RegisterableDefinition {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Partial<RegisterableDefinition>).name === 'string' &&
    typeof (value as Partial<RegisterableDefinition>).register === 'function'
  );
}

function definitions(): readonly RegisterableDefinition[] {
  return [...new Set(MODULES.flatMap((module) => Object.values(module)))]
    .filter(isDefinition)
    .sort((left, right) => left.name.localeCompare(right.name));
}

const READ_FIXTURES: ReadonlyArray<
  readonly [binding: string, args: readonly string[], expectedExit: number]
> = [
  ['agent prompt compose', [], 2],
  ['agent prompt diff', [], 2],
  ['agent prompt freeze', [], 2],
  ['agent skill list', [], 0],
  ['evidence chain verify', [], 2],
  ['evidence local verify', [], 0],
  ['govern phase ledger', [], 0],
  ['govern rgr list', [], 0],
  ['govern rgr show', [], 2],
  ['govern score assess', [], 2],
  ['govern score view', [], 2],
  ['govern triage classify', [], 2],
  ['govern triage dispatch', [], 2],
  ['govern triage tie break', [], 2],
  ['inventory adherence', [], 0],
  ['inventory components', [], 0],
  ['inventory contracts', [], 2],
  ['inventory coverage', [], 0],
  ['inventory dependencies', [], 0],
  ['inventory glossary', [], 0],
  ['inventory modules', ['--repo-root', ROOT], 0],
  ['inventory routes', ['--repo-root', ROOT], 0],
  ['inventory schemas', ['--repo-root', ROOT], 0],
  ['inventory tests', ['--repo-root', ROOT], 0],
  ['policy check adrs', ['--repo-root', ROOT], 0],
  ['policy check ci economy', [], 2],
  ['policy check docs governance', [], 2],
  ['policy check forbidden actions', [], 0],
  ['policy check glob guards', ['--repo-root', ROOT], 0],
  ['policy check overrides', [], 0],
  ['policy check pr compliance', [], 2],
  ['policy check prompt overlays', [], 0],
  ['policy check schemas', ['--repo-root', ROOT], 0],
  ['policy check sensor integrity', [], 0],
  ['round status', [], 2],
  ['sense docs drift', ['--repo-root', ROOT], 0],
  ['sense inventory api', [], 0],
  ['sense inventory data model', [], 0],
  ['sense inventory performance', [], 0],
  ['sense inventory rbac', [], 0],
  ['sense lint', [], 0],
  ['sense site drift', ['--repo-root', ROOT], 0],
  ['sense spec idiomaticity', [], 3],
  ['sense test', [], 2],
  ['sense trace resolve', [], 0],
  ['sense type check', [], 0],
  ['spec blueprint diff', [], 2],
  ['spec blueprint plan', [], 2],
  ['spec blueprint validate', [], 2],
  ['spec validate action coverage', [], 2],
  ['spec validate all', [], 2],
  ['spec validate glossary', [], 2],
  ['spec validate invariant strategies', [], 0],
  ['spec validate invariants', [], 2],
  ['spec validate journeys', [], 2],
  ['spec validate schema', [], 2],
  ['spec validate test trace', [], 2],
  ['spec validate trace', [], 2],
  ['verify translation', ['--witness', 'scratch/missing-witness.json', '--repo-root', ROOT], 2],
  ['work backlog list', ['--repo-root', ROOT], 0],
  ['work backlog next', [], 0],
  ['work db status', [], 2],
  ['work lock list', ['--repo-root', ROOT], 0],
  ['work task list', ['--repo-root', ROOT], 0],
  ['work worktree list', ['--repo-root', ROOT], 0],
] as const;

describe('retired implementation registration boundary', () => {
  it('keeps every imported historical definition loadable but outside the live registry', () => {
    const imported = definitions();
    const names = imported.map((definition) => definition.name);
    const historical = imported.filter(
      (definition) =>
        !ACTION_REGISTRY.some(
          (entry) => entry.internal_binding === definition.name && entry.disposition === 'keep',
        ),
    );

    expect(imported.length).toBeGreaterThan(100);
    expect(new Set(names).size).toBe(names.length);
    expect(historical.length).toBeGreaterThan(90);

    const cli = cac('devai-retired-registration-contract');
    for (const definition of imported) definition.register(cli);

    const live = getFullRegistry();
    const liveNames = new Set(live.map((entry) => entry.previous_name));
    expect(live.every((entry) => entry.disposition === 'keep')).toBe(true);
    expect(historical.filter((definition) => liveNames.has(definition.name))).toEqual([]);
  });

  it('executes retained read-only implementation seams only through the test-local registry', async () => {
    const imported = definitions();
    const byName = new Map(imported.map((definition) => [definition.name, definition] as const));
    const fixtureBindings = READ_FIXTURES.map(([actionId, args, expectedExit]) => {
      const entry = ACTION_REGISTRY.find(
        (candidate) => (candidate.action_id as string) === actionId,
      );
      return {
        actionId,
        args,
        expectedExit,
        binding: entry?.internal_binding,
      };
    });
    const missing = fixtureBindings
      .filter(({ binding }) => binding === undefined || !byName.has(binding))
      .map(({ actionId }) => actionId);
    expect(missing).toEqual([]);

    const cli = cac('devai-retired-read-contract');
    for (const definition of imported) definition.register(cli);
    let ordinal = 0;
    const issuer = createAuthorityDecisionIssuer({
      issuer_id: 'retired-read-contract',
      issuer_version: '1.0.0',
      invocation_id: 'retired-read-contract-invocation',
      canonicalSha256: () => 'a'.repeat(64),
      randomId: () => `retired-read-${String(++ordinal)}`,
      now: () => '2026-08-07T00:00:00.000Z',
      receipt_ttl_ms: 30_000,
    });
    const scope: AuthorityHostEffectScope = {
      action_id: 'retired read contract',
      invocation_id: 'retired-read-contract-invocation',
      effect: 'read',
      receipt_store: issuer,
      apply_effect: (_request, apply) => apply(),
    };

    const originalArgv = process.argv;
    const originalExit = process.exit;
    const originalExitCode = process.exitCode;
    const originalStdout = process.stdout.write;
    const originalStderr = process.stderr.write;
    try {
      for (const { actionId, binding, args, expectedExit } of fixtureBindings) {
        if (binding === undefined) throw new Error(`missing registry binding for ${actionId}`);
        let stdout = '';
        let stderr = '';
        process.argv = ['node', 'devai', binding.replaceAll(' ', '-'), ...args];
        process.exitCode = undefined;
        process.stdout.write = ((chunk: unknown) => {
          stdout += String(chunk);
          return true;
        }) as typeof process.stdout.write;
        process.stderr.write = ((chunk: unknown) => {
          stderr += String(chunk);
          return true;
        }) as typeof process.stderr.write;
        process.exit = ((code?: string | number | null) => {
          process.exitCode = typeof code === 'number' ? code : 0;
          throw new Error(`TEST_PROCESS_EXIT:${String(process.exitCode)}`);
        }) as typeof process.exit;

        cli.parse(process.argv, { run: false });
        try {
          await runWithAuthorityHostEffects(scope, () => cli.runMatchedCommand());
        } catch (error) {
          if (error instanceof Error && error.name === 'CACError') {
            process.exitCode = 2;
            stderr = error.message;
          } else if (!(error instanceof Error) || !error.message.startsWith('TEST_PROCESS_EXIT:')) {
            throw error;
          }
        }
        await new Promise<void>((done) => setImmediate(done));
        const exit = typeof process.exitCode === 'number' ? process.exitCode : 0;
        expect(exit, `${actionId}: stdout=${stdout} stderr=${stderr}`).toBe(expectedExit);
        expect(stdout.length + stderr.length, `${actionId}: silent execution`).toBeGreaterThan(0);
      }
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      process.exitCode = originalExitCode;
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
      issuer.dispose();
    }
  }, 120_000);
});
