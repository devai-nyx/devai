import { describe, expect, it } from 'vitest';
import { checkPromptOverlays } from '../../src/prompt-firewall/index.js';

/**
 * R12 W2 — Glob-aware `overlaps()` + hardened `isAutofixSelfScope`.
 *
 * Mandated test coverage per
 * `docs/meta/adr/ADR-FIREWALL-OVERLAPS-GLOB-AWARE.md` (commit `e50ee8b`).
 * Each `describe` block corresponds to one ADR-numbered case.
 *
 * The existing `prompt-firewall.test.ts` continues to assert
 * pre-R12 behaviour (identity, forward containment, draft-subpath
 * exemption, evidence-only, ops-agent test writes, joint-reserved
 * review-agent gate). This file adds glob-aware coverage.
 */

const firstArchitectFinding = (
  v: ReturnType<typeof checkPromptOverlays>,
): { code: string; reserved_to: string } | undefined =>
  v.findings.find(
    (f) => f.code === 'PROMPT_OVERLAY_AUTHORITY_INVERSION' && f.reserved_to === 'architect',
  );

describe('R12 W2 — ADR-mandated overlap cases', () => {
  it('case 1: broad-glob `**/*.md` overlaps docs/framework/arch/ (regression fixed)', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-broad-md',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['**/*.md'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(firstArchitectFinding(v)).toBeDefined();
  });

  it('case 2a: narrow-glob `docs/meta/adr/**/*.md` overlaps docs/meta/adr/ (still detected)', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-narrow-adr',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/meta/adr/**/*.md'],
        },
      ],
    });
    const adrFinding = v.findings.find((f) => f.message.includes('docs/meta/adr/'));
    expect(adrFinding).toBeDefined();
    expect(adrFinding?.code).toBe('PROMPT_OVERLAY_AUTHORITY_INVERSION');
  });

  it('case 2b: narrow-glob `docs/meta/adr/**/*.md` does NOT overlap docs/framework/arch/', () => {
    // Targeted finding: there should be exactly one architect finding
    // (for `docs/meta/adr/`) — none against `docs/framework/arch/`, `docs/framework/schemas/`, etc.
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-narrow-adr',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/meta/adr/**/*.md'],
        },
      ],
    });
    const archFinding = v.findings.find((f) => f.message.includes("'docs/framework/arch/'"));
    expect(archFinding).toBeUndefined();
  });

  it('case 6: identity overlap `docs/framework/arch/` vs `docs/framework/arch/` → finding', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-identity',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/framework/arch/'],
        },
      ],
    });
    expect(firstArchitectFinding(v)).toBeDefined();
  });

  it('case 7: sibling glob `packages/**/*.ts` does NOT overlap docs/framework/arch/', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-sibling',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['packages/**/*.ts'],
        },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it('case 5: draft subpath `docs/framework/arch/draft/**` exempts via exemptByDraft', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-draft-arch',
          agent_class: 'review-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['docs/framework/arch/draft/**'],
        },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it('case 3: fix-family review-agent cannot borrow ADR write authority', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-fix-adrs-like',
          family: 'fix',
          agent_class: 'review-agent',
          permission_tier: 'write',
          auto_fix_capable: 'partial',
          allowed_write_scopes: ['docs/meta/adr/**/*.md'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(firstArchitectFinding(v)).toBeDefined();
  });

  it('case 4: broad-glob WITH autofix exemption attempted — finding fires (hardening case)', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-broad-fix-md',
          family: 'fix',
          agent_class: 'review-agent',
          permission_tier: 'write',
          auto_fix_capable: 'partial',
          allowed_write_scopes: ['**/*.md'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(firstArchitectFinding(v)).toBeDefined();
  });

  it('case 4-variant: narrow ADR scope remains Architect-owned', () => {
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-fix-adrs',
          family: 'fix',
          agent_class: 'review-agent',
          permission_tier: 'write',
          auto_fix_capable: 'partial',
          allowed_write_scopes: ['docs/meta/adr/**/*.md'],
        },
      ],
    });
    expect(v.ok).toBe(false);
    expect(firstArchitectFinding(v)).toBeDefined();
  });

  it('one-finding-per-scope: a scope overlapping multiple reserveds yields one finding (the existing `break`)', () => {
    // `**/*.md` overlaps every Architect-reserved markdown surface
    // (CONSTITUTION.md, docs/framework/arch/, docs/meta/adr/,
    // docs/meta/ops/, docs/meta/security/). The call-site `break` after the
    // first match means we emit ONE finding per scope, not many.
    const v = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-broad-md-single-finding',
          agent_class: 'coding-agent',
          permission_tier: 'write',
          allowed_write_scopes: ['**/*.md'],
        },
      ],
    });
    const archFindings = v.findings.filter(
      (f) => f.code === 'PROMPT_OVERLAY_AUTHORITY_INVERSION' && f.reserved_to === 'architect',
    );
    expect(archFindings).toHaveLength(1);
  });
});

describe('R-0005 — autofix does not confer reserved-path authority', () => {
  const fixSkill = (id: string, scope: string) => ({
    id,
    family: 'fix' as const,
    agent_class: 'review-agent' as const,
    permission_tier: 'write' as const,
    auto_fix_capable: 'partial' as const,
    allowed_write_scopes: [scope],
  });

  it('REJECTS `**/*.md` (wildcard-rooted, even with file ext)', () => {
    const v = checkPromptOverlays({ manifests: [fixSkill('a', '**/*.md')] });
    expect(v.ok).toBe(false);
  });

  it('REJECTS `docs/meta/adr/**/*.md` even with a literal prefix and file extension', () => {
    const v = checkPromptOverlays({ manifests: [fixSkill('b', 'docs/meta/adr/**/*.md')] });
    expect(v.ok).toBe(false);
  });

  it('REJECTS `docs/meta/adr/**` (no file-extension restriction)', () => {
    const v = checkPromptOverlays({ manifests: [fixSkill('c', 'docs/meta/adr/**')] });
    expect(v.ok).toBe(false);
  });

  it('REJECTS bare `docs/meta/adr/` (no `**` and no file ext)', () => {
    const v = checkPromptOverlays({ manifests: [fixSkill('d', 'docs/meta/adr/')] });
    expect(v.ok).toBe(false);
  });

  it('REJECTS `*/adr/**/*.md` (prefix contains wildcard before `**`)', () => {
    // This scope overlaps `law/adr/` via the probe `law/adr/file.md`.
    // The hardened gate must still reject the exemption because the
    // prefix-up-to-`**` (`*/adr`) contains a wildcard.
    const v = checkPromptOverlays({ manifests: [fixSkill('e', '*/adr/**/*.md')] });
    expect(v.ok).toBe(false);
  });
});
// Invariants: INV-DEVAI-001
