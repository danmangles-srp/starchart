import ModulePlaceholder from '@/components/ModulePlaceholder';

export default async function ScorecardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return (
    <ModulePlaceholder
      title="Scorecard"
      note={`Weekly measurables for team “${teamId}” — arriving in M3.`}
    />
  );
}
