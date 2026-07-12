import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// seed.run is the on-first-load data populator, gated by requireAdmin (seed.ts:118).
// useOsBootstrap now only fires it for principal|cfo — but this locks the SERVER
// contract that backs that gate: a non-elevated caller must be rejected, never
// allowed to populate the estate tables. It was untested (seed.run ran in zero
// tests), which is exactly the gap that let a staf first-load throw an unhandled
// rejection before useOsBootstrap was role-gated (KONG-1).
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

describe("seed.run — admin-gated bootstrap (KONG-1 root contract)", () => {
  it("a staf caller is Forbidden (never populates)", async () => {
    const t = convexTest(schema, modules);
    const asStaf = await seedUser(t, "staf", "seed-staf@mail.com");
    await expect(asStaf.mutation(api.seed.run, {})).rejects.toThrow(/Forbidden/);
  });

  it("an unauthenticated caller is rejected", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.seed.run, {})).rejects.toThrow();
  });

  it("a principal succeeds and is idempotent (safe to re-run every load)", async () => {
    const t = convexTest(schema, modules);
    const asPrincipal = await seedUser(t, "principal", "seed-prin@mail.com");
    await asPrincipal.mutation(api.seed.run, {});
    // Second run is the real bootstrap shape (fires on every elevated load) —
    // must be a no-op, not a throw.
    await asPrincipal.mutation(api.seed.run, {});
  });
});
