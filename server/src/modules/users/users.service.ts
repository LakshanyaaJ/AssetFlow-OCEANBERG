import { logActivity } from '../../shared/activity';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/crypto';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { authRepository } from '../auth/auth.repository';
import { usersRepository } from './users.repository';

const LIST_OPTIONS = {
  sortable: ['t.created_at', 't.full_name', 't.email', 't.last_login_at'],
  defaultSort: 't.created_at',
  filterable: { roleId: 't.role_id', isActive: 't.is_active' },
};

export const usersService = {
  async list(rawQuery: Record<string, unknown>) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const { rows, total } = await usersRepository.list(params);
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const user = await usersRepository.findById(id);
    if (!user) throw ApiError.notFound('User');
    return user;
  },

  async create(
    data: { email: string; password: string; fullName: string; roleId: number },
    actorId: number,
    ip?: string,
  ) {
    if (await usersRepository.findByEmail(data.email)) {
      throw ApiError.conflict('A user with this email already exists');
    }
    const id = await usersRepository.create({
      email: data.email,
      passwordHash: await hashPassword(data.password),
      fullName: data.fullName,
      roleId: data.roleId,
    });
    await logActivity({
      userId: actorId, action: 'user.create', entityType: 'user', entityId: id,
      details: { email: data.email, roleId: data.roleId }, ip,
    });
    return this.get(id);
  },

  async update(
    id: number,
    data: { fullName?: string; roleId?: number; isActive?: boolean; password?: string },
    actorId: number,
    ip?: string,
  ) {
    await this.get(id);
    if (id === actorId && data.isActive === false) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }
    await usersRepository.update(id, {
      fullName: data.fullName,
      roleId: data.roleId,
      isActive: data.isActive,
      passwordHash: data.password ? await hashPassword(data.password) : undefined,
    });
    // Deactivation or role change kills existing sessions.
    if (data.isActive === false || data.roleId !== undefined || data.password) {
      await authRepository.revokeAllForUser(id);
    }
    await logActivity({
      userId: actorId, action: 'user.update', entityType: 'user', entityId: id,
      details: { changed: Object.keys(data) }, ip,
    });
    return this.get(id);
  },

  listRoles() {
    return usersRepository.listRoles();
  },
};
