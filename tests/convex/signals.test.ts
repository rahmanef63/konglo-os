import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Same harness as office.test.ts: glob the whole convex tree and impersonate via
// a `<userId>|<session>` identity subject. getSignals is a pure rule engine over
// subsidiaries + officeFigures + allocations — these tests pin the rule outcomes
// (honest on the healthy seed, escalating to warn on a planted problem) and RBAC.
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);
const makeT = () => convexTest(schema, modules);

async function seedUser(
  t: ReturnType<typeof convexTest>,
  role: Role | null,
  email: string,
) {
  const userId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("users", { email });
    if (role) await ctx.db.insert("roles", { userId: id, role });
    return id;
  });
  return t.withIdentity({ subject: `${userId}|testsession` });
}

const T = 1_000_000_000_000; // 1 triliun helper
// The real all-healthy seed (matches convex/seed.ts).
const HEALTHY_SUBS = [
  { slug: "agro", name: "Konglo Agro Nusantara", sector: "Agribisnis", revenue: 18.4 * T, margin: 22.4, ownership: 92, trend: 6.1, color: "var(--color-mk-green)", order: 0 },
  { slug: "prop", name: "Konglo Land & Property", sector: "Properti", revenue: 14.9 * T, margin: 31.2, ownership: 100, trend: 4.3, color: "var(--color-mk-blue)", order: 1 },
  { slug: "fin", name: "Konglo Finansial Group", sector: "Keuangan", revenue: 21.7 * T, margin: 28.8, ownership: 76, trend: 7.5, color: "var(--color-gold)", order: 2 },
  { slug: "tek", name: "Konglo Digital Ventures", sector: "Teknologi", revenue: 9.2 * T, margin: 18.5, ownership: 64, trend: 12.7, color: "var(--color-mk-purple)", order: 3 },
  { slug: "enr", name: "Konglo Energi Terbarukan", sector: "Energi", revenue: 16.8 * T, margin: 25.1, ownership: 88, trend: 5.4, color: "var(--color-mk-cyan)", order: 4 },
  { slug: "log", name: "Konglo Logistik Maritim", sector: "Logistik", revenue: 11.3 * T, margin: 19.7, ownership: 81, trend: 3.2, color: "var(--color-mk-orange)", order: 5 },
];
const HEALTHY_FIGURES = { key: "current", netWorth: 312.6 * T, netWorthChange: 4.8, liabilitas: 96.3 * T, debtRatio: 23.5 };
const HEALTHY_ALLOCS = [
  { slug: "pasar", label: "Pasar Modal", value: 56.3 * T, accent: "var(--color-mk-blue)", order: 0 },
  { slug: "properti", label: "Properti", value: 81.3 * T, accent: "var(--color-mk-green)", order: 1 },
  { slug: "bisnis", label: "Bisnis Operasional", value: 121.4 * T, accent: "var(--color-gold)", order: 2 },
  { slug: "privat", label: "Ekuitas Privat", value: 38.7 * T, accent: "var(--color-mk-purple)", order: 3 },
  { slug: "kas", label: "Kas & Setara", value: 14.9 * T, accent: "var(--color-muted-foreground)", order: 4 },
];

type Seed = {
  subs?: Array<Record<string, unknown>>;
  figures?: Record<string, unknown> | null;
  allocs?: Array<Record<string, unknown>>;
};
async function seedData(t: ReturnType<typeof convexTest>, s: Seed) {
  await t.run(async (ctx) => {
    for (const x of s.subs ?? []) await ctx.db.insert("subsidiaries", x as never);
    if (s.figures) await ctx.db.insert("officeFigures", s.figures as never);
    for (const a of s.allocs ?? []) await ctx.db.insert("allocations", a as never);
  });
}

const SEV_RANK = { warn: 0, watch: 1, good: 2 } as const;

