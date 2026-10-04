import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia; MUI responsive helpers call it. Default to "no match"
// (mobile-first) so components render deterministically in tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
