const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { testConnection, createTables } = require('./scripts/initDB');

// Load environment variables
dotenv.config();

// Set default environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'watify_super_secret_jwt_key_2024_change_in_production_very_secure_token';
}
if (!process.env.JWT_EXPIRE) {
  process.env.JWT_EXPIRE = '7d';
}
if (!process.env.DB_USER) {
  process.env.DB_USER = 'postgres';
}
if (!process.env.DB_PASSWORD) {
  process.env.DB_PASSWORD = 'alihassan';
}
if (!process.env.DB_NAME) {
  process.env.DB_NAME = 'postgres';
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Wateen Watify API',
    status: 'Server is running successfully!'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import and use routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/whatsapp-groups', require('./routes/whatsappGroups'));

// WhatsApp routes (will handle initialization separately)
try {
  app.use('/api/whatsapp', require('./routes/whatsapp'));
} catch (whatsappError) {
  console.log('⚠️ WhatsApp routes not loaded - will be available after WhatsApp initialization');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection and create tables if needed
    console.log('🔄 Initializing database...');
    await testConnection();
    await createTables();
    console.log('✅ Database initialized successfully!');
    
    // Start the server FIRST
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Access the API at: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
    
    // Initialize WhatsApp client in background (non-blocking)
    console.log('🔄 Initializing WhatsApp client in background...');
    setTimeout(async () => {
      try {
        const { initializeWhatsApp } = require('./config/whatsapp');
        await initializeWhatsApp();
        console.log('✅ WhatsApp client initialized successfully!');
      } catch (whatsappError) {
        console.log('⚠️ WhatsApp initialization failed, but server is still running:', whatsappError.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('💡 Make sure PostgreSQL is running and database credentials are correct');
    process.exit(1);
  }
}

// Start the application
startServer();

module.exports = app; 