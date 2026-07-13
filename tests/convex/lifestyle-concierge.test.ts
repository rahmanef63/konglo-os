import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import { makeT, seedUser } from "./_harness";

// Mirrors grants-events.test.ts: same glob + impersonation helpers.
// "hiburan-gaya-hidup" is absent from BOTH cfo's and staf's ROLE_MENU, so the
// concierge writes are principal-only — cfo and staf are blocked at the READ
// gate inside requireFeatureWrite, before the elevated-role check.

const reservation = { emoji: "✈️", label: "Private Jet" };
const request = { label: "Reservasi yacht akhir pekan" };

// --- conciergeReservations: principal-only WRITE gate. -----------------------
describe("lifestyle.mutations — WRITE gate (conciergeReservations)", () => {
  it("createReservation: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "res-staf@mail.com");
    await expect(
      asStaf.mutation(
        api.features.lifestyle.mutations.createReservation,
        reservation,
      ),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createReservation: cfo is Forbidden (hiburan-gaya-hidup not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "res-cfo@mail.com");
    await expect(
      asCfo.mutation(
        api.features.lifestyle.mutations.createReservation,
        reservation,
      ),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createReservation: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-prin@mail.com");
    await expect(
      asPrincipal.mutation(
        api.features.lifestyle.mutations.createReservation,
        reservation,
      ),
    ).resolves.toBeDefined();
  });

  it("createReservation appends at the next order; updateReservation rejects a bad order", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-order@mail.com");
    const first = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    const second = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      { emoji: "🛥️", label: "Yacht" },
    );
    const firstRow = await t.run((ctx) => ctx.db.get(first));
    const secondRow = await t.run((ctx) => ctx.db.get(second));
    expect(firstRow?.order).toBe(1);
    expect(secondRow?.order).toBe(2);
    // A non-integer / negative order must be rejected by the numeric guard.
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateReservation, {
        id: first,
        order: -3,
      }),
    ).rejects.toThrow(/order/);
  });

  it("happy path: principal creates then updates a reservation", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-happy@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    // A void mutation handler resolves to null over the wire, not undefined.
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateReservation, {
        id,
        emoji: "🛩️",
        label: "Private Jet — Gulfstream",
      }),
    ).resolves.toBeNull();
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.emoji).toBe("🛩️");
    expect(row?.label).toBe("Private Jet — Gulfstream");
  });
});

// --- conciergeRequests: principal-only WRITE gate. ---------------------------
describe("lifestyle.mutations — WRITE gate (conciergeRequests)", () => {
  it("createRequest: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "req-staf@mail.com");
    await expect(
      asStaf.mutation(api.features.lifestyle.mutations.createRequest, request),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createRequest: cfo is Forbidden (hiburan-gaya-hidup not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "req-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.lifestyle.mutations.createRequest, request),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createRequest: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "req-prin@mail.com");
    await expect(
      asPrincipal.mutation(
        api.features.lifestyle.mutations.createRequest,
        request,
      ),
    ).resolves.toBeDefined();
  });

  it("happy path: principal creates a request", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "req-happy@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    );
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.label).toBe(request.label);
  });
});

// --- removeReservation: principal-only delete + survives a stale CAS. ----------
// removeReservation takes only { id }; the CAS-conflict case runs on
// updateReservation (stale expectedVersion → /conflict/, the row survives).
describe("lifestyle.removeReservation — auth gate + CAS survival", () => {
  it("staf is Forbidden; the reservation survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "res-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    await expect(
      asStaf.mutation(api.features.lifestyle.mutations.removeReservation, {
        id,
      }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden; the reservation survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "res-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    await expect(
      asCfo.mutation(api.features.lifestyle.mutations.removeReservation, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the reservation survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    await expect(
      t.mutation(api.features.lifestyle.mutations.removeReservation, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the reservation (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    await expect(
      asPrincipal.mutation(
        api.features.lifestyle.mutations.removeReservation,
        { id },
      ),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on updateReservation; the row survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "res-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createReservation,
      reservation,
    );
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.updateReservation, {
        id,
        label: "Should not land",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.label).toBe("Private Jet"); // untouched by the rejected write
  });
});

// --- removeRequest: principal-only delete + survives a stale CAS. --------------
// removeRequest takes only { id }; the CAS-conflict case runs on updateRequest.
describe("lifestyle.removeRequest — auth gate + CAS survival", () => {
  it("staf is Forbidden; the request survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "req-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "req-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    );
    await expect(
      asStaf.mutation(api.features.lifestyle.mutations.removeRequest, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden; the request survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "req-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "req-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    );
    await expect(
      asCfo.mutation(api.features.lifestyle.mutations.removeRequest, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the request survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "req-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    );
    await expect(
      t.mutation(api.features.lifestyle.mutations.removeRequest, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the request (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "req-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.lifestyle.mutations.createRequest,
      request,
    );
    await expect(
      asPrincipal.mutation(api.features.lifestyle.mutations.removeRequest, {
        id,
      }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });
});
