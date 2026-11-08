#!/usr/bin/env bash
# Runs the real flow documented in api/prisma/SEED-AND-LIVE-TEST.md end to end, against an
# already-running API (PORT=3000 npm run start) on an already-seeded database (npx prisma db seed).
# Prints PASS/FAIL per check. Mutates the seeded dataset (new comments/notifications) -- re-run
# `npx prisma db seed` afterward to restore the clean canonical demo state.
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "PASS: $desc (got $actual)"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $desc (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

login() {
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Password123!\"}" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])"
}

echo "== Logging in seeded users =="
TOKEN_OMAR=$(login omar.admin@b4fboard.dev)
TOKEN_YARA=$(login yara.dev@b4fboard.dev)
TOKEN_KARIM=$(login karim.design@b4fboard.dev)
TOKEN_DANA=$(login dana.outsider@b4fboard.dev)

echo "== Public reads =="
check "GET /workspaces" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/workspaces")"
check "GET /projects" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/projects")"
check "GET /issues" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/issues")"

echo "== Protected endpoint, no token =="
check "GET /users/1 (no token)" 401 "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/users/1")"

echo "== Workspace members =="
check "GET /workspaces/1/members as member" 200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN_YARA" "$BASE/workspaces/1/members")"
check "GET /workspaces/1/members as outsider" 403 "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN_DANA" "$BASE/workspaces/1/members")"

echo "== Comments + mention =="
check "GET /issues/1/comments as member" 200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN_YARA" "$BASE/issues/1/comments")"

MENTION_COUNT_BEFORE=$(curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
curl -s -X POST "$BASE/issues/2/comments" -H "Authorization: Bearer $TOKEN_OMAR" -H "Content-Type: application/json" \
  -d '{"body":"cc @[Karim Saleh](4) -- live-test mention."}' > /dev/null
MENTION_COUNT_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
check "Valid mention creates exactly one new notification" "$((MENTION_COUNT_BEFORE + 1))" "$MENTION_COUNT_AFTER"

echo "== Self-mention exclusion =="
SELF_BEFORE=$(curl -s -H "Authorization: Bearer $TOKEN_YARA" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
curl -s -X POST "$BASE/issues/1/comments" -H "Authorization: Bearer $TOKEN_YARA" -H "Content-Type: application/json" \
  -d '{"body":"note to self @[Yara Nassar](3)."}' > /dev/null
SELF_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN_YARA" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
check "Self-mention creates zero new notifications" "$SELF_BEFORE" "$SELF_AFTER"

echo "== Duplicate mention =="
DUP_BEFORE=$(curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
curl -s -X POST "$BASE/issues/4/comments" -H "Authorization: Bearer $TOKEN_OMAR" -H "Content-Type: application/json" \
  -d '{"body":"cc @[Karim Saleh](4) really -- @[Karim Saleh](4) twice."}' > /dev/null
DUP_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
check "Duplicate mention in one comment creates exactly one new notification" "$((DUP_BEFORE + 1))" "$DUP_AFTER"

echo "== Mark-read authorization =="
KARIM_UNREAD_ID=$(curl -s -H "Authorization: Bearer $TOKEN_KARIM" "$BASE/notifications/me" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(next(r['id'] for r in rows if r['readAt'] is None))")
check "Unrelated user marking someone else's notification read" 403 "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/notifications/$KARIM_UNREAD_ID/read" -H "Authorization: Bearer $TOKEN_YARA")"
check "Real recipient marking their own notification read" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/notifications/$KARIM_UNREAD_ID/read" -H "Authorization: Bearer $TOKEN_KARIM")"

echo "== Outsider negative authorization =="
check "Outsider posting a comment in a workspace they are not a member of" 403 "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/issues/1/comments" -H "Authorization: Bearer $TOKEN_DANA" -H "Content-Type: application/json" -d '{"body":"hello"}')"

echo ""
echo "== Summary: $PASS passed, $FAIL failed =="
echo "Reminder: run 'npx prisma db seed' to restore the clean canonical demo dataset."
[ "$FAIL" -eq 0 ]
