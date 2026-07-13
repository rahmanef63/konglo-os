import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Shared convex-test harness — the module glob + role-seeded identity helper
// that every tests/convex/* file previously copy-pasted ("mirrors
// authz.test.ts harness"). One SSOT; per-file variants import from here.
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
export const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);

export const makeT = () => convexTest(schema, modules);

// Insert a user (+ optional role row) and return an identity-bound accessor.
export async function seedUser(
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
