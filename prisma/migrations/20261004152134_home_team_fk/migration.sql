-- CreateIndex
CREATE INDEX "User_homeTeamId_idx" ON "User"("homeTeamId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
