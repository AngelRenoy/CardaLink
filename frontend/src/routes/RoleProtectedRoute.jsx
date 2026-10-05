import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

export const RoleProtectedRoute = ({ allowedRole, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
      }}>
        Verifying role permissions...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Strict role check
  if (user?.role !== allowedRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2.5rem',
          maxWidth: '480px',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)',
          border: '1px solid #FCA5A5',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#991B1B', marginBottom: '0.75rem' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#4B5563', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Your account role <strong>({user?.role})</strong> does not have permission to access the <strong>{allowedRole}</strong> dashboard.
          </p>
          <a
            href={`/dashboard/${user?.role?.toLowerCase()}`}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Return to My Dashboard ({user?.role})
          </a>
        </div>
      </div>
    );
  }

  return children;
};
