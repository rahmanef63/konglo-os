import { describe, it, expect } from "vitest";
import { canAccess, ROLE_MENU, type Role } from "../lib/roles";

// Slugs that exist across the app's feature surface. The cfo/staf rows in
// ROLE_MENU are the SSOT; these "denied" lists below assert the complement.
const CFO_ALLOWED = [
  "beranda",
  "portofolio-bisnis",
  "kekayaan-kas",
  "investasi-pasar",
  "properti-aset",
  "data-studio",
];
// Slugs a cfo must NOT reach (the confidential / out-of-scope surface).
const CFO_DENIED = [
  "filantropi",
  "kesehatan",
  "lifestyle",
  "security",
  "keluarga-warisan",
  "relasi-jaringan",
  "keamanan-staf",
];
const STAF_ALLOWED = ["beranda", "keamanan-staf"];
const STAF_DENIED = [
  "portofolio-bisnis",
  "kekayaan-kas",
  "investasi-pasar",
  "properti-aset",
  "data-studio",
  "filantropi",
  "kesehatan",
  "lifestyle",
  "security",
  "keluarga-warisan",
  "relasi-jaringan",
];

// Union of every slug referenced anywhere in this suite — used to prove the
// principal "all" wildcard returns true for the entire surface.
const ALL_SLUGS = Array.from(
  new Set([...CFO_ALLOWED, ...CFO_DENIED, ...STAF_ALLOWED, ...STAF_DENIED]),
);

describe("canAccess — principal (owner, wildcard)", () => {
  it("ROLE_MENU.principal is the 'all' wildcard", () => {
    expect(ROLE_MENU.principal).toBe("all");
  });

  it.each(ALL_SLUGS)("returns true for principal on '%s'", (slug) => {
    expect(canAccess("principal", slug)).toBe(true);
  });

  it("returns true for principal even on an unknown slug", () => {
    expect(canAccess("principal", "totally-unknown-slug")).toBe(true);
  });
});

describe("canAccess — cfo (6 ROLE_MENU slugs)", () => {
  it("ROLE_MENU.cfo lists exactly its six allowed slugs", () => {
    expect(ROLE_MENU.cfo).toEqual(CFO_ALLOWED);
  });

  it.each(CFO_ALLOWED)("returns true for cfo on allowed '%s'", (slug) => {
    expect(canAccess("cfo", slug)).toBe(true);
  });

  it.each(CFO_DENIED)("returns false for cfo on denied '%s'", (slug) => {
    expect(canAccess("cfo", slug)).toBe(false);
  });

  it("returns false for cfo on an unknown slug", () => {
    expect(canAccess("cfo", "nope")).toBe(false);
  });
});

describe("canAccess — staf (beranda + keamanan-staf only)", () => {
  it("ROLE_MENU.staf lists exactly beranda + keamanan-staf", () => {
    expect(ROLE_MENU.staf).toEqual(STAF_ALLOWED);
  });

  it.each(STAF_ALLOWED)("returns true for staf on allowed '%s'", (slug) => {
    expect(canAccess("staf", slug)).toBe(true);
  });

  it.each(STAF_DENIED)("returns false for staf on denied '%s'", (slug) => {
    expect(canAccess("staf", slug)).toBe(false);
  });

  it("returns false for staf on an unknown slug", () => {
    expect(canAccess("staf", "nope")).toBe(false);
  });
});

describe("canAccess — invariants across roles", () => {
  const roles: Role[] = ["principal", "cfo", "staf"];

  it.each(roles)("every role can open 'beranda' (shared home)", (role) => {
    expect(canAccess(role, "beranda")).toBe(true);
  });

  it("only staf can open 'keamanan-staf'", () => {
    expect(canAccess("staf", "keamanan-staf")).toBe(true);
    expect(canAccess("cfo", "keamanan-staf")).toBe(false);
    // principal is the wildcard, so it still sees it.
    expect(canAccess("principal", "keamanan-staf")).toBe(true);
  });
});
