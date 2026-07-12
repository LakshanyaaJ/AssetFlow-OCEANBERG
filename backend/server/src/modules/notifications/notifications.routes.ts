import { Router } from 'express';
import { query, queryOne } from '../../config/db';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../shared/crud';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';

/**
 * Notifications are strictly per-user: every query is scoped to req.user.id,
 * so no user can read or mutate another user's notifications.
 */
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const rows = await query(
    `SELECT id, title, message, n_type, entity_type, entity_id, is_read, created_at
     FROM notifications
     WHERE user_id = $1 ${unreadOnly ? 'AND NOT is_read' : ''}
     ORDER BY created_at DESC LIMIT $2`,
    [req.user!.id, limit],
  );
  ok(res, rows);
}));

notificationsRouter.get('/unread-count', asyncHandler(async (req, res) => {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM notifications WHERE user_id = $1 AND NOT is_read`,
    [req.user!.id],
  );
  ok(res, { count: row?.count ?? 0 });
}));

notificationsRouter.post('/:id/read', validate({ params: idParamSchema }), asyncHandler(async (req, res) => {
  await query(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [
    Number(req.params.id), req.user!.id,
  ]);
  ok(res, { message: 'Marked as read' });
}));

notificationsRouter.post('/read-all', asyncHandler(async (req, res) => {
  await query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND NOT is_read`, [req.user!.id]);
  ok(res, { message: 'All notifications marked as read' });
}));
