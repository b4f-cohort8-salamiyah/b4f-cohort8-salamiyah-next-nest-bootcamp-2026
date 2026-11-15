-- Complete the instructor-provided notification support required by the
-- final frontend convergence contract. Existing enum values and rows remain
-- untouched; PostgreSQL enum additions are forward-only migration history.
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_ON_REPORTED_OR_ASSIGNED_ISSUE';
ALTER TYPE "NotificationType" ADD VALUE 'SPRINT_STARTED';
ALTER TYPE "NotificationType" ADD VALUE 'SPRINT_COMPLETED';
