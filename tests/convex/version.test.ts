import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { makeT, seedUser } from "./_harness";

// Optimistic-locking (compare-and-set) coverage for EVERY update path that
// carries an optional `expectedVersion` token (P10-B/P11-E sweep). One
// table-driven body instead of 14 copy-pasted describes — each row wires the
// feature's create + update calls; the four scenarios below run per row:
//   1. create seeds version 1.
//   2. STALE expectedVersion  → rejected with /conflict/, row untouched.
//   3. MATCHING expectedVersion → succeeds, bumps version, patch lands.
//   4. OMITTED expectedVersion  → succeeds (no check) and still increments.

type T = ReturnType<typeof makeT>;
type As = Awaited<ReturnType<typeof seedUser>>;
type Cas = { expectedVersion?: number };

// Read the stored `version` directly — precise and decoupled from query shape.
// One localized cast: the table is heterogeneous over id tables, db.get is not.
async function versionOf(t: T, id: string): Promise<number | undefined> {
  return t.run(async (ctx) => {
    const doc = (await ctx.db.get(id as Id<"officeFigures">)) as {
      version?: number;
    } | null;
    return doc?.version;
  });
}

const m = api.features;

const FIGURES = {
  netWorth: 1_000_000,
  netWorthChange: -2.5,
  liabilitas: 250_000,
  debtRatio: 25,
};
const ALLOC = { slug: "kas", label: "Kas", value: 10, accent: "var(--color-gold)" };

type Row = {
  name: string;
  create: (as: As) => Promise<string>;
  // Same patch for STALE/MATCHING/OMITTED — each case runs on a fresh backend.
  update: (as: As, id: string, cas: Cas) => Promise<unknown>;
  // MATCHING read-back through the public query surface (absent for the
  // slug-keyed allocation upsert, where versionOf===2 already proves the patch
  // hit the SAME row instead of inserting a new one).
  fetch?: (as: As, id: string) => Promise<unknown>;
  want?: unknown;
};

