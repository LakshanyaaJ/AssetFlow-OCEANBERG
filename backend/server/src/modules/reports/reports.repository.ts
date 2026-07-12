import { query, queryOne } from '../../config/db';

/** Aggregations are pushed down to PostgreSQL — one round trip per widget. */
export const reportsRepository = {
  dashboardCounts() {
    return queryOne<Record<string, number>>(`
      SELECT
        (SELECT count(*)::int FROM assets)                                                        AS total_assets,
        (SELECT count(*)::int FROM assets WHERE status = 'available')                             AS available_assets,
        (SELECT count(*)::int FROM assets WHERE status = 'allocated')                             AS allocated_assets,
        (SELECT count(*)::int FROM assets WHERE status = 'under_maintenance')                     AS assets_in_maintenance,
        (SELECT coalesce(sum(purchase_cost), 0)::float FROM assets WHERE status <> 'retired')     AS portfolio_value,
        (SELECT count(*)::int FROM transfer_requests WHERE status = 'pending')                    AS pending_transfers,
        (SELECT count(*)::int FROM maintenance_requests WHERE status = 'pending')                 AS pending_maintenance,
        (SELECT count(*)::int FROM asset_allocations
          WHERE returned_at IS NULL AND due_at IS NOT NULL AND due_at < now())                    AS overdue_allocations,
        (SELECT count(*)::int FROM bookings WHERE status = 'confirmed' AND starts_at > now())     AS upcoming_bookings,
        (SELECT count(*)::int FROM audit_cycles WHERE status = 'in_progress')                     AS active_audits
    `);
  },

  assetsByStatus() {
    return query(`SELECT status, count(*)::int AS count FROM assets GROUP BY status ORDER BY count DESC`);
  },

  assetsByCategory() {
    return query(`
      SELECT c.name AS category, count(a.id)::int AS count,
             coalesce(sum(a.purchase_cost), 0)::float AS total_value
      FROM asset_categories c LEFT JOIN assets a ON a.category_id = c.id
      GROUP BY c.id, c.name HAVING count(a.id) > 0 ORDER BY count DESC`);
  },

  assetsByLocation() {
    return query(`
      SELECT l.name AS location, count(a.id)::int AS count,
             coalesce(sum(a.purchase_cost), 0)::float AS total_value
      FROM locations l LEFT JOIN assets a ON a.location_id = l.id
      GROUP BY l.id, l.name ORDER BY count DESC`);
  },

  maintenanceCostByMonth(months: number) {
    return query(
      `SELECT to_char(date_trunc('month', completed_at), 'YYYY-MM') AS month,
              count(*)::int AS jobs, coalesce(sum(cost), 0)::float AS total_cost
       FROM maintenance_requests
       WHERE status = 'completed' AND completed_at > now() - ($1 || ' months')::interval
       GROUP BY 1 ORDER BY 1`,
      [months],
    );
  },

  allocationSummary() {
    return query(`
      SELECT d.name AS department, count(*)::int AS active_allocations
      FROM asset_allocations aa
      JOIN employees e ON e.id = aa.employee_id
      JOIN departments d ON d.id = e.department_id
      WHERE aa.returned_at IS NULL
      GROUP BY d.id, d.name ORDER BY active_allocations DESC`);
  },

  resourceUtilization(days: number) {
    return query(
      `SELECT r.name AS resource, r.resource_type,
              count(b.id)::int AS bookings,
              coalesce(sum(EXTRACT(EPOCH FROM (least(b.ends_at, now()) - b.starts_at)) / 3600), 0)::float AS booked_hours
       FROM resources r
       LEFT JOIN bookings b ON b.resource_id = r.id
         AND b.status IN ('confirmed', 'completed')
         AND b.starts_at > now() - ($1 || ' days')::interval
       WHERE r.is_active
       GROUP BY r.id, r.name, r.resource_type ORDER BY booked_hours DESC`,
      [days],
    );
  },

  auditSummary() {
    return query(`
      SELECT c.id, c.name, c.status,
             count(i.id)::int AS total_items,
             count(*) FILTER (WHERE i.status = 'found')::int      AS found,
             count(*) FILTER (WHERE i.status = 'missing')::int    AS missing,
             count(*) FILTER (WHERE i.status = 'damaged')::int    AS damaged,
             count(*) FILTER (WHERE i.status = 'misplaced')::int  AS misplaced,
             count(*) FILTER (WHERE i.status = 'pending')::int    AS pending
      FROM audit_cycles c LEFT JOIN audit_items i ON i.audit_cycle_id = c.id
      GROUP BY c.id ORDER BY c.created_at DESC LIMIT 10`);
  },

  recentActivity(limit: number) {
    return query(
      `SELECT t.id, t.action, t.entity_type, t.entity_id, t.created_at, u.full_name AS user_name
       FROM activity_logs t LEFT JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC LIMIT $1`,
      [limit],
    );
  },
};
