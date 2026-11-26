/*
  Warnings:

  - You are about to alter the column `location` on the `Request` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Unsupported("geography(Point,4326)")`.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "locationName" TEXT,
ALTER COLUMN "location" SET DATA TYPE geography(Point,4326);
