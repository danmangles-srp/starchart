import ModulePlaceholder from '@/components/ModulePlaceholder';

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return (
    <ModulePlaceholder
      title="Team dashboard"
      note={`One-glance summary of Rocks, Scorecard, Issues, and Todos for team “${teamId}” — arriving in M6.`}
    />
  );
}
