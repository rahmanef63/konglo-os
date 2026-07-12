#!/usr/bin/env bash
# deploy-verify.sh — backend-first deploy + verify for Konglo OS.
#
# DEPLOY != PUSH. `git push` does NOT reliably trigger a build here (the Dokploy
# webhook does not fire on every push), and `git push` NEVER deploys Convex (the
# pre-push hook's Convex auto-deploy no-ops because .env.local lacks the
# self-hosted vars). This script codifies the real, ordered path:
#
#   1. (manual, owner) mint a Convex admin key
#   2. deploy Convex backend (schema + functions) FIRST
#   3. snapshot the SERVED frontend bundle hashes (pre-build baseline)
#   4. trigger the Dokploy frontend build via API (don't trust the webhook)
#   5. poll /api/ready AND require the served bundle hashes to CHANGE, then report
#
# DEPLOY != PUSH, part 2: /api/ready returns 200 from the OLD (un-rebuilt)
# container, so polling readiness alone declares "READY" on a deploy that never
# rebuilt — the exact DEPLOY!=PUSH gap. We additionally diff the served
# /_next/static/chunks/*.js fingerprint before vs after; only a CHANGED bundle
# proves the new build is actually serving.
#
# Run via `pnpm deploy:verify`. All inputs come from env with sane defaults.
#
# Usage:
#   CONVEX_SELF_HOSTED_ADMIN_KEY='konglo|…' \
#   DOKPLOY_API_URL='https://<dokploy-host>/api' \
#   DOKPLOY_API_KEY='<token>' \
#     pnpm deploy:verify
#
# Skip a stage when you only need part of the loop:
#   SKIP_CONVEX=1   pnpm deploy:verify   # frontend build + verify only
#   SKIP_DOKPLOY=1  pnpm deploy:verify   # convex deploy + verify only
#   VERIFY_ONLY=1   pnpm deploy:verify   # just poll /api/ready
set -euo pipefail

# ── Parameters (env with defaults) ──────────────────────────────────────────
# Convex self-hosted (instance name is `konglo`, NOT konglo-os).
CONVEX_SELF_HOSTED_URL="${CONVEX_SELF_HOSTED_URL:-}"        # e.g. https://api-convex.example.com
CONVEX_SELF_HOSTED_ADMIN_KEY="${CONVEX_SELF_HOSTED_ADMIN_KEY:-}"
CONVEX_INSTANCE="${CONVEX_INSTANCE:-konglo}"
CONVEX_BACKEND_CONTAINER="${CONVEX_BACKEND_CONTAINER:-convex-backend}"

# Dokploy frontend application.
DOKPLOY_API_URL="${DOKPLOY_API_URL:-}"            # must already end in /api
DOKPLOY_API_KEY="${DOKPLOY_API_KEY:-}"
DOKPLOY_APP_ID="${DOKPLOY_APP_ID:-}"             # your Dokploy application id

# Public app URL + readiness polling.
APP_URL="${APP_URL:-http://localhost:3000}"
READY_RETRIES="${READY_RETRIES:-40}"             # × interval = max wait
READY_INTERVAL="${READY_INTERVAL:-15}"           # seconds between polls

# Stage toggles.
SKIP_CONVEX="${SKIP_CONVEX:-0}"
SKIP_DOKPLOY="${SKIP_DOKPLOY:-0}"
VERIFY_ONLY="${VERIFY_ONLY:-0}"

if [[ "$VERIFY_ONLY" == "1" ]]; then
  SKIP_CONVEX=1
  SKIP_DOKPLOY=1
fi

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# Fingerprint the SERVED frontend: the sorted set of hashed Next chunk URLs on
# /login. A new build emits new content-hashed filenames, so a CHANGED
# fingerprint proves the new bundle is actually being served (not the old
# container still answering /api/ready 200). Empty output = page didn't serve.
bundle_fingerprint() {
  curl -sS "${APP_URL}/login" \
    | grep -oE '/_next/static/chunks/[a-zA-Z0-9_~.-]+\.js' \
    | sort -u \
    | sha256sum \
    | awk '{print $1}'
}

