import { PoolClient } from 'pg';
import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.asset_id, a.asset_tag, a.name AS asset_name,
         t.title, t.description, t.priority, t.status, t.maintenance_type,
         t.cost, t.resolution, t.scheduled_for,
         t.reported_by, ur.full_name AS reported_by_name,
         t.decided_by, ud.full_name AS decided_by_name,
         t.requested_at, t.decided_at, t.completed_at,
         (SELECT json_agg(json_build_object(
             'id', ma.id, 'employee_id', ma.assigned_to,
             'employee_name', e.full_name, 'assigned_at', ma.assigned_at, 'notes', ma.notes))
          FROM maintenance_assignments ma JOIN employees e ON e.id = ma.assigned_to
          WHERE ma.maintenance_request_id = t.id) AS assignments
  FROM maintenance_requests t
  JOIN assets a ON a.id = t.asset_id
  JOIN users ur ON ur.id = t.reported_by
  LEFT JOIN users ud ON ud.id = t.decided_by`;

export const maintenanceRepository = {
  async list(params: ListParams) {
    const { where, orderLimit, values } = buildListClause(params, [
      't.title', 'a.name', 'a.asset_tag',
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

  async insert(data: {
    assetId: number; title: string; description?: string | null;
    priority: string; maintenanceType: string; reportedBy: number;
  }) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO maintenance_requests (asset_id, title, description, priority, maintenance_type, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [data.assetId, data.title, data.description ?? null, data.priority, data.maintenanceType, data.reportedBy],
    );
    return row!.id;
  },

  async lockById(client: PoolClient, id: number) {
    const result = await client.query<{
      id: number; asset_id: number; status: string; reported_by: number; title: string;
    }>(`SELECT id, asset_id, status, reported_by, title FROM maintenance_requests WHERE id = $1 FOR UPDATE`, [id]);
    return result.rows[0] ?? null;
  },

  async setStatus(
    client: PoolClient,
    id: number,
    status: string,
    fields: { decidedBy?: number; scheduledFor?: string | null; cost?: number | null; resolution?: string | null } = {},
  ) {
    await client.query(
      `UPDATE maintenance_requests
       SET status = $2,
           decided_by   = coalesce($3, decided_by),
           decided_at   = CASE WHEN $3 IS NOT NULL THEN now() ELSE decided_at END,
           scheduled_for = coalesce($4, scheduled_for),
           cost         = coalesce($5, cost),
           resolution   = coalesce($6, resolution),
           completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE completed_at END
       WHERE id = $1`,
      [id, status, fields.decidedBy ?? null, fields.scheduledFor ?? null, fields.cost ?? null, fields.resolution ?? null],
    );
  },

  async addAssignment(client: PoolClient, requestId: number, employeeId: number, assignedBy: number, notes?: string | null) {
    await client.query(
      `INSERT INTO maintenance_assignments (maintenance_request_id, assigned_to, assigned_by, notes)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (maintenance_request_id, assigned_to) DO NOTHING`,
      [requestId, employeeId, assignedBy, notes ?? null],
    );
  },

  /** Is this user one of the assigned technicians? */
  async isAssignedTechnician(requestId: number, userId: number) {
    const row = await queryOne<{ ok: boolean }>(
      `SELECT true AS ok FROM maintenance_assignments ma
       JOIN employees e ON e.id = ma.assigned_to
       WHERE ma.maintenance_request_id = $1 AND e.user_id = $2`,
      [requestId, userId],
    );
    return !!row;
  },

  async stats() {
    const row = await queryOne<{
      pending_requests: number;
      active_repairs: number;
      resolved_this_month: number;
      avg_resolution_hours: number;
    }>(`
      SELECT
        count(*) FILTER (WHERE status = 'pending')::int AS pending_requests,
        count(*) FILTER (WHERE status IN ('approved', 'in_progress'))::int AS active_repairs,
        count(*) FILTER (WHERE status = 'completed' AND completed_at >= date_trunc('month', now()))::int AS resolved_this_month,
        coalesce(round(avg(EXTRACT(EPOCH FROM (completed_at - requested_at)) / 3600.0)::numeric, 1), 0)::float AS avg_resolution_hours
      FROM maintenance_requests
    `);
    return {
      pendingRequests: row?.pending_requests ?? 0,
      activeRepairs: row?.active_repairs ?? 0,
      resolvedThisMonth: row?.resolved_this_month ?? 0,
      avgResolutionHours: row?.avg_resolution_hours ?? 0,
    };
  },
};

