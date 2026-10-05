import { requireUser } from '@/lib/auth/requireUser';
import { loadTeamScorecard } from '@/features/scorecard/server/queries';
import ScorecardGrid from '@/features/scorecard/components/ScorecardGrid';

function parseOffset(value: string | undefined): number {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

export default async function ScorecardPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ w?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const viewer = await requireUser();

  const vm = await loadTeamScorecard(viewer, teamId, parseOffset(sp.w));

  return <ScorecardGrid vm={vm} />;
}
