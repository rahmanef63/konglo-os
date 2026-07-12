import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Mirrors tests/convex/authz.test.ts harness: glob reaches convex/_generated so
// convex-test resolves the function-module root; impersonation via subject.
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

// Seed one heir row directly so update/remove have a REAL id for the principal
// (positive) path. Returns the inserted id.
async function seedHeir(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) =>
    ctx.db.insert("heirs", {
      name: "Andra W.",
      role: "Putra",
      share: "28%",
      readiness: 86,
      color: "var(--color-mk-blue)",
      age: "38 th",
      next: "Pelatihan dewan",
      mandate: "Energi",
      order: 0,
    }),
  );
}

const heir = {
  name: "Putra",
  role: "Penerus",
  share: "30%",
  readiness: 40,
  age: "24",
  next: "MBA",
  mandate: "Operasi",
};

// --- Succession is PRINCIPAL-ONLY (SEC-001): cfo holds data-studio but must
// never write heirs; staf has nothing. Every heirs mutation gates on
// requirePrincipal, so the rejection message is the principal-only one. --------
describe("family.mutations — heirs is principal-only succession data", () => {
  describe("createHeir", () => {
    it("staf is Forbidden", async () => {
      const t = makeT();
      const asStaf = await seedUser(t, "staf", "h-staf-c@mail.com");
      await expect(
        asStaf.mutation(api.features.family.mutations.createHeir, heir),
      ).rejects.toThrow(/Forbidden: principal only/);
    });

    it("cfo is Forbidden (data-studio is not a back door)", async () => {
      const t = makeT();
      const asCfo = await seedUser(t, "cfo", "h-cfo-c@mail.com");
      await expect(
        asCfo.mutation(api.features.family.mutations.createHeir, heir),
      ).rejects.toThrow(/Forbidden: principal only/);
    });

    it("principal is allowed", async () => {
      const t = makeT();
      const asPrincipal = await seedUser(t, "principal", "h-prin-c@mail.com");
      await expect(
        asPrincipal.mutation(api.features.family.mutations.createHeir, heir),
      ).resolves.toBeDefined();
    });

    it("rejects an out-of-range share (>100), even for principal", async () => {
      const t = makeT();
      const asPrincipal = await seedUser(t, "principal", "h-prin-bad@mail.com");
      await expect(
        asPrincipal.mutation(api.features.family.mutations.createHeir, {
          ...heir,
          share: "150%",
        }),
      ).rejects.toThrow(/Invalid share/);
    });

    it("rejects a negative share, even for principal", async () => {
      const t = makeT();
      const asPrincipal = await seedUser(t, "principal", "h-prin-neg@mail.com");
      await expect(
        asPrincipal.mutation(api.features.family.mutations.createHeir, {
          ...heir,
          share: "-5%",
        }),
      ).rejects.toThrow(/Invalid share/);
    });
  });

  describe("updateHeir", () => {
    // A REAL id is used so the v.id("heirs") arg validator passes; the rejection
    // is then genuinely requirePrincipal (the row is never patched for cfo/staf).
    it("staf is Forbidden", async () => {
      const t = makeT();
      const asStaf = await seedUser(t, "staf", "h-staf-u@mail.com");
      const id = await seedHeir(t);
      await expect(
        asStaf.mutation(api.features.family.mutations.updateHeir, {
          id,
          share: "99%",
        }),
      ).rejects.toThrow(/Forbidden: principal only/);
    });

    it("cfo is Forbidden", async () => {
      const t = makeT();
      const asCfo = await seedUser(t, "cfo", "h-cfo-u@mail.com");
      const id = await seedHeir(t);
      await expect(
        asCfo.mutation(api.features.family.mutations.updateHeir, {
          id,
          share: "99%",
        }),
      ).rejects.toThrow(/Forbidden: principal only/);
    });

    it("principal is allowed (patches a real row)", async () => {
      const t = makeT();
      const asPrincipal = await seedUser(t, "principal", "h-prin-u@mail.com");
      const id = await seedHeir(t);
      // void handler resolves to null over the wire.
      await expect(
        asPrincipal.mutation(api.features.family.mutations.updateHeir, {
          id,
          readiness: 90,
        }),
      ).resolves.toBeNull();
    });

    it("rejects an out-of-range share on update, even for principal", async () => {
      const t = makeT();
      const asPrincipal = await seedUser(t, "principal", "h-prin-ubad@mail.com");
      const id = await seedHeir(t);
      await expect(
        asPrincipal.mutation(api.features.family.mutations.updateHeir, {
          id,
          share: "200%",
        }),
      ).rejects.toThrow(/Invalid share/);
    });
  });

  describe("removeHeir", () => {
    it("staf is Forbidden", async () => {
      const t = makeT();
      const asStaf = await seedUser(t, "staf", "h-staf-d@mail.com");
      const id = await seedHeir(t);
      await expect(
        asStaf.mutation(api.features.family.mutations.removeHeir, { id }),
      ).rejects.toThrow(/Forbidden: principal only/);
    });

    it("cfo is Forbidden", async () => {
      const t = makeT();
      const asCfo = await seedUser(t, "cfo", "h-cfo-d@mail.com");
      const id = await seedHeir(t);
      await expect(
        asCfo.mutation(api.features.family.mutations.removeHeir, { id }),
      ).rejects.toThrow(/Forbidden: principal only/);
    });

    it("principal is allowed (deletes a real row)", async () => {
      const t = makeT();
      const asPrincipal = await seedUser(t, "principal", "h-prin-d@mail.com");
      const id = await seedHeir(t);
      // void handler resolves to null over the wire.
      await expect(
        asPrincipal.mutation(api.features.family.mutations.removeHeir, { id }),
      ).resolves.toBeNull();
    });
  });
});
