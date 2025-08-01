const { query } = require('../config/database');

class Campaign {
  // Find campaign by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT c.*, u.name as created_by_name FROM campaigns c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding campaign by ID:', error);
      throw error;
    }
  }

  // Create new campaign
  static async create(campaignData) {
    try {
      const { name, description, message_template, target_type = 'all', status = 'draft', scheduled_at, created_by } = campaignData;

      const result = await query(
        'INSERT INTO campaigns (name, description, message_template, target_type, status, scheduled_at, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *',
        [name, description, message_template, target_type, status, scheduled_at, created_by]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  // Update campaign
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id') {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      const updateQuery = `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  // Delete campaign
  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM campaigns WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  // Get all campaigns with pagination
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [limit, offset];
      let paramCount = 3;

      if (filters.status) {
        whereClause += ` AND c.status = $${paramCount}`;
        queryParams.push(filters.status);
        paramCount++;
      }

      if (filters.search) {
        whereClause += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      const countQuery = `SELECT COUNT(*) FROM campaigns c ${whereClause}`;
      const selectQuery = `SELECT c.*, u.name as created_by_name FROM campaigns c LEFT JOIN users u ON c.created_by = u.id ${whereClause} ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`;

      const [countResult, campaignsResult] = await Promise.all([
        query(countQuery, queryParams.slice(2)),
        query(selectQuery, queryParams)
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        campaigns: campaignsResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalCampaigns: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all campaigns:', error);
      throw error;
    }
  }

  // Add recipients to campaign
  static async addRecipients(campaignId, subscriberIds) {
    try {
      const values = [];
      const placeholders = [];
      
      subscriberIds.forEach((subscriberId, index) => {
        const baseIndex = index * 2;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2})`);
        values.push(campaignId, subscriberId);
      });

      const insertQuery = `
        INSERT INTO campaign_recipients (campaign_id, subscriber_id)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (campaign_id, subscriber_id) DO NOTHING
        RETURNING *
      `;

      const result = await query(insertQuery, values);
      
      // Update total recipients count
      await query(
        'UPDATE campaigns SET total_recipients = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = $1) WHERE id = $1',
        [campaignId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error adding recipients to campaign:', error);
      throw error;
    }
  }

  // Get campaign recipients
  static async getRecipients(campaignId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [countResult, recipientsResult] = await Promise.all([
        query('SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = $1', [campaignId]),
        query(`
          SELECT cr.*, s.name, s.phone_number, s.email, s.status as subscriber_status
          FROM campaign_recipients cr
          LEFT JOIN subscribers s ON cr.subscriber_id = s.id
          WHERE cr.campaign_id = $1
          ORDER BY cr.created_at DESC
          LIMIT $2 OFFSET $3
        `, [campaignId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        recipients: recipientsResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecipients: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting campaign recipients:', error);
      throw error;
    }
  }

  // Update recipient status
  static async updateRecipientStatus(campaignId, subscriberId, status, messageId = null, errorMessage = null) {
    try {
      const validStatuses = ['pending', 'sent', 'delivered', 'failed', 'skipped'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const updateData = { status, message_id: messageId, error_message: errorMessage };
      const timestamp = new Date().toISOString();

      if (status === 'sent') {
        updateData.sent_at = timestamp;
      } else if (status === 'delivered') {
        updateData.delivered_at = timestamp;
      }

      const result = await query(`
        UPDATE campaign_recipients 
        SET status = $1, message_id = $2, error_message = $3, sent_at = $4, delivered_at = $5
        WHERE campaign_id = $6 AND subscriber_id = $7
        RETURNING *
      `, [status, messageId, errorMessage, updateData.sent_at || null, updateData.delivered_at || null, campaignId, subscriberId]);

      // Update campaign sent count
      if (status === 'sent') {
        await query(
          'UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = $1',
          [campaignId]
        );
      }

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating recipient status:', error);
      throw error;
    }
  }

  // Get campaigns by status
  static async getByStatus(status) {
    try {
      const result = await query(`
        SELECT c.*, u.name as created_by_name
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.status = $1
        ORDER BY c.created_at DESC
      `, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error getting campaigns by status:', error);
      throw error;
    }
  }

  // Get scheduled campaigns
  static async getScheduled() {
    try {
      const result = await query(`
        SELECT c.*, u.name as created_by_name
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.status = 'scheduled' AND c.scheduled_at <= NOW()
        ORDER BY c.scheduled_at ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting scheduled campaigns:', error);
      throw error;
    }
  }

  // Get campaign statistics
  static async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_campaigns,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_campaigns,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns,
          SUM(total_recipients) as total_recipients,
          SUM(sent_count) as total_sent
        FROM campaigns
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting campaign statistics:', error);
      throw error;
    }
  }

  // Get campaign performance
  static async getPerformance(campaignId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_recipients,
          COUNT(CASE WHEN cr.status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN cr.status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN cr.status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN cr.status = 'skipped' THEN 1 END) as skipped_count,
          COUNT(CASE WHEN cr.status = 'pending' THEN 1 END) as pending_count
        FROM campaign_recipients cr
        WHERE cr.campaign_id = $1
      `, [campaignId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      throw error;
    }
  }
}

module.exports = Campaign; 