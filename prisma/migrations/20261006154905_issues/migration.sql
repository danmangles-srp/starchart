-- CreateEnum
CREATE TYPE "IssueListType" AS ENUM ('SHORT', 'LONG');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "raiserId" TEXT NOT NULL,
    "ownerId" TEXT,
    "listType" "IssueListType" NOT NULL DEFAULT 'SHORT',
    "rank" INTEGER NOT NULL DEFAULT 0,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "solvedById" TEXT,
    "resolutionNote" TEXT,
    "createdTodoId" TEXT,
    "createdRockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_orgId_idx" ON "Issue"("orgId");

-- CreateIndex
CREATE INDEX "Issue_teamId_idx" ON "Issue"("teamId");

-- CreateIndex
CREATE INDEX "Issue_ownerId_idx" ON "Issue"("ownerId");

-- CreateIndex
CREATE INDEX "Issue_teamId_listType_solved_idx" ON "Issue"("teamId", "listType", "solved");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_raiserId_fkey" FOREIGN KEY ("raiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_solvedById_fkey" FOREIGN KEY ("solvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
