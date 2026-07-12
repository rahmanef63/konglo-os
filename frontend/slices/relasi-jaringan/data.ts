// Slice-local presentation data for Relasi & Jaringan. Contacts come from Convex
// SSOT; warmth→color, filters, and side panels are screen-local.
import type { Doc } from "@/convex/_generated/dataModel";
import type { FormField } from "@/frontend/shared";

type Contact = Doc<"contacts">;

// Fields for the "Tambah Kontak" form. Selects keep warmth/tier valid (match
// WARM_COLOR keys + FILTERS), so a new contact renders with the right color.
export const ADD_FIELDS: FormField[] = [
  { name: "name", label: "Nama kontak", placeholder: "Nama lengkap", required: true },
  { name: "role", label: "Peran / jabatan", placeholder: "CEO Bank Sentra, …", required: true },
  { name: "tier", label: "Kategori", type: "select", required: true, options: ["Pemerintah", "Perbankan", "Investor Global", "Founder Tech", "Bisnis"] },
  { name: "warmth", label: "Kehangatan", type: "select", required: true, options: ["Hangat", "Netral", "Perlu disapa"] },
];

// Edit form mirrors ADD_FIELDS plus the editable "last contact" copy. The same
// validators back the contacts.update mutation (all fields optional server-side).
export const EDIT_FIELDS: FormField[] = [
  { name: "name", label: "Nama kontak", placeholder: "Nama lengkap", required: true },
  { name: "role", label: "Peran / jabatan", placeholder: "CEO Bank Sentra, …", required: true },
  { name: "tier", label: "Kategori", type: "select", required: true, options: ["Pemerintah", "Perbankan", "Investor Global", "Founder Tech", "Bisnis"] },
  { name: "warmth", label: "Kehangatan", type: "select", required: true, options: ["Hangat", "Netral", "Perlu disapa"] },
  { name: "last", label: "Kontak terakhir", placeholder: "mis. 3 hari lalu", required: true },
];

// Seed a contact doc into the FormModal `initial` record for the edit flow.
export function contactInitial(c: Contact): Record<string, string> {
  return { name: c.name, role: c.role, tier: c.tier, warmth: c.warmth, last: c.last };
}

export const WARM_COLOR: Record<string, string> = {
  Hangat: "var(--color-mk-green)",
  Netral: "var(--color-mk-orange)",
  "Perlu disapa": "var(--color-mk-red)",
};

// Filter predicates as a lookup map (rr: no switch-chains).
export const FILTERS: Record<string, (c: Contact) => boolean> = {
  all: () => true,
  hangat: (c) => c.warmth === "Hangat",
  netral: (c) => c.warmth === "Netral",
  dingin: (c) => c.warmth === "Perlu disapa",
  gov: (c) => c.tier === "Pemerintah",
};
export const FILTER_LABELS: [string, string][] = [
  ["all", "Semua"],
  ["hangat", "Hangat"],
  ["netral", "Netral"],
  ["dingin", "Perlu disapa"],
  ["gov", "Pemerintah"],
];

// Illustrative/demo constants live centrally in mock-data; re-exported so
// existing importers (screen.tsx, panels.tsx import from "./data") keep working.
export { FOLLOWUPS, MEETING_LOG, INFLUENCE, STATS } from "@/mock-data/relasi-jaringan";
