import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import { makeT, seedUser } from "./_harness";

// Mirrors holdings.test.ts harness. "portofolio-bisnis" IS in cfo's ROLE_MENU
// (lib/roles.ts), so subsidiaries reads + writes are cfo + principal; staf is
// blocked at the READ gate inside requireFeature / requireFeatureWrite.

const subsidiary = {
  name: "Nusantara Energi",
  sector: "Energi",
  revenue: 56_300_000_000_000,
  margin: 22,
  ownership: 80,
  trend: 12,
  color: "var(--color-mk-green)",
};

// --- subsidiaries.create: cfo + principal write; staf Forbidden. --------------
describe("subsidiaries.mutations — WRITE gate (subsidiaries)", () => {
  it("create: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "sub-staf@mail.com");
    await expect(
      asStaf.mutation(api.features.subsidiaries.mutations.create, subsidiary),
    ).rejects.toThrow(/Forbidden/);
  });

  it("create: cfo passes (portofolio-bisnis IS in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sub-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.subsidiaries.mutations.create, subsidiary),
    ).resolves.toBeDefined();
  });

  it("create: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sub-prin@mail.com");
    await expect(
      asPrincipal.mutation(
        api.features.subsidiaries.mutations.create,
        subsidiary,
      ),
    ).resolves.toBeDefined();
  });

  it("create rejects an out-of-range percentage (ownership > 100)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sub-pct@mail.com");
    await expect(
      asPrincipal.mutation(api.features.subsidiaries.mutations.create, {
        ...subsidiary,
        ownership: 150,
      }),
    ).rejects.toThrow(/ownership/);
  });
});

// --- subsidiaries.remove: cfo+principal delete + survives a stale CAS. --------
// remove takes only { id }; the CAS-conflict case runs on update (stale
// expectedVersion → /conflict/, the subsidiary survives). portofolio-bisnis IS
// in the cfo menu, so cfo can remove — only staf is Forbidden at the write gate.
describe("subsidiaries.remove — auth gate + CAS survival", () => {
  it("staf is Forbidden; the subsidiary survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sub-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "sub-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      subsidiary,
    );
    await expect(
      asStaf.mutation(api.features.subsidiaries.mutations.remove, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the subsidiary survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sub-rm-seed2@mail.com");
    const id = await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      subsidiary,
    );
    await expect(
      t.mutation(api.features.subsidiaries.mutations.remove, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo removes the subsidiary (portofolio-bisnis IS in cfo menu; row gone)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sub-rm-cfo@mail.com");
    const id = await asCfo.mutation(
      api.features.subsidiaries.mutations.create,
      subsidiary,
    );
    await expect(
      asCfo.mutation(api.features.subsidiaries.mutations.remove, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("principal removes the subsidiary (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sub-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      subsidiary,
    );
    await expect(
      asPrincipal.mutation(api.features.subsidiaries.mutations.remove, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on update; the subsidiary survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sub-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      subsidiary,
    );
    await expect(
      asPrincipal.mutation(api.features.subsidiaries.mutations.update, {
        id,
        ownership: 51,
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.ownership).toBe(80); // untouched by the rejected write
  });
});
