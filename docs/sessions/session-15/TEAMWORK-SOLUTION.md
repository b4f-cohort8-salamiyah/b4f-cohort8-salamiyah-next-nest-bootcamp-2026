# Session 15 teamwork: JWT identity on every resource write

## Implementation audit

The existing `JwtAuthGuard` now protects create, update and remove on Projects,
Workspaces and Issues: nine routes total. The shared tool key alone no longer
passes those guards. No new packages, guards, decorators, membership rules,
roles, ownership fields or permission checks were introduced.

Each changed route uses the existing `@ApiBearerAuth()` pattern and documents
401 for a missing, invalid or expired token. The obsolete internal-tool header
requirement and 403 response were removed from those nine Swagger operations.

The required comment immediately above the project stats operation explains the
intentional distinction: `InternalToolGuard` asks whether the caller has access
as internal tooling; `JwtAuthGuard` asks which signed-in user is calling. A valid
user token is not the tool key. The stats method, guard, Swagger header and 403
response were preserved; all public read routes were left unchanged.

The existing Postman collection now uses Bearer auth on those nine writes and
keeps the internal-tool header only on project stats. Login still captures the
token for subsequent requests. Documentation reflects the current two-hour
JWT expiry; the expiry itself was not changed by this task.

## Real dependency-injection error and fix

After wiring the existing guard into the feature modules, TypeScript compiled,
but a real application startup failed with:

```text
Nest can't resolve dependencies of the JwtAuthGuard (?).
Please make sure that the argument JwtService at index [0]
is available in the ProjectsModule context.
```

The error identified the guard's constructor dependency and the module where
Nest could not supply it. `JwtService` was configured through `JwtModule` inside
AuthModule only, so it was unavailable in the feature modules.

Adding `global: true` to the existing `JwtModule.registerAsync(...)` configuration
makes that same configured service available throughout the application. The
feature modules register the existing guard as a provider. This reuses the same
signing/verification configuration without adding a new mechanism or duplicating
secrets. Making the JWT module global does not make the guard global: reads stay
public because only the intended methods use `@UseGuards(JwtAuthGuard)`.

## Real verification

Run the repeatable audit from `api/` with MongoDB available at localhost:27017:

```bash
npm run test:session15
```

The audit builds the application, boots real Nest with its actual modules,
uses real HTTP requests, and connects to a unique disposable local MongoDB
database. It registers and logs in a real test user, uses the returned JWT,
and removes its own database and closes the server afterward. It never uses
the normal application's database or credentials.

Result: **82 tests passed, zero failed** (81 subtests plus the parent audit).

| Route | No token | Real old key only | Real login JWT only |
| --- | --- | --- | --- |
| POST /projects | 401 | 401 | 201 |
| PATCH /projects/:id | 401 | 401 | 200 |
| DELETE /projects/:id | 401 | 401 | 200 |
| POST /workspaces | 401 | 401 | 201 |
| PATCH /workspaces/:id | 401 | 401 | 200 |
| DELETE /workspaces/:id | 401 | 401 | 200 |
| POST /issues | 401 | 401 | 201 |
| PATCH /issues/:id | 401 | 401 | 200 |
| DELETE /issues/:id | 401 | 401 | 200 |
| GET /projects/stats | 403 | 200 | 403 |

Every write additionally rejects an invalid token, an expired signed token, a
token signed with the wrong secret, and an incorrect authentication scheme.
All six rejection cases match `/auth/me` exactly:

```json
{
  "message": "Invalid or missing authentication token.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

The audit also verifies registration, duplicate email rejection, login, incorrect
password rejection, safe `/auth/me` output, public list/detail/key/slug reads,
all resource filter fields, authenticated DTO validation, malformed ids,
missing resources, duplicate project keys/workspace slugs, delete responses,
and Swagger security metadata. Project stats still returns the unchanged total
shape and original 403 body for a missing/wrong key or a JWT alone.

The existing Postman collection was run against a second isolated local database:
**21 requests and 30 assertions passed, exit 0**, with cloud reporting disabled.

Finally, Swagger UI was tested in a separate browser tab at the temporary API's
`/docs`: Authorize accepted the real login token, the issue write showed a locked
Bearer operation with no internal-tool header parameter, and Execute on
`POST /issues` returned **201** with the created issue. Its generated cURL
contained `Authorization: Bearer ...` and no internal-tool key. The temporary
browser tab and server were closed and the temporary database removed.

Build and ESLint checks passed for the changed application files. Public reads,
project stats behavior, services, DTOs and existing guards were not rewritten.
