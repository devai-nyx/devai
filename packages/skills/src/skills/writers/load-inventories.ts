import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Phase 17.F: shared helper used by every SKILL-write-* writer skill.
 *
 * Reads the inventory sensor bodies under `record/derived/inventory/`
 * (emitted by the 7 sensors of Phase 17.C) and packages them into a
 * single structured input for prompt composition. Each field is
 * `null` if the corresponding sensor has not yet run.
 *
 * Loaders intentionally type the bodies as `unknown` — writer skills
 * compose against the public schema shape but do not rely on
 * generated TypeScript types here (keeps the writer surface decoupled
 * from per-sensor evolutions inside 17.C). Heavy unstructured strings
 * (e.g. dep-graph adjacency lists) are summarized for prompt budget
 * before being shown to the LLM.
 *
 * Per Constitution Article 32 (sensor adapter uniformity); per D-57.
 */

export interface LoadedInventories {
  /** api-map.schema.json body */
  readonly apiMap: unknown | null;
  /** routes-inventory.schema.json body */
  readonly routesInventory: unknown | null;
  /** data-model-inventory.schema.json body (from inventory_data_model) */
  readonly dataModel: unknown | null;
  /** data-model-inventory.schema.json body (from inventory_data_handling — same shape, PII-augmented) */
  readonly dataHandling: unknown | null;
  /** rbac-inventory.schema.json body */
  readonly rbac: unknown | null;
  /** coverage-matrix.schema.json body */
  readonly coverageMatrix: unknown | null;
  /** dep-graph.schema.json body */
  readonly depGraph: unknown | null;
  /** repo-introspection.schema.json body (Phase 11.D) */
  readonly introspection: unknown | null;
  /** project-config.schema.json body (Phase 10.J) */
  readonly projectConfig: unknown | null;
}

const PATHS = {
  apiMap: 'record/derived/inventory/inventory_api/api-map.json',
  routesInventory: 'record/derived/inventory/inventory_routes/routes-react.json',
  dataModel: 'record/derived/inventory/inventory_data_model/data-model.json',
  dataHandling: 'record/derived/inventory/inventory_data_handling/data-model-pii.json',
  rbac: 'record/derived/inventory/inventory_rbac/rbac.json',
  coverageMatrix: 'record/derived/inventory/inventory_coverage/coverage-matrix.json',
  depGraph: 'record/derived/inventory/inventory_dep_graph/dep-graph.json',
  introspection: '.devai/state/init-introspection.json',
  projectConfig: '.devai/config/project.json',
} as const;

function readJson(absPath: string): unknown | null {
  if (!existsSync(absPath)) return null;
  try {
    return JSON.parse(readFileSync(absPath, 'utf8'));
  } catch {
    return null;
  }
}

export interface LoadInventoriesOptions {
  readonly repoRoot: string;
  /** Per-kind path overrides (used by tests). */
  readonly overrides?: Partial<Record<keyof typeof PATHS, string>>;
}

/**
 * D-A-37 — framework-aware fallback for routesInventory.
 * Mirrors the resolution in senseInventoryCoverage: if the React-default
 * body is missing, glob `routes-*.json` and pick the first existing
 * (preferring routes-react.json when multiple). Adopters whose sense-routes
 * wrote `routes-angular.json` (or similar) no longer silently see
 * routesInventory=null in writer-skill prompts.
 */
function resolveRoutesInventoryPath(repoRoot: string, defaultRel: string): string {
  const defaultAbs = join(repoRoot, defaultRel);
  if (existsSync(defaultAbs)) return defaultAbs;
  const dir = join(repoRoot, 'record/derived/inventory/inventory_routes');
  if (!existsSync(dir)) return defaultAbs;
  try {
    const candidates = readdirSync(dir).filter((n) => /^routes-[^.]+\.json$/.test(n));
    if (candidates.length === 0) return defaultAbs;
    if (candidates.length === 1) return join(dir, candidates[0] as string);
    if (candidates.includes('routes-react.json')) return join(dir, 'routes-react.json');
    candidates.sort();
    return join(dir, candidates[0] as string);
  } catch {
    return defaultAbs;
  }
}

export function loadInventories(opts: LoadInventoriesOptions): LoadedInventories {
  const get = (key: keyof typeof PATHS): unknown | null => {
    const override = opts.overrides?.[key];
    if (override !== undefined) return readJson(override);
    const defaultPath = join(opts.repoRoot, PATHS[key]);
    // D-A-37: framework-aware fallback for the routes inventory.
    const path =
      key === 'routesInventory'
        ? resolveRoutesInventoryPath(opts.repoRoot, PATHS[key])
        : defaultPath;
    return readJson(path);
  };
  return {
    apiMap: get('apiMap'),
    routesInventory: get('routesInventory'),
    dataModel: get('dataModel'),
    dataHandling: get('dataHandling'),
    rbac: get('rbac'),
    coverageMatrix: get('coverageMatrix'),
    depGraph: get('depGraph'),
    introspection: get('introspection'),
    projectConfig: get('projectConfig'),
  };
}

