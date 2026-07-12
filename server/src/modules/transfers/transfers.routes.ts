import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { transfersService } from './transfers.service';

const requestSchema = z.object({
  assetId: z.number().int().positive(),
  toLocationId: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
});

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).nullable().optional(),
});

export const transfersRouter = Router();
transfersRouter.use(authenticate);

transfersRouter.get('/', authorize('transfer.read'), asyncHandler(async (req, res) => {
  const { rows, meta } = await transfersService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

transfersRouter.get('/:id', authorize('transfer.read'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await transfersService.get(Number(req.params.id)));
}));

transfersRouter.post('/', authorize('transfer.request'), validate({ body: requestSchema }), asyncHandler(async (req, res) => {
  created(res, await transfersService.request(req.body, req.user!.id, req.ip));
}));

transfersRouter.post('/:id/decision', authorize('transfer.approve'), validate({ params: idParamSchema, body: decisionSchema }), asyncHandler(async (req, res) => {
  ok(res, await transfersService.decide(Number(req.params.id), req.body.decision, req.body.note ?? null, req.user!.id, req.ip));
}));

transfersRouter.post('/:id/complete', authorize('transfer.approve'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await transfersService.complete(Number(req.params.id), req.user!.id, req.ip));
}));

transfersRouter.post('/:id/cancel', authorize('transfer.request'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await transfersService.cancel(Number(req.params.id), req.user!.id, req.ip));
}));
