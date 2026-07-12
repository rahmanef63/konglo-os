import { defineTable } from "convex/server";
import { v } from "convex/values";

// Filantropi — CRUD-able domain entities (foundation grants + measured impact).
// Presentation config (FOCUS donut segments, STATS headline copy) stays in the
// slice's data.ts. Table names are globally unique + domain-prefixed.
export const filantropiTables = {
  // Foundation programs/grants the screen lists and opens in a DetailSheet.
  philanthropyGrants: defineTable({
    name: v.string(),
    category: v.string(),
    amount: v.string(),
    progress: v.number(),
    color: v.string(),
    beneficiaries: v.string(),
    region: v.string(),
    partner: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing rows have
    // undefined version, which mutations treat as 0. Deploy-safe on live data.
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),

  // Measured cross-program outcomes rendered in the "Dampak Terukur" grid.
  philanthropyImpact: defineTable({
    label: v.string(),
    value: v.string(),
    order: v.number(),
    // Optimistic-concurrency token (additive + optional → deploy-safe on live
    // rows). Enables Studio Data edit CAS now that this table is registered.
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),
};
