const UserModel = require('../models/userModel');
const AuditLogModel = require('../models/auditLogModel');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT id, full_name, email, phone, role, status, is_verified, avatar, created_at, updated_at
      FROM users
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return sendSuccess(res, 200, 'User directory retrieved successfully', {
      users: result.rows,
    });
  } catch (error) {
    console.error('[Admin Controller Error]:', error);
    return sendError(res, 500, 'Failed to fetch user directory');
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    const newStatus = status ? status.toUpperCase() : null;

    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return sendError(res, 400, `Invalid status value. Allowed: [${allowedStatuses.join(', ')}]`);
    }

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      return sendError(res, 404, 'User account not found');
    }

    if (targetUser.role === 'ADMIN' && newStatus !== 'APPROVED') {
      return sendError(res, 403, 'System Administrator status cannot be altered');
    }

    const query = `
      UPDATE users
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, role, status, updated_at;
    `;
    const result = await db.query(query, [newStatus, id]);
    const updatedUser = result.rows[0];

    // Log security event
    const actionMap = {
      APPROVED: 'ACCOUNT_APPROVED',
      REJECTED: 'ACCOUNT_REJECTED',
      SUSPENDED: 'ACCOUNT_SUSPENDED',
      PENDING: 'ACCOUNT_PENDING',
    };
    await AuditLogModel.createLog({
      user_id: req.user.id,
      email: req.user.email,
      action: actionMap[newStatus] || 'ACCOUNT_STATUS_CHANGED',
      details: `Administrator ${req.user.email} changed status of ${targetUser.email} to [${newStatus}]`,
      ip_address: req.ip,
    });

    return sendSuccess(res, 200, `Account status for ${updatedUser.email} updated to [${newStatus}]`, {
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Admin Update Status Error]:', error);
    return sendError(res, 500, 'Failed to update user account status');
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = await AuditLogModel.getRecentLogs(limit);
    return sendSuccess(res, 200, 'Security audit logs retrieved successfully', { logs });
  } catch (error) {
    console.error('[Admin Audit Logs Error]:', error);
    return sendError(res, 500, 'Failed to fetch audit logs');
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  getAuditLogs,
};
