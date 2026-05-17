const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { verifyToken, requireRole, requireOrgAccess } = require('../middleware/auth');
const { checkLimit } = require('../middleware/subscriptionLimits');
const campaignController = require('../controllers/campaignController');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, data: {}, message: 'Validation failed', errors: errors.array() });
  return next();
}

// GET /api/campaigns
router.get('/', verifyToken, requireOrgAccess, campaignController.getCampaigns);

// GET /api/campaigns/:id
router.get('/:id', verifyToken, requireOrgAccess, campaignController.getCampaignById);

// POST /api/campaigns
router.post(
  '/',
  verifyToken,
  requireRole('manager', 'admin', 'owner', 'super_admin'),
  checkLimit('campaigns'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('templateId').notEmpty().withMessage('templateId is required'),
    body('contactListIds').optional().isArray().withMessage('contactListIds must be an array'),
    body('sendRate').optional().isInt({ min: 1, max: 60 }).withMessage('sendRate between 1 and 60'),
  ],
  handleValidation,
  campaignController.createCampaign
);

// PUT /api/campaigns/:id
router.put('/:id', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), handleValidation, campaignController.updateCampaign);

// DELETE /api/campaigns/:id
router.delete('/:id', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), campaignController.deleteCampaign);

// POST /api/campaigns/:id/status  (action: start|pause|resume|cancel)
router.post('/:id/status', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), [body('action').notEmpty().withMessage('Action required')], handleValidation, campaignController.changeStatus);

// POST /api/campaigns/:id/launch
router.post('/:id/launch', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), campaignController.launchCampaign);

// POST /api/campaigns/:id/pause
router.post('/:id/pause', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), campaignController.pauseCampaign);

// POST /api/campaigns/:id/resume
router.post('/:id/resume', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), campaignController.resumeCampaign);

// POST /api/campaigns/:id/cancel
router.post('/:id/cancel', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), campaignController.cancelCampaign);

// GET /api/campaigns/:id/stats (live queue stats)
router.get('/:id/stats', verifyToken, requireOrgAccess, campaignController.getCampaignById);

module.exports = router;
