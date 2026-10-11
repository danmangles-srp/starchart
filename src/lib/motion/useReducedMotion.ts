'use client';

import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * True when the viewer asked the OS to reduce motion (T8.9 / NFR-3.*). CSS-level
 * transitions are already collapsed globally by the theme's reduced-motion reset;
 * use this hook for motion a component drives in JS (e.g. whether to mount an
 * entrance transition at all). SSR-safe: resolves on the client after mount.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
