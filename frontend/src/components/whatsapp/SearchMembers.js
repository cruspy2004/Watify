import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Breadcrumbs,
  Link,
  Pagination,
  useTheme,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { STORAGE_KEYS } from '../../utils/config';

const SearchMembers = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { isDarkMode } = useCustomTheme();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  
  const itemsPerPage = 10;

  // Perform search
  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim()) {
      setAlert({
        show: true,
        type: 'warning',
        message: 'Please enter a member name or number to search'
      });
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm.trim(),
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sortBy: 'member_name',
        sortOrder: 'ASC'
      });

      const response = await fetch(`/api/whatsapp-groups/members/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalItems(result.pagination?.totalItems || 0);
        setCurrentPage(result.pagination?.currentPage || 1);
        setSearched(true);
        
        if (result.data.length === 0) {
          setAlert({
            show: true,
            type: 'info',
            message: `No members found matching "${searchTerm.trim()}"`
          });
        } else {
          setAlert({
            show: true,
            type: 'success',
            message: `Found ${result.pagination?.totalItems || 0} member(s) matching "${searchTerm.trim()}"`
          });
        }
      } else {
        throw new Error('Failed to search members');
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to search members'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearchInput = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      handleSearch(1);
    }
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    handleSearch(1);
  };

  // Handle pagination
  const handlePageChange = (e, page) => {
    setCurrentPage(page);
    handleSearch(page);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearched(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalItems(0);
    setAlert({ show: false, type: 'success', message: '' });
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
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
          onClick={() => navigate('/dashboard/whatsapp/members')}
          sx={{ 
            color: muiTheme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Whatsapp Member
        </Link>
        <Typography 
          variant="body2" 
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          Search
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: muiTheme.palette.text.primary
        }}
      >
        Search member details
      </Typography>

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
      <Card sx={{ 
        mb: 4,
        backgroundColor: muiTheme.palette.background.paper,
        border: `1px solid ${muiTheme.palette.divider}`
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              fontWeight: 'bold',
              color: muiTheme.palette.text.primary
            }}
          >
            Member Profile Search
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 3,
              color: muiTheme.palette.text.secondary
            }}
          >
            Search member and its respective groups details
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Type member name or number here..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchInput}
              disabled={loading}
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
              onClick={handleSearchClick}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{
                backgroundColor: '#22c55e',
                color: 'white',
                px: 3,
                py: 1.5,
                minWidth: 120,
                '&:hover': { backgroundColor: '#16a34a' },
                '&:disabled': { 
                  backgroundColor: muiTheme.palette.action.disabledBackground,
                  color: muiTheme.palette.action.disabled
                }
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
            
            {searched && (
              <Button
                variant="outlined"
                onClick={clearSearch}
                sx={{
                  color: muiTheme.palette.text.primary,
                  borderColor: muiTheme.palette.divider,
                  '&:hover': {
                    borderColor: muiTheme.palette.primary.main,
                    backgroundColor: muiTheme.palette.action.hover
                  }
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searched && (
        <Paper sx={{ 
          backgroundColor: muiTheme.palette.background.paper,
          border: `1px solid ${muiTheme.palette.divider}`
        }}>
          {/* Results Header */}
          <Box sx={{ p: 3, borderBottom: `1px solid ${muiTheme.palette.divider}` }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: muiTheme.palette.text.primary
              }}
            >
              Search Results
              {totalItems > 0 && (
                <Chip 
                  label={`${totalItems} found`}
                  sx={{ 
                    ml: 2,
                    backgroundColor: '#22c55e',
                    color: 'white'
                  }}
                />
              )}
            </Typography>
          </Box>

          {/* Results Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: muiTheme.palette.background.default }}>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    Avatar
                  </TableCell>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    Member Name
                  </TableCell>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    Member Number
                  </TableCell>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    Current Group
                  </TableCell>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    All Groups
                  </TableCell>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ color: muiTheme.palette.text.primary, fontWeight: 'bold' }}>
                    Joined At
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
                ) : searchResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <PersonIcon sx={{ fontSize: 64, color: muiTheme.palette.text.disabled }} />
                        <Typography variant="h6" sx={{ color: muiTheme.palette.text.secondary }}>
                          No Results Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: muiTheme.palette.text.disabled }}>
                          Try searching with different keywords
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  searchResults.map((member, index) => (
                    <TableRow 
                      key={`${member.id}-${index}`}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: muiTheme.palette.action.hover 
                        }
                      }}
                    >
                      <TableCell>
                        <Avatar sx={{ backgroundColor: '#22c55e', width: 40, height: 40 }}>
                          <PersonIcon />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: muiTheme.palette.text.primary, fontWeight: 'medium' }}>
                          {member.member_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: muiTheme.palette.text.secondary }}>
                          {member.member_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupIcon sx={{ color: muiTheme.palette.text.secondary, fontSize: 20 }} />
                          <Typography sx={{ color: muiTheme.palette.text.primary }}>
                            {member.group_name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          sx={{ 
                            color: muiTheme.palette.text.secondary,
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={member.all_groups}
                        >
                          {member.all_groups || member.group_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          sx={{
                            backgroundColor: getStatusColor(member.status),
                            color: 'white',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: muiTheme.palette.text.secondary, fontSize: '0.875rem' }}>
                          {member.joined_at ? formatDate(member.joined_at) : 'N/A'}
                        </Typography>
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
                onChange={handlePageChange}
                color="primary"
                disabled={loading}
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

          {/* Summary */}
          {searched && searchResults.length > 0 && (
            <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${muiTheme.palette.divider}` }}>
              <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
                Showing {searchResults.length} of {totalItems} results for "{searchTerm}"
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SearchMembers; 