import { defineSchema } from "convex/server";
import { defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { rbacTables } from "./features/rbac/schema";
import { officeTables } from "./features/office/schema";
import { subsidiaryTables } from "./features/subsidiaries/schema";
import { contactTables } from "./features/contacts/schema";
import { activityTables } from "./features/activity/schema";
import { filantropiTables } from "./features/filantropi/schema";
import { lifestyleTables } from "./features/lifestyle/schema";
import { securityTables } from "./features/security/schema";
import { familyTables } from "./features/family/schema";
import { kesehatanTables } from "./features/kesehatan/schema";
import { aiChatTables } from "./features/aiChat/_schema";
import { pageviewTables } from "./features/pageviews/schema";
import { dataManagementTables } from "./features/dataManagement/schema";
import { appSettingsTables } from "./features/appSettings/schema";

// Master schema = auth + every feature's tables (composed, not accumulated).
export default defineSchema({
  ...authTables,
  ...rbacTables,
  ...officeTables,
  ...subsidiaryTables,
  ...contactTables,
  ...activityTables,
  ...filantropiTables,
  ...lifestyleTables,
  ...securityTables,
  ...familyTables,
  ...kesehatanTables,
  ...aiChatTables,
  ...pageviewTables,
  ...dataManagementTables,
  ...appSettingsTables,

  // investasi-pasar: market holdings (mirrors HOLDINGS rows in
  // frontend/slices/investasi-pasar/data.ts). Display values are pre-formatted
  // strings in the prototype; stored verbatim so the slice renders unchanged.
  holdings: defineTable({
    slug: v.string(),
    name: v.string(),
    ticker: v.string(),
    value: v.string(),
    change: v.string(),
    // up/points optional so a Studio Data create (flat registry: no bool/array
    // columns) is valid; feature guards `up ? … : …` (falsy→down) + `points ?? []`.
    up: v.optional(v.boolean()),
    weight: v.string(),
    avg: v.string(),
    lot: v.string(),
    sector: v.string(),
    points: v.optional(v.array(v.number())),
    color: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  })
    .index("by_order", ["order"])
    .index("by_slug", ["slug"]),

  // properti-aset: estate/asset registry (mirrors ASSETS rows in
  // frontend/slices/properti-aset/data.ts). Pre-formatted display strings.
  propertyAssets: defineTable({
    slug: v.string(),
    name: v.string(),
    type: v.string(),
    value: v.string(),
    location: v.string(),
    color: v.string(),
    maint: v.string(),
    status: v.string(),
    year: v.string(),
    note: v.string(),
    order: v.number(),
    // Optimistic-concurrency token. Additive + optional: pre-existing/seeded
    // rows have undefined version, which mutations treat as 0. Deploy-safe.
    version: v.optional(v.number()),
  })
    .index("by_order", ["order"])
    .index("by_slug", ["slug"]),
});
