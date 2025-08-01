const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  if (email === 'alihassan.iqbal101@gmail.com' && password === 'ah2003ah') {
    res.json({
      status: 'success',
      data: {
        token: 'simple_test_token_12345',
        user: {
          id: 1,
          email: email,
          name: 'Ali Hassan',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }
});

// Simple WhatsApp status endpoint
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: 'success',
    data: {
      isReady: false,
      isAuthenticated: false,
      hasQR: true,
      state: 'DISCONNECTED'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});

module.exports = app; 