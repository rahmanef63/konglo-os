// SSOT for RBAC. Roles + which feature slugs each role may open.
// Mirrors prototype K.ROLES + menuForRole. Server (convex) and client share this.
export type Role = "principal" | "cfo" | "staf";

// Human labels for roles (id-ID). SSOT so admin surfaces don't re-declare it.
export const ROLE_LABEL: Record<Role, string> = { principal: "Principal", cfo: "CFO", staf: "Staf" };

// Feature slugs visible per role. principal = all (empty = no filter).
export const ROLE_MENU: Record<Role, string[] | "all"> = {
  principal: "all",
  cfo: [
    "beranda",
    "portofolio-bisnis",
    "kekayaan-kas",
    "investasi-pasar",
    "properti-aset",
    "data-studio",
  ],
  staf: ["beranda", "keamanan-staf"],
};

// Slugs a demo (anonymous) user may open — the mock-backed domain views only.
// System surfaces (admin, pengaturan, data-studio) and the AI assistant read or
// write real Convex, so they are hidden in demo, guaranteeing a demo session
// never reaches real family-office data. Keep in sync with the branched slices.
export const DEMO_SLUGS: string[] = [
  "beranda",
  "portofolio-bisnis",
  "kekayaan-kas",
  "investasi-pasar",
  "properti-aset",
  "keluarga-warisan",
  "filantropi",
  "kesehatan",
  "hiburan-gaya-hidup",
  "relasi-jaringan",
  "keamanan-staf",
];

export function canAccess(role: Role, slug: string, isDemo = false): boolean {
  if (isDemo) return DEMO_SLUGS.includes(slug);
  const allowed = ROLE_MENU[role];
  return allowed === "all" || allowed.includes(slug);
}
