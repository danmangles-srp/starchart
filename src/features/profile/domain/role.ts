import type { TeamRole } from '@prisma/client';

/**
 * A viewer's headline role for display (AC-1.3.2): Admin is org-wide; otherwise
 * "Team Lead" if they lead any team, else "Member". Pure — no DB/React.
 */
export function displayRole(input: {
  isAdmin: boolean;
  memberships: { teamRole: TeamRole }[];
}): string {
  if (input.isAdmin) return 'Admin';
  if (input.memberships.some((m) => m.teamRole === 'LEAD')) return 'Team Lead';
  return 'Member';
}
