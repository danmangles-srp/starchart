import ModulePlaceholder from '@/components/ModulePlaceholder';

export default async function IssuesPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return (
    <ModulePlaceholder
      title="Issues"
      note={`IDS short- and long-term lists for team “${teamId}” — arriving in M5.`}
    />
  );
}
