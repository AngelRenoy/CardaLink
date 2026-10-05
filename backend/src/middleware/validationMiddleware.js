const { sendError } = require('../utils/responseHandler');

const validateRegistration = (req, res, next) => {
  let { full_name, email, phone, password, confirmPassword, role } = req.body;

  // Trim strings
  full_name = full_name ? full_name.trim() : '';
  email = email ? email.trim().toLowerCase() : '';
  phone = phone ? phone.trim() : '';
  password = password || '';
  confirmPassword = confirmPassword || '';
  role = role ? role.trim().toUpperCase() : '';

  // 1. Full Name
  if (!full_name) {
    return sendError(res, 400, 'Full name is required');
  }
  if (full_name.length < 2) {
    return sendError(res, 400, 'Full name must be at least 2 characters');
  }
  if (full_name.length > 150) {
    return sendError(res, 400, 'Full name cannot exceed 150 characters');
  }

  // 2. Email
  if (!email) {
    return sendError(res, 400, 'Email is required');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 400, 'Please enter a valid email address');
  }

  // 3. Phone Number (Indian Format: +91 XXXXXXXXXX or 10 digits starting with 6-9)
  if (!phone) {
    return sendError(res, 400, 'Phone number is required');
  }
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  const indianPhoneRegex = /^(\+91)?[6789]\d{9}$/;
  if (!indianPhoneRegex.test(cleanPhone)) {
    return sendError(res, 400, 'Please enter a valid phone number');
  }

  // Format phone consistently (+91 format if not present)
  let formattedPhone = cleanPhone;
  if (!formattedPhone.startsWith('+91')) {
    formattedPhone = `+91${formattedPhone}`;
  }

  // 4. Password
  if (!password) {
    return sendError(res, 400, 'Password is required');
  }
  if (password.length < 8) {
    return sendError(res, 400, 'Password must be at least 8 characters');
  }
  
  // Complexity: uppercase, lowercase, number, special char
  const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordComplexityRegex.test(password)) {
    return sendError(
      res,
      400,
      'Password must contain uppercase, lowercase, number and special character'
    );
  }

  // 5. Confirm Password
  if (!confirmPassword) {
    return sendError(res, 400, 'Confirm password is required');
  }
  if (password !== confirmPassword) {
    return sendError(res, 400, 'Passwords do not match');
  }

  // 6. Role (Public registration strictly restricted to FARMER, TRADER, EXPORTER)
  const allowedRoles = ['FARMER', 'TRADER', 'EXPORTER'];
  if (!role) {
    return sendError(res, 400, 'Role is required');
  }
  if (!allowedRoles.includes(role)) {
    return sendError(res, 400, 'Invalid role selection. Admin registration is not allowed');
  }

  // Attach sanitized data to request
  req.sanitizedBody = {
    full_name,
    email,
    phone: formattedPhone,
    password,
    role,
  };

  next();
};

const validateLogin = (req, res, next) => {
  let { email, password } = req.body;

  email = email ? email.trim().toLowerCase() : '';
  password = password || '';

  if (!email) {
    return sendError(res, 400, 'Email is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 400, 'Please enter a valid email address');
  }

  if (!password) {
    return sendError(res, 400, 'Password is required');
  }

  if (password.length < 8) {
    return sendError(res, 400, 'Password must be at least 8 characters');
  }

  req.sanitizedBody = { email, password };
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
};
