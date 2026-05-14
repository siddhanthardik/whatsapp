const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const orgController = require('../controllers/organizationController');

// GET /api/organization -> returns organization for current user
router.get('/', verifyToken, orgController.getOrganization);

// PUT /api/organization -> update current user's organization
router.put('/', verifyToken, orgController.updateOrganization);

module.exports = router;
