/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "projects_workspace_id_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");
