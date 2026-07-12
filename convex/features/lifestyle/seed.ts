import type { MutationCtx } from "../../_generated/server";

// Mock values copied verbatim from frontend/slices/hiburan-gaya-hidup/data.ts
// for visual continuity. Integer `order` preserves the original array sort.
const LIFESTYLE_EVENTS = [
  { date: "04 Mei", title: "Gala Amal Tahunan", location: "Hotel Mulia · black tie", color: "var(--color-mk-purple)" },
  { date: "09 Mei", title: "Pelelangan Seni Sotheby's", location: "Singapura · privat", color: "var(--color-mk-green)" },
  { date: "12 Mei", title: "F1 Paddock Club", location: "Monaco · weekend", color: "var(--color-mk-red)" },
];

const CONCIERGE_RESERVATIONS = [
  { emoji: "✈️", label: "Jet pribadi" },
  { emoji: "🛥️", label: "Yacht" },
  { emoji: "🍽️", label: "Restoran" },
  { emoji: "🎭", label: "Acara & tiket" },
];

const CONCIERGE_REQUESTS = [
  { label: "Gulfstream → Singapura, Jum 09:00" },
  { label: "Meja 8 org · Locavore, Sab malam" },
];

// Idempotent: each table guarded independently so partial seeds self-heal.
export async function seedLifestyle(ctx: MutationCtx) {
  if (!(await ctx.db.query("lifestyleEvents").first())) {
    for (let i = 0; i < LIFESTYLE_EVENTS.length; i++) {
      await ctx.db.insert("lifestyleEvents", { ...LIFESTYLE_EVENTS[i], order: i });
    }
  }
  if (!(await ctx.db.query("conciergeReservations").first())) {
    for (let i = 0; i < CONCIERGE_RESERVATIONS.length; i++) {
      await ctx.db.insert("conciergeReservations", { ...CONCIERGE_RESERVATIONS[i], order: i });
    }
  }
  if (!(await ctx.db.query("conciergeRequests").first())) {
    for (let i = 0; i < CONCIERGE_REQUESTS.length; i++) {
      await ctx.db.insert("conciergeRequests", { ...CONCIERGE_REQUESTS[i], order: i });
    }
  }
}
