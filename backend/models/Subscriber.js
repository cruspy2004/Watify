const { query } = require('../config/database');

class Subscriber {
  // Find subscriber by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT s.*, u.name as created_by_name FROM subscribers s LEFT JOIN users u ON s.created_by = u.id WHERE s.id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding subscriber by ID:', error);
      throw error;
    }
  }

  // Find subscriber by phone number
  static async findByPhone(phoneNumber) {
    try {
      const result = await query(
        'SELECT * FROM subscribers WHERE phone_number = $1',
        [phoneNumber]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding subscriber by phone:', error);
      throw error;
    }
  }

  // Find subscriber by WhatsApp ID
  static async findByWhatsAppId(whatsappId) {
    try {
      const result = await query(
        'SELECT * FROM subscribers WHERE whatsapp_id = $1',
        [whatsappId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding subscriber by WhatsApp ID:', error);
      throw error;
    }
  }

  // Create new subscriber
  static async create(subscriberData) {
    try {
      const { name, phone_number, email, whatsapp_id, status = 'active', tags = [], notes, created_by } = subscriberData;

      const result = await query(
        'INSERT INTO subscribers (name, phone_number, email, whatsapp_id, status, tags, notes, opt_in_date, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), NOW()) RETURNING *',
        [name, phone_number, email, whatsapp_id, status, tags, notes, created_by]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating subscriber:', error);
      throw error;
    }
  }

  // Update subscriber
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

      const updateQuery = `UPDATE subscribers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating subscriber:', error);
      throw error;
    }
  }

  // Delete subscriber
  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM subscribers WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      throw error;
    }
  }

  // Update subscriber status
  static async updateStatus(id, status) {
    try {
      const validStatuses = ['active', 'inactive', 'blocked', 'opted_out'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const updateData = { status };
      if (status === 'opted_out') {
        updateData.opt_out_date = new Date().toISOString();
      }

      const result = await query(
        'UPDATE subscribers SET status = $1, opt_out_date = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [status, updateData.opt_out_date || null, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating subscriber status:', error);
      throw error;
    }
  }

  // Get all subscribers with pagination and filters
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [limit, offset];
      let paramCount = 3;

      // Add filters
      if (filters.status) {
        whereClause += ` AND s.status = $${paramCount}`;
        queryParams.push(filters.status);
        paramCount++;
      }

      if (filters.tags && filters.tags.length > 0) {
        whereClause += ` AND s.tags && $${paramCount}`;
        queryParams.push(filters.tags);
        paramCount++;
      }

      if (filters.search) {
        whereClause += ` AND (s.name ILIKE $${paramCount} OR s.phone_number ILIKE $${paramCount} OR s.email ILIKE $${paramCount})`;
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters.created_by) {
        whereClause += ` AND s.created_by = $${paramCount}`;
        queryParams.push(filters.created_by);
        paramCount++;
      }

      const countQuery = `
        SELECT COUNT(*) 
        FROM subscribers s
        ${whereClause}
      `;

      const selectQuery = `
        SELECT s.*, u.name as created_by_name
        FROM subscribers s
        LEFT JOIN users u ON s.created_by = u.id
        ${whereClause} 
        ORDER BY s.created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const [countResult, subscribersResult] = await Promise.all([
        query(countQuery, queryParams.slice(2)),
        query(selectQuery, queryParams)
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        subscribers: subscribersResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubscribers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all subscribers:', error);
      throw error;
    }
  }

  // Get subscribers by status
  static async getByStatus(status) {
    try {
      const result = await query(
        'SELECT * FROM subscribers WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting subscribers by status:', error);
      throw error;
    }
  }

  // Get subscribers by tags
  static async getByTags(tags) {
    try {
      const result = await query(
        'SELECT * FROM subscribers WHERE tags && $1 ORDER BY created_at DESC',
        [tags]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting subscribers by tags:', error);
      throw error;
    }
  }

  // Update message count and last message times
  static async updateMessageActivity(id, direction = 'outbound') {
    try {
      const field = direction === 'inbound' ? 'last_message_received' : 'last_message_sent';
      const result = await query(
        `UPDATE subscribers 
         SET message_count = message_count + 1, 
             ${field} = NOW(), 
             updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating message activity:', error);
      throw error;
    }
  }

  // Add tags to subscriber
  static async addTags(id, newTags) {
    try {
      const result = await query(
        `UPDATE subscribers 
         SET tags = array(SELECT DISTINCT unnest(tags || $1)), 
             updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [newTags, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding tags:', error);
      throw error;
    }
  }

  // Remove tags from subscriber
  static async removeTags(id, tagsToRemove) {
    try {
      const result = await query(
        `UPDATE subscribers 
         SET tags = array(SELECT unnest(tags) EXCEPT SELECT unnest($1)), 
             updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [tagsToRemove, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error removing tags:', error);
      throw error;
    }
  }

  // Get subscriber statistics
  static async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_subscribers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscribers,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_subscribers,
          COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_subscribers,
          COUNT(CASE WHEN status = 'opted_out' THEN 1 END) as opted_out_subscribers,
          AVG(message_count) as avg_message_count,
          COUNT(CASE WHEN last_message_sent > NOW() - INTERVAL '30 days' THEN 1 END) as active_last_30_days
        FROM subscribers
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting subscriber statistics:', error);
      throw error;
    }
  }

  // Get all unique tags
  static async getAllTags() {
    try {
      const result = await query(`
        SELECT DISTINCT unnest(tags) as tag
        FROM subscribers
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
        ORDER BY tag
      `);
      return result.rows.map(row => row.tag);
    } catch (error) {
      console.error('Error getting all tags:', error);
      throw error;
    }
  }

  // Bulk import subscribers
  static async bulkCreate(subscribersData, createdBy) {
    try {
      const values = [];
      const placeholders = [];
      
      subscribersData.forEach((subscriber, index) => {
        const baseIndex = index * 8;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`);
        values.push(
          subscriber.name || null,
          subscriber.phone_number,
          subscriber.email || null,
          subscriber.whatsapp_id || null,
          subscriber.status || 'active',
          subscriber.tags || [],
          subscriber.notes || null,
          createdBy
        );
      });

      const insertQuery = `
        INSERT INTO subscribers 
        (name, phone_number, email, whatsapp_id, status, tags, notes, created_by)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (phone_number) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          whatsapp_id = EXCLUDED.whatsapp_id,
          status = EXCLUDED.status,
          tags = EXCLUDED.tags,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await query(insertQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error bulk creating subscribers:', error);
      throw error;
    }
  }
}

module.exports = Subscriber; 