/**
 * Build a token-bounded summary of the inventories suitable for
 * embedding in a writer prompt payload. Heavy data (dep-graph
 * adjacency, full column lists) is replaced with cardinality + sample
 * entries so the LLM sees enough to write coherently without
 * blowing prompt budget.
 *
 * Output is a stable, sorted, deterministic JSON string suitable for
 * use as the `payload` component of a PromptComposition.
 */
export function summarizeForPrompt(inv: LoadedInventories): string {
  const summary: Record<string, unknown> = {};

  if (inv.projectConfig !== null) summary.project_config = inv.projectConfig;
  if (inv.introspection !== null) summary.introspection = inv.introspection;

  if (inv.apiMap !== null) {
    const ap = inv.apiMap as {
      endpoints?: ReadonlyArray<{ method: string; path: string; controller?: { class?: string } }>;
      stack?: unknown;
    };
    summary.api = {
      endpoint_count: ap.endpoints?.length ?? 0,
      sample_endpoints: (ap.endpoints ?? []).slice(0, 20).map((e) => ({
        method: e.method,
        path: e.path,
        controller: e.controller?.class,
      })),
      ...(ap.stack !== undefined && { stack: ap.stack }),
    };
  }

  if (inv.routesInventory !== null) {
    const ri = inv.routesInventory as {
      framework?: string;
      routes?: ReadonlyArray<{ path: string; component?: { name?: string } }>;
    };
    summary.routes = {
      framework: ri.framework,
      route_count: ri.routes?.length ?? 0,
      sample_routes: (ri.routes ?? []).slice(0, 20).map((r) => ({
        path: r.path,
        component: r.component?.name,
      })),
    };
  }

  if (inv.dataModel !== null) {
    const dm = inv.dataModel as {
      dialect?: string;
      tables?: ReadonlyArray<{
        name: string;
        columns: ReadonlyArray<{ name: string; type: string }>;
        foreign_keys?: unknown[];
      }>;
    };
    summary.data_model = {
      dialect: dm.dialect,
      table_count: dm.tables?.length ?? 0,
      column_count: (dm.tables ?? []).reduce((acc, t) => acc + t.columns.length, 0),
      foreign_key_count: (dm.tables ?? []).reduce(
        (acc, t) => acc + (t.foreign_keys?.length ?? 0),
        0,
      ),
      tables: (dm.tables ?? []).slice(0, 30).map((t) => ({
        name: t.name,
        column_names: t.columns.map((c) => c.name),
      })),
    };
  }

  if (inv.dataHandling !== null) {
    const dh = inv.dataHandling as {
      tables?: ReadonlyArray<{
        name: string;
        columns: ReadonlyArray<{
          name: string;
          pii_class?: string;
          legal_basis?: string;
          retention?: string;
        }>;
      }>;
    };
    const piiColumns: Array<{
      table: string;
      column: string;
      pii_class: string;
      missing: string[];
    }> = [];
    for (const t of dh.tables ?? []) {
      for (const c of t.columns) {
        if (c.pii_class === undefined || c.pii_class === '') continue;
        const missing: string[] = [];
        if (c.legal_basis === undefined || c.legal_basis === '') missing.push('legal_basis');
        if (c.retention === undefined || c.retention === '') missing.push('retention');
        piiColumns.push({ table: t.name, column: c.name, pii_class: c.pii_class, missing });
      }
    }
    summary.data_handling = {
      pii_column_count: piiColumns.length,
      pii_columns: piiColumns.slice(0, 50),
    };
  }

  if (inv.rbac !== null) {
    const r = inv.rbac as { rbacIlfTables?: readonly string[]; stats?: unknown };
    summary.rbac = {
      ilf_tables: r.rbacIlfTables ?? [],
      ...(r.stats !== undefined && { stats: r.stats }),
    };
  }

  if (inv.coverageMatrix !== null) {
    const c = inv.coverageMatrix as {
      stats?: unknown;
      unmapped?: { routes?: readonly string[]; endpoints?: readonly string[] };
    };
    summary.coverage = {
      ...(c.stats !== undefined && { stats: c.stats }),
      unmapped_route_count: c.unmapped?.routes?.length ?? 0,
      unmapped_endpoint_count: c.unmapped?.endpoints?.length ?? 0,
    };
  }

  if (inv.depGraph !== null) {
    const dg = inv.depGraph as { graph?: Record<string, readonly string[]> };
    const entries = Object.entries(dg.graph ?? {});
    summary.dep_graph = {
      node_count: entries.length,
      edge_count: entries.reduce((acc, [, tos]) => acc + tos.length, 0),
    };
  }

  return JSON.stringify(summary, null, 2);
}

export function hasAnyInventory(inv: LoadedInventories): boolean {
  return (
    inv.apiMap !== null ||
    inv.routesInventory !== null ||
    inv.dataModel !== null ||
    inv.dataHandling !== null ||
    inv.rbac !== null ||
    inv.coverageMatrix !== null ||
    inv.depGraph !== null ||
    inv.introspection !== null ||
    inv.projectConfig !== null
  );
}
