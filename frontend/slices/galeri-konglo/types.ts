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

// Graph feed for the future relation view: person —(role)→ group,
// company —(bagian dari)→ group. Derived, never hand-maintained.
export function buildEdges(groups: KongloGroup[]): KongloEdge[] {
  return groups.flatMap((g) => [
    ...g.people.map((p) => ({ from: p.id, to: g.id, rel: p.role })),
    ...g.companies.map((c) => ({ from: c.id, to: g.id, rel: "bagian dari" })),
  ]);
}
