import { describe, it, expect } from "vitest";
import { internal } from "../../convex/_generated/api";
import { makeT } from "./_harness";

// seed.runInternal is the ONLY seed entry point (CLI `convex run seed:runInternal`;
// the frontend never auto-seeds — real users start empty). Locks the contract that
// seeding is idempotent: re-running must be a no-op, never a duplicate or a throw.
describe("seed.runInternal — CLI bootstrap", () => {
  it("seeds and is idempotent (safe to re-run)", async () => {
    const t = makeT();
    await t.mutation(internal.seed.runInternal, {});
    const first = await t.run(async (ctx) => ({
      subs: (await ctx.db.query("subsidiaries").take(100)).length,
      grants: (await ctx.db.query("philanthropyGrants").take(100)).length,
    }));
    expect(first.subs).toBeGreaterThan(0);
    await t.mutation(internal.seed.runInternal, {});
    const second = await t.run(async (ctx) => ({
      subs: (await ctx.db.query("subsidiaries").take(100)).length,
      grants: (await ctx.db.query("philanthropyGrants").take(100)).length,
    }));
    expect(second).toEqual(first);
  });
});
