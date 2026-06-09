const { query } = require('../config/database');

class Analytics {
  static async getTodayStatistics() {
    try {
      const messageStatsQuery = `
        SELECT
          COUNT(CASE WHEN content_type = 'text' THEN 1 END) AS text_count,
          COUNT(CASE WHEN content_type = 'media_attachment' THEN 1 END) AS media_count,
          COUNT(CASE WHEN content_type = 'link_preview' THEN 1 END) AS link_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count,
          COUNT(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 END) AS successful_count,
          COUNT(*) AS total_count
        FROM messages
        WHERE DATE(created_at) = CURRENT_DATE
      `;

      const recipientStatsQuery = `
        SELECT
          COUNT(CASE WHEN recipient_type = 'individual' THEN 1 END) AS individual_count,
          COUNT(CASE WHEN recipient_type = 'group' THEN 1 END) AS group_count,
          COUNT(CASE WHEN recipient_type = 'whatsapp_group' THEN 1 END) AS whatsapp_group_count
        FROM messages
        WHERE DATE(created_at) = CURRENT_DATE
      `;

      const [messageResult, recipientResult] = await Promise.all([
        query(messageStatsQuery),
        query(recipientStatsQuery)
      ]);

      const messageRow = messageResult.rows[0] || {};
      const recipientRow = recipientResult.rows[0] || {};
      const mediaCount = parseInt(messageRow.media_count, 10) || 0;

      return {
        outgoing: {
          text: parseInt(messageRow.text_count, 10) || 0,
          video: 0,
          image: mediaCount,
          document: 0,
          audio: 0,
          links: parseInt(messageRow.link_count, 10) || 0,
          total: parseInt(messageRow.total_count, 10) || 0
        },
        incoming: {
          message: 0,
          auto_response: 0,
          audio_call: 0,
          video_call: 0
        },
        errors: {
          limit_exceeded: 0,
          no_whatsapp_account: 0,
          invalid_numbers: 0,
          failed: parseInt(messageRow.failed_count, 10) || 0
        },
        recipients: {
          individual: parseInt(recipientRow.individual_count, 10) || 0,
          group: parseInt(recipientRow.group_count, 10) || 0,
          whatsapp_group: parseInt(recipientRow.whatsapp_group_count, 10) || 0
        },
        delivery: {
          successful: parseInt(messageRow.successful_count, 10) || 0,
          failed: parseInt(messageRow.failed_count, 10) || 0
        }
      };
    } catch (error) {
      console.error('Error getting today statistics:', error);
      throw error;
    }
  }

  static async getMonthlyStatistics(year, month) {
    try {
      const currentDate = new Date();
      const targetYear = parseInt(year, 10) || currentDate.getFullYear();
      const targetMonth = parseInt(month, 10) || currentDate.getMonth() + 1;

      const monthlyStatsQuery = `
        SELECT
          COUNT(CASE WHEN content_type = 'text' THEN 1 END) AS text_count,
          COUNT(CASE WHEN content_type = 'media_attachment' THEN 1 END) AS media_count,
          COUNT(CASE WHEN content_type = 'link_preview' THEN 1 END) AS link_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count,
          COUNT(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 END) AS successful_count,
          COUNT(*) AS total_count
        FROM messages
        WHERE EXTRACT(YEAR FROM created_at) = $1
          AND EXTRACT(MONTH FROM created_at) = $2
      `;

      const result = await query(monthlyStatsQuery, [targetYear, targetMonth]);
      const row = result.rows[0] || {};
      const mediaCount = parseInt(row.media_count, 10) || 0;

      return {
        text: parseInt(row.text_count, 10) || 0,
        video: 0,
        image: mediaCount,
        document: 0,
        audio: 0,
        auto_response: 0,
        links: parseInt(row.link_count, 10) || 0,
        successful: parseInt(row.successful_count, 10) || 0,
        failed: parseInt(row.failed_count, 10) || 0,
        total: parseInt(row.total_count, 10) || 0,
        year: targetYear,
        month: targetMonth
      };
    } catch (error) {
      console.error('Error getting monthly statistics:', error);
      throw error;
    }
  }

  static async getSubscriberStatistics() {
    try {
      const subscriberStatsQuery = `
        SELECT
          COUNT(*) AS total_subscribers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_subscribers,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) AS new_today
        FROM subscribers
      `;

      const result = await query(subscriberStatsQuery);
      const row = result.rows[0] || {};

      return {
        total: parseInt(row.total_subscribers, 10) || 0,
        active: parseInt(row.active_subscribers, 10) || 0,
        new_today: parseInt(row.new_today, 10) || 0
      };
    } catch (error) {
      console.error('Error getting subscriber statistics:', error);
      throw error;
    }
  }

  static async getFortnightActivity() {
    try {
      const activityQuery = `
        SELECT
          DATE(created_at) AS date,
          COUNT(CASE WHEN content_type = 'text' THEN 1 END) AS text_count,
          COUNT(CASE WHEN content_type = 'media_attachment' THEN 1 END) AS media_count,
          COUNT(CASE WHEN content_type = 'link_preview' THEN 1 END) AS link_count,
          COUNT(*) AS total_count
        FROM messages
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `;

      const result = await query(activityQuery);

      return result.rows.map((row) => ({
        date: row.date,
        text: parseInt(row.text_count, 10) || 0,
        image: parseInt(row.media_count, 10) || 0,
        video: 0,
        document: 0,
        links: parseInt(row.link_count, 10) || 0,
        total: parseInt(row.total_count, 10) || 0
      }));
    } catch (error) {
      console.error('Error getting fortnight activity:', error);
      throw error;
    }
  }

  static async getDashboardData() {
    try {
      const [todayStats, monthlyStats, subscriberStats, activity] = await Promise.all([
        this.getTodayStatistics(),
        this.getMonthlyStatistics(),
        this.getSubscriberStatistics(),
        this.getFortnightActivity()
      ]);

      const successfulMessages = monthlyStats.successful || 0;
      const failedMessages = monthlyStats.failed || 0;
      const totalTrackedMessages = successfulMessages + failedMessages;
      const successRate = totalTrackedMessages > 0
        ? Number(((successfulMessages / totalTrackedMessages) * 100).toFixed(1))
        : 0;

      return {
        today: todayStats,
        monthly: monthlyStats,
        subscribers: subscriberStats,
        activity,
        summary: {
          success_rate: successRate,
          successful_messages: successfulMessages,
          failed_messages: failedMessages
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}

module.exports = Analytics;
