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
  IconButton,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  TextFields as TextIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as DocIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const MessageTypeCard = styled(Card)(({ theme, selected }) => ({
  margin: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ContentTypeCard = styled(Card)(({ theme, selected }) => ({
  margin: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.secondary.main}` : '2px solid transparent',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const FileUploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  '&.drag-over': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.lighter,
  },
}));

const SendMessage = () => {
  const [messageType, setMessageType] = useState('individual');
  const [contentType, setContentType] = useState('text');
  const [formData, setFormData] = useState({
    recipientPhone: '',
    recipientGroup: '',
    recipientWhatsAppGroup: '',
    messageContent: '',
    linkUrl: '',
    scheduledAt: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('🔄 SendMessage component mounted, fetching groups...');
    fetchAvailableGroups();
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const token = localStorage.getItem('wateen_watify_token');
    const userStr = localStorage.getItem('wateen_watify_user');
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.warn('Failed to parse user from localStorage');
    }

    setDebugInfo({
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'No token',
      hasUser: !!user,
      userName: user?.name || 'Unknown',
      groupsCount: groups.length,
      whatsappGroupsCount: whatsappGroups.length,
      timestamp: new Date().toLocaleTimeString(),
      currentUrl: window.location.href
    });
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('wateen_watify_token');
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    console.log(`🌐 Making request to: ${url}`);
    console.log(`🔑 Using token: ${token.substring(0, 20)}...`);

    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`📦 Response data:`, data);
    return data;
  };

  const fetchAvailableGroups = async () => {
    try {
      console.log('🔍 Starting to fetch groups...');
      setMessage({ type: '', text: '' });

      // Check authentication first
      const token = localStorage.getItem('wateen_watify_token');
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'You are not logged in. Please log in to view groups.' 
        });
        return;
      }

      console.log('✅ Token found, fetching groups...');

      // Fetch real WhatsApp groups using the new API
      const result = await makeAuthenticatedRequest('/api/whatsapp/groups/list');

      if (result.status === 'success' && result.data && Array.isArray(result.data.groups)) {
        console.log(`✅ Successfully fetched ${result.data.groups.length} real WhatsApp groups`);
        setGroups(result.data.groups);
        setWhatsappGroups(result.data.groups); // Use same data for both for now
        
        if (result.data.groups.length > 0) {
          setMessage({ 
            type: 'success', 
            text: `✅ Found ${result.data.groups.length} real WhatsApp groups available for messaging` 
          });
        } else {
          setMessage({ 
            type: 'info', 
            text: 'ℹ️ No WhatsApp groups found. You may need to create groups first or ensure WhatsApp is connected.' 
          });
        }
      } else {
        console.warn('⚠️ Invalid response structure:', result);
        setGroups([]);
        setWhatsappGroups([]);
        setMessage({ 
          type: 'warning', 
          text: 'Received invalid data from server. Please try refreshing.' 
        });
      }

      updateDebugInfo();

    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      setGroups([]);
      setWhatsappGroups([]);
      setMessage({ 
        type: 'error', 
        text: `Failed to fetch groups: ${error.message}` 
      });
      updateDebugInfo();
    }
  };

  const testConnection = async () => {
    try {
      setMessage({ type: 'info', text: 'Testing connection...' });
      
      const result = await makeAuthenticatedRequest('/api/whatsapp/status');
      
      if (result.status === 'success' && result.data) {
        const { isReady, isAuthenticated, clientInfo } = result.data;
        setMessage({ 
          type: 'success', 
          text: `✅ WhatsApp Status: ${isReady ? 'Ready' : 'Not Ready'}, Auth: ${isAuthenticated ? 'Yes' : 'No'}${clientInfo ? `, User: ${clientInfo.pushname}` : ''}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'WhatsApp connection test failed' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Connection test failed: ${error.message}` 
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 50MB' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 50MB' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon />;
    if (fileType.startsWith('video/')) return <VideoIcon />;
    if (fileType.startsWith('audio/')) return <AudioIcon />;
    if (fileType === 'application/pdf') return <PdfIcon />;
    return <DocIcon />;
  };

  const validateForm = () => {
    if (messageType === 'individual' && !formData.recipientPhone) {
      setMessage({ type: 'error', text: 'Phone number is required for individual messages' });
      return false;
    }

    if (messageType === 'group' && !formData.recipientGroup) {
      setMessage({ type: 'error', text: 'Please select a group' });
      return false;
    }

    if (messageType === 'whatsapp_group' && !formData.recipientWhatsAppGroup) {
      setMessage({ type: 'error', text: 'Please select a WhatsApp group' });
      return false;
    }

    if (!formData.messageContent) {
      setMessage({ type: 'error', text: 'Message content is required' });
      return false;
    }

    if (contentType === 'media_attachment' && !selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file for media attachment' });
      return false;
    }

    if (contentType === 'link_preview' && !formData.linkUrl) {
      setMessage({ type: 'error', text: 'Link URL is required for link preview messages' });
      return false;
    }

    return true;
  };

  const handleSendMessage = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('📤 Starting message send process...');
      
      let requestData = {};
      let endpoint = '';

      // Prepare request based on message type
      if (messageType === 'individual') {
        requestData = {
          number: formData.recipientPhone,
          message: formData.messageContent
        };
        endpoint = '/api/whatsapp/send-message';
        console.log('📱 Sending individual message');
      } else if (messageType === 'group' || messageType === 'whatsapp_group') {
        const groupId = messageType === 'group' ? formData.recipientGroup : formData.recipientWhatsAppGroup;
        requestData = {
          groupId: groupId,
          message: formData.messageContent,
          groupType: messageType === 'group' ? 'regular' : 'whatsapp'
        };
        endpoint = '/api/whatsapp/send-to-group';
        console.log(`👥 Sending ${messageType} message to group ${groupId}`);
      }

      console.log('📤 Request data:', requestData);

      const result = await makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Handle different response formats
      const isSuccess = result.status === 'success' || result.success === true;
      
      if (isSuccess) {
        const successMessage = result.message || 'Message sent successfully!';
        console.log('✅ Message sent successfully:', successMessage);
        
        setMessage({ 
          type: 'success', 
          text: `🎉 ${successMessage}` 
        });
        
        // Reset form
        setFormData({
          recipientPhone: '',
          recipientGroup: '',
          recipientWhatsAppGroup: '',
          messageContent: '',
          linkUrl: '',
          scheduledAt: ''
        });
        setSelectedFile(null);
        setContentType('text');
      } else {
        throw new Error(result.message || result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Failed to send message: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderRecipientField = () => {
    switch (messageType) {
      case 'individual':
        return (
          <TextField
            label="Contact Number"
            variant="outlined"
            fullWidth
            value={formData.recipientPhone}
            onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
            placeholder="Enter phone number (e.g., +1234567890)"
            helperText="Include country code for international numbers"
          />
        );
      
      case 'group':
        return (
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select Group</InputLabel>
            <Select
              value={formData.recipientGroup}
              onChange={(e) => handleInputChange('recipientGroup', e.target.value)}
              label="Select Group"
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <GroupIcon fontSize="small" />
                    <span>{group.name}</span>
                    <Chip label={`${group.participantCount || 0} members`} size="small" />
                    {group.isAdmin && <Chip label="Admin" size="small" color="success" />}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {groups.length === 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {message.type === 'error' ? 'Failed to load groups' : 'Loading groups...'}
              </Typography>
            )}
          </FormControl>
        );
      
      case 'whatsapp_group':
        return (
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select WhatsApp Group</InputLabel>
            <Select
              value={formData.recipientWhatsAppGroup}
              onChange={(e) => handleInputChange('recipientWhatsAppGroup', e.target.value)}
              label="Select WhatsApp Group"
            >
              {whatsappGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <WhatsAppIcon fontSize="small" />
                    <span>{group.name}</span>
                    <Chip label={`${group.participantCount || 0} members`} size="small" />
                    {group.isAdmin && <Chip label="Admin" size="small" color="success" />}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {whatsappGroups.length === 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {message.type === 'error' ? 'Failed to load WhatsApp groups' : 'Loading WhatsApp groups...'}
              </Typography>
            )}
          </FormControl>
        );
      
      default:
        return null;
    }
  };

  const renderContentInput = () => {
    switch (contentType) {
      case 'text':
        return (
          <TextField
            label="Type your message here"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={formData.messageContent}
            onChange={(e) => handleInputChange('messageContent', e.target.value)}
            placeholder="Enter your message content..."
          />
        );
      
      case 'link_preview':
        return (
          <Box spacing={2}>
            <TextField
              label="Link URL"
              variant="outlined"
              fullWidth
              value={formData.linkUrl}
              onChange={(e) => handleInputChange('linkUrl', e.target.value)}
              placeholder="https://example.com"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Message with Link"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={formData.messageContent}
              onChange={(e) => handleInputChange('messageContent', e.target.value)}
              placeholder="Check out this link: {your message here}"
            />
          </Box>
        );
      
      case 'media_attachment':
        return (
          <Box>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            
            {!selectedFile ? (
              <FileUploadBox
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <AttachFileIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Click or drag to upload file
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Images, videos, documents up to 50MB
                </Typography>
              </FileUploadBox>
            ) : (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    {getFileIcon(selectedFile.type)}
                    <Box flex={1}>
                      <Typography variant="subtitle1">{selectedFile.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <IconButton onClick={() => setSelectedFile(null)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            <TextField
              label="Caption (Optional)"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={formData.messageContent}
              onChange={(e) => handleInputChange('messageContent', e.target.value)}
              placeholder="Add a caption to your media..."
            />
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h4" sx={{ 
        mb: 3, 
        color: '#2e7d32', 
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        Send a new Message
      </Typography>

      {/* Debug Section */}
      {debugMode && (
        <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              🔧 Debug Information
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Token:</strong> {debugInfo.hasToken ? '✅ Present' : '❌ Missing'}<br />
              <strong>User:</strong> {debugInfo.hasUser ? `✅ ${debugInfo.userName}` : '❌ Not found'}<br />
              <strong>Groups:</strong> {debugInfo.groupsCount || 0} loaded<br />
              <strong>WhatsApp Groups:</strong> {debugInfo.whatsappGroupsCount || 0} loaded<br />
              <strong>URL:</strong> {debugInfo.currentUrl}<br />
              <strong>Last Updated:</strong> {debugInfo.timestamp}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" onClick={updateDebugInfo}>
                Refresh Info
              </Button>
              <Button size="small" onClick={testConnection}>
                Test Connection
              </Button>
              <Button size="small" onClick={fetchAvailableGroups}>
                Reload Groups
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<DebugIcon />}
          onClick={() => setDebugMode(!debugMode)}
          variant={debugMode ? 'contained' : 'outlined'}
          size="small"
        >
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </Button>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchAvailableGroups}
          variant="outlined"
          size="small"
        >
          Refresh Groups
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Navigation Breadcrumb */}
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Dashboard • Compose • Message • Send Message
      </Typography>

      {/* Message Type Selection */}
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
        Select Message Type
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MessageTypeCard 
            selected={messageType === 'individual'}
            onClick={() => setMessageType('individual')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <PersonIcon sx={{ fontSize: 48, color: messageType === 'individual' ? '#1976d2' : '#666', mb: 1 }} />
              <Typography variant="h6">Individual Message</Typography>
              <Typography variant="body2" color="textSecondary">
                Send to a specific phone number
              </Typography>
            </CardContent>
          </MessageTypeCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <MessageTypeCard 
            selected={messageType === 'group'}
            onClick={() => setMessageType('group')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <GroupIcon sx={{ fontSize: 48, color: messageType === 'group' ? '#1976d2' : '#666', mb: 1 }} />
              <Typography variant="h6">Group Message</Typography>
              <Typography variant="body2" color="textSecondary">
                Send to all members in a group
              </Typography>
            </CardContent>
          </MessageTypeCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <MessageTypeCard 
            selected={messageType === 'whatsapp_group'}
            onClick={() => setMessageType('whatsapp_group')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <WhatsAppIcon sx={{ fontSize: 48, color: messageType === 'whatsapp_group' ? '#25D366' : '#666', mb: 1 }} />
              <Typography variant="h6">WhatsApp Group Message</Typography>
              <Typography variant="body2" color="textSecondary">
                Send to WhatsApp group members
              </Typography>
            </CardContent>
          </MessageTypeCard>
        </Grid>
      </Grid>

      {/* Recipient Selection */}
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
        Select Recipient
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        {renderRecipientField()}
      </Box>

      {/* Content Type Selection */}
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
        Message Type
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <ContentTypeCard 
            selected={contentType === 'text'}
            onClick={() => setContentType('text')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TextIcon sx={{ fontSize: 40, color: contentType === 'text' ? '#ff9800' : '#666', mb: 1 }} />
              <Typography variant="h6">Text</Typography>
            </CardContent>
          </ContentTypeCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ContentTypeCard 
            selected={contentType === 'link_preview'}
            onClick={() => setContentType('link_preview')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <LinkIcon sx={{ fontSize: 40, color: contentType === 'link_preview' ? '#ff9800' : '#666', mb: 1 }} />
              <Typography variant="h6">Link Preview</Typography>
            </CardContent>
          </ContentTypeCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ContentTypeCard 
            selected={contentType === 'media_attachment'}
            onClick={() => setContentType('media_attachment')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AttachFileIcon sx={{ fontSize: 40, color: contentType === 'media_attachment' ? '#ff9800' : '#666', mb: 1 }} />
              <Typography variant="h6">Media Attachment</Typography>
            </CardContent>
          </ContentTypeCard>
        </Grid>
      </Grid>

      {/* Message Content */}
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
        Message Content
      </Typography>
      
      <TextField
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        placeholder="Type your message here"
        value={formData.messageContent}
        onChange={(e) => handleInputChange('messageContent', e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Link URL Field for Link Preview */}
      {contentType === 'link_preview' && (
        <TextField
          label="Link URL"
          variant="outlined"
          fullWidth
          placeholder="https://example.com"
          value={formData.linkUrl}
          onChange={(e) => handleInputChange('linkUrl', e.target.value)}
          sx={{ mb: 3 }}
        />
      )}

      {/* Send Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSendMessage}
          disabled={loading}
          sx={{
            minWidth: 200,
            py: 1.5,
            fontSize: '1.1rem',
            backgroundColor: '#25D366',
            '&:hover': {
              backgroundColor: '#128C7E',
            }
          }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </Box>
    </StyledPaper>
  );
};

export default SendMessage; 