const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function addHaadheeUser() {
  try {
    console.log('🔄 Adding Haadhee user...');
    
    const email = 'haadheesheeraz2004@gmail.com';
    const password = 'admin@123';
    const name = 'Haadhee Sheeraz';
    
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
        'UPDATE users SET password = $1, name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP WHERE email = $5',
        [hashedPassword, name, 'admin', true, email]
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
      console.log(`   🎭 Role: ${result.rows[0].role}`);
      console.log(`   🔑 Password: ${password}`);
      console.log(`   📅 Created: ${result.rows[0].created_at}`);
    }
    
    console.log('\n✅ Done! You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the function
addHaadheeUser()
  .then(() => {
    console.log('\n🎉 User setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
