import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { listQuarterDefinitions } from '@/features/rocks/data/quartersRepo';
import { listTeamRocks, listCompanyRocks } from '@/features/rocks/data/rocksRepo';
import { listTeamMembers, getReadableTeam } from '@/features/org/data/teams';
import {
  resolveCurrentQuarter,
  listQuarters,
  parseQuarterParam,
} from '@/features/rocks/domain/quarter';
import { allowedRockLevelsForTeam } from '@/features/rocks/domain/permissions';
import RocksView from '@/features/rocks/components/RocksView';

export default async function RocksPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ fy?: string; q?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const viewer = await requireUser();

  const team = await getReadableTeam(viewer, teamId);
  if (!team) notFound();

  const defs = await listQuarterDefinitions(viewer.orgId);
  const now = new Date();
  const current = resolveCurrentQuarter(defs, now);
  const selected = {
    fiscalYear: parseQuarterParam(sp.fy, current.fiscalYear),
    quarterIndex: parseQuarterParam(sp.q, current.quarterIndex),
  };

  const [rocks, members] = await Promise.all([
    listTeamRocks(viewer.orgId, teamId, selected),
    listTeamMembers(viewer.orgId, teamId),
  ]);
  const quarterOptions = listQuarters(defs, now);
  const allowedLevels = allowedRockLevelsForTeam(viewer, {
    teamId,
    isLeadership: team.isLeadership,
  });
  // Company Rocks are org-wide; surface (and manage) them on the Leadership board (B1).
  const companyRocks = team.isLeadership
    ? await listCompanyRocks(viewer.orgId, selected)
    : undefined;

  return (
    <RocksView
      rocks={rocks}
      quarterOptions={quarterOptions}
      selected={selected}
      teamId={teamId}
      members={members}
      allowedLevels={allowedLevels}
      companyRocks={companyRocks}
    />
  );
}
