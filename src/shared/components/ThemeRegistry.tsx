'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { theme } from '@/lib/theme';
import { createEmotionCache } from '@/lib/emotion-cache';
import { useMemo } from 'react';

export const ThemeRegistry = ({ children }: { children: React.ReactNode }) => {
  // Создаем кеш внутри компонента для правильной работы с SSR
  const emotionCache = useMemo(() => createEmotionCache(), []);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

