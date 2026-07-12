import { defineTable } from "convex/server";
import { v } from "convex/values";

// Audit log. Replaces prototype localStorage K.activity with server-side SSOT.
export const activityTables = {
  activity: defineTable({
    userId: v.id("users"),
    label: v.string(),
    meta: v.string(),
    at: v.number(),
  })
    .index("by_at", ["at"])
    .index("by_user", ["userId"]),
};
