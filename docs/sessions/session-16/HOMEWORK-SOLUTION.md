# Session 16 Homework Solution: Issue Ownership Authorization

## Scope and requirements

This solution implements the session 16 homework requirements for Issues:

- An Issue records its required reporter and nullable assignee.
- The reporter is taken from the authenticated JWT subject, never from request
  input.
- Creating an Issue requires the reporter to be a member of the workspace
  reached by following that Issue's `projectId` to the Project's
  `workspaceId`.
- An assignee supplied at creation or reassignment must also be a member of
  that same workspace.
- Updating and deleting an Issue is permitted to its reporter, its assignee,
  or a current workspace Owner/Admin. A different ordinary member is denied.
- Issue ownership authorization lives in `IssuesService`, not in a guard or a
  route decorator.
- No new Issue endpoint was added.

The homework and study guide refer to `AUTH-AND-PERMISSIONS.md`, but that file
is not present in this repository. The implementation follows the explicit
assignee/reporter/Owner/Admin rule and field requirements repeated in the
session 16 homework itself.

## Implementation details

### `api/src/issues/schemas/issue.schema.ts`

The Mongoose `Issue` schema defines the persisted Issue record.

- `IssueDocument` is the Mongoose document type used by the service.
- `Issue.id` is the application's numeric ID.
- `Issue.projectId` identifies the parent Project.
- `Issue.reporterId` is a required numeric user ID. The service sets this from
  the authenticated caller.
- `Issue.assigneeId` is a numeric user ID or `null`. Its Mongoose default is
  `null`, so an unassigned Issue has a consistent representation.
- `Issue.title`, `Issue.description`, and `Issue.status` are the existing Issue
  content fields.
- `IssueSchema` is generated from the class, and its existing compound index
  on `{ projectId, status }` continues to support filtered Issue queries.

### `api/src/issues/dto/create-issue.dto.ts`

`CreateIssueDto` describes validated client input for creating an Issue.

- `projectId` is a required integer identifying the target Project.
- `assigneeId` is an optional integer or `null`. `null` means create without an
  assignee.
- `title` is required, must be a non-empty string, and is trimmed.
- `description` is optional and is trimmed.

There is deliberately no `reporterId` property. The global `ValidationPipe`
uses `whitelist` and `forbidNonWhitelisted`, so a client that sends
`reporterId` receives a validation error instead of choosing another user's
identity.

### `api/src/issues/dto/update-issue.dto.ts`

`UpdateIssueDto` is built with Swagger's `PartialType(CreateIssueDto)`, making
the create fields optional for updates. That includes `assigneeId`, which can
be supplied to reassign an Issue or set to `null` to unassign it.

- `status` remains optional and is restricted to the supported values:
  `todo`, `in_progress`, `review`, and `done`.
- `reporterId` is not inherited because it is intentionally absent from the
  create DTO.

### `api/src/issues/issues.controller.ts`

`IssuesController` continues to expose the existing Issue routes only.

- The constructor injects `IssuesService`.
- `findAll(query)` lists Issues using the existing query filters. The route
  remains public as required.
- `findOne(id)` retrieves one Issue by numeric ID. The route remains public.
- `create(dto, currentUser)` is still protected by `JwtAuthGuard`. `CurrentUser`
  supplies the JWT payload, and `currentUser.sub` is passed to the service as
  the reporter ID. The client body cannot provide the reporter.
- `update(id, dto, currentUser)` passes the authenticated user ID with the
  update request. The service applies resource ownership rules.
- `remove(id, currentUser)` passes the authenticated user ID with the delete
  request. The service applies the same ownership rules before deletion.
- `@ApiBearerAuth`, `@ApiOperation`, and `@ApiResponse` describe the API in
  Swagger; `@UseGuards(JwtAuthGuard)` performs authentication at runtime.

### `api/src/issues/issues.service.ts`

`IssuesService` contains the Issue data operations and the homework's
service-layer authorization.

- The constructor injects the Issue Mongoose model, `ProjectsService`, and
  `WorkspaceMembersService`. The latter two provide the two relationships
  needed to establish the Issue's workspace.
- `findAll(query)` builds optional project, status, and case-insensitive title
  filters, then returns the matching Issues.
- `findOne(id)` loads by the application's numeric Issue ID and throws
  `NotFoundException` when it does not exist.
- `create(dto, reporterId)` loads the requested Project, checks that the
  authenticated reporter is a member of that Project's workspace, and checks
  any supplied assignee against the same workspace. It then allocates the next
  Issue ID and inserts the Issue with the server-provided reporter, validated
  assignee (or `null`), and initial `todo` status.
- `update(id, dto, requesterId)` loads the Issue once, resolves its Project,
  and checks the requester against that Issue's reporter, assignee, or current
  workspace membership role. If a new assignee is supplied, the service checks
  that user's membership before changing it. The method applies only fields
  present in the DTO, saves, and logs the update.
- `remove(id, requesterId)` loads the Issue once, resolves its Project, applies
  the same ownership/role rule, deletes through the already-loaded document,
  and returns that deleted document.
