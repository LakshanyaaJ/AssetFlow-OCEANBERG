import { query, queryOne } from '../../config/db';
import { buildListClause, ListParams } from '../../utils/pagination';

const BASE_SELECT = `
  SELECT t.id, t.asset_tag, t.name, t.status, t.serial_number, t.model, t.vendor,
         t.purchase_date, t.purchase_cost, t.warranty_expiry, t.description,
         t.category_id, c.name AS category_name,
         t.location_id, l.name AS location_name,
         (SELECT ai.file_url FROM asset_images ai
           WHERE ai.asset_id = t.id AND ai.is_primary LIMIT 1) AS primary_image_url,
         t.created_at, t.updated_at
  FROM assets t
  JOIN asset_categories c ON c.id = t.category_id
  JOIN locations l ON l.id = t.location_id`;

export const assetsRepository = {
  async list(params: ListParams) {
    const { where, orderLimit, values } = buildListClause(params, [
      't.name', 't.asset_tag', 't.serial_number', 't.model', 't.vendor',
    ]);
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

  findImages(assetId: number) {
    return query(
      `SELECT id, file_url, is_primary, created_at FROM asset_images
       WHERE asset_id = $1 ORDER BY is_primary DESC, id`,
      [assetId],
    );
  },

  findDocuments(assetId: number) {
    return query(
      `SELECT d.id, d.title, d.doc_type, d.file_url, d.created_at, u.full_name AS uploaded_by_name
       FROM asset_documents d LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.asset_id = $1 ORDER BY d.id DESC`,
      [assetId],
    );
  },

  findHistory(assetId: number, limit = 25) {
    return query(
      `SELECT h.id, h.from_status, h.to_status, h.reason, h.changed_at, u.full_name AS changed_by_name
       FROM asset_status_history h LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.asset_id = $1 ORDER BY h.changed_at DESC LIMIT $2`,
      [assetId, limit],
    );
  },

  findActiveAllocation(assetId: number) {
    return queryOne(
      `SELECT aa.id, aa.allocated_at, aa.due_at, e.full_name AS employee_name, e.employee_code
       FROM asset_allocations aa JOIN employees e ON e.id = aa.employee_id
       WHERE aa.asset_id = $1 AND aa.returned_at IS NULL`,
      [assetId],
    );
  },

  async create(data: Record<string, unknown>, createdBy: number) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO assets (asset_tag, name, category_id, location_id, serial_number, model,
                           vendor, purchase_date, purchase_cost, warranty_expiry, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        data.asset_tag, data.name, data.category_id, data.location_id,
        data.serial_number ?? null, data.model ?? null, data.vendor ?? null,
        data.purchase_date ?? null, data.purchase_cost ?? null,
        data.warranty_expiry ?? null, data.description ?? null, createdBy,
      ],
    );
    return row!.id;
  },

  async update(id: number, data: Record<string, unknown>) {
    const updatable = [
      'name', 'category_id', 'location_id', 'serial_number', 'model',
      'vendor', 'purchase_date', 'purchase_cost', 'warranty_expiry', 'description',
    ];
    const cols = updatable.filter((c) => data[c] !== undefined);
    if (cols.length === 0) return;
    const sets = cols.map((c, i) => `${c} = $${i + 2}`);
    await query(`UPDATE assets SET ${sets.join(', ')} WHERE id = $1`, [
      id, ...cols.map((c) => data[c]),
    ]);
  },

  async addImage(assetId: number, fileUrl: string, isPrimary: boolean) {
    if (isPrimary) {
      await query(`UPDATE asset_images SET is_primary = false WHERE asset_id = $1`, [assetId]);
    }
    const row = await queryOne<{ id: number }>(
      `INSERT INTO asset_images (asset_id, file_url, is_primary) VALUES ($1,$2,$3) RETURNING id`,
      [assetId, fileUrl, isPrimary],
    );
    return row!.id;
  },

  async removeImage(assetId: number, imageId: number) {
    await query(`DELETE FROM asset_images WHERE id = $1 AND asset_id = $2`, [imageId, assetId]);
  },

  async addDocument(assetId: number, data: { title: string; doc_type: string; file_url: string }, uploadedBy: number) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO asset_documents (asset_id, title, doc_type, file_url, uploaded_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [assetId, data.title, data.doc_type, data.file_url, uploadedBy],
    );
    return row!.id;
  },

  async removeDocument(assetId: number, documentId: number) {
    await query(`DELETE FROM asset_documents WHERE id = $1 AND asset_id = $2`, [documentId, assetId]);
  },

  /** Next sequential asset tag, e.g. AST-2026-0011 (advisory-locked to avoid duplicates). */
  async nextAssetTag(): Promise<string> {
    const year = new Date().getFullYear();
    const row = await queryOne<{ n: number }>(
      `SELECT count(*)::int + 1 AS n FROM assets WHERE asset_tag LIKE $1`,
      [`AST-${year}-%`],
    );
    return `AST-${year}-${String(row?.n ?? 1).padStart(4, '0')}`;
  },
};
