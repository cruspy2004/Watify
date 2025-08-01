import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  useTheme,
  TextField,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { STORAGE_KEYS } from '../../utils/config';

const AddMember = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { isDarkMode } = useCustomTheme();
  
  const [formData, setFormData] = useState({
    group_id: '',
    memberMethod: 'import_excel',
    member_name: '',
    member_number: ''
  });
  
  const [groups, setGroups] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

  // Fetch groups for dropdown
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Use real WhatsApp groups API
        const result = await whatsappGroupApi.getRealWhatsAppGroups();
        
        if (result.status === 'success') {
          // Filter to show only admin groups since only admins can add members
          const adminGroups = result.data.groups.filter(group => group.isAdmin);
          setGroups(adminGroups);
          
          if (adminGroups.length === 0) {
            setAlert({
              show: true,
              type: 'warning',
              message: 'No WhatsApp groups found where you are admin. Only admins can add members.'
            });
          }
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
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberMethodChange = (e) => {
    setFormData(prev => ({
      ...prev,
      memberMethod: e.target.value
    }));
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setAlert({ show: false, type: 'success', message: '' });
      } else {
        setAlert({
          show: true,
          type: 'error',
          message: 'Please select a valid Excel file (.xlsx or .xls)'
        });
        e.target.value = '';
      }
    }
  };

  const downloadSampleExcel = async () => {
    try {
      const blob = await whatsappGroupApi.downloadSampleExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'members-sample.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to download sample file'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.group_id) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please select a group'
      });
      return;
    }

    if (formData.memberMethod === 'import_excel' && !selectedFile) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please select an Excel file'
      });
      return;
    }

    if (formData.memberMethod === 'add_manually') {
      if (!formData.member_name.trim() || !formData.member_number.trim()) {
        setAlert({
          show: true,
          type: 'error',
          message: 'Member name and number are required'
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      if (formData.memberMethod === 'import_excel') {
        // Import from Excel
        const formDataToSend = new FormData();
        formDataToSend.append('group_id', formData.group_id);
        formDataToSend.append('excel_file', selectedFile);

        const result = await whatsappGroupApi.importMembersFromExcel(formDataToSend);
        
        setAlert({
          show: true,
          type: 'success',
          message: `Successfully imported ${result.data.successful} members. ${result.data.failed} failed.`
        });
      } else {
        // Add manually
        const result = await whatsappGroupApi.addMember({
          group_id: formData.group_id,
          member_name: formData.member_name.trim(),
          member_number: formData.member_number.trim(),
          status: 'pending'
        });

        setAlert({
          show: true,
          type: 'success',
          message: 'Member added successfully!'
        });
      }

      // Reset form
      setFormData({
        group_id: formData.group_id, // Keep group selected
        memberMethod: 'import_excel',
        member_name: '',
        member_number: ''
      });
      setSelectedFile(null);
      
      // Redirect to pending members after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/whatsapp/members/pending');
      }, 2000);
      
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to add members'
      });
    } finally {
      setLoading(false);
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
          Add
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4, 
          fontWeight: 'bold',
          color: muiTheme.palette.text.primary
        }}
      >
        Add members to a group
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

      {/* Form */}
      <Paper 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 4,
          backgroundColor: muiTheme.palette.background.paper,
          border: `1px solid ${muiTheme.palette.divider}`,
          borderRadius: 2
        }}
      >
        {/* Group Selection */}
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>
            Select Group
          </InputLabel>
          <Select
            name="group_id"
            value={formData.group_id}
            onChange={handleInputChange}
            required
            disabled={loadingGroups}
            sx={{
              backgroundColor: muiTheme.palette.background.default,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: muiTheme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: muiTheme.palette.primary.main,
              },
              '& .MuiSelect-select': {
                color: muiTheme.palette.text.primary,
              }
            }}
          >
            {loadingGroups ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                Loading groups...
              </MenuItem>
            ) : (
              groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name} ({group.participantCount} members) {group.isAdmin && '👑'}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Group Members Section */}
        <FormControl component="fieldset" sx={{ mb: 4 }}>
          <FormLabel 
            component="legend" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: muiTheme.palette.text.primary
            }}
          >
            Group Members
          </FormLabel>
          
          <RadioGroup
            value={formData.memberMethod}
            onChange={handleMemberMethodChange}
            sx={{ mb: 3 }}
          >
            <FormControlLabel
              value="import_excel"
              control={
                <Radio 
                  sx={{ 
                    color: '#22c55e',
                    '&.Mui-checked': { color: '#22c55e' }
                  }} 
                />
              }
              label={
                <Typography sx={{ color: muiTheme.palette.text.primary }}>
                  Import Excel
                </Typography>
              }
            />
            <FormControlLabel
              value="add_manually"
              control={
                <Radio 
                  sx={{ 
                    color: muiTheme.palette.text.secondary,
                    '&.Mui-checked': { color: '#22c55e' }
                  }} 
                />
              }
              label={
                <Typography sx={{ color: muiTheme.palette.text.primary }}>
                  Add Manually
                </Typography>
              }
            />
          </RadioGroup>

          {/* Excel Import Section */}
          {formData.memberMethod === 'import_excel' && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={downloadSampleExcel}
                startIcon={<DownloadIcon />}
                sx={{
                  color: muiTheme.palette.text.primary,
                  borderColor: muiTheme.palette.divider,
                  backgroundColor: muiTheme.palette.background.default,
                  '&:hover': {
                    borderColor: muiTheme.palette.primary.main,
                    backgroundColor: muiTheme.palette.action.hover
                  }
                }}
              >
                Download Sample
              </Button>
              
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                sx={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  '&:hover': { backgroundColor: '#16a34a' }
                }}
              >
                Upload Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                />
              </Button>
              
              {selectedFile && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    alignSelf: 'center',
                    color: muiTheme.palette.text.secondary,
                    ml: 1
                  }}
                >
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>
          )}

          {/* Manual Add Section */}
          {formData.memberMethod === 'add_manually' && (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                name="member_name"
                label="Member Name"
                value={formData.member_name}
                onChange={handleInputChange}
                required
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
                  '& .MuiInputLabel-root': {
                    color: muiTheme.palette.text.secondary,
                  },
                  '& .MuiOutlinedInput-input': {
                    color: muiTheme.palette.text.primary,
                  }
                }}
              />
              
              <TextField
                name="member_number"
                label="Member Number"
                value={formData.member_number}
                onChange={handleInputChange}
                required
                placeholder="+923001234567"
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
                  '& .MuiInputLabel-root': {
                    color: muiTheme.palette.text.secondary,
                  },
                  '& .MuiOutlinedInput-input': {
                    color: muiTheme.palette.text.primary,
                  }
                }}
              />
            </Box>
          )}
        </FormControl>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{
              backgroundColor: '#22c55e',
              color: 'white',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              '&:hover': { backgroundColor: '#16a34a' },
              '&:disabled': { 
                backgroundColor: muiTheme.palette.action.disabledBackground,
                color: muiTheme.palette.action.disabled
              }
            }}
          >
            {loading ? 'Adding...' : 'Submit'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddMember; 