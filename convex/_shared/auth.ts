import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
// SSOT for RBAC. Relative import (NOT @/ alias): the Convex bundler may not
// resolve path aliases. lib/roles.ts is pure TS, safe to bundle.
import { canAccess } from "../../lib/roles";

// rr: Server-side authz on EVERY mutation. Route gates (proxy.ts) are not enough.
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

// Resolve the caller's role row from the SSOT roles table (by_user index).
async function resolveRole(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const row = await ctx.db
    .query("roles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  return row?.role ?? null;
}

// principal/admin-tier write guard. Convex HTTP fns are directly reachable.
// Stays for genuinely elevated, non-feature-scoped ops (e.g. rbac.setRole).
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUser(ctx);
  const role = await resolveRole(ctx, userId);
  if (!role || (role !== "principal" && role !== "cfo")) {
    throw new Error("Forbidden: elevated role required");
  }
  return userId;
}

// READ gate, feature-scoped. Mirrors the lib/roles.ts SSOT (canAccess):
// principal sees everything; other roles only their menu's feature slugs.
// Blocks direct-API reads the client menu already hides — never removes
// access the menu grants. Throws if the caller has no role row.
export async function requireFeature(
  ctx: QueryCtx | MutationCtx,
  slug: string,
) {
  const userId = await requireUser(ctx);
  const role = await resolveRole(ctx, userId);
  if (!role) throw new Error("Forbidden: no role");
  if (role === "principal") return userId;
  if (!canAccess(role, slug)) throw new Error("Forbidden: feature " + slug);
  return userId;
}

// WRITE gate, feature-scoped. Caller must pass the READ gate AND hold an
// elevated (principal|cfo) role. staf can never write. Keeps the old
// requireAdmin write tier but now ALSO scoped to the feature.
export async function requireFeatureWrite(
  ctx: QueryCtx | MutationCtx,
  slug: string,
) {
  const userId = await requireFeature(ctx, slug);
  const role = await resolveRole(ctx, userId);
  if (role !== "principal" && role !== "cfo") {
    throw new Error("Forbidden: write requires elevated role");
  }
  return userId;
}

// principal-ONLY gate. For data that must never leak to cfo/staf even when a
// shared feature (e.g. data-studio) would otherwise grant access — succession /
// ahli-waris (heirs) is the principal's private estate plan. Layer this AFTER
// the feature gate, never as a replacement for it.
export async function requirePrincipal(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUser(ctx);
  const role = await resolveRole(ctx, userId);
  if (role !== "principal") throw new Error("Forbidden: principal only");
  return userId;
}
