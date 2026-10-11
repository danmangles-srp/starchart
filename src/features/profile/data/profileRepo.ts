import type { PrismaClient, TeamRole } from '@prisma/client';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/auth/errors';

export interface ProfileMembership {
  teamId: string;
  teamName: string;
  teamRole: TeamRole;
  departmentName: string | null;
  isLeadership: boolean;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  jobTitle: string | null;
  isAdmin: boolean;
  memberships: ProfileMembership[];
}

/** The viewer's own identity + role + memberships (FR-1.3 / AC-1.3.1, AC-1.3.2). Org-scoped. */
export async function getProfile(
  orgId: string,
  userId: string,
  prisma: PrismaClient = db,
): Promise<Profile> {
  const user = await prisma.user.findFirst({
    where: { id: userId, orgId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      jobTitle: true,
      isAdmin: true,
      memberships: {
        include: { team: { include: { department: true } } },
      },
    },
  });
  if (!user) throw new NotFoundError('User not found.');
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    jobTitle: user.jobTitle,
    isAdmin: user.isAdmin,
    memberships: user.memberships
      .map((m) => ({
        teamId: m.teamId,
        teamName: m.team.name,
        teamRole: m.teamRole,
        departmentName: m.team.department?.name ?? null,
        isLeadership: m.team.isLeadership,
      }))
      .sort((a, b) => a.teamName.localeCompare(b.teamName)),
  };
}

/** The viewer's app-bar identity: name/image from the IdP, plus their set job title. */
export async function getIdentity(
  orgId: string,
  userId: string,
  prisma: PrismaClient = db,
): Promise<{ name: string | null; email: string; image: string | null; jobTitle: string | null }> {
  const user = await prisma.user.findFirst({
    where: { id: userId, orgId },
    select: { name: true, email: true, image: true, jobTitle: true },
  });
  if (!user) throw new NotFoundError('User not found.');
  return user;
}

/** Set (or clear) the viewer's optional job title (FR-1.3). A blank value clears it. */
export async function updateJobTitle(
  orgId: string,
  userId: string,
  jobTitle: string | null,
  prisma: PrismaClient = db,
): Promise<void> {
  const res = await prisma.user.updateMany({
    where: { id: userId, orgId },
    data: { jobTitle: jobTitle && jobTitle.trim().length > 0 ? jobTitle.trim() : null },
  });
  if (res.count === 0) throw new NotFoundError('User not found.');
}
