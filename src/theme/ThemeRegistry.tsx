'use client';

import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';
import QueryProvider from '@/lib/query/QueryProvider';

/**
 * Client boundary that wires the SSR-safe emotion cache (App Router) and the
 * theme provider (CSS variables, light + dark, system default). Rendered once in
 * the root layout; everything below it can use MUI components and theme tokens.
 */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline enableColorScheme />
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
