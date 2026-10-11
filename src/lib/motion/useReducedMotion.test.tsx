import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({ useMediaQuery: vi.fn() }));
vi.mock('@mui/material/useMediaQuery', () => ({ default: h.useMediaQuery }));

import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  beforeEach(() => h.useMediaQuery.mockReset());

  it('reflects the prefers-reduced-motion media query', () => {
    h.useMediaQuery.mockReturnValue(true);
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true);
    expect(h.useMediaQuery).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('is false when the viewer has not asked to reduce motion', () => {
    h.useMediaQuery.mockReturnValue(false);
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false);
  });
});
