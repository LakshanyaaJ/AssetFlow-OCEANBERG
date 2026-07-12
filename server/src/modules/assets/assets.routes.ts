import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, noContent, ok } from '../../utils/response';
import { assetsService } from './assets.service';

const assetBodySchema = z.object({
  asset_tag: z.string().trim().max(30).optional(), // auto-generated when omitted
  name: z.string().trim().min(2).max(150),
  category_id: z.number().int().positive(),
  location_id: z.number().int().positive(),
  serial_number: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  vendor: z.string().trim().max(120).nullable().optional(),
  purchase_date: z.string().date().nullable().optional(),
  purchase_cost: z.number().min(0).nullable().optional(),
  warranty_expiry: z.string().date().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

const statusSchema = z.object({
  status: z.enum(['retired', 'lost', 'available']),
  reason: z.string().trim().min(3).max(255),
});

const imageSchema = z.object({
  file_url: z.string().trim().url().max(500),
  is_primary: z.boolean().default(false),
});

const documentSchema = z.object({
  title: z.string().trim().min(2).max(150),
  doc_type: z.enum(['invoice', 'warranty', 'manual', 'insurance', 'other']).default('other'),
  file_url: z.string().trim().url().max(500),
});

const subIdParams = idParamSchema.extend({ subId: z.coerce.number().int().positive() });

export const assetsRouter = Router();
assetsRouter.use(authenticate);

assetsRouter.get('/', authorize('asset.read'), asyncHandler(async (req, res) => {
  const { rows, meta } = await assetsService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

assetsRouter.get('/:id', authorize('asset.read'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await assetsService.get(Number(req.params.id)));
}));

assetsRouter.post('/', authorize('asset.manage'), validate({ body: assetBodySchema }), asyncHandler(async (req, res) => {
  created(res, await assetsService.create(req.body, req.user!.id, req.ip));
}));

assetsRouter.patch('/:id', authorize('asset.manage'), validate({ params: idParamSchema, body: assetBodySchema.partial() }), asyncHandler(async (req, res) => {
  ok(res, await assetsService.update(Number(req.params.id), req.body, req.user!.id, req.ip));
}));

assetsRouter.post('/:id/status', authorize('asset.manage'), validate({ params: idParamSchema, body: statusSchema }), asyncHandler(async (req, res) => {
  ok(res, await assetsService.changeStatus(Number(req.params.id), req.body.status, req.body.reason, req.user!.id, req.ip));
}));

assetsRouter.post('/:id/images', authorize('asset.manage'), validate({ params: idParamSchema, body: imageSchema }), asyncHandler(async (req, res) => {
  created(res, await assetsService.addImage(Number(req.params.id), req.body.file_url, req.body.is_primary, req.user!.id));
}));

assetsRouter.delete('/:id/images/:subId', authorize('asset.manage'), validate({ params: subIdParams }), asyncHandler(async (req, res) => {
  await assetsService.removeImage(Number(req.params.id), Number(req.params.subId), req.user!.id);
  noContent(res);
}));

assetsRouter.post('/:id/documents', authorize('asset.manage'), validate({ params: idParamSchema, body: documentSchema }), asyncHandler(async (req, res) => {
  created(res, await assetsService.addDocument(Number(req.params.id), req.body, req.user!.id));
}));

assetsRouter.delete('/:id/documents/:subId', authorize('asset.manage'), validate({ params: subIdParams }), asyncHandler(async (req, res) => {
  await assetsService.removeDocument(Number(req.params.id), Number(req.params.subId), req.user!.id);
  noContent(res);
}));
