import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { allocationsService } from './allocations.service';

const allocateSchema = z.object({
  assetId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

const returnSchema = z.object({
  condition: z.enum(['good', 'damaged', 'needs_repair']),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const allocationsRouter = Router();
allocationsRouter.use(authenticate);

allocationsRouter.get('/mine', asyncHandler(async (req, res) => {
  ok(res, await allocationsService.listMine(req.user!.id));
}));

allocationsRouter.get('/', authorize('allocation.read'), asyncHandler(async (req, res) => {
  const { rows, meta } = await allocationsService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

allocationsRouter.get('/:id', authorize('allocation.read'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await allocationsService.get(Number(req.params.id)));
}));

allocationsRouter.post('/', authorize('allocation.manage'), validate({ body: allocateSchema }), asyncHandler(async (req, res) => {
  created(res, await allocationsService.allocate(req.body, req.user!.id, req.ip));
}));

allocationsRouter.post('/:id/return', authorize('allocation.manage'), validate({ params: idParamSchema, body: returnSchema }), asyncHandler(async (req, res) => {
  ok(res, await allocationsService.processReturn(Number(req.params.id), req.body, req.user!.id, req.ip));
}));
