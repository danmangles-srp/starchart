import { requireUser } from '@/lib/auth/requireUser';
import { myOpenTodosFor } from '@/features/todos/data/todosRepo';
import { listReadableTeams } from '@/features/org/data/teams';
import MyTodosView from '@/features/todos/components/MyTodosView';

/** Personal "My Todos" — open items aggregated across the viewer's teams (FR-6.5). */
export default async function MyTodosPage() {
  const viewer = await requireUser();
  const [todos, teams] = await Promise.all([
    myOpenTodosFor(viewer.orgId, viewer.id),
    listReadableTeams(viewer),
  ]);
  return <MyTodosView todos={todos} teams={teams.map((t) => ({ id: t.id, name: t.name }))} />;
}
