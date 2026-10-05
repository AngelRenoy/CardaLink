import React from 'react';
import { Sprout, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#072C17',
      color: '#E2E8F0',
      paddingTop: '4rem',
      paddingBottom: '2.5rem',
      borderTop: '4px solid #16A34A',
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2.5rem',
        marginBottom: '3rem',
      }}>
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}>
              <Sprout size={22} />
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF' }}>
              Carda<span style={{ color: '#4ADE80' }}>Link</span>
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
            Empowering cardamom farmers, traders, and exporters with intelligent digital plantation management, auction tracking, and export analytics.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.2rem' }}>
            Platform Modules
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: '#CBD5E1' }}>
            <li>Farmer Plantation Hub</li>
            <li>Trader Auction Exchange</li>
            <li>Exporter Trade Logistics</li>
            <li>AI Crop Diagnostics</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '1.2rem' }}>
            Contact Us
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <MapPin size={18} color="#4ADE80" />
              <span>Munnar Spice Valley, Idukki, Kerala, India</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Phone size={18} color="#4ADE80" />
              <span>+91 4865 230 400</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Mail size={18} color="#4ADE80" />
              <span>support@cardalink.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '1.75rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748B',
      }}>
        © {new Date().getFullYear()} CardaLink Systems. All rights reserved. Smart Cardamom Plantation & Export Management Platform.
      </div>
    </footer>
  );
};
