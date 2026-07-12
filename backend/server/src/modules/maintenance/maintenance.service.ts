import { queryOne, withTransaction } from '../../config/db';
import { logActivity } from '../../shared/activity';
import { changeAssetStatus } from '../../shared/assetLifecycle';
import { notifyPermissionHolders, notifyUser } from '../../shared/notify';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { maintenanceRepository } from './maintenance.repository';

const LIST_OPTIONS = {
  sortable: ['t.requested_at', 't.priority', 't.status', 't.completed_at'],
  defaultSort: 't.requested_at',
  filterable: { status: 't.status', priority: 't.priority', assetId: 't.asset_id' },
};

/**
 * Maintenance approval workflow:
 *   pending → approved → in_progress → completed
 *   pending → rejected | cancelled
 * Asset lifecycle: available → under_maintenance (work starts) → available (done).
 */
export const maintenanceService = {
  async list(rawQuery: Record<string, unknown>) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const { rows, total } = await maintenanceRepository.list(params);
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const row = await maintenanceRepository.findById(id);
    if (!row) throw ApiError.notFound('Maintenance request');
    return row;
  },

  async stats() {
    return maintenanceRepository.stats();
  },

  async request(
    data: { assetId: number; title: string; description?: string | null; priority: 'low' | 'medium' | 'high' | 'critical'; maintenanceType: 'corrective' | 'preventive' },
    actorId: number,
    ip?: string,
  ) {
    const asset = await queryOne<{ id: number; name: string; status: string }>(
      `SELECT id, name, status FROM assets WHERE id = $1`, [data.assetId],
    );
    if (!asset) throw ApiError.notFound('Asset');
    if (asset.status === 'retired' || asset.status === 'lost') {
      throw ApiError.conflict(`Maintenance cannot be requested for a ${asset.status} asset`);
    }

    const id = await maintenanceRepository.insert({ ...data, reportedBy: actorId });
    await logActivity({
      userId: actorId, action: 'maintenance.request', entityType: 'maintenance', entityId: id,
      details: { assetId: data.assetId, priority: data.priority }, ip,
    });
    await notifyPermissionHolders('maintenance.approve', {
      title: 'Maintenance approval needed',
      message: `${data.priority.toUpperCase()}: "${data.title}" on ${asset.name}.`,
      type: 'approval', entityType: 'maintenance', entityId: id,
    });
    return this.get(id);
  },

  async decide(
    id: number,
    data: { decision: 'approved' | 'rejected'; scheduledFor?: string | null; assignEmployeeId?: number | null },
    actorId: number,
    ip?: string,
  ) {
    await withTransaction(async (client) => {
      const request = await maintenanceRepository.lockById(client, id);
      if (!request) throw ApiError.notFound('Maintenance request');
      if (request.status !== 'pending') {
        throw ApiError.conflict(`Only pending requests can be decided (currently '${request.status}')`);
      }
      await maintenanceRepository.setStatus(client, id, data.decision, {
        decidedBy: actorId, scheduledFor: data.scheduledFor ?? null,
      });
      if (data.decision === 'approved' && data.assignEmployeeId) {
        await maintenanceRepository.addAssignment(client, id, data.assignEmployeeId, actorId);
      }
      await logActivity(
        { userId: actorId, action: `maintenance.${data.decision}`, entityType: 'maintenance', entityId: id, ip },
        client,
      );
      await notifyUser(request.reported_by, {
        title: `Maintenance ${data.decision}`,
        message: `Your maintenance request "${request.title}" was ${data.decision}.`,
        type: data.decision === 'approved' ? 'success' : 'warning',
        entityType: 'maintenance', entityId: id,
      }, client);
    });
    return this.get(id);
  },

  async assign(id: number, employeeId: number, notes: string | null, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const request = await maintenanceRepository.lockById(client, id);
      if (!request) throw ApiError.notFound('Maintenance request');
      if (!['approved', 'in_progress'].includes(request.status)) {
        throw ApiError.conflict('Technicians can only be assigned to approved or in-progress requests');
      }
      const employee = await client.query<{ user_id: number | null }>(
        `SELECT user_id FROM employees WHERE id = $1 AND is_active`, [employeeId],
      );
      if (employee.rows.length === 0) throw ApiError.notFound('Employee');

      await maintenanceRepository.addAssignment(client, id, employeeId, actorId, notes);
      await logActivity(
        {
          userId: actorId, action: 'maintenance.assign', entityType: 'maintenance', entityId: id,
          details: { employeeId }, ip,
        },
        client,
      );
      const userId = employee.rows[0]?.user_id;
      if (userId) {
        await notifyUser(userId, {
          title: 'Maintenance work assigned',
          message: `You have been assigned to "${request.title}".`,
          type: 'info', entityType: 'maintenance', entityId: id,
        }, client);
      }
    });
    return this.get(id);
  },

  /** Work starts — asset goes under_maintenance. Approvers or assigned technicians only. */
  async start(id: number, actorId: number, canApprove: boolean, ip?: string) {
    await withTransaction(async (client) => {
      const request = await maintenanceRepository.lockById(client, id);
      if (!request) throw ApiError.notFound('Maintenance request');
      if (request.status !== 'approved') {
        throw ApiError.conflict(`Only approved requests can be started (currently '${request.status}')`);
      }
      if (!canApprove && !(await maintenanceRepository.isAssignedTechnician(id, actorId))) {
        throw ApiError.forbidden('Only assigned technicians can start this work');
      }
      await changeAssetStatus(client, request.asset_id, 'under_maintenance', actorId, `Maintenance #${id} started`, 'available');
      await maintenanceRepository.setStatus(client, id, 'in_progress');
      await logActivity(
        { userId: actorId, action: 'maintenance.start', entityType: 'maintenance', entityId: id, ip },
        client,
      );
    });
    return this.get(id);
  },

  async complete(
    id: number,
    data: { cost?: number | null; resolution: string },
    actorId: number,
    canApprove: boolean,
    ip?: string,
  ) {
    await withTransaction(async (client) => {
      const request = await maintenanceRepository.lockById(client, id);
      if (!request) throw ApiError.notFound('Maintenance request');
      if (request.status !== 'in_progress') {
        throw ApiError.conflict(`Only in-progress requests can be completed (currently '${request.status}')`);
      }
      if (!canApprove && !(await maintenanceRepository.isAssignedTechnician(id, actorId))) {
        throw ApiError.forbidden('Only assigned technicians can complete this work');
      }
      await changeAssetStatus(client, request.asset_id, 'available', actorId, `Maintenance #${id} completed`, 'under_maintenance');
      await maintenanceRepository.setStatus(client, id, 'completed', {
        cost: data.cost ?? null, resolution: data.resolution,
      });
      await logActivity(
        {
          userId: actorId, action: 'maintenance.complete', entityType: 'maintenance', entityId: id,
          details: { cost: data.cost }, ip,
        },
        client,
      );
      await notifyUser(request.reported_by, {
        title: 'Maintenance completed',
        message: `"${request.title}" has been completed.`,
        type: 'success', entityType: 'maintenance', entityId: id,
      }, client);
    });
    return this.get(id);
  },

  /** Reporter may cancel while still pending. */
  async cancel(id: number, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const request = await maintenanceRepository.lockById(client, id);
      if (!request) throw ApiError.notFound('Maintenance request');
      if (request.reported_by !== actorId) throw ApiError.forbidden('Only the reporter can cancel this request');
      if (request.status !== 'pending') {
        throw ApiError.conflict(`Only pending requests can be cancelled (currently '${request.status}')`);
      }
      await maintenanceRepository.setStatus(client, id, 'cancelled');
      await logActivity(
        { userId: actorId, action: 'maintenance.cancel', entityType: 'maintenance', entityId: id, ip },
        client,
      );
    });
    return this.get(id);
  },
};
