import {
  execFileSync,
  spawnSync,
  writeFileSync,
} from '@devai-nyx/authority';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { senseTypeCheck } from '@devai-nyx/sensors';
import { validateAdrs } from '@devai-nyx/spec';
import { scanForbiddenActions } from '../../forbidden-actions/index.js';
import { scanInvOverrides } from '../../inv-override/index.js';
import { checkPromptOverlays } from '../../prompt-firewall/index.js';
import { resolveDevaiCliBin } from '../round/waves.js';
import type { SkillEntry, SkillManifest } from '../types.js';

export function createFixSkills(resolveSkills: () => readonly SkillEntry[]): readonly SkillEntry[] {
  interface FixSkillResult {
    readonly status: 'pass' | 'fail';
    readonly exit_code?: number;
    readonly evidence: unknown;
  }

  function runDevaiVerb(args: readonly string[], cwd: string): FixSkillResult {
    const bin = resolveDevaiCliBin(cwd);
    if (bin === undefined) {
      return { status: 'fail', evidence: { error: 'devai CLI bin not found' } };
    }
    try {
      const r = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });
      let parsed: unknown;
      try {
        parsed = JSON.parse(r.stdout);
      } catch {
        parsed = { stdout: r.stdout, stderr: r.stderr };
      }
      return {
        status: r.status === 0 ? 'pass' : 'fail',
        exit_code: r.status ?? 1,
        evidence: parsed,
      };
    } catch (error) {
      return {
        status: 'fail',
        evidence: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  function runShell(cmd: string, args: readonly string[], cwd: string): FixSkillResult {
    try {
      const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
      return {
        status: r.status === 0 ? 'pass' : 'fail',
        exit_code: r.status ?? 1,
        evidence: {
          cmd: `${cmd} ${args.join(' ')}`,
          stdout_tail: (r.stdout ?? '').slice(-1000),
          stderr_tail: (r.stderr ?? '').slice(-1000),
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        evidence: {
          cmd: `${cmd} ${args.join(' ')}`,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  function fixSkillManifest(
    gateId: string,
    opts: {
      title: string;
      authorityRole?: 'engineer' | 'architect';
      tier?: 'low' | 'medium';
      autoFix?: 'full' | 'partial' | 'none';
      /**
       * R11-W6.07 — per-skill mutation overrides for fix-skills that ship
       * real autofix (e.g. fix-docs-links, fix-overrides). When omitted
       * the catalog-fill defaults (read-only diagnose) apply.
       */
      mutation?: {
        readonly hostMutationPolicy: 'write_requires_flag';
        readonly permissionTier: 'write';
        readonly allowedWriteScopes: readonly string[];
      };
      /** Overrides the default 'Diagnose ...' summary for autofix-capable skills. */
      summary?: string;
      /** Overrides the default ['<gate>', 'diagnose'] tags. */
      tags?: readonly string[];
    },
  ): SkillManifest {
    const hostMutationPolicy = opts.mutation?.hostMutationPolicy ?? 'read_only';
    const permissionTier = opts.mutation?.permissionTier ?? 'read';
    const allowedWriteScopes = opts.mutation?.allowedWriteScopes ?? [];
    const summary =
      opts.summary ??
      `Diagnose the ${gateId} gate; read-only (R3-W3 catalog-fill; iteration loops + real fixing deferred per R2-Δ1).`;
    const tags = opts.tags ?? [gateId, 'diagnose'];
    return {
      schemaVersion: '1.0.0',
      id: `SKILL-fix-${gateId}`,
      title: opts.title,
      version: '1.0.0',
      summary,
      kind: 'command',
      authority_role: opts.authorityRole ?? 'engineer',
      deterministic: true,
      llm_backed: false,
      agent_class: 'review-agent',
      permission_tier: permissionTier,
      host_mutation_policy: hostMutationPolicy,
      allowed_write_scopes: allowedWriteScopes,
      evidence_files: [`record/proofs/work/skill-runs/SKILL-fix-${gateId}/*.json`],
      risk_level: opts.tier ?? 'low',
      tags,
      entry: `devai agent skill run SKILL-fix-${gateId}`,
      family: 'fix',
      gate_id: gateId,
      // R4-W1 default: 'none' for the diagnose-only catalog-fill skills.
      // Per-skill overrides will land in successor rounds as real autofix
      // logic is added; the auto_fix_capable rating tracks capability honestly.
      auto_fix_capable: opts.autoFix ?? 'none',
    };
  }

  const skillFixTypecheck: SkillEntry = {
    manifest: fixSkillManifest('typecheck', { title: 'Diagnose typecheck failure' }),
    async run(ctx) {
      const result = senseTypeCheck({ cwd: ctx.repoRoot });
      return {
        skill_id: 'SKILL-fix-typecheck',
        status: result.aggregate.status === 'pass' ? 'pass' : 'fail',
        evidence: result,
      };
    },
  };

  const skillFixCoverage: SkillEntry = {
    manifest: fixSkillManifest('coverage', { title: 'Diagnose coverage gate' }),
    async run(ctx) {
      const r = runShell('pnpm', ['test:coverage'], ctx.repoRoot);
      return { skill_id: 'SKILL-fix-coverage', status: r.status, evidence: r.evidence };
    },
  };

  const skillFixMutation: SkillEntry = {
    manifest: fixSkillManifest('mutation', { title: 'Diagnose mutation gate' }),
    async run(ctx) {
      const r = runShell('pnpm', ['test:mutation'], ctx.repoRoot);
      return { skill_id: 'SKILL-fix-mutation', status: r.status, evidence: r.evidence };
    },
  };

  const skillFixSpecValidate: SkillEntry = {
    manifest: fixSkillManifest('spec-validate', { title: 'Diagnose spec-validate gate' }),
    async run(ctx) {
      const r = runDevaiVerb(['spec', 'validate-all', '--repo-root', ctx.repoRoot], ctx.repoRoot);
      return { skill_id: 'SKILL-fix-spec-validate', status: r.status, evidence: r.evidence };
    },
  };

  const skillFixActionCoverage: SkillEntry = {
    manifest: fixSkillManifest('action-coverage', { title: 'Diagnose action-coverage gate' }),
    async run(ctx) {
      const r = runDevaiVerb(
        ['spec-validate-action-coverage', '--repo-root', ctx.repoRoot],
        ctx.repoRoot,
      );
      return { skill_id: 'SKILL-fix-action-coverage', status: r.status, evidence: r.evidence };
    },
  };

  // =====================================================================
  // SKILL-fix-docs-links — autofix (R11-W6.07, R2-Δ1 first batch).
  //
  // Diagnose: scan docs/**/*.md for broken markdown file links (mirrors
  // packages/cli/src/commands/docs/links.ts audit()).
  //
  // Autofix: for each broken link target whose path was *renamed* in git
  // history, rewrite the link to the current path. Uses
  //   git log --follow --diff-filter=R --name-only -- <original-path>
  // to identify rename chains. Only auto-applies when:
  //   - the path-history walk yields exactly one current file that exists,
  //   - the rewritten link is unambiguous (single candidate).
  // Multi-candidate, no-rename-history, and deleted-target cases escalate
  // (remain reported in evidence.broken_after; next-iteration retry won't
  // help so the iteration loop will hit max attempts and the orchestrator
  // will surface the blocker).
  //
  // Idempotency: a second run after a successful fix finds zero broken
  // links → returns pass, makes no edits, writes nothing.
  // =====================================================================

  interface DocsLinkBrokenItem {
    readonly source: string; // repo-relative .md path
    readonly target: string; // raw link target as written
    readonly resolved: string; // repo-relative resolved path that doesn't exist
  }

  interface DocsLinkFixAttempt {
    readonly source: string;
    readonly target: string;
    readonly resolved: string;
    readonly outcome:
      | 'rewritten'
      | 'no-rename-history'
      | 'multiple-candidates'
      | 'rename-target-missing';
    readonly new_target?: string;
  }

  const DOCS_LINK_MD_RE = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const DOCS_LINK_EXTERNAL_PREFIXES = ['http://', 'https://', 'mailto:', 'data:', '#'];
  const DOCS_LINK_SKIP_DIRS: ReadonlySet<string> = new Set([
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '.vitest-cache',
  ]);

  function docsLinkWalkMd(dir: string, out: string[]): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (DOCS_LINK_SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        docsLinkWalkMd(full, out);
      } else if (st.isFile() && full.endsWith('.md')) {
        out.push(full);
      }
    }
  }

  function docsLinkScan(repoRoot: string, scanRel: string): DocsLinkBrokenItem[] {
    const broken: DocsLinkBrokenItem[] = [];
    const scanAbs = isAbsolute(scanRel) ? scanRel : join(repoRoot, scanRel);
    if (!existsSync(scanAbs)) return broken;
    const files: string[] = [];
    docsLinkWalkMd(scanAbs, files);
    for (const file of files) {
      let text: string;
      try {
        text = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      let m: RegExpExecArray | null;
      DOCS_LINK_MD_RE.lastIndex = 0;
      while ((m = DOCS_LINK_MD_RE.exec(text)) !== null) {
        const target = m[2];
        if (target === undefined || target.length === 0) continue;
        if (DOCS_LINK_EXTERNAL_PREFIXES.some((p) => target.startsWith(p))) continue;
        const pathPart = target.split('#')[0]?.split('?')[0] ?? '';
        if (pathPart.length === 0) continue;
        const resolved = isAbsolute(pathPart) ? pathPart : join(dirname(file), pathPart);
        if (!existsSync(resolved)) {
          // Repo-relative repr for stable cross-platform identity.
          const sourceRel = relativePath(repoRoot, file);
          const resolvedRel = relativePath(repoRoot, resolved);
          broken.push({ source: sourceRel, target, resolved: resolvedRel });
        }
      }
    }
    return broken;
  }

  function relativePath(from: string, to: string): string {
    // Avoid importing `relative` at top-of-file (keeps the diff small);
    // node:path's relative is available via the dynamic join + slice
    // approach below. Use a small inline polyfill via posix-style.
    // Normalize both to absolute first.
    const a = isAbsolute(from) ? from : join(process.cwd(), from);
    const b = isAbsolute(to) ? to : join(process.cwd(), to);
    if (b.startsWith(a + '/')) return b.slice(a.length + 1);
    if (b === a) return '.';
    // Fall back to node:path relative via require-less path arithmetic.
    // Compute common prefix.
    const aParts = a.split('/');
    const bParts = b.split('/');
    let i = 0;
    while (i < aParts.length && i < bParts.length && aParts[i] === bParts[i]) i++;
    const up = aParts.length - i;
    const down = bParts.slice(i);
    const segs: string[] = [];
    for (let k = 0; k < up; k++) segs.push('..');
    for (const s of down) segs.push(s);
    return segs.join('/') || '.';
  }

  /**
   * Walk git rename history to find the current path of a file that was
   * once at `originalRepoRel`. Returns the current path after rename(s),
   * or a typed escalation reason.
   *
   * `git log --follow` only works on paths that CURRENTLY EXIST — after
   * a rename, the original path is gone, so we can't `--follow` from
   * there. Instead: enumerate all renames in the repo's history with
   * `git log --all --diff-filter=R --name-status --pretty=format:` and
   * scan for rename entries whose OLD side matches `originalRepoRel`.
   * Chain through transitive renames (A → B → C) until we land on a
   * path that exists on disk.
   */
  function docsLinkFindRenameTarget(
    repoRoot: string,
    originalRepoRel: string,
  ):
    | { kind: 'ok'; newRepoRel: string }
    | { kind: 'no-history' }
    | { kind: 'multiple' }
    | { kind: 'missing' } {
    let stdout: string;
    try {
      stdout = execFileSync(
        'git',
        ['log', '--all', '--diff-filter=R', '--name-status', '--pretty=format:'],
        { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch {
      return { kind: 'no-history' };
    }
    // Each rename line: `R<score>\t<old>\t<new>` (score may be e.g. R100).
    const renamesFrom = new Map<string, Set<string>>();
    for (const rawLine of stdout.split('\n')) {
      const line = rawLine.trim();
      if (line.length === 0) continue;
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const op = parts[0] ?? '';
      if (!op.startsWith('R')) continue;
      const oldPath = parts[1];
      const newPath = parts[2];
      if (oldPath === undefined || newPath === undefined) continue;
      const set = renamesFrom.get(oldPath) ?? new Set<string>();
      set.add(newPath);
      renamesFrom.set(oldPath, set);
    }
    const direct = renamesFrom.get(originalRepoRel);
    if (direct === undefined || direct.size === 0) {
      return { kind: 'no-history' };
    }

    // Walk transitive rename chains. BFS so we collect all reachable
    // end-points that currently exist.
    const seen = new Set<string>([originalRepoRel]);
    const queue: string[] = [...direct];
    for (const n of direct) seen.add(n);
    const endpoints = new Set<string>();
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === undefined) break;
      const nexts = renamesFrom.get(cur);
      if (nexts === undefined || nexts.size === 0) {
        // Terminal in the rename graph.
        endpoints.add(cur);
        continue;
      }
      for (const n of nexts) {
        if (seen.has(n)) continue;
        seen.add(n);
        queue.push(n);
      }
      // A node with outgoing renames is also a valid endpoint candidate
      // IF the file still exists at that node (a file can be renamed
      // away and back).
      endpoints.add(cur);
    }
    const existing = [...endpoints].filter((n) => existsSync(join(repoRoot, n)));
    if (existing.length === 0) return { kind: 'missing' };
    if (existing.length > 1) return { kind: 'multiple' };
    const newRel = existing[0];
    if (newRel === undefined) return { kind: 'missing' };
    return { kind: 'ok', newRepoRel: newRel };
  }

  /**
   * Rewrite a markdown link target in `sourceAbs`. Replaces only the
   * exact (target) substring occurrences inside `[label](target...)`
   * patterns. Returns the number of replacements performed.
   */
  function docsLinkRewriteInFile(sourceAbs: string, oldTarget: string, newTarget: string): number {
    const text = readFileSync(sourceAbs, 'utf8');
    let replacements = 0;
    // Escape regex metachars in oldTarget for literal match inside the
    // capture group. We require the link to be inside `](...)`.
    const escaped = oldTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\]\\()${escaped}(?=(\\s+"[^"]*")?\\))`, 'g');
    const next = text.replace(re, (_match, p1: string) => {
      replacements++;
      return `${p1}${newTarget}`;
    });
    if (replacements > 0) writeFileSync(sourceAbs, next);
    return replacements;
  }

  const skillFixDocsLinks: SkillEntry = {
    manifest: fixSkillManifest('docs-links', {
      title: 'Autofix docs-links gate',
      authorityRole: 'architect',
      autoFix: 'partial',
      summary:
        'Diagnose broken markdown links in docs/**; auto-rewrite stale paths via git rename history (R11-W6.07; R2-Δ1 first batch).',
      tags: ['docs-links', 'autofix'],
      mutation: {
        hostMutationPolicy: 'write_requires_flag',
        permissionTier: 'write',
        // R12 W3 (per ADR-FIREWALL-OVERLAPS-GLOB-AWARE + R11 W6.07 + R12 W2):
        // the autofix only rewrites markdown link targets *inside* files
        // discovered by `docsLinkScan(ctx.repoRoot, scanRel)`, whose default
        // root is `docs/` (and the only honest write surface for this
        // gate's autofix). Narrowing from `**/*.md` to `docs/**/*.md`
        // qualifies under the W2-hardened `isAutofixSelfScope` (literal
        // `docs/` directory prefix before the first `**`, file-extension
        // restriction `.md`).
        allowedWriteScopes: ['docs/**/*.md'],
      },
    }),
    async run(ctx) {
      const scanRel = (ctx.inputs?.['dir'] as string | undefined) ?? 'docs';
      const before = docsLinkScan(ctx.repoRoot, scanRel);
      if (before.length === 0) {
        return {
          skill_id: 'SKILL-fix-docs-links',
          status: 'pass',
          evidence: { broken_before: [], broken_after: [], fix_log: [] },
        };
      }
      const fixLog: DocsLinkFixAttempt[] = [];
      for (const item of before) {
        const result = docsLinkFindRenameTarget(ctx.repoRoot, item.resolved);
        if (result.kind === 'no-history') {
          fixLog.push({ ...item, outcome: 'no-rename-history' });
          continue;
        }
        if (result.kind === 'missing') {
          fixLog.push({ ...item, outcome: 'rename-target-missing' });
          continue;
        }
        if (result.kind === 'multiple') {
          fixLog.push({ ...item, outcome: 'multiple-candidates' });
          continue;
        }
        // Compute new link target relative to source file's directory.
        const sourceAbs = join(ctx.repoRoot, item.source);
        const newAbs = join(ctx.repoRoot, result.newRepoRel);
        const newRel = relativePath(dirname(sourceAbs), newAbs);
        // Preserve any anchor/query suffix from the original target.
        const anchorIdx = item.target.search(/[#?]/);
        const suffix = anchorIdx === -1 ? '' : item.target.slice(anchorIdx);
        const newTarget = `${newRel}${suffix}`;
        try {
          const n = docsLinkRewriteInFile(sourceAbs, item.target, newTarget);
          if (n > 0) {
            fixLog.push({ ...item, outcome: 'rewritten', new_target: newTarget });
          } else {
            // Couldn't find the literal target inside `](...)` — escalate.
            fixLog.push({ ...item, outcome: 'no-rename-history' });
          }
        } catch {
          fixLog.push({ ...item, outcome: 'no-rename-history' });
        }
      }
      const after = docsLinkScan(ctx.repoRoot, scanRel);
      return {
        skill_id: 'SKILL-fix-docs-links',
        status: after.length === 0 ? 'pass' : 'fail',
        evidence: {
          broken_before: before,
          broken_after: after,
          fix_log: fixLog,
          iteration: ctx.iteration,
        },
      };
    },
  };

  const skillFixPromptOverlays: SkillEntry = {
    manifest: fixSkillManifest('prompt-overlays', { title: 'Diagnose prompt-overlays gate' }),
    async run() {
      const verdict = checkPromptOverlays({ manifests: resolveSkills().map((s) => s.manifest) });
      return {
        skill_id: 'SKILL-fix-prompt-overlays',
        status: verdict.ok ? 'pass' : 'fail',
        evidence: verdict,
      };
    },
  };

  const skillFixForbiddenActions: SkillEntry = {
    manifest: fixSkillManifest('forbidden-actions', { title: 'Diagnose forbidden-actions gate' }),
    async run(ctx) {
      const result = scanForbiddenActions({ repoRoot: ctx.repoRoot });
      return {
        skill_id: 'SKILL-fix-forbidden-actions',
        status: result.findings.length === 0 ? 'pass' : 'fail',
        evidence: result,
      };
    },
  };

  // =====================================================================
  // SKILL-fix-adrs — autofix (R11-W6.07 extension, R2-Δ1 ship-now batch).
  //
  // Diagnose: validateAdrs({adrsDir: docs/adr}) reports missing/malformed
  // YAML front-matter, schema violations, filename-vs-adr_id mismatch,
  // missing mandatory body sections, non-sequential numbering.
  //
  // Autofix — two mechanical patterns (taxonomy: 'partial'):
  //   (a) Missing-section scaffolding: when validateAdrs reports a body
  //       missing a mandatory section, append `\n## <Section>\n\n(TBD)\n`
  //       at end of file (with proper blank-line padding). Stubs are
  //       human-searchable via the `(TBD)` marker. Idempotent: after the
  //       first run, the section header exists and validateAdrs no longer
  //       reports it.
  //   (b) Filename rename: when an ADR's front-matter has a valid,
  //       unique `adr_id` but the filename doesn't start with
  //       `<adr_id>-`, rename via `git mv` to preserve history. The
  //       canonical target is `<adr_id>-<slug-from-title>.md`. Skipped
  //       when not in a git repo OR when target filename already exists.
  //
  // Escalates (no autofix): malformed YAML, schema violations (other
  // than missing required), missing adr_id field, duplicate adr_id,
  // numbering gaps. The diagnose path's errors already pinpoint these.
  //
  // Idempotency: stub injection includes `(TBD)`; on second run the
  // section header exists so validateAdrs no longer reports missing;
  // filename matches after first rename so the mismatch finding is gone.
  // =====================================================================

  interface AdrFixAttempt {
    readonly file: string;
    readonly outcome:
      | 'section-scaffolded'
      | 'renamed'
      | 'rename-skipped-target-exists'
      | 'rename-skipped-not-git'
      | 'escalate-malformed-front-matter'
      | 'escalate-missing-adr-id'
      | 'escalate-schema-violation'
      | 'escalate-numbering-gap';
    readonly detail?: string;
  }

  const ADR_FRONT_MATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const ADR_ID_RE = /^ADR-([0-9]{3,})$/;
  const ADR_CANONICAL_FILENAME_RE = /^ADR-[0-9]{3,}-.+\.md$/;

  /**
   * Mirror of the validator's parseFrontMatter — kept private to the
   * autofix path so we can read adr_id/title without re-exporting parser
   * internals from the validator module.
   */
  function parseAdrFrontMatter(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of text.split('\n')) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line);
      if (m === null) continue;
      const key = m[1] ?? '';
      const value = m[2] ?? '';
      if (value === '' || /^\[.*\]$/.test(value.trim())) continue;
      out[key] = value.trim().replace(/^['"]|['"]$/g, '');
    }
    return out;
  }

  function slugifyAdrTitle(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'untitled'
    );
  }

  /**
   * Append a section stub at end of file with proper padding. Ensures
   * exactly one blank line before the new heading.
   */
  function appendSectionStub(absPath: string, sectionLabel: string): void {
    const current = readFileSync(absPath, 'utf8');
    const trimmedEnd = current.replace(/\s+$/, '');
    const stub = `\n\n## ${sectionLabel}\n\n(TBD)\n`;
    writeFileSync(absPath, trimmedEnd + stub);
  }

  /**
   * Returns true if the directory is inside a git work-tree.
   */
  function isInsideGitWorkTree(cwd: string): boolean {
    try {
      const r = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
        cwd,
        encoding: 'utf8',
      });
      return r.status === 0 && (r.stdout ?? '').trim() === 'true';
    } catch {
      return false;
    }
  }

  function gitMv(repoRoot: string, fromAbs: string, toAbs: string): boolean {
    try {
      const r = spawnSync('git', ['mv', fromAbs, toAbs], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      return r.status === 0;
    } catch {
      return false;
    }
  }

  const skillFixAdrs: SkillEntry = {
    manifest: fixSkillManifest('adrs', {
      title: 'Autofix ADRs gate',
      authorityRole: 'architect',
      autoFix: 'partial',
      summary:
        'Diagnose ADRs gate; auto-scaffold missing mandatory sections and normalize filenames via git mv (R11-W6.07 extension; R2-Δ1 ship-now).',
      tags: ['adrs', 'autofix'],
      mutation: {
        hostMutationPolicy: 'write_requires_flag',
        permissionTier: 'write',
        allowedWriteScopes: ['law/adr/**/*.md'],
      },
    }),
    async run(ctx) {
      const adrsDir = join(ctx.repoRoot, 'law/adr');
      const fixLog: AdrFixAttempt[] = [];

      // Pass A: diagnose via validator (covers files matching the
      // canonical `ADR-NNN-*.md` filename pattern).
      const before = validateAdrs({ adrsDir });

      // Pass B: scan for off-pattern .md files that nonetheless contain
      // valid ADR front-matter — these need filename normalization
      // (rename) before the validator can even see them.
      const offPatternCandidates: { file: string; adr_id: string; title: string }[] = [];
      if (existsSync(adrsDir)) {
        let entries: string[] = [];
        try {
          entries = readdirSync(adrsDir);
        } catch {
          entries = [];
        }
        for (const name of entries) {
          if (
            !name.endsWith('.md') ||
            ADR_CANONICAL_FILENAME_RE.test(name) ||
            name === 'README.md'
          ) {
            continue;
          }
          const abs = join(adrsDir, name);
          let body: string;
          try {
            body = readFileSync(abs, 'utf8');
          } catch {
            continue;
          }
          const m = ADR_FRONT_MATTER_RE.exec(body);
          if (m === null) continue;
          const fm = parseAdrFrontMatter(m[1] ?? '');
          const adrId = fm['adr_id'];
          const title = fm['title'];
          if (adrId === undefined || title === undefined) continue;
          if (!ADR_ID_RE.test(adrId)) continue;
          offPatternCandidates.push({ file: abs, adr_id: adrId, title });
        }
      }

      // Apply Pass-B renames first so the subsequent validator pass sees
      // the renamed files.
      const inGit = isInsideGitWorkTree(ctx.repoRoot);
      for (const cand of offPatternCandidates) {
        if (!inGit) {
          fixLog.push({ file: cand.file, outcome: 'rename-skipped-not-git' });
          continue;
        }
        const targetName = `${cand.adr_id}-${slugifyAdrTitle(cand.title)}.md`;
        const targetAbs = join(adrsDir, targetName);
        if (existsSync(targetAbs)) {
          fixLog.push({
            file: cand.file,
            outcome: 'rename-skipped-target-exists',
            detail: targetName,
          });
          continue;
        }
        const ok = gitMv(ctx.repoRoot, cand.file, targetAbs);
        if (ok) {
          fixLog.push({
            file: cand.file,
            outcome: 'renamed',
            detail: targetName,
          });
        } else {
          fixLog.push({
            file: cand.file,
            outcome: 'rename-skipped-not-git',
            detail: targetName,
          });
        }
      }

      // Pass C: handle in-pattern rename mismatches (validator reports
      // `filename ... does not start with adr_id '...'-`) and
      // missing-section findings. Process file-by-file so multiple
      // section-stub appends collapse into a single re-write.
      //
      // Re-run validator to get post-rename state. Missing sections etc.
      // are reported here, and any filename mismatches still present
      // (after Pass B) are reported as
      // `filename '<X>' does not start with adr_id '<Y>-'`.
      const mid = validateAdrs({ adrsDir });

      // Group errors by file for missing-section scaffolding.
      const missingSectionsByFile = new Map<string, string[]>();
      const inPatternRenamesByFile = new Map<string, string>(); // file -> adr_id
      for (const err of mid.errors) {
        const sectionMatch = /^body missing mandatory section '## ([^']+)'$/.exec(err.message);
        if (sectionMatch !== null) {
          const label = sectionMatch[1] ?? '';
          const arr = missingSectionsByFile.get(err.file) ?? [];
          // The validator labels Decision(s) as 'Decision(s)' — emit a
          // safe canonical heading instead.
          const canonical = label === 'Decision(s)' ? 'Decisions' : label;
          if (!arr.includes(canonical)) arr.push(canonical);
          missingSectionsByFile.set(err.file, arr);
          continue;
        }
        const renameMatch = /^filename '([^']+)' does not start with adr_id '([^']+)-'$/.exec(
          err.message,
        );
        if (renameMatch !== null) {
          const adrId = renameMatch[2] ?? '';
          if (ADR_ID_RE.test(adrId)) {
            inPatternRenamesByFile.set(err.file, adrId);
          }
          continue;
        }
        // Numbering gap, schema violation, missing front-matter, etc.
        if (/ADR numbering gap/.test(err.message)) {
          fixLog.push({
            file: err.file,
            outcome: 'escalate-numbering-gap',
            detail: err.message,
          });
          continue;
        }
        if (/missing YAML front-matter/.test(err.message)) {
          fixLog.push({
            file: err.file,
            outcome: 'escalate-malformed-front-matter',
            detail: err.message,
          });
          continue;
        }
        // Schema violations (including missing required adr_id) — we
        // can't synthesize an adr_id, so escalate.
        const isMissingAdrId =
          err.pointer === '' && /must have required property 'adr_id'/.test(err.message);
        if (isMissingAdrId || /required property/.test(err.message)) {
          fixLog.push({
            file: err.file,
            outcome: 'escalate-missing-adr-id',
            detail: err.message,
          });
          continue;
        }
        fixLog.push({
          file: err.file,
          outcome: 'escalate-schema-violation',
          detail: err.message,
        });
      }

      // Apply section-scaffolding fixes (idempotent: each stub adds the
      // missing header so the next validator pass no longer reports it).
      for (const [file, labels] of missingSectionsByFile.entries()) {
        for (const label of labels) {
          try {
            appendSectionStub(file, label);
            fixLog.push({
              file,
              outcome: 'section-scaffolded',
              detail: label,
            });
          } catch {
            fixLog.push({
              file,
              outcome: 'escalate-schema-violation',
              detail: `failed to append section '${label}'`,
            });
          }
        }
      }

      // Apply in-pattern filename renames. The file currently exists
      // under its old name (which matched the validator's ADR-NNN-*.md
      // shape but with the wrong NNN prefix). Compute the canonical
      // target from the front-matter title.
      for (const [file, adrId] of inPatternRenamesByFile.entries()) {
        if (!inGit) {
          fixLog.push({ file, outcome: 'rename-skipped-not-git' });
          continue;
        }
        let body: string;
        try {
          body = readFileSync(file, 'utf8');
        } catch {
          continue;
        }
        const m = ADR_FRONT_MATTER_RE.exec(body);
        const fm = m === null ? {} : parseAdrFrontMatter(m[1] ?? '');
        const title = fm['title'] ?? adrId;
        const targetName = `${adrId}-${slugifyAdrTitle(title)}.md`;
        const targetAbs = join(adrsDir, targetName);
        if (existsSync(targetAbs)) {
          fixLog.push({
            file,
            outcome: 'rename-skipped-target-exists',
            detail: targetName,
          });
          continue;
        }
        const ok = gitMv(ctx.repoRoot, file, targetAbs);
        if (ok) {
          fixLog.push({ file, outcome: 'renamed', detail: targetName });
        } else {
          fixLog.push({
            file,
            outcome: 'rename-skipped-not-git',
            detail: targetName,
          });
        }
      }

      const after = validateAdrs({ adrsDir });
      const status: 'pass' | 'fail' = after.errors.length === 0 ? 'pass' : 'fail';
      return {
        skill_id: 'SKILL-fix-adrs',
        status,
        evidence: {
          before,
          after,
          fix_log: fixLog,
          iteration: ctx.iteration,
        },
      };
    },
  };

  // =====================================================================
  // SKILL-fix-overrides — autofix (R11-W6.07, R2-Δ1 first batch).
  //
  // Diagnose: scan packages/** for `inv-override:` annotation blocks via
  // scanInvOverrides() (read-only behavior preserved).
  //
  // Autofix: detect *duplicate* inv-override blocks within the same source
  // file — two blocks with identical (invariant_id, reason, ticket,
  // expires, approver, adr) tuples. The duplicate (every occurrence
  // beyond the first) is removed. The OverrideRecord's `line` field is
  // used to locate each block; the block spans from the
  // `// inv-override:` header line through the contiguous `// field:`
  // comment lines that follow.
  //
  // Escalates (no autofix attempted): all other finding codes
  // ('malformed', 'expired', 'unknown-invariant', 'severity-forbids') and
  // non-duplicate override records.
  //
  // Idempotency: a second run after a successful dedupe finds no
  // duplicate blocks → returns pass with empty fix_log.
  // =====================================================================

  interface OverrideFixAttempt {
    readonly file: string;
    readonly invariant_id: string;
    readonly removed_at_line: number;
    readonly kept_at_line: number;
    readonly outcome: 'removed-duplicate';
  }

  /**
   * Compute the (exclusive) end line of an inv-override block starting
   * at `startLine0` (0-indexed). The block extends through subsequent
   * lines that are contiguous `// <field>: <value>` comments.
   */
  function overrideBlockEndExclusive(lines: readonly string[], startLine0: number): number {
    let i = startLine0 + 1;
    // Match field lines like `// reason: ...` etc. Stop at the first
    // non-matching line.
    const fieldRe = /^\s*\/\/\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*(.+?)\s*$/;
    while (i < lines.length && fieldRe.test(lines[i] ?? '')) i++;
    return i;
  }

  const skillFixOverrides: SkillEntry = {
    manifest: fixSkillManifest('overrides', {
      title: 'Autofix inv-overrides gate',
      autoFix: 'partial',
      summary:
        'Diagnose inv-override annotations; auto-delete duplicate override blocks (R11-W6.07; R2-Δ1 first batch).',
      tags: ['overrides', 'autofix'],
      mutation: {
        hostMutationPolicy: 'write_requires_flag',
        permissionTier: 'write',
        // R12 W3 (per ADR-FIREWALL-OVERLAPS-GLOB-AWARE + R11 W6.07 + R12 W2):
        // the autofix mutates files surfaced by `scanInvOverrides()`, whose
        // `DEFAULT_ROOTS = ['packages']` walk over `.ts/.tsx/.js/.jsx/.mjs/.cjs`
        // (inv-override/index.ts lines 65-66). Narrowing from
        // `**/*.{ts,tsx,...}` to `packages/**/*.{ts,tsx,js,jsx,mjs,cjs}`
        // qualifies under the W2-hardened `isAutofixSelfScope` (literal
        // `packages/` directory prefix before the first `**`, file-extension
        // restriction via the brace-alternation tail).
        allowedWriteScopes: ['packages/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
      },
    }),
    async run(ctx) {
      const before = scanInvOverrides({ repoRoot: ctx.repoRoot });
      // Build a key for duplicate detection: identical metadata within
      // the same file is a redundant override and safe to dedupe.
      type GroupedRec = { file: string; line: number; key: string; invariant_id: string };
      const byKey = new Map<string, GroupedRec[]>();
      for (const ovr of before.overrides) {
        const key = JSON.stringify({
          file: ovr.file,
          invariant_id: ovr.invariant_id,
          reason: ovr.reason,
          ticket: ovr.ticket,
          expires: ovr.expires,
          approver: ovr.approver,
          adr: ovr.adr ?? null,
        });
        const arr = byKey.get(key) ?? [];
        arr.push({ file: ovr.file, line: ovr.line, key, invariant_id: ovr.invariant_id });
        byKey.set(key, arr);
      }

      // Group duplicates by file so we can rewrite once per file with
      // line ranges sorted high-to-low (so deletions don't shift indices).
      interface FileEdit {
        readonly absPath: string;
        readonly removals: {
          readonly start0: number;
          readonly end0Exclusive: number;
          readonly invariant_id: string;
          readonly kept_at_line: number;
        }[];
      }
      const editsByFile = new Map<string, FileEdit>();
      const fixLog: OverrideFixAttempt[] = [];
      for (const group of byKey.values()) {
        if (group.length < 2) continue;
        // Sort by line ascending; keep the first, remove the rest.
        const sorted = [...group].sort((a, b) => a.line - b.line);
        const keep = sorted[0];
        if (keep === undefined) continue;
        for (let k = 1; k < sorted.length; k++) {
          const dup = sorted[k];
          if (dup === undefined) continue;
          const fileRel = dup.file;
          const absPath = join(ctx.repoRoot, fileRel);
          const existing = editsByFile.get(fileRel) ?? { absPath, removals: [] };
          existing.removals.push({
            start0: dup.line - 1,
            end0Exclusive: -1, // resolved at apply-time per file body
            invariant_id: dup.invariant_id,
            kept_at_line: keep.line,
          });
          editsByFile.set(fileRel, existing);
        }
      }

      // Apply edits per file. For each file: read once, compute end
      // lines, sort removals desc by start, splice out, write back.
      let anyChange = false;
      for (const [fileRel, edit] of editsByFile.entries()) {
        let body: string;
        try {
          body = readFileSync(edit.absPath, 'utf8');
        } catch {
          continue;
        }
        const lines = body.split('\n');
        const resolved = edit.removals
          .map((r) => ({
            ...r,
            end0Exclusive: overrideBlockEndExclusive(lines, r.start0),
          }))
          .sort((a, b) => b.start0 - a.start0); // delete from bottom up
        // Filter out collisions (defensive — two removals can't overlap
        // because each duplicate has a distinct line, but keep code
        // defensive).
        const seenRanges: { start0: number; end0Exclusive: number }[] = [];
        for (const r of resolved) {
          const overlaps = seenRanges.some(
            (s) => !(r.end0Exclusive <= s.start0 || r.start0 >= s.end0Exclusive),
          );
          if (overlaps) continue;
          seenRanges.push({ start0: r.start0, end0Exclusive: r.end0Exclusive });
          lines.splice(r.start0, r.end0Exclusive - r.start0);
          fixLog.push({
            file: fileRel,
            invariant_id: r.invariant_id,
            removed_at_line: r.start0 + 1,
            kept_at_line: r.kept_at_line,
            outcome: 'removed-duplicate',
          });
        }
        writeFileSync(edit.absPath, lines.join('\n'));
        anyChange = true;
      }

      const after = anyChange ? scanInvOverrides({ repoRoot: ctx.repoRoot }) : before;
      // Status: pass when the gate (findings.length === 0) holds AND the
      // diagnose verdict is now clean. Since duplicate-only autofix
      // doesn't address findings (malformed/expired/etc.), a file that
      // had findings before still fails after — we don't claim to fix
      // those.
      const status: 'pass' | 'fail' = after.findings.length === 0 ? 'pass' : 'fail';
      return {
        skill_id: 'SKILL-fix-overrides',
        status,
        evidence: {
          before,
          after,
          fix_log: fixLog,
          iteration: ctx.iteration,
        },
      };
    },
  };

  // =====================================================================
  // Round-loop skills (DEVAI R2: promoted from SGP's sgp-round-* family).
  //
  // These are workflow-kind composers — each emits a *plan* describing
  // the steps a round-runner (human or agent) executes. They do not
  // themselves execute the inner work; the loop is driven by the
  // SKILL-round-execute dispatcher (renamed from SKILL-round-loop in
  // R3-W2; sgp-round-loop equivalent) reading the round-prompts library
  // at docs/adopters/round-prompts/.
  //
  // The composition is: SKILL-round-execute → audit → backlog →
  // orchestrate → verify-publish. Each round materializes under
  // work/rounds/R-NNNN/.
  // =====================================================================

  return [
    skillFixTypecheck,
    skillFixCoverage,
    skillFixMutation,
    skillFixSpecValidate,
    skillFixActionCoverage,
    skillFixDocsLinks,
    skillFixPromptOverlays,
    skillFixForbiddenActions,
    skillFixAdrs,
    skillFixOverrides,
  ];
}
