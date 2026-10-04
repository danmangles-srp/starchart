import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UnauthenticatedError } from './errors';
import type { TeamRole, Viewer } from './permissions';

/**
 * Resolve the current Viewer from the session + memberships, or throw
 * UnauthenticatedError. The single entry point every server action uses via
 * authorizedAction; also usable directly in Server Components for reads.
 */
export async function requireUser(): Promise<Viewer> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw new UnauthenticatedError();

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    select: { teamId: true, teamRole: true },
  });

  return {
    id: user.id,
    orgId: user.orgId,
    isAdmin: user.isAdmin,
    memberships: memberships.map((m) => ({ teamId: m.teamId, teamRole: m.teamRole as TeamRole })),
  };
}