# The Dokploy deploy RECORD is the authoritative "new build is live" signal: it
# reports the finished build's commit + status directly. Unlike bundle_fingerprint
# (which reads /login), it is NOT blind to /os-scoped changes — and this app is
# auth-gated, so most changes never touch /login's chunks and the fingerprint then
# FALSE-NEGATIVES on a perfectly good deploy. Requires the latest deployment to
# match HEAD so a stale "done" from a prior deploy never counts.
HEAD_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
deploy_record_done() {
  [[ -n "$DOKPLOY_API_URL" && -n "$DOKPLOY_API_KEY" && -n "$HEAD_SHA" ]] || return 1
  local rec status commit
  rec="$(curl -sS "${DOKPLOY_API_URL}/deployment.all?applicationId=${DOKPLOY_APP_ID}" \
    -H "x-api-key: ${DOKPLOY_API_KEY}" 2>/dev/null || true)"
  [[ -n "$rec" ]] || return 1
  # [0] is the most recent deployment; its description carries "Commit: <full-sha>".
  status="$(printf '%s' "$rec" | grep -oE '"status":"[a-z]+"' | head -1 | cut -d'"' -f4 || true)"
  commit="$(printf '%s' "$rec" | grep -oE 'Commit: [0-9a-f]+' | head -1 | awk '{print $2}' || true)"
  [[ "$commit" == "$HEAD_SHA" && "$status" == "done" ]]
}

