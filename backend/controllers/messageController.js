const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'messages');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, documents, audio
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

class MessageController {
  // Get all messages
  static async getAllMessages(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        subscriber_id: req.query.subscriber_id,
        group_id: req.query.group_id,
        direction: req.query.direction,
        status: req.query.status,
        message_type: req.query.message_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const result = await Message.getAll(page, limit, filters);

      res.json({
        success: true,
        message: 'Messages retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get all messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages',
        error: 'Internal server error'
      });
    }
  }

  // Get single message
  static async getMessage(req, res) {
    try {
      const { id } = req.params;
      const message = await Message.findById(id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
          error: 'Message with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Message retrieved successfully',
        data: { message }
      });
    } catch (error) {
      console.error('Get message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve message',
        error: 'Internal server error'
      });
    }
  }

  // Create new message
  static async createMessage(req, res) {
    try {
      const { subscriber_id, group_id, message_type, content, status, scheduled_at } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Content is required'
        });
      }

      // Map the request to the correct database schema
      let recipient_type = 'individual';
      let recipient_id = null;
      let recipient_phone = null;

      if (message_type === 'group') {
        recipient_type = 'group';
        recipient_id = group_id;
      } else if (message_type === 'whatsapp_group') {
        recipient_type = 'whatsapp_group';  
        recipient_id = group_id;
      } else if (message_type === 'individual') {
        recipient_type = 'individual';
        recipient_id = subscriber_id;
      }

      const messageData = {
        sender_id: req.user ? req.user.id : 1, // Default to user 1 if no auth
        recipient_type,
        recipient_id,
        recipient_phone,
        content_type: 'text', // Default to text
        message_content: content,
        scheduled_at
      };

      const message = await Message.create(messageData);

      res.status(201).json({
        success: true,
        message: 'Message created successfully',
        data: { message }
      });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create message',
        error: 'Internal server error'
      });
    }
  }

  // Update message
  static async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingMessage = await Message.findById(id);
      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
          error: 'Message with this ID does not exist'
        });
      }

      const updatedMessage = await Message.update(id, updates);

      res.json({
        success: true,
        message: 'Message updated successfully',
        data: { message: updatedMessage }
      });
    } catch (error) {
      console.error('Update message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update message',
        error: 'Internal server error'
      });
    }
  }

  // Delete message
  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;

      const deletedMessage = await Message.delete(id);

      if (!deletedMessage) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
          error: 'Message with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Message deleted successfully',
        data: { message: deletedMessage }
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: 'Internal server error'
      });
    }
  }

  // Update message status
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, error_message } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Status is required'
        });
      }

      const updatedMessage = await Message.updateStatus(id, status, error_message);

      if (!updatedMessage) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
          error: 'Message with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Message status updated successfully',
        data: { message: updatedMessage }
      });
    } catch (error) {
      console.error('Update message status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update message status',
        error: 'Internal server error'
      });
    }
  }

  // Get messages by subscriber
  static async getBySubscriber(req, res) {
    try {
      const { subscriberId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await Message.getBySubscriber(subscriberId, page, limit);

      res.json({
        success: true,
        message: 'Subscriber messages retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get messages by subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscriber messages',
        error: 'Internal server error'
      });
    }
  }

  // Get message statistics
  static async getStatistics(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const statistics = await Message.getStatistics(filters);

      res.json({
        success: true,
        message: 'Message statistics retrieved successfully',
        data: { statistics }
      });
    } catch (error) {
      console.error('Get message statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve message statistics',
        error: 'Internal server error'
      });
    }
  }

  // Send individual message
  static async sendIndividual(req, res) {
    try {
      const { recipient_phone, content_type, message_content, link_url } = req.body;
      const sender_id = req.user.id;

      // Validate required fields
      if (!recipient_phone || !content_type || !message_content) {
        return res.status(400).json({
          success: false,
          message: 'Recipient phone, content type, and message content are required'
        });
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(recipient_phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Validate content type
      const validContentTypes = ['text', 'link_preview', 'media_attachment'];
      if (!validContentTypes.includes(content_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
      }

      // Validate link URL for link preview
      if (content_type === 'link_preview' && !link_url) {
        return res.status(400).json({
          success: false,
          message: 'Link URL is required for link preview messages'
        });
      }

      const messageData = {
        sender_id,
        recipient_phone: recipient_phone.replace(/\s+/g, ''), // Remove spaces
        content_type,
        message_content,
        link_url
      };

      const message = await Message.sendIndividualMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'Individual message sent successfully',
        data: message.toJSON()
      });
    } catch (error) {
      console.error('Error sending individual message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send individual message',
        error: error.message
      });
    }
  }

  // Send group message  
  static async sendGroup(req, res) {
    try {
      const { recipient_id, content_type, message_content, link_url } = req.body;
      const sender_id = req.user.id;

      // Validate required fields
      if (!recipient_id || !content_type || !message_content) {
        return res.status(400).json({
          success: false,
          message: 'Recipient group ID, content type, and message content are required'
        });
      }

      const messageData = {
        sender_id,
        recipient_id: parseInt(recipient_id),
        content_type,
        message_content,
        link_url
      };

      const message = await Message.sendGroupMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'Group message sent successfully',
        data: message.toJSON()
      });
    } catch (error) {
      console.error('Error sending group message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send group message',
        error: error.message
      });
    }
  }

  // Send WhatsApp group message
  static async sendWhatsAppGroup(req, res) {
    try {
      const { recipient_id, content_type, message_content, link_url } = req.body;
      const sender_id = req.user.id;

      // Validate required fields
      if (!recipient_id || !content_type || !message_content) {
        return res.status(400).json({
          success: false,
          message: 'WhatsApp group ID, content type, and message content are required'
        });
      }

      const messageData = {
        sender_id,
        recipient_id: parseInt(recipient_id),
        content_type,
        message_content,
        link_url
      };

      const message = await Message.sendWhatsAppGroupMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'WhatsApp group message sent successfully',
        data: message.toJSON()
      });
    } catch (error) {
      console.error('Error sending WhatsApp group message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send WhatsApp group message',
        error: error.message
      });
    }
  }

  // Send message with attachment
  static async sendWithAttachment(req, res) {
    try {
      const { recipient_type, recipient_id, recipient_phone, message_content } = req.body;
      const sender_id = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Create message
      const messageData = {
        sender_id,
        recipient_type,
        recipient_id: recipient_id ? parseInt(recipient_id) : null,
        recipient_phone,
        content_type: 'media_attachment',
        message_content: message_content || 'Media attachment'
      };

      let message;
      if (recipient_type === 'individual') {
        message = await Message.sendIndividualMessage(messageData);
      } else if (recipient_type === 'group') {
        message = await Message.sendGroupMessage(messageData);
      } else if (recipient_type === 'whatsapp_group') {
        message = await Message.sendWhatsAppGroupMessage(messageData);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient type'
        });
      }

      // Add attachment
      const attachmentData = {
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        is_primary: true
      };

      await Message.addAttachment(message.id, attachmentData);

      // Get updated message with attachments
      const updatedMessage = await Message.findById(message.id);

      res.status(201).json({
        success: true,
        message: 'Message with attachment sent successfully',
        data: updatedMessage.toJSON()
      });
    } catch (error) {
      console.error('Error sending message with attachment:', error);
      
      // Clean up uploaded file if message creation failed
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send message with attachment',
        error: error.message
      });
    }
  }

  // Get all messages with pagination and filters
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Extract filters from query parameters
      const filters = {};
      
      if (req.query.sender_id) {
        filters.sender_id = parseInt(req.query.sender_id);
      }
      
      if (req.query.recipient_type) {
        filters.recipient_type = req.query.recipient_type;
      }
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      if (req.query.content_type) {
        filters.content_type = req.query.content_type;
      }
      
      if (req.query.date_from) {
        filters.date_from = req.query.date_from;
      }
      
      if (req.query.date_to) {
        filters.date_to = req.query.date_to;
      }
      
      if (req.query.search) {
        filters.search = req.query.search;
      }

      const result = await Message.getAll(page, limit, filters);

      res.json({
        success: true,
        data: result.messages.map(message => message.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages',
        error: error.message
      });
    }
  }

  // Get message by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid message ID is required'
        });
      }

      const message = await Message.findById(parseInt(id));

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      res.json({
        success: true,
        data: message.toJSON()
      });
    } catch (error) {
      console.error('Error getting message by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve message',
        error: error.message
      });
    }
  }

  // Get available groups for messaging
  static async getAvailableGroups(req, res) {
    try {
      const { query } = require('../config/database');
      
      // Get regular groups and WhatsApp groups
      const [regularGroups, whatsappGroups] = await Promise.all([
        query('SELECT id, group_name as name, member_count FROM whatsapp_groups_extended WHERE is_active = true ORDER BY group_name'),
        query('SELECT id, group_name as name, member_count FROM whatsapp_groups_extended WHERE is_active = true ORDER BY group_name')
      ]);

      res.json({
        success: true,
        data: {
          groups: regularGroups.rows,
          whatsapp_groups: whatsappGroups.rows
        }
      });
    } catch (error) {
      console.error('Error getting available groups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available groups',
        error: error.message
      });
    }
  }

  // Download attachment
  static async downloadAttachment(req, res) {
    try {
      const { id, attachmentId } = req.params;

      if (!id || !attachmentId || isNaN(parseInt(id)) || isNaN(parseInt(attachmentId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid message ID and attachment ID are required'
        });
      }

      const { query } = require('../config/database');
      const result = await query(
        `SELECT ma.* FROM message_attachments ma 
         JOIN messages m ON ma.message_id = m.id 
         WHERE m.id = $1 AND ma.id = $2`,
        [parseInt(id), parseInt(attachmentId)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      const attachment = result.rows[0];
      
      try {
        await fs.access(attachment.file_path);
        res.download(attachment.file_path, attachment.file_name);
      } catch (fileError) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download attachment',
        error: error.message
      });
    }
  }
}

// Export the upload middleware along with the controller
MessageController.upload = upload;

module.exports = MessageController; 