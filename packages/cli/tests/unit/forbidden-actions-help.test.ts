// Invariants: INV-DEVAI-001
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

describe('forbidden-action CLI help', () => {
  it('does not advertise a fail-open default', () => {
    const source = readFileSync(join(ROOT, 'packages/cli/src/commands/check/index.ts'), 'utf8');
    expect(source).not.toContain('default: exit OK with findings reported');
    expect(source).toContain('--strict remains accepted for compatibility');
  });
});
