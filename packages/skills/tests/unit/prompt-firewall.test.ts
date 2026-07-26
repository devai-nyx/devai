import { describe, expect, it } from 'vitest';
import { checkPromptOverlays } from '../../src/prompt-firewall/index.js';

/**
 * Unit tests for the prompt-overlay authority firewall (Phase 12.B,
 * D-42). Validators are shape-checked here; the CLI integration test
 * (packages/cli/test/check.integration.test.ts) covers the
 * end-to-end `devai policy check prompt overlays` flow.
 */

describe('checkPromptOverlays', () => {
  it('passes when all manifests have sane scopes', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-clean',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          host_mutation_policy: 'write_requires_flag',
          allowed_write_scopes: ['packages/core/src/**'],
        },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it('flags coding-agent/write naming docs/arch as critical', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-bad',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/framework/arch/**'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(v.findings[0]?.code).toBe('PROMPT_OVERLAY_AUTHORITY_INVERSION');
    expect(v.findings[0]?.severity).toBe('critical');
    expect(v.findings[0]?.reserved_to).toBe('architect');
  });

  it('flags coding-agent/write naming docs/schemas as critical', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-schema-touch',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/framework/schemas/foo.schema.json'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(v.findings[0]?.code).toBe('PROMPT_OVERLAY_AUTHORITY_INVERSION');
  });

  it('flags coding-agent/write naming law/constitution.md as critical', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-constitution-edit',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['law/constitution.md'],
        },
      ],
    });
    expect(v.findings.some((f) => f.reserved_to === 'architect')).toBe(true);
  });

  it('flags write tier naming product/ as Owner-inverted', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-product-touch',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['product/**'],
        },
      ],
    });
    expect(v.findings[0]?.reserved_to).toBe('owner');
  });

  it('exempts review-agent /draft/ subpaths under reserved roots', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-elicit-like',
          agent_class: 'review-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/framework/arch/draft/**', 'docs/framework/product/draft/**'],
        },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it('does NOT exempt /draft/ for coding-agent (only review-agent)', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-coding-draft',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/framework/arch/draft/**'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(v.findings[0]?.code).toBe('PROMPT_OVERLAY_AUTHORITY_INVERSION');
  });

  it('KR-R5-036 rejects Architect lifecycle writers outside the bounded exceptions', () => {
    const exact = {
      id: 'SKILL-round-scaffold',
      authority_role: 'architect',
      agent_class: 'coding-agent',
      permission_tier: 'write',
      host_mutation_policy: 'write_requires_flag',
      deterministic: true,
      llm_backed: false,
    } as const;
    for (const manifest of [
      { ...exact, allowed_write_scopes: ['work/rounds/R-*/**'] },
      {
        ...exact,
        id: 'SKILL-round-archive',
        allowed_write_scopes: ['work/rounds/archive/**'],
      },
      { ...exact, id: 'SKILL-adr-new', allowed_write_scopes: ['law/adr/D-*.md'] },
      {
        ...exact,
        id: 'SKILL-round-backlog',
        allowed_write_scopes: ['work/rounds/R-*/**'],
      },
    ]) {
      const verdict = checkPromptOverlays({ manifests: [manifest] });
      expect(verdict.ok, manifest.id).toBe(false);
      expect(verdict.findings[0]?.code).toBe('PROMPT_OVERLAY_AUTHORITY_INVERSION');
    }
  });

  it('flags read tier with host_mutation scopes', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-readonly-but-write',
          agent_class: 'review-agent',
          permission_tier: 'read',
          allowed_write_scopes: ['packages/core/src/**'],
        },
      ],
    });
    expect(v.findings[0]?.code).toBe('READ_TIER_WITH_WRITE_SCOPES');
  });

  it('exempts read tier emitting evidence-only (.devai/state/**)', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-evidence-emitter',
          agent_class: 'review-agent',
          permission_tier: 'read',
          host_mutation_policy: 'evidence_only',
          allowed_write_scopes: ['.devai/state/skills/**', '.devai/state/rgr/**'],
        },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it('flags ops-agent/act writing tests as INSPECTOR_RESERVED', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-ops-test-edit',
          agent_class: 'ops-agent',
          permission_tier: 'act',
          allowed_write_scopes: ['packages/cli/test/**'],
        },
      ],
    });
    expect(v.findings[0]?.code).toBe('OPS_AGENT_WRITES_TESTS');
    expect(v.findings[0]?.reserved_to).toBe('inspector');
  });

  it('warns on JOINT_RESERVED (glossary) without review-agent class', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-coding-glossary',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['law/glossary/**'],
        },
      ],
    });
    expect(v.findings[0]?.code).toBe('JOINT_RESERVED_WITHOUT_REVIEW_AGENT');
    expect(v.findings[0]?.severity).toBe('warning');
    // warnings keep ok=true (verdict.ok is "no error/critical").
    expect(v.ok).toBe(true);
  });

  it('counts manifests_checked correctly', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'a',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['src/**'],
        },
        { id: 'b', agent_class: 'review-agent', permission_tier: 'read' },
      ],
    });
    expect(v.manifests_checked).toBe(2);
  });
});
// Invariants: INV-DEVAI-008
