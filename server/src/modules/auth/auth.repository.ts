import { query, queryOne } from '../../config/db';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
}

export const authRepository = {
  findUserByEmail(email: string) {
    return queryOne<UserRow>(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, u.is_active, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email],
    );
  },

  findUserById(id: number) {
    return queryOne<UserRow>(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, u.is_active, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [id],
    );
  },

  async saveRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  },

  findValidRefreshToken(tokenHash: string) {
    return queryOne<{ id: string; user_id: number }>(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [tokenHash],
    );
  },

  async revokeRefreshToken(tokenHash: string) {
    await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash]);
  },

  async revokeAllForUser(userId: number) {
    await query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  },

  async touchLastLogin(userId: number) {
    await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
  },
};
