const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const orgController = require('../controllers/organizationController');

// GET /api/organizations/me -> return current user's organization (by orgId or ownerId)
router.get('/me', verifyToken, orgController.getMe);

// PATCH /api/organizations/me -> update current user's organization (partial)
router.patch('/me', verifyToken, orgController.patchMe);

module.exports = router;
