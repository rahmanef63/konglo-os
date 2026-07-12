import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Mirrors grants-events.test.ts. "kesehatan" is absent from BOTH cfo's and
// staf's ROLE_MENU, so every write is principal-only — cfo and staf are blocked
// at the READ gate inside requireFeatureWrite. Covers healthSchedule and
// healthMedicalTeam: the WRITE gate (staf/cfo Forbidden, principal passes), a
// create→update happy path, and a bad-numeric (negative order) rejection.

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

const schedule = {
  date: "12 Jun",
  title: "Medical Check-up",
  location: "RS Pondok Indah · executive",
  color: "var(--color-mk-green)",
};

const member = {
  name: "dr. Andini Pratama",
  role: "Concierge Physician",
  color: "var(--color-mk-blue)",
};

// --- kesehatan.createSchedule: principal-only (kesehatan not in cfo/staf menu).
describe("kesehatan.mutations — WRITE gate (healthSchedule)", () => {
  it("createSchedule: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "hs-staf@mail.com");
    await expect(
      asStaf.mutation(api.features.kesehatan.mutations.createSchedule, schedule),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createSchedule: cfo is Forbidden (kesehatan not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "hs-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.kesehatan.mutations.createSchedule, schedule),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createSchedule: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-prin@mail.com");
    await expect(
      asPrincipal.mutation(
        api.features.kesehatan.mutations.createSchedule,
        schedule,
      ),
    ).resolves.toBeDefined();
  });

  it("createSchedule rejects a non-finite / negative order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-order@mail.com");
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.createSchedule, {
        ...schedule,
        order: -1,
      }),
    ).rejects.toThrow(/order/);
  });

  it("happy path: principal creates then updates a schedule", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-happy@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    );
    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.updateSchedule, {
        id,
        title: "Annual Cardiology Review",
        location: "Mount Elizabeth · suite",
      }),
    ).resolves.toBeNull();
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.title).toBe("Annual Cardiology Review");
    expect(row?.location).toBe("Mount Elizabeth · suite");
  });
});

// --- kesehatan.createMedicalTeam: principal-only (same gate as schedule). ------
describe("kesehatan.mutations — WRITE gate (healthMedicalTeam)", () => {
  it("createMedicalTeam: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "hm-staf@mail.com");
    await expect(
      asStaf.mutation(
        api.features.kesehatan.mutations.createMedicalTeam,
        member,
      ),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createMedicalTeam: cfo is Forbidden (kesehatan not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "hm-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.kesehatan.mutations.createMedicalTeam, member),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createMedicalTeam: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-prin@mail.com");
    await expect(
      asPrincipal.mutation(
        api.features.kesehatan.mutations.createMedicalTeam,
        member,
      ),
    ).resolves.toBeDefined();
  });

  it("createMedicalTeam rejects a non-finite / negative order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-order@mail.com");
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.createMedicalTeam, {
        ...member,
        order: Number.NaN,
      }),
    ).rejects.toThrow(/order/);
  });

  it("happy path: principal creates then updates a team member", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-happy@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    );
    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.updateMedicalTeam, {
        id,
        name: "dr. Andini Pratama, Sp.JP",
        role: "Lead Cardiologist",
      }),
    ).resolves.toBeNull();
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.name).toBe("dr. Andini Pratama, Sp.JP");
    expect(row?.role).toBe("Lead Cardiologist");
  });
});

// --- removeSchedule: principal-only delete + survives a stale CAS. -------------
// removeSchedule takes only { id }; the CAS-conflict case runs on updateSchedule
// (stale expectedVersion → /conflict/, the schedule row survives).
describe("kesehatan.removeSchedule — auth gate + CAS survival", () => {
  it("staf is Forbidden; the schedule survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "hs-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    );
    await expect(
      asStaf.mutation(api.features.kesehatan.mutations.removeSchedule, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden (kesehatan not in cfo menu); the schedule survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "hs-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    );
    await expect(
      asCfo.mutation(api.features.kesehatan.mutations.removeSchedule, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the schedule survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    );
    await expect(
      t.mutation(api.features.kesehatan.mutations.removeSchedule, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the schedule (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    );
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.removeSchedule, {
        id,
      }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on updateSchedule; the schedule survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hs-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createSchedule,
      schedule,
    );
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.updateSchedule, {
        id,
        title: "Should not land",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.title).toBe("Medical Check-up"); // untouched by the rejected write
  });
});

// --- removeMedicalTeam: principal-only delete + survives a stale CAS. ----------
// removeMedicalTeam takes only { id }; the CAS case runs on updateMedicalTeam.
describe("kesehatan.removeMedicalTeam — auth gate + CAS survival", () => {
  it("staf is Forbidden; the team member survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "hm-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    );
    await expect(
      asStaf.mutation(api.features.kesehatan.mutations.removeMedicalTeam, {
        id,
      }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden; the team member survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "hm-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    );
    await expect(
      asCfo.mutation(api.features.kesehatan.mutations.removeMedicalTeam, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the team member survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    );
    await expect(
      t.mutation(api.features.kesehatan.mutations.removeMedicalTeam, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the team member (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    );
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.removeMedicalTeam, {
        id,
      }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on updateMedicalTeam; the member survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "hm-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.kesehatan.mutations.createMedicalTeam,
      member,
    );
    await expect(
      asPrincipal.mutation(api.features.kesehatan.mutations.updateMedicalTeam, {
        id,
        role: "Should not land",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.role).toBe("Concierge Physician"); // untouched
  });
});
