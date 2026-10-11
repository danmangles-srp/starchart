import type { SxProps, Theme } from '@mui/material/styles';
import { motion } from '@/theme/tokens';

/**
 * A subtle hover/press micro-interaction for cards and other liftable surfaces
 * (T8.9): raise + shadow on hover, settle on press. Timed by the T8.8 motion
 * tokens. Both hover and press are gated behind `@media (hover: hover)` so touch
 * devices (which never show the lift) don't pop a shadow on tap; the global
 * reduced-motion reset makes the movement instant for viewers who opt out.
 */
export const hoverLift: SxProps<Theme> = {
  transition: (theme) =>
    theme.transitions.create(['box-shadow', 'transform'], {
      duration: motion.duration.short,
      easing: motion.easing.decelerate,
    }),
  '@media (hover: hover)': {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 3,
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 1,
    },
  },
};
