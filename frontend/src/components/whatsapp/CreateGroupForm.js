import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
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
  Snackbar
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../../utils/config';

const CreateGroupForm = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { isDarkMode } = useCustomTheme();
  
  const [formData, setFormData] = useState({
    group_name: '',
    description: '',
    memberMethod: 'import_excel',
    initialParticipant: '' // Required for real WhatsApp group creation
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

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
      const response = await fetch('/api/whatsapp-groups/download-sample', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'members-sample.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to download sample file');
      }
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
    
    if (!formData.group_name.trim()) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Group name is required'
      });
      return;
    }

    if (!formData.initialParticipant.trim()) {
      setAlert({
        show: true,
        type: 'error',
        message: 'At least one participant phone number is required for WhatsApp group creation'
      });
      return;
    }

    if (formData.memberMethod === 'import_excel' && !selectedFile) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please select an Excel file or choose "Add Manually"'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create REAL WhatsApp group first (not just database entry)
      const groupResponse = await fetch('/api/whatsapp/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        },
        body: JSON.stringify({
          groupName: formData.group_name.trim(),
          participants: [formData.initialParticipant.trim()],
          description: formData.description.trim()
        })
      });

      if (!groupResponse.ok) {
        throw new Error('Failed to create group');
      }

      const groupResult = await groupResponse.json();
      console.log('WhatsApp Group Created:', groupResult);
      
      // The real WhatsApp endpoint returns different structure
      const whatsappGroupId = groupResult.data?.whatsappGroup?.id;
      const databaseGroupId = groupResult.data?.databaseGroup?.id;

      // If importing from Excel, upload the file
      if (formData.memberMethod === 'import_excel' && selectedFile && databaseGroupId) {
        const formDataToSend = new FormData();
        formDataToSend.append('group_id', databaseGroupId);
        formDataToSend.append('excel_file', selectedFile);

        const importResponse = await fetch('/api/whatsapp-groups/members/import', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
          },
          body: formDataToSend
        });

        if (!importResponse.ok) {
          throw new Error('Group created but failed to import members');
        }

        const importResult = await importResponse.json();
        
        setAlert({
          show: true,
          type: 'success',
          message: `WhatsApp group created successfully! Imported ${importResult.data.successful} members. Check your WhatsApp app!`
        });
      } else {
        setAlert({
          show: true,
          type: 'success',
          message: 'WhatsApp group created successfully! Check your WhatsApp app to see the new group.'
        });
      }

      // Reset form
      setFormData({
        group_name: '',
        description: '',
        memberMethod: 'import_excel',
        initialParticipant: ''
      });
      setSelectedFile(null);
      
      // Redirect to group list after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/whatsapp/groups');
      }, 2000);
      
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to create group'
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
          onClick={() => navigate('/dashboard/whatsapp/groups')}
          sx={{ 
            color: muiTheme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Whatsapp Group
        </Link>
        <Typography 
          variant="body2" 
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          Create
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
        Create a new whatsapp group
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
        {/* Group Name */}
        <TextField
          fullWidth
          name="group_name"
          label="Group Name"
          value={formData.group_name}
          onChange={handleInputChange}
          required
          sx={{ 
            mb: 3,
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

        {/* Description */}
        <TextField
          fullWidth
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleInputChange}
          multiline
          rows={4}
          sx={{ 
            mb: 4,
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

        {/* Initial Participant */}
        <TextField
          fullWidth
          name="initialParticipant"
          label="Initial Participant Phone Number"
          value={formData.initialParticipant}
          onChange={handleInputChange}
          required
          placeholder="e.g., +923363448803 or 923363448803"
          helperText="At least one participant is required to create a WhatsApp group. You can add more members later."
          sx={{ 
            mb: 4,
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
            },
            '& .MuiFormHelperText-root': {
              color: muiTheme.palette.text.secondary,
            }
          }}
        />

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
            {loading ? 'Creating...' : 'Submit'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateGroupForm; 