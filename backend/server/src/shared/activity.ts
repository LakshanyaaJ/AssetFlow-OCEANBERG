import { PoolClient } from 'pg';
import { pool } from '../config/db';

export interface ActivityEntry {
  userId?: number | null;
  action: string; // e.g. 'asset.allocate'
  entityType: string; // e.g. 'asset'
  entityId?: number | null;
  details?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Append to the immutable activity log. Pass the transaction client when the
 * log entry must commit/rollback atomically with the business change.
 */
export async function logActivity(entry: ActivityEntry, client?: PoolClient): Promise<void> {
  const runner = client ?? pool;
  await runner.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      entry.userId ?? null,
      entry.action,
      entry.entityType,
      entry.entityId ?? null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ip ?? null,
    ],
  );
}
