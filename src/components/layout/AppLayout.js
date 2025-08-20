// src/components/layout/AppLayout.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Main AppLayout component
const AppLayout = ({ children, title, showBackButton = false, maxWidth = 480 }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: `${maxWidth}px`,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        {(title || showBackButton) && (
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
            )}
            {title && (
              <h1 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {title}
              </h1>
            )}
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
};

// AppSection component
const AppSection = ({ children, style = {} }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      ...style
    }}>
      {children}
    </div>
  );
};

// AppFormGroup component
const AppFormGroup = ({ label, error, children, style = {} }) => {
  return (
    <div style={{
      marginBottom: '20px',
      ...style
    }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '6px'
        }}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <p style={{
          fontSize: '14px',
          color: '#dc2626',
          margin: '4px 0 0 0'
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

// AppInput component
const AppInput = ({ 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  minLength,
  style = {},
  ...props 
}) => {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: `2px solid ${error ? '#dc2626' : '#d1d5db'}`,
        borderRadius: '8px',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.15s ease-in-out',
        backgroundColor: 'white',
        boxSizing: 'border-box',
        ...style
      }}
      onFocus={(e) => {
        if (!error) {
          e.target.style.borderColor = '#2563eb';
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.target.style.borderColor = '#d1d5db';
        }
      }}
      {...props}
    />
  );
};

// AppButton component
const AppButton = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  fullWidth = false, 
  disabled = false,
  onClick,
  style = {},
  ...props 
}) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    boxSizing: 'border-box'
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2563eb',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#2563eb',
      border: '2px solid #2563eb',
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary') {
            e.target.style.backgroundColor = '#1d4ed8';
          } else if (variant === 'secondary') {
            e.target.style.backgroundColor = '#4b5563';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === 'primary') {
            e.target.style.backgroundColor = '#2563eb';
          } else if (variant === 'secondary') {
            e.target.style.backgroundColor = '#6b7280';
          }
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// AppStatusMessage component
const AppStatusMessage = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    success: {
      backgroundColor: '#dcfce7',
      borderColor: '#16a34a',
      color: '#15803d'
    },
    error: {
      backgroundColor: '#fee2e2',
      borderColor: '#dc2626',
      color: '#dc2626'
    },
    info: {
      backgroundColor: '#dbeafe',
      borderColor: '#2563eb',
      color: '#1d4ed8'
    },
    warning: {
      backgroundColor: '#fef3c7',
      borderColor: '#d97706',
      color: '#92400e'
    }
  };

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid`,
      margin: '0 24px 16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...typeStyles[type]
    }}>
      <span style={{
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'inherit',
            marginLeft: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m18 6-12 12"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
};

// Export the components
export default AppLayout;
export { 
  AppSection, 
  AppFormGroup, 
  AppInput, 
  AppButton, 
  AppStatusMessage 
};