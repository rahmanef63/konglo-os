import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../../_shared/auth";

// SUPER-ADMIN visitor dashboard read. One query powers the admin Traffic card:
// totals + unique sessions + top paths/referrers/countries/cities + per-day
// volume. Gated by requireAdmin (principal|cfo) per the rr "server-side authz on
// every read that exposes elevated data" rule — the menu already hides the card
// from non-principals, but a direct-API caller must still be blocked.

const DAY = 86_400_000;
const HARD_CAP = 10_000; // bounded read, most-recent-first (rr: no bare .collect())

const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const topN = (m: Map<string, number>, n: number) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));

export const summary = query({
  args: { sinceMs: v.optional(v.number()) },
  handler: async (ctx, { sinceMs }) => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - (sinceMs ?? 30 * DAY);
    const rows = await ctx.db
      .query("pageviews")
      .withIndex("by_at", (q) => q.gt("at", cutoff))
      .order("desc")
      .take(HARD_CAP);

    const byPath = new Map<string, number>();
    const byReferrer = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byCity = new Map<string, number>();
    const byDay = new Map<string, number>();
    const sessions = new Set<string>();
    for (const r of rows) {
      byPath.set(r.path, (byPath.get(r.path) ?? 0) + 1);
      if (r.referrerHost)
        byReferrer.set(r.referrerHost, (byReferrer.get(r.referrerHost) ?? 0) + 1);
      if (r.country) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
      if (r.city) {
        const k = r.country ? `${r.city}, ${r.country}` : r.city;
        byCity.set(k, (byCity.get(k) ?? 0) + 1);
      }
      byDay.set(dayKey(r.at), (byDay.get(dayKey(r.at)) ?? 0) + 1);
      if (r.sessionId) sessions.add(r.sessionId);
    }

    return {
      total: rows.length,
      capped: rows.length === HARD_CAP,
      uniqueSessions: sessions.size,
      topPaths: topN(byPath, 20),
      topReferrers: topN(byReferrer, 10),
      topCountries: topN(byCountry, 10),
      topCities: topN(byCity, 10),
      perDay: [...byDay.entries()].sort().map(([day, count]) => ({ day, count })),
    };
  },
});
