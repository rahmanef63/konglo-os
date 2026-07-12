import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import type { Role } from "../../lib/roles";

// Scoped type for Vite's import.meta.glob (vite/client types aren't in tsconfig).
// Kept local so it never leaks into the app's global ImportMeta surface.
interface GlobImportMeta extends ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}

// convex-test resolves the function-module root from these paths, so the glob
// MUST reach into convex/_generated (it splits a matched path on "_generated").
// Globbing the whole convex tree from this test file (tests/convex → ../../convex)
// auto-includes _generated + every feature module — no hand-maintained list.
const modules = (import.meta as GlobImportMeta).glob(
  "../../convex/**/!(*.d).{js,ts}",
);

// @convex-dev/auth's getAuthUserId returns identity.subject.split("|")[0]. So an
// identity whose subject is `<userId>|<session>` authenticates AS that user row.
// We insert a real users doc, attach a roles row, and impersonate via subject.
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
  // withIdentity sets ctx.auth.getUserIdentity().subject verbatim.
  return t.withIdentity({ subject: `${userId}|testsession` });
}

function makeT() {
  return convexTest(schema, modules);
}

// --- READ gate: gated query throws for staf, passes for principal, follows the
// canAccess feature-map for cfo. -----------------------------------------------
describe("requireFeature — READ gate (gated queries)", () => {
  it("family.listHeirs (keluarga-warisan): principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "p@mail.com");
    await expect(
      asPrincipal.query(api.features.family.queries.listHeirs, {}),
    ).resolves.toBeDefined();
  });

  it("family.listHeirs (keluarga-warisan): staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "s@mail.com");
    await expect(
      asStaf.query(api.features.family.queries.listHeirs, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("family.listHeirs (keluarga-warisan): cfo is Forbidden (not in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "c@mail.com");
    await expect(
      asCfo.query(api.features.family.queries.listHeirs, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("contacts.list (relasi-jaringan): staf Forbidden, cfo Forbidden, principal passes", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "s2@mail.com");
    const asCfo = await seedUser(t, "cfo", "c2@mail.com");
    const asPrincipal = await seedUser(t, "principal", "p2@mail.com");
    await expect(
      asStaf.query(api.features.contacts.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      asCfo.query(api.features.contacts.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      asPrincipal.query(api.features.contacts.queries.list, {}),
    ).resolves.toBeDefined();
  });

  it("subsidiaries.list (portofolio-bisnis): cfo PASSES (in cfo menu), staf Forbidden", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "c3@mail.com");
    const asStaf = await seedUser(t, "staf", "s3@mail.com");
    await expect(
      asCfo.query(api.features.subsidiaries.queries.list, {}),
    ).resolves.toBeDefined();
    await expect(
      asStaf.query(api.features.subsidiaries.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("gated query is Unauthorized when signed out", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.subsidiaries.queries.list, {}),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("authed user with NO role row is Forbidden (no role)", async () => {
    const t = makeT();
    const asNoRole = await seedUser(t, null, "norole@mail.com");
    await expect(
      asNoRole.query(api.features.subsidiaries.queries.list, {}),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- WRITE gate: gated mutation throws for staf, passes for principal, follows
// the feature-map for cfo. -----------------------------------------------------
describe("requireFeatureWrite — WRITE gate (gated mutations)", () => {
  const sub = {
    name: "Acme",
    sector: "Tech",
    revenue: 1000,
    margin: 10,
    ownership: 50,
    trend: 5,
    color: "var(--color-mk-blue)",
  };

  it("subsidiaries.create (portofolio-bisnis): principal passes", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "wp@mail.com");
    await expect(
      asPrincipal.mutation(api.features.subsidiaries.mutations.create, sub),
    ).resolves.toBeDefined();
  });

  it("subsidiaries.create (portofolio-bisnis): cfo PASSES (in cfo menu)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "wc@mail.com");
    await expect(
      asCfo.mutation(api.features.subsidiaries.mutations.create, sub),
    ).resolves.toBeDefined();
  });

  it("subsidiaries.create (portofolio-bisnis): staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "ws@mail.com");
    await expect(
      asStaf.mutation(api.features.subsidiaries.mutations.create, sub),
    ).rejects.toThrow(/Forbidden/);
  });

  it("contacts.create (relasi-jaringan): principal passes, cfo Forbidden, staf Forbidden", async () => {
    const t = makeT();
    const contact = {
      name: "VIP",
      role: "Investor",
      tier: "Investor",
      warmth: "Hangat",
      last: "kemarin",
    };
    const asPrincipal = await seedUser(t, "principal", "wcp@mail.com");
    const asCfo = await seedUser(t, "cfo", "wcc@mail.com");
    const asStaf = await seedUser(t, "staf", "wcs@mail.com");
    await expect(
      asPrincipal.mutation(api.features.contacts.mutations.create, contact),
    ).resolves.toBeDefined();
    // cfo lacks relasi-jaringan → blocked at the READ gate inside the WRITE gate.
    await expect(
      asCfo.mutation(api.features.contacts.mutations.create, contact),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      asStaf.mutation(api.features.contacts.mutations.create, contact),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- notiondb (data-studio): allow-list enforcement + cfo reachability. -------
describe("notiondb — data-studio feature gate + table allow-list", () => {
  it("rows: cfo CAN read (cfo holds data-studio)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "ndc@mail.com");
    await expect(
      asCfo.query(api.features.notiondb.queries.rows, { table: "subsidiaries" }),
    ).resolves.toBeDefined();
  });

  it("tables: staf is Forbidden (no data-studio)", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "nds@mail.com");
    await expect(
      asStaf.query(api.features.notiondb.queries.tables, {}),
    ).rejects.toThrow(/Forbidden/);
  });

  it("rows: rejects a table NOT in the allow-list (cfo, valid feature)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "ndc2@mail.com");
    await expect(
      asCfo.query(api.features.notiondb.queries.rows, { table: "users" }),
    ).rejects.toThrow(/Unknown table/);
  });

  it("createRow: cfo CAN write an allow-listed table (data-studio is elevated)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "ndw@mail.com");
    // createRow does not return the new id (void handler) → resolves to null over
    // the wire. The assertion that matters: it RESOLVES (write allowed), not throws.
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: {
          name: "Studio Co",
          sector: "Media",
          revenue: 1,
          margin: 1,
          ownership: 1,
          trend: 1,
        },
      }),
    ).resolves.toBeNull();
  });

  it("createRow: staf is Forbidden", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "ndws@mail.com");
    await expect(
      asStaf.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: { name: "x", sector: "y", revenue: 1, margin: 1, ownership: 1, trend: 1 },
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("createRow: rejects a non-allow-listed table even for principal", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "ndwp@mail.com");
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
        table: "users",
        values: { email: "evil@mail.com" },
      }),
    ).rejects.toThrow(/Unknown table/);
  });
});

// --- SEC-001: data-studio sensitivity tier. cfo admins the BUSINESS tables via
// data-studio (owner's explicit request), but heirs (succession / ahli waris)
// is principal-ONLY — cfo's keluarga-warisan menu is hidden and the admin
// surface must not be a back door. ---------------------------------------------
describe("notiondb — SEC-001 heirs is principal-only, business tables stay cfo-admin", () => {
  const heir = {
    name: "Putra",
    role: "Penerus",
    share: "30%",
    readiness: 40,
    age: "24",
    next: "MBA",
    mandate: "Operasi",
  };
  const contact = {
    name: "VIP",
    role: "Investor",
    tier: "Investor",
    warmth: "Hangat",
    last: "kemarin",
  };

  it("rows: cfo CAN read subsidiaries (business, standard sensitivity)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-sub@mail.com");
    await expect(
      asCfo.query(api.features.notiondb.queries.rows, { table: "subsidiaries" }),
    ).resolves.toBeDefined();
  });

  it("rows: cfo CAN read contacts (business, standard sensitivity)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-con@mail.com");
    await expect(
      asCfo.query(api.features.notiondb.queries.rows, { table: "contacts" }),
    ).resolves.toBeDefined();
  });

  it("createRow: cfo CAN write subsidiaries (business, standard sensitivity)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-subw@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "subsidiaries",
        values: { name: "Biz", sector: "X", revenue: 1, margin: 1, ownership: 1, trend: 1 },
      }),
    ).resolves.toBeNull();
  });

  it("createRow: cfo CAN write contacts (business, standard sensitivity)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-conw@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "contacts",
        values: contact,
      }),
    ).resolves.toBeNull();
  });

  it("rows: cfo is Forbidden on heirs (principal-only succession data)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-heir@mail.com");
    await expect(
      asCfo.query(api.features.notiondb.queries.rows, { table: "heirs" }),
    ).rejects.toThrow(/Forbidden: principal only/);
  });

  it("createRow: cfo is Forbidden on heirs (principal-only)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-heirw@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.createRow, {
        table: "heirs",
        values: heir,
      }),
    ).rejects.toThrow(/Forbidden: principal only/);
  });

  it("updateRow: cfo is Forbidden on heirs (principal-only)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-heiru@mail.com");
    // Throws at the principal gate BEFORE the id is ever normalized.
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.updateRow, {
        table: "heirs",
        id: "nonexistent",
        field: "share",
        value: "99%",
      }),
    ).rejects.toThrow(/Forbidden: principal only/);
  });

  it("deleteRow: cfo is Forbidden on heirs (principal-only)", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-heird@mail.com");
    await expect(
      asCfo.mutation(api.features.notiondb.mutations.deleteRow, {
        table: "heirs",
        id: "nonexistent",
      }),
    ).rejects.toThrow(/Forbidden: principal only/);
  });

  it("rows + createRow: principal CAN read and write heirs", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-prin-heir@mail.com");
    await expect(
      asPrincipal.query(api.features.notiondb.queries.rows, { table: "heirs" }),
    ).resolves.toBeDefined();
    await expect(
      asPrincipal.mutation(api.features.notiondb.mutations.createRow, {
        table: "heirs",
        values: heir,
      }),
    ).resolves.toBeNull();
  });

  it("tables: cfo metadata EXCLUDES heirs (estate table existence + schema hidden), business tables shown", async () => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", "sec-cfo-tables@mail.com");
    const specs = await asCfo.query(api.features.notiondb.queries.tables, {});
    const names = specs.map((s) => s.table);
    expect(names).toContain("subsidiaries");
    expect(names).not.toContain("heirs");
  });

  it("tables: principal metadata INCLUDES heirs", async () => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", "sec-prin-tables@mail.com");
    const specs = await asPrincipal.query(api.features.notiondb.queries.tables, {});
    expect(specs.map((s) => s.table)).toContain("heirs");
  });

  it("staf is Forbidden on every notiondb table (no data-studio at all)", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "sec-staf@mail.com");
    await expect(
      asStaf.query(api.features.notiondb.queries.rows, { table: "subsidiaries" }),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      asStaf.query(api.features.notiondb.queries.rows, { table: "heirs" }),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      asStaf.mutation(api.features.notiondb.mutations.createRow, {
        table: "heirs",
        values: heir,
      }),
    ).rejects.toThrow(/Forbidden/);
  });
});

