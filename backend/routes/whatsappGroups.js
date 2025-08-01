const express = require('express');
const router = express.Router();
const WhatsAppGroupController = require('../controllers/whatsappGroupController');
const MemberController = require('../controllers/memberController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===== WhatsApp Groups Routes (Non-parameterized first) =====

// Get all groups with pagination and search
router.get('/', WhatsAppGroupController.getAllGroups);

// Get group statistics
router.get('/statistics', WhatsAppGroupController.getGroupStatistics);

// Get group options for dropdowns
router.get('/options', WhatsAppGroupController.getGroupOptions);

// Download sample Excel template
router.get('/download-sample', WhatsAppGroupController.downloadSampleExcel);

// ===== Member Management Routes (Specific routes before parameterized) =====

// Add member manually
router.post('/members/add', WhatsAppGroupController.addMember);

// Import members from Excel
router.post('/members/import', 
  WhatsAppGroupController.uploadExcel,
  WhatsAppGroupController.importMembersFromExcel
);

// Get all members with filters
router.get('/members/all', MemberController.getAllMembers);

// Get pending members
router.get('/members/pending', MemberController.getPendingMembers);

// Search members across all groups
router.get('/members/search', MemberController.searchMembers);

// Get member statistics
router.get('/members/statistics', MemberController.getMemberStatistics);

// Bulk update member status
router.patch('/members/bulk/status', MemberController.bulkUpdateMemberStatus);

// Bulk remove members
router.delete('/members/bulk/remove', MemberController.bulkRemoveMembers);

// ===== Parameterized Member Routes =====

// Get member by ID
router.get('/members/:id', MemberController.getMemberById);

// Update member status
router.patch('/members/:id/status', MemberController.updateMemberStatus);

// Remove member
router.delete('/members/:id', MemberController.removeMember);

// ===== Group-specific Routes =====

// Get members by group ID
router.get('/:group_id/members', MemberController.getMembersByGroupId);

// ===== Parameterized Group Routes (MUST come last) =====

// Create new group
router.post('/', WhatsAppGroupController.createGroup);

// Update group
router.put('/:id', WhatsAppGroupController.updateGroup);

// Delete group (soft delete)
router.delete('/:id', WhatsAppGroupController.deleteGroup);

// Get group by ID (MUST come after all specific routes)
router.get('/:id', WhatsAppGroupController.getGroupById);

module.exports = router; 