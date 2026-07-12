// Centralized mock/demo constants for the kesehatan slice (illustrative — not live Convex data).

export const VITALS_TREND = [60, 58, 62, 57, 59, 56, 58];
export const VITAL_STATS: [string, string][] = [
  ["Tekanan", "118/76"],
  ["SpO₂", "98%"],
  ["Langkah", "8.420"],
];

export const READINESS = 88;

// Vitals + readiness + these KPIs have no wearable/lab source yet — all
// illustrative ('data contoh'). Team/schedule/programs lists are live Convex.
export const STATS = {
  score: { value: "92/100", hint: "data contoh" },
  rhr: { value: "58 bpm", hint: "data contoh" },
  sleep: { value: "7j 12m", hint: "data contoh" },
  lab: { value: "14 Mei", hint: "data contoh" },
};
