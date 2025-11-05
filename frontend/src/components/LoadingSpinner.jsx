import React from 'react';

const LoadingSpinner = ({ fullScreen = true, size = 'md' }) => {
  const sizes = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem'
  };

  const spinner = (
    <div 
      className="spinner" 
      style={{ 
        width: sizes[size], 
        height: sizes[size],
        borderWidth: size === 'sm' ? '2px' : '3px'
      }} 
    />
  );

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        <div style={{ textAlign: 'center' }}>
          {spinner}
          <p style={{ marginTop: '1rem', color: 'var(--white)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
