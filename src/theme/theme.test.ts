import { describe, it, expect } from 'vitest';
import theme from './theme';

// createTheme({ cssVariables, colorSchemes }) returns a CSS-variables theme whose
// `colorSchemes`/`cssVariables` exist at runtime but aren't on the base `Theme` type.
type SchemePalette = { palette: { primary: { main: string } } };
const vars = theme as unknown as {
  colorSchemes: { light?: SchemePalette; dark?: SchemePalette };
};

describe('theme', () => {
  it('defines both a light and a dark color scheme', () => {
    expect(vars.colorSchemes.light).toBeDefined();
    expect(vars.colorSchemes.dark).toBeDefined();
  });

  it('seeds the primary color in each scheme', () => {
    expect(vars.colorSchemes.light?.palette.primary.main).toBe('#1a73e8');
    expect(vars.colorSchemes.dark?.palette.primary.main).toBe('#8ab4f8');
  });

  it('uses a single 8px radius base', () => {
    expect(theme.shape.borderRadius).toBe(8);
  });

  it('uses distinct primary tones for light and dark', () => {
    expect(vars.colorSchemes.light?.palette.primary.main).not.toBe(
      vars.colorSchemes.dark?.palette.primary.main,
    );
  });
});
