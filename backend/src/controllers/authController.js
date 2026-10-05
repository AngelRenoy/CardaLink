const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/userModel');
const UserIdentityModel = require('../models/userIdentityModel');
const AuditLogModel = require('../models/auditLogModel');
const db = require('../config/db');
const jwtUtils = require('../utils/jwtUtils');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getPermissionsForRole } = require('../config/permissions');


const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || '';
const getGoogleClientSecret = () => process.env.GOOGLE_CLIENT_SECRET || '';
const getGoogleCallbackUrl = () => process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

const getOAuthClient = () => {
  return new OAuth2Client(getGoogleClientId(), getGoogleClientSecret(), getGoogleCallbackUrl());
};


const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.sanitizedBody;

    // Check duplicate email
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return sendError(res, 400, 'Email is already registered');
    }

    // Bcrypt password hash
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user in database (Source of truth)
    const newUser = await UserModel.createUser({
      full_name,
      email,
      phone,
      role,
      password_hash,
      status: 'APPROVED',
    });

    const permissions = getPermissionsForRole(newUser.role);

    // Audit Log Security Event
    await AuditLogModel.createLog({
      user_id: newUser.id,
      email: newUser.email,
      action: 'REGISTRATION',
      details: `CardaLink ${newUser.role} user registered successfully`,
      ip_address: req.ip,
    });

    return sendSuccess(res, 201, 'Registration successful. Account created and ready for authentication.', {
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        permissions,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('[IAM Register Error]:', error);
    return sendError(res, 500, 'Server error during registration. Please try again.');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.sanitizedBody;

    // Find user identity in database
    const user = await UserModel.findByEmail(email);
    if (!user) {
      await AuditLogModel.createLog({
        user_id: null,
        email,
        action: 'LOGIN_FAILED',
        details: 'Failed login attempt - user not found',
        ip_address: req.ip,
      });
      return sendError(res, 401, 'Invalid email or password');
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await AuditLogModel.createLog({
        user_id: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        details: 'Failed login attempt - incorrect password',
        ip_address: req.ip,
      });
      return sendError(res, 401, 'Invalid email or password');
    }

    // IAM Account Status Enforcement
    if (user.status === 'PENDING') {
      return sendError(res, 403, 'Account registered but waiting for administrator approval');
    }
    if (user.status === 'REJECTED') {
      return sendError(res, 403, 'Your account application has been rejected');
    }
    if (user.status === 'SUSPENDED') {
      return sendError(res, 403, 'Your account has been suspended by system administration');
    }
    if (user.status !== 'APPROVED') {
      return sendError(res, 403, `Account status [${user.status}] is not permitted to log in`);
    }

    // Generate IAM JWT Token
    const token = jwtUtils.generateToken(user);
    const permissions = getPermissionsForRole(user.role);
    const { password_hash, ...userData } = user;

    // Set secure HttpOnly cookie for session management
    res.cookie('cardalink_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Audit Log Security Event
    await AuditLogModel.createLog({
      user_id: user.id,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: `User logged in via password authentication (${user.role})`,
      ip_address: req.ip,
    });

    return sendSuccess(res, 200, 'IAM Authentication Successful', {
      user: {
        ...userData,
        permissions,
      },
      token,
    });

  } catch (error) {
    console.error('[IAM Login Error]:', error);
    return sendError(res, 500, 'Server error during login. Please try again.');
  }
};


// 1. Initiate Google OAuth 2.0 Redirection
const initiateGoogleAuth = (req, res) => {
  const clientId = getGoogleClientId();
  const frontendUrl = getFrontendUrl();

  if (!clientId) {
    console.warn('[Google Auth Error] GOOGLE_CLIENT_ID missing in backend/.env');
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google OAuth Client ID is missing in backend/.env')}`);
  }

  const oauth2Client = getOAuthClient();
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'select_account',
  });

  console.log('[Google Auth Log] Redirecting user browser to Google OAuth 2.0 page...');
  return res.redirect(authorizeUrl);
};

