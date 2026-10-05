import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, LogIn, Lock, Mail, AlertCircle, ArrowLeft, Eye, EyeOff, X, KeyRound, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/validators';
import { getMeApi, API_BASE_URL } from '../services/api';

export const LoginPage = () => {
  const { login, googleAuth, confirmGoogleRole, setAuthSession } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // New Google User Role Selection Modal State
  const [googleAuthData, setGoogleAuthData] = useState(null); // Stores Google Auth response needing role
  const [selectedGoogleRole, setSelectedGoogleRole] = useState('FARMER');

  // Handle incoming OAuth callback URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get('token');
    const roleParam = searchParams.get('role');
    const selectRoleParam = searchParams.get('selectRole');
    const tempTokenParam = searchParams.get('tempToken');
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    const subParam = searchParams.get('sub');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setServerError(decodeURIComponent(errorParam));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (tokenParam && roleParam) {
      // User authenticated via backend Google callback
      localStorage.setItem('cardalink_token', tokenParam);
      getMeApi()
        .then((res) => {
          if (res.success && res.data?.user) {
            setAuthSession(tokenParam, res.data.user);
            handleRoleRouteRedirect(res.data.user.role);
          } else {
            handleRoleRouteRedirect(roleParam);
          }
        })
        .catch(() => {
          handleRoleRouteRedirect(roleParam);
        });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (selectRoleParam === 'true' && emailParam && subParam) {
      // New Google user registered, prompt role selection
      setGoogleAuthData({
        tempToken: tempTokenParam,
        email: decodeURIComponent(emailParam),
        name: nameParam ? decodeURIComponent(nameParam) : '',
        sub: decodeURIComponent(subParam),
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (serverError) setServerError('');
  };

  const handleRoleRouteRedirect = (role) => {
    const roleRouteMap = {
      FARMER: '/dashboard/farmer',
      TRADER: '/dashboard/trader',
      EXPORTER: '/dashboard/exporter',
      ADMIN: '/dashboard/admin',
    };
    const targetPath = roleRouteMap[role] || '/';
    navigate(targetPath, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const { isValid, errors: validationErrors } = validateLoginForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password);

      if (result.success) {
        handleRoleRouteRedirect(result.role);
      } else {
        setServerError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setServerError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Browser Google OAuth 2.0 Authorization Flow
  const handleGoogleButtonClick = () => {
    setServerError('');
    const googleInitiateUrl = `${API_BASE_URL}/auth/google`;
    console.log('[Frontend Log] Initiating real Google OAuth flow redirect to:', googleInitiateUrl);
    window.location.href = googleInitiateUrl;
  };

  const handleConfirmGoogleRole = async () => {
    if (!googleAuthData) return;
    setIsSubmitting(true);
    setServerError('');

    try {
      const result = await confirmGoogleRole({
        role: selectedGoogleRole,
        email: googleAuthData.email,
        name: googleAuthData.name,
        googleSub: googleAuthData.sub,
      });

      if (result.success) {
        setGoogleAuthData(null);
        handleRoleRouteRedirect(result.role);
      } else {
        setServerError(result.message || 'Failed to complete Google registration');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to complete Google registration');
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
      position: 'relative',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(15, 90, 44, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E2E8F0',
        zIndex: 1,
      }}>
        {/* Back Link */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.875rem',
          color: '#2E8B46',
          fontWeight: '600',
          textDecoration: 'none',
          marginBottom: '1.5rem',
        }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0F5A2C 0%, #22C55E 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.85rem',
            boxShadow: '0 6px 16px rgba(15, 90, 44, 0.25)',
          }}>
            <Sprout size={30} />
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#073B1E' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>
            Log in to your CardaLink account
          </p>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <Mail size={18} color="#94A3B8" />
              </div>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="farmer@cardalink.com"
                style={inputStyle(errors.email)}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && <div className="error-text"><AlertCircle size={13} /> {errors.email}</div>}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Password *</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2E8B46',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={iconContainerStyle}>
                <Lock size={18} color="#94A3B8" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: '700',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #2E8B46 0%, #38A169 100%)',
              border: 'none',
              borderRadius: '9999px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 16px rgba(46, 139, 70, 0.25)',
              marginBottom: '1.25rem',
            }}
          >
            {isSubmitting ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.25rem 0',
          fontSize: '0.825rem',
          color: '#94A3B8',
          fontWeight: '600',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
        </div>

        {/* Official Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleButtonClick}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.85rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            color: '#1E293B',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '9999px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748B' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2E8B46', fontWeight: '700', textDecoration: 'none' }}>
            Register
          </Link>
        </div>
      </div>

      {/* New Google User Role Selection Modal */}
      {googleAuthData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '420px',
            width: '100%',
            position: 'relative',
          }}>
            <button
              onClick={() => setGoogleAuthData(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#073B1E' }}>Choose your CardaLink Account Type</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>
                Welcome <strong>{googleAuthData.email}</strong>! Select your ecosystem role to complete your profile:
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>CardaLink Ecosystem Role *</label>
              <select
                value={selectedGoogleRole}
                onChange={(e) => setSelectedGoogleRole(e.target.value)}
                style={{ ...inputStyle(false), appearance: 'none' }}
              >
                <option value="FARMER">🌱 Farmer (Plantation Owner)</option>
                <option value="TRADER">🛒 Trader</option>
                <option value="EXPORTER">📦 Exporter</option>
              </select>
            </div>

            <button
              onClick={handleConfirmGoogleRole}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#FFFFFF',
                background: '#2E8B46',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Registering Account...' : 'Complete Registration & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowForgotModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <KeyRound size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#073B1E' }}>Password Recovery</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>
                Password recovery is managed by your system administrator. Contact support@cardalink.com for assistance.
              </p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
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
