const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wateen_watify',
  user: process.env.DB_USER || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
  // Force IPv4 to avoid IPv6 connection issues on some platforms
  family: 4,
};

// Only add password if it exists and is not empty
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
  dbConfig.password = process.env.DB_PASSWORD;
}

// Create a new pool
const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Helper function to get a client from pool
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('❌ Error getting client from pool:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  getClient,
}; 
