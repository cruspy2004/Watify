const Analytics = require('../models/Analytics');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const dashboardData = await Analytics.getDashboardData();
    
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: error.message
    });
  }
};

// Get today's statistics
const getTodayStats = async (req, res) => {
  try {
    const todayStats = await Analytics.getTodayStatistics();
    
    res.status(200).json({
      success: true,
      message: 'Today statistics retrieved successfully',
      data: todayStats
    });
  } catch (error) {
    console.error('Error getting today stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving today statistics',
      error: error.message
    });
  }
};

// Get monthly statistics
const getMonthlyStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const monthlyStats = await Analytics.getMonthlyStatistics(year, month);
    
    res.status(200).json({
      success: true,
      message: 'Monthly statistics retrieved successfully',
      data: monthlyStats
    });
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving monthly statistics',
      error: error.message
    });
  }
};

// Get subscriber statistics
const getSubscriberStats = async (req, res) => {
  try {
    const subscriberStats = await Analytics.getSubscriberStatistics();
    
    res.status(200).json({
      success: true,
      message: 'Subscriber statistics retrieved successfully',
      data: subscriberStats
    });
  } catch (error) {
    console.error('Error getting subscriber stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscriber statistics',
      error: error.message
    });
  }
};

// Get activity data for charts
const getActivityData = async (req, res) => {
  try {
    const activityData = await Analytics.getFortnightActivity();
    
    res.status(200).json({
      success: true,
      message: 'Activity data retrieved successfully',
      data: activityData
    });
  } catch (error) {
    console.error('Error getting activity data:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving activity data',
      error: error.message
    });
  }
};

// Get complete dashboard data (combined endpoint)
const getCompleteDashboard = async (req, res) => {
  try {
    const dashboardData = await Analytics.getDashboardData();
    
    res.status(200).json({
      success: true,
      message: 'Complete dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting complete dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving complete dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getTodayStats,
  getMonthlyStats,
  getSubscriberStats,
  getActivityData,
  getCompleteDashboard
}; 
