const WhatsAppGroup = require('../models/WhatsAppGroup');

class GroupController {
  // @desc    Get all groups
  // @route   GET /api/groups
  // @access  Private
  static async getAllGroups(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        search: req.query.search
      };

      const result = await WhatsAppGroup.getAll(page, limit, filters);

      res.json({
        success: true,
        message: 'Groups retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get all groups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve groups',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Get single group
  // @route   GET /api/groups/:id
  // @access  Private
  static async getGroup(req, res) {
    try {
      const { id } = req.params;
      const group = await WhatsAppGroup.findById(id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
          error: 'Group with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Group retrieved successfully',
        data: { group }
      });
    } catch (error) {
      console.error('Get group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve group',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Create new group
  // @route   POST /api/groups
  // @access  Private
  static async createGroup(req, res) {
    try {
      const { name, description, group_id, invite_link, admin_user_id, member_count, max_members } = req.body;

      // Validation
      if (!name || !group_id) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Name and group_id are required'
        });
      }

      // Check if group with same group_id already exists
      const existingGroup = await WhatsAppGroup.findByGroupId(group_id);
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'Group creation failed',
          error: 'Group with this WhatsApp ID already exists'
        });
      }

      const groupData = {
        name,
        description,
        group_id,
        invite_link,
        admin_user_id,
        member_count,
        max_members,
        created_by: req.user.id
      };

      const group = await WhatsAppGroup.create(groupData);
         console.log(group)
      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: { group }
      });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create group',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Update group
  // @route   PUT /api/groups/:id
  // @access  Private
  static async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if group exists
      const existingGroup = await WhatsAppGroup.findById(id);
      if (!existingGroup) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
          error: 'Group with this ID does not exist'
        });
      }

      // Check if updating group_id and it already exists
      if (updates.group_id && updates.group_id !== existingGroup.group_id) {
        const groupWithSameId = await WhatsAppGroup.findByGroupId(updates.group_id);
        if (groupWithSameId) {
          return res.status(400).json({
            success: false,
            message: 'Update failed',
            error: 'Group with this WhatsApp ID already exists'
          });
        }
      }

      const updatedGroup = await WhatsAppGroup.update(id, updates);

      res.json({
        success: true,
        message: 'Group updated successfully',
        data: { group: updatedGroup }
      });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update group',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Delete group
  // @route   DELETE /api/groups/:id
  // @access  Private
  static async deleteGroup(req, res) {
    try {
      const { id } = req.params;

      const deletedGroup = await WhatsAppGroup.delete(id);

      if (!deletedGroup) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
          error: 'Group with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Group deleted successfully',
        data: { group: deletedGroup }
      });
    } catch (error) {
      console.error('Delete group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete group',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Deactivate group (soft delete)
  // @route   PUT /api/groups/:id/deactivate
  // @access  Private
  static async deactivateGroup(req, res) {
    try {
      const { id } = req.params;

      const deactivatedGroup = await WhatsAppGroup.deactivate(id);

      if (!deactivatedGroup) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
          error: 'Group with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Group deactivated successfully',
        data: { group: deactivatedGroup }
      });
    } catch (error) {
      console.error('Deactivate group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate group',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Update member count
  // @route   PUT /api/groups/:id/member-count
  // @access  Private
  static async updateMemberCount(req, res) {
    try {
      const { id } = req.params;
      const { member_count } = req.body;

      if (member_count === undefined || member_count < 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Valid member_count is required'
        });
      }

      const updatedGroup = await WhatsAppGroup.updateMemberCount(id, member_count);

      if (!updatedGroup) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
          error: 'Group with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Member count updated successfully',
        data: { group: updatedGroup }
      });
    } catch (error) {
      console.error('Update member count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member count',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Get groups by user
  // @route   GET /api/groups/my-groups
  // @access  Private
  static async getMyGroups(req, res) {
    try {
      const groups = await WhatsAppGroup.getByUser(req.user.id);

      res.json({
        success: true,
        message: 'User groups retrieved successfully',
        data: { groups }
      });
    } catch (error) {
      console.error('Get my groups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user groups',
        error: 'Internal server error'
      });
    }
  }

  // @desc    Get group statistics
  // @route   GET /api/groups/statistics
  // @access  Private
  static async getStatistics(req, res) {
    try {
      const statistics = await WhatsAppGroup.getStatistics();

      res.json({
        success: true,
        message: 'Group statistics retrieved successfully',
        data: { statistics }
      });
    } catch (error) {
      console.error('Get group statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve group statistics',
        error: 'Internal server error'
      });
    }
  }
}

module.exports = GroupController; 