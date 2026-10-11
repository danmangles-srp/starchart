import { describe, it, expect } from 'vitest';
import { displayRole } from './role';

describe('displayRole', () => {
  it('admin outranks everything', () => {
    expect(displayRole({ isAdmin: true, memberships: [] })).toBe('Admin');
    expect(displayRole({ isAdmin: true, memberships: [{ teamRole: 'MEMBER' }] })).toBe('Admin');
  });
  it('a lead of any team is a Team Lead', () => {
    expect(
      displayRole({ isAdmin: false, memberships: [{ teamRole: 'MEMBER' }, { teamRole: 'LEAD' }] }),
    ).toBe('Team Lead');
  });
  it('plain membership is Member', () => {
    expect(displayRole({ isAdmin: false, memberships: [{ teamRole: 'MEMBER' }] })).toBe('Member');
    expect(displayRole({ isAdmin: false, memberships: [] })).toBe('Member');
  });
});
