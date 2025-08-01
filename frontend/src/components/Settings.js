import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  WbSunny as LightModeIcon,
  DarkMode as DarkModeIcon,
  Contrast as ContrastIcon,
  HighQuality as HighContrastIcon,
  FormatTextdirectionLToR as LTRIcon,
  FormatTextdirectionRToL as RTLIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../contexts/ThemeContext';

const Settings = ({ open, onClose }) => {
  const {
    themeMode,
    contrast,
    fontSize,
    toggleTheme,
    setContrastLevel,
    setFontSizeLevel,
    resetToDefaults,
    isDarkMode,
    isHighContrast
  } = useCustomTheme();

  const [direction, setDirection] = useState('ltr');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const SettingCard = ({ selected, onClick, icon, label, disabled = false }) => (
    <Card 
      onClick={disabled ? undefined : onClick}
      sx={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        backgroundColor: selected ? 'primary.light' : 'background.paper',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        '&:hover': disabled ? {} : {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        p: 2,
        '&:last-child': { pb: 2 }
      }}>
        <Box sx={{ 
          color: selected ? 'primary.main' : 'text.secondary',
          mb: 1,
          fontSize: '1.5rem'
        }}>
          {icon}
        </Box>
        <Typography 
          variant="caption" 
          sx={{ 
            color: selected ? 'primary.main' : 'text.secondary',
            fontWeight: selected ? 600 : 400,
            textAlign: 'center'
          }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
          backgroundColor: 'background.paper'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={resetToDefaults}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Mode Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Mode
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <SettingCard
                selected={!isDarkMode}
                onClick={() => !isDarkMode || toggleTheme()}
                icon={<LightModeIcon />}
                label="Light"
              />
            </Grid>
            <Grid item xs={6}>
              <SettingCard
                selected={isDarkMode}
                onClick={() => isDarkMode || toggleTheme()}
                icon={<DarkModeIcon />}
                label="Dark"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Contrast Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Contrast
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <SettingCard
                selected={contrast === 'normal'}
                onClick={() => setContrastLevel('normal')}
                icon={<ContrastIcon />}
                label="Normal"
              />
            </Grid>
            <Grid item xs={6}>
              <SettingCard
                selected={contrast === 'high'}
                onClick={() => setContrastLevel('high')}
                icon={<HighContrastIcon />}
                label="High"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Direction Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Direction
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <SettingCard
                selected={direction === 'ltr'}
                onClick={() => setDirection('ltr')}
                icon={<LTRIcon />}
                label="LTR"
              />
            </Grid>
            <Grid item xs={6}>
              <SettingCard
                selected={direction === 'rtl'}
                onClick={() => setDirection('rtl')}
                icon={<RTLIcon />}
                label="RTL"
                disabled={true}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Fullscreen Section */}
        <Box sx={{ mb: 2 }}>
          <Paper 
            sx={{ 
              p: 2, 
              backgroundColor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FullscreenIcon sx={{ color: 'text.secondary' }} />
                <Typography 
                  variant="body1" 
                  sx={{ fontWeight: 500, color: 'text.primary' }}
                >
                  Fullscreen
                </Typography>
              </Box>
              <Switch
                checked={isFullscreen}
                onChange={handleFullscreenToggle}
                color="primary"
              />
            </Box>
          </Paper>
        </Box>

        {/* Info Section */}
        <Paper 
          sx={{ 
            p: 2, 
            backgroundColor: isDarkMode ? 'grey.800' : 'grey.50',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              display: 'block',
              lineHeight: 1.4
            }}
          >
            Settings are automatically saved and will persist across browser sessions.
            Use the reset button to restore default settings.
          </Typography>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default Settings; 