import { queryOne, withTransaction } from '../../config/db';
import { logActivity } from '../../shared/activity';
import { changeAssetStatus } from '../../shared/assetLifecycle';
import { notifyPermissionHolders, notifyUser } from '../../shared/notify';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { allocationsRepository } from './allocations.repository';

const LIST_OPTIONS = {
  sortable: ['t.allocated_at', 't.due_at', 't.returned_at'],
  defaultSort: 't.allocated_at',
  filterable: { assetId: 't.asset_id', employeeId: 't.employee_id' },
};

export const allocationsService = {
  async list(rawQuery: Record<string, unknown>) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const { rows, total } = await allocationsRepository.list(
      params,
      rawQuery.active === 'true',
      rawQuery.overdue === 'true',
    );
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const row = await allocationsRepository.findById(id);
    if (!row) throw ApiError.notFound('Allocation');
    return row;
  },

  /**
   * Allocate an asset to an employee.
   * Double allocation is impossible: the asset row is locked and must be
   * 'available', and uq_active_allocation backs this up at the DB level.
   */
  async allocate(
    data: { assetId: number; employeeId: number; dueAt?: string | null; notes?: string | null },
    actorId: number,
    ip?: string,
  ) {
    const employee = await allocationsRepository.findEmployeeUser(data.employeeId);
    if (!employee) throw ApiError.notFound('Employee');

    const id = await withTransaction(async (client) => {
      await changeAssetStatus(client, data.assetId, 'allocated', actorId, 'Allocated to employee', 'available');
      const allocationId = await allocationsRepository.insert(client, { ...data, allocatedBy: actorId });
      await logActivity(
        {
          userId: actorId, action: 'asset.allocate', entityType: 'allocation', entityId: allocationId,
          details: { assetId: data.assetId, employeeId: data.employeeId, dueAt: data.dueAt }, ip,
        },
        client,
      );
      if (employee.user_id) {
        await notifyUser(
          employee.user_id,
          {
            title: 'Asset allocated to you',
            message: `An asset has been allocated to you${data.dueAt ? ` (due back ${new Date(data.dueAt).toDateString()})` : ''}.`,
            type: 'info', entityType: 'allocation', entityId: allocationId,
          },
          client,
        );
      }
      return allocationId;
    });
    return this.get(id);
  },

  /** Return an allocated asset; asset transitions allocated → available. */
  async processReturn(
    id: number,
    data: { condition: 'good' | 'damaged' | 'needs_repair'; notes?: string | null },
    actorId: number,
    ip?: string,
  ) {
    await withTransaction(async (client) => {
      const allocation = await allocationsRepository.lockActiveById(client, id);
      if (!allocation) throw ApiError.conflict('Allocation not found or already returned');

      await allocationsRepository.markReturned(client, id, data.condition, data.notes);
      await changeAssetStatus(
        client, allocation.asset_id, 'available', actorId,
        `Returned (${data.condition})`, 'allocated',
      );
      await logActivity(
        {
          userId: actorId, action: 'asset.return', entityType: 'allocation', entityId: id,
          details: { assetId: allocation.asset_id, condition: data.condition }, ip,
        },
        client,
      );
      // Damaged returns prompt the maintenance approvers to act.
      if (data.condition !== 'good') {
        await notifyPermissionHolders(
          'maintenance.approve',
          {
            title: 'Asset returned damaged',
            message: `Asset #${allocation.asset_id} was returned in condition '${data.condition}'. Consider raising maintenance.`,
            type: 'warning', entityType: 'asset', entityId: allocation.asset_id,
          },
          client,
        );
      }
    });
    return this.get(id);
  },

  /** Allocations of the calling user (self-service "My Assets" view). */
  async listMine(userId: number) {
    const employee = await queryOne<{ id: number }>(
      `SELECT id FROM employees WHERE user_id = $1`,
      [userId],
    );
    if (!employee) return [];
    return allocationsRepository.listByEmployee(employee.id);
  },
};
