const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireOrgAccess } = require('../middleware/auth');

const usersController = require('../controllers/usersController');

// GET /api/users - only org_admin and super_admin can list users
router.get('/', verifyToken, requireRole('super_admin', 'org_admin'), usersController.listUsers);

// GET /api/users/:id - authenticated users can fetch their own profile (controllers enforce ownership)
router.get('/:id', verifyToken, usersController.getUser);

// PUT /api/users/:id - update user (self or admin)
router.put('/:id', verifyToken, usersController.updateUser);

// DELETE /api/users/:id - delete user (self or admin)
router.delete('/:id', verifyToken, usersController.deleteUser);

module.exports = router;
