import { spawnSync, writeFileSync } from '@devai-nyx/authority';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
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
  // SKILL-fix-docs-links is diagnose-only. Documentation is Architect-owned;
  // the skill may report link findings but cannot rewrite authored Markdown.
  interface BrokenDocsLink {
    readonly source: string;
    readonly target: string;
    readonly resolved: string;
    readonly reason: 'target not found';
  }

  function diagnoseDocsLinks(repoRoot: string, scanRel: string): BrokenDocsLink[] {
    const scanRoot = isAbsolute(scanRel) ? scanRel : resolve(repoRoot, scanRel);
    if (!existsSync(scanRoot)) return [];
    const markdown: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        if (['node_modules', '.git', 'dist', 'coverage'].includes(name)) continue;
        const path = join(dir, name);
        const stat = statSync(path);
        if (stat.isDirectory()) walk(path);
        else if (stat.isFile() && path.endsWith('.md')) markdown.push(path);
      }
    };
    walk(scanRoot);
    const findings: BrokenDocsLink[] = [];
    const link = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu;
    for (const file of markdown) {
      const source = readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;
      while ((match = link.exec(source)) !== null) {
        const target = match[1];
        if (
          target === undefined ||
          ['http://', 'https://', 'mailto:', 'data:', '#'].some((prefix) =>
            target.startsWith(prefix),
          )
        ) {
          continue;
        }
        const pathPart = target.split('#')[0]?.split('?')[0] ?? '';
        if (pathPart.length === 0) continue;
        const absolute = isAbsolute(pathPart) ? pathPart : resolve(dirname(file), pathPart);
        if (!existsSync(absolute)) {
          findings.push({
            source: relative(repoRoot, file),
            target,
            resolved: relative(repoRoot, absolute),
            reason: 'target not found',
          });
        }
      }
    }
    return findings;
  }

  const skillFixDocsLinks: SkillEntry = {
    manifest: fixSkillManifest('docs-links', {
      title: 'Diagnose docs-links gate',
      authorityRole: 'architect',
      autoFix: 'none',
      summary: 'Diagnose broken documentation links without mutating Architect-owned files.',
      tags: ['docs-links', 'diagnose'],
    }),
    async run(ctx) {
      const broken = diagnoseDocsLinks(
        ctx.repoRoot,
        (ctx.inputs?.['dir'] as string | undefined) ?? 'docs',
      );
      return {
        skill_id: 'SKILL-fix-docs-links',
        status: broken.length === 0 ? 'pass' : 'fail',
        evidence: { ok: broken.length === 0, broken_count: broken.length, broken },
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
  // SKILL-fix-adrs is deliberately diagnose-only. ADR authorship and lifecycle
  // mutation belong directly to the Architect; an agent skill may report validator
  // findings but may not append sections, rename files, or claim law/adr scope.
  const skillFixAdrs: SkillEntry = {
    manifest: fixSkillManifest('adrs', {
      title: 'Diagnose ADRs gate',
      authorityRole: 'architect',
      autoFix: 'none',
      summary: 'Diagnose the ADR validation gate without mutating governed law.',
      tags: ['adrs', 'diagnose'],
    }),
    async run(ctx) {
      const result = validateAdrs({ adrsDir: join(ctx.repoRoot, 'law/adr') });
      return {
        skill_id: 'SKILL-fix-adrs',
        status: result.errors.length === 0 ? 'pass' : 'fail',
        evidence: result,
      };
    },
  };
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
