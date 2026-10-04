import { describe, it, expect } from 'vitest';
import { getQueryClient } from './getQueryClient';

describe('getQueryClient', () => {
  it('returns a shared singleton in the browser', () => {
    expect(getQueryClient()).toBe(getQueryClient());
  });
});
