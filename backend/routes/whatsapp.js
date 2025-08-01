const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { authenticateToken } = require('../middleware/auth');

// Add a public debug endpoint for testing WhatsApp status
router.get('/debug/status', async (req, res) => {
  try {
    const state = whatsappService.getState();
    const health = whatsappService.getServiceStats();
    res.json({ 
      status: 'success',
      data: {
        state,
        health,
        debug: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting WhatsApp debug status:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to get WhatsApp debug status',
      error: error.message
    });
  }
});

// Add a public debug endpoint for QR code
router.get('/debug/qr', async (req, res) => {
  try {
    const qrData = await whatsappService.getQRCode();
    if (qrData) {
      res.json({
        status: 'success',
        data: { qr: qrData, debug: true }
      });
    } else {
      res.json({
        status: 'info',
        message: 'QR code not available',
        data: { debug: true }
      });
    }
  } catch (error) {
    console.error('Error getting debug QR code:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get debug QR code',
      error: error.message
    });
  }
});

// Add a public debug restart endpoint
router.post('/debug/restart', async (req, res) => {
  try {
    console.log('🔄 Debug restart requested...');
    await whatsappService.restart();
    res.json({
      status: 'success',
      message: 'WhatsApp client restart initiated',
      data: { debug: true }
    });
  } catch (error) {
    console.error('Error in debug restart:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to restart WhatsApp client',
      error: error.message
    });
  }
});

// Get WhatsApp connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const state = whatsappService.getState();
    res.json({ 
      status: 'success',
      data: state
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to get WhatsApp status',
      error: error.message
    });
  }
});

// Get QR code for authentication
router.get('/qr', authenticateToken, async (req, res) => {
  try {
    const qrData = await whatsappService.getQRCode();
    if (qrData) {
      res.json({
        status: 'success',
        data: { qr: qrData }
      });
    } else {
      res.json({
        status: 'info',
        message: 'WhatsApp is already authenticated or QR code not available'
      });
    }
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get QR code',
      error: error.message
    });
  }
});

