// Invariants: INV-DEVAI-001
import { describe, expect, it } from 'vitest';
import { checkPromptOverlays } from '../../src/prompt-firewall/index.js';
import { getSkill } from '../../src/skills/impl/index.js';

describe('governance skill adapters', () => {
  it('KR-R5-036 keeps authority-owned lifecycle mutation outside agent skills', () => {
    for (const id of ['SKILL-round-scaffold', 'SKILL-round-archive', 'SKILL-adr-new']) {
      expect(getSkill(id), id).toBeNull();
    }
  });

  it('KR-R5-037 keeps ADR mutation outside every agent-callable fix skill', () => {
    const adrFix = getSkill('SKILL-fix-adrs');
    expect(adrFix?.manifest.permission_tier).toBe('read');
    expect(adrFix?.manifest.auto_fix_capable).toBe('none');
    expect(adrFix?.manifest.allowed_write_scopes).toEqual([]);

    const verdict = checkPromptOverlays({
      manifests: [
        {
          id: 'SKILL-fix-adrs',
          family: 'fix',
          agent_class: 'review-agent',
          permission_tier: 'write',
          auto_fix_capable: 'partial',
          allowed_write_scopes: ['law/adr/**/*.md'],
        },
      ],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.findings).toEqual([
      expect.objectContaining({
        code: 'PROMPT_OVERLAY_AUTHORITY_INVERSION',
        offending_scope: 'law/adr/**/*.md',
      }),
    ]);
  });
});
