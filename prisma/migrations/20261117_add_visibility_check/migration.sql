CREATE TABLE "VisibilityCheck" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "segment"     TEXT NOT NULL,
    "city"        TEXT,
    "results"     JSONB NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisibilityCheck_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VisibilityCheck_userId_createdAt_idx" ON "VisibilityCheck"("userId", "createdAt");
