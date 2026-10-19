# B4F Board Postman collection

Import `B4F Board API.postman_collection.json` into Postman. It keeps the existing
collection identity and requests, and covers all 21 current application endpoints:

| Group | Operations |
| --- | --- |
| Auth | Register, login, current user (3) |
| Projects | List, stats, get by id, get by key, create, update, delete (7) |
| Workspaces | List, get by id, get by slug, create, update, delete (6) |
| Issues | List, get by id, create, update, delete (5) |

## Setup

Set these variables in your private Postman environment:

- `baseUrl`: API origin; defaults to `http://localhost:3000`.
- `internalToolKey`: the server's `INTERNAL_TOOL_KEY`. Required only for project
  stats. The old key alone no longer grants access to resource writes.
- `authEmail`, `authPassword`: your account credentials. Passwords need at least
  eight characters. Use an unused email when registering.
- `authName`: display name for registration; defaults to `Postman User`.

Passwords, tool keys and JWTs are blank in the committed collection. Keep real
values private and out of exported/shared files.

`Login` captures `accessToken`; `Get current user` sends it as a Bearer token.
The current server issues tokens lasting **2 hours**, so log in again when
needed. Register returns a user, not a token. JWT auth does not replace the
separate internal-tool key for stats. All nine project/workspace/issue write
requests send the captured Bearer token. Resource reads are public except
project stats.

## Using the requests

- Optional list filters are disabled initially. Enable them in **Params**:
  Projects: `name`, `key`; Workspaces: `name`, `slug`; Issues: `projectId`,
  `status`, `title`. Issue statuses are `todo`, `in_progress`, `review`, `done`.
- Create requests generate unique project keys/workspace slugs and capture the
  numeric ids and lookup values. IDs are application `id` fields, not MongoDB
  `_id` values. Issue creation uses the captured `projectId`.
- The issue update example changes title, description and status. Although its
  DTO accepts `projectId`, the current service does not update that field.
- Run in folder order: **Auth → Projects → Workspaces → Issues → Deletes**.
  For an existing account, skip Register and start with Login.
- Full runs write real database records. Register leaves an account because no
  user-delete endpoint exists. Use your intended test database for full runs.
- Deletes run last, issue first. Their target variables start empty and are
  populated only by successful creates; they do not default to seed ids.
  Each create first clears its previous delete target, so a failed create
  cannot silently reuse an older collection target.
  Deletion is permanent and does not cascade. After a failed/interrupted run,
  review captured targets before sending cleanup requests.
- Captured values are saved as collection variables for individual requests
  and local variables for the current run. Remove environment overrides for
  ids, keys and slugs when using automatic chaining.

Existing success/error examples were retained and refreshed for MongoDB and
JWT authentication (401 on the nine writes, 403 for internal-tool stats).
Endpoints include illustrative examples and
status assertions. Examples are documentation, not captures from your current DB.

## Coverage and verification

The source of truth is the current controller and DTO Swagger metadata, with
service/guard source used for behavior that Swagger does not describe fully.
Swagger is normally available at `/docs`, with JSON at `/docs-json`.

Checks against the live `/docs-json` passed for exact coverage of all 21
operations, query filters, required
headers, Bearer auth, request body fields, variable references, syntax of all
24 script blocks, and JSON in all 62 saved examples.

The application build passed. Postman CLI ran the complete collection against
the real API on port 3101 and an isolated local MongoDB test database using
disposable credentials: **21 requests, 30 assertions, zero failures, exit 0**.
This verified registration/login/current user, public reads, internal-tool
access on stats, JWT-protected create/update/delete, and response chaining.
Disabled query filters and saved negative examples were checked structurally;
they were not sent as separate live requests in this run.

The temporary server was stopped and its isolated test database removed after
verification. The normal application database was not used for the run. Only
the collection and this README were edited. The collection remains v2.1 for
normal Postman import; nothing was pushed to a shared workspace, and the run
used `--no-report-events`.

For the full Session 15 rejection/regression audit (all nine writes, six token
failure cases, stats contrast, filtering, validation and Swagger), run
`npm run test:session15` from `api/` with local MongoDB running. See
`docs/sessions/session-15/TEAMWORK-SOLUTION.md` for the implementation audit.
