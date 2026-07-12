// Client-side write-layer helpers shared across the slice writes.ts hooks.

// A thrown server error is a stale-write conflict when its message carries
// "conflict" — the optimistic-concurrency CAS guard string from
// convex/_shared/db.ts. Slices surface it as a friendly "muat ulang" warn and
// keep the form open. SSOT so the predicate (which mirrors the server string)
// lives once instead of in 4 byte-identical per-slice copies that could drift.
export function isConflict(e: unknown): boolean {
  return e instanceof Error && /conflict/i.test(e.message);
}
