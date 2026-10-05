import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/requireUser';
import {
  getRockDetail,
  getSupportingRocks,
  getSupportedCompanyRock,
  listLinkableTeamRocks,
} from '@/features/rocks/data/rocksRepo';
import { canReadRock, canManageRock } from '@/features/rocks/domain/permissions';
import { rollupStatus } from '@/features/rocks/domain/rock';
import RockDetailView from '@/features/rocks/components/RockDetailView';
import CompanyRockLinks from '@/features/rocks/components/CompanyRockLinks';
import TeamRockSupports from '@/features/rocks/components/TeamRockSupports';

export default async function RockDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; rockId: string }>;
}) {
  const { teamId, rockId } = await params;
  const viewer = await requireUser();
  const rock = await getRockDetail(viewer.orgId, rockId);
  const scope = rock && { level: rock.level, teamId: rock.teamId, ownerId: rock.ownerId };
  if (!rock || !scope || !canReadRock(viewer, scope)) notFound();

  const canEdit = canManageRock(viewer, scope);

  let links = null;
  if (rock.level === 'COMPANY') {
    const supporting = await getSupportingRocks(viewer.orgId, rock.id);
    const linkable = canEdit
      ? await listLinkableTeamRocks(viewer.orgId, rock.id, {
          fiscalYear: rock.fiscalYear,
          quarterIndex: rock.quarterIndex,
        })
      : [];
    links = (
      <CompanyRockLinks
        companyRockId={rock.id}
        teamId={teamId}
        supporting={supporting}
        rolledUp={rollupStatus(supporting.map((s) => s.status))}
        linkable={linkable}
        canEdit={canEdit}
      />
    );
  } else if (rock.level === 'TEAM') {
    const supported = await getSupportedCompanyRock(viewer.orgId, rock.id);
    if (supported) links = <TeamRockSupports teamId={teamId} company={supported} />;
  }

  return (
    <>
      <RockDetailView rock={rock} canEdit={canEdit} />
      {links}
    </>
  );
}
