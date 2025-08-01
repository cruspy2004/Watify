import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { apiService } from '../services/api';
import { API_CONFIG, APP_CONFIG } from '../utils/config';

const Home = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [serverInfo, setServerInfo] = useState(null);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setBackendStatus('connected');
        setServerInfo(data);
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
      console.error('Backend connection error:', error);
    }
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return 'Backend Connected';
      case 'error': return 'Backend Disconnected';
      default: return 'Checking Backend...';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to {APP_CONFIG.NAME}
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          {APP_CONFIG.DESCRIPTION}
        </Typography>
        
        <Box mb={4}>
          <Chip 
            label={getStatusText()}
            color={getStatusColor()}
            variant="outlined"
            size="large"
          />
        </Box>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Backend Status
              </Typography>
              {serverInfo ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Status:</strong> {serverInfo.status}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Timestamp:</strong> {new Date(serverInfo.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Uptime:</strong> {Math.floor(serverInfo.uptime)} seconds
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1">
                  {backendStatus === 'error' ? 'Unable to connect to backend server' : 'Checking connection...'}
                </Typography>
              )}
              <Box mt={2}>
                <Button 
                  variant="outlined" 
                  onClick={checkBackendConnection}
                  size="small"
                >
                  Refresh Status
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Get Started
              </Typography>
              <Typography variant="body1" gutterBottom>
                Ready to start using the application? Sign in or create a new account.
              </Typography>
              <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="contained" 
                  color="primary"
                >
                  Login
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="outlined" 
                  color="primary"
                >
                  Register
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={6} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          Version {APP_CONFIG.VERSION} • Built with React & Node.js
        </Typography>
      </Box>
    </Container>
  );
};

export default Home; 