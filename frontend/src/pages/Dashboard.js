import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
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
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  WhatsApp,
  Edit as ComposeIcon,
  People as SubscribersIcon,
  Receipt as BillingIcon,
  Message as MessageLogsIcon,
  ExpandLess,
  ExpandMore,
  Group as GroupIcon,
  PersonAdd as AddMemberIcon,
  Search as SearchIcon,
  Send as SendIcon,
  List as ListIcon,
  PendingActions as PendingIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  AttachFile as AttachFileIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCustomTheme } from '../contexts/ThemeContext';
import DashboardContent from '../components/DashboardContent';
import CreateGroupForm from '../components/whatsapp/CreateGroupForm';
import GroupList from '../components/whatsapp/GroupList';
import GroupDetails from '../components/whatsapp/GroupDetails';
import PendingMembers from '../components/whatsapp/PendingMembers';
import AddMember from '../components/whatsapp/AddMember';
import AddMembersToGroup from '../components/whatsapp/AddMembersToGroup';
import SearchMembers from '../components/whatsapp/SearchMembers';
import SendMessage from '../components/messaging/SendMessage';
import WhatsAppAuth from '../components/whatsapp/WhatsAppAuth';
import { whatsappGroupApi } from '../services/whatsappApi';
import { API_CONFIG } from '../utils/config';
import EditGroupForm from '../components/whatsapp/EditGroupForm';
import { useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 280;

// Inline Send Message Component
const SendMessageComponent = () => {
  const { isDarkMode } = useCustomTheme();
  const muiTheme = useTheme();
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  React.useEffect(() => {
    fetchAvailableGroups();
  }, []);

  const fetchAvailableGroups = async () => {
    try {
      const token = localStorage.getItem('wateen_watify_token');
      console.log('🔍 Debug - Token exists:', token ? 'YES' : 'NO');
      console.log('🔍 Debug - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('🔍 Debug - Making API call to /api/whatsapp/groups/list');
      const response = await fetch('/api/whatsapp/groups/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Debug - Response status:', response.status);
      console.log('🔍 Debug - Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Debug - Response data:', result);
        if (result.status === 'success' && Array.isArray(result.data.groups)) {
          setGroups(result.data.groups);
        } else {
          setGroups([]);
        }
      }
    } catch (error) {
      console.error('🔍 Debug - Network/Fetch Error:', error);
      setMessage({ type: 'error', text: 'Failed to load groups. Please check your login status.' });
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
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to send messages.' });
        return;
      }

      let requestData = {};
      let endpoint = '';

      // Prepare request based on message type
      if (messageType === 'individual') {
        requestData = {
          number: formData.recipientPhone,
          message: formData.messageContent
        };
        endpoint = '/api/whatsapp/send-message';
      } else if (messageType === 'group' || messageType === 'whatsapp_group') {
        const groupId = messageType === 'group' ? formData.recipientGroup : formData.recipientWhatsAppGroup;
        requestData = {
          groupId: groupId,
          message: formData.messageContent,
          groupType: messageType === 'group' ? 'regular' : 'whatsapp'
        };
        endpoint = '/api/whatsapp/send-to-group';
      }

      console.log('📤 Dashboard: Sending message...', { endpoint, requestData });

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('📬 Dashboard: Response received:', result);

      if (response.ok && (result.status === 'success' || result.success)) {
        setMessage({ type: 'success', text: `✅ ${result.message || 'Message sent successfully!'}` });
        
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
        throw new Error(result.message || result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Dashboard: Error sending message:', error);
      setMessage({ type: 'error', text: `❌ Failed to send message: ${error.message}` });
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
                    <Chip label={`${group.member_count} members`} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
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
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <WhatsApp fontSize="small" />
                    <span>{group.name}</span>
                    <Chip label={`${group.member_count} members`} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
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
          <Box>
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
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <AttachFileIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Click to upload file
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Images, videos, documents up to 50MB
                </Typography>
              </Box>
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
    <Paper sx={{ p: 3, m: 2, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Send a new Message
      </Typography>
      
      {/* Breadcrumb */}
      <Box sx={{ mb: 3, color: 'text.secondary' }}>
        Dashboard • Compose • Message • Send Message
      </Box>
      
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {/* Message Type Selection */}
      <Box mb={4}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
          >
            <FormControlLabel
              value="individual"
              control={<Radio color="primary" />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon />
                  Individual Message
                </Box>
              }
            />
            <FormControlLabel
              value="group"
              control={<Radio color="primary" />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <GroupIcon />
                  Group Message
                </Box>
              }
            />
            <FormControlLabel
              value="whatsapp_group"
              control={<Radio color="primary" />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <WhatsApp />
                  WhatsApp Group Message
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Recipient Selection */}
      <Box mb={3}>
        {renderRecipientField()}
      </Box>

      {/* Content Type Selection */}
      <Box mb={4}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <FormControlLabel
              value="text"
              control={<Radio color="secondary" />}
              label="Text"
            />
            <FormControlLabel
              value="link_preview"
              control={<Radio color="secondary" />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <LinkIcon />
                  Link Preview
                </Box>
              }
            />
            <FormControlLabel
              value="media_attachment"
              control={<Radio color="secondary" />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachFileIcon />
                  Media Attachment
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Message Content */}
      <Box mb={4}>
        {renderContentInput()}
      </Box>

      {/* Send Button */}
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          size="large"
          onClick={handleSendMessage}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: '#28a745',
            '&:hover': {
              backgroundColor: '#218838'
            }
          }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </Box>
    </Paper>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, isHighContrast, theme: customTheme } = useCustomTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  // State for sidebar sections
  const [openSections, setOpenSections] = useState({
    whatsapp: false,
    compose: false,
    messageLogs: false
  });
  
  // State for mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State for selected menu item
  const [selectedItem, setSelectedItem] = useState('dashboard');

  // State for group details view
  const [viewingGroupDetails, setViewingGroupDetails] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const location = useLocation();

  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleItemClick = (itemKey) => {
    setSelectedItem(itemKey);
    // Reset group details view when navigating to other sections
    setViewingGroupDetails(false);
    setSelectedGroupId(null);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Function to handle viewing group details
  const handleViewGroupDetails = (groupId) => {
    setSelectedGroupId(groupId);
    setViewingGroupDetails(true);
  };

  // Function to go back from group details to group list
  const handleBackToGroupList = () => {
    setViewingGroupDetails(false);
    setSelectedGroupId(null);
  };

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      color: '#4CAF50'
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsApp />,
      expandable: true,
      section: 'whatsapp',
      subItems: [
        { key: 'whatsapp-auth', label: 'WhatsApp Setup', icon: <QrCodeIcon /> },
        { key: 'create-group', label: 'Create Group', icon: <GroupIcon /> },
        { key: 'list-groups', label: 'List Groups', icon: <ListIcon /> },
        { key: 'pending-members', label: 'Pending Members', icon: <PendingIcon /> },
        { key: 'add-member', label: 'Add Members to Group', icon: <AddMemberIcon /> },
        { key: 'search-member', label: 'Search Member', icon: <SearchIcon /> }
      ]
    },
    {
      key: 'compose',
      label: 'Compose',
      icon: <ComposeIcon />,
      expandable: true,
      section: 'compose',
      subItems: [
        { key: 'send-message', label: 'Send Message', icon: <SendIcon /> }
      ]
    },
    {
      key: 'subscribers',
      label: 'Subscribers',
      icon: <SubscribersIcon />
    },
    {
      key: 'billing-report',
      label: 'Billing Report',
      icon: <BillingIcon />
    },
    {
      key: 'message-logs',
      label: 'Message Logs',
      icon: <MessageLogsIcon />,
      expandable: true,
      section: 'messageLogs',
      subItems: [
        { key: 'outgoing-logs', label: 'Outgoing Logs', icon: <SendIcon /> }
      ]
    }
  ];

  const renderMenuItem = (item) => {
    const isSelected = selectedItem === item.key;
    const isOpen = item.section && openSections[item.section];

    return (
      <React.Fragment key={item.key}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (item.expandable) {
                handleSectionToggle(item.section);
              } else {
                handleItemClick(item.key);
              }
            }}
            sx={{
              backgroundColor: isSelected 
                ? (isDarkMode ? 'rgba(129, 199, 132, 0.15)' : '#e8f5e8')
                : 'transparent',
              borderLeft: isSelected 
                ? '4px solid #4CAF50' 
                : '4px solid transparent',
              px: 3,
              py: 1.5,
              mx: 0,
              borderRadius: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isSelected 
                  ? (isDarkMode ? 'rgba(129, 199, 132, 0.15)' : '#e8f5e8')
                  : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa')
              }
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: isSelected 
                  ? '#4CAF50' 
                  : (isDarkMode ? muiTheme.palette.text.secondary : '#666'),
                minWidth: 36,
                fontSize: '1.2rem'
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected 
                    ? '#4CAF50' 
                    : (isDarkMode ? muiTheme.palette.text.primary : '#333'),
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }}
            />
            {item.expandable && (
              <Box sx={{ 
                ml: 1, 
                color: isDarkMode ? muiTheme.palette.text.secondary : '#666', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                {isOpen ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        
        {item.expandable && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map((subItem) => {
                const isSubSelected = selectedItem === subItem.key;
                return (
                  <ListItem key={subItem.key} disablePadding>
                    <ListItemButton
                      onClick={() => handleItemClick(subItem.key)}
                      sx={{
                        pl: 6,
                        pr: 3,
                        py: 1,
                        backgroundColor: isSubSelected 
                          ? (isDarkMode ? 'rgba(129, 199, 132, 0.15)' : '#e8f5e8')
                          : 'transparent',
                        borderLeft: isSubSelected 
                          ? '4px solid #4CAF50' 
                          : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : '#f8f9fa'
                        }
                      }}
                    >
                      <Typography 
                        variant="body2"
                        sx={{
                          fontSize: '0.85rem',
                          fontWeight: isSubSelected ? 600 : 400,
                          color: isSubSelected 
                            ? '#4CAF50' 
                            : (isDarkMode ? muiTheme.palette.text.secondary : '#666'),
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {subItem.label}
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ 
      width: DRAWER_WIDTH, 
      height: '100%', 
      backgroundColor: isDarkMode ? muiTheme.palette.background.paper : '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Header with Logo - Theme-aware Design */}
      <Box 
        sx={{ 
          p: 3,
          backgroundColor: isDarkMode ? muiTheme.palette.background.paper : '#ffffff',
          borderBottom: `1px solid ${isDarkMode ? muiTheme.palette.divider : '#f0f0f0'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        {/* WATIFY Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}
          >
            W
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: '#4CAF50',
              fontSize: '1.5rem',
              letterSpacing: '0.5px'
            }}
          >
            WATIFY
          </Typography>
        </Box>
        
        {/* User Profile Section - Theme-aware Design */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.05)' 
              : '#f8f9fa',
            borderRadius: 2,
            p: 2,
            border: `1px solid ${isDarkMode ? muiTheme.palette.divider : '#e9ecef'}`,
            transition: 'all 0.3s ease'
          }}
        >
          <Avatar 
            sx={{ 
              backgroundColor: '#FF9800', 
              color: '#ffffff',
              width: 36, 
              height: 36,
              fontSize: '1rem',
              fontWeight: 700,
              mr: 2
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'W'}
          </Avatar>
          <Box sx={{ 
            flex: 1, 
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: isDarkMode ? muiTheme.palette.text.primary : '#333',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'color 0.3s ease'
              }}
            >
              {user?.name || 'Wateen'} (alih...)
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? muiTheme.palette.text.secondary : '#666',
                fontSize: '0.75rem',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'color 0.3s ease'
              }}
            >
              alihassan@gma...
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu - Theme-aware Design */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        py: 1
      }}>
        <List sx={{ px: 0 }}>
          {menuItems.map(renderMenuItem)}
        </List>
      </Box>
    </Box>
  );

  const getPageContent = () => {
    // If editing a group, show EditGroupForm
    if (location.pathname.match(/^\/dashboard\/whatsapp\/groups\/[\w@.]+\/edit$/)) {
      return <EditGroupForm />;
    }
    // If viewing group details, show GroupDetails component
    if (viewingGroupDetails && selectedGroupId) {
      return <GroupDetails groupId={selectedGroupId} onBack={handleBackToGroupList} />;
    }

    switch (selectedItem) {
      case 'dashboard':
        return <DashboardContent />;
      case 'create-group':
        return <CreateGroupForm />;
      case 'list-groups':
        return <GroupList onViewGroupDetails={handleViewGroupDetails} />;
      case 'pending-members':
        return <PendingMembers />;
      case 'add-member':
        return <AddMembersToGroup />;
      case 'search-member':
        return <SearchMembers />;
      case 'whatsapp-auth':
        return <WhatsAppAuth />;
      case 'send-message':
        return <SendMessageComponent />;
      default:
        return (
          <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ 
              mb: 2, 
              color: isDarkMode ? muiTheme.palette.text.primary : '#1a1a1a', 
              fontWeight: 700,
              transition: 'color 0.3s ease'
            }}>
              {menuItems.find(item => item.key === selectedItem)?.label || 
               menuItems.flatMap(item => item.subItems || []).find(sub => sub.key === selectedItem)?.label}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: isDarkMode ? muiTheme.palette.text.secondary : '#666', 
              fontSize: '1.1rem',
              transition: 'color 0.3s ease'
            }}>
              This feature is coming soon. We'll implement this functionality next!
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      backgroundColor: isDarkMode ? muiTheme.palette.background.default : '#ffffff',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: muiTheme.zIndex.appBar,
            backgroundColor: isDarkMode ? muiTheme.palette.background.paper : '#fff',
            borderBottom: `1px solid ${isDarkMode ? muiTheme.palette.divider : '#e0e0e0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            transition: 'all 0.3s ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={handleDrawerToggle} 
              sx={{ 
                mr: 2,
                color: isDarkMode ? muiTheme.palette.text.primary : 'inherit'
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#4CAF50'
              }}
            >
              WATIFY
            </Typography>
          </Box>
          <IconButton 
            onClick={logout}
            sx={{ 
              color: isDarkMode ? muiTheme.palette.text.primary : 'inherit'
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: `1px solid ${isDarkMode ? muiTheme.palette.divider : '#e0e0e0'}`,
              backgroundColor: isDarkMode ? muiTheme.palette.background.paper : '#ffffff',
              transition: 'all 0.3s ease'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              backgroundColor: isDarkMode ? muiTheme.palette.background.paper : '#ffffff',
              transition: 'background-color 0.3s ease'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: isDarkMode ? muiTheme.palette.background.default : '#f5f5f5',
          minHeight: '100vh',
          marginTop: isMobile ? '64px' : 0,
          position: 'relative',
          transition: 'background-color 0.3s ease'
        }}
      >
        {/* Desktop Logout Button - Top Right */}
        {!isMobile && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <IconButton
              onClick={logout}
              sx={{
                backgroundColor: isDarkMode 
                  ? 'rgba(244, 67, 54, 0.15)' 
                  : 'rgba(244, 67, 54, 0.1)',
                border: isDarkMode 
                  ? '1px solid rgba(244, 67, 54, 0.3)' 
                  : '1px solid rgba(244, 67, 54, 0.2)',
                color: '#f44336',
                padding: '12px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(244, 67, 54, 0.3)'
                  : '0 4px 12px rgba(244, 67, 54, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isDarkMode 
                    ? 'rgba(244, 67, 54, 0.25)' 
                    : 'rgba(244, 67, 54, 0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: isDarkMode 
                    ? '0 6px 20px rgba(244, 67, 54, 0.4)'
                    : '0 6px 20px rgba(244, 67, 54, 0.3)',
                }
              }}
            >
              <LogoutIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        )}
        
        {getPageContent()}
      </Box>
    </Box>
  );
};

export default Dashboard; 


