import { ForbiddenError } from './errors';

export type TeamRole = 'LEAD' | 'MEMBER';

export interface TeamMembership {
  teamId: string;
  teamRole: TeamRole;
}

/** The authenticated principal, with memberships loaded. Permission checks are pure over this. */
export interface Viewer {
  id: string;
  orgId: string;
  isAdmin: boolean;
  memberships: readonly TeamMembership[];
}

export function isAdmin(viewer: Viewer): boolean {
  return viewer.isAdmin;
}

export function membershipFor(viewer: Viewer, teamId: string): TeamMembership | undefined {
  return viewer.memberships.find((m) => m.teamId === teamId);
}

export function isTeamMember(viewer: Viewer, teamId: string): boolean {
  return membershipFor(viewer, teamId) !== undefined;
}

export function isTeamLead(viewer: Viewer, teamId: string): boolean {
  return membershipFor(viewer, teamId)?.teamRole === 'LEAD';
}

/** Read a team: its members, and any org Admin (FR-1.2 / AC-1.2.4). */
export function canReadTeam(viewer: Viewer, teamId: string): boolean {
  return isAdmin(viewer) || isTeamMember(viewer, teamId);
}

/** Add/edit a team's entries (Issues/Todos/Scorecard/rock status): any member, or Admin. */
export function canEditTeam(viewer: Viewer, teamId: string): boolean {
  return isAdmin(viewer) || isTeamMember(viewer, teamId);
}

/** Manage a team's structure + membership (create/delete/reorder): its Lead, or Admin. */
export function canManageTeam(viewer: Viewer, teamId: string): boolean {
  return isAdmin(viewer) || isTeamLead(viewer, teamId);
}

/** Manage the org (departments, teams, users, roles, settings): Admin only. */
export function canManageOrg(viewer: Viewer): boolean {
  return isAdmin(viewer);
}

export function assertCanReadTeam(viewer: Viewer, teamId: string): void {
  if (!canReadTeam(viewer, teamId)) throw new ForbiddenError();
}

export function assertCanEditTeam(viewer: Viewer, teamId: string): void {
  if (!canEditTeam(viewer, teamId)) throw new ForbiddenError();
}

export function assertCanManageTeam(viewer: Viewer, teamId: string): void {
  if (!canManageTeam(viewer, teamId)) throw new ForbiddenError();
}

export function assertCanManageOrg(viewer: Viewer): void {
  if (!canManageOrg(viewer)) throw new ForbiddenError();
}
