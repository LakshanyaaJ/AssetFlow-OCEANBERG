import { PoolClient } from 'pg';
import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.name, t.location_id, l.name AS location_name,
         t.status, t.starts_on, t.ends_on,
         t.created_by, u.full_name AS created_by_name, t.created_at,
         (SELECT count(*)::int FROM audit_items i WHERE i.audit_cycle_id = t.id) AS total_items,
         (SELECT count(*)::int FROM audit_items i
           WHERE i.audit_cycle_id = t.id AND i.status <> 'pending') AS checked_items
  FROM audit_cycles t
  LEFT JOIN locations l ON l.id = t.location_id
  JOIN users u ON u.id = t.created_by`;

export const auditsRepository = {
  async list(params: ListParams) {
    const { where, orderLimit, values } = buildListClause(params, ['t.name', 'l.name']);
    const rows = await query(`${BASE_SELECT} ${where} ${orderLimit}`, values);
    const totalRow = await queryOne<{ total: number }>(
      `SELECT count(*)::int AS total FROM (${BASE_SELECT} ${where}) sub`,
      values.slice(0, -2),
    );
    return { rows, total: totalRow?.total ?? 0 };
  },

  findById(id: number) {
    return queryOne(`${BASE_SELECT} WHERE t.id = $1`, [id]);
  },

  listItems(cycleId: number) {
    return query(
      `SELECT i.id, i.asset_id, a.asset_tag, a.name AS asset_name, a.status AS asset_status,
              i.expected_location_id, l.name AS expected_location_name,
              i.status, i.remarks, i.checked_at, u.full_name AS checked_by_name
       FROM audit_items i
       JOIN assets a ON a.id = i.asset_id
       JOIN locations l ON l.id = i.expected_location_id
       LEFT JOIN users u ON u.id = i.checked_by
       WHERE i.audit_cycle_id = $1
       ORDER BY (i.status = 'pending') DESC, a.asset_tag`,
      [cycleId],
    );
  },

  async insertCycle(data: { name: string; locationId?: number | null; startsOn: string; endsOn: string; createdBy: number }) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO audit_cycles (name, location_id, starts_on, ends_on, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.name, data.locationId ?? null, data.startsOn, data.endsOn, data.createdBy],
    );
    return row!.id;
  },

  async lockCycle(client: PoolClient, id: number) {
    const result = await client.query<{ id: number; status: string; location_id: number | null; name: string; created_by: number }>(
      `SELECT id, status, location_id, name, created_by FROM audit_cycles WHERE id = $1 FOR UPDATE`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async setCycleStatus(client: PoolClient, id: number, status: string) {
    await client.query(`UPDATE audit_cycles SET status = $2 WHERE id = $1`, [id, status]);
  },

  /** Snapshot the in-scope, non-retired assets into audit_items. */
  async snapshotItems(client: PoolClient, cycleId: number, locationId: number | null) {
    const result = await client.query(
      `INSERT INTO audit_items (audit_cycle_id, asset_id, expected_location_id)
       SELECT $1, a.id, a.location_id FROM assets a
       WHERE a.status NOT IN ('retired', 'lost')
         AND ($2::int IS NULL OR a.location_id = $2)
       RETURNING id`,
      [cycleId, locationId],
    );
    return result.rowCount ?? 0;
  },

  async lockItem(client: PoolClient, cycleId: number, itemId: number) {
    const result = await client.query<{ id: number; asset_id: number; status: string }>(
      `SELECT id, asset_id, status FROM audit_items
       WHERE id = $1 AND audit_cycle_id = $2 FOR UPDATE`,
      [itemId, cycleId],
    );
    return result.rows[0] ?? null;
  },

  async checkItem(client: PoolClient, itemId: number, status: string, remarks: string | null, checkedBy: number) {
    await client.query(
      `UPDATE audit_items SET status = $2, remarks = $3, checked_by = $4, checked_at = now() WHERE id = $1`,
      [itemId, status, remarks, checkedBy],
    );
  },

  async countPendingItems(client: PoolClient, cycleId: number) {
    const result = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_items WHERE audit_cycle_id = $1 AND status = 'pending'`,
      [cycleId],
    );
    return result.rows[0]?.n ?? 0;
  },

  async findMissingItems(client: PoolClient, cycleId: number) {
    const result = await client.query<{ asset_id: number }>(
      `SELECT asset_id FROM audit_items WHERE audit_cycle_id = $1 AND status = 'missing'`,
      [cycleId],
    );
    return result.rows;
  },
};
