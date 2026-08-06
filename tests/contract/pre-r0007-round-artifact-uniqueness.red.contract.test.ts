// Invariants: INV-DEVAI-002, INV-DEVAI-003, INV-DEVAI-017, INV-DEVAI-020
//
// Prospective red for DII-254. OM-019 requires one fail-closed selector for every
// runtime-discoverable governed-round artifact. The Architect policy exists, but entry
// preparation is not complete until CI and doctor execute the selector and every declared
// ambiguity class is executable.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const GATE = join(ROOT, 'scripts/check-round-artifact-uniqueness.mjs');
const roots: string[] = [];

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function write(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function binding(mandate = 'OM-900', round = 'R-9000', model = 'review-model'): string {
  return `---\nid: ${mandate}\nstatus: active\n---\n\n\`\`\`json\n${JSON.stringify(
    {
      schemaVersion: '2.0.0',
      devai_reviewer_binding: true,
      mandate_id: mandate,
      mandate_status: 'active',
      round,
      model_selector: model,
      role: 'independent-read-only',
      semantic_census: 'complete',
      substantive_cycles: 2,
      transport_retries: 1,
      fallback: 'forbidden',
    },
    null,
    2,
  )}\n\`\`\`\n`;
}

function profile(round = 'R-9000', mandate = 'OM-900', model = 'review-model'): string {
  return `${JSON.stringify(
    {
      schemaVersion: '2.0.0',
      round,
      phase: 'pre-entry-preparation',
      sources: {
        authorization: `work/rounds/${round}/AUTHORIZATION.md`,
        plan: `work/rounds/${round}/plan.md`,
      },
      runtime: { state_root: `.devai/state/round-runs/${round}/close` },
      reviewer: {
        binding: 'owner-mandate-required',
        mandate_id: mandate,
        model_selector: model,
        role: 'independent-read-only',
        fallback: 'forbidden',
      },
    },
    null,
    2,
  )}\n`;
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'devai-round-artifact-uniqueness-'));
  roots.push(root);
  write(
    root,
    'law/policy/round-artifact-uniqueness.json',
    `${JSON.stringify(
      {
        schemaVersion: '1.0.0',
        policy_id: 'round-artifact-uniqueness',
        decision_id: 'DII-900',
        round_pattern: '^R-[0-9]{4}$',
        canonical_root: 'work/rounds',
        non_runtime_roots: ['work/rounds/proposals', 'work/drafts/rounds'],
        rounds: [
          {
            round: 'R-9000',
            state: 'pre-entry-preparation',
            canonical_dir: 'work/rounds/R-9000',
            requirements: {
              plan: true,
              authorization: true,
              profile: true,
              reviewer: true,
              runtime_root: true,
            },
          },
          {
            round: 'R-9001',
            state: 'dormant',
            canonical_dir: 'work/rounds/R-9001',
            requirements: {
              plan: true,
              authorization: true,
              profile: false,
              reviewer: false,
              runtime_root: false,
            },
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  for (const round of ['R-9000', 'R-9001']) {
    write(root, `work/rounds/${round}/plan.md`, `# ${round} plan\n`);
    write(root, `work/rounds/${round}/AUTHORIZATION.md`, `# ${round} authorization\n`);
  }
  write(root, 'work/rounds/R-9000/close-control-profile.json', profile());
  write(root, 'product/owner-mandates/OM-900.md', binding());
  return root;
}

function policy(root: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(root, 'law/policy/round-artifact-uniqueness.json'), 'utf8'),
  ) as Record<string, unknown>;
}

function writePolicy(root: string, document: Record<string, unknown>): void {
  write(
    root,
    'law/policy/round-artifact-uniqueness.json',
    `${JSON.stringify(document, null, 2)}\n`,
  );
}

