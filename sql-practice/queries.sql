-- CORE Query 1: Every issue in a specific project (e.g., project_id = 1), ordered by id
SELECT * 
FROM issues 
WHERE project_id = 1 
ORDER BY id ASC;


-- CORE Query 2: How many issues does each project have? (Including projects with 0 issues)
SELECT 
    p.id AS project_id, 
    p.name AS project_name, 
    COUNT(i.id) AS issue_count
FROM projects p
LEFT JOIN issues i ON p.id = i.project_id
GROUP BY p.id, p.name;


-- STRETCH Query: How many members does each workspace have, by name, ranked highest first?
SELECT 
    w.name AS workspace_name, 
    COUNT(wm.user_id) AS member_count
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
GROUP BY w.id, w.name
ORDER BY member_count DESC;


-- CHALLENGE: Why must workspace_members be its own table and not an array of member_ids?
-- Reason 1 (Role): A member's 'role' (owner, admin, member) is a property of the relationship itself. An array of IDs cannot store what role each specific user holds in that workspace.
-- Reason 2 (Constraints): This schema uses Foreign Keys (REFERENCES users(id)) to enforce referential integrity. A plain array column cannot have a foreign key constraint preventing the deletion of a user who is currently in the array, nor can it ensure the IDs in the array actually exist in the users table.

-- Final Query: Which single real workspace has the most members?
SELECT 
    w.name AS workspace_name, 
    COUNT(wm.user_id) AS member_count
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
GROUP BY w.id, w.name
ORDER BY member_count DESC
LIMIT 1;