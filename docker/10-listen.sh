#!/bin/sh
# 10-listen.sh: runs at container start, before nginx. The stock /docker-entrypoint.sh of the nginx image runs every
# executable *.sh in /docker-entrypoint.d in name order, and a hook that exits non-zero stops the container. The
# Dockerfile installs this one there; it runs first of this image's two hooks.
#
# Creates the run-time directory and writes the port nginx listens on:
#
#     /tmp/et/listen.conf     listen <LISTEN_PORT>;      (included by nginx.conf's server {})
#
# Everything this image writes after it is built lives under /tmp: /tmp/et holds this file, config.js (20-config.sh)
# and nginx's temp directories, and nginx's pid file is /tmp/nginx.pid. Nothing else is written, so the image runs as
# uid 10005 (or any other) on a read-only root file system with a tmpfs at /tmp, the way docker01 starts it.
#
# Environment:
#   LISTEN_PORT     the port nginx listens on, plain HTTP on every IPv4 address. Default 8080, which is `port:` in
#                   deploy/homelab.yml, so the manifest does not set it. 1025 to 65535: the container has no root
#                   and no capabilities. The image's HEALTHCHECK follows the same variable.
#   ET_RUNTIME_DIR  where the start-up files go. Default /tmp/et. Only for running this script outside the image
#                   (nginx.conf names /tmp/et).
#
# A value that is not a port number in that range aborts start-up: it is written into nginx config.
set -eu

DIR="${ET_RUNTIME_DIR:-/tmp/et}"
me="$(basename "$0")"
log() { echo "$me: $*"; }

port="${LISTEN_PORT:-8080}"
bad=0
case "$port" in
  ''|0*|*[!0-9]*) bad=1 ;;
  *) { [ "${#port}" -le 5 ] && [ "$port" -ge 1025 ] && [ "$port" -le 65535 ]; } || bad=1 ;;
esac
if [ "$bad" -eq 1 ]; then
  log "ERROR: LISTEN_PORT must be a port number from 1025 to 65535. Refusing to start."
  exit 1
fi

if ! mkdir -p "$DIR" 2>/dev/null || ! [ -w "$DIR" ]; then
  log "ERROR: cannot write $DIR. This image keeps its start-up files under /tmp: give it a writable /tmp (a tmpfs) when the root file system is read-only. Refusing to start."
  exit 1
fi

tmp="$DIR/listen.conf.tmp"
{
  echo "# Generated at container start by /docker-entrypoint.d/10-listen.sh - do not edit."
  echo "listen $port;"
} > "$tmp"
mv "$tmp" "$DIR/listen.conf"

log "listening on port $port"
