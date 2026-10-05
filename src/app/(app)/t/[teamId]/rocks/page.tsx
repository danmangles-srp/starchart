import { requireUser } from '@/lib/auth/requireUser';
import { listQuarterDefinitions } from '@/features/rocks/data/quartersRepo';
import { listTeamRocks } from '@/features/rocks/data/rocksRepo';
import { listTeamMembers } from '@/features/org/data/teams';
import { resolveCurrentQuarter, listQuarters } from '@/features/rocks/domain/quarter';
import RocksView from '@/features/rocks/components/RocksView';

function parseNum(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value && Number.isFinite(n) ? n : fallback;
}

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

  const defs = await listQuarterDefinitions(viewer.orgId);
  const now = new Date();
  const current = resolveCurrentQuarter(defs, now);
  const selected = {
    fiscalYear: parseNum(sp.fy, current.fiscalYear),
    quarterIndex: parseNum(sp.q, current.quarterIndex),
  };

  const rocks = await listTeamRocks(viewer.orgId, teamId, selected);
  const members = await listTeamMembers(viewer.orgId, teamId);
  const quarterOptions = listQuarters(defs, now);

  return (
    <RocksView
      rocks={rocks}
      quarterOptions={quarterOptions}
      selected={selected}
      teamId={teamId}
      members={members}
    />
  );
}
