import express from 'express';
import { DashboardService } from '../../services/dashboard.service.js';
import { requirePermission, requireAnyPermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = express.Router();
const dashboardService = new DashboardService();

// Get dashboard overview (requires analytics or reports view permission)
router.get('/',
  requireAnyPermission([PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.REPORTS_VIEW]),
  asyncHandler(async (req, res) => {
    const overview = await dashboardService.getDashboardOverview();
    res.json(overview);
  })
);

// Get sales analytics (requires analytics view permission)
router.get('/analytics/sales',
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(async (req, res) => {
    const salesAnalytics = await dashboardService.getSalesAnalytics(req.query);
    res.json(salesAnalytics);
  })
);

// Get user analytics (requires analytics view permission)
router.get('/analytics/users',
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(async (req, res) => {
    const userAnalytics = await dashboardService.getUserAnalytics(req.query);
    res.json(userAnalytics);
  })
);

// Get product analytics (requires analytics view permission)
router.get('/analytics/products',
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(async (req, res) => {
    const productAnalytics = await dashboardService.getProductAnalytics(req.query);
    res.json(productAnalytics);
  })
);

// Get reports list (requires reports view permission)
router.get('/reports',
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  asyncHandler(async (req, res) => {
    const reports = await dashboardService.getAvailableReports();
    res.json(reports);
  })
);

// Generate specific report (requires reports view permission)
router.post('/reports/:reportType',
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  asyncHandler(async (req, res) => {
    const report = await dashboardService.generateReport(req.params.reportType, req.body);
    res.json(report);
  })
);

// Get audit logs (requires audit logs view permission)
router.get('/audit-logs',
  requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
  asyncHandler(async (req, res) => {
    const logs = await dashboardService.getAuditLogs(req.query);
    res.json(logs);
  })
);

// Get system health status (requires system health view permission)
router.get('/system-health',
  requirePermission(PERMISSIONS.SYSTEM_HEALTH_VIEW),
  asyncHandler(async (req, res) => {
    const health = await dashboardService.getSystemHealth();
    res.json(health);
  })
);

export default router;
