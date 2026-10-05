import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sprout, LogOut, Construction, ShieldCheck, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExporterDashboard = () => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F9FF' }}>
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0C4A6E' }}>
            Carda<span style={{ color: '#0284C7' }}>Link</span> <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>| IAM Exporter Portal</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0C4A6E' }}>{user?.full_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: '600' }}>ROLE: {user?.role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="container" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '3rem 2rem',
          maxWidth: '680px',
          margin: '0 auto',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
          border: '1px solid #BAE6FD',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#E0F2FE',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <Construction size={32} />
          </div>

          <span style={{
            backgroundColor: '#E0F2FE',
            color: '#0369A1',
            fontSize: '0.75rem',
            fontWeight: '800',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            IAM Identity & RBAC Verified
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0C4A6E', margin: '1rem 0 0.5rem' }}>
            Exporter Dashboard Coming Soon
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your account <strong>({user?.email})</strong> is authenticated under the CardaLink IAM framework. Full export trade & shipment module coming in Phase 2.
          </p>

          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #E2E8F0',
            textAlign: 'left',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: '#0C4A6E', marginBottom: '0.75rem' }}>
              <Key size={18} color="#0284C7" /> Active IAM Granted Permissions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {permissions?.map((perm) => (
                <span key={perm} style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: '#E0F2FE',
                  color: '#0369A1',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #BAE6FD',
                }}>
                  {perm}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#0284C7', fontWeight: '600' }}>
            <ShieldCheck size={18} /> Account Status: {user?.status} (Access Granted)
          </div>
        </div>
      </div>
    </div>
  );
};
