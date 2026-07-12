import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

// Same module-glob convention as authz.test.ts: convex-test resolves the
// function-module root by splitting a matched path on "_generated", so the glob
// MUST reach into convex/_generated (it does via ../../convex/**).
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);

function makeT() {
  return convexTest(schema, modules);
}

// @convex-dev/auth's getAuthUserId returns identity.subject.split("|")[0], so an
// identity whose subject is `<userId>|<session>` authenticates AS that user row.
// activity fns are requireUser-only (no role gate), so we don't need a roles row.
async function seedUser(t: ReturnType<typeof convexTest>, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return { as: t.withIdentity({ subject: `${userId}|testsession` }), userId };
}

// --- SECURITY: activity.recent is scoped per-user. The pre-fix by_at index
// streamed every user's rows to anyone authed (a staf bell leaking principal/cfo
// labels + free-form meta). by_user must fence each caller to their own rows. ---
describe("activity.recent — per-user scoping (no cross-user disclosure)", () => {
  it("user A cannot see user B's rows", async () => {
    const t = makeT();
    const { as: asA } = await seedUser(t, "a@mail.com");
    const { as: asB } = await seedUser(t, "b@mail.com");

    await asA.mutation(api.features.activity.mutations.log, {
      label: "A-action",
      meta: "a-secret",
    });
    await asB.mutation(api.features.activity.mutations.log, {
      label: "B-action",
      meta: "b-secret",
    });

    const aRows = await asA.query(api.features.activity.queries.recent, {});
    const bRows = await asB.query(api.features.activity.queries.recent, {});

    // Each caller sees ONLY their own row — no leakage of the other's label/meta.
    expect(aRows.map((r) => r.label)).toEqual(["A-action"]);
    expect(bRows.map((r) => r.label)).toEqual(["B-action"]);
    expect(aRows.some((r) => r.label === "B-action" || r.meta === "b-secret")).toBe(
      false,
    );
    expect(bRows.some((r) => r.label === "A-action" || r.meta === "a-secret")).toBe(
      false,
    );
  });

  it("returns rows newest-first and respects the limit cap", async () => {
    const t = makeT();
    const { as: asA } = await seedUser(t, "order@mail.com");
    await asA.mutation(api.features.activity.mutations.log, { label: "first" });
    await asA.mutation(api.features.activity.mutations.log, { label: "second" });
    const rows = await asA.query(api.features.activity.queries.recent, {
      limit: 1,
    });
    // limit honored AND ordering is desc (newest-first) → "second".
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("second");
  });

  it("recent is Unauthorized when signed out", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.activity.queries.recent, {}),
    ).rejects.toThrow(/Unauthorized/);
  });
});

// --- activity.log requires a user, and on the happy path a real audit row IS
// written. The handler swallows insert failures in a try/catch (audit must never
// break the user action it accompanies) — this guards against a regression that
// silently drops EVERY audit row while still "passing" the void contract. -------
describe("activity.log — auth gate + audit row is actually written", () => {
  it("log is Unauthorized when signed out", async () => {
    const t = makeT();
    await expect(
      t.mutation(api.features.activity.mutations.log, { label: "x" }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("a normal log writes exactly one row for the caller (catch did not eat it)", async () => {
    const t = makeT();
    const { as: asA, userId } = await seedUser(t, "writer@mail.com");
    await asA.mutation(api.features.activity.mutations.log, {
      label: "did-thing",
      meta: "details",
    });
    const stored = await t.run(async (ctx) =>
      ctx.db
        .query("activity")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].label).toBe("did-thing");
    expect(stored[0].meta).toBe("details");
    expect(stored[0].userId).toBe(userId);
  });

  it("omitted meta defaults to empty string (row still written)", async () => {
    const t = makeT();
    const { as: asA, userId } = await seedUser(t, "nometa@mail.com");
    await asA.mutation(api.features.activity.mutations.log, { label: "no-meta" });
    const stored = await t.run(async (ctx) =>
      ctx.db
        .query("activity")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].meta).toBe("");
  });
});
