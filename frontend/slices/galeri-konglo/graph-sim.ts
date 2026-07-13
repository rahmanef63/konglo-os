// Minimal force-directed layout — d3-force-lite, no dependency. Sized for the
// ~156-node Galeri Konglo graph (15 groups + people + companies). O(n²)
// repulsion per tick is fine at this scale; the caller cools `alpha` to a floor
// and stops, so idle cost is zero (a settled graph is a static SVG).
// ponytail: hand-rolled over d3-force/react-force-graph — the whole sim is this
// file; a graph dep would drag in three.js for a 156-node layout.

export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Pinned position while the user drags; null = free.
  fx: number | null;
  fy: number | null;
}

export interface SimLink {
  source: string;
  target: string;
}

export interface SimConfig {
  width: number;
  height: number;
  repulsion: number;
  linkDist: number;
  linkStrength: number;
  gravity: number;
  damping: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  width: 1000,
  height: 700,
  repulsion: 2600,
  linkDist: 92,
  linkStrength: 0.05,
  gravity: 0.028,
  damping: 0.82,
};

// One physics step, mutating nodes in place. `alpha` (1→0) scales every force so
// the layout cools; caller decays it and stops when tiny.
export function tick(
  nodes: SimNode[],
  links: SimLink[],
  cfg: SimConfig,
  alpha: number,
): void {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const cx = cfg.width / 2;
  const cy = cfg.height / 2;

  // Repulsion — every pair pushes apart ~ 1/d².
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 0.01) {
        // Coincident nodes — nudge deterministically so they separate.
        dx = (i - j) * 0.1 + 0.1;
        dy = 0.13;
        d2 = dx * dx + dy * dy;
      }
      const d = Math.sqrt(d2);
      const f = ((cfg.repulsion / d2) * alpha) / d;
      const fx = dx * f;
      const fy = dy * f;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  // Link springs — edges pull toward rest length.
  for (const l of links) {
    const a = byId.get(l.source);
    const b = byId.get(l.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const f = ((d - cfg.linkDist) * cfg.linkStrength * alpha) / d;
    const fx = dx * f;
    const fy = dy * f;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Gravity toward center + integrate + damp.
  for (const n of nodes) {
    if (n.fx != null && n.fy != null) {
      n.x = n.fx;
      n.y = n.fy;
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx += (cx - n.x) * cfg.gravity * alpha;
    n.vy += (cy - n.y) * cfg.gravity * alpha;
    n.vx *= cfg.damping;
    n.vy *= cfg.damping;
    n.x += n.vx;
    n.y += n.vy;
  }
}

// Run the layout to rest headlessly (no render) — used for tests / a warm start.
export function settle(
  nodes: SimNode[],
  links: SimLink[],
  cfg: SimConfig = DEFAULT_CONFIG,
  iters = 250,
): void {
  let alpha = 1;
  for (let i = 0; i < iters; i++) {
    tick(nodes, links, cfg, alpha);
    alpha = Math.max(0.02, alpha * 0.985);
  }
}
