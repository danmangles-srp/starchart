import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/lib/auth/errors';
import {
  createRock,
  listTeamRocks,
  getRockDetail,
  setRockStatus,
  myRocksFor,
  teamRockSummary,
  addMilestone,
  setMilestoneDone,
  reorderMilestones,
  linkRocks,
  unlinkRocks,
  getSupportingRocks,
  getSupportedCompanyRock,
  listLinkableTeamRocks,
} from './rocksRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();
const quarter = { fiscalYear: 2026, quarterIndex: 1 };

describe.skipIf(!testUrl)('rocksRepo (Tier 2.5)', () => {
  let orgId = '';
  let userId = '';
  let teamId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({
      data: { name: 'Rocks Test', slug: `rocks-${stamp}` },
    });
    orgId = org.id;
    userId = (await prisma.user.create({ data: { email: `rocks-${stamp}@example.com`, orgId } }))
      .id;
    teamId = (await prisma.team.create({ data: { orgId, name: 'Rocks Team' } })).id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.rock.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('creates, lists, aggregates per team and per owner', async () => {
    if (!prisma) return;
    await createRock(
      orgId,
      {
        title: 'Launch v1',
        ownerId: userId,
        level: 'TEAM',
        teamId,
        fiscalYear: 2026,
        quarterIndex: 1,
      },
      prisma,
    );

    const list = await listTeamRocks(orgId, teamId, quarter, prisma);
    expect(list).toHaveLength(1);
    expect(list[0]?.status).toBe('on-track');
    expect(list[0]?.milestonesTotal).toBe(0);

    expect(await myRocksFor(orgId, userId, quarter, prisma)).toHaveLength(1);

    const summary = await teamRockSummary(orgId, teamId, quarter, prisma);
    expect(summary).toMatchObject({ total: 1, onTrack: 1, atRisk: 0 });
  });

  it('updates status and refuses cross-org writes', async () => {
    if (!prisma) return;
    const rock = await createRock(
      orgId,
      { title: 'Hire', ownerId: userId, level: 'TEAM', teamId, fiscalYear: 2026, quarterIndex: 1 },
      prisma,
    );
    await setRockStatus(orgId, rock.id, 'at-risk', prisma);
    expect((await getRockDetail(orgId, rock.id, prisma))?.status).toBe('at-risk');

    await expect(setRockStatus('other-org', rock.id, 'done', prisma)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('adds, toggles, and reorders milestones', async () => {
    if (!prisma) return;
    const rock = await createRock(
      orgId,
      {
        title: 'Milestoned',
        ownerId: userId,
        level: 'TEAM',
        teamId,
        fiscalYear: 2026,
        quarterIndex: 1,
      },
      prisma,
    );
    const a = await addMilestone(orgId, rock.id, 'A', prisma);
    const b = await addMilestone(orgId, rock.id, 'B', prisma);

    await setMilestoneDone(orgId, rock.id, a.id, true, prisma);
    const first = await getRockDetail(orgId, rock.id, prisma);
    expect(first?.milestones.map((m) => m.title)).toEqual(['A', 'B']);
    expect(first?.milestones.find((m) => m.id === a.id)?.done).toBe(true);

    await reorderMilestones(orgId, rock.id, [b.id, a.id], prisma);
    const second = await getRockDetail(orgId, rock.id, prisma);
    expect(second?.milestones.map((m) => m.title)).toEqual(['B', 'A']);

    await expect(addMilestone('other-org', rock.id, 'X', prisma)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('links a company rock to supporting team rocks', async () => {
    if (!prisma) return;
    const q = { fiscalYear: 2026, quarterIndex: 1 };
    const company = await createRock(
      orgId,
      { title: 'Co Rock', ownerId: userId, level: 'COMPANY', teamId: null, ...q },
      prisma,
    );
    const t1 = await createRock(
      orgId,
      { title: 'Supporter 1', ownerId: userId, level: 'TEAM', teamId, ...q },
      prisma,
    );
    const t2 = await createRock(
      orgId,
      { title: 'Supporter 2', ownerId: userId, level: 'TEAM', teamId, ...q },
      prisma,
    );

    await linkRocks(orgId, company.id, t1.id, prisma);
    expect((await getSupportingRocks(orgId, company.id, prisma)).map((r) => r.id)).toEqual([t1.id]);
    expect(await getSupportedCompanyRock(orgId, t1.id, prisma)).toMatchObject({ id: company.id });

    const linkable = (await listLinkableTeamRocks(orgId, company.id, q, prisma)).map((r) => r.id);
    expect(linkable).toContain(t2.id);
    expect(linkable).not.toContain(t1.id);

    await unlinkRocks(orgId, company.id, t1.id, prisma);
    expect(await getSupportingRocks(orgId, company.id, prisma)).toHaveLength(0);
  });
});
