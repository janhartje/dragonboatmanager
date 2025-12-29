-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;
