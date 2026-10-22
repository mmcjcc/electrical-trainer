#!/usr/bin/env bash
# deploy/smoke.sh: boot a built image the way docker01 runs it and check what this app promises.
#   * the image: USER is the manifest's uid, it has a HEALTHCHECK, no traefik.* label, and is under 60 MB
#   * started as docker01 starts it (the manifest's uid, read-only root, a tmpfs /tmp, no capabilities,
#     no-new-privileges) with no env and no secrets: healthy within 120 s, on the manifest's port
#   * GET <health> is 200 "ok", text/plain, in under 2 s
#   * / and deep links (/some/route) serve index.html; index.html loads /config.js and has no inline script (the CSP
#     allows scripts from 'self' only)
#   * /config.js is `window.__ET_CONFIG__ = { signOutUrl: "" };` without SIGN_OUT_URL, and carries the manifest's
#     SIGN_OUT_URL when that is set
#   * Cache-Control: /assets/* immutable for a year (a 304 too), a missing asset a 404 that is not cached,
#     index.html and /config.js no-cache; gzip on the JS bundle
#   * the security headers (CSP, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) on every kind of
#     answer, exactly one Cache-Control, server_tokens off
#   * the access log has neither the platform's __Secure-sso* cookies nor the identity header nor /healthz, and the
#     log has no permission or read-only complaint and no nginx warning
#   * LISTEN_PORT moves the port and the HEALTHCHECK follows it; a bad LISTEN_PORT or SIGN_OUT_URL, or no writable
#     /tmp, aborts start-up naming the reason
#
# Usage: bash deploy/smoke.sh <image>      (needs docker and curl; run by .github/workflows/ci.yml)
#   docker build --platform linux/amd64 -t electrical-trainer . && bash deploy/smoke.sh electrical-trainer
# uid, port, health and SIGN_OUT_URL are read from deploy/homelab.yml, never repeated here.
# SMOKE_PORT [18080] is the host port (bound to 127.0.0.1); SMOKE_NAME [et-smoke] names the containers.
set -euo pipefail

IMAGE="${1:?usage: bash deploy/smoke.sh <image>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
M="$HERE/homelab.yml"
HOST_PORT="${SMOKE_PORT:-18080}"
NAME="${SMOKE_NAME:-et-smoke}"
BASE="http://127.0.0.1:$HOST_PORT"
WORK="$(mktemp -d)"
CID=""

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; CID=""; }
trap 'cleanup; rm -rf "$WORK"' EXIT

fail() {
  echo "SMOKE FAIL: $*" >&2
  if [ -n "$CID" ]; then echo "--- container logs ---" >&2; docker logs "$CID" >&2 || true; fi
  exit 1
}
pass() { echo "  ok   $*"; }

