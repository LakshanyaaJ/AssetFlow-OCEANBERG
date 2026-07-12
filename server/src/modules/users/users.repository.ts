import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.email, t.full_name, t.role_id, r.name AS role_name,
         t.is_active, t.last_login_at, t.created_at
  FROM users t JOIN roles r ON r.id = t.role_id`;

export const usersRepository = {
  async list(params: ListParams) {
    const { where, orderLimit, values } = buildListClause(params, ['t.email', 't.full_name']);
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

  findByEmail(email: string) {
    return queryOne<{ id: number }>(`SELECT id FROM users WHERE email = $1`, [email]);
  },

  async create(data: { email: string; passwordHash: string; fullName: string; roleId: number }) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO users (email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.email, data.passwordHash, data.fullName, data.roleId],
    );
    return row!.id;
  },

  async update(
    id: number,
    data: { fullName?: string; roleId?: number; isActive?: boolean; passwordHash?: string },
  ) {
    const sets: string[] = [];
    const values: unknown[] = [id];
    let i = 2;
    if (data.fullName !== undefined) { sets.push(`full_name = $${i++}`); values.push(data.fullName); }
    if (data.roleId !== undefined) { sets.push(`role_id = $${i++}`); values.push(data.roleId); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${i++}`); values.push(data.isActive); }
    if (data.passwordHash !== undefined) { sets.push(`password_hash = $${i++}`); values.push(data.passwordHash); }
    if (sets.length === 0) return;
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $1`, values);
  },

  listRoles() {
    return query(
      `SELECT r.id, r.name, r.description,
              coalesce(json_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '[]') AS permissions,
              count(*) FILTER (WHERE u.id IS NOT NULL)::int AS user_count
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       LEFT JOIN users u ON u.role_id = r.id
       GROUP BY r.id ORDER BY r.id`,
    );
  },
};
