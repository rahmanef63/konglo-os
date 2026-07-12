import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { withSignInRateLimit } from "./authRateLimit";
import { rejectsPublicSignUp } from "./_shared/authGate";
import { roleForEmail } from "./_shared/allowlist";

// rr: Auth = @convex-dev/auth (NO Clerk). Password provider, self-contained.
//
// PRIVATE family-office app: public self-registration is DISABLED by default.
// IMPORTANT: @convex-dev/auth's `profile` callback runs inside `authorize` for
// BOTH sign-in AND sign-up (it derives the email/profile from the submitted
// params either way). The gate MUST therefore be scoped to `flow === "signUp"` —
// throwing unconditionally also rejects sign-IN and breaks the login entirely.
// Seeded principal/cfo accounts are created via authSeed.ts -> SDK createAccount,
// which bypasses this callback regardless.
//
// Re-enable controlled public registration by setting ALLOW_PUBLIC_SIGNUP=true
// in the Convex deployment env (one env var; no code change needed).
const ALLOW_PUBLIC_SIGNUP = process.env.ALLOW_PUBLIC_SIGNUP === "true";

// Per-account sign-in rate limit (brute-force / password-spray guard) is layered
// on top of the stock Password provider by wrapping ONLY its `authorize` — no
// auth logic is reimplemented. See `authRateLimit.ts`. A correct password for a
// seeded account is never throttled (success resets the bucket; only failed
// attempts consume tokens), so the live demo login keeps working.
const passwordProvider = withSignInRateLimit(
  Password({
    profile(params) {
      // Only reject the public sign-UP flow; sign-IN runs this same callback and
      // must pass through (the account already exists; the password is verified
      // downstream). Gating on flow keeps the demo + real logins working.
      if (rejectsPublicSignUp((params as { flow?: string }).flow, ALLOW_PUBLIC_SIGNUP)) {
        throw new Error("Public registration is disabled");
      }
      return { email: params.email as string };
    },
  }),
);

// Google OAuth is ENV-GATED: only wired when both creds are set on the Convex
// deployment (npx convex env set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET). A missing
// cred → Google silently dropped, build stays green, NO secret is hardcoded.
// Redirect URI to register in Google Console = <convex site- subdomain>/api/auth/callback/google.
const providers = [
  passwordProvider,
  // Guest/demo sessions: signIn("anonymous") from the landing "Lihat demo langsung"
  // button. The anonymous user carries no email → rbac.me.isDemo is true → the UI
  // reads in-code mock only (never Convex). roleForEmail(undefined) = null below,
  // so a demo user is granted NO role and cannot pass any requireAdmin/Principal.
  Anonymous(),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
];

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers,
  callbacks: {
    // Role-on-sign-in from the email allowlist. OAuth carries no "signUp" flow, so
    // the Password signup gate can't stop strangers — THIS is the private-app gate:
    // an allowlisted email gets its role (principal for the owner); everyone else
    // gets NO role, so the shell + every requireFeature/requirePrincipal deny.
    // Writes ctx.db directly (not rbac.setRole, which forbids granting principal).
    async afterUserCreatedOrUpdated(ctx, { userId, profile }) {
      const role = roleForEmail(profile.email as string | undefined);
      if (!role) return;
      // The callback ctx is typed against AnyDataModel; cast to the app's
      // MutationCtx so the `roles` table + by_user index resolve (safe — it IS
      // the app's mutation ctx at runtime, only the static type is widened).
      const { db } = ctx as unknown as MutationCtx;
      const uid = userId as unknown as Id<"users">;
      const existing = await db
        .query("roles")
        .withIndex("by_user", (q) => q.eq("userId", uid))
        .first();
      if (existing) {
        if (existing.role !== role) await db.patch(existing._id, { role });
      } else {
        await db.insert("roles", { userId: uid, role });
      }
    },
  },
});
