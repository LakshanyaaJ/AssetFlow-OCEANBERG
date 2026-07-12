import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.resource_id, r.name AS resource_name, r.code AS resource_code,
         r.resource_type, t.booked_by, u.full_name AS booked_by_name,
         t.purpose, t.starts_at, t.ends_at, t.status, t.created_at
  FROM bookings t
  JOIN resources r ON r.id = t.resource_id
  JOIN users u ON u.id = t.booked_by`;

export const bookingsRepository = {
  async list(params: ListParams, extraWhere: string[] = [], extraValues: unknown[] = []) {
    const { where, orderLimit, values } = buildListClause(
      params, ['r.name', 'r.code', 't.purpose', 'u.full_name'], 1, extraWhere, extraValues,
    );
    const rows = await query(`${BASE_SELECT} ${where} ${orderLimit}`, values);
    const totalRow = await queryOne<{ total: number }>(
      `SELECT count(*)::int AS total FROM (${BASE_SELECT} ${where}) sub`,
      values.slice(0, -2),
    );
    return { rows, total: totalRow?.total ?? 0 };
  },

  findById(id: number) {
    return queryOne<{
      id: number; resource_id: number; booked_by: number; status: string;
      starts_at: string; ends_at: string;
    }>(`${BASE_SELECT} WHERE t.id = $1`, [id]);
  },

  findResource(id: number) {
    return queryOne<{ id: number; name: string; is_active: boolean }>(
      `SELECT id, name, is_active FROM resources WHERE id = $1`,
      [id],
    );
  },

  /** Friendly pre-check; the EXCLUDE constraint remains the race-proof guarantee. */
  findOverlap(resourceId: number, startsAt: string, endsAt: string) {
    return queryOne<{ id: number; starts_at: string; ends_at: string }>(
      `SELECT id, starts_at, ends_at FROM bookings
       WHERE resource_id = $1 AND status = 'confirmed'
         AND tstzrange(starts_at, ends_at) && tstzrange($2::timestamptz, $3::timestamptz)
       LIMIT 1`,
      [resourceId, startsAt, endsAt],
    );
  },

  async insert(data: { resourceId: number; bookedBy: number; purpose: string; startsAt: string; endsAt: string }) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO bookings (resource_id, booked_by, purpose, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.resourceId, data.bookedBy, data.purpose, data.startsAt, data.endsAt],
    );
    return row!.id;
  },

  async setStatus(id: number, status: 'cancelled' | 'completed') {
    await query(`UPDATE bookings SET status = $2 WHERE id = $1`, [id, status]);
  },

  /** Calendar feed: confirmed bookings for one resource in a window. */
  calendar(resourceId: number, from: string, to: string) {
    return query(
      `${BASE_SELECT}
       WHERE t.resource_id = $1 AND t.status = 'confirmed'
         AND tstzrange(t.starts_at, t.ends_at) && tstzrange($2::timestamptz, $3::timestamptz)
       ORDER BY t.starts_at`,
      [resourceId, from, to],
    );
  },
};
