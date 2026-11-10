-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'MEMBER_ADDED';
ALTER TYPE "ActivityAction" ADD VALUE 'MEMBER_REMOVED';
ALTER TYPE "ActivityAction" ADD VALUE 'MEMBER_ROLE_CHANGED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MEMBER_ADDED';
ALTER TYPE "NotificationType" ADD VALUE 'WORKSPACE_ROLE_CHANGED';
