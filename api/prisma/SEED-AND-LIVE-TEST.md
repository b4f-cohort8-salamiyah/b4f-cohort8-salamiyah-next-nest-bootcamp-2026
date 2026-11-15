# Seed + Live Backend Test Workflow

Reusable, repeatable workflow for local teaching/demo/frontend-integration use. Every step below
was actually run against this exact seed on 2026-11-07 — the responses shown are real captured
output, not invented examples.

## 1. Migrate the database

```bash
cd api
npx prisma migrate deploy   # or: npx prisma migrate dev   (interactive dev convenience)
```

## 2. Run the final seed

```bash
npx prisma db seed
# or: npm run db:seed
```

**Reset policy: deterministic reset, not idempotent upserts.** Every run truncates every real
domain table (`notifications`, `comments`, `activity_logs`, `issues`, `projects`,
`workspace_members`, `workspaces`, `users`) with `RESTART IDENTITY CASCADE` and recreates the
exact same known dataset from scratch — ids are always predictable (workspace 1, project `WEB`
id 1, issue `WEB-1` id 1, etc.), which is what makes the fixed ids below safe to use. **This is
destructive by design — never run it against a real production database.**

Seeded entities (all passwords: `Password123!`):

| User         | Email                        | Role in workspace 1               |
| ------------ | ---------------------------- | --------------------------------- |
| Lina Haddad  | `lina.owner@b4fboard.dev`    | owner                             |
| Omar Rahal   | `omar.admin@b4fboard.dev`    | admin                             |
| Yara Nassar  | `yara.dev@b4fboard.dev`      | member                            |
| Karim Saleh  | `karim.design@b4fboard.dev`  | member                            |
| Dana Barakat | `dana.outsider@b4fboard.dev` | **not a member of any workspace** |

Workspace `B4F Core Team` (id 1) → projects `WEB` (id 1, issues `WEB-1`/`WEB-2`/`WEB-3`, ids
1/2/3) and `APP` (id 2, issues `APP-1`/`APP-2`, ids 4/5). Four seeded comments on `WEB-1`/`WEB-2`/
`APP-1`; two seeded notifications (one unread for Yara from a mention on `WEB-1`, one already-read
for Karim from a different mention on the same issue).

## 3. Start the API

```bash
PORT=3000 npm run start
```

## 4-5. Log in as seeded users, capture tokens

```bash
BASE=http://localhost:3000
TOKEN_OMAR=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"omar.admin@b4fboard.dev","password":"Password123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
TOKEN_YARA=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"yara.dev@b4fboard.dev","password":"Password123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
TOKEN_KARIM=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"karim.design@b4fboard.dev","password":"Password123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
TOKEN_DANA=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"dana.outsider@b4fboard.dev","password":"Password123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
```

## 6. Verify public reads

```bash
curl -s -o /dev/null -w "%{http_code}\n" $BASE/workspaces   # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/projects     # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/issues       # 200
```

**Real result (2026-11-07): `200`, `200`, `200`.**

## 7. Verify a protected endpoint rejects a missing token

```bash
curl -s -o /dev/null -w "%{http_code}\n" $BASE/users/1   # no Authorization header
```

**Real result: `401`.**

## 8. Verify workspace members

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN_YARA" $BASE/workspaces/1/members
```

**Real result: `200`.**

## 9. Verify comments

```bash
curl -s -H "Authorization: Bearer $TOKEN_YARA" $BASE/issues/1/comments
```

**Real result:** the two real seeded comments on `WEB-1`, each with its own real `author: {id,
name}` resolved.

## 10. Create a valid mention

```bash
curl -s -X POST $BASE/issues/2/comments -H "Authorization: Bearer $TOKEN_OMAR" \
  -H "Content-Type: application/json" \
  -d '{"body":"cc @[Karim Saleh](4) -- please confirm you see this in your inbox."}'
```

**Real result:** `201`-equivalent JSON with `"mentionedUserIds": [4]`.

## 11. Verify Activity

```bash
curl -s -H "Authorization: Bearer $TOKEN_OMAR" "$BASE/workspaces/1/activity" \
  | python3 -c "import sys,json; rows=json.load(sys.stdin); [print(r['action'], r['metadata']) for r in rows[:2]]"
```

**Real result:** `MENTIONED {'commentId': 5, 'mentionedUserId': 4}` then
`COMMENTED {'commentId': 5}`, newest first.

## 12. Verify the recipient's Notification

```bash
curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me"
```

**Real result:** a new `MENTION` notification, `readAt: null`, `actor: {"id":2,"name":"Omar
Rahal"}`, alongside the seeded already-read one.

## 13. `GET /notifications/me`

Covered by step 12 — the same real endpoint, confirmed to source identity only from the token
(`currentUser.sub`), never from a parameter.

## 14. Self-mention does NOT notify

```bash
curl -s -H "Authorization: Bearer $TOKEN_YARA" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
curl -s -X POST $BASE/issues/1/comments -H "Authorization: Bearer $TOKEN_YARA" \
  -H "Content-Type: application/json" \
  -d '{"body":"note to self @[Yara Nassar](3) -- re-check this after lunch."}' > /dev/null
curl -s -H "Authorization: Bearer $TOKEN_YARA" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
```

**Real result: count unchanged before/after (`1` then `1`).**

## 15. Duplicate mention results in one notification

```bash
curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
curl -s -X POST $BASE/issues/4/comments -H "Authorization: Bearer $TOKEN_OMAR" \
  -H "Content-Type: application/json" \
  -d '{"body":"cc @[Karim Saleh](4) really -- @[Karim Saleh](4) please look twice."}'
curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
```

**Real result:** `mentionedUserIds: [4]` (deduplicated by `extractMentionedUserIds`'s own `Set`
before `notifyMentions` ever runs); inbox count grows by exactly **one** (`2` then `3`), not two.

## 16. Unrelated user marking notification read → 403

```bash
curl -s -w "\n%{http_code}\n" -X PATCH "$BASE/notifications/2/read" -H "Authorization: Bearer $TOKEN_YARA"
```

**Real result:** `{"message":"Only the real recipient of a notification may mark it read.",
"error":"Forbidden","statusCode":403}` — `403`. (Notification 2 belongs to Karim; Yara is not its
recipient.)

## 17. Real recipient marking notification read → 200

```bash
curl -s -w "\n%{http_code}\n" -X PATCH "$BASE/notifications/<id-belonging-to-the-caller>/read" \
  -H "Authorization: Bearer $TOKEN_KARIM"
```

**Real result (using Karim's own real unread notification id, retrieved from step 12's own
response — never hardcode an id you have not just retrieved):** the updated row, with a real
`readAt` timestamp, `200`.

## 18. Outsider negative-authorization example

```bash
curl -s -w "\n%{http_code}\n" -X POST "$BASE/issues/1/comments" -H "Authorization: Bearer $TOKEN_DANA" \
  -H "Content-Type: application/json" -d '{"body":"hello"}'
```

**Real result:** `{"message":"User 5 is not a member of workspace 1.","error":"Forbidden",
"statusCode":403}` — `403`. Dana is a real, registered, authenticated user — just never added to
this workspace's membership, exactly as seeded.

## After running this flow

Re-run `npx prisma db seed` to restore the clean, canonical demo dataset before the next real
class or integration session — this flow's own steps 10/14/15/17/18 intentionally mutate the
dataset (new comments/notifications) as part of proving the behavior.
