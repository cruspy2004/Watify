// API Configuration - Now fully dynamic!
const defaultApiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || defaultApiBaseUrl,
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  
  // Dynamic URL builder
  buildUrl: (endpoint) => `${process.env.REACT_APP_API_BASE_URL || defaultApiBaseUrl}${endpoint}`,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
      LOGOUT: '/api/auth/logout'
    },
    WHATSAPP: {
      STATUS: '/api/whatsapp/status',
      QR: '/api/whatsapp/qr',
      SEND_MESSAGE: '/api/whatsapp/send-message',
      SEND_BULK: '/api/whatsapp/send-bulk',
      CHECK_NUMBER: '/api/whatsapp/check-number',
      RESTART: '/api/whatsapp/restart'
    }
  }
};

// App Configuration
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_APP_NAME || 'Wateen Watify',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  DESCRIPTION: 'Full-stack application with React frontend and Node.js backend'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'wateen_watify_token',
  USER: 'wateen_watify_user',
  THEME: 'wateen_watify_theme'
};

// Theme Configuration
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#1976d2',
  SECONDARY_COLOR: '#dc004e',
  SUCCESS_COLOR: '#2e7d32',
  WARNING_COLOR: '#ed6c02',
  ERROR_COLOR: '#d32f2f'
}; 
