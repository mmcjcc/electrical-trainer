# Deploying the Electrical Trainer (app-broker contract 2)

The app runs on Jason's home platform as **`electrician`**: <https://electrician.apps.mmcjcc.com>.
The rules are the platform's contract (`ssh homelab contract`, sections 2, 3, 6, 8, 9 and 11), and the homelab skill
drives it. Reach docker01 only as `ssh homelab <verb>`.

| | |
|---|---|
| image | `ghcr.io/mmcjcc/electrical-trainer:<full git sha>`, built from this repo's `Dockerfile` |
| runs as | uid `10005`, read-only root, a tmpfs `/tmp`, no capabilities (the platform enforces all three) |
| serves | nginx on port `8080`: the Vite build with an SPA fallback, `/healthz` (200 `ok`), `/config.js` |
| exposure | **`public`**: LAN, VPN and the internet. From outside, Google is the only sign-in door |
| sign-in | `auth: {profile: electrician}`: the app's own user list on docker01. The app keeps no allow-list of its own |
| env | `SIGN_OUT_URL` only (the app's Sign out link). No secrets, no `/data`, no sidecar, no jobs |
| resources | `cpu: 0.25`, `memory: 64m` |

## The files

| file | what it is |
|---|---|
| `deploy/homelab.yml` | the manifest: what the app asks of the platform. Check it with `ssh homelab plan electrician < deploy/homelab.yml` |
| `deploy/deploy.sh` | the platform's scaffold, `app=electrician`. Deploys a pushed commit (image and manifest together) |
| `deploy/smoke.sh` | starts a built image the way docker01 does and checks everything this app promises (list at its top) |
| `Dockerfile` | build stage `node:22-alpine` (`npm ci`, `vite build`); runtime `nginx:stable-alpine-slim` as uid 10005 |
| `nginx.conf` | SPA fallback, cache policy, gzip, security headers and CSP, `/healthz`; no cookie is read or logged |
| `docker/10-listen.sh` | start-up hook: `/tmp/et/listen.conf` from `LISTEN_PORT` (default 8080) |
| `docker/20-config.sh` | start-up hook: `/tmp/et/config.js` = `window.__ET_CONFIG__ = { signOutUrl: "..." };` from `SIGN_OUT_URL` |
| `public/config.js` | the dev copy of `/config.js` (no Sign out link); left out of the image |
| `.github/workflows/homelab-image.yml` | the platform's scaffold, copied as is: on every push to `main` it builds, contract-checks and pushes the image with the two OCI labels; pull requests build and check without pushing |
| `.github/workflows/ci.yml` | typecheck, tests and a production build, plus a Docker build run through `deploy/smoke.sh`; read-only token |

There is no Docker on the dev box. The image is only ever built and started in GitHub Actions. `deploy/smoke.sh`
in `ci.yml` and the contract smoke test in `homelab-image.yml` are where the Dockerfile, `nginx.conf` and the hooks
actually run. `docker build` also runs both hooks and `nginx -t` with the defaults and with every setting given.

## How a deploy works

1. A commit is pushed to `main`. `homelab-image` builds `ghcr.io/mmcjcc/electrical-trainer:<sha>`, starts it as
   docker01 will (uid 10005, read-only, no env, no secrets), requires `healthy` and `GET /healthz` = 200, then pushes
   it. `ci` runs the tests and `deploy/smoke.sh` alongside.
2. **The first deploy** is a session's `sh deploy/deploy.sh` from this repo, on Jason's go-ahead. It sends the
   manifest as committed at that commit and waits (up to 15 minutes) while CI is still pushing the image (exit 4).
   The first deploy registers the app: it binds it to the machines' keys and makes its network, directories and
   sign-in rule. The deploy waits up to 120 s for `healthy` and rolls back if the app does not get there.
3. **After the first deploy, pushing is deploying.** The platform deploys a push to `main` once every CI run of that
   commit is green (`ci` and `homelab-image`), as long as the commit keeps the app's shape. Check it with
   `ssh homelab status electrician` (the `autodeploy:` line). On 2026-10-16 `ssh homelab whoami` on the laptop
   printed `autodeploy: off`. While that holds, every deploy is a `sh deploy/deploy.sh`.
4. A change of `image`, `uid`, `exposure` upwards, `auth.profile`, jobs, `frame` or a sidecar is never deployed by
   the platform by itself (`autodeploy: needs-session`): run `sh deploy/deploy.sh`.
5. Rollback: `ssh homelab rollback electrician`, or `sh deploy/deploy.sh <older sha>`.

Exit codes of `deploy.sh`: 0 live and healthy, 1 failed and rolled back (read `ssh homelab logs electrician`), 2
rejected and nothing changed, 3 busy, 4 image not built yet, 5 waiting for Jason, 255 ssh could not connect.

## Sign-in and who gets in

- The platform's user list decides who gets in: `ssh homelab access show electrician`. "Add someone" is one
  `ssh homelab access add electrician <address>`, live on the next request. Add only addresses Jason gives in chat.
- **The app is public.** From the internet, Google is the only sign-in door. **Each Gmail address on the list must
  also be a test user of the platform's Google OAuth client** in the Google console while that client is in
  Testing. Until then that person cannot sign in. An AD account must be in the group `Apps-Users` and have `mail`
  set.
- A public app is rate-limited by the platform: 100 requests per minute per address, burst 50. A first visit loads
  index.html, `/config.js`, the bundle, the stylesheet, the icon, the manifest and a few route chunks, well under that.
- Sessions last 7 days. Without one, every path (assets included) answers a 302 to the sign-in page. A tab left
  open past the end of its session, or across a deploy (the old hashed chunks are gone), can no longer load a route
  chunk; reloading the page fixes it.
- The app reads none of the `X-Auth-Request-*` headers in v1 and never touches the platform's `__Secure-sso*`
  cookies: nginx neither reads nor logs a cookie, and there is nothing it could forward one to.
- The Sign out link is `SIGN_OUT_URL` from the manifest, delivered in `/config.js`. Show it as a plain link
  (`<a href>`): the CSP's `form-action 'self'` would block a form posted to the sign-in host.

## Renaming the app

`electrician` appears in `deploy/homelab.yml` (`app`, `auth.profile`, the `rd=` part of `SIGN_OUT_URL`),
`deploy/deploy.sh` (`app=`), this file and `docs/DESIGN.md` section 9. Nothing in the image, `nginx.conf`, the
hooks, `smoke.sh` or the workflows names it. Before the first deploy a rename is just those edits, plus a user list
under the new name (`ssh homelab access set <new> ...`). After it, the new name is a new app (new URL, new list),
and the platform has no verb to retire the old one: ask Jason.

## Checklist before the first deploy (contract section 11)

- [x] `ssh homelab whoami` works on the laptop (key `laptop`, `approvals: policy`); `CLAUDE.md` has the hosting line
- [x] Who may use it and whether it must be reachable from outside: decided with Jason (architect, 2026-10-16):
      public, the candidate signs in with Gmail from outside the house
- [x] The six scaffold files are in place (`Dockerfile`, `.dockerignore`, `deploy/homelab.yml`,
      `.github/workflows/homelab-image.yml`, `deploy/deploy.sh`, the `.gitattributes` line); `deploy/*` is LF;
      `app=electrician` is set in `deploy/deploy.sh`
- [x] Fixed numeric UID 10005 = `uid`; no `traefik.*` labels; one port above 1024 (8080); written for
      `--read-only --tmpfs /tmp --cap-drop ALL --user 10005:10005`. Checked in CI by both smoke tests
- [x] `HEALTHCHECK` present; `GET /healthz` = 200 from nginx itself with no env and no secrets. CI checks `healthy`
      within 120 s
- [x] Logs go to stdout; config comes from env; no secrets at all
- [x] `image:` is the repo only; no digest or tag is committed anywhere
- [x] No own cookies; `__Secure-sso*` ignored and never logged; no allow-list of the app's own
- [ ] User list: set on docker01 (2 members, per the architect; `plan` found no list problem). **Jason:** each Gmail address on it is a Google test user of the
      OAuth client (and each AD account is in `Apps-Users` with `mail`)
- [ ] **Jason:** create the GitHub repository `mmcjcc/electrical-trainer`
- [ ] Pushed to `main`; the `homelab-image` run and the `ci` run are green (every line)
- [x] `ssh homelab plan electrician < deploy/homelab.yml` shows no finding (2026-10-16: "the manifest is valid")
- [ ] **Jason's go-ahead:** `sh deploy/deploy.sh` once; then `ssh homelab status electrician` (`autodeploy:`)
- [ ] **Jason:** protect `main` (no force push, no deletion) and set the default workflow token to read-only
      (Settings, Actions, General, Workflow permissions). `homelab-image` asks for `packages: write` itself
- [x] Secrets: none
- [ ] **Jason knows the app is public** (the platform's outside check lists it)

If a deploy keeps answering "image not built yet" (exit 4) after the `homelab-image` run is green, docker01's
read-only registry credential probably cannot read the package: tell Jason. If `status` says `no-access` for the
continuous deploy, the platform's GitHub token cannot read this repository yet: one step in that token's settings
(Jason).
