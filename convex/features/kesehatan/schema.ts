import { defineTable } from "convex/server";
import { v } from "convex/values";

// Kesehatan domain entities. Presentation config (vitals trend, readiness,
// stat tiles) stays slice-local in data.ts. Table names are global, so all are
// prefixed with the "health" domain to stay unique across the Convex schema.
export const kesehatanTables = {
  // Concierge medical roster — MEDICAL_TEAM.
  healthMedicalTeam: defineTable({
    name: v.string(),
    role: v.string(),
    color: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),

  // Upcoming appointments & sessions — SCHEDULE.
  healthSchedule: defineTable({
    date: v.string(),
    title: v.string(),
    location: v.string(),
    color: v.string(),
    order: v.number(),
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),

  // Daily programs & reminders — PROGRAMS (label / value tuple).
  healthPrograms: defineTable({
    label: v.string(),
    value: v.string(),
    order: v.number(),
    // Optimistic-concurrency token (additive + optional → deploy-safe).
    version: v.optional(v.number()),
  }).index("by_order", ["order"]),
};
