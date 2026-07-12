// Centralized mock/demo constants for the relasi-jaringan slice (illustrative — not live Convex data).

export const FOLLOWUPS: { name: string; task: string; color: string }[] = [
  { name: "Chairman SWF Timteng", task: "kirim proposal JV", color: "var(--color-mk-orange)" },
  { name: "Gubernur Provinsi", task: "undang ke gala", color: "var(--color-mk-red)" },
];

export const MEETING_LOG: { date: string; text: string }[] = [
  { date: "02 Mei", text: "Makan malam · Menteri Investasi" },
  { date: "28 Apr", text: "Golf · CEO Bank Sentra" },
  { date: "21 Apr", text: "Video · Founder Unicorn" },
];

export const INFLUENCE: [string, number][] = [
  ["Pemerintah", 64],
  ["Perbankan", 48],
  ["Investor Global", 52],
  ["Founder Tech", 38],
];

// Genuine placeholders — no live source yet (no meetings/followup table).
// Kontak VIP count is derived live in the screen; these stay 'data contoh'.
export const STATS = {
  meetings: { value: "28", hint: "data contoh" },
  followups: { value: "7", hint: "data contoh" },
  score: { value: "A+", hint: "data contoh" },
};
