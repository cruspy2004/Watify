const express = require('express');
const CampaignController = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// @route   GET /api/campaigns
// @desc    Get all campaigns with pagination and filters
// @access  Private
router.get('/', CampaignController.getAllCampaigns);

// @route   GET /api/campaigns/statistics
// @desc    Get campaign statistics
// @access  Private
router.get('/statistics', CampaignController.getStatistics);

// @route   GET /api/campaigns/:id
// @desc    Get single campaign by ID
// @access  Private
router.get('/:id', CampaignController.getCampaign);

// @route   POST /api/campaigns
// @desc    Create new campaign
// @access  Private
router.post('/', CampaignController.createCampaign);

// @route   PUT /api/campaigns/:id
// @desc    Update campaign
// @access  Private
router.put('/:id', CampaignController.updateCampaign);

// @route   DELETE /api/campaigns/:id
// @desc    Delete campaign
// @access  Private
router.delete('/:id', CampaignController.deleteCampaign);

module.exports = router; 