import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Id } from "../../convex/_generated/dataModel";
import type { Role } from "../../lib/roles";

// Optimistic-locking (compare-and-set) coverage for the UPDATE paths that carry
// an optional `expectedVersion` token. Originally:
//   office.setFigures, office.upsertAllocation,
//   subsidiaries.update, filantropi.updateGrant.
// P10-B broadened the lock across the remaining writable tables; this suite adds
// the three highest-stakes of those — family.updateHeir (succession),
// holdings.update, contacts.update — each over the same three scenarios.
// P11-E closes the remaining gap: the 8 CAS update paths across
// property/security/lifestyle/kesehatan feature mutations that had no test —
// property.update, security.updateStaff/updateZone, lifestyle.updateEvent/
// updateReservation/updateRequest, kesehatan.updateSchedule/updateMedicalTeam.
//
// Each path is asserted under three scenarios:
//   1. STALE expectedVersion  → rejected with /conflict/.
//   2. MATCHING expectedVersion → succeeds AND bumps version.
//   3. OMITTED expectedVersion  → succeeds (no check) and still increments.
//
// Same harness as office.test.ts / authz.test.ts: glob the whole convex tree
// (must reach _generated for convex-test's module-root resolution) and
// impersonate via a `<userId>|<session>` subject getAuthUserId splits to userId.
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

// Read a doc's stored `version` directly (queries return it, but reading via
// ctx.db.get keeps the assertion precise and decoupled from query field shape).
async function versionOf(
  t: ReturnType<typeof convexTest>,
  id: Id<
    | "officeFigures"
    | "allocations"
    | "subsidiaries"
    | "philanthropyGrants"
    | "heirs"
    | "holdings"
    | "contacts"
    | "propertyAssets"
    | "staffRoster"
    | "securityZones"
    | "lifestyleEvents"
    | "conciergeReservations"
    | "conciergeRequests"
    | "healthSchedule"
    | "healthMedicalTeam"
  >,
): Promise<number | undefined> {
  return t.run(async (ctx) => {
    const doc = await ctx.db.get(id);
    return doc?.version;
  });
}

const figures = {
  netWorth: 1_000_000,
  netWorthChange: -2.5,
  liabilitas: 250_000,
  debtRatio: 25,
};