# ── Step 0: admin-key mint (manual, OWNER runs this) ─────────────────────────
# Docker is not reachable from the dev shell — mint the key on the VPS via the
# os.sh skill, then export it into this script's env as CONVEX_SELF_HOSTED_ADMIN_KEY.
if [[ "$SKIP_CONVEX" != "1" && -z "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]]; then
  cat <<EOF
$(warn "CONVEX_SELF_HOSTED_ADMIN_KEY is not set.")
Mint one on the VPS (owner step — docker is not reachable from this shell):

  bash ~/.claude/skills/os/os.sh exec \\
    "docker exec ${CONVEX_BACKEND_CONTAINER} ./generate_admin_key.sh ${CONVEX_INSTANCE}"

Then re-run with the key exported, e.g.:

  CONVEX_SELF_HOSTED_ADMIN_KEY='${CONVEX_INSTANCE}|…' pnpm deploy:verify

EOF
  die "missing CONVEX_SELF_HOSTED_ADMIN_KEY (or pass SKIP_CONVEX=1)"
fi

# ── Step 1: Convex backend deploy (FIRST — backend before frontend) ──────────
if [[ "$SKIP_CONVEX" != "1" ]]; then
  log "Deploying Convex backend to ${CONVEX_SELF_HOSTED_URL} (instance ${CONVEX_INSTANCE})"
  # CONVEX_DEPLOYMENT must be EMPTY so the CLI uses the self-hosted URL/key and
  # does not error on the anonymous-local deployment baked into .env.local.
  CONVEX_DEPLOYMENT= \
  CONVEX_SELF_HOSTED_URL="$CONVEX_SELF_HOSTED_URL" \
  CONVEX_SELF_HOSTED_ADMIN_KEY="$CONVEX_SELF_HOSTED_ADMIN_KEY" \
    npx convex deploy --yes
  log "Convex deploy complete."
else
  warn "SKIP_CONVEX=1 — skipping Convex backend deploy."
fi

# ── Step 1.5: snapshot the SERVED bundle fingerprint (pre-build baseline) ────
# Captured BEFORE the build trigger so Step 3 can require it to change. Skipped
# under VERIFY_ONLY (no build = nothing to compare against).
PRE_FINGERPRINT=""
if [[ "$VERIFY_ONLY" != "1" ]]; then
  PRE_FINGERPRINT="$(bundle_fingerprint || true)"
  if [[ -n "$PRE_FINGERPRINT" ]]; then
    log "Pre-build served bundle fingerprint: ${PRE_FINGERPRINT}"
  else
    warn "Could not fingerprint the served bundle (app down / no chunks yet) — will treat any served bundle as the new build."
  fi
fi

# ── Step 2: Dokploy frontend build trigger (don't trust the webhook) ─────────
if [[ "$SKIP_DOKPLOY" != "1" ]]; then
  [[ -n "$DOKPLOY_API_URL" ]] || die "DOKPLOY_API_URL is required to trigger the build (or pass SKIP_DOKPLOY=1)"
  [[ -n "$DOKPLOY_API_KEY" ]] || die "DOKPLOY_API_KEY is required to trigger the build (or pass SKIP_DOKPLOY=1)"
  log "Triggering Dokploy build for app ${DOKPLOY_APP_ID} via ${DOKPLOY_API_URL}/application.deploy"
  # DOKPLOY_API_URL already ends in /api — do NOT add another /api segment.
  http_code="$(curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "${DOKPLOY_API_URL}/application.deploy" \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${DOKPLOY_API_KEY}" \
    -d "{\"applicationId\":\"${DOKPLOY_APP_ID}\"}")"
  if [[ "$http_code" != "200" && "$http_code" != "201" ]]; then
    die "Dokploy deploy trigger returned HTTP ${http_code}"
  fi
  log "Build triggered (HTTP ${http_code})."
else
  warn "SKIP_DOKPLOY=1 — skipping Dokploy build trigger."
fi

# ── Step 3: poll until READY *and* the served bundle actually changed ────────
# /api/ready 200 is necessary but NOT sufficient: the OLD container answers 200
# while the new build is still compiling (or never built). We additionally
# require the served bundle fingerprint to differ from the pre-build baseline.
# Without a baseline (VERIFY_ONLY, or the app was down pre-build) we fall back
# to readiness-only and warn that we cannot prove the bundle changed.
log "Polling ${APP_URL}/api/ready + served-bundle change (up to $((READY_RETRIES * READY_INTERVAL))s)"
for i in $(seq 1 "$READY_RETRIES"); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${APP_URL}/api/ready" || true)"
  if [[ "$code" == "200" ]]; then
    # PRIMARY signal: the Dokploy deploy record says the build for THIS commit is
    # done — authoritative + not blind to /os-scoped changes (unlike the /login
    # fingerprint below), so it is checked first.
    if deploy_record_done; then
      log "DEPLOYED — Dokploy deploy record: status=done for HEAD ${HEAD_SHA:0:8} after ${i} poll(s)."
      curl -sS "${APP_URL}/api/health" && printf '\n'
      exit 0
    fi
    # FALLBACK: served /login bundle changed (covers /login-affecting changes +
    # when the deploy-record API is unavailable, e.g. SKIP_DOKPLOY / VERIFY_ONLY).
    post_fingerprint="$(bundle_fingerprint || true)"
    if [[ -n "$post_fingerprint" && -n "$PRE_FINGERPRINT" && "$post_fingerprint" != "$PRE_FINGERPRINT" ]]; then
      log "DEPLOYED — /api/ready 200 AND served bundle changed (${PRE_FINGERPRINT} → ${post_fingerprint}) after ${i} poll(s)."
      curl -sS "${APP_URL}/api/health" && printf '\n'
      exit 0
    fi
    if [[ -z "$PRE_FINGERPRINT" && ( -z "$DOKPLOY_API_URL" || -z "$DOKPLOY_API_KEY" ) ]]; then
      # No bundle baseline AND no deploy-record access — readiness is all we have.
      log "READY — ${APP_URL}/api/ready returned 200 after ${i} poll(s)."
      warn "No pre-build baseline + no deploy-record access — could NOT verify the new build is live."
      curl -sS "${APP_URL}/api/health" && printf '\n'
      exit 0
    fi
    printf '  [%2d/%2d] ready=200; deploy record not done for HEAD yet; bundle UNCHANGED (%s) — retrying in %ss\n' \
      "$i" "$READY_RETRIES" "${post_fingerprint:-none}" "$READY_INTERVAL"
  else
    printf '  [%2d/%2d] /api/ready → %s … retrying in %ss\n' "$i" "$READY_RETRIES" "${code:-000}" "$READY_INTERVAL"
  fi
  sleep "$READY_INTERVAL"
done

die "NOT deployed after $((READY_RETRIES * READY_INTERVAL))s — no deploy record done for HEAD ${HEAD_SHA:0:8} and the served bundle never changed (build still running / failed). Check Dokploy build logs (CLAUDE.md › build logs)."
