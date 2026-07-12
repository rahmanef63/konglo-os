import { defineTable } from "convex/server";
import { v } from "convex/values";

// Version history for the family-office dataset. Each row = one full-dataset
// snapshot: `data` is a JSON blob { [table]: rows[] } with system fields stripped,
// captured across BUSINESS_TABLES. `kind` distinguishes a manual "Save snapshot"
// from an auto snapshot taken right before a destructive op (clear/replace/load/
// restore) so those are always undoable. Capped to SNAPSHOT_CAP newest rows.
// ponytail: one doc per snapshot; the mock dataset is tiny, real family-office
// data is small — chunk the blob across docs only if one ever nears Convex's 1MB.
export const dataManagementTables = {
  dataSnapshots: defineTable({
    label: v.string(),
    kind: v.union(v.literal("manual"), v.literal("auto")),
    createdAt: v.number(),
    rowCount: v.number(),
    data: v.string(),
    createdByEmail: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),
};
