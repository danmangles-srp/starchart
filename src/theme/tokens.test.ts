import { describe, it, expect } from 'vitest';
import { typeScale, motion, radii, SPACING_UNIT } from './tokens';

describe('design tokens', () => {
  it('uses an 8-pt spacing base', () => {
    expect(SPACING_UNIT).toBe(8);
  });

  it('has an ascending shape scale with a pill radius', () => {
    expect(radii.sm).toBeLessThan(radii.md);
    expect(radii.md).toBeLessThan(radii.lg);
    expect(radii.pill).toBeGreaterThanOrEqual(999);
  });

  it('defines a full type scale with positive sizes and line-heights', () => {
    const variants = Object.values(typeScale);
    expect(variants.length).toBeGreaterThanOrEqual(13);
    for (const t of variants) {
      expect(parseFloat(t.fontSize)).toBeGreaterThan(0);
      expect(t.lineHeight).toBeGreaterThan(1);
      expect(t.fontWeight).toBeGreaterThanOrEqual(400);
    }
  });

  it('keeps buttons from shouting in caps', () => {
    expect(typeScale.button.textTransform).toBe('none');
    expect(typeScale.overline.textTransform).toBe('uppercase');
  });

  it('orders motion durations short < medium < long', () => {
    expect(motion.duration.short).toBeLessThan(motion.duration.medium);
    expect(motion.duration.medium).toBeLessThan(motion.duration.long);
  });

  it('exposes named cubic-bezier easings', () => {
    for (const e of Object.values(motion.easing)) {
      expect(e).toMatch(/^cubic-bezier\(/);
    }
  });
});
