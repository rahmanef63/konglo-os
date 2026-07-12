import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Mirrors grants-events.test.ts harness. "relasi-jaringan" is absent from BOTH
// cfo's and staf's ROLE_MENU (lib/roles.ts), so every contacts write is
// principal-only — cfo and staf are blocked at the READ gate inside
// requireFeatureWrite, before the elevated-role check.

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

const contact = {
  name: "Andi Wirawan",
  role: "Mitra Strategis",
  tier: "Lingkar Dalam",
  warmth: "Hangat",
  last: "2 hari lalu",
};

// --- contacts.create: principal-only (relasi-jaringan not in cfo/staf menu). ---
describe("contacts.mutations — WRITE gate (contacts)", () => {
  it("create: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "con-staf@mail.com");
    await expect(
      asStaf.mutation(api.features.contacts.mutations.create, contact),
    ).rejects.toThrow(/Forbidden/);
  });

  it("create: cfo is Forbidden (relasi-jaringan not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "con-cfo@mail.com");
    await expect(
      asCfo.mutation(api.features.contacts.mutations.create, contact),
    ).rejects.toThrow(/Forbidden/);
  });

  it("create: principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "con-prin@mail.com");
    await expect(
      asPrincipal.mutation(api.features.contacts.mutations.create, contact),
    ).resolves.toBeDefined();
  });
});

// --- contacts.remove: principal-only delete + survives a stale CAS. -----------
// remove takes only { id }; the CAS-conflict case runs on update (stale
// expectedVersion → /conflict/, the contact survives).
describe("contacts.remove — auth gate + CAS survival", () => {
  it("staf is Forbidden; the contact survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "con-rm-seed@mail.com");
    const asStaf = await seedUser(t, "staf", "con-rm-staf@mail.com");
    const id = await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    );
    await expect(
      asStaf.mutation(api.features.contacts.mutations.remove, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("cfo is Forbidden; the contact survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "con-rm-seed2@mail.com");
    const asCfo = await seedUser(t, "cfo", "con-rm-cfo@mail.com");
    const id = await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    );
    await expect(
      asCfo.mutation(api.features.contacts.mutations.remove, { id }),
    ).rejects.toThrow(/Forbidden/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("signed out is Unauthorized; the contact survives", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "con-rm-seed3@mail.com");
    const id = await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    );
    await expect(
      t.mutation(api.features.contacts.mutations.remove, { id }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  it("principal removes the contact (row gone)", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "con-rm-prin@mail.com");
    const id = await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    );
    await expect(
      asPrincipal.mutation(api.features.contacts.mutations.remove, { id }),
    ).resolves.toBeNull();
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("stale expectedVersion conflicts on update; the contact survives unchanged", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "con-rm-cas@mail.com");
    const id = await asPrincipal.mutation(
      api.features.contacts.mutations.create,
      contact,
    );
    await expect(
      asPrincipal.mutation(api.features.contacts.mutations.update, {
        id,
        warmth: "Dingin",
        expectedVersion: 0,
      }),
    ).rejects.toThrow(/conflict/);
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).not.toBeNull();
    expect(row?.warmth).toBe("Hangat"); // untouched by the rejected write
  });
});
