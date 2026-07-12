import type { TableNames } from "../../_generated/dataModel";

// SSOT list of family-office BUSINESS tables — the scope of clear / snapshot /
// replace / restore, and the "has data" check for onboarding + settings.
// Excludes system tables (users, roles, authSessions, activity, pageviews,
// aiChat) which are never part of a data snapshot. `heirs` is in this list, so
// EVERY op over it is requirePrincipal (SEC-001: estate data is owner-only).
export const BUSINESS_TABLES = [
  "subsidiaries",
  "officeFigures",
  "allocations",
  "propertyAssets",
  "holdings",
  "contacts",
  "heirs",
  "governanceBuckets",
  "philanthropyGrants",
  "philanthropyImpact",
  "healthMedicalTeam",
  "healthSchedule",
  "healthPrograms",
  "lifestyleEvents",
  "conciergeReservations",
  "conciergeRequests",
  "staffRoster",
  "securityZones",
  "securityMetrics",
] as const satisfies readonly TableNames[];

// Keep only the last N snapshots (auto + manual combined).
export const SNAPSHOT_CAP = 20;
// Bound per-table reads in clear/snapshot so a runaway table can't blow the
// mutation. A family office is small; 5k rows/table is far above any real count.
// ponytail: single-doc JSON snapshot — chunk across docs if a table ever exceeds this.
export const TABLE_READ_CAP = 5000;
