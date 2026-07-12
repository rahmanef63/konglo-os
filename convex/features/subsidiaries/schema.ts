import { defineTable } from "convex/server";
import { v } from "convex/values";

export const subsidiaryTables = {
  subsidiaries: defineTable({
    slug: v.string(),
    name: v.string(),
    sector: v.string(),
    revenue: v.number(),
    margin: v.number(),
    ownership: v.number(),
    trend: v.number(),
    color: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing rows have
    // undefined version, which mutations treat as 0. Deploy-safe on live data.
    version: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),
};
