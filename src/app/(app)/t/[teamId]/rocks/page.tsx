import ModulePlaceholder from '@/components/ModulePlaceholder';

export default async function RocksPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return (
    <ModulePlaceholder
      title="Rocks"
      note={`Quarterly priorities for team “${teamId}” — arriving in M2.`}
    />
  );
}
