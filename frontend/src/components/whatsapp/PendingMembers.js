import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  Pagination,
  useTheme,
  CircularProgress,
  Alert,
  Button,
  Checkbox,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { STORAGE_KEYS } from '../../utils/config';

const PendingMembers = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { isDarkMode } = useCustomTheme();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [actionLoading, setActionLoading] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch pending members data
  const fetchPendingMembers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: search,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };

      const result = await whatsappGroupApi.getPendingMembers(params);
      setMembers(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.totalItems || 0);
      setCurrentPage(result.pagination?.currentPage || 1);
    } catch (error) {
      console.error('Fetch pending members error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to fetch pending members'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMembers(currentPage, searchTerm);
  }, [currentPage]);

  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      setCurrentPage(1);
      fetchPendingMembers(1, searchTerm);
    }
  };

  // Handle member selection
  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(member => member.id));
    }
  };

  // Handle menu actions
  const handleMenuClick = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  // Handle member status updates
  const updateMemberStatus = async (memberIds, status) => {
    try {
      setActionLoading(true);
      
      if (memberIds.length === 1) {
        // Single update
        await whatsappGroupApi.updateMemberStatus(memberIds[0], status);
      } else {
        // Bulk update
        await whatsappGroupApi.bulkUpdateMemberStatus(memberIds, status);
      }

      const statusMessages = {
        active: 'approved',
        rejected: 'rejected'
      };

      setAlert({
        show: true,
        type: 'success',
        message: `Successfully ${statusMessages[status]} ${memberIds.length} member(s)`
      });

      // Refresh the list
      fetchPendingMembers(currentPage, searchTerm);
      setSelectedMembers([]);
      
    } catch (error) {
      console.error('Update member status error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to update member status'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMember = () => {
    updateMemberStatus([selectedMember.id], 'active');
    handleMenuClose();
  };

  const handleRejectMember = () => {
    updateMemberStatus([selectedMember.id], 'rejected');
    handleMenuClose();
  };

  const handleBulkApprove = () => {
    if (selectedMembers.length > 0) {
      updateMemberStatus(selectedMembers, 'active');
    }
  };

  const handleBulkReject = () => {
    if (selectedMembers.length > 0) {
      updateMemberStatus(selectedMembers, 'rejected');
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
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard/whatsapp/members')}
          sx={{ 
            color: muiTheme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Members
        </Link>
        <Typography 
          variant="body2" 
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          Pending List
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
          Pending Member List
        </Typography>
        
        {selectedMembers.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleBulkApprove}
              disabled={actionLoading}
              sx={{
                backgroundColor: '#22c55e',
                color: 'white',
                '&:hover': { backgroundColor: '#16a34a' }
              }}
            >
              Approve ({selectedMembers.length})
            </Button>
            <Button
              variant="contained"
              startIcon={<CloseIcon />}
              onClick={handleBulkReject}
              disabled={actionLoading}
              sx={{
                backgroundColor: '#ef4444',
                color: 'white',
                '&:hover': { backgroundColor: '#dc2626' }
              }}
            >
              Reject ({selectedMembers.length})
            </Button>
          </Box>
        )}
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
            placeholder="Search by member name"
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
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={members.length > 0 && selectedMembers.length === members.length}
                    indeterminate={selectedMembers.length > 0 && selectedMembers.length < members.length}
                    onChange={handleSelectAll}
                    sx={{ 
                      color: '#22c55e',
                      '&.Mui-checked': { color: '#22c55e' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Group Name
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Member Name
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Member Number
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Created At ↓
                </TableCell>
                <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={40} sx={{ color: '#22c55e' }} />
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <PersonIcon sx={{ fontSize: 64, color: muiTheme.palette.text.disabled }} />
                      <Typography variant="h6" sx={{ color: muiTheme.palette.text.secondary }}>
                        No Data
                      </Typography>
                      <Typography variant="body2" sx={{ color: muiTheme.palette.text.disabled }}>
                        No pending members found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow 
                    key={member.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: muiTheme.palette.action.hover 
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleSelectMember(member.id)}
                        sx={{ 
                          color: '#22c55e',
                          '&.Mui-checked': { color: '#22c55e' }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.primary, fontWeight: 'medium' }}>
                        {member.group_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.primary }}>
                        {member.member_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.secondary }}>
                        {member.member_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        sx={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: muiTheme.palette.text.secondary, fontSize: '0.875rem' }}>
                        {formatDate(member.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, member)}
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
      </Paper>

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
        <MenuItem onClick={handleApproveMember} sx={{ color: '#22c55e' }}>
          <CheckIcon sx={{ mr: 1 }} />
          Approve Member
        </MenuItem>
        <MenuItem onClick={handleRejectMember} sx={{ color: '#ef4444' }}>
          <CloseIcon sx={{ mr: 1 }} />
          Reject Member
        </MenuItem>
      </Menu>

      {/* Summary */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
          Showing {members.length} of {totalItems} pending members
        </Typography>
      </Box>
    </Box>
  );
};

export default PendingMembers; 