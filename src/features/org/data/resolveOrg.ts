import type { Organization, PrismaClient } from '@prisma/client';

export const DEFAULT_ORG_SLUG = 'cadence';

/**
 * Resolve the Organization a signing-in user belongs to. v1 runs a single org,
 * so every allowed user maps to it; the schema is org-ready for a future
 * domain→org mapping (FR-2.7). Upserts so sign-in works on a fresh database.
 */
export async function getOrCreateDefaultOrg(prisma: PrismaClient): Promise<Organization> {
  return prisma.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    update: {},
    create: { name: 'Cadence', slug: DEFAULT_ORG_SLUG },
  });
}
