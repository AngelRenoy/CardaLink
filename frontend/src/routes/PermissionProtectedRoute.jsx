import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';

export const PermissionProtectedRoute = ({ requiredPermission, children }) => {
  const { hasPermission, isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        Verifying IAM permissions...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(requiredPermission)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBEB',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2.5rem',
          maxWidth: '480px',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(217, 119, 6, 0.15)',
          border: '1px solid #FDE68A',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#78350F', marginBottom: '0.75rem' }}>
            Permission Required
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4B5563', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Your account role <strong>({role})</strong> lacks the required IAM permission: <code>{requiredPermission}</code>.
          </p>
          <a href={`/dashboard/${role?.toLowerCase()}`} className="btn btn-primary" style={{ width: '100%' }}>
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};