function run(root: string): { status: number; output: string } {
  const result = spawnSync(process.execPath, [GATE, '--repo-root', root, '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

function expectFailure(root: string, ...needles: readonly string[]): void {
  const result = run(root);
  expect(result.status, result.output).not.toBe(0);
  for (const needle of needles) expect(result.output).toContain(needle);
}

describe('DII-254 governed round artifact uniqueness', () => {
  it('wires the gate into governance and DEVAI-self doctor', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const doctor = readFileSync(join(ROOT, 'packages/cli/src/commands/doctor.ts'), 'utf8');
    expect(manifest.scripts['ci:governance']).toContain('check-round-artifact-uniqueness.mjs');
    expect(doctor).toContain('round-artifact-uniqueness');
  });

  it('accepts the complete canonical fixture and current repository', () => {
    expect(run(fixture()).status).toBe(0);
    expect(run(ROOT).status).toBe(0);
  });

  it('rejects duplicate round identities and canonical directories with the conflict population', () => {
    const root = fixture();
    const document = policy(root) as { rounds: Array<Record<string, unknown>> };
    document.rounds.push({ ...document.rounds[0] });
    writePolicy(root, document);
    expectFailure(root, 'R-9000', 'round', 'duplicate');

    const root2 = fixture();
    const document2 = policy(root2) as { rounds: Array<Record<string, unknown>> };
    document2.rounds[1] = { ...document2.rounds[1], canonical_dir: 'work/rounds/R-9000' };
    writePolicy(root2, document2);
    expectFailure(root2, 'canonical_dir', 'R-9000', 'R-9001');
  });

  it('rejects missing required artifacts and forbidden dormant artifacts', () => {
    const root = fixture();
    rmSync(join(root, 'work/rounds/R-9000/plan.md'));
    expectFailure(root, 'R-9000', 'plan', 'missing');

    const root2 = fixture();
    write(root2, 'work/rounds/R-9001/close-control-profile.json', profile('R-9001'));
    expectFailure(root2, 'R-9001', 'profile', 'forbidden');
  });

  it('rejects cross-round profile identity and canonical source mismatches', () => {
    const root = fixture();
    write(root, 'work/rounds/R-9000/close-control-profile.json', profile('R-9001'));
    expectFailure(root, 'R-9000', 'profile', 'R-9001');

    const root2 = fixture();
    const document = JSON.parse(
      readFileSync(join(root2, 'work/rounds/R-9000/close-control-profile.json'), 'utf8'),
    ) as { sources: { plan: string } };
    document.sources.plan = 'work/rounds/R-9001/plan.md';
    write(
      root2,
      'work/rounds/R-9000/close-control-profile.json',
      `${JSON.stringify(document, null, 2)}\n`,
    );
    expectFailure(root2, 'R-9000', 'plan', 'work/rounds/R-9001/plan.md');
  });

  it('rejects path escapes and shared runtime roots', () => {
    const root = fixture();
    const document = JSON.parse(
      readFileSync(join(root, 'work/rounds/R-9000/close-control-profile.json'), 'utf8'),
    ) as { runtime: { state_root: string } };
    document.runtime.state_root = '../outside';
    write(
      root,
      'work/rounds/R-9000/close-control-profile.json',
      `${JSON.stringify(document, null, 2)}\n`,
    );
    expectFailure(root, 'R-9000', 'runtime_root', 'outside');

    const root2 = fixture();
    const p = policy(root2) as { rounds: Array<{ requirements: Record<string, boolean> }> };
    const dormant = p.rounds[1];
    if (dormant === undefined) throw new Error('fixture omitted R-9001');
    dormant.requirements.profile = true;
    dormant.requirements.reviewer = true;
    dormant.requirements.runtime_root = true;
    writePolicy(root2, p);
    write(
      root2,
      'work/rounds/R-9001/close-control-profile.json',
      profile('R-9001', 'OM-901', 'other-model').replace(
        '.devai/state/round-runs/R-9001/close',
        '.devai/state/round-runs/R-9000/close',
      ),
    );
    write(root2, 'product/owner-mandates/OM-901.md', binding('OM-901', 'R-9001', 'other-model'));
    expectFailure(root2, 'runtime_root', 'R-9000', 'R-9001');
  });

  it('rejects missing, competing, and mismatched reviewer bindings', () => {
    const root = fixture();
    rmSync(join(root, 'product/owner-mandates/OM-900.md'));
    expectFailure(root, 'R-9000', 'reviewer', 'OM-900');

    const root2 = fixture();
    write(root2, 'product/owner-mandates/OM-901.md', binding('OM-901'));
    expectFailure(root2, 'R-9000', 'reviewer', 'OM-900', 'OM-901');

    const root3 = fixture();
    write(root3, 'product/owner-mandates/OM-900.md', binding('OM-900', 'R-9000', 'wrong-model'));
    expectFailure(root3, 'R-9000', 'reviewer', 'review-model', 'wrong-model');
  });

  it('rejects runtime artifacts in proposal roots, including untracked bytes', () => {
    const root = fixture();
    write(root, 'work/rounds/proposals/draft/close-control-profile.json', profile('R-9000'));
    expectFailure(root, 'proposal', 'work/rounds/proposals/draft/close-control-profile.json');
  });
});
