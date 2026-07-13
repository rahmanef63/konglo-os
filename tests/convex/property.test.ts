import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import { modules, seedUser } from "./_harness";

const makeT = () => convexTest(schema, modules);

// A complete create payload. Display fields are pre-formatted strings (the slice
// stores them verbatim); `order` is omitted so the mutation auto-assigns it.
const asset = {
  name: "Penthouse SCBD",
  type: "Properti",
  value: "Rp 480 M",
  location: "Jakarta",
  color: "var(--color-mk-red)",
  maint: "Rp 1,2 M/bln",
  status: "Dihuni",
  year: "2019",
  note: "Lantai 56 · 1.100 m²",
};

// --- READ gate (properti-aset): cfo HAS the feature; staf does not. -----------
describe("property.list — properti-aset READ gate", () => {
  it("principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-rp@mail.com");
    await expect(
      asPrincipal.query(api.features.property.queries.list, {}),
    ).resolves.toBeDefined();
  });

  it("cfo PASSES (properti-aset is in the cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "prop-rc@mail.com");
    await expect(
      asCfo.query(api.features.property.queries.list, {}),
    ).resolves.toBeDefined();
  });

  it("staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "prop-rs@mail.com");
    await expect(
      asStaf.query(api.features.property.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("signed out is Unauthorized", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.property.queries.list, {}),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("authed user with NO role row is Forbidden (no role)", async () => {
    const t = makeT();
    const asNoRole = await seedUser(t, null, "prop-norole@mail.com");
    await expect(
      asNoRole.query(api.features.property.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- WRITE gate (properti-aset): cfo + principal allowed; staf Forbidden. ------
describe("property.create — properti-aset WRITE gate", () => {
  it("principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-wp@mail.com");
    await expect(
      asPrincipal.mutation(api.features.property.mutations.create, asset),
    ).resolves.toBeDefined();
  });

  it("cfo PASSES (properti-aset is in the cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "prop-wc@mail.com");
    await expect(
      asCfo.mutation(api.features.property.mutations.create, asset),
    ).resolves.toBeDefined();
  });

  it("staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "prop-ws@mail.com");
    await expect(
      asStaf.mutation(api.features.property.mutations.create, asset),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- create → update round-trip: the patch lands and the row reads back. ------
describe("property.create then update — persistence + ordering", () => {
  it("create assigns slug + order; update patches the row in place", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "prop-rt@mail.com");
    const id = await asCfo.mutation(
      api.features.property.mutations.create,
      asset,
    );
    expect(id).toBeDefined();

    await expect(
      asCfo.mutation(api.features.property.mutations.update, {
        id,
        value: "Rp 500 M",
        status: "Disewakan",
      }),
    ).resolves.toBeNull();

    const rows = await asCfo.query(api.features.property.queries.list, {});
    const row = rows.find((r) => r._id === id);
    expect(row?.value).toBe("Rp 500 M");
    expect(row?.status).toBe("Disewakan");
    // Untouched fields survive the partial patch.
    expect(row?.name).toBe("Penthouse SCBD");
    // Auto-assigned order on the first row.
    expect(row?.order).toBe(1);
  });

  it("two creates get distinct, ascending orders (by_order desc max + 1)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-ord@mail.com");
    await asPrincipal.mutation(api.features.property.mutations.create, asset);
    await asPrincipal.mutation(api.features.property.mutations.create, {
      ...asset,
      name: "Vila Uluwatu",
    });
    const rows = await asPrincipal.query(
      api.features.property.queries.list,
      {},
    );
    expect(rows.map((r) => r.order)).toEqual([1, 2]);
  });

  it("same-name creates get unique slugs (race-safe by_slug collision suffix)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-slug@mail.com");
    await asPrincipal.mutation(api.features.property.mutations.create, asset);
    await asPrincipal.mutation(api.features.property.mutations.create, asset);
    const rows = await asPrincipal.query(
      api.features.property.queries.list,
      {},
    );
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs[0]).toBe("penthouse-scbd");
  });

  it("blank name still yields a valid fallback slug (asset-<order>)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-blank@mail.com");
    await asPrincipal.mutation(api.features.property.mutations.create, {
      ...asset,
      name: "   ",
    });
    const rows = await asPrincipal.query(
      api.features.property.queries.list,
      {},
    );
    expect(rows[0].slug).toBe("asset-1");
  });
});

// --- numeric guard: the lone numeric column (order) rejects poisoned values. ---
describe("property — numeric guard on order", () => {
  it("create rejects a negative order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-neg@mail.com");
    await expect(
      asPrincipal.mutation(api.features.property.mutations.create, {
        ...asset,
        order: -1,
      }),
    ).rejects.toThrow(/order/);
  });

  it("create rejects a non-integer (NaN) order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-nan@mail.com");
    await expect(
      asPrincipal.mutation(api.features.property.mutations.create, {
        ...asset,
        order: NaN,
      }),
    ).rejects.toThrow(/order/);
  });

  it("update rejects a fractional order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-frac@mail.com");
    const id = await asPrincipal.mutation(
      api.features.property.mutations.create,
      asset,
    );
    await expect(
      asPrincipal.mutation(api.features.property.mutations.update, {
        id,
        order: 1.5,
      }),
    ).rejects.toThrow(/order/);
  });
});

// --- remove (properti-aset): cfo + principal allowed; staf Forbidden. ---------
describe("property.remove — properti-aset WRITE gate", () => {
  it("principal removes an existing asset", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-rm@mail.com");
    const id = await asPrincipal.mutation(
      api.features.property.mutations.create,
      asset,
    );
    await expect(
      asPrincipal.mutation(api.features.property.mutations.remove, { id }),
    ).resolves.toBeNull();
    const rows = await asPrincipal.query(
      api.features.property.queries.list,
      {},
    );
    expect(rows.find((r) => r._id === id)).toBeUndefined();
  });

  it("staf is Forbidden", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "prop-rmseed@mail.com");
    const asStaf = await seedUser(t, "staf", "prop-rms@mail.com");
    const id = await asPrincipal.mutation(
      api.features.property.mutations.create,
      asset,
    );
    await expect(
      asStaf.mutation(api.features.property.mutations.remove, { id }),
    ).rejects.toThrow(/Forbidden/);
  });
});
