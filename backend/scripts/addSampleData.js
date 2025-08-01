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

    // Insert today's daily statistics
    await query(`
      INSERT INTO daily_statistics (
        date, outgoing_text_count, outgoing_total_count, active_subscribers_count
      ) VALUES (
        CURRENT_DATE, 96, 96, 15
      )
      ON CONFLICT (date) DO UPDATE SET
        outgoing_text_count = 96,
        outgoing_total_count = 96,
        active_subscribers_count = 15
    `);
    
    console.log('✅ Daily statistics updated');

    // Add monthly statistics  
    await query(`
      INSERT INTO monthly_statistics (year, month, text_count, total_count, total_subscribers) 
      VALUES (2024, 6, 2420, 2420, 15)
      ON CONFLICT (year, month) DO UPDATE SET
        text_count = 2420,
        total_count = 2420,
        total_subscribers = 15
    `);
    
    console.log('✅ Monthly statistics updated');

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