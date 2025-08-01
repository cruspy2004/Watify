const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getDashboardStats,
  getTodayStats,
  getMonthlyStats,
  getSubscriberStats,
  getActivityData,
  getCompleteDashboard
} = require('../controllers/analyticsController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/analytics/dashboard - Get complete dashboard data
router.get('/dashboard', getCompleteDashboard);

// GET /api/analytics/today - Get today's statistics
router.get('/today', getTodayStats);

// GET /api/analytics/monthly - Get monthly statistics
router.get('/monthly', getMonthlyStats);

// GET /api/analytics/subscribers - Get subscriber statistics
router.get('/subscribers', getSubscriberStats);

// GET /api/analytics/activity - Get activity data for charts
router.get('/activity', getActivityData);

// GET /api/analytics/stats - Get general dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router; 