// Central Configuration Management
require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || process.env.BACKEND_PORT || 5001,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'wateen_watify',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    url: process.env.DATABASE_URL
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'watify_default_secret',
    expire: process.env.JWT_EXPIRE || '7d'
  },

  // Frontend Configuration
  frontend: {
    port: process.env.FRONTEND_PORT || 3000,
    url: process.env.CLIENT_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`,
    timeout: process.env.API_TIMEOUT || 10000
  },

  // Default Admin User
  defaultAdmin: {
    name: process.env.ADMIN_NAME || 'Haadhee Sheeraz',
    email: process.env.ADMIN_EMAIL || 'haadheesheeraz2004@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    phone: process.env.ADMIN_PHONE || '923258660707'
  },

  // WhatsApp Configuration
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './backend/.wwebjs_auth',
    qrTimeout: process.env.WHATSAPP_QR_TIMEOUT || 60000
  }
};

// Dynamic URL generation
config.getServerUrl = () => `http://${config.server.host}:${config.server.port}`;
config.getApiUrl = (endpoint = '') => `${config.api.baseUrl}/api${endpoint}`;
config.getFrontendUrl = () => config.frontend.url;

module.exports = config;
