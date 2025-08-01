const express = require('express');
const MessageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// @route   GET /api/messages
// @desc    Get all messages with pagination and filters
// @access  Private
router.get('/', MessageController.getAllMessages);

// @route   GET /api/messages/statistics
// @desc    Get message statistics
// @access  Private
router.get('/statistics', MessageController.getStatistics);

// @route   GET /api/messages/groups
// @desc    Get available groups for messaging
// @access  Private
router.get('/groups', MessageController.getAvailableGroups);

// @route   GET /api/messages/subscriber/:subscriberId
// @desc    Get messages by subscriber
// @access  Private
router.get('/subscriber/:subscriberId', MessageController.getBySubscriber);

// @route   GET /api/messages/:id
// @desc    Get single message by ID
// @access  Private
router.get('/:id', MessageController.getMessage);

// @route   GET /api/messages/:id/attachments/:attachmentId
// @desc    Download message attachment
// @access  Private
router.get('/:id/attachments/:attachmentId', MessageController.downloadAttachment);

// @route   POST /api/messages
// @desc    Create new message (legacy endpoint)
// @access  Private
router.post('/', MessageController.createMessage);

// @route   POST /api/messages/send/individual
// @desc    Send individual message
// @access  Private
router.post('/send/individual', MessageController.sendIndividual);

// @route   POST /api/messages/send/group
// @desc    Send group message
// @access  Private
router.post('/send/group', MessageController.sendGroup);

// @route   POST /api/messages/send/whatsapp-group
// @desc    Send WhatsApp group message
// @access  Private
router.post('/send/whatsapp-group', MessageController.sendWhatsAppGroup);

// @route   POST /api/messages/send/attachment
// @desc    Send message with attachment
// @access  Private
router.post('/send/attachment', MessageController.upload.single('attachment'), MessageController.sendWithAttachment);

// @route   PUT /api/messages/:id
// @desc    Update message
// @access  Private
router.put('/:id', MessageController.updateMessage);

// @route   PUT /api/messages/:id/status
// @desc    Update message status
// @access  Private
router.put('/:id/status', MessageController.updateStatus);

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/:id', MessageController.deleteMessage);

module.exports = router;
