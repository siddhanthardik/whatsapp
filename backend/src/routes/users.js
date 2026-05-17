const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireOrgAccess } = require('../middleware/auth');

const usersController = require('../controllers/usersController');

// GET /api/users - owner, admin, manager can list users
router.get('/', verifyToken, requireRole('super_admin', 'owner', 'admin', 'manager'), usersController.listUsers);

// GET /api/users/:id - authenticated users can fetch their own profile (controllers enforce ownership)
router.get('/:id', verifyToken, usersController.getUser);

// POST /api/users - owner/admin can invite/create users
router.post('/', verifyToken, requireRole('super_admin', 'owner', 'admin'), usersController.createUser);

// PUT /api/users/:id - update user (self or admin)
router.put('/:id', verifyToken, usersController.updateUser);

// POST /api/users/crashes - log frontend crash to backend system logs
router.post('/crashes', verifyToken, async (req, res) => {
  try {
    const { message, stack, url, metadata } = req.body;
    const logger = require('../utils/logger');
    await logger.critical('api', `Frontend Crash: ${message}`, { message, stack }, {
      ...metadata,
      url,
      organizationId: req.user.organizationId,
      user: { id: req.user.id, email: req.user.email }
    });
    return res.status(200).json({ success: true, message: 'Crash logged successfully' });
  } catch (e) {
    console.error('Failed to log frontend crash:', e.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
