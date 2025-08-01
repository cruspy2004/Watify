const Campaign = require('../models/Campaign');

class CampaignController {
  // Get all campaigns
  static async getAllCampaigns(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        status: req.query.status,
        search: req.query.search
      };

      const result = await Campaign.getAll(page, limit, filters);

      res.json({
        success: true,
        message: 'Campaigns retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get all campaigns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve campaigns',
        error: 'Internal server error'
      });
    }
  }

  // Get single campaign
  static async getCampaign(req, res) {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
          error: 'Campaign with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Campaign retrieved successfully',
        data: { campaign }
      });
    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve campaign',
        error: 'Internal server error'
      });
    }
  }

  // Create new campaign
  static async createCampaign(req, res) {
    try {
      const { name, description, message_template, target_type, status, scheduled_at } = req.body;

      if (!name || !message_template) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Name and message template are required'
        });
      }

      const campaignData = {
        name,
        description,
        message_template,
        target_type,
        status,
        scheduled_at,
        created_by: req.user.id
      };

      const campaign = await Campaign.create(campaignData);

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: { campaign }
      });
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: 'Internal server error'
      });
    }
  }

  // Update campaign
  static async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingCampaign = await Campaign.findById(id);
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
          error: 'Campaign with this ID does not exist'
        });
      }

      const updatedCampaign = await Campaign.update(id, updates);

      res.json({
        success: true,
        message: 'Campaign updated successfully',
        data: { campaign: updatedCampaign }
      });
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign',
        error: 'Internal server error'
      });
    }
  }

  // Delete campaign
  static async deleteCampaign(req, res) {
    try {
      const { id } = req.params;

      const deletedCampaign = await Campaign.delete(id);

      if (!deletedCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
          error: 'Campaign with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Campaign deleted successfully',
        data: { campaign: deletedCampaign }
      });
    } catch (error) {
      console.error('Delete campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete campaign',
        error: 'Internal server error'
      });
    }
  }

  // Get campaign statistics
  static async getStatistics(req, res) {
    try {
      const statistics = await Campaign.getStatistics();

      res.json({
        success: true,
        message: 'Campaign statistics retrieved successfully',
        data: { statistics }
      });
    } catch (error) {
      console.error('Get campaign statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve campaign statistics',
        error: 'Internal server error'
      });
    }
  }
}

module.exports = CampaignController; 