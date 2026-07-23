// @devai-nyx/schemas — successor validator machinery (wireframe).
// W02.c: lazy per-schema compilation — compile on first access, never eagerly.
// Schemas are authored in law/schemas/ (canonical); the build stages copies into
// dist (prepack pattern). The wireframe resolves the authored tree directly.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROSTER, type SchemaName } from './roster.js';

const SCHEMAS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'law', 'schemas');

const ajv = new Ajv2020({ strict: false });
addFormats(ajv);

const rawCache = new Map<SchemaName, Record<string, unknown>>();
export function loadSchema(name: SchemaName): Record<string, unknown> {
  let s = rawCache.get(name);
  if (!s) {
    s = JSON.parse(readFileSync(join(SCHEMAS_DIR, name), 'utf8')) as Record<string, unknown>;
    rawCache.set(name, s);
  }
  return s;
}

let commonRegistered = false;
function ensureCommon(): void {
  if (!commonRegistered) {
    ajv.addSchema(loadSchema('common-defs.schema.json'), 'common-defs.schema.json');
    ajv.addSchema(loadSchema('record-meta.schema.json'), 'record-meta.schema.json');
    commonRegistered = true;
  }
}

const compiled = new Map<SchemaName, ReturnType<typeof ajv.compile>>();
export function getValidator(name: SchemaName) {
  let v = compiled.get(name);
  if (!v) {
    if (!(ROSTER as readonly string[]).includes(name)) throw new Error(`unregistered schema: ${name}`);
    ensureCommon();
    v = name === 'common-defs.schema.json' || name === 'record-meta.schema.json'
      ? ajv.getSchema(name) ?? ajv.compile(loadSchema(name))
      : ajv.compile(loadSchema(name));
    compiled.set(name, v);
  }
  return v;
}

export function listSchemaFiles(): string[] {
  return readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.schema.json')).sort();
}

// --- the meta-schema gate (improvement 6, declarative half) ---
export interface MetaGateReport { compliant: string[]; noncompliant: { name: string; errors: string[] }[] }
export function metaGate(): MetaGateReport {
  const meta = getValidator('meta.schema.json');
  const report: MetaGateReport = { compliant: [], noncompliant: [] };
  for (const name of ROSTER) {
    if (name === 'meta.schema.json' ? false : false) continue;
    if (meta(loadSchema(name))) report.compliant.push(name);
    else report.noncompliant.push({ name, errors: (meta.errors ?? []).map((e) => `${e.instancePath} ${e.message}`) });
  }
  return report;
}

// --- check-schemas canon linter (improvement 6, recursive half — first slice) ---
const VERDICT_SETS = [
  JSON.stringify(['pass', 'review', 'fail']),
  JSON.stringify(['PASS', 'REVIEW', 'FAIL']),
];
export interface CanonFinding { schema: string; rule: string; path: string }
export function checkSchemas(): CanonFinding[] {
  const findings: CanonFinding[] = [];
  const walk = (name: string, node: unknown, path: string): void => {
    if (Array.isArray(node)) { node.forEach((v, i) => walk(name, v, `${path}[${i}]`)); return; }
    if (node === null || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    // rule: closed-world — any schema node declaring properties must close additionalProperties
    if (o['properties'] !== undefined && o['additionalProperties'] === undefined && path !== '$root') {
      findings.push({ schema: name, rule: 'open-world-object', path });
    }
    // rule: no restated verdict vocabulary outside common-defs
    if (name !== 'common-defs.schema.json' && Array.isArray(o['enum'])) {
      const e = JSON.stringify([...(o['enum'] as unknown[])].sort());
      if (VERDICT_SETS.includes(e)) findings.push({ schema: name, rule: 'restated-verdict-enum', path });
    }
    for (const [k, v] of Object.entries(o)) walk(name, v, `${path}/${k}`);
  };
  for (const name of ROSTER) {
    if (name === 'common-defs.schema.json') continue;
    walk(name, loadSchema(name), '$root');
  }
  return findings;
}