// --- READ gate parametrized: 6 list queries that call requireFeature/
// requirePrincipal but were previously untested. Each asserts a wrong-role
// caller is denied (Forbidden). cfo is the universal wrong-role here:
//   - listGovernance: family, requirePrincipal → cfo is not principal.
//   - listImpact: filantropi, requireFeature("filantropi") → cfo lacks it.
//   - listMetrics: security, requireFeature("keamanan-staf") → cfo lacks it
//     (staf HOLDS keamanan-staf, so cfo — not staf — is the wrong role here).
//   - listReservations/listRequests: lifestyle, requireFeature(
//     "hiburan-gaya-hidup") → cfo lacks it.
//   - listPrograms: kesehatan, requireFeature("kesehatan") → cfo lacks it.
describe("requireFeature — READ gate parametrized (untested list queries)", () => {
  const cases: {
    name: string;
    run: (as: Awaited<ReturnType<typeof seedUser>>) => Promise<unknown>;
  }[] = [
    {
      name: "family.listGovernance (principal-only) denies cfo",
      run: (as) => as.query(api.features.family.queries.listGovernance, {}),
    },
    {
      name: "filantropi.listImpact (filantropi) denies cfo",
      run: (as) => as.query(api.features.filantropi.queries.listImpact, {}),
    },
    {
      name: "security.listMetrics (keamanan-staf) denies cfo",
      run: (as) => as.query(api.features.security.queries.listMetrics, {}),
    },
    {
      name: "lifestyle.listReservations (hiburan-gaya-hidup) denies cfo",
      run: (as) => as.query(api.features.lifestyle.queries.listReservations, {}),
    },
    {
      name: "lifestyle.listRequests (hiburan-gaya-hidup) denies cfo",
      run: (as) => as.query(api.features.lifestyle.queries.listRequests, {}),
    },
    {
      name: "kesehatan.listPrograms (kesehatan) denies cfo",
      run: (as) => as.query(api.features.kesehatan.queries.listPrograms, {}),
    },
  ];

  it.each(cases)("$name", async ({ name, run }) => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", `rf-${name.replace(/\W+/g, "-")}@mail.com`);
    await expect(run(asCfo)).rejects.toThrow(/Forbidden/);
  });

  // staf likewise denied on the non-security queries (staf only holds beranda +
  // keamanan-staf); listMetrics is the one staf CAN read, so it's excluded here.
  it.each(cases.filter((c) => !c.name.includes("listMetrics")))(
    "$name — also denies staf",
    async ({ name, run }) => {
      const t = makeT();
      const asStaf = await seedUser(t, "staf", `rfs-${name.replace(/\W+/g, "-")}@mail.com`);
      await expect(run(asStaf)).rejects.toThrow(/Forbidden/);
    },
  );

  // principal passes every one (sanity: the gate denies the wrong role, not all).
  it.each(cases)("$name — principal passes", async ({ run }) => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", `rfp-${Math.random()}@mail.com`);
    await expect(run(asPrincipal)).resolves.toBeDefined();
  });
});

