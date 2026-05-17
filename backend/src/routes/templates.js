const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { verifyToken, requireRole } = require('../middleware/auth');
const { checkLimit } = require('../middleware/subscriptionLimits');
const templateController = require('../controllers/templateController');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, data: {}, message: 'Validation failed', errors: errors.array() });
  return next();
}

// GET /api/templates - list templates (org-scoped)
router.get('/', verifyToken, templateController.getTemplates);

// GET /api/templates/:id - get single template
router.get('/:id', verifyToken, templateController.getTemplateById);

// POST /api/templates - create template (DRAFT initially)
router.post(
  '/',
  verifyToken,
  requireRole('manager', 'admin', 'owner', 'super_admin'),
  checkLimit('templates'),
  [
    body('name').trim().notEmpty().withMessage('Display name is required'),
    body('templateId').optional().trim().matches(/^[a-z0-9_]+$/).withMessage('Template ID must be lowercase letters, numbers, and underscores'),
    body('category').optional().trim().isIn(['UTILITY','MARKETING','AUTHENTICATION']).withMessage('Category must be UTILITY, MARKETING, or AUTHENTICATION'),
    body('language').optional().trim(),
    body('body').custom((value) => {
      if (!value || !value.text) throw new Error('Message body text is required');
      if (value.variables && !Array.isArray(value.variables)) throw new Error('Variables must be an array');
      return true;
    }),
  ],
  handleValidation,
  templateController.createTemplate
);

// POST /api/templates/:id/submit - submit template to WhatsApp (DRAFT → PENDING)
router.post('/:id/submit', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), templateController.submitToWhatsApp);

// PUT /api/templates/:id - update template (only if DRAFT or REJECTED)
router.put(
  '/:id',
  verifyToken,
  requireRole('manager', 'admin', 'owner', 'super_admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('body').optional().custom((value) => {
      if (value && value.text === '') throw new Error('Body text cannot be empty');
      return true;
    }),
  ],
  handleValidation,
  templateController.updateTemplate
);

// DELETE /api/templates/:id
router.delete('/:id', verifyToken, requireRole('manager', 'admin', 'owner', 'super_admin'), templateController.deleteTemplate);

module.exports = router;
