const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Expose analytics endpoints used by the frontend
// GET /api/analytics/dashboard
router.get('/dashboard', verifyToken, requireRole('analyst', 'org_admin', 'super_admin'), analyticsController.getDashboardStats);

// GET /api/analytics/campaigns/:id
router.get('/campaigns/:id', verifyToken, requireRole('analyst', 'org_admin', 'super_admin'), analyticsController.getCampaignAnalytics);

// GET /api/analytics/trends
router.get('/trends', verifyToken, requireRole('analyst', 'org_admin', 'super_admin'), analyticsController.getMessageTrends);

// GET /api/analytics/top-templates
router.get('/top-templates', verifyToken, requireRole('analyst', 'org_admin', 'super_admin'), analyticsController.getTopTemplates);

// GET /api/analytics/heatmap
router.get('/heatmap', verifyToken, requireRole('analyst', 'org_admin', 'super_admin'), analyticsController.getHeatmap);

// GET /api/analytics/audience-growth
router.get('/audience-growth', verifyToken, requireRole('analyst', 'org_admin', 'super_admin'), analyticsController.getAudienceGrowth);

module.exports = router;