// Send message to a single number
router.post('/send-message', authenticateToken, async (req, res) => {
  try {
    const { number, message } = req.body;
    
    if (!number || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Number and message are required'
      });
    }

    // Check if WhatsApp is ready
    const state = whatsappService.getState();
    if (!state.isReady) {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp client is not ready. Please authenticate first.',
        data: { state: state.state, hasQR: state.hasQR }
      });
    }

    const result = await whatsappService.sendMessage(number, message);
    res.json({
      status: 'success',
      message: 'Message sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Send bulk messages
router.post('/send-bulk', authenticateToken, async (req, res) => {
  try {
    const { numbers, message, options = {} } = req.body;
    
    if (!numbers || !Array.isArray(numbers) || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Numbers array and message are required'
      });
    }

    if (numbers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one number is required'
      });
    }

    // Check if WhatsApp is ready
    const state = whatsappService.getState();
    if (!state.isReady) {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp client is not ready. Please authenticate first.',
        data: { state: state.state, hasQR: state.hasQR }
      });
    }

    // Set default options for bulk messaging
    const bulkOptions = {
      delay: options.delay || 2000, // 2 seconds between messages
      skipInvalid: options.skipInvalid !== false, // Skip invalid numbers by default
      ...options
    };

    const results = await whatsappService.sendBulkMessages(numbers, message, bulkOptions);
    
    res.json({
      status: 'success',
      message: `Bulk messages processed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error sending bulk messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send bulk messages',
      error: error.message
    });
  }
});

// Send message to group members
router.post('/send-to-group', authenticateToken, async (req, res) => {
  try {
    const { groupId, message, groupType = 'whatsapp' } = req.body;
    
    if (!groupId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Group ID and message are required'
      });
    }

    // Check if WhatsApp is ready
    const state = whatsappService.getState();
    if (!state.isReady) {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp client is not ready. Please authenticate first.',
        data: { state: state.state, hasQR: state.hasQR }
      });
    }

    // Get group members
    const GroupMember = require('../models/GroupMember');
    const members = await GroupMember.findByGroupId(groupId);
    
    if (!members || members.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No members found in the selected group'
      });
    }

    // Filter active members with phone numbers
    const activeMembers = members.filter(member => 
      member.status === 'active' && 
      member.phone_number && 
      member.phone_number.trim() !== ''
    );

    if (activeMembers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No active members with valid phone numbers found in the group'
      });
    }

    const numbers = activeMembers.map(member => member.phone_number);
    
    // Send bulk messages with group-specific options
    const results = await whatsappService.sendBulkMessages(numbers, message, {
      delay: 2000, // 2 seconds between messages for groups
      skipInvalid: true
    });
    
    res.json({
      status: 'success',
      message: `Group message sent: ${results.successful} successful, ${results.failed} failed`,
      data: {
        groupId,
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        ...results
      }
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send group message',
      error: error.message
    });
  }
});

// Check if number is registered on WhatsApp
router.post('/check-number', authenticateToken, async (req, res) => {
  try {
    const { number } = req.body;
    
    if (!number) {
      return res.status(400).json({
        status: 'error',
        message: 'Number is required'
      });
    }

    // Check if WhatsApp is ready
    const state = whatsappService.getState();
    if (!state.isReady) {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp client is not ready. Please authenticate first.',
        data: { state: state.state, hasQR: state.hasQR }
      });
    }

    const result = await whatsappService.isRegisteredUser(number);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error checking number:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check number',
      error: error.message
    });
  }
});

// Get WhatsApp chats
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    // Check if WhatsApp is ready
    const state = whatsappService.getState();
    if (!state.isReady) {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp client is not ready. Please authenticate first.',
        data: { state: state.state, hasQR: state.hasQR }
      });
    }

    const chats = await whatsappService.getChats();
    res.json({
      status: 'success',
      message: 'Chats fetched successfully',
      data: chats
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chats',
      error: error.message
    });
  }
});

// Get WhatsApp groups only (filtered from chats)
router.get('/groups', authenticateToken, async (req, res) => {
  try {
    // Check if WhatsApp is ready
    const state = whatsappService.getState();
    if (!state.isReady) {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp client is not ready. Please authenticate first.',
        data: { state: state.state, hasQR: state.hasQR }
      });
    }

    const chats = await whatsappService.getChats();
    // Filter only groups
    const groups = chats.filter(chat => chat.isGroup);
    const individuals = chats.filter(chat => !chat.isGroup);
    
    // Get client info
    const clientInfo = state.clientInfo || {};
    
    // Prepare statistics
    const statistics = {
      totalGroups: groups.length,
      totalIndividualChats: individuals.length,
      totalChats: chats.length,
      unreadGroups: groups.filter(g => g.unreadCount > 0).length,
      activeGroups: groups.filter(g => g.timestamp > 0).length
    };
    
    // Prepare WhatsApp info
    const whatsappInfo = {
      isReady: state.isReady,
      isAuthenticated: state.isAuthenticated,
      user: {
        name: clientInfo.pushname || 'Unknown',
        phone: clientInfo.wid?.user || 'Unknown',
        platform: clientInfo.platform || 'Unknown'
      },
      connectionStatus: state.state || 'unknown'
    };
    
    res.json({
      status: 'success',
      message: 'WhatsApp groups fetched successfully',
      data: {
        groups: groups,
        statistics: statistics,
        whatsappInfo: whatsappInfo
      }
    });
  } catch (error) {
    console.error('Error getting WhatsApp groups:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get WhatsApp groups',
      error: error.message
    });
  }
});

// Restart WhatsApp client
router.post('/restart', authenticateToken, async (req, res) => {
  try {
    await whatsappService.restart();
    res.json({
      status: 'success',
      message: 'WhatsApp client restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting WhatsApp client:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to restart WhatsApp client',
      error: error.message
    });
  }
});

// Get service health check
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const healthCheck = await whatsappService.performHealthCheck();
    res.json({
      status: 'success',
      data: healthCheck
    });
  } catch (error) {
    console.error('Error getting health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get health check',
      error: error.message
    });
  }
});

module.exports = router; 