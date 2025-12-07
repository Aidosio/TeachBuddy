'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#355da8',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shadows: [
    'none',
    '0 10px 30px rgba(0,0,0,0.06)', // elevation1
    '0 8px 20px rgba(0,0,0,0.06)',  // elevation2
    '0 8px 20px rgba(0,0,0,0.08)',  // elevation3
    '0 10px 24px rgba(0,0,0,0.1)',  // elevation4
    '0 12px 28px rgba(0,0,0,0.12)', // elevation5
    ...Array(20).fill('0 0 0 rgba(0,0,0,0.04)'), // остальные можно задать позже
  ],
  components: {
    // КНОПКИ
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          paddingInline: 20,
          minHeight: 54,
          '&:hover': {
            boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },

    // INPUT / TEXTFIELD (Outlined)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 54,
          '& fieldset': {
            borderColor: '#d0d7e2',
          },
          '&:hover fieldset': {
            borderColor: '#355da8',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#355da8',
            borderWidth: 1.5,
          },
        },
        input: {
          padding: '16px 14px',
        },
      },
    },

    // LABEL для инпутов
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#555555',
          '&.Mui-focused': {
            color: '#355da8',
          },
        },
      },
    },

    // CARD / PAPER
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

