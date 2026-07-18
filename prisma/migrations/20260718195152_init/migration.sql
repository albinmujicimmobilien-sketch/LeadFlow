-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "propertyType" TEXT NOT NULL DEFAULT 'SONSTIGES',
    "livingArea" REAL,
    "plotArea" REAL,
    "rooms" REAL,
    "buildYear" INTEGER,
    "askingPrice" REAL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceUrl" TEXT,
    "situation" TEXT,
    "motivationTags" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEU'
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_score_idx" ON "Lead"("score");

-- CreateIndex
CREATE INDEX "Lead_postalCode_idx" ON "Lead"("postalCode");

-- CreateIndex
CREATE INDEX "Note_leadId_idx" ON "Note"("leadId");
