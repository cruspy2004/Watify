const fs = require('fs');
const path = require('path');

function showConfigurationGuide() {
  console.log('🔧 Database Configuration Guide');
  console.log('================================');
  console.log('');
  console.log('It looks like your .env file needs to be configured with your actual database credentials.');
  console.log('');
  console.log('📝 Steps to configure:');
  console.log('');
  console.log('1. Open the .env file in your project root');
  console.log('2. Replace the following template values with your actual credentials:');
  console.log('');
  console.log('   DB_USER=your_username  →  DB_USER=postgres (or your PostgreSQL username)');
  console.log('   DB_PASSWORD=your_password  →  DB_PASSWORD=your_actual_password');
  console.log('   JWT_SECRET=your_super_secret_jwt_key_here  →  JWT_SECRET=a_very_secure_random_string');
  console.log('');
  console.log('3. Make sure you have:');
  console.log('   ✅ PostgreSQL installed and running');
  console.log('   ✅ A database named "wateen_watify" created');
  console.log('   ✅ Valid username and password');
  console.log('');
  console.log('4. Test your configuration with: npm run db:test');
  console.log('');
  console.log('💡 Example .env configuration:');
  console.log('');
  console.log('   DB_HOST=localhost');
  console.log('   DB_PORT=5432');
  console.log('   DB_NAME=wateen_watify');
  console.log('   DB_USER=postgres');
  console.log('   DB_PASSWORD=mypassword123');
  console.log('   JWT_SECRET=wateen_watify_secret_key_2024');
  console.log('');
  console.log('🔐 Security Note: Make sure to use a strong, unique JWT_SECRET in production!');
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '../../.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for template values
  const hasTemplateValues = envContent.includes('your_username') || 
                           envContent.includes('your_password') || 
                           envContent.includes('your_super_secret_jwt_key_here');
  
  if (hasTemplateValues) {
    console.log('⚠️  Your .env file contains template values that need to be updated.');
    return false;
  }
  
  console.log('✅ .env file appears to be configured.');
  return true;
}

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
  const { Client } = require('pg');
  
  // Connect to PostgreSQL (without specifying database)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database
  });
  
  try {
    await client.connect();
    
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME || 'wateen_watify']
    );
    
    if (result.rows.length === 0) {
      console.log(`🔄 Creating database "${process.env.DB_NAME}"...`);
      await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log('✅ Database created successfully!');
    } else {
      console.log('✅ Database already exists.');
    }
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

module.exports = {
  showConfigurationGuide,
  checkEnvFile,
  createDatabaseIfNotExists
};

// Run if called directly
if (require.main === module) {
  const isConfigured = checkEnvFile();
  if (!isConfigured) {
    showConfigurationGuide();
  }
} 