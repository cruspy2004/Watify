const Subscriber = require('../models/Subscriber');

class SubscriberController {
  // Get all subscribers
  static async getAllSubscribers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        status: req.query.status,
        search: req.query.search
      };

      const result = await Subscriber.getAll(page, limit, filters);

      res.json({
        success: true,
        message: 'Subscribers retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get all subscribers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscribers',
        error: 'Internal server error'
      });
    }
  }

  // Get single subscriber
  static async getSubscriber(req, res) {
    try {
      const { id } = req.params;
      const subscriber = await Subscriber.findById(id);

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found',
          error: 'Subscriber with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Subscriber retrieved successfully',
        data: { subscriber }
      });
    } catch (error) {
      console.error('Get subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscriber',
        error: 'Internal server error'
      });
    }
  }

  // Create new subscriber
  static async createSubscriber(req, res) {
    try {
      const { name, phone_number, email, whatsapp_id, status, tags, notes } = req.body;

      if (!phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Phone number is required'
        });
      }

      const existingSubscriber = await Subscriber.findByPhone(phone_number);
      if (existingSubscriber) {
        return res.status(400).json({
          success: false,
          message: 'Subscriber creation failed',
          error: 'Subscriber with this phone number already exists'
        });
      }

      const subscriberData = {
        name,
        phone_number,
        email,
        whatsapp_id,
        status,
        tags,
        notes,
        created_by: req.user.id
      };

      const subscriber = await Subscriber.create(subscriberData);

      res.status(201).json({
        success: true,
        message: 'Subscriber created successfully',
        data: { subscriber }
      });
    } catch (error) {
      console.error('Create subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subscriber',
        error: 'Internal server error'
      });
    }
  }

  // Update subscriber
  static async updateSubscriber(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingSubscriber = await Subscriber.findById(id);
      if (!existingSubscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found',
          error: 'Subscriber with this ID does not exist'
        });
      }

      const updatedSubscriber = await Subscriber.update(id, updates);

      res.json({
        success: true,
        message: 'Subscriber updated successfully',
        data: { subscriber: updatedSubscriber }
      });
    } catch (error) {
      console.error('Update subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subscriber',
        error: 'Internal server error'
      });
    }
  }

  // Delete subscriber
  static async deleteSubscriber(req, res) {
    try {
      const { id } = req.params;

      const deletedSubscriber = await Subscriber.delete(id);

      if (!deletedSubscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found',
          error: 'Subscriber with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Subscriber deleted successfully',
        data: { subscriber: deletedSubscriber }
      });
    } catch (error) {
      console.error('Delete subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subscriber',
        error: 'Internal server error'
      });
    }
  }

  // Update subscriber status
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Status is required'
        });
      }

      const updatedSubscriber = await Subscriber.updateStatus(id, status);

      if (!updatedSubscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found',
          error: 'Subscriber with this ID does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Subscriber status updated successfully',
        data: { subscriber: updatedSubscriber }
      });
    } catch (error) {
      console.error('Update subscriber status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subscriber status',
        error: 'Internal server error'
      });
    }
  }
}

module.exports = SubscriberController; 