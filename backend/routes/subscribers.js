const express = require('express');
const SubscriberController = require('../controllers/subscriberController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// @route   GET /api/subscribers
// @desc    Get all subscribers with pagination and filters
// @access  Private
router.get('/', SubscriberController.getAllSubscribers);

// @route   GET /api/subscribers/:id
// @desc    Get single subscriber by ID
// @access  Private
router.get('/:id', SubscriberController.getSubscriber);

// @route   POST /api/subscribers
// @desc    Create new subscriber
// @access  Private
router.post('/', SubscriberController.createSubscriber);

// @route   PUT /api/subscribers/:id
// @desc    Update subscriber
// @access  Private
router.put('/:id', SubscriberController.updateSubscriber);

// @route   PUT /api/subscribers/:id/status
// @desc    Update subscriber status
// @access  Private
router.put('/:id/status', SubscriberController.updateStatus);

// @route   DELETE /api/subscribers/:id
// @desc    Delete subscriber
// @access  Private
router.delete('/:id', SubscriberController.deleteSubscriber);

module.exports = router; 