# field <key>: a top-level scalar of the manifest (`key: value   # comment`), read the way the homelab-image
# workflow reads it.
field() {
  awk -v k="$1" 'index($0, k ":") == 1 {
    v = substr($0, length(k) + 2); sub(/[ \t]+#.*$/, "", v); gsub(/^[ \t]+|[ \t]+$/, "", v); print v; exit }' "$M"
}
RUN_UID="$(field uid)"
PORT="$(field port)"
HEALTH="$(field health)"
[[ "$RUN_UID" =~ ^[1-9][0-9]{4}$ ]] || fail "$M: no uid found (got '$RUN_UID')"
[[ "$PORT" =~ ^[1-9][0-9]{3,4}$ ]]  || fail "$M: no port found (got '$PORT')"
[[ "$HEALTH" =~ ^/ ]]               || fail "$M: no health path found (got '$HEALTH')"
# The manifest's SIGN_OUT_URL is what docker01 will pass: test that exact value. An example if there is none.
SIGN_OUT="$(sed -n 's/^  SIGN_OUT_URL: "\([^"]*\)".*$/\1/p' "$M")"
SIGN_OUT="${SIGN_OUT:-https://auth.example.com/oauth2/sign_out?rd=https%3A%2F%2Fapp.example.com%2F}"

# How docker01 starts the container (contract section 2); the platform adds no env of its own that the image needs.
LOCKED=(--user "$RUN_UID:$RUN_UID" --read-only --tmpfs /tmp:size=64m --cap-drop ALL --security-opt no-new-privileges)

# start <container port> [docker run options...]: (re)starts the image locked down and waits until Docker reports it
# healthy, as the deploy does (at most 120 s).
start() {
  local cport="$1" state="" t0="$SECONDS"
  shift
  cleanup
  CID=$(docker run -d --name "$NAME" "${LOCKED[@]}" -p "127.0.0.1:$HOST_PORT:$cport" "$@" "$IMAGE")
  while [ $((SECONDS - t0)) -lt 120 ]; do
    state=$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CID")
    if [ "$state" = "running healthy" ] || [ "${state%% *}" != running ]; then break; fi
    sleep 1
  done
  [ "$state" = "running healthy" ] || fail "not healthy within 120 s as uid $RUN_UID on a read-only root (state: $state)"
  STARTED_IN=$((SECONDS - t0))
}

# expect_abort <what> <message> [docker run options...]: the container must refuse to start, and say why (a non-zero
# exit alone would also pass if the image were broken some other way).
expect_abort() {
  local what="$1" want="$2" rc out
  shift 2
  cleanup
  set +e
  out=$(timeout 20 docker run --rm --name "$NAME-bad" "$@" "$IMAGE" 2>&1)
  rc=$?
  set -e
  docker rm -f "$NAME-bad" >/dev/null 2>&1 || true
  { [ "$rc" -ne 0 ] && [ "$rc" -ne 124 ]; } || fail "$what must abort start-up (rc=$rc); output: $out"
  grep -qF -- "$want" <<<"$out" || fail "$what should abort saying \"$want\"; got: $out"
  pass "$what aborts start-up, naming the reason"
}

# req <path> [curl options...]: one request; sets CODE, BODY and HDRS (the response headers without CR).
req() {
  local p="$1"
  shift
  rm -f "$WORK/body" "$WORK/headers"
  CODE=$(curl -s --max-time 5 -o "$WORK/body" -D "$WORK/headers" -w '%{http_code}' "$@" "$BASE$p" || true)
  BODY="$(cat "$WORK/body" 2>/dev/null || true)"
  HDRS="$(tr -d '\r' < "$WORK/headers" 2>/dev/null || true)"
}
# header <name>: the value of that response header of the last req (the last one if repeated), or empty.
header() {
  awk -v n="$1" 'index(tolower($0), tolower(n) ":") == 1 { v = substr($0, length(n) + 2); sub(/^[ \t]+/, "", v) } END { print v }' <<<"$HDRS"
}
# config_line: the JavaScript line of the last req's /config.js (without the comment line).
config_line() { grep -v '^//' <<<"$BODY" || true; }

echo "== smoke: $IMAGE (uid $RUN_UID, port $PORT, health $HEALTH, from $M)"

# ---- the image --------------------------------------------------------------------------------------------------
labels=$(docker image inspect -f '{{range $k, $v := .Config.Labels}}{{println $k}}{{end}}' "$IMAGE")
if grep -qi '^traefik' <<<"$labels"; then fail "the image carries traefik.* labels; the platform alone defines routing"; fi
hc=$(docker image inspect -f '{{if .Config.Healthcheck}}{{json .Config.Healthcheck.Test}}{{end}}' "$IMAGE")
case "$hc" in ''|null|'["NONE"]') fail "the image has no HEALTHCHECK" ;; esac
user=$(docker image inspect -f '{{.Config.User}}' "$IMAGE")
[ "$user" = "$RUN_UID:$RUN_UID" ] || fail "the image's USER is '$user'; deploy/homelab.yml says uid $RUN_UID"
SIZE=$(docker image inspect -f '{{.Size}}' "$IMAGE")
[ "$SIZE" -lt $((60 * 1024 * 1024)) ] || fail "the image is $((SIZE / 1024 / 1024)) MB; the budget is 60 MB"
pass "image: USER $user, a HEALTHCHECK, no traefik.* label, $((SIZE / 1024 / 1024)) MB"

# ---- started the way docker01 starts it: no env, no secrets ------------------------------------------------------
start "$PORT"
[ "$(docker exec "$CID" id -u)" = "$RUN_UID" ] || fail "the container should run as uid $RUN_UID"
pass "healthy after ${STARTED_IN} s as uid $RUN_UID, read-only root, tmpfs /tmp, no capabilities, no env"

req "$HEALTH" --max-time 2
[ "$CODE" = 200 ] || fail "GET $HEALTH answered $CODE, not 200 within 2 s"
[ "$BODY" = ok ] || fail "GET $HEALTH should answer \"ok\"; got: $BODY"
[[ "$(header content-type)" == text/plain* ]] || fail "$HEALTH should be text/plain; headers: $HDRS"
pass "GET $HEALTH -> 200 ok (text/plain) on port $PORT"

# ---- the SPA -----------------------------------------------------------------------------------------------------
req /
[ "$CODE" = 200 ] || fail "/ should be 200, got $CODE"
[[ "$BODY" == *'<div id="root">'* ]] || fail "/ should serve index.html; got: $BODY"
[[ "$(header content-type)" == text/html* ]] || fail "/ should be text/html; headers: $HDRS"
[ "$(header cache-control)" = no-cache ] || fail "index.html must be no-cache; headers: $HDRS"
INDEX="$BODY"
pass "/ -> index.html, no-cache"
for p in /some/route /math/recipe/some-recipe "/exam/run?part=2"; do
  req "$p"
  [ "$CODE" = 200 ] && [ "$BODY" = "$INDEX" ] || fail "the deep link $p should serve index.html (got $CODE)"
  [ "$(header cache-control)" = no-cache ] || fail "the deep link $p must be no-cache like index.html; headers: $HDRS"
done
pass "deep links (/some/route ...) -> index.html (SPA fallback)"
[[ "$INDEX" == *'<script src="/config.js"></script>'* ]] || fail "index.html should load /config.js"
inline=$(grep -oi '<script[^>]*>' <<<"$INDEX" | grep -vi 'src=' || true)
[ -z "$inline" ] || fail "index.html has an inline script ($inline); the CSP allows scripts from 'self' only"
pass "index.html loads /config.js and has no inline script"

# ---- /config.js without SIGN_OUT_URL -----------------------------------------------------------------------------
req /config.js
[ "$CODE" = 200 ] || fail "/config.js should be 200, got $CODE"
[ "$(config_line)" = 'window.__ET_CONFIG__ = { signOutUrl: "" };' ] || fail "/config.js without SIGN_OUT_URL; got: $BODY"
[[ "$BODY" == *'Generated at container start'* ]] || fail "/config.js should be the one written at start-up, not the dev copy"
[[ "$(header content-type)" == *javascript* ]] || fail "/config.js should be JavaScript; headers: $HDRS"
[ "$(header cache-control)" = no-cache ] || fail "/config.js must be no-cache; headers: $HDRS"
pass "/config.js -> window.__ET_CONFIG__ = { signOutUrl: \"\" }; no-cache"

# ---- /assets: immutable, gzip, real 404s -------------------------------------------------------------------------
JS=$(grep -o '/assets/index-[A-Za-z0-9_-]*\.js' <<<"$INDEX" | sed -n 1p || true)
CSS=$(grep -o '/assets/index-[A-Za-z0-9_-]*\.css' <<<"$INDEX" | sed -n 1p || true)
[ -n "$JS" ] && [ -n "$CSS" ] || fail "could not find the hashed entry script and stylesheet in index.html"
IMMUTABLE='public, max-age=31536000, immutable'
req "$JS" --compressed
[ "$CODE" = 200 ] || fail "$JS should be 200, got $CODE"
[ "$(header cache-control)" = "$IMMUTABLE" ] || fail "$JS must be immutable; headers: $HDRS"
[ "$(header content-encoding)" = gzip ] || fail "$JS should be gzipped; headers: $HDRS"
[[ "$(header content-type)" == *javascript* ]] || fail "$JS should be JavaScript; headers: $HDRS"
ETAG="$(header etag)"
req "$CSS"
[ "$CODE" = 200 ] && [ "$(header cache-control)" = "$IMMUTABLE" ] || fail "$CSS must be 200 and immutable; headers: $HDRS"
pass "/assets immutable for a year, gzip ($JS, $CSS)"
if [ -n "$ETAG" ]; then
  req "$JS" -H "If-None-Match: $ETAG"
  [ "$CODE" = 304 ] || fail "$JS with its ETag should be 304, got $CODE"
  [ "$(header cache-control)" = "$IMMUTABLE" ] || fail "a 304 for $JS must stay immutable; headers: $HDRS"
  pass "a revalidated asset (304) stays immutable"
fi
req /assets/does-not-exist.js
[ "$CODE" = 404 ] || fail "a missing asset must be 404, not the SPA fallback (got $CODE)"
[ "$(header cache-control)" = no-cache ] || fail "a missing asset's 404 must not be cached for a year; headers: $HDRS"
pass "missing asset -> 404, no-cache"
req /manifest.webmanifest
[ "$CODE" = 200 ] && [[ "$(header content-type)" == application/manifest+json* ]] || fail "/manifest.webmanifest should be 200 application/manifest+json; headers: $HDRS"
pass "/manifest.webmanifest -> application/manifest+json"

# ---- security headers on every kind of answer (a location with its own add_header would drop them) -----------------
for p in / /some/route "$JS" /config.js "$HEALTH" /manifest.webmanifest /assets/does-not-exist.js; do
  req "$p"
  for h in Content-Security-Policy X-Content-Type-Options X-Frame-Options Referrer-Policy Permissions-Policy; do
    [ -n "$(header "$h")" ] || fail "$p ($CODE) has no $h; headers: $HDRS"
  done
  [ "$(grep -ci '^cache-control:' <<<"$HDRS")" = 1 ] || fail "$p should have exactly one Cache-Control; headers: $HDRS"
  [ "$(header server)" = nginx ] || fail "$p: the Server header should be bare 'nginx' (server_tokens off); headers: $HDRS"
done
req /
[ "$(header x-content-type-options)" = nosniff ] || fail "X-Content-Type-Options should be nosniff"
[ "$(header x-frame-options)" = DENY ] || fail "X-Frame-Options should be DENY"
CSP="$(header content-security-policy)"
for d in "default-src 'self'" "script-src 'self';" "font-src 'self';" "connect-src 'self'" "object-src 'none'" \
         "frame-ancestors 'none'"; do
  [[ "$CSP" == *"$d"* ]] || fail "the CSP should have $d; got: $CSP"
done
[[ "$CSP" != *unsafe-eval* ]] || fail "the CSP must not allow unsafe-eval; got: $CSP"
[[ "$CSP" != *https://* ]] || fail "the CSP should name no other origin (Inter is bundled, no font CDN); got: $CSP"
pass "security headers on every answer (200, 404, health, config, assets); CSP 'self' only, no other origin; server_tokens off"

# ---- the log: no cookie, no identity, no health checks, no complaints --------------------------------------------
req "/some/route?smoke=1" -H 'Cookie: __Secure-sso=smoke-cookie-value-1; __Secure-sso_1=smoke-cookie-value-2' \
  -H 'X-Auth-Request-Email: smoke-user@example.com'
[ "$CODE" = 200 ] || fail "a request with the platform's cookie and identity header should still get the app"
sleep 1
LOGS=$(docker logs "$CID" 2>&1)
grep -q 'GET /some/route?smoke=1' <<<"$LOGS" || fail "requests should be in the access log (stdout); got: $LOGS"
if grep -E 'smoke-cookie-value|smoke-user@example\.com' <<<"$LOGS"; then
  fail "the log must never show a cookie (__Secure-sso*) or the identity header"
fi
if grep -q "GET $HEALTH" <<<"$LOGS"; then fail "health checks should not be logged"; fi
if grep -iE 'permission denied|read-only file system|\[(emerg|alert|crit|warn)\]' <<<"$LOGS"; then
  fail "the log of a locked-down start should have no permission, read-only or nginx warning lines"
fi
pass "access log on stdout without cookies, identity or health checks; clean start-up log"

# ---- with the manifest's SIGN_OUT_URL ----------------------------------------------------------------------------
start "$PORT" -e SIGN_OUT_URL="$SIGN_OUT"
req /config.js
[ "$(config_line)" = "window.__ET_CONFIG__ = { signOutUrl: \"$SIGN_OUT\" };" ] || fail "/config.js with SIGN_OUT_URL; got: $BODY"
pass "/config.js carries SIGN_OUT_URL ($SIGN_OUT)"

# ---- another LISTEN_PORT: nginx and the HEALTHCHECK follow it ----------------------------------------------------
start 9090 -e LISTEN_PORT=9090
req "$HEALTH" --max-time 2
[ "$CODE" = 200 ] || fail "with LISTEN_PORT=9090, $HEALTH on 9090 should be 200 (got $CODE)"
pass "LISTEN_PORT=9090: healthy, $HEALTH answers on 9090"
cleanup

# ---- bad settings abort start-up ---------------------------------------------------------------------------------
expect_abort "a LISTEN_PORT that is not a number" "LISTEN_PORT must be" "${LOCKED[@]}" -e LISTEN_PORT=http
expect_abort "a LISTEN_PORT of 80" "LISTEN_PORT must be" "${LOCKED[@]}" -e LISTEN_PORT=80
expect_abort "a SIGN_OUT_URL with a quote" "SIGN_OUT_URL must be" "${LOCKED[@]}" \
  -e 'SIGN_OUT_URL=https://auth.example.com/"};alert(1)//'
expect_abort "a SIGN_OUT_URL that is not http(s)" "SIGN_OUT_URL must be" "${LOCKED[@]}" -e 'SIGN_OUT_URL=ftp://auth.example.com/x'
expect_abort "a two-line SIGN_OUT_URL" "SIGN_OUT_URL must be" "${LOCKED[@]}" -e 'SIGN_OUT_URL=https://auth.example.com/
x'
expect_abort "a read-only root without a writable /tmp" "cannot write /tmp/et" \
  --user "$RUN_UID:$RUN_UID" --read-only --cap-drop ALL --security-opt no-new-privileges

echo "SMOKE OK"
