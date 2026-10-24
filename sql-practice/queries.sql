SELECT i.id, i.key, i.title, i.status
FROM issues i
JOIN projects p ON p.id = i.project_id
WHERE p.key = 'WEB'
ORDER BY i.key;


SELECT p.id, p.key, p.name, COUNT(i.id) AS issue_count
FROM projects p
LEFT JOIN issues i ON i.project_id = p.id
GROUP BY p.id, p.key, p.name
ORDER BY p.id;


SELECT w.name, COUNT(wm.id) AS member_count
FROM workspaces w
JOIN workspace_members wm ON wm.workspace_id = w.id
GROUP BY w.id, w.name
ORDER BY member_count DESC, w.name;


-- Why must workspace_members be its own table instead of a column like
-- member_ids INTEGER[] on workspaces?
--
-- Reason 1 (where the role lives): a member's role ('owner', 'admin',
-- 'member') is an attribute of the relationship between ONE user and ONE
-- workspace. In workspace_members it is the role column, guarded by
-- CHECK (role IN ('owner','admin','member')). A plain INTEGER[] on
-- workspaces holds only user ids and has nowhere to store a per-member
-- role, so the same user could not be 'admin' in one workspace and
-- 'member' in another.
--
-- Reason 2 (constraints this schema already enforces): workspace_members
-- has UNIQUE (workspace_id, user_id), so a user can appear only once per
-- workspace, and user_id REFERENCES users(id), so every member must be a
-- real user. An array column cannot declare uniqueness of its elements
-- and cannot make each element a foreign key, so it could hold duplicate
-- ids or ids of users that do not exist.
--

SELECT w.name, COUNT(wm.id) AS member_count
FROM workspaces w
JOIN workspace_members wm ON wm.workspace_id = w.id
GROUP BY w.id, w.name
ORDER BY member_count DESC, w.name
LIMIT 1;