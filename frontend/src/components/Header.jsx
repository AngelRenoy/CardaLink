import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, LogOut, LayoutDashboard, Menu, X, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user?.role) return '/login';
    return `/dashboard/${user.role.toLowerCase()}`;
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 2px 10px rgba(15, 90, 44, 0.04)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F5A2C 0%, #22C55E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(15, 90, 44, 0.25)',
          }}>
            <Sprout size={24} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              color: '#073B1E',
              letterSpacing: '-0.02em',
            }}>
              Carda<span style={{ color: '#16A34A' }}>Link</span>
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.65rem',
              fontWeight: '700',
              color: '#64748B',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Smart Plantation & Export
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#home" style={navLinkStyle}>Home</a>
          <a href="#features" style={navLinkStyle}>Features</a>
          <a href="#about" style={navLinkStyle}>About</a>
          <a href="#services" style={navLinkStyle}>Services</a>
          <a href="#contact" style={navLinkStyle}>Contact</a>
        </nav>

        {/* Action Buttons */}
        <div className="desktop-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath()} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
                <LayoutDashboard size={18} />
                <span>Dashboard ({user?.role})</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', backgroundColor: '#DC2626' }}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.4rem' }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#073B1E',
            cursor: 'pointer',
          }}
          className="mobile-toggle"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <a href="#home" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle}>Home</a>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle}>Features</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle}>About</a>
          <a href="#services" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle}>Services</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle}>Contact</a>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setIsMobileMenuOpen(false)} className="btn btn-secondary">
                  Dashboard ({user?.role})
                </Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="btn btn-primary" style={{ backgroundColor: '#DC2626' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-buttons {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};

const navLinkStyle = {
  fontSize: '0.95rem',
  fontWeight: '600',
  color: '#334155',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
};
