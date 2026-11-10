-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'ISSUE_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'STATUS_CHANGED';
ALTER TYPE "ActivityAction" ADD VALUE 'ASSIGNED';
ALTER TYPE "ActivityAction" ADD VALUE 'SPRINT_STARTED';
ALTER TYPE "ActivityAction" ADD VALUE 'SPRINT_COMPLETED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ISSUE_ASSIGNED';

-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "sprint_id" INTEGER,
ADD COLUMN     "story_points" INTEGER;

-- CreateTable
CREATE TABLE "sprints" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issues_sprint_id_idx" ON "issues"("sprint_id");

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
