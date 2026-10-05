const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');
const { requireAuth, requireRole, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { sendSuccess } = require('../utils/responseHandler');

// Public IAM Authentication Routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/google', authController.initiateGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);
router.post('/google/confirm-role', authController.confirmGoogleRole);
router.post('/google', authController.googleAuth);

// Protected IAM Identity & Session Routes
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);
router.post('/change-password', requireAuth, authController.changePassword);


// Demonstration IAM Protected Resource Routes for Verification
router.get(
  '/iam-test-farmer-inventory',
  requireAuth,
  requireRole('FARMER', 'ADMIN'),
  requirePermission(PERMISSIONS.MANAGE_INVENTORY),
  (req, res) => {
    sendSuccess(res, 200, 'Access Granted: User has MANAGE_INVENTORY permission', {
      user: req.user.email,
      role: req.user.role,
      permissionChecked: PERMISSIONS.MANAGE_INVENTORY,
    });
  }
);

router.get(
  '/iam-test-admin-only',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission(PERMISSIONS.MANAGE_USERS),
  (req, res) => {
    sendSuccess(res, 200, 'Access Granted: Administrative resource accessed', {
      user: req.user.email,
      role: req.user.role,
      permissionChecked: PERMISSIONS.MANAGE_USERS,
    });
  }
);

module.exports = router;
