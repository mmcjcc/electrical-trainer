#!/bin/sh
# 20-config.sh: runs at container start, before nginx, after 10-listen.sh (the stock /docker-entrypoint.sh runs every
# executable *.sh in /docker-entrypoint.d in name order; a hook that exits non-zero stops the container).
#
# Writes the runtime config the SPA loads from /config.js (index.html: <script src="/config.js"> before the app):
#
#     window.__ET_CONFIG__ = { signOutUrl: "<SIGN_OUT_URL, or empty>" };
#
# to /tmp/et/config.js, which nginx.conf serves as /config.js with Cache-Control: no-cache. The dev copy of the same
# shape is public/config.js; the Dockerfile leaves that one out of the image.
#
# The app keeps no allow-list of its own: the platform's user list decides who gets in (contract section 6). The only
# thing the app needs from the platform's sign-in is where its Sign out link goes.
#
# Environment:
#   SIGN_OUT_URL    absolute http(s) URL of the platform's sign-out page, set in deploy/homelab.yml `env`:
#                   https://auth.apps.mmcjcc.com/oauth2/sign_out?rd=<this app's URL, URL-encoded>
#                   Empty or unset (CI, a local run, no sign-in in front): signOutUrl is "" and the app shows no Sign
#                   out link. It is written into JavaScript inside double quotes, so only the characters
#                   A-Z a-z 0-9 . _ ~ : / ? & = % + @ - are accepted, and it must start with https:// or http://.
#                   Anything else aborts start-up.
#   ET_RUNTIME_DIR  where the start-up files go. Default /tmp/et. Only for running this script outside the image
#                   (nginx.conf names /tmp/et).
set -eu

DIR="${ET_RUNTIME_DIR:-/tmp/et}"
me="$(basename "$0")"
log() { echo "$me: $*"; }

# case, not grep: grep tests one line at a time, so a value with a newline in it would pass a pattern and write a
# broken /config.js. A newline is not in the allowed set, so the first pattern catches it.
url="${SIGN_OUT_URL:-}"
if [ -n "$url" ]; then
  bad=0
  case "$url" in
    *[!A-Za-z0-9._~:/?\&=%+@-]*) bad=1 ;;
    https://?*|http://?*) ;;
    *) bad=1 ;;
  esac
  if [ "$bad" -eq 1 ]; then
    log "ERROR: SIGN_OUT_URL must be an http(s) URL made of A-Z a-z 0-9 . _ ~ : / ? & = % + @ - only. Refusing to start."
    exit 1
  fi
fi

if ! mkdir -p "$DIR" 2>/dev/null || ! [ -w "$DIR" ]; then
  log "ERROR: cannot write $DIR (a writable /tmp is needed). Refusing to start."
  exit 1
fi

tmp="$DIR/config.js.tmp"
{
  echo "// Generated at container start by /docker-entrypoint.d/20-config.sh - do not edit."
  echo "window.__ET_CONFIG__ = { signOutUrl: \"$url\" };"
} > "$tmp"
mv "$tmp" "$DIR/config.js"

if [ -n "$url" ]; then
  log "sign-out link: $url"
else
  log "no SIGN_OUT_URL: the app shows no Sign out link"
fi
