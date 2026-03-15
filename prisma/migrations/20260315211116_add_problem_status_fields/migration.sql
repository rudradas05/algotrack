-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "needsRetry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retryNotes" TEXT DEFAULT '',
ADD COLUMN     "solvedByMe" BOOLEAN NOT NULL DEFAULT true;
