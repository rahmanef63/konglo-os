import { defineTable } from "convex/server";
import { v } from "convex/values";

// Keluarga & Warisan domain entities. Presentation config (family-tree avatar
// strip CHILDREN, summary STATS copy) stays slice-local in data.ts. Table names
// are global, so each is domain-prefixed to stay unique across the schema.
export const familyTables = {
  // Succession plan — HEIRS. The CRUD-able list of heirs/trust shown in the
  // "Rencana Suksesi" card and DetailSheet.
  heirs: defineTable({
    name: v.string(),
    role: v.string(),
    share: v.string(),
    readiness: v.number(),
    color: v.string(),
    age: v.string(),
    next: v.string(),
    mandate: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),

  // Governance checklists — GOVERNANCE. Title + bullet items for the three
  // bottom cards (Dokumen Hukum / Tata Kelola / Pendidikan Next-Gen).
  governanceBuckets: defineTable({
    title: v.string(),
    // Optional so a Studio Data create (flat registry can't supply an array) is
    // valid; the feature screen guards `items ?? []`. Existing rows keep theirs.
    items: v.optional(v.array(v.string())),
    order: v.number(),
    // Optimistic-concurrency token (additive + optional → deploy-safe).
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),
};
