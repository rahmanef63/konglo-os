import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// P5-A data-integrity edge tests. Mirrors authz.test.ts harness (same glob +
// impersonation). Asserts the MUTATION-boundary guards added in notiondb /
// subsidiaries / contacts: per-column type + enum validation, race-safe slug
// (distinct, no duplicate), and numeric range rejection. Schema validators stay
// permissive (deploy-safe) — every reject below comes from the handler, not the
// schema. cfo holds data-studio, so it's a valid writer for the business tables.

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

function makeT() {
  return convexTest(schema, modules);
}

// A valid contacts row (tier/warmth are the only `select` columns in the
// registry; their options come straight from registry.ts).
const contact = {
  name: "VIP Satu",
  role: "Investor",
  tier: "Investor",
  warmth: "Hangat",
  last: "kemarin",
};

// A valid subsidiaries row (all numeric fields in range).
const sub = {
  name: "Konglo Beta",
  sector: "Tech",
  revenue: 1000,
  margin: 12,
  ownership: 60,
  trend: 5,
};

// --- notiondb.createRow: per-column enum + type validation. -------------------
describe("notiondb integrity — per-column validation (createRow)", () => {
  it("rejects an out-of-enum `select` value (contacts.tier)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "int-enum@mail.com");
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
        table: "contacts",
        values: { ...contact, tier: "Alien" },
      }),
    ).rejects.toThrow(/tier must be one of/);
  });

  it("accepts a valid `select` value (sanity — enum guard is not over-eager)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "int-enum-ok@mail.com");
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
        table: "contacts",
        values: { ...contact, tier: "Mitra", warmth: "Netral" },
      }),
    ).resolves.toBeNull();
  });

  it("rejects a wrong-typed value (string into a numeric column, subsidiaries.revenue)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "int-type@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: { ...sub, revenue: "lots" },
      }),
    ).rejects.toThrow(/revenue must be a finite number/);
  });

  it("rejects a wrong-typed value (number into a text column, subsidiaries.sector)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "int-type2@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: { ...sub, sector: 42 },
      }),
    ).rejects.toThrow(/sector must be a string/);
  });
});

// --- notiondb.createRow: numeric range guards. --------------------------------
describe("notiondb integrity — numeric range (createRow)", () => {
  it("rejects an out-of-range percentage (subsidiaries.margin > 100)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "int-range@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: { ...sub, margin: 150 },
      }),
    ).rejects.toThrow(/margin must be <= 100/);
  });

  it("rejects negative money (subsidiaries.revenue < 0)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "int-neg@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: { ...sub, revenue: -5 },
      }),
    ).rejects.toThrow(/revenue must be >= 0/);
  });

  it("rejects a non-finite number (heirs.readiness = Infinity) for principal", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "int-inf@mail.com");
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
        table: "heirs",
        values: {
          name: "Putra",
          role: "Penerus",
          share: "30%",
          readiness: Number.POSITIVE_INFINITY,
          age: "24",
          next: "MBA",
          mandate: "Operasi",
        },
      }),
    ).rejects.toThrow(/readiness must be a finite number/);
  });
});

// --- notiondb.updateRow: single-field boundary validation. --------------------
describe("notiondb integrity — updateRow validates the patched field", () => {
  it("rejects an out-of-enum tier on update", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "int-upd@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "contacts",
      values: contact,
    });
    const row = await t.run((ctx) => ctx.db.query("contacts").first());
    expect(row).not.toBeNull();
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.updateRow, {
        table: "contacts",
        id: row!._id,
        field: "tier",
        value: "Alien",
      }),
    ).rejects.toThrow(/tier must be one of/);
  });
});

// --- Race-safe slug: a collision yields a DISTINCT slug, never a duplicate. ----
describe("slug collision — distinct slug, no duplicate", () => {
  it("notiondb.createRow: two same-named subsidiaries get distinct slugs", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "slug-nd@mail.com");
    await asCfo.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...sub, name: "Konglo Echo" },
    });
    await asCfo.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...sub, name: "Konglo Echo" },
    });
    const rows = await t.run((ctx) => ctx.db.query("subsidiaries").take(50));
    const echo = rows.filter((r) => r.name === "Konglo Echo");
    expect(echo).toHaveLength(2);
    const slugs = echo.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(2); // distinct
    expect(slugs).toContain("konglo-echo"); // base slug kept on the first
  });

  it("subsidiaries.create (dedicated mutation): collision gets an order suffix", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "slug-sub@mail.com");
    await asCfo.mutation(api.features.subsidiaries.mutations.create, {
      ...sub,
      name: "Konglo Foxtrot",
      color: "var(--color-mk-blue)",
    });
    await asCfo.mutation(api.features.subsidiaries.mutations.create, {
      ...sub,
      name: "Konglo Foxtrot",
      color: "var(--color-mk-blue)",
    });
    const rows = await t.run((ctx) => ctx.db.query("subsidiaries").take(50));
    const fox = rows.filter((r) => r.name === "Konglo Foxtrot");
    expect(fox).toHaveLength(2);
    expect(new Set(fox.map((r) => r.slug)).size).toBe(2);
  });

  it("contacts.create (dedicated mutation): collision gets an order suffix", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "slug-con@mail.com");
    await asPrincipal.mutation(api.features.contacts.mutations.create, {
      ...contact,
      name: "Nama Sama",
    });
    await asPrincipal.mutation(api.features.contacts.mutations.create, {
      ...contact,
      name: "Nama Sama",
    });
    const rows = await t.run((ctx) => ctx.db.query("contacts").take(50));
    const dup = rows.filter((r) => r.name === "Nama Sama");
    expect(dup).toHaveLength(2);
    expect(new Set(dup.map((r) => r.slug)).size).toBe(2);
  });
});

// --- Dedicated subsidiaries.create/update numeric guards. ---------------------
describe("subsidiaries integrity — numeric guards on the dedicated mutation", () => {
  it("create: rejects margin > 100", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sub-num@mail.com");
    await expect(
      asCfo.mutation(api.features.subsidiaries.mutations.create, {
        ...sub,
        margin: 250,
        color: "var(--color-mk-blue)",
      }),
    ).rejects.toThrow(/margin must be a finite number between 0 and 100/);
  });

  it("create: rejects negative revenue", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sub-neg@mail.com");
    await expect(
      asCfo.mutation(api.features.subsidiaries.mutations.create, {
        ...sub,
        revenue: -1,
        color: "var(--color-mk-blue)",
      }),
    ).rejects.toThrow(/revenue must be a finite number >= 0/);
  });

  it("update: rejects an out-of-range ownership", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sub-upd@mail.com");
    const id = await asCfo.mutation(api.features.subsidiaries.mutations.create, {
      ...sub,
      name: "Konglo Golf",
      color: "var(--color-mk-blue)",
    });
    await expect(
      asCfo.mutation(api.features.subsidiaries.mutations.update, {
        id,
        ownership: 120,
      }),
    ).rejects.toThrow(/ownership must be a finite number between 0 and 100/);
  });
});
