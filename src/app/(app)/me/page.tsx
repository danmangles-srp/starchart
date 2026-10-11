import { requireUser } from '@/lib/auth/requireUser';
import { getProfile } from '@/features/profile/data/profileRepo';
import ProfileView from '@/features/profile/components/ProfileView';

/** The viewer's profile — identity, role, memberships, and the job-title edit (FR-1.3). */
export default async function ProfilePage() {
  const viewer = await requireUser();
  const profile = await getProfile(viewer.orgId, viewer.id);
  return <ProfileView profile={profile} />;
}
