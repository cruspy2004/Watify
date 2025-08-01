const { query } = require('../config/database');

class Message {
  constructor(data = {}) {
    this.id = data.id;
    this.sender_id = data.sender_id;
    this.recipient_type = data.recipient_type;
    this.recipient_id = data.recipient_id;
    this.recipient_phone = data.recipient_phone;
    this.content_type = data.content_type;
    this.message_content = data.message_content;
    this.link_url = data.link_url;
    this.status = data.status || 'pending';
    this.scheduled_at = data.scheduled_at;
    this.sent_at = data.sent_at;
    this.delivered_at = data.delivered_at;
    this.read_at = data.read_at;
    this.failed_reason = data.failed_reason;
    this.metadata = data.metadata;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Joined fields
    this.sender_name = data.sender_name;
    this.recipient_name = data.recipient_name;
    this.group_name = data.group_name;
    this.attachments = data.attachments || [];
  }

  // Create a new message
  static async create(messageData) {
    try {
      const {
        sender_id,
        recipient_type,
        recipient_id,
        recipient_phone,
        content_type,
        message_content,
        link_url,
        scheduled_at,
        metadata
      } = messageData;

      const result = await query(
        `INSERT INTO messages 
         (sender_id, recipient_type, recipient_id, recipient_phone, content_type, 
          message_content, link_url, scheduled_at, metadata, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING *`,
        [sender_id, recipient_type, recipient_id, recipient_phone, content_type, 
         message_content, link_url, scheduled_at, metadata]
      );
      
      return new Message(result.rows[0]);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Send individual message
  static async sendIndividualMessage(messageData) {
    try {
      const message = await this.create({
        ...messageData,
        recipient_type: 'individual',
        status: 'sent',
        sent_at: new Date()
      });

      // Here you would integrate with actual WhatsApp/SMS service
      // For now, we'll just update the status
      await this.updateStatus(message.id, 'sent');
      
      return message;
    } catch (error) {
      console.error('Error sending individual message:', error);
      throw error;
    }
  }

  // Send group message
  static async sendGroupMessage(messageData) {
    try {
      const message = await this.create({
        ...messageData,
        recipient_type: 'group'
      });

      // Get all group members
      const members = await query(
        'SELECT member_number FROM group_members WHERE group_id = $1 AND status = $2',
        [messageData.recipient_id, 'active']
      );

      // Create recipient records for each member
      for (const member of members.rows) {
        await query(
          `INSERT INTO message_recipients 
           (message_id, recipient_type, recipient_phone, status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [message.id, 'phone', member.member_number, 'pending']
        );
      }

      // Here you would integrate with actual messaging service
      await this.updateStatus(message.id, 'sent');
      
      return message;
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  }

  // Send WhatsApp group message
  static async sendWhatsAppGroupMessage(messageData) {
    try {
      const message = await this.create({
        ...messageData,
        recipient_type: 'whatsapp_group'
      });

      // Here you would integrate with WhatsApp Business API
      // For now, we'll just update the status
      await this.updateStatus(message.id, 'sent');
      
      return message;
    } catch (error) {
      console.error('Error sending WhatsApp group message:', error);
      throw error;
    }
  }

  // Get all messages with pagination and filters
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [limit, offset];
      let paramCount = 3;

      // Add filters
      if (filters.sender_id) {
        whereClause += ` AND m.sender_id = $${paramCount}`;
        queryParams.push(filters.sender_id);
        paramCount++;
      }

      if (filters.recipient_type) {
        whereClause += ` AND m.recipient_type = $${paramCount}`;
        queryParams.push(filters.recipient_type);
        paramCount++;
      }

      if (filters.status) {
        whereClause += ` AND m.status = $${paramCount}`;
        queryParams.push(filters.status);
        paramCount++;
      }

      if (filters.content_type) {
        whereClause += ` AND m.content_type = $${paramCount}`;
        queryParams.push(filters.content_type);
        paramCount++;
      }

      if (filters.date_from) {
        whereClause += ` AND m.created_at >= $${paramCount}`;
        queryParams.push(filters.date_from);
        paramCount++;
      }

      if (filters.date_to) {
        whereClause += ` AND m.created_at <= $${paramCount}`;
        queryParams.push(filters.date_to);
        paramCount++;
      }

      if (filters.search) {
        whereClause += ` AND (m.message_content ILIKE $${paramCount} OR m.recipient_phone ILIKE $${paramCount})`;
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      const countQuery = `
        SELECT COUNT(*) 
        FROM messages m
        ${whereClause}
      `;

      const selectQuery = `
        SELECT 
          m.*,
          u.name as sender_name,
          wg.group_name,
          COUNT(ma.id) as attachment_count
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        LEFT JOIN whatsapp_groups_extended wg ON m.recipient_id = wg.id AND m.recipient_type = 'whatsapp_group'
        LEFT JOIN message_attachments ma ON m.id = ma.message_id
        ${whereClause} 
        GROUP BY m.id, u.name, wg.group_name
        ORDER BY m.created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const [countResult, messagesResult] = await Promise.all([
        query(countQuery, queryParams.slice(2)),
        query(selectQuery, queryParams)
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        messages: messagesResult.rows.map(row => new Message(row)),
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all messages:', error);
      throw error;
    }
  }

  // Find message by ID
  static async findById(id) {
    try {
      const result = await query(
        `SELECT 
          m.*,
          u.name as sender_name,
          wg.group_name
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         LEFT JOIN whatsapp_groups_extended wg ON m.recipient_id = wg.id AND m.recipient_type = 'whatsapp_group'
         WHERE m.id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

      const message = new Message(result.rows[0]);

      // Get attachments
      const attachmentsResult = await query(
        'SELECT * FROM message_attachments WHERE message_id = $1 ORDER BY is_primary DESC, created_at ASC',
        [id]
      );
      message.attachments = attachmentsResult.rows;

      return message;
    } catch (error) {
      console.error('Error finding message by ID:', error);
      throw error;
    }
  }

  // Update message status
  static async updateStatus(id, status, additionalData = {}) {
    try {
      const fields = ['status = $2', 'updated_at = NOW()'];
      const values = [id, status];
      let paramCount = 3;

      if (status === 'sent' && !additionalData.sent_at) {
        fields.push(`sent_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }

      if (status === 'delivered' && !additionalData.delivered_at) {
        fields.push(`delivered_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }

      if (status === 'read' && !additionalData.read_at) {
        fields.push(`read_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }

      if (status === 'failed' && additionalData.failed_reason) {
        fields.push(`failed_reason = $${paramCount}`);
        values.push(additionalData.failed_reason);
        paramCount++;
      }

      const updateQuery = `
        UPDATE messages 
        SET ${fields.join(', ')} 
        WHERE id = $1 
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      return result.rows[0] ? new Message(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // Delete message
  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM messages WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] ? new Message(result.rows[0]) : null;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Get message statistics
  static async getStatistics(userId = null) {
    try {
      let whereClause = '';
      const queryParams = [];

      if (userId) {
        whereClause = 'WHERE sender_id = $1';
        queryParams.push(userId);
      }

      const result = await query(
        `SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_messages,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read_messages,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
          COUNT(CASE WHEN recipient_type = 'individual' THEN 1 END) as individual_messages,
          COUNT(CASE WHEN recipient_type = 'group' THEN 1 END) as group_messages,
          COUNT(CASE WHEN recipient_type = 'whatsapp_group' THEN 1 END) as whatsapp_group_messages,
          COUNT(CASE WHEN content_type = 'text' THEN 1 END) as text_messages,
          COUNT(CASE WHEN content_type = 'media_attachment' THEN 1 END) as media_messages,
          COUNT(CASE WHEN content_type = 'link_preview' THEN 1 END) as link_messages
         FROM messages ${whereClause}`,
        queryParams
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error getting message statistics:', error);
      throw error;
    }
  }

  // Add attachment to message
  static async addAttachment(messageId, attachmentData) {
    try {
      const result = await query(
        `INSERT INTO message_attachments 
         (message_id, file_name, file_path, file_type, file_size, mime_type, 
          thumbnail_path, duration, is_primary, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
         RETURNING *`,
        [
          messageId, 
          attachmentData.file_name, 
          attachmentData.file_path, 
          attachmentData.file_type, 
          attachmentData.file_size, 
          attachmentData.mime_type,
          attachmentData.thumbnail_path, 
          attachmentData.duration, 
          attachmentData.is_primary || false
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      sender_id: this.sender_id,
      sender_name: this.sender_name,
      recipient_type: this.recipient_type,
      recipient_id: this.recipient_id,
      recipient_phone: this.recipient_phone,
      recipient_name: this.recipient_name,
      group_name: this.group_name,
      content_type: this.content_type,
      message_content: this.message_content,
      link_url: this.link_url,
      status: this.status,
      scheduled_at: this.scheduled_at,
      sent_at: this.sent_at,
      delivered_at: this.delivered_at,
      read_at: this.read_at,
      failed_reason: this.failed_reason,
      metadata: this.metadata,
      attachments: this.attachments,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Message; 