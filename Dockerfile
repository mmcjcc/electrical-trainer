# syntax=docker/dockerfile:1
# Electrical Trainer: a static SPA (Vite + React) behind nginx, hosted by app-broker (contract 2; rules: HOSTING.md
# section 2, served by "ssh homelab contract").
#   build   : node:22-alpine, npm ci + vite build -> /app/dist
#   runtime : nginx:stable-alpine-slim serving dist/ with nginx.conf, as uid 10005, on port 8080
#
# There is no Docker on the dev box: the image is built and smoke-tested in GitHub Actions only
# (.github/workflows/homelab-image.yml builds, checks and pushes it; .github/workflows/ci.yml runs deploy/smoke.sh).
# docker01 runs it like this, and so do both workflows (no env, no secrets, nothing mounted but a tmpfs /tmp):
#   docker run --rm --user 10005:10005 --read-only --tmpfs /tmp:size=64m --cap-drop ALL \
#     --security-opt no-new-privileges -p 127.0.0.1:8080:8080 <image>
# Every setting is an environment variable, documented at the top of its hook in docker/. The labels
# org.opencontainers.image.source and .revision are set by the workflow, not here. No traefik.* label, ever: the
# platform alone defines routing.

# ---- build stage ---------------------------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Vite through node, as CLAUDE.md says; the typecheck and the tests run in ci.yml, not here.
RUN node node_modules/vite/bin/vite.js build

# ---- runtime stage -------------------------------------------------------------------------------------------
# alpine-slim (~20 MB) still ships what this image uses: the /docker-entrypoint.d hook runner, busybox (sh, sed,
# grep, wget for the HEALTHCHECK) and gzip.
FROM nginx:stable-alpine-slim

# Site config: SPA fallback, cache policy, gzip, security headers, /healthz. Replaces the stock default.conf, which
# the image's /etc/nginx/nginx.conf includes inside http {}.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Start-up hooks. The stock entrypoint runs every *executable* *.sh in /docker-entrypoint.d, in name order, before
# nginx starts; a hook that exits non-zero stops the container. Each writes into /tmp/et, never into the image.
#   10-listen.sh   /tmp/et/listen.conf (LISTEN_PORT, default 8080), and creates /tmp/et
#   20-config.sh   /tmp/et/config.js, served as /config.js (SIGN_OUT_URL)
COPY docker/10-listen.sh docker/20-config.sh /docker-entrypoint.d/

# In order:
#   * sed strips CRLF in case the hooks were checked out on Windows; chmod makes them executable.
#   * The stock main config is made to run without root on a read-only image: the pid file moves to /tmp, the
#     `user nginx;` line goes (it only means something to a master started as root), and one worker is enough for
#     0.25 cpu and 64m of memory (`auto` would start one per core of docker01). The greps fail the build if a new
#     base image words those lines differently.
#   * The stock IPv6 hook is removed: it only ever edits the packaged default.conf, which this image replaces, and on
#     a read-only file system it logs a misleading "can not modify" line.
#   * The hooks run twice, with the defaults and with every setting given, `nginx -t` checks each result, and the
#     config.js they wrote is checked for its exact shape, so a typo in nginx.conf or in a hook fails the build.
#     What they wrote is deleted again: a container that somehow starts without its hooks finds no listen.conf, and
#     nginx refuses to start.
#   * The stock html goes before dist/ lands.
RUN cd /docker-entrypoint.d \
 && sed -i 's/\r$//' 10-listen.sh 20-config.sh \
 && chmod 0755 10-listen.sh 20-config.sh \
 && sed -i -e '/^user[[:space:]]/d' \
           -e 's,^pid[[:space:]].*,pid        /tmp/nginx.pid;,' \
           -e 's,^worker_processes[[:space:]].*,worker_processes  1;,' /etc/nginx/nginx.conf \
 && grep -q '^pid        /tmp/nginx.pid;$' /etc/nginx/nginx.conf \
 && grep -q '^worker_processes  1;$' /etc/nginx/nginx.conf \
 && ! grep -q '^[[:space:]]*user[[:space:]]' /etc/nginx/nginx.conf \
 && rm -f 10-listen-on-ipv6-by-default.sh \
 && ./10-listen.sh && ./20-config.sh && nginx -t \
 && grep -qxF 'listen 8080;' /tmp/et/listen.conf \
 && grep -qxF 'window.__ET_CONFIG__ = { signOutUrl: "" };' /tmp/et/config.js \
 && export LISTEN_PORT=9090 \
      SIGN_OUT_URL='https://auth.example.com/oauth2/sign_out?rd=https%3A%2F%2Fapp.example.com%2F' \
 && ./10-listen.sh && ./20-config.sh && nginx -t \
 && grep -qxF 'listen 9090;' /tmp/et/listen.conf \
 && grep -qxF 'window.__ET_CONFIG__ = { signOutUrl: "https://auth.example.com/oauth2/sign_out?rd=https%3A%2F%2Fapp.example.com%2F" };' /tmp/et/config.js \
 && rm -rf /tmp/et /tmp/nginx.pid /usr/share/nginx/html/*

# config.js is left out on purpose: public/config.js is the dev default, and the real one is written at start-up and
# served from /tmp/et. Files stay root-owned and world-readable: nginx can read them and cannot change them.
COPY --from=build /app/dist /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/config.js

# A fixed numeric UID, equal to `uid:` in deploy/homelab.yml. The platform starts the container as uid:uid whatever
# this line says; it is here so that a plain `docker run` is not root either.
USER 10005:10005
EXPOSE 8080

# GETs the manifest's `health` path on the manifest's `port` with busybox wget (no curl in the image). The first
# 20 s are checked every 2 s, so a started container shows as healthy within seconds.
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --start-interval=2s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${LISTEN_PORT:-8080}/healthz" >/dev/null 2>&1 || exit 1

# ENTRYPOINT and CMD are inherited from the nginx image: /docker-entrypoint.sh nginx -g 'daemon off;'
