import { defineTable } from "convex/server";
import { v } from "convex/values";

// Roles mirror lib/roles.ts SSOT (principal | cfo | staf).
export const roleValidator = v.union(
  v.literal("principal"),
  v.literal("cfo"),
  v.literal("staf"),
);

export const rbacTables = {
  roles: defineTable({
    userId: v.id("users"),
    role: roleValidator,
  }).index("by_user", ["userId"]),

  // Per-user client context captured at sign-in: browser time zone + locale, and
  // last-login time. A privacy-preserving "where" proxy for the access roster —
  // NO IP and NO geoip are ever stored (the analytics pipeline is deliberately
  // cookieless/IP-discarding). All fields optional so a login without the client
  // hints still upserts. One row per user (by_user, upserted).
  userMeta: defineTable({
    userId: v.id("users"),
    timeZone: v.optional(v.string()),
    locale: v.optional(v.string()),
    lastLoginAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
};
