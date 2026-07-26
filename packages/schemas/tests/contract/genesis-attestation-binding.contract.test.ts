import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getValidator } from '../../src/index.js';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const ATTESTATION = join(ROOT, 'law', 'register', 'attestation', 'genesis-attestation.json');

describe('frozen predecessor genesis binding', () => {
  const document = JSON.parse(readFileSync(ATTESTATION, 'utf8')) as {
    ratified: string | null;
    _status?: string;
    predecessor: {
      repo_url: string;
      final_commit_sha: string | null;
      final_tree_sha: string | null;
      evidence_chain_head_sha256: string | null;
      closing_decision: string | null;
      closing_pc_record: string | null;
      frozen: boolean;
    };
  };

  it('ratifies once while preserving the immutable predecessor close', () => {
    expect(document.ratified).toBe('2026-07-25T22:08:05Z');
    expect(document._status).toMatch(/RATIFIED by DII-150.*immutable/);
    expect(document.predecessor).toEqual({
      repo_url: 'https://github.com/devai-nyx/devai-original',
      final_commit_sha: '05dd242bf72334bfd683096aed380e8240b6b9aa',
      final_tree_sha: 'a6d6bf5ba06d78e182792441dffac4ae554b684c',
      evidence_chain_head_sha256:
        'd0c5b9ac2da64fb2e3533317abcc65511b593c3e610d301c60504cc8deddc9c4',
      closing_decision: 'D-196',
      closing_pc_record: 'PC-0019',
      frozen: true,
    });
  });

  it('validates the rebound instance against the canonical schema', () => {
    const instance = structuredClone(document) as Record<string, unknown>;
    delete instance['_status'];
    const validate = getValidator('genesis-attestation.schema.json');
    expect(validate(instance), JSON.stringify(validate.errors)).toBe(true);
  });
});
// Invariants: INV-DEVAI-001
