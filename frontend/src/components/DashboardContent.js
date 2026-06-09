import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import {
  AudioFile,
  Description,
  Image,
  Message,
  People,
  Phone,
  ShowChart,
  SmartToy,
  TextSnippet,
  TrendingUp,
  VideoFile,
  Videocam
} from '@mui/icons-material';
import { useCustomTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const emptyDashboardData = {
  today: {
    outgoing: {
      text: 0,
      video: 0,
      image: 0,
      document: 0,
      audio: 0,
      links: 0,
      total: 0
    },
    incoming: {
      message: 0,
      auto_response: 0,
      audio_call: 0,
      video_call: 0
    },
    errors: {
      failed: 0
    }
  },
  monthly: {
    text: 0,
    video: 0,
    image: 0,
    document: 0,
    audio: 0,
    auto_response: 0,
    links: 0,
    total: 0
  },
  subscribers: {
    total: 0,
    active: 0,
    new_today: 0
  },
  summary: {
    success_rate: 0
  },
  generated_at: null
};

const DashboardContent = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics/dashboard');
      if (response?.success && response?.data) {
        setDashboardData({
          ...emptyDashboardData,
          ...response.data,
          today: {
            ...emptyDashboardData.today,
            ...response.data.today,
            outgoing: {
              ...emptyDashboardData.today.outgoing,
              ...response.data.today?.outgoing
            },
            incoming: {
              ...emptyDashboardData.today.incoming,
              ...response.data.today?.incoming
            },
            errors: {
              ...emptyDashboardData.today.errors,
              ...response.data.today?.errors
            }
          },
          monthly: {
            ...emptyDashboardData.monthly,
            ...response.data.monthly
          },
          subscribers: {
            ...emptyDashboardData.subscribers,
            ...response.data.subscribers
          },
          summary: {
            ...emptyDashboardData.summary,
            ...response.data.summary
          }
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(emptyDashboardData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
        sx={{
          backgroundColor: isDarkMode ? theme.palette.background.default : 'transparent',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} sx={{ color: '#4CAF50', mb: 2 }} />
          <Typography
            variant="h6"
            sx={{
              color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
              transition: 'color 0.3s ease'
            }}
          >
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  const data = dashboardData;
  const currentMonthLabel = data.generated_at
    ? new Date(data.generated_at).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'Current Month';
  const monthlyTotal = data.monthly.total || 0;
  const successRate = Number(data.summary.success_rate || 0);
  const totalToday = data.today.outgoing.total || 0;

  const getProgress = (count) => {
    if (!totalToday) {
      return 0;
    }

    return Math.round((count / totalToday) * 100);
  };

  const EnhancedStatCard = ({ title, value, color, icon, subtitle }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        background: isDarkMode
          ? `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)`
          : `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}${isDarkMode ? '30' : '20'}`,
        backgroundColor: isDarkMode ? theme.palette.background.paper : 'inherit',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}${isDarkMode ? '40' : '25'}`,
          border: `1px solid ${color}${isDarkMode ? '60' : '40'}`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
              boxShadow: `0 4px 12px ${color}40`
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="body2" sx={{ color, fontWeight: 700 }}>
            Live
          </Typography>
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 700, color, mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            color: isDarkMode ? theme.palette.text.primary : 'inherit',
            transition: 'color 0.3s ease'
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.85rem',
              color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
              transition: 'color 0.3s ease'
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const MessageTypeRow = ({ icon, type, count, color }) => (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              bgcolor: `${color}${isDarkMode ? '30' : '20'}`,
              color,
              width: 32,
              height: 32,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Typography
            variant="body1"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: isDarkMode ? theme.palette.text.primary : 'inherit',
              transition: 'color 0.3s ease'
            }}
          >
            {type}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color }}>
          {count}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={getProgress(count)}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: `${color}${isDarkMode ? '20' : '10'}`,
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 }
        }}
      />
    </Box>
  );

  const CircularChart = ({ total }) => (
    <Box
      sx={{
        position: 'relative',
        width: 200,
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #4CAF50 0deg, #4CAF50 320deg, #e3f2fd 320deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
            boxShadow: isDarkMode
              ? 'inset 0 0 20px rgba(255,255,255,0.05)'
              : 'inset 0 0 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#4CAF50',
            position: 'relative',
            zIndex: 1
          }}
        >
          {total}
        </Typography>
      </Box>
    </Box>
  );

  const MetricCard = ({ title, value, icon, color, subtitle }) => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        background: isDarkMode
          ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
          : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
        border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDarkMode
            ? '0 8px 25px rgba(0,0,0,0.3)'
            : '0 8px 25px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: isDarkMode ? theme.palette.text.primary : 'inherit',
              transition: 'color 0.3s ease'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
                mt: 0.5,
                transition: 'color 0.3s ease'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}20`,
            color,
            width: 56,
            height: 56
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        p: 4,
        minHeight: '100vh',
        backgroundColor: isDarkMode ? theme.palette.background.default : 'transparent',
        transition: 'background-color 0.3s ease'
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: isDarkMode ? theme.palette.text.primary : '#1a1a1a',
            transition: 'color 0.3s ease'
          }}
        >
          Dashboard Overview
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: isDarkMode ? theme.palette.text.secondary : '#666',
            fontSize: '1.1rem',
            transition: 'color 0.3s ease'
          }}
        >
          Live project data from your local portfolio environment.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Total Messages"
            value={data.today.outgoing.total}
            color="#4CAF50"
            icon={<Message />}
            subtitle="Sent today"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Active Subscribers"
            value={data.subscribers.active}
            color="#2196F3"
            icon={<People />}
            subtitle="Current active records"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Success Rate"
            value={`${successRate}%`}
            color="#FF9800"
            icon={<ShowChart />}
            subtitle="Based on tracked message status"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="New Subscribers"
            value={data.subscribers.new_today}
            color="#9C27B0"
            icon={<TrendingUp />}
            subtitle="Added today"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              backgroundColor: isDarkMode ? theme.palette.background.paper : 'inherit',
              border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 3,
                  color: isDarkMode ? theme.palette.text.primary : 'inherit',
                  transition: 'color 0.3s ease'
                }}
              >
                Today&apos;s Message Types
              </Typography>

              <MessageTypeRow
                icon={<TextSnippet />}
                type="Text Messages"
                count={data.today.outgoing.text}
                color="#4CAF50"
              />

              <MessageTypeRow
                icon={<Image />}
                type="Media Attachments"
                count={data.today.outgoing.image}
                color="#2196F3"
              />

              <MessageTypeRow
                icon={<VideoFile />}
                type="Videos"
                count={data.today.outgoing.video}
                color="#FF9800"
              />

              <MessageTypeRow
                icon={<Description />}
                type="Documents"
                count={data.today.outgoing.document}
                color="#9C27B0"
              />

              <MessageTypeRow
                icon={<AudioFile />}
                type="Audio"
                count={data.today.outgoing.audio}
                color="#F44336"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              backgroundColor: isDarkMode ? theme.palette.background.paper : 'inherit',
              border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: isDarkMode ? theme.palette.text.primary : 'inherit',
                    transition: 'color 0.3s ease'
                  }}
                >
                  Monthly Performance
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                  {currentMonthLabel}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
                <CircularChart total={monthlyTotal} />
              </Box>

              <Typography
                variant="body2"
                align="center"
                sx={{
                  color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
                  transition: 'color 0.3s ease'
                }}
              >
                Total messages sent this month: <strong>{monthlyTotal.toLocaleString()}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Auto Responses"
            value={data.monthly.auto_response}
            icon={<SmartToy />}
            color="#4CAF50"
            subtitle="Automated replies tracked"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Video Calls"
            value={data.today.incoming.video_call}
            icon={<Videocam />}
            color="#2196F3"
            subtitle="Incoming calls today"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Phone Calls"
            value={data.today.incoming.audio_call}
            icon={<Phone />}
            color="#FF9800"
            subtitle="Voice calls received"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardContent;
