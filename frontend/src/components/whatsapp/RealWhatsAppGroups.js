import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Grid,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Archive as ArchiveIcon,
  VolumeOff as MutedIcon,
  PushPin as PinnedIcon,
  WhatsApp as WhatsAppIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { useTheme } from '@mui/material/styles';

const STORAGE_KEYS = {
  TOKEN: 'wateen_watify_token'
};

const RealWhatsAppGroups = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [statistics, setStatistics] = useState(null);
  const [whatsappInfo, setWhatsappInfo] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, admin, member, archived
  const muiTheme = useTheme();

  useEffect(() => {
    loadRealWhatsAppGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, searchTerm, filter]);

  const filterGroups = () => {
    let filtered = groups;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filter) {
      case 'admin':
        filtered = filtered.filter(group => group.isAdmin);
        break;
      case 'member':
        filtered = filtered.filter(group => !group.isAdmin);
        break;
      case 'archived':
        filtered = filtered.filter(group => group.archived);
        break;
      default:
        // Show all non-archived by default
        filtered = filtered.filter(group => !group.archived);
        break;
    }

    setFilteredGroups(filtered);
  };

  const loadRealWhatsAppGroups = async () => {
    setLoading(true);
    setAlert({ show: false });

    try {
      console.log('📱 Loading real WhatsApp groups...');
      const response = await whatsappGroupApi.getRealWhatsAppGroups();

      if (response.status === 'success') {
        setGroups(response.data.groups || []);
        setStatistics(response.data.statistics);
        setWhatsappInfo(response.data.whatsappInfo);
        
        setAlert({
          show: true,
          type: 'success',
          message: `Successfully loaded ${response.data.groups?.length || 0} WhatsApp groups`
        });
      } else {
        throw new Error(response.message || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading WhatsApp groups:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to load WhatsApp groups. Please ensure WhatsApp is connected.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setDialogOpen(true);
  };

  const handleCopyInviteLink = (inviteLink) => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setAlert({
        show: true,
        type: 'success',
        message: 'Invite link copied to clipboard!'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return 'No messages';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const GroupCard = ({ group }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        border: group.isAdmin ? '2px solid #4caf50' : '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with status indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {group.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {group.isAdmin && (
              <Tooltip title="You are admin">
                <AdminIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            {group.pinned && (
              <Tooltip title="Pinned">
                <PinnedIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
            {group.muted && (
              <Tooltip title="Muted">
                <MutedIcon color="disabled" fontSize="small" />
              </Tooltip>
            )}
            {group.archived && (
              <Tooltip title="Archived">
                <ArchiveIcon color="disabled" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Description */}
        {group.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {group.description.length > 100 
              ? `${group.description.substring(0, 100)}...` 
              : group.description
            }
          </Typography>
        )}

        {/* Participants count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {group.participantCount} participants
          </Typography>
        </Box>

        {/* Last message info */}
        {group.lastMessage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Last message: {formatLastMessageTime(group.lastMessage.timestamp)}
            </Typography>
          </Box>
        )}

        {/* Status chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {group.isAdmin ? (
            <Chip label="Admin" size="small" color="success" variant="outlined" />
          ) : (
            <Chip label="Member" size="small" color="default" variant="outlined" />
          )}
          
          {group.unreadCount > 0 && (
            <Chip 
              label={`${group.unreadCount} unread`} 
              size="small" 
              color="error" 
              variant="outlined" 
            />
          )}
        </Box>

        {/* Group ID */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          ID: {group.id}
        </Typography>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => handleGroupClick(group)}
        >
          View Details
        </Button>
        
        {group.inviteLink && (
          <Button
            size="small"
            startIcon={<CopyIcon />}
            onClick={() => handleCopyInviteLink(group.inviteLink)}
          >
            Copy Invite
          </Button>
        )}
      </CardActions>
    </Card>
  );

  const GroupDetailsDialog = () => (
    <Dialog 
      open={dialogOpen} 
      onClose={() => setDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedGroup && (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon />
              {selectedGroup.name}
              {selectedGroup.isAdmin && <AdminIcon color="success" />}
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Basic Information
                </Typography>
                <Typography variant="body2"><strong>Name:</strong> {selectedGroup.name}</Typography>
                <Typography variant="body2"><strong>Description:</strong> {selectedGroup.description || 'No description'}</Typography>
                <Typography variant="body2"><strong>Participants:</strong> {selectedGroup.participantCount}</Typography>
                <Typography variant="body2"><strong>Created:</strong> {formatDate(selectedGroup.createdAt)}</Typography>
                <Typography variant="body2"><strong>Your Role:</strong> {selectedGroup.isAdmin ? 'Admin' : 'Member'}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                <Typography variant="body2"><strong>Unread Messages:</strong> {selectedGroup.unreadCount || 0}</Typography>
                <Typography variant="body2"><strong>Archived:</strong> {selectedGroup.archived ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2"><strong>Pinned:</strong> {selectedGroup.pinned ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2"><strong>Muted:</strong> {selectedGroup.muted ? 'Yes' : 'No'}</Typography>
              </Grid>

              {selectedGroup.inviteLink && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Invite Link
                  </Typography>
                  <TextField
                    fullWidth
                    value={selectedGroup.inviteLink}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => handleCopyInviteLink(selectedGroup.inviteLink)}>
                            <CopyIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Participants ({selectedGroup.participants?.length || 0})
                </Typography>
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedGroup.participants?.map((participant, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar>
                          {participant.isAdmin || participant.isSuperAdmin ? (
                            <AdminIcon fontSize="small" />
                          ) : (
                            <PersonIcon fontSize="small" />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={participant.id}
                        secondary={
                          participant.isSuperAdmin 
                            ? 'Super Admin' 
                            : participant.isAdmin 
                              ? 'Admin' 
                              : 'Member'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon color="success" />
          <Typography variant="h4">
            Real WhatsApp Groups
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={loadRealWhatsAppGroups}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Groups'}
        </Button>
      </Box>

      {alert.show && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlert({ show: false })}
        >
          {alert.message}
        </Alert>
      )}

      {/* WhatsApp Info */}
      {whatsappInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📱 Connected WhatsApp Account
            </Typography>
            <Typography variant="body2">
              <strong>Number:</strong> {whatsappInfo.connectedNumber}
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {whatsappInfo.pushname || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Platform:</strong> {whatsappInfo.platform || 'Unknown'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {statistics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2"><strong>Total Groups:</strong> {statistics.totalGroups}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2"><strong>Admin Groups:</strong> {statistics.adminGroups}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2"><strong>Member Groups:</strong> {statistics.memberGroups}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2"><strong>Total Participants:</strong> {statistics.totalParticipants}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['all', 'admin', 'member', 'archived'].map((filterType) => (
                  <Chip
                    key={filterType}
                    label={filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    onClick={() => setFilter(filterType)}
                    color={filter === filterType ? 'primary' : 'default'}
                    variant={filter === filterType ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <Paper sx={{ 
        backgroundColor: muiTheme.palette.background.paper,
        border: `1px solid ${muiTheme.palette.divider}`,
        p: 2
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: muiTheme.palette.background.default }}>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Group Name
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Description
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Members
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Created At
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={40} sx={{ color: '#22c55e' }} />
                  </TableCell>
                </TableRow>
              ) : filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <GroupIcon sx={{ fontSize: 64, color: muiTheme.palette.text.disabled }} />
                      <Typography variant="h6" sx={{ color: muiTheme.palette.text.secondary }}>
                        No Data
                      </Typography>
                      <Typography variant="body2" sx={{ color: muiTheme.palette.text.disabled }}>
                        No WhatsApp Groups Found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.primary, fontWeight: 'medium' }}>
                        {group.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.secondary }}>
                        {group.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={group.participantCount || 0}
                        sx={{
                          backgroundColor: '#3b82f6',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={group.archived ? 'archived' : 'active'}
                        sx={{
                          backgroundColor: group.archived ? '#6b7280' : '#22c55e',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                      {group.isAdmin && (
                        <Chip
                          label="Admin"
                          size="small"
                          sx={{
                            ml: 1,
                            backgroundColor: '#f59e0b',
                            color: 'white'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.secondary, fontSize: '0.875rem' }}>
                        {formatDate(group.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleGroupClick(group)}
                      >
                        View Details
                      </Button>
                      {group.inviteLink && (
                        <Button
                          size="small"
                          startIcon={<CopyIcon />}
                          onClick={() => handleCopyInviteLink(group.inviteLink)}
                        >
                          Copy Invite
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Group Details Dialog */}
      <GroupDetailsDialog />
    </Box>
  );
};

export default RealWhatsAppGroups; 