const { query } = require('../config/database');

class Analytics {
  // Get today's statistics
  static async getTodayStatistics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const messageStatsQuery = `
        SELECT 
          COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_count,
          COUNT(CASE WHEN message_type = 'video' THEN 1 END) as video_count,
          COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_count,
          COUNT(CASE WHEN message_type = 'document' THEN 1 END) as document_count,
          COUNT(CASE WHEN message_type = 'audio' THEN 1 END) as audio_count,
          COUNT(*) as total_count
        FROM messages 
        WHERE direction = 'outbound' 
        AND DATE(created_at) = $1
      `;

      const result = await query(messageStatsQuery, [today]);
      
      return {
        outgoing: {
          text: parseInt(result.rows[0].text_count) || 0,
          video: parseInt(result.rows[0].video_count) || 0,
          image: parseInt(result.rows[0].image_count) || 0,
          document: parseInt(result.rows[0].document_count) || 0,
          audio: parseInt(result.rows[0].audio_count) || 0,
          total: parseInt(result.rows[0].total_count) || 0
        }
      };
    } catch (error) {
      console.error('Error getting today statistics:', error);
      throw error;
    }
  }

  // Get monthly statistics
  static async getMonthlyStatistics() {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const monthlyStatsQuery = `
        SELECT 
          COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_count,
          COUNT(CASE WHEN message_type = 'video' THEN 1 END) as video_count,
          COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_count,
          COUNT(CASE WHEN message_type = 'document' THEN 1 END) as document_count,
          COUNT(CASE WHEN message_type = 'audio' THEN 1 END) as audio_count,
          COUNT(*) as total_count
        FROM messages 
        WHERE direction = 'outbound' 
        AND EXTRACT(YEAR FROM created_at) = $1
        AND EXTRACT(MONTH FROM created_at) = $2
      `;

      const result = await query(monthlyStatsQuery, [year, month]);
      
      return {
        text: parseInt(result.rows[0].text_count) || 0,
        video: parseInt(result.rows[0].video_count) || 0,
        image: parseInt(result.rows[0].image_count) || 0,
        document: parseInt(result.rows[0].document_count) || 0,
        audio: parseInt(result.rows[0].audio_count) || 0,
        auto_response: 0,
        total: parseInt(result.rows[0].total_count) || 0
      };
    } catch (error) {
      console.error('Error getting monthly statistics:', error);
      throw error;
    }
  }

  // Get subscriber statistics
  static async getSubscriberStatistics() {
    try {
      const subscriberStatsQuery = `
        SELECT 
          COUNT(*) as total_subscribers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscribers
        FROM subscribers
      `;

      const result = await query(subscriberStatsQuery);
      
      return {
        total: parseInt(result.rows[0].total_subscribers) || 0,
        active: parseInt(result.rows[0].active_subscribers) || 0
      };
    } catch (error) {
      console.error('Error getting subscriber statistics:', error);
      throw error;
    }
  }

  // Get activity data for the past fortnight
  static async getFortnightActivity() {
    try {
      const activityQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_count,
          COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_count,
          COUNT(CASE WHEN message_type = 'video' THEN 1 END) as video_count,
          COUNT(CASE WHEN message_type = 'document' THEN 1 END) as document_count,
          COUNT(*) as total_count
        FROM messages 
        WHERE direction = 'outbound' 
        AND created_at >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `;

      const result = await query(activityQuery);
      
      return result.rows.map(row => ({
        date: row.date,
        text: parseInt(row.text_count) || 0,
        image: parseInt(row.image_count) || 0,
        video: parseInt(row.video_count) || 0,
        document: parseInt(row.document_count) || 0,
        total: parseInt(row.total_count) || 0
      }));
    } catch (error) {
      console.error('Error getting fortnight activity:', error);
      throw error;
    }
  }

  // Get complete dashboard data
  static async getDashboardData() {
    try {
      const [todayStats, monthlyStats, subscriberStats] = await Promise.all([
        this.getTodayStatistics(),
        this.getMonthlyStatistics(),
        this.getSubscriberStatistics()
      ]);

      return {
        today: todayStats,
        monthly: monthlyStats,
        subscribers: subscriberStats,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  // Update daily statistics manually (for data correction)
  static async updateDailyStatistics(date, statistics) {
    try {
      const updateQuery = `
        INSERT INTO daily_statistics (
          date, outgoing_text_count, outgoing_video_count, outgoing_image_count,
          outgoing_document_count, outgoing_audio_count, outgoing_total_count,
          incoming_message_count, incoming_auto_response_count, 
          incoming_audio_call_count, incoming_video_call_count,
          limit_exceeded_count, no_whatsapp_account_count, invalid_numbers_count,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (date) DO UPDATE SET
          outgoing_text_count = EXCLUDED.outgoing_text_count,
          outgoing_video_count = EXCLUDED.outgoing_video_count,
          outgoing_image_count = EXCLUDED.outgoing_image_count,
          outgoing_document_count = EXCLUDED.outgoing_document_count,
          outgoing_audio_count = EXCLUDED.outgoing_audio_count,
          outgoing_total_count = EXCLUDED.outgoing_total_count,
          incoming_message_count = EXCLUDED.incoming_message_count,
          incoming_auto_response_count = EXCLUDED.incoming_auto_response_count,
          incoming_audio_call_count = EXCLUDED.incoming_audio_call_count,
          incoming_video_call_count = EXCLUDED.incoming_video_call_count,
          limit_exceeded_count = EXCLUDED.limit_exceeded_count,
          no_whatsapp_account_count = EXCLUDED.no_whatsapp_account_count,
          invalid_numbers_count = EXCLUDED.invalid_numbers_count,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await query(updateQuery, [
        date,
        statistics.outgoing_text_count || 0,
        statistics.outgoing_video_count || 0,
        statistics.outgoing_image_count || 0,
        statistics.outgoing_document_count || 0,
        statistics.outgoing_audio_count || 0,
        statistics.outgoing_total_count || 0,
        statistics.incoming_message_count || 0,
        statistics.incoming_auto_response_count || 0,
        statistics.incoming_audio_call_count || 0,
        statistics.incoming_video_call_count || 0,
        statistics.limit_exceeded_count || 0,
        statistics.no_whatsapp_account_count || 0,
        statistics.invalid_numbers_count || 0
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating daily statistics:', error);
      throw error;
    }
  }
}

module.exports = Analytics; 