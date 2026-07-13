import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Id } from "../../convex/_generated/dataModel";
import { registerRateLimiter } from "./rate-limiter-harness";
import { modules, seedUser } from "./_harness";

// notiondb create/update/deleteRow now consume a per-user write token, so the
// rate-limiter component must be registered or the limiter throws (prod has a
// fail-safe that lets the write through but spews stderr). Register it here.
async function makeT() {
  const t = convexTest(schema, modules);
  await registerRateLimiter(t);
  return t;
}

// createRow is a void handler (no returned id), so to assert on the inserted
// row we read it back from the db by `name` (the seeded rows below use unique
// names per test). Returns the row's id + version for the assertions.
async function readRow(
  t: ReturnType<typeof convexTest>,
  table: "subsidiaries",
  name: string,
): Promise<{ id: Id<"subsidiaries">; version: number | undefined }> {
  return t.run(async (ctx) => {
    const rows = await ctx.db.query(table).take(50);
    const row = rows.find((r) => (r as { name?: string }).name === name);
    if (!row) throw new Error(`row not found: ${name}`);
    return { id: row._id, version: (row as { version?: number }).version };
  });
}

async function versionOf(
  t: ReturnType<typeof convexTest>,
  id: Id<"subsidiaries">,
): Promise<number | undefined> {
  return t.run(async (ctx) => {
    const doc = await ctx.db.get(id);
    return (doc as { version?: number } | null)?.version;
  });
}

async function existsRow(
  t: ReturnType<typeof convexTest>,
  id: Id<"subsidiaries">,
): Promise<boolean> {
  return t.run(async (ctx) => (await ctx.db.get(id)) !== null);
}

// Base subsidiaries payload (a `standard`-sensitivity business table — any
// data-studio holder can CRUD; using principal keeps the gate noise out of the
// version assertions). Each test overrides `name` for a unique read-back.
const base = {
  sector: "Energi",
  revenue: 1_000_000,
  margin: 20,
  ownership: 80,
  trend: 5,
};

// --- createRow: version seeding + injection whitelist ------------------------
describe("notiondb.createRow — version seeding + value whitelist", () => {
  it("seeds version 1 on a fresh row", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-create-seed@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Seed Co" },
    });
    const { version } = await readRow(t, "subsidiaries", "Seed Co");
    expect(version).toBe(1);
  });

  it("IGNORES an injected `version` in values (poison-token guard)", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-create-inject@mail.com");
    // A caller tries to seed version 999 to poison the optimistic token. The
    // insert doc is built from the registry column whitelist, so `version`
    // (not an editable column) is dropped — the row still gets version 1.
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Inject Co", version: 999 },
    });
    const { version } = await readRow(t, "subsidiaries", "Inject Co");
    expect(version).toBe(1);
    expect(version).not.toBe(999);
  });

  it("IGNORES an injected non-column schema field (whitelist, not spread)", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-create-extra@mail.com");
    // `order` is a real schema field but auto-assigned, never caller-supplied.
    // The whitelist drops it; the handler's nextOrder() owns `order` instead.
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Extra Co", order: 4242 },
    });
    const row = await t.run(async (ctx) => {
      const rows = await ctx.db.query("subsidiaries").take(50);
      return rows.find((r) => r.name === "Extra Co") ?? null;
    });
    expect(row?.order).not.toBe(4242);
    expect(row?.version).toBe(1);
  });
});

// --- updateRow: optimistic version lock --------------------------------------
describe("notiondb.updateRow — optimistic version lock", () => {
  it("STALE expectedVersion is rejected with /conflict/ (row untouched)", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-update-stale@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Update Stale" },
    });
    const { id } = await readRow(t, "subsidiaries", "Update Stale"); // v1
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.updateRow, {
        table: "subsidiaries",
        id,
        field: "revenue",
        value: 2_000_000,
        expectedVersion: 0, // stale: row is at v1
      }),
    ).rejects.toThrow(/conflict/);
    // rejected write must not have mutated the row (version stays 1)
    expect(await versionOf(t, id)).toBe(1);
  });

  it("MATCHING expectedVersion succeeds and bumps version", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-update-match@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Update Match" },
    });
    const { id } = await readRow(t, "subsidiaries", "Update Match"); // v1
    await asPrincipal.mutation(api.features.notiondb.mutations.updateRow, {
      table: "subsidiaries",
      id,
      field: "revenue",
      value: 2_000_000,
      expectedVersion: 1,
    });
    expect(await versionOf(t, id)).toBe(2);
    const persisted = await t.run(async (ctx) => {
      const doc = await ctx.db.get(id);
      return (doc as { revenue?: number } | null)?.revenue;
    });
    expect(persisted).toBe(2_000_000);
  });

  it("OMITTED expectedVersion still succeeds and increments", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-update-omit@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Update Omit" },
    });
    const { id } = await readRow(t, "subsidiaries", "Update Omit"); // v1
    await asPrincipal.mutation(api.features.notiondb.mutations.updateRow, {
      table: "subsidiaries",
      id,
      field: "margin",
      value: 33,
    });
    expect(await versionOf(t, id)).toBe(2);
  });
});

// --- deleteRow: optimistic version lock --------------------------------------
describe("notiondb.deleteRow — optimistic version lock", () => {
  it("STALE expectedVersion is rejected with /conflict/ (row survives)", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-delete-stale@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Delete Stale" },
    });
    const { id } = await readRow(t, "subsidiaries", "Delete Stale"); // v1
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.deleteRow, {
        table: "subsidiaries",
        id,
        expectedVersion: 0, // stale: row is at v1
      }),
    ).rejects.toThrow(/conflict/);
    // rejected delete must not have removed the row
    expect(await existsRow(t, id)).toBe(true);
  });

  it("MATCHING expectedVersion deletes the row", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-delete-match@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Delete Match" },
    });
    const { id } = await readRow(t, "subsidiaries", "Delete Match"); // v1
    await asPrincipal.mutation(api.features.notiondb.mutations.deleteRow, {
      table: "subsidiaries",
      id,
      expectedVersion: 1,
    });
    expect(await existsRow(t, id)).toBe(false);
  });

  it("OMITTED expectedVersion deletes (no check)", async () => {
    const t = await makeT();
    const asPrincipal = await seedUser(t, "principal", "nv-delete-omit@mail.com");
    await asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
      table: "subsidiaries",
      values: { ...base, name: "Delete Omit" },
    });
    const { id } = await readRow(t, "subsidiaries", "Delete Omit"); // v1
    await asPrincipal.mutation(api.features.notiondb.mutations.deleteRow, {
      table: "subsidiaries",
      id,
    });
    expect(await existsRow(t, id)).toBe(false);
  });
});
