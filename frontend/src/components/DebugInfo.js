import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';

const DebugInfo = () => {
  const [info, setInfo] = useState({});
  const [testResults, setTestResults] = useState({});
  
  useEffect(() => {
    updateInfo();
  }, []);

  const updateInfo = () => {
    const token = localStorage.getItem('wateen_watify_token');
    setInfo({
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'No token',
      currentUrl: window.location.href,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const testApi = async (endpoint, label) => {
    try {
      const token = localStorage.getItem('wateen_watify_token');
      console.log(`Testing ${label}: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log(`${label} result:`, result);

      setTestResults(prev => ({
        ...prev,
        [label]: {
          status: response.status,
          ok: response.ok,
          success: result.success || result.status === 'success',
          message: result.message || 'OK',
          dataCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0
        }
      }));
    } catch (error) {
      console.error(`${label} error:`, error);
      setTestResults(prev => ({
        ...prev,
        [label]: {
          status: 'ERROR',
          ok: false,
          success: false,
          message: error.message,
          dataCount: 0
        }
      }));
    }
  };

  const TestButton = ({ endpoint, label }) => (
    <Button 
      variant="outlined" 
      size="small" 
      onClick={() => testApi(endpoint, label)}
      sx={{ mr: 1, mb: 1 }}
    >
      Test {label}
    </Button>
  );

  const ResultDisplay = ({ label, result }) => {
    if (!result) return null;
    
    const color = result.success ? 'success' : 'error';
    
    return (
      <Alert severity={color} sx={{ mb: 1 }}>
        <strong>{label}:</strong> {result.message} 
        {result.dataCount > 0 && ` (${result.dataCount} items)`}
        <br />
        <small>Status: {result.status}</small>
      </Alert>
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔧 Debug Information
        </Typography>
        
        <Box mb={2}>
          <Typography variant="body2">
            <strong>Token:</strong> {info.hasToken ? '✅ Present' : '❌ Missing'}<br />
            <strong>Preview:</strong> {info.tokenPreview}<br />
            <strong>URL:</strong> {info.currentUrl}<br />
            <strong>Updated:</strong> {info.timestamp}
          </Typography>
        </Box>

        <Box mb={2}>
          <Button variant="contained" onClick={updateInfo} size="small" sx={{ mr: 1 }}>
            Refresh Info
          </Button>
          <TestButton endpoint="/api/whatsapp/status" label="WhatsApp Status" />
          <TestButton endpoint="/api/whatsapp-groups" label="Groups" />
          <TestButton endpoint="/api/whatsapp-groups/options" label="Group Options" />
        </Box>

        <Box>
          {Object.entries(testResults).map(([label, result]) => (
            <ResultDisplay key={label} label={label} result={result} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DebugInfo; 