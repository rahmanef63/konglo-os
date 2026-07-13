import type { Role } from "../../lib/roles";

// Email → role allowlist SSOT for sign-in (used by the OAuth callback in auth.ts
// and by claimRole). PRIVATE family office: adding Google OAuth means any Google
// account can AUTHENTICATE, so access is gated HERE, not by the account existing.
// An allowlisted email gets its role; everyone else gets NO role → the shell shows
// a "no access" state and every requireFeature/requirePrincipal denies. The
// principal can then grant cfo/staf via the admin surface (rbac.setRole).
//
// NO hardcoded secret: this reads env only. Set your owner (principal) account via
// PRINCIPAL_EMAIL. The default below is a placeholder — override it.
// Add more accounts (e.g. the cfo's real Google email) via KONGLO_ALLOWLIST,
// format: "email:role,email:role" (role ∈ principal|cfo|staf).
const VALID: Role[] = ["principal", "cfo", "staf"];

export function roleForEmail(email: string | undefined | null): Role | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  // Owner → principal via PRINCIPAL_EMAIL; default is a placeholder — override it.
  const owner = (process.env.PRINCIPAL_EMAIL ?? "owner@example.com")
    .trim()
    .toLowerCase();
  if (e === owner) return "principal";
  // Others: explicit email:role entries (role ∈ principal|cfo|staf).
  for (const entry of (process.env.KONGLO_ALLOWLIST ?? "").split(",")) {
    const [mail, role] = entry.split(":").map((s) => s?.trim().toLowerCase());
    if (mail && mail === e && VALID.includes(role as Role)) return role as Role;
  }
  return null;
}
