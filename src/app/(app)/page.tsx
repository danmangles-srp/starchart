import { requireUser } from '@/lib/auth/requireUser';
import { loadMyWeek } from '@/features/home/server/assembly';
import MyWeekView from '@/features/home/components/MyWeekView';

/** Personal landing — "My Week" aggregated across the viewer's teams (FR-7.1). */
export default async function MyWeekPage() {
  const viewer = await requireUser();
  const data = await loadMyWeek(viewer);
  return <MyWeekView data={data} />;
}
