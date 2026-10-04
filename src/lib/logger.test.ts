import { describe, it, expect } from 'vitest';
import { logger, LOG_TAGS } from './logger';

describe('logger', () => {
  it('exposes the canonical cross-cutting tags', () => {
    expect(LOG_TAGS).toContain('DB');
    expect(LOG_TAGS).toContain('CORE');
    expect(LOG_TAGS).toContain('AUTH');
  });

  it('binds a child logger to its tag', () => {
    const bound = logger('ROCKS');
    expect(bound.bindings().tag).toBe('ROCKS');
  });
});
