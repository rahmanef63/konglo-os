#!/usr/bin/env bash
# convex-backup.sh — logical backup of the self-hosted Convex (irreplaceable estate data).
#
# WHY: prod data lives in ONE un-replicated SQLite Docker volume on a single VPS.
# `convex export` is the app-consistent logical dump (correct tool; a raw volume
# snapshot of a live SQLite file can tear). This wraps it + keep-last-N rotation.
#
# ┌─ RUN ONCE MANUALLY before trusting / cron-ing ────────────────────────────┐
# │ Rotation is offline-tested; the live `convex export` step needs YOUR admin │
# │ key and has NOT run against prod from CI. Run once, then VERIFY CONTENT:    │
# │   unzip -l backups/konglo-<ts>.zip     # eyeball the table list + row sizes │
# │ The gates below catch empty/truncated/corrupt-zip + a thin-dump tripwire —  │
# │ NOT content-completeness. A valid export against the WRONG/empty instance   │
# │ still "opens". Confirm the rows are actually there, THEN cron it.           │
# └────────────────────────────────────────────────────────────────────────────┘
#
# Setup (env — NOT committed; mint the admin key with `generate_admin_key.sh <instance>`):
#   export CONVEX_SELF_HOSTED_URL=https://api-convex.example.com
#   export CONVEX_SELF_HOSTED_ADMIN_KEY='<instance>|...'
#   ./scripts/convex-backup.sh           # -> backups/konglo-<ts>.zip, keeps newest 14
#
# Restore (DR drill — rehearse on a THROWAWAY instance first; NEVER blind-import prod):
#   unset CONVEX_SELF_HOSTED_URL CONVEX_SELF_HOSTED_ADMIN_KEY   # drop any prod env FIRST
#   export CONVEX_SELF_HOSTED_URL=<throwaway-convex-url> CONVEX_SELF_HOSTED_ADMIN_KEY=<throwaway-key>
#   pnpm exec convex import --replace-all backups/konglo-<ts>.zip
#   # --replace-all WIPES the target. The CLI prompts AND prints the deployment URL
#   # before deleting — READ that URL; if it is the prod host, abort. Unrecoverable.
#
# Cron (daily 03:00, on the box that has the env + repo checkout):
#   0 3 * * * cd /path/to/konglo-os && ./scripts/convex-backup.sh >> backups/backup.log 2>&1
#
# ponytail: keep-last-N local rotation only. Offsite copy (rclone/S3) + Postgres
# storage backend are the owner's call — add when one VPS is no longer enough.
set -euo pipefail

KEEP="${BACKUP_KEEP:-14}"

# Keep the newest $2 konglo-*.zip in $1, delete older. Sourced + asserted by the
# rotation test, so this stays a function (don't inline it into main).
rotate_backups() {
  local dir="$1" keep="$2" old
  # newest-first; skip the first $keep; remove the rest. Our filenames are
  # konglo-<timestamp>.zip (no spaces/newlines). Process substitution + `|| true`
  # so an empty dir (ls no-match → exit 2 under pipefail) is a clean no-op, and
  # the loop runs in this shell (not a subshell that would swallow failures).
  while IFS= read -r old; do
    rm -f "$old"
    echo "rotated out: $old"
  done < <(ls -1t "$dir"/konglo-*.zip 2>/dev/null | tail -n +"$((keep + 1))" || true)
}

main() {
  local dir ts stage out sz
  dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups"
  mkdir -p "$dir"

  # The convex CLI reads CONVEX_SELF_HOSTED_* from env. CONVEX_DEPLOYMENT (the
  # anon-local in .env.local) MUST be unset or the CLI targets the local backend.
  unset CONVEX_DEPLOYMENT || true
  : "${CONVEX_SELF_HOSTED_URL:?set CONVEX_SELF_HOSTED_URL (e.g. https://api-convex.example.com)}"
  : "${CONVEX_SELF_HOSTED_ADMIN_KEY:?set CONVEX_SELF_HOSTED_ADMIN_KEY (konglo|...)}"

  ts="$(date +%Y%m%d-%H%M%S)"
  out="$dir/konglo-$ts.zip"
  # Export to a staging name first; only a fully-validated dump is renamed to the
  # konglo-*.zip that rotation sees. So a crashed/corrupt/interrupted run (OOM,
  # SIGKILL, truncated export) can NEVER leave a bad file that rotation would keep
  # while deleting good older backups. The dot-prefix keeps it outside the glob.
  stage="$dir/.staging-$ts.zip"
  rm -f "$dir"/.staging-*.zip   # clear stale staging left by any prior crashed run

  # No --include-file-storage: this app stores NO Convex file blobs (no ctx.storage
  # anywhere in convex/). Add it here if document/scan uploads are ever introduced.
  pnpm exec convex export --path "$stage"

  # Data-safety gates — ALL fatal. A trusted backup must be real; a thin/empty/
  # corrupt dump is worse than none (false safety), so never bless one. These catch
  # empty/truncated/corrupt + a wrong-instance tripwire, NOT content-completeness
  # (that is the run-once `unzip -l` eyeball above).
  [ -s "$stage" ] || { echo "BACKUP FAILED: empty export ($stage)" >&2; rm -f "$stage"; exit 1; }
  unzip -t "$stage" >/dev/null 2>&1 || { echo "BACKUP FAILED: not a valid zip ($stage)" >&2; rm -f "$stage"; exit 1; }
  sz="$(stat -c%s "$stage" 2>/dev/null || stat -f%z "$stage" 2>/dev/null || echo 0)"
  [ "$sz" -ge 10240 ] || { echo "BACKUP FAILED: only ${sz}B — wrong/empty deployment? ($stage)" >&2; rm -f "$stage"; exit 1; }

  mv "$stage" "$out"
  echo "BACKUP OK: $out (${sz}B)"
  rotate_backups "$dir" "$KEEP"
}

# Run main only when executed, not when sourced (lets the test call rotate_backups
# without triggering the live export / required-env checks).
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
