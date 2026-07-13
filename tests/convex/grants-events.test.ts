import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import { makeT, seedUser } from "./_harness";

// Mirrors authz.test.ts: same glob + impersonation helpers. filantropi and
// hiburan-gaya-hidup are BOTH absent from cfo's ROLE_MENU, so their writes are
// principal-only — cfo is blocked at the READ gate inside requireFeatureWrite.

const grant = {
  name: "Beasiswa Nusantara",
  category: "Pendidikan",
  amount: "Rp 500 M",
  progress: 30,
  color: "var(--color-mk-blue)",
  beneficiaries: "5.000 siswa",
  region: "Nasional",
  partner: "Kemendikbud",
};

const event = {
  date: "20 Mei",
  title: "Konser Amal",
  location: "JCC · gala",
  color: "var(--color-mk-purple)",
};

// --- filantropi.createGrant: principal-only (filantropi not in cfo menu). ------
describe("filantropi.mutations — WRITE gate (philanthropyGrants)", () => {
  it("createGrant: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "fil-staf@mail.com");
    await expect(
      asStaf.mutation(api.features.filantropi.mutations.createGrant, grant),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createGrant: cfo is Forbidden (filantropi not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "fil-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.filantropi.mutations.createGrant, grant),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createGrant: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-prin@mail.com");
    await expect(
      asPrincipal.mutation(api.features.filantropi.mutations.createGrant, grant),
    ).resolves.toBeDefined();
  });

  it("createGrant rejects a non-finite / out-of-range progress", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-prog@mail.com");
    await expect(
      asPrincipal.mutation(api.features.filantropi.mutations.createGrant, {
        ...grant,
        progress: 150,
      }),
    ).rejects.toThrow(/progress/);
  });

  it("happy path: principal creates then updates a grant", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-happy@mail.com");
    const id = await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    );
    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asPrincipal.mutation(api.features.filantropi.mutations.updateGrant, {
        id,
        progress: 90,
        name: "Beasiswa Nusantara II",
      }),
    ).resolves.toBeNull();
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.progress).toBe(90);
    expect(row?.name).toBe("Beasiswa Nusantara II");
  });
});

// --- filantropi.removeGrant: principal-only delete + survives a stale CAS. -----
// removeGrant itself takes only { id } (no expectedVersion), so the CAS-conflict
// case is exercised on updateGrant — a stale expectedVersion throws /conflict/
// and the grant row must survive the rejected write.
describe("filantropi.removeGrant — auth gate + CAS survival", () => {
  it("staf is Forbidden; the grant survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "fil-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    );
    await expect(
      asStaf.mutation(api.features.filantropi.mutations.removeGrant, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden (filantropi not in cfo menu); the grant survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "fil-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    );
    await expect(
      asCfo.mutation(api.features.filantropi.mutations.removeGrant, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the grant survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    );
    await expect(
      t.mutation(api.features.filantropi.mutations.removeGrant, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the grant (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    );
    await expect(
      asPrincipal.mutation(api.features.filantropi.mutations.removeGrant, {
        id,
      }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on updateGrant; the grant survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "fil-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.filantropi.mutations.createGrant,
      grant,
    );
    // create writes version: 1, so expectedVersion 0 is stale → conflict.
    await expect(
      asPrincipal.mutation(api.features.filantropi.mutations.updateGrant, {
        id,
        progress: 99,
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.progress).toBe(30); // untouched by the rejected write
  });
});

// --- lifestyle.createEvent: principal-only (hiburan-gaya-hidup not in cfo menu).
describe("lifestyle.mutations — WRITE gate (lifestyleEvents)", () => {
  it("createEvent: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "evt-staf@mail.com");
    await expect(
      asStaf.mutation(api.features.lifestyle.mutations.createEvent, event),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createEvent: cfo is Forbidden (hiburan-gaya-hidup not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "evt-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.lifestyle.mutations.createEvent, event),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createEvent: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-prin@mail.com");
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.createEvent, event),
    ).resolves.toBeDefined();
  });

  it("happy path: principal creates then updates an event", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-happy@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    );
    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateEvent, {
        id,
        title: "Konser Amal Akbar",
        location: "GBK · gala",
      }),
    ).resolves.toBeNull();
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.title).toBe("Konser Amal Akbar");
    expect(row?.location).toBe("GBK · gala");
  });
});

// --- lifestyle.removeEvent: principal-only delete + survives a stale CAS. -------
// removeEvent takes only { id }; the CAS-conflict case runs on updateEvent.
describe("lifestyle.removeEvent — auth gate + CAS survival", () => {
  it("staf is Forbidden; the event survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "evt-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    );
    await expect(
      asStaf.mutation(api.features.lifestyle.mutations.removeEvent, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden; the event survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "evt-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    );
    await expect(
      asCfo.mutation(api.features.lifestyle.mutations.removeEvent, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the event survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    );
    await expect(
      t.mutation(api.features.lifestyle.mutations.removeEvent, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the event (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    );
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.removeEvent, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on updateEvent; the event survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "evt-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createEvent,
      event,
    );
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateEvent, {
        id,
        title: "Should not land",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.title).toBe("Konser Amal"); // untouched by the rejected write
  });
});