// --- office (kekayaan-kas) READ gate: net-worth figures + allocations are
// principal/cfo-only. P12-B: these were requireUser-only, so a staf (or any
// wrong-role) caller could read the owner's net worth via the direct API even
// though the menu hides it. They now call requireFeature("kekayaan-kas") —
// principal=all, cfo holds it, staf does NOT. ---------------------------------
describe("requireFeature — office.getFigures/listAllocations (kekayaan-kas)", () => {
  // [query name, expected resolved value when allowed (nothing seeded)]
  const queries: {
    name: string;
    run: (as: Awaited<ReturnType<typeof seedUser>>) => Promise<unknown>;
    allowedResolvesTo: unknown;
  }[] = [
    {
      name: "office.getFigures",
      run: (as) => as.query(api.features.office.queries.getFigures, {}),
      allowedResolvesTo: null, // no figures seeded → null
    },
    {
      name: "office.listAllocations",
      run: (as) => as.query(api.features.office.queries.listAllocations, {}),
      allowedResolvesTo: [], // no allocations seeded → empty array
    },
  ];

  // The core fix: a staf caller is DENIED both reads (net-worth leak closed).
  it.each(queries)("$name: staf is Forbidden (net-worth leak)", async ({ name, run }) => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", `ofs-${name}@mail.com`);
    await expect(run(asStaf)).rejects.toThrow(/Forbidden/);
  });

  // Legitimate reads must keep working: principal (all) + cfo (holds kekayaan-kas).
  it.each(queries)("$name: principal is allowed", async ({ name, run, allowedResolvesTo }) => {
    const t = makeT();
    const asPrincipal = await seedUser(t, "principal", `ofp-${name}@mail.com`);
    await expect(run(asPrincipal)).resolves.toStrictEqual(allowedResolvesTo);
  });

  it.each(queries)("$name: cfo is allowed (kekayaan-kas in cfo menu)", async ({ name, run, allowedResolvesTo }) => {
    const t = makeT();
    const asCfo = await seedUser(t, "cfo", `ofc-${name}@mail.com`);
    await expect(run(asCfo)).resolves.toStrictEqual(allowedResolvesTo);
  });

  it("signed out is Unauthorized (no identity → requireUser throws first)", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.office.queries.getFigures, {}),
    ).rejects.toThrow(/Unauthorized/);
    await expect(
      t.query(api.features.office.queries.listAllocations, {}),
    ).rejects.toThrow(/Unauthorized/);
  });
});

