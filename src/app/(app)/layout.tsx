import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AppShell from '@/components/AppShell';

/**
 * Authed app shell layout. Every signed-in route is gated here: no session →
 * redirect to sign-in (FR-1.1 / FR-1.4). Team context wiring in T1.4.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  return <AppShell>{children}</AppShell>;
}
