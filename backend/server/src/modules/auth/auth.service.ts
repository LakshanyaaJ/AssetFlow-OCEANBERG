import { getRolePermissions } from '../../middleware/auth';
import { logActivity } from '../../shared/activity';
import { ApiError } from '../../utils/ApiError';
import {
  generateRefreshToken,
  sha256,
  signAccessToken,
  verifyPassword,
} from '../../utils/crypto';
import { authRepository } from './auth.repository';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: { id: number; email: string; fullName: string; role: string; permissions: string[] };
}

async function buildAuthResult(userId: number): Promise<AuthResult> {
  const user = await authRepository.findUserById(userId);
  if (!user || !user.is_active) throw ApiError.unauthorized('Account is inactive');

  const accessToken = signAccessToken({ sub: user.id, role: user.role_name, roleId: user.role_id });
  const { token, tokenHash, expiresAt } = generateRefreshToken();
  await authRepository.saveRefreshToken(user.id, tokenHash, expiresAt);

  const permissions = [...(await getRolePermissions(user.role_id))];
  return {
    accessToken,
    refreshToken: token,
    refreshExpiresAt: expiresAt,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name,
      permissions,
    },
  };
}

export const authService = {
  async login(email: string, password: string, ip?: string): Promise<AuthResult> {
    const user = await authRepository.findUserByEmail(email.toLowerCase());
    // Same error for unknown email and wrong password — no account enumeration.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (!user.is_active) throw ApiError.unauthorized('Account is inactive');

    await authRepository.touchLastLogin(user.id);
    await logActivity({ userId: user.id, action: 'auth.login', entityType: 'user', entityId: user.id, ip });
    return buildAuthResult(user.id);
  },

  /** Refresh-token rotation: each refresh consumes the old token and issues a new pair. */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const row = await authRepository.findValidRefreshToken(sha256(refreshToken));
    if (!row) throw ApiError.unauthorized('Refresh token is invalid or expired');
    await authRepository.revokeRefreshToken(sha256(refreshToken));
    return buildAuthResult(row.user_id);
  },

  async logout(refreshToken: string | undefined, userId?: number, ip?: string): Promise<void> {
    if (refreshToken) await authRepository.revokeRefreshToken(sha256(refreshToken));
    if (userId) {
      await logActivity({ userId, action: 'auth.logout', entityType: 'user', entityId: userId, ip });
    }
  },

  async me(userId: number) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw ApiError.notFound('User');
    const permissions = [...(await getRolePermissions(user.role_id))];
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name,
      permissions,
    };
  },
};
