const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireOrgAccess } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Delivery report list
router.get('/campaigns/:campaignId/delivery', verifyToken, requireRole('campaign_manager', 'org_admin', 'super_admin'), reportController.getDeliveryReport);

// Export CSV/PDF
router.get('/campaigns/:campaignId/delivery/export/csv', verifyToken, requireRole('campaign_manager', 'org_admin', 'super_admin'), reportController.exportDeliveryReportCSV);
router.get('/campaigns/:campaignId/delivery/export/pdf', verifyToken, requireRole('campaign_manager', 'org_admin', 'super_admin'), reportController.exportDeliveryReportPDF);

// Opt-out reports
router.get('/opt-outs', verifyToken, requireRole('campaign_manager', 'org_admin', 'super_admin'), reportController.getOptOutReport);
router.get('/opt-outs/export/csv', verifyToken, requireRole('campaign_manager', 'org_admin', 'super_admin'), reportController.exportOptOutCSV);

module.exports = router;
