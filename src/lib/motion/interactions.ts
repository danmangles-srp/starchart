import type { SxProps, Theme } from '@mui/material/styles';

/**
 * A subtle hover/press micro-interaction for cards and other liftable surfaces
 * (T8.9): raise + shadow on hover, settle on press. Timed by the theme's motion
 * tokens; the global reduced-motion reset makes it instant for viewers who opt out,
 * so this needs no per-use guard.
 */
export const hoverLift: SxProps<Theme> = {
  transition: (theme) =>
    theme.transitions.create(['box-shadow', 'transform', 'border-color'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeOut,
    }),
  '@media (hover: hover)': {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 3,
    },
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: 1,
  },
};
