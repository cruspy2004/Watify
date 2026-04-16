const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./scripts/initDB');
const { seedAdminUser } = require('./scripts/seedAdmin');
const MigrationManager = require('./scripts/migrate');
const { initializeWhatsApp } = require('./config/whatsapp');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
const shouldAutoStartWhatsApp = process.env.WHATSAPP_AUTO_START !== 'false';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required to start the production server');
}

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Wateen Watify API',
    status: 'Server is running successfully!'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/whatsapp-groups', require('./routes/whatsappGroups'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

app.use(express.static(frontendBuildPath));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Route not found' });
  }

  return res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

async function startServer() {
  try {
    const migrationManager = new MigrationManager();

    console.log('Initializing database...');
    await testConnection();
    await migrationManager.runMigrations();
    await seedAdminUser();
    console.log('Database initialized successfully!');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    });

    if (shouldAutoStartWhatsApp) {
      console.log('Initializing WhatsApp client...');
      setTimeout(async () => {
        try {
          await initializeWhatsApp();
          console.log('WhatsApp client initialized successfully!');
        } catch (whatsappError) {
          console.error('WhatsApp initialization failed (server will continue):', whatsappError.message);
        }
      }, 2000);
    } else {
      console.log('WhatsApp auto-start disabled by WHATSAPP_AUTO_START=false');
    }
  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
