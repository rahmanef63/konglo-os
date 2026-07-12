import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutation, type MutationCtx } from "../../_generated/server";
import { requireUser, requirePrincipal } from "../../_shared/auth";
import { roleForEmail } from "../../_shared/allowlist";
import { roleValidator } from "./schema";

// One role row per user, deterministically. claimRole/setRole could race or
// repeat and insert a SECOND roles row for the same user → resolveRole reads
// .first(), so whichever duplicate it hits decides the tier (nondeterministic
// RBAC). This helper is the single write path: it reads EVERY by_user row,
// keeps exactly one (patched to `role`), and deletes any extras — so the table
// converges to one row AND heals any pre-existing duplicates from a past race.
// Returns the role now persisted for the user.
// Server-authoritative audit entry for an access change. The most sensitive
// action in the app (who can open the estate) must leave a trail — flows into
// the principal-only activity.allRecent feed. Actor = the acting principal.
async function logAccess(ctx: MutationCtx, actorId: Id<"users">, label: string) {
  await ctx.db.insert("activity", { userId: actorId, label, meta: "akses", at: Date.now() });
}

async function upsertSingleRole(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: "principal" | "cfo" | "staf",
) {
  // by_user is selective (one user) — collect() over it is bounded, not a scan.
  const rows = await ctx.db
    .query("roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  if (rows.length === 0) {
    await ctx.db.insert("roles", { userId, role });
    return role;
  }
  // Patch the first, delete the rest → exactly one row, latest tier wins.
  const [keep, ...dupes] = rows;
  await ctx.db.patch(keep._id, { role });
  for (const dupe of dupes) await ctx.db.delete(dupe._id);
  return role;
}

// Self-register a role row for the authed caller. SECURITY: no public mutation
// may ever self-grant principal, AND (private app) it grants NO blanket role —
// with Google OAuth open, a stranger's Google login must NOT auto-become "staf"
// and see the estate. The role comes solely from the email allowlist (same SSOT
// as the OAuth callback): allowlisted → that role; unlisted → NO row, returns
// null, and the shell shows "no access". Principal/cfo for the owner are set by
// seed/allowlist; anyone else is granted a role only by the principal via setRole.
// IDEMPOTENT: an existing row is returned unchanged (never downgraded), and any
// duplicate rows from a race are collapsed to one without changing the tier.
export const claimRole = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (rows.length === 0) {
      const user = await ctx.db.get(userId);
      const role = roleForEmail(user?.email);
      if (!role) return null; // unlisted → no access until principal assigns one
      await ctx.db.insert("roles", { userId, role });
      return role;
    }
    // Idempotent: keep the existing tier; only de-dupe extra rows from a race.
    const [keep, ...dupes] = rows;
    for (const dupe of dupes) await ctx.db.delete(dupe._id);
    return keep.role;
  },
});

// Assign/re-tier a user's role. SECURITY: principal-ONLY — requireAdmin admits
// cfo, which would let a cfo self-elevate to principal and read the principal-only
// heirs/succession data (SEC-001). So: only a principal may assign roles; a
// principal may never change their OWN role (lock-out / self-target guard); and
// 'principal' is NEVER granted via this public mutation — it is bootstrapped
// exclusively by the internal authSeed path (authSeed.setRoleByEmail).
export const setRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  handler: async (ctx, { userId, role }) => {
    const callerId = await requirePrincipal(ctx);
    if (userId === callerId) {
      throw new Error("Forbidden: cannot change your own role");
    }
    if (role === "principal") {
      throw new Error("Forbidden: principal is granted only via seed");
    }
    // Never DOWN-tier a co-principal from the UI — mirror revokeRole's guard so
    // "the estate owner is never demotable from the UI" holds for set + revoke.
    const current = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (current?.role === "principal") {
      throw new Error("Forbidden: cannot change a principal's role");
    }
    await upsertSingleRole(ctx, userId, role);
    const target = await ctx.db.get(userId);
    await logAccess(ctx, callerId, `Ubah akses: ${target?.email ?? "pengguna"} → ${role}`);
  },
});

// Revoke a user's access entirely (deletes their role row → no role → locked out
// of the shell, every requireFeature/requirePrincipal denies). Needed once Google
// OAuth is open: a stranger who authenticated can be denied here. SECURITY:
// principal-ONLY; can't revoke yourself (lock-out guard); can't revoke another
// principal (the estate owner is never demotable from the UI).
export const revokeRole = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const callerId = await requirePrincipal(ctx);
    if (userId === callerId) {
      throw new Error("Forbidden: cannot revoke your own access");
    }
    const rows = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (rows.some((r) => r.role === "principal")) {
      throw new Error("Forbidden: cannot revoke a principal");
    }
    for (const r of rows) await ctx.db.delete(r._id);
    const target = await ctx.db.get(userId);
    await logAccess(ctx, callerId, `Cabut akses: ${target?.email ?? "pengguna"}`);
  },
});

// Record the caller's coarse locale context on sign-in — browser time zone +
// locale, volunteered by the CLIENT (NO IP, NO geoip: users never send an IP to
// Convex and the analytics beacon deliberately discards it). The time zone is the
// closest privacy-preserving proxy for "where" a user signs in, surfaced in the
// principal-only access roster. Idempotent upsert (one row per user). Demo /
// anonymous sessions are throwaway → skipped. Called fire-and-forget by the shell.
export const recordLogin = mutation({
  args: { timeZone: v.optional(v.string()), locale: v.optional(v.string()) },
  handler: async (ctx, { timeZone, locale }) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (user?.isAnonymous) return; // throwaway demo guest — nothing to track
    const existing = await ctx.db
      .query("userMeta")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const patch = {
      timeZone: timeZone ?? existing?.timeZone,
      locale: locale ?? existing?.locale,
      lastLoginAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, patch);
    else await ctx.db.insert("userMeta", { userId, ...patch });
  },
});