// 2. Handle Google OAuth 2.0 Callback Code Exchange
const handleGoogleCallback = async (req, res) => {
  const frontendUrl = getFrontendUrl();
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('[Google Auth Callback Error]:', error);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication was cancelled or failed')}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google OAuth authorization code missing')}`);
    }

    console.log('[Google Auth Log] Received OAuth code from Google. Exchanging for tokens...');
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch verified Google User Profile
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    const googleUser = userInfoResponse.data;
    const googleSub = googleUser.sub;
    const googleEmail = googleUser.email ? googleUser.email.toLowerCase().trim() : '';
    const googleName = googleUser.name || googleEmail.split('@')[0];

    if (!googleEmail) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Unable to retrieve verified email from Google identity')}`);
    }


    console.log(`[Google Auth Log] Google Identity Verified: ${googleEmail} (sub: ${googleSub})`);

    // Check if Google Identity is already linked in PostgreSQL user_identities table
    let linkedUser = await UserIdentityModel.findByProviderAndId('GOOGLE', googleSub);

    if (linkedUser) {
      if (linkedUser.status !== 'APPROVED') {
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(`Google account access denied: Status [${linkedUser.status}]`)}`);
      }

      const token = jwtUtils.generateToken(linkedUser);
      console.log(`[Google Auth Log] Authenticated existing linked Google user ${googleEmail} (${linkedUser.role})`);
      return res.redirect(`${frontendUrl}/login?token=${token}&role=${linkedUser.role}`);
    }

    // Check if user with matching email already exists in CardaLink users table
    let existingUser = await UserModel.findByEmail(googleEmail);

    if (existingUser) {
      console.log(`[Google Auth Log] CardaLink user ${googleEmail} exists. Linking Google identity...`);
      await UserIdentityModel.linkIdentity(existingUser.id, 'GOOGLE', googleSub);

      if (existingUser.status !== 'APPROVED') {
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(`Google account access denied: Status [${existingUser.status}]`)}`);
      }

      const token = jwtUtils.generateToken(existingUser);
      return res.redirect(`${frontendUrl}/login?token=${token}&role=${existingUser.role}`);
    }

    // New Google User: Require Role Selection (FARMER, TRADER, EXPORTER)
    console.log(`[Google Auth Log] New Google user ${googleEmail}. Redirecting for role selection...`);
    const tempPayload = { googleSub, googleEmail, googleName };
    const tempToken = jwtUtils.generateToken({ id: 'temp_' + googleSub, role: 'TEMP_GOOGLE_USER' });

    const redirectUrl = `${frontendUrl}/login?selectRole=true&tempToken=${encodeURIComponent(tempToken)}&email=${encodeURIComponent(googleEmail)}&name=${encodeURIComponent(googleName)}&sub=${encodeURIComponent(googleSub)}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('[Google Callback Exception]:', err);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication error. Please try again.')}`);
  }
};

// 3. Confirm Role for New Google User
const confirmGoogleRole = async (req, res) => {
  try {
    const { role, email, name, googleSub } = req.body;

    const allowedRoles = ['FARMER', 'TRADER', 'EXPORTER'];
    const selectedRole = role ? role.toUpperCase() : null;

    if (!selectedRole || !allowedRoles.includes(selectedRole)) {
      return sendError(res, 400, 'Invalid role selection. Admin registration is not allowed');
    }

    if (!email || !googleSub) {
      return sendError(res, 400, 'Missing verified Google identity information');
    }

    // Check if user already exists
    let existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      await UserIdentityModel.linkIdentity(existingUser.id, 'GOOGLE', googleSub);
      const token = jwtUtils.generateToken(existingUser);
      const permissions = getPermissionsForRole(existingUser.role);
      const { password_hash, ...userData } = existingUser;

      return sendSuccess(res, 200, 'Google identity linked to existing CardaLink account', {
        user: { ...userData, permissions },
        token,
      });
    }

    // Create new user in PostgreSQL
    console.log(`[Google Auth Log] Creating new CardaLink user ${email} with role ${selectedRole}...`);
    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(randomPassword, salt);

    const newUser = await UserModel.createUser({
      full_name: name || email.split('@')[0],
      email,
      phone: '+919999999999',
      role: selectedRole,
      password_hash,
      status: 'APPROVED',
    });

    // Link Google Identity
    await UserIdentityModel.linkIdentity(newUser.id, 'GOOGLE', googleSub);

    const token = jwtUtils.generateToken(newUser);
    const permissions = getPermissionsForRole(newUser.role);

    return sendSuccess(res, 201, 'CardaLink account created and authenticated via Google', {
      user: { ...newUser, permissions },
      token,
    });
  } catch (error) {
    console.error('[Confirm Google Role Error]:', error);
    return sendError(res, 500, 'Failed to complete Google account registration.');
  }
};

