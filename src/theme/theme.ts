import { createTheme } from '@mui/material/styles';

/**
 * Cadence Material theme. One seed (Google blue #1a73e8) drives a light + dark
 * scheme using MUI's CSS theme variables, so the app switches with the OS and a
 * manual toggle (FR-8.3) with no flash. All visual values come from here — never
 * hardcode a color/size in a component (ui-ux.md).
 */
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1a73e8' },
        background: { default: '#f8f9fa', paper: '#ffffff' },
        success: { main: '#1e8e3e' },
        warning: { main: '#e37400' },
        error: { main: '#d93025' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#8ab4f8' },
        background: { default: '#121212', paper: '#1e1e1e' },
        success: { main: '#81c995' },
        warning: { main: '#fdd663' },
        error: { main: '#f28b82' },
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, "Segoe UI", Roboto, Arial, sans-serif',
  },
  components: {
    // Visible keyboard focus everywhere (NFR-3 / WCAG 2.4.7). Mouse clicks keep
    // their default (no ring) via :focus-visible; keyboard focus always shows one.
    MuiCssBaseline: {
      styleOverrides: {
        ':focus-visible': {
          outline: '2px solid var(--mui-palette-primary-main)',
          outlineOffset: '2px',
        },
      },
    },
  },
});

export default theme;
