const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection, createTables } = require('./scripts/initDB');
const { seedAdminUser } = require('./scripts/seedAdmin');
const MigrationManager = require('./scripts/migrate');
const { initializeWhatsApp } = require('./config/whatsapp');

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
const shouldAutoStartWhatsApp = process.env.WHATSAPP_AUTO_START !== 'false';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required to start the server');
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

const allowedOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/api', (req, res) => {
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

if (isProduction) {
  app.use(express.static(frontendBuildPath));
}

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
    // Test database connection and create tables if needed
    console.log('🔄 Initializing database...');
    await testConnection();
    await createTables();
    console.log('✅ Database initialized successfully!');
    
    // Start the server first
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Access the API at: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
    
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
