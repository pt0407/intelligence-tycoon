-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyLevel" INTEGER NOT NULL DEFAULT 1,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "capital" BIGINT NOT NULL DEFAULT 10000,
    "computeOwned" INTEGER NOT NULL DEFAULT 0,
    "researchPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAction" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "parameters" JSONB,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipAddress" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- CreateIndex
CREATE INDEX "Player_userId_idx" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Player_username_idx" ON "Player"("username");

-- CreateIndex
CREATE INDEX "PlayerAction_playerId_idx" ON "PlayerAction"("playerId");

-- CreateIndex
CREATE INDEX "PlayerAction_actionType_idx" ON "PlayerAction"("actionType");

-- CreateIndex
CREATE INDEX "PlayerAction_flagged_idx" ON "PlayerAction"("flagged");

-- CreateIndex
CREATE INDEX "PlayerAction_createdAt_idx" ON "PlayerAction"("createdAt");
