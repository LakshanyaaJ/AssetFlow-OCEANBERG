import { PoolClient } from 'pg';
import { pool } from '../config/db';

export interface NotificationInput {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'approval' | 'overdue';
  entityType?: string;
  entityId?: number;
}

/** Create a notification for one user (optionally inside a transaction). */
export async function notifyUser(
  userId: number,
  n: NotificationInput,
  client?: PoolClient,
): Promise<void> {
  const runner = client ?? pool;
  await runner.query(
    `INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, n.title, n.message, n.type ?? 'info', n.entityType ?? null, n.entityId ?? null],
  );
}

/**
 * Notify every active user whose role carries a permission —
 * used to fan out approval requests (e.g. all 'transfer.approve' holders).
 */
export async function notifyPermissionHolders(
  permissionCode: string,
  n: NotificationInput,
  client?: PoolClient,
): Promise<void> {
  const runner = client ?? pool;
  await runner.query(
    `INSERT INTO notifications (user_id, title, message, n_type, entity_type, entity_id)
     SELECT u.id, $2, $3, $4, $5, $6
     FROM users u
     JOIN role_permissions rp ON rp.role_id = u.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE p.code = $1 AND u.is_active`,
    [permissionCode, n.title, n.message, n.type ?? 'approval', n.entityType ?? null, n.entityId ?? null],
  );
}
