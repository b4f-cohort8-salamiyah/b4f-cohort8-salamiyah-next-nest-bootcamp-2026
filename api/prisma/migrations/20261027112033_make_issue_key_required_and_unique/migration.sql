/*
  Warnings:

  - A unique constraint covering the columns `[project_id,key]` on the table `issues` will be added. If there are existing duplicate values, this will fail.
  - Made the column `key` on table `issues` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "issues" ALTER COLUMN "key" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "issues_project_id_key_key" ON "issues"("project_id", "key");
