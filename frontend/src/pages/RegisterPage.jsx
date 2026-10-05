import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown,
  Camera
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateRegistrationForm } from '../utils/validators';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'FARMER',
    avatar: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (serverError) setServerError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Frontend validation
    const { isValid, errors: validationErrors } = validateRegistrationForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        avatar: formData.avatar,
      });

      if (result.success) {
        setSuccessMessage(result.message || 'Registration successful. Account ready.');
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      } else {
        setServerError(result.message || 'Registration failed');
      }
    } catch (err) {
      setServerError(err.message || 'Server error during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0FDF4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Registration Modal Card */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        padding: '2.25rem 2rem',
        boxShadow: '0 20px 40px rgba(15, 90, 44, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E2E8F0',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#073B1E',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Create CardaLink Account
          </h1>

          {/* Circular Close Button */}
          <Link to="/" style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
          }}>
            <X size={18} />
          </Link>
        </div>

        {/* Profile Photo Upload */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '2.5px dashed #4ADE80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.65rem',
              cursor: 'pointer',
              overflow: 'hidden',
              backgroundColor: '#F0FDF4',
              transition: 'all 0.2s ease',
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={38} color="#22C55E" strokeWidth={1.8} />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              color: '#22C55E',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Upload Profile Photo
          </button>
        </div>

        {/* Banners */}
        {successMessage && (
          <div className="success-banner">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}
        {serverError && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>
              Full Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <User size={18} color="#94A3B8" />
              </div>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                style={inputStyle(errors.full_name)}
                disabled={isSubmitting}
              />
            </div>
            {errors.full_name && <div className="error-text"><AlertCircle size={13} /> {errors.full_name}</div>}
          </div>

          {/* Email + Phone (Side by side on desktop) */}
          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
            <div>
              <label style={labelStyle}>
                Email Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={iconContainerStyle}>
                  <Mail size={18} color="#94A3B8" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@cardalink.cc"
                  style={inputStyle(errors.email)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <div className="error-text"><AlertCircle size={13} /> {errors.email}</div>}
            </div>

            <div>
              <label style={labelStyle}>
                Phone Number <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={iconContainerStyle}>
                  <Phone size={18} color="#94A3B8" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  style={inputStyle(errors.phone)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && <div className="error-text"><AlertCircle size={13} /> {errors.phone}</div>}
            </div>
          </div>

          {/* Account Role Dropdown */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>
              Select Account Role <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <User size={18} color="#94A3B8" />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  ...inputStyle(errors.role),
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
                disabled={isSubmitting}
              >
                <option value="FARMER">🌱 Farmer (Plantation Owner)</option>
                <option value="TRADER">🛒 Trader</option>
                <option value="EXPORTER">📦 Exporter</option>
              </select>
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '1rem',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#94A3B8',
                display: 'flex',
              }}>
                <ChevronDown size={18} />
              </div>
            </div>
            {errors.role && <div className="error-text"><AlertCircle size={13} /> {errors.role}</div>}
          </div>

          {/* Password + Confirm Password (Side by side on desktop) */}
          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={labelStyle}>
                Password <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={iconContainerStyle}>
                  <Lock size={18} color="#94A3B8" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars"
                  style={{ ...inputStyle(errors.password), paddingRight: '2.5rem' }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={toggleButtonStyle}
                >
                  {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                </button>
              </div>
              {errors.password && <div className="error-text"><AlertCircle size={13} /> {errors.password}</div>}
            </div>

            <div>
              <label style={labelStyle}>
                Confirm Password <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={iconContainerStyle}>
                  <Lock size={18} color="#94A3B8" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-type password"
                  style={{ ...inputStyle(errors.confirmPassword), paddingRight: '2.5rem' }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={toggleButtonStyle}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                </button>
              </div>
              {errors.confirmPassword && <div className="error-text"><AlertCircle size={13} /> {errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Pill Shaped Green Create Account Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.95rem 1.5rem',
              fontSize: '1.05rem',
              fontWeight: '700',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #2E8B46 0%, #38A169 100%)',
              border: 'none',
              borderRadius: '9999px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 6px 16px rgba(46, 139, 70, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {isSubmitting ? (
              <span>Creating CardaLink Account...</span>
            ) : (
              <>
                <span>Create CardaLink Account</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748B' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2E8B46', fontWeight: '700', textDecoration: 'none' }}>
            Login
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .grid-2-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '700',
  color: '#1E293B',
  marginBottom: '0.4rem',
};

const iconContainerStyle = {
  position: 'absolute',
  top: '50%',
  left: '1rem',
  transform: 'translateY(-50%)',
  display: 'flex',
  pointerEvents: 'none',
};

const toggleButtonStyle = {
  position: 'absolute',
  top: '50%',
  right: '1rem',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
};

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '0.85rem 1rem 0.85rem 2.8rem',
  fontSize: '0.925rem',
  borderRadius: '12px',
  border: hasError ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
  backgroundColor: hasError ? '#FEF2F2' : '#F8FAFC',
  color: '#0F172A',
  outline: 'none',
  transition: 'all 0.2s ease',
});
