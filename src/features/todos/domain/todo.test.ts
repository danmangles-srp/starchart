import { describe, it, expect } from 'vitest';
import { isOverdue, daysOverdue, overdueLabel } from './todo';

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

describe('daysOverdue', () => {
  const now = new Date('2026-10-06T12:00:00Z');
  it('is 0 before the due moment', () => {
    expect(daysOverdue(new Date('2026-10-07T12:00:00Z'), now)).toBe(0);
  });
  it('counts whole days past due', () => {
    expect(daysOverdue(new Date('2026-10-03T12:00:00Z'), now)).toBe(3);
    expect(daysOverdue(new Date('2026-10-06T06:00:00Z'), now)).toBe(0); // same day, <24h
  });
});

describe('overdueLabel', () => {
  const now = new Date('2026-10-06T12:00:00Z');
  it('is null when not overdue or done', () => {
    expect(overdueLabel(new Date('2026-10-10T00:00:00Z'), false, now)).toBeNull();
    expect(overdueLabel(new Date('2026-10-01T00:00:00Z'), true, now)).toBeNull();
  });
  it('reads singular/plural and same-day', () => {
    expect(overdueLabel(new Date('2026-10-06T06:00:00Z'), false, now)).toBe('Due today');
    expect(overdueLabel(new Date('2026-10-05T06:00:00Z'), false, now)).toBe('1 day overdue');
    expect(overdueLabel(new Date('2026-10-03T06:00:00Z'), false, now)).toBe('3 days overdue');
  });
});
