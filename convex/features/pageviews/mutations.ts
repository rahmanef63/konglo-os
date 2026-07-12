import { mutation } from "../../_generated/server";
import { components } from "../../_generated/api";
import { v } from "convex/values";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";

// Cookieless visitor analytics — PUBLIC beacon ingest. `record` is the ONE
// deliberately-unauthenticated feature mutation in this app: it is called only
// by the server-side /api/analytics route (which resolves geo + hashes the IP
// into a bucket key), never directly by a signed-in caller, so there is no user
// to gate on. The rr "requireUser on every mutation" rule is intentionally
// waived here for the same reason the reference pilot waives it — a public
// analytics ingest has no principal — and the abuse surface is bounded instead
// by the per-IP fixed-window limiter below. Never stores a raw IP or a stable
// identifier; geo is pre-resolved in the route and the raw IP is discarded.

const PROP_CAP = 2000;
const VIEWPORTS = new Set(["mobile", "tablet", "desktop"]);
const RL_MAX = 240; // beacons per IP per minute — generous; throttles a runaway tab/bot only

// Per-IP fixed-window limiter, backed by the SAME @convex-dev/rate-limiter
// component already registered in convex.config.ts (a second RateLimiter
// instance over the same component is fine — limits are namespaced by key). The
// route passes an ipHash (sha256 of the caller IP) purely as a bucket key — the
// raw IP never reaches Convex. Mirrors the writeLimit.ts pattern.
const pvLimiter = new RateLimiter(components.rateLimiter, {
  perIp: { kind: "fixed window", rate: RL_MAX, period: MINUTE },
});

const trimUtm = (s?: string) => {
  if (!s) return undefined;
  const t = s.trim().toLowerCase().slice(0, 120);
  return t || undefined;
};

export const record = mutation({
  args: {
    path: v.string(),
    referrerHost: v.optional(v.string()),
    viewport: v.optional(v.string()),
    eventType: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    properties: v.optional(v.string()),
    ipHash: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const path = a.path.slice(0, 256);
    // Never track the signed-in workspace (/os) or API routes.
    if (!path || path.startsWith("/os") || path.startsWith("/api")) return null;

    // Bound the public write. A genuine over-limit drops silently; a fault
    // inside the limiter component itself must never block a legitimate beacon
    // (telemetry is best-effort), so it is logged and allowed through.
    if (a.ipHash) {
      try {
        const status = await pvLimiter.limit(ctx, "perIp", { key: a.ipHash });
        if (!status.ok) return null;
      } catch (err) {
        console.error("[pageviews] limiter fault (allowing):", err);
      }
    }

    const country = a.country && /^[A-Z]{2}$/.test(a.country) ? a.country : undefined;
    const sessionId =
      a.sessionId && /^[a-f0-9]{8,64}$/.test(a.sessionId) ? a.sessionId : undefined;
    const properties =
      a.properties && a.properties.length <= PROP_CAP ? a.properties : undefined;

    await ctx.db.insert("pageviews", {
      path,
      referrerHost: a.referrerHost?.slice(0, 80),
      viewport: a.viewport && VIEWPORTS.has(a.viewport) ? a.viewport : undefined,
      eventType: a.eventType?.slice(0, 40) || "page_view",
      sessionId,
      utmSource: trimUtm(a.utmSource),
      utmMedium: trimUtm(a.utmMedium),
      utmCampaign: trimUtm(a.utmCampaign),
      utmTerm: trimUtm(a.utmTerm),
      utmContent: trimUtm(a.utmContent),
      country,
      region: a.region?.slice(0, 8),
      city: a.city?.slice(0, 80),
      lat: a.lat,
      lon: a.lon,
      properties,
      at: Date.now(),
    });
    return null;
  },
});
