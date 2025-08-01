const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'Access token required',
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Check if user still exists in database
    const userResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1 AND active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'User not found or inactive'
      });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: userResult.rows[0].role
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'Please login again'
      });
    }
    
    return res.status(403).json({ 
      message: 'Invalid token',
      error: 'Token verification failed'
    });
  }
};

// Middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No user information found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        error: 'Access denied for your role'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize,
}; 