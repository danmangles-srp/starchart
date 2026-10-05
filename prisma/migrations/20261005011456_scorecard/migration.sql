-- CreateEnum
CREATE TYPE "Comparator" AS ENUM ('GTE', 'LTE', 'EQ', 'GT', 'LT', 'BETWEEN');

-- CreateEnum
CREATE TYPE "MeasurableFormat" AS ENUM ('NUMBER', 'PERCENT', 'CURRENCY', 'TIME');

-- CreateTable
CREATE TABLE "Measurable" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "goalValue" DOUBLE PRECISION NOT NULL,
    "goalMax" DOUBLE PRECISION,
    "comparator" "Comparator" NOT NULL,
    "format" "MeasurableFormat" NOT NULL DEFAULT 'NUMBER',
    "unit" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measurable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyEntry" (
    "id" TEXT NOT NULL,
    "measurableId" TEXT NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "value" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Measurable_orgId_idx" ON "Measurable"("orgId");

-- CreateIndex
CREATE INDEX "Measurable_teamId_idx" ON "Measurable"("teamId");

-- CreateIndex
CREATE INDEX "Measurable_ownerId_idx" ON "Measurable"("ownerId");

-- CreateIndex
CREATE INDEX "WeeklyEntry_measurableId_idx" ON "WeeklyEntry"("measurableId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyEntry_measurableId_isoYear_isoWeek_key" ON "WeeklyEntry"("measurableId", "isoYear", "isoWeek");

-- AddForeignKey
ALTER TABLE "Measurable" ADD CONSTRAINT "Measurable_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurable" ADD CONSTRAINT "Measurable_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurable" ADD CONSTRAINT "Measurable_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyEntry" ADD CONSTRAINT "WeeklyEntry_measurableId_fkey" FOREIGN KEY ("measurableId") REFERENCES "Measurable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
