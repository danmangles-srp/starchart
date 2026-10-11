/**
 * Design tokens (T8.8). The single source of the visual system — type scale,
 * spacing rhythm, shape, elevation and motion — consumed by `theme.ts` and by
 * motion-aware components (T8.9). Pure constants, no MUI/React, so they're
 * unit-testable and reusable. Never hardcode these values in a component.
 */

/** 8-pt spacing base (MUI `spacing(1)` === 8px). The rhythm every gap/padding uses. */
export const SPACING_UNIT = 8;

/** Shape scale (px). `sm` is the base radius; larger surfaces step up. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * A Material 3 type scale mapped onto MUI's variants. Sizes in rem (16px base),
 * line-heights unitless. Headlines are lighter; titles/labels carry weight.
 */
export interface TypeToken {
  fontSize: string;
  lineHeight: number;
  fontWeight: number;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase';
}

export const typeScale = {
  h1: { fontSize: '2.25rem', lineHeight: 1.22, fontWeight: 400, letterSpacing: '-0.015em' },
  h2: { fontSize: '1.75rem', lineHeight: 1.29, fontWeight: 400, letterSpacing: '-0.01em' },
  h3: { fontSize: '1.5rem', lineHeight: 1.33, fontWeight: 400 },
  h4: { fontSize: '1.375rem', lineHeight: 1.27, fontWeight: 500 },
  h5: { fontSize: '1.25rem', lineHeight: 1.4, fontWeight: 500 },
  h6: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 600 },
  subtitle1: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 600 },
  subtitle2: { fontSize: '0.875rem', lineHeight: 1.43, fontWeight: 600 },
  body1: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 400 },
  body2: { fontSize: '0.875rem', lineHeight: 1.43, fontWeight: 400 },
  caption: { fontSize: '0.75rem', lineHeight: 1.33, fontWeight: 400 },
  button: { fontSize: '0.875rem', lineHeight: 1.43, fontWeight: 500, textTransform: 'none' },
  overline: {
    fontSize: '0.75rem',
    lineHeight: 1.33,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TypeToken>;

/**
 * Motion tokens (Material 3). Durations in ms, easings as cubic-beziers. Semantic
 * names so components/transitions reference intent, not raw numbers (T8.9 consumes
 * these; `prefers-reduced-motion` collapses them to 0 at the component layer).
 */
export const motion = {
  duration: {
    short: 150,
    medium: 250,
    long: 400,
  },
  easing: {
    /** Most on-screen movement. */
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    /** Elements entering the screen (decelerate). */
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    /** Elements leaving the screen (accelerate). */
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    /** High-emphasis, expressive transitions (Material 3 emphasized-decelerate). */
    emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  },
} as const;
