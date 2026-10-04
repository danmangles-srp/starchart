import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { listReadableTeams } from '@/features/org/data/teams';
import AppShell from '@/components/AppShell';

/**
 * Authed app shell layout. No session → redirect to sign-in (FR-1.1/1.4); otherwise
 * load the teams this viewer may read (Admin = all) for the switcher (FR-2.3).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await requireUser().catch(() => redirect('/sign-in'));
  const teams = await listReadableTeams(viewer);
  return <AppShell teams={teams}>{children}</AppShell>;
}
