import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contactTables = {
  contacts: defineTable({
    slug: v.string(),
    name: v.string(),
    role: v.string(),
    tier: v.string(),
    warmth: v.string(),
    last: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),
};
