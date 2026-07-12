import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { reportsRepository } from './reports.repository';

export const reportsRouter = Router();
reportsRouter.use(authenticate);

/** Dashboard: any authenticated user (counts only, no sensitive detail). */
reportsRouter.get('/dashboard', asyncHandler(async (_req, res) => {
  const [counts, byStatus, recent] = await Promise.all([
    reportsRepository.dashboardCounts(),
    reportsRepository.assetsByStatus(),
    reportsRepository.recentActivity(10),
  ]);
  ok(res, { counts, assets_by_status: byStatus, recent_activity: recent });
}));

reportsRouter.use(authorize('report.read'));

reportsRouter.get('/assets', asyncHandler(async (_req, res) => {
  const [byStatus, byCategory, byLocation] = await Promise.all([
    reportsRepository.assetsByStatus(),
    reportsRepository.assetsByCategory(),
    reportsRepository.assetsByLocation(),
  ]);
  ok(res, { by_status: byStatus, by_category: byCategory, by_location: byLocation });
}));

reportsRouter.get('/maintenance', asyncHandler(async (req, res) => {
  const months = Math.min(Number(req.query.months) || 12, 36);
  ok(res, await reportsRepository.maintenanceCostByMonth(months));
}));

reportsRouter.get('/allocations', asyncHandler(async (_req, res) => {
  ok(res, await reportsRepository.allocationSummary());
}));

reportsRouter.get('/utilization', asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);
  ok(res, await reportsRepository.resourceUtilization(days));
}));

reportsRouter.get('/audits', asyncHandler(async (_req, res) => {
  ok(res, await reportsRepository.auditSummary());
}));
