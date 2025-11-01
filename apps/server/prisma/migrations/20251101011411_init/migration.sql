-- CreateTable
CREATE TABLE "Submitter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "alias" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submitterId" TEXT,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "description" TEXT,
    "imagePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "moderatedBy" TEXT,
    "moderatedAt" DATETIME,
    CONSTRAINT "Character_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "scaleMin" INTEGER NOT NULL DEFAULT 1,
    "scaleMax" INTEGER NOT NULL DEFAULT 5,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "Round_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "submitterId" TEXT,
    "anonToken" TEXT,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientMeta" TEXT,
    CONSTRAINT "Vote_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vote_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QueuePosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "insertedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueuePosition_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Submitter_token_key" ON "Submitter"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Submitter_email_key" ON "Submitter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Round_characterId_key" ON "Round"("characterId");

-- CreateIndex
CREATE INDEX "Vote_roundId_idx" ON "Vote"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_roundId_submitterId_key" ON "Vote"("roundId", "submitterId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_roundId_anonToken_key" ON "Vote"("roundId", "anonToken");

-- CreateIndex
CREATE UNIQUE INDEX "QueuePosition_characterId_key" ON "QueuePosition"("characterId");
