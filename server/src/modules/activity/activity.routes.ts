import { Router } from 'express';
import { query, queryOne } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildListClause, pageMeta, parseListParams } from '../../utils/pagination';
import { ok } from '../../utils/response';

const BASE_SELECT = `
  SELECT t.id, t.action, t.entity_type, t.entity_id, t.details, t.ip_address, t.created_at,
         t.user_id, u.full_name AS user_name
  FROM activity_logs t LEFT JOIN users u ON u.id = t.user_id`;

const LIST_OPTIONS = {
  sortable: ['t.created_at', 't.action'],
  defaultSort: 't.created_at',
  filterable: { action: 't.action', entityType: 't.entity_type', entityId: 't.entity_id', userId: 't.user_id' },
};

export const activityRouter = Router();
activityRouter.use(authenticate, authorize('activity.read'));

activityRouter.get('/', asyncHandler(async (req, res) => {
  const params = parseListParams(req.query as Record<string, unknown>, LIST_OPTIONS);
  const { where, orderLimit, values } = buildListClause(params, ['t.action', 'u.full_name']);
  const rows = await query(`${BASE_SELECT} ${where} ${orderLimit}`, values);
  const totalRow = await queryOne<{ total: number }>(
    `SELECT count(*)::int AS total FROM (${BASE_SELECT} ${where}) sub`,
    values.slice(0, -2),
  );
  ok(res, rows, pageMeta(params, totalRow?.total ?? 0));
}));
