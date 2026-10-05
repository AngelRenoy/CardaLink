const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole, requirePermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

// All Admin routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), adminController.getAllUsers);
router.put('/users/:id/status', requirePermission(PERMISSIONS.APPROVE_USERS), adminController.updateUserStatus);
router.get('/audit-logs', requirePermission(PERMISSIONS.VIEW_SYSTEM_DATA), adminController.getAuditLogs);

module.exports = router;
