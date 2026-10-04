import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';

/**
 * Authed app shell layout. Wraps every signed-in route with the app bar + drawer.
 * (Auth gating arrives in M1; team context wiring in T1.4.)
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