// --- requireUser-only fns stay open to every role (own-role lookup). ----------
describe("requireUser-only fns (own-role) — open to staf", () => {
  it("rbac.myRole: staf can read its own role (needed to build the menu)", async () => {
    const t = makeT();
    const asStaf = await seedUser(t, "staf", "mr@mail.com");
    await expect(
      asStaf.query(api.features.rbac.queries.myRole, {}),
    ).resolves.toBe("staf");
  });

  it("rbac.myRole: signed out returns null (no throw — client redirects)", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.rbac.queries.myRole, {}),
    ).resolves.toBeNull();
  });
});

// --- claimRole never self-grants principal. -----------------------------------
describe("rbac.claimRole — privilege-escalation guard", () => {
  it("a brand-new non-allowlisted user gets NO role (never principal, never auto-staf)", async () => {
    const t = makeT();
    const asNew = await seedUser(t, null, "claim1@mail.com");
    // Private app + open Google OAuth: a login not on the allowlist self-grants
    // NOTHING — no principal (escalation guard) AND no blanket staf (data-leak
    // guard). Access is granted only by the allowlist or the principal (setRole).
    await expect(
      asNew.mutation(api.features.rbac.mutations.claimRole, {}),
    ).resolves.toBeNull();
  });

  it("returns the EXISTING role (never principal) when a roles row already exists", async () => {
    const t = makeT();
    // Seed a user that already has a staf role, then call claimRole.
    const asStaf = await seedUser(t, "staf", "claim2@mail.com");
    await expect(
      asStaf.mutation(api.features.rbac.mutations.claimRole, {}),
    ).resolves.toBe("staf");
  });
});

