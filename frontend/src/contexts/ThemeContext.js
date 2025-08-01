import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { THEME_CONFIG } from '../utils/config';

const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
  // Theme state
  const [themeMode, setThemeMode] = useState('light');
  const [contrast, setContrast] = useState('normal');
  const [fontSize, setFontSize] = useState('medium');

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('watify-theme');
    const savedContrast = localStorage.getItem('watify-contrast');
    const savedFontSize = localStorage.getItem('watify-font-size');

    if (savedTheme) setThemeMode(savedTheme);
    if (savedContrast) setContrast(savedContrast);
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  // Enhanced color palette for better dark mode support
  const getColorPalette = () => {
    const isDark = themeMode === 'dark';
    const isHighContrast = contrast === 'high';
    
    return {
      mode: themeMode,
      primary: {
        main: isDark ? '#81C784' : THEME_CONFIG.PRIMARY_COLOR,
        dark: isDark ? '#4CAF50' : '#2E7D32',
        light: isDark ? '#A5D6A7' : '#81C784',
        contrastText: isDark ? '#000000' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#FFB74D' : THEME_CONFIG.SECONDARY_COLOR,
        dark: isDark ? '#FF9800' : '#1976D2',
        light: isDark ? '#FFCC80' : '#BBDEFB',
        contrastText: isDark ? '#000000' : '#FFFFFF',
      },
      background: {
        default: isDark 
          ? (isHighContrast ? '#000000' : '#121212')
          : (isHighContrast ? '#FFFFFF' : '#F5F5F5'),
        paper: isDark 
          ? (isHighContrast ? '#1C1C1C' : '#1E1E1E')
          : (isHighContrast ? '#FFFFFF' : '#FFFFFF'),
      },
      surface: {
        main: isDark ? '#2C2C2C' : '#FFFFFF',
        light: isDark ? '#3C3C3C' : '#F8F9FA',
        dark: isDark ? '#1C1C1C' : '#E9ECEF',
      },
      text: {
        primary: isDark 
          ? (isHighContrast ? '#FFFFFF' : '#FFFFFF')
          : (isHighContrast ? '#000000' : '#212121'),
        secondary: isDark 
          ? (isHighContrast ? '#E0E0E0' : '#B3B3B3')
          : (isHighContrast ? '#424242' : '#757575'),
        disabled: isDark ? '#666666' : '#BDBDBD',
      },
      divider: isDark 
        ? (isHighContrast ? '#555555' : '#333333')
        : (isHighContrast ? '#000000' : '#E0E0E0'),
      success: {
        main: isDark ? '#66BB6A' : THEME_CONFIG.SUCCESS_COLOR,
        contrastText: '#FFFFFF',
      },
      warning: {
        main: isDark ? '#FFB74D' : THEME_CONFIG.WARNING_COLOR,
        contrastText: isDark ? '#000000' : '#FFFFFF',
      },
      error: {
        main: isDark ? '#F44336' : THEME_CONFIG.ERROR_COLOR,
        contrastText: '#FFFFFF',
      },
      info: {
        main: isDark ? '#29B6F6' : '#2196F3',
        contrastText: '#FFFFFF',
      },
    };
  };

  // Create dynamic theme based on current settings
  const theme = createTheme({
    palette: getColorPalette(),
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14,
      h1: {
        fontSize: fontSize === 'small' ? '2rem' : fontSize === 'large' ? '3rem' : '2.5rem',
        fontWeight: 600,
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      h2: {
        fontSize: fontSize === 'small' ? '1.7rem' : fontSize === 'large' ? '2.3rem' : '2rem',
        fontWeight: 600,
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      h3: {
        fontSize: fontSize === 'small' ? '1.5rem' : fontSize === 'large' ? '2rem' : '1.75rem',
        fontWeight: 600,
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      h4: {
        fontSize: fontSize === 'small' ? '1.3rem' : fontSize === 'large' ? '1.7rem' : '1.5rem',
        fontWeight: 600,
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      h5: {
        fontSize: fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.4rem' : '1.25rem',
        fontWeight: 600,
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      h6: {
        fontSize: fontSize === 'small' ? '0.9rem' : fontSize === 'large' ? '1.2rem' : '1rem',
        fontWeight: 600,
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      body1: {
        color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
      },
      body2: {
        color: themeMode === 'dark' ? '#B3B3B3' : '#757575',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: themeMode === 'dark' 
              ? (contrast === 'high' ? '#000000' : '#121212')
              : (contrast === 'high' ? '#FFFFFF' : '#F5F5F5'),
            color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: themeMode === 'dark' ? '#555555 #333333' : '#CCCCCC #F5F5F5',
          },
          '*::-webkit-scrollbar': {
            width: '8px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: themeMode === 'dark' ? '#333333' : '#F5F5F5',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: themeMode === 'dark' ? '#555555' : '#CCCCCC',
            borderRadius: '4px',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            transition: 'all 0.3s ease',
            ...(contrast === 'high' && {
              border: `2px solid ${themeMode === 'dark' ? '#FFFFFF' : '#000000'}`,
              fontWeight: 'bold',
            }),
          },
          contained: {
            backgroundColor: themeMode === 'dark' ? '#81C784' : '#4CAF50',
            color: themeMode === 'dark' ? '#000000' : '#FFFFFF',
            '&:hover': {
              backgroundColor: themeMode === 'dark' ? '#66BB6A' : '#45A049',
            },
          },
          outlined: {
            borderColor: themeMode === 'dark' ? '#81C784' : '#4CAF50',
            color: themeMode === 'dark' ? '#81C784' : '#4CAF50',
            '&:hover': {
              backgroundColor: themeMode === 'dark' ? 'rgba(129, 199, 132, 0.1)' : 'rgba(76, 175, 80, 0.1)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: themeMode === 'dark' ? '#2C2C2C' : '#F8F9FA',
              color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
              transition: 'all 0.3s ease',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: themeMode === 'dark' ? '#555555' : '#E0E0E0',
                ...(contrast === 'high' && {
                  borderWidth: 2,
                  borderColor: themeMode === 'dark' ? '#FFFFFF' : '#000000',
                }),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: themeMode === 'dark' ? '#81C784' : '#4CAF50',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: themeMode === 'dark' ? '#81C784' : '#4CAF50',
                borderWidth: 2,
              },
            },
            '& .MuiInputLabel-root': {
              color: themeMode === 'dark' ? '#B3B3B3' : '#757575',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
            boxShadow: themeMode === 'dark' 
              ? '0 4px 6px rgba(0, 0, 0, 0.3)'
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            ...(contrast === 'high' && {
              border: `2px solid ${themeMode === 'dark' ? '#FFFFFF' : '#000000'}`,
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
            transition: 'all 0.3s ease',
            ...(contrast === 'high' && {
              border: `1px solid ${themeMode === 'dark' ? '#FFFFFF' : '#000000'}`,
            }),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
            borderRight: `1px solid ${themeMode === 'dark' ? '#333333' : '#E0E0E0'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            color: themeMode === 'dark' ? '#FFFFFF' : '#212121',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: 'inherit',
          },
        },
      },
    },
  });

  // Theme control functions
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('watify-theme', newMode);
  };

  const setContrastLevel = (level) => {
    setContrast(level);
    localStorage.setItem('watify-contrast', level);
  };

  const setFontSizeLevel = (size) => {
    setFontSize(size);
    localStorage.setItem('watify-font-size', size);
  };

  const resetToDefaults = () => {
    setThemeMode('light');
    setContrast('normal');
    setFontSize('medium');
    localStorage.removeItem('watify-theme');
    localStorage.removeItem('watify-contrast');
    localStorage.removeItem('watify-font-size');
  };

  const themeContextValue = {
    theme,
    themeMode,
    contrast,
    fontSize,
    toggleTheme,
    setContrastLevel,
    setFontSizeLevel,
    resetToDefaults,
    isDarkMode: themeMode === 'dark',
    isHighContrast: contrast === 'high',
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
};

export default ThemeContext; 