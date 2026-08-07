import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { getValidator, listSchemaFiles } from '../../src/index.js';
import { ROSTER } from '../../src/roster.js';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

function json(path: string): unknown {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as unknown;
}

describe('governed population count guards', () => {
  it('guards the complete schema population without a maintained count literal', () => {
    const files = readdirSync(join(ROOT, 'law', 'schemas'))
      .filter((file) => file.endsWith('.schema.json'))
      .sort();
    const tracked = execFileSync('git', ['ls-files', ':(glob)law/schemas/*.schema.json'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter((file) => file.endsWith('.schema.json'))
      .map((file) => basename(file))
      .sort();
    expect(files).toEqual([...ROSTER].sort());
    expect(files).toEqual(tracked);
    expect(files).toEqual(listSchemaFiles());
    expect(new Set(files).size).toBe(files.length);
    expect(files.length).toBeGreaterThan(0);
  });

  it('guards the 34-invariant roster', () => {
    const files = readdirSync(join(ROOT, 'law', 'invariants'))
      .filter((file) => /^INV-.+\.json$/.test(file))
      .sort();
    expect(files).toHaveLength(34);
  });

  it('guards the 14 physical and 13 active journey records', () => {
    const records = readdirSync(join(ROOT, 'product', 'journeys'))
      .filter((file) => /^JNY-.+\.json$/.test(file))
      .map((file) => json(`product/journeys/${file}`) as { status: string });
    expect(records).toHaveLength(14);
    expect(records.filter((record) => record.status === 'active')).toHaveLength(13);
  });

  it('guards the 44-entry glossary roster', () => {
    const files = readdirSync(join(ROOT, 'law', 'glossary')).filter((file) =>
      /^GE-\d{3}\.json$/.test(file),
    );
    expect(files).toHaveLength(44);
  });

  it('guards the gapless 24-record and 19-active successor ADR roster', () => {
    const files = readdirSync(join(ROOT, 'law', 'adr'))
      .filter((file) => /^ADR-\d{3}-.+\.md$/.test(file))
      .sort();
    expect(files).toHaveLength(24);
    expect(files.map((file) => Number(file.slice(4, 7)))).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
    const records = files.map((file) => ({
      file,
      source: readFileSync(join(ROOT, 'law', 'adr', file), 'utf8'),
    }));
    expect(records.filter(({ source }) => /^status: active$/m.test(source))).toHaveLength(19);
    expect(records.find(({ file }) => file.startsWith('ADR-005-'))?.source).toMatch(
      /^superseded_by: ADR-013$/m,
    );
    expect(records.find(({ file }) => file.startsWith('ADR-014-'))?.source).toMatch(
      /^superseded_by: ADR-015$/m,
    );
    expect(records.find(({ file }) => file.startsWith('ADR-011-'))?.source).toMatch(
      /^superseded_by: ADR-016$/m,
    );
    for (const id of ['ADR-017-', 'ADR-018-']) {
      expect(records.find(({ file }) => file.startsWith(id))?.source).toMatch(
        /^superseded_by: ADR-019$/m,
      );
    }
  });

  it('guards the complete decision register roster without a maintained count literal', () => {
    const register = readFileSync(join(ROOT, 'law', 'register', 'DECISIONS.md'), 'utf8');
    const governed = register.match(/^### DII-[A-Z0-9-]+ — /gm) ?? [];
    const all = register.match(/^### DII-[A-Z0-9-]+(?:\.| —) /gm) ?? [];
    expect(all[0]).toMatch(/^### DII-1\./);
    expect(governed).toHaveLength(all.length - 1);
    expect(governed.length).toBeGreaterThan(0);
  });

  it('guards the 59-live and 5-archived sensor roster', () => {
    const registry = json('law/policy/sensor-registry.json') as {
      entries: unknown[];
      archived_kinds: unknown[];
    };
    expect(registry.entries).toHaveLength(59);
    expect(registry.archived_kinds).toHaveLength(5);
  });
});
// Invariants: INV-DEVAI-001, INV-DEVAI-014

describe('population-registry honesty', () => {
  const registry = json('law/policy/population-registry.json') as {
    populations: Array<{
      id: string;
      count_guard: { state: string; source: string | null; backlog_ref: string | null };
      liveness_guard: { state: string; source: string | null; backlog_ref: string | null };
      tombstone_guard: { state: string; source: string | null; backlog_ref: string | null };
    }>;
  };

  it('validates the population registry against its schema', () => {
    const validate = getValidator('population-registry.schema.json');
    expect(validate(registry), JSON.stringify(validate.errors)).toBe(true);
  });

  it('requires implemented guards to resolve and deferred guards to retain pointers', () => {
    for (const population of registry.populations) {
      for (const guard of [
        population.count_guard,
        population.liveness_guard,
        population.tombstone_guard,
      ]) {
        if (guard.state === 'implemented') {
          expect(guard.source, `${population.id}: implemented guard source`).toBeTruthy();
          const file = guard.source?.split('#')[0];
          expect(
            file !== undefined && existsSync(join(ROOT, file)),
            `${population.id}: ${guard.source ?? 'missing source'} resolves`,
          ).toBe(true);
        } else {
          expect(
            guard.backlog_ref,
            `${population.id}: ${guard.state} guard has a backlog pointer`,
          ).toBeTruthy();
        }
      }
    }
  });
});

describe('register-to-Constitution consistency guard', () => {
  const constitution = readFileSync(join(ROOT, 'law', 'constitution.md'), 'utf8');
  const register = readFileSync(join(ROOT, 'law', 'register', 'DECISIONS.md'), 'utf8');
  const articleNumbers = new Set(
    [...constitution.matchAll(/^### Article (\d+)\./gm)].map((match) => Number(match[1])),
  );

  it('resolves every explicit constitutional article anchor', () => {
    const cited = [...register.matchAll(/(?:Constitution (?:Article|Art)|Article) (\d+)/g)].map(
      (match) => Number(match[1]),
    );
    expect(cited.length).toBeGreaterThan(0);
    for (const article of cited) {
      expect(articleNumbers.has(article), `register cites existing Article ${article}`).toBe(true);
    }
  });

  it('contains no direct constitutional override or contradiction marker', () => {
    expect(register).not.toMatch(
      /\b(?:override|contradict|supersede|ignore)s? (?:the )?Constitution\b/i,
    );
    expect(register).not.toMatch(/\bcontrary to (?:Constitution )?Article \d+\b/i);
  });
});

describe('structured error class-to-exit closure', () => {
  const validate = getValidator('error.schema.json');
  const pairs = [
    ['routing-authority', 2],
    ['gate-fail', 3],
    ['invalid-input', 4],
    ['precondition', 5],
    ['infrastructure', 6],
    ['contract-violation', 7],
  ] as const;

  function envelope(errorClass: string, exit: number): Record<string, unknown> {
    return {
      schemaVersion: '1.0.0',
      code: 'TEST_ERROR',
      class: errorClass,
      exit,
      message: 'fixture',
    };
  }

  it.each(pairs)('accepts the exact %s -> %i pair', (errorClass, exit) => {
    expect(validate(envelope(errorClass, exit)), JSON.stringify(validate.errors)).toBe(true);
  });

  it('rejects every mismatched class-to-exit pair', () => {
    for (const [errorClass, exit] of pairs) {
      const mismatchedExit = exit === 7 ? 2 : exit + 1;
      expect(
        validate(envelope(errorClass, mismatchedExit)),
        `${errorClass}/${mismatchedExit}`,
      ).toBe(false);
    }
  });

  it('rejects undeclared root properties', () => {
    expect(validate({ ...envelope('routing-authority', 2), undeclared: true })).toBe(false);
  });
});

describe('sensor-registry liveness and reachability', () => {
  const registry = json('law/policy/sensor-registry.json') as {
    entries: Array<{
      id: string;
      kind: string;
      emitter_module: string;
      cells?: Array<{ substrate: string; property: string }>;
      diagnostic?: true;
      tiers: string[];
    }>;
    archived_kinds: Array<{ kind: string }>;
  };

  it('validates against the canonical sensor-registry schema', () => {
    const validate = getValidator('sensor-registry.schema.json');
    expect(validate(registry), JSON.stringify(validate.errors)).toBe(true);
  });

  it('keeps live ids and kinds unique and disjoint from archived kinds', () => {
    const ids = registry.entries.map((entry) => entry.id);
    const kinds = registry.entries.map((entry) => entry.kind);
    const archived = new Set(registry.archived_kinds.map((entry) => entry.kind));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(kinds).size).toBe(kinds.length);
    for (const kind of kinds) expect(archived.has(kind), `${kind} is not archived`).toBe(false);
  });

  it('requires every live entry to resolve an emitter and be scorecard-backed or diagnostic', () => {
    for (const entry of registry.entries) {
      expect(existsSync(join(ROOT, entry.emitter_module)), `${entry.kind} emitter resolves`).toBe(
        true,
      );
      const hasCells = (entry.cells?.length ?? 0) > 0;
      expect(
        hasCells !== (entry.diagnostic === true),
        `${entry.kind} has exactly one of cells or diagnostic standing`,
      ).toBe(true);
      expect(entry.tiers).toContain('SWEEP');
    }
  });

  it('leaves no unexplained scheduled-reachability gap after the F1:T1 N/A disposition', () => {
    const reachable = new Set(
      registry.entries.flatMap((entry) =>
        entry.tiers.length > 0
          ? (entry.cells ?? []).map((cell) => `${cell.substrate}:${cell.property}`)
          : [],
      ),
    );
    const na = json('.devai/config/scorecard-na.json') as {
      cells: Array<{ cell: string; reason: string }>;
    };
    const notApplicable = new Set(na.cells.map((cell) => cell.cell));
    expect(na.cells).toEqual([
      expect.objectContaining({
        cell: 'F1:T1',
        reason: expect.stringContaining('contract_validation remains archived'),
      }),
    ]);
    const unreachable: string[] = [];
    for (const substrate of ['F1', 'F2', 'F3', 'F4', 'F5']) {
      for (let property = 1; property <= 9; property += 1) {
        const cell = `${substrate}:T${String(property)}`;
        if (cell !== 'F4:T5' && !notApplicable.has(cell) && !reachable.has(cell)) {
          unreachable.push(cell);
        }
      }
    }
    expect(unreachable).toEqual([]);
  });
});
