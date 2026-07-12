import { describe, it, expect } from "vitest";
import { rejectsPublicSignUp } from "../convex/_shared/authGate";

// Guards a severe regression: the public-registration gate must reject ONLY the
// sign-UP flow. @convex-dev/auth runs the `profile` callback inside `authorize`
// for BOTH flows, so rejecting "signIn" (or an absent flow) breaks the entire
// login — which it did, undetected, until a live sign-in check caught it.
describe("rejectsPublicSignUp — public-registration gate", () => {
  it("rejects the public sign-UP flow when public signup is disabled", () => {
    expect(rejectsPublicSignUp("signUp", false)).toBe(true);
  });

  it("ALWAYS allows sign-IN through (the regression that broke login)", () => {
    expect(rejectsPublicSignUp("signIn", false)).toBe(false);
  });

  it("allows an absent/unknown flow through (does not block by default)", () => {
    expect(rejectsPublicSignUp(undefined, false)).toBe(false);
    expect(rejectsPublicSignUp("", false)).toBe(false);
  });

  it("allows sign-UP when ALLOW_PUBLIC_SIGNUP is enabled", () => {
    expect(rejectsPublicSignUp("signUp", true)).toBe(false);
    expect(rejectsPublicSignUp("signIn", true)).toBe(false);
  });
});
