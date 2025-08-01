const { query, pool } = require('../config/database');

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...');
    console.log('==================================');
    
    // Test basic connection
    const timeResult = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection: SUCCESS');
    console.log(`📅 Server time: ${timeResult.rows[0].current_time}`);
    
    // Test database version
    const versionResult = await query('SELECT version() as version');
    console.log(`🗄️  PostgreSQL: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Test if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Available tables:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   No tables found. Run "npm run db:init" to create tables.');
    }
    
    // Test users table specifically
    try {
      const userCountResult = await query('SELECT COUNT(*) as count FROM users');
      console.log(`\n👥 Users in database: ${userCountResult.rows[0].count}`);
    } catch (error) {
      console.log('\n⚠️  Users table not found. Run "npm run db:init" to create it.');
    }
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database credentials in .env are correct');
    console.error('   3. Database "wateen_watify" exists');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

console.log('🚀 Wateen Watify - Database Test');
testDatabase(); 