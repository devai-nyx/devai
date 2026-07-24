import { createHash } from 'node:crypto';
import { Client } from 'pg';
import { createDbCapabilities } from '@devai-nyx/authority';
import type { AcquireLockOptions, AcquireResult, LockRecord } from './locks.js';

/**
 * Phase-9 Batch 9.G — Postgres advisory-lock backend.
 *
 * The Batch-A file-lock implementation is correct WITHIN a single
 * filesystem. For multi-host / multi-container deployments the locks
 * must live somewhere external both processes can see. Postgres
 * advisory locks (pg_try_advisory_lock) are the canonical answer:
 * session-scoped, atomic, cleaned up automatically on disconnect.
 *
 * Trade-offs vs file locks:
 *   - Requires a live Postgres connection per call (cheap if the
 *     orchestrator keeps a connection open; expensive in
 *     shell-one-shot mode). Phase 10 can pool.
 *   - Locks are session-scoped: the holder MUST keep the Client
 *     alive for the lifetime of the work. We use a long-lived
 *     persistent client per process owned by the orchestrator.
 *
 * For Phase-9 MVP, this module exposes a SESSIONLESS variant that
 * uses pg_advisory_lock + a small `devai_locks` table for record-
 * keeping (TTL tracked via timestamp; the table is the source of
 * truth across processes). The actual advisory-lock semantics are
 * preserved by inserting under `pg_try_advisory_xact_lock` in a
 * transaction that immediately commits — atomic acquire-or-fail.
 */

const LOCK_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS devai_locks (
  substrate   TEXT NOT NULL,
  module_id   TEXT NOT NULL,
  task_id     TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ttl_ms      BIGINT NOT NULL,
  PRIMARY KEY (substrate, module_id)
);
`;

const DEFAULT_TTL_MS = 60 * 60 * 1000;

export interface PgLocksOptions {
  /** Postgres URL. The caller is responsible for connectivity. */
  readonly databaseUrl: string;
}

function targetKey(substrate: string, modulePart: string): bigint {
  // Map (substrate, module) to a stable signed-int8 for pg_try_advisory_xact_lock.
  // pg_try_advisory_xact_lock takes a bigint; hash → first 8 hex chars
  // bit-shifted to ensure it fits.
  const digest = createHash('sha256').update(`${substrate}:${modulePart}`).digest('hex');
  const high = BigInt('0x' + digest.slice(0, 8));
  // Truncate to signed 64-bit range (postgres bigint is signed).
  // Take low 63 bits to stay positive — collisions are still vanishingly rare.
  return high & 0x7fffffffn;
}

/**
 * Postgres-backed acquireLocks. Same API + return shape as the
 * filesystem version in locks.ts. Errors connect through the same
 * AcquireResult.denied list with held_by:'<pg-error>' on connection
 * failures, so the caller can route around them.
 */
export async function acquirePgLocks(
  opts: AcquireLockOptions & PgLocksOptions,
): Promise<AcquireResult> {
  const acquired: LockRecord[] = [];
  const denied: { target: string; held_by: string }[] = [];
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const now = new Date().toISOString();

  const client = new Client({ connectionString: opts.databaseUrl });
  const db = createDbCapabilities(client);
  try {
    await client.connect();
  } catch (err) {
    // Connection failed → everything denied with a pg-error tag.
    const tag = `<pg-error: ${err instanceof Error ? err.message : String(err)}>`;
    return {
      acquired,
      denied: opts.targets.map((t) => ({ target: t, held_by: tag })),
    };
  }

  try {
    await db.write.query(LOCK_TABLE_SQL);
    // Reap expired entries first. Expired = acquired_at + ttl_ms < now.
    await db.write.query(
      "DELETE FROM devai_locks WHERE acquired_at + (ttl_ms::bigint * INTERVAL '1 ms') < now()",
    );

    for (const target of opts.targets) {
      const [substrate = 'F2', ...rest] = target.split(':');
      const modulePart = rest.join(':');
      const key = targetKey(substrate, modulePart);
      // Try a transaction-scoped advisory lock + INSERT.
      await db.write.query('BEGIN');
      const advRes = await db.write.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock($1) AS locked',
        [key.toString()],
      );
      if (advRes.rows[0]?.locked !== true) {
        await db.write.query('ROLLBACK');
        const existing = await db.write.query<{ task_id: string }>(
          'SELECT task_id FROM devai_locks WHERE substrate = $1 AND module_id = $2',
          [substrate, modulePart],
        );
        denied.push({ target, held_by: existing.rows[0]?.task_id ?? '<unknown>' });
        continue;
      }
      // We hold the advisory lock for this txn; insert the bookkeeping
      // row. Conflict means someone holds the table-level record
      // (should not happen if the advisory lock was atomic; defensive
      // path: rollback and deny).
      try {
        await db.write.query(
          'INSERT INTO devai_locks (substrate, module_id, task_id, ttl_ms) VALUES ($1, $2, $3, $4)',
          [substrate, modulePart, opts.taskId, ttlMs],
        );
        await db.write.query('COMMIT');
        acquired.push({
          task_id: opts.taskId,
          substrate,
          module: modulePart,
          acquired_at: now,
          ttl_ms: ttlMs,
        });
      } catch (err) {
        await db.write.query('ROLLBACK');
        denied.push({
          target,
          held_by: `<insert-error: ${err instanceof Error ? err.message : String(err)}>`,
        });
      }
    }
  } finally {
    await client.end();
  }
  return { acquired, denied };
}

/**
 * Release every lock held by a task in Postgres. Sessionless;
 * uses the table-as-source-of-truth (the advisory-lock side is
 * txn-scoped and auto-released on COMMIT).
 */
export async function releasePgLocks(opts: {
  databaseUrl: string;
  taskId: string;
}): Promise<readonly LockRecord[]> {
  const client = new Client({ connectionString: opts.databaseUrl });
  const db = createDbCapabilities(client);
  await client.connect();
  try {
    await db.write.query(LOCK_TABLE_SQL);
    const r = await db.write.query<{
      substrate: string;
      module_id: string;
      task_id: string;
      acquired_at: Date;
      ttl_ms: string;
    }>(
      'SELECT substrate, module_id, task_id, acquired_at, ttl_ms FROM devai_locks WHERE task_id = $1',
      [opts.taskId],
    );
    await db.write.query('DELETE FROM devai_locks WHERE task_id = $1', [opts.taskId]);
    return r.rows.map((row) => ({
      task_id: row.task_id,
      substrate: row.substrate,
      module: row.module_id,
      acquired_at: row.acquired_at.toISOString(),
      ttl_ms: Number(row.ttl_ms),
    }));
  } finally {
    await client.end();
  }
}

export async function listPgLocks(opts: { databaseUrl: string }): Promise<readonly LockRecord[]> {
  const client = new Client({ connectionString: opts.databaseUrl });
  const db = createDbCapabilities(client);
  await client.connect();
  try {
    await db.write.query(LOCK_TABLE_SQL);
    const r = await db.write.query<{
      substrate: string;
      module_id: string;
      task_id: string;
      acquired_at: Date;
      ttl_ms: string;
    }>(
      'SELECT substrate, module_id, task_id, acquired_at, ttl_ms FROM devai_locks ORDER BY task_id',
    );
    return r.rows.map((row) => ({
      task_id: row.task_id,
      substrate: row.substrate,
      module: row.module_id,
      acquired_at: row.acquired_at.toISOString(),
      ttl_ms: Number(row.ttl_ms),
    }));
  } finally {
    await client.end();
  }
}
