import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { usersService } from './users.service';

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a digit');

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120),
  roleId: z.number().int().positive(),
});

const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    roleId: z.number().int().positive(),
    isActive: z.boolean(),
    password: passwordSchema,
  })
  .partial();

export const usersRouter = Router();
usersRouter.use(authenticate, authorize('user.manage'));

usersRouter.get('/roles', asyncHandler(async (_req, res) => {
  ok(res, await usersService.listRoles());
}));

usersRouter.get('/', asyncHandler(async (req, res) => {
  const { rows, meta } = await usersService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

usersRouter.get('/:id', validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await usersService.get(Number(req.params.id)));
}));

usersRouter.post('/', validate({ body: createUserSchema }), asyncHandler(async (req, res) => {
  created(res, await usersService.create(req.body, req.user!.id, req.ip));
}));

usersRouter.patch('/:id', validate({ params: idParamSchema, body: updateUserSchema }), asyncHandler(async (req, res) => {
  ok(res, await usersService.update(Number(req.params.id), req.body, req.user!.id, req.ip));
}));
