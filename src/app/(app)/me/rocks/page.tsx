import { auth } from '@/auth';
import { requireUser } from '@/lib/auth/requireUser';
import { listQuarterDefinitions } from '@/features/rocks/data/quartersRepo';
import { listIndividualRocks } from '@/features/rocks/data/rocksRepo';
import {
  resolveCurrentQuarter,
  listQuarters,
  parseQuarterParam,
} from '@/features/rocks/domain/quarter';
import MyRocksView from '@/features/rocks/components/MyRocksView';

/** Personal "My Rocks" — the viewer's Individual rocks for a quarter (FR-3.1 / B1). */
export default async function MyRocksPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const viewer = await requireUser();
  const session = await auth();
  const selfName = session?.user?.name ?? session?.user?.email ?? 'Me';

  const defs = await listQuarterDefinitions(viewer.orgId);
  const now = new Date();
  const current = resolveCurrentQuarter(defs, now);
  const selected = {
    fiscalYear: parseQuarterParam(sp.fy, current.fiscalYear),
    quarterIndex: parseQuarterParam(sp.q, current.quarterIndex),
  };

  const rocks = await listIndividualRocks(viewer.orgId, viewer.id, selected);
  const quarterOptions = listQuarters(defs, now);

  return (
    <MyRocksView
      rocks={rocks}
      quarterOptions={quarterOptions}
      selected={selected}
      self={{ userId: viewer.id, name: selfName }}
    />
  );
}
