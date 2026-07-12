import { z } from 'zod';
import { makeCrudRouter } from '../../shared/crud';

const createSchema = z.object({
  employee_code: z.string().trim().min(1).max(20).toUpperCase(),
  full_name: z.string().trim().min(2).max(120),
  designation: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  department_id: z.number().int().positive(),
  location_id: z.number().int().positive(),
  user_id: z.number().int().positive().nullable().optional(),
  joined_on: z.string().date().optional(),
});

export const { router: employeesRouter } = makeCrudRouter({
  cfg: {
    entity: 'Employee',
    entityType: 'employee',
    table: 'employees',
    baseSelect: `
      SELECT t.id, t.employee_code, t.full_name, t.designation, t.phone,
             t.department_id, d.name AS department_name,
             t.location_id, l.name AS location_name,
             t.user_id, t.joined_on, t.is_active, t.created_at,
             (SELECT count(*)::int FROM asset_allocations aa
               WHERE aa.employee_id = t.id AND aa.returned_at IS NULL) AS active_allocations
      FROM employees t
      JOIN departments d ON d.id = t.department_id
      JOIN locations l ON l.id = t.location_id`,
    insertable: ['employee_code', 'full_name', 'designation', 'phone', 'department_id', 'location_id', 'user_id', 'joined_on'],
    updatable: ['full_name', 'designation', 'phone', 'department_id', 'location_id', 'user_id', 'is_active'],
    searchable: ['t.full_name', 't.employee_code', 't.designation'],
    sortable: ['t.full_name', 't.employee_code', 't.joined_on', 't.created_at'],
    defaultSort: 't.full_name',
    filterable: { departmentId: 't.department_id', locationId: 't.location_id', isActive: 't.is_active' },
    softDelete: true,
  },
  createSchema,
  updateSchema: createSchema.extend({ is_active: z.boolean() }).partial(),
  readPermissions: ['org.read'],
  managePermissions: ['org.manage'],
});