- `requireWorkspaceMember(workspaceId, userId)` is the shared membership
  capability used for the reporter and assignee checks. It uses the existing
  `WorkspaceMembersService` lookup and throws `ForbiddenException` when no
  matching membership exists.
- `assertCanMutateIssue(issue, workspaceId, requesterId)` permits the Issue's
  reporter or assignee directly. Otherwise, it reads the requester's current
  workspace membership from the database and permits only `owner` or `admin`.
  All other callers, including ordinary members who are unrelated to this
  particular Issue, receive `ForbiddenException`.

`update` uses `save({ validateModifiedOnly: true })` so updates to older stored
Issue documents that predate `reporterId` are not blocked by re-validating an
unchanged new required field. New Issues still go through normal Mongoose
validation and always receive a reporter from `create`.

The previous startup fixture generated 180 Issues without any real reporter.
That fixture was removed: assigning those records an invented user ID would
undermine reporter ownership and could misrepresent who created them. Issues
created through the API now have accurate reporter records. Existing stored
legacy Issues can still be updated by their current workspace Owner/Admin, but
without historical reporter data they have no reporter-based access.

### `api/src/issues/issues.module.ts`

`IssuesModule` registers `IssueSchema`, its controller and service, and the
existing JWT dependencies. It now imports:

- `ProjectsModule`, which exports `ProjectsService` for resolving the Issue's
  Project and workspace.
- `WorkspaceMembersModule`, which exports `WorkspaceMembersService` for current
  membership and role lookups.

Neither module imports `IssuesModule`, so this dependency does not create a
module cycle. No new guard or authorization decorator was added to Issues.

### `api/src/issues/issues.service.spec.ts`

The unit tests use mocked project, membership, and Mongoose dependencies to
exercise authorization without requiring a live database.

- Outsiders cannot create Issues.
- The authenticated creator becomes the reporter, and an assignee is checked
  as a member.
- A non-member cannot be assigned on creation or reassignment.
- A client-supplied `reporterId` is rejected under the application's
  whitelist/forbid-non-whitelisted validation settings.
- An ordinary workspace member unrelated to the Issue cannot update or delete
  it.
- The Issue's reporter and assignee can update and delete it.
- Current workspace Owners and Admins can update an unrelated Issue, and an
  Admin can delete it.

These tests prove service behavior with controlled test data. They are not a
substitute for a database-backed HTTP proof using actual registered users and
workspace membership records.

### Existing dependency files and methods reused

- `api/src/auth/current-user.decorator.ts` provides the authenticated request
  user to the controller.
- `api/src/auth/jwt-payload.interface.ts` defines `sub` as the caller's numeric
  user ID.
- `api/src/common/filters/guards/jwt-auth.guard.ts` verifies the bearer token
  before the controller receives that user.
- `api/src/projects/projects.service.ts` provides `findOne(projectId)`, which
  returns the Project and its `workspaceId`.
- `api/src/workspace-members/workspace-members.service.ts` provides
  `findByWorkspaceAndUser(workspaceId, userId)`, which returns current
  membership including the current role or `null`.
- `api/src/workspaces/workspaces.service.ts` had duplicate imports removed
  because those duplicates prevented the API build. No workspace behavior was
  changed.

## Challenge answers

1. **Could the ownership rule technically be implemented in a Guard?** Yes. A
   guard could load the Issue, resolve its Project and workspace, load the
   caller's current membership, and compare the caller with the Issue's
   `reporterId` and `assigneeId` plus the membership role.
2. **Why use service-layer authorization here?** The service already loads the
   exact Issue to update or delete. Checking the Issue's instance-specific
   ownership there keeps the decision beside the mutation.
3. **What duplicate work could a Guard cause?** If it loads the Issue for its
   decision and the service loads it again for the mutation, the request makes
   two Issue reads and bases its decisions on separate reads.
4. **When is metadata-driven route authorization a better fit?** When a shared
   rule depends on route configuration such as allowed workspace roles or
   whether the workspace ID comes from a body or route parameter. That remains
   the pattern for Projects and Workspaces.
5. **When does resource-instance authorization fit beside service logic?**
   When the rule depends on fields of the particular Issue being mutated, such
   as its own reporter and assignee, and the service already has that Issue.
6. **How could a larger application avoid duplicate loading with a Guard?**
   It could place the loaded resource in request-scoped state for the service to
   reuse, or provide a shared request-scoped loader/cache. This is a design
   option only; it is not implemented here.
7. **Why use current database state instead of JWT role claims?** JWT claims
   are snapshots from login time. Database checks see role changes, removed
   memberships, and current assignment state without waiting for a new token.

## Verification

From `api`:

```powershell
npm test -- --runInBand issues.service.spec.ts
npm run build
```

Both commands passed in this workspace. The focused authorization suite covers
15 service/validation scenarios. No live database-backed HTTP matrix was run.
For that real-data proof, use actual registered users, their returned IDs, a
Project's actual workspace, and the actual Issue response ID. Demonstrate an
outsider's create rejection; member creation and server-set reporter; rejection
of an unrelated ordinary member on update and delete; success for reporter,
assignee, and Owner/Admin; and rejection of non-member assignees on both create
and reassignment. Do not hardcode user, workspace, project, or Issue IDs in
those requests.
