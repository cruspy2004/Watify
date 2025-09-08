import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  LinearProgress,
  Fab,
  Tooltip
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Settings from '../Settings';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [securityInfo, setSecurityInfo] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { login } = useAuth();
  const { isDarkMode, theme } = useCustomTheme();
  const navigate = useNavigate();

  // Enhanced password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      setSecurityInfo('');
      return;
    }

    let strength = 0;
    let info = [];

    // Length check
    if (password.length >= 8) {
      strength += 25;
      info.push('Good length');
    } else if (password.length >= 6) {
      strength += 15;
      info.push('Acceptable length');
    } else {
      info.push('Too short');
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      strength += 15;
      info.push('lowercase');
    }
    if (/[A-Z]/.test(password)) {
      strength += 15;
      info.push('UPPERCASE');
    }
    if (/[0-9]/.test(password)) {
      strength += 15;
      info.push('numbers');
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 30;
      info.push('special chars');
    }

    setPasswordStrength(Math.min(strength, 100));
    setSecurityInfo(info.join(', '));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    setError('');

    // Check password strength for feedback (not validation)
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clear password strength indicator during login
      setPasswordStrength(0);
      setSecurityInfo('');

      const result = await login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Success feedback
      toast.success('🎉 Login successful! Welcome to Watify', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Clear form data for security
      setFormData({ email: '', password: '' });
      
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      // Security: Clear password field on failed login
      setFormData(prev => ({ ...prev, password: '' }));
      
      toast.error('🔒 ' + errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Auto-hide password after 10 seconds when visible
  useEffect(() => {
    if (showPassword) {
      const timer = setTimeout(() => {
        setShowPassword(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#f44336';
    if (passwordStrength < 50) return '#ff9800';
    if (passwordStrength < 75) return '#ffc107';
    return '#4caf50';
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1B1B1B 0%, #2C2C2C 50%, #3C3C3C 100%)'
          : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #81C784 100%)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s ease'
      }}
    >
      {/* Left Side - Robot Character */}
      <Box 
        sx={{ 
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 4
        }}
      >
        {/* Background decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: isDarkMode 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(255,255,255,0.1)',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: isDarkMode 
              ? 'rgba(255,255,255,0.02)' 
              : 'rgba(255,255,255,0.05)',
            zIndex: 1
          }}
        />

        {/* Main Content */}
        <Box sx={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
          {/* Robot Character */}
          <Box 
            sx={{ 
              mb: 3,
              display: 'flex',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <img 
              src="/watify-side-img.png" 
              alt="Watify Robot" 
              style={{ 
                maxWidth: '400px', 
                width: '100%', 
                height: 'auto',
                filter: isDarkMode 
                  ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.5)) brightness(0.9)'
                  : 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
              }} 
            />
          </Box>

          {/* Hi There Speech Bubble */}
          <Box
            sx={{
              position: 'absolute',
              top: '15%',
              left: '60%',
              background: isDarkMode ? '#333333' : '#1B5E20',
              color: isDarkMode ? '#81C784' : '#FFEB3B',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: isDarkMode 
                ? '0 4px 15px rgba(0,0,0,0.5)'
                : '0 4px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-10px',
                left: '30px',
                width: 0,
                height: 0,
                border: '10px solid transparent',
                borderTopColor: isDarkMode ? '#333333' : '#1B5E20'
              }
            }}
          >
            HI THERE!
          </Box>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3
        }}
      >
        <Paper 
          elevation={24}
          sx={{ 
            padding: 4,
            width: '100%',
            maxWidth: 450,
            borderRadius: 4,
            background: isDarkMode 
              ? 'rgba(30,30,30,0.95)' 
              : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode 
              ? '1px solid rgba(255,255,255,0.1)' 
              : '1px solid rgba(255,255,255,0.2)',
            color: isDarkMode ? theme.palette.text.primary : '#212121',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Watify Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <img 
                src="/watify-main-img.png" 
                alt="Watify Logo" 
                style={{ height: '50px', marginRight: '12px' }} 
              />
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '1px'
                  }}
                >
                  
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isDarkMode ? theme.palette.text.secondary : '#666',
                    fontStyle: 'italic',
                    display: 'block',
                    marginTop: '-4px',
                    transition: 'color 0.3s ease'
                  }}
                >
                 
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Form Header */}
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              color: isDarkMode ? theme.palette.text.primary : '#2E2E2E',
              mb: 1,
              textAlign: 'center',
              transition: 'color 0.3s ease'
            }}
          >
            Sign in to portal
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: isDarkMode ? theme.palette.text.secondary : '#666',
              mb: 4,
              textAlign: 'center',
              transition: 'color 0.3s ease'
            }}
          >
            Please provide credentials to login to portal
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                backgroundColor: isDarkMode ? '#4A1F1F' : '#FFEBEE',
                color: isDarkMode ? '#FFCDD2' : '#D32F2F',
                border: isDarkMode ? '1px solid #B71C1C' : 'none',
                '& .MuiAlert-icon': {
                  color: isDarkMode ? '#FFCDD2' : '#D32F2F'
                }
              }}
              icon={<LockOutlined />}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: isDarkMode ? theme.palette.text.secondary : '#666',
                mb: 1,
                fontWeight: 500,
                transition: 'color 0.3s ease'
              }}
            >
              Email address
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              disabled={loading}
              autoComplete="email"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode ? theme.palette.background.default : '#F8F9FA',
                  color: isDarkMode ? theme.palette.text.primary : '#212121',
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? theme.palette.divider : '#E0E0E0'
                  },
                  '&:hover': {
                    backgroundColor: isDarkMode ? theme.palette.background.paper : '#F1F3F4',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? theme.palette.text.secondary : '#BDBDBD'
                    }
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDarkMode ? theme.palette.background.paper : '#FFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2
                    }
                  }
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? theme.palette.text.primary : '#212121'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: isDarkMode ? theme.palette.text.secondary : '#9E9E9E',
                  opacity: 1
                }
              }}
            />

            {/* Password Field */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: isDarkMode ? theme.palette.text.secondary : '#666',
                mb: 1,
                fontWeight: 500,
                transition: 'color 0.3s ease'
              }}
            >
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              disabled={loading}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      disabled={loading}
                      sx={{
                        color: isDarkMode ? theme.palette.text.secondary : '#666'
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode ? theme.palette.background.default : '#F8F9FA',
                  color: isDarkMode ? theme.palette.text.primary : '#212121',
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? theme.palette.divider : '#E0E0E0'
                  },
                  '&:hover': {
                    backgroundColor: isDarkMode ? theme.palette.background.paper : '#F1F3F4',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? theme.palette.text.secondary : '#BDBDBD'
                    }
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDarkMode ? theme.palette.background.paper : '#FFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2
                    }
                  }
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? theme.palette.text.primary : '#212121'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: isDarkMode ? theme.palette.text.secondary : '#9E9E9E',
                  opacity: 1
                }
              }}
            />

            {/* Password Strength Indicator (only when typing) */}
            {formData.password && passwordStrength > 0 && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength} 
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: isDarkMode ? '#444' : '#E0E0E0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPasswordStrengthColor(),
                      borderRadius: 2
                    }
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 0.5, 
                    display: 'block',
                    color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
                    transition: 'color 0.3s ease'
                  }}
                >
                  Password strength: {securityInfo}
                </Typography>
              </Box>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                backgroundColor: isDarkMode ? '#4CAF50' : '#263238',
                color: '#FFF',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(76, 175, 80, 0.3)'
                  : '0 4px 12px rgba(38,50,56,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isDarkMode ? '#45A049' : '#1C2833',
                  boxShadow: isDarkMode 
                    ? '0 6px 16px rgba(76, 175, 80, 0.4)'
                    : '0 6px 16px rgba(38,50,56,0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  backgroundColor: isDarkMode ? '#555' : '#B0BEC5',
                  color: isDarkMode ? '#999' : '#FFF'
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LockOutlined sx={{ mr: 1 }} />
                  Login
                </>
              )}
            </Button>
          </Box>

    

          {/* Development Helper */}
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: isDarkMode ? theme.palette.background.default : '#FFF3E0', 
            borderRadius: 2,
            border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
            transition: 'all 0.3s ease'
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
                display: 'block',
                fontWeight: 600,
                mb: 0.5,
                transition: 'color 0.3s ease'
              }}
            >
              Test Credentials:
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
                display: 'block',
                transition: 'color 0.3s ease'
              }}
            >
              Email: Haadheesheeraz2004@gmail.com
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? theme.palette.text.secondary : 'textSecondary',
                transition: 'color 0.3s ease'
              }}
            >
              Password: admin@123
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Settings Floating Action Button */}
      <Tooltip title="Settings & Accessibility" placement="left">
        <Fab
          color="primary"
          onClick={() => setSettingsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            backgroundColor: '#4CAF50',
            '&:hover': {
              backgroundColor: '#45A049',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)'
          }}
        >
          <SettingsIcon />
        </Fab>
      </Tooltip>

      {/* Settings Dialog */}
      <Settings 
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
};

export default Login; 