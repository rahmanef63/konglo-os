import { v } from "convex/values";
import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { roleValidator } from "./features/rbac/schema";

// SSOT for bootstrap accounts. Emails are env-configurable (no hardcoded identity);
// password is always supplied at call time (never committed). Principal defaults to
// the owner's account per owner intent; overridable via SEED_PRINCIPAL_EMAIL /
// SEED_CFO_EMAIL on the Convex deployment. Keep in lockstep with the OAuth allowlist
// (_shared/allowlist.ts PRINCIPAL_EMAIL) so Password + Google resolve the same owner.
const SEED_USERS = [
  { email: process.env.SEED_PRINCIPAL_EMAIL ?? "konglo@mail.com", role: "principal" as const },
  { email: process.env.SEED_CFO_EMAIL ?? "ajudan@mail.com", role: "cfo" as const },
];

// Internal: upsert role by email (no admin gate — only callable server-side).
export const setRoleByEmail = internalMutation({
  args: { email: v.string(), role: roleValidator },
  handler: async (ctx, { email, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (!user) throw new Error(`no user ${email}`);
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existing) await ctx.db.patch(existing._id, { role });
    else await ctx.db.insert("roles", { userId: user._id, role });
    return user._id;
  },
});

// Idempotent: create password accounts + assign roles. Run via `convex run`.
export const seedAuthUsers = internalAction({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const out: string[] = [];
    for (const u of SEED_USERS) {
      try {
        await createAccount(ctx, {
          provider: "password",
          account: { id: u.email, secret: password },
          profile: { email: u.email },
        });
        out.push(`created ${u.email}`);
      } catch (e) {
        out.push(`exists ${u.email} (${String(e).slice(0, 40)})`);
      }
      await ctx.runMutation(internal.authSeed.setRoleByEmail, {
        email: u.email,
        role: u.role,
      });
    }
    return out;
  },
});

// Reset password for existing seed accounts. createAccount is idempotent and
// won't overwrite a password — use this to rotate. Run via
// `convex run authSeed:resetAuthPassword '{"password":"…"}'`.
export const resetAuthPassword = internalAction({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const out: string[] = [];
    for (const u of SEED_USERS) {
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: { id: u.email, secret: password },
      });
      out.push(`reset ${u.email}`);
    }
    return out;
  },
});
