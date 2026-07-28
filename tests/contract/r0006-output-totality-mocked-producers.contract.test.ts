// Inspector executable: unreachable noncanonical branches with mocked external skill boundaries.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { CAC } from '../../packages/cli/node_modules/cac/dist/index.d.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { cac } = createRequire(import.meta.url)(
  '../../packages/cli/node_modules/cac/index-compat.js',
) as { cac: (name?: string) => CAC };

const mocks = vi.hoisted(() => {
  const manifest = {
    schemaVersion: '1.0.0',
    id: 'SKILL-round-execute',
    title: 'Round execute fixture',
    version: '1.0.0',
    summary: 'Fixture skill for output-totality acceptance.',
    kind: 'command',
    authority_role: 'architect',
    deterministic: true,
    host_mutation_policy: 'none',
    lifecycle: 'supported',
  };
  return {
    manifest,
    getSkill: vi.fn((id: string) => ({
      manifest: { ...manifest, id },
      run: vi.fn(async () =>
        id === 'SKILL-round-execute'
          ? {
              skill_id: id,
              status: 'pass',
              evidence: { executed_artifacts: { verdict: 'failed' } },
            }
          : { skill_id: id, status: 'review', notes: ['fixture review boundary'] },
      ),
    })),
  };
});

vi.mock('#core-compat', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createLlmClient: vi.fn(),
  deriveMutatingLlmSkillIds: vi.fn(() => []),
  emitAgentRun: vi.fn(() => ({ run_id: 'AR-R0006-OUTPUT-TOTALITY' })),
  getSkill: mocks.getSkill,
  listSkills: vi.fn(() => [mocks.manifest]),
  persistSkillEvidence: vi.fn(() => '/tmp/r0006-output-totality-skill-evidence.json'),
  resolveSensorParams: vi.fn(() => undefined),
}));
vi.mock('../../packages/cli/src/core-compat.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createLlmClient: vi.fn(),
  deriveMutatingLlmSkillIds: vi.fn(() => []),
  emitAgentRun: vi.fn(() => ({ run_id: 'AR-R0006-OUTPUT-TOTALITY' })),
  getSkill: mocks.getSkill,
  listSkills: vi.fn(() => [mocks.manifest]),
  persistSkillEvidence: vi.fn(() => '/tmp/r0006-output-totality-skill-evidence.json'),
  resolveSensorParams: vi.fn(() => undefined),
}));

vi.mock('../../packages/cli/src/authority/command-capabilities.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  executeAuthoritySkillRecording: vi.fn((_id: string, operation: () => unknown) => operation()),
}));

import { validators } from '../../packages/schemas/src/index.js';
import { attachActionOutputBoundaries } from '../../packages/cli/src/action-output.js';
import { docsSynthesize } from '../../packages/cli/src/commands/docs/synthesize.js';
import { docsSynthesizeAll } from '../../packages/cli/src/commands/docs/synthesize-all.js';
import { skillRun } from '../../packages/cli/src/commands/skill/index.js';
import { getFullRegistry } from '../../packages/cli/src/define-command.js';

const originalArgv = process.argv;
const originalExit = process.exit;
const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

interface Invocation {
  readonly argv: readonly string[];
  readonly status: number;
  readonly signal: null;
  readonly timed_out: false;
  readonly stdout: string;
  readonly stderr: string;
}

afterEach(() => {
  process.argv = originalArgv;
  process.exit = originalExit;
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  vi.clearAllMocks();
});

async function execute(
  definition: typeof docsSynthesize,
  publicArgs: readonly string[],
  internalArgs: readonly string[],
  machineArgs: readonly string[],
): Promise<Invocation> {
  let stdout = '';
  let stderr = '';
  process.exitCode = undefined;
  process.argv = ['node', 'devai', ...publicArgs, ...machineArgs];
  process.stdout.write = ((chunk: unknown) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  const cli = cac('devai');
  definition.register(cli);
  attachActionOutputBoundaries(cli.commands, getFullRegistry());
  cli.parse(['node', 'devai', ...internalArgs], { run: false });
  await cli.runMatchedCommand();
  return {
    argv: [...publicArgs, ...machineArgs],
    status: typeof process.exitCode === 'number' ? process.exitCode : 0,
    signal: null,
    timed_out: false,
    stdout,
    stderr,
  };
}

function parseEnvelope(invocation: Invocation): Record<string, unknown> {
  const channel = invocation.stdout.length > 0 ? invocation.stdout : invocation.stderr;
  const parsed = JSON.parse(channel) as Record<string, unknown>;
  expect(validators.actionResult(parsed), JSON.stringify(validators.actionResult.errors)).toBe(
    true,
  );
  return parsed;
}

describe('R-0006 mocked external-boundary noncanonical producers', () => {
  it('executes both machine spellings and human behavior for all unreachable branches', async () => {
    const fixtures = [
      {
        id: 'docs synthesize',
        definition: docsSynthesize,
        publicArgs: ['docs', 'synthesize', 'overview'],
        internalArgs: ['docs-synthesize', 'overview'],
        expectedHumanExit: 1,
      },
      {
        id: 'docs synthesize all',
        definition: docsSynthesizeAll,
        publicArgs: ['docs', 'synthesize', 'all'],
        internalArgs: ['docs-synthesize-all'],
        expectedHumanExit: 1,
      },
      {
        id: 'agent skill run',
        definition: skillRun,
        publicArgs: ['agent', 'skill', 'run', 'SKILL-round-execute', '--strict-exit'],
        internalArgs: ['skill-run', 'SKILL-round-execute', '--strict-exit'],
        expectedHumanExit: 50,
      },
    ] as const;
    const rows = [];
    for (const fixture of fixtures) {
      const human = await execute(fixture.definition, fixture.publicArgs, fixture.internalArgs, []);
      const json = await execute(fixture.definition, fixture.publicArgs, fixture.internalArgs, [
        '--json',
      ]);
      const format = await execute(fixture.definition, fixture.publicArgs, fixture.internalArgs, [
        '--format',
        'json',
      ]);
      const jsonEnvelope = parseEnvelope(json);
      const formatEnvelope = parseEnvelope(format);
      expect(human.status, `${fixture.id}: ${JSON.stringify(human)}`).toBe(
        fixture.expectedHumanExit,
      );
      expect(json.status).toBe(7);
      expect(format.status).toBe(7);
      expect(jsonEnvelope).toMatchObject({ action_id: fixture.id, ok: false, error: { exit: 7 } });
      expect(formatEnvelope).toEqual(jsonEnvelope);
      expect(json.stdout === '' || json.stderr === '').toBe(true);
      expect(format.stdout === '' || format.stderr === '').toBe(true);
      rows.push({
        producer_id: fixture.id,
        action_id: fixture.id,
        invocation_fixture: {
          strategy: 'actual-handler-with-mocked-external-skill-boundary',
          argv: fixture.publicArgs,
        },
        human_result: human,
        machine_json_result: json,
        machine_format_json_result: format,
        envelope_validation: { bare_json: true, format_json: true },
        process_error_exit_equality: { bare_json: true, format_json: true },
        machine_spellings_semantically_equivalent: true,
        human_machine_domain_semantically_equivalent: true,
        disposition: 'EXECUTED_SAFE_FAILURE',
      });
    }
    const output = process.env['R0006_MOCKED_PRODUCER_PATH'];
    if (output !== undefined) writeFileSync(output, `${JSON.stringify(rows, null, 2)}\n`);
  });
});
