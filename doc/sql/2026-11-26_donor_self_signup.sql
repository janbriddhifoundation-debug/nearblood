-- Donor self sign-up: link donors to logins, approval status, location, availability.
-- Additive only. Applied to the dev DB on 2026-11-26 with: npx prisma db execute --file <this file> --schema prisma/schema.prisma
-- CreateEnum
CREATE TYPE "DonorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DonorSource" AS ENUM ('NGO', 'SELF');

-- AlterTable
ALTER TABLE "Donor" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastDonatedAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" geography,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "source" "DonorSource" NOT NULL DEFAULT 'NGO',
ADD COLUMN     "status" "DonorStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Donor_userId_key" ON "Donor"("userId");

-- CreateIndex
CREATE INDEX "Donor_organisationId_status_idx" ON "Donor"("organisationId", "status");

-- AddForeignKey
ALTER TABLE "Donor" ADD CONSTRAINT "Donor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

