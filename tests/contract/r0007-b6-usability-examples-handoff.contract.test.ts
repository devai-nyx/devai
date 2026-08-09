// Invariants: INV-DEVAI-001, INV-DEVAI-015, INV-DEVAI-017, INV-DEVAI-020
// R7-B6-USABILITY-EXAMPLES-001..007: independent operator-handoff acceptance.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const IA_PATH = 'law/policy/documentation-information-architecture.json';
const MAP_PATH = 'work/rounds/R-0007/inventory/old-to-new-command-map.md';
const MIGRATION_PATH = 'docs/reference/cli/migration.md';
const RENDERER_PATH = 'docs/reference/cli/render-generated-reference.mjs';

interface DocumentationPage {
  readonly page_id: string;
  readonly planned_path: string;
}

interface DocumentationArchitecture {
  readonly claim_ceiling: {
    readonly canonical_descriptor_handoff: boolean;
    readonly narrative_documentation_complete: boolean;
    readonly deploy_ready_site: boolean;
    readonly released: boolean;
    readonly deployed: boolean;
  };
  readonly pages: readonly DocumentationPage[];
}

function text(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function architecture(): DocumentationArchitecture {
  return JSON.parse(text(IA_PATH)) as DocumentationArchitecture;
}

function plannedPages(): readonly DocumentationPage[] {
  return architecture().pages;
}

function oldActionIds(): string[] {
  const source = text(MAP_PATH).split('## Global vocabulary and consent migration')[0] ?? '';
  return [...source.matchAll(/^\| `([^`]+)`\s*\|/gmu)].map((match) => `action:${match[1]}`);
}

function generatedMigrationIds(): string[] {
  return [
    ...text(MIGRATION_PATH).matchAll(
      /<!-- devai:generated-entry category="migration" id="([^"]+)" -->/gu,
    ),
  ].map((match) => match[1] ?? '');
}

function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  const occurrences = new Map<string, number>();
  for (const match of markdown.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gmu)) {
    const base = (match[1] ?? '')
      .replace(/<[^>]+>/gu, '')
      .replace(/[`*_~]/gu, '')
      .toLocaleLowerCase('en-US')
      .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
      .replace(/\s/gu, '-');
    const duplicate = occurrences.get(base) ?? 0;
    occurrences.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${String(duplicate)}`);
  }
  for (const match of markdown.matchAll(/<a\s+(?:name|id)=["']([^"']+)["'][^>]*>/giu)) {
    anchors.add(match[1] ?? '');
  }
  return anchors;
}

function localLinks(markdown: string): string[] {
  return [...markdown.matchAll(/!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)]
    .map((match) => match[1] ?? '')
    .filter((target) => !/^(?:https?:|mailto:)/u.test(target));
}

function proseAndTableDefects(path: string): string[] {
  const lines = text(path).split('\n');
  const defects: string[] = [];
  let expectedTablePipes: number | undefined;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (line.startsWith('|')) {
      const pipes = [...line.matchAll(/(?<!\\)\|/gu)].length;
      expectedTablePipes ??= pipes;
      if (pipes !== expectedTablePipes) {
        defects.push(
          `${path}:${String(index + 1)} has ${String(pipes)} table separators; expected ${String(expectedTablePipes)}`,
        );
      }
    } else {
      expectedTablePipes = undefined;
    }
    if (/values\.\.|`\.,|`\. plus/u.test(line)) {
      defects.push(`${path}:${String(index + 1)} has malformed generated punctuation`);
    }
    if (/\b(?:recieve|seperate|occured|occurence|availabilty|sucessful|goverance)\b/iu.test(line)) {
      defects.push(`${path}:${String(index + 1)} has a known misspelling`);
    }
  }
  return defects;
}

describe('R-0007 B6 migration usability and current-language containment', () => {
  it('R7-B6-USABILITY-EXAMPLES-001 emits each of the 147 historical commands exactly once', () => {
    const expected = oldActionIds();
    expect(expected).toHaveLength(147);
    expect(new Set(expected).size, 'historical source rows must themselves be unique').toBe(147);

    const generated = generatedMigrationIds().filter((id) => id.startsWith('action:'));
    expect(generated).toHaveLength(147);
    expect(
      new Set(generated).size,
      'a repeated generated old command is a migration ambiguity',
    ).toBe(147);
    expect(
      generated,
      'generated migration order/content must biject with the admitted old map',
    ).toEqual(expected);
  });

  it('R7-B6-USABILITY-EXAMPLES-002 contains retired vocabulary to migration, not current handoff pages', () => {
    const currentPages = plannedPages().filter((page) => page.page_id !== 'migration');
    const forbidden = [
      /init apply-f5/gu,
      /\bF5\s+(?:onboarding|operator|role|tier|workflow)\b/gu,
      /--allow-publish/gu,
      /check\s+--profile\b/gu,
      /sense\s+(?:run\s+)?--set\b/gu,
      /sense[^\n`]*--preset\s+tier(?:1|2|3)\b/gu,
      /adoption[^\n`]*--profile\s+tier(?:1|2|3)\b/gu,
    ];
    for (const page of currentPages) {
      const markdown = text(page.planned_path);
      for (const spelling of forbidden) {
        expect(
          markdown,
          `${page.planned_path} exposes historical vocabulary ${String(spelling)}`,
        ).not.toMatch(spelling);
      }
    }
    expect(text(MIGRATION_PATH)).toMatch(/init apply-f5/u);
    const allowPublish = text(MIGRATION_PATH).match(
      /<!-- devai:generated-entry category="migration" id="vocabulary:allow-publish" -->([\s\S]*?)(?=<!-- devai:generated-(?:entry|reference:end))/u,
    )?.[1];
    expect(
      allowPublish,
      'allow-publish migration must name exact old spelling and map it to --publish while retaining --write',
    ).toMatch(/historical[^\n]*`--allow-publish`[\s\S]*successor[^\n]*`--publish`[^\n]*`--write`/u);
  });
});

describe('R-0007 B6 novice selection and executor semantics', () => {
  it('R7-B6-USABILITY-EXAMPLES-003 lets an operator choose suite, preset, kind, and slice from the overview', () => {
    const overview = text('docs/reference/cli/index.md');
    const vocabulary = text('docs/reference/cli/vocabulary.md');

    expect(overview).toMatch(/Select exactly one `--suite` or `--only`/u);
    expect(overview).toMatch(/select exactly one positional kind or\s+`--preset`/u);
    expect(overview).toMatch(/A slice selection is separate/u);
    for (const link of [
      './check-suites.md',
      './sense-presets.md',
      './sensor-kinds.md',
      './inventory-slices.md',
    ]) {
      expect(overview, `overview omits decision link ${link}`).toContain(`](${link})`);
    }
    expect(vocabulary).toMatch(/suite and preset\s*\| suites validate; presets observe/u);
    expect(vocabulary).toMatch(
      /preset and kind\s*\| a preset selects an ordered population; a kind identifies one sensor/u,
    );
    expect(vocabulary).toMatch(
      /slice and preset\s*\| a slice renders an inventory projection; a preset runs sensors/u,
    );
    expect(vocabulary).toMatch(
      /round and task\s*\| the round is the governed container; the task is subordinate work/u,
    );
  });

  it('R7-B6-USABILITY-EXAMPLES-004 keeps request, resolution, availability, capability, and authority distinct', () => {
    const executors = text('docs/reference/cli/round-task-executors.md');
    const roster = text('docs/reference/cli/model-runtime.md');

    expect(executors).toMatch(/### Choose without implicit fallback/u);
    expect(executors).toMatch(/available` means roster-eligible, not\s+host-reachable/u);
    expect(executors).toMatch(/The task's `executor` object is the immutable request/u);
    expect(executors).toMatch(
      /Resolution and observation live in a\s+separate task-execution-evidence record/u,
    );
    expect(executors).toMatch(/Authority stays with discipline/u);
    expect(executors).toMatch(/model capability cannot claim/u);

    expect(roster).toMatch(
      /reports selection eligibility, not host reachability or governance\s+authority/u,
    );
    expect(roster).toMatch(/No implicit latest version, alias, effort, or fallback/u);
    expect(roster).toMatch(/immutable request digest and a separate resolved executor record/u);
    expect(roster).toMatch(/model capability grants no action effect or governance authority/u);
  });
});

