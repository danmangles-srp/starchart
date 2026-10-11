import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { UnauthenticatedError } from '@/lib/auth/errors';
import { listReadableTeams } from '@/features/org/data/teams';
import { getIdentity } from '@/features/profile/data/profileRepo';
import { listQuarterDefinitions } from '@/features/rocks/data/quartersRepo';
import { resolveCurrentQuarter, listQuarters } from '@/features/rocks/domain/quarter';
import { timeAnchor } from '@/lib/time';
import AppShell from '@/components/AppShell';

/**
 * Authed app shell layout. No session → redirect to sign-in (FR-1.1/1.4); otherwise
 * load the teams this viewer may read (Admin = all) for the switcher (FR-2.3).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await requireUser().catch((error: unknown) => {
    if (error instanceof UnauthenticatedError) redirect('/sign-in');
    throw error;
  });
  const [teams, identity, defs] = await Promise.all([
    listReadableTeams(viewer),
    getIdentity(viewer.orgId, viewer.id),
    listQuarterDefinitions(viewer.orgId),
  ]);

  // Resolve the shared "today" anchor from the org's quarter definitions (AC-3.2.4 /
  // B5), so the app bar agrees with the Rocks quarter selector instead of always
  // showing a calendar quarter.
  const now = new Date();
  const currentQuarter = resolveCurrentQuarter(defs, now);
  const quarterLabel =
    listQuarters(defs, now).find(
      (o) =>
        o.fiscalYear === currentQuarter.fiscalYear &&
        o.quarterIndex === currentQuarter.quarterIndex,
    )?.label ?? `Q${currentQuarter.quarterIndex} ${currentQuarter.fiscalYear}`;
  const anchor = timeAnchor(now, { ...currentQuarter, label: quarterLabel });

  return (
    <AppShell teams={teams} viewer={identity} timeAnchor={anchor}>
      {children}
    </AppShell>
  );
}
