const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');

const { verifyToken } = require('../middleware/auth');
const contactGroupController = require('../controllers/contactGroupController');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, data: {}, message: 'Validation failed', errors: errors.array() });
  }
  return next();
}

// ── Real-time name availability check (MUST be before /:id routes) ──────────
// GET /api/contact-groups/check-name?name=GROUP_NAME
router.get(
  '/check-name',
  verifyToken,
  [query('name').notEmpty().withMessage('name query param is required')],
  handleValidation,
  contactGroupController.checkGroupName
);

// GET all groups for authenticated org
router.get('/', verifyToken, contactGroupController.getContactGroups);

// POST create group
router.post(
  '/',
  verifyToken,
  [body('name').notEmpty().withMessage('Name is required').trim()],
  handleValidation,
  contactGroupController.createContactGroup
);

// PUT update group
router.put(
  '/:id',
  verifyToken,
  [body('name').optional().notEmpty().withMessage('Name cannot be empty').trim()],
  handleValidation,
  contactGroupController.updateContactGroup
);

// DELETE group
router.delete('/:id', verifyToken, contactGroupController.deleteContactGroup);

module.exports = router;
