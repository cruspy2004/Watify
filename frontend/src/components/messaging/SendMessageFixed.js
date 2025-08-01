import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  Send as SendIcon,
  Group as GroupIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';

const SendMessageFixed = () => {
  const [messageType, setMessageType] = useState('individual');
  const [formData, setFormData] = useState({
    recipientPhone: '',
    recipientGroup: '',
    recipientWhatsAppGroup: '',
    messageContent: ''
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [debugMode, setDebugMode] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('wateen_watify_token');
      console.log('🔍 Fetching real WhatsApp groups with token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to view groups' });
        return;
      }

      const response = await fetch('/api/whatsapp/groups/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('📦 Data:', result);
        
        if (result.status === 'success' && Array.isArray(result.data.groups)) {
          setGroups(result.data.groups);
          setMessage({ type: 'success', text: `Found ${result.data.groups.length} real WhatsApp groups` });
        } else {
          setGroups([]);
          setMessage({ type: 'warning', text: 'No WhatsApp groups found' });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error:', errorText);
        setMessage({ type: 'error', text: `Failed to fetch groups: ${errorText}` });
      }
    } catch (error) {
      console.error('❌ Exception:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const sendMessage = async () => {
    if (!formData.messageContent) {
      setMessage({ type: 'error', text: 'Message content is required' });
      return;
    }

    if (messageType === 'individual' && !formData.recipientPhone) {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return;
    }

    if (messageType !== 'individual' && !formData.recipientGroup && !formData.recipientWhatsAppGroup) {
      setMessage({ type: 'error', text: 'Please select a group' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('wateen_watify_token');
      let endpoint, body;

      if (messageType === 'individual') {
        endpoint = '/api/whatsapp/send-message';
        body = {
          number: formData.recipientPhone,
          message: formData.messageContent
        };
      } else {
        endpoint = '/api/whatsapp/send-to-group';
        body = {
          groupId: messageType === 'group' ? formData.recipientGroup : formData.recipientWhatsAppGroup,
          message: formData.messageContent,
          groupType: messageType === 'group' ? 'regular' : 'whatsapp'
        };
      }

      console.log('📤 Sending:', endpoint, body);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      console.log('📬 Result:', result);

      if (response.ok && (result.status === 'success' || result.success)) {
        setMessage({ type: 'success', text: 'Message sent successfully!' });
        setFormData({
          recipientPhone: '',
          recipientGroup: '',
          recipientWhatsAppGroup: '',
          messageContent: ''
        });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send message' });
      }
    } catch (error) {
      console.error('❌ Send error:', error);
      setMessage({ type: 'error', text: `Send failed: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('wateen_watify_token');
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log('🧪 Connection test:', result);
      setMessage({ 
        type: response.ok ? 'success' : 'error', 
        text: `Connection test: ${response.status} - ${JSON.stringify(result)}` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Test failed: ${error.message}` });
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Send Message (Fixed Version)
      </Typography>

      {/* Debug Section */}
      {debugMode && (
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Debug Info</Typography>
            <Typography variant="body2">
              Token: {localStorage.getItem('wateen_watify_token') ? '✅ Present' : '❌ Missing'}<br/>
              Groups: {groups.length} loaded<br/>
              URL: {window.location.href}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button size="small" onClick={fetchGroups}>Reload Groups</Button>
              <Button size="small" onClick={testConnection}>Test API</Button>
              <Button size="small" onClick={() => setDebugMode(false)}>Hide Debug</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {!debugMode && (
        <Button startIcon={<DebugIcon />} onClick={() => setDebugMode(true)} sx={{ mb: 2 }}>
          Show Debug
        </Button>
      )}

      {/* Message Alert */}
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {/* Message Type Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Message Type</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {['individual', 'group', 'whatsapp_group'].map((type) => (
            <Button
              key={type}
              variant={messageType === type ? 'contained' : 'outlined'}
              onClick={() => setMessageType(type)}
              startIcon={
                type === 'individual' ? <PersonIcon /> : 
                type === 'group' ? <GroupIcon /> : <WhatsAppIcon />
              }
            >
              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Recipient Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Recipient</Typography>
        {messageType === 'individual' ? (
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.recipientPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, recipientPhone: e.target.value }))}
            placeholder="+1234567890"
          />
        ) : (
          <FormControl fullWidth>
            <InputLabel>Select Group</InputLabel>
            <Select
              value={messageType === 'group' ? formData.recipientGroup : formData.recipientWhatsAppGroup}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                [messageType === 'group' ? 'recipientGroup' : 'recipientWhatsAppGroup']: e.target.value
              }))}
              label="Select Group"
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{group.group_name}</span>
                    <Chip label={`${group.member_count || 0} members`} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {groups.length === 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                No groups available. {message.type === 'error' ? 'Check your connection.' : 'Loading...'}
              </Typography>
            )}
          </FormControl>
        )}
      </Box>

      {/* Message Content */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Message</Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message Content"
          value={formData.messageContent}
          onChange={(e) => setFormData(prev => ({ ...prev, messageContent: e.target.value }))}
          placeholder="Type your message here..."
        />
      </Box>

      {/* Send Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        onClick={sendMessage}
        disabled={loading}
        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </Paper>
  );
};

export default SendMessageFixed; 