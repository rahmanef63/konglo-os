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
};
