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
    // Mock data for demonstration purposes (based on your screenshot)
    const mockData = {
      today: {
        outgoing: {
          text: 96,
          video: 0,
          image: 0,
          document: 0,
          audio: 0,
          total: 96
        },
        incoming: {
          message: 0,
          auto_response: 0,
          audio_call: 0,
          video_call: 0
        },
        errors: {
          limit_exceeded: 0,
          no_whatsapp_account: 0,
          invalid_numbers: 0
        }
      },
      monthly: {
        text: 2420,
        video: 0,
        image: 0,
        document: 0,
        audio: 0,
        auto_response: 0,
        total: 2420
      },
      subscribers: {
        total: 15,
        active: 15
      },
      activity: [
        { date: '2024-06-15', text: 150, image: 10, video: 5, document: 2, total: 167 },
        { date: '2024-06-16', text: 200, image: 15, video: 8, document: 3, total: 226 },
        { date: '2024-06-17', text: 180, image: 12, video: 6, document: 4, total: 202 },
        { date: '2024-06-18', text: 220, image: 18, video: 10, document: 5, total: 253 },
        { date: '2024-06-19', text: 160, image: 8, video: 4, document: 2, total: 174 },
        { date: '2024-06-20', text: 190, image: 14, video: 7, document: 3, total: 214 },
        { date: '2024-06-21', text: 210, image: 16, video: 9, document: 6, total: 241 }
      ]
    };
    
    res.status(200).json({
      success: true,
      message: 'Complete dashboard data retrieved successfully',
      data: mockData
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