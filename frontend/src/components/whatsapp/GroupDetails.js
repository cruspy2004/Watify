import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Grid,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { whatsappGroupApi } from '../../services/whatsappApi';

const GroupDetails = ({ groupId, onBack }) => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  
  
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Fetch group details
  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      
      const result = await whatsappGroupApi.getGroupById(groupId);
      
      // Backend returns {success: true, data: groupData}, so extract the data
      setGroup(result.data || result); 
      
    } catch (error) {
      console.error('Fetch group details error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: `Failed to fetch group details: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch group members
  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      
      const result = await whatsappGroupApi.getGroupMembers(groupId);
      
      // Backend returns {success: true, data: membersArray}, so extract the data
      setMembers(result.data || []);
    } catch (error) {
      console.error('Fetch members error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: `Failed to fetch group members: ${error.message}`
      });
    } finally {
      setMembersLoading(false);
    }
  };

  // Add member to group
  const handleAddMember = async () => {
    if (!newMemberPhone.trim()) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please enter a phone number'
      });
      return;
    }

    try {
      setAddingMember(true);
      const result = await whatsappGroupApi.addMemberToGroup(groupId, {
        member_number: newMemberPhone, member_name: `Member_${Date.now()}`,  // Auto-generate member name
        status: 'active'
      });
      
      setAlert({
        show: true,
        type: 'success',
        message: result.message || 'Member added successfully'
      });
      
      setNewMemberPhone('');
      setAddMemberDialog(false);
      
      // Refresh group details and members
      fetchGroupDetails();
      fetchMembers();
    } catch (error) {
      console.error('Add member error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to add member'
      });
    } finally {
      setAddingMember(false);
    }
  };

  // Remove member from group
  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        const result = await whatsappGroupApi.removeMemberFromGroup(groupId, memberId);
        setAlert({
          show: true,
          type: 'success',
          message: result.message || 'Member removed successfully'
        });
        
        // Refresh group details and members
        fetchGroupDetails();
        fetchMembers();
      } catch (error) {
        console.error('Remove member error:', error);
        setAlert({
          show: true,
          type: 'error',
          message: error.message || 'Failed to remove member'
        });
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchMembers();
    }
  }, [groupId]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={50} sx={{ color: '#22c55e' }} />
        <Typography variant="body1" color="text.secondary">
          Loading group details...
        </Typography>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Group not found
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back to Groups
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%', backgroundColor: muiTheme.palette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={onBack} 
          sx={{ 
            mr: 2, 
            color: muiTheme.palette.text.secondary,
            backgroundColor: muiTheme.palette.background.paper,
            '&:hover': { backgroundColor: muiTheme.palette.action.hover }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: muiTheme.palette.text.primary }}>
          Group Details
        </Typography>
      </Box>

      {/* Alert */}
      {alert.show && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlert({ show: false, type: 'success', message: '' })}
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Group Information Card */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            backgroundColor: muiTheme.palette.background.paper,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            mb: 3
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 100, 
                  height: 100, 
                  mr: 3, 
                  backgroundColor: '#22c55e',
                  boxShadow: '0 4px 8px rgba(34, 197, 94, 0.3)'
                }}>
                  <WhatsAppIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: muiTheme.palette.text.primary }}>
                    {group?.group_name || 'Loading...'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`ID: ${group?.id || 'Loading...'}`}
                      sx={{ backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}
                    />
                    <Chip
                      label={group?.status || 'Loading...'}
                      sx={{ 
                        backgroundColor: (group?.status === 'active') ? '#22c55e' : '#6b7280',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ color: '#22c55e', fontWeight: 'bold' }}>
                      {group?.member_count || 0} Members
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InfoIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Description
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {group?.description || 'No description provided'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTimeIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Created At
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {group?.created_at ? formatDate(group.created_at) : "Date not available"}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WhatsAppIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      WhatsApp Group ID
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {group?.whatsapp_group_id || 'Not connected'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      Group Type
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    WhatsApp Business Group
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions Card */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            backgroundColor: muiTheme.palette.background.paper,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddMemberDialog(true)}
                  sx={{ 
                    backgroundColor: '#22c55e', 
                    '&:hover': { backgroundColor: '#16a34a' },
                    py: 1.5,
                    fontWeight: 'bold'
                  }}
                  fullWidth
                >
                  Add Member
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    fetchGroupDetails();
                    fetchMembers();
                  }}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                  fullWidth
                >
                  Refresh Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                  fullWidth
                >
                  Edit Group
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Members Table */}
      <Card sx={{ 
        backgroundColor: muiTheme.palette.background.paper,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${muiTheme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <GroupIcon sx={{ mr: 1, color: '#22c55e' }} />
              Group Members ({members.length})
            </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: muiTheme.palette.background.default }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Join Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {membersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                      <CircularProgress size={30} sx={{ color: '#22c55e' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading members...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                      <PersonIcon sx={{ fontSize: 48, color: muiTheme.palette.text.disabled, mb: 1 }} />
                      <Typography color="text.secondary" variant="h6">
                        No members found
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Add your first member to get started
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member, index) => (
                    <TableRow 
                      key={member.id}
                      sx={{ 
                        '&:hover': { backgroundColor: muiTheme.palette.action.hover },
                        borderBottom: index === members.length - 1 ? 'none' : `1px solid ${muiTheme.palette.divider}`
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, backgroundColor: '#e3f2fd' }}>
                            <PersonIcon sx={{ color: '#1976d2' }} />
                          </Avatar>
                          <Typography sx={{ fontWeight: 'medium' }}>
                            Member #{member.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary, fontSize: 18 }} />
                          <Typography>{member.member_number}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={member.status}
                          sx={{
                            backgroundColor: member.status === 'active' ? '#22c55e' : '#6b7280',
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2">
                          {formatDate(member.joined_at || member.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <IconButton
                          onClick={() => handleRemoveMember(member.id)}
                          sx={{ 
                            color: '#ef4444',
                            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                          }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog 
        open={addMemberDialog} 
        onClose={() => setAddMemberDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Add New Member
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the phone number of the member you want to add to this group.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={newMemberPhone}
            onChange={(e) => setNewMemberPhone(e.target.value)}
            placeholder="e.g., +923001234567"
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <PhoneIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary }} />
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setAddMemberDialog(false)}
            disabled={addingMember}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddMember}
            variant="contained"
            disabled={addingMember}
            sx={{ 
              backgroundColor: '#22c55e', 
              '&:hover': { backgroundColor: '#16a34a' },
              minWidth: 120
            }}
          >
            {addingMember ? <CircularProgress size={20} color="inherit" /> : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupDetails; 
