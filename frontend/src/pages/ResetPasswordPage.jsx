import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { Sprout, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { resetPasswordApi } from '../services/api';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();

  // Token can come from query param (?token=xyz) or path param (/reset-password/:token)
  const token = searchParams.get('token') || params.token || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isMatch = password && confirmPassword && password === confirmPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Password reset link is missing or invalid. Please request a new one.');
      return;
    }

    if (!isFormValid) {
      setErrorMsg('Please ensure all password requirements are met and passwords match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi({
        token,
        new_password: password
      });
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset successful!');
      } else {
        setErrorMsg(res.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Please try requesting a new link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAF8',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
          }}>
            <Sprout size={24} />
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#073B1E', letterSpacing: '-0.5px' }}>
            CardaLink
          </span>
        </Link>
        <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0.4rem 0 0', fontWeight: '500' }}>
          Smart Cardamom Plantation & Export Management
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
        border: '1px solid #E2E8F0',
        boxSizing: 'border-box'
      }}>
        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertCircle size={28} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0F172A', margin: '0 0 0.5rem' }}>
              Missing Reset Link
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
              No valid password reset token was detected in your link. Please use the link sent to your email or request a new one from the login page.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#16A34A',
                color: '#FFF',
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : successMsg ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#073B1E', margin: '0 0 0.5rem' }}>
              Password Reset Complete!
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.75rem' }}>
              {successMsg} Your account is now secured with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                backgroundColor: '#16A34A',
                color: '#FFF',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
              }}
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <KeyRound size={24} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#073B1E', margin: '0 0 0.35rem' }}>
                Reset Your Password
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                Choose a strong, secure new password for your CardaLink account.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                color: '#DC2626',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* New Password */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: '12px',
                      border: isMatch ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Checklist */}
              <div style={{ backgroundColor: '#F8FAF8', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Password Strength Requirements:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.72rem' }}>
                  <span style={{ color: hasMinLength ? '#16A34A' : '#94A3B8', fontWeight: hasMinLength ? '700' : '500' }}>
                    {hasMinLength ? '✓' : '○'} At least 8 chars
                  </span>
                  <span style={{ color: hasUpper ? '#16A34A' : '#94A3B8', fontWeight: hasUpper ? '700' : '500' }}>
                    {hasUpper ? '✓' : '○'} One uppercase letter
                  </span>
                  <span style={{ color: hasLower ? '#16A34A' : '#94A3B8', fontWeight: hasLower ? '700' : '500' }}>
                    {hasLower ? '✓' : '○'} One lowercase letter
                  </span>
                  <span style={{ color: hasNumber ? '#16A34A' : '#94A3B8', fontWeight: hasNumber ? '700' : '500' }}>
                    {hasNumber ? '✓' : '○'} One number
                  </span>
                  <span style={{ color: hasSpecial ? '#16A34A' : '#94A3B8', fontWeight: hasSpecial ? '700' : '500' }}>
                    {hasSpecial ? '✓' : '○'} One special char
                  </span>
                  <span style={{ color: isMatch ? '#16A34A' : '#94A3B8', fontWeight: isMatch ? '700' : '500' }}>
                    {isMatch ? '✓' : '○'} Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                style={{
                  width: '100%',
                  backgroundColor: '#16A34A',
                  color: '#FFF',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  cursor: (isSubmitting || !isFormValid) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  opacity: (isSubmitting || !isFormValid) ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Resetting Password...' : 'Save New Password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Link
                  to="/login"
                  style={{ color: '#64748B', fontSize: '0.825rem', fontWeight: '600', textDecoration: 'none' }}
                >
                  ← Back to Login
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
