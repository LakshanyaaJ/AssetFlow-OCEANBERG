import { z } from 'zod';
import { makeCrudRouter } from '../../shared/crud';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  parent_id: z.number().int().positive().nullable().optional(),
  depreciation_rate: z.number().min(0).max(100).nullable().optional(),
  description: z.string().trim().max(255).optional(),
});

export const { router: categoriesRouter } = makeCrudRouter({
  cfg: {
    entity: 'Asset category',
    entityType: 'asset_category',
    table: 'asset_categories',
    baseSelect: `
      SELECT t.id, t.name, t.code, t.parent_id, p.name AS parent_name,
             t.depreciation_rate, t.description, t.is_active, t.created_at,
             (SELECT count(*)::int FROM assets a WHERE a.category_id = t.id) AS asset_count
      FROM asset_categories t LEFT JOIN asset_categories p ON p.id = t.parent_id`,
    insertable: ['name', 'code', 'parent_id', 'depreciation_rate', 'description'],
    updatable: ['name', 'code', 'parent_id', 'depreciation_rate', 'description', 'is_active'],
    searchable: ['t.name', 't.code'],
    sortable: ['t.name', 't.code', 't.created_at'],
    defaultSort: 't.name',
    filterable: { isActive: 't.is_active', parentId: 't.parent_id' },
    softDelete: true,
  },
  createSchema,
  updateSchema: createSchema.extend({ is_active: z.boolean() }).partial(),
  readPermissions: ['asset.read'],
  managePermissions: ['asset.manage'],
});
