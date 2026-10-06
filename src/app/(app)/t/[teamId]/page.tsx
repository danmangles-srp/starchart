import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { assertCanReadTeam } from '@/lib/auth/permissions';
import { getReadableTeam } from '@/features/org/data/teams';
import { loadTeamDashboard } from '@/features/home/server/assembly';
import TeamDashboardView from '@/features/home/components/TeamDashboardView';

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const viewer = await requireUser();
  assertCanReadTeam(viewer, teamId);

  const team = await getReadableTeam(viewer, teamId);
  if (!team) notFound();

  const data = await loadTeamDashboard(viewer, teamId);
  return <TeamDashboardView teamId={teamId} teamName={team.name} data={data} />;
}
