import { describe, it, expect } from 'vitest';
import { canManageRock, canReadRock, allowedRockLevelsForTeam } from './permissions';
import type { Viewer } from '@/lib/auth/permissions';

const admin: Viewer = { id: 'a', orgId: 'o', isAdmin: true, memberships: [] };
const member: Viewer = {
  id: 'm',
  orgId: 'o',
  isAdmin: false,
  memberships: [{ teamId: 't1', teamRole: 'MEMBER' }],
};

describe('canManageRock', () => {
  it('admin may manage any rock', () => {
    expect(canManageRock(admin, { level: 'COMPANY', teamId: null, ownerId: 'x' })).toBe(true);
    expect(canManageRock(admin, { level: 'TEAM', teamId: 't9', ownerId: 'x' })).toBe(true);
  });
  it('company rocks need admin', () => {
    expect(canManageRock(member, { level: 'COMPANY', teamId: null, ownerId: 'm' })).toBe(false);
  });
  it('team rocks need membership of that team', () => {
    expect(canManageRock(member, { level: 'TEAM', teamId: 't1', ownerId: 'x' })).toBe(true);
    expect(canManageRock(member, { level: 'TEAM', teamId: 't2', ownerId: 'x' })).toBe(false);
  });
  it('individual rocks belong to their owner', () => {
    expect(canManageRock(member, { level: 'INDIVIDUAL', teamId: null, ownerId: 'm' })).toBe(true);
    expect(canManageRock(member, { level: 'INDIVIDUAL', teamId: null, ownerId: 'other' })).toBe(
      false,
    );
  });
});

describe('canReadRock', () => {
  it('company rocks are org-visible; team rocks need membership; individual need owner', () => {
    expect(canReadRock(member, { level: 'COMPANY', teamId: null, ownerId: 'x' })).toBe(true);
    expect(canReadRock(member, { level: 'TEAM', teamId: 't1', ownerId: 'x' })).toBe(true);
    expect(canReadRock(member, { level: 'TEAM', teamId: 't2', ownerId: 'x' })).toBe(false);
    expect(canReadRock(member, { level: 'INDIVIDUAL', teamId: null, ownerId: 'other' })).toBe(
      false,
    );
  });
});

describe('allowedRockLevelsForTeam', () => {
  it('a team member may create Team rocks but not Company rocks', () => {
    expect(allowedRockLevelsForTeam(member, { teamId: 't1', isLeadership: false })).toEqual([
      'TEAM',
    ]);
    // Even on the Leadership board, a non-admin gets no Company option.
    expect(allowedRockLevelsForTeam(member, { teamId: 't1', isLeadership: true })).toEqual([
      'TEAM',
    ]);
  });
  it('a non-member of the team gets no Team option', () => {
    expect(allowedRockLevelsForTeam(member, { teamId: 't2', isLeadership: false })).toEqual([]);
  });
  it('an Admin may create Company rocks only on the Leadership board', () => {
    expect(allowedRockLevelsForTeam(admin, { teamId: 't9', isLeadership: false })).toEqual([
      'TEAM',
    ]);
    expect(allowedRockLevelsForTeam(admin, { teamId: 'lead', isLeadership: true })).toEqual([
      'TEAM',
      'COMPANY',
    ]);
  });
  it('never offers an option canManageRock would reject', () => {
    const levels = allowedRockLevelsForTeam(admin, { teamId: 'lead', isLeadership: true });
    for (const level of levels) {
      expect(
        canManageRock(admin, { level, teamId: level === 'TEAM' ? 'lead' : null, ownerId: 'a' }),
      ).toBe(true);
    }
  });
});
