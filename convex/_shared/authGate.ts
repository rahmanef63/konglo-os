// Pure predicate for the public-registration gate, extracted so it is unit-testable
// WITHOUT importing convex/auth.ts (which runs convexAuth() at module load).
//
// CRITICAL invariant (regressed once, undetected by the authz suite which uses
// withIdentity and never exercises the real Password flow): @convex-dev/auth's
// `profile` callback runs inside `authorize` for BOTH sign-in and sign-up, so the
// gate MUST reject ONLY flow === "signUp". Returning true for "signIn" breaks the
// entire login. See tests/auth-gate.test.ts.
export function rejectsPublicSignUp(
  flow: string | undefined,
  allowPublicSignUp: boolean,
): boolean {
  return !allowPublicSignUp && flow === "signUp";
}
