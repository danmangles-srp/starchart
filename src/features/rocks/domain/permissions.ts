import { canEditTeam, canManageOrg, canReadTeam, type Viewer } from '@/lib/auth/permissions';
import type { RockLevel } from './rock';

/**
 * The Rock levels a viewer may actually create from a team's Rocks board (T8.4):
 * TEAM when they may edit that team; COMPANY only on the Leadership board and only
 * for an Admin — matching {@link canManageRock} so no offered option is a guaranteed
 * `forbidden` (finding B1). INDIVIDUAL rocks are created from the personal "My Rocks"
 * surface, not a team board, so they are not offered here.
 */
export function allowedRockLevelsForTeam(
  viewer: Viewer,
  ctx: { teamId: string; isLeadership: boolean },
): RockLevel[] {
  const levels: RockLevel[] = [];
  if (canEditTeam(viewer, ctx.teamId)) levels.push('TEAM');
  if (ctx.isLeadership && canManageOrg(viewer)) levels.push('COMPANY');
  return levels;
}

export interface RockScope {
  level: RockLevel;
  teamId: string | null;
  ownerId: string;
}

/**
 * Who may create/edit a Rock, by level (FR-3.1):
 * COMPANY → Admin, TEAM → a member of that team (or Admin), INDIVIDUAL → its owner (or Admin).
 */
export function canManageRock(viewer: Viewer, rock: RockScope): boolean {
  if (viewer.isAdmin) return true;
  if (rock.level === 'COMPANY') return canManageOrg(viewer);
  if (rock.level === 'TEAM') return rock.teamId !== null && canEditTeam(viewer, rock.teamId);
  return rock.ownerId === viewer.id;
}

/** Who may view a Rock: Company rocks are org-visible; Team rocks by members; Individual by owner. */
export function canReadRock(viewer: Viewer, rock: RockScope): boolean {
  if (viewer.isAdmin) return true;
  if (rock.level === 'COMPANY') return true;
  if (rock.level === 'TEAM') return rock.teamId !== null && canReadTeam(viewer, rock.teamId);
  return rock.ownerId === viewer.id;
}
