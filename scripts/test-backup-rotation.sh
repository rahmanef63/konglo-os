#!/usr/bin/env bash
# Offline check for convex-backup.sh rotation (the one non-trivial bit: keep-last-N
# off-by-one). Sources the script so main() is guarded out, then asserts on temp files.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/convex-backup.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# 17 dumps, ascending mtime (day 01 oldest … day 17 newest) so `ls -t` is deterministic.
for i in $(seq -w 1 17); do
  f="$tmp/konglo-2026-01-$i.zip"
  touch "$f"
  touch -d "2026-01-$i 00:00:00" "$f"
done

# A staging file (newest mtime) MUST stay outside the rotation glob — this is the
# invariant the corrupt-dump fix depends on: a crashed run leaves .staging-*.zip,
# which rotation must never count or delete.
stagef="$tmp/.staging-2026-01-99.zip"
touch "$stagef"
touch -d "2026-01-20 00:00:00" "$stagef"

rotate_backups "$tmp" 14

n="$(ls -1 "$tmp"/konglo-*.zip 2>/dev/null | wc -l)"
[ "$n" -eq 14 ] || { echo "FAIL: expected 14 kept, got $n"; exit 1; }
[ -f "$tmp/konglo-2026-01-17.zip" ] || { echo "FAIL: newest (day 17) was deleted"; exit 1; }
[ -f "$tmp/konglo-2026-01-04.zip" ] || { echo "FAIL: 14th-newest (day 04) was deleted"; exit 1; }
[ ! -f "$tmp/konglo-2026-01-03.zip" ] || { echo "FAIL: day 03 (15th-newest) should be rotated out"; exit 1; }
[ ! -f "$tmp/konglo-2026-01-01.zip" ] || { echo "FAIL: oldest (day 01) should be rotated out"; exit 1; }
[ -f "$stagef" ] || { echo "FAIL: .staging file was rotated — corrupt-dump fix is broken"; exit 1; }

# Empty dir must not error (set -e + the 2>/dev/null guard).
rotate_backups "$(mktemp -d)" 14

echo "PASS: rotation keeps newest 14 of 17, drops oldest 3, ignores .staging, no-ops on empty"
