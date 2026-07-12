import { z } from 'zod';
import { makeCrudRouter } from '../../shared/crud';

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  resource_type: z.enum(['meeting_room', 'vehicle', 'equipment', 'workspace']),
  location_id: z.number().int().positive(),
  capacity: z.number().int().positive().nullable().optional(),
  description: z.string().trim().max(255).optional(),
});

export const { router: resourcesRouter } = makeCrudRouter({
  cfg: {
    entity: 'Resource',
    entityType: 'resource',
    table: 'resources',
    baseSelect: `
      SELECT t.id, t.name, t.code, t.resource_type, t.capacity, t.description,
             t.location_id, l.name AS location_name, t.is_active, t.created_at,
             (SELECT count(*)::int FROM bookings b
               WHERE b.resource_id = t.id AND b.status = 'confirmed' AND b.ends_at > now()) AS upcoming_bookings
      FROM resources t JOIN locations l ON l.id = t.location_id`,
    insertable: ['name', 'code', 'resource_type', 'location_id', 'capacity', 'description'],
    updatable: ['name', 'code', 'resource_type', 'location_id', 'capacity', 'description', 'is_active'],
    searchable: ['t.name', 't.code'],
    sortable: ['t.name', 't.code', 't.resource_type', 't.created_at'],
    defaultSort: 't.name',
    filterable: { resourceType: 't.resource_type', locationId: 't.location_id', isActive: 't.is_active' },
    softDelete: true,
  },
  createSchema,
  updateSchema: createSchema.extend({ is_active: z.boolean() }).partial(),
  readPermissions: ['booking.read'],
  managePermissions: ['resource.manage'],
});
