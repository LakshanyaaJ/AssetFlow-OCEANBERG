import { queryOne, withTransaction } from '../../config/db';
import { logActivity } from '../../shared/activity';
import { changeAssetStatus } from '../../shared/assetLifecycle';
import { notifyPermissionHolders, notifyUser } from '../../shared/notify';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { transfersRepository } from './transfers.repository';

const LIST_OPTIONS = {
  sortable: ['t.requested_at', 't.decided_at', 't.status'],
  defaultSort: 't.requested_at',
  filterable: { status: 't.status', assetId: 't.asset_id', toLocationId: 't.to_location_id' },
};

/**
 * Transfer approval workflow:
 *   pending → approved → completed        (asset: available → in_transfer → available @ new location)
 *   pending → rejected | cancelled        (asset untouched)
 */
export const transfersService = {
  async list(rawQuery: Record<string, unknown>) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const { rows, total } = await transfersRepository.list(params);
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const row = await transfersRepository.findById(id);
    if (!row) throw ApiError.notFound('Transfer request');
    return row;
  },

  async request(
    data: { assetId: number; toLocationId: number; reason: string },
    actorId: number,
    ip?: string,
  ) {
    const asset = await queryOne<{ id: number; location_id: number; status: string; name: string }>(
      `SELECT id, location_id, status, name FROM assets WHERE id = $1`,
      [data.assetId],
    );
    if (!asset) throw ApiError.notFound('Asset');
    if (asset.status !== 'available') {
      throw ApiError.conflict(`Only available assets can be transferred (asset is '${asset.status}')`);
    }
    if (asset.location_id === data.toLocationId) {
      throw ApiError.badRequest('Asset is already at the target location');
    }

    const id = await withTransaction(async (client) => {
      const transferId = await transfersRepository.insert(client, {
        assetId: data.assetId,
        fromLocationId: asset.location_id,
        toLocationId: data.toLocationId,
        reason: data.reason,
        requestedBy: actorId,
      });
      await logActivity(
        {
          userId: actorId, action: 'transfer.request', entityType: 'transfer', entityId: transferId,
          details: { assetId: data.assetId, toLocationId: data.toLocationId }, ip,
        },
        client,
      );
      await notifyPermissionHolders(
        'transfer.approve',
        {
          title: 'Transfer approval needed',
          message: `Transfer requested for "${asset.name}".`,
          type: 'approval', entityType: 'transfer', entityId: transferId,
        },
        client,
      );
      return transferId;
    });
    return this.get(id);
  },

  async decide(
    id: number,
    decision: 'approved' | 'rejected',
    note: string | null,
    actorId: number,
    ip?: string,
  ) {
    await withTransaction(async (client) => {
      const transfer = await transfersRepository.lockById(client, id);
      if (!transfer) throw ApiError.notFound('Transfer request');
      if (transfer.status !== 'pending') {
        throw ApiError.conflict(`Only pending transfers can be decided (currently '${transfer.status}')`);
      }
      if (decision === 'approved') {
        await changeAssetStatus(client, transfer.asset_id, 'in_transfer', actorId, `Transfer #${id} approved`, 'available');
      }
      await transfersRepository.setStatus(client, id, decision, actorId, note);
      await logActivity(
        { userId: actorId, action: `transfer.${decision}`, entityType: 'transfer', entityId: id, ip },
        client,
      );
      await notifyUser(
        transfer.requested_by,
        {
          title: `Transfer ${decision}`,
          message: `Your transfer request #${id} was ${decision}.${note ? ` Note: ${note}` : ''}`,
          type: decision === 'approved' ? 'success' : 'warning',
          entityType: 'transfer', entityId: id,
        },
        client,
      );
    });
    return this.get(id);
  },

  /** Physical move done — asset arrives at destination and becomes available again. */
  async complete(id: number, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const transfer = await transfersRepository.lockById(client, id);
      if (!transfer) throw ApiError.notFound('Transfer request');
      if (transfer.status !== 'approved') {
        throw ApiError.conflict(`Only approved transfers can be completed (currently '${transfer.status}')`);
      }
      await client.query(`UPDATE assets SET location_id = $2 WHERE id = $1`, [
        transfer.asset_id, transfer.to_location_id,
      ]);
      await changeAssetStatus(client, transfer.asset_id, 'available', actorId, `Transfer #${id} completed`, 'in_transfer');
      await transfersRepository.setStatus(client, id, 'completed');
      await logActivity(
        {
          userId: actorId, action: 'transfer.complete', entityType: 'transfer', entityId: id,
          details: { assetId: transfer.asset_id, toLocationId: transfer.to_location_id }, ip,
        },
        client,
      );
      await notifyUser(
        transfer.requested_by,
        {
          title: 'Transfer completed',
          message: `Transfer #${id} is complete; the asset is now at its new location.`,
          type: 'success', entityType: 'transfer', entityId: id,
        },
        client,
      );
    });
    return this.get(id);
  },

  /** Requester may cancel while still pending. */
  async cancel(id: number, actorId: number, ip?: string) {
    await withTransaction(async (client) => {
      const transfer = await transfersRepository.lockById(client, id);
      if (!transfer) throw ApiError.notFound('Transfer request');
      if (transfer.requested_by !== actorId) {
        throw ApiError.forbidden('Only the requester can cancel a transfer request');
      }
      if (transfer.status !== 'pending') {
        throw ApiError.conflict(`Only pending transfers can be cancelled (currently '${transfer.status}')`);
      }
      await transfersRepository.setStatus(client, id, 'cancelled');
      await logActivity(
        { userId: actorId, action: 'transfer.cancel', entityType: 'transfer', entityId: id, ip },
        client,
      );
    });
    return this.get(id);
  },
};
