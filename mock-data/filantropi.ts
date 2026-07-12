// Centralized mock/demo constants for the filantropi slice (illustrative — not live Convex data).
import type { DonutSeg } from "@/frontend/shared";

export const FOCUS: DonutSeg[] = [
  { label: "Pendidikan", value: 34, color: "var(--color-mk-blue)" },
  { label: "Kesehatan", value: 30, color: "var(--color-mk-red)" },
  { label: "Lingkungan", value: 20, color: "var(--color-mk-green)" },
  { label: "Ekonomi", value: 16, color: "var(--color-mk-orange)" },
];

// Komitmen / Tersalurkan / Penerima have no summable live source — grant `amount`
// is free-text and `beneficiaries` is a label, so these stay illustrative and are
// tagged 'data contoh'. Program Aktif is derived live in the screen (grants.length;
// the literal here is the unused fallback), so its hint stays a real descriptor.
export const STATS = {
  commitment: { value: "Rp 4,8 T", hint: "data contoh" },
  disbursed: { value: "Rp 1,1 T", hint: "data contoh" },
  beneficiaries: { value: "2,4 Juta", hint: "data contoh" },
  programs: { value: "18", hint: "4 fokus" },
};
