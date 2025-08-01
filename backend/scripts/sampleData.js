const { query } = require('../config/database');

async function addSampleData() {
  try {
    console.log('🔄 Adding sample data...');

    // Add sample messages for today's statistics
    for (let i = 1; i <= 96; i++) {
      await query(`
        INSERT INTO messages (sender_id, recipient_id, message_type, content, direction, status, created_at) 
        VALUES (3, 1, 'text', 'Sample message ${i}', 'outbound', 'delivered', NOW())
      `);
    }
    
    console.log('✅ 96 sample messages added for today');
    console.log('🎉 Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    throw error;
  }
}

if (require.main === module) {
  addSampleData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addSampleData }; 