const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const config = require('../config/appConfig');

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');
    
    const email = config.defaultAdmin.email;
    const password = config.defaultAdmin.password;
    const name = config.defaultAdmin.name;
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists. Updating password...');
      
      // Update existing user's password
      await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [hashedPassword, email]
      );
      
      console.log('✅ User password updated successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👤 User ID: ${existingUser.rows[0].id}`);
    } else {
      console.log('👤 Creating new user...');
      
      // Create new user
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role, active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at',
        [name, email, hashedPassword, 'admin', true]
      );
      
      console.log('✅ User created successfully!');
      console.log('📊 User Details:');
      console.log(`   👤 ID: ${result.rows[0].id}`);
      console.log(`   📛 Name: ${result.rows[0].name}`);
      console.log(`   📧 Email: ${result.rows[0].email}`);
      console.log(`   🔑 Password: ${password}`);
      console.log(`   👑 Role: ${result.rows[0].role}`);
      console.log(`   📅 Created: ${result.rows[0].created_at}`);
    }
    
    // Test login credentials
    console.log('\n🧪 Testing login credentials...');
    const testUser = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );
    
    if (testUser.rows.length > 0) {
      const isValidPassword = await bcrypt.compare(password, testUser.rows[0].password);
      if (isValidPassword) {
        console.log('✅ Login credentials verified successfully!');
      } else {
        console.log('❌ Password verification failed!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser(); 