import { withTransaction } from '../../config/db';
import { logActivity } from '../../shared/activity';
import { changeAssetStatus } from '../../shared/assetLifecycle';
import { notifyPermissionHolders, notifyUser } from '../../shared/notify';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { auditsRepository } from './audits.repository';

const LIST_OPTIONS = {
  sortable: ['t.starts_on', 't.ends_on', 't.created_at', 't.status'],
  defaultSort: 't.created_at',
  filterable: { status: 't.status', locationId: 't.location_id' },
};

/**
 * Audit cycle workflow:
 *   draft → in_progress (assets snapshotted) → completed
 *   draft | in_progress → cancelled
 * Completing a cycle marks 'missing' assets as lost (with full history).
 */
export const auditsService = {
  async list(rawQuery: Record<string, unknown>) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const { rows, total } = await auditsRepository.list(params);
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const cycle = await auditsRepository.findById(id);
    if (!cycle) throw ApiError.notFound('Audit cycle');
    const items = await auditsRepository.listItems(id);
    return { ...cycle, items };
  },

  async stats() {
    return auditsRepository.stats();
  },

  async create(
    data: { name: string; locationId?: number | null; startsOn: string; endsOn: string },
    actorId: number,
    ip?: string,
  ) {
    const id = await auditsRepository.insertCycle({ ...data, createdBy: actorId });
    await logActivity({
      userId: actorId, action: 'audit.create', entityType: 'audit_cycle', entityId: id,
      details: { name: data.name, locationId: data.locationId }, ip,
    });
    return this.get(id);
  },

  /** draft → in_progress: snapshot all in-scope assets as checkable items. */
  async start(id: number, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const cycle = await auditsRepository.lockCycle(client, id);
      if (!cycle) throw ApiError.notFound('Audit cycle');
      if (cycle.status !== 'draft') {
        throw ApiError.conflict(`Only draft cycles can be started (currently '${cycle.status}')`);
      }
      const count = await auditsRepository.snapshotItems(client, id, cycle.location_id);
      if (count === 0) throw ApiError.conflict('No auditable assets found in scope');
      await auditsRepository.setCycleStatus(client, id, 'in_progress');
      await logActivity(
        {
          userId: actorId, action: 'audit.start', entityType: 'audit_cycle', entityId: id,
          details: { items: count }, ip,
        },
        client,
      );
      await notifyPermissionHolders('audit.execute', {
        title: 'Audit cycle started',
        message: `"${cycle.name}" is now in progress with ${count} assets to verify.`,
        type: 'info', entityType: 'audit_cycle', entityId: id,
      }, client);
    });
    return this.get(id);
  },

  async checkItem(
    cycleId: number,
    itemId: number,
    data: { status: 'found' | 'missing' | 'damaged' | 'misplaced'; remarks?: string | null },
    actorId: number,
    ip?: string,
  ) {
    await withTransaction(async (client) => {
      const cycle = await auditsRepository.lockCycle(client, cycleId);
      if (!cycle) throw ApiError.notFound('Audit cycle');
      if (cycle.status !== 'in_progress') {
        throw ApiError.conflict('Items can only be checked while the cycle is in progress');
      }
      const item = await auditsRepository.lockItem(client, cycleId, itemId);
      if (!item) throw ApiError.notFound('Audit item');

      await auditsRepository.checkItem(client, itemId, data.status, data.remarks ?? null, actorId);
      await logActivity(
        {
          userId: actorId, action: 'audit.check_item', entityType: 'audit_item', entityId: itemId,
          details: { cycleId, assetId: item.asset_id, status: data.status }, ip,
        },
        client,
      );
    });
    return this.get(cycleId);
  },

  /** in_progress → completed. Requires every item checked; missing assets become 'lost'. */
  async complete(id: number, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const cycle = await auditsRepository.lockCycle(client, id);
      if (!cycle) throw ApiError.notFound('Audit cycle');
      if (cycle.status !== 'in_progress') {
        throw ApiError.conflict(`Only in-progress cycles can be completed (currently '${cycle.status}')`);
      }
      const pending = await auditsRepository.countPendingItems(client, id);
      if (pending > 0) {
        throw ApiError.conflict(`${pending} item(s) are still unchecked`);
      }

      const missing = await auditsRepository.findMissingItems(client, id);
      for (const { asset_id } of missing) {
        // best-effort: an asset already moved out of an auditable state is skipped
        try {
          await changeAssetStatus(client, asset_id, 'lost', actorId, `Marked missing in audit cycle #${id}`);
        } catch {
          /* transition not applicable — leave as-is */
        }
      }

      await auditsRepository.setCycleStatus(client, id, 'completed');
      await logActivity(
        {
          userId: actorId, action: 'audit.complete', entityType: 'audit_cycle', entityId: id,
          details: { missingAssets: missing.map((m) => m.asset_id) }, ip,
        },
        client,
      );
      await notifyUser(cycle.created_by, {
        title: 'Audit cycle completed',
        message: `"${cycle.name}" finished. ${missing.length} asset(s) reported missing.`,
        type: missing.length > 0 ? 'warning' : 'success',
        entityType: 'audit_cycle', entityId: id,
      }, client);
    });
    return this.get(id);
  },

  async cancel(id: number, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const cycle = await auditsRepository.lockCycle(client, id);
      if (!cycle) throw ApiError.notFound('Audit cycle');
      if (!['draft', 'in_progress'].includes(cycle.status)) {
        throw ApiError.conflict(`Cycle cannot be cancelled (currently '${cycle.status}')`);
      }
      await auditsRepository.setCycleStatus(client, id, 'cancelled');
      await logActivity(
        { userId: actorId, action: 'audit.cancel', entityType: 'audit_cycle', entityId: id, ip },
        client,
      );
    });
    return this.get(id);
  },
};
