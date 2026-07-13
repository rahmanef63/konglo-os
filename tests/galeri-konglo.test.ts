import { describe, it, expect } from "vitest";
import { KONGLO_GROUPS } from "../frontend/slices/galeri-konglo/data";
import { buildEdges, buildGraph } from "../frontend/slices/galeri-konglo/types";
import { DEFAULT_CONFIG, settle, type SimNode } from "../frontend/slices/galeri-konglo/graph-sim";

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

describe("galeri-konglo relation graph", () => {
  it("buildGraph: groups-only has a connected sector backbone, every link resolves", () => {
    const { nodes, links } = buildGraph(KONGLO_GROUPS, { people: false, companies: false });
    expect(nodes.length).toBe(KONGLO_GROUPS.length);
    expect(nodes.every((n) => n.kind === "group")).toBe(true);
    const ids = new Set(nodes.map((n) => n.id));
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l.kind).toBe("sektor");
      expect(ids.has(l.source) && ids.has(l.target)).toBe(true);
    }
  });

  it("buildGraph: toggling satellites adds person/company nodes + membership links", () => {
    const full = buildGraph(KONGLO_GROUPS, { people: true, companies: true });
    const people = KONGLO_GROUPS.reduce((n, g) => n + g.people.length, 0);
    const companies = KONGLO_GROUPS.reduce((n, g) => n + g.companies.length, 0);
    expect(full.nodes.length).toBe(KONGLO_GROUPS.length + people + companies);
    const ids = new Set(full.nodes.map((n) => n.id));
    for (const l of full.links) expect(ids.has(l.source) && ids.has(l.target)).toBe(true);
    expect(full.links.some((l) => l.kind === "anggota")).toBe(true);
  });

  it("force sim settles to finite coordinates and shortens links", () => {
    const { nodes, links } = buildGraph(KONGLO_GROUPS, { people: false, companies: true });
    const sim: SimNode[] = nodes.map((n, i) => ({
      id: n.id,
      x: 500 + Math.cos(i) * 300,
      y: 350 + Math.sin(i) * 300,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    }));
    const byId = new Map(sim.map((n) => [n.id, n]));
    const energy = () =>
      links.reduce((sum, l) => {
        const a = byId.get(l.source)!;
        const b = byId.get(l.target)!;
        return sum + Math.hypot(a.x - b.x, a.y - b.y);
      }, 0);
    const before = energy();
    settle(sim, links, DEFAULT_CONFIG, 300);
    for (const n of sim) {
      expect(Number.isFinite(n.x), `${n.id}.x finite`).toBe(true);
      expect(Number.isFinite(n.y), `${n.id}.y finite`).toBe(true);
    }
    // A settled layout pulls linked nodes closer than a random ring start.
    expect(energy()).toBeLessThan(before);
  });
});
