import React from 'react';
import { Activity, CloudSun, Droplets, Thermometer, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroCard = () => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1.5px solid rgba(187, 247, 208, 0.8)',
      padding: '2rem',
      boxShadow: '0 20px 40px -10px rgba(15, 90, 44, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.06)',
      position: 'relative',
    }}>
      {/* Top Header Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px dashed #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            boxShadow: '0 0 10px #22C55E',
            display: 'inline-block',
          }}></span>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: '#073B1E',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            LIVE ESTATE MONITORING
          </span>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#15803D',
          backgroundColor: '#DCFCE7',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}>
          <ShieldCheck size={14} /> Active Node
        </span>
      </div>

      {/* Main Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Metric 1: AI Crop Health */}
        <div style={{
          backgroundColor: '#F0FDF4',
          borderRadius: '16px',
          padding: '1rem',
          border: '1px solid #BBF7D0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#15803D' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>AI Crop Health</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#073B1E' }}>
            98.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ Optimal Condition
          </div>
        </div>

        {/* Metric 2: Auction Rate */}
        <div style={{
          backgroundColor: '#FFFBEB',
          borderRadius: '16px',
          padding: '1rem',
          border: '1px solid #FDE68A',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#D97706' }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Auction Rate</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#78350F' }}>
            ₹2,450 <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>/kg</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: '600', marginTop: '0.2rem' }}>
            ↑ High Quality Grade
          </div>
        </div>
      </div>

      {/* Environmental Metrics Table */}
      <div style={{
        backgroundColor: '#FAF5FF',
        borderRadius: '16px',
        padding: '1.1rem',
        border: '1px solid #E9D5FF',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6B21A8', marginBottom: '0.75rem' }}>
          Munnar Valley Weather & Soil
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F3E8FF' }}>
          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CloudSun size={16} color="#9333EA" /> Temperature
          </span>
          <span style={{ fontWeight: '700', color: '#1E293B' }}>22°C</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid #F3E8FF' }}>
          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Droplets size={16} color="#0284C7" /> Humidity
          </span>
          <span style={{ fontWeight: '700', color: '#1E293B' }}>84%</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', paddingTop: '0.5rem' }}>
          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Thermometer size={16} color="#16A34A" /> Soil pH Level
          </span>
          <span style={{ fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>6.2 (Ideal)</span>
        </div>
      </div>

      {/* Button: Join CardaLink Ecosystem */}
      <Link to="/register" className="btn btn-primary" style={{
        width: '100%',
        padding: '0.9rem',
        fontSize: '1rem',
        fontWeight: '700',
        borderRadius: '14px',
      }}>
        <span>Join CardaLink Ecosystem</span>
        <ArrowRight size={18} />
      </Link>
    </div>
  );
};
