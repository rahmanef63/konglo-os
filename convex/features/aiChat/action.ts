"use node";
/**
 * aiChat backend — real LLM reply via the Vercel `ai` SDK + @ai-sdk/anthropic.
 * Vendored from rr resource-site (frontend uses api.features.aiChat.action.chat).
 * Key-guarded: the owner sets ANTHROPIC_API_KEY on the Convex deployment (Dokploy
 * Convex compose env). Unset -> returns { ok:false, notice } so the chat degrades
 * gracefully and build/prerender never depend on the key. Stateless (no threads) —
 * persistence is a follow-up, matching the rr slice.
 */
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "../../_generated/api";

const MODEL = "claude-haiku-4-5-20251001"; // swap freely; forwarded to the Anthropic API

export const chat = action({
  args: {
    prompt: v.string(),
    history: v.optional(
      v.array(v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })),
    ),
  },
  handler: async (ctx, { prompt, history }): Promise<{ ok: boolean; text?: string; notice?: string }> => {
    // AUTH GATE (SEC): a public Convex action is internet-reachable regardless of
    // the client-side isAuthenticated gate, so a caller could burn the owner's
    // ANTHROPIC_API_KEY. Authentication alone is not enough — a role-less login
    // (allowlisted-out Google account) must be rejected, and every caller is
    // rate-limited. The action ctx has no db/throttle, so delegate to the guard
    // internal mutation (resolves role + consumes a per-user token). Auth context
    // propagates through runMutation, but we pass the resolved userId explicitly.
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { ok: false, notice: "Silakan masuk untuk memakai Asisten." };
    }
    const gate = await ctx.runMutation(internal.features.aiChat.guard.chatGuard, { userId });
    if (!gate.ok) {
      return { ok: false, notice: gate.notice };
    }
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return { ok: false, notice: "Asisten AI belum aktif. Pemilik perlu menyetel ANTHROPIC_API_KEY pada deployment Convex untuk mengaktifkan balasan langsung." };
    }
    const settings = await ctx.runQuery(api.features.appSettings.queries.get, {});
    const honorific = settings?.honorific ?? "Tuan/Nyonya";
    const system =
      `Anda adalah ajudan digital pada Konglo OS, sistem operasi family office privat sebuah grup usaha keluarga. ` +
      `Anda melayani pemilik estat dengan santun, hangat, dan penuh hormat, layaknya ajudan tepercaya di kediaman. ` +
      `Sapa dan hormati beliau sebagai "${honorific}". ` +
      `Anda membantu ${honorific} beserta ajudan (CFO) memahami anak usaha, kas, investasi, properti, filantropi, dan warisan. ` +
      `Jawab ringkas, jelas, dan lugas dalam Bahasa Indonesia yang halus serta formal — deferensial tanpa berlebihan. ` +
      `Jika ${honorific} menyebut entitas dengan @ (mis. @PT Alpha), perlakukan itu sebagai konteks yang beliau rujuk.`;
    try {
      const { generateText } = await import("ai");
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const anthropic = createAnthropic({ apiKey: key });
      const messages = [...(history ?? []), { role: "user" as const, content: prompt }];
      const { text } = await generateText({ model: anthropic(MODEL), system, messages, maxTokens: 1024 });
      return { ok: true, text };
    } catch (e) {
      return { ok: false, notice: `Permintaan AI gagal: ${(e as Error).message}` };
    }
  },
});
