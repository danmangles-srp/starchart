import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import { UnauthenticatedError } from '@/lib/auth/errors';

/** Admin-only (FR-1.2), enforced server-side — a non-admin gets not-found. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireUser().catch((error: unknown) => {
    if (error instanceof UnauthenticatedError) redirect('/sign-in');
    throw error;
  });
  if (!viewer.isAdmin) notFound();
  return children;
}
