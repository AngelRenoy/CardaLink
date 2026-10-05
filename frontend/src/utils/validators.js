export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return 'Phone number is required';
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  const indianPhoneRegex = /^(\+91)?[6789]\d{9}$/;
  if (!indianPhoneRegex.test(cleanPhone)) return 'Please enter a valid phone number';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordComplexityRegex.test(password)) {
    return 'Password must contain uppercase, lowercase, number and special character';
  }
  return null;
};

export const validateRegistrationForm = ({ full_name, email, phone, password, confirmPassword, role }) => {
  const errors = {};

  if (!full_name || !full_name.trim()) {
    errors.full_name = 'Full name is required';
  } else if (full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters';
  } else if (full_name.trim().length > 150) {
    errors.full_name = 'Full name cannot exceed 150 characters';
  }

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validatePhone(phone);
  if (phoneErr) errors.phone = phoneErr;

  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  const allowedRoles = ['FARMER', 'TRADER', 'EXPORTER'];
  if (!role) {
    errors.role = 'Role is required';
  } else if (!allowedRoles.includes(role.toUpperCase())) {
    errors.role = 'Please select a valid role';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginForm = ({ email, password }) => {
  const errors = {};

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
