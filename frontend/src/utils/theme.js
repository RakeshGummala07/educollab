import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',       // Royal blue — confidence, knowledge
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3AED',       // Violet — creativity, depth
      light: '#8B5CF6',
      dark: '#6D28D9',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#059669',
    },
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#D97706',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
    },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#F8FAFC',
            '&:hover fieldset': { borderColor: '#2563EB' },
            '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 2 },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
})