// --- rbac.setRole — privilege-escalation invariants. setRole is principal-ONLY
// (requireAdmin would admit cfo → self-elevate to principal → read SEC-001 heirs
// data). Three guards: principal-only gate; no self-target (lock-out); and
// 'principal' is never granted via the public mutation (seed-only). ------------
describe("rbac.setRole — privilege-escalation invariants", () => {
  // Like seedUser but ALSO returns the seeded userId, so we can target self vs.
  // another user. Kept local to avoid changing the shared seedUser signature.
  async function seedUserWithId(
    t: ReturnType<typeof convexTest>,
    role: Role | null,
    email: string,
  ) {
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { email });
      if (role) await ctx.db.insert("roles", { userId: id, role });
      return id;
    });
    return { as: t.withIdentity({ subject: `${userId}|testsession` }), userId };
  }

  it("cfo calling setRole({self, 'principal'}) is Forbidden", async () => {
    const t = makeT();
    const { as: asCfo, userId: cfoId } = await seedUserWithId(
      t,
      "cfo",
      "sr-cfo-self@mail.com",
    );
    await expect(
      asCfo.mutation(api.features.rbac.mutations.setRole, {
        userId: cfoId,
        role: "principal",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo calling setRole({otherUser, 'principal'}) is Forbidden", async () => {
    const t = makeT();
    const { as: asCfo } = await seedUserWithId(t, "cfo", "sr-cfo-other@mail.com");
    const { userId: targetId } = await seedUserWithId(
      t,
      "staf",
      "sr-target-1@mail.com",
    );
    await expect(
      asCfo.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "principal",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("cfo calling setRole({otherUser, 'cfo'}) is Forbidden (not a principal)", async () => {
    const t = makeT();
    const { as: asCfo } = await seedUserWithId(t, "cfo", "sr-cfo-tier@mail.com");
    const { userId: targetId } = await seedUserWithId(
      t,
      "staf",
      "sr-target-2@mail.com",
    );
    await expect(
      asCfo.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "cfo",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("principal calling setRole({otherUser, 'cfo'}) SUCCEEDS and persists the role", async () => {
    const t = makeT();
    const { as: asPrincipal } = await seedUserWithId(
      t,
      "principal",
      "sr-prin-ok@mail.com",
    );
    const { userId: targetId } = await seedUserWithId(
      t,
      "staf",
      "sr-target-3@mail.com",
    );
    // setRole is a void handler → resolves to null over the convex-test wire
    // (same convention as the notiondb.createRow tests above).
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "cfo",
      }),
    ).resolves.toBeNull();
    // Verify the row was actually patched to cfo.
    const persisted = await t.run(async (ctx) => {
      const row = await ctx.db
        .query("roles")
        .withIndex("by_user", (q) => q.eq("userId", targetId))
        .first();
      return row?.role ?? null;
    });
    expect(persisted).toBe("cfo");
  });

  it("principal calling setRole({otherUser, 'cfo'}) SUCCEEDS when the target has NO existing role row", async () => {
    const t = makeT();
    const { as: asPrincipal } = await seedUserWithId(
      t,
      "principal",
      "sr-prin-insert@mail.com",
    );
    // Target has no roles row at all (role = null) → setRole must insert.
    const { userId: targetId } = await seedUserWithId(
      t,
      null,
      "sr-target-norole@mail.com",
    );
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "cfo",
      }),
    ).resolves.toBeNull();
    const persisted = await t.run(async (ctx) => {
      const row = await ctx.db
        .query("roles")
        .withIndex("by_user", (q) => q.eq("userId", targetId))
        .first();
      return row?.role ?? null;
    });
    expect(persisted).toBe("cfo");
  });

  it("principal calling setRole({self, 'cfo'}) is Forbidden (self-target lock-out guard)", async () => {
    const t = makeT();
    const { as: asPrincipal, userId: prinId } = await seedUserWithId(
      t,
      "principal",
      "sr-prin-self@mail.com",
    );
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: prinId,
        role: "cfo",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("principal calling setRole({otherPrincipal, 'cfo'}) is Forbidden (co-principal never demotable — mirrors revokeRole)", async () => {
    const t = makeT();
    const { as: asPrincipal } = await seedUserWithId(t, "principal", "sr-prin-a@mail.com");
    const { userId: coPrincipalId } = await seedUserWithId(t, "principal", "sr-prin-b@mail.com");
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: coPrincipalId,
        role: "cfo",
      }),
    ).rejects.toThrow(/Forbidden/);
    // The co-principal's role must be untouched (no silent down-tier).
    const persisted = await t.run(async (ctx) => {
      const row = await ctx.db
        .query("roles")
        .withIndex("by_user", (q) => q.eq("userId", coPrincipalId))
        .first();
      return row?.role ?? null;
    });
    expect(persisted).toBe("principal");
  });

  it("principal calling setRole({otherUser, 'principal'}) is Forbidden (principal is seed-only)", async () => {
    const t = makeT();
    const { as: asPrincipal } = await seedUserWithId(
      t,
      "principal",
      "sr-prin-grant@mail.com",
    );
    const { userId: targetId } = await seedUserWithId(
      t,
      "staf",
      "sr-target-4@mail.com",
    );
    await expect(
      asPrincipal.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "principal",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("staf calling setRole is Forbidden (not a principal)", async () => {
    const t = makeT();
    const { as: asStaf } = await seedUserWithId(t, "staf", "sr-staf@mail.com");
    const { userId: targetId } = await seedUserWithId(
      t,
      "staf",
      "sr-target-5@mail.com",
    );
    await expect(
      asStaf.mutation(api.features.rbac.mutations.setRole, {
        userId: targetId,
        role: "cfo",
      }),
    ).rejects.toThrow(/Forbidden/);
  });
});
