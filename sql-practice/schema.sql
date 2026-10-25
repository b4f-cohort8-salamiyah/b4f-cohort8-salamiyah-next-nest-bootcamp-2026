CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (project_id, key)
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);


INSERT INTO users (name, email, password_hash) VALUES ('Lina Haddad', 'lina@b4fdemo.local', 'x'), ('Omar Saleh', 'omar@b4fdemo.local', 'x'), ('Rami Younes', 'rami@b4fdemo.local', 'x'), ('Zaid Mansour', 'zaid@b4fdemo.local', 'x');
INSERT INTO workspaces (name, slug, owner_id) VALUES ('Acme Robotics', 'acme-robotics', 1), ('Nebula Labs', 'nebula-labs', 2);
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (1, 1, 'owner'), (1, 2, 'member'), (1, 3, 'admin'), (2, 2, 'owner');
INSERT INTO projects (workspace_id, key, name, description) VALUES (1, 'WEB', 'Web App', 'Customer UI'), (1, 'API', 'Backend API', 'Core services'), (2, 'MOB', 'Mobile App', 'iOS and Android');
INSERT INTO issues (project_id, key, title, status, assignee_id, reporter_id) VALUES (1, 'WEB-1', 'Fix navbar overflow', 'in_progress', 2, 3), (1, 'WEB-2', 'Add dark mode', 'todo', 4, 1), (2, 'API-1', 'Rate limit login', 'todo', 3, 1), (3, 'MOB-1', 'Crash on launch', 'in_progress', 2, 2);
INSERT INTO comments (issue_id, author_id, body) VALUES (1, 1, 'Can you share a screenshot?'), (1, 4, 'Attached above.');

INSERT INTO issues (project_id, key, title, status, assignee_id, reporter_id)
SELECT
  (gs % 3) + 1,
  'BULK-' || gs,
  'Synthetic issue ' || gs,
  CASE WHEN gs % 1000 = 0 THEN 'blocked' ELSE 'todo' END,
  (gs % 4) + 1,
  (gs % 4) + 1
FROM generate_series(1, 5000) AS gs;

ANALYZE issues;

EXPLAIN ANALYZE SELECT id, key, title FROM issues WHERE status = 'blocked';

---------------------------------------------------------------------------

CREATE INDEX idx_issues_status ON issues(status);

ANALYZE issues;

EXPLAIN ANALYZE SELECT id, key, title FROM issues WHERE status = 'blocked';

---------------------------------------------------------------------------

ALTER TABLE projects ADD COLUMN issue_seq INTEGER NOT NULL DEFAULT 0;

UPDATE projects SET issue_seq = 2 WHERE key = 'WEB';
UPDATE projects SET issue_seq = 1 WHERE key = 'API';
UPDATE projects SET issue_seq = 1 WHERE key = 'MOB';

---------------------------------------------------------------------------

BEGIN;

UPDATE projects SET issue_seq = issue_seq + 1 WHERE id = 1 RETURNING issue_seq;

INSERT INTO issues (project_id, key, title, status) VALUES (1, 'WEB-3', 'Real transactional issue', 'todo');

COMMIT;

SELECT id, key, issue_seq FROM projects WHERE id = 1;
SELECT key, title FROM issues WHERE key = 'WEB-3';

---------------------------------------------------------------------------

BEGIN;

UPDATE projects SET issue_seq = issue_seq + 1 WHERE id = 1 RETURNING issue_seq;

INSERT INTO issues (project_id, key, title, status) VALUES (1, 'WEB-ROLLBACK-TEST', 'Should not exist', 'todo');

ROLLBACK;

SELECT id, key, issue_seq FROM projects WHERE id = 1;
SELECT count(*) FROM issues WHERE key = 'WEB-ROLLBACK-TEST';