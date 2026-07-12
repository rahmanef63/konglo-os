import { query } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// The owner's chosen form of address, read by any signed-in user (it drives the
// greeting shown to whoever is logged in). Returns null when unset → the client
// falls back to the neutral "Tuan/Nyonya".
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .first();
    return { honorific: row?.honorific ?? null };
  },
});
