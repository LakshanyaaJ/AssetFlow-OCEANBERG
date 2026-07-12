import { PoolClient } from 'pg';
import { ApiError } from '../utils/ApiError';

export type AssetStatus =
  | 'available'
  | 'allocated'
  | 'in_transfer'
  | 'under_maintenance'
  | 'retired'
  | 'lost';

/**
 * Asset lifecycle state machine. Every status change in the system goes
 * through changeAssetStatus() — there is no other write path to assets.status.
 *
 *   available ⇄ allocated
 *   available ⇄ in_transfer
 *   available ⇄ under_maintenance (also reachable from allocated)
 *   available → retired | lost;  lost → available (found)
 */
const TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  available: ['allocated', 'in_transfer', 'under_maintenance', 'retired', 'lost'],
  allocated: ['available', 'under_maintenance', 'lost'],
  in_transfer: ['available', 'lost'],
  under_maintenance: ['available', 'retired'],
  retired: [],
  lost: ['available'],
};

export function assertTransition(from: AssetStatus, to: AssetStatus): void {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw ApiError.conflict(`Invalid asset lifecycle transition: ${from} → ${to}`);
  }
}

/**
 * Atomically transition an asset's lifecycle state inside an open transaction.
 * Row-locks the asset (FOR UPDATE) so concurrent workflows serialize, validates
 * the transition, updates the status and appends to asset_status_history.
 * Returns the previous status.
 */
export async function changeAssetStatus(
  client: PoolClient,
  assetId: number,
  to: AssetStatus,
  changedBy: number,
  reason: string,
  expectedFrom?: AssetStatus,
): Promise<AssetStatus> {
  const result = await client.query<{ status: AssetStatus }>(
    `SELECT status FROM assets WHERE id = $1 FOR UPDATE`,
    [assetId],
  );
  const current = result.rows[0]?.status;
  if (!current) throw ApiError.notFound('Asset');
  if (expectedFrom && current !== expectedFrom) {
    throw ApiError.conflict(`Asset is '${current}', expected '${expectedFrom}'`);
  }
  assertTransition(current, to);

  await client.query(`UPDATE assets SET status = $2 WHERE id = $1`, [assetId, to]);
  await client.query(
    `INSERT INTO asset_status_history (asset_id, from_status, to_status, reason, changed_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [assetId, current, to, reason, changedBy],
  );
  return current;
}
