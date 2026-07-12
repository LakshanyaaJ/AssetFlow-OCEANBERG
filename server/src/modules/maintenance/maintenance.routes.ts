import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, getRolePermissions } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { maintenanceService } from './maintenance.service';

const requestSchema = z.object({
  assetId: z.number().int().positive(),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  maintenanceType: z.enum(['corrective', 'preventive']).default('corrective'),
});

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  scheduledFor: z.string().date().nullable().optional(),
  assignEmployeeId: z.number().int().positive().nullable().optional(),
});

const assignSchema = z.object({
  employeeId: z.number().int().positive(),
  notes: z.string().trim().max(500).nullable().optional(),
});

const completeSchema = z.object({
  resolution: z.string().trim().min(3).max(500),
  cost: z.number().min(0).nullable().optional(),
});

async function canApprove(roleId: number) {
  return (await getRolePermissions(roleId)).has('maintenance.approve');
}

export const maintenanceRouter = Router();
maintenanceRouter.use(authenticate);

maintenanceRouter.get('/', authorize('maintenance.read'), asyncHandler(async (req, res) => {
  const { rows, meta } = await maintenanceService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

maintenanceRouter.get('/:id', authorize('maintenance.read'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await maintenanceService.get(Number(req.params.id)));
}));

maintenanceRouter.post('/', authorize('maintenance.request'), validate({ body: requestSchema }), asyncHandler(async (req, res) => {
  created(res, await maintenanceService.request(req.body, req.user!.id, req.ip));
}));

maintenanceRouter.post('/:id/decision', authorize('maintenance.approve'), validate({ params: idParamSchema, body: decisionSchema }), asyncHandler(async (req, res) => {
  ok(res, await maintenanceService.decide(Number(req.params.id), req.body, req.user!.id, req.ip));
}));

maintenanceRouter.post('/:id/assign', authorize('maintenance.approve'), validate({ params: idParamSchema, body: assignSchema }), asyncHandler(async (req, res) => {
  ok(res, await maintenanceService.assign(Number(req.params.id), req.body.employeeId, req.body.notes ?? null, req.user!.id, req.ip));
}));

maintenanceRouter.post('/:id/start', authorize('maintenance.execute', 'maintenance.approve'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await maintenanceService.start(Number(req.params.id), req.user!.id, await canApprove(req.user!.roleId), req.ip));
}));

maintenanceRouter.post('/:id/complete', authorize('maintenance.execute', 'maintenance.approve'), validate({ params: idParamSchema, body: completeSchema }), asyncHandler(async (req, res) => {
  ok(res, await maintenanceService.complete(Number(req.params.id), req.body, req.user!.id, await canApprove(req.user!.roleId), req.ip));
}));

maintenanceRouter.post('/:id/cancel', authorize('maintenance.request'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await maintenanceService.cancel(Number(req.params.id), req.user!.id, req.ip));
}));
