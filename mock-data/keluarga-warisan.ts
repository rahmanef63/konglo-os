// Centralized mock/demo constants for the keluarga-warisan slice (illustrative — not live Convex data).

export const CHILDREN: { name: string; color: string }[] = [
  { name: "Andra", color: "var(--color-mk-blue)" },
  { name: "Bianca", color: "var(--color-mk-green)" },
  { name: "Citra", color: "var(--color-mk-orange)" },
];

// Kesiapan Suksesi is derived live (avg of heirs[].readiness) in the screen;
// these three have no live source yet (no members/trust/docs tables).
export const STATS = {
  members: { value: "11", hint: "data contoh" },
  trust: { value: "Rp 142 T", hint: "data contoh" },
  docs: { value: "Lengkap", hint: "data contoh" },
};
