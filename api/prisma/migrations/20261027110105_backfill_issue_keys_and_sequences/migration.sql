UPDATE issues i
SET key = p.key || '-' || sub.rn
FROM (
  SELECT
    id,
    project_id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id
      ORDER BY id
    ) AS rn
  FROM issues
) sub
JOIN projects p ON p.id = sub.project_id
WHERE i.id = sub.id;

UPDATE projects p
SET issue_seq = sub.cnt
FROM (
  SELECT
    project_id,
    COUNT(*) AS cnt
  FROM issues
  GROUP BY project_id
) sub
WHERE p.id = sub.project_id;