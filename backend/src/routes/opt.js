const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireOrgAccess } = require('../middleware/auth');
const optController = require('../controllers/optController');

// GET /api/opt/ins
router.get('/ins', verifyToken, requireOrgAccess, optController.getOptInList);

// GET /api/opt/outs
router.get('/outs', verifyToken, requireOrgAccess, optController.getOptOutList);

// POST /api/opt/contacts/:contactId/opt-out (manual)
router.post('/contacts/:contactId/opt-out', verifyToken, requireRole('admin', 'owner', 'super_admin', 'manager'), optController.manualOptOut);

// POST /api/opt/contacts/:contactId/opt-in (manual re-opt-in)
router.post('/contacts/:contactId/opt-in', verifyToken, requireRole('admin', 'owner', 'super_admin', 'manager'), optController.manualOptIn);

// POST /api/opt/web (public web form opt-in)
router.post('/web', optController.processWebOptIn);

// GET /api/opt/stats
router.get('/stats', verifyToken, requireOrgAccess, optController.getOptInStats);

// GET /api/opt/outs/export
router.get('/outs/export', verifyToken, requireRole('admin', 'owner', 'super_admin', 'manager'), optController.exportOptOutList);

module.exports = router;