const ROWS: Row[] = [
  {
    name: "office.setFigures",
    create: (as) => as.mutation(m.office.mutations.setFigures, FIGURES),
    update: (as, _id, cas) =>
      as.mutation(m.office.mutations.setFigures, { ...FIGURES, netWorth: 3_000_000, ...cas }),
    fetch: async (as) => (await as.query(m.office.queries.getFigures, {}))?.netWorth,
    want: 3_000_000,
  },
  {
    name: "office.upsertAllocation",
    create: (as) => as.mutation(m.office.mutations.upsertAllocation, ALLOC),
    update: (as, _id, cas) =>
      as.mutation(m.office.mutations.upsertAllocation, { ...ALLOC, value: 42, ...cas }),
  },
  {
    name: "subsidiaries.update",
    create: (as) =>
      as.mutation(m.subsidiaries.mutations.create, {
        name: "Konglo Energi", sector: "Energi", revenue: 1_000_000,
        margin: 20, ownership: 80, trend: 5, color: "var(--color-gold)",
      }),
    update: (as, id, cas) =>
      as.mutation(m.subsidiaries.mutations.update, {
        id: id as Id<"subsidiaries">, revenue: 2_000_000, ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.subsidiaries.queries.list, {})).find((r) => r._id === id)?.revenue,
    want: 2_000_000,
  },
  {
    name: "filantropi.updateGrant",
    create: (as) =>
      as.mutation(m.filantropi.mutations.createGrant, {
        name: "Beasiswa Nusantara", category: "Pendidikan", amount: "Rp 420 M",
        progress: 40, color: "var(--color-gold)", beneficiaries: "1.200 siswa",
        region: "Nasional", partner: "Yayasan Konglo",
      }),
    update: (as, id, cas) =>
      as.mutation(m.filantropi.mutations.updateGrant, {
        id: id as Id<"philanthropyGrants">, progress: 75, ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.filantropi.queries.listGrants, {})).find((r) => r._id === id)?.progress,
    want: 75,
  },
  {
    // Highest-stakes lock: the principal's estate plan (SEC-001).
    name: "family.updateHeir",
    create: (as) =>
      as.mutation(m.family.mutations.createHeir, {
        name: "Putra Sulung", role: "Pewaris Utama", share: "28%",
        readiness: 72, age: "29", next: "Mentorship board", mandate: "Operasi grup",
      }),
    update: (as, id, cas) =>
      as.mutation(m.family.mutations.updateHeir, {
        id: id as Id<"heirs">, share: "40%", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.family.queries.listHeirs, {})).find((r) => r._id === id)?.share,
    want: "40%",
  },
  {
    name: "holdings.update",
    create: (as) =>
      as.mutation(m.holdings.mutations.create, {
        name: "Bank Konglo", ticker: "BKGL", value: "Rp 12,4 T", change: "+2,1%",
        up: true, weight: "18%", avg: "Rp 4.200", lot: "120.000",
        sector: "Perbankan", points: [1, 2, 3, 4], color: "var(--color-gold)",
      }),
    update: (as, id, cas) =>
      as.mutation(m.holdings.mutations.update, {
        id: id as Id<"holdings">, value: "Rp 14,0 T", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.holdings.queries.list, {})).find((r) => r._id === id)?.value,
    want: "Rp 14,0 T",
  },
  {
    name: "contacts.update",
    create: (as) =>
      as.mutation(m.contacts.mutations.create, {
        name: "Menteri Investasi", role: "Regulator", tier: "Strategis",
        warmth: "Hangat", last: "2 minggu lalu",
      }),
    update: (as, id, cas) =>
      as.mutation(m.contacts.mutations.update, {
        id: id as Id<"contacts">, warmth: "Sangat hangat", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.contacts.queries.list, {})).find((r) => r._id === id)?.warmth,
    want: "Sangat hangat",
  },
  {
    name: "property.update",
    create: (as) =>
      as.mutation(m.property.mutations.create, {
        name: "Vila Bali", type: "Properti", value: "Rp 80 M", location: "Bali",
        color: "var(--color-gold)", maint: "Rp 1,2 M/thn", status: "Aktif",
        year: "2019", note: "Pantai privat",
      }),
    update: (as, id, cas) =>
      as.mutation(m.property.mutations.update, {
        id: id as Id<"propertyAssets">, value: "Rp 95 M", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.property.queries.list, {})).find((r) => r._id === id)?.value,
    want: "Rp 95 M",
  },
  {
    name: "security.updateStaff",
    create: (as) =>
      as.mutation(m.security.mutations.createStaff, {
        name: "Kapten Bagas", role: "Kepala Keamanan", status: "Aktif",
        color: "var(--color-gold)", location: "Pusat", shift: "Pagi", tenure: "5 thn",
      }),
    update: (as, id, cas) =>
      as.mutation(m.security.mutations.updateStaff, {
        id: id as Id<"staffRoster">, status: "Lembur", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.security.queries.listStaff, {})).find((r) => r._id === id)?.status,
    want: "Lembur",
  },
  {
    name: "security.updateZone",
    create: (as) =>
      as.mutation(m.security.mutations.createZone, {
        label: "Gerbang Utama", status: "Aman", color: "var(--color-gold)",
      }),
    update: (as, id, cas) =>
      as.mutation(m.security.mutations.updateZone, {
        id: id as Id<"securityZones">, status: "Bahaya", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.security.queries.listZones, {})).find((r) => r._id === id)?.status,
    want: "Bahaya",
  },
  {
    name: "lifestyle.updateEvent",
    create: (as) =>
      as.mutation(m.lifestyle.mutations.createEvent, {
        date: "12 Jun", title: "Gala Amal", location: "Jakarta", color: "var(--color-gold)",
      }),
    update: (as, id, cas) =>
      as.mutation(m.lifestyle.mutations.updateEvent, {
        id: id as Id<"lifestyleEvents">, title: "Gala VIP", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.lifestyle.queries.listEvents, {})).find((r) => r._id === id)?.title,
    want: "Gala VIP",
  },
  {
    name: "lifestyle.updateReservation",
    create: (as) =>
      as.mutation(m.lifestyle.mutations.createReservation, { emoji: "🍽️", label: "Makan malam" }),
    update: (as, id, cas) =>
      as.mutation(m.lifestyle.mutations.updateReservation, {
        id: id as Id<"conciergeReservations">, label: "Brunch", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.lifestyle.queries.listReservations, {})).find((r) => r._id === id)?.label,
    want: "Brunch",
  },
  {
    name: "kesehatan.updateSchedule",
    create: (as) =>
      as.mutation(m.kesehatan.mutations.createSchedule, {
        date: "20 Jun", title: "Medical check-up", location: "RS Konglo",
        color: "var(--color-gold)",
      }),
    update: (as, id, cas) =>
      as.mutation(m.kesehatan.mutations.updateSchedule, {
        id: id as Id<"healthSchedule">, title: "Vaksinasi", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.kesehatan.queries.listSchedule, {})).find((r) => r._id === id)?.title,
    want: "Vaksinasi",
  },
  {
    name: "kesehatan.updateMedicalTeam",
    create: (as) =>
      as.mutation(m.kesehatan.mutations.createMedicalTeam, {
        name: "Dr. Sari", role: "Dokter Pribadi", color: "var(--color-gold)",
      }),
    update: (as, id, cas) =>
      as.mutation(m.kesehatan.mutations.updateMedicalTeam, {
        id: id as Id<"healthMedicalTeam">, role: "Spesialis Saraf", ...cas,
      }),
    fetch: async (as, id) =>
      (await as.query(m.kesehatan.queries.listMedicalTeam, {})).find((r) => r._id === id)?.role,
    want: "Spesialis Saraf",
  },
];

describe.each(ROWS)("$name — optimistic version lock", (row) => {
  const slug = row.name.replace(/[^a-z]/gi, "").toLowerCase();
  const setup = async () => {
    const t = makeT();
    const as = await seedUser(t, "principal", `v-${slug}@mail.com`);
    const id = (await row.create(as)) as string;
    return { t, as, id };
  };

  it("create seeds version 1", async () => {
    const { t, id } = await setup();
    expect(await versionOf(t, id)).toBe(1);
  });

  it("STALE expectedVersion is rejected with /conflict/; row untouched", async () => {
    const { t, as, id } = await setup();
    await expect(row.update(as, id, { expectedVersion: 0 })).rejects.toThrow(/conflict/);
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds, bumps version, patch lands", async () => {
    const { t, as, id } = await setup();
    await row.update(as, id, { expectedVersion: 1 });
    expect(await versionOf(t, id)).toBe(2);
    if (row.fetch) expect(await row.fetch(as, id)).toBe(row.want);
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const { t, as, id } = await setup();
    await row.update(as, id, {});
    expect(await versionOf(t, id)).toBe(2);
  });
});
