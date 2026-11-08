-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "key" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "issue_seq" INTEGER NOT NULL DEFAULT 0;
