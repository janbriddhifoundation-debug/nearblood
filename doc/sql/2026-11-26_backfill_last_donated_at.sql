-- Backfill Donor."lastDonatedAt" for donations certified before the column existed.
-- Uses the request's required date (capped at the certificate date). Only fills NULLs.
-- Applied to the dev DB on 2026-11-26 with: npx prisma db execute --file <this file> --schema prisma/schema.prisma
UPDATE "Donor" d
SET "lastDonatedAt" = latest.donated_at
FROM (
	SELECT rd."donorId", MAX(LEAST(COALESCE(r."requirementDate", dc."generatedAt"), dc."generatedAt")) AS donated_at
	FROM "RequestDonors" rd
	JOIN "DonationCertificate" dc ON dc."requestDonorId" = rd.id
	LEFT JOIN "Request" r ON r.id = rd."requestId"
	GROUP BY rd."donorId"
) latest
WHERE d.id = latest."donorId" AND d."lastDonatedAt" IS NULL;
