import { withTransaction } from '../../config/db';
import { logActivity } from '../../shared/activity';
import { AssetStatus, changeAssetStatus } from '../../shared/assetLifecycle';
import { ApiError } from '../../utils/ApiError';
import { pageMeta, parseListParams } from '../../utils/pagination';
import { assetsRepository } from './assets.repository';

const LIST_OPTIONS = {
  sortable: ['t.name', 't.asset_tag', 't.purchase_date', 't.purchase_cost', 't.created_at', 't.status'],
  defaultSort: 't.created_at',
  filterable: {
    status: 't.status',
    categoryId: 't.category_id',
    locationId: 't.location_id',
  },
};

/** Manual (directly user-triggered) transitions; workflow transitions belong to their modules. */
const MANUAL_TRANSITIONS: ReadonlySet<AssetStatus> = new Set(['retired', 'lost', 'available']);

export const assetsService = {
  async list(rawQuery: Record<string, unknown>) {
    const params = parseListParams(rawQuery, LIST_OPTIONS);
    const { rows, total } = await assetsRepository.list(params);
    return { rows, meta: pageMeta(params, total) };
  },

  async get(id: number) {
    const asset = await assetsRepository.findById(id);
    if (!asset) throw ApiError.notFound('Asset');
    const [images, documents, history, activeAllocation] = await Promise.all([
      assetsRepository.findImages(id),
      assetsRepository.findDocuments(id),
      assetsRepository.findHistory(id),
      assetsRepository.findActiveAllocation(id),
    ]);
    return { ...asset, images, documents, history, active_allocation: activeAllocation };
  },

  async create(data: Record<string, unknown>, actorId: number, ip?: string) {
    const { id, assetTag } = await withTransaction(async (client) => {
      const assetTag = (data.asset_tag as string | undefined) ?? (await assetsRepository.nextAssetTag(client));
      const id = await assetsRepository.create(client, { ...data, asset_tag: assetTag }, actorId);
      return { id, assetTag };
    });
    await logActivity({
      userId: actorId, action: 'asset.create', entityType: 'asset', entityId: id,
      details: { asset_tag: assetTag, name: data.name }, ip,
    });
    return this.get(id);
  },

  async update(id: number, data: Record<string, unknown>, actorId: number, ip?: string) {
    const existing = await assetsRepository.findById(id);
    if (!existing) throw ApiError.notFound('Asset');
    await assetsRepository.update(id, data);
    await logActivity({
      userId: actorId, action: 'asset.update', entityType: 'asset', entityId: id,
      details: { changed: Object.keys(data) }, ip,
    });
    return this.get(id);
  },

  /** Manual lifecycle actions: retire, mark lost, mark found. */
  async changeStatus(id: number, to: AssetStatus, reason: string, actorId: number, ip?: string) {
    if (!MANUAL_TRANSITIONS.has(to)) {
      throw ApiError.badRequest(
        `Status '${to}' can only be reached through its workflow (allocation, transfer or maintenance)`,
      );
    }
    await withTransaction(async (client) => {
      const from = await changeAssetStatus(client, id, to, actorId, reason);
      await logActivity(
        {
          userId: actorId, action: 'asset.status_change', entityType: 'asset', entityId: id,
          details: { from, to, reason }, ip,
        },
        client,
      );
    });
    return this.get(id);
  },

  async addImage(assetId: number, fileUrl: string, isPrimary: boolean, actorId: number) {
    await this.assertExists(assetId);
    await assetsRepository.addImage(assetId, fileUrl, isPrimary);
    await logActivity({ userId: actorId, action: 'asset.image_add', entityType: 'asset', entityId: assetId });
    return assetsRepository.findImages(assetId);
  },

  async removeImage(assetId: number, imageId: number, actorId: number) {
    await assetsRepository.removeImage(assetId, imageId);
    await logActivity({ userId: actorId, action: 'asset.image_remove', entityType: 'asset', entityId: assetId });
  },

  async addDocument(
    assetId: number,
    data: { title: string; doc_type: string; file_url: string },
    actorId: number,
  ) {
    await this.assertExists(assetId);
    await assetsRepository.addDocument(assetId, data, actorId);
    await logActivity({ userId: actorId, action: 'asset.document_add', entityType: 'asset', entityId: assetId });
    return assetsRepository.findDocuments(assetId);
  },

  async removeDocument(assetId: number, documentId: number, actorId: number) {
    await assetsRepository.removeDocument(assetId, documentId);
    await logActivity({ userId: actorId, action: 'asset.document_remove', entityType: 'asset', entityId: assetId });
  },

  async assertExists(id: number) {
    if (!(await assetsRepository.findById(id))) throw ApiError.notFound('Asset');
  },
};
