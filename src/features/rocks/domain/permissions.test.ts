import { describe, it, expect } from 'vitest';
import { canManageRock, canReadRock } from './permissions';
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
