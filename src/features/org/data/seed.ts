import { PrismaClient, TeamRole } from '@prisma/client';

export const DEPARTMENTS = ['Sales', 'Marketing', 'Product', 'Operations'] as const;
export const TEAMS_PER_DEPARTMENT = 5;

/** Calendar quarters (Q1 = Jan–Mar) for a year — the default quarter definitions (AC-3.2.4). */
export function calendarQuarters(year: number) {
  return [1, 2, 3, 4].map((index) => {
    const startMonth = (index - 1) * 3;
    return {
      index,
      label: `Q${index} ${year}`,
      startsOn: new Date(Date.UTC(year, startMonth, 1)),
      endsOn: new Date(Date.UTC(year, startMonth + 3, 0)),
    };
  });
}

/**
 * Idempotent demo seed: one Organization, a Leadership team + 4 departments x 5
 * teams (21 workspaces), calendar quarter definitions, and a couple of demo
 * users/memberships. Safe to run repeatedly (all upserts).
 */
export async function seed(
  prisma: PrismaClient,
  year: number = new Date().getUTCFullYear(),
): Promise<void> {
  const org = await prisma.organization.upsert({
    where: { slug: 'cadence' },
    update: {},
    create: { name: 'Cadence Demo Org', slug: 'cadence' },
  });

  const leadership = await prisma.team.upsert({
    where: { orgId_name: { orgId: org.id, name: 'Leadership Team' } },
    update: { isLeadership: true },
    create: { orgId: org.id, name: 'Leadership Team', isLeadership: true, order: 0 },
  });

  for (const [deptIndex, deptName] of DEPARTMENTS.entries()) {
    const dept = await prisma.department.upsert({
      where: { orgId_name: { orgId: org.id, name: deptName } },
      update: { order: deptIndex + 1 },
      create: { orgId: org.id, name: deptName, order: deptIndex + 1 },
    });
    for (let i = 1; i <= TEAMS_PER_DEPARTMENT; i++) {
      const name = `${deptName} Team ${i}`;
      await prisma.team.upsert({
        where: { orgId_name: { orgId: org.id, name } },
        update: {},
        create: { orgId: org.id, name, departmentId: dept.id, order: i },
      });
    }
  }

  for (const quarter of calendarQuarters(year)) {
    await prisma.quarterDefinition.upsert({
      where: { orgId_fiscalYear_index: { orgId: org.id, fiscalYear: year, index: quarter.index } },
      update: { label: quarter.label, startsOn: quarter.startsOn, endsOn: quarter.endsOn },
      create: { orgId: org.id, fiscalYear: year, ...quarter },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { isAdmin: true },
    create: { email: 'admin@example.com', name: 'Ada Admin', isAdmin: true, orgId: org.id },
  });
  await prisma.membership.upsert({
    where: { userId_teamId: { userId: admin.id, teamId: leadership.id } },
    update: { teamRole: TeamRole.LEAD },
    create: { orgId: org.id, userId: admin.id, teamId: leadership.id, teamRole: TeamRole.LEAD },
  });

  const marketingTeam = await prisma.team.findUniqueOrThrow({
    where: { orgId_name: { orgId: org.id, name: 'Marketing Team 1' } },
  });
  const member = await prisma.user.upsert({
    where: { email: 'lee@example.com' },
    update: { homeTeamId: marketingTeam.id },
    create: {
      email: 'lee@example.com',
      name: 'Lee Member',
      orgId: org.id,
      homeTeamId: marketingTeam.id,
    },
  });
  await prisma.membership.upsert({
    where: { userId_teamId: { userId: member.id, teamId: marketingTeam.id } },
    update: { teamRole: TeamRole.MEMBER },
    create: {
      orgId: org.id,
      userId: member.id,
      teamId: marketingTeam.id,
      teamRole: TeamRole.MEMBER,
    },
  });
}
