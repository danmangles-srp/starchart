import { requireUser } from '@/lib/auth/requireUser';
import { getAdminOverview } from '@/features/admin/data/adminRepo';
import AdminConsole, { type AdminData } from '@/features/admin/components/AdminConsole';

export default async function AdminPage() {
  const viewer = await requireUser();
  const overview = await getAdminOverview(viewer.orgId);

  const data: AdminData = {
    teams: overview.teams.map((t) => ({
      id: t.id,
      name: t.name,
      isLeadership: t.isLeadership,
      departmentId: t.departmentId,
      archivedAt: t.archivedAt ? t.archivedAt.toISOString() : null,
    })),
    departments: overview.departments.map((d) => ({ id: d.id, name: d.name })),
    users: overview.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isAdmin: u.isAdmin,
      memberships: u.memberships.map((m) => ({ teamId: m.teamId, teamRole: m.teamRole })),
    })),
    quarters: overview.quarters.map((q) => ({
      id: q.id,
      fiscalYear: q.fiscalYear,
      index: q.index,
      label: q.label,
      startsOn: q.startsOn.toISOString().slice(0, 10),
      endsOn: q.endsOn.toISOString().slice(0, 10),
    })),
  };

  return <AdminConsole data={data} />;
}
