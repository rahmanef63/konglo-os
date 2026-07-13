import { describe, it, expect } from "vitest";
import { KONGLO_GROUPS } from "../frontend/slices/galeri-konglo/data";
import { buildEdges } from "../frontend/slices/galeri-konglo/types";

// Dataset integrity = the legal posture, enforced. Every group must be
// sourced (≥2 URLs); net worth must carry a named source + year; every graph
// node id unique; every edge resolves. Fails CI if a re-research run drops
// provenance or duplicates ids.
describe("galeri-konglo dataset", () => {
  it("has the researched groups", () => {
    expect(KONGLO_GROUPS.length).toBeGreaterThanOrEqual(10);
  });

  it("every group is sourced and dated where it claims figures", () => {
    for (const g of KONGLO_GROUPS) {
      expect(g.sources.length, `${g.id} sources`).toBeGreaterThanOrEqual(2);
      for (const s of g.sources) expect(s.url, `${g.id} source url`).toMatch(/^https?:\/\//);
      if (g.netWorth) {
        expect(g.netWorth.source, `${g.id} netWorth source`).toBeTruthy();
        expect(g.netWorth.year, `${g.id} netWorth year`).toBeGreaterThan(2015);
      }
      expect(g.summary.length, `${g.id} summary`).toBeGreaterThan(20);
      expect(g.sectors.length, `${g.id} sectors`).toBeGreaterThan(0);
      expect(g.people.length, `${g.id} people`).toBeGreaterThan(0);
      expect(g.companies.length, `${g.id} companies`).toBeGreaterThan(0);
    }
  });

  it("every entity id is unique and every edge resolves", () => {
    const ids = KONGLO_GROUPS.flatMap((g) => [
      g.id,
      ...g.people.map((p) => p.id),
      ...g.companies.map((c) => c.id),
    ]);
    expect(new Set(ids).size, "duplicate ids").toBe(ids.length);
    const idSet = new Set(ids);
    for (const e of buildEdges(KONGLO_GROUPS)) {
      expect(idSet.has(e.from), `edge from ${e.from}`).toBe(true);
      expect(idSet.has(e.to), `edge to ${e.to}`).toBe(true);
    }
  });
});
