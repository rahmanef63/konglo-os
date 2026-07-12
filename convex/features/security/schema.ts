import { defineTable } from "convex/server";
import { v } from "convex/values";

// Keamanan & Staf — CRUD-able domain entities (staff roster, estate zone
// status, security metrics). Presentation config (STATUS_COLOR lookup map,
// HOURS axis + SHIFTS on() functions, STATS summary copy) stays slice-local in
// data.ts. Table names are global, so all are prefixed with the "security"
// domain to stay unique across the Convex schema.
export const securityTables = {
  // Staff roster the screen renders as tappable PersonRows — STAFF.
  staffRoster: defineTable({
    slug: v.string(),
    name: v.string(),
    role: v.string(),
    status: v.string(),
    color: v.string(),
    location: v.string(),
    shift: v.string(),
    tenure: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  // Per-property estate security zone status pills — LOCATIONS.
  securityZones: defineTable({
    slug: v.string(),
    label: v.string(),
    status: v.string(),
    color: v.string(),
    order: v.number(),
    version: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  // Security metric tiles (CCTV, gate access, patrols, panic) — METRICS.
  // `panic` flags the destructive panic-button tile that opens the protocol.
  securityMetrics: defineTable({
    slug: v.string(),
    label: v.string(),
    value: v.string(),
    panic: v.optional(v.boolean()),
    order: v.number(),
    // Optimistic-concurrency token (additive + optional → deploy-safe).
    version: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),
};