describe('R-0007 B6 links, anchors, bytes, spelling surface, and formatting', () => {
  it('R7-B6-USABILITY-EXAMPLES-005 resolves every local page link and Markdown anchor', () => {
    for (const page of plannedPages()) {
      const sourcePath = join(ROOT, page.planned_path);
      expect(existsSync(sourcePath), `planned handoff page is absent: ${page.planned_path}`).toBe(
        true,
      );
      const markdown = readFileSync(sourcePath, 'utf8');
      for (const rawTarget of localLinks(markdown)) {
        const [rawPath = '', rawFragment] = rawTarget.split('#', 2);
        const targetPath = resolve(dirname(sourcePath), decodeURIComponent(rawPath || '.'));
        expect(
          existsSync(targetPath),
          `${page.planned_path} has a broken link to ${rawTarget}`,
        ).toBe(true);
        if (rawFragment !== undefined && extname(targetPath) === '.md') {
          const fragment = decodeURIComponent(rawFragment);
          expect(
            headingAnchors(readFileSync(targetPath, 'utf8')),
            `${page.planned_path} has a broken anchor ${rawTarget}`,
          ).toContain(fragment);
        }
      }
    }
  });

  it('R7-B6-USABILITY-EXAMPLES-006 preserves generated bytes and formatted canonical handoff files', () => {
    const generated = spawnSync(process.execPath, [join(ROOT, RENDERER_PATH), '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(generated.error).toBeUndefined();
    expect(generated.status, generated.stderr || generated.stdout).toBe(0);

    const paths = [
      ...plannedPages().map((page) => page.planned_path),
      MAP_PATH,
      'work/rounds/R-0007/inventory/documentation-information-architecture.md',
      'work/rounds/R-0007/inventory/migration-narrative.md',
    ];
    const formatted = spawnSync('pnpm', ['exec', 'prettier', '--check', ...paths], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(formatted.error).toBeUndefined();
    expect(formatted.status, formatted.stderr || formatted.stdout).toBe(0);

    const claimCeiling = architecture().claim_ceiling;
    expect(claimCeiling).toEqual({
      canonical_descriptor_handoff: true,
      narrative_documentation_complete: false,
      deploy_ready_site: false,
      released: false,
      deployed: false,
    });
  });

  it('R7-B6-USABILITY-EXAMPLES-007 has rectangular Markdown tables and readable generated punctuation', () => {
    const defects = [MAP_PATH, ...plannedPages().map((page) => page.planned_path)].flatMap(
      proseAndTableDefects,
    );
    expect(defects, defects.slice(0, 50).join('\n')).toEqual([]);
  });
});
