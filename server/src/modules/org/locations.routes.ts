import { z } from 'zod';
import { makeCrudRouter } from '../../shared/crud';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(80).optional(),
  parent_id: z.number().int().positive().nullable().optional(),
});

export const { router: locationsRouter } = makeCrudRouter({
  cfg: {
    entity: 'Location',
    entityType: 'location',
    table: 'locations',
    baseSelect: `
      SELECT t.id, t.name, t.code, t.address, t.city, t.parent_id,
             p.name AS parent_name, t.is_active, t.created_at,
             (SELECT count(*)::int FROM assets a WHERE a.location_id = t.id) AS asset_count
      FROM locations t LEFT JOIN locations p ON p.id = t.parent_id`,
    insertable: ['name', 'code', 'address', 'city', 'parent_id'],
    updatable: ['name', 'code', 'address', 'city', 'parent_id', 'is_active'],
    searchable: ['t.name', 't.code', 't.city'],
    sortable: ['t.name', 't.code', 't.city', 't.created_at'],
    defaultSort: 't.name',
    filterable: { isActive: 't.is_active', city: 't.city' },
    softDelete: true,
  },
  createSchema,
  updateSchema: createSchema.extend({ is_active: z.boolean() }).partial(),
  readPermissions: ['org.read'],
  managePermissions: ['org.manage'],
});
