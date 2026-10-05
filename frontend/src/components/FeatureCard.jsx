import React from 'react';

export const FeatureCard = ({ icon: Icon, title, description, badge }) => {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      padding: '2rem',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}
    className="feature-card-hover"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%)',
          border: '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#15803D',
        }}>
          <Icon size={28} strokeWidth={2.2} />
        </div>
        {badge && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#0F5A2C',
            backgroundColor: '#ECFDF5',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            border: '1px solid #A7F3D0',
          }}>
            {badge}
          </span>
        )}
      </div>

      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#073B1E',
        marginBottom: '0.65rem',
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.925rem',
        color: '#475569',
        lineHeight: 1.6,
        flexGrow: 1,
      }}>
        {description}
      </p>

      <style>{`
        .feature-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px -4px rgba(15, 90, 44, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04) !important;
          border-color: #A7F3D0 !important;
        }
      `}</style>
    </div>
  );
};
