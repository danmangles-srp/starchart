import ModulePlaceholder from '@/components/ModulePlaceholder';

export default async function TodosPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return (
    <ModulePlaceholder
      title="Todos"
      note={`7-day action items for team “${teamId}” — arriving in M4.`}
    />
  );
}