describe("getSignals — healthy seed", () => {
  it("fires honestly: 4 signals, no warn, correct entities, good last", async () => {
    const t = makeT();
    const asP = await seedUser(t, "principal", "sig-p@mail.com");
    await seedData(t, { subs: HEALTHY_SUBS, figures: HEALTHY_FIGURES, allocs: HEALTHY_ALLOCS });

    const out = await asP.query(api.features.office.signals.getSignals, {});
    expect(out).toHaveLength(4); // capped
    expect(out.every((s) => s.severity !== "warn")).toBe(true); // no false red

    const alloc = out.find((s) => s.id === "allocation-concentration");
    expect(alloc?.severity).toBe("watch");
    expect(alloc?.title).toContain("Bisnis Operasional");
    expect(alloc?.detail).toContain("38,8%");

    const own = out.find((s) => s.id === "ownership-control");
    expect(own?.severity).toBe("watch");
    expect(own?.title).toContain("Konglo Digital Ventures");
    expect(own?.detail).toContain("64%");

    const health = out.find((s) => s.id === "subsidiary-health");
    expect(health?.severity).toBe("watch");
    expect(health?.title).toContain("Konglo Logistik Maritim"); // min trend
    expect(health?.detail).toContain("+3,2%");

    // Exactly one "good" survives the cap and it is leverage (23,5%).
    const goods = out.filter((s) => s.severity === "good");
    expect(goods).toHaveLength(1);
    expect(goods[0].id).toBe("leverage");
    expect(goods[0].detail).toContain("23,5%");

    // Ordering warn→watch→good is non-decreasing.
    const ranks = out.map((s) => SEV_RANK[s.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));

    // No subsidiary flagged twice.
    const names = HEALTHY_SUBS.map((s) => s.name);
    for (const n of names) {
      expect(out.filter((s) => s.title.includes(n)).length).toBeLessThanOrEqual(1);
    }
  });
});

describe("getSignals — planted problem escalates to warn", () => {
  it("a distressed unit sorts to the top and dedupes its own watch away", async () => {
    const t = makeT();
    const asP = await seedUser(t, "principal", "sig-bad@mail.com");
    const subs = HEALTHY_SUBS.map((s) =>
      s.slug === "tek" ? { ...s, margin: -4, trend: -2.1 } : s,
    );
    await seedData(t, { subs, figures: HEALTHY_FIGURES, allocs: HEALTHY_ALLOCS });

    const out = await asP.query(api.features.office.signals.getSignals, {});
    expect(out[0].id).toBe("subsidiary-health");
    expect(out[0].severity).toBe("warn");
    expect(out[0].title).toContain("Konglo Digital Ventures");
    expect(out[0].detail).toContain("-2,1%");
    // tek is the min-ownership unit too, but its ownership watch is suppressed
    // under its health warn — the entity appears exactly once.
    expect(out.filter((s) => s.title.includes("Konglo Digital Ventures"))).toHaveLength(1);
    // Independent lens unaffected.
    expect(out.some((s) => s.id === "allocation-concentration")).toBe(true);
  });
});

describe("getSignals — independent absolute escalations", () => {
  it("high debt ratio → leverage warn", async () => {
    const t = makeT();
    const asP = await seedUser(t, "principal", "sig-lev@mail.com");
    await seedData(t, { figures: { ...HEALTHY_FIGURES, debtRatio: 55 } });
    const out = await asP.query(api.features.office.signals.getSignals, {});
    const lev = out.find((s) => s.id === "leverage");
    expect(lev?.severity).toBe("warn");
    expect(lev?.title).toBe("Leverage tinggi");
    expect(lev?.detail).toContain("55%");
  });

  it("one entity dominating revenue → revenue-concentration warn", async () => {
    const t = makeT();
    const asP = await seedUser(t, "principal", "sig-rev@mail.com");
    await seedData(t, {
      subs: [
        { slug: "big", name: "Entitas Dominan", sector: "X", revenue: 60 * T, margin: 20, ownership: 100, trend: 5, color: "var(--color-gold)", order: 0 },
        { slug: "small", name: "Entitas Kecil", sector: "Y", revenue: 40 * T, margin: 25, ownership: 100, trend: 8, color: "var(--color-mk-blue)", order: 1 },
      ],
    });
    const out = await asP.query(api.features.office.signals.getSignals, {});
    const rev = out.find((s) => s.id === "revenue-concentration");
    expect(rev?.severity).toBe("warn");
    expect(rev?.title).toContain("60%");
  });

  it("empty database → no signals", async () => {
    const t = makeT();
    const asP = await seedUser(t, "principal", "sig-empty@mail.com");
    const out = await asP.query(api.features.office.signals.getSignals, {});
    expect(out).toEqual([]);
  });
});

describe("getSignals — RBAC", () => {
  it("staf (no features) is forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "sig-staf@mail.com");
    await seedData(t, { subs: HEALTHY_SUBS, figures: HEALTHY_FIGURES });
    await expect(
      asStaf.query(api.features.office.signals.getSignals, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo (holds both features) resolves", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sig-cfo@mail.com");
    await seedData(t, { subs: HEALTHY_SUBS, figures: HEALTHY_FIGURES, allocs: HEALTHY_ALLOCS });
    await expect(
      asCfo.query(api.features.office.signals.getSignals, {}),
    ).resolves.toBeDefined();
  });
});
