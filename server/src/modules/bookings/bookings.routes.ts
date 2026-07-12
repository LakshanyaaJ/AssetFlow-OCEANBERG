import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize, getRolePermissions } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { bookingsService } from './bookings.service';

const createSchema = z.object({
  resourceId: z.number().int().positive(),
  purpose: z.string().trim().min(3).max(255),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
});

const calendarQuery = z.object({
  resourceId: z.coerce.number().int().positive(),
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
});

export const bookingsRouter = Router();
bookingsRouter.use(authenticate);

bookingsRouter.get('/mine', asyncHandler(async (req, res) => {
  const { rows, meta } = await bookingsService.list(req.query as Record<string, unknown>, req.user!.id);
  ok(res, rows, meta);
}));

bookingsRouter.get('/calendar', authorize('booking.read'), validate({ query: calendarQuery }), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof calendarQuery>;
  ok(res, await bookingsService.calendar(q.resourceId, q.from, q.to));
}));

bookingsRouter.get('/', authorize('booking.read'), asyncHandler(async (req, res) => {
  const { rows, meta } = await bookingsService.list(req.query as Record<string, unknown>);
  ok(res, rows, meta);
}));

bookingsRouter.get('/:id', authorize('booking.read'), validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  ok(res, await bookingsService.get(Number(req.params.id)));
}));

bookingsRouter.post('/', authorize('booking.create'), validate({ body: createSchema }), asyncHandler(async (req, res) => {
  created(res, await bookingsService.create(req.body, req.user!.id, req.ip));
}));

bookingsRouter.post('/:id/cancel', validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  const permissions = await getRolePermissions(req.user!.roleId);
  ok(res, await bookingsService.cancel(Number(req.params.id), req.user!.id, permissions.has('booking.manage'), req.ip));
}));
