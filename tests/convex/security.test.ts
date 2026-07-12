import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Same harness as property.test.ts. keamanan-staf is the inverse RBAC shape of
// the cfo-menu features: staf HAS it in its menu (READ ok) but is not an
// elevated role, so WRITES reject staf; cfo lacks the feature entirely, so cfo
// is Forbidden at the READ gate. Net: writes are principal-ONLY.

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

// Complete create payloads. Display fields are pre-formatted strings stored
// verbatim; `order` is omitted so the mutation auto-assigns it.
const staff = {
  name: "Pak Budi",
  role: "Kepala Keamanan",
  status: "Bertugas",
  color: "var(--color-mk-green)",
  location: "Kediaman Utama",
  shift: "06:00–18:00",
  tenure: "9 th",
};

const zone = {
  label: "Kediaman Utama · Jakarta",
  status: "Hijau",
  color: "var(--color-mk-green)",
};

// --- WRITE gate (keamanan-staf): principal-only. staf reads but cannot write,
// cfo has neither. ------------------------------------------------------------
describe("security.createStaff — keamanan-staf WRITE gate", () => {
  it("principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-sp@mail.com");
    await expect(
      asPrincipal.mutation(api.features.security.mutations.createStaff, staff),
    ).resolves.toBeDefined();
  });

  it("staf is Forbidden on WRITE (can read keamanan-staf, but is not a writer)", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "sec-ss@mail.com");
    await expect(
      asStaf.mutation(api.features.security.mutations.createStaff, staff),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo is Forbidden (keamanan-staf is NOT in the cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-sc@mail.com");
    await expect(
      asCfo.mutation(api.features.security.mutations.createStaff, staff),
    ).rejects.toThrow(/Forbidden/);
  });

  it("signed out is Unauthorized", async () => {
    const t = makeT();
    await expect(
      t.mutation(api.features.security.mutations.createStaff, staff),
    ).rejects.toThrow(/Unauthorized/);
  });
});

describe("security.createZone — keamanan-staf WRITE gate", () => {
  it("principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-zp@mail.com");
    await expect(
      asPrincipal.mutation(api.features.security.mutations.createZone, zone),
    ).resolves.toBeDefined();
  });

  it("staf is Forbidden on WRITE", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "sec-zs@mail.com");
    await expect(
      asStaf.mutation(api.features.security.mutations.createZone, zone),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo is Forbidden", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-zc@mail.com");
    await expect(
      asCfo.mutation(api.features.security.mutations.createZone, zone),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- create → update round-trips: the patch lands, slug + order auto-assign. --
describe("security.staffRoster — create then update", () => {
  it("create assigns slug + order; update patches in place", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-srt@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    expect(id).toBeDefined();

    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asPrincipal.mutation(api.features.security.mutations.updateStaff, {
        id,
        status: "Cuti",
        location: "Hangar Halim",
      }),
    ).resolves.toBeNull();

    const rows = await asPrincipal.query(
      api.features.security.queries.listStaff,
      {},
    );
    const row = rows.find((r) => r._id === id);
    expect(row?.status).toBe("Cuti");
    expect(row?.location).toBe("Hangar Halim");
    // Untouched fields survive the partial patch.
    expect(row?.name).toBe("Pak Budi");
    expect(row?.slug).toBe("pak-budi");
    // First row appends above seedless empty table at order 0.
    expect(row?.order).toBe(0);
  });

  it("two creates get distinct, ascending orders + unique slugs", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-sord@mail.com");
    await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    const rows = await asPrincipal.query(
      api.features.security.queries.listStaff,
      {},
    );
    expect(rows.map((r) => r.order)).toEqual([0, 1]);
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs[0]).toBe("pak-budi");
  });

  it("blank name yields a valid fallback slug (staff-<order>)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-sblank@mail.com");
    await asPrincipal.mutation(api.features.security.mutations.createStaff, {
      ...staff,
      name: "   ",
    });
    const rows = await asPrincipal.query(
      api.features.security.queries.listStaff,
      {},
    );
    expect(rows[0].slug).toBe("staff-0");
  });
});

describe("security.securityZones — create then update", () => {
  it("create assigns slug + order; update patches in place", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-zrt@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createZone,
      zone,
    );
    await expect(
      asPrincipal.mutation(api.features.security.mutations.updateZone, {
        id,
        status: "Siaga",
        color: "var(--color-mk-orange)",
      }),
    ).resolves.toBeNull();

    const rows = await asPrincipal.query(
      api.features.security.queries.listZones,
      {},
    );
    const row = rows.find((r) => r._id === id);
    expect(row?.status).toBe("Siaga");
    expect(row?.color).toBe("var(--color-mk-orange)");
    expect(row?.label).toBe("Kediaman Utama · Jakarta");
    expect(row?.slug).toBe("kediaman-utama-jakarta");
    expect(row?.order).toBe(0);
  });

  it("remove deletes the row (principal)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-zrm@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createZone,
      zone,
    );
    await expect(
      asPrincipal.mutation(api.features.security.mutations.removeZone, { id }),
    ).resolves.toBeNull();
    const rows = await asPrincipal.query(
      api.features.security.queries.listZones,
      {},
    );
    expect(rows.find((r) => r._id === id)).toBeUndefined();
  });

  it("staf is Forbidden on remove", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-zrmseed@mail.com");
    const asStaf = await seedUser(t, "staf", "sec-zrms@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createZone,
      zone,
    );
    await expect(
      asStaf.mutation(api.features.security.mutations.removeZone, { id }),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- numeric guard: the lone numeric column (order) rejects poisoned values. --
describe("security — numeric guard on order", () => {
  it("createStaff rejects a negative order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-neg@mail.com");
    await expect(
      asPrincipal.mutation(api.features.security.mutations.createStaff, {
        ...staff,
        order: -1,
      }),
    ).rejects.toThrow(/order/);
  });

  it("createZone rejects a non-integer (NaN) order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-nan@mail.com");
    await expect(
      asPrincipal.mutation(api.features.security.mutations.createZone, {
        ...zone,
        order: NaN,
      }),
    ).rejects.toThrow(/order/);
  });

  it("updateStaff rejects a fractional order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-frac@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await expect(
      asPrincipal.mutation(api.features.security.mutations.updateStaff, {
        id,
        order: 1.5,
      }),
    ).rejects.toThrow(/order/);
  });
});

// --- removeStaff: principal-only delete + survives a stale CAS. ---------------
// removeStaff takes only { id }; the CAS-conflict case runs on updateStaff
// (stale expectedVersion → /conflict/, the staff row survives).
describe("security.removeStaff — auth gate + CAS survival", () => {
  it("staf is Forbidden on remove; the staff row survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-srm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "sec-srm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await expect(
      asStaf.mutation(api.features.security.mutations.removeStaff, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden (keamanan-staf not in cfo menu); the staff row survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-srm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "sec-srm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await expect(
      asCfo.mutation(api.features.security.mutations.removeStaff, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the staff row survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-srm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await expect(
      t.mutation(api.features.security.mutations.removeStaff, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the staff row (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-srm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await expect(
      asPrincipal.mutation(api.features.security.mutations.removeStaff, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on updateStaff; the staff row survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-srm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    );
    await expect(
      asPrincipal.mutation(api.features.security.mutations.updateStaff, {
        id,
        status: "Should not land",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.status).toBe("Bertugas"); // untouched by the rejected write
  });
});
