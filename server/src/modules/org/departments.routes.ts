import { z } from 'zod';
import { makeCrudRouter } from '../../shared/crud';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  description: z.string().trim().max(255).optional(),
});

export const { router: departmentsRouter } = makeCrudRouter({
  cfg: {
    entity: 'Department',
    entityType: 'department',
    table: 'departments',
    baseSelect: `
      SELECT t.id, t.name, t.code, t.description, t.is_active, t.created_at,
             (SELECT count(*)::int FROM employees e WHERE e.department_id = t.id) AS employee_count
      FROM departments t`,
    insertable: ['name', 'code', 'description'],
    updatable: ['name', 'code', 'description', 'is_active'],
    searchable: ['t.name', 't.code'],
    sortable: ['t.name', 't.code', 't.created_at'],
    defaultSort: 't.name',
    filterable: { isActive: 't.is_active' },
    softDelete: true,
  },
  createSchema,
  updateSchema: createSchema.extend({ is_active: z.boolean() }).partial(),
  readPermissions: ['org.read'],
  managePermissions: ['org.manage'],
});
