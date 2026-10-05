import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { getRockDetail } from '@/features/rocks/data/rocksRepo';
import { canReadRock, canManageRock } from '@/features/rocks/domain/permissions';
import RockDetailView from '@/features/rocks/components/RockDetailView';

export default async function RockDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; rockId: string }>;
}) {
  const { rockId } = await params;
  const viewer = await requireUser();
  const rock = await getRockDetail(viewer.orgId, rockId);
  const scope = rock && { level: rock.level, teamId: rock.teamId, ownerId: rock.ownerId };
  if (!rock || !scope || !canReadRock(viewer, scope)) notFound();

  return <RockDetailView rock={rock} canEdit={canManageRock(viewer, scope)} />;
}
