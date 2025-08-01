import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  MenuItem,
  Select,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Link as LinkIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon
} from '@mui/icons-material';

const SendMessageForm = () => {
  const [messageType, setMessageType] = useState('individual');
  const [contentType, setContentType] = useState('text');
  const [formData, setFormData] = useState({
    recipientPhone: '',
    recipientGroup: '',
    recipientWhatsAppGroup: '',
    messageContent: '',
    linkUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAvailableGroups();
  }, []);

  const fetchAvailableGroups = async () => {
    try {
      const token = localStorage.getItem('wateen_watify_token');
      console.log('🔍 Fetching real WhatsApp groups...');
      
      // Fetch real WhatsApp groups using the new API
      const response = await fetch('/api/whatsapp/groups/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Real WhatsApp groups fetched:', result);
        
        if (result.status === 'success' && Array.isArray(result.data.groups)) {
          setGroups(result.data.groups);
          setWhatsappGroups(result.data.groups); // Use same data for both
        } else {
          console.error('❌ Invalid response structure:', result);
          setGroups([]);
          setWhatsappGroups([]);
        }
      } else {
        console.error('❌ Failed to fetch WhatsApp groups:', response.status);
        setGroups([]);
        setWhatsappGroups([]);
      }

    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      setMessage({ type: 'error', text: 'Failed to load groups. Please check your connection.' });
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

    if (!formData.messageContent && contentType !== 'media_attachment') {
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
      const token = localStorage.getItem('wateen_watify_token');
      let requestData = {};
      let endpoint = '';

      // Prepare request based on message type
      if (messageType === 'individual') {
        // Send to individual number
        requestData = {
          number: formData.recipientPhone,
          message: formData.messageContent
        };
        endpoint = '/api/whatsapp/send-message';
      } else if (messageType === 'group') {
        // Send to group members (get member numbers and send bulk)
        const groupId = formData.recipientGroup;
        
        // First, get group members
        const membersResponse = await fetch(`/api/whatsapp-groups/${groupId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!membersResponse.ok) {
          throw new Error('Failed to fetch group members');
        }

        const membersResult = await membersResponse.json();
        const memberNumbers = membersResult.data
          .filter(member => member.status === 'active' && member.phone_number)
          .map(member => member.phone_number);

        if (memberNumbers.length === 0) {
          throw new Error('No active members found in the selected group');
        }

        requestData = {
          numbers: memberNumbers,
          message: formData.messageContent
        };
        endpoint = '/api/whatsapp/send-bulk';
      } else if (messageType === 'whatsapp_group') {
        // For WhatsApp groups, send to individual members
        const groupId = formData.recipientWhatsAppGroup;
        
        const membersResponse = await fetch(`/api/whatsapp-groups/${groupId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!membersResponse.ok) {
          throw new Error('Failed to fetch WhatsApp group members');
        }

        const membersResult = await membersResponse.json();
        const memberNumbers = membersResult.data
          .filter(member => member.status === 'active' && member.phone_number)
          .map(member => member.phone_number);

        if (memberNumbers.length === 0) {
          throw new Error('No active members found in the selected WhatsApp group');
        }

        requestData = {
          numbers: memberNumbers,
          message: formData.messageContent
        };
        endpoint = '/api/whatsapp/send-bulk';
      }

      console.log('📤 Sending message:', { endpoint, requestData });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'Message sent successfully!' 
        });
        
        // Reset form
        setFormData({
          recipientPhone: '',
          recipientGroup: '',
          recipientWhatsAppGroup: '',
          messageContent: '',
          linkUrl: ''
        });
        setSelectedFile(null);
        setContentType('text');
      } else {
        throw new Error(result.message || 'Failed to send message');
      }

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to send message. Please try again.' 
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
                    <span>{group.group_name || group.name}</span>
                    <Chip label={`${group.member_count || 0} members`} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {groups.length === 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                No groups available. Create a group first.
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
                    <span>{group.group_name || group.name}</span>
                    <Chip label={`${group.member_count || 0} members`} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {whatsappGroups.length === 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                No WhatsApp groups available. Create a WhatsApp group first.
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
            label="Message Content"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={formData.messageContent}
            onChange={(e) => handleInputChange('messageContent', e.target.value)}
            placeholder="Enter your message..."
            helperText={`${formData.messageContent.length}/4096 characters`}
            inputProps={{ maxLength: 4096 }}
          />
        );
      
      case 'link_preview':
        return (
          <>
            <TextField
              label="Link URL"
              variant="outlined"
              fullWidth
              value={formData.linkUrl}
              onChange={(e) => handleInputChange('linkUrl', e.target.value)}
              placeholder="https://example.com"
              helperText="Enter a valid URL to generate a preview"
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
              placeholder="Your message with the link..."
            />
          </>
        );
      
      case 'media_attachment':
        return (
          <Box>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            <label htmlFor="file-upload">
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Images, videos, audio, PDF, DOC (max 50MB)
                </Typography>
              </Box>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    {getFileIcon(selectedFile.type)}
                    <Box>
                      <Typography variant="body2">{selectedFile.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setSelectedFile(null)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
            
            <TextField
              label="Caption (Optional)"
              variant="outlined"
              fullWidth
              value={formData.messageContent}
              onChange={(e) => handleInputChange('messageContent', e.target.value)}
              placeholder="Add a caption to your media..."
              sx={{ mt: 2 }}
            />
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Send Message
      </Typography>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Message Type Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Message Type
        </Typography>
        <RadioGroup
          row
          value={messageType}
          onChange={(e) => setMessageType(e.target.value)}
        >
          <FormControlLabel
            value="individual"
            control={<Radio />}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon />
                Individual
              </Box>
            }
          />
          <FormControlLabel
            value="group"
            control={<Radio />}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <GroupIcon />
                Group
              </Box>
            }
          />
          <FormControlLabel
            value="whatsapp_group"
            control={<Radio />}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <WhatsAppIcon />
                WhatsApp Group
              </Box>
            }
          />
        </RadioGroup>
      </Box>

      {/* Recipient Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recipient
        </Typography>
        {renderRecipientField()}
      </Box>

      {/* Content Type Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Content Type
        </Typography>
        <RadioGroup
          row
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
        >
          <FormControlLabel
            value="text"
            control={<Radio />}
            label="Text"
          />
          <FormControlLabel
            value="link_preview"
            control={<Radio />}
            label="Link Preview"
          />
          <FormControlLabel
            value="media_attachment"
            control={<Radio />}
            label="Media"
          />
        </RadioGroup>
      </Box>

      {/* Content Input */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Message Content
        </Typography>
        {renderContentInput()}
      </Box>

      {/* Send Button */}
      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          onClick={() => {
            setFormData({
              recipientPhone: '',
              recipientGroup: '',
              recipientWhatsAppGroup: '',
              messageContent: '',
              linkUrl: ''
            });
            setSelectedFile(null);
            setMessage({ type: '', text: '' });
          }}
          disabled={loading}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </Box>
    </Paper>
  );
};

export default SendMessageForm; 