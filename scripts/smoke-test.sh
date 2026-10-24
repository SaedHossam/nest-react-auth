#!/usr/bin/env bash
# End-to-end smoke test against a running stack (default: docker compose on :8080).
# Usage: BASE_URL=http://localhost:8080 ./scripts/smoke-test.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT
EMAIL="smoke-$(date +%s)-$RANDOM@example.com"
PASSWORD='Passw0rd!'

step() { printf '• %s… ' "$1"; }
ok() { echo "ok"; }
fail() { echo "FAILED: $1"; exit 1; }
status_of() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

step "Web app is served"
curl -fsS "$BASE_URL/" | grep -q '<div id="root">' || fail "index.html not served"
ok

step "Client-side routes fall back to the SPA"
curl -fsS "$BASE_URL/signin" | grep -q '<div id="root">' || fail "/signin did not return the SPA"
ok

step "API is reachable through the proxy and MongoDB is up"
curl -fsS "$BASE_URL/api/health" | grep -q '"status":"ok"' || fail "health check failed"
ok

step "Protected endpoint rejects anonymous requests"
[ "$(status_of "$BASE_URL/api/users/me")" = 401 ] || fail "expected 401"
ok

step "Invalid sign up is rejected"
[ "$(status_of -H 'Content-Type: application/json' \
  -d '{"email":"bad","name":"ab","password":"short"}' "$BASE_URL/api/auth/signup")" = 400 ] ||
  fail "expected 400"
ok

step "Sign up creates a session cookie"
curl -fsS -c "$JAR" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"name\":\"Smoke Test\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/signup" >/dev/null || fail "sign up failed"
grep -q access_token "$JAR" || fail "no session cookie set"
ok

step "Protected endpoint returns the signed-in user"
curl -fsS -b "$JAR" "$BASE_URL/api/users/me" | grep -q "$EMAIL" || fail "wrong or missing user"
ok

step "Logout ends the session"
[ "$(status_of -b "$JAR" -c "$JAR" -X POST "$BASE_URL/api/auth/logout")" = 204 ] ||
  fail "logout failed"
[ "$(status_of -b "$JAR" "$BASE_URL/api/users/me")" = 401 ] || fail "session still valid"
ok

step "Sign in works for the new account"
[ "$(status_of -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "$BASE_URL/api/auth/signin")" = 200 ] ||
  fail "sign in failed"
ok

echo "All smoke tests passed against $BASE_URL"
