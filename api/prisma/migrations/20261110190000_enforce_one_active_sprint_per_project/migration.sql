-- PostgreSQL owns the final concurrency invariant: no project can have two active sprints.
-- Planned and completed sprints remain unrestricted.
CREATE UNIQUE INDEX "sprints_one_active_per_project"
ON "sprints" ("project_id")
WHERE "status" = 'active';
