const GroupMember = require('../models/GroupMember');

class MemberController {
  // Get all members with filters
  static async getAllMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        group_id = null,
        status = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        group_id: group_id ? parseInt(group_id) : null,
        status,
        sortBy,
        sortOrder
      };

      const result = await GroupMember.findAll(options);

      res.json({
        success: true,
        message: 'Members fetched successfully',
        data: result.members.map(member => member.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get pending members
  static async getPendingMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sortBy,
        sortOrder
      };

      const result = await GroupMember.getPendingMembers(options);

      res.json({
        success: true,
        message: 'Pending members fetched successfully',
        data: result.members.map(member => member.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching pending members:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Search members across all groups
  static async searchMembers(req, res) {
    try {
      const {
        search = '',
        page = 1,
        limit = 10,
        sortBy = 'member_name',
        sortOrder = 'ASC'
      } = req.query;

      if (!search.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await GroupMember.searchMembers(search.trim(), options);

      res.json({
        success: true,
        message: 'Members search completed successfully',
        data: result.members,
        pagination: result.pagination,
        searchTerm: search.trim()
      });
    } catch (error) {
      console.error('Error searching members:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get member by ID
  static async getMemberById(req, res) {
    try {
      const { id } = req.params;

      const member = await GroupMember.findById(id);

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member fetched successfully',
        data: member.toJSON()
      });
    } catch (error) {
      console.error('Error fetching member:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update member status (approve, reject, activate)
  static async updateMemberStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validation
      const validStatuses = ['active', 'pending', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (active, pending, rejected)'
        });
      }

      const updatedMember = await GroupMember.updateStatus(id, status);

      if (!updatedMember) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      let statusMessage = '';
      switch (status) {
        case 'active':
          statusMessage = 'Member approved and activated successfully';
          break;
        case 'rejected':
          statusMessage = 'Member rejected successfully';
          break;
        case 'pending':
          statusMessage = 'Member status set to pending';
          break;
      }

      res.json({
        success: true,
        message: statusMessage,
        data: updatedMember.toJSON()
      });
    } catch (error) {
      console.error('Error updating member status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Bulk update member status
  static async bulkUpdateMemberStatus(req, res) {
    try {
      const { member_ids, status } = req.body;

      // Validation
      if (!Array.isArray(member_ids) || member_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Array of member IDs is required'
        });
      }

      const validStatuses = ['active', 'pending', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (active, pending, rejected)'
        });
      }

      const results = [];
      const errors = [];

      for (const memberId of member_ids) {
        try {
          const updatedMember = await GroupMember.updateStatus(memberId, status);
          if (updatedMember) {
            results.push(updatedMember.toJSON());
          } else {
            errors.push({ id: memberId, error: 'Member not found' });
          }
        } catch (error) {
          errors.push({ id: memberId, error: error.message });
        }
      }

      res.json({
        success: true,
        message: `Bulk status update completed`,
        data: {
          updated: results,
          errors: errors,
          summary: {
            total: member_ids.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Error bulk updating member status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Remove member from group
  static async removeMember(req, res) {
    try {
      const { id } = req.params;

      const removedMember = await GroupMember.remove(id);

      if (!removedMember) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member removed successfully',
        data: removedMember.toJSON()
      });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Bulk remove members
  static async bulkRemoveMembers(req, res) {
    try {
      const { member_ids } = req.body;

      // Validation
      if (!Array.isArray(member_ids) || member_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Array of member IDs is required'
        });
      }

      const results = [];
      const errors = [];

      for (const memberId of member_ids) {
        try {
          const removedMember = await GroupMember.remove(memberId);
          if (removedMember) {
            results.push(removedMember.toJSON());
          } else {
            errors.push({ id: memberId, error: 'Member not found' });
          }
        } catch (error) {
          errors.push({ id: memberId, error: error.message });
        }
      }

      res.json({
        success: true,
        message: `Bulk member removal completed`,
        data: {
          removed: results,
          errors: errors,
          summary: {
            total: member_ids.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Error bulk removing members:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get member statistics
  static async getMemberStatistics(req, res) {
    try {
      const { group_id } = req.query;

      const stats = await GroupMember.getStatistics(group_id ? parseInt(group_id) : null);

      res.json({
        success: true,
        message: 'Member statistics fetched successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching member statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get members by group ID
  static async getMembersByGroupId(req, res) {
    try {
      const { group_id } = req.params;
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        group_id: parseInt(group_id),
        status,
        sortBy,
        sortOrder
      };

      const result = await GroupMember.findAll(options);

      res.json({
        success: true,
        message: 'Group members fetched successfully',
        data: result.members.map(member => member.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = MemberController; 