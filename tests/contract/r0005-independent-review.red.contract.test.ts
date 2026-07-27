// Invariants: INV-DEVAI-001, INV-DEVAI-005, INV-DEVAI-017, INV-DEVAI-018, INV-DEVAI-020
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as publicEvidence from '../../packages/evidence/src/index.js';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

describe('R-0005 independent-review red contracts', () => {
  it('KR-R5-017 binds the reusable evidence workflow to an active ADR', () => {
    const activeAffectedRules = readdirSync(join(ROOT, 'law/adr'))
      .filter((name) => /^ADR-[0-9]{3}-.+\.md$/u.test(name))
      .map((name) => read(`law/adr/${name}`))
      .filter((source) => /^status: active$/mu.test(source))
      .flatMap(
        (source) =>
          source
            .match(/^affected_rules:\n((?: {2}- .+\n?)+)/mu)?.[1]
            ?.split('\n')
            .map((line) => line.replace(/^ {2}- /u, ''))
            .filter(Boolean) ?? [],
      );
    expect(activeAffectedRules).toContain('.github/workflows/reusable-evidence-gate.yml');
  });

  it('KR-R5-018 tests child authority through a coverage-safe pure helper', () => {
    const test = read('packages/cli/tests/unit/sense-run-readiness.test.ts');
    expect(test).toContain("from '../../src/authority/sense-run-child.js'");
    expect(test).not.toContain("from '../../src/authority/broker.js'");
  });

  it('KR-R5-022 leaves the legacy aggregate chain read-only in production', () => {
    const writers = [
      'packages/evidence/src/evidence/verb-evidence.ts',
      'packages/cli/src/commands/evidence/emit.ts',
      'packages/cli/src/commands/evidence/redact.ts',
      'packages/cli/src/commands/record/run.ts',
      'packages/cli/src/commands/sense/readings-record.ts',
    ].map(read);
    for (const source of writers) {
      expect(source).not.toMatch(/\b(?:appendRecord|redactRecord|initChain)\s*\(/u);
    }
  });

  it('KR-R5-035 excludes legacy aggregate-chain writers from the public package API', () => {
    for (const writer of ['initChain', 'saveChain', 'appendRecord', 'redactRecord']) {
      expect(Object.hasOwn(publicEvidence, writer), writer).toBe(false);
    }
  });

  it('KR-R5-023 removes the blanket deterministic Architect prompt exemption', () => {
    const source = read('packages/skills/src/prompt-firewall/index.ts');
    expect(source).not.toContain('architectBoundDeterministicSkill');
  });

  it('KR-R5-024 persists attributable post-merge products in the Auditor tree', () => {
    const source = read('packages/skills/src/post-merge-auditor/index.ts');
    expect(source).toContain("join(worktreeRoot, 'work/audit/post-merge')");
    expect(source).toContain("['commit', '-m', `audit(post-merge): observe ${mergeSha}`]");
  });

  it('KR-R5-025 requires exact governed sequencing bindings and red evidence', () => {
    const policy = JSON.parse(read('law/policy/governed-sequencing.json')) as {
      bindings?: unknown[];
    };
    const checker = read('scripts/check-governed-sequencing.mjs');
    expect(policy.bindings).toBeInstanceOf(Array);
    expect(policy.bindings?.length).toBeGreaterThan(0);
    expect(checker).toContain('implementation_commits');
    expect(checker).toContain('law_commits');
    expect(checker).toContain('red_evidence');
  });

  it('KR-R5-026 delegates conditional-skip discovery to an AST detector', () => {
    expect(existsSync(join(ROOT, 'scripts/detect-conditional-skips.mjs'))).toBe(true);
    expect(read('tests/contract/r0004-governed-surface.red.contract.test.ts')).toContain(
      'detect-conditional-skips.mjs',
    );
  });

  it('KR-R5-039 documents the canonical governed round lifecycle', () => {
    const guide = read('docs/adopters/governed-rounds.md');
    expect(guide).toContain('work/rounds/R-NNNN/');
    expect(guide).toContain('.devai/state/round-runs/R-NNNN/');
    expect(guide).toContain('work/audit/R-NNNN/');
    expect(guide).toContain('closes in place');
    expect(guide).not.toContain('docs/work/round-N/');
    expect(guide).not.toContain('docs/meta/rounds/round-N/');
    expect(guide).not.toContain('moves the complete local dossier');

    for (const path of [
      'docs/adopters/CONVENTIONS.md',
      'docs/adopters/build-plan-convention.md',
      'docs/adopters/round-break.md',
      'docs/dev/process.md',
      'docs/dev/round-workflow/B0-audit.md',
      'docs/dev/round-workflow/B3-orchestrate.md',
      'docs/dev/round-workflow/B4-verify-publish.md',
      'docs/roles/auditor.md',
    ]) {
      const source = read(path);
      expect(source, path).not.toMatch(
        /docs\/work\/round-|docs\/meta\/rounds\/round-|scratch\/sessions\/rounds\/round-|Plan\.md/u,
      );
    }
  });
});
