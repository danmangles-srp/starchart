import { describe, it, expect } from 'vitest';
import { isOverdue } from './todo';

describe('isOverdue', () => {
  const now = new Date('2026-10-06T12:00:00Z');

  it('is true for an open item past its due date', () => {
    expect(isOverdue(new Date('2026-10-05T12:00:00Z'), false, now)).toBe(true);
  });

  it('is false for an open item still due in the future', () => {
    expect(isOverdue(new Date('2026-10-07T12:00:00Z'), false, now)).toBe(false);
  });

  it('is never overdue once done, even if past due', () => {
    expect(isOverdue(new Date('2026-10-01T12:00:00Z'), true, now)).toBe(false);
  });
});
