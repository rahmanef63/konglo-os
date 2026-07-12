import { defineTable } from "convex/server";
import { v } from "convex/values";

// Net-worth headline figures (singleton, keyed) + portfolio allocation slices.
export const officeTables = {
  officeFigures: defineTable({
    key: v.string(), // "current"
    netWorth: v.number(),
    netWorthChange: v.number(),
    liabilitas: v.number(),
    debtRatio: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing rows have
    // undefined version, which mutations treat as 0. Deploy-safe on live data.
    version: v.optional(v.number()),
  }).index("by_key", ["key"]),
  allocations: defineTable({
    slug: v.string(),
    label: v.string(),
    value: v.number(),
    // Optional so a Studio Data create is valid (accent is a theme-token string,
    // not something to hand-type); consumers pass it through safeColor() which
    // falls back when absent. Existing rows keep their accent.
    accent: v.optional(v.string()),
    order: v.number(),
    version: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),
};
