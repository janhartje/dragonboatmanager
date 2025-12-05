-- CreateTable
CREATE TABLE "SentEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT[],
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "props" JSONB,
    "resendId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);
