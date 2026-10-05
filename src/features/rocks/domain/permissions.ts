import { canEditTeam, canManageOrg, canReadTeam, type Viewer } from '@/lib/auth/permissions';
import type { RockLevel } from './rock';

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