// --- office.setFigures (singleton) -------------------------------------------
describe("office.setFigures — optimistic version lock", () => {
  it("first upsert seeds version 1", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-fig-seed@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.office.mutations.setFigures,
      figures,
    )) as Id<"officeFigures">;
    expect(await versionOf(t, id)).toBe(1);
  });

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-fig-stale@mail.com");
    await asPrincipal.mutation(api.features.office.mutations.setFigures, figures); // v1
    await expect(
      asPrincipal.mutation(api.features.office.mutations.setFigures, {
        ...figures,
        netWorth: 2_000_000,
        expectedVersion: 0, // stale: row is at v1
      }),
    ).rejects.toThrow(/conflict/);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-fig-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.office.mutations.setFigures,
      figures,
    )) as Id<"officeFigures">; // v1
    await asPrincipal.mutation(api.features.office.mutations.setFigures, {
      ...figures,
      netWorth: 3_000_000,
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const row = await asPrincipal.query(
      api.features.office.queries.getFigures,
      {},
    );
    expect(row?.netWorth).toBe(3_000_000);
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-fig-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.office.mutations.setFigures,
      figures,
    )) as Id<"officeFigures">; // v1
    await asPrincipal.mutation(api.features.office.mutations.setFigures, {
      ...figures,
      netWorth: 4_000_000,
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- office.upsertAllocation -------------------------------------------------
describe("office.upsertAllocation — optimistic version lock", () => {
  const alloc = {
    slug: "kas",
    label: "Kas",
    value: 10,
    accent: "var(--color-gold)",
  };

  it("first insert seeds version 1", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-alloc-seed@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      alloc,
    )) as Id<"allocations">;
    expect(await versionOf(t, id)).toBe(1);
  });

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-alloc-stale@mail.com");
    await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      alloc,
    ); // v1
    await expect(
      asPrincipal.mutation(api.features.office.mutations.upsertAllocation, {
        ...alloc,
        value: 99,
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-alloc-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      alloc,
    )) as Id<"allocations">; // v1
    const id2 = (await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      { ...alloc, value: 42, expectedVersion: 1 },
    )) as Id<"allocations">;
    expect(id2).toEqual(id); // same slug → patched, not a new row
    expect(await versionOf(t, id)).toBe(2);
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-alloc-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.office.mutations.upsertAllocation,
      alloc,
    )) as Id<"allocations">; // v1
    await asPrincipal.mutation(api.features.office.mutations.upsertAllocation, {
      ...alloc,
      value: 7,
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- subsidiaries.update -----------------------------------------------------
describe("subsidiaries.update — optimistic version lock", () => {
  const sub = {
    name: "Konglo Energi",
    sector: "Energi",
    revenue: 1_000_000,
    margin: 20,
    ownership: 80,
    trend: 5,
    color: "var(--color-gold)",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-sub-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      sub,
    )) as Id<"subsidiaries">; // v1
    await expect(
      asPrincipal.mutation(api.features.subsidiaries.mutations.update, {
        id,
        revenue: 2_000_000,
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-sub-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      sub,
    )) as Id<"subsidiaries">; // v1
    await asPrincipal.mutation(api.features.subsidiaries.mutations.update, {
      id,
      revenue: 2_000_000,
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.subsidiaries.queries.list,
      {},
    );
    expect(rows.find((r) => r._id === id)?.revenue).toBe(2_000_000);
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-sub-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.subsidiaries.mutations.create,
      sub,
    )) as Id<"subsidiaries">; // v1
    await asPrincipal.mutation(api.features.subsidiaries.mutations.update, {
      id,
      margin: 33,
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- filantropi.updateGrant --------------------------------------------------
describe("filantropi.updateGrant — optimistic version lock", () => {
  const grant = {
    name: "Beasiswa Nusantara",
    category: "Pendidikan",
    amount: "Rp 420 M",
    progress: 40,
    color: "var(--color-gold)",
    beneficiaries: "1.200 siswa",
    region: "Nasional",
    partner: "Yayasan Konglo",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-grant-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    )) as Id<"philanthropyGrants">; // v1
    await expect(
      asPrincipal.mutation(api.features.filantropi.mutations.updateGrant, {
        id,
        progress: 55,
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-grant-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    )) as Id<"philanthropyGrants">; // v1
    await asPrincipal.mutation(api.features.filantropi.mutations.updateGrant, {
      id,
      progress: 75,
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.filantropi.queries.listGrants,
      {},
    );
    expect(rows.find((r) => r._id === id)?.progress).toBe(75);
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-grant-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    )) as Id<"philanthropyGrants">; // v1
    await asPrincipal.mutation(api.features.filantropi.mutations.updateGrant, {
      id,
      progress: 90,
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- family.updateHeir (succession — principal-only, SEC-001) ----------------
// Highest-stakes lock: the principal's estate plan. createHeir seeds version 1.
describe("family.updateHeir — optimistic version lock", () => {
  const heir = {
    name: "Putra Sulung",
    role: "Pewaris Utama",
    share: "28%",
    readiness: 72,
    age: "29",
    next: "Mentorship board",
    mandate: "Operasi grup",
  };

  it("createHeir seeds version 1", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-heir-seed@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.family.mutations.createHeir,
      heir,
    )) as Id<"heirs">;
    expect(await versionOf(t, id)).toBe(1);
  });

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-heir-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.family.mutations.createHeir,
      heir,
    )) as Id<"heirs">; // v1
    await expect(
      asPrincipal.mutation(api.features.family.mutations.updateHeir, {
        id,
        share: "33%",
        expectedVersion: 0, // stale: row is at v1
      }),
    ).rejects.toThrow(/conflict/);
    // rejected write must not have mutated the row
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-heir-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.family.mutations.createHeir,
      heir,
    )) as Id<"heirs">; // v1
    await asPrincipal.mutation(api.features.family.mutations.updateHeir, {
      id,
      share: "40%",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.family.queries.listHeirs,
      {},
    );
    expect(rows.find((r) => r._id === id)?.share).toBe("40%");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-heir-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.family.mutations.createHeir,
      heir,
    )) as Id<"heirs">; // v1
    await asPrincipal.mutation(api.features.family.mutations.updateHeir, {
      id,
      readiness: 88,
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- holdings.update ---------------------------------------------------------
describe("holdings.update — optimistic version lock", () => {
  const holding = {
    name: "Bank Konglo",
    ticker: "BKGL",
    value: "Rp 12,4 T",
    change: "+2,1%",
    up: true,
    weight: "18%",
    avg: "Rp 4.200",
    lot: "120.000",
    sector: "Perbankan",
    points: [1, 2, 3, 4],
    color: "var(--color-gold)",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-hold-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    )) as Id<"holdings">; // v1
    await expect(
      asPrincipal.mutation(api.features.holdings.mutations.update, {
        id,
        value: "Rp 13,0 T",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-hold-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    )) as Id<"holdings">; // v1
    await asPrincipal.mutation(api.features.holdings.mutations.update, {
      id,
      value: "Rp 14,0 T",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.holdings.queries.list,
      {},
    );
    expect(rows.find((r) => r._id === id)?.value).toBe("Rp 14,0 T");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-hold-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.holdings.mutations.create,
      holding,
    )) as Id<"holdings">; // v1
    await asPrincipal.mutation(api.features.holdings.mutations.update, {
      id,
      weight: "20%",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- contacts.update ---------------------------------------------------------
describe("contacts.update — optimistic version lock", () => {
  const contact = {
    name: "Menteri Investasi",
    role: "Regulator",
    tier: "Strategis",
    warmth: "Hangat",
    last: "2 minggu lalu",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-kontak-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    )) as Id<"contacts">; // v1
    await expect(
      asPrincipal.mutation(api.features.contacts.mutations.update, {
        id,
        warmth: "Netral",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-kontak-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    )) as Id<"contacts">; // v1
    await asPrincipal.mutation(api.features.contacts.mutations.update, {
      id,
      warmth: "Sangat hangat",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.contacts.queries.list,
      {},
    );
    expect(rows.find((r) => r._id === id)?.warmth).toBe("Sangat hangat");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-kontak-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    )) as Id<"contacts">; // v1
    await asPrincipal.mutation(api.features.contacts.mutations.update, {
      id,
      last: "Kemarin",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- property.update (propertyAssets, properti-aset) -------------------------
describe("property.update — optimistic version lock", () => {
  const asset = {
    name: "Vila Bali",
    type: "Properti",
    value: "Rp 80 M",
    location: "Bali",
    color: "var(--color-gold)",
    maint: "Rp 1,2 M/thn",
    status: "Aktif",
    year: "2019",
    note: "Pantai privat",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-prop-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.property.mutations.create,
      asset,
    )) as Id<"propertyAssets">; // v1
    await expect(
      asPrincipal.mutation(api.features.property.mutations.update, {
        id,
        value: "Rp 90 M",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-prop-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.property.mutations.create,
      asset,
    )) as Id<"propertyAssets">; // v1
    await asPrincipal.mutation(api.features.property.mutations.update, {
      id,
      value: "Rp 95 M",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.property.queries.list,
      {},
    );
    expect(rows.find((r) => r._id === id)?.value).toBe("Rp 95 M");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-prop-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.property.mutations.create,
      asset,
    )) as Id<"propertyAssets">; // v1
    await asPrincipal.mutation(api.features.property.mutations.update, {
      id,
      status: "Renovasi",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- security.updateStaff (staffRoster, keamanan-staf) -----------------------
describe("security.updateStaff — optimistic version lock", () => {
  const staff = {
    name: "Kapten Bagas",
    role: "Kepala Keamanan",
    status: "Aktif",
    color: "var(--color-gold)",
    location: "Pusat",
    shift: "Pagi",
    tenure: "5 thn",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-staff-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    )) as Id<"staffRoster">; // v1
    await expect(
      asPrincipal.mutation(api.features.security.mutations.updateStaff, {
        id,
        status: "Cuti",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-staff-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    )) as Id<"staffRoster">; // v1
    await asPrincipal.mutation(api.features.security.mutations.updateStaff, {
      id,
      status: "Lembur",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.security.queries.listStaff,
      {},
    );
    expect(rows.find((r) => r._id === id)?.status).toBe("Lembur");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-staff-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.security.mutations.createStaff,
      staff,
    )) as Id<"staffRoster">; // v1
    await asPrincipal.mutation(api.features.security.mutations.updateStaff, {
      id,
      shift: "Malam",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- security.updateZone (securityZones, keamanan-staf) ----------------------
describe("security.updateZone — optimistic version lock", () => {
  const zone = {
    label: "Gerbang Utama",
    status: "Aman",
    color: "var(--color-gold)",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-zone-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.security.mutations.createZone,
      zone,
    )) as Id<"securityZones">; // v1
    await expect(
      asPrincipal.mutation(api.features.security.mutations.updateZone, {
        id,
        status: "Siaga",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-zone-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.security.mutations.createZone,
      zone,
    )) as Id<"securityZones">; // v1
    await asPrincipal.mutation(api.features.security.mutations.updateZone, {
      id,
      status: "Bahaya",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.security.queries.listZones,
      {},
    );
    expect(rows.find((r) => r._id === id)?.status).toBe("Bahaya");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-zone-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.security.mutations.createZone,
      zone,
    )) as Id<"securityZones">; // v1
    await asPrincipal.mutation(api.features.security.mutations.updateZone, {
      id,
      label: "Gerbang Belakang",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- lifestyle.updateEvent (lifestyleEvents, hiburan-gaya-hidup) -------------
describe("lifestyle.updateEvent — optimistic version lock", () => {
  const event = {
    date: "12 Jun",
    title: "Gala Amal",
    location: "Jakarta",
    color: "var(--color-gold)",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-evt-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    )) as Id<"lifestyleEvents">; // v1
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateEvent, {
        id,
        title: "Gala Privat",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-evt-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    )) as Id<"lifestyleEvents">; // v1
    await asPrincipal.mutation(api.features.lifestyle.mutations.updateEvent, {
      id,
      title: "Gala VIP",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.lifestyle.queries.listEvents,
      {},
    );
    expect(rows.find((r) => r._id === id)?.title).toBe("Gala VIP");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-evt-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    )) as Id<"lifestyleEvents">; // v1
    await asPrincipal.mutation(api.features.lifestyle.mutations.updateEvent, {
      id,
      location: "Bali",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- lifestyle.updateReservation (conciergeReservations) ---------------------
describe("lifestyle.updateReservation — optimistic version lock", () => {
  const reservation = { emoji: "🍽️", label: "Makan malam" };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-res-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    )) as Id<"conciergeReservations">; // v1
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateReservation, {
        id,
        label: "Makan siang",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-res-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    )) as Id<"conciergeReservations">; // v1
    await asPrincipal.mutation(api.features.lifestyle.mutations.updateReservation, {
      id,
      label: "Brunch",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.lifestyle.queries.listReservations,
      {},
    );
    expect(rows.find((r) => r._id === id)?.label).toBe("Brunch");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-res-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    )) as Id<"conciergeReservations">; // v1
    await asPrincipal.mutation(api.features.lifestyle.mutations.updateReservation, {
      id,
      emoji: "🥂",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- lifestyle.updateRequest (conciergeRequests) ----------------------------
describe("lifestyle.updateRequest — optimistic version lock", () => {
  const request = { label: "Sewa jet" };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-req-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    )) as Id<"conciergeRequests">; // v1
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateRequest, {
        id,
        label: "Sewa yacht",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-req-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    )) as Id<"conciergeRequests">; // v1
    await asPrincipal.mutation(api.features.lifestyle.mutations.updateRequest, {
      id,
      label: "Sewa helikopter",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.lifestyle.queries.listRequests,
      {},
    );
    expect(rows.find((r) => r._id === id)?.label).toBe("Sewa helikopter");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-req-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    )) as Id<"conciergeRequests">; // v1
    await asPrincipal.mutation(api.features.lifestyle.mutations.updateRequest, {
      id,
      label: "Sewa kapal pesiar",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- kesehatan.updateSchedule (healthSchedule, kesehatan) --------------------
describe("kesehatan.updateSchedule — optimistic version lock", () => {
  const schedule = {
    date: "20 Jun",
    title: "Medical check-up",
    location: "RS Konglo",
    color: "var(--color-gold)",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-sch-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    )) as Id<"healthSchedule">; // v1
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.updateSchedule, {
        id,
        title: "Konsultasi",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-sch-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    )) as Id<"healthSchedule">; // v1
    await asPrincipal.mutation(api.features.kesehatan.mutations.updateSchedule, {
      id,
      title: "Vaksinasi",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.kesehatan.queries.listSchedule,
      {},
    );
    expect(rows.find((r) => r._id === id)?.title).toBe("Vaksinasi");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-sch-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    )) as Id<"healthSchedule">; // v1
    await asPrincipal.mutation(api.features.kesehatan.mutations.updateSchedule, {
      id,
      location: "Klinik Pusat",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- kesehatan.updateMedicalTeam (healthMedicalTeam, kesehatan) --------------
describe("kesehatan.updateMedicalTeam — optimistic version lock", () => {
  const member = {
    name: "Dr. Sari",
    role: "Dokter Pribadi",
    color: "var(--color-gold)",
  };

  it("STALE expectedVersion is rejected with /conflict/", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-team-stale@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    )) as Id<"healthMedicalTeam">; // v1
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.updateMedicalTeam, {
        id,
        role: "Spesialis Jantung",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-team-match@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    )) as Id<"healthMedicalTeam">; // v1
    await asPrincipal.mutation(api.features.kesehatan.mutations.updateMedicalTeam, {
      id,
      role: "Spesialis Saraf",
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const rows = await asPrincipal.query(
      api.features.kesehatan.queries.listMedicalTeam,
      {},
    );
    expect(rows.find((r) => r._id === id)?.role).toBe("Spesialis Saraf");
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "v-team-omit@mail.com");
    const id = (await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    )) as Id<"healthMedicalTeam">; // v1
    await asPrincipal.mutation(api.features.kesehatan.mutations.updateMedicalTeam, {
      id,
      name: "Dr. Budi",
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});
