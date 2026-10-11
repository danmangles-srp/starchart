import { createTheme } from '@mui/material/styles';
import { typeScale, motion, radii, SPACING_UNIT } from './tokens';

/**
 * Cadence Material 3 theme (T8.8). One seed (Google blue #1a73e8) drives a light +
 * dark scheme using MUI's CSS theme variables, so the app switches with the OS and a
 * manual toggle (FR-8.3) with no flash. The visual system — type scale, 8-pt spacing,
 * shape, elevation and motion — comes from `tokens.ts`; never hardcode a visual value
 * in a component (ui-ux.md / NFR-9.1).
 */
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  spacing: SPACING_UNIT,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1a73e8' },
        background: { default: '#f8f9fa', paper: '#ffffff' },
        success: { main: '#1e8e3e' },
        warning: { main: '#e37400' },
        error: { main: '#d93025' },
        divider: 'rgba(0, 0, 0, 0.12)',
      },
    },
    dark: {
      palette: {
        primary: { main: '#8ab4f8' },
        background: { default: '#121212', paper: '#1e1e1e' },
        success: { main: '#81c995' },
        warning: { main: '#fdd663' },
        error: { main: '#f28b82' },
        divider: 'rgba(255, 255, 255, 0.12)',
      },
    },
  },
  shape: { borderRadius: radii.sm },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, "Segoe UI", Roboto, Arial, sans-serif',
    ...typeScale,
  },
  transitions: {
    duration: {
      shortest: motion.duration.short,
      shorter: motion.duration.short,
      short: motion.duration.medium,
      standard: motion.duration.medium,
      complex: motion.duration.long,
      enteringScreen: motion.duration.medium,
      leavingScreen: motion.duration.short,
    },
    easing: {
      easeInOut: motion.easing.standard,
      easeOut: motion.easing.decelerate,
      easeIn: motion.easing.accelerate,
      sharp: motion.easing.emphasized,
    },
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
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radii.pill, paddingInline: 16 },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: radii.md },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // Flatter, Material-3-style surfaces: lean on hairline borders over heavy shadow.
        rounded: { borderRadius: radii.md },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radii.sm, fontWeight: 500 },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});

export default theme;
