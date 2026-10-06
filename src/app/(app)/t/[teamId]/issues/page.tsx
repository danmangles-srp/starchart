import { requireUser } from '@/lib/auth/requireUser';
import { assertCanReadTeam, canEditTeam } from '@/lib/auth/permissions';
import { listTeamIssues } from '@/features/issues/data/issuesRepo';
import { listTeamMembers } from '@/features/org/data/teams';
import IssuesView from '@/features/issues/components/IssuesView';

export default async function IssuesPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const viewer = await requireUser();
  assertCanReadTeam(viewer, teamId);

  const [issues, members] = await Promise.all([
    listTeamIssues(viewer.orgId, teamId),
    listTeamMembers(viewer.orgId, teamId),
  ]);

  return (
    <IssuesView
      teamId={teamId}
      issues={issues}
      members={members}
      canEdit={canEditTeam(viewer, teamId)}
    />
  );
}
