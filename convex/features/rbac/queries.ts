import { query } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePrincipal } from "../../_shared/auth";

// Current user's role. Returns null if signed out (client redirects to /login).
export const myRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return row?.role ?? null;
  },
});

// Current user identity + demo status. `isDemo` = anonymous session (the
// @convex-dev/auth Anonymous provider sets users.isAnonymous, and demo logins
// carry no email) — the SAME marker CareerPack uses. The client treats a demo
// user as an effective principal (sees every menu) but sources ALL data from the
// in-code mock (@/mock-data) via useDemoValue, never Convex — konglo's tables are
// global, so a demo read/write would touch the real family-office data. Returns
// null when signed out (client redirects to /login).
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const row = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const email = user?.email ?? null;
    return {
      email,
      name: user?.name ?? null,
      isDemo: Boolean(user?.isAnonymous) || !email,
      role: row?.role ?? null,
    };
  },
});

// Admin surface: every real user + their role, registration, last login/activity,
// and coarse location. principal-ONLY (the admin page manages access, incl. the
// estate-sensitive roles). Bounded reads — no bare .collect().
// A user with no role row (e.g. a Google login not yet granted access) shows
// role: null so the principal can grant or ignore them. Anonymous demo guests are
// excluded (they carry no email/role and would flood the roster); the filter+take
// is bounded (stops at 200 real accounts).
export const listUsersWithRoles = query({
  args: {},
  handler: async (ctx) => {
    const me = await requirePrincipal(ctx);
    const now = Date.now();
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isAnonymous"), true))
      .take(200);
    return Promise.all(
      users.map(async (u) => {
        const row = await ctx.db
          .query("roles")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .first();
        // Live-session visibility + last login: this user's auth sessions
        // (bounded take — a user never holds many). Newest session start ≈ last
        // login; non-expired count = currently signed in. From @convex-dev/auth.
        const sessions = await ctx.db
          .query("authSessions")
          .withIndex("userId", (q) => q.eq("userId", u._id))
          .take(20);
        // Coarse "where" (browser time zone captured at sign-in) + newest logged
        // action ("their activity"). Both single bounded reads per user.
        const meta = await ctx.db
          .query("userMeta")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .first();
        const lastAct = await ctx.db
          .query("activity")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .order("desc")
          .first();
        const lastLoginAt =
          sessions.reduce((m, s) => Math.max(m, s._creationTime), 0) || null;
        return {
          userId: u._id,
          email: u.email ?? null,
          name: u.name ?? null,
          image: u.image ?? null,
          role: row?.role ?? null,
          isSelf: u._id === me,
          activeSessions: sessions.filter((s) => s.expirationTime > now).length,
          registeredAt: u._creationTime, // when they registered (+ time)
          lastLoginAt, // ms epoch of newest session start, or null
          lastActivityAt: lastAct?.at ?? null, // newest logged action, or null
          timeZone: meta?.timeZone ?? null, // coarse location proxy, or null
        };
      }),
    );
  },
});
