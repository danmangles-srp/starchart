import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { getReadableTeam } from '@/features/org/data/teams';

/**
 * Team-scoped guard (FR-2.4): a team the viewer can't read — or a stray teamId —
 * lands on the friendly not-found, never exposing data. Enforced server-side,
 * regardless of what the client renders.
 */
export default async function TeamLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const viewer = await requireUser().catch(() => redirect('/sign-in'));
  const team = await getReadableTeam(viewer, teamId);
  if (!team) notFound();
  return children;
}
