import { requireUser } from '@/lib/auth/requireUser';
import { assertCanReadTeam, canEditTeam } from '@/lib/auth/permissions';
import { listTeamTodos } from '@/features/todos/data/todosRepo';
import { listTeamMembers } from '@/features/org/data/teams';
import TodosView from '@/features/todos/components/TodosView';

export default async function TodosPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const viewer = await requireUser();
  assertCanReadTeam(viewer, teamId);

  const [todos, members] = await Promise.all([
    listTeamTodos(viewer.orgId, teamId),
    listTeamMembers(viewer.orgId, teamId),
  ]);

  return (
    <TodosView
      teamId={teamId}
      todos={todos}
      members={members}
      canEdit={canEditTeam(viewer, teamId)}
    />
  );
}
