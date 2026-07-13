// Galeri Konglo — typed public-data snapshot of Indonesian conglomerates.
// EVERY entity (group, person, company) carries a stable `id` so the planned
// Obsidian-style relation graph can reference them; buildEdges() derives the
// edge list from the same dataset (derivable → not stored twice).
// ponytail: static in-repo snapshot (dated, sourced). Move behind Convex only
// when paid access becomes real — a client bundle can't gate reads.

export interface KongloPerson {
  id: string; // "p-<slug>" — yes, staff/figures get ids too (graph nodes)
  name: string;
  role: string; // Indonesian label: Pendiri, Chairman, CEO…
}

export interface KongloCompany {
  id: string; // "c-<slug>"
  name: string;
  ticker?: string; // IDX ticker when listed
  sector?: string;
}

export interface KongloNetWorth {
  valueBUSD: number; // billions USD
  holder: string; // who the figure is attributed to
  source: string; // named list — Forbes / Bloomberg (legal: never unsourced)
  year: number;
}

export interface KongloSource {
  title: string;
  url: string;
}

export interface KongloGroup {
  id: string;
  name: string;
  founded?: number;
  hq?: string;
  summary: string;
  sectors: string[];
  people: KongloPerson[];
  companies: KongloCompany[];
  netWorth?: KongloNetWorth;
  notable?: string[];
  sources: KongloSource[]; // ≥2 — provenance is the legal posture
}

export interface KongloEdge {
  from: string;
  to: string;
  rel: string;
}

// Graph feed for the relation view: person —(role)→ group,
// company —(bagian dari)→ group. Derived, never hand-maintained.
export function buildEdges(groups: KongloGroup[]): KongloEdge[] {
  return groups.flatMap((g) => [
    ...g.people.map((p) => ({ from: p.id, to: g.id, rel: p.role })),
    ...g.companies.map((c) => ({ from: c.id, to: g.id, rel: "bagian dari" })),
  ]);
}

// --- Obsidian-style relation graph model -------------------------------------
export type GraphKind = "group" | "person" | "company";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphKind;
  groupId: string; // routes a node click → its group dashboard; also tints it
  weight: number; // node radius basis
}

export interface GraphLink {
  source: string;
  target: string;
  kind: "sektor" | "anggota"; // sector-overlap backbone vs group→member
}

// Build the viz graph. Groups are always nodes + linked to each other when they
// share a sector (the backbone that makes this a network, not 15 loose stars).
// People/companies join as satellites per the toggles; their group-membership
// links reuse buildEdges (single source for that topology).
export function buildGraph(
  groups: KongloGroup[],
  opts: { people: boolean; companies: boolean },
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const present = new Set<string>();
  for (const g of groups) {
    nodes.push({ id: g.id, label: g.name, kind: "group", groupId: g.id, weight: 7 + g.companies.length });
    present.add(g.id);
  }
  if (opts.people)
    for (const g of groups)
      for (const p of g.people) {
        nodes.push({ id: p.id, label: p.name, kind: "person", groupId: g.id, weight: 3.5 });
        present.add(p.id);
      }
  if (opts.companies)
    for (const g of groups)
      for (const c of g.companies) {
        nodes.push({ id: c.id, label: c.name, kind: "company", groupId: g.id, weight: 3.5 });
        present.add(c.id);
      }

  const links: GraphLink[] = [];
  // Sector backbone: link any two groups sharing ≥1 sector.
  for (let i = 0; i < groups.length; i++)
    for (let j = i + 1; j < groups.length; j++)
      if (groups[i].sectors.some((s) => groups[j].sectors.includes(s)))
        links.push({ source: groups[i].id, target: groups[j].id, kind: "sektor" });
  // Satellites (from → group), kept only when both endpoints are shown.
  for (const e of buildEdges(groups))
    if (present.has(e.from) && present.has(e.to))
      links.push({ source: e.from, target: e.to, kind: "anggota" });

  return { nodes, links };
}
