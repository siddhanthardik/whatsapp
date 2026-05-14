const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const { verifyToken } = require('../middleware/auth');
const contactController = require('../controllers/contactController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, data: {}, message: 'Validation failed', errors: errors.array() });
  }
  return next();
}

// Import contacts (CSV) - file field name: 'file'
router.post('/import', verifyToken, upload.single('file'), contactController.importContacts);

// Create single contact
router.post(
  '/',
  verifyToken,
  [body('phoneNumber').notEmpty().withMessage('phoneNumber is required'), body('email').optional().isEmail().withMessage('Invalid email')],
  handleValidation,
  contactController.createContact
);

// Get contacts (list + filters)
router.get('/', verifyToken, contactController.getContacts);

// GET /api/contacts/lists - grouped contact lists/tags
router.get('/lists', verifyToken, contactController.getContactLists);

// GET /api/contacts/fields - available contact fields for variable mapping
router.get('/fields', verifyToken, contactController.getContactFields);

// Export contacts as CSV
router.get('/export', verifyToken, contactController.exportContacts);

// Update contact
router.put(
  '/:id',
  verifyToken,
  [body('email').optional().isEmail().withMessage('Invalid email')],
  handleValidation,
  contactController.updateContact
);

// Delete contact
router.delete('/:id', verifyToken, contactController.deleteContact);

module.exports = router;
