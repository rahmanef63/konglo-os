import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Same harness as authz.test.ts: glob the whole convex tree (must reach
// _generated for convex-test's module-root resolution) and impersonate via a
// `<userId>|<session>` identity subject that getAuthUserId splits back to userId.
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);

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

const makeT = () => convexTest(schema, modules);

const figures = {
  netWorth: 1_000_000,
  netWorthChange: -2.5, // signed delta — negative is legal
  liabilitas: 250_000,
  debtRatio: 25,
};

// --- setFigures WRITE gate (kekayaan-kas) -------------------------------------
describe("office.setFigures — kekayaan-kas write gate", () => {
  it("principal passes and upserts the singleton", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "off-p@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.setFigures, figures),
    ).resolves.toBeDefined();
    // Upsert: a second call patches the SAME row, never a duplicate singleton.
    await asPrincipal.mutation(api.features.office.mutations.setFigures, {
      ...figures,
      netWorth: 2_000_000,
    });
    const count = await t.run(async (ctx) =>
      (await ctx.db.query("officeFigures").collect()).length,
    );
    expect(count).toBe(1);
    const row = await asPrincipal.query(
      api.features.office.queries.getFigures,
      {},
    );
    expect(row?.netWorth).toBe(2_000_000);
  });

  it("cfo passes (kekayaan-kas is in the cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "off-c@mail.com");
    await expect(
      asCfo.mutation(api.features.office.mutations.setFigures, figures),
    ).resolves.toBeDefined();
  });

  it("staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "off-s@mail.com");
    await expect(
      asStaf.mutation(api.features.office.mutations.setFigures, figures),
    ).rejects.toThrow(/Forbidden/);
  });

  it("rejects a negative money field (netWorth)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "off-neg@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.setFigures, {
        ...figures,
        netWorth: -1,
      }),
    ).rejects.toThrow(/>= 0/);
  });

  it("rejects a NaN figure (debtRatio)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "off-nan@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.setFigures, {
        ...figures,
        debtRatio: NaN,
      }),
    ).rejects.toThrow(/Invalid number|\[0,100\]/);
  });

  it("rejects an out-of-range percentage (debtRatio > 100)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "off-pct@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.setFigures, {
        ...figures,
        debtRatio: 150,
      }),
    ).rejects.toThrow(/\[0,100\]/);
  });

  it("accepts a negative netWorthChange (signed delta)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "off-delta@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.setFigures, {
        ...figures,
        netWorthChange: -42,
      }),
    ).resolves.toBeDefined();
  });
});

// --- upsertAllocation WRITE gate (kekayaan-kas) ------------------------------
describe("office.upsertAllocation — kekayaan-kas write gate", () => {
  // value is RUPIAH (e.g. seed inserts 56.3T), not a percentage.
  const alloc = { label: "Saham", value: 56_300_000_000_000, accent: "var(--color-gold)" };

  it("cfo + principal can upsert; staf Forbidden", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "al-c@mail.com");
    const asPrincipal = await seedUser(t, "principal", "al-p@mail.com");
    const asStaf = await seedUser(t, "staf", "al-s@mail.com");
    await expect(
      asCfo.mutation(api.features.office.mutations.upsertAllocation, alloc),
    ).resolves.toBeDefined();
    await expect(
      asPrincipal.mutation(api.features.office.mutations.upsertAllocation, {
        ...alloc,
        label: "Obligasi",
      }),
    ).resolves.toBeDefined();
    await expect(
      asStaf.mutation(api.features.office.mutations.upsertAllocation, alloc),
    ).rejects.toThrow(/Forbidden/);
  });

  it("upsert by slug patches the existing slice (no duplicate)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "al-up@mail.com");
    const id = await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      { slug: "kas", label: "Kas", value: 10, accent: "var(--color-gold)" },
    );
    const id2 = await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      { slug: "kas", label: "Kas & Setara", value: 12, accent: "var(--color-gold)" },
    );
    expect(id2).toEqual(id);
    const rows = await asPrincipal.query(
      api.features.office.queries.listAllocations,
      {},
    );
    const kas = rows.filter((r) => r.slug === "kas");
    expect(kas).toHaveLength(1);
    expect(kas[0].value).toBe(12);
  });

  it("accepts a large rupiah value (no upper cap)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "al-big@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.upsertAllocation, {
        ...alloc,
        value: 56_300_000_000_000,
      }),
    ).resolves.toBeDefined();
  });

  it("rejects a negative value", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "al-neg@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.upsertAllocation, {
        ...alloc,
        value: -1,
      }),
    ).rejects.toThrow(/>= 0/);
  });

  it("rejects a NaN value", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "al-nan@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.upsertAllocation, {
        ...alloc,
        value: NaN,
      }),
    ).rejects.toThrow(/Invalid number/);
  });
});

// --- removeAllocation WRITE gate (kekayaan-kas) ------------------------------
describe("office.removeAllocation — kekayaan-kas write gate", () => {
  it("principal can remove an existing slice", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "rm-p@mail.com");
    const id = await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      { label: "Properti", value: 20, accent: "var(--color-gold)" },
    );
    // void handler → resolves to null over the wire (not undefined).
    await expect(
      asPrincipal.mutation(api.features.office.mutations.removeAllocation, {
        id,
      }),
    ).resolves.toBeNull();
    const rows = await asPrincipal.query(
      api.features.office.queries.listAllocations,
      {},
    );
    expect(rows.find((r) => r._id === id)).toBeUndefined();
  });

  it("staf is Forbidden", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "rm-s@mail.com");
    const id = await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      { label: "Tunai", value: 5, accent: "var(--color-gold)" },
    );
    await expect(
      asStaf.mutation(api.features.office.mutations.removeAllocation, { id }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("rejects an invalid id (after the write gate)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "rm-bad@mail.com");
    await expect(
      asPrincipal.mutation(api.features.office.mutations.removeAllocation, {
        id: "nonexistent",
      }),
    ).rejects.toThrow(/Invalid id/);
  });
});
