const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { testConnection, createTables } = require('./scripts/initDB');
const { initializeWhatsApp } = require('./config/whatsapp');

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
  process.env.DB_PASSWORD = 'haadheesheeraz2004';
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

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/whatsapp-groups', require('./routes/whatsappGroups'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Start the server FIRST (so Render knows the app is running)
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Access the API at: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
    
    // Then test database connection (non-blocking)
    setTimeout(async () => {
      try {
        console.log('🔄 Initializing database...');
        await testConnection();
        await createTables();
        console.log('✅ Database initialized successfully!');
      } catch (dbError) {
        console.error('⚠️ Database initialization failed (server will continue):', dbError.message);
        console.log('💡 Database endpoints will not work until connection is fixed');
      }
    }, 1000);
    
    // Initialize WhatsApp client after server is running
    console.log('🔄 Initializing WhatsApp client...');
    setTimeout(async () => {
      try {
        await initializeWhatsApp();
        console.log('✅ WhatsApp client initialized successfully!');
        console.log('📱 WhatsApp will be ready for authentication once QR code is scanned');
      } catch (whatsappError) {
        console.error('⚠️ WhatsApp initialization failed (server will continue):', whatsappError.message);
        console.log('💡 WhatsApp can be initialized later via API endpoints');
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

module.exports = app; 