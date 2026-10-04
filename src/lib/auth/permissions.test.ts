import { describe, it, expect } from 'vitest';
import {
  canReadTeam,
  canEditTeam,
  canManageTeam,
  canManageOrg,
  isTeamLead,
  assertCanReadTeam,
  assertCanManageOrg,
  type Viewer,
} from './permissions';

const T1 = 'team-1';
const T2 = 'team-2';

const admin: Viewer = { id: 'a', orgId: 'o', isAdmin: true, memberships: [] };
const lead: Viewer = {
  id: 'l',
  orgId: 'o',
  isAdmin: false,
  memberships: [{ teamId: T1, teamRole: 'LEAD' }],
};
const member: Viewer = {
  id: 'm',
  orgId: 'o',
  isAdmin: false,
  memberships: [{ teamId: T1, teamRole: 'MEMBER' }],
};

describe('permissions matrix (FR-1.2)', () => {
  it('reads: admin anywhere; members only their teams', () => {
    expect(canReadTeam(admin, T1)).toBe(true);
    expect(canReadTeam(admin, T2)).toBe(true);
    expect(canReadTeam(member, T1)).toBe(true);
    expect(canReadTeam(member, T2)).toBe(false);
    expect(canReadTeam(lead, T2)).toBe(false);
  });

  it('edits entries: admin anywhere; members on their teams only', () => {
    expect(canEditTeam(admin, T2)).toBe(true);
    expect(canEditTeam(member, T1)).toBe(true);
    expect(canEditTeam(member, T2)).toBe(false);
  });

  it('manages structure: admin anywhere; lead only their team; member never', () => {
    expect(canManageTeam(admin, T2)).toBe(true);
    expect(canManageTeam(lead, T1)).toBe(true);
    expect(canManageTeam(lead, T2)).toBe(false);
    expect(canManageTeam(member, T1)).toBe(false);
  });

  it('manages org: admin only', () => {
    expect(canManageOrg(admin)).toBe(true);
    expect(canManageOrg(lead)).toBe(false);
    expect(canManageOrg(member)).toBe(false);
  });

  it('isTeamLead distinguishes lead from member', () => {
    expect(isTeamLead(lead, T1)).toBe(true);
    expect(isTeamLead(member, T1)).toBe(false);
  });
});

describe('assertions', () => {
  it('throw when denied and pass when allowed', () => {
    expect(() => assertCanReadTeam(member, T2)).toThrow();
    expect(() => assertCanReadTeam(member, T1)).not.toThrow();
    expect(() => assertCanManageOrg(member)).toThrow();
    expect(() => assertCanManageOrg(admin)).not.toThrow();
  });
});
