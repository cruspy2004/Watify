const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { testConnection, createTables } = require('./scripts/initDB');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and CORS middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Watify API Server', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'Connected'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Watify API',
    endpoints: [
      'GET /health - Server health check',
      'GET /api - This endpoint',
      'POST /api/auth/login - User login',
      'POST /api/auth/register - User registration'
    ]
  });
});

// Auth routes (simplified)
app.use('/api/auth', require('./routes/auth'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    await testConnection();
    await createTables();
    console.log('✅ Database initialized successfully!');
    
    // Start the server immediately (no WhatsApp blocking)
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 TEST SERVER RUNNING');
      console.log('='.repeat(60));
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔐 Login Test: http://localhost:${PORT}/api/auth/login`);
      console.log('='.repeat(60));
      console.log('✅ Ready for login testing!');
      console.log('\n💡 WhatsApp functionality disabled for testing');
    });
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});

// Start the server
startServer(); 