import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";

export const log = mutation({
  args: { label: v.string(), meta: v.optional(v.string()) },
  handler: async (ctx, { label, meta }) => {
    const userId = await requireUser(ctx);
    try {
      await ctx.db.insert("activity", {
        userId,
        label,
        meta: meta ?? "",
        at: Date.now(),
      });
    } catch (e) {
      // Audit logging must never break the user action it accompanies; the
      // client fires this and swallows rejections, so surface failures here.
      // Convex server can't import the client observability lib — tagged log.
      console.error("[konglo][activity.log] insert failed", label, e);
    }
  },
});
