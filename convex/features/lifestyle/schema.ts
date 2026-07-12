import { defineTable } from "convex/server";
import { v } from "convex/values";

// Hiburan & Gaya Hidup — CRUD-able domain entities (events + concierge).
// Presentation config (DAYS, CALENDAR_EVENTS color map, STATS copy) stays in
// the slice's data.ts. Table names are globally unique + domain-prefixed.
export const lifestyleTables = {
  // Upcoming lifestyle events the screen renders as confirm-attendance cards.
  lifestyleEvents: defineTable({
    date: v.string(),
    title: v.string(),
    location: v.string(),
    color: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),

  // Concierge quick-action reservation types (jet, yacht, resto, tickets).
  conciergeReservations: defineTable({
    emoji: v.string(),
    label: v.string(),
    order: v.number(),
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),

  // Most-recent concierge requests shown under the reservation grid.
  conciergeRequests: defineTable({
    label: v.string(),
    order: v.number(),
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),
};
