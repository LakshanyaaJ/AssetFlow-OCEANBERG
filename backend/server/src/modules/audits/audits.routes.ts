import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { auditsService } from './audits.service';

const createSchema = z
  .object({
    name: z.string().trim().min(3).max(150),
    locationId: z.number().int().positive().nullable().optional(),
    startsOn: z.string().date(),
    endsOn: z.string().date(),
  })
  .refine((v) => v.endsOn >= v.startsOn, { message: 'endsOn must be on or after startsOn', path: ['endsOn'] });

const checkItemSchema = z.object({
  status: z.enum(['found', 'missing', 'damaged', 'misplaced']),
  remarks: z.string().trim().max(500).nullable().optional(),
});

const itemParams = idParamSchema.extend({ itemId: z.coerce.number().int().positive() });

export const auditsRouter = Router();
auditsRouter.use(authenticate);

auditsRouter.get('/', authorize('audit.read'), asyncHandler(async (req, res) => {
  const { rows, meta } = await auditsService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

auditsRouter.get('/stats', authorize('audit.read'), asyncHandler(async (req, res) => {
  ok(res, await auditsService.stats());
}));

auditsRouter.get('/discrepancies', authorize('audit.read'), asyncHandler(async (_req, res) => {
  ok(res, await auditsService.listDiscrepancies());
}));

auditsRouter.get(
  '/asset/:assetId/history',
  authorize('audit.read'),
  validate({ params: z.object({ assetId: z.coerce.number().int().positive() }) }),
  asyncHandler(async (req, res) => {
    ok(res, await auditsService.historyForAsset(Number(req.params.assetId)));
  }),
);

auditsRouter.get('/:id', authorize('audit.read'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await auditsService.get(Number(req.params.id)));
}));

auditsRouter.post('/', authorize('audit.manage'), validate({ body: createSchema }), asyncHandler(async (req, res) => {
  created(res, await auditsService.create(req.body, req.user!.id, req.ip));
}));

auditsRouter.post('/:id/start', authorize('audit.manage'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await auditsService.start(Number(req.params.id), req.user!.id, req.ip));
}));

auditsRouter.post('/:id/items/:itemId/check', authorize('audit.execute', 'audit.manage'), validate({ params: itemParams, body: checkItemSchema }), asyncHandler(async (req, res) => {
  ok(res, await auditsService.checkItem(Number(req.params.id), Number(req.params.itemId), req.body, req.user!.id, req.ip));
}));

auditsRouter.post('/:id/complete', authorize('audit.manage'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await auditsService.complete(Number(req.params.id), req.user!.id, req.ip));
}));

auditsRouter.post('/:id/cancel', authorize('audit.manage'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await auditsService.cancel(Number(req.params.id), req.user!.id, req.ip));
}));
