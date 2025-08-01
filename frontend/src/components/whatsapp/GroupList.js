import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
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
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Pagination,
  useTheme,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { STORAGE_KEYS } from '../../utils/config';
import './GroupList.css';

const GroupList = ({ onViewGroupDetails }) => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { isDarkMode } = useCustomTheme();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsGroup, setDetailsGroup] = useState(null);
  
  const itemsPerPage = 10;

  // Fetch groups data
  const fetchGroups = async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      // Use the real WhatsApp groups API
      const result = await whatsappGroupApi.getRealWhatsAppGroups();
      
      if (result.status === 'success') {
        let filteredGroups = result.data.groups || [];
        
        // Apply search filter if provided
        if (search.trim()) {
          filteredGroups = filteredGroups.filter(group =>
            group.name.toLowerCase().includes(search.toLowerCase()) ||
            group.description?.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        // Sort by creation date (most recent first)
        filteredGroups.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        // Manual pagination since we're getting all groups at once
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedGroups = filteredGroups.slice(startIndex, endIndex);
        
        setGroups(paginatedGroups);
        setTotalPages(Math.ceil(filteredGroups.length / itemsPerPage));
        setTotalItems(filteredGroups.length);
        setCurrentPage(page);
      } else {
        throw new Error(result.message || 'Failed to fetch groups');
      }
    } catch (error) {
      console.error('Fetch groups error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to fetch groups. Please ensure WhatsApp is connected.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(currentPage, searchTerm);
  }, [currentPage]);

  // Add visibility change listener to refresh data when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh the data
        fetchGroups(currentPage, searchTerm);
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh the data
      fetchGroups(currentPage, searchTerm);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentPage, searchTerm]);

  // Manual refresh function
  const handleRefresh = async () => {
    await fetchGroups(currentPage, searchTerm);
    setAlert({
      show: true,
      type: 'success',
      message: 'Group list refreshed successfully!'
    });
  };

  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      setCurrentPage(1);
      fetchGroups(1, searchTerm);
    }
  };

  // Handle menu actions
  const handleMenuClick = (event, group) => {
    setAnchorEl(event.currentTarget);
    setSelectedGroup(group);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGroup(null);
  };

  // Handle group actions
  const handleViewGroup = () => {
    setDetailsGroup(selectedGroup);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleEditGroup = () => {
    if (selectedGroup && selectedGroup.id) {
      navigate(`/dashboard/whatsapp/groups/${selectedGroup.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        const result = await whatsappGroupApi.deleteGroup(selectedGroup.id);
        
        setAlert({
          show: true,
          type: 'success',
          message: 'Group deleted successfully'
        });
        fetchGroups(currentPage, searchTerm);
      } catch (error) {
        console.error('Delete group error:', error);
        setAlert({
          show: true,
          type: 'error',
          message: error.message || 'Failed to delete group'
        });
      }
    }
    handleMenuClose();
  };

  // Generate group ID badge color
  const getGroupIdColor = (id) => {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[id % colors.length];
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

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        sx={{ 
          mb: 3,
          '& .MuiBreadcrumbs-separator': {
            color: muiTheme.palette.text.secondary
          }
        }}
      >
        <Link 
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard')}
          sx={{ 
            color: muiTheme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard/whatsapp/groups')}
          sx={{ 
            color: muiTheme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Group
        </Link>
        <Typography 
          variant="body2" 
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          List
        </Typography>
      </Breadcrumbs>

      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            color: muiTheme.palette.text.primary
          }}
        >
          Group List
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/whatsapp/groups/create')}
          sx={{
            backgroundColor: '#22c55e',
            color: 'white',
            px: 3,
            py: 1.5,
            fontWeight: 'bold',
            '&:hover': { backgroundColor: '#16a34a' }
          }}
        >
          Create Whatsapp Group
        </Button>
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

      {/* Search Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: muiTheme.palette.background.paper,
        border: `1px solid ${muiTheme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search by group name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: muiTheme.palette.text.secondary, mr: 1 }} />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: muiTheme.palette.background.default,
                '& fieldset': {
                  borderColor: muiTheme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: muiTheme.palette.primary.main,
                },
              },
              '& .MuiOutlinedInput-input': {
                color: muiTheme.palette.text.primary,
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              backgroundColor: '#22c55e',
              color: 'white',
              px: 3,
              '&:hover': { backgroundColor: '#16a34a' }
            }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Table Section */}
      <Paper sx={{ 
        backgroundColor: muiTheme.palette.background.paper,
        border: `1px solid ${muiTheme.palette.divider}`
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: muiTheme.palette.background.default }}>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Group ID
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Profile Picture
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Group
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Description
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  No. Of Members
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Create At
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={40} sx={{ color: '#22c55e' }} />
                  </TableCell>
                </TableRow>
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <GroupIcon sx={{ fontSize: 64, color: muiTheme.palette.text.disabled }} />
                      <Typography variant="h6" sx={{ color: muiTheme.palette.text.secondary }}>
                        No Data
                      </Typography>
                      <Typography variant="body2" sx={{ color: muiTheme.palette.text.disabled }}>
                        No groups found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow 
                    key={group.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: muiTheme.palette.action.hover 
                      }
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`ID# ${group.id}`}
                        sx={{
                          backgroundColor: getGroupIdColor(group.id),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Avatar sx={{ backgroundColor: muiTheme.palette.grey[400] }}>
                        <GroupIcon />
                      </Avatar>
                    </TableCell>
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
                      <IconButton
                        onClick={(e) => handleMenuClick(e, group)}
                        sx={{ color: muiTheme.palette.text.secondary }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                color: muiTheme.palette.text.primary,
              },
              '& .Mui-selected': {
                backgroundColor: '#22c55e !important',
                color: 'white',
              }
            }}
          />
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: muiTheme.palette.background.paper,
            border: `1px solid ${muiTheme.palette.divider}`,
          }
        }}
      >
        <MenuItem onClick={handleViewGroup}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditGroup}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Group
        </MenuItem>
        <MenuItem onClick={handleDeleteGroup} sx={{ color: '#ef4444' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Group
        </MenuItem>
      </Menu>

      {/* Summary */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
          Showing {groups.length} of {totalItems} groups
        </Typography>
      </Box>

      {/* Group Details Dialog */}
      {detailsGroup && (
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Group Details</DialogTitle>
          <DialogContent dividers>
            <Typography gutterBottom><b>Group Name:</b> {detailsGroup.name}</Typography>
            <Typography gutterBottom><b>Group ID:</b> {detailsGroup.id}</Typography>
            <Typography gutterBottom><b>Description:</b> {detailsGroup.description || '-'}</Typography>
            <Typography gutterBottom><b>Number of Members:</b> {detailsGroup.participantCount || 0}</Typography>
            <Typography gutterBottom><b>Status:</b> {detailsGroup.archived ? 'Archived' : 'Active'}</Typography>
            <Typography gutterBottom><b>Admin:</b> {detailsGroup.isAdmin ? 'Yes' : 'No'}</Typography>
            <Typography gutterBottom><b>Created At:</b> {formatDate(detailsGroup.createdAt)}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default GroupList; 
