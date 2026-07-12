import { PoolClient } from 'pg';
import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.asset_id, a.asset_tag, a.name AS asset_name,
         t.from_location_id, lf.name AS from_location_name,
         t.to_location_id, lt.name AS to_location_name,
         t.status, t.reason, t.decision_note,
         t.requested_by, ur.full_name AS requested_by_name,
         t.decided_by, ud.full_name AS decided_by_name,
         t.requested_at, t.decided_at, t.completed_at
  FROM transfer_requests t
  JOIN assets a ON a.id = t.asset_id
  JOIN locations lf ON lf.id = t.from_location_id
  JOIN locations lt ON lt.id = t.to_location_id
  JOIN users ur ON ur.id = t.requested_by
  LEFT JOIN users ud ON ud.id = t.decided_by`;

export const transfersRepository = {
  async list(params: ListParams) {
    const { where, orderLimit, values } = buildListClause(params, [
      'a.name', 'a.asset_tag', 'lf.name', 'lt.name',
    ]);
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

  async insert(
    client: PoolClient,
    data: { assetId: number; fromLocationId: number; toLocationId: number; reason: string; requestedBy: number },
  ) {
    const result = await client.query<{ id: number }>(
      `INSERT INTO transfer_requests (asset_id, from_location_id, to_location_id, reason, requested_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.assetId, data.fromLocationId, data.toLocationId, data.reason, data.requestedBy],
    );
    return result.rows[0]!.id;
  },

  async lockById(client: PoolClient, id: number) {
    const result = await client.query<{
      id: number; asset_id: number; from_location_id: number; to_location_id: number;
      status: string; requested_by: number;
    }>(`SELECT id, asset_id, from_location_id, to_location_id, status, requested_by
        FROM transfer_requests WHERE id = $1 FOR UPDATE`, [id]);
    return result.rows[0] ?? null;
  },

  async setStatus(
    client: PoolClient,
    id: number,
    status: string,
    decidedBy?: number,
    decisionNote?: string | null,
  ) {
    if (status === 'completed') {
      await client.query(
        `UPDATE transfer_requests SET status = $2, completed_at = now() WHERE id = $1`,
        [id, status],
      );
    } else {
      await client.query(
        `UPDATE transfer_requests
         SET status = $2, decided_by = coalesce($3, decided_by),
             decision_note = coalesce($4, decision_note),
             decided_at = CASE WHEN $3 IS NOT NULL THEN now() ELSE decided_at END
         WHERE id = $1`,
        [id, status, decidedBy ?? null, decisionNote ?? null],
      );
    }
  },
};
