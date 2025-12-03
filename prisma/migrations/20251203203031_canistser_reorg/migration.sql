/*
  Warnings:

  - You are about to drop the column `isCanister` on the `Paddler` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "isCanister" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "paddlerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "canisterCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Paddler" DROP COLUMN "isCanister";
