const jwtUtils = require('../utils/jwtUtils');
const UserModel = require('../models/userModel');
const { sendError } = require('../utils/responseHandler');
const { getPermissionsForRole, hasPermission } = require('../config/permissions');

// 1. requireAuth: Verifies identity, token validity, and account status
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token) or HttpOnly Cookie
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.cardalink_token || req.cookies.token)) {
      token = req.cookies.cardalink_token || req.cookies.token;
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:cardalink_token|token)=([^;]+)/);
      if (match) token = match[1];
    }


    if (!token) {
      return sendError(res, 401, 'IAM Authentication Error: Token missing or invalid');
    }

    let decoded;
    try {
      decoded = jwtUtils.verifyToken(token);
    } catch (err) {
      return sendError(res, 401, 'IAM Session Expired: Please log in again');
    }

    // Verify user exists in database (Source of Truth)
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return sendError(res, 401, 'IAM Identity Error: User account no longer exists');
    }

    // Enforce Account Status Requirements
    if (user.status === 'PENDING') {
      return sendError(res, 403, 'IAM Access Denied: Your account is pending administrator approval');
    }
    if (user.status === 'REJECTED') {
      return sendError(res, 403, 'IAM Access Denied: Your account registration has been rejected');
    }
    if (user.status === 'SUSPENDED') {
      return sendError(res, 403, 'IAM Access Denied: Your account has been suspended by system administrator');
    }
    if (user.status !== 'APPROVED') {
      return sendError(res, 403, `IAM Access Denied: Account status [${user.status}] is not permitted`);
    }

    // Compute active user permissions
    user.permissions = getPermissionsForRole(user.role);

    // Attach verified user identity & permissions to request
    req.user = user;
    next();
  } catch (error) {
    console.error('IAM Auth Middleware Error:', error);
    return sendError(res, 500, 'Internal server authentication error');
  }
};

// 2. requireRole: Enforces Role-Based Access Control (RBAC)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'IAM Authorization Error: Unauthenticated request');
    }

    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    const upperAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!upperAllowedRoles.includes(userRole)) {
      return sendError(
        res,
        403,
        `IAM Authorization Error: Role [${userRole}] does not have access to this resource. Allowed roles: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};

// 3. requirePermission: Enforces Fine-Grained Permission Claims
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'IAM Authorization Error: Unauthenticated request');
    }

    const userRole = req.user.role;
    const userPermissions = req.user.permissions || getPermissionsForRole(userRole);

    // Check if user has ALL specified permissions
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return sendError(
        res,
        403,
        `IAM Authorization Error: Missing required permission [${requiredPermissions.join(', ')}] for role [${userRole}]`
      );
    }

    next();
  };
};

// 4. requireOwnership: Verifies resource owner_id matches authenticated user id (unless Admin)
const requireOwnership = (resourceOwnerExtractor) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'IAM Authorization Error: Unauthenticated request');
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Administrators override ownership checks
    }

    const ownerId = typeof resourceOwnerExtractor === 'function' 
      ? await resourceOwnerExtractor(req) 
      : req.params[resourceOwnerExtractor] || req.body[resourceOwnerExtractor];

    if (!ownerId || String(ownerId) !== String(req.user.id)) {
      return sendError(
        res,
        403,
        'IAM Authorization Error: Access denied. You do not own this resource.'
      );
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireOwnership,
  authenticate: requireAuth, // Alias for backward compatibility
  authorizeRoles: requireRole, // Alias for backward compatibility
};