// 4. Backward Compatible POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { idToken, credential, role, googlePayload: directPayload } = req.body;
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify && !directPayload) {
      return sendError(res, 400, 'Missing Google ID token credential');
    }

    let googlePayload = directPayload;

    if (tokenToVerify && googleClient && googleClientId) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: tokenToVerify,
          audience: googleClientId,
        });
        googlePayload = ticket.getPayload();
      } catch (err) {
        console.warn('[Google Token Verify Warning]:', err.message);
      }
    }

    if (!googlePayload || !googlePayload.email) {
      return sendError(res, 400, 'Unable to verify Google user payload');
    }

    const googleSub = googlePayload.sub;
    const googleEmail = googlePayload.email.toLowerCase().trim();
    const googleName = googlePayload.name || googleEmail.split('@')[0];

    let linkedUser = await UserIdentityModel.findByProviderAndId('GOOGLE', googleSub);
    if (linkedUser) {
      if (linkedUser.status !== 'APPROVED') {
        return sendError(res, 403, `Account status is [${linkedUser.status}]`);
      }
      const token = jwtUtils.generateToken(linkedUser);
      const permissions = getPermissionsForRole(linkedUser.role);
      return sendSuccess(res, 200, 'Google Authentication Successful', {
        user: { ...linkedUser, permissions },
        token,
      });
    }

    let existingUser = await UserModel.findByEmail(googleEmail);
    if (existingUser) {
      await UserIdentityModel.linkIdentity(existingUser.id, 'GOOGLE', googleSub);
      if (existingUser.status !== 'APPROVED') {
        return sendError(res, 403, `Account status is [${existingUser.status}]`);
      }
      const token = jwtUtils.generateToken(existingUser);
      const permissions = getPermissionsForRole(existingUser.role);
      const { password_hash, ...userData } = existingUser;
      return sendSuccess(res, 200, 'Google identity linked to existing account', {
        user: { ...userData, permissions },
        token,
      });
    }

    const allowedRoles = ['FARMER', 'TRADER', 'EXPORTER'];
    const selectedRole = role ? role.toUpperCase() : null;

    if (!selectedRole || !allowedRoles.includes(selectedRole)) {
      return sendSuccess(res, 200, 'Role selection required for new Google user', {
        requiresRoleSelection: true,
        email: googleEmail,
        name: googleName,
        googleSub,
      });
    }

    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(randomPassword, salt);

    const newUser = await UserModel.createUser({
      full_name: googleName,
      email: googleEmail,
      phone: '+919999999999',
      role: selectedRole,
      password_hash,
      status: 'APPROVED',
    });

    await UserIdentityModel.linkIdentity(newUser.id, 'GOOGLE', googleSub);
    const token = jwtUtils.generateToken(newUser);
    const permissions = getPermissionsForRole(newUser.role);

    return sendSuccess(res, 201, 'CardaLink account created and authenticated via Google', {
      user: { ...newUser, permissions },
      token,
    });
  } catch (error) {
    console.error('[Google Auth Legacy Controller Error]:', error);
    return sendError(res, 500, 'Google authentication error.');
  }
};

const getMe = async (req, res) => {
  try {
    const permissions = getPermissionsForRole(req.user.role);
    return sendSuccess(res, 200, 'IAM Identity & Session Verified', {
      user: {
        ...req.user,
        permissions,
      },
    });
  } catch (error) {
    console.error('[IAM GetMe Error]:', error);
    return sendError(res, 500, 'Failed to fetch identity profile.');
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await AuditLogModel.createLog({
        user_id: req.user.id,
        email: req.user.email,
        action: 'LOGOUT',
        details: 'User logged out and IAM session terminated',
        ip_address: req.ip,
      });
    }
    res.clearCookie('cardalink_token');
    return sendSuccess(res, 200, 'IAM Session Terminated Successfully');
  } catch (error) {
    console.error('[IAM Logout Error]:', error);
    return sendError(res, 500, 'Failed to terminate session.');
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required');
    }

    if (newPassword.length < 8) {
      return sendError(res, 400, 'New password must be at least 8 characters');
    }

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      return sendError(res, 400, 'New password must contain uppercase, lowercase, number and special character');
    }

    const user = await UserModel.findByEmail(req.user.email);
    if (!user) {
      return sendError(res, 404, 'User identity profile not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      await AuditLogModel.createLog({
        user_id: req.user.id,
        email: req.user.email,
        action: 'PASSWORD_CHANGE_FAILED',
        details: 'Incorrect current password provided',
        ip_address: req.ip,
      });
      return sendError(res, 400, 'Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      newPasswordHash,
      req.user.id,
    ]);

    await AuditLogModel.createLog({
      user_id: req.user.id,
      email: req.user.email,
      action: 'PASSWORD_CHANGED',
      details: 'Password updated successfully',
      ip_address: req.ip,
    });

    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    console.error('[Change Password Error]:', error);
    return sendError(res, 500, 'Failed to update password');
  }
};

module.exports = {
  register,
  login,
  initiateGoogleAuth,
  handleGoogleCallback,
  confirmGoogleRole,
  googleAuth,
  getMe,
  logout,
  changePassword,
};

