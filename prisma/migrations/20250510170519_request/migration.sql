-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "patientName" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "patientAddress" TEXT,
    "relWRequester" TEXT,
    "hospitalRegNo" TEXT,
    "bloodGroup" TEXT,
    "units" TEXT,
    "urgency" TEXT,
    "reason" TEXT,
    "hospital" TEXT,
    "location" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "requirementDate" TIMESTAMP(3),
    "contact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
