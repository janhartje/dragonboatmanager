-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "boatSize" TEXT NOT NULL DEFAULT 'standard',
ALTER COLUMN "type" SET DEFAULT 'training';
