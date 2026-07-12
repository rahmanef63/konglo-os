// Centralized mock/demo constants for the hiburan-gaya-hidup slice (illustrative — not live Convex data).

// day index (0-based) → event accent color.
export const CALENDAR_EVENTS: Record<number, string> = {
  2: "var(--color-mk-blue)",
  4: "var(--color-mk-purple)",
  5: "var(--color-mk-orange)",
  9: "var(--color-mk-green)",
  12: "var(--color-mk-red)",
  17: "var(--color-mk-blue)",
  21: "var(--color-mk-purple)",
  25: "var(--color-mk-orange)",
};

// events/reservations counts are derived live in the screen; memberships +
// concierge have no live source yet ('data contoh'). hint copy stays static.
export const STATS = {
  events: { hint: "terjadwal" },
  reservations: { hint: "jet · yacht · resto" },
  memberships: { value: "9 klub", hint: "data contoh" },
  concierge: { value: "24/7", hint: "data contoh" },
};
