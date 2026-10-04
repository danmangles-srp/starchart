-- CreateEnum
CREATE TYPE "RockLevel" AS ENUM ('COMPANY', 'TEAM', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "RockStatusValue" AS ENUM ('ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'DONE');

-- CreateTable
CREATE TABLE "Rock" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "level" "RockLevel" NOT NULL,
    "teamId" TEXT,
    "fiscalYear" INTEGER NOT NULL,
    "quarterIndex" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "RockStatusValue" NOT NULL DEFAULT 'ON_TRACK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "rockId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RockLink" (
    "id" TEXT NOT NULL,
    "companyRockId" TEXT NOT NULL,
    "teamRockId" TEXT NOT NULL,

    CONSTRAINT "RockLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rock_orgId_idx" ON "Rock"("orgId");

-- CreateIndex
CREATE INDEX "Rock_teamId_idx" ON "Rock"("teamId");

-- CreateIndex
CREATE INDEX "Rock_ownerId_idx" ON "Rock"("ownerId");

-- CreateIndex
CREATE INDEX "Rock_orgId_fiscalYear_quarterIndex_idx" ON "Rock"("orgId", "fiscalYear", "quarterIndex");

-- CreateIndex
CREATE INDEX "Milestone_rockId_idx" ON "Milestone"("rockId");

-- CreateIndex
CREATE INDEX "RockLink_companyRockId_idx" ON "RockLink"("companyRockId");

-- CreateIndex
CREATE INDEX "RockLink_teamRockId_idx" ON "RockLink"("teamRockId");

-- CreateIndex
CREATE UNIQUE INDEX "RockLink_companyRockId_teamRockId_key" ON "RockLink"("companyRockId", "teamRockId");

-- AddForeignKey
ALTER TABLE "Rock" ADD CONSTRAINT "Rock_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rock" ADD CONSTRAINT "Rock_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rock" ADD CONSTRAINT "Rock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_rockId_fkey" FOREIGN KEY ("rockId") REFERENCES "Rock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RockLink" ADD CONSTRAINT "RockLink_companyRockId_fkey" FOREIGN KEY ("companyRockId") REFERENCES "Rock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RockLink" ADD CONSTRAINT "RockLink_teamRockId_fkey" FOREIGN KEY ("teamRockId") REFERENCES "Rock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
