import { PoolClient } from 'pg';
import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.asset_id, a.asset_tag, a.name AS asset_name,
         t.employee_id, e.full_name AS employee_name, e.employee_code,
         t.allocated_by, u.full_name AS allocated_by_name,
         t.allocated_at, t.due_at, t.returned_at, t.return_condition, t.notes,
         (t.returned_at IS NULL) AS is_active,
         (t.returned_at IS NULL AND t.due_at IS NOT NULL AND t.due_at < now()) AS is_overdue
  FROM asset_allocations t
  JOIN assets a ON a.id = t.asset_id
  JOIN employees e ON e.id = t.employee_id
  JOIN users u ON u.id = t.allocated_by`;

export const allocationsRepository = {
  async list(params: ListParams, activeOnly?: boolean, overdueOnly?: boolean) {
    const extraWhere: string[] = [];
    if (activeOnly) extraWhere.push('t.returned_at IS NULL');
    if (overdueOnly) extraWhere.push('t.returned_at IS NULL AND t.due_at IS NOT NULL AND t.due_at < now()');
    const { where, orderLimit, values } = buildListClause(
      params,
      ['a.name', 'a.asset_tag', 'e.full_name', 'e.employee_code'],
      1,
      extraWhere,
    );
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
    data: { assetId: number; employeeId: number; allocatedBy: number; dueAt?: string | null; notes?: string | null },
  ) {
    const result = await client.query<{ id: number }>(
      `INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, due_at, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.assetId, data.employeeId, data.allocatedBy, data.dueAt ?? null, data.notes ?? null],
    );
    return result.rows[0]!.id;
  },

  async lockActiveById(client: PoolClient, id: number) {
    const result = await client.query<{ id: number; asset_id: number; employee_id: number }>(
      `SELECT id, asset_id, employee_id FROM asset_allocations
       WHERE id = $1 AND returned_at IS NULL FOR UPDATE`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async markReturned(client: PoolClient, id: number, condition: string, notes?: string | null) {
    await client.query(
      `UPDATE asset_allocations
       SET returned_at = now(), return_condition = $2,
           notes = coalesce($3, notes)
       WHERE id = $1`,
      [id, condition, notes ?? null],
    );
  },

  listByEmployee(employeeId: number) {
    return query(`${BASE_SELECT} WHERE t.employee_id = $1 ORDER BY t.allocated_at DESC LIMIT 100`, [employeeId]);
  },

  findEmployeeUser(employeeId: number) {
    return queryOne<{ user_id: number | null; full_name: string }>(
      `SELECT user_id, full_name FROM employees WHERE id = $1 AND is_active`,
      [employeeId],
    );
  },
};
