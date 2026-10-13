# Session 11 homework solution

## CORE and STRETCH

Both `DELETE /projects/:id` and `DELETE /workspaces/:id` use `ParseIntPipe`
and `findOneAndDelete({ id })`. A successful delete returns HTTP 200 and the
deleted document. A missing numeric id returns 404; a malformed id returns 400.
Workspaces now uses the same MongoDB schema, model registration, and service
pattern as Projects, so its deletes affect real stored documents.

## CHALLENGE

1. The comment directly above `ProjectsService.remove()` explains the identifier
   choice. The API uses the numeric `id` field consistently. MongoDB's `_id` is
   a separate ObjectId, so using it for one operation would stop the same API id
   from identifying the same document across read, update, and delete.

2. A document inserted directly through mongosh or Compass never passes through
   Nest's `ValidationPipe` or DTO decorators. Those run when an HTTP request
   enters the API. A direct database client talks to MongoDB without calling
   Nest, so that validation layer does not see the write.

3. Nest and MongoDB are two separate running processes. The data now lives in
   MongoDB and is persisted to disk, rather than in an array inside Nest's
   memory. Restarting Nest replaces only the API process; MongoDB keeps its
   documents. The startup seed guard inserts defaults only when a collection
   is empty, rather than overwriting existing documents on every restart.

## Database verification

Verified against the real local `b4f-board` database, with the temporary API
running on port 3101. Each id came from its POST response; neither was assumed.
Only the temporary homework records were deleted. Existing projects were kept,
and the empty workspaces collection received the two default seed workspaces.

The following identical mongosh queries were each run before deletion, after
deletion, and again after stopping and restarting only the Nest server:

```bash
mongosh --quiet --eval 'db.getSiblingDB("b4f-board").projects.find({ key: "HW11-1791848231953-projects" })'
mongosh --quiet --eval 'db.getSiblingDB("b4f-board").workspaces.find({ slug: "HW11-1791848231953-workspaces" })'
```

Before deleting the project, mongosh returned this document (JSON representation):

```json
{
  "_id": "6acd6f29ba8d9449e27d3c27",
  "id": 6,
  "name": "Session 11 temporary verification",
  "key": "HW11-1791848231953-projects",
  "description": "Verified against MongoDB",
  "__v": 0
}
```

Before deleting the workspace, mongosh returned:

```json
{
  "_id": "6acd6f2bba8d9449e27d3c36",
  "id": 3,
  "name": "Session 11 temporary verification",
  "slug": "HW11-1791848231953-workspaces",
  "description": "Verified against MongoDB",
  "__v": 0
}
```

Both queries returned zero documents after deletion and after the Nest restart
(`[]` when the cursor was serialized using `toArray()`).

| Check | Projects | Workspaces |
| --- | --- | --- |
| Create temporary record | 201, id 6 | 201, id 3 |
| Update and lookup by key/slug | 200 | 200 |
| Duplicate key/slug | 409 | 409 |
| MongoDB matches before delete | 1 | 1 |
| Delete temporary record | 200, deleted document | 200, deleted document |
| MongoDB matches after delete | 0 | 0 |
| GET deleted id | 404 | 404 |
| Repeat DELETE deleted id | 404 | 404 |
| DELETE missing id 999 | 404 | 404 |
| DELETE malformed id abc | 400 | 400 |
| GET deleted id after Nest restart | 404 | 404 |
| MongoDB matches after Nest restart | 0 | 0 |

The deleted response matched the document returned by the preceding update.
Record counts returned to their pre-test values (six projects and two workspaces)
and stayed there after restart. Build and ESLint passed. Watch-mode startup
passed on the locally installed Node 22.22.0 without terminal warnings.
