const express = require('express');
const GroupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// @route   GET /api/groups
// @desc    Get all groups with pagination and filters
// @access  Private
router.get('/', GroupController.getAllGroups);

// @route   GET /api/groups/statistics
// @desc    Get group statistics
// @access  Private
router.get('/statistics', GroupController.getStatistics);

// @route   GET /api/groups/my-groups
// @desc    Get groups for current user
// @access  Private
router.get('/my-groups', GroupController.getMyGroups);

// @route   GET /api/groups/:id
// @desc    Get single group by ID
// @access  Private
router.get('/:id', GroupController.getGroup);

// @route   POST /api/groups
// @desc    Create new group
// @access  Private
router.post('/', GroupController.createGroup);

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private
router.put('/:id', GroupController.updateGroup);

// @route   PUT /api/groups/:id/deactivate
// @desc    Deactivate group (soft delete)
// @access  Private
router.put('/:id/deactivate', GroupController.deactivateGroup);

// @route   PUT /api/groups/:id/member-count
// @desc    Update member count
// @access  Private
router.put('/:id/member-count', GroupController.updateMemberCount);

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private
router.delete('/:id', GroupController.deleteGroup);

module.exports = router; 