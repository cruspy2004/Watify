import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Mail as MailIcon,
  Warning as WarningIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { validateParticipantsList } from '../../utils/validation';

const STORAGE_KEYS = {
  TOKEN: 'wateen_watify_token'
};

const AddMembersToGroup = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [result, setResult] = useState(null);

  // Load available groups on component mount
  useEffect(() => {
    loadAvailableGroups();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadAvailableGroups = async () => {
    setGroupsLoading(true);
    try {
      // Get real WhatsApp groups from WhatsApp client
      const response = await whatsappGroupApi.getRealWhatsAppGroups();

      if (response.status === 'success') {
        // Filter to show only groups where user is admin (since only admins can add members)
        const adminGroups = response.data.groups.filter(group => group.isAdmin);
        setGroups(adminGroups);
        
        if (adminGroups.length === 0) {
          setAlert({
            show: true,
            type: 'warning',
            message: 'No WhatsApp groups found where you are admin. Only admins can add members to groups.'
          });
        } else {
          setAlert({
            show: true,
            type: 'info',
            message: `Loaded ${adminGroups.length} groups where you are admin. You can add members to these groups.`
          });
        }
      } else {
        throw new Error(response.message || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading WhatsApp groups:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to load WhatsApp groups. Please ensure WhatsApp is connected and try again.'
      });
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedGroupId) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please select a WhatsApp group'
      });
      return;
    }

    const rawList = phoneNumbers
      .split('\n')
      .map(p=>p.trim())
      .filter(Boolean);

    const validation = validateParticipantsList(rawList);
    if (validation.valid.length === 0) {
      setAlert({ show:true, type:'error', message:'No valid phone numbers found' });
      return;}

    setLoading(true);
    setAlert({ show: false });
    setResult(null);
    
    try {
      console.log('Adding members to group:', selectedGroupId);
      console.log('Participants:', validation.valid);

      const response = await fetch(`/api/whatsapp/groups/${selectedGroupId}/members/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participants: validation.valid
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setResult(data.data);
        setAlert({
          show: true,
          type: 'success',
          message: data.message
        });
        
        // Clear form on success
        setPhoneNumbers('');
      } else {
        setAlert({
          show: true,
          type: 'error',
          message: data.message || 'Failed to add members'
        });
      }
    } catch (error) {
      console.error('Error adding members:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedGroupName = () => {
    const group = groups.find(g => g.id === selectedGroupId);
    return group ? group.name : 'Unknown Group';
  };

  const ResultsSummary = ({ summary }) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        📊 Summary
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip 
          icon={<CheckCircleIcon />} 
          label={`Added: ${summary.successful}`} 
          color="success" 
          variant="outlined" 
        />
        <Chip 
          icon={<MailIcon />} 
          label={`Invited: ${summary.invited}`} 
          color="info" 
          variant="outlined" 
        />
        <Chip 
          icon={<WarningIcon />} 
          label={`Already Members: ${summary.alreadyMembers}`} 
          color="warning" 
          variant="outlined" 
        />
        <Chip 
          icon={<ErrorIcon />} 
          label={`Failed: ${summary.failed}`} 
          color="error" 
          variant="outlined" 
        />
      </Box>
    </Box>
  );

  const ResultsList = ({ results, title, icon, color }) => {
    if (!results || results.length === 0) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography>{title} ({results.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {results.map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {React.cloneElement(icon, { color })}
                </ListItemIcon>
                <ListItemText
                  primary={`📞 ${item.phone}`}
                  secondary={item.message}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AddIcon color="primary" />
          <Typography variant="h5" component="h2">
            Add Members to WhatsApp Group
          </Typography>
        </Box>

        {alert.show && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 2 }}
            onClose={() => setAlert({ show: false })}
          >
            {alert.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select WhatsApp Group</InputLabel>
            <Select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              label="Select WhatsApp Group"
              disabled={groupsLoading}
              startAdornment={groupsLoading ? <CircularProgress size={20} /> : <GroupIcon />}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box>
                    <Typography variant="body1">
                      {group.name} 
                      {group.isAdmin && ' 👑'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Members: {group.participantCount || 0} | Admin: {group.isAdmin ? 'Yes' : 'No'}
                    </Typography>
                    {group.unreadCount > 0 && (
                      <Typography variant="caption" color="error">
                        {group.unreadCount} unread messages
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={8}
            label="Phone Numbers"
            placeholder="Enter phone numbers (one per line)&#10;923363448803&#10;+923001234567&#10;03331234567&#10;+447700123456"
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            sx={{ mb: 3 }}
            helperText="Enter phone numbers with country codes, one per line. Maximum 50 numbers per request."
            required
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              disabled={loading || groupsLoading}
              sx={{ minWidth: 150 }}
            >
              {loading ? 'Adding Members...' : 'Add Members'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={loadAvailableGroups}
              disabled={groupsLoading}
              startIcon={groupsLoading ? <CircularProgress size={16} /> : <GroupIcon />}
            >
              Refresh Groups
            </Button>
          </Box>
        </form>

        {result && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              📱 Results for "{getSelectedGroupName()}"
            </Typography>
            
            <ResultsSummary summary={result.summary} />
            
            <Box sx={{ mt: 2 }}>
              <ResultsList
                results={result.results?.successful}
                title="Successfully Added"
                icon={<CheckCircleIcon />}
                color="success"
              />
              
              <ResultsList
                results={result.results?.invited}
                title="Private Invitations Sent"
                icon={<MailIcon />}
                color="info"
              />
              
              <ResultsList
                results={result.results?.alreadyMembers}
                title="Already Group Members"
                icon={<WarningIcon />}
                color="warning"
              />
              
              <ResultsList
                results={result.results?.failed}
                title="Failed to Add"
                icon={<ErrorIcon />}
                color="error"
              />
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>💡 Tips:</strong>
                <br />
                • Check your WhatsApp app to see the new members
                <br />
                • "Private Invitations" are sent to users who restrict automatic group additions
                <br />
                • Failed additions may be due to invalid numbers or privacy settings
              </Typography>
            </Alert>
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            📋 Instructions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            1. Select a WhatsApp group from the dropdown<br />
            2. Enter phone numbers with country codes (one per line)<br />
            3. Click "Add Members" to send invitations<br />
            4. Check results and your WhatsApp app for confirmation<br />
            <br />
            <strong>Note:</strong> You must be an admin of the selected group to add members.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AddMembersToGroup; 