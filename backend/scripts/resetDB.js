const { query, pool } = require('../config/database');
const { createTables, createIndexes, createSampleData } = require('./initDB');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    console.log('========================');
    
    // Warning message
    console.log('⚠️  WARNING: This will delete ALL data in the database!');
    
    // Drop all tables
    await dropTables();
    
    // Recreate tables
    await createTables();
    
    // Create indexes
    await createIndexes();
    
    // Ask if user wants sample data
    console.log('\n📝 Creating sample data...');
    await createSampleData();
    
    console.log('\n✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

async function dropTables() {
  try {
    console.log('🗑️  Dropping existing tables...');
    
    // Drop tables in reverse order to handle foreign key constraints
    const dropQueries = [
      'DROP TABLE IF EXISTS users CASCADE',
      // Add more tables here as your project grows
      // 'DROP TABLE IF EXISTS orders CASCADE',
      // 'DROP TABLE IF EXISTS products CASCADE',
    ];
    
    for (const dropQuery of dropQueries) {
      await query(dropQuery);
    }
    
    console.log('✅ All tables dropped successfully!');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
}

// Get list of all tables in the database
async function getAllTables() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error getting table list:', error);
    return [];
  }
}

// Drop all tables dynamically
async function dropAllTables() {
  try {
    const tables = await getAllTables();
    
    if (tables.length === 0) {
      console.log('ℹ️  No tables to drop');
      return;
    }
    
    console.log(`🗑️  Dropping ${tables.length} tables...`);
    
    // Disable foreign key checks temporarily
    await query('SET session_replication_role = replica');
    
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   - Dropped: ${table}`);
    }
    
    // Re-enable foreign key checks
    await query('SET session_replication_role = DEFAULT');
    
    console.log('✅ All tables dropped successfully!');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
}

if (require.main === module) {
  console.log('🚀 Wateen Watify - Database Reset');
  resetDatabase();
}

module.exports = {
  resetDatabase,
  dropTables,
  dropAllTables
}; 