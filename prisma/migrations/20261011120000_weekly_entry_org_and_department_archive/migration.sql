-- Department: soft-archive support (AC-2.5.1 — retire a department, not just a team).
ALTER TABLE "Department" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Department_archivedAt_idx" ON "Department"("archivedAt");

-- WeeklyEntry: carry orgId so cross-org isolation is structural (AC-2.7.1 / NFR-1.5),
-- not merely derived through the Measurable join. Expand -> backfill -> constrain so the
-- change is safe against a populated table.
ALTER TABLE "WeeklyEntry" ADD COLUMN "orgId" TEXT;
UPDATE "WeeklyEntry" AS we SET "orgId" = m."orgId" FROM "Measurable" AS m WHERE we."measurableId" = m."id";
ALTER TABLE "WeeklyEntry" ALTER COLUMN "orgId" SET NOT NULL;
CREATE INDEX "WeeklyEntry_orgId_idx" ON "WeeklyEntry"("orgId");
ALTER TABLE "WeeklyEntry" ADD CONSTRAINT "WeeklyEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Clear the known local drift: an orphaned column left by a reverted migration. IF EXISTS
-- so this is a harmless no-op on databases that never had it (e.g. a fresh production DB).
ALTER TABLE "Rock" DROP COLUMN IF EXISTS "sourceIssueId";
