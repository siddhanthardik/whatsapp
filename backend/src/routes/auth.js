const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

function handleValidation(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, data: {}, message: 'Validation failed', errors: errors.array() });
	}
	return next();
}

// POST /api/auth/register
router.post(
	'/register',
	[
		body('name').trim().notEmpty().withMessage('Name is required'),
		body('email').isEmail().withMessage('Valid email is required'),
		body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
	],
	handleValidation,
	authController.register
);

// POST /api/auth/login
router.post(
	'/login',
	[body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')],
	handleValidation,
	authController.login
);

// POST /api/auth/logout
router.post('/logout', [body('refreshToken').notEmpty().withMessage('Refresh token required')], handleValidation, authController.logout);

// POST /api/auth/refresh-token
router.post(
	'/refresh-token',
	[body('refreshToken').notEmpty().withMessage('Refresh token required')],
	handleValidation,
	authController.refreshToken
);

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().withMessage('Valid email is required')], handleValidation, authController.forgotPassword);

// POST /api/auth/reset-password
router.post(
	'/reset-password',
	[body('token').notEmpty().withMessage('Token is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
	handleValidation,
	authController.resetPassword
);

// POST /api/auth/enable-2fa (authenticated)
router.post('/enable-2fa', verifyToken, authController.enable2FA);

// POST /api/auth/verify-2fa (authenticated)
router.post(
	'/verify-2fa',
	verifyToken,
	[body('token').notEmpty().withMessage('TOTP token is required')],
	handleValidation,
	authController.verify2FA
);

module.exports = router;
