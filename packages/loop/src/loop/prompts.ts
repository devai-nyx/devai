import { createHash } from 'node:crypto';

/** Layer enum per prompt-composition.schema.json. */
export type PromptLayer = 'global' | 'role' | 'discipline' | 'task' | 'payload' | 'overlay';

export interface PromptComponentInput {
  /** Where in the stack this component sits (schema-required). */
  readonly layer: PromptLayer;
  /** Canonical name (e.g. 'engineer.role', 'task.feedback'). */
  readonly name: string;
  /** Component body text. Will be hashed; not retained on the emit object. */
  readonly body: string;
  /** Optional registry/path key. */
  readonly source?: string;
}

export interface PromptComponentRecord {
  layer: PromptLayer;
  name: string;
  source?: string;
  body_sha256: string;
  body_length: number;
}

export interface PromptWarning {
  code: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface PromptComposition {
  schemaVersion: '1.0.0';
  id: string; // PC-<16hex>
  generated_at: string;
  task_id: string; // TASK-...
  model_target?: {
    family?: 'claude' | 'codex' | 'other';
    model?: string;
    tier?: 'default' | 'bumped' | 'fallback';
  };
  components: PromptComponentRecord[];
  stack_sha256: string;
  warnings?: PromptWarning[];
  frozen_against?: string | null;
  drift_from_frozen?: boolean;
}

/**
 * Compose a deterministic prompt stack (Article 37).
 *
 * The id is the first 16 hex chars of stack_sha256. The stack hash is
 * sha256 over the canonical sequence
 *   `${layer}|${name}|${body_sha256}\n` for each component, in order.
 * Same components in the same order → identical id, regardless of
 * timestamp.
 */
export function composePrompt(opts: {
  readonly task_id: string;
  readonly components: readonly PromptComponentInput[];
  readonly timestamp: string;
  readonly model_target?: PromptComposition['model_target'];
}): PromptComposition {
  if (!/^TASK-/.test(opts.task_id)) {
    throw new Error(
      `composePrompt: task_id must match pattern ^TASK- (per prompt-composition.schema.json); got '${opts.task_id}'`,
    );
  }
  const componentRecords: PromptComponentRecord[] = opts.components.map((c) => ({
    layer: c.layer,
    name: c.name,
    body_sha256: createHash('sha256').update(c.body).digest('hex'),
    body_length: Buffer.byteLength(c.body, 'utf8'),
    ...(c.source !== undefined && { source: c.source }),
  }));
  const canonical = componentRecords.map((c) => `${c.layer}|${c.name}|${c.body_sha256}`).join('\n');
  const stack_sha256 = createHash('sha256').update(canonical).digest('hex');
  const id = `PC-${stack_sha256.slice(0, 16)}`;
  const result: PromptComposition = {
    schemaVersion: '1.0.0',
    id,
    generated_at: opts.timestamp,
    task_id: opts.task_id,
    components: componentRecords,
    stack_sha256,
  };
  if (opts.model_target !== undefined) result.model_target = opts.model_target;
  return result;
}

export interface PromptDiff {
  readonly equal: boolean;
  readonly changed_components: string[];
  readonly added: string[];
  readonly removed: string[];
  readonly a_id: string;
  readonly b_id: string;
}

export function diffPrompts(a: PromptComposition, b: PromptComposition): PromptDiff {
  const aMap = new Map(a.components.map((c) => [c.name, c.body_sha256]));
  const bMap = new Map(b.components.map((c) => [c.name, c.body_sha256]));
  const changed: string[] = [];
  const removed: string[] = [];
  for (const [name, hashA] of aMap) {
    const hashB = bMap.get(name);
    if (hashB === undefined) removed.push(name);
    else if (hashB !== hashA) changed.push(name);
  }
  const added: string[] = [];
  for (const name of bMap.keys()) {
    if (!aMap.has(name)) added.push(name);
  }
  return {
    equal: a.stack_sha256 === b.stack_sha256,
    changed_components: changed.sort(),
    added: added.sort(),
    removed: removed.sort(),
    a_id: a.id,
    b_id: b.id,
  };
}

/**
 * Freeze a prompt composition for governed loops (Article 37). The
 * frozen artifact is itself a PromptComposition with `frozen_against`
 * pointing to its own id (i.e., it is its own reference). Subsequent
 * compositions compute `drift_from_frozen` by comparing stack_sha256.
 */
export function freezePrompt(composition: PromptComposition): PromptComposition {
  return {
    ...composition,
    frozen_against: composition.id,
    drift_from_frozen: false,
  };
}
