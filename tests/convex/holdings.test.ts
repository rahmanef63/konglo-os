import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import { makeT, seedUser } from "./_harness";

// Mirrors grants-events.test.ts harness. investasi-pasar IS in cfo's ROLE_MENU
// (lib/roles.ts), so holdings reads + writes are cfo + principal; staf is
// blocked at the READ gate inside requireFeature / requireFeatureWrite.

const holding = {
  name: "Apple Inc.",
  ticker: "AAPL",
  value: "Rp 4,2 T",
  change: "+1,8%",
  up: true,
  weight: "7,2%",
  avg: "Rp 2.840",
  lot: "1,48 jt lbr",
  sector: "Saham AS · Teknologi",
  points: [4, 6, 5, 8, 7, 10, 9, 12],
  color: "var(--color-mk-orange)",
};

describe("holdings.queries.list — READ gate", () => {
  it("staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "hold-staf-r@mail.com");
    await expect(
      asStaf.query(api.features.holdings.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo can list (investasi-pasar IS in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "hold-cfo-r@mail.com");
    await expect(
      asCfo.query(api.features.holdings.queries.list, {}),
    ).resolves.toEqual([]);
  });

  it("principal can list", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-prin-r@mail.com");
    await expect(
      asPrincipal.query(api.features.holdings.queries.list, {}),
    ).resolves.toEqual([]);
  });
});

describe("holdings.mutations.create — WRITE gate", () => {
  it("staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "hold-staf-w@mail.com");
    await expect(
      asStaf.mutation(api.features.holdings.mutations.create, holding),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo passes (investasi-pasar IS in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "hold-cfo-w@mail.com");
    await expect(
      asCfo.mutation(api.features.holdings.mutations.create, holding),
    ).resolves.toBeDefined();
  });

  it("principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-prin-w@mail.com");
    await expect(
      asPrincipal.mutation(api.features.holdings.mutations.create, holding),
    ).resolves.toBeDefined();
  });

  it("rejects a non-finite / out-of-range points entry", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-pts@mail.com");
    await expect(
      asPrincipal.mutation(api.features.holdings.mutations.create, {
        ...holding,
        points: [1, 2, Number.POSITIVE_INFINITY],
      }),
    ).rejects.toThrow(/points/);
  });
});

describe("holdings — happy path create then update", () => {
  it("cfo creates then updates a holding", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "hold-happy@mail.com");
    const id = await asCfo.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asCfo.mutation(api.features.holdings.mutations.update, {
        id,
        value: "Rp 5,0 T",
        change: "+2,4%",
        up: true,
      }),
    ).resolves.toBeNull();
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.value).toBe("Rp 5,0 T");
    expect(row?.change).toBe("+2,4%");
    expect(row?.slug).toBe("apple-inc");
    expect(row?.order).toBe(1);
  });

  it("second create gets a distinct slug + incremented order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-order@mail.com");
    await asPrincipal.mutation(api.features.holdings.mutations.create, holding);
    const id2 = await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    const row2 = await t.run((ctx) => ctx.db.get(id2));
    expect(row2?.slug).toBe("apple-inc-2");
    expect(row2?.order).toBe(2);
  });
});

// --- holdings.remove: cfo+principal delete + survives a stale CAS. -------------
// remove takes only { id }; the CAS-conflict case runs on update (stale
// expectedVersion → /conflict/, the holding survives). investasi-pasar IS in
// the cfo menu, so cfo can remove — only staf is Forbidden at the write gate.
describe("holdings.remove — auth gate + CAS survival", () => {
  it("staf is Forbidden; the holding survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "hold-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    await expect(
      asStaf.mutation(api.features.holdings.mutations.remove, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the holding survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-rm-seed2@mail.com");
    const id = await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    await expect(
      t.mutation(api.features.holdings.mutations.remove, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo removes the holding (investasi-pasar IS in cfo menu; row gone)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "hold-rm-cfo@mail.com");
    const id = await asCfo.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    await expect(
      asCfo.mutation(api.features.holdings.mutations.remove, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("principal removes the holding (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    await expect(
      asPrincipal.mutation(api.features.holdings.mutations.remove, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on update; the holding survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hold-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    );
    await expect(
      asPrincipal.mutation(api.features.holdings.mutations.update, {
        id,
        value: "Rp 9,9 T",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.value).toBe("Rp 4,2 T"); // untouched by the rejected write
  });
});
