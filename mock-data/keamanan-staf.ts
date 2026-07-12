// Centralized mock/demo constants for the keamanan-staf slice (illustrative — not live Convex data).

export const SHIFTS: { name: string; color: string; on: (i: number) => boolean }[] = [
  { name: "Shift Malam", color: "var(--color-mk-purple)", on: (i) => i < 2 || i >= 7 },
  { name: "Shift Pagi", color: "var(--color-mk-blue)", on: (i) => i >= 2 && i < 5 },
  { name: "Shift Sore", color: "var(--color-mk-orange)", on: (i) => i >= 5 && i < 7 },
];

// Total Staf + Sedang Bertugas are derived live in the screen; estate status +
// incidents have no live source yet ('data contoh'). hint copy stays static.
export const STATS = {
  total: { hint: "roster aktif" },
  onDuty: { hint: "shift aktif" },
  status: { value: "Aman", hint: "data contoh" },
  incidents: { value: "0", hint: "data contoh" },
};
