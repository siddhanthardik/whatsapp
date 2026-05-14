const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const orgController = require('../controllers/organizationController');

router.get('/me', verifyToken, orgController.getMe);
router.patch('/me', verifyToken, orgController.patchMe);

module.exports = router;
