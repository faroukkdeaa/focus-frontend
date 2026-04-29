import React from 'react';
import { useTheme } from '../context/ThemeContext';

const EmptyState = ({ icon: Icon, title, description, actionButton }) => {
  const { C } = useTheme();

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '48px 24px', 
        textAlign: 'center', 
        height: '100%',
        width: '100%'
      }}
    >
      {Icon && (
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: C.iconBgA,
          border: `1px solid ${C.iconBorderA}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Icon style={{ width: '32px', height: '32px', color: C.iconA }} />
        </div>
      )}
      
      {title && (
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.textPrimary, marginBottom: '8px' }}>
          {title}
        </h3>
      )}
      
      {description && (
        <p style={{ fontSize: '0.875rem', color: C.textMuted, maxWidth: '400px', marginBottom: '24px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      
      {actionButton && (
        <div style={{ marginTop: '8px' }}>
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
