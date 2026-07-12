import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Id } from "../../convex/_generated/dataModel";

// Scoped type for Vite's import.meta.glob (vite/client types aren't in tsconfig).
// Same local shim as authz.test.ts — kept local so it never leaks globally.
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}

// convex-test resolves the function-module root from these paths; the glob MUST
// reach into convex/_generated (it splits a matched path on "_generated").
// Same pattern as authz.test.ts — auto-includes every feature module.
const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);

function makeT() {
  return convexTest(schema, modules);
}
// Schema-bound instance type — keeps ctx.db typed to OUR tables (so the roles
// by_user index resolves) instead of falling back to the system-table surface.
type TestT = ReturnType<typeof makeT>;

// Insert a real users doc and impersonate via subject (getAuthUserId returns
// identity.subject.split("|")[0]). Returns the impersonated client + the userId.
async function seedUser(t: TestT, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return { as: t.withIdentity({ subject: `${userId}|testsession` }), userId };
}

// Count the roles rows for a user via the by_user index.
async function roleRows(t: TestT, userId: Id<"users">) {
  return t.run(async (ctx) =>
    ctx.db
      .query("roles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect(),
  );
}

// --- claimRole: exactly one row, idempotent, heals pre-existing duplicates. ----
describe("rbac.claimRole — roles-table uniqueness (race / repeat)", () => {
  it("calling claimRole twice leaves exactly ONE row", async () => {
    const t = makeT();
    const { as, userId } = await seedUser(t, "claim-twice@mail.com");
    // Pre-grant a role (as the allowlist / principal would) so claimRole exercises
    // its de-dupe path — the invariant under test is that it never creates a
    // SECOND row, independent of how the first was granted.
    await t.run(async (ctx) => ctx.db.insert("roles", { userId, role: "staf" }));
    await as.mutation(api.features.rbac.mutations.claimRole, {});
    await as.mutation(api.features.rbac.mutations.claimRole, {});
    const rows = await roleRows(t, userId);
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe("staf");
  });

  it("is idempotent — second claim returns the same tier, never duplicates", async () => {
    const t = makeT();
    const { as, userId } = await seedUser(t, "claim-idem@mail.com");
    await t.run(async (ctx) => ctx.db.insert("roles", { userId, role: "staf" }));
    const first = await as.mutation(api.features.rbac.mutations.claimRole, {});
    const second = await as.mutation(api.features.rbac.mutations.claimRole, {});
    expect(first).toBe("staf");
    expect(second).toBe("staf");
  });

  it("grants NO role to a non-allowlisted new user (OAuth can't self-become staf)", async () => {
    const t = makeT();
    // A stranger's Google login: not the default principal, not in KONGLO_ALLOWLIST.
    const { as, userId } = await seedUser(t, "stranger@gmail.com");
    const out = await as.mutation(api.features.rbac.mutations.claimRole, {});
    expect(out).toBeNull();
    expect(await roleRows(t, userId)).toHaveLength(0);
  });

  it("never downgrades an already-elevated user back to staf", async () => {
    const t = makeT();
    const { as, userId } = await seedUser(t, "claim-keep@mail.com");
    // Simulate a seeded cfo (elevated tier already present).
    await t.run(async (ctx) =>
      ctx.db.insert("roles", { userId, role: "cfo" }),
    );
    const out = await as.mutation(api.features.rbac.mutations.claimRole, {});
    expect(out).toBe("cfo");
    const rows = await roleRows(t, userId);
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe("cfo");
  });

  it("collapses PRE-EXISTING duplicate rows (past race) down to one", async () => {
    const t = makeT();
    const { as, userId } = await seedUser(t, "claim-dupes@mail.com");
    // Two rows already exist for one user — the exact corruption resolveRole()
    // reads .first() against (nondeterministic tier).
    await t.run(async (ctx) => {
      await ctx.db.insert("roles", { userId, role: "staf" });
      await ctx.db.insert("roles", { userId, role: "cfo" });
    });
    expect(await roleRows(t, userId)).toHaveLength(2);
    await as.mutation(api.features.rbac.mutations.claimRole, {});
    const rows = await roleRows(t, userId);
    expect(rows).toHaveLength(1);
  });
});

// --- setRole: exactly one row, latest tier wins, SEC-001 invariants intact. ----
describe("rbac.setRole — roles-table uniqueness + SEC-001 invariants", () => {
  it("re-tiering a user repeatedly leaves exactly ONE row, latest tier wins", async () => {
    const t = makeT();
    const { userId: prinId } = await seedUser(t, "sr-prin@mail.com");
    await t.run(async (ctx) =>
      ctx.db.insert("roles", { userId: prinId, role: "principal" }),
    );
    const asPrincipal = t.withIdentity({ subject: `${prinId}|testsession` });
    const { userId: targetId } = await seedUser(t, "sr-target@mail.com");

    await asPrincipal.mutation(api.features.rbac.mutations.setRole, {
      userId: targetId,
      role: "staf",
    });
    await asPrincipal.mutation(api.features.rbac.mutations.setRole, {
      userId: targetId,
      role: "cfo",
    });
    const rows = await roleRows(t, targetId);
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe("cfo"); // latest tier wins
  });

  it("collapses PRE-EXISTING duplicate target rows to one on the next setRole", async () => {
    const t = makeT();
    const { userId: prinId } = await seedUser(t, "sr-prin2@mail.com");
    await t.run(async (ctx) =>
      ctx.db.insert("roles", { userId: prinId, role: "principal" }),
    );
    const asPrincipal = t.withIdentity({ subject: `${prinId}|testsession` });
    const { userId: targetId } = await seedUser(t, "sr-target2@mail.com");
    // Pre-existing duplicate rows for the target (past race).
    await t.run(async (ctx) => {
      await ctx.db.insert("roles", { userId: targetId, role: "staf" });
      await ctx.db.insert("roles", { userId: targetId, role: "staf" });
    });
    expect(await roleRows(t, targetId)).toHaveLength(2);

    await asPrincipal.mutation(api.features.rbac.mutations.setRole, {
      userId: targetId,
      role: "cfo",
    });
    const rows = await roleRows(t, targetId);
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe("cfo");
  });

  // SEC-001 invariants must survive the de-dupe rewrite.
  it("still rejects self-target (lock-out guard)", async () => {
    const t = makeT();
    const { userId: prinId } = await seedUser(t, "sr-self@mail.com");
    await t.run(async (ctx) =>
      ctx.db.insert("roles", { userId: prinId, role: "principal" }),
    );
    const asPrincipal = t.withIdentity({ subject: `${prinId}|testsession` });
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: prinId,
        role: "cfo",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("still rejects granting 'principal' (seed-only)", async () => {
    const t = makeT();
    const { userId: prinId } = await seedUser(t, "sr-grant@mail.com");
    await t.run(async (ctx) =>
      ctx.db.insert("roles", { userId: prinId, role: "principal" }),
    );
    const asPrincipal = t.withIdentity({ subject: `${prinId}|testsession` });
    const { userId: targetId } = await seedUser(t, "sr-grant-target@mail.com");
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "principal",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("still requires principal (cfo is Forbidden — requirePrincipal)", async () => {
    const t = makeT();
    const { userId: cfoId } = await seedUser(t, "sr-cfo@mail.com");
    await t.run(async (ctx) =>
      ctx.db.insert("roles", { userId: cfoId, role: "cfo" }),
    );
    const asCfo = t.withIdentity({ subject: `${cfoId}|testsession` });
    const { userId: targetId } = await seedUser(t, "sr-cfo-target@mail.com");
    await expect(
      asCfo.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "cfo",
      }),
    ).rejects.toThrow(/Forbidden/);
  });
});
