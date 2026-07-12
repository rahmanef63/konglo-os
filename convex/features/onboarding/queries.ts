import { query } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { TableNames } from "../../_generated/dataModel";
import { canAccess, type Role } from "../../../lib/roles";

// Data-completeness for the beranda "Lengkapi data Anda" onboarding widget.
// Each domain → a representative table + the menu slug to navigate to for adding
// its first row + a "start here" priority. "filled" is a single .first() read
// (never .collect()) — one bounded read per accessible table, live-reactive.
// RBAC: only domains the caller canAccess are probed (same SSOT as requireFeature),
// so heirs/keluarga-warisan is never read for cfo/staf → SEC-001 preserved.
const DOMAINS: { table: TableNames; slug: string; priority: number }[] = [
  { table: "subsidiaries", slug: "portofolio-bisnis", priority: 1 },
  { table: "officeFigures", slug: "kekayaan-kas", priority: 2 },
  { table: "propertyAssets", slug: "properti-aset", priority: 3 },
  { table: "holdings", slug: "investasi-pasar", priority: 4 },
  { table: "contacts", slug: "relasi-jaringan", priority: 5 },
  { table: "heirs", slug: "keluarga-warisan", priority: 6 },
  { table: "philanthropyGrants", slug: "filantropi", priority: 7 },
  { table: "healthMedicalTeam", slug: "kesehatan", priority: 8 },
  { table: "lifestyleEvents", slug: "hiburan-gaya-hidup", priority: 9 },
  { table: "staffRoster", slug: "keamanan-staf", priority: 10 },
];

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const roleRow = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const role: Role | undefined = roleRow?.role;
    if (!role) return null;

    const domains: { slug: string; filled: boolean; priority: number }[] = [];
    for (const d of DOMAINS) {
      if (!canAccess(role, d.slug)) continue;
      const first = await ctx.db.query(d.table).first();
      domains.push({ slug: d.slug, filled: first !== null, priority: d.priority });
    }
    domains.sort((a, b) => a.priority - b.priority);
    return {
      domains,
      total: domains.length,
      filled: domains.filter((d) => d.filled).length,
    };
  },
});
