-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "billingUserId" TEXT;

-- CreateTable
CREATE TABLE "DismissedInfoCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedInfoCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DismissedInfoCard_userId_idx" ON "DismissedInfoCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DismissedInfoCard_userId_cardId_key" ON "DismissedInfoCard"("userId", "cardId");

-- AddForeignKey
ALTER TABLE "DismissedInfoCard" ADD CONSTRAINT "DismissedInfoCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
