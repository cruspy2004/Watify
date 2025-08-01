const { query, pool } = require('../config/database');
const User = require('../models/User');

// Database initialization script
async function initializeDatabase() {
  try {
    console.log('🔄 Starting database initialization...');
    
    // Test database connection
    await testConnection();
    
    // Create tables
    await createTables();
    
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Test database connection
async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection successful!');
    console.log(`📅 Current time: ${result.rows[0].current_time}`);
    console.log(`🗄️  PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Create all necessary tables
async function createTables() {
  try {
    console.log('🔄 Creating database tables...');
    
    // Create users table
    await User.createTable();
    
    // Add more table creation calls here as you add more models
    // await Product.createTable();
    // await Order.createTable();
    
    console.log('✅ All tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Create indexes for better performance
async function createIndexes() {
  try {
    console.log('🔄 Creating database indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(active)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)'
    ];
    
    for (const indexQuery of indexes) {
      await query(indexQuery);
    }
    
    console.log('✅ All indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

// Create sample data (optional)
async function createSampleData() {
  try {
    console.log('🔄 Creating sample data...');
    
    // Check if admin user already exists
    const adminExists = await query('SELECT id FROM users WHERE email = $1', ['admin@wateen.com']);
    
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await query(
        'INSERT INTO users (name, email, password, role, active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        ['Admin User', 'admin@wateen.com', hashedPassword, 'admin', true]
      );
      
      console.log('✅ Sample admin user created (email: admin@wateen.com, password: admin123)');
    } else {
      console.log('ℹ️  Sample admin user already exists');
    }
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 Wateen Watify - Database Initialization');
  console.log('==========================================');
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  testConnection,
  createTables,
  createIndexes,
  createSampleData
}